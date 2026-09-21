#!/usr/bin/env node
// Run directly, NOT with node --test: the test runner's isolation uses named pipes.
// Every spawned process redirects output to real files. Never calls live models.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers';
import { parseArgs, validateConfig, DEFAULTS, loadConfig, waitMilliseconds } from './loop/config.mjs';
import { parseReport, acquireLock, pathsFor } from './loop/storage.mjs';
import { prepareAdapter, resolveCodex } from './loop/adapters.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testRoot = path.join(repoRoot, 'artifacts/loop-tests', `${Date.now()}-${randomUUID()}`);
fs.mkdirSync(testRoot, { recursive: true });
console.log(`Offline fixture evidence: ${testRoot}`);
const fakeSource = `import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const [requestFile, resultFile, ...args] = process.argv.slice(2);
const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
const callsFile = path.join(request.repoRoot, 'calls.jsonl');
const calls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf8').trim().split('\\n').filter(Boolean).length : 0;
fs.appendFileSync(callsFile, JSON.stringify({request, args, cwd:process.cwd(), input:fs.readFileSync(request.inputFile,'utf8')})+'\\n');
const outcomes = JSON.parse(fs.readFileSync(path.join(request.repoRoot,'outcomes.json'),'utf8'));
const outcome = outcomes[Math.min(calls,outcomes.length-1)];
console.log('Transcript intentionally contains misleading LOOP_RESULT: REGRESSION');
console.error('Fake stderr only — 中文');
if(outcome==='EXIT') process.exit(7);
if(outcome==='MISSING') process.exit(0);
if(outcome==='HANG' || outcome==='TREE') {
  if(outcome==='TREE') {
    const child=spawn(process.execPath,['-e','setTimeout(()=>{},4000)'],{stdio:'ignore',shell:false});
    fs.writeFileSync(path.join(request.repoRoot,'descendant.pid'),String(child.pid));
  }
  fs.writeFileSync(path.join(request.repoRoot,'started.json'),JSON.stringify({pid:process.pid}));
  // A denied cleanup must still leave a bounded fixture, never an orphan.
  setTimeout(()=>{},4000);
} else {
  const special={INVALID:'No status',DUPLICATE:'LOOP_RESULT: COMPLETED\\nLOOP_RESULT: IDLE',TRAILING:'LOOP_RESULT: IDLE\\nextra',INDENT:' LOOP_RESULT: IDLE',FENCED:'\\x60\\x60\\x60text\\nLOOP_RESULT: IDLE',UNKNOWN:'LOOP_RESULT: UNKNOWN'};
  fs.writeFileSync(resultFile,special[outcome]??('Fixture evidence — 中文\\nLOOP_RESULT: '+outcome+'\\n\\n'));
}
`;
let count = 0;
function fixture(outcomes = ['COMPLETED'], override = {}) {
  const root = path.join(testRoot, `${++count}-fixture with spaces 中文`);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, '.loop'), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'scripts/run-loop.mjs'), path.join(root, 'scripts/run-loop.mjs'));
  fs.mkdirSync(path.join(root, 'scripts/loop'));
  // Explicit byte copy also works in Windows sandbox hosts whose recursive-copy
  // implementation mangles non-ASCII destination directory names.
  for (const name of fs.readdirSync(path.join(repoRoot, 'scripts/loop'))) {
    fs.writeFileSync(path.join(root, 'scripts/loop', name), fs.readFileSync(path.join(repoRoot, 'scripts/loop', name)));
  }
  for (const name of ['AGENTS.md', 'PROJECT.md', 'TASKS.md', 'PROGRESS.md']) fs.writeFileSync(path.join(root, name), `${name}: Fixture only — 中文`);
  for (const name of ['continue.md', 'loop.md', 'eval-loop.md']) fs.writeFileSync(path.join(root, '.loop', name), `Selected prompt ${name} — 中文`);
  fs.writeFileSync(path.join(root, 'fake adapter 中文.mjs'), fakeSource);
  fs.writeFileSync(path.join(root, 'outcomes.json'), JSON.stringify(outcomes));
  const config = { ...DEFAULTS, adapter: 'fake', adapters: { fake: {
    executable: process.execPath,
    args: [path.join(root, 'fake adapter 中文.mjs'), '{requestFile}', '{resultFile}', 'argument with spaces', '中文', '& echo NOT_SHELL', 'quote"value'],
  } }, ...override };
  fs.writeFileSync(path.join(root, '.loop/config.json'), JSON.stringify(config, null, 2));
  return root;
}
function calls(root) {
  const file = path.join(root, 'calls.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
}
function state(root) { return JSON.parse(fs.readFileSync(path.join(root, 'artifacts/loop/state.json'), 'utf8')); }
function launch(root, args = [], script = 'run-loop.mjs') {
  const output = path.join(root, `cli-${randomUUID()}.log`);
  const fd = fs.openSync(output, 'wx');
  const child = spawn(process.execPath, [path.join(root, 'scripts', script), ...args], {
    cwd: testRoot, shell: false, windowsHide: true, stdio: ['ignore', fd, fd],
  });
  const done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => { fs.closeSync(fd); resolve({ code, signal, output: fs.readFileSync(output, 'utf8') }); });
  });
  return { child, done };
}
async function run(root, args = [], expected = 0, script = 'run-loop.mjs') {
  const result = await launch(root, args, script).done;
  assert.equal(result.code, expected, result.output);
  return result;
}
function snapshot(root) {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [[path.relative(root, file), fs.readFileSync(file).toString('base64')]];
  });
  return walk(root).filter(([name]) => !name.startsWith('cli-')).sort(([a], [b]) => a.localeCompare(b));
}
async function waitForExit(pid, milliseconds = 8000) {
  const end = Date.now() + milliseconds;
  while (true) {
    try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') return; throw error; }
    if (Date.now() >= end) throw new Error(`Fixture process ${pid} did not exit; manual review required`);
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}
async function waitFor(file, milliseconds = 4000) {
  const end = Date.now() + milliseconds;
  while (!fs.existsSync(file)) {
    if (Date.now() >= end) throw new Error(`Timed out waiting for fixture ${file}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

after(async () => {
  // Runs even after an assertion failure: collect all bounded hang fixtures.
  for (const entry of fs.readdirSync(testRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const root = path.join(testRoot, entry.name);
    const started = path.join(root, 'started.json');
    const descendant = path.join(root, 'descendant.pid');
    if (fs.existsSync(descendant)) await waitForExit(Number(fs.readFileSync(descendant, 'utf8')));
    if (fs.existsSync(started)) await waitForExit(JSON.parse(fs.readFileSync(started, 'utf8')).pid);
  }
  console.log('All bounded timeout/cancellation fixture processes collected; none remain.');
});

test('CLI and config validation enforce bounds and reject unknown/ambiguous settings', () => {
  for (const argv of [
    ['--iterations', '0'], ['--iterations', '1001'], ['--iterations', '1.5'], ['--iterations', 'NaN'],
    ['--timeout-seconds', '0'], ['--interval-seconds', '-1'], ['--delay-seconds', '86401'],
    ['--mode', 'other'], ['--model', ''], ['--start-at', '2026-10-01T12:00:00'],
  ]) assert.throws(() => validateConfig({ ...DEFAULTS, ...parseArgs(argv) }));
  for (const argv of [['--unknown'], ['--mode'], ['--mode', 'Auto', '--mode', 'Producer'], ['--status', '--resume'], ['--resume', '--adapter', 'x'], ['--recover-lock'], ['--confirm-no-live-writers'], ['--delay-seconds', '1', '--start-at', '2026-10-01T00:00:00Z'], ['--scheduled', '--iterations', '2'], ['--scheduled', '--delay-seconds', '0']]) assert.throws(() => parseArgs(argv));
  assert.throws(() => validateConfig({ version: 2 }));
  assert.throws(() => validateConfig({ version: 1, unexpected: true }));
  assert.throws(() => validateConfig({ version: 1, adapters: { x: { executable: 'node', args: ['{requestFile}'] } } }));
  assert.throws(() => validateConfig({ version: 1, adapters: { x: { executable: 'node', args: ['{requestFile}', '{resultFile}', '{shell}'] } } }));
  assert.equal(validateConfig({ version: 1, mode: 'pRoDuCeR', iterations: 1000 }).mode, 'Producer');
  assert.throws(() => waitMilliseconds({ startAt: new Date(Date.now() + 86401000).toISOString() }));
  assert.throws(() => waitMilliseconds({ startAt: '2001-01-01T00:00:00+08:00' }), /future/);
  assert.throws(() => validateConfig({ version: 1, startAt: '2026-02-30T00:00:00Z' }), /calendar/);
});

test('strict report parsing accepts only exactly one marker on final nonempty line', () => {
  for (const marker of ['COMPLETED', 'IN_PROGRESS', 'IDLE', 'BLOCKED', 'REGRESSION']) assert.equal(parseReport(`Evidence\r\nLOOP_RESULT: ${marker}\r\n\r\n`), marker);
  for (const report of ['', 'LOOP_RESULT: unknown', ' LOOP_RESULT: IDLE', 'LOOP_RESULT: IDLE ', 'LOOP_RESULT: IDLE\ntext', 'LOOP_RESULT: IDLE\nLOOP_RESULT: IDLE', 'Quoted LOOP_RESULT: IDLE\nLOOP_RESULT: IDLE', '```\nLOOP_RESULT: IDLE']) assert.throws(() => parseReport(report));
  assert.equal(parseReport('```\nCode evidence\n```\nLOOP_RESULT: IDLE'), 'IDLE');
});

test('dry run with unset adapter has no filesystem/model side effects', async () => {
  const root = fixture(['COMPLETED'], { adapter: null, adapters: {} });
  const before = snapshot(root);
  const result = await run(root, ['--dry-run', '--iterations', '5']);
  assert.match(result.output, /Adapter not configured; execution disabled/);
  assert.deepEqual(snapshot(root), before);
  assert.equal(calls(root).length, 0);
  assert.equal(fs.existsSync(path.join(root, 'artifacts')), false);
});

test('status works without adapter or config, resume clears only runner pause', async () => {
  const root = fixture();
  fs.unlinkSync(path.join(root, '.loop/config.json'));
  const before = snapshot(root);
  await run(root, ['--status']);
  assert.deepEqual(snapshot(root), before);
  const p = pathsFor(root);
  fs.mkdirSync(p.directory, { recursive: true });
  fs.writeFileSync(p.state, JSON.stringify({ version: 1, paused: true, pauseReason: 'BLOCKED', activeRun: null, lastRun: { result: 'BLOCKED', runId: 'keep' } }));
  const tasks = fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8');
  await run(root, ['--status'], 2);
  await run(root, ['--resume']);
  assert.equal(state(root).paused, false);
  assert.equal(state(root).lastRun.runId, 'keep');
  assert.equal(fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8'), tasks);
  assert.equal(calls(root).length, 0);
});

test('default one Auto iteration uses repository cwd and literal Unicode/space argv', async () => {
  const root = fixture();
  await run(root);
  const [call] = calls(root);
  assert.equal(calls(root).length, 1);
  assert.equal(call.cwd, root);
  assert.equal(call.request.version, 1);
  assert.equal(call.request.model, null);
  assert.equal(call.request.mode, 'Auto');
  assert.equal(call.request.promptFile, path.join(root, '.loop/continue.md'));
  assert.match(call.input, /AGENTS.md: Fixture only — 中文/);
  assert.match(call.input, /Selected prompt continue.md — 中文/);
  assert.deepEqual(call.args, ['argument with spaces', '中文', '& echo NOT_SHELL', 'quote"value']);
  assert.equal(state(root).lastRun.result, 'COMPLETED');
  assert.equal(Object.hasOwn(JSON.parse(fs.readFileSync(state(root).lastRun.metadataPath, 'utf8')), 'args'), false);
  assert.equal(state(root).paused, false);
  const files = fs.readdirSync(path.join(root, 'artifacts/loop'));
  for (const suffix of ['.request.json', '.metadata.json', '.report.md', '.stdout.log', '.stderr.log', '.input.md']) assert.equal(files.filter((name) => name.endsWith(suffix)).length, 1);
  assert.equal(fs.existsSync(pathsFor(root).lock), false);
});

test('modes/model are forwarded case-insensitively without vendor assumptions', async () => {
  for (const [mode, prompt] of [['consumer', 'loop.md'], ['pRoDuCeR', 'eval-loop.md']]) {
    const root = fixture();
    await run(root, ['--mode', mode, '--model', 'local model 中文']);
    const call = calls(root)[0];
    assert.equal(path.basename(call.request.promptFile), prompt);
    assert.equal(call.request.model, 'local model 中文');
  }
});

test('bounded batches continue success/in-progress, preserve unique evidence', async () => {
  const root = fixture(['IN_PROGRESS', 'COMPLETED', 'IDLE']);
  await run(root, ['--iterations', '8', '--interval-seconds', '0.01']);
  assert.equal(calls(root).length, 3);
  assert.equal(new Set(calls(root).map((call) => call.request.reportPath)).size, 3);
  assert.equal(state(root).lastRun.result, 'IDLE');
  assert.equal(state(root).paused, false);
  await run(root, ['--scheduled', '--iterations', '1']);
  assert.equal(calls(root).length, 4, 'IDLE must not disable future occurrences');
});

test('BLOCKED and REGRESSION persist pause across future scheduled calls', async () => {
  for (const outcome of ['BLOCKED', 'REGRESSION']) {
    const root = fixture([outcome, 'COMPLETED']);
    await run(root, ['--iterations', '5'], 2);
    assert.equal(calls(root).length, 1);
    assert.equal(state(root).paused, true);
    await run(root, ['--scheduled'], 2);
    await run(root, ['--status'], 2);
    assert.equal(calls(root).length, 1);
    await run(root, ['--resume']);
    await run(root);
    assert.equal(calls(root).length, 2);
    assert.equal(state(root).paused, false);
  }
});

test('nonzero exit/missing report/malformed markers pause without transcript fallback', async () => {
  for (const outcome of ['EXIT', 'MISSING', 'INVALID', 'DUPLICATE', 'TRAILING', 'INDENT', 'FENCED', 'UNKNOWN']) {
    const root = fixture([outcome]);
    await run(root, ['--iterations', '4'], 1);
    assert.equal(calls(root).length, 1, outcome);
    assert.equal(state(root).paused, true, outcome);
    assert.equal(state(root).lastRun.result, 'UNKNOWN', outcome);
    await run(root, ['--scheduled'], 2);
    assert.equal(calls(root).length, 1, outcome);
  }
});

test('default local overlay and explicit config precedence; scheduled cadence is authoritative', async () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, '.loop/config.local.json'), JSON.stringify({ model: 'overlay', iterations: 7, intervalSeconds: 5, delaySeconds: 30 }));
  const normal = loadConfig(root, {});
  assert.equal(normal.config.model, 'overlay');
  assert.equal(normal.config.iterations, 7);
  await run(root, ['--scheduled']);
  assert.equal(calls(root).length, 1);
  assert.equal(calls(root)[0].request.model, 'overlay');
  assert.equal(calls(root)[0].request.scheduled, true);
  await run(root, ['--config', path.join(root, '.loop/config.json'), '--model', 'CLI']);
  assert.equal(calls(root).at(-1).request.model, 'CLI');
  assert.equal(loadConfig(root, { config: '.loop/config.json' }).config.model, null);
});

