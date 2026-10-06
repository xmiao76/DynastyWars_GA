#!/usr/bin/env node
// CMR-13A: deterministic pommel-end shortens closing misc (candidate 1).
//
//   node scripts/retouch-lidian-misc.mjs
//
// Candidate 1 drew all five keep glaives long and horizontal
// ([507.7,474.1,461.5,505.1,498.9], overlay-verified) — uniform overshoot.
// Each op slides its pommel cap forward along the haft axis (rigid,
// overlap, no fill fabrication) to ~425px. Poses, identity and lighting
// untouched. Original stays immutable; output is misc-prepared-source.png.
// NOT an image request / ledger event.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC='art/motion/lidian/misc-candidate-1.png'
const OUT='art/motion/lidian/misc-prepared-source.png'
const EXPECTED_SHA='a0651ebd5696bdf2cef248cb62c132372e64d2d91de0ed56c7712a1e4f5df6b4'

// Verified endpoints (full-sheet overlay, all markers on material).
const OPS=[
  {cell:0,mode:'shorten',tip:[518,63],pommel:[24,180],amount:83,t0:85,band:22},
  {cell:1,mode:'shorten',tip:[1014,230],pommel:[541,197],amount:49,t0:55,band:20},
  {cell:2,mode:'shorten',tip:[1506,148],pommel:[1045,169],amount:36,t0:45,band:18},
  {cell:3,mode:'shorten',tip:[532,492],pommel:[28,459],amount:80,t0:85,band:20},
  {cell:4,mode:'shorten',tip:[1061,419],pommel:[571,513],amount:74,t0:80,band:22},
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
