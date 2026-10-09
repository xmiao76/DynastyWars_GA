import test from 'node:test';
import assert from 'node:assert/strict';
import { applyWorkReport, packageHint, parseWorkReport } from './work-package.mjs';
const hash = 'a'.repeat(64), task = {id:'A-1',status:'IN_PROGRESS'}, metadata = {plan:{kind:'consumer',taskId:'A-1'},runId:'fixture-run'};
const attempt = (id, outcome='fail', extra={}) => ({callId:id,outcome,failureKind:'quality',disposed:true,criterion:'fixture acceptance',evidence:'actual fixture evidence',...extra});
const w = extra => ({version:1,taskId:'A-1',workId:'A-1-package',contractHash:hash,phase:'economic',attempts:[attempt('w1')],criterion:'fixture check',evidence:'observed evidence',...extra});
const report = work => `Evidence\nLOOP_WORK: ${JSON.stringify(work)}\nLOOP_RESULT: IN_PROGRESS\n`;
const apply = (state, work, result='IN_PROGRESS', tasks=[task]) => applyWorkReport(state,metadata,report(work),result,tasks);

test('package original+correction survives two runner iterations; main hint never a capability',()=>{
 const s=apply({},w({}));assert.equal(packageHint(s,'A-1').role,'economic-correction');
 const next=apply(s,w({attempts:[attempt('w2','fail',{correctionOf:'w1'})]}));assert.equal(next.workPackages['A-1-package'].attempts.length,2);assert.equal(packageHint(next,'A-1').role,'main-takeover-required');assert.equal(packageHint(next,'A-1').advisoryOnly,true);
 const main=apply(next,w({phase:'main-incomplete',attempts:[],mainLeaseId:'real-host-lease'}));assert.equal(packageHint(main,'A-1').priorLeaseId,'real-host-lease');
 const done=apply(main,w({phase:'accepted',attempts:[],mainLeaseId:'real-host-lease'}));assert.equal(packageHint(done,'A-1').role,'economic-first');assert.throws(()=>apply(done,w({})),/closed package/);
});
test('third quality retry and fake one-failure main forbidden; same receipt is not two failures',()=>{
 const s=apply({},w({attempts:[attempt('w1'),attempt('w2','fail',{correctionOf:'w1'})]}));
 assert.throws(()=>apply(s,w({attempts:[attempt('w3','fail',{correctionOf:'w2'})]})),/third economic/);
 assert.throws(()=>apply({},w({phase:'main-incomplete',mainLeaseId:'fake'})),/two reported linked/);
 assert.throws(()=>apply({},w({attempts:[attempt('w1'),attempt('w1')]})),/duplicate attempt/);
 const once=apply({},w({attempts:[attempt('w1')]}));assert.equal(once.workPackages['A-1-package'].attempts.length,1);
 assert.throws(()=>apply(once,w({attempts:[attempt('w1','pass')]})),/conflicting reviews/);
});
test('contracts/scope and same selected task fixed; unfinished main cannot relabel as cheap',()=>{
 const s=apply({},w({}));assert.throws(()=>apply(s,w({contractHash:'b'.repeat(64)})),/contract\/task/);
 assert.throws(()=>apply(s,w({taskId:'B-1'})),/selected consumer/);
 const main=apply({},w({phase:'main-incomplete',mainLeaseId:'lease',attempts:[attempt('w1'),attempt('w2','fail',{correctionOf:'w1'})]}));
 assert.throws(()=>apply(main,w({attempts:[]})),/main-owned/);
});
test('quota/authority unavailable parks; no smart escalation from infrastructure or hidden recovery refund',()=>{
 const blocked=attempt('quota','blocked',{failureKind:'infrastructure'});
 const s=apply({recoveryFailures:{'A-1':{total:2,signatures:{}}}},w({phase:'parked',attempts:[blocked]}));
 assert.equal(s.recoveryFailures['A-1'].total,2);assert.equal(packageHint(s,'A-1').role,'economic-first');
 assert.throws(()=>apply({},w({phase:'main-incomplete',mainLeaseId:'lease',attempts:[blocked]})),/two reported linked/);
 assert.throws(()=>apply({},w({attempts:[attempt('quota','fail',{failureKind:'infrastructure'})]})),/blocked, not quality/);
});
test('accepted package is not whole task DONE; standard legacy reports remain unchanged',()=>{
 assert.throws(()=>apply({},w({phase:'accepted',attempts:[attempt('w1','pass')]}),'COMPLETED'),/task status DONE/);
 const done=apply({},w({phase:'accepted',attempts:[attempt('w1','pass')]}),'COMPLETED',[{...task,status:'DONE'}]);assert.equal(done.workPackages['A-1-package'].phase,'accepted');
 const state={paused:false};assert.equal(applyWorkReport(state,metadata,'Evidence\nLOOP_RESULT: IN_PROGRESS','IN_PROGRESS',[task]),state);
});
test('one open package cannot be hidden with a new name; corrupt persisted records fail closed',()=>{
 const s=apply({},w({}));assert.throws(()=>apply(s,w({workId:'A-1-new'})),/unfinished work package/);
 assert.throws(()=>packageHint({workPackages:{bad:null}},'A-1'),/corrupt stored/);
 assert.throws(()=>apply({},w({attempts:[attempt('w1','pass')]})),/contradicts/);
 assert.throws(()=>apply({},w({attempts:[attempt('w1','blocked',{failureKind:'authority'})]})),/contradicts/);
});

test('malformed/duplicate/fenced/adversarial work reports fail closed',()=>{
 assert.throws(()=>parseWorkReport(report(w({}))+`LOOP_WORK: ${JSON.stringify(w({}))}`),/exactly once/);
 assert.throws(()=>parseWorkReport('```text\n'+report(w({}))+'```'),/fenced/);
 assert.throws(()=>parseWorkReport(report(w({attempts:[{...attempt('w1'),disposed:false}]}))),/disposed/);
 assert.throws(()=>parseWorkReport(report(w({contractHash:'not-a-hash'}))),/schema/);
 assert.throws(()=>parseWorkReport('Evidence\n LOOP_WORK: {}\nLOOP_RESULT: IN_PROGRESS'),/malformed/);
});
