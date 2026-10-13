// Correction probe (cmr15a-phase3-fall-gates correction): on prone cells 4/7 the
// build.mjs butt BOX overlaps the legs lying directly above the cap ball, so the
// min-projection band lands on shin/boot (red crosses on legs in the marked views
// personally opened this package), modestly inflating length. Re-measure native
// cap->tip with TIGHT boxes on the cap ball only (from cells-native
// cell{4,7,8}-capgrid10.png 10px grids via probe-capgrid.py, opened this
// package: balls at x~641/y~700, x~658/y~962, x~1229/y~975 - the build BOXes
// sit ~60px left on the legs), same min-projection-band method and the
// build's native tip landmarks (cyan crosses verified on tips). Cell8 included
// as control (ball isolated below the body). Deterministic; writes JSON.
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
const DIR = 'art/motion/xuchu/closeout-campaign/11-fall/'
const sheet = PNG.sync.read(readFileSync(DIR + 'candidate-raw.png'))
const SW = sheet.width
const A = (x, y) => sheet.data[((y * SW + x) << 2) + 3]
const S = 459 / 391, U_PER_PX = 124 / 477
const BAND = [124.40626991803302, 137.50166675151021]
// tight cap-ball boxes [x0,y0,x1,y1] + build native tip landmarks
const CELLS = {
  'cell4-down': { box: [638, 695, 675, 712], tip: [1025, 609], buildU: 139.63 },
  'cell7-spare-fall-c': { box: [658, 955, 695, 975], tip: [1007, 902], buildU: 128.23 },
  'cell8-spare-fall-d': { box: [1226, 963, 1265, 987], tip: [1515, 896], buildU: 101.09 },
}
const out = {}
for (const [name, c] of Object.entries(CELLS)) {
  const pts = []
  for (let y = c.box[1]; y <= c.box[3]; y++) for (let x = c.box[0]; x <= c.box[2]; x++) if (A(x, y) >= 16) pts.push([x, y])
  const bc = [(c.box[0] + c.box[2]) / 2, (c.box[1] + c.box[3]) / 2]
  let ux = c.tip[0] - bc[0], uy = c.tip[1] - bc[1]; const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul
  const tOf = (p) => (p[0] - bc[0]) * ux + (p[1] - bc[1]) * uy
  const tMin = Math.min(...pts.map(tOf))
  const band = pts.filter(p => tOf(p) < tMin + 6)
  const butt = [band.reduce((s, p) => s + p[0], 0) / band.length, band.reduce((s, p) => s + p[1], 0) / band.length]
  const nativePx = Math.hypot(c.tip[0] - butt[0], c.tip[1] - butt[1])
  const regPx = nativePx * S, u = regPx * U_PER_PX
  out[name] = { tightBox: c.box, alphaPxInBox: pts.length, buttNative: butt.map(v => Math.round(v * 100) / 100), tipNative: c.tip, nativePx: Math.round(nativePx * 100) / 100, regPx: Math.round(regPx * 100) / 100, u: Math.round(u * 100) / 100, buildU: c.buildU, inBand: u >= BAND[0] && u <= BAND[1] }
  console.log(name, JSON.stringify(out[name]))
}
writeFileSync(DIR + 'gate/probe-prone-butt.json', JSON.stringify({ work: 'cmr15a-phase3-fall-gates (correction probe)', scale: S, bandU: BAND, cells: out }, null, 2) + '\n')
