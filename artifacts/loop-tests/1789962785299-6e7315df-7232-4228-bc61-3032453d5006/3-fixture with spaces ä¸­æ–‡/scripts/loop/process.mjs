import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { setTimeout, clearTimeout } from 'node:timers';

export function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('Runner cancelled')); return; }
    const finish = () => { signal?.removeEventListener('abort', cancel); resolve(); };
    const timer = setTimeout(finish, milliseconds);
    const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(new Error('Runner cancelled')); };
    signal?.addEventListener('abort', cancel, { once: true });
  });
}
async function treeKill(child, stdoutFd, stderrFd) {
  if (!child.pid) return true; // spawn failed: no process was created
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      // Never use a shell, npm shim, or pipe, including for cleanup.
      const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        shell: false, windowsHide: true, stdio: ['ignore', stdoutFd, stderrFd],
      });
      let settled = false;
      const finish = (ok) => { if (settled) return; settled = true; clearTimeout(timer); resolve(ok); };
      const timer = setTimeout(() => { killer.kill(); killer.unref(); finish(false); }, 5000);
      killer.once('error', () => finish(false));
      killer.once('close', (code) => finish(code === 0));
    });
  }
  try { process.kill(-child.pid, 'SIGKILL'); return true; } catch (error) { return error.code === 'ESRCH'; }
}
function groupGone(pid) {
  if (!pid || process.platform === 'win32') return true;
  try { process.kill(-pid, 0); return false; } catch (error) { return error.code === 'ESRCH'; }
}
export async function execute(command, { cwd, stdoutPath, stderrPath, timeoutSeconds, signal, onSpawn }) {
  const stdoutFd = fs.openSync(stdoutPath, 'wx', 0o600);
  let stderrFd;
  let inputFd;
  let child;
  try {
    stderrFd = fs.openSync(stderrPath, 'wx', 0o600);
    if (command.inputFile) inputFd = fs.openSync(command.inputFile, 'r');
    if (signal?.aborted) return { code: null, error: 'Runner cancelled before launch', cancelled: true, cleanupCertain: true };
    child = spawn(command.executable, command.args, {
      cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32',
      stdio: [inputFd ?? (command.inheritStdin ? 'inherit' : 'ignore'), stdoutFd, stderrFd],
    });
    let closeResult;
    const closed = new Promise((resolve) => {
      child.once('error', (error) => { closeResult = { code: null, error: error.message }; resolve(closeResult); });
      child.once('close', (code, exitSignal) => { closeResult ??= { code, signal: exitSignal }; resolve(closeResult); });
    });
    let requestStop;
    const stop = new Promise((resolve) => { requestStop = resolve; });
    const cancel = () => requestStop('cancelled');
    signal?.addEventListener('abort', cancel, { once: true });
    let timer;
    let earlyError;
    try { if (child.pid) onSpawn?.(child.pid); } catch (error) { earlyError = error.message; requestStop('recording-failed'); }
    if (signal?.aborted) requestStop('cancelled');
    timer = setTimeout(() => requestStop('timeout'), timeoutSeconds * 1000);
    try {
      const first = await Promise.race([closed, stop]);
      if (typeof first !== 'string') return { ...first, cleanupCertain: true };
      let cleanupCertain = await treeKill(child, stdoutFd, stderrFd);
      let closeTimer;
      await Promise.race([closed, new Promise((resolve) => { closeTimer = setTimeout(resolve, 2000); })]);
      clearTimeout(closeTimer);
      if (!closeResult) { cleanupCertain = false; child.unref(); }
      if (process.platform !== 'win32' && cleanupCertain) {
        await delay(100);
        cleanupCertain = groupGone(child.pid);
      }
      return {
        ...(closeResult ?? { code: null }), cleanupCertain,
        timedOut: first === 'timeout', cancelled: first === 'cancelled',
        error: earlyError ?? (first === 'timeout' ? `Adapter exceeded timeout (${timeoutSeconds}s)` : 'Runner cancelled'),
      };
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
  } finally {
    if (inputFd !== undefined) fs.closeSync(inputFd);
    if (stderrFd !== undefined) fs.closeSync(stderrFd);
    fs.closeSync(stdoutFd);
  }
}
