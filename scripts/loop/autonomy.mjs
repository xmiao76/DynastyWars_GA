// Bounded autonomy: task readiness, conservative result classification and quiet waits.
// This module grants no spending, waiver, permission, scheduler or lock authority.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const TASK_ID = /^[A-Z][A-Z0-9]*-\d+[A-Z]?$/;
const KINDS = ['RECOVERABLE', 'WAITING_FOR_OWNER', 'WAITING_FOR_PROVIDER', 'SAFETY_STOP'];
const sha = (text) => createHash('sha256').update(text).digest('hex');
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, label) => { if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new Error(`autonomy: invalid ${label}`); };

export function safeRelative(file) {
  if (typeof file !== 'string' || !file || file.includes('\\') || file.includes(':') || file.startsWith('/') || file.split('/').some(s => !s || s === '.' || s === '..')) throw new Error('autonomy: input path must be repository-relative');
  if (/(^|\/)(\.env[^/]*|secrets|credentials|auth\.json)(\/|$)/i.test(file)) throw new Error('autonomy: sensitive input path refused');
  return file;
}

export function loadAutonomy(repoRoot) {
  const file = path.join(repoRoot, '.loop/autonomy.json');
  if (!fs.existsSync(file)) return null; // old profiles retain old behavior
  const config = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!object(config) || config.version !== 1 || config.enabled !== true) throw new Error('autonomy: invalid version/enabled configuration');
  const allowed = ['version', 'enabled', 'watchInputs', 'maxFailedRecoveries', 'taskTimeboxMinutes', 'runbook'];
  if (Object.keys(config).some(k => !allowed.includes(k))) throw new Error('autonomy: unknown configuration field');
  if (!Array.isArray(config.watchInputs) || config.watchInputs.length > 30 || new Set(config.watchInputs).size !== config.watchInputs.length) throw new Error('autonomy: invalid watchInputs');
  config.watchInputs.forEach(safeRelative);
  if (config.maxFailedRecoveries !== 3 || !Number.isInteger(config.taskTimeboxMinutes) || config.taskTimeboxMinutes < 5 || config.taskTimeboxMinutes > 25) throw new Error('autonomy: recovery cap is three; timebox must be 5..25 minutes');
  safeRelative(config.runbook);
  if (!fs.statSync(path.join(repoRoot, config.runbook)).isFile()) throw new Error('autonomy: versioned runbook missing');
  return config;
}

