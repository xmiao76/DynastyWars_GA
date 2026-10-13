// CMR-15A heavy FOCUSED-FIX gate (work cmr15a-heavy-focused-fix-gates). Zero generation.
// Identical method to 09-heavy/gate/build.mjs (copied + adapted):
// component-extracts 09-heavy/focused-fix/candidate-raw.png (593ea8e4...), registers ALL 9 cells
// (keeps 0-4 + spares 5-8, spares gated for possible role substitution) with ONE uniform
// sheet scale from cell4 recover crown->sole = 459px, sole->ground; measures fresh raster
// weapon/body/ground/seam landmarks vs the frozen band; attempts deterministic shaft
// retouch FIRST for any OUT_HIGH length outlier, re-measures; emits final cells + marked
// (butt/tip/ground) + head/tip/soles zooms + contact sheets.
// Adaptations (proved measurement corrections, band/scale unchanged):
//  (1) canvas height widened 512->768 (ground 756 = frozen 500 + 256 top pad), mirroring
//      the combo width widening 768->1024: heavy overhead tips legitimately extend above
//      the crown and a 512 canvas would artificially clip them before measurement.
//  (2) native butt landmark: axis min-projection band (as measureReg) instead of minX
//      band, because heavy overhead cells 1/5/6 carry the butt end on the RIGHT.
// Butt-cap visibility personally verified on focused-fix/gate/cells-native/*{butt,grip}zoom.png
// (zoom_probe.py): complete round cap balls on cells 0,1,2,4,5 (cell2 NEW vs original stub);
// cell3 haft still ends at/behind the hand with NO cap drawn (stub again), cells 7,8 shaft
// ends flat at the grip and cell6 ends inside the far hand - no cap drawn, so
// BUTT_VISIBLE=false there and the measured value is the visible stub (lower bound).
// Banking/WAIVER_ELIGIBLE decided in gate-verdict.mjs. Deterministic reruns.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const DIR = 'art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/'
const G = DIR + 'gate/'
mkdirSync(G + 'cells-registered', { recursive: true })
const sha = (b) => createHash('sha256').update(b).digest('hex')
const U_PER_PX = 124 / 477
const FROZEN = { bodyPx: 459, groundY: 500, weaponU: 130.79017343848048, bandU: [124.40626991803302, 137.50166675151021], angleDeg: -26.31040494480514, weaponPxAt512: 503.12026395286443 }
const TARGET_U = 132, TARGET_PX = TARGET_U / U_PER_PX
const CANVAS_W = 1024, CANVAS_H = 768, PAD_TOP = 256 // height widened (see header); GROUND_Y = frozen 500 + PAD_TOP
const GROUND_Y = FROZEN.groundY + PAD_TOP
const round2 = (v) => Math.round(v * 100) / 100

const sheetBuf = readFileSync(DIR + 'candidate-raw.png')
const sheetSha = sha(sheetBuf)
if (!sheetSha.startsWith('593ea8e4')) throw new Error('sheet hash mismatch ' + sheetSha)
const sheet = PNG.sync.read(sheetBuf)
const SW = sheet.width, SH = sheet.height
const A = (x, y) => sheet.data[((y * SW + x) << 2) + 3]

// ---- ledger verify (no writes) ----
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, xuchuHeavy: ledger.fighters.xuchu.sheetCandidates?.heavy ?? null, globalUsed, expected: 'Xu Chu 19 (heavy 2) / global 186', matches: ledger.fighters.xuchu.used === 19 && globalUsed === 186 }
if (!ledgerState.matches) throw new Error('ledger mismatch ' + JSON.stringify(ledgerState))

// ---- connected components (alpha>=16, 8-conn) ----
const lab = new Int32Array(SW * SH).fill(-1)
const comps = []
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
  const idx = y * SW + x
  if (A(x, y) < 16 || lab[idx] !== -1) continue
  const id = comps.length; const stack = [idx]; lab[idx] = id
  let xmin = x, xmax = x, ymin = y, ymax = y, n = 0, sx = 0, sy = 0
  while (stack.length) {
    const p = stack.pop(); const px = p % SW, py = (p / SW) | 0; n++; sx += px; sy += py
    if (px < xmin) xmin = px; if (px > xmax) xmax = px; if (py < ymin) ymin = py; if (py > ymax) ymax = py
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const qx = px + dx, qy = py + dy
      if (qx < 0 || qy < 0 || qx >= SW || qy >= SH) continue
      const q = qy * SW + qx
      if (lab[q] === -1 && A(qx, qy) >= 16) { lab[q] = id; stack.push(q) }
    }
  }
  comps.push({ id, n, xmin, xmax, ymin, ymax, cx: sx / n, cy: sy / n })
}
const big = comps.filter(c => c.n > 5000).sort((p, q) => (Math.floor(p.cy / (SH / 3)) - Math.floor(q.cy / (SH / 3))) || (p.cx - q.cx))
if (big.length !== 9) throw new Error('expected 9 figure components, got ' + big.length)
const NAMES = ['cell0-raise', 'cell1-overhead-hold', 'cell2-crushing-chop', 'cell3-follow-through', 'cell4-recover', 'cell5-spare-overhead-a', 'cell6-spare-overhead-b', 'cell7-spare-chop-a', 'cell8-spare-chop-b']
const KEEP = [0, 1, 2, 3, 4]
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const SCALE_CELL = 4 // recover = near-upright guard-link bookend (heavy has no guard cell)
const BUTT_VISIBLE = { 0: true, 1: true, 2: true, 3: false, 4: true, 5: true, 6: false, 7: false, 8: false } // see header zooms

