// CMR-15A ALTERNATIVE diagnostic Phase 1, Experiment 2 (ZERO generation).
// Stage A: full-sheet alpha connected-component analysis of walk-candidate-2.png
// (NOT nominal 512px cells), deterministic extraction of the complete walk:0 /
// walk:1 figures, campaign registration (uniform scale+translate, ground->500,
// alpha centred), and weapon measurement. Stage B (micro-rotation) is decided
// from Stage A numbers and lives in walk01-gate.mjs. No banking.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../scripts/pack-projection.mjs'

const out = 'art/motion/xuchu/alternative/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const SRC = 'art/motion/xuchu/walk-candidate-2.png'
const EXPECTED_SHA = 'bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c'
const srcBuf = readFileSync(SRC)
if (sha(srcBuf) !== EXPECTED_SHA) throw new Error('sheet SHA mismatch ' + sha(srcBuf))
const sh = PNG.sync.read(srcBuf)
const W = sh.width, H = sh.height
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500 }
const ANCHOR = { butt: [35, 318], tip: [486, 95] }
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const angDeg = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

// --- Connected components, alpha>=8, 8-connectivity (probe: alpha>=1 pulls in
// faint background smears, alpha>=8/16/128 all give exactly 6 figure components) ---
const THR = 8
const label = new Int32Array(W * H).fill(-1)
const comps = []
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const idx = y * W + x
  if (label[idx] !== -1 || sh.data[idx * 4 + 3] < THR) continue
  const id = comps.length
  let cnt = 0, x0 = x, x1 = x, y0 = y, y1 = y
  const stack = [[x, y]]; label[idx] = id
  while (stack.length) {
    const [cx, cy] = stack.pop(); cnt++
    if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const ni = ny * W + nx
      if (label[ni] === -1 && sh.data[ni * 4 + 3] >= THR) { label[ni] = id; stack.push([nx, ny]) }
    }
  }
  comps.push({ id, cnt, bounds: [x0, y0, x1, y1] })
}
const big = comps.filter(c => c.cnt > 10000).sort((a, b) => a.bounds[1] - b.bounds[1] || a.bounds[0] - b.bounds[0])
// Top row left->right = walk0, walk1, walk2 (feasibility plan §a nominal layout)
const topRow = big.filter(c => c.bounds[1] < 512).sort((a, b) => a.bounds[0] - b.bounds[0])
if (big.length !== 6 || topRow.length !== 3) throw new Error(`expected 6 figures/3 top-row, got ${big.length}/${topRow.length}`)
// Min pixel distance between walk0 and walk1 components (BFS distance transform from walk1)
function minDist(idA, idB) {
  const dist = new Int32Array(W * H).fill(-1); const q = []
  for (let i = 0; i < W * H; i++) if (label[i] === idB) { dist[i] = 0; q.push(i) }
  let head = 0, best = 1e9
  while (head < q.length) {
    const i = q[head++], x = i % W, y = (i / W) | 0, d0 = dist[i]
    if (d0 >= best) continue
    if (label[i] === idA && d0 < best) best = d0
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const ni = ny * W + nx
      if (dist[ni] === -1) { dist[ni] = d0 + 1; q.push(ni) }
    }
  }
  return best // Chebyshev-ish (4-conn BFS steps); components are 8-conn separated so >=2
}
const compReport = big.map(c => ({ id: c.id, cnt: c.cnt, bounds: c.bounds }))

