#!/usr/bin/env node
// CMR-14A heavy fig1 (cell 1, overhead hold) ONLY: deterministic rear-cap slide
// into the fixed weapon band. Fig1 is the one heavy cell with clear shaft behind
// the rear fist (slide-room measured on 041add30: butt-cap steel ends t=22,
// first fist-skin pixel on the axis t=88, 66px of clean wood for a ~35px slide).
// Input is the immutable prepared source; output is a NEW override. Never
// relabels a length pass as accepted art: protected fist/cuff witnesses +
// corridor-only change checks + enlarged pair.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{createHash}from'node:crypto'
import{readFileSync,writeFileSync}from'node:fs'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{alphaComponents}from'./motion-pipeline.mjs'
import{applyRetouchOp,gridCellOf,verifySheetComposition}from'./motion-retouch.mjs'
const SRC='art/motion/xiahoudun/heavy-prepared-source.png'
const SRC_SHA='041add3022773ff905b62cb7b5ba648d9423ec8d494b0a2976388ec2ef926129'
const OUT='art/motion/xiahoudun/heavy-fig1-slid-source.png'
const cellOf=gridCellOf(3,3),W0=1920,H0=1980
// Integer slide vector chosen for minimal perpendicular error to the shaft axis
// (butt [727,155] -> tip [1195,51], angle -12.53deg): [36,-8] is 0.01px off-axis
// with 36.88px axial slide (479.42 -> ~442.5, inside the fixed band).
// Band 14 (not 10): the butt cap flares to o~+13, so band 10 sheds a 25px rim
// (two specks) and band 12 sheds 1px; band 14 moves the cap whole with zero
// gained specks. Corridor endpoints are identical for corridors 8/10/12/14,
// so the wider band moves no endpoint.
export const FIG1={cell:1,cap:[727,155],tip:[1195,51],band:14,t0:40,shift:[36,-8]}
// Measured on actual pixels: butt-cap steel ends t=22; first fist-skin pixel on
// the axis t=88 (sustained skin from t=91). Moved piece (t<40) lands at t<76.9,
// i.e. >=9px short of the fist.
export const FIST_T=86
// rear fist + cuff/bracer (+ margin): must stay byte-exact
export const HEAVY_FIG1_WITNESSES=[['rear fist',[800,100,875,165]],['cuff/bracer under shaft',[795,165,875,230]]]
const axis=()=>{const dx=FIG1.tip[0]-FIG1.cap[0],dy=FIG1.tip[1]-FIG1.cap[1],L=Math.hypot(dx,dy);return{ux:dx/L,uy:dy/L,L,angleDeg:Math.atan2(dy,dx)*180/Math.PI}}
const tOf=(x,y)=>{const{ux,uy}=axis();return[(x-FIG1.cap[0])*ux+(y-FIG1.cap[1])*uy,-(x-FIG1.cap[0])*uy+(y-FIG1.cap[1])*ux]}
/** Whole-material length restricted to the shaft corridor so fist/body pixels are never picked as an endpoint. */
export function measureHeavyFig1Weapon(image,corridor=10){
 const W=image.width,H=image.height,comp=alphaComponents(image,96).filter(c=>c.area>64).find(c=>cellOf(c,W,H)===FIG1.cell)
 if(!comp)throw Error('heavy fig1: component missing')
 let lo=Infinity,hi=-Infinity,loP=null,hiP=null
 for(const p of comp.pixels){const x=p%W,y=(p/W)|0,[t,o]=tOf(x,y);if(Math.abs(o)>corridor)continue;if(t<lo){lo=t;loP=[x,y]}if(t>hi){hi=t;hiP=[x,y]}}
 return{length:hi-lo,butt:loP,tip:hiP}
}
export function assertHeavyFig1Protected(before,after){
 if(before.width!==after.width||before.height!==after.height)throw Error('heavy fig1: dimensions differ')
 const W=before.width,H=before.height,{ux,uy}=axis()
 for(const[label,[x0,y0,x1,y1]]of HEAVY_FIG1_WITNESSES)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  // The rectangles also cover bare shaft the cap piece must slide INTO (fist skin
  // first appears at t~88, measured). On the shaft axis only t>=FIST_T is protected;
  // everything off-axis (fist, cuff, bracer) is always protected.
  const[tw,ow]=tOf(x,y);if(Math.abs(ow)<=FIG1.band+2&&tw<FIST_T)continue
  const k=(y*W+x)*4;for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`heavy fig1: ${label} changed at (${x},${y})`)
 }
 // every changed pixel must lie in the moved corridor piece
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=(y*W+x)*4;let diff=false;for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c]){diff=true;break}
  if(!diff)continue
  const[t,o]=tOf(x,y)
  // applyRetouchOp clears sub-threshold alpha halo in the vacated butt zone; those pixels are
  // invisible (alpha<=2 -> 0). Nothing else may change outside the corridor.
  if(before.data[k+3]<=2&&after.data[k+3]===0)continue
  if(Math.abs(o)>FIG1.band+2||t<-10||t>FIG1.t0+Math.hypot(...FIG1.shift)+6)throw Error(`heavy fig1: pixel outside the moved corridor changed (${x},${y}) t=${t.toFixed(1)} o=${o.toFixed(1)}`)
 }
 void ux;void uy
}
export function slideHeavyFig1(source){
 if(source.width!==W0||source.height!==H0)throw Error('heavy fig1: expected1920x1980')
 const im={width:source.width,height:source.height,data:new Uint8ClampedArray(source.data)},{angleDeg}=axis()
 verifySheetComposition(im,{expectCells:[0,1,2,3,4],cellOf})
 const pre=measureHeavyFig1Weapon(source)
 const shift=[...FIG1.shift],slide=Math.hypot(...shift)
 const measure=(image,comp)=>{let lo=Infinity,hi=-Infinity;for(const p of comp.pixels){const x=p%image.width,y=(p/image.width)|0,[t,o]=tOf(x,y);if(Math.abs(o)>FIG1.band)continue;lo=Math.min(lo,t);hi=Math.max(hi,t)}return hi-lo}
 const comp=alphaComponents(im,96).filter(c=>c.area>64).find(c=>cellOf(c,im.width,im.height)===FIG1.cell)
 const corridorPre=measure(im,comp)
 const report=applyRetouchOp(im,{cell:FIG1.cell,mode:'shorten',cap:FIG1.cap,angleDeg,t0:FIG1.t0,band:FIG1.band,shift,predicted:corridorPre-slide},{cellOf,measure})
 // applyRetouchOp OVERWRITES destination pixels with the moved piece, including its
 // partial-alpha rim. Where that lands on solid shaft body it makes the shaft translucent
 // (the dotted seam seen on light backgrounds in the combo-cell4 precedent). A pixel
 // that was solid shaft must stay at least as opaque.
 let alphaRestored=0
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
  const k=(y*im.width+x)*4,[t,o]=tOf(x,y)
  if(t<FIG1.t0||Math.abs(o)>FIG1.band+2)continue
  if(source.data[k+3]>=96&&im.data[k+3]<source.data[k+3]){im.data[k+3]=source.data[k+3];alphaRestored++}
 }
 assertHeavyFig1Protected(source,im)
 const specks=image=>alphaComponents(image,96).filter(c=>c.area<=64).map(c=>[c.area,c.x0,c.y0,c.x1,c.y1])
 if(JSON.stringify(specks(source))!==JSON.stringify(specks(im)))throw Error('heavy fig1: detached speck inventory changed')
 const composition=verifySheetComposition(im,{expectCells:[0,1,2,3,4],cellOf}),post=measureHeavyFig1Weapon(im)
 return{image:im,shift,slide,pre,post,report,composition,alphaRestored}
}
async function main(){
 const bytes=readFileSync(SRC);if(createHash('sha256').update(bytes).digest('hex')!==SRC_SHA)throw Error('heavy fig1: source hash changed')
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 const r=slideHeavyFig1(g.getImageData(0,0,img.width,img.height)),d=g.createImageData(img.width,img.height);d.data.set(r.image.data);g.putImageData(d,0,0)
 const png=cv.toBuffer('image/png');writeFileSync(OUT,png)
 console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),shift:r.shift,slidePx:r.slide,before:r.pre,after:r.post,moved:r.report.moved,alphaRestored:r.alphaRestored,composition:r.composition},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
