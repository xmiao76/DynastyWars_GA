// Included by test-loop.mjs: use its isolated fake-adapter fixtures, never live models.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyOutcome, parseQueue, planIteration, parseDisposition, rememberWait, reviewDue } from './autonomy.mjs';

export function registerAutonomyTests({ fixture, run, calls, state, snapshot }) {
  const queue = (rows) => rows.map(([id, status, dependencies = []]) => `### ${id} - fixture task\n\n- Status: ${status}\n- Requires: ${dependencies.length ? dependencies.join(', ') : 'none'}\n`).join('\n');
  function enable(root, rows) {
    fs.writeFileSync(path.join(root, 'TASKS.md'), queue(rows));
    fs.writeFileSync(path.join(root, '.loop/tick.md'), '# Fixture tick runbook');
    fs.writeFileSync(path.join(root, '.loop/autonomy.json'), JSON.stringify({ version: 1, enabled: true, watchInputs: ['TASKS.md', '.loop/autonomy.json'], maxFailedRecoveries: 3, taskTimeboxMinutes: 25, runbook: '.loop/tick.md' }));
  }
  const report = (kind, result, taskId = 'A-1', extra = {}) => `Evidence\nLOOP_DISPOSITION: ${JSON.stringify({ version: 1, kind, taskId, reason: 'Exact fixture condition with evidence', ...extra })}\nLOOP_RESULT: ${result}\n`;

  test('manual reports persist work package across ticks without resetting recovery and invalid escalation safety-pauses', async () => {
    const root=fixture(); enable(root,[['A-1','IN_PROGRESS']]);
    const attempt=(callId,correctionOf)=>({callId,...(correctionOf?{correctionOf}:{}),outcome:'fail',failureKind:'quality',disposed:true,criterion:'fixture',evidence:'observed failure'});
    const work=(attempts)=>({version:1,taskId:'A-1',workId:'A-1-package',contractHash:'a'.repeat(64),phase:'economic',attempts,criterion:'fixture',evidence:'actual evidence'});
    for(const attempts of [[attempt('w1')],[attempt('w2','w1')]]) {
      const begun=JSON.parse((await run(root,['--begin-manual'])).output);
      fs.writeFileSync(begun.reportPath,'Evidence\nLOOP_WORK: '+JSON.stringify(work(attempts))+'\nLOOP_RESULT: IN_PROGRESS\n');
      await run(root,['--finish-manual']);
    }
    const p=JSON.parse((await run(root,['--preflight'])).output);
    assert.equal(p.workPackage.role,'main-takeover-required'); assert.equal(p.workPackage.advisoryOnly,true);
    assert.equal(state(root).workPackages['A-1-package'].attempts.length,2);
    assert.equal(state(root).recoveryFailures?.['A-1']?.total??0,0);
    const begun=JSON.parse((await run(root,['--begin-manual'])).output);
    fs.writeFileSync(begun.reportPath,'Evidence\nLOOP_WORK: '+JSON.stringify(work([attempt('w3','w2')]))+'\nLOOP_RESULT: IN_PROGRESS\n');
    await run(root,['--finish-manual'],1);assert.equal(state(root).paused,true);
  });

  test('exported planning/outcome policy never clears an existing global pause',()=>{
    const root=fixture();enable(root,[['A-1','IN_PROGRESS']]);
    const paused={paused:true,pauseReason:'owner-only safety stop'};
    assert.equal(planIteration(root,'Auto',paused,{reviewDue:false}).kind,'safety-paused');
    assert.throws(()=>applyOutcome(root,paused,{plan:{kind:'consumer',taskId:'A-1'}},report('RECOVERABLE','IN_PROGRESS','A-1',{recoveryFailed:false}),'IN_PROGRESS'),/existing global pause/);
    assert.equal(paused.paused,true);
  });

  test('queue planner skips blocked ordering branches, preserves hard prerequisites and catches cycles/malformed IDs', () => {
    const root = fixture(); enable(root, [['A-1', 'BLOCKED'], ['A-2', 'TODO', ['A-1']], ['B-1', 'TODO']]);
    assert.equal(planIteration(root, 'Auto', {}, { reviewDue: false }).taskId, 'B-1');
    assert.throws(() => parseQueue(queue([['A-1', 'TODO', ['NO-99']]])), /unknown prerequisite/);
    assert.throws(() => parseQueue(queue([['A-1', 'TODO', ['B-1']], ['B-1', 'TODO', ['A-1']]])), /cyclic/);
    assert.throws(() => parseQueue(queue([['A-1', 'TODO'], ['A-1', 'TODO']])), /duplicate/);
    assert.throws(() => parseQueue('### A-1 - x\n- Status: TODO\n- Status: DONE'), /malformed/);
    assert.equal(planIteration(root, 'Auto', {}, { reviewDue: true }).kind, 'producer');
  });

  test('quiet wait remembers once, ignores PROGRESS churn, wakes on actual queue inputs and never edits queue', async () => {
    const root = fixture(['COMPLETED'], { adapter: null, adapters: {} }); enable(root, [['A-1', 'BLOCKED'], ['A-2', 'TODO', ['A-1']]]);
    const original = fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8');
    const before = snapshot(root); const p = JSON.parse((await run(root, ['--preflight'])).output);
    assert.equal(p.kind, 'wait'); assert.equal(p.notify, true); assert.deepEqual(snapshot(root), before);
    const w = JSON.parse((await run(root, ['--checkpoint-wait'])).output); assert.equal(w.notify, true);
    const saved = fs.readFileSync(path.join(root, 'artifacts/loop/state.json'), 'utf8');
    const again = JSON.parse((await run(root, ['--checkpoint-wait'])).output); assert.equal(again.notify, false);
    assert.equal(fs.readFileSync(path.join(root, 'artifacts/loop/state.json'), 'utf8'), saved);
    fs.appendFileSync(path.join(root, 'PROGRESS.md'), '\nunchanged waiting chatter');
    assert.equal(JSON.parse((await run(root, ['--preflight'])).output).notify, false);
    const begun = JSON.parse((await run(root, ['--begin-manual'])).output); assert.equal(begun.begun, false);
    assert.equal(calls(root).length, 0); assert.equal(fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8'), original);
    fs.appendFileSync(path.join(root, 'TASKS.md'), '\nOwner changed input');
    assert.equal(JSON.parse((await run(root, ['--preflight'])).output).notify, true);
  });

  test('classified local owner-wait manual result does not global-pause or reopen blocked task', async () => {
    const root = fixture(); enable(root, [['A-1', 'IN_PROGRESS'], ['A-2', 'TODO', ['A-1']], ['B-1', 'TODO']]);
    const begun = JSON.parse((await run(root, ['--begin-manual'])).output); assert.equal(begun.plan.taskId, 'A-1');
    fs.writeFileSync(path.join(root, 'TASKS.md'), queue([['A-1', 'BLOCKED'], ['A-2', 'TODO', ['A-1']], ['B-1', 'TODO']]));
    fs.writeFileSync(begun.reportPath, report('WAITING_FOR_OWNER', 'BLOCKED'));
    await run(root, ['--finish-manual']); assert.equal(state(root).paused, false); assert.equal(state(root).parkedTasks['A-1'].kind, 'WAITING_FOR_OWNER');
    assert.equal(JSON.parse((await run(root, ['--preflight'])).output).taskId, 'B-1');
    assert.match(fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8'), /Status: BLOCKED/);
  });

  test('automated local parking continues independent work while legacy and safety results still pause', async () => {
    const root = fixture(['LOCAL_BLOCK', 'COMPLETED']); enable(root, [['A-1', 'IN_PROGRESS'], ['A-2', 'TODO', ['A-1']], ['B-1', 'TODO']]);
    await run(root, ['--iterations', '2']); assert.equal(calls(root).length, 2);
    assert.equal(calls(root)[0].request.plan.taskId, 'A-1'); assert.equal(calls(root)[1].request.plan.taskId, 'B-1'); assert.equal(state(root).paused, false);
    const safety = fixture(['SAFETY']); enable(safety, [['A-1', 'IN_PROGRESS']]); await run(safety, [], 2); assert.equal(state(safety).paused, true);
    const legacy = fixture(['BLOCKED']); enable(legacy, [['A-1', 'IN_PROGRESS']]); await run(legacy, [], 2); assert.equal(state(legacy).paused, true);
  });

  test('automated provider wait continues to an independent task, not another immediate retry', async () => {
    const root = fixture(['LOCAL_PROVIDER', 'COMPLETED']); enable(root, [['A-1', 'IN_PROGRESS'], ['B-1', 'TODO']]);
    await run(root, ['--iterations', '2']); assert.equal(calls(root).length, 2);
    assert.equal(calls(root)[1].request.plan.taskId, 'B-1'); assert.equal(state(root).paused, false);
    assert.equal(state(root).parkedTasks['A-1'].kind, 'WAITING_FOR_PROVIDER');
  });

  test('provider wait wakes only at disclosed time/changed input and does not resume owner block', () => {
    const root = fixture(); enable(root, [['A-1', 'IN_PROGRESS'], ['B-1', 'TODO']]);
    const now = Date.parse('2030-01-01T00:00:00Z'), plan = planIteration(root, 'Auto', {}, { reviewDue: false, now });
    const outcome = applyOutcome(root, {}, { plan }, report('WAITING_FOR_PROVIDER', 'IDLE', 'A-1', { retryAt: '2030-01-01T01:00:00Z' }), 'IDLE', { now });
    assert.equal(planIteration(root, 'Auto', outcome.state, { reviewDue: false, now }).taskId, 'B-1');
    fs.appendFileSync(path.join(root, 'TASKS.md'), '\nUnrelated work/status commentary must not cancel provider cooling');
    assert.equal(planIteration(root, 'Auto', outcome.state, { reviewDue: false, now }).taskId, 'B-1');
    assert.equal(planIteration(root, 'Auto', outcome.state, { reviewDue: false, now: now + 3600000 }).taskId, 'A-1');
    assert.throws(() => applyOutcome(root, {}, { plan }, report('WAITING_FOR_PROVIDER', 'IDLE', 'A-1', { retryAt: '2000-01-01T00:00:00Z' }), 'IDLE', { now }), /future/);
  });

  test('failed recoveries have hard total cap despite changed strategy signatures; successful diagnosis never resets it', () => {
    const root = fixture(); enable(root, [['A-1', 'IN_PROGRESS'], ['B-1', 'TODO']]);
    let current = {};
    for (let i = 0; i < 3; i++) {
      const plan = planIteration(root, 'Auto', current, { reviewDue: false }); assert.equal(plan.taskId, 'A-1');
      current = applyOutcome(root, current, { plan }, report('RECOVERABLE', 'IN_PROGRESS', 'A-1', { recoveryFailed: true, failureSignature: `strategy ${i} true geometry failure` }), 'IN_PROGRESS').state;
      if (i < 2) current = applyOutcome(root, current, { plan }, report('RECOVERABLE', 'IN_PROGRESS', 'A-1', { recoveryFailed: false }), 'IN_PROGRESS').state;
    }
    assert.equal(current.recoveryFailures['A-1'].total, 3); assert.equal(current.paused, false);
    assert.equal(planIteration(root, 'Auto', current, { reviewDue: false }).taskId, 'B-1');
    assert.equal(fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8'), queue([['A-1', 'IN_PROGRESS'], ['B-1', 'TODO']]));
  });

  test('invalid disposition/selected task contradictions stay fail-closed and never treat unknown as success', async () => {
    assert.throws(() => parseDisposition(report('WAITING_FOR_OWNER', 'COMPLETED'), 'COMPLETED'), /contradict/);
    assert.throws(() => parseDisposition(report('WAITING_FOR_OWNER', 'BLOCKED') + 'LOOP_DISPOSITION: {}', 'BLOCKED'), /exactly once/);
    assert.throws(() => parseDisposition(report('WAITING_FOR_OWNER', 'BLOCKED', 'A-1', { inputPaths: ['../outside'] }), 'BLOCKED'), /relative/);
    assert.throws(() => parseDisposition(report('WAITING_FOR_OWNER', 'BLOCKED', 'A-1', { inputPaths: ['secrets/credential'] }), 'BLOCKED'), /sensitive/);
    const root = fixture(); enable(root, [['A-1', 'IN_PROGRESS'], ['B-1', 'BLOCKED']]);
    const plan = planIteration(root, 'Auto', {}, { reviewDue: false });
    assert.throws(() => applyOutcome(root, {}, { plan }, report('WAITING_FOR_OWNER', 'BLOCKED', 'B-1'), 'BLOCKED'), /selected consumer/);
    const begun = JSON.parse((await run(root, ['--begin-manual'])).output);
    fs.writeFileSync(begun.reportPath, report('WAITING_FOR_OWNER', 'BLOCKED'));
    await run(root, ['--finish-manual'], 1); assert.equal(state(root).paused, true); // queue was not parked
  });

  test('current markdown PENDING FILING / DUE NOW review indicators are not missed', () => {
    const root = fixture(); fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    const ledger = path.join(root, 'docs/UI_REVIEW_LEDGER.md');
    fs.writeFileSync(ledger, '## Last full review\n- Date: old\n\n## Batch\n- Status: **PENDING FILING**\n'); assert.equal(reviewDue(root), true);
    fs.writeFileSync(ledger, '## Last full review\n- **DUE NOW**: owner flag\n'); assert.equal(reviewDue(root), true);
  });

  test('a -dirty capture anchor is read as its commit, not as a missing review', () => {
    const root = fixture(); fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    const git = (...args) => { const r = spawnSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
    git('init', '-q'); git('add', 'TASKS.md'); git('commit', '-q', '-m', 'fixture');
    const head = git('rev-parse', '--short', 'HEAD');
    const ledger = path.join(root, 'docs/UI_REVIEW_LEDGER.md');
    fs.writeFileSync(ledger, `## Last full review\n- Date: now. Commit: \`${head}-dirty\` (capture commit)\n`); assert.equal(reviewDue(root), false);
    fs.writeFileSync(ledger, `## Last full review\n- Date: now. Commit: \`${head}\`\n`); assert.equal(reviewDue(root), false);
  });

  test('manual producer IDLE checks empty queue only once per input fingerprint', async () => {
    const root = fixture(); enable(root, [['A-1', 'DONE']]);
    const begun = JSON.parse((await run(root, ['--begin-manual'])).output); assert.equal(begun.plan.kind, 'producer');
    fs.writeFileSync(begun.reportPath, 'No new finding\nLOOP_RESULT: IDLE\n'); await run(root, ['--finish-manual']);
    const again = JSON.parse((await run(root, ['--preflight'])).output); assert.equal(again.kind, 'wait');
    assert.equal(calls(root).length, 0);
  });

  test('classifier refuses fenced outcomes and total recovery cap cannot be reset by queue chatter', () => {
    assert.throws(() => parseDisposition('```text\n' + report('WAITING_FOR_OWNER', 'BLOCKED') + '```', 'BLOCKED'), /code fence/);
    const root = fixture(); enable(root, [['A-1', 'IN_PROGRESS'], ['B-1', 'TODO']]);
    const s = { recoveryFailures: { 'A-1': { total: 3, signatures: {} } } };
    fs.appendFileSync(path.join(root, 'TASKS.md'), '\nchanged commentary, not more authority');
    assert.equal(planIteration(root, 'Auto', s, { reviewDue: false }).taskId, 'B-1');
  });

  test('quiet state is copy-on-write, repeated wait stable; preflight respects existing global pause without changing it', async () => {
    const root = fixture(); enable(root, [['A-1', 'BLOCKED']]);
    const plan = planIteration(root, 'Auto', {}, { reviewDue: false }); const first = rememberWait({}, plan);
    assert.equal(rememberWait(first, plan), first);
    fs.mkdirSync(path.join(root, 'artifacts/loop'), { recursive: true });
    fs.writeFileSync(path.join(root, 'artifacts/loop/state.json'), JSON.stringify({ version: 1, paused: true, pauseReason: 'existing safety', activeRun: null, lastRun: null }));
    const bytes = fs.readFileSync(path.join(root, 'artifacts/loop/state.json'), 'utf8');
    await run(root, ['--preflight'], 2); await run(root, ['--checkpoint-wait'], 2);
    assert.equal(fs.readFileSync(path.join(root, 'artifacts/loop/state.json'), 'utf8'), bytes); assert.equal(calls(root).length, 0);
  });
}
