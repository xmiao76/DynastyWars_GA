import { createHash } from 'node:crypto'
import path from 'node:path'

export const ACTIONS = ['preview', 'install', 'enable', 'status', 'disable', 'remove']
export const MAX_INTERVAL_MINUTES = 44_640 // Task Scheduler: 1 minute through 31 days.
const TIME_FLAGS = ['--start-at', '--delay-seconds', '--interval-minutes', '--until', '--config']
const XML_NS = 'http://schemas.microsoft.com/windows/2004/02/mit/task'

export const HELP = `Loop scheduler (Windows Task Scheduler; no PowerShell 7 required)
Usage: npm run loop:schedule -- [preview|install] [--start-at ISO | --delay-seconds N]
       [--interval-minutes N --until ISO] [--config PATH]
       npm run loop:schedule -- enable|status|disable|remove

Omitted action means preview. Bare preview only prints this guidance.
ISO dates must include Z or an explicit offset, e.g. 2030-04-20T09:00:00-07:00.
Interval: integer 1..44640 minutes. Delay: integer 1..2678400 seconds.
Install creates a DISABLED task; enable is a separate explicit action.
One occurrence = node scripts/run-loop.mjs --scheduled --iterations 1.
Requires a configured adapter, signed-in current user, and an awake machine.
No password, elevation, wake, retries, backlog, or missed-run catch-up.
`

export function parseArgs(argv) {
  const args = [...argv]
  const action = args[0] && !args[0].startsWith('--') ? args.shift() : 'preview'
  if (!ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`)
  const values = {}
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (flag === '--help') {
      if (args.length !== 1) throw new Error('--help cannot be combined with other options')
      return { action, help: true }
    }
    if (!TIME_FLAGS.includes(flag)) throw new Error(`Unknown option: ${flag}`)
    if (!['preview', 'install'].includes(action)) throw new Error(`${action} does not accept ${flag}; it uses the installed task`)
    if (Object.hasOwn(values, flag)) throw new Error(`Duplicate option: ${flag}`)
    const value = args[++i]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`)
    values[flag] = value
  }
  if (values['--start-at'] && values['--delay-seconds']) throw new Error('Choose only one of --start-at and --delay-seconds')
  if (Boolean(values['--interval-minutes']) !== Boolean(values['--until'])) throw new Error('Recurring schedules require both --interval-minutes and --until')
  const hasTime = values['--start-at'] || values['--delay-seconds']
  if (['preview', 'install'].includes(action) && !hasTime) {
    if (action === 'preview' && Object.keys(values).length === 0) return { action, help: true }
    throw new Error('Provide --start-at or --delay-seconds')
  }
  return { action, values }
}

export function boundedInteger(value, label, min, max) {
  if (!/^[1-9]\d*$/.test(value ?? '')) throw new Error(`${label} must be an integer from ${min} to ${max}`)
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new Error(`${label} must be an integer from ${min} to ${max}`)
  return number
}

export function parseInstant(value, label = 'Date') {
  // Reject JS Date's lenient rollover (February 30), offset-less local dates,
  // leap seconds, 24:00, unknown -00:00 offsets, and out-of-schema years.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value ?? '')
  if (!match) throw new Error(`${label} must be ISO 8601 with Z or an explicit timezone offset`)
  const [, y, mo, d, h, mi, s = '0', fraction = '', zone] = match
  const year = Number(y), month = Number(mo), day = Number(d)
  const hour = Number(h), minute = Number(mi), second = Number(s)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (year < 1900 || year > 9998 || month < 1 || month > 12 || day < 1 || day > days || hour > 23 || minute > 59 || second > 59) {
    throw new Error(`${label} is not a valid calendar date`)
  }
  let offset = 0
  if (zone !== 'Z') {
    const zh = Number(zone.slice(1, 3)), zm = Number(zone.slice(4, 6))
    if (zone === '-00:00' || zh > 14 || zm > 59 || (zh === 14 && zm !== 0)) throw new Error(`${label} has an invalid timezone offset`)
    offset = (zh * 60 + zm) * (zone[0] === '-' ? -1 : 1)
  }
  return Date.UTC(year, month - 1, day, hour, minute, second, Number(fraction.padEnd(3, '0'))) - offset * 60_000
}

export function canonicalRepo(repoRoot) {
  const windows = /^[A-Za-z]:[\\/]/.test(repoRoot) || repoRoot.startsWith('\\\\')
  const paths = windows ? path.win32 : path
  if (!paths.isAbsolute(repoRoot)) throw new Error('Repository path must be absolute')
  const normalized = paths.normalize(repoRoot).replace(/[\\/]+$/, '')
  return windows ? normalized.toLowerCase() : normalized
}

