#!/usr/bin/env node
// CMR-14A focused round1 override: repair cells0/3/4 only, preserve cells1/2
// from the safe partial. This is an offline source, never a runtime catalog.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {alphaComponents,cleanAlpha} from './motion-pipeline.mjs'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'

const BASE='art/motion/xiahoudun/charge-partial-retouched-source.png'
const FIX='art/motion/xiahoudun/charge-repair-1.png'
const OUT='art/motion/xiahoudun/charge-repair-1-spliced-source.png'
const BASE_SHA='dedac2b17b122fccce30700963795876b7a2b681529e46db66e16a781fb0ab57'
const FIX_SHA='4c578feefc6045fe3e80e93f349b9ce305aa06c64e1139c50f790aefbb037c82'
const cellOf=gridCellOf(3,3),expected=[0,1,2,3,4,5,6,7,8]
const digest=bytes=>createHash('sha256').update(bytes).digest('hex')
const clone=im=>({width:im.width,height:im.height,data:new Uint8ClampedArray(im.data)})

/** Protect original body paint, including the cloth fringe under the cap. */
export function assertRepairBodyUnchanged(before,after){
  for(const [label,[x0,y0,x1,y1]] of [
    ['rear hand',[104,158,166,217]],['front hand',[249,158,303,210]],
    ['cloth fringe',[54,213,116,240]],['robe',[75,239,201,295]],
  ])for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const k=(y*before.width+x)*4
    for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`charge repair: ${label} changed at (${x},${y})`)
  }
}

/** Pure extension, based on the verified shaft axis. band13 trial included
 * 14 cloth-fringe pixels; band9 retains the cap and excludes that paint. */
export function extendRepairedChargeCoil(source){
  const im=clone(source),W=im.width,H=im.height
  if(W!==1536||H!==1024)throw Error('charge repair: expected 1536x1024')
  const cap=[56,202],tip=[421,164],dx=tip[0]-cap[0],dy=tip[1]-cap[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,band=9
  const measure=(image,component)=>{
    let lo=Infinity,hi=-Infinity
    for(const p of component.pixels){
      const x=p%W,y=(p/W)|0,t=(x-cap[0])*ux+(y-cap[1])*uy,o=-(x-cap[0])*uy+(y-cap[1])*ux
      if(Math.abs(o)>band)continue
      lo=Math.min(lo,t);hi=Math.max(hi,t)
    }
    return hi-lo
  }
  const comps=alphaComponents(im,96).filter(c=>c.area>64)
  const comp=comps.find(c=>cellOf(c,W,H)===0)
  if(!comp)throw Error('charge repair: coil component missing')
  const preLen=measure(im,comp),shift=[-40,4],predicted=preLen+Math.hypot(...shift)
  const report=applyRetouchOp(im,{
    cell:0,mode:'extend',cap,angleDeg:Math.atan2(dy,dx)*180/Math.PI,
    t0:42,band,shift,oShaft:[-5,6],slab:[33,49],predicted,
  },{cellOf,measure})
  assertRepairBodyUnchanged(source,im)
  // All other source pixels outside this endpoint corridor are immutable.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(x<106&&y>=182&&y<224)continue
    const k=(y*W+x)*4
    for(let c=0;c<4;c++)if(source.data[k+c]!==im.data[k+c])throw Error(`charge repair: off-corridor pixel changed (${x},${y})`)
  }
  const specks=image=>alphaComponents(image,96).filter(c=>c.area<=64).map(c=>[c.area,c.x0,c.y0,c.x1,c.y1])
  if(JSON.stringify(specks(source))!==JSON.stringify(specks(im)))throw Error('charge repair: new detached pieces')
  verifySheetComposition(im,{expectCells:expected,cellOf})
  return {image:im,report:{preLen,predicted,...report}}
}

/** Alpha-only cleanup + component-level splice, no rescale or cell-box crop.
 * Cell bounds may cross virtual gridlines: source ownership is component-based. */
export function spliceChargeRepair(base,repair){
  if(base.width!==repair.width||base.height!==repair.height)throw Error('charge repair: source dimensions differ')
  const extended=extendRepairedChargeCoil(repair),original=clone(base),fixed=clone(extended.image)
  const cleanup=images=>images.map(image=>cleanAlpha(image,{alphaThreshold:96,speckMaxPx:64,residueTolerancePx:150000}))
  const cleanupReport=cleanup([original,fixed])
  const maps=[original,fixed].map(image=>{
    verifySheetComposition(image,{expectCells:expected,cellOf})
    return new Map(alphaComponents(image,96).filter(c=>c.area>64).map(c=>[cellOf(c,image.width,image.height),c]))
  })
  const out={width:base.width,height:base.height,data:new Uint8ClampedArray(base.data.length)},owners=new Int8Array(base.width*base.height).fill(-1),frames=[]
  const pixelHash=(image,c)=>{const hash=createHash('sha256');for(const p of [...c.pixels].sort((a,b)=>a-b)){hash.update(image.data.subarray(p*4,p*4+4))}return hash.digest('hex')}
  for(const cell of expected){
    const from=[0,3,4].includes(cell)?1:0,image=[original,fixed][from],comp=maps[from].get(cell)
    if(!comp)throw Error('charge repair: missing cell '+cell)
    for(const p of comp.pixels){
      if(owners[p]!==-1)throw Error(`charge repair: figures collide ${cell}/${owners[p]}`)
      owners[p]=cell;out.data.set(image.data.subarray(p*4,p*4+4),p*4)
    }
    const want=pixelHash(image,comp),actual=pixelHash(out,comp)
    if(want!==actual)throw Error('charge repair: source pixels not preserved')
    frames.push({cell,source:from?'repair1+isolated-c0-extension':'safe-partial',area:comp.area,pixelSha256:want})
  }
  const composition=verifySheetComposition(out,{expectCells:expected,cellOf})
  return {image:out,extension:extended.report,frames,composition,cleanup:cleanupReport.map(g=>({removedGlowPx:g.removedGlowPx,removedSpeckPx:g.removedSpeckPx}))}
}

async function loadPinned(path,want){
 const bytes=readFileSync(path)
 if(digest(bytes)!==want)throw Error('charge repair: input hash changed '+path)
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 return g.getImageData(0,0,img.width,img.height)
}
async function main(){
 const result=spliceChargeRepair(await loadPinned(BASE,BASE_SHA),await loadPinned(FIX,FIX_SHA))
 const cv=createCanvas(result.image.width,result.image.height),g=cv.getContext('2d'),d=g.createImageData(result.image.width,result.image.height);d.data.set(result.image.data);g.putImageData(d,0,0)
 const png=cv.toBuffer('image/png')
 writeFileSync(OUT,png)
 console.log(JSON.stringify({file:OUT,sha256:digest(png),extension:result.extension,composition:result.composition,frames:result.frames,cleanup:result.cleanup},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
