import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const [requestFile, resultFile, ...args] = process.argv.slice(2);
const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
const callsFile = path.join(request.repoRoot, 'calls.jsonl');
const calls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf8').trim().split('\n').filter(Boolean).length : 0;
fs.appendFileSync(callsFile, JSON.stringify({request, args, cwd:process.cwd(), input:fs.readFileSync(request.inputFile,'utf8')})+'\n');
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
  const special={INVALID:'No status',DUPLICATE:'LOOP_RESULT: COMPLETED\nLOOP_RESULT: IDLE',TRAILING:'LOOP_RESULT: IDLE\nextra',INDENT:' LOOP_RESULT: IDLE',FENCED:'\x60\x60\x60text\nLOOP_RESULT: IDLE',UNKNOWN:'LOOP_RESULT: UNKNOWN'};
  fs.writeFileSync(resultFile,special[outcome]??('Fixture evidence — 中文\nLOOP_RESULT: '+outcome+'\n\n'));
}
