#!/usr/bin/env node
// CMR-14A: PARTIAL charge retouch, not sheet acceptance.
//
// node scripts/retouch-xiahoudun-charge.mjs
//
// Only cells 1 and 2 survive pair review. The earlier five-op trial
// passed numeric gates but moved hand/cloth/forearm paint in cells 0/3/4.
// Those cells now remain byte-identical to the immutable candidate.
// Do not use charge-partial-retouched-source.png as an accepted pack source.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {applyRetouchOp,gridCellOf,verifySheetComposition} from './motion-retouch.mjs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC='art/motion/xiahoudun/charge-candidate-1.png'
const OUT='art/motion/xiahoudun/charge-partial-retouched-source.png'
const EXPECTED_SHA='0afda71c6406eb103465f7f859bcdd8bf6ba9b85f26e341524f06efde29c5257'
const cellOf=gridCellOf(3,3)
const EXPECT_CELLS=[0,1,2,3,4,5,6,7,8]
const OPS=[
  {cell:1,tip:[1043,148],cap:[558,195],amount:62,t0:68,band:12},
  {cell:2,tip:[1528,138],cap:[1078,179],amount:27,t0:35,band:12},
]

// Full protected rectangles include the original front/rear grips and
// surrounding cloth. Compare ALL RGBA, not just opaque pixel counts.
const PROTECTED=[
  {label:'cell0 rear grip',rect:[100,160,151,207]},
  {label:'cell3 rear grip',rect:[154,488,196,540]},
  {label:'cell4 rear forearm',rect:[630,482,691,537]},
  {label:'cell1 rear grip',rect:[710,145,775,211]},
  {label:'cell1 front grip',rect:[805,139,870,209]},
  {label:'cell1 cloth',rect:[604,218,717,253]},
  {label:'cell2 rear grip',rect:[1211,132,1282,205]},
  {label:'cell2 front grip',rect:[1330,121,1405,193]},
  {label:'cell2 cloth',rect:[1160,201,1250,232]},
]

/** Exposed for positive/negative-control tests; no file writes. */
export function assertChargeProtectedPixels(before,after){
  if(before.width!==after.width||before.height!==after.height)throw Error('charge: image dimensions changed')
  const W=before.width
  for(const {label,rect:[x0,y0,x1,y1]} of PROTECTED){
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const k=(y*W+x)*4
      for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`charge: ${label} changed at (${x},${y})`)
    }
  }
}

/** Copy-on-write: rejected geometry never alters the caller's source. */
export function retouchXiahoudunCharge(source){
  const im={width:source.width,height:source.height,data:new Uint8ClampedArray(source.data)}
  verifySheetComposition(im,{expectCells:EXPECT_CELLS,cellOf})
  const beforeComps=alphaComponents(source,96).filter(c=>c.area>64)
  const allowed=new Uint8Array(im.width*im.height)
  for(const c of beforeComps){
    if(![1,2].includes(cellOf(c,im.width,im.height)))continue
    for(let y=Math.max(0,c.y0-6);y<=Math.min(im.height-1,c.y1+6);y++)for(let x=Math.max(0,c.x0-6);x<=Math.min(im.width-1,c.x1+6);x++)allowed[y*im.width+x]=1
  }
  const report=[]
  for(const op of OPS){
    const dx=op.tip[0]-op.cap[0],dy=op.tip[1]-op.cap[1],len=Math.hypot(dx,dy)
    const ux=dx/len,uy=dy/len
    const shift=[Math.round(op.amount*ux),Math.round(op.amount*uy)]
    const measure=(image,component)=>{
      let lo=Infinity,hi=-Infinity
      for(const p of component.pixels){
        const x=p%image.width,y=(p/image.width)|0
        const t=(x-op.cap[0])*ux+(y-op.cap[1])*uy
        const offset=-(x-op.cap[0])*uy+(y-op.cap[1])*ux
        if(Math.abs(offset)>op.band)continue
        lo=Math.min(lo,t);hi=Math.max(hi,t)
      }
      return hi-lo
    }
    const component=alphaComponents(im,96).filter(c=>c.area>64).find(c=>cellOf(c,im.width,im.height)===op.cell)
    if(!component)throw Error(`charge: cell ${op.cell} missing`)
    const preLen=measure(im,component),predicted=preLen-Math.hypot(...shift)
    const result=applyRetouchOp(im,{...op,mode:'shorten',angleDeg:Math.atan2(dy,dx)*180/Math.PI,shift,predicted},{cellOf,measure})
    report.push({cell:op.cell,shift,preLen,predicted,...result})
  }
  assertChargeProtectedPixels(source,im)
  for(let p=0;p<allowed.length;p++){
    if(allowed[p])continue
    const k=p*4
    for(let c=0;c<4;c++)if(source.data[k+c]!==im.data[k+c])throw Error(`charge: non-target pixel changed at ${p}`)
  }
  // Seven untouched figures must retain their exact solid RGBA pixels.
  for(const c of beforeComps){
    const cell=cellOf(c,im.width,im.height)
    if([1,2].includes(cell))continue
    for(const p of c.pixels)for(let channel=0;channel<4;channel++){
      const k=p*4+channel
      if(source.data[k]!==im.data[k])throw Error(`charge: untouched cell ${cell} changed`)
    }
  }
  const specks=image=>alphaComponents(image,96).filter(c=>c.area<=64).map(c=>[c.area,c.x0,c.y0,c.x1,c.y1])
  if(JSON.stringify(specks(source))!==JSON.stringify(specks(im)))throw Error('charge: detached speck inventory changed')
  const composition=verifySheetComposition(im,{expectCells:EXPECT_CELLS,cellOf})
  return {image:im,report,composition,heldCells:[0,3,4]}
}

async function main(){
  const bytes=readFileSync(SRC)
  if(createHash('sha256').update(bytes).digest('hex')!==EXPECTED_SHA)throw Error('charge: unexpected source SHA256')
  const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
  const d=g.getImageData(0,0,img.width,img.height)
  const {image,report,composition,heldCells}=retouchXiahoudunCharge(d)
  d.data.set(image.data);g.putImageData(d,0,0)
  const png=cv.toBuffer('image/png')
  // Write only after EVERY geometry, body-pixel, untouched-cell and speck gate.
  writeFileSync(OUT,png)
  console.log(JSON.stringify({status:'HELD',file:OUT,sha256:createHash('sha256').update(png).digest('hex'),report,composition,heldCells},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
