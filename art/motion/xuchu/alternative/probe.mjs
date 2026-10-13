// Diagnostic probe (zero generation): (a) shaft o-profile + front-grip scan on
// walk:3 attempt3 registered.png; (b) alpha connected components on full walk-candidate-2.png.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
const sha = (b) => createHash('sha256').update(b).digest('hex')

// (a) walk3
const regPath = 'art/motion/xuchu/closeout-campaign/02-walk3/attempt3/registered.png'
const regBuf = readFileSync(regPath)
console.log('walk3 registered sha', sha(regBuf))
const reg = PNG.sync.read(regBuf)
const BUTT = [22.347142857142877, 328.2028571428571], TIP = [483.0957142857142, 113.56571428571431]
const d = [TIP[0]-BUTT[0], TIP[1]-BUTT[1]], L = Math.hypot(...d), u = [d[0]/L, d[1]/L], n = [-u[1], u[0]]
const frame = (x,y)=>[(x-BUTT[0])*u[0]+(y-BUTT[1])*u[1], (x-BUTT[0])*n[0]+(y-BUTT[1])*n[1]]
console.log('axis u', u, 'n', n, 'len', L, 'angleDeg', Math.atan2(d[1],d[0])*180/Math.PI)
// o-extent profile in t bins of 10, only pixels near weapon line region x any, but exclude body: use all alpha>=16 with |o|<90, t in range; report extent + count per bin
for (let t0=0; t0<530; t0+=20) {
  let lo=1e9, hi=-1e9, cnt=0, near=0
  for (let y=0;y<512;y++) for (let x=0;x<512;x++) {
    const k=(y*512+x)*4; if (reg.data[k+3]<16) continue
    const [t,o]=frame(x,y); if (t<t0||t>=t0+20||Math.abs(o)>90) continue
    cnt++; if (o<lo)lo=o; if (o>hi)hi=o; if (Math.abs(o)<=12) near++
  }
  console.log(`t[${t0},${t0+20}) cnt=${cnt} nearAxis(|o|<=12)=${near} o=[${lo===1e9?'-':lo.toFixed(1)},${hi===-1e9?'-':hi.toFixed(1)}]`)
}
// skin-tone-ish pixel clusters near shaft (hands): r>120,g>70,b<100,r>b+30, |o|<25, t 100..420
const skin=[]
for (let y=0;y<512;y++) for (let x=0;x<512;x++) {
  const k=(y*512+x)*4, r=reg.data[k],g=reg.data[k+1],b=reg.data[k+2],a=reg.data[k+3]
  if (a<16||!(r>110&&g>60&&b<110&&r>b+25)) continue
  const [t,o]=frame(x,y); if (t>80&&t<430&&Math.abs(o)<30) skin.push([t,o,x,y])
}
skin.sort((a,b)=>a[0]-b[0])
// t-histogram of skin near shaft
const hist={}
for (const [t] of skin) { const b=Math.floor(t/10)*10; hist[b]=(hist[b]||0)+1 }
console.log('skin-near-shaft t histogram:', JSON.stringify(hist))

// (b) full sheet components
const sheetPath = 'art/motion/xuchu/walk-candidate-2.png'
const sBuf = readFileSync(sheetPath)
console.log('sheet sha', sha(sBuf))
const sh = PNG.sync.read(sBuf)
console.log('sheet size', sh.width, sh.height)
let aMin=255,aMax=0; const aHist={0:0,low:0,mid:0,hi:0}
for (let p=0;p<sh.width*sh.height;p++){const a=sh.data[p*4+3]; if(a<aMin)aMin=a; if(a>aMax)aMax=a; if(a===0)aHist[0]++; else if(a<16)aHist.low++; else if(a<128)aHist.mid++; else aHist.hi++}
console.log('alpha min/max', aMin, aMax, aHist)
// sample background pixels corners + between figures
for (const [x,y] of [[5,5],[500,250],[530,100],[760,500],[100,600],[1530,1020]]) {
  const k=(y*sh.width+x)*4; console.log(`px(${x},${y}) rgba=${sh.data[k]},${sh.data[k+1]},${sh.data[k+2]},${sh.data[k+3]}`)
}
function components(thr) {
  const W=sh.width,H=sh.height, seen=new Uint8Array(W*H), comps=[]
  const on=(x,y)=>sh.data[(y*W+x)*4+3]>=thr
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    if (seen[y*W+x]||!on(x,y)) continue
    let cnt=0,x0=x,x1=x,y0=y,y1=y; const stack=[[x,y]]; seen[y*W+x]=1
    while(stack.length){const [cx,cy]=stack.pop(); cnt++; if(cx<x0)x0=cx; if(cx>x1)x1=cx; if(cy<y0)y0=cy; if(cy>y1)y1=cy
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) { const nx=cx+dx,ny=cy+dy; if(nx<0||ny<0||nx>=W||ny>=H||seen[ny*W+nx]||!on(nx,ny)) continue; seen[ny*W+nx]=1; stack.push([nx,ny]) } }
    comps.push({cnt,bounds:[x0,y0,x1,y1]})
  }
  comps.sort((a,b)=>b.cnt-a.cnt)
  console.log(`thr=${thr} components=${comps.length} top12:`, JSON.stringify(comps.slice(0,12)))
  return comps
}
components(16); components(128)
