import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';

export class LockBusy extends Error {}
export function pathsFor(repoRoot) {
  const directory = path.join(repoRoot, 'artifacts/loop');
  return { directory, state: path.join(directory, 'state.json'), lock: path.join(directory, 'run.lock'), recovery: path.join(directory, 'recovery.lock') };
}
export function atomicJson(file, data) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  let fd;
  try {
    fd = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(fd, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    fs.renameSync(temporary, file);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
export function readState(paths) {
  let text;
  try { text = fs.readFileSync(paths.state, 'utf8'); } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, paused: false, pauseReason: null, activeRun: null, lastRun: null };
    throw error;
  }
  const state = JSON.parse(text);
  if (!state || state.version !== 1 || typeof state.paused !== 'boolean' || !Object.hasOwn(state, 'activeRun') || !Object.hasOwn(state, 'lastRun')) throw new Error('Malformed loop state; preserve evidence and repair manually');
  return state;
}
export function saveState(paths, state) { atomicJson(paths.state, { ...state, updatedAt: new Date().toISOString() }); }
function lockText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export function inspectLock(paths) {
  const raw = lockText(paths.lock);
  if (raw === null) return null;
  try { return { exists: true, owner: JSON.parse(raw) }; } catch { return { exists: true, malformed: true }; }
}
export function acquireLock(paths, repoRoot) {
  fs.mkdirSync(paths.directory, { recursive: true });
  if (fs.existsSync(paths.recovery)) throw new LockBusy('Lock recovery is in progress (or its guard remains); inspect recovery.lock');
  const owner = { version: 1, nonce: randomUUID(), pid: process.pid, hostname: os.hostname(), repoRoot, createdAt: new Date().toISOString() };
  let fd;
  try { fd = fs.openSync(paths.lock, 'wx', 0o600); } catch (error) {
    if (error.code === 'EEXIST') throw new LockBusy('Loop lock exists; never auto-stealing by age or PID. Inspect --status and recover explicitly only after all writers stop.');
    throw error;
  }
  try { fs.writeFileSync(fd, `${JSON.stringify(owner, null, 2)}\n`); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  const lock = { owner, release() {
    const raw = lockText(paths.lock);
    if (raw === null) throw new Error('Owned loop lock disappeared; refusing to assume ownership');
    let current;
    try { current = JSON.parse(raw); } catch { throw new Error('Loop lock became malformed; retained for recovery'); }
    if (current.nonce !== owner.nonce) throw new Error('Loop lock owner changed; refusing to remove it');
    fs.unlinkSync(paths.lock);
  } };
  if (fs.existsSync(paths.recovery)) { lock.release(); throw new LockBusy('Concurrent lock recovery; try again only after recovery completes'); }
  return lock;
}
export function pidMayBeAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}
export function recoverLock(paths) {
  if (!fs.existsSync(paths.directory)) return { recovered: false, message: 'No loop lock exists' };
  let guard;
  try { guard = fs.openSync(paths.recovery, 'wx', 0o600); } catch (error) {
    if (error.code === 'EEXIST') throw new LockBusy('Recovery guard exists; another recovery may be live. Inspect manually; not auto-stealing.');
    throw error;
  }
  try {
    fs.writeFileSync(guard, JSON.stringify({ pid: process.pid, hostname: os.hostname(), createdAt: new Date().toISOString() }));
    const raw = lockText(paths.lock);
    if (raw === null) return { recovered: false, message: 'No loop lock exists' };
    let owner;
    try { owner = JSON.parse(raw); } catch { /* Explicit confirmation also covers partial/malformed crash locks. */ }
    if (owner?.hostname === os.hostname() && pidMayBeAlive(owner.pid)) throw new LockBusy('Recorded local lock PID may still be live; refusing recovery even with confirmation');
    let state;
    try { state = readState(paths); } catch { /* Preserve malformed state below; explicit confirmation is still required. */ }
    if (pidMayBeAlive(state?.activeRun?.pid)) throw new LockBusy('Recorded active adapter PID may still be live; refusing lock recovery');
    if (lockText(paths.lock) !== raw) throw new LockBusy('Lock changed during recovery; refusing');
    const archive = path.join(paths.directory, `recovered-lock-${Date.now()}-${randomUUID()}.json`);
    fs.renameSync(paths.lock, archive);
    if (!state) {
      // Never silently overwrite malformed state while recovering the independent lock.
      return { recovered: true, archive, message: 'Lock archived; state is malformed and still requires manual repair' };
    }
    state.paused = true;
    state.pauseReason = 'Explicit lock recovery: review interrupted/unknown work before --resume';
    if (state.activeRun) state.lastRun = { ...state.activeRun, result: 'UNKNOWN', endedAt: new Date().toISOString() };
    state.activeRun = null;
    saveState(paths, state);
    return { recovered: true, archive, message: 'Lock archived; runner remains paused until explicit --resume' };
  } finally { fs.closeSync(guard); fs.unlinkSync(paths.recovery); }
}
export function parseReport(report) {
  const text = report.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);
  while (lines.length && lines.at(-1).trim() === '') lines.pop();
  // Count even quoted/embedded/malformed occurrences; transcripts cannot spoof a final report.
  if ((text.match(/LOOP_RESULT\s*:/gi) ?? []).length !== 1) throw new Error('Final report must contain exactly one LOOP_RESULT marker');
  const match = /^LOOP_RESULT: (COMPLETED|IN_PROGRESS|IDLE|BLOCKED|REGRESSION)$/.exec(lines.at(-1) ?? '');
  if (!match) throw new Error('Final nonempty report line must be exactly LOOP_RESULT: <valid status>');
  const before = lines.slice(0, -1).join('\n');
  // An unclosed Markdown code fence would make the marker non-standalone prose.
  let fence = null;
  for (const line of before.split('\n')) {
    const candidate = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (!candidate) continue;
    if (!fence) fence = candidate[1];
    else if (candidate[1][0] === fence[0] && candidate[1].length >= fence.length) fence = null;
  }
  if (fence) throw new Error('Final marker must not be inside a code fence');
  return match[1];
}
