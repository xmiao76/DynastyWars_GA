#!/usr/bin/env node
// CMR-13A: splice getup cell 0 (focused fix into retouched sheet
// fix) into the original sheet. Originals stay immutable.
//   node scripts/splice-lidian-walk.mjs
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'

const ORIG='art/motion/lidian/getup-prepared-source.png'
const FIX='art/motion/lidian/getup-fix-1.png'
const OUT='art/motion/lidian/getup-prepared-source.png'
const REPLACE={0:'fix'}
const EXPECTED={
  orig:'8e3166463227dfa6ad293da110c5179606d2565e8481a1d5d21f92a15759a725',
  fix:'894e4470676e4b51d32973e69a0f03e7e721607068da238cc2f7d009dfd5df61',
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
const orig=await load(ORIG,EXPECTED.orig),fix=await load(FIX,EXPECTED.fix)
if(fix.image.width!==orig.image.width||fix.image.height!==orig.image.height)throw Error('fix dimensions differ')
if(fix.gate.components.length!==9||orig.gate.components.length!==9)throw Error('expected nine figures')
const srcs={orig,fix}
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