// landmark boxes in SHEET coords, chosen from the heavy grid views
// (gate/cells-native/*-grid.png, recorded constants; all 9 grids + butt/grip/tip
// zooms personally opened. Butt boxes are tight on the cap ball (cells 0,1,4,5) or
// on the visible flat shaft terminus at the grip (stub cells 2,3,6,7,8).)
const BOX = {
  0: { butt: [78, 130, 115, 165], tip: [330, 5, 410, 80], crownX: [240, 300], rearGrip: [160, 100, 220, 155], frontGrip: [160, 100, 220, 155], headX: [240, 310], socketPt: [305, 62] },
  1: { butt: [795, 5, 845, 45], tip: [514, 80, 620, 145], crownX: [700, 760], rearGrip: [740, 20, 800, 75], frontGrip: [610, 70, 670, 125], headX: [690, 770], socketPt: [615, 105] },
  2: { butt: [1070, 198, 1120, 238], tip: [1420, 260, 1532, 340], crownX: [1260, 1330], rearGrip: [1310, 210, 1370, 270], frontGrip: [1360, 225, 1420, 285], headX: [1255, 1335], socketPt: [1415, 275] },
  3: { butt: [360, 560, 392, 600], tip: [500, 590, 592, 680], crownX: [300, 365], rearGrip: [355, 545, 425, 610], frontGrip: [355, 545, 425, 610], headX: [295, 370], socketPt: [495, 605] },
  4: { butt: [617, 560, 660, 600], tip: [900, 392, 987, 480], crownX: [740, 800], rearGrip: [705, 505, 765, 560], frontGrip: [815, 460, 875, 515], headX: [735, 805], socketPt: [875, 470] },
  5: { butt: [1445, 440, 1484, 480], tip: [1154, 371, 1250, 430], crownX: [1310, 1380], rearGrip: [1385, 430, 1445, 485], frontGrip: [1285, 385, 1345, 440], headX: [1305, 1385], socketPt: [1245, 405] },
  6: { butt: [275, 780, 315, 815], tip: [105, 686, 200, 760], crownX: [320, 385], rearGrip: [260, 770, 320, 825], frontGrip: [205, 745, 265, 800], headX: [315, 390], socketPt: [185, 735] },
  7: { butt: [835, 850, 875, 895], tip: [950, 890, 1050, 960], crownX: [760, 825], rearGrip: [820, 840, 885, 895], frontGrip: [820, 840, 885, 895], headX: [755, 830], socketPt: [945, 900] },
  8: { butt: [1300, 850, 1340, 890], tip: [1430, 880, 1531, 950], crownX: [1270, 1335], rearGrip: [1280, 840, 1360, 900], frontGrip: [1280, 840, 1360, 900], headX: [1265, 1340], socketPt: [1405, 885] },
}
function boxAlphaPts(box, id) {
  const pts = []
  for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) if (lab[y * SW + x] === id) pts.push([x, y])
  return pts
}
function landmarks(cellIdx) {
  const c = big[cellIdx], b = BOX[cellIdx]
  const bp = boxAlphaPts(b.butt, c.id)
  const tp = boxAlphaPts(b.tip, c.id)
  const tc = [tp.reduce((s, p) => s + p[0], 0) / tp.length, tp.reduce((s, p) => s + p[1], 0) / tp.length]
  // axis min-projection band (heavy adaptation (2)): initial axis buttBoxCentre->tip
  // centroid; butt = centroid of the 6px minimal-projection band (outer cap surface).
  const bc = [(b.butt[0] + b.butt[2]) / 2, (b.butt[1] + b.butt[3]) / 2]
  let aux = tc[0] - bc[0], auy = tc[1] - bc[1]; const aul = Math.hypot(aux, auy); aux /= aul; auy /= aul
  const tOfB = (p) => (p[0] - bc[0]) * aux + (p[1] - bc[1]) * auy
  const tMinB = Math.min(...bp.map(tOfB))
  const band = bp.filter(p => tOfB(p) < tMinB + 6)
  const butt = [band.reduce((s, p) => s + p[0], 0) / band.length, band.reduce((s, p) => s + p[1], 0) / band.length]
  let ux = tc[0] - butt[0], uy = tc[1] - butt[1]; const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul
  let tip = null, best = -1e18
  for (const p of tp) { const t = (p[0] - butt[0]) * ux + (p[1] - butt[1]) * uy; if (t > best) { best = t; tip = p } }
  let crown = 1e9
  for (let y = c.ymin; y <= c.ymax; y++) for (let x = b.crownX[0]; x <= b.crownX[1]; x++) if (lab[y * SW + x] === c.id && y < crown) crown = y
  const sole = c.ymax
  const gripT = (box) => {
    const pts = boxAlphaPts(box, c.id).map(p => (p[0] - butt[0]) * ux + (p[1] - butt[1]) * uy)
    return [Math.min(...pts), Math.max(...pts)]
  }
  // helmet width proxy: max alpha run width within top 26px band of crown in headX range
  let helmetW = 0
  for (let y = crown; y < crown + 26; y++) { let run = 0; for (let x = b.headX[0] - 20; x <= b.headX[1] + 20; x++) { if (x >= 0 && x < SW && lab[y * SW + x] === c.id) { run++; if (run > helmetW) helmetW = run } else run = 0 } }
  const socketT = (b.socketPt[0] - butt[0]) * ux + (b.socketPt[1] - butt[1]) * uy
  return { butt, tip, tipT: best, crown, sole, rearGripT: gripT(b.rearGrip), frontGripT: gripT(b.frontGrip), socketT, helmetW, compId: c.id, bounds: [c.xmin, c.ymin, c.xmax, c.ymax], px: c.n }
}
const LM = {}; for (const i of ALL) LM[i] = landmarks(i)
// sheet scale from cell4 recover (near-upright bookend; one sheet scale for all cells)
const bodyNative = LM[SCALE_CELL].sole - LM[SCALE_CELL].crown
const S = FROZEN.bodyPx / bodyNative