test('unset adapter and partial launch failures pause and release owned lock', async () => {
  const root = fixture([], { adapter: null, adapters: {} });
  await run(root, [], 1);
  assert.match(state(root).pauseReason, /not configured/);
  assert.equal(fs.existsSync(pathsFor(root).lock), false);
  const missing = fixture(['COMPLETED']);
  const config = loadConfig(missing, {}).config;
  config.adapters.fake.executable = path.join(missing, 'missing-executable');
  fs.writeFileSync(path.join(missing, '.loop/config.json'), JSON.stringify(config));
  await run(missing, [], 1);
  assert.equal(state(missing).paused, true);
  assert.equal(calls(missing).length, 0);
  assert.equal(fs.existsSync(pathsFor(missing).lock), false);
});

test('atomic exclusive lock never steals stale, partial, live, or changed-owner locks', async () => {
  for (const content of ['', '{partial', JSON.stringify({ version: 1, nonce: 'stale', pid: 2147483647, hostname: os.hostname(), createdAt: '2000-01-01' })]) {
    const root = fixture();
    const p = pathsFor(root);
    fs.mkdirSync(p.directory, { recursive: true });
    fs.writeFileSync(p.lock, content);
    await run(root, [], 3);
    assert.equal(fs.readFileSync(p.lock, 'utf8'), content);
    await run(root, ['--recover-lock'], 1);
    assert.equal(fs.readFileSync(p.lock, 'utf8'), content);
    await run(root, ['--recover-lock', '--confirm-no-live-writers']);
    assert.equal(state(root).paused, true);
    await run(root, [], 2);
    await run(root, ['--resume']);
    await run(root);
  }
  const root = fixture();
  const p = pathsFor(root);
  const lock = acquireLock(p, root);
  await run(root, [], 3);
  await run(root, ['--recover-lock', '--confirm-no-live-writers'], 3);
  fs.writeFileSync(p.lock, JSON.stringify({ ...lock.owner, nonce: 'different-owner' }));
  assert.throws(() => lock.release(), /owner changed/);
  assert.equal(JSON.parse(fs.readFileSync(p.lock, 'utf8')).nonce, 'different-owner');
});

