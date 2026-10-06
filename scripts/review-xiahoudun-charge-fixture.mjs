#!/usr/bin/env node
// Owner-authorized independent review support only. Not a runtime pack or
// calibrated gameplay capture. ONE provisional scale for every frame,
// component pixels extracted without neighbouring-cell contamination.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {alphaComponents} from './motion-pipeline.mjs'
import {gridCellOf} from './motion-retouch.mjs'

const OUT='artifacts/motion/xiahoudun/independent-review'
const FILES={
 walk:{path:'art/motion/xiahoudun/walk-prepared-source.png',sha:'b395c867c027f837988c5f0fdb676154082d07a43ce9fcc5df8c73786f1bef6c'},
 charge:{path:'art/motion/xiahoudun/charge-repair-1-spliced-source.png',sha:'b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4'},
}
const SCALE=.66,DENSITY=2,BOX={width:520,height:300,groundY:274},cellOf=gridCellOf(3,3)
// Approximate belt/root x for composition ONLY; no registration acceptance.
const ROOTS={walk:[250,762,1275,252,752],charge:[204,748,1250,222,743]}
mkdirSync(OUT,{recursive:true})
const frames={}
for(const [name,s] of Object.entries(FILES)){
 const bytes=readFileSync(s.path)
 if(createHash('sha256').update(bytes).digest('hex')!==s.sha)throw Error('fixture: source hash changed '+name)
 const img=await loadImage(bytes),src=createCanvas(img.width,img.height),g=src.getContext('2d');g.drawImage(img,0,0)
 const im=g.getImageData(0,0,img.width,img.height),comps=alphaComponents(im,96).filter(c=>c.area>64)
 for(let cell=0;cell<5;cell++){
   const comp=comps.find(c=>cellOf(c,img.width,img.height)===cell)
   if(!comp)throw Error('fixture: component missing')
   const w=comp.x1-comp.x0+1,h=comp.y1-comp.y0+1,figure=createCanvas(w,h),fg=figure.getContext('2d'),fd=fg.createImageData(w,h)
   for(const p of comp.pixels){const x=p%img.width,y=(p/img.width)|0,q=((y-comp.y0)*w+x-comp.x0)*4;fd.data.set(im.data.subarray(p*4,p*4+4),q)}
   fg.putImageData(fd,0,0)
   const out=createCanvas(BOX.width,BOX.height),og=out.getContext('2d');og.fillStyle='#1b1c27';og.fillRect(0,0,BOX.width,BOX.height)
   og.strokeStyle='#667784';og.lineWidth=1;og.beginPath();og.moveTo(0,BOX.groundY);og.lineTo(BOX.width,BOX.groundY);og.stroke()
   const drawX=BOX.width/2-(ROOTS[name][cell]-comp.x0)*SCALE,drawY=BOX.groundY-h*SCALE
   og.imageSmoothingEnabled=true;og.drawImage(figure,drawX,drawY,w*SCALE,h*SCALE)
   og.fillStyle='#ffe695';og.font='bold 14px sans-serif';og.fillText(`${name}:${cell} | fixed .66 raw->art px (density2)`,8,19)
   frames[`${name}:${cell}`]={canvas:out,sourceBounds:[comp.x0,comp.y0,comp.x1,comp.y1],rootX:ROOTS[name][cell],drawX,drawY}
 }
}
// Pair full bodies at the SAME art-pixel scale. No inferred head normalization.
for(let i=0;i<5;i++){
 const cv=createCanvas(BOX.width*2+16,BOX.height+28),g=cv.getContext('2d');g.fillStyle='#161821';g.fillRect(0,0,cv.width,cv.height)
 g.drawImage(frames[`walk:${i}`].canvas,0,28);g.drawImage(frames[`charge:${i}`].canvas,BOX.width+16,28)
 g.fillStyle='#ffe695';g.font='bold 14px sans-serif';g.fillText('Provisional equal-scale offline fixture - NOT final registration/runtime proof',8,19)
 writeFileSync(`${OUT}/body-pair-${i}.png`,cv.toBuffer('image/png'))
}
const order=['walk:0','charge:0','charge:1','charge:2','charge:3','charge:4','walk:0']
const strip=createCanvas(BOX.width*4,BOX.height*2+30),sg=strip.getContext('2d');sg.fillStyle='#161821';sg.fillRect(0,0,strip.width,strip.height)
sg.fillStyle='#ffe695';sg.font='bold 14px sans-serif';sg.fillText('Guard -> coil -> launch -> dash -> dash2 -> brake -> guard (ordered stills only)',8,19)
order.forEach((id,i)=>sg.drawImage(frames[id].canvas,(i%4)*BOX.width,30+Math.floor(i/4)*BOX.height))
writeFileSync(`${OUT}/guard-charge-guard-stills.png`,strip.toBuffer('image/png'))
writeFileSync(`${OUT}/manifest.json`,JSON.stringify({sources:FILES,scale:SCALE,density:DENSITY,provisionalLogicalScale:SCALE/DENSITY,box:BOX,order,limits:'No finalized registration, temporal exposures, gameplay/native-video or numerical head certification. Foot/belt placement for review composition only.',frames:Object.fromEntries(Object.entries(frames).map(([id,f])=>[id,{sourceBounds:f.sourceBounds,rootX:f.rootX,drawX:f.drawX,drawY:f.drawY}]))},null,2)+'\n')
console.log(JSON.stringify({output:OUT,bodyPairs:5,order,scale:SCALE,limits:'Uniform provisional fixture, not game capture or temporal verification'},null,2))
