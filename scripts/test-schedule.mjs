// Offline only. No OS task, real loop executor, adapter, or model is invoked.
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, writeSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'
import {
  actionArgs, buildTaskXml, canonicalRepo, hasFutureOccurrence, makePlan, parseArgs,
  parseInstant, parseTaskXml, quoteWindowsArg, readOwnedTask, taskNameForRepo, xmlEscape,
} from './loop-schedule/core.mjs'
import { adapterPreflight, formatResult, runScheduler } from './loop-schedule/service.mjs'
import { currentUserSid, decodeOutput, runFileCommand, windowsTools } from './loop-schedule/windows.mjs'

const NOW = Date.parse('2030-01-02T03:04:05.000Z')
const SID = 'S-1-5-21-100-200-300-1001'
const tools = { schtasks: 'FAKE_SCHTASKS.exe', powershell: 'FAKE_POWERSHELL.exe' }
const validConfig = () => ({ version: 1, adapter: 'fake', iterations: 1, intervalSeconds: 0, adapters: { fake: { executable: 'node', args: ['{requestFile}', '{resultFile}'] } } })

function fixture(t, { executor = true } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'dw-schedule-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const repoRoot = path.join(dir, "repo & 'Unicode 游戏'")
  mkdirSync(path.join(repoRoot, '.loop'), { recursive: true })
  mkdirSync(path.join(repoRoot, 'scripts'), { recursive: true })
  const configFile = path.join(repoRoot, '.loop', 'config.json')
  writeFileSync(configFile, JSON.stringify(validConfig()))
  // This file is a stub, not the repository's real loop executor.
  if (executor) writeFileSync(path.join(repoRoot, 'scripts', 'run-loop.mjs'), 'console.log(JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd()}))\n')
  const dependencies = { repoRoot, nodePath: process.execPath, now: () => NOW, platform: 'win32', sid: SID, tools, tempRoot: dir }
  const plan = makePlan(parseArgs(['preview', '--delay-seconds', '60']), { ...dependencies, now: NOW })
  return { dir, repoRoot, configFile, dependencies, plan, xml: buildTaskXml(plan, SID) }
}

function fakeTaskRunner(initialXml = null) {
  let xml = initialXml
  const calls = []
  const runCommand = async (executable, args, options) => {
    assert.equal(executable, tools.schtasks, 'Tests must never call real schtasks')
    calls.push({ args: [...args], options })
    if (args[0] === '/Query') return { code: xml === null ? 1 : 0, stdout: xml === null ? '' : args.includes('/XML') ? xml : 'Status: Ready (fake)\nLast Result: 0', stderr: xml === null ? 'not found (fake)' : '' }
    if (args[0] === '/Create') {
      assert.equal(xml, null, 'No replacement allowed')
      assert.equal(args.includes('/F'), false)
      const bytes = readFileSync(args[args.indexOf('/XML') + 1])
      assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xfe])
      xml = decodeOutput(bytes)
      return { code: 0, stdout: 'created (fake)', stderr: '' }
    }
    if (args[0] === '/Change') {
      assert.ok(xml)
      const next = args.at(-1) === '/ENABLE' ? 'true' : 'false'
      xml = xml.replace(/(<Settings>[\s\S]*?<Enabled>)(?:true|false)(<\/Enabled>)/, `$1${next}$2`)
      return { code: 0, stdout: 'changed (fake)', stderr: '' }
    }
    if (args[0] === '/Delete') {
      assert.ok(xml)
      xml = null
      return { code: 0, stdout: 'deleted (fake)', stderr: '' }
    }
    assert.fail(`Unexpected fake task command: ${args.join(' ')}`)
  }
  return { runCommand, calls, get xml() { return xml } }
}

function assertOnlyQueries(fake) {
  assert.ok(fake.calls.every(call => call.args[0] === '/Query'))
}

test('bare CLI and help are nonmutating preview and never call helpers', async () => {
  let calls = 0
  const deps = { runCommand: () => { calls++; throw new Error('forbidden') } }
  for (const args of [[], ['preview'], ['--help'], ['status', '--help']]) {
    const result = await runScheduler(args, deps)
    assert.equal(result.mutating, false)
    assert.match(formatResult(result), /DISABLED/)
  }
  assert.equal(calls, 0)
})