// ---- extract native component crop -> bilinear resample to registered canvas ----
function extractCrop(c) {
  const w = c.xmax - c.xmin + 1, h = c.ymax - c.ymin + 1
  const png = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = c.xmin + x, sy = c.ymin + y, si = (sy * SW + sx) << 2, di = (y * w + x) << 2
    if (lab[sy * SW + sx] === c.id) { png.data[di] = sheet.data[si]; png.data[di + 1] = sheet.data[si + 1]; png.data[di + 2] = sheet.data[si + 2]; png.data[di + 3] = sheet.data[si + 3] }
  }
  return png
}
function register(cellIdx) {
  const c = big[cellIdx], lm = LM[cellIdx], src = extractCrop(c)
  const out = new PNG({ width: CANVAS_W, height: CANVAS_H })
  const dx = Math.round(CANVAS_W / 2 - ((c.xmin + c.xmax) / 2) * S)
  const dy = Math.round(GROUND_Y - lm.sole * S)
  // inverse-map bilinear (premultiplied) for determinism
  for (let y = 0; y < CANVAS_H; y++) for (let x = 0; x < CANVAS_W; x++) {
    const fx = (x - dx) / S - c.xmin - 0.5, fy = (y - dy) / S - c.ymin - 0.5
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
    let r = 0, g = 0, bl = 0, a = 0
    for (const [ox, oy, w] of [[0, 0, (1 - tx) * (1 - ty)], [1, 0, tx * (1 - ty)], [0, 1, (1 - tx) * ty], [1, 1, tx * ty]]) {
      const px = x0 + ox, py = y0 + oy
      if (px < 0 || py < 0 || px >= src.width || py >= src.height) continue
      const i = (py * src.width + px) << 2, av = src.data[i + 3] / 255
      r += src.data[i] * av * w; g += src.data[i + 1] * av * w; bl += src.data[i + 2] * av * w; a += src.data[i + 3] * w
    }
    const di = (y * CANVAS_W + x) << 2, av = a / 255
    if (a > 0.5) { out.data[di] = Math.min(255, Math.round(r / av)); out.data[di + 1] = Math.min(255, Math.round(g / av)); out.data[di + 2] = Math.min(255, Math.round(bl / av)); out.data[di + 3] = Math.round(a) }
  }
  return { png: out, dx, dy }
}
const toReg = (lmPt, reg) => [lmPt[0] * S + reg.dx, lmPt[1] * S + reg.dy]

