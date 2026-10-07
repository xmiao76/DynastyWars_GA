#!/usr/bin/env node
// CMR-14A review aid: compare adjacent whole-silhouette TOP changes along the
// ordered guard->charge0..4->guard sequence for the accepted Li Dian pack
// (same 260x144/groundY136/density2 box) and the Xiahou Dun registered
// candidate. The top of a trimmed bbox INCLUDES the raised weapon, so this is a
// coarse family-of-motion envelope - NOT a head, pelvis or skull measurement.
// Requires: node scripts/review-xiahoudun-registered-charge.mjs (writes manifest).
import{readFileSync}from'node:fs'
const SEQ=['walk:0','charge:0','charge:1','charge:2','charge:3','charge:4','walk:0']
export function topDeltas(seq,topOf){
 return seq.slice(1).map((to,i)=>{const from=seq[i],a=topOf(from),b=topOf(to);return{from,to,topFrom:+a.toFixed(2),topTo:+b.toFixed(2),delta:+(b-a).toFixed(2)}})
}
export function compareChargeSilhouetteTops(lidianPrepared,xiahouManifest){
 const li=lidianPrepared.frames,box=lidianPrepared.box,groundArt=box.groundY*lidianPrepared.density
 const liTop=n=>{if(!li[n])throw Error('lidian frame missing '+n);return(groundArt-li[n].trimY)/lidianPrepared.density}
 const xd=xiahouManifest.frames,xdGround=xiahouManifest.box.groundY*xiahouManifest.density
 const xdTop=n=>{if(!xd[n])throw Error('xiahoudun candidate frame missing '+n);return(xdGround-xd[n].bounds.y)/xiahouManifest.density}
 const lidian=topDeltas(SEQ,liTop),xiahoudun=topDeltas(SEQ,xdTop),max=a=>Math.max(...a.map(r=>Math.abs(r.delta)))
 return{sequence:SEQ,lidian,xiahoudun,maxAdjacentAbsDelta:{lidian:max(lidian),xiahoudun:max(xiahoudun)},dashToDash2:{lidian:lidian[3].delta,xiahoudun:xiahoudun[3].delta},
  limits:'Trimmed-bbox top includes the weapon; Li Dian precedent carries its own caveats; not head/pelvis/skull evidence, not normal-speed playback.'}
}
if(process.argv[1]&&process.argv[1].endsWith('compare-xiahoudun-lidian-charge-silhouette.mjs')){
 const out=compareChargeSilhouetteTops(JSON.parse(readFileSync('src/game/assets/motion/lidian-prepared.json','utf8')),JSON.parse(readFileSync('artifacts/motion/xiahoudun/registered-charge/manifest.json','utf8')))
 console.log(JSON.stringify(out,null,2))
}