test('live active adapter evidence prevents recovery and resume even without live runner', async () => {
  const root = fixture();
  const p = pathsFor(root);
  fs.mkdirSync(p.directory, { recursive: true });
  fs.writeFileSync(p.lock, JSON.stringify({ version: 1, nonce: 'stale-runner', pid: 2147483647, hostname: os.hostname() }));
  fs.writeFileSync(p.state, JSON.stringify({ version: 1, paused: true, pauseReason: 'UNKNOWN', activeRun: { pid: process.pid, runId: 'live-adapter' }, lastRun: null }));
  await run(root, ['--recover-lock', '--confirm-no-live-writers'], 3);
  assert.equal(fs.existsSync(p.lock), true);
  fs.unlinkSync(p.lock); // Test-only corruption simulates an owner deleting a live lock.
  await run(root, ['--resume'], 3);
  assert.equal(state(root).activeRun.pid, process.pid);
  assert.equal(state(root).paused, true);
  assert.equal(calls(root).length, 0);
});

test('scheduled adapters cannot inherit interactive stdin', async () => {
  const root = fixture();
  const config = loadConfig(root, {}).config;
  config.adapters.fake.inheritStdin = true;
  fs.writeFileSync(path.join(root, '.loop/config.json'), JSON.stringify(config));
  await run(root, ['--scheduled'], 1);
  assert.match(state(root).pauseReason, /inheritStdin/);
  assert.equal(calls(root).length, 0);
});