test('strict argument parsing rejects unknown, duplicate, ambiguous and action-specific options', () => {
  const invalid = [
    ['run'], ['--name', 'unrelated'], ['--force'], ['--enable'], ['--start-at'],
    ['preview', '--delay-seconds', '60', '--delay-seconds', '70'],
    ['--delay-seconds', '60', '--start-at', '2030-01-03T00:00:00Z'],
    ['--interval-minutes', '5'], ['--until', '2030-01-03T00:00:00Z'],
    ['install'], ['preview', '--config', 'x'], ['--help', '--delay-seconds', '2'],
  ]
  for (const action of ['enable', 'status', 'disable', 'remove']) invalid.push([action, '--config', 'other.json'], [action, '--delay-seconds', '2'])
  for (const args of invalid) assert.throws(() => parseArgs(args), undefined, args.join(' '))
})

test('dates require explicit timezone and validate leap years and calendar fields', () => {
  assert.equal(parseInstant('2030-01-02T03:04:05Z'), NOW)
  assert.equal(parseInstant('2030-01-01T20:04:05-07:00'), NOW)
  assert.equal(parseInstant('2030-01-02T17:04:05+14:00'), NOW)
  assert.equal(parseInstant('2030-01-02T03:04Z'), NOW - 5000)
  assert.equal(parseInstant('2032-02-29T00:00:00.25Z'), Date.parse('2032-02-29T00:00:00.250Z'))
  for (const value of ['2030-01-02', '2030-01-02T03:04:05', '2030-02-29T00:00Z', '2030-04-31T00:00Z', '2030-00-01T00:00Z', '2030-01-00T00:00Z', '2030-01-02T24:00Z', '2030-01-02T03:60Z', '2030-01-02T03:04:60Z', '2030-01-02T03:04+14:01', '2030-01-02T03:04-00:00', '2030-01-02T03:04+01:60', '0099-01-02T03:04Z', '2030-01-02T03:04z']) {
    assert.throws(() => parseInstant(value), undefined, value)
  }
})

test('schedule bounds, future starts, UTC normalization, and finite recurrence', () => {
  const context = { repoRoot: 'C:\\Repos\\Game', nodePath: 'C:\\Program Files\\nodejs\\node.exe', now: NOW }
  const plan = args => makePlan(parseArgs(args), context)
  assert.equal(plan(['--start-at', '2030-01-01T20:05:05-07:00']).start, '2030-01-02T03:05:05.000Z')
  assert.equal(plan(['--delay-seconds', '1']).start, '2030-01-02T03:04:06.000Z')
  for (const delay of ['0', '-1', '1.5', '1e3', '01', '2678401', 'Infinity']) assert.throws(() => plan(['--delay-seconds', delay]))
  for (const interval of ['0', '-1', '0.5', '44641']) assert.throws(() => plan(['--delay-seconds', '1', '--interval-minutes', interval, '--until', '2031-01-02T03:04Z']))
  assert.equal(plan(['--delay-seconds', '1', '--interval-minutes', '44640', '--until', '2031-01-02T03:04Z']).intervalMinutes, 44640)
  assert.throws(() => plan(['--start-at', '2030-01-02T03:04:05Z']), /future/)
  assert.throws(() => plan(['--start-at', '2029-01-02T03:04Z']), /future/)
  assert.throws(() => plan(['--delay-seconds', '60', '--interval-minutes', '5', '--until', '2030-01-02T03:05Z']), /later/)
  assert.throws(() => plan(['--delay-seconds', '60', '--interval-minutes', '5', '--until', '2030-01-02T03:06Z']), /full interval/)
})

test('names bind canonical repository paths, not cwd or arbitrary task names', () => {
  assert.equal(taskNameForRepo('C:\\Repo\\Game\\'), taskNameForRepo('c:/repo/GAME'))
  assert.notEqual(taskNameForRepo('C:\\Repo\\Game'), taskNameForRepo('C:\\Repo\\Other'))
  assert.match(taskNameForRepo('C:\\Repo\\Game'), /^DynastyWars-Loop-[a-f0-9]{24}$/)
  assert.equal(canonicalRepo('C:/Repo/Game/../Game'), 'c:\\repo\\game')
  assert.throws(() => canonicalRepo('relative/path'), /absolute/)
})

