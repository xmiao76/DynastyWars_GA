import { spawn } from 'node:child_process'
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearTimeout, setTimeout } from 'node:timers'

export function decodeOutput(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString('utf16le')
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le')
  if (bytes.length > 1 && bytes[1] === 0) return bytes.toString('utf16le')
  return bytes.toString('utf8').replace(/^\uFEFF/, '')
}

// File descriptors, never captured stdio pipes: sandboxed Windows disallows
// named pipes. Arguments are passed directly to the executable without a shell.
export async function runFileCommand(executable, args, {
  cwd, env = process.env, timeoutMs = 30_000, spawnImpl = spawn, tempRoot = os.tmpdir(),
} = {}) {
  const dir = mkdtempSync(path.join(tempRoot, 'dw-loop-schedule-command-'))
  const stdoutPath = path.join(dir, 'stdout'), stderrPath = path.join(dir, 'stderr')
  let out, err, timer
  try {
    out = openSync(stdoutPath, 'wx')
    err = openSync(stderrPath, 'wx')
    const result = await new Promise((resolve, reject) => {
      let timedOut = false
      const child = spawnImpl(executable, args, { cwd, env, shell: false, windowsHide: true, stdio: ['ignore', out, err] })
      timer = setTimeout(() => { timedOut = true; child.kill() }, timeoutMs)
      child.once('error', reject)
      child.once('close', (code, signal) => {
        if (timedOut) reject(new Error(`Scheduler helper timed out after ${timeoutMs}ms; inspect status before retrying`))
        else resolve({ code: code ?? 1, signal })
      })
    })
    closeSync(out); out = undefined
    closeSync(err); err = undefined
    return { ...result, stdout: decodeOutput(readFileSync(stdoutPath)), stderr: decodeOutput(readFileSync(stderrPath)) }
  } finally {
    clearTimeout(timer)
    if (out !== undefined) closeSync(out)
    if (err !== undefined) closeSync(err)
    rmSync(dir, { recursive: true, force: true })
  }
}

export function windowsTools(env = process.env) {
  const root = env.SystemRoot
  if (!root || !path.win32.isAbsolute(root) || /[\r\n\0]/.test(root)) throw new Error('Windows SystemRoot must identify an absolute Windows installation path')
  return {
    schtasks: path.win32.join(root, 'System32', 'schtasks.exe'),
    powershell: path.win32.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
  }
}

export async function currentUserSid(runCommand, tools) {
  // Fixed script: no repo paths, task names, or user text are interpolated.
  // Windows PowerShell 5 ships with Windows; no pwsh/PowerShell 7 dependency.
  const script = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); [Console]::Write([Security.Principal.WindowsIdentity]::GetCurrent().User.Value)"
  const result = await runCommand(tools.powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')])
  const sid = result.stdout.trim()
  if (result.code !== 0 || !/^S-1-(?:5-21-(?:\d+-){3}\d+|12-1-(?:\d+-){3}\d+)$/.test(sid)) {
    throw new Error('Could not resolve the current interactive user SID; service/SYSTEM accounts are not supported')
  }
  return sid
}
