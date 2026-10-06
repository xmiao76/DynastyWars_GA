#!/usr/bin/env node
// CMR-13A: deterministic shaft retouch closing heavy (fixA1 output).
//
//   node scripts/retouch-lidian-heavy.mjs
//
// Grant fix landed c0/c1 just under band (391.8/439.9... c1 in-band but
// 1.9px under hi), c2 clipped at the sheet edge (spliced from round 1
// instead), c3/c4 long (507.1/482.5). Extend c0 (+14), micro-shorten c1
// (-4, margin), shorten c3 (-82) and c4 (-58) — rigid axis slides, poses
// and identity untouched. Original stays immutable; output feeds
// scripts/splice-lidian-heavy.mjs. NOT an image request / ledger event.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC='art/motion/lidian/heavy-spliced-c2.png'
const OUT='art/motion/lidian/heavy-prepared-source.png'
const EXPECTED_SHA='43bad82037fb990114526973dffa140d88f6fe50a6bb1dc332104bbc605b46d2'

// Verified endpoints (zone-read on steel/gold/ink) + op geometry.
const OPS=[
  {cell:0,mode:'extend',tip:[371,10],pommel:[22,188],amount:14,t0:30,band:16,oShaft:[-6,6],slab:[60,130]},
  {cell:1,mode:'shorten',tip:[927,6],pommel:[515,160],amount:4,t0:55,band:14},
  {cell:3,mode:'shorten',tip:[511,627],pommel:[14,526],amount:82,t0:85,band:20},
  {cell:4,mode:'shorten',tip:[1023,631],pommel:[545,565],amount:58,t0:62,band:20},
]

const bytes=readFileSync(SRC)
if(createHash('sha256').update(bytes).digest('hex')!==EXPECTED_SHA)throw Error('unexpected source SHA256')
const img=await loadImage(bytes)
const cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
const d=g.getImageData(0,0,img.width,img.height)
const im={width:d.width,height:d.height,data:d.data}
const cellOf=gridCellOf(3,3)

for(const o of OPS){
  const dx=o.tip[0]-o.pommel[0],dy=o.tip[1]-o.pommel[1]
  const len=Math.hypot(dx,dy)
  const ux=dx/len,uy=dy/len
  const angleDeg=Math.atan2(dy,dx)*180/Math.PI
  const dir=o.mode==='extend'?-1:1
  const shift=[Math.round(dir*o.amount*ux),Math.round(dir*o.amount*uy)]
  const slideLen=Math.hypot(shift[0],shift[1])
  const measure=(_im,comp)=>{
    let lo=Infinity,hi=-Infinity
    for(const p of comp.pixels){
      const x=p%_im.width,y=(p/_im.width)|0
      const t=(x-o.pommel[0])*ux+(y-o.pommel[1])*uy
      const oo=-(x-o.pommel[0])*uy+(y-o.pommel[1])*ux
      if(Math.abs(oo)>o.band)continue
      if(t<lo)lo=t
      if(t>hi)hi=t
    }
    return hi-lo
  }
  const pre=alphaComponents(im,96).filter(c=>c.area>64)
  const compPre=pre.find(c=>cellOf(c,im.width,im.height)===o.cell)
  if(!compPre)throw Error(`cell ${o.cell}: component missing pre-op`)
  const preLen=measure(im,compPre)
  const predicted=o.mode==='extend'?preLen+slideLen:preLen-slideLen
  const op={cell:o.cell,mode:o.mode,cap:o.pommel,angleDeg,t0:o.t0,band:o.band,shift,predicted}
  if(o.mode==='extend'){op.oShaft=o.oShaft;op.slab=o.slab}
  const r=applyRetouchOp(im,op,{cellOf,measure})
  console.log(JSON.stringify({cell:o.cell,mode:o.mode,preLen:+preLen.toFixed(1),shift,predicted:+predicted.toFixed(1),...r}))
}
const comp=verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
console.log('composition',JSON.stringify(comp))
g.putImageData(d,0,0)
const png=cv.toBuffer('image/png')
writeFileSync(OUT,png)
console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex')}))
