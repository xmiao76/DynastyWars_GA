#!/usr/bin/env node
// CMR-13A: deterministic pommel-end shortens closing fall (candidate 1).
//
//   node scripts/retouch-lidian-fall.mjs
//
// Candidate 1 drew all five keep glaives long ([481.5,483.3,479.7,465.5,
// 515.1], overlay-verified) — uniform overshoot. Each op slides its pommel
// cap forward along the haft axis (rigid, overlap, no fill fabrication)
// to ~425px. Poses, identity and lighting untouched. Original stays
// immutable; output is fall-prepared-source.png. NOT an image request /
// ledger event.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC='art/motion/lidian/fall-candidate-1.png'
const OUT='art/motion/lidian/fall-prepared-source.png'
const EXPECTED_SHA='4df1f23b3f243f1d9663f490d07d6176e4093882c1d8c7f790d032e4c8979795'

// Verified endpoints (full-sheet overlay, all markers on material).
const OPS=[
  {cell:0,mode:'shorten',tip:[520,72],pommel:[55,197],amount:57,t0:90,band:20},
  {cell:1,mode:'shorten',tip:[998,72],pommel:[532,200],amount:58,t0:65,band:20},
  {cell:2,mode:'shorten',tip:[1521,99],pommel:[1061,235],amount:55,t0:60,band:18},
  {cell:4,mode:'shorten',tip:[992,586],pommel:[528,623],amount:40,t0:45,band:20},
  {cell:5,mode:'shorten',tip:[1526,603],pommel:[1011,607],amount:90,t0:95,band:[-8,30]},
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
  const shift=[Math.round(o.amount*ux),Math.round(o.amount*uy)]
  const slideLen=Math.hypot(shift[0],shift[1])
  const inBand=Array.isArray(o.band)
    ? (oo => oo>=o.band[0]&&oo<=o.band[1])
    : (oo => Math.abs(oo)<=o.band)
  const measure=(_im,comp)=>{
    let lo=Infinity,hi=-Infinity
    for(const p of comp.pixels){
      const x=p%_im.width,y=(p/_im.width)|0
      const t=(x-o.pommel[0])*ux+(y-o.pommel[1])*uy
      const oo=-(x-o.pommel[0])*uy+(y-o.pommel[1])*ux
      if(!inBand(oo))continue
      if(t<lo)lo=t
      if(t>hi)hi=t
    }
    return hi-lo
  }
  const pre=alphaComponents(im,96).filter(c=>c.area>64)
  const compPre=pre.find(c=>cellOf(c,im.width,im.height)===o.cell)
  if(!compPre)throw Error(`cell ${o.cell}: component missing pre-op`)
  const preLen=measure(im,compPre)
  const predicted=preLen-slideLen
  const r=applyRetouchOp(im,{
    cell:o.cell,mode:'shorten',cap:o.pommel,angleDeg,t0:o.t0,band:o.band,
    shift,predicted,
  },{cellOf,measure})
  console.log(JSON.stringify({cell:o.cell,preLen:+preLen.toFixed(1),shift,predicted:+predicted.toFixed(1),...r}))
}
const comp=verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
console.log('composition',JSON.stringify(comp))
g.putImageData(d,0,0)
const png=cv.toBuffer('image/png')
writeFileSync(OUT,png)
console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex')}))