test('Windows argv quoting and XML escaping preserve spaces, punctuation and backslashes', () => {
  assert.equal(quoteWindowsArg('C:\\Program Files\\node.exe'), '"C:\\Program Files\\node.exe"')
  assert.equal(quoteWindowsArg('C:\\ending\\'), '"C:\\ending\\\\"')
  assert.equal(quoteWindowsArg('a"b'), '"a\\"b"')
  assert.equal(xmlEscape("<&\"'>"), '&lt;&amp;&quot;&apos;&gt;')
  assert.equal(quoteWindowsArg('a & b | c %PATH% $x'), '"a & b | c %PATH% $x"')
  assert.throws(() => quoteWindowsArg('a\0b'), /control/)
  assert.throws(() => xmlEscape('\ud800'), /XML/)
})

test('generated XML has secure current-user disabled no-catchup non-overlap defaults', t => {
  const { plan, xml, repoRoot, dependencies } = fixture(t)
  for (const fragment of ['<LogonType>InteractiveToken</LogonType>', '<RunLevel>LeastPrivilege</RunLevel>', '<MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>', '<StartWhenAvailable>false</StartWhenAvailable>', '<WakeToRun>false</WakeToRun>', '<AllowStartOnDemand>false</AllowStartOnDemand>', '<ExecutionTimeLimit>PT0S</ExecutionTimeLimit>']) assert.ok(xml.includes(fragment), fragment)
  assert.equal(xml.includes('<RestartOnFailure>'), false)
  assert.equal(xml.includes('<Repetition>'), false)
  assert.equal(xml.includes('<EndBoundary>'), false)
  assert.ok(xml.includes('&amp;'))
  assert.ok(xml.includes('&apos;'))
  const owned = readOwnedTask(xml, dependencies)
  assert.equal(owned.enabled, false)
  assert.equal(owned.repoRoot, repoRoot)
  assert.equal(owned.start, plan.start)
  assert.equal(owned.configPath, null)
  assert.deepEqual(plan.args.slice(1), ['--scheduled', '--iterations', '1'])
})

test('recurrence carries finite end, normalizes timezone, and never invents catch-up', t => {
  const f = fixture(t)
  const plan = makePlan(parseArgs(['--delay-seconds', '60', '--interval-minutes', '5', '--until', '2030-01-02T03:20:05+00:00']), { ...f.dependencies, now: NOW })
  const owned = readOwnedTask(buildTaskXml(plan, SID), f.dependencies)
  assert.equal(owned.intervalMinutes, 5)
  assert.equal(owned.end, '2030-01-02T03:20:05.000Z')
  assert.equal(hasFutureOccurrence(owned, NOW), true)
  assert.equal(hasFutureOccurrence(owned, Date.parse('2030-01-02T03:16:00Z')), false)
  assert.equal(hasFutureOccurrence(owned, Date.parse('2030-01-02T03:15:04Z')), true)
  assert.equal(hasFutureOccurrence({ ...owned, intervalMinutes: null }, Date.parse(owned.start)), false)
})

test('explicit configuration path is absolute and round-trips escaped XML', t => {
  const f = fixture(t)
  const plan = makePlan(parseArgs(['--delay-seconds', '60', '--config', "custom & 'local'.json"]), { ...f.dependencies, now: NOW })
  const owned = readOwnedTask(buildTaskXml(plan, SID), f.dependencies)
  assert.equal(owned.configPath, path.join(f.repoRoot, "custom & 'local'.json"))
  assert.deepEqual(plan.args, [plan.runnerPath, '--scheduled', '--iterations', '1', '--config', owned.configPath])
})

test('ownership rejects wrong repository/user/principal/action and unsafe task modifications', t => {
  const f = fixture(t)
  const mutations = [
    xml => xml.replace('repo=', 'repo=other-'),
    xml => xml.replace(SID, 'S-1-5-21-100-200-300-9999'),
    xml => xml.replace('InteractiveToken', 'Password'),
    xml => xml.replace('LeastPrivilege', 'HighestAvailable'),
    xml => xml.replace('<Command>', '<Command>evil-'),
    xml => xml.replace('<WorkingDirectory>', '<WorkingDirectory>other-'),
    xml => xml.replace('&quot;1&quot;', '&quot;2&quot;'),
    xml => xml.replace('</Arguments>', ' --evil</Arguments>'),
    xml => xml.replace('<Actions Context="CurrentUser">', '<Actions Context="OtherUser">'),
    xml => xml.replace('</Actions>', '<Exec><Command>evil</Command></Exec></Actions>'),
    xml => xml.replace('IgnoreNew', 'Queue'),
    xml => xml.replace('<StartWhenAvailable>false', '<StartWhenAvailable>true'),
    xml => xml.replace('<WakeToRun>false', '<WakeToRun>true'),
    xml => xml.replace('<AllowStartOnDemand>false', '<AllowStartOnDemand>true'),
    xml => xml.replace('</Settings>', '<RestartOnFailure><Interval>PT1M</Interval><Count>2</Count></RestartOnFailure></Settings>'),
    xml => xml.replace('</Triggers>', '<LogonTrigger /></Triggers>'),
    xml => xml.replace('</Exec>', '<Arguments>duplicate</Arguments></Exec>'),
  ]
  for (const mutate of mutations) assert.throws(() => readOwnedTask(mutate(f.xml), f.dependencies))
})