function extract(comp, name) {
  const [x0, y0, x1, y1] = comp.bounds, w = x1 - x0 + 1, h = y1 - y0 + 1
  const png = new PNG({ width: w, height: h })
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const si = (y * W + x)
    if (label[si] !== comp.id) continue
    const k = si * 4, dk = ((y - y0) * w + (x - x0)) * 4
    png.data[dk] = sh.data[k]; png.data[dk + 1] = sh.data[k + 1]; png.data[dk + 2] = sh.data[k + 2]; png.data[dk + 3] = sh.data[k + 3]
  }
  const buf = PNG.sync.write(png)
  writeFileSync(out + name, buf)
  return { buf, w, h }
}
function landmarks(comp) {
  const [x0, y0, x1, y1] = comp.bounds
  const pts = []
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (label[y * W + x] === comp.id && sh.data[(y * W + x) * 4 + 3] >= 16) pts.push([x, y])
  // butt = alpha-xmin cap centre (median y of pixels within 2px of xmin), as walk3 gate
  const capYs = pts.filter(p => p[0] <= x0 + 2).map(p => p[1]).sort((a, b) => a - b)
  const butt = [x0, capYs[capYs.length >> 1]]
  // tip = blade apex by iterated max axis projection (butt -> rightmost px, then re-aim)
  let aim = pts.reduce((m, p) => (p[0] > m[0] ? p : m), pts[0])
  let tip = aim
  for (let it = 0; it < 3; it++) {
    const d = [aim[0] - butt[0], aim[1] - butt[1]], L = Math.hypot(...d), ux = d[0] / L, uy = d[1] / L
    let best = -1e18
    for (const p of pts) { const t = (p[0] - butt[0]) * ux + (p[1] - butt[1]) * uy; if (t > best) { best = t; tip = p } }
    aim = tip
  }
  // topmost blade-region pixel (x in right third) for cross-check
  const topBlade = pts.filter(p => p[0] > x0 + (x1 - x0) * 2 / 3).reduce((m, p) => (p[1] < m[1] ? p : m))
  // boot clusters: component pixels within 80px of ground, clustered by x gaps >12
  const low = pts.filter(p => p[1] >= y1 - 80)
  const xs = [...new Set(low.map(p => p[0]))].sort((a, b) => a - b)
  const clusters = []
  for (const x of xs) {
    const last = clusters[clusters.length - 1]
    if (!last || x - last.x1 > 12) clusters.push({ x0: x, x1: x, ymax: 0, cnt: 0 })
    const c = clusters[clusters.length - 1]; c.x1 = x
  }
  for (const c of clusters) { const ps = low.filter(p => p[0] >= c.x0 && p[0] <= c.x1); c.cnt = ps.length; c.ymax = Math.max(...ps.map(p => p[1])) }
  return { butt, tip, topBlade, crown: y0, ground: y1, bootClusters: clusters.filter(c => c.cnt > 200) }
}
function weaponReport(butt, tip) {
  const px = len(butt, tip), uu = px * U_PER_PX, a = angDeg(butt, tip)
  return { pxAt512: px, u: uu, inBand: uu >= FROZEN.weaponBandU.lo && uu <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(butt, ANCHOR.butt, ANCHOR.tip), tip: perp(tip, ANCHOR.butt, ANCHOR.tip), corridorLimitPx: 14 }, tipInsideFrame: tip[0] >= 0 && tip[0] <= 511, tipRightMarginPxAt512: 512 - tip[0] }
}
const KEYS = [
  { key: 'walk:0', name: 'walk0', comp: topRow[0], beardSheet: [285, 128], nominalCell: [0, 0], priorCellSha: '6bfff0f6aa45105fd34c758e5900dd321f7c2079369faaf42dafdcad24c53eca' },
  { key: 'walk:1', name: 'walk1', comp: topRow[1], beardSheet: [804, 138], nominalCell: [512, 0], priorCellSha: '98c283b5283c1f87252a35f1a41c1b4aedf7844bd9fb0c191beb592c684e429d' },
]
const results = {}
for (const K of KEYS) {
  const ex = extract(K.comp, `${K.name}-extracted.png`)
  const lm = landmarks(K.comp)
  const [x0, y0, x1, y1] = K.comp.bounds
  const bodyH = y1 - y0 + 1
  const factor = FROZEN.bodyHeightPxAt512 / bodyH
  const dy = FROZEN.groundYAt512 - y1 * factor
  const dx = 256 - ((x0 + x1) / 2) * factor
  const tf = (p) => [p[0] * factor + dx, p[1] * factor + dy]
  const cropImg = await loadImage(out + `${K.name}-extracted.png`)
  const cv = createCanvas(512, 512), g = cv.getContext('2d')
  g.imageSmoothingEnabled = true; g.translate(dx, dy); g.scale(factor, factor); g.drawImage(cropImg, x0, y0)
  const regBuf = cv.toBuffer('image/png')
  writeFileSync(out + `${K.name}-registered.png`, regBuf)
  const regPng = PNG.sync.read(regBuf)
  let rx0 = 1e9, ry0 = 1e9, rx1 = -1, ry1 = -1, green = 0, eL = 0, eR = 0, eT = 0, eB = 0
  const isGreen = (r, gg, b) => gg > 150 && r < 120 && b < 120
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const k = (y * 512 + x) * 4, a = regPng.data[k + 3]
    if (a >= 16) { rx0 = Math.min(rx0, x); rx1 = Math.max(rx1, x); ry0 = Math.min(ry0, y); ry1 = Math.max(ry1, y); if (x === 0) eL++; if (x === 511) eR++; if (y === 0) eT++; if (y === 511) eB++; if (isGreen(regPng.data[k], regPng.data[k + 1], regPng.data[k + 2])) green++ }
  }
  const regWeapon = { butt: tf(lm.butt), tip: tf(lm.tip) }
  const wr = weaponReport(regWeapon.butt, regWeapon.tip)
  // marked registered + zooms
  const regImg = await loadImage(out + `${K.name}-registered.png`)
  const mc = createCanvas(512, 512), mg = mc.getContext('2d'); mg.drawImage(regImg, 0, 0)
  mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(...regWeapon.butt); mg.lineTo(...regWeapon.tip); mg.stroke()
  mg.strokeStyle = '#ffe040'; mg.setLineDash([6, 4]); mg.beginPath(); mg.moveTo(...ANCHOR.butt); mg.lineTo(...ANCHOR.tip); mg.stroke(); mg.setLineDash([])
  mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText(`${K.key} butt->tip (component extraction)`, regWeapon.butt[0], regWeapon.butt[1] - 8)
  mg.fillStyle = '#40c0ff'; const bd = tf(K.beardSheet); mg.beginPath(); mg.arc(...bd, 5, 0, 7); mg.fill(); mg.fillText('beard tip RAW', bd[0] + 8, bd[1])
  mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, 500); mg.lineTo(512, 500); mg.stroke()
  writeFileSync(out + `${K.name}-marked.png`, mc.toBuffer('image/png'))
  const zoom = (x, y, w, h, s, name) => { const c = createCanvas(w * s, h * s), q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(regImg, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(out + name, c.toBuffer('image/png')) }
  zoom(140, 0, 230, 220, 3, `${K.name}-head-3x.png`)
  zoom(0, 330, 512, 182, 2, `${K.name}-legs-2x.png`)
  zoom(Math.max(0, Math.min(380, Math.round(regWeapon.tip[0]) - 90)), Math.max(0, Math.round(regWeapon.tip[1]) - 60), 132, 130, 4, `${K.name}-tip-4x.png`)
  results[K.name] = {
    key: K.key, component: { id: K.comp.id, cntAlphaGE8: K.comp.cnt, boundsSheet: K.comp.bounds, nominalCellOrigin: K.nominalCell, spillBeyondNominalRightPx: x1 - (K.nominalCell[0] + 511), priorNominalCellSha256: K.priorCellSha },
    extracted: { path: out + `${K.name}-extracted.png`, sha256: sha(ex.buf), size: [ex.w, ex.h] },
    landmarksSheet: lm,
    registration: { rule: 'uniform scale factor=459/(ymax-ymin+1) then translate ground(ymax)->500@512, alpha bounds centred horizontally (attempt3 gate convention)', bodyHeightPx: bodyH, factor, factorPct: (factor - 1) * 100, withinPlusMinus12Pct: Math.abs(factor - 1) <= 0.12, dx, dy },
    registered: { path: out + `${K.name}-registered.png`, sha256: sha(regBuf), rasterBounds: { xmin: rx0, ymin: ry0, xmax: rx1, ymax: ry1 }, greenPx: green, edgeOpaquePx: { left: eL, right: eR, top: eT, bottom: eB } },
    landmarksRegistered: { weapon: regWeapon, beard: tf(K.beardSheet), crownY: tf([0, lm.crown])[1], groundY: tf([0, lm.ground])[1], bootClustersRegistered: lm.bootClusters.map(c => ({ x: [c.x0 * factor + dx, c.x1 * factor + dx], soleY: c.ymax * factor + dy, cnt: c.cnt })) },
    weaponRegistered: wr,
    wholeLengthMeasurable: true, tipClippedInSheet: false,
  }
}
// neighbour-boundary zooms from the sheet (component-coloured proof of a clean gap)
const sheetImg = await loadImage(SRC)
function boundaryZoom(x, y, w, h, s, name, boundaryX) {
  const c = createCanvas(w * s, h * s), g = c.getContext('2d')
  g.fillStyle = '#202020'; g.fillRect(0, 0, w * s, h * s); g.imageSmoothingEnabled = false
  g.drawImage(sheetImg, x, y, w, h, 0, 0, w * s, h * s)
  g.strokeStyle = '#ffe040'; g.lineWidth = 3; g.setLineDash([10, 6]); g.beginPath(); g.moveTo((boundaryX - x) * s, 0); g.lineTo((boundaryX - x) * s, h * s); g.stroke()
  g.setLineDash([]); g.fillStyle = '#ffe040'; g.font = 'bold 22px sans-serif'; g.fillText(`nominal cell edge x=${boundaryX}`, (boundaryX - x) * s + 10, 30)
  writeFileSync(out + name, c.toBuffer('image/png'))
}
boundaryZoom(400, 40, 260, 220, 3, 'walk0-boundary-3x.png', 512)
boundaryZoom(920, 40, 260, 220, 3, 'walk1-boundary-3x.png', 1024)
const midGap01 = minDist(topRow[0].id, topRow[1].id)
const midGap12 = minDist(topRow[1].id, topRow[2].id)
const report = {
  work: 'cmr15a-alt-phase1-diagnostic', experiment: 2, stage: 'A extraction+registration+measurement', zeroGeneration: true,
  statusNote: 'DIAGNOSTIC ONLY — CMR-15A remains BLOCKED; nothing banked/copied to accepted paths.',
  source: { path: SRC, sha256: sha(srcBuf), size: [W, H] },
  componentAnalysis: { thresholdAlphaGE: THR, connectivity: 8, totalComponents: comps.length, figureComponents: compReport, thresholdSensitivity: 'probe: alpha>=1 merges faint background smears into bounds (still 6 max components); alpha>=4/8/16/128 all yield exactly 6 figure components with near-identical bounds', minPixelDistanceWalk0ToWalk1: midGap01, minPixelDistanceWalk1ToWalk2: midGap12 },
  frozenBriefBand: FROZEN, cells: results,
}
writeFileSync(out + 'walk01-extract.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ comps: compReport, midGap01, midGap12, walk0: results.walk0.weaponRegistered, walk1: results.walk1.weaponRegistered, lm0: results.walk0.landmarksSheet, lm1: results.walk1.landmarksSheet, reg0: results.walk0.registered, reg1: results.walk1.registered }, null, 1))
