// Advisory economic/main package evidence. Runtime native-tool receipts remain
// execution authority; model-written LOOP_WORK JSON never grants a capability.
import { isDeepStrictEqual } from 'node:util';
const WORK_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
const HASH = /^[a-f0-9]{64}$/;
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v, label, max = 2000) => { if (typeof v !== 'string' || !v.trim() || v.length > max) throw new Error(`work-package: invalid ${label}`); };
const fail = message => { throw new Error(`work-package: ${message}`); };
export function parseWorkReport(report) {
  const lines = report.replace(/^\uFEFF/, '').split(/\r?\n/), matches = lines.filter(l => l.startsWith('LOOP_WORK: '));
  if (!matches.length) { if (/LOOP_WORK\s*:/.test(report)) fail('malformed work marker'); return null; }
  if (matches.length !== 1 || (report.match(/LOOP_WORK\s*:/g) ?? []).length !== 1) fail('work report must occur exactly once');
  const index = lines.indexOf(matches[0]), final = lines.findIndex(l => /^LOOP_RESULT: /.test(l));
  if (index >= final || final < 0) fail('work report must precede final result');
  let fence = null;
  for (const line of lines.slice(0, index)) {
    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (m && !fence) fence = m[1]; else if (m && m[1][0] === fence?.[0] && m[1].length >= fence.length) fence = null;
  }
  if (fence) fail('work report cannot be fenced');
  const w = JSON.parse(matches[0].slice('LOOP_WORK: '.length));
  const allowed = ['version', 'taskId', 'workId', 'contractHash', 'phase', 'attempts', 'mainLeaseId', 'criterion', 'evidence'];
  if (!object(w) || w.version !== 1 || Object.keys(w).some(k => !allowed.includes(k)) || !WORK_ID.test(w.workId ?? '') || !HASH.test(w.contractHash ?? '') || !['economic', 'main-incomplete', 'accepted', 'parked'].includes(w.phase)) fail('invalid work report schema');
  text(w.taskId, 'taskId', 100); text(w.criterion, 'criterion'); text(w.evidence, 'evidence', 4000);
  if (!Array.isArray(w.attempts) || w.attempts.length > 2) fail('at most two economic attempts per report');
  if (new Set(w.attempts.map(a => a?.callId)).size !== w.attempts.length) fail('duplicate attempt ids in one report');
  for (const a of w.attempts) {
    if (!object(a) || Object.keys(a).some(k => !['callId', 'correctionOf', 'outcome', 'failureKind', 'disposed', 'criterion', 'evidence'].includes(k)) || !['pass', 'fail', 'blocked'].includes(a.outcome) || !['quality', 'infrastructure', 'authority'].includes(a.failureKind) || a.disposed !== true) fail('invalid disposed acceptance attempt');
    text(a.callId, 'callId', 300); text(a.criterion, 'attempt criterion'); text(a.evidence, 'attempt evidence', 4000);
    if (a.correctionOf !== undefined) text(a.correctionOf, 'correctionOf', 300);
    if (a.outcome === 'fail' && a.failureKind !== 'quality') fail('infrastructure/authority is blocked, not quality failure');
    if (a.failureKind !== 'quality' && a.outcome !== 'blocked') fail('infrastructure/authority cannot count as acceptance');
  }
  if (w.mainLeaseId !== undefined) text(w.mainLeaseId, 'mainLeaseId', 300);
  return w;
}
export function applyWorkReport(state, metadata, report, result, tasks) {
  const w = parseWorkReport(report);
  if (!w) return state;
  const task = tasks.find(t => t.id === w.taskId);
  if (!task || metadata.plan?.kind !== 'consumer' || metadata.plan.taskId !== w.taskId) fail('report does not belong to selected consumer');
  if (result === 'COMPLETED' && task.status !== 'DONE') fail('completed work report requires task status DONE; external project checks remain required');
  if (result === 'COMPLETED' && w.phase !== 'accepted') fail('completed report cannot leave unaccepted package');
  if (['economic', 'main-incomplete'].includes(w.phase) && task.status !== 'IN_PROGRESS') fail('unfinished work requires task IN_PROGRESS');
  validatePackages(state);
  const next = JSON.parse(JSON.stringify(state)); next.workPackages ??= {};
  if (Object.values(next.workPackages).some(p => p.taskId === w.taskId && p.workId !== w.workId && !['accepted', 'parked'].includes(p.phase))) fail('another unfinished work package already owns selected task; close it without resetting attempts');
  const prior = next.workPackages[w.workId];
  if (prior && (prior.taskId !== w.taskId || prior.contractHash !== w.contractHash)) fail('work id contract/task cannot change');
  if (prior && ['accepted', 'parked'].includes(prior.phase)) fail('closed package cannot be reopened; next bounded package defaults economic');
  const attempts = prior?.attempts ?? [];
  for (const a of w.attempts) {
    const old = attempts.find(p => p.callId === a.callId);
    if (old) { if (!isDeepStrictEqual(old, a)) fail('one receipt cannot have conflicting reviews'); continue; }
    if (attempts.length >= 2 && attempts.slice(-2).every(a => a.outcome === 'fail' && a.failureKind === 'quality')) fail('third economic quality retry forbidden; main takeover required');
    if (attempts.length && a.correctionOf !== attempts.at(-1).callId) fail('correction must reference latest exact same-package receipt');
    if (!attempts.length && a.correctionOf !== undefined) fail('first attempt cannot reference absent receipt');
    if (attempts.at(-1)?.outcome === 'pass' || attempts.at(-1)?.outcome === 'blocked') fail('accepted/blocked attempt cannot silently restart');
    attempts.push(a);
  }
  const pair = attempts.slice(-2), twoFailures = pair.length === 2 && pair.every(a => a.outcome === 'fail' && a.failureKind === 'quality') && pair[1].correctionOf === pair[0].callId;
  const main = w.phase === 'main-incomplete' || w.mainLeaseId !== undefined;
  if (main && (!twoFailures || !w.mainLeaseId)) fail('main report requires two reported linked quality failures and a lease reference (not Host-verified)');
  if (prior?.phase === 'main-incomplete' && !main && w.phase !== 'parked') fail('main-owned package cannot return to cheap retries');
  if (w.phase === 'economic' && ['pass', 'blocked'].includes(attempts.at(-1)?.outcome)) fail('economic phase contradicts accepted/blocked last attempt; close accepted/parked explicitly');
  if (w.phase === 'accepted' && !main && attempts.at(-1)?.outcome !== 'pass') fail('accepted package needs economic pass or reviewed main evidence');
  if (!attempts.length) fail('package needs reported economic attempt evidence; Host receipts remain authoritative');
  next.workPackages[w.workId] = { taskId: w.taskId, workId: w.workId, contractHash: w.contractHash, phase: w.phase, attempts, ...(w.mainLeaseId ? { mainLeaseId: w.mainLeaseId } : {}), criterion: w.criterion, evidence: w.evidence, updatedRunId: metadata.runId ?? null, advisoryOnly: true };
  return next;
}
function validatePackages(state) {
  if (state.workPackages === undefined) return;
  if (!object(state.workPackages)) fail('corrupt stored package map');
  for (const [id, p] of Object.entries(state.workPackages)) {
    if (!object(p) || p.workId !== id || !WORK_ID.test(id) || !HASH.test(p.contractHash ?? '') || typeof p.taskId !== 'string' || !['economic', 'main-incomplete', 'accepted', 'parked'].includes(p.phase) || !Array.isArray(p.attempts) || !p.attempts.length || p.attempts.length > 2 || p.attempts.some(a => !object(a) || typeof a.callId !== 'string' || a.disposed !== true || !['pass', 'fail', 'blocked'].includes(a.outcome) || !['quality', 'infrastructure', 'authority'].includes(a.failureKind))) fail('corrupt stored work package');
  }
}
export function packageHint(state, taskId) {
  validatePackages(state);
  const packages = Object.values(state.workPackages ?? {}).filter(p => p.taskId === taskId && !['accepted', 'parked'].includes(p.phase));
  const p = packages.at(-1);
  if (!p) return { role: 'economic-first', advisoryOnly: true, reason: 'New bounded package defaults economic worker; no main capability from runner JSON' };
  const failed = p.attempts.slice(-2).filter(a => a.outcome === 'fail' && a.failureKind === 'quality').length;
  return { role: p.phase === 'main-incomplete' || failed >= 2 ? 'main-takeover-required' : 'economic-correction', workId: p.workId, contractHash: p.contractHash, latestReceipt: p.attempts.at(-1).callId, qualityFailures: failed, ...(p.mainLeaseId ? { priorLeaseId: p.mainLeaseId } : {}), advisoryOnly: true, reason: 'Verify actual Host review/lease receipts; task recovery/image/time caps and owner blocks still apply' };
}
