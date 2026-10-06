#!/usr/bin/env node
// Offline evidence renderer for the attempt2 fixed-band walk correction.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{mkdirSync,readFileSync,writeFileSync}from'node:fs'
import{createHash}from'node:crypto'
import{measureWalkMaterialEndpoints,WALK_PROJECTION_OPS}from'./retouch-xiahoudun-walk-projection.mjs'
import{spreadOf,evaluateProjection}from'./pack-projection.mjs'
const OUT='artifacts/motion/xiahoudun/walk-projection-review'
const files={before:{path:'art/motion/xiahoudun/walk-guard-grip-restored-source.png',sha:'fba82023db508438b4d7dc676b779387e80cc678674dbee92619c1ccbe6b7653'},after:{path:'art/motion/xiahoudun/walk-projection-corrected-source.png',sha:'0aff5a39f190b88fad17acf54cf0874635eff9445c99a37025852910874b5685'}}
mkdirSync(OUT,{recursive:true});const loaded={}
for(const[key,f]of Object.entries(files)){const bytes=readFileSync(f.path);if(createHash('sha256').update(bytes).digest('hex')!==f.sha)throw Error('walk review: source changed');const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0);loaded[key]={canvas:cv,image:g.getImageData(0,0,img.width,img.height)}}
const e=measureWalkMaterialEndpoints(loaded.after.image),W=loaded.after.image.width,H=loaded.after.image.height,ov=createCanvas(W,H),g=ov.getContext('2d');g.fillStyle='#191721';g.fillRect(0,0,W,H);g.drawImage(loaded.after.canvas,0,0)
for(const r of e){g.strokeStyle='#ffee80';g.lineWidth=1;g.beginPath();g.moveTo(...r.tip);g.lineTo(...r.butt);g.stroke();for(const[p,col]of[[r.tip,'#20ff90'],[r.butt,'#ff5b70']]){g.strokeStyle=col;g.beginPath();g.moveTo(p[0]-5,p[1]);g.lineTo(p[0]+5,p[1]);g.moveTo(p[0],p[1]-5);g.lineTo(p[0],p[1]+5);g.stroke()}g.fillStyle='#ffee80';g.font='bold 16px sans-serif';g.fillText(`${r.cell}: ${r.length.toFixed(1)}`,r.cell%3*511+8,Math.floor(r.cell/3)*341+23)}
writeFileSync(`${OUT}/true-endpoints.png`,ov.toBuffer('image/png'))
const zones={2:[1080,190,1250,296],3:[70,506,230,610],5:[1070,517,1250,617],7:[583,844,772,949],8:[1050,850,1250,967]}
for(const{cell}of WALK_PROJECTION_OPS){const[x0,y0,x1,y1]=zones[cell],z=4,w=(x1-x0)*z,h=(y1-y0)*z,c=createCanvas(w,h*2+40),pg=c.getContext('2d');pg.fillStyle='#191721';pg.fillRect(0,0,w,h*2+40);pg.imageSmoothingEnabled=false;pg.drawImage(loaded.before.canvas,x0,y0,x1-x0,y1-y0,0,20,w,h);pg.drawImage(loaded.after.canvas,x0,y0,x1-x0,y1-y0,0,h+40,w,h);pg.fillStyle='#fff080';pg.font='bold 14px sans-serif';pg.fillText(`walk:${cell} BEFORE`,6,15);pg.fillText(`walk:${cell} FINAL fixed-band correction`,6,h+35);writeFileSync(`${OUT}/pair-${cell}.png`,c.toBuffer('image/png'))}
const band=JSON.parse(readFileSync('art/motion/xiahoudun/pack-projection.json','utf8')).band,charge=JSON.parse(readFileSync('art/motion/xiahoudun/charge-repair-1-audit.json','utf8')).weaponEndpoints.map(v=>v.lengthPx),values=e.map(v=>v.length)
let maxDirectionStep=0;const ang=e.map(r=>Math.atan2(r.tip[1]-r.butt[1],r.tip[0]-r.butt[0])*180/Math.PI);for(let i=1;i<ang.length;i++){const d=Math.abs(ang[i]-ang[i-1])%180;maxDirectionStep=Math.max(maxDirectionStep,Math.min(d,180-d))}
const result={sources:files,endpoints:e,weaponSpread:spreadOf(values),maxDirectionStep,walkProjection:evaluateProjection({observed:values,remaining:6,band}),hypotheticalWalkChargeProjection:evaluateProjection({observed:[...values,...charge],remaining:5,band}),limitations:'Weapon/body-corridor consumer self-check only. Head metric remains UNVERIFIED; no final registration/gameplay/native-video or independent after-verdict. Charge values diagnostic only, not accepted sheet record.'}
writeFileSync(`${OUT}/manifest.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
