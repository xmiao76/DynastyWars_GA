#!/usr/bin/env node
// CMR-14A attempt2: fixed-band walk weapon corrections AFTER true-endpoint
// remeasurement. Only cells2/3/5/7/8; restored foreground guard stays exact.
// Numeric gates do not establish anatomy: exact body witnesses +4x pairs.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{createHash}from'node:crypto'
import{readFileSync,writeFileSync}from'node:fs'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{alphaComponents}from'./motion-pipeline.mjs'
import{applyRetouchOp,gridCellOf,verifySheetComposition}from'./motion-retouch.mjs'
import{spreadOf,evaluateProjection}from'./pack-projection.mjs'

const SRC='art/motion/xiahoudun/walk-guard-grip-restored-source.png'
const SRC_SHA='fba82023db508438b4d7dc676b779387e80cc678674dbee92619c1ccbe6b7653'
const OUT='art/motion/xiahoudun/walk-projection-corrected-source.png'
const cellOf=gridCellOf(3,3),expectCells=[0,1,2,3,4,5,6,7,8]
export const WALK_PROJECTION_OPS=[
 {cell:2,cap:[1111,240],tip:[1524,73],shift:[13,-5],t0:44,band:10},
 {cell:3,cap:[102,571],tip:[519,409],shift:[15,-6],t0:44,band:10},
 {cell:5,cap:[1110,580],tip:[1522,415],shift:[14,-6],t0:46,band:10},
 {cell:7,cap:[620,914],tip:[1035,765],shift:[9,-3],t0:42,band:10},
 {cell:8,cap:[1085,933],tip:[1524,763],shift:[39,-15],t0:60,band:10},
]
// Source+destination work boxes, all contain only isolated rear weapon pieces.
// Used as an exact whole-file diff boundary, not a silhouette/length ruler.
const CORRIDORS=[[1093,215,1170,268],[87,541,164,592],[1090,550,1175,607],[602,888,679,947],[1069,890,1185,963]]
const BODY_WITNESSES=[
 ['guard hand',[144,162,184,218]],
 ['cell2 rear grip',[1212,159,1283,219]],['cell2 knee/boot',[1155,246,1255,306]],['cell2 upper cloth',[1160,178,1198,200]],
 ['cell3 rear grip',[184,499,237,549]],['cell3 lower cloth',[150,574,190,586]],
 ['cell5 rear grip',[1230,503,1300,558]],['cell5 knee/boot',[1148,582,1240,650]],
 ['cell7 rear grip',[729,836,786,899]],['cell7 lower robe',[674,904,740,939]],
 ['cell8 rear grip',[1230,824,1320,891]],['cell8 lower robe',[1191,899,1270,944]],['cell8 upper cloth',[1188,854,1268,877]],
]
export function assertWalkProjectionBodyUnchanged(before,after){
 if(before.width!==after.width||before.height!==after.height)throw Error('walk projection: witness dimensions differ')
 for(const[label,[x0,y0,x1,y1]]of BODY_WITNESSES)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const k=(y*before.width+x)*4
  for(let c=0;c<4;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`walk projection: ${label} changed (${x},${y})`)
 }
}
// Full-material endpoint boxes verified on fresh full-sheet overlay. Boxes
// cross virtual column edges where required; no gold/steel palette cutoff.
export const WALK_ENDPOINT_ZONES=[
 {tip:[521,41],cap:[126,205],capBox:[118,194,147,221],tipBox:[486,29,530,66]},
 {tip:[1034,64],cap:[632,219],capBox:[626,204,660,230],tipBox:[996,47,1046,91]},
 {tip:[1524,73],cap:[1106,243],capBox:[1097,211,1170,272],tipBox:[1485,52,1535,101]},
 {tip:[519,409],cap:[96,575],capBox:[87,532,171,597],tipBox:[480,390,531,436]},
 {tip:[1034,407],cap:[631,560],capBox:[624,542,660,565],tipBox:[995,387,1049,433]},
 {tip:[1522,415],cap:[1102,584],capBox:[1091,540,1175,612],tipBox:[1485,390,1534,444]},
 {tip:[520,760],cap:[102,905],capBox:[98,885,143,924],tipBox:[480,744,532,786]},
 {tip:[1035,765],cap:[614,917],capBox:[604,877,687,940],tipBox:[990,746,1048,793]},
 {tip:[1524,763],cap:[1078,936],capBox:[1069,890,1185,961],tipBox:[1487,742,1534,790]},
]
export function measureWalkMaterialEndpoints(image){
 const W=image.width,H=image.height,comps=alphaComponents(image,96).filter(c=>c.area>64)
 return WALK_ENDPOINT_ZONES.map((o,cell)=>{
  const comp=comps.find(c=>cellOf(c,W,H)===cell)
  if(!comp)throw Error('walk endpoints: component missing '+cell)
  const dx=o.tip[0]-o.cap[0],dy=o.tip[1]-o.cap[1],L=Math.hypot(dx,dy),u=[dx/L,dy/L]
  const pick=(box,max)=>{let best=max?-Infinity:Infinity,point=null;for(const p of comp.pixels){const x=p%W,y=(p/W)|0;if(x<box[0]||x>=box[2]||y<box[1]||y>=box[3])continue;const t=x*u[0]+y*u[1];if(max?t>best:t<best){best=t;point=[x,y]}}if(!point)throw Error('walk endpoints: no ink in material box '+cell);return point}
  const tip=pick(o.tipBox,true),butt=pick(o.capBox,false)
  return{cell,tip,butt,length:Math.hypot(tip[0]-butt[0],tip[1]-butt[1])}
 })
}
export function repairWalkProjection(source){
 const im={width:source.width,height:source.height,data:new Uint8ClampedArray(source.data)},W=im.width,H=im.height
 if(W!==1535||H!==1024)throw Error('walk projection: expected1535x1024')
 verifySheetComposition(im,{expectCells,cellOf})
 const reports=[]
 for(const op of WALK_PROJECTION_OPS){
  const dx=op.tip[0]-op.cap[0],dy=op.tip[1]-op.cap[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L
  const measure=(image,comp)=>{let lo=Infinity,hi=-Infinity;for(const p of comp.pixels){const x=p%W,y=(p/W)|0,t=(x-op.cap[0])*ux+(y-op.cap[1])*uy,o=-(x-op.cap[0])*uy+(y-op.cap[1])*ux;if(Math.abs(o)>op.band)continue;lo=Math.min(lo,t);hi=Math.max(hi,t)}return hi-lo}
  const comp=alphaComponents(im,96).filter(c=>c.area>64).find(c=>cellOf(c,W,H)===op.cell)
  if(!comp)throw Error('walk projection: target missing')
  const preLen=measure(im,comp),predicted=preLen-Math.hypot(...op.shift)
  const r=applyRetouchOp(im,{...op,mode:'shorten',angleDeg:Math.atan2(dy,dx)*180/Math.PI,predicted},{cellOf,measure})
  reports.push({cell:op.cell,shift:op.shift,t0:op.t0,band:op.band,preLen,predicted,...r})
 }
 assertWalkProjectionBodyUnchanged(source,im)
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(CORRIDORS.some(([x0,y0,x1,y1])=>x>=x0&&x<x1&&y>=y0&&y<y1))continue
  const k=(y*W+x)*4
  for(let c=0;c<4;c++)if(source.data[k+c]!==im.data[k+c])throw Error(`walk projection: off-corridor pixel changed (${x},${y})`)
 }
 const specks=image=>alphaComponents(image,96).filter(c=>c.area<=64).map(c=>[c.area,c.x0,c.y0,c.x1,c.y1])
 if(JSON.stringify(specks(source))!==JSON.stringify(specks(im)))throw Error('walk projection: detached speck inventory changed')
 const composition=verifySheetComposition(im,{expectCells,cellOf}),endpoints=measureWalkMaterialEndpoints(im)
 return {image:im,reports,composition,endpoints,weaponSpread:spreadOf(endpoints.map(e=>e.length))}
}
async function main(){
 const bytes=readFileSync(SRC)
 if(createHash('sha256').update(bytes).digest('hex')!==SRC_SHA)throw Error('walk projection: source hash changed')
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 const result=repairWalkProjection(g.getImageData(0,0,img.width,img.height))
 const state=JSON.parse(readFileSync('art/motion/xiahoudun/pack-projection.json','utf8')),values=result.endpoints.map(e=>e.length)
 if(values.some(v=>v<state.band.lo||v>state.band.hi))throw Error('walk projection: repaired values leave fixed brief band')
 const projection=evaluateProjection({observed:values,remaining:6,band:state.band})
 if(['STOP','FAIL'].includes(projection.status))throw Error('walk projection: repaired sheet fails numerical gate')
 const d=g.createImageData(img.width,img.height);d.data.set(result.image.data);g.putImageData(d,0,0)
 const png=cv.toBuffer('image/png');writeFileSync(OUT,png)
 console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),reports:result.reports,composition:result.composition,endpoints:result.endpoints,weaponSpread:result.weaponSpread,projection},null,2))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