test('unknown active state and malformed persistent state never trigger a model', async () => {
  const root = fixture();
  const p = pathsFor(root);
  fs.mkdirSync(p.directory, { recursive: true });
  fs.writeFileSync(p.state, JSON.stringify({ version: 1, paused: false, activeRun: { runId: 'interrupted' }, lastRun: null }));
  await run(root, [], 2);
  assert.equal(calls(root).length, 0);
  assert.equal(state(root).paused, true);
  await run(root, ['--resume']);
  assert.equal(state(root).lastRun.result, 'UNKNOWN');
  fs.writeFileSync(p.state, '{broken');
  await run(root, [], 1);
  await run(root, ['--status'], 1);
  assert.equal(fs.readFileSync(p.state, 'utf8'), '{broken');
  assert.equal(calls(root).length, 0);
});

test('delays are bounded and start-at requires explicit offset', async () => {
  const root = fixture();
  const start = Date.now();
  await run(root, ['--delay-seconds', '0.08']);
  assert.ok(Date.now() - start >= 80);
  await run(root, ['--start-at', new Date(Date.now() + 250).toISOString()]);
  await run(root, ['--start-at', '2001-01-01T08:00:00+08:00'], 1);
  await run(root, ['--resume']);
  const before = calls(root).length;
  await run(root, ['--start-at', '2026-10-01T12:00:00'], 1);
  assert.equal(calls(root).length, before);
});