/** Explicit Requires wins over legacy prose. Malformed/cyclic dependencies fail closed. */
export function parseQueue(source) {
  const parts = source.replace(/^\uFEFF/, '').split(/^### /m).slice(1);
  const tasks = parts.map(block => {
    const heading = /^(\S+) - ([^\r\n]+)/.exec(block);
    const statuses = [...block.matchAll(/^- Status: (TODO|IN_PROGRESS|BLOCKED|DONE)\b/gm)];
    if (!heading || !TASK_ID.test(heading[1]) || statuses.length !== 1) throw new Error('autonomy: malformed queue task/status');
    const requires = /^- Requires: (.*)$/m.exec(block)?.[1]?.trim();
    let dependencies;
    if (requires !== undefined) {
      dependencies = requires === 'none' ? [] : requires.split(',').map(id => id.trim());
      if (dependencies.some(id => !TASK_ID.test(id))) throw new Error(`autonomy: invalid Requires for ${heading[1]}`);
    } else {
      const legacy = /^- Dependenc(?:y|ies): ([^\r\n]+)/m.exec(block)?.[1] ?? '';
      dependencies = [...legacy.matchAll(/\b([A-Z][A-Z0-9]*-\d+[A-Z]?)\b/g)].map(m => m[1]);
    }
    return { id: heading[1], title: heading[2], status: statuses[0][1], dependencies: [...new Set(dependencies)], sourceHash: sha(block) };
  });
  const byId = new Map(tasks.map(task => [task.id, task]));
  if (byId.size !== tasks.length) throw new Error('autonomy: duplicate queue task');
  for (const task of tasks.filter(t => t.status !== 'DONE')) for (const id of task.dependencies) {
    if (!byId.has(id)) throw new Error(`autonomy: unknown prerequisite ${id} for ${task.id}; keep a compact DONE milestone`);
  }
  const active = new Set(), visited = new Set();
  function visit(task) {
    if (active.has(task.id)) throw new Error('autonomy: cyclic queue prerequisites');
    if (visited.has(task.id)) return;
    active.add(task.id);
    for (const id of task.dependencies) if (byId.has(id)) visit(byId.get(id));
    active.delete(task.id); visited.add(task.id);
  }
  tasks.forEach(visit);
  return tasks;
}

export function queueFingerprint(repoRoot, config, extra = []) {
  const files = [...new Set([...config.watchInputs, ...extra])].sort();
  return sha(JSON.stringify(files.map(file => {
    safeRelative(file);
    const resolved = path.join(repoRoot, file);
    // Refuse links in every component, not only the final file: no external
    // or credential reads through a linked directory.
    let current = repoRoot;
    for (const part of file.split('/')) {
      current = path.join(current, part);
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('autonomy: watched input uses a symbolic link');
    }
    if (!fs.existsSync(resolved)) return [file, 'missing'];
    const info = fs.lstatSync(resolved);
    if (!info.isFile()) throw new Error('autonomy: watched input is not a regular file');
    return [file, sha(fs.readFileSync(resolved))];
  })));
}

/** Never trust historical DUE NOW mentions or old fixed findings as current cadence. */
export function reviewDue(repoRoot) {
  const file = path.join(repoRoot, 'docs/UI_REVIEW_LEDGER.md');
  if (!fs.existsSync(file)) return false;
  const ledger = fs.readFileSync(file, 'utf8');
  const section = /## Last full review\s*\n([\s\S]*?)(?=\n## |$)/.exec(ledger)?.[1] ?? '';
  const plain = value => value.replace(/[*`]/g, '');
  if (/^\s*-?\s*DUE NOW\b/m.test(plain(section)) || /^\s*(?:- )?(?:Status: )?PENDING FILING\b/m.test(plain(ledger))) return true;
  const commit = /Commit: `([a-f0-9]{7,40})`/i.exec(section)?.[1];
  if (!commit) return true;
  // File stdio avoids named-pipe confinement issues. Only our unique temp dir is removed.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-cadence-'));
  const out = path.join(dir, 'count.txt'), err = path.join(dir, 'error.txt');
  const fd = fs.openSync(out, 'wx'), ef = fs.openSync(err, 'wx');
  try {
    const run = spawnSync('git', ['--no-optional-locks', 'rev-list', '--count', `${commit}..HEAD`, '--', 'src/game'], { cwd: repoRoot, shell: false, stdio: ['ignore', fd, ef], timeout: 10000 });
    if (run.error || run.status !== 0) throw new Error('autonomy: cannot establish review cadence; inspect ledger reference');
    const count = fs.readFileSync(out, 'utf8').trim();
    if (!/^\d+$/.test(count)) throw new Error('autonomy: invalid review cadence count');
    return Number(count) >= 4;
  } finally { fs.closeSync(fd); fs.closeSync(ef); fs.rmSync(dir, { recursive: true }); }
}

export function planIteration(repoRoot, mode, state, options = {}) {
  const config = loadAutonomy(repoRoot);
  if (!config) return { kind: 'legacy', mode, taskId: null, notify: true };
  const tasks = parseQueue(fs.readFileSync(path.join(repoRoot, 'TASKS.md'), 'utf8'));
  const parked = state.parkedTasks ?? {};
  if (!object(parked)) throw new Error('autonomy: corrupt parked task state');
  if (Object.values(parked).some(entry => !object(entry) || !['WAITING_FOR_OWNER', 'WAITING_FOR_PROVIDER'].includes(entry.kind) || typeof entry.sourceHash !== 'string' || (entry.inputPaths !== undefined && !Array.isArray(entry.inputPaths)))) throw new Error('autonomy: corrupt parked task entry');
  const wakeInputs = Object.values(parked).flatMap(entry => entry.inputPaths ?? []);
  const fingerprint = queueFingerprint(repoRoot, config, wakeInputs);
  const now = options.now ?? Date.now();
  const byId = new Map(tasks.map(t => [t.id, t]));
  const due = options.reviewDue ?? reviewDue(repoRoot);
  if (mode === 'Producer' || (mode === 'Auto' && due)) return { kind: 'producer', mode: 'Producer', taskId: null, fingerprint, notify: true, reason: due ? 'visual review due' : 'explicit producer' };
  const eligible = tasks.filter(t => ['TODO', 'IN_PROGRESS'].includes(t.status) && t.dependencies.every(id => byId.get(id)?.status === 'DONE')).filter(t => {
    const count = state.recoveryFailures?.[t.id]?.total ?? 0;
    if (!Number.isInteger(count) || count < 0) throw new Error('autonomy: corrupt failed-recovery count');
    if (count >= config.maxFailedRecoveries) return false; // queue chatter cannot reset the total
    const entry = parked[t.id];
    if (!entry) return true;
    // Owner-wait parking never expires. A changed queue block + ready status is explicit rescope/reset evidence.
    if (entry.kind === 'WAITING_FOR_OWNER') return entry.sourceHash !== t.sourceHash;
    if (entry.kind === 'WAITING_FOR_PROVIDER') {
      if (!Number.isFinite(Date.parse(entry.retryAt))) throw new Error('autonomy: corrupt provider wake time');
      return now >= Date.parse(entry.retryAt) || queueFingerprint(repoRoot, { ...config, watchInputs: [] }, entry.inputPaths ?? []) !== entry.fingerprint;
    }
    throw new Error('autonomy: invalid parked task kind');
  });
  const task = eligible.find(t => t.status === 'IN_PROGRESS') ?? eligible.find(t => t.status === 'TODO');
  if (task) return { kind: 'consumer', mode: 'Consumer', taskId: task.id, title: task.title, fingerprint, notify: true, taskTimeboxMinutes: config.taskTimeboxMinutes };
  const waiting = tasks.filter(t => t.status === 'BLOCKED' || ['TODO', 'IN_PROGRESS'].includes(t.status)).map(t => ({ id: t.id, status: t.status, dependencies: t.dependencies }));
  if (!waiting.length && mode === 'Auto' && state.quietFingerprint !== fingerprint) return { kind: 'producer', mode: 'Producer', taskId: null, fingerprint, notify: true, reason: 'one opportunity review for changed empty queue' };
  return { kind: 'wait', mode, taskId: null, fingerprint, waiting, notify: state.waitFingerprint !== fingerprint, reason: 'no authorized ready task; no status reset or new work invented' };
}

/** Optional JSON contract augments—not replaces—the strict final report marker. */
export function parseDisposition(report, result) {
  const lines = report.replace(/^\uFEFF/, '').split(/\r?\n/);
  const matches = lines.filter(line => line.startsWith('LOOP_DISPOSITION: '));
  if (!matches.length) return null; // legacy BLOCKED remains a global pause
  if (matches.length !== 1 || (report.match(/LOOP_DISPOSITION\s*:/g) ?? []).length !== 1) throw new Error('autonomy: disposition must occur exactly once');
  const markerIndex = lines.findIndex(line => /^LOOP_RESULT: /.test(line));
  if (lines.indexOf(matches[0]) >= markerIndex) throw new Error('autonomy: disposition must precede final marker');
  let fence = null;
  for (const line of lines.slice(0, lines.indexOf(matches[0]))) {
    const found = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (found && !fence) fence = found[1];
    else if (found && found[1][0] === fence?.[0] && found[1].length >= fence.length) fence = null;
  }
  if (fence) throw new Error('autonomy: disposition must not be inside a code fence');
  const d = JSON.parse(matches[0].slice('LOOP_DISPOSITION: '.length));
  const keys = ['version', 'kind', 'taskId', 'reason', 'inputPaths', 'retryAt', 'failureSignature', 'recoveryFailed'];
  if (!object(d) || d.version !== 1 || !KINDS.includes(d.kind) || Object.keys(d).some(k => !keys.includes(k))) throw new Error('autonomy: invalid disposition schema');
  text(d.reason, 'reason');
  if (d.kind !== 'SAFETY_STOP' && !TASK_ID.test(d.taskId ?? '')) throw new Error('autonomy: local disposition requires exact taskId');
  if (d.taskId !== undefined && !TASK_ID.test(d.taskId)) throw new Error('autonomy: invalid taskId');
  if (d.inputPaths !== undefined && (!Array.isArray(d.inputPaths) || d.inputPaths.length > 20 || new Set(d.inputPaths).size !== d.inputPaths.length)) throw new Error('autonomy: invalid disposition inputs');
  (d.inputPaths ?? []).forEach(safeRelative);
  const expected = { RECOVERABLE: ['IN_PROGRESS'], WAITING_FOR_OWNER: ['BLOCKED'], WAITING_FOR_PROVIDER: ['IDLE'], SAFETY_STOP: ['BLOCKED', 'REGRESSION'] };
  if (!expected[d.kind].includes(result)) throw new Error('autonomy: result and disposition contradict');
  if (d.kind === 'WAITING_FOR_PROVIDER' && (typeof d.retryAt !== 'string' || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(d.retryAt) || !Number.isFinite(Date.parse(d.retryAt)))) throw new Error('autonomy: provider wait requires explicit retryAt');
  if (d.kind === 'RECOVERABLE') {
    if (typeof d.recoveryFailed !== 'boolean') throw new Error('autonomy: recovery outcome required');
    if (d.recoveryFailed) text(d.failureSignature, 'failureSignature');
  } else if (d.recoveryFailed !== undefined || d.failureSignature !== undefined) throw new Error('autonomy: recovery fields only apply to recoverable results');
  return d;
}

/** Returns detached state; never edits the queue, caps, locks or owner decisions. */
export function applyOutcome(repoRoot, state, metadata, report, result, options = {}) {
  const config = loadAutonomy(repoRoot);
  const d = parseDisposition(report, result);
  const next = JSON.parse(JSON.stringify(state));
  next.activeRun = null; next.transientSkips = 0;
  next.paused = ['BLOCKED', 'REGRESSION'].includes(result);
  next.pauseReason = next.paused ? result : null;
  if (!d || !config) {
    if (d && !config) throw new Error('autonomy: classified outcomes require enabled policy');
    return { state: next, disposition: null };
  }
  if (d.kind === 'SAFETY_STOP') { next.paused = true; next.pauseReason = d.reason; return { state: next, disposition: d }; }
  const tasks = parseQueue(fs.readFileSync(path.join(repoRoot, 'TASKS.md'), 'utf8'));
  const task = tasks.find(t => t.id === d.taskId);
  if (!task || metadata.plan?.kind !== 'consumer' || metadata.plan.taskId !== task.id) throw new Error('autonomy: local result does not belong to the selected consumer task');
  if (d.kind === 'WAITING_FOR_OWNER' && task.status !== 'BLOCKED') throw new Error('autonomy: owner-wait result must leave the task BLOCKED');
  if (['RECOVERABLE', 'WAITING_FOR_PROVIDER'].includes(d.kind) && task.status !== 'IN_PROGRESS') throw new Error('autonomy: recovery/provider wait must leave selected task IN_PROGRESS');
  if (d.kind === 'WAITING_FOR_PROVIDER') {
    const remaining = Date.parse(d.retryAt) - (options.now ?? Date.now());
    if (remaining <= 0 || remaining > 7 * 86400000) throw new Error('autonomy: provider retryAt must be future and within seven days');
  }
  next.parkedTasks ??= {};
  next.recoveryFailures ??= {};
  let disposition = d;
  if (d.kind === 'RECOVERABLE' && d.recoveryFailed) {
    const failed = next.recoveryFailures[task.id] ?? { total: 0, signatures: {} };
    if (!Number.isInteger(failed.total) || failed.total < 0 || !object(failed.signatures)) throw new Error('autonomy: corrupt recovery history');
    failed.total++; const signature = sha(d.failureSignature);
    failed.signatures[signature] = (failed.signatures[signature] ?? 0) + 1;
    next.recoveryFailures[task.id] = failed;
    if (failed.total >= config.maxFailedRecoveries) disposition = { version: 1, kind: 'WAITING_FOR_OWNER', taskId: task.id, reason: 'Three failed recoveries consumed; park without resetting attempts or approving more spend', inputPaths: d.inputPaths ?? [] };
  }
  if (disposition.kind !== 'RECOVERABLE') next.parkedTasks[task.id] = {
    kind: disposition.kind, reason: disposition.reason, sourceHash: task.sourceHash,
    fingerprint: queueFingerprint(repoRoot, disposition.kind === 'WAITING_FOR_PROVIDER' ? { ...config, watchInputs: [] } : config, disposition.inputPaths ?? []), inputPaths: disposition.inputPaths ?? [],
    ...(disposition.retryAt ? { retryAt: disposition.retryAt } : {}),
  };
  next.paused = false; next.pauseReason = null;
  return { state: next, disposition };
}

export function rememberWait(state, plan) {
  if (plan.kind !== 'wait') return state;
  if (state.waitFingerprint === plan.fingerprint) return state; // same reference: skip durable writes
  return { ...state, waitFingerprint: plan.fingerprint, waitReason: plan.reason };
}
