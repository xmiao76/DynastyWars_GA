#!/usr/bin/env node
// CMR-11A: keep only verified finisher-v2 drawings; never alter original.
// Rejects source drift and sheet-edge contact, emits an immutable-derived
// 5-drawing sheet for the later complete-pack prepare. Play order is
// [0 coil, 1 launch, 3 heavy extension, 6 follow, 4 recover].
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'
const src='art/motion/weiyan/finisher-v2-candidate-1.png'
const dst='art/motion/weiyan/finisher-v2-prepared-source.png'
const expected='ff69e72c0fab1ebd5e1e0fe1ffac0839f7b32005f745c27f3b7cf91d16626a20'
const bytes=readFileSync(src)
if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('finisher source changed since review')
const image=await loadImage(bytes),W=image.width,H=image.height
if(W!==1536||H!==1024)throw Error('unexpected finisher sheet dimensions')
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
const d=ctx.getImageData(0,0,W,H),keep=new Set([0,1,3,4,6]),cw=Math.floor(W/3),ch=Math.floor(H/3)
const before=alphaComponents(d,96)
if(before.filter(c=>c.area>64).length!==9)throw Error('expected nine original drawings')
for(const c of before){
 const cell=Math.min(2,Math.floor((c.y0+c.y1+1)/2/ch))*3+Math.min(2,Math.floor((c.x0+c.x1+1)/2/cw))
 if(keep.has(cell))continue
 for(const p of c.pixels)d.data[p*4+3]=0
 for(let y=Math.max(0,c.y0-8);y<=Math.min(H-1,c.y1+8);y++)for(let x=Math.max(0,c.x0-8);x<=Math.min(W-1,c.x1+8);x++){
  const alpha=(y*W+x)*4+3
  if(d.data[alpha]<96)d.data[alpha]=0
 }
}
const result=cleanAlpha(d,{alphaThreshold:96,speckMaxPx:64,residueTolerancePx:150000})
if(result.components.length!==5)throw Error(`expected five kept figures, got ${result.components.length}`)
const mapping=result.components.map(c=>{
 if(c.x0===0||c.y0===0||c.x1>=W-1||c.y1>=H-1)throw Error('finisher source clipped at sheet edge')
 return Math.min(2,Math.floor((c.y0+c.y1+1)/2/ch))*3+Math.min(2,Math.floor((c.x0+c.x1+1)/2/cw))
}).sort((a,b)=>a-b)
if(mapping.join(',')!==[...keep].sort((a,b)=>a-b).join(','))throw Error(`wrong component mapping: ${mapping}`)
ctx.putImageData(d,0,0)
const out=canvas.toBuffer('image/png')
writeFileSync(dst,out)
console.log(JSON.stringify({file:dst,sha256:createHash('sha256').update(out).digest('hex'),kept: mapping,playOrder:[0,1,3,6,4],removedGlowPx:result.removedGlowPx,removedSpeckPx:result.removedSpeckPx}))