test('timeouts stop adapter trees or retain lock when cleanup cannot be proven', async () => {
  const root = fixture(['TREE']);
  const started = Date.now();
  await run(root, ['--timeout-seconds', '0.6'], 1);
  assert.ok(Date.now() - started < 10000);
  assert.equal(calls(root).length, 1);
  assert.equal(state(root).paused, true);
  const metadataPath = state(root).lastRun.metadataPath;
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  assert.equal(metadata.execution.timedOut, true);
  assert.equal(fs.existsSync(pathsFor(root).lock), !metadata.execution.cleanupCertain);
  const pid = Number(fs.readFileSync(path.join(root, 'descendant.pid'), 'utf8'));
  if (metadata.execution.cleanupCertain) assert.throws(() => process.kill(pid, 0), /ESRCH/);
  // On restrictive hosts taskkill may be denied. Preserve the lock assertion,
  // but collect both bounded fake processes after their natural self-expiry.
  await waitForExit(pid);
  await waitForExit(metadata.pid);
});

test('overlap while running is rejected; cancellation pauses and cleans up', async () => {
  const root = fixture(['HANG']);
  // Emit the actual runner signal handler inside its process, portably on Windows:
  // process.kill(SIGTERM) on Windows forcibly exits rather than delivering a handler.
  fs.writeFileSync(path.join(root, 'scripts/cancel-run.mjs'), `import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';import{main}from'./loop/runner.mjs';const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const timer=setInterval(()=>{if(fs.existsSync(path.join(root,'cancel.now'))){clearInterval(timer);process.emit('SIGTERM');}},20);process.exitCode=await main(process.argv.slice(2),root);clearInterval(timer);`);
  const active = launch(root, ['--timeout-seconds', '10'], 'cancel-run.mjs');
  let result;
  try {
    await waitFor(path.join(root, 'started.json'));
    await run(root, [], 3);
    await run(root, ['--recover-lock', '--confirm-no-live-writers'], 3);
  } finally {
    fs.writeFileSync(path.join(root, 'cancel.now'), 'cancel');
    result = await active.done;
  }
  assert.equal(result.code, 1, result.output);
  const metadata = JSON.parse(fs.readFileSync(state(root).lastRun.metadataPath, 'utf8'));
  assert.equal(metadata.execution.cancelled, true);
  assert.equal(state(root).paused, true);
  assert.equal(fs.existsSync(pathsFor(root).lock), !metadata.execution.cleanupCertain);
  await waitForExit(metadata.pid);
});

