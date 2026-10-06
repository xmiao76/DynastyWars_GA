#!/usr/bin/env node
// CMR-13A: deterministic pommel-end shortens closing getup (candidate 1).
//
//   node scripts/retouch-lidian-getup.mjs
//
// Candidate 1 drew keep cells c1/c3 long ([487.1,449.9],
// overlay-verified) with c2/c8 already in-band (431.9/406.7); c0 comes
// from the focused fix (spliced separately). c1 pommel-end uses an
// asymmetric band threading the boot/cap gap (paint-verified); c3
// plain pommel-end. Each op slides rigidly (overlap, no fill
// fabrication) to ~425px. (c0 was unretouchable: boot blocks
// pommel-end, face blocks blade-end — pair-rejected void proved it.)
// Poses, identity and lighting untouched. Original stays immutable;
// output feeds scripts/splice-lidian-getup.mjs. NOT an image request /
// ledger event.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC='art/motion/lidian/getup-candidate-1.png'
const OUT='art/motion/lidian/getup-prepared-source.png'
const EXPECTED_SHA='ed0b179ae5eab3e2312eebcf7f845ba40043c8f025cd0663da14431cb5d327a2'

// Verified endpoints (full-sheet overlay, all markers on material).
const OPS=[
  {cell:1,mode:'shorten',tip:[1050,238],pommel:[563,248],amount:62,t0:70,band:[-6,24]},
  {cell:3,mode:'shorten',tip:[515,536],pommel:[66,564],amount:25,t0:40,band:20},
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
    shift,predicted,maxShortenPx:o.maxShortenPx,
  },{cellOf,measure})
  console.log(JSON.stringify({cell:o.cell,preLen:+preLen.toFixed(1),shift,predicted:+predicted.toFixed(1),...r}))
}
const comp=verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
console.log('composition',JSON.stringify(comp))
g.putImageData(d,0,0)
const png=cv.toBuffer('image/png')
writeFileSync(OUT,png)
console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex')}))
