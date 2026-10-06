#!/usr/bin/env node
// Separate before/after candidate artifacts; preserve prior review evidence.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{readFileSync,writeFileSync,mkdirSync}from'node:fs'
import{createHash}from'node:crypto'
import{buildRegisteredChargeFixture}from'./review-xiahoudun-registered-charge.mjs'
import{alphaComponents}from'./motion-pipeline.mjs'
import{gridCellOf}from'./motion-retouch.mjs'
const OUT='artifacts/motion/xiahoudun/charge-paint-review',base=JSON.parse(readFileSync('art/motion/xiahoudun/charge-registration-candidate.json','utf8'))
// Before is immutable b547 even after candidate promotion; never silently
// regenerate both sides from the after-source and lose visible evidence.
base.sources.charge={file:'charge-repair-1-spliced-source.png',sha256:'b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4'}
const after=JSON.parse(JSON.stringify(base))
after.sources.charge={file:'charge-paint-harmonized-source.png',sha256:'98e2531f1763bdb5a6b4ad045518e159987a51f8c264d7f4fb64f657a323c5fe'}
await buildRegisteredChargeFixture(base,`${OUT}/before`);await buildRegisteredChargeFixture(after,`${OUT}/after`)
mkdirSync(OUT,{recursive:true})
const beforeImg=await loadImage('art/motion/xiahoudun/'+base.sources.charge.file),afterImg=await loadImage('art/motion/xiahoudun/'+after.sources.charge.file)
const boxes={0:[72,91,294,273],3:[115,420,356,621],4:[622,409,883,633]}
for(const[cell,box]of Object.entries(boxes)){const[x0,y0,x1,y1]=box,z=4,w=(x1-x0)*z,h=(y1-y0)*z,cv=createCanvas(w*2+16,h+32),g=cv.getContext('2d');g.fillStyle='#181922';g.fillRect(0,0,cv.width,cv.height);g.imageSmoothingEnabled=false;g.drawImage(beforeImg,x0,y0,x1-x0,y1-y0,0,32,w,h);g.drawImage(afterImg,x0,y0,x1-x0,y1-y0,w+16,32,w,h);g.fillStyle='#ffe080';g.font='bold 14px sans-serif';g.fillText('charge:'+cell+' BEFORE material treatment',6,21);g.fillText('AFTER RGB only, alpha/weapon exact',w+22,21);writeFileSync(`${OUT}/paint-pair-${cell}-4x.png`,cv.toBuffer('image/png'))}
const a=await loadImage(`${OUT}/before/logical-size-contact.png`),b=await loadImage(`${OUT}/after/logical-size-contact.png`),cv=createCanvas(a.width,a.height+b.height+48),g=cv.getContext('2d');g.fillStyle='#181922';g.fillRect(0,0,cv.width,cv.height);g.drawImage(a,0,24);g.drawImage(b,0,a.height+48);g.fillStyle='#ffe080';g.font='bold 14px sans-serif';g.fillText('BEFORE candidate logical size',6,17);g.fillText('AFTER localized paint correction - not gameplay or motion acceptance',6,a.height+41);writeFileSync(`${OUT}/logical-before-after.png`,cv.toBuffer('image/png'))
// Existing spares remain immutable. Show all4 isolated component pixels at
// one scale for bridge judgement; do not accept them from pose resemblance.
const src=createCanvas(beforeImg.width,beforeImg.height),sg=src.getContext('2d');sg.drawImage(beforeImg,0,0);const im=sg.getImageData(0,0,src.width,src.height),comps=alphaComponents(im,96).filter(c=>c.area>64),cellOf=gridCellOf(3,3),sp=createCanvas(1120,640),pg=sp.getContext('2d');pg.fillStyle='#181922';pg.fillRect(0,0,sp.width,sp.height);const spareRecords=[]
for(let i=0;i<4;i++){const cell=i+5,c=comps.find(c=>cellOf(c,im.width,im.height)===cell),w=c.x1-c.x0+1,h=c.y1-c.y0+1,fig=createCanvas(w,h),fg=fig.getContext('2d'),d=fg.createImageData(w,h);for(const p of c.pixels){const x=p%im.width,y=(p/im.width)|0,q=((y-c.y0)*w+x-c.x0)*4;d.data.set(im.data.subarray(p*4,p*4+4),q)}fg.putImageData(d,0,0);const x=i%2*560+(560-w*.85)/2,y=Math.floor(i/2)*320+40;pg.drawImage(fig,x,y,w*.85,h*.85);pg.fillStyle='#ffe080';pg.font='bold 15px sans-serif';pg.fillText('UNACCEPTED spare charge:'+cell+' | same .85raw scale',i%2*560+8,Math.floor(i/2)*320+22);spareRecords.push({cell,bounds:[c.x0,c.y0,c.x1,c.y1],area:c.area})}
writeFileSync(`${OUT}/spare-contact.png`,sp.toBuffer('image/png'))
console.log(JSON.stringify({out:OUT,before:base.sources.charge,after:after.sources.charge,spares:spareRecords,afterHash:createHash('sha256').update(readFileSync('art/motion/xiahoudun/'+after.sources.charge.file)).digest('hex')},null,2))
