#!/usr/bin/env node
// CMR-12A: splice jab2 cell 4 (from fix-1: bow shortened into the cluster)
// into the original sheet. Originals stay immutable and hashed.
//   node scripts/splice-huangzhong-jab2.mjs
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'

const ORIG='art/motion/huangzhong/jab2-candidate-1.png'
const FIX1='art/motion/huangzhong/jab2-fix-1.png'
const OUT='art/motion/huangzhong/jab2-prepared-source.png'
const REPLACE={4:'fix1'}
const EXPECTED={
  orig:'1cb7304ba12bf9b280abe8bcb3490ecfa052d195dcda158472d767d6dfdcd135',
  fix1:'f10b07687a218795ce6b2a844c317914a46d9b08122a34cd8f02c4f0b5502688',
}

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
const cellHash=(data,comp)=>{const h=createHash('sha256');for(const p of [...comp.pixels].sort((a,b)=>a-b))h.update(data.data.subarray(p*4,p*4+4));return h.digest('hex')}
const orig=await load(ORIG,EXPECTED.orig),fix1=await load(FIX1,EXPECTED.fix1)
if(fix1.image.width!==orig.image.width||fix1.image.height!==orig.image.height)throw Error('fix1 dimensions differ')
if(orig.gate.components.length!==9||fix1.gate.components.length!==9)throw Error('both sheets should have nine figures')
const srcs={orig,fix1}
const width=orig.image.width,height=orig.image.height
const out=createCanvas(width,height),g=out.getContext('2d'),result=g.createImageData(width,height)
const owners=new Int8Array(width*height).fill(-1)
const frames=[]
for(let cell=0;cell<9;cell++){
  const origin=REPLACE[cell]??'orig'
  const selected=srcs[origin]
  const comp=selected.byCell.get(cell)
  if(!comp)throw Error(`cell ${cell} missing in ${origin}`)
  for(const p of comp.pixels){
    if(owners[p]!==-1)throw Error(`figure ${cell} collided at pixel ${p}`)
    owners[p]=cell
    const off=p*4
    for(let i=0;i<4;i++)result.data[off+i]=selected.data.data[off+i]
  }
  frames.push({cell,origin,area:comp.area,sha256:cellHash(selected.data,comp)})
}
for(const f of frames.filter(f=>f.origin==='orig')){
  const want=cellHash(orig.data,orig.byCell.get(f.cell))
  if(f.sha256!==want)throw Error(`cell ${f.cell} drifted (not a clean splice)`)
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