// ---- fresh raster measurement on a registered/retouched canvas ----
function measureReg(png, buttHint, tipHint) {
  const W = png.width, H = png.height, d = png.data
  const alp = (x, y) => d[((y * W + x) << 2) + 3]
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, green = 0, edge = { l: 0, r: 0, t: 0, b: 0 }
  const colLow = new Array(W).fill(-1)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) << 2
    if (d[i + 3] >= 16) {
      if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
      if (y > colLow[x]) colLow[x] = y
      if (x === 0) edge.l++; if (x === W - 1) edge.r++; if (y === 0) edge.t++; if (y === H - 1) edge.b++
      if (d[i + 1] > 150 && d[i] < 120 && d[i + 2] < 120) green++
    }
  }
  const near = (hint, rad) => {
    const pts = []
    for (let y = Math.max(0, Math.round(hint[1] - rad)); y <= Math.min(H - 1, hint[1] + rad); y++)
      for (let x = Math.max(0, Math.round(hint[0] - rad)); x <= Math.min(W - 1, hint[0] + rad); x++) if (alp(x, y) >= 16) pts.push([x, y])
    return pts
  }
  // Correction (cmr15a-combo-fix-gate-resume2): the inherited minX-band butt finder is
  // WRONG on focused-fix cells 3/4/5 - the cap sits close in front of skirt/leg, so the
  // minX pixels inside the 46px search square belong to the body, not the cap (marked
  // red crosses landed on skirt/thigh/shin; lengths inflated). Use the shaft axis
  // (buttHint->tipHint) instead: pixels within |perp|<=18 of the axis, take the
  // minimal-projection band (mirror of the tip max-projection finder below). Search
  // radius 16 (not 46): the hint is the tight native BOX cap-band centroid transformed
  // (valid cells measure <=6.6px from it), while at radius 46 the skirt pixels lying
  // near the backward shaft-axis extension still win min-t on cells 4/5.
  let hux = tipHint[0] - buttHint[0], huy = tipHint[1] - buttHint[1]; const hul = Math.hypot(hux, huy); hux /= hul; huy /= hul
  const bp = near(buttHint, 16).filter(p => Math.abs((p[0] - buttHint[0]) * -huy + (p[1] - buttHint[1]) * hux) <= 18)
  const tOfB = (p) => (p[0] - buttHint[0]) * hux + (p[1] - buttHint[1]) * huy
  const tMin = Math.min(...bp.map(tOfB))
  const band = bp.filter(p => tOfB(p) < tMin + 7)
  const butt = [band.reduce((s, p) => s + p[0], 0) / band.length, band.reduce((s, p) => s + p[1], 0) / band.length]
  const tp = near(tipHint, 60)
  const tc = [tp.reduce((s, p) => s + p[0], 0) / tp.length, tp.reduce((s, p) => s + p[1], 0) / tp.length]
  let ux = tc[0] - butt[0], uy = tc[1] - butt[1]; const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul
  let tip = null, best = -1e18
  for (const p of tp) { const t = (p[0] - butt[0]) * ux + (p[1] - butt[1]) * uy; if (t > best) { best = t; tip = p } }
  const pxLen = Math.hypot(tip[0] - butt[0], tip[1] - butt[1])
  const angDeg = Math.atan2(tip[1] - butt[1], tip[0] - butt[0]) * 180 / Math.PI
  // boot clusters at sole rows
  const clusters = []; let cur = null
  for (let x = 0; x < W; x++) { if (colLow[x] >= ymax - 26) { if (!cur) cur = { x0: x, x1: x, soleY: colLow[x] }; else { cur.x1 = x; cur.soleY = Math.max(cur.soleY, colLow[x]) } } else if (cur) { clusters.push(cur); cur = null } }
  if (cur) clusters.push(cur)
  const boots = []; for (const c of clusters) { const last = boots[boots.length - 1]; if (last && c.x0 - last.x1 < 24) { last.x1 = c.x1; last.soleY = Math.max(last.soleY, c.soleY) } else boots.push({ ...c }) }
  return { bounds: { xmin, ymin, xmax, ymax }, greenPx: green, edge, butt, tip, pxLen, u: pxLen * U_PER_PX, angDeg, boots, groundErrU: Math.abs(ymax - GROUND_Y) * U_PER_PX }
}