test('strict XML reader rejects DTDs, entities, extra roots, aliases and malformed nesting', t => {
  const f = fixture(t)
  for (const xml of ['<!DOCTYPE Task><Task/>', f.xml.replace('<Command>', '<Command>&evil;'), f.xml + '<Task/>', f.xml.replace('<Task ', '<x:Task '), f.xml.replace('</Exec>', '</Actions>'), f.xml.replace('</Exec>', ''), f.xml.replace('<Command>', '<Command>&#0;'), f.xml.replace('<Command>', '<Command>&#xD800;'), f.xml.replace('<Task version=', '<Task xmlns="duplicate" version=')]) {
    assert.throws(() => parseTaskXml(xml))
  }
})

test('preview with unset adapter returns blocked details and XML without any OS calls', async t => {
  const f = fixture(t)
  writeFileSync(f.configFile, JSON.stringify({ version: 1, adapter: null }))
  const result = await runScheduler(['--delay-seconds', '60'], { ...f.dependencies, runCommand: () => assert.fail('No OS calls in preview') })
  assert.equal(result.mutating, false)
  assert.equal(result.preflight.ok, false)
  assert.match(result.xml, /CURRENT_USER_SID/)
  assert.match(formatResult(result), /BLOCKED/)
})

test('configuration preflight validates selection, generic placeholders, builtin codex, and timing', t => {
  const f = fixture(t)
  const check = config => { writeFileSync(f.configFile, JSON.stringify(config)); return adapterPreflight(f.repoRoot) }
  assert.equal(check(validConfig()).ok, true)
  assert.equal(check({ version: 1, adapter: 'codex' }).ok, true)
  for (const config of [
    { version: 2, adapter: 'codex' }, { version: 1, adapter: null }, { version: 1, adapter: {} },
    { version: 1, adapter: 'missing' }, { version: 1, adapter: 'toString' },
    { ...validConfig(), adapters: { fake: { executable: 'node', args: ['no placeholders'] } } },
    { ...validConfig(), adapters: { fake: { executable: 'node', args: ['{requestFile}', 5] } } },
    { version: 1, adapter: 'codex', adapters: { codex: { executable: '' } } },
    { ...validConfig(), intervalSeconds: 60 }, { ...validConfig(), delaySeconds: 1 },
    { ...validConfig(), startAt: '2030-01-01T00:00:00Z' }, { ...validConfig(), mode: 'unknown' },
    { ...validConfig(), iterations: 0 }, { ...validConfig(), timeoutSeconds: -1 },
    { ...validConfig(), iterations: 1001 }, { ...validConfig(), timeoutSeconds: 86401 },
    { ...validConfig(), unknown: true }, { ...validConfig(), model: '' },
    { ...validConfig(), adapters: { fake: { ...validConfig().adapters.fake, inheritStdin: true } } },
    { ...validConfig(), adapters: { fake: { ...validConfig().adapters.fake, args: ['{requestFile}', '{resultFile}', '{unknown}'] } } },
    { ...validConfig(), adapters: { fake: { ...validConfig().adapters.fake, unknown: true } } },
    { version: 1, adapter: 'codex', adapters: { codex: { args: [] } } },
    { ...validConfig(), delaySeconds: null }, { ...validConfig(), startAt: null },
  ]) assert.equal(check(config).ok, false, JSON.stringify(config))
})

