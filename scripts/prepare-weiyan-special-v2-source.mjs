#!/usr/bin/env node
// CMR-11A: preserve the unmodified special-v2 source and cull cells
// [2,5,6,7] in memory. Play order: 0 raise, 1 coil, 8 pre-spin,
// 3 strike, 4 follow. All source hashes/edges checked before output.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'
const source='art/motion/weiyan/special-v2-candidate-1.png'
const output='art/motion/weiyan/special-v2-prepared-source.png'
const expected='1826002eba739bd25f96c78d62afa09b0c7938b0315374add63bc586ba7e3a55'
const bytes=readFileSync(source)
if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('special source hash changed since review')
const image=await loadImage(bytes),W=image.width,H=image.height
if(W!==1536||H!==1024)throw Error('unexpected source dimensions')
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
const d=ctx.getImageData(0,0,W,H),kept=new Set([0,1,3,4,8]),cw=Math.floor(W/3),ch=Math.floor(H/3)
const comps=alphaComponents(d,96)
if(comps.filter(c=>c.area>64).length!==9)throw Error('special should have nine source figures')
for(const c of comps){
 const cell=Math.min(2,Math.floor((c.y0+c.y1+1)/2/ch))*3+Math.min(2,Math.floor((c.x0+c.x1+1)/2/cw))
 if(kept.has(cell))continue
 for(const p of c.pixels)d.data[p*4+3]=0
 for(let y=Math.max(0,c.y0-8);y<=Math.min(H-1,c.y1+8);y++)for(let x=Math.max(0,c.x0-8);x<=Math.min(W-1,c.x1+8);x++){
  const a=(y*W+x)*4+3;if(d.data[a]<96)d.data[a]=0
 }
}
const gate=cleanAlpha(d,{alphaThreshold:96,speckMaxPx:64,residueTolerancePx:150000})
if(gate.components.length!==5)throw Error(`expected five separate drawings; got ${gate.components.length}`)
const mapping=gate.components.map(c=>{
 if(c.x0===0||c.y0===0||c.x1>=W-1||c.y1>=H-1)throw Error('special drawing clipped by outer edge')
 return Math.min(2,Math.floor((c.y0+c.y1+1)/2/ch))*3+Math.min(2,Math.floor((c.x0+c.x1+1)/2/cw))
}).sort((a,b)=>a-b)
if(mapping.join(',')!==[...kept].sort((a,b)=>a-b).join(','))throw Error(`wrong kept-cell mapping ${mapping}`)
ctx.putImageData(d,0,0)
const png=canvas.toBuffer('image/png');writeFileSync(output,png)
console.log(JSON.stringify({file:output,sha256:createHash('sha256').update(png).digest('hex'),kept:mapping,playOrder:[0,1,8,3,4],removedGlowPx:gate.removedGlowPx,removedSpeckPx:gate.removedSpeckPx}))
