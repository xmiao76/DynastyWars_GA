#!/usr/bin/env node
// CMR-14A paint pass 2 (reviewer item: charge:4 still warmer than walk/charge1-3,
// charge:3 mildly warmer than charge:2). RGB-only, same named polygons and same
// protected weapon as pass 1; input is the immutable pass-1 output. Cells 0,1,2,
// 5..8 stay byte-exact; alpha never changes.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{createHash}from'node:crypto'
import{readFileSync,writeFileSync}from'node:fs'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{alphaComponents}from'./motion-pipeline.mjs'
import{gridCellOf,verifySheetComposition}from'./motion-retouch.mjs'
import{chargePaintAdjustment}from'./harmonize-xiahoudun-charge-paint.mjs'
const SRC='art/motion/xiahoudun/charge-paint-harmonized-source.png'
const SHA='98e2531f1763bdb5a6b4ad045518e159987a51f8c264d7f4fb64f657a323c5fe'
const OUT='art/motion/xiahoudun/charge-paint-harmonized-2-source.png'
const cellOf=gridCellOf(3,3)
export const PASS2_CELLS=[3,4]
// Per-cell strength: charge:4 carries the larger residual warmth/brightness.
export const PASS2_STRENGTH={
 3:{armour:{gain:.94,chroma:.94},skin:{gain:.95,chroma:.96}},
 4:{armour:{gain:.90,chroma:.90},skin:{gain:.93,chroma:.94}},
}
function ownerMap(image){
 const W=image.width,H=image.height,owners=new Int8Array(W*H).fill(-1)
 for(const c of alphaComponents(image,96).filter(c=>c.area>64)){const cell=cellOf(c,W,H);for(const p of c.pixels)owners[p]=cell}
 return owners
}
export function assertPass2Conservation(before,after){
 if(before.width!==after.width||before.height!==after.height)throw Error('charge paint2: dimensions changed')
 const W=before.width,H=before.height,owners=ownerMap(before)
 for(let p=0;p<W*H;p++){
  const k=p*4,x=p%W,y=(p/W)|0,cell=owners[p]
  if(before.data[k+3]!==after.data[k+3])throw Error('charge paint2: alpha/silhouette changed')
  const targeted=PASS2_CELLS.includes(cell)&&chargePaintAdjustment(cell,x,y)
  if(!targeted)for(let c=0;c<3;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`charge paint2: protected/untargeted pixel changed (${x},${y}) cell${cell}`)
 }
}
export function harmonizeChargePaint2(source){
 if(source.width!==1536||source.height!==1024)throw Error('charge paint2: expected1536x1024')
 const out={width:source.width,height:source.height,data:new Uint8ClampedArray(source.data)},W=source.width,owners=ownerMap(source),counts={3:0,4:0}
 for(let p=0;p<W*source.height;p++){
  const cell=owners[p];if(!PASS2_CELLS.includes(cell))continue
  const x=p%W,y=(p/W)|0,a=chargePaintAdjustment(cell,x,y);if(!a)continue
  const s=PASS2_STRENGTH[cell][a.kind],k=p*4,r=source.data[k],g=source.data[k+1],b=source.data[k+2],l=.2126*r+.7152*g+.0722*b
  const w=a.kind==='skin'?[.99,1,1.01]:[.995,1,1.005];let changed=false
  for(let c=0;c<3;c++){const old=source.data[k+c],target=(l+(old-l)*s.chroma)*s.gain*w[c],v=Math.round(old+(target-old)*a.weight);out.data[k+c]=v;if(v!==old)changed=true}
  if(changed)counts[cell]++
 }
 assertPass2Conservation(source,out)
 return{image:out,changedRgbPixels:counts,composition:verifySheetComposition(out,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})}
}
async function main(){
 const bytes=readFileSync(SRC);if(createHash('sha256').update(bytes).digest('hex')!==SHA)throw Error('charge paint2: pass-1 input hash changed')
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 const result=harmonizeChargePaint2(g.getImageData(0,0,img.width,img.height)),d=g.createImageData(img.width,img.height);d.data.set(result.image.data);g.putImageData(d,0,0)
 const png=cv.toBuffer('image/png');writeFileSync(OUT,png)
 console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),changedRgbPixels:result.changedRgbPixels,composition:result.composition},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