test('local config overlay is shallow and explicit config bypasses that overlay', t => {
  const f = fixture(t)
  writeFileSync(f.configFile, JSON.stringify({ version: 1, adapter: null }))
  writeFileSync(path.join(f.repoRoot, '.loop', 'config.local.json'), JSON.stringify({ adapter: 'codex' }))
  assert.equal(adapterPreflight(f.repoRoot).ok, true)
  assert.equal(adapterPreflight(f.repoRoot, f.configFile).ok, false)
  writeFileSync(path.join(f.repoRoot, '.loop', 'config.local.json'), '{bad json')
  assert.equal(adapterPreflight(f.repoRoot).ok, false)
  writeFileSync(f.configFile, JSON.stringify(validConfig()))
  assert.equal(adapterPreflight(f.repoRoot, f.configFile).ok, true)
})

test('install preflight blocks unset or missing config before every OS call', async t => {
  const f = fixture(t)
  for (const config of ['{"version":1,"adapter":null}', 'not json']) {
    writeFileSync(f.configFile, config)
    await assert.rejects(runScheduler(['install', '--delay-seconds', '60'], { ...f.dependencies, runCommand: () => assert.fail('OS call despite invalid preflight') }), /preflight/)
  }
})

test('install creates disabled task with no force, task-name override, or password', async t => {
  const f = fixture(t), fake = fakeTaskRunner()
  const result = await runScheduler(['install', '--delay-seconds', '60'], { ...f.dependencies, runCommand: fake.runCommand })
  assert.equal(result.enabled, false)
  assert.equal(readOwnedTask(fake.xml, f.dependencies).enabled, false)
  assert.equal(fake.calls.length, 2)
  assert.deepEqual(fake.calls[0].args, ['/Query', '/TN', f.plan.taskName, '/XML'])
  assert.deepEqual(fake.calls[1].args.slice(0, 4), ['/Create', '/TN', f.plan.taskName, '/XML'])
  assert.equal(fake.calls.flatMap(call => call.args).some(arg => ['/F', '/RU', '/RP', '/RL', '/Run'].includes(arg)), false)
  assert.equal(readdirSync(f.dir).length, 1, 'Temporary XML must be removed')
})

test('install never overwrites existing tasks, even owned ones', async t => {
  const f = fixture(t), fake = fakeTaskRunner(f.xml)
  await assert.rejects(runScheduler(['install', '--delay-seconds', '60'], { ...f.dependencies, runCommand: fake.runCommand }), /never overwrites/)
  assertOnlyQueries(fake)
})

test('full fake lifecycle is explicit install, status, enable, disable, remove', async t => {
  const f = fixture(t), fake = fakeTaskRunner(), deps = { ...f.dependencies, runCommand: fake.runCommand }
  await runScheduler(['install', '--delay-seconds', '60'], deps)
  const status = await runScheduler(['status'], deps)
  assert.equal(status.task.enabled, false)
  assert.match(status.osStatus, /Ready \(fake\)/)
  assert.match(formatResult(status), /OS runtime status/)
  assert.equal(fake.calls.at(-1).args.includes('/V'), true)
  await runScheduler(['enable'], deps)
  assert.equal((await runScheduler(['status'], deps)).task.enabled, true)
  await runScheduler(['disable'], deps)
  assert.equal(readOwnedTask(fake.xml, f.dependencies).enabled, false)
  await runScheduler(['remove'], deps)
  assert.equal(fake.xml, null)
  assert.ok(fake.calls.every(call => call.args[call.args.indexOf('/TN') + 1] === f.plan.taskName))
  assert.equal(fake.calls.some(call => call.args.includes('/Run')), false)
})

test('every management action refuses an unrelated task and never mutates it', async t => {
  const f = fixture(t)
  for (const action of ['enable', 'status', 'disable', 'remove']) {
    const fake = fakeTaskRunner(f.xml.replace(SID, 'S-1-5-21-100-200-300-8888'))
    await assert.rejects(runScheduler([action], { ...f.dependencies, runCommand: fake.runCommand }), /SID/)
    assertOnlyQueries(fake)
  }
})

test('enable repeats local adapter preflight and refuses expired triggers', async t => {
  const f = fixture(t), fake = fakeTaskRunner(f.xml)
  writeFileSync(path.join(f.repoRoot, '.loop', 'config.local.json'), JSON.stringify({ adapter: null }))
  await assert.rejects(runScheduler(['enable'], { ...f.dependencies, runCommand: fake.runCommand }), /preflight/)
  assertOnlyQueries(fake)
  writeFileSync(path.join(f.repoRoot, '.loop', 'config.local.json'), JSON.stringify({ adapter: 'codex' }))
  await assert.rejects(runScheduler(['enable'], { ...f.dependencies, now: () => NOW + 60_000, runCommand: fake.runCommand }), /No future occurrence/)
  assertOnlyQueries(fake)
})