// ---- pommel-side (+ optional blade-side) shaft shortening on registered canvas ----
function retouch(png, m, lmReg) {
  const W = png.width, H = png.height
  const butt = m.butt, tip = m.tip
  let ux = tip[0] - butt[0], uy = tip[1] - butt[1]; const L = Math.hypot(ux, uy); ux /= L; uy /= L
  const vx = -uy, vy = ux
  const remove = Math.round(m.pxLen - TARGET_PX)
  if (remove <= 0) return null
  const rearGripT = lmReg.rearGripT, frontGripT = lmReg.frontGripT, socketT = lmReg.socketT
  // Clean-run scan: at each t, alpha extent across perp +-34. Shaft-only while extent is a
  // single run of width <=30px containing p=0 (body entry widens/splits it). The movable
  // butt segment and the cut must lie where the shaft is over empty background.
  const extentAt = (t) => {
    let lo = null, hi = null, gaps = 0, prev = false
    for (let p = -56; p <= 56; p++) {
      const x = Math.round(butt[0] + ux * t + vx * p), y = Math.round(butt[1] + uy * t + vy * p)
      const on = x >= 0 && y >= 0 && x < W && y < H && png.data[((y * W + x) << 2) + 3] >= 16
      if (on) { if (lo === null) lo = p; hi = p; if (!prev && lo !== p) gaps++ }
      prev = on
    }
    return lo === null ? null : { lo, hi, w: hi - lo + 1, gaps }
  }
  // NOTE: the shaft centre sits +25..30px perp off the butt->tip line in the distal half
  // (the curved blade tip pulls that line), so cleanliness is width/gap only, not p=0 cover.
  const shaftOnly = (t) => { const e = extentAt(t); return e && e.w <= 30 && e.gaps === 0 }
  // Correction (cmr15a-charge-focused-fix-gates): start the butt scan at capEnd, not t=4.
  // The pommel ball itself is >30px wide at t~14 on focused cell0, so the original scan
  // broke inside the movable cap segment and falsely reported 0 availability despite a
  // clean shaft run to t~68 (probe-butt-run.mjs). The cap (t<capEnd) is the segment being
  // moved, so cleanliness only matters from capEnd to the rear grip.
  // Combo extension (probe-butt-run.py): at combo scale 1.4903 the pommel ball is still
  // 31-33px wide at t=16-20, so a FIXED capEnd=16 again breaks inside the ball and falsely
  // reports 0 (cell0 clean from t~24 for ~104px). Search the actual cap end = first clean
  // t in [8,64]; none found (shaft runs within the +-56 perp window of skirt/leg on
  // cells 3/4/5/8) means genuinely no method-clean butt run.
  let capEndScan = null
  for (let t = 8; t <= 64; t += 2) { if (shaftOnly(t)) { capEndScan = t; break } }
  let buttCleanEnd = capEndScan ?? 0
  if (capEndScan !== null) for (let t = capEndScan; t < rearGripT[0]; t += 2) { if (shaftOnly(t)) buttCleanEnd = t; else break }
  // longest contiguous clean shaft run strictly between front grip end and socket
  let bladeRun = null, runStart = null
  for (let t = Math.ceil(frontGripT[1]); t <= Math.floor(socketT); t += 2) {
    if (shaftOnly(t)) { if (runStart === null) runStart = t }
    else if (runStart !== null) { const r = [runStart, t - 2]; if (!bladeRun || r[1] - r[0] > bladeRun[1] - bladeRun[0]) bladeRun = r; runStart = null }
  }
  if (runStart !== null) { const r = [runStart, Math.floor(socketT)]; if (!bladeRun || r[1] - r[0] > bladeRun[1] - bladeRun[0]) bladeRun = r }
  const bladeCleanStart = bladeRun ? bladeRun[0] : Math.ceil(socketT)
  const capEnd = capEndScan ?? 16
  const buttAvail = capEndScan === null ? 0 : Math.max(0, buttCleanEnd - capEnd)
  const bladeAvail = bladeRun ? Math.max(0, bladeRun[1] - bladeRun[0] - 8) : 0
  let buttRemove = Math.min(remove, buttAvail)
  let bladeRemove = Math.min(remove - buttRemove, bladeAvail)
  const feasibility = { capStartT: capEndScan, buttCleanEndT: buttCleanEnd, bladeRunT: bladeRun, bladeCleanStartT: bladeCleanStart, socketTReg: round2(socketT), buttAvailPx: buttAvail, bladeAvailPx: bladeAvail, removeToTarget132Px: remove, removeToBandHiPx: Math.ceil(m.pxLen - FROZEN.bandU[1] / U_PER_PX), totalAvailPx: buttAvail + bladeAvail, reachesBand: buttAvail + bladeAvail >= Math.ceil(m.pxLen - FROZEN.bandU[1] / U_PER_PX), reachesTarget: buttAvail + bladeAvail >= remove }
  const out = new PNG({ width: W, height: H }); png.data.copy(out.data)
  // collect ops
  const tOf = (x, y) => (x - butt[0]) * ux + (y - butt[1]) * uy
  const pOf = (x, y) => (x - butt[0]) * vx + (y - butt[1]) * vy
  const ops = []
  let bCut = null, dCut = null
  if (buttRemove > 0) {
    const t0 = capEnd, t1 = capEnd + buttRemove; bCut = [t0, t1]
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) << 2; if (png.data[i + 3] < 1) continue
      const t = tOf(x, y), p = Math.abs(pOf(x, y))
      if (p <= 20 && t < t1) ops.push({ x, y, t, kind: t < t0 ? 'buttSeg' : 'drop', data: [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]] })
    }
  }
  if (bladeRemove > 0) {
    const t3 = bladeRun[1] - 4, t2 = t3 - bladeRemove; dCut = [t2, t3]
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) << 2; if (png.data[i + 3] < 1) continue
      const t = tOf(x, y)
      if (t >= t2) ops.push({ x, y, t, kind: t >= t3 ? 'bladeSeg' : 'drop', data: [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]] })
    }
  }
  // shaft width at joints (alpha run across perp at given t)
  const widthAt = (t) => { let lo = 1e9, hi = -1e9; for (let p = -56; p <= 56; p++) { const x = Math.round(butt[0] + ux * t + vx * p), y = Math.round(butt[1] + uy * t + vy * p); if (x < 0 || y < 0 || x >= W || y >= H) continue; if (png.data[((y * W + x) << 2) + 3] >= 16) { if (p < lo) lo = p; if (p > hi) hi = p } } return hi >= lo ? [lo, hi] : null }
  const seam = {}
  if (bCut) seam.buttJoint = { cutT: bCut, widthBeforeCut: widthAt(bCut[0] - 3), widthAfterJoint: widthAt(bCut[1] + 3) }
  if (dCut) seam.bladeJoint = { cutT: dCut, widthBeforeJoint: widthAt(dCut[0] - 3), widthAfterCut: widthAt(dCut[1] + 3) }
  // clear all op pixels, then paste shifted segments (integer axis shift)
  const shB = bCut ? [Math.round(ux * buttRemove), Math.round(uy * buttRemove)] : [0, 0]
  const shD = dCut ? [Math.round(-ux * bladeRemove), Math.round(-uy * bladeRemove)] : [0, 0]
  for (const o of ops) { const i = (o.y * W + o.x) << 2; out.data[i] = out.data[i + 1] = out.data[i + 2] = out.data[i + 3] = 0 }
  let moved = 0
  for (const o of ops) {
    if (o.kind === 'drop') continue
    const sh = o.kind === 'buttSeg' ? shB : shD
    const nx = o.x + sh[0], ny = o.y + sh[1]
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
    const i = (ny * W + nx) << 2
    out.data[i] = o.data[0]; out.data[i + 1] = o.data[1]; out.data[i + 2] = o.data[2]; out.data[i + 3] = o.data[3]; moved++
  }
  // outside-weapon-region proof: region = |perp|<=20 & t<rearGripT[0] (butt zone) union t>=frontGripT[1] (distal zone)
  const hB = createHash('sha256'), hA = createHash('sha256'); let changedOutside = 0, changedInside = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) << 2
    const t = tOf(x, y), p = Math.abs(pOf(x, y))
    const inRegion = (p <= 20 && t < rearGripT[0]) || t >= frontGripT[1]
    const same = png.data[i] === out.data[i] && png.data[i + 1] === out.data[i + 1] && png.data[i + 2] === out.data[i + 2] && png.data[i + 3] === out.data[i + 3]
    if (!inRegion) { hB.update(png.data.subarray(i, i + 4)); hA.update(out.data.subarray(i, i + 4)); if (!same) changedOutside++ } else if (!same) changedInside++
  }
  return { png: out, feasibility, removeRequestedPx: remove, buttRemovePx: buttRemove, bladeRemovePx: bladeRemove, bCut, dCut, seam, movedPx: moved, outsideProof: { hashBefore: hB.digest('hex'), hashAfter: hA.digest('hex'), changedOutside, changedInside } }
}

