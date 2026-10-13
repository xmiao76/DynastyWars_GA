// Probe2: grip zoom w/ pivot+cut markers; sheet components at alpha>=1; walk0/1 landmarks.
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const out = 'art/motion/xuchu/alternative/'
// grip zoom on walk3 registered
const regImg = await loadImage('art/motion/xuchu/closeout-campaign/02-walk3/attempt3/registered.png')
const BUTT=[22.347,328.203], TIP=[483.096,113.566]
const d=[TIP[0]-BUTT[0],TIP[1]-BUTT[1]], L=Math.hypot(...d), u=[d[0]/L,d[1]/L], n=[-u[1],u[0]]
const pt=(t,o)=>[BUTT[0]+t*u[0]+o*n[0], BUTT[1]+t*u[1]+o*n[1]]
const pivot=pt(300,0), cutA=pt(325,-20), cutB=pt(325,100)
console.log('pivot t=300,o=0:', pivot, 'cut line t=325:', cutA, cutB)
const zx=230, zy=140, zw=180, zh=140, s=4
const c=createCanvas(zw*s,zh*s), g=c.getContext('2d'); g.imageSmoothingEnabled=false
g.drawImage(regImg, zx, zy, zw, zh, 0, 0, zw*s, zh*s)
const M=(p)=>[(p[0]-zx)*s,(p[1]-zy)*s]
g.strokeStyle='#ff40ff'; g.lineWidth=3; g.beginPath(); g.moveTo(...M(pt(240,0))); g.lineTo(...M(pt(430,0))); g.stroke()
g.strokeStyle='#00ff80'; g.beginPath(); g.moveTo(...M(cutA)); g.lineTo(...M(cutB)); g.stroke()
g.fillStyle='#ffe040'; g.beginPath(); g.arc(...M(pivot),8,0,7); g.fill()
g.font='bold 20px sans-serif'; g.fillStyle='#ffe040'; g.fillText('pivot t300', M(pivot)[0]+12, M(pivot)[1]-10)
g.fillStyle='#00ff80'; g.fillText('cut t325', M(cutB)[0]-40, M(cutB)[1]-8)
writeFileSync(out+'walk3-grip-probe-4x.png', c.toBuffer('image/png'))
// shaft centre offset: for t bins 250..340 find o-centroid of dark shaft-coloured pixels near axis (brown: r 40-110,g 25-80,b<60) excluding skin
const reg=PNG.sync.read(readFileSync('art/motion/xuchu/closeout-campaign/02-walk3/attempt3/registered.png'))
const frame=(x,y)=>[(x-BUTT[0])*u[0]+(y-BUTT[1])*u[1],(x-BUTT[0])*n[0]+(y-BUTT[1])*n[1]]
for (let t0=240;t0<420;t0+=20){ let so=0,cnt=0,lo=1e9,hi=-1e9
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){const k=(y*512+x)*4,r=reg.data[k],gg=reg.data[k+1],b=reg.data[k+2],a=reg.data[k+3]
    if(a<128||!(r>35&&r<120&&gg>20&&gg<90&&b<70&&r>b))continue
    const [t,o]=frame(x,y); if(t<t0||t>=t0+20||o<-5||o>45)continue; so+=o;cnt++; if(o<lo)lo=o; if(o>hi)hi=o}
  console.log(`shaft-brown t[${t0},${t0+20}) cnt=${cnt} oMean=${cnt?(so/cnt).toFixed(1):'-'} o=[${cnt?lo.toFixed(1):'-'},${cnt?hi.toFixed(1):'-'}]`)}
// skin pixels: o range in t 280..325
let slo=1e9,shi=-1e9,sc=0
for(let y=0;y<512;y++)for(let x=0;x<512;x++){const k=(y*512+x)*4,r=reg.data[k],gg=reg.data[k+1],b=reg.data[k+2],a=reg.data[k+3]
  if(a<16||!(r>110&&gg>60&&b<110&&r>b+25))continue; const [t,o]=frame(x,y); if(t>=280&&t<325&&Math.abs(o)<40){sc++; if(o<slo)slo=o; if(o>shi)shi=o}}
console.log('front-hand skin t[280,325) cnt',sc,'o range',slo.toFixed(1),shi.toFixed(1))
// sheet components alpha>=1
const sh=PNG.sync.read(readFileSync('art/motion/xuchu/walk-candidate-2.png'))
function comps(thr){const W=sh.width,H=sh.height,seen=new Uint8Array(W*H),cs=[]
  const on=(x,y)=>sh.data[(y*W+x)*4+3]>=thr
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(seen[y*W+x]||!on(x,y))continue
    let cnt=0,x0=x,x1=x,y0=y,y1=y;const st=[[x,y]];seen[y*W+x]=1
    while(st.length){const [cx,cy]=st.pop();cnt++;x0=Math.min(x0,cx);x1=Math.max(x1,cx);y0=Math.min(y0,cy);y1=Math.max(y1,cy)
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=W||ny>=H||seen[ny*W+nx]||!on(nx,ny))continue;seen[ny*W+nx]=1;st.push([nx,ny])}}
    cs.push({cnt,bounds:[x0,y0,x1,y1]})}
  cs.sort((a,b)=>b.cnt-a.cnt); console.log(`thr=${thr} n=${cs.length}`, JSON.stringify(cs.slice(0,10))); return cs}
comps(1); comps(4); comps(8)