test('disable/remove work even with broken config and do not clear runner state or locks', async t => {
  const f = fixture(t)
  const artifactDir = path.join(f.repoRoot, 'artifacts', 'loop')
  mkdirSync(artifactDir, { recursive: true })
  const statePath = path.join(artifactDir, 'state.json'), lockPath = path.join(artifactDir, 'writer.lock')
  const state = JSON.stringify({ paused: true, status: 'BLOCKED', reason: 'owner must inspect' })
  writeFileSync(statePath, state)
  writeFileSync(lockPath, 'do not delete')
  writeFileSync(f.configFile, 'broken')
  const fake = fakeTaskRunner(f.xml), deps = { ...f.dependencies, runCommand: fake.runCommand }
  const status = await runScheduler(['status'], deps)
  assert.equal(status.runnerState.paused, true)
  await runScheduler(['disable'], deps)
  await runScheduler(['remove'], deps)
  assert.equal(readFileSync(statePath, 'utf8'), state)
  assert.equal(readFileSync(lockPath, 'utf8'), 'do not delete')
})

test('missing task status is honestly absent-or-unreadable; mutations refuse query errors', async t => {
  const f = fixture(t), fake = fakeTaskRunner()
  const deps = { ...f.dependencies, runCommand: fake.runCommand }
  assert.equal((await runScheduler(['status'], deps)).installed, null)
  for (const action of ['enable', 'disable', 'remove']) await assert.rejects(runScheduler([action], deps), /absent or unreadable/)
  assertOnlyQueries(fake)
})

test('OS failures are surfaced and never trigger fallback activation/replacement', async t => {
  const f = fixture(t)
  const calls = []
  const runCommand = async (_, args) => { calls.push(args); return { code: args[0] === '/Query' ? 0 : 5, stdout: args[0] === '/Query' ? f.xml : '', stderr: 'denied (fake)' } }
  await assert.rejects(runScheduler(['enable'], { ...f.dependencies, runCommand }), /failed \(5\)/)
  assert.equal(calls.length, 2)
  assert.equal(calls.some(args => args.includes('/Run')), false)
})

test('non-Windows mutating and status actions refuse while preview remains offline', async t => {
  const f = fixture(t), deps = { ...f.dependencies, platform: 'linux', runCommand: () => assert.fail('OS helper') }
  assert.equal((await runScheduler(['preview', '--delay-seconds', '60'], deps)).action, 'preview')
  for (const action of ['install', 'enable', 'status', 'disable', 'remove']) await assert.rejects(runScheduler(action === 'install' ? [action, '--delay-seconds', '60'] : [action], deps), /require Windows/)
})

test('identity helper uses fixed PowerShell 5 encoded source without path interpolation', async () => {
  const sid = await currentUserSid(async (executable, args) => {
    assert.equal(executable, tools.powershell)
    assert.equal(args[args.length - 2], '-EncodedCommand')
    const source = Buffer.from(args.at(-1), 'base64').toString('utf16le')
    assert.match(source, /WindowsIdentity/)
    assert.equal(source.includes('schtasks'), false)
    return { code: 0, stdout: SID, stderr: '' }
  }, tools)
  assert.equal(sid, SID)
  await assert.rejects(currentUserSid(async () => ({ code: 0, stdout: 'S-1-5-18' }), tools), /SYSTEM/)
  assert.equal(windowsTools({ SystemRoot: 'C:\\Windows' }).schtasks, 'C:\\Windows\\System32\\schtasks.exe')
  assert.match(windowsTools({ SystemRoot: 'C:\\Windows' }).powershell, /WindowsPowerShell\\v1\.0\\powershell\.exe$/)
  assert.throws(() => windowsTools({ SystemRoot: 'relative' }), /absolute/)
})

test('output decoder supports schtasks UTF-16, BOMless UTF-16, and UTF-8', () => {
  const value = '<Task>游戏</Task>'
  assert.equal(decodeOutput(Buffer.from('\uFEFF' + value, 'utf16le')), value)
  assert.equal(decodeOutput(Buffer.from(value, 'utf16le')), value)
  assert.equal(decodeOutput(Buffer.from(value, 'utf8')), value)
})

