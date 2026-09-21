import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildTaskXml, hasFutureOccurrence, HELP, makePlan, parseArgs, parseInstant, readOwnedTask, taskNameForRepo,
} from './core.mjs'
import { currentUserSid, runFileCommand, windowsTools } from './windows.mjs'

function readJson(file, label) {
  try {
    const value = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('not an object')
    return value
  } catch {
    throw new Error(`${label} is missing, unreadable, or not a JSON object: ${file}`)
  }
}

// Deliberately independent of executor imports. This version-1 shape mirrors
// the documented executor CLI contract; never execute the adapter to probe it.
function validateConfigShape(config) {
  const keys = ['version', 'adapter', 'model', 'mode', 'iterations', 'intervalSeconds', 'timeoutSeconds', 'adapters', 'delaySeconds', 'startAt']
  if (config.version !== 1) throw new Error('Loop config version must be 1')
  if (Object.keys(config).some(key => !keys.includes(key))) throw new Error('Unknown loop configuration field')
  const nonempty = (value, label) => {
    if (typeof value !== 'string' || !value.trim() || value.includes('\0')) throw new Error(`${label} must be a nonempty string without NUL`)
  }
  if (config.adapter !== undefined && config.adapter !== null && (typeof config.adapter !== 'string' || !/^[a-zA-Z][\w-]*$/.test(config.adapter))) throw new Error('Invalid adapter name')
  if (config.model !== undefined && config.model !== null) nonempty(config.model, 'model')
  if (config.mode !== undefined && (typeof config.mode !== 'string' || !['auto', 'consumer', 'producer'].includes(config.mode.toLowerCase()))) throw new Error('Config mode must be Auto, Consumer, or Producer')
  for (const [key, min, max, integer] of [['iterations', 1, 1000, true], ['intervalSeconds', 0, 86400, false], ['timeoutSeconds', 0.001, 86400, false], ['delaySeconds', 0, 86400, false]]) {
    const value = config[key]
    if (value !== undefined && (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))) throw new Error(`Config ${key} must be ${integer ? 'an integer' : 'a number'} from ${min} to ${max}`)
  }
  if (config.startAt !== undefined) {
    parseInstant(config.startAt, 'Config startAt')
    if (config.delaySeconds !== undefined) throw new Error('Choose config delaySeconds OR startAt')
  }
  const adapters = config.adapters === undefined ? {} : config.adapters
  if (typeof adapters !== 'object' || adapters === null || Array.isArray(adapters)) throw new Error('Config adapters must be an object')
  for (const [name, adapter] of Object.entries(adapters)) {
    if (!/^[a-zA-Z][\w-]*$/.test(name) || !adapter || typeof adapter !== 'object' || Array.isArray(adapter)) throw new Error('Invalid adapter definition')
    const allowed = name === 'codex' ? ['executable'] : ['executable', 'args', 'inheritStdin']
    if (Object.keys(adapter).some(key => !allowed.includes(key))) throw new Error(`Unknown field on adapter ${name}`)
    if (name === 'codex') {
      if (adapter.executable !== undefined) nonempty(adapter.executable, 'Codex executable')
      continue
    }
    nonempty(adapter.executable, 'Adapter executable')
    if (!Array.isArray(adapter.args) || !adapter.args.every(arg => typeof arg === 'string' && !arg.includes('\0'))) throw new Error('Selected adapter needs a string args array')
    if (!adapter.args.some(arg => arg.includes('{requestFile}')) || !adapter.args.some(arg => arg.includes('{resultFile}'))) throw new Error('Adapter args must include {requestFile} and {resultFile}')
    if (adapter.args.some(arg => /\{[^{}]*\}/.test(arg.replaceAll('{requestFile}', '').replaceAll('{resultFile}', '')))) throw new Error('Unsupported adapter argument placeholder')
    if (adapter.inheritStdin !== undefined && typeof adapter.inheritStdin !== 'boolean') throw new Error('Adapter inheritStdin must be boolean')
  }
}

