import { createCanvas, loadImage } from '@napi-rs/canvas';
const cand = await loadImage('art/motion/xiahoudun/perframe-heavy/candidate-k2-raw.jpg');
function pixels(img, W, H) {
  const c = createCanvas(W, H); const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H); return ctx.getImageData(0, 0, W, H);
}
const CW = cand.width, CH = cand.height;
const cd = pixels(cand, CW, CH);
const px=(x,y)=>[cd.data[(y*CW+x)*4],cd.data[(y*CW+x)*4+1],cd.data[(y*CW+x)*4+2]];
// extension transect (490,380)->(525,460)
console.log('--- cand beard extension ---');
for(let k=0;k<=32;k++){ const x=Math.round(490+35*k/32), y=Math.round(380+80*k/32);
  console.log(`k=${k} (${x},${y}) ${px(x,y).join(',')}`); }
// beard bottom scan across x440-505: last dark(max<120) before first skin(max>140 & r-b>40) below y380
console.log('--- beard bottom per column ---');
for(let x=440;x<=505;x+=5){
  let lastDark=-1, neckY=-1;
  for(let y=380;y<=500;y++){ const [r,g,b]=px(x,y); const m=Math.max(r,g,b);
    if(m<120) lastDark=y;
    if(neckY<0 && r>130&&g>90&&b>60&&(r-b)>35&&y>395) neckY=y;
  }
  console.log(`x=${x} lastDark=${lastDark} neckY=${neckY}`);
}