test('command runner passes shell:false and integer file descriptors, never pipes', async t => {
  const f = fixture(t)
  const result = await runFileCommand('FAKE.exe', ['literal & | %PATH%'], {
    tempRoot: f.dir,
    spawnImpl: (exe, args, options) => {
      assert.equal(exe, 'FAKE.exe')
      assert.deepEqual(args, ['literal & | %PATH%'])
      assert.equal(options.shell, false)
      assert.equal(options.stdio[0], 'ignore')
      assert.ok(options.stdio.slice(1).every(Number.isInteger))
      writeSync(options.stdio[1], 'stdout')
      writeSync(options.stdio[2], 'stderr')
      const child = new EventEmitter()
      process.nextTick(() => child.emit('close', 0, null))
      return child
    },
  })
  assert.deepEqual(result, { code: 0, signal: null, stdout: 'stdout', stderr: 'stderr' })
  assert.equal(readdirSync(f.dir).length, 1)
})

test('command runner failure and timeout clean only owned scratch files', async t => {
  const f = fixture(t)
  await assert.rejects(runFileCommand('FAKE.exe', [], { tempRoot: f.dir, spawnImpl: () => { throw new Error('spawn denied') } }), /spawn denied/)
  await assert.rejects(runFileCommand('FAKE.exe', [], {
    tempRoot: f.dir, timeoutMs: 1,
    spawnImpl: () => {
      const child = new EventEmitter()
      child.kill = () => { process.nextTick(() => child.emit('close', 1, null)); return true }
      return child
    },
  }), /timed out/)
  assert.equal(readdirSync(f.dir).length, 1)
})

test('equivalent exported repetition durations preserve minute bounds', t => {
  const f = fixture(t)
  const plan = makePlan(parseArgs(['--delay-seconds', '60', '--interval-minutes', '60', '--until', '2030-01-05T00:00:00Z']), { ...f.dependencies, now: NOW })
  const xml = buildTaskXml(plan, SID)
  for (const duration of ['PT1H', 'PT3600S', 'PT0H60M']) assert.equal(readOwnedTask(xml.replace('PT60M', duration), f.dependencies).intervalMinutes, 60)
  assert.equal(readOwnedTask(xml.replace('PT60M', 'P1D'), f.dependencies).intervalMinutes, 1440)
  for (const duration of ['PT1S', 'P32D', 'P', 'PT0M']) assert.throws(() => readOwnedTask(xml.replace('PT60M', duration), f.dependencies))
  assert.throws(() => readOwnedTask(xml.replace(/\s*<EndBoundary>[^<]+<\/EndBoundary>/, ''), f.dependencies), /finite end/)
})

test('accepts Task Scheduler normalized exports that omit default-valued elements', t => {
  const f = fixture(t)
  const plan = makePlan(parseArgs(['--delay-seconds', '60', '--interval-minutes', '60', '--until', '2030-01-05T00:00:00Z']), { ...f.dependencies, now: NOW })
  // Mirror a live schtasks /XML export: PT60M becomes PT1H, UTC boundaries become
  // offset timestamps, and default-valued elements are dropped entirely.
  const xml = buildTaskXml(plan, SID)
    .replace('PT60M', 'PT1H')
    .replace('2030-01-02T03:05:05.000Z', '2030-01-01T20:05:05-07:00')
    .replace('2030-01-05T00:00:00.000Z', '2030-01-04T17:00:00-07:00')
    .replace(/\s*<RunLevel>LeastPrivilege<\/RunLevel>/, '')
    .replace(/\s*<StartWhenAvailable>false<\/StartWhenAvailable>/, '')
    .replace(/\s*<WakeToRun>false<\/WakeToRun>/, '')
    .replace(/\s*<Enabled>true<\/Enabled>/, '')
    .replace(/\s*<StopAtDurationEnd>false<\/StopAtDurationEnd>/, '')
  const owned = readOwnedTask(xml, f.dependencies)
  assert.equal(owned.intervalMinutes, 60)
  assert.equal(owned.enabled, false)
  assert.equal(owned.start, '2030-01-01T20:05:05-07:00')
  assert.equal(owned.end, '2030-01-04T17:00:00-07:00')
  // Omitted task-level Enabled means the schema default: enabled.
  assert.equal(readOwnedTask(xml.replace(/\s*<Enabled>false<\/Enabled>/, ''), f.dependencies).enabled, true)
  assert.equal(readOwnedTask(xml.replace('<Enabled>false</Enabled>', '<Enabled>true</Enabled>'), f.dependencies).enabled, true)
  // Present insecure values are still refused even in normalized exports.
  for (const insecure of [
    xml.replace('</LogonType>', '</LogonType><RunLevel>HighestAvailable</RunLevel>'),
    xml.replace('</Settings>', '<StartWhenAvailable>true</StartWhenAvailable></Settings>'),
    xml.replace('</Settings>', '<WakeToRun>true</WakeToRun></Settings>'),
    xml.replace('</TimeTrigger>', '<Enabled>false</Enabled></TimeTrigger>'),
    xml.replace('</Repetition>', '<StopAtDurationEnd>true</StopAtDurationEnd></Repetition>'),
  ]) assert.throws(() => readOwnedTask(insecure, f.dependencies))
})