// ---- build all 9 cells (keeps 0-4 + spares 5-8 gated for substitution) ----
const results = []
for (const i of ALL) {
  const reg = register(i)
  const regBuf = PNG.sync.write(reg.png)
  writeFileSync(G + `cells-registered/${NAMES[i]}-registered.png`, regBuf)
  const buttHint = toReg(LM[i].butt, reg), tipHint = toReg(LM[i].tip, reg)
  const m0 = measureReg(reg.png, buttHint, tipHint)
  const lmReg = { rearGripT: LM[i].rearGripT.map(v => v * S), frontGripT: LM[i].frontGripT.map(v => v * S), socketT: LM[i].socketT * S }
  let rt = null, m1 = null, retBuf = null
  if ((m0.u > FROZEN.bandU[1] || m0.u < FROZEN.bandU[0]) && BUTT_VISIBLE[i]) {
    rt = m0.u > FROZEN.bandU[1] ? retouch(reg.png, m0, lmReg) : null
    if (rt) {
      retBuf = PNG.sync.write(rt.png)
      writeFileSync(G + `cells-registered/${NAMES[i]}-retouched.png`, retBuf)
      // hint correction: retouch shifts butt/tip along the shaft axis by the applied
      // removals (can exceed measureReg search radii when the outlier is huge)
      const axLen = Math.hypot(m0.tip[0] - m0.butt[0], m0.tip[1] - m0.butt[1])
      const ax = [(m0.tip[0] - m0.butt[0]) / axLen, (m0.tip[1] - m0.butt[1]) / axLen]
      const buttHint1 = [buttHint[0] + ax[0] * rt.buttRemovePx, buttHint[1] + ax[1] * rt.buttRemovePx]
      const tipHint1 = [tipHint[0] - ax[0] * rt.bladeRemovePx, tipHint[1] - ax[1] * rt.bladeRemovePx]
      m1 = measureReg(rt.png, buttHint1, tipHint1)
    }
  }
  const r = {
    cell: i, name: NAMES[i], role: KEEP.includes(i) ? 'keep' : 'spare', buttCapVisible: BUTT_VISIBLE[i], compId: LM[i].compId, compPx: LM[i].px, nativeBounds: LM[i].bounds,
    nativeLandmarks: { butt: LM[i].butt.map(round2), tip: LM[i].tip, crownY: LM[i].crown, soleY: LM[i].sole, helmetWNative: LM[i].helmetW, rearGripTNative: LM[i].rearGripT.map(round2), frontGripTNative: LM[i].frontGripT.map(round2) },
    registration: { scale: S, dx: reg.dx, dy: reg.dy, canvas: [CANVAS_W, CANVAS_H] },
    registeredHash: sha(regBuf), registeredMeasure: { ...m0, u: round2(m0.u), pxLen: round2(m0.pxLen), angDeg: round2(m0.angDeg), butt: m0.butt.map(round2), groundErrU: round2(m0.groundErrU) },
    retouch: rt ? { feasibility: rt.feasibility, removeRequestedPx: rt.removeRequestedPx, buttRemovePx: rt.buttRemovePx, bladeRemovePx: rt.bladeRemovePx, bCut: rt.bCut, dCut: rt.dCut, seam: rt.seam, movedPx: rt.movedPx, outsideProof: rt.outsideProof, retouchedHash: sha(retBuf), retouchedMeasure: { ...m1, u: round2(m1.u), pxLen: round2(m1.pxLen), angDeg: round2(m1.angDeg), butt: m1.butt.map(round2), groundErrU: round2(m1.groundErrU) } } : null,
  }
  r.finalMeasure = r.retouch ? r.retouch.retouchedMeasure : r.registeredMeasure
  r.finalHash = r.retouch ? r.retouch.retouchedHash : r.registeredHash
  r.finalFile = r.retouch ? `${NAMES[i]}-retouched.png` : `${NAMES[i]}-registered.png`
  results.push(r)
  console.log(NAMES[i], 'scale', S.toFixed(4), 'regU', r.registeredMeasure.u, 'ang', r.registeredMeasure.angDeg, 'finalU', r.finalMeasure.u, 'boots', JSON.stringify(r.finalMeasure.boots), 'bounds', JSON.stringify(r.finalMeasure.bounds))
}
const spareResults = results.filter(r => r.role === 'spare')

