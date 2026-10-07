#!/usr/bin/env node
// CMR-14A combo candidate 1, cell 4 ONLY: deterministic rear-cap slide into the
// fixed weapon band. Cell 4 is the one combo cell with clear shaft behind the
// rear fist (visually confirmed on 5x windows). Input is the immutable raw
// candidate; output is a NEW override. Never relabels a length pass as accepted
// art: protected fist/cuff witnesses + corridor-only change checks + enlarged pair.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{createHash}from'node:crypto'
import{readFileSync,writeFileSync}from'node:fs'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{alphaComponents}from'./motion-pipeline.mjs'
import{applyRetouchOp,gridCellOf,verifySheetComposition}from'./motion-retouch.mjs'
const SRC='art/motion/xiahoudun/combo-candidate-1.png'
const SRC_SHA='c2c5fefc1ac36a8ab428dca8cc966927df1103f5bda98d8dcbbf0304bccd6e0b'
const OUT='art/motion/xiahoudun/combo-cell4-slid-source.png'
const cellOf=gridCellOf(3,3),W0=1536,H0=1024
// Integer slide vector chosen for minimal perpendicular error to the shaft axis (0.15px; the
// first trial [28,-10] was 0.49px off and left a dotted seam on the cap edge).
export const CELL4={cell:4,cap:[569,560],tip:[1012,410],band:10,t0:50,shift:[30,-10]}
// Measured on actual pixels: gold ring ends t=36.4; first fist-skin pixel on the axis t=90.8.
// Moved piece (t<50) lands at t<80, i.e. >=10px short of the fist.
export const FIST_T=88
// rear fist + cuff (+ margin) and the skirt/robe just below the shaft: must stay byte-exact
export const COMBO_CELL4_WITNESSES=[['rear fist+cuff',[636,498,702,553]],['skirt/robe under shaft',[585,562,720,622]]]
const axis=()=>{const dx=CELL4.tip[0]-CELL4.cap[0],dy=CELL4.tip[1]-CELL4.cap[1],L=Math.hypot(dx,dy);return{ux:dx/L,uy:dy/L,L,angleDeg:Math.atan2(dy,dx)*180/Math.PI}}
const tOf=(x,y)=>{const{ux,uy}=axis();return[(x-CELL4.cap[0])*ux+(y-CELL4.cap[1])*uy,-(x-CELL4.cap[0])*uy+(y-CELL4.cap[1])*ux]}
/** Whole-material length restricted to the shaft corridor so robe/fist pixels are never picked as an endpoint. */
export function measureComboCell4Weapon(image,corridor=10){
 const W=image.width,H=image.height,comp=alphaComponents(image,96).filter(c=>c.area>64).find(c=>cellOf(c,W,H)===CELL4.cell)
 if(!comp)throw Error('combo cell4: component missing')
 let lo=Infinity,hi=-Infinity,loP=null,hiP=null
 for(const p of comp.pixels){const x=p%W,y=(p/W)|0,[t,o]=tOf(x,y);if(Math.abs(o)>corridor)continue;if(t<lo){lo=t;loP=[x,y]}if(t>hi){hi=t;hiP=[x,y]}}
 return{length:hi-lo,butt:loP,tip:hiP}
}
export function assertComboCell4Protected(before,after){
 if(before.width!==after.width||before.height!==after.height)throw Error('combo cell4: dimensions differ')
 const W=before.width,H=before.height,{ux,uy}=axis()
 for(const[label,[x0,y0,x1,y1]]of COMBO_CELL4_WITNESSES)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  // The rectangles also cover bare shaft the cap piece must slide INTO (fist skin
  // first appears at t~90.8, measured). On the shaft axis only t>=FIST_T is protected;
  // everything off-axis (fist, cuff, skirt, robe) is always protected.
  const[tw,ow]=tOf(x,y);if(Math.abs(ow)<=CELL4.band+2&&tw<FIST_T)continue
  const k=(y*W+x)*4;for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`combo cell4: ${label} changed at (${x},${y})`)
 }
 // every changed pixel must lie in the moved corridor piece
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=(y*W+x)*4;let diff=false;for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c]){diff=true;break}
  if(!diff)continue
  const[t,o]=tOf(x,y)
  // applyRetouchOp clears sub-threshold alpha halo in the vacated butt zone; those pixels are
  // invisible (alpha<=2 -> 0, measured: 3 pixels). Nothing else may change outside the corridor.
  if(before.data[k+3]<=2&&after.data[k+3]===0)continue
  if(Math.abs(o)>CELL4.band+2||t<-10||t>CELL4.t0+Math.hypot(...CELL4.shift)+6)throw Error(`combo cell4: pixel outside the moved corridor changed (${x},${y}) t=${t.toFixed(1)} o=${o.toFixed(1)}`)
 }
 void ux;void uy
}
export function slideComboCell4(source){
 if(source.width!==W0||source.height!==H0)throw Error('combo cell4: expected1536x1024')
 const im={width:source.width,height:source.height,data:new Uint8ClampedArray(source.data)},{angleDeg}=axis()
 verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
 const pre=measureComboCell4Weapon(source)
 const shift=[...CELL4.shift],slide=Math.hypot(...shift)
 const measure=(image,comp)=>{let lo=Infinity,hi=-Infinity;for(const p of comp.pixels){const x=p%image.width,y=(p/image.width)|0,[t,o]=tOf(x,y);if(Math.abs(o)>CELL4.band)continue;lo=Math.min(lo,t);hi=Math.max(hi,t)}return hi-lo}
 const comp=alphaComponents(im,96).filter(c=>c.area>64).find(c=>cellOf(c,im.width,im.height)===CELL4.cell)
 const corridorPre=measure(im,comp)
 const report=applyRetouchOp(im,{cell:CELL4.cell,mode:'shorten',cap:CELL4.cap,angleDeg,t0:CELL4.t0,band:CELL4.band,shift,predicted:corridorPre-slide},{cellOf,measure})
 // applyRetouchOp OVERWRITES destination pixels with the moved piece, including its
 // partial-alpha rim. Where that lands on solid shaft body it makes the shaft translucent
 // (measured: alpha 253 -> 99..213 along both edges = the dotted seam seen on light
 // backgrounds). A pixel that was solid shaft must stay at least as opaque.
 let alphaRestored=0
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
  const k=(y*im.width+x)*4,[t,o]=tOf(x,y)
  if(t<CELL4.t0||Math.abs(o)>CELL4.band+2)continue
  if(source.data[k+3]>=96&&im.data[k+3]<source.data[k+3]){im.data[k+3]=source.data[k+3];alphaRestored++}
 }
 assertComboCell4Protected(source,im)
 const specks=image=>alphaComponents(image,96).filter(c=>c.area<=64).map(c=>[c.area,c.x0,c.y0,c.x1,c.y1])
 if(JSON.stringify(specks(source))!==JSON.stringify(specks(im)))throw Error('combo cell4: detached speck inventory changed')
 const composition=verifySheetComposition(im,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf}),post=measureComboCell4Weapon(im)
 return{image:im,shift,slide,pre,post,report,composition,alphaRestored}
}
async function main(){
 const bytes=readFileSync(SRC);if(createHash('sha256').update(bytes).digest('hex')!==SRC_SHA)throw Error('combo cell4: source hash changed')
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 const r=slideComboCell4(g.getImageData(0,0,img.width,img.height)),d=g.createImageData(img.width,img.height);d.data.set(r.image.data);g.putImageData(d,0,0)
 const png=cv.toBuffer('image/png');writeFileSync(OUT,png)
 console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),shift:r.shift,slidePx:r.slide,before:r.pre,after:r.post,moved:r.report.moved,alphaRestored:r.alphaRestored,composition:r.composition},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