test('installation refuses missing executor and a start elapsed during preflight', async t => {
  const f = fixture(t)
  const fake = fakeTaskRunner()
  let tick = 0
  await assert.rejects(runScheduler(['install', '--delay-seconds', '60', '--interval-minutes', '5', '--until', '2030-01-03T00:00:00Z'], {
    ...f.dependencies, now: () => tick++ === 0 ? NOW : NOW + 60_000, runCommand: fake.runCommand,
  }), /start expired/)
  assertOnlyQueries(fake)
  const missing = fixture(t, { executor: false })
  assert.equal(existsSync(missing.plan.runnerPath), false, 'Missing stub executor must be absent')
  await assert.rejects(runScheduler(['install', '--delay-seconds', '60'], { ...missing.dependencies, runCommand: () => assert.fail('Missing executor must not query OS') }), /executor must exist/)
})

test('enable uses only the installed explicit config even if default local adapter changes', async t => {
  const f = fixture(t)
  const plan = makePlan(parseArgs(['--delay-seconds', '60', '--config', f.configFile]), { ...f.dependencies, now: NOW })
  writeFileSync(path.join(f.repoRoot, '.loop', 'config.local.json'), JSON.stringify({ adapter: null }))
  const fake = fakeTaskRunner(buildTaskXml(plan, SID))
  await runScheduler(['enable'], { ...f.dependencies, runCommand: fake.runCommand })
  assert.equal(readOwnedTask(fake.xml, f.dependencies).enabled, true)
})

test('failed installation cleans scratch XML and never retries with overwrite or elevation', async t => {
  const f = fixture(t), calls = []
  await assert.rejects(runScheduler(['install', '--delay-seconds', '60'], {
    ...f.dependencies,
    runCommand: async (_, args) => { calls.push(args); return { code: 5, stdout: '', stderr: 'access denied (fake)' } },
  }), /installation failed/)
  assert.equal(calls.length, 2)
  assert.equal(calls[1][0], '/Create')
  assert.equal(calls[1].includes('/F'), false)
  assert.equal(readdirSync(f.dir).length, 1)
})

test('malformed base configuration cannot be hidden by local overlay', t => {
  const f = fixture(t)
  writeFileSync(f.configFile, JSON.stringify({ version: 2, adapter: null }))
  writeFileSync(path.join(f.repoRoot, '.loop', 'config.local.json'), JSON.stringify({ version: 1, adapter: 'codex' }))
  assert.equal(adapterPreflight(f.repoRoot).ok, false)
})

test('actual scheduler CLI defaults safely and returns nonzero for invalid arguments', async t => {
  const f = fixture(t), script = fileURLToPath(new URL('./schedule-loop.mjs', import.meta.url))
  const help = await runFileCommand(process.execPath, [script], { cwd: f.repoRoot, tempRoot: f.dir })
  assert.equal(help.code, 0)
  assert.match(help.stdout, /Omitted action means preview/)
  const invalid = await runFileCommand(process.execPath, [script, '--not-an-option'], { cwd: f.repoRoot, tempRoot: f.dir })
  assert.equal(invalid.code, 1)
  assert.match(invalid.stderr, /Unknown option/)
})

test('CLI contract launches exactly one stub iteration with absolute paths, no shell', async t => {
  const f = fixture(t)
  const args = actionArgs(f.plan.runnerPath, f.configFile)
  const result = await runFileCommand(process.execPath, args, { cwd: f.repoRoot, tempRoot: f.dir })
  assert.equal(result.code, 0, result.stderr)
  const observed = JSON.parse(result.stdout)
  assert.deepEqual(observed.argv, ['--scheduled', '--iterations', '1', '--config', f.configFile])
  assert.equal(observed.cwd, f.repoRoot)
})
