#!/usr/bin/env node
// CMR-14A review aid: before/after tick pairs at every exposure CHANGE of the
// registered charge candidate, from the already-emitted per-tick stills.
// A model cannot watch playback; a one-tick hard cut at 60Hz IS exactly the
// before/after pair, so these pairs are the faithful evidence for a pop.
import{createCanvas,loadImage}from'@napi-rs/canvas'
import{readFileSync,writeFileSync}from'node:fs'
const DIR='artifacts/motion/xiahoudun/registered-charge'
export function exposureBoundaries(exposures){return exposures.slice(1).map((e,i)=>({before:e.tick-1,after:e.tick,from:exposures[i].frame,to:e.frame}))}
async function main(){
 const spec=JSON.parse(readFileSync('art/motion/xiahoudun/charge-registration-candidate.json','utf8')),b=exposureBoundaries(spec.exposures)
 const name=n=>`${DIR}/ticks/tick-${String(n).padStart(3,'0')}.png`,groups=[b.slice(0,3),b.slice(3)]
 const out=[]
 for(const[gi,g]of groups.entries()){
  const W=700,H=320,cv=createCanvas(W*2+12,(H+26)*g.length),c=cv.getContext('2d');c.fillStyle='#10111a';c.fillRect(0,0,cv.width,cv.height)
  for(const[i,x]of g.entries()){const y=i*(H+26);c.drawImage(await loadImage(name(x.before)),0,y+26);c.drawImage(await loadImage(name(x.after)),W+12,y+26);c.fillStyle='#ffe890';c.font='bold 15px sans-serif';c.fillText(`tick ${x.before} (${x.from})  ->  tick ${x.after} (${x.to})   [one-tick hard cut at 60Hz]`,8,y+18)}
  const p=`${DIR}/boundary-filmstrip-${gi+1}.png`;writeFileSync(p,cv.toBuffer('image/png'));out.push(p)
 }
 console.log(JSON.stringify({boundaries:b,files:out},null,2))
}
if(process.argv[1]&&process.argv[1].endsWith('render-xiahoudun-boundary-filmstrips.mjs'))await main()