// ---- marked + zooms + contact/compare sheets (inspection evidence only, not art) ----
const BG = [48, 44, 40]
function onBg(png) {
  const out = new PNG({ width: png.width, height: png.height })
  for (let i = 0; i < png.data.length; i += 4) { const a = png.data[i + 3] / 255; out.data[i] = Math.round(png.data[i] * a + BG[0] * (1 - a)); out.data[i + 1] = Math.round(png.data[i + 1] * a + BG[1] * (1 - a)); out.data[i + 2] = Math.round(png.data[i + 2] * a + BG[2] * (1 - a)); out.data[i + 3] = 255 }
  return out
}
function setPx(png, x, y, c) { if (x < 0 || y < 0 || x >= png.width || y >= png.height) return; const i = (y * png.width + x) << 2; png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = 255 }
function cross(png, cx, cy, c) { for (let d = -11; d <= 11; d++) for (let w = -1; w <= 1; w++) { setPx(png, Math.round(cx) + d, Math.round(cy) + w, c); setPx(png, Math.round(cx) + w, Math.round(cy) + d, c) } }
function cropScale(png, x0, y0, x1, y1, k) {
  x0 = Math.max(0, Math.round(x0)); y0 = Math.max(0, Math.round(y0)); x1 = Math.min(png.width - 1, Math.round(x1)); y1 = Math.min(png.height - 1, Math.round(y1))
  const w = (x1 - x0 + 1) * k, h = (y1 - y0 + 1) * k, out = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const si = (((y0 + Math.floor(y / k)) * png.width) + x0 + Math.floor(x / k)) << 2, di = (y * w + x) << 2; out.data[di] = png.data[si]; out.data[di + 1] = png.data[si + 1]; out.data[di + 2] = png.data[si + 2]; out.data[di + 3] = png.data[si + 3] }
  return out
}
const finals = []
for (const r of results) {
  const final = PNG.sync.read(readFileSync(G + 'cells-registered/' + r.finalFile))
  finals.push(final)
  r.bodyNativePx = r.nativeLandmarks.soleY - r.nativeLandmarks.crownY
  r.bodyRegPx = round2(r.bodyNativePx * S)
  const marked = onBg(final), fm = r.finalMeasure
  for (let x = 0; x < marked.width; x++) { setPx(marked, x, GROUND_Y, [255, 0, 255]); setPx(marked, x, GROUND_Y + 1, [255, 0, 255]) }
  cross(marked, fm.butt[0], fm.butt[1], [255, 64, 64])
  cross(marked, fm.tip[0], fm.tip[1], [0, 255, 255])
  writeFileSync(G + `cells-registered/${r.name}-marked.png`, PNG.sync.write(marked))
  const bgr = onBg(final)
  const headCX = (BOX[r.cell].headX[0] + BOX[r.cell].headX[1]) / 2 * S + r.registration.dx, headCY = (LM[r.cell].crown + 42) * S + r.registration.dy
  writeFileSync(G + `cells-registered/${r.name}-head-zoom.png`, PNG.sync.write(cropScale(bgr, headCX - 80, headCY - 80, headCX + 80, headCY + 80, 3)))
  writeFileSync(G + `cells-registered/${r.name}-tip-4x.png`, PNG.sync.write(cropScale(bgr, fm.tip[0] - 70, fm.tip[1] - 70, fm.tip[0] + 70, fm.tip[1] + 70, 4)))
  writeFileSync(G + `cells-registered/${r.name}-soles-zoom.png`, PNG.sync.write(cropScale(bgr, fm.bounds.xmin - 8, GROUND_Y - 60, fm.bounds.xmax + 8, CANVAS_H - 1, 2)))
  r.evidence = { marked: `${r.name}-marked.png`, headZoom: `${r.name}-head-zoom.png`, tip4x: `${r.name}-tip-4x.png`, solesZoom: `${r.name}-soles-zoom.png` }
}
function contact(rows, file) {
  const cw = CANVAS_W / 2, ch = CANVAS_H / 2, out = new PNG({ width: cw * 5, height: ch * rows.length })
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = BG[0]; out.data[i + 1] = BG[1]; out.data[i + 2] = BG[2]; out.data[i + 3] = 255 }
  rows.forEach((row, ri) => row.forEach((png, ci) => {
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const si = (((y * 2) * png.width) + x * 2) << 2, a = png.data[si + 3] / 255; if (a === 0) continue
      const di = (((ri * ch + y) * out.width) + ci * cw + x) << 2
      out.data[di] = Math.round(png.data[si] * a + out.data[di] * (1 - a)); out.data[di + 1] = Math.round(png.data[si + 1] * a + out.data[di + 1] * (1 - a)); out.data[di + 2] = Math.round(png.data[si + 2] * a + out.data[di + 2] * (1 - a))
    }
  }))
  writeFileSync(G + file, PNG.sync.write(out))
}
contact([finals.slice(0, 5)], 'contact-keeps-sequence.png')
contact([finals.slice(5)], 'contact-spares.png')

