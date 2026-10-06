#!/usr/bin/env node
// CMR-14A: deterministic pommel-end shortens closing walk (candidate 1).
//
//   node scripts/retouch-xiahoudun-walk.mjs
//
// Candidate 1 drew all nine spears long ([528.2..444.1],
// overlay-verified) with 17.17% scatter — uniform overshoot plus
// variance. Each op slides its butt cap forward along the haft axis
// (rigid, overlap, no fill fabrication) to ~425px. Poses, identity and
// lighting untouched. Original stays immutable; output is
// walk-prepared-source.png. NOT an image request / ledger event.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC='art/motion/xiahoudun/walk-candidate-1.png'
const OUT='art/motion/xiahoudun/walk-prepared-source.png'
const EXPECTED_SHA='68a7de2bb2f5a4b35a93d0ff1610592dbe0d70aacbc20e9f884e08d7200b2223'

// Verified endpoints (full-sheet overlay, all markers on material).
const OPS=[
  {cell:0,mode:'shorten',tip:[519,42],pommel:[31,244],amount:103,t0:108,band:20},
  {cell:1,mode:'shorten',tip:[1030,65],pommel:[558,243],amount:79,t0:85,band:18},
  {cell:2,mode:'shorten',tip:[1521,74],pommel:[1085,245],amount:43,t0:50,band:16},
  {cell:3,mode:'shorten',tip:[516,410],pommel:[58,583],amount:65,t0:70,band:18},
  {cell:4,mode:'shorten',tip:[1032,407],pommel:[552,583],amount:86,t0:90,band:20},
  {cell:5,mode:'shorten',tip:[1518,416],pommel:[1078,584],amount:46,t0:52,band:16},
  {cell:6,mode:'shorten',tip:[516,761],pommel:[37,923],amount:81,t0:86,band:20},
  {cell:7,mode:'shorten',tip:[1033,766],pommel:[574,922],amount:60,t0:66,band:18},
  {cell:8,mode:'shorten',tip:[1521,763],pommel:[1106,921],amount:19,t0:30,band:14},
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
