import assert from 'node:assert/strict'
import console from 'node:console'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
const root = 'art/motion/horse/'
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const colors = { NF: '#e85c32', FF: '#1688cc', NH: '#8d45be', FH: '#25844a' }
const scale = 0.28, ground = 300
// Original schematic, NOT traced anatomy, accepted art, or a model-control result.
function leg(id, hoof, bob) {
  const fore = id.endsWith('F'), near = id.startsWith('N')
  const origin = [fore ? 312 : 164, (fore ? 174 : 180) + bob]
  const first = [origin[0] + (fore ? -8 : 24) + (near ? 0 : -8), origin[1] + 35]
  const fetlock = [hoof[0], hoof[1] - 15]
  const dx = fetlock[0] - first[0], dy = fetlock[1] - first[1], d = Math.hypot(dx, dy)
  const a = 58, b = 62
  assert(d > Math.abs(a-b) && d < a+b, `${id}: reachable IK`)
  const along = (a*a - b*b + d*d)/(2*d), height = Math.sqrt(a*a - along*along)
  const sign = fore ? 1 : -1
  const bend = [first[0] + along*dx/d + sign*height*dy/d, first[1] + along*dy/d - sign*height*dx/d]
  return { id, provenance: 'original schematic assigned identity, not inferred from x-position', joints: [origin, first, bend, fetlock, hoof], jointNames: fore ? ['shoulder','elbow','carpus','fetlock','hoof'] : ['hip','stifle','hock','fetlock','hoof'], contact: hoof[1] === ground }
}
function phase(name, hooves, bob, support, ticks) {
  const legs = Object.entries(hooves).map(([id,h]) => leg(id,h,bob))
  assert.deepEqual(legs.filter(l=>l.contact).map(l=>l.id).sort(), [...support].sort())
  const seat = [238, 119+bob], barrel = [235, 170+bob], head = { ear: [389,60+bob], muzzle: [430,118+bob] }
  if (support.length === 2) {
    const xs = legs.filter(l=>l.contact).map(l=>l.joints[4][0])
    assert(Math.min(...xs) < barrel[0] && Math.max(...xs) > barrel[0], 'projected diagonal spans barrel')
  }
  for (const l of legs) for (const p of l.joints) assert(p[0]>=40 && p[0]<=472 && p[1]>=36 && p[1]<=305)
  return {name,ticks,ground,bodyBob:bob,seat,barrel,head,support,legs}
}
const trot=[]
trot.push(phase('idle', {NF:[318,300],FF:[300,300],NH:[155,300],FH:[178,300]},0,['NF','FF','NH','FH'],1))
for (let half=0;half<2;half++) {
  const active=half===0?['NF','FH']:['FF','NH'], other=half===0?['FF','NH']:['NF','FH']
  for(let k=0;k<4;k++) {
    const h={}; const bob=[0,3,0,-8][k]
    for(const id of active) h[id]=k<3?[id.endsWith('F')?345-k*23.5714285714:175-k*23.5714285714,300]:[id.endsWith('F')?282:130,275]
    for(const id of other) h[id]=[[id.endsWith('F')?280:130,262],[id.endsWith('F')?308:153,250],[id.endsWith('F')?335:170,268],[id.endsWith('F')?345:175,280]][k]
    trot.push(phase(`trot:${half*4+k}`,h,bob,k<3?active:[],3))
  }
}
const run = [
  phase('run:0',{NF:[292,260],FF:[310,265],NH:[150,270],FH:[144,300]},0,['FH'],2),
  phase('run:1',{NF:[325,257],FF:[340,265],NH:[160,300],FH:[126,263]},3,['NH'],2),
  phase('run:2',{NF:[340,275],FF:[350,300],NH:[170,258],FH:[148,252]},0,['FF'],2),
  phase('run:3',{NF:[328,300],FF:[316,255],NH:[150,250],FH:[132,257]},3,['NF'],2),
  phase('run:4',{NF:[287,263],FF:[300,250],NH:[170,252],FH:[150,260]},-5,[],2),
  phase('run:5',{NF:[280,265],FF:[300,260],NH:[160,270],FH:[145,280]},-8,[],2)
]
// Stance centers compensate 3*2.2 world units across successive trot keys.
for(const start of [1,5]) for(const id of trot[start].support) for(let k=0;k<2;k++) {
  const delta=trot[start+k+1].legs.find(l=>l.id===id).joints[4][0]-trot[start+k].legs.find(l=>l.id===id).joints[4][0]
  assert(Math.abs(delta*scale+6.6)<1e-8)
}
const plan={ version:1, taskId:'CMR-22', status:'CONTROL_HYPOTHESIS_NOT_DEMONSTRATED_MODEL_COMPLIANCE', parentRunId:'2026-10-10T07-59-36-819Z-ea9f8876-1370-45c9-b7b9-9a48a6188101', coordinateSpace:'local 512x341 source cell, y down; all nine anchor cells share scale', sourcePixelsToWorld:scale, margins:{left:40,right:40,top:36,bottom:36}, contactPolicy:'contact means authored hoof underside y300; suspended hoof clearance >=20px; dynamic projected support, not static equilibrium proof', trot,run, runtimeCaveats:['Held 3-tick keys still have within-exposure movement up to4.4u; no-sliding gate NOT passed. Future presentation-only per-step grounded translation or revised exposures must be measured; no core speed change.', 'Run is original transverse four-beat control hypothesis FH,NH,FF,NF then flight. Six keys are sparse, not biomechanical certification.', 'Stylized 2D joints do not prove 3D leg lengths or tissue anatomy. Seat/barrel displacement coherent by construction, not rider contact acceptance.'], budgets:{horseUsed:1,horseCap:4,globalUsed:146,locomotionRemaining:1,runAllocated:2,repairUsed:0,historicalFailedConsumers:2,diagnosticFailuresAdded:0,maxFurtherFailedConsumers:1}, inputs:['art/fighter-bodies/horse-master.jpg',root+'locomotion-candidate-1.png','art/motion/generation-budget.json','art/motion/acceptance4-repair-budget.json'].map(path=>({path,sha256:hash(path)})) }
writeFileSync(root+'POSE_CONTROL_PLAN.json',JSON.stringify(plan,null,2)+'\n')
for(const [name,phases,cols] of [['locomotion-control-guide',trot,3],['run-control-guide',run,3]]) {
 const c=createCanvas(cols*512,Math.ceil(phases.length/cols)*341),ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height)
 phases.forEach((p,i)=>{ctx.save();ctx.translate(i%cols*512,Math.floor(i/cols)*341);ctx.strokeStyle='#aaa';ctx.strokeRect(40,36,432,269);ctx.beginPath();ctx.moveTo(40,300);ctx.lineTo(472,300);ctx.stroke();
 ctx.fillStyle='#ddd';ctx.beginPath();ctx.ellipse(...p.barrel,91,47,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(305,168+p.bodyBob);ctx.lineTo(...p.head.ear);ctx.lineTo(...p.head.muzzle);ctx.stroke();
 for(const id of ['FF','FH','NF','NH']) {const l=p.legs.find(v=>v.id===id);ctx.strokeStyle=colors[id];ctx.lineWidth=id.startsWith('N')?4:2;ctx.setLineDash(id.startsWith('N')?[]:[5,4]);ctx.beginPath();l.joints.forEach((j,n)=>n?ctx.lineTo(...j):ctx.moveTo(...j));ctx.stroke();ctx.setLineDash([]);for(const j of l.joints){ctx.beginPath();ctx.arc(...j,3,0,Math.PI*2);ctx.stroke()}ctx.fillStyle=colors[id];ctx.font='12px sans-serif';ctx.fillText(id,l.joints[4][0]-8,l.joints[4][1]-6);if(l.contact)ctx.fillRect(l.joints[4][0]-8,300,16,3)}
 ctx.fillStyle='#111';ctx.fillRect(p.seat[0]-10,p.seat[1]-2,20,4);ctx.font='14px sans-serif';ctx.fillText(`${p.name} support:${p.support.join('+')||'NONE (flight)'}`,45,20);ctx.font='10px sans-serif';ctx.fillText('Original control hypothesis ONLY; far dashed / near solid; no art acceptance',45,329);ctx.restore()})
 writeFileSync(root+name+'.png',c.toBuffer('image/png'))
}
console.log('PASS guide: 15 phases / 60 assigned 5-joint chains; IK reachability, explicit support, diagonal barrel span, margins, coherent body/seat, trot stance displacement. Not runtime/model compliance.')
