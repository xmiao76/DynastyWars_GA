#!/usr/bin/env node
// CMR-13A: deterministic pommel-end shorten on charge cells 2/3/4.
//
//   node scripts/retouch-lidian-charge.mjs
//
// The charge sheet passed locally (8.03%) but STOPs the pack projection
// (global 15.26%): three glaives overshoot the fixed band hi (441.8).
// Each op slides the pommel cap forward along the haft axis (rigid,
// overlap, no fill fabrication; blades/tassels/hands untouched) to land
// ~425px (walk mean 423.3). Original stays immutable; output is
// charge-prepared-source.png. NOT an image request / ledger event.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'

const SRC='art/motion/lidian/charge-candidate-1.png'
const OUT='art/motion/lidian/charge-prepared-source.png'
const EXPECTED_SHA='a0cfe1b1ebf3a466b05cacebfd0e4c4861013252153ba1dbbb7da7d6a338c8a4'

// Verified endpoints (overlay 2026-10-05, all markers on wood) + shorten
// amounts. u points pommel -> blade; shift is rounded to integer px.
const OPS=[
  {cell:2,tip:[1508,112],pommel:[1048,228],shortenBy:49.4,t0:75,band:20},
  {cell:3,tip:[500,450],pommel:[68,572],shortenBy:23.9,t0:50,band:30},
  {cell:4,tip:[1052,392],pommel:[618,568],shortenBy:43.3,t0:70,band:20},
]

const bytes=readFileSync(SRC)
if(createHash('sha256').update(bytes).digest('hex')!==EXPECTED_SHA)throw Error('unexpected source SHA256')
const img=await loadImage(bytes)
const cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
const d=g.getImageData(0,0,img.width,img.height)
const im={width:d.width,height:d.height,data:d.data}
const cellOf=gridCellOf(3,3)

const results=[]
for(const o of OPS){
  const dx=o.tip[0]-o.pommel[0],dy=o.tip[1]-o.pommel[1]
  const len=Math.hypot(dx,dy)
  const ux=dx/len,uy=dy/len
  const angleDeg=Math.atan2(dy,dx)*180/Math.PI
  const shift=[Math.round(o.shortenBy*ux),Math.round(o.shortenBy*uy)]
  const slideLen=Math.hypot(shift[0],shift[1])
  // Measure hook: HAFT extent along u within the shaft strip (|o| <= the
  // op band, so leftover cap pixels would trip the gate). The full chord
  // (with curving blade tip) is verified separately by overlay re-measure;
  // the gate's job is proving the slide landed precisely (rigid haft
  // extent shrinks by |shift|).
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
  // Pre-op length via the SAME hook (self-consistent prediction).
  const {alphaComponents}=await import('./motion-pipeline.mjs')
  const pre=alphaComponents(im,96).filter(c=>c.area>64)
  const compPre=pre.find(c=>cellOf(c,im.width,im.height)===o.cell)
  if(!compPre)throw Error(`cell ${o.cell}: component missing pre-op`)
  const preLen=measure(im,compPre)
  const predicted=preLen-slideLen
  const r=applyRetouchOp(im,{
    cell:o.cell,mode:'shorten',cap:o.pommel,angleDeg,t0:o.t0,band:o.band,
    shift,predicted,
  },{cellOf,measure})
  results.push({cell:o.cell,preLen:+preLen.toFixed(1),shift,predicted:+predicted.toFixed(1),...r})
  console.log(JSON.stringify(results[results.length-1]))
}

const comp=verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
console.log('composition',JSON.stringify(comp))
g.putImageData(d,0,0)
const png=cv.toBuffer('image/png')
writeFileSync(OUT,png)
console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex')}))