test('cancellation during pre-start delay makes no adapter call', async () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, 'scripts/cancel-delay.mjs'), `import path from'node:path';import{fileURLToPath}from'node:url';import{main}from'./loop/runner.mjs';const timer=setTimeout(()=>process.emit('SIGINT'),80);process.exitCode=await main(['--delay-seconds','20'],path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));clearTimeout(timer);`);
  const result = await run(root, [], 1, 'cancel-delay.mjs');
  assert.match(result.output, /no writer lock held/);
  assert.match(result.output, /Runner cancelled/);
  assert.equal(calls(root).length, 0);
  assert.equal(fs.existsSync(pathsFor(root).state), false);
  assert.equal(fs.existsSync(pathsFor(root).lock), false);
  assert.equal(fs.existsSync(path.join(root, 'artifacts')), false);
});

test('Codex is optional, safe flags fixed, actual npm JS resolved without shell shim', async () => {
  const root = fixture();
  const bin = path.join(root, 'fake npm bin 中文');
  const entry = path.join(bin, 'node_modules/@openai/codex/bin/codex.js');
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  fs.writeFileSync(entry, `const fs=require('node:fs');const args=process.argv.slice(2);const result=args[args.indexOf('--output-last-message')+1];fs.writeFileSync('codex-call.json',JSON.stringify({args,input:fs.readFileSync(0,'utf8')}));fs.writeFileSync(result,'Offline fake Codex only\\nLOOP_RESULT: IDLE\\n');`);
  fs.writeFileSync(path.join(bin, 'codex.cmd'), '@echo MUST NOT RUN');
  const resolved = resolveCodex(root, undefined, { PATH: bin });
  assert.equal(resolved.executable, process.execPath);
  assert.equal(resolved.args[0], entry);
  const config = { ...DEFAULTS, adapter: 'codex', model: 'fake-model', adapters: { codex: { executable: entry } } };
  fs.writeFileSync(path.join(root, '.loop/config.json'), JSON.stringify(config));
  await run(root, ['--adapter', 'codex']);
  const call = JSON.parse(fs.readFileSync(path.join(root, 'codex-call.json'), 'utf8'));
  for (const arg of ['workspace-write', 'approval_policy="never"', 'sandbox_workspace_write.network_access=false', 'fake-model']) assert.ok(call.args.includes(arg), arg);
  assert.equal(call.args.at(-1), '-');
  assert.match(call.input, /AGENTS.md/);
  assert.match(call.input, /Selected prompt continue.md/);
  assert.equal(state(root).lastRun.result, 'IDLE');
  assert.throws(() => resolveCodex(root, path.join(bin, 'codex.cmd')), /Shell shims/);
  assert.throws(() => prepareAdapter({ ...DEFAULTS, adapter: 'x', adapters: { x: { executable: 'x.cmd', args: ['{requestFile}', '{resultFile}'] } } }, root)({ reportPath: 'result' }, 'request'), /Shell shims/);
});
