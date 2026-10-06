#!/usr/bin/env node
// CMR-14A diagnostic only. Same source-pixel ruler and fixed 4x crops;
// NEVER auto-grade head size from hair/beard bounds or inferred chin points.
import {createCanvas,loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'

const OUT='artifacts/motion/xiahoudun/head-diagnosis'
const SOURCES={
  walk:{file:'art/motion/xiahoudun/walk-prepared-source.png',sha:'b395c867c027f837988c5f0fdb676154082d07a43ce9fcc5df8c73786f1bef6c'},
  charge:{file:'art/motion/xiahoudun/charge-repair-1-spliced-source.png',sha:'b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4'},
}
// These view anchors roughly align the visible eyes. They only position
// equal-sized windows; they are NOT anatomical endpoints or measurements.
const VIEWS=[
 {cell:0,walkEye:[278,49],chargeEye:[274,119]},
 {cell:1,walkEye:[809,49],chargeEye:[817,116]},
 {cell:2,walkEye:[1317,52],chargeEye:[1347,108]},
 {cell:3,walkEye:[294,389],chargeEye:[338,448]},
 {cell:4,walkEye:[804,388],chargeEye:[758,440]},
]
mkdirSync(OUT,{recursive:true})
const loaded={}
for(const [key,s] of Object.entries(SOURCES)){
 const bytes=readFileSync(s.file)
 if(createHash('sha256').update(bytes).digest('hex')!==s.sha)throw Error('head diagnostic: source changed '+key)
 const img=await loadImage(bytes),cv=createCanvas(img.width,img.height),g=cv.getContext('2d');g.drawImage(img,0,0)
 loaded[key]={image:cv,pixels:g.getImageData(0,0,img.width,img.height)}
}
const rows=[]
for(const view of VIEWS){
 const z=4,w=112,h=144,panelW=w*z,panelH=h*z,gap=20,top=54
 const out=createCanvas(panelW*2+gap,panelH+top+26),g=out.getContext('2d')
 g.fillStyle='#17161e';g.fillRect(0,0,out.width,out.height);g.imageSmoothingEnabled=false
 g.fillStyle='#ffe991';g.font='bold 15px sans-serif';g.fillText(`CMR-14A fixed4x comparison pair ${view.cell} - no size normalization`,8,19)
 for(const [index,key] of ['walk','charge'].entries()){
   const eye=view[key+'Eye'],x0=eye[0]-75,y0=eye[1]-48,dx=index*(panelW+gap),dy=top
   // No negative source origins or cellwise silhouette scaling.
   if(x0<0||y0<0||x0+w>loaded[key].image.width||y0+h>loaded[key].image.height)throw Error('head diagnostic: crop outside source')
   g.drawImage(loaded[key].image,x0,y0,w,h,dx,dy,panelW,panelH)
   g.fillStyle='#ffe991';g.font='bold 13px sans-serif';g.fillText(`${key}:${view.cell} | source (${x0},${y0})`,dx+5,43)
   g.strokeStyle='rgba(230,90,100,.45)';g.lineWidth=1;g.font='10px sans-serif'
   for(let t=0;t<=w;t+=10){g.beginPath();g.moveTo(dx+t*z,dy);g.lineTo(dx+t*z,dy+panelH);g.stroke();g.fillStyle='#ffe991';g.fillText(String(x0+t),dx+t*z+2,dy+10)}
   for(let t=0;t<=h;t+=10){g.beginPath();g.moveTo(dx,dy+t*z);g.lineTo(dx+panelW,dy+t*z);g.stroke();g.fillStyle='#ffe991';g.fillText(String(y0+t),dx+2,dy+t*z-2)}
   const alpha=loaded[key].pixels.data[(eye[1]*loaded[key].pixels.width+eye[0])*4+3]
   rows.push({frame:`${key}:${view.cell}`,crop:{x:x0,y:y0,width:w,height:h},viewAnchor:eye,anchorAlpha:alpha,anatomicalChin:null})
 }
 g.fillStyle='#ffe991';g.font='12px sans-serif';g.fillText('Crop eye anchors are for alignment only. Hair/cloth/beard pixels do NOT validate an anatomical chin.',8,out.height-8)
 const file=`${OUT}/pair-${view.cell}-fixed4x.png`
 writeFileSync(file,out.toBuffer('image/png'))
}
writeFileSync(`${OUT}/manifest.json`,JSON.stringify({purpose:'Scale-controlled comparison, no head acceptance arithmetic',zoom:4,sourceScale:1,sources:SOURCES,rows,headGate:'UNVERIFIED; anatomical chin not located from visible pixels'},null,2)+'\n')
console.log(JSON.stringify({output:OUT,pairs:VIEWS.length,headGate:'UNVERIFIED',rows},null,2))
