#!/usr/bin/env node
// CMR-11A: replace only the two diagnosed jab1 drawings from a focused
// authoring request. Originals remain immutable and hashed in provenance.
// Source-alpha cleanup is the same >=96 threshold as preparePack: it drops
// the generated low-alpha halo before copying complete connected figures.
//   node scripts/splice-weiyan-jab1-v2.mjs
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'

const SOURCE='art/motion/weiyan/jab1-v2-candidate-1.png'
const REPAIR='art/motion/weiyan/jab1-v2-focused-r1.png'
const OUT='art/motion/weiyan/jab1-v2-prepared-source.png'
const REPLACE=new Set([1,2])
const EXPECTED={source:'39223dc7d6cf247233217a9afb31e1b3605911373c6f77428f832cf9583da3d0',repair:'64547d1a23135f299347a51f4a0e0dbe574a5177fcf9fc572bba2888574a6546'}

async function load(path,hash){
 const bytes=readFileSync(path)
 const digest=createHash('sha256').update(bytes).digest('hex')
 if(digest!==hash)throw Error(`${path}: unexpected SHA256 ${digest}`)
 const image=await loadImage(bytes)
 const canvas=createCanvas(image.width,image.height)
 const g=canvas.getContext('2d');g.drawImage(image,0,0)
 const data=g.getImageData(0,0,image.width,image.height)
 const gate=cleanAlpha(data,{alphaThreshold:96,speckMaxPx:64,residueTolerancePx:150000})
 if(gate.components.length!==9)throw Error(`${path}: expected exactly nine components, got ${gate.components.length}`)
 const cw=Math.floor(image.width/3),ch=Math.floor(image.height/3),byCell=new Map()
 for(const c of alphaComponents(data,96).filter(c=>c.area>64)){
  const col=Math.min(2,Math.floor((c.x0+c.x1+1)/2/cw)),row=Math.min(2,Math.floor((c.y0+c.y1+1)/2/ch)),cell=row*3+col
  if(byCell.has(cell))throw Error(`${path}: duplicate figure at cell ${cell}`)
  byCell.set(cell,c)
 }
 if(byCell.size!==9)throw Error(`${path}: missing source cell(s)`)
 return{image,data,byCell}
}
const source=await load(SOURCE,EXPECTED.source),repair=await load(REPAIR,EXPECTED.repair)
if(source.image.width!==repair.image.width||source.image.height!==repair.image.height)throw Error('repair dimensions differ')
const width=source.image.width,height=source.image.height
const out=createCanvas(width,height),g=out.getContext('2d'),result=g.createImageData(width,height)
const owners=new Int8Array(width*height).fill(-1)
const frames=[]
for(let cell=0;cell<9;cell++){
 const selected=REPLACE.has(cell)?repair:source
 const comp=selected.byCell.get(cell)
 const hash=createHash('sha256')
 for(const p of [...comp.pixels].sort((a,b)=>a-b)){
  if(owners[p]!==-1)throw Error(`figure ${cell} collided with ${owners[p]} at pixel ${p}`)
  owners[p]=cell
  const off=p*4
  for(let i=0;i<4;i++)result.data[off+i]=selected.data.data[off+i]
  hash.update(selected.data.data.subarray(off,off+4))
 }
 frames.push({cell,origin:REPLACE.has(cell)?'focused-r1':'original',area:comp.area,sha256:hash.digest('hex')})
}
g.putImageData(result,0,0)
const checked=alphaComponents(result,96).filter(c=>c.area>64)
if(checked.length!==9)throw Error(`splice must retain nine separated figures; got ${checked.length}`)
for(const c of checked){
 if(c.x0===0||c.y0===0||c.x1>=width-1||c.y1>=height-1)throw Error('figure touches outer image edge')
}
const png=out.toBuffer('image/png')
writeFileSync(OUT,png)
console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),components:checked.length,frames},null,2))
