#!/usr/bin/env node
// CMR-14A independent review finding: shortened cap overpainted walk:0
// fingers. Restore original foreground hand pixels, never invent anatomy.
// New override; immutable candidate and prior prepared source remain intact.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {gridCellOf,verifySheetComposition} from './motion-retouch.mjs'

const ORIGINAL='art/motion/xiahoudun/walk-candidate-1.png'
const PREPARED='art/motion/xiahoudun/walk-prepared-source.png'
const OUTPUT='art/motion/xiahoudun/walk-guard-grip-restored-source.png'
const ORIGINAL_SHA='68a7de2bb2f5a4b35a93d0ff1610592dbe0d70aacbc20e9f884e08d7200b2223'
const PREPARED_SHA='b395c867c027f837988c5f0fdb676154082d07a43ce9fcc5df8c73786f1bef6c'
// Original rear fist/wrist rectangle, including the original visible shaft
// behind the wrap. The remote shortened butt/blade endpoints are excluded.
export const GRIP_RECT=[144,162,184,218]
export function restoreGuardGrip(original,prepared){
 if(original.width!==prepared.width||original.height!==prepared.height)throw Error('guard grip: source dimensions differ')
 const result={width:prepared.width,height:prepared.height,data:new Uint8ClampedArray(prepared.data)}
 const [x0,y0,x1,y1]=GRIP_RECT,W=result.width
 let changedChannels=0
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const k=(y*W+x)*4
   for(let c=0;c<4;c++){
     if(result.data[k+c]!==original.data[k+c])changedChannels++
     result.data[k+c]=original.data[k+c]
   }
 }
 if(changedChannels===0)throw Error('guard grip: patch changed no pixels; unexpected source')
 const composition=verifySheetComposition(result,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf:gridCellOf(3,3)})
 return {image:result,rect:[...GRIP_RECT],changedChannels,composition}
}
async function loadPinned(path,sha){
 const bytes=readFileSync(path)
 if(createHash('sha256').update(bytes).digest('hex')!==sha)throw Error('guard grip: source hash changed '+path)
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 return g.getImageData(0,0,img.width,img.height)
}
async function main(){
 const result=restoreGuardGrip(await loadPinned(ORIGINAL,ORIGINAL_SHA),await loadPinned(PREPARED,PREPARED_SHA))
 const cv=createCanvas(result.image.width,result.image.height),g=cv.getContext('2d'),d=g.createImageData(result.image.width,result.image.height);d.data.set(result.image.data);g.putImageData(d,0,0)
 const png=cv.toBuffer('image/png');writeFileSync(OUTPUT,png)
 console.log(JSON.stringify({file:OUTPUT,sha256:createHash('sha256').update(png).digest('hex'),rect:result.rect,changedChannels:result.changedChannels,composition:result.composition},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
