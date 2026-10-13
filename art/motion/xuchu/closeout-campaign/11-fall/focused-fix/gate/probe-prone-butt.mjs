// Cross-check probe (cmr15a-fall-fix-gate-resume): the ORIGINAL fall gate needed
// this probe because loose prone butt BOXes landed on shin/boot. The focused-fix
// build.mjs BOXes are already tight on the isolated cap balls; this probe
// independently re-measures native cap->tip pre-retouch at the fix scale with the
// same tight boxes + build native tip landmarks and must agree with the build's
// registered lengths (141.58/117.84/94.04u). Cap balls from the focused-fix
// cells-native grids at ~(612,698)/(662,957)/(1250,972). Deterministic.
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
const DIR = 'art/motion/xuchu/closeout-campaign/11-fall/focused-fix/'
const sheet = PNG.sync.read(readFileSync(DIR + 'candidate-raw.png'))
const SW = sheet.width
const A = (x, y) => sheet.data[((y * SW + x) << 2) + 3]
const S = 459 / 394, U_PER_PX = 124 / 477
const BAND = [124.40626991803302, 137.50166675151021]
// tight cap-ball boxes [x0,y0,x1,y1] (identical to build.mjs BOX) + build native tips
const CELLS = {
  'cell4-down': { box: [595, 678, 635, 712], tip: [1050, 616], buildU: 141.58 },
  'cell7-spare-fall-c': { box: [645, 935, 685, 975], tip: [1017, 889], buildU: 117.84 },
  'cell8-spare-fall-d': { box: [1225, 950, 1280, 993], tip: [1521, 890], buildU: 94.04 },
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
writeFileSync(DIR + 'gate/probe-prone-butt.json', JSON.stringify({ work: 'cmr15a-fall-fix-gate-resume (prone cross-check probe)', scale: S, bandU: BAND, cells: out }, null, 2) + '\n')
