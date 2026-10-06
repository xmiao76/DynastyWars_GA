#!/usr/bin/env node
// CMR-13A: deterministic pommel-end shortens for the combo keep-set.
//
//   node scripts/retouch-lidian-combo.mjs
//
// Fix-4 recomposed cell 0 near-horizontal at 494.3px; orig cell 1 runs
// 463.1px. Each op slides its pommel cap forward along the haft axis
// (rigid, overlap, no fill fabrication) to land ~425px (sibling mean).
// Originals stay immutable; outputs feed scripts/splice-lidian-combo.mjs.
// NOT image requests / ledger events.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

// Verified endpoints (overlay, steel/gold extremes on material) + op geometry.
const JOBS=[
  {src:'art/motion/lidian/combo-fix-4.png',out:'art/motion/lidian/combo-fix-4-retouched.png',
   sha:'eb22ef711c4d46ffb9f68d7e2cbb4ecaa80d2bf90fb6a1326ab4fe4ba02e426e',
   cell:0,tip:[18,196],pommel:[512,213],shortenBy:69.3,t0:75,band:24},
  {src:'art/motion/lidian/combo-candidate-1.png',out:'art/motion/lidian/combo-candidate-1-retouched.png',
   sha:'bad5e220978361eee21061c7d5a1cd14bdf714876ebdd219006315cbaf5056fb',
   cell:1,tip:[990,32],pommel:[594,272],shortenBy:38,t0:45,band:12},
]

const cellOf=gridCellOf(3,3)
for(const o of JOBS){
  const bytes=readFileSync(o.src)
  if(createHash('sha256').update(bytes).digest('hex')!==o.sha)throw Error(`${o.src}: unexpected SHA256`)
  const img=await loadImage(bytes)
  const cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
  const d=g.getImageData(0,0,img.width,img.height)
  const im={width:d.width,height:d.height,data:d.data}
  const dx=o.tip[0]-o.pommel[0],dy=o.tip[1]-o.pommel[1]
  const len=Math.hypot(dx,dy)
  const ux=dx/len,uy=dy/len
  const angleDeg=Math.atan2(dy,dx)*180/Math.PI
  const shift=[Math.round(o.shortenBy*ux),Math.round(o.shortenBy*uy)]
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
  console.log(JSON.stringify({src:o.src,preLen:+preLen.toFixed(1),shift,predicted:+predicted.toFixed(1),...r}))
  const comp=verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
  console.log('composition',JSON.stringify(comp))
  g.putImageData(d,0,0)
  const png=cv.toBuffer('image/png')
  writeFileSync(o.out,png)
  console.log(JSON.stringify({file:o.out,sha256:createHash('sha256').update(png).digest('hex')}))
}
