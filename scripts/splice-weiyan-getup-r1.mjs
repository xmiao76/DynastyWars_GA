#!/usr/bin/env node
// CMR-11A R1: splice ONLY the repaired getup elbow (cell 6) from the
// acceptance-4 repair output into the prepared source. Originals stay
// immutable and hashed. Same >=96 cleanup + gates as prior splices.
//   node scripts/splice-weiyan-getup-r1.mjs
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'

const SOURCE='art/motion/weiyan/getup-v2-prepared-source.png'
const REPAIR='art/motion/weiyan/getup-v2-repair-r1.png'
const OUT='art/motion/weiyan/getup-v2-repaired-source.png'
const REPLACE=new Set([6])
const EXPECTED={source:'e88295dcba36752529d5c6b519bd2a105cff1ef68da1becbfbf99882dc8970ab',repair:'12d3981dc6f89bb8db8e7a5445e9b1afef329c62b1a77df0694626159559c003'}

async function load(path,hash){
 const bytes=readFileSync(path)
 const digest=createHash('sha256').update(bytes).digest('hex')
 if(digest!==hash)throw Error(`${path}: unexpected SHA256 ${digest}`)
 const image=await loadImage(bytes)
 const canvas=createCanvas(image.width,image.height)
 const g=canvas.getContext('2d');g.drawImage(image,0,0)
 const data=g.getImageData(0,0,image.width,image.height)
 const gate=cleanAlpha(data,{alphaThreshold:96,speckMaxPx:64,residueTolerancePx:150000})
 const cw=Math.floor(image.width/3),ch=Math.floor(image.height/3),byCell=new Map()
 for(const c of alphaComponents(data,96).filter(c=>c.area>64)){
  const col=Math.min(2,Math.floor((c.x0+c.x1+1)/2/cw)),row=Math.min(2,Math.floor((c.y0+c.y1+1)/2/ch)),cell=row*3+col
  if(byCell.has(cell))throw Error(`${path}: duplicate figure at cell ${cell}`)
  byCell.set(cell,c)
 }
 return{image,data,byCell,gate}
}
const source=await load(SOURCE,EXPECTED.source),repair=await load(REPAIR,EXPECTED.repair)
if(source.image.width!==repair.image.width||source.image.height!==repair.image.height)throw Error('repair dimensions differ')
if(source.gate.components.length!==5)throw Error(`source should have five figures, got ${source.gate.components.length}`)
if(repair.gate.components.length!==9)throw Error(`repair output should have nine figures, got ${repair.gate.components.length}`)
const width=source.image.width,height=source.image.height
const out=createCanvas(width,height),g=out.getContext('2d'),result=g.createImageData(width,height)
const owners=new Int8Array(width*height).fill(-1)
const frames=[]
for(const cell of [1,3,4,6,8]){
 const selected=REPLACE.has(cell)?repair:source
 const comp=selected.byCell.get(cell)
 if(!comp)throw Error(`kept cell ${cell} has no drawing`)
 const hash=createHash('sha256')
 for(const p of [...comp.pixels].sort((a,b)=>a-b)){
  if(owners[p]!==-1)throw Error(`figure ${cell} collided at pixel ${p}`)
  owners[p]=cell
  const off=p*4
  for(let i=0;i<4;i++)result.data[off+i]=selected.data.data[off+i]
  hash.update(selected.data.data.subarray(off,off+4))
 }
 frames.push({cell,origin:REPLACE.has(cell)?'repair-r1':'prepared',area:comp.area,sha256:hash.digest('hex')})
}
g.putImageData(result,0,0)
const checked=alphaComponents(result,96).filter(c=>c.area>64)
if(checked.length!==5)throw Error(`splice must retain five separated figures; got ${checked.length}`)
for(const c of checked){
 if(c.x0===0||c.y0===0||c.x1>=width-1||c.y1>=height-1)throw Error('figure touches outer image edge')
}
const png=out.toBuffer('image/png')
writeFileSync(OUT,png)
console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),components:checked.length,frames},null,2))