// ---- direction continuity across the keep sequence (angles recorded raw per pose;
// consecutive direction steps must stay <=60deg per campaign acceptance) ----
const keepResults = results.filter(r => r.role === 'keep')
const directionSteps = []
for (let k = 1; k < keepResults.length; k++) directionSteps.push({ from: keepResults[k - 1].name, to: keepResults[k].name, fromAngDeg: keepResults[k - 1].finalMeasure.angDeg, toAngDeg: keepResults[k].finalMeasure.angDeg, stepDeg: round2(Math.abs(keepResults[k].finalMeasure.angDeg - keepResults[k - 1].finalMeasure.angDeg)), passLe60: Math.abs(keepResults[k].finalMeasure.angDeg - keepResults[k - 1].finalMeasure.angDeg) <= 60 })
const finalUs = keepResults.map(r => r.finalMeasure.u)
const lengthSpread = { finalUs, spreadPct: round2((Math.max(...finalUs) - Math.min(...finalUs)) / (finalUs.reduce((s, v) => s + v, 0) / finalUs.length) * 100) }
writeFileSync(G + 'measure.json', JSON.stringify({ work: 'cmr15a-heavy-focused-fix-gates', canvas: [CANVAS_W, CANVAS_H], groundYCanvas: GROUND_Y, padTop: PAD_TOP, sheetSha256: sheetSha, sheetSize: [SW, SH], components: big.length, sheetScale: S, scaleCell: NAMES[SCALE_CELL], scaleBodyNativePx: bodyNative, frozen: FROZEN, targetU: TARGET_U, ledgerVerified: ledgerState, keeps: keepResults, spares: spareResults, all: results, directionSteps, lengthSpreadKeeps: lengthSpread }, null, 2) + '\n')
console.log('directionSteps', JSON.stringify(directionSteps))
console.log('lengthSpreadKeeps', JSON.stringify(lengthSpread))
console.log('DONE measure stage')