export function adapterPreflight(repoRoot, explicitConfig = null) {
  const configFile = explicitConfig ?? path.join(repoRoot, '.loop', 'config.json')
  try {
    let config = readJson(configFile, 'Loop config')
    // A local override cannot conceal an invalid base config, matching runner.
    validateConfigShape(config)
    if (explicitConfig === null) {
      const local = path.join(repoRoot, '.loop', 'config.local.json')
      if (existsSync(local)) {
        config = { ...config, ...readJson(local, 'Local loop config') }
        validateConfigShape(config)
      }
    }
    if (typeof config.adapter !== 'string' || !config.adapter.trim()) throw new Error('No adapter is selected; configure adapter before installation or activation')
    const adapters = config.adapters ?? {}
    const adapter = Object.hasOwn(adapters, config.adapter) ? adapters[config.adapter] : undefined
    if (config.adapter !== 'codex' && !adapter) throw new Error('Selected adapter needs a configured executable and args')
    if (adapter?.inheritStdin === true) throw new Error('Scheduled adapters cannot inherit stdin; use a noninteractive adapter')
    if (config.intervalSeconds !== undefined && config.intervalSeconds !== 0) throw new Error('Scheduling requires config intervalSeconds: 0; OS triggers own the interval')
    if (config.delaySeconds !== undefined && config.delaySeconds !== 0) throw new Error('Remove config delaySeconds before scheduling; OS triggers own the delay')
    if (config.startAt !== undefined) throw new Error('Remove config startAt before scheduling; OS triggers own the start time')
    return { ok: true, configFile, adapter: config.adapter }
  } catch (error) {
    return { ok: false, configFile, error: error.message }
  }
}

function requirePreflight(repoRoot, configPath, preflight) {
  const result = preflight(repoRoot, configPath)
  if (!result.ok) throw new Error(`Scheduler preflight refused activation: ${result.error}`)
  return result
}

function requireFile(file, label) {
  try {
    if (!statSync(file).isFile()) throw new Error('not a file')
  } catch {
    throw new Error(`${label} must exist as a regular file: ${file}`)
  }
}

function runnerState(repoRoot) {
  const file = path.join(repoRoot, 'artifacts', 'loop', 'state.json')
  if (!existsSync(file)) return { file, present: false }
  try {
    const value = readJson(file, 'Runner state')
    // Read selected leaves only; do not expose request transcripts/config data.
    const status = value.lastRun?.result ?? value.status
    return { file, present: true, paused: value.paused === true, status: typeof status === 'string' ? status : null }
  } catch (error) {
    return { file, present: true, error: error.message }
  }
}

const CAVEAT = 'Schedules can outlive this terminal, but run only while this user is signed in and the machine is awake. Missed/overlapping occurrences are skipped; no catch-up, backlog, retries, or wake.'

