import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
const orig = await loadImage('art/motion/xiahoudun/perframe-heavy/heavy-k2-original-cell.png');
const cand = await loadImage('art/motion/xiahoudun/perframe-heavy/candidate-k2-raw.jpg');
const OW = orig.width, OH = orig.height, CW = cand.width, CH = cand.height;
function data(img, W, H) {
  const c = createCanvas(W, H); const x = c.getContext('2d');
  x.drawImage(img, 0, 0, W, H); return x.getImageData(0, 0, W, H);
}
const od = data(orig, OW, OH), cd = data(cand, CW, CH);
const oP = (x, y) => { const i = (y * OW + x) * 4; return [od.data[i], od.data[i+1], od.data[i+2], od.data[i+3]]; };
const cP = (x, y) => { const i = (y * CW + x) * 4; return [cd.data[i], cd.data[i+1], cd.data[i+2], cd.data[i+3]]; };

// ---- ORIGINAL spear angle (given) ----
const ob = [89, 279], ot = [490, 512];
const oLen = Math.hypot(ot[0]-ob[0], ot[1]-ob[1]);
const oAng = Math.atan2(ot[1]-ob[1], ot[0]-ob[0]) * 180 / Math.PI;

// ---- ORIGINAL height: alpha>25, x < 430 (=490-60) ----
let oTop = -1, oBoot = -1;
for (let y = 0; y < OH; y++) {
  for (let x = 0; x < 430; x++) {
    if (oP(x, y)[3] > 25) { if (oTop < 0) oTop = y; oBoot = y; break; }
  }
}
// per-column detail for top/boot
let oTopRow = oTop, oBootRow = oBoot;
const origH = oBootRow - oTopRow;

// ---- CANDIDATE spear endpoints ----
// dark shaft mask: max<100
const isDark = (r,g,b) => Math.max(r,g,b) < 100;
const isRed = (r,g,b) => r > 120 && (r - b) > 60; // tassel exclusion
// BUTT: mid-left box (butt cap vs hair exclusion: hair y<330, body x>320)
const dx = 401, dy = 233, n = Math.hypot(dx,dy), ux = dx/n, uy = dy/n;
let butt = null, bestB = Infinity;
for (let y = 350; y < 560; y++) for (let x = 80; x < 320; x++) {
  const [r,g,b] = cP(x,y);
  if (!isDark(r,g,b)) continue;
  const t = x*ux + y*uy; // projection along shaft; butt = min
  if (t < bestB) { bestB = t; butt = [x,y]; }
}
// TIP: region x>550,y>550, non-white, non-red, most down-right along shaft (max proj)
let tip = null, bestT = -Infinity;
for (let y = 550; y < CH; y++) for (let x = 550; x < CW; x++) {
  const [r,g,b] = cP(x,y);
  if (Math.min(r,g,b) >= 235) continue; // white
  if (isRed(r,g,b)) continue;           // tassel
  const t = x*ux + y*uy;
  if (t > bestT) { bestT = t; tip = [x,y]; }
}
console.log('orig', OW, OH, 'oTop', oTopRow, 'oBoot', oBootRow, 'origH', origH, 'oLen', oLen.toFixed(2), 'oAng', oAng.toFixed(2));
console.log('butt', butt, 'tip', tip);
const candLen = Math.hypot(tip[0]-butt[0], tip[1]-butt[1]);
const candAng = Math.atan2(tip[1]-butt[1], tip[0]-butt[0]) * 180 / Math.PI;
console.log('candLen', candLen.toFixed(2), 'candAng', candAng.toFixed(2));

// ---- CANDIDATE height: minRGB<235, x < tipX-60 ----
const cutX = tip[0] - 60;
let cTop = -1, cBoot = -1;
for (let y = 0; y < CH; y++) {
  for (let x = 0; x < cutX; x++) {
    const [r,g,b] = cP(x,y);
    if (Math.min(r,g,b) < 235) { if (cTop < 0) cTop = y; cBoot = y; break; }
  }
}
const candH = cBoot - cTop;
const s1 = origH / candH;
const L = candLen * s1;
const band = [505.20, 558.38];
const inBand = L >= band[0] && L <= band[1];
const dAng = candAng - oAng;
console.log('cTop', cTop, 'cBoot', cBoot, 'candH', candH, 'cutX', cutX);
console.log('s1', s1.toFixed(5), 'L', L.toFixed(2), 'inBand', inBand, 'dAng', dAng.toFixed(2));
const out = { origH, candH, s1, rule: `columns x < tipX-60 (orig tipX=490 -> cut 430; cand tipX=${tip[0]} -> cut ${cutX})`, origTipX: 490, candTipX: tip[0], cutOrig: 430, cutCand: cutX, origTop: oTopRow, origBoot: oBootRow, candTop: cTop, candBoot: cBoot, butt: {x: butt[0], y: butt[1]}, tip: {x: tip[0], y: tip[1]}, candLen, L, band, inBand, origAngleDeg: oAng, candAngleDeg: candAng, angleDeltaDeg: dAng, origEndpoints: {butt: {x: 89, y: 279}, tip: {x: 490, y: 512}}, origLen: oLen };
writeFileSync('art/motion/xiahoudun/perframe-heavy/candidate-k2-gate.json', JSON.stringify(out, null, 2));
// marked png
const mc = createCanvas(CW, CH); const m = mc.getContext('2d');
m.drawImage(cand, 0, 0, CW, CH);
for (const [px, py] of [butt, tip]) {
  m.strokeStyle = 'red'; m.lineWidth = 5;
  m.beginPath(); m.arc(px, py, 22, 0, Math.PI*2); m.stroke();
  m.fillStyle = 'red'; m.beginPath(); m.arc(px, py, 6, 0, Math.PI*2); m.fill();
}
writeFileSync('art/motion/xiahoudun/perframe-heavy/candidate-k2-marked.png', mc.toBuffer('image/png'));
console.log('wrote json+png');
