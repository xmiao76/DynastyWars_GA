#!/usr/bin/env node
// CMR-14A offline candidate registration, not partial runtime activation.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{createHash}from'node:crypto'
import{mkdirSync,readFileSync,writeFileSync}from'node:fs'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{alphaComponents}from'./motion-pipeline.mjs'
import{gridCellOf}from'./motion-retouch.mjs'

export const REGISTERED_CHARGE_SPEC='art/motion/xiahoudun/charge-registration-candidate.json'
export function chargeExposureForTick(spec,tick){
 if(!Number.isInteger(tick)||tick<0)throw Error('charge fixture: nonnegative integer tick required')
 let frame='walk:0'
 for(const e of spec.exposures){if(e.tick>tick)break;frame=e.frame}
 return tick>=52?'walk:0':frame
}
export function chargeMotionTrace(){
 // Source read at execution; stale core/hash state fails rather than guessed
 // timelines drifting silently. Tests compare these ticks with real stepEnemy.
 const attacks=readFileSync('src/core/attacks.ts','utf8'),ai=readFileSync('src/core/ai.ts','utf8')
 const line=attacks.split('\n').find(s=>s.includes("'charge.dash.long':"))
 const number=key=>Number(line?.match(new RegExp(key+': (\\d+)'))?.[1])
 const startup=number('startup'),active=number('active'),recover=number('recover')
 const speed=Number(ai.match(/const BOSS_DASH_SPEED = ([\d.]+)/)?.[1])
 if(startup!==8||active!==26||recover!==18||speed!==3.2)throw Error('charge fixture: core timing changed; reauthor exposures')
 const total=startup+active+recover;let x=0
 const trace=[]
 for(let tick=0;tick<=total;tick++){
  const moving=tick>=startup&&tick<startup+active
  if(moving)x+=speed
  trace.push({tick,x,moving,state:tick<total?'attack':'walk',stateTick:tick<total?tick:0})
 }
 return{attackId:'charge.dash.long',startup,active,recover,total,speed,trace,coreHashes:{attacks:createHash('sha256').update(attacks).digest('hex'),ai:createHash('sha256').update(ai).digest('hex')}}
}
export function registeredTransform(spec,id){
 const a=spec.anchors[id]
 if(!a)throw Error('charge fixture: unknown frame '+id)
 const scale=spec.rawToArtScale,density=spec.density
 return{scale,tx:spec.box.width*density/2-a.pelvis[0]*scale,ty:spec.box.groundY*density-a.groundY*scale}
}
export function validateCandidateAnchors(spec,imageBy){
 if(spec.density!==2||spec.rawToArtScale!==.66||spec.box.width!==260||spec.box.height!==144||spec.box.groundY!==136)throw Error('charge fixture: candidate ruler changed; do not pose-normalize')
 const report=[]
 for(const[id,a]of Object.entries(spec.anchors)){
  const name=id.split(':')[0],im=imageBy[name]
  if(!im)throw Error('charge fixture: missing source '+name)
  const at=p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||p[0]<0||p[1]<0||p[0]>=im.width||p[1]>=im.height?0:im.data[(p[1]*im.width+p[0])*4+3]
  if(at(a.pelvis)<96)throw Error('charge fixture: pelvis is off drawn pixels '+id)
  const fit=registeredTransform(spec,id),map=p=>[p[0]*fit.scale+fit.tx,p[1]*fit.scale+fit.ty]
  const contacts=[a.contact,a.secondarySole].filter(Boolean)
  const errors=contacts.map(p=>{if(at(p)<96)throw Error('charge fixture: sole off ink '+id);return Math.abs(map(p)[1]/spec.density-spec.box.groundY)})
  if(errors.some(e=>e>1.5))throw Error('charge fixture: planted-foot error '+id)
  report.push({id,fit,pelvisArt:map(a.pelvis),contactErrorsU:errors,groundEvidence:contacts.length?'drawn sole candidate':'UNVERIFIED virtual ground; no planted sole',support:a.support})
 }
 return report
}
export async function buildRegisteredChargeFixture(spec,out){
 const motion=chargeMotionTrace(),images={},components={},owned={}
 for(const[name,s]of Object.entries(spec.sources)){
  const bytes=readFileSync('art/motion/xiahoudun/'+s.file)
  if(createHash('sha256').update(bytes).digest('hex')!==s.sha256)throw Error('charge fixture: source hash changed '+name)
  const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0);images[name]=g.getImageData(0,0,img.width,img.height)
  components[name]=alphaComponents(images[name],96).filter(c=>c.area>64)
 }
 const anchors=validateCandidateAnchors(spec,images),cellOf=gridCellOf(3,3)
 for(const id of Object.keys(spec.anchors)){
  const[name,cell]=id.split(':'),im=images[name],comp=components[name].find(c=>cellOf(c,im.width,im.height)===Number(cell))
  if(!comp)throw Error('charge fixture: missing component '+id)
  const w=comp.x1-comp.x0+1,h=comp.y1-comp.y0+1,cv=createCanvas(w,h),g=cv.getContext('2d'),d=g.createImageData(w,h)
  for(const p of comp.pixels){const x=p%im.width,y=(p/im.width)|0,q=((y-comp.y0)*w+x-comp.x0)*4;d.data.set(im.data.subarray(p*4,p*4+4),q)}g.putImageData(d,0,0)
  const fit=registeredTransform(spec,id),bounds={x:comp.x0*fit.scale+fit.tx,y:comp.y0*fit.scale+fit.ty,w:w*fit.scale,h:h*fit.scale}
  if(bounds.x<0||bounds.y<0||bounds.x+bounds.w>spec.box.width*spec.density||bounds.y+bounds.h>spec.box.height*spec.density)throw Error('charge fixture: canonical clipping '+id)
  owned[id]={canvas:cv,bounds,fit,sourceBounds:[comp.x0,comp.y0,comp.x1,comp.y1]}
 }
 mkdirSync(out,{recursive:true});mkdirSync(`${out}/ticks`,{recursive:true})
 // Emit the exact source landmarks for later review/reproduction. The
 // source grid may display neighbour ink; frame extraction above is owned.
 for(const[id,a]of Object.entries(spec.anchors)){
  const[name,c]=id.split(':'),cell=Number(c),im=images[name],src=createCanvas(im.width,im.height),sg=src.getContext('2d'),d=sg.createImageData(im.width,im.height);d.data.set(im.data);sg.putImageData(d,0,0)
  const x0=cell%3*512,y0=Math.floor(cell/3)*341,cv=createCanvas(1024,736),g=cv.getContext('2d');g.fillStyle='#181922';g.fillRect(0,0,1024,736);g.imageSmoothingEnabled=false;g.drawImage(src,x0,y0,512,360,0,16,1024,720);g.strokeStyle='#6080a0';g.beginPath();g.moveTo(0,(a.groundY-y0)*2+16);g.lineTo(1024,(a.groundY-y0)*2+16);g.stroke()
  for(const[p,color]of[[a.pelvis,'#50ddff'],[a.contact,'#50ff80'],[a.secondarySole,'#ffd060']]){if(!p)continue;const x=(p[0]-x0)*2,y=(p[1]-y0)*2+16;g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.arc(x,y,6,0,2*Math.PI);g.moveTo(x-9,y);g.lineTo(x+9,y);g.moveTo(x,y-9);g.lineTo(x,y+9);g.stroke()}
  g.fillStyle='#ffe080';g.font='bold 14px sans-serif';g.fillText(id+' cyan pelvis / green primary / gold secondary; blue ground',5,13);writeFileSync(`${out}/source-anchors-${name}-${c}.png`,cv.toBuffer('image/png'))
 }
 const W=spec.box.width*spec.density,H=spec.box.height*spec.density
 const render=(id,rootShift=0,world=false)=>{
  const cv=createCanvas(world?700:W,world?H+32:H),g=cv.getContext('2d');g.fillStyle='#1b1c27';g.fillRect(0,0,cv.width,cv.height)
  const origin=world?-70:0,ground=spec.box.groundY*spec.density+(world?24:0)
  g.strokeStyle='#546671';g.lineWidth=1;g.beginPath();g.moveTo(0,ground);g.lineTo(cv.width,ground);g.stroke()
  if(world){for(let x=0;x<cv.width;x+=40){g.strokeStyle='#242936';g.beginPath();g.moveTo(x,25);g.lineTo(x,ground);g.stroke()}}
  const f=owned[id];g.drawImage(f.canvas,origin+rootShift+f.bounds.x,f.bounds.y+(world?24:0),f.bounds.w,f.bounds.h)
  g.strokeStyle='#81b2bf';g.beginPath();g.moveTo(origin+rootShift+W/2,ground-5);g.lineTo(origin+rootShift+W/2,ground+5);g.stroke();return cv
 }
 const order=spec.exposures.map(e=>({tick:e.tick,id:e.frame}));order.push({tick:52,id:'walk:0'})
 const contact=createCanvas(W*4,H*2+104),cg=contact.getContext('2d');cg.fillStyle='#151620';cg.fillRect(0,0,contact.width,contact.height)
 for(let i=0;i<order.length;i++){const o=order[i],x=i%4*W,y=Math.floor(i/4)*(H+32)+56;cg.drawImage(render(o.id),x,y);cg.fillStyle='#ffe890';cg.font='bold 14px sans-serif';cg.fillText(`${o.id} tick${o.tick} | .66 raw->art, ground136u`,x+6,y-7)}
 cg.fillStyle='#ffe890';cg.font='bold 14px sans-serif';cg.fillText('Registered candidate: pelvis x + drawn primary sole, fixed scale. Not runtime/video acceptance.',6,18)
 writeFileSync(`${out}/exposure-contact.png`,contact.toBuffer('image/png'))
 const normal=createCanvas(spec.box.width*4,spec.box.height*2+64),ng=normal.getContext('2d');ng.fillStyle='#151620';ng.fillRect(0,0,normal.width,normal.height)
 for(let i=0;i<order.length;i++){const o=order[i],x=i%4*spec.box.width,y=Math.floor(i/4)*(spec.box.height+24)+30;ng.drawImage(render(o.id),x,y,spec.box.width,spec.box.height);ng.fillStyle='#ffe890';ng.font='12px sans-serif';ng.fillText(`${o.id} t${o.tick} (logical candidate)`,x+3,y-5)}
 writeFileSync(`${out}/logical-size-contact.png`,normal.toBuffer('image/png'))
 //4x art pixels at boundaries that expose palette/style or guard differences.
 for(const[a,b,label]of[['walk:0','charge:0','guard-coil'],['charge:0','charge:1','coil-launch'],['charge:2','charge:3','dash-paint'],['charge:4','walk:0','brake-guard']]){
  const cv=createCanvas(W*4+8,H*4*2+48),g=cv.getContext('2d');g.fillStyle='#171821';g.fillRect(0,0,cv.width,cv.height);g.imageSmoothingEnabled=false;g.drawImage(render(a),4,24,W*4,H*4);g.drawImage(render(b),4,H*4+48,W*4,H*4);g.fillStyle='#ffe890';g.font='bold 16px sans-serif';g.fillText(a+' registered candidate4x',6,18);g.fillText(b+' registered candidate4x',6,H*4+42);writeFileSync(`${out}/${label}-4x.png`,cv.toBuffer('image/png'))
 }
 const records=[]
 for(const t of motion.trace){const id=chargeExposureForTick(spec,t.tick),cv=render(id,t.x*spec.density,true),g=cv.getContext('2d');g.fillStyle='#ffe890';g.font='bold 13px sans-serif';g.fillText(`tick${t.tick} ${id} rootX${t.x.toFixed(1)}u | ${t.moving?'core dash':'no core translation'}`,7,18);const path=`ticks/tick-${String(t.tick).padStart(3,'0')}.png`,bytes=cv.toBuffer('image/png');writeFileSync(`${out}/${path}`,bytes);records.push({...t,frame:id,path,sha256:createHash('sha256').update(bytes).digest('hex')})}
 const manifest={status:'REGISTERED_CANDIDATE_ONLY',sources:spec.sources,density:spec.density,scale:spec.rawToArtScale,box:spec.box,anchors,frames:Object.fromEntries(Object.entries(owned).map(([id,f])=>[id,{...f,canvas:undefined}])),core:motion,exposures:spec.exposures,trace:records,limitations:spec.limits,headMetric:'UNVERIFIED',numericalHeadSpread:null}
 writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n')
 // Browser playback from locally emitted53 actual exposure/root stills at60Hz.
 // Timer playback is a review aid; recorded core trace, not a game capture.
 writeFileSync(`${out}/playback.html`, `<!doctype html><meta charset="utf-8"><title>Xiahou Dun candidate registered charge</title><style>body{background:#14141d;color:#ffe890;font:16px sans-serif}img{display:block}button{padding:8px}</style><h1>Candidate registered charge</h1><p>Offline still playback: not gameplay/native video or independent acceptance. Space toggles; arrows step; speed .25x or1x.</p><button id="toggle">Play/pause</button><button id="slow">Speed .25x/1x</button><p id="label"></p><img id="frame" width="700" height="320"><script>const paths=${JSON.stringify(records.map(r=>r.path))};const image=document.getElementById('frame'),label=document.getElementById('label');let i=0,play=false,speed=1,last=0;const images=paths.map(p=>{const a=new Image();a.src=p;return a});function draw(){image.src=paths[i];label.textContent='tick '+i+' /52 | '+speed+'x'}document.getElementById('toggle').onclick=()=>play=!play;document.getElementById('slow').onclick=()=>{speed=speed===1?.25:1;draw()};document.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();play=!play}if(e.code==='ArrowRight'){play=false;i=(i+1)%paths.length;draw()}if(e.code==='ArrowLeft'){play=false;i=(i+paths.length-1)%paths.length;draw()}};function step(t){if(play&&t-last>=1000/(60*speed)){i=(i+1)%paths.length;draw();last=t}requestAnimationFrame(step)}draw();requestAnimationFrame(step)</script>`)
 return manifest
}
async function main(){const spec=JSON.parse(readFileSync(REGISTERED_CHARGE_SPEC,'utf8')),out='artifacts/motion/xiahoudun/registered-charge';const m=await buildRegisteredChargeFixture(spec,out);console.log(JSON.stringify({out,anchors:m.anchors,frames:m.trace.length,total:m.core.total,dashDistance:m.trace.at(-1).x,status:m.status},null,2))}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
