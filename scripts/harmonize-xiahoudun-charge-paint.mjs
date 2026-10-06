#!/usr/bin/env node
// CMR-14A: localized RGB-only paint correction, NEVER rescale/redraw alpha.
// Source original immutable; preserve rigid weapon RGBA and all nontargets.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{createHash}from'node:crypto'
import{readFileSync,writeFileSync}from'node:fs'
import{resolve}from'node:path'
import{fileURLToPath}from'node:url'
import{alphaComponents}from'./motion-pipeline.mjs'
import{gridCellOf,verifySheetComposition}from'./motion-retouch.mjs'
const SRC='art/motion/xiahoudun/charge-repair-1-spliced-source.png'
const SHA='b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4'
const OUT='art/motion/xiahoudun/charge-paint-harmonized-source.png'
const cellOf=gridCellOf(3,3)
export const CHARGE_PAINT_REGIONS=[
 {cell:0,kind:'armour',polygon:[[88,108],[179,91],[217,115],[245,152],[277,214],[255,247],[219,267],[161,281],[92,257],[67,226],[111,198],[111,158]]},
 {cell:0,kind:'skin',polygon:[[94,135],[115,131],[134,148],[137,170],[112,171],[98,157]]},
 {cell:0,kind:'skin',polygon:[[243,113],[272,105],[284,123],[279,149],[255,160],[232,173],[222,148]]},
 {cell:3,kind:'armour',polygon:[[119,455],[159,437],[220,427],[281,439],[329,473],[343,516],[323,551],[328,593],[271,616],[224,627],[153,601],[116,562],[164,531],[147,490]]},
 {cell:3,kind:'skin',polygon:[[161,472],[180,468],[201,484],[198,500],[172,506],[161,494]]},
 {cell:3,kind:'skin',polygon:[[301,448],[328,433],[349,443],[352,465],[337,484],[315,486],[292,501],[279,483]]},
 {cell:4,kind:'armour',polygon:[[648,481],[676,461],[729,449],[778,451],[818,469],[836,511],[820,537],[869,562],[865,591],[813,621],[756,634],[709,604],[651,594],[621,560],[651,532]]},
 {cell:4,kind:'skin',polygon:[[714,430],[739,421],[772,429],[785,446],[778,468],[749,480],[717,488],[701,474]]},
 {cell:4,kind:'skin',polygon:[[636,494],[656,487],[681,499],[689,518],[674,532],[651,528],[632,514]]},
 {cell:4,kind:'skin',polygon:[[832,437],[850,421],[867,425],[872,441],[863,459],[843,469],[825,457]]},
]
const WEAPONS={0:{a:[13,210],b:[423,164],tassel:[[326,164],[385,158],[384,218],[329,236]],blade:[[359,147],[432,149],[432,182],[359,181]]},3:{a:[54,527],b:[490,481],tassel:[[392,484],[454,472],[452,540],[382,564]],blade:[[419,462],[497,462],[497,498],[419,506]]},4:{a:[605,557],b:[992,372],tassel:[[874,397],[923,377],[939,449],[889,481]],blade:[[897,376],[996,363],[999,402],[912,429]]}}
export function pointInPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a[1]>y)!==(b[1]>y))&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
function edgeDistance(x,y,points){let best=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy))}return best}
export function isProtectedChargeWeapon(cell,x,y){const w=WEAPONS[cell];if(!w)return false;const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],L=Math.hypot(dx,dy),t=((x-w.a[0])*dx+(y-w.a[1])*dy)/L,o=Math.abs(-(x-w.a[0])*dy+(y-w.a[1])*dx)/L;return(t>=-8&&t<=L+8&&o<=15)||pointInPolygon(x,y,w.tassel)||pointInPolygon(x,y,w.blade)}
function adjustment(cell,x,y){if(isProtectedChargeWeapon(cell,x,y))return null;let strongest=null;for(const r of CHARGE_PAINT_REGIONS){if(r.cell!==cell||!pointInPolygon(x,y,r.polygon))continue;const weight=Math.min(1,edgeDistance(x,y,r.polygon)/6);if(!strongest||weight>strongest.weight)strongest={kind:r.kind,weight}}return strongest}
export function assertChargePaintConservation(before,after){
 if(before.width!==after.width||before.height!==after.height)throw Error('charge paint: dimensions changed')
 const W=before.width,H=before.height,comps=alphaComponents(before,96).filter(c=>c.area>64),owners=new Int8Array(W*H).fill(-1)
 for(const c of comps)for(const p of c.pixels)owners[p]=cellOf(c,W,H)
 for(let p=0;p<W*H;p++){
  const k=p*4,x=p%W,y=(p/W)|0,cell=owners[p]
  if(before.data[k+3]!==after.data[k+3])throw Error('charge paint: alpha/silhouette changed')
  if(![0,3,4].includes(cell)||!adjustment(cell,x,y))for(let c=0;c<3;c++)if(before.data[k+c]!==after.data[k+c])throw Error(`charge paint: protected/untargeted pixel changed (${x},${y})`)
 }
}
export function harmonizeChargePaint(source){
 if(source.width!==1536||source.height!==1024)throw Error('charge paint: expected1536x1024')
 const out={width:source.width,height:source.height,data:new Uint8ClampedArray(source.data)},W=out.width,H=out.height,counts={0:0,3:0,4:0}
 const comps=alphaComponents(source,96).filter(c=>c.area>64)
 for(const c of comps){const cell=cellOf(c,W,H);if(![0,3,4].includes(cell))continue;for(const p of c.pixels){const x=p%W,y=(p/W)|0,a=adjustment(cell,x,y);if(!a)continue;const k=p*4,r=source.data[k],g=source.data[k+1],b=source.data[k+2],l=.2126*r+.7152*g+.0722*b
  // Mild warm-paint reduction, not a generic full-frame darken: retain
  // local shading order; soften copper/magenta bias only in named materials.
  const gain=a.kind==='skin'?.90:.88,chroma=a.kind==='skin'?.95:.91,weights=a.kind==='skin'?[.985,1,1.015]:[.99,1,1.01]
  let changed=false
  for(let channel=0;channel<3;channel++){const old=source.data[k+channel],target=(l+(old-l)*chroma)*gain*weights[channel],value=Math.round(old+(target-old)*a.weight);out.data[k+channel]=value;if(value!==old)changed=true}
  if(changed)counts[cell]++
 }}
 assertChargePaintConservation(source,out)
 const composition=verifySheetComposition(out,{expectCells:[0,1,2,3,4,5,6,7,8],cellOf})
 return{image:out,changedRgbPixels:counts,composition}
}
async function main(){const bytes=readFileSync(SRC);if(createHash('sha256').update(bytes).digest('hex')!==SHA)throw Error('charge paint: input hash changed');const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0);const result=harmonizeChargePaint(g.getImageData(0,0,img.width,img.height)),d=g.createImageData(img.width,img.height);d.data.set(result.image.data);g.putImageData(d,0,0);const png=cv.toBuffer('image/png');writeFileSync(OUT,png);console.log(JSON.stringify({file:OUT,sha256:createHash('sha256').update(png).digest('hex'),changedRgbPixels:result.changedRgbPixels,composition:result.composition},null,2))}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