export function taskNameForRepo(repoRoot) {
  return `DynastyWars-Loop-${createHash('sha256').update(canonicalRepo(repoRoot)).digest('hex').slice(0, 24)}`
}

export function ownershipTag(repoRoot) {
  return `DynastyWars loop scheduler v1; repo=${canonicalRepo(repoRoot)}; id=${taskNameForRepo(repoRoot)}`
}

export function safeText(text, label = 'Value') {
  if (typeof text !== 'string') throw new Error(`${label} must be a string`)
  // Lone surrogates and controls are not valid XML 1.0 argument content.
  for (const character of text) {
    const code = character.codePointAt(0)
    if (code < 32 || code === 127) throw new Error(`${label} contains invalid control characters`)
    if ((code >= 0xd800 && code <= 0xdfff) || code === 0xfffe || code === 0xffff) throw new Error(`${label} contains invalid XML characters`)
  }
  return text
}

export function xmlEscape(value) {
  return safeText(String(value)).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])
}

export function quoteWindowsArg(value) {
  safeText(value, 'Argument')
  // Microsoft CRT argv rules, not cmd.exe/PowerShell quoting. Always quote.
  return `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"`
}

export function actionArgs(runnerPath, configPath) {
  return [runnerPath, '--scheduled', '--iterations', '1', ...(configPath ? ['--config', configPath] : [])]
}

export function makePlan(options, { repoRoot, nodePath, now = Date.now() }) {
  safeText(repoRoot, 'Repository path')
  safeText(nodePath, 'Node path')
  const paths = /^[A-Za-z]:[\\/]/.test(repoRoot) || repoRoot.startsWith('\\\\') ? path.win32 : path
  if (!paths.isAbsolute(nodePath)) throw new Error('Node executable path must be absolute')
  const values = options.values
  const start = values['--start-at']
    ? parseInstant(values['--start-at'], '--start-at')
    : now + boundedInteger(values['--delay-seconds'], '--delay-seconds', 1, 2_678_400) * 1000
  if (start <= now) throw new Error('--start-at must be in the future')
  const intervalMinutes = values['--interval-minutes']
    ? boundedInteger(values['--interval-minutes'], '--interval-minutes', 1, MAX_INTERVAL_MINUTES) : null
  const end = values['--until'] ? parseInstant(values['--until'], '--until') : null
  if (end !== null && end <= start) throw new Error('--until must be later than --start-at (and in the future)')
  if (end !== null && end - start < intervalMinutes * 60_000) throw new Error('Recurring window must contain at least one full interval')
  const configPath = values['--config'] ? paths.resolve(repoRoot, safeText(values['--config'], 'Config path')) : null
  const runnerPath = paths.join(repoRoot, 'scripts', 'run-loop.mjs')
  const args = actionArgs(runnerPath, configPath)
  return {
    taskName: taskNameForRepo(repoRoot), repoRoot, nodePath, runnerPath, configPath,
    start: new Date(start).toISOString(), end: end === null ? null : new Date(end).toISOString(),
    intervalMinutes, args, arguments: args.map(quoteWindowsArg).join(' '),
  }
}