export async function runScheduler(argv, dependencies = {}) {
  const options = parseArgs(argv)
  if (options.help) return { action: options.action, message: HELP, mutating: false }
  const repoRoot = dependencies.repoRoot ?? realpathSync(path.resolve(import.meta.dirname, '..', '..'))
  const nodePath = dependencies.nodePath ?? process.execPath
  const clock = dependencies.now ?? Date.now
  const now = clock()
  const preflight = dependencies.preflight ?? adapterPreflight
  const action = options.action
  let plan
  if (['preview', 'install'].includes(action)) plan = makePlan(options, { repoRoot, nodePath, now })
  if (action === 'preview') {
    return {
      action, mutating: false, taskName: plan.taskName, plan,
      preflight: preflight(repoRoot, plan.configPath),
      xml: buildTaskXml(plan),
      message: `PREVIEW ONLY: no OS task was queried or changed. XML is a template; CURRENT_USER_SID is resolved at install. Install is disabled by default. ${CAVEAT}`,
    }
  }
  if ((dependencies.platform ?? process.platform) !== 'win32') throw new Error('Task Scheduler actions require Windows; preview is available on every platform')
  // Failed configuration must not even query or invoke Task Scheduler.
  if (action === 'install') {
    requirePreflight(repoRoot, plan.configPath, preflight)
    requireFile(nodePath, 'Node executable')
    requireFile(plan.runnerPath, 'Loop executor')
  }
  const tools = dependencies.tools ?? windowsTools()
  const command = dependencies.runCommand ?? runFileCommand
  const run = (executable, args) => command(executable, args, { cwd: repoRoot })
  const sid = dependencies.sid ?? await currentUserSid(run, tools)
  if (!/^S-1-(?:5-21-(?:\d+-){3}\d+|12-1-(?:\d+-){3}\d+)$/.test(sid)) throw new Error('Only a current-user account SID is supported, not SYSTEM or a service account')
  const taskName = taskNameForRepo(repoRoot)
  const query = () => run(tools.schtasks, ['/Query', '/TN', taskName, '/XML'])
  const queried = await query()
  if (action === 'install') {
    if (queried.code === 0) throw new Error('A task with this repository name already exists; inspect status and explicitly remove it first. Install never overwrites.')
    if (parseInstant(plan.start) <= clock()) throw new Error('Schedule start expired during preflight; choose a later start time')
    const temp = mkdtempSync(path.join(dependencies.tempRoot ?? os.tmpdir(), 'dw-loop-schedule-xml-'))
    try {
      const xmlFile = path.join(temp, 'task.xml')
      writeFileSync(xmlFile, Buffer.from(`\uFEFF${buildTaskXml(plan, sid)}`, 'utf16le'), { flag: 'wx' })
      // No /F, /RU, /RP, /RL, /IT, /Run, shell, or overwrite fallback.
      const created = await run(tools.schtasks, ['/Create', '/TN', taskName, '/XML', xmlFile])
      if (created.code !== 0) throw new Error(`Task installation failed (${created.code}); existing tasks were not overwritten. ${created.stderr || created.stdout}`.trim())
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
    return { action, taskName, enabled: false, mutating: true, message: `Installed DISABLED. Review with status; run enable separately when ready. ${CAVEAT}` }
  }
  if (queried.code !== 0) {
    const message = `Task is absent or unreadable (${queried.code}); no changes made. ${queried.stderr || queried.stdout}`.trim()
    if (action === 'status') return { action, taskName, installed: null, mutating: false, runnerState: runnerState(repoRoot), message }
    throw new Error(message)
  }
  const owned = readOwnedTask(queried.stdout, { repoRoot, nodePath, sid })
  if (action === 'status') {
    const detail = await run(tools.schtasks, ['/Query', '/TN', taskName, '/FO', 'LIST', '/V'])
    const osStatus = detail.code === 0 ? detail.stdout.trim() : `OS runtime status unavailable (${detail.code}): ${detail.stderr || detail.stdout}`.trim()
    return { action, taskName, installed: true, mutating: false, task: owned, osStatus, futureOccurrence: hasFutureOccurrence(owned, now), preflight: preflight(repoRoot, owned.configPath), runnerState: runnerState(repoRoot), message: `Task definition and OS status read without changing OS or runner state. OS exit codes are not model results. Use node scripts/run-loop.mjs --status for full lock/pause diagnostics. ${CAVEAT}` }
  }
  if (action === 'enable') {
    requirePreflight(repoRoot, owned.configPath, preflight)
    requireFile(nodePath, 'Node executable')
    requireFile(owned.runnerPath, 'Loop executor')
    if (!hasFutureOccurrence(owned, clock())) throw new Error('No future occurrence remains; explicitly remove and install a new schedule')
  }
  const args = action === 'remove'
    ? ['/Delete', '/TN', taskName, '/F'] // Explicit remove, only after full ownership validation.
    : ['/Change', '/TN', taskName, action === 'enable' ? '/ENABLE' : '/DISABLE']
  const result = await run(tools.schtasks, args)
  if (result.code !== 0) throw new Error(`Task ${action} failed (${result.code}); runner state was not changed. ${result.stderr || result.stdout}`.trim())
  return {
    action, taskName, mutating: true,
    message: action === 'enable'
      ? `Enabled; no immediate run was requested. Executor pause/lock state is unchanged. ${CAVEAT}`
      : `${action === 'disable' ? 'Disabled future occurrences' : 'Removed the owned task'}. An already-running iteration is not terminated. Runner pause/lock state is unchanged.`,
  }
}

export function formatResult(result) {
  if (result.message === HELP) return HELP
  const lines = [result.message, `Task: ${result.taskName}`]
  const task = result.plan ?? result.task
  if (task) {
    lines.push(`Repository: ${task.repoRoot}`, `Start (UTC): ${task.start}`)
    lines.push(task.intervalMinutes === null ? 'Trigger: one-shot' : `Trigger: every ${task.intervalMinutes} minute(s), ending before ${task.end}`)
    lines.push(`Node: ${task.nodePath}`, `Executor: ${task.runnerPath}`, `Config: ${task.configPath ?? '.loop/config.json + optional .loop/config.local.json'}`)
  }
  if (result.task) lines.push(`Enabled: ${result.task.enabled}`, `Future occurrence: ${result.futureOccurrence}`)
  if (result.preflight) lines.push(result.preflight.ok ? `Adapter preflight: configured (${result.preflight.adapter}); not executed` : `Adapter preflight: BLOCKED — ${result.preflight.error}`)
  if (result.runnerState) lines.push(`Runner state: ${result.runnerState.file}`, result.runnerState.error ?? (result.runnerState.present ? `Paused: ${result.runnerState.paused}; status: ${result.runnerState.status ?? 'see runner --status'}` : 'No persisted runner state yet'))
  if (result.osStatus) lines.push('', 'OS runtime status (localized Task Scheduler output):', result.osStatus)
  if (result.xml) lines.push('', result.xml)
  return lines.join('\n')
}