export function buildTaskXml(plan, sid = 'CURRENT_USER_SID') {
  const x = xmlEscape
  const repetition = plan.intervalMinutes === null ? '' : `
      <Repetition>
        <Interval>PT${plan.intervalMinutes}M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>`
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="${XML_NS}">
  <RegistrationInfo>
    <Description>${x(ownershipTag(plan.repoRoot))}</Description>
    <URI>\\${x(plan.taskName)}</URI>
  </RegistrationInfo>
  <Triggers>
    <TimeTrigger>${repetition}
      <StartBoundary>${x(plan.start)}</StartBoundary>${plan.end ? `\n      <EndBoundary>${x(plan.end)}</EndBoundary>` : ''}
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="CurrentUser">
      <UserId>${x(sid)}</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>false</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
    <AllowStartOnDemand>false</AllowStartOnDemand>
    <Enabled>false</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="CurrentUser">
    <Exec>
      <Command>${x(plan.nodePath)}</Command>
      <Arguments>${x(plan.arguments)}</Arguments>
      <WorkingDirectory>${x(plan.repoRoot)}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
`
}

// Small strict XML reader for Task Scheduler's export format. No entities, DTDs,
// external resources, processing instructions, namespace aliases, or mixed text.
// This is deliberately fail-closed rather than a general-purpose XML library.
export function parseTaskXml(source) {
  if (typeof source !== 'string' || source.length > 256_000) throw new Error('Invalid or oversized task XML')
  let xml = source.replace(/^\uFEFF/, '').trim()
  xml = xml.replace(/^<\?xml\s+[^?]*\?>\s*/, '')
  if (/<[!?]/.test(xml)) throw new Error('Task XML declarations, comments, and DTDs are not accepted')
  const document = { name: '#document', children: [], text: '', attrs: {} }
  const stack = [document]
  const unescape = text => {
    if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(text)) throw new Error('Invalid XML entity')
    return text.replace(/&([^;]+);/g, (_, entity) => {
      const known = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
      if (Object.hasOwn(known, entity)) return known[entity]
      const code = entity.startsWith('#x') ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1))
      if (!Number.isInteger(code) || code < 32 || code > 0x10ffff) throw new Error('Invalid XML character entity')
      return safeText(String.fromCodePoint(code))
    })
  }
  let offset = 0, count = 0
  const tokens = /<[^>]*>|[^<]+/g
  for (const match of xml.matchAll(tokens)) {
    if (match.index !== offset) throw new Error('Malformed task XML')
    const token = match[0]
    offset += token.length
    const parent = stack.at(-1)
    if (!token.startsWith('<')) {
      parent.text += unescape(token)
    } else if (token.startsWith('</')) {
      if (stack.length === 1 || token !== `</${parent.name}>`) throw new Error('Unbalanced task XML')
      stack.pop()
    } else {
      const opening = /^<([A-Za-z][A-Za-z0-9]*)([\s\S]*?)(\/?)>$/.exec(token)
      if (!opening || ++count > 500 || stack.length > 16) throw new Error('Unsupported task XML element')
      const attrs = {}
      let remaining = opening[2]
      while (remaining.trim()) {
        const attribute = /^\s+([A-Za-z][A-Za-z0-9]*)\s*=\s*(?:"([^"<]*)"|'([^'<]*)')/.exec(remaining)
        if (!attribute || Object.hasOwn(attrs, attribute[1])) throw new Error('Malformed or duplicate XML attribute')
        attrs[attribute[1]] = unescape(attribute[2] ?? attribute[3])
        remaining = remaining.slice(attribute[0].length)
      }
      const node = { name: opening[1], attrs, children: [], text: '' }
      parent.children.push(node)
      if (!opening[3]) stack.push(node)
    }
  }
  if (offset !== xml.length || stack.length !== 1 || document.children.length !== 1 || document.text.trim()) throw new Error('Malformed task XML document')
  const root = document.children[0]
  if (root.name !== 'Task' || root.attrs.xmlns !== XML_NS) throw new Error('Not a Task Scheduler XML document')
  return root
}

function one(node, name, optional = false) {
  const matches = node.children.filter(child => child.name === name)
  if (matches.length !== 1) {
    if (optional && matches.length === 0) return null
    throw new Error(`Expected exactly one ${name} in task XML`)
  }
  return matches[0]
}
function text(node, name, optional = false) {
  const child = one(node, name, optional)
  if (!child) return null
  if (child.children.length) throw new Error(`Unexpected nested ${name} in task XML`)
  return child.text.trim()
}
function exact(actual, expected, label) {
  if (actual !== expected) throw new Error(`Refusing unrelated or modified task: ${label} mismatch`)
}
function onlyChildren(node, allowed) {
  if (node.text.trim() || node.children.some(child => !allowed.includes(child.name))) throw new Error(`Unexpected task XML content in ${node.name}`)
}

export function readOwnedTask(xml, { repoRoot, nodePath, sid }) {
  const root = parseTaskXml(xml)
  onlyChildren(root, ['RegistrationInfo', 'Triggers', 'Principals', 'Settings', 'Actions'])
  const registration = one(root, 'RegistrationInfo')
  exact(text(registration, 'Description'), ownershipTag(repoRoot), 'repository ownership tag')
  const uri = text(registration, 'URI', true)
  if (uri !== null) exact(uri, `\\${taskNameForRepo(repoRoot)}`, 'task name')
  const principals = one(root, 'Principals')
  onlyChildren(principals, ['Principal'])
  const principal = one(principals, 'Principal')
  onlyChildren(principal, ['UserId', 'LogonType', 'RunLevel'])
  exact(text(principal, 'UserId'), sid, 'current-user SID')
  exact(text(principal, 'LogonType'), 'InteractiveToken', 'interactive logon')
  exact(text(principal, 'RunLevel'), 'LeastPrivilege', 'limited privilege')
  const actions = one(root, 'Actions')
  onlyChildren(actions, ['Exec'])
  exact(principal.attrs.id, 'CurrentUser', 'principal ID')
  exact(actions.attrs.Context, principal.attrs.id, 'action principal')
  const exec = one(actions, 'Exec')
  onlyChildren(exec, ['Command', 'Arguments', 'WorkingDirectory'])
  exact(text(exec, 'Command'), nodePath, 'Node executable')
  exact(text(exec, 'WorkingDirectory'), repoRoot, 'working directory')
  const paths = /^[A-Za-z]:[\\/]/.test(repoRoot) || repoRoot.startsWith('\\\\') ? path.win32 : path
  const runnerPath = paths.join(repoRoot, 'scripts', 'run-loop.mjs')
  const argumentsText = text(exec, 'Arguments')
  const fixedArgs = actionArgs(runnerPath, null).map(quoteWindowsArg).join(' ')
  let configPath = null
  if (argumentsText !== fixedArgs) {
    const prefix = `${fixedArgs} ${quoteWindowsArg('--config')} `
    if (!argumentsText.startsWith(prefix)) throw new Error('Refusing modified task: executor arguments mismatch')
    // A path cannot contain a quote on Windows. Preserve ampersands, apostrophes,
    // spaces, Unicode, and backslashes literally; reject any extra argument.
    const quotedPath = argumentsText.slice(prefix.length)
    if (!/^"[^"\r\n]+"$/.test(quotedPath)) throw new Error('Invalid task config argument')
    configPath = quotedPath.slice(1, -1).replace(/\\\\$/, '\\')
    if (!paths.isAbsolute(configPath) || quoteWindowsArg(configPath) !== quotedPath) throw new Error('Task config path must be absolute and exactly quoted')
  }
  const settings = one(root, 'Settings')
  for (const [key, expected] of Object.entries({ MultipleInstancesPolicy: 'IgnoreNew', StartWhenAvailable: 'false', WakeToRun: 'false', AllowStartOnDemand: 'false', ExecutionTimeLimit: 'PT0S' })) {
    exact(text(settings, key), expected, key)
  }
  if (one(settings, 'RestartOnFailure', true)) throw new Error('Refusing task with automatic failure retries')
  const enabled = text(settings, 'Enabled')
  if (!['true', 'false'].includes(enabled)) throw new Error('Task Enabled must be boolean')
  const triggers = one(root, 'Triggers')
  onlyChildren(triggers, ['TimeTrigger'])
  const trigger = one(triggers, 'TimeTrigger')
  onlyChildren(trigger, ['Repetition', 'StartBoundary', 'EndBoundary', 'Enabled'])
  exact(text(trigger, 'Enabled'), 'true', 'time trigger enabled')
  const start = text(trigger, 'StartBoundary')
  parseInstant(start, 'Task StartBoundary')
  const end = text(trigger, 'EndBoundary', true)
  const repetition = one(trigger, 'Repetition', true)
  let intervalMinutes = null
  if (repetition) {
    onlyChildren(repetition, ['Interval', 'StopAtDurationEnd'])
    // Task Scheduler may export PT60M as PT1H (or other equivalent durations).
    const interval = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(text(repetition, 'Interval'))
    const minutes = interval ? Number(interval[1] ?? 0) * 1440 + Number(interval[2] ?? 0) * 60 + Number(interval[3] ?? 0) + Number(interval[4] ?? 0) / 60 : 0
    intervalMinutes = boundedInteger(String(minutes), 'Task interval', 1, MAX_INTERVAL_MINUTES)
    exact(text(repetition, 'StopAtDurationEnd'), 'false', 'repetition stop policy')
    if (!end || parseInstant(end, 'Task EndBoundary') - parseInstant(start) < intervalMinutes * 60_000) throw new Error('Recurring task must have a finite end after at least one interval')
  } else if (end !== null) {
    throw new Error('Unexpected one-shot end boundary')
  }
  return { taskName: taskNameForRepo(repoRoot), repoRoot, nodePath, runnerPath, configPath, start, end, intervalMinutes, enabled: enabled === 'true' }
}

export function hasFutureOccurrence(task, now) {
  const start = parseInstant(task.start)
  if (task.intervalMinutes === null) return start > now
  const end = parseInstant(task.end)
  const interval = task.intervalMinutes * 60_000
  const next = start > now ? start : start + (Math.floor((now - start) / interval) + 1) * interval
  return next < end
}
