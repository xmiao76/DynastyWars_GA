// CMR-15A charge SPARES assessment (work cmr15a-charge-spares-assessment). Zero generation.
// Registers spare cells 5-8 of candidate-raw.png (11080736...) at the SAME sheet scale/ground
// as the keeps gate (07-charge/gate/build.mjs: ONE scale S from cell0 guard crown->sole
// 339 native px -> frozen 459px, sole->groundY500, canvas 768x512), measures fresh raster
// weapon/body/ground/seam/head landmarks vs the frozen band, and applies deterministic shaft
// retouch (same pommel+blade clean-run method) ONLY where measurably curable (clean-shaft
// availability >= removal needed to reach band-hi); non-curable cells get an in-memory
// max-shortening proof measure only (nothing saved/banked). Deterministic rerun = identical hashes.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const DIR = 'art/motion/xuchu/closeout-campaign/07-charge/'
const G = DIR + 'spares/'
mkdirSync(G + 'cells', { recursive: true })
const sha = (b) => createHash('sha256').update(b).digest('hex')
const U_PER_PX = 124 / 477
const FROZEN = { bodyPx: 459, groundY: 500, weaponU: 130.79017343848048, bandU: [124.40626991803302, 137.50166675151021], angleDeg: -26.31040494480514, weaponPxAt512: 503.12026395286443 }
const TARGET_U = 132, TARGET_PX = TARGET_U / U_PER_PX
const CANVAS_W = 768, CANVAS_H = 512
const round2 = (v) => Math.round(v * 100) / 100

const sheetBuf = readFileSync(DIR + 'candidate-raw.png')
const sheetSha = sha(sheetBuf)
if (!sheetSha.startsWith('11080736')) throw new Error('sheet hash mismatch ' + sheetSha)
const sheet = PNG.sync.read(sheetBuf)
const SW = sheet.width, SH = sheet.height
const A = (x, y) => sheet.data[((y * SW + x) << 2) + 3]

// ---- ledger verify (no writes) ----
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, xuchuCharge: ledger.fighters.xuchu.sheetCandidates?.charge ?? null, globalUsed, expected: 'Xu Chu 14 (charge 1) / global 181', matches: ledger.fighters.xuchu.used === 14 && globalUsed === 181 }
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
const NAMES = ['cell0-guard', 'cell1-crouch-coil-windup', 'cell2-launch', 'cell3-crushing-dash', 'cell4-brake', 'cell5-spare-dash-alt', 'cell6-spare-brake-alt', 'cell7-spare-brake-alt2', 'cell8-spare-guard-alt']
const KEEP = [5, 6, 7, 8] // spares under assessment; cell0 landmarks also computed (sheet-scale source)

// landmark boxes in SHEET coords, chosen from grid views (recorded constants)
const BOX = {
  0: { butt: [70, 195, 112, 235], tip: [400, 40, 465, 125], crownX: [208, 262], rearGrip: [132, 172, 178, 212], frontGrip: [268, 128, 312, 168], headX: [205, 278], socketPt: [348, 118] },
  1: { butt: [550, 235, 602, 278], tip: [935, 118, 1010, 215], crownX: [758, 822], rearGrip: [628, 218, 672, 258], frontGrip: [778, 208, 826, 252], headX: [755, 828], socketPt: [865, 205] },
  2: { butt: [1060, 208, 1122, 252], tip: [1445, 78, 1526, 172], crownX: [1238, 1312], rearGrip: [1178, 188, 1224, 228], frontGrip: [1318, 162, 1368, 208], headX: [1235, 1320], socketPt: [1398, 158] },
  3: { butt: [78, 498, 132, 548], tip: [515, 418, 588, 502], crownX: [298, 358], rearGrip: [240, 492, 286, 532], frontGrip: [398, 478, 446, 520], headX: [295, 362], socketPt: [464, 490] },
  4: { butt: [614, 548, 668, 598], tip: [945, 358, 1014, 452], crownX: [698, 762], rearGrip: [678, 498, 724, 540], frontGrip: [812, 442, 858, 486], headX: [695, 768], socketPt: [880, 448] },
  // spare boxes read from gate/cells-native/cell{5..8}-*-grid.png (sheet coords, 50px grid)
  5: { butt: [1060, 530, 1122, 575], tip: [1448, 398, 1526, 502], crownX: [1278, 1352], rearGrip: [1198, 498, 1262, 545], frontGrip: [1308, 472, 1378, 520], headX: [1272, 1358], socketPt: [1405, 482] },
  6: { butt: [58, 848, 122, 896], tip: [498, 718, 580, 832], crownX: [298, 368], rearGrip: [232, 820, 292, 868], frontGrip: [358, 798, 418, 848], headX: [292, 372], socketPt: [438, 820] },
  7: { butt: [594, 858, 656, 906], tip: [942, 692, 1020, 800], crownX: [718, 792], rearGrip: [668, 822, 728, 872], frontGrip: [792, 772, 852, 822], headX: [712, 796], socketPt: [876, 776] },
  8: { butt: [1088, 842, 1152, 892], tip: [1408, 662, 1492, 776], crownX: [1212, 1288], rearGrip: [1162, 812, 1222, 862], frontGrip: [1288, 762, 1348, 812], headX: [1208, 1292], socketPt: [1366, 770] },
}
function boxAlphaPts(box, id) {
  const pts = []
  for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) if (lab[y * SW + x] === id) pts.push([x, y])
  return pts
}
function landmarks(cellIdx) {
  const c = big[cellIdx], b = BOX[cellIdx]
  const bp = boxAlphaPts(b.butt, c.id)
  const minX = Math.min(...bp.map(p => p[0]))
  const band = bp.filter(p => p[0] < minX + 6)
  const butt = [band.reduce((s, p) => s + p[0], 0) / band.length, band.reduce((s, p) => s + p[1], 0) / band.length]
  const tp = boxAlphaPts(b.tip, c.id)
  const tc = [tp.reduce((s, p) => s + p[0], 0) / tp.length, tp.reduce((s, p) => s + p[1], 0) / tp.length]
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
const LM = {}; for (const i of [0, ...KEEP]) LM[i] = landmarks(i)
// sheet scale from guard
const bodyNative = LM[0].sole - LM[0].crown
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
  const dy = Math.round(FROZEN.groundY - lm.sole * S)
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
  const bp = near(buttHint, 46); const minX = Math.min(...bp.map(p => p[0]))
  const band = bp.filter(p => p[0] < minX + 7)
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
  return { bounds: { xmin, ymin, xmax, ymax }, greenPx: green, edge, butt, tip, pxLen, u: pxLen * U_PER_PX, angDeg, boots, groundErrU: Math.abs(ymax - FROZEN.groundY) * U_PER_PX }
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
  let buttCleanEnd = 0
  for (let t = 4; t < rearGripT[0]; t += 2) { if (shaftOnly(t)) buttCleanEnd = t; else break }
  // longest contiguous clean shaft run strictly between front grip end and socket
  let bladeRun = null, runStart = null
  for (let t = Math.ceil(frontGripT[1]); t <= Math.floor(socketT); t += 2) {
    if (shaftOnly(t)) { if (runStart === null) runStart = t }
    else if (runStart !== null) { const r = [runStart, t - 2]; if (!bladeRun || r[1] - r[0] > bladeRun[1] - bladeRun[0]) bladeRun = r; runStart = null }
  }
  if (runStart !== null) { const r = [runStart, Math.floor(socketT)]; if (!bladeRun || r[1] - r[0] > bladeRun[1] - bladeRun[0]) bladeRun = r }
  const bladeCleanStart = bladeRun ? bladeRun[0] : Math.ceil(socketT)
  const capEnd = 16
  const buttAvail = Math.max(0, buttCleanEnd - capEnd)
  const bladeAvail = bladeRun ? Math.max(0, bladeRun[1] - bladeRun[0] - 8) : 0
  let buttRemove = Math.min(remove, buttAvail)
  let bladeRemove = Math.min(remove - buttRemove, bladeAvail)
  const feasibility = { buttCleanEndT: buttCleanEnd, bladeRunT: bladeRun, bladeCleanStartT: bladeCleanStart, socketTReg: round2(socketT), buttAvailPx: buttAvail, bladeAvailPx: bladeAvail, removeToTarget132Px: remove, removeToBandHiPx: Math.ceil(m.pxLen - FROZEN.bandU[1] / U_PER_PX), totalAvailPx: buttAvail + bladeAvail, reachesBand: buttAvail + bladeAvail >= Math.ceil(m.pxLen - FROZEN.bandU[1] / U_PER_PX), reachesTarget: buttAvail + bladeAvail >= remove }
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

// ---- marked overlay (butt/tip/axis/ground) for visual landmark verification ----
function marked(png, m) {
  const out = new PNG({ width: png.width, height: png.height }); png.data.copy(out.data)
  const put = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= out.width || y >= out.height) return; const i = ((y * out.width + x) << 2); out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = 255 }
  for (let x = 0; x < out.width; x++) put(x, FROZEN.groundY, 0, 255, 255)
  const steps = Math.ceil(Math.hypot(m.tip[0] - m.butt[0], m.tip[1] - m.butt[1]))
  for (let s = 0; s <= steps; s++) put(Math.round(m.butt[0] + (m.tip[0] - m.butt[0]) * s / steps), Math.round(m.butt[1] + (m.tip[1] - m.butt[1]) * s / steps), 255, 0, 255)
  for (const [cx, cy, col] of [[m.butt[0], m.butt[1], [255, 0, 0]], [m.tip[0], m.tip[1], [255, 255, 0]]])
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (Math.abs(dx) + Math.abs(dy) <= 6) put(Math.round(cx + dx), Math.round(cy + dy), ...col)
  return out
}

// ---- build all spares ----
const results = []
const contactCells = []
for (const i of KEEP) {
  const reg = register(i)
  const regBuf = PNG.sync.write(reg.png)
  writeFileSync(G + `cells/${NAMES[i]}-registered.png`, regBuf)
  const buttHint = toReg(LM[i].butt, reg), tipHint = toReg(LM[i].tip, reg)
  const m0 = measureReg(reg.png, buttHint, tipHint)
  writeFileSync(G + `cells/${NAMES[i]}-marked.png`, PNG.sync.write(marked(reg.png, m0)))
  const lmReg = { rearGripT: LM[i].rearGripT.map(v => v * S), frontGripT: LM[i].frontGripT.map(v => v * S), socketT: LM[i].socketT * S }
  // retouch ONLY where measurably curable; otherwise in-memory max-shortening proof only
  let rt = null, mProof = null, applied = false, retBuf = null
  if (m0.u > FROZEN.bandU[1]) {
    rt = retouch(reg.png, m0, lmReg)
    if (rt) { mProof = measureReg(rt.png, buttHint, tipHint); if (rt.feasibility.reachesBand) { applied = true; retBuf = PNG.sync.write(rt.png); writeFileSync(G + `cells/${NAMES[i]}-retouched.png`, retBuf); writeFileSync(G + `cells/${NAMES[i]}-retouched-marked.png`, PNG.sync.write(marked(rt.png, mProof))) } }
  }
  const measObj = (m) => ({ ...m, u: round2(m.u), pxLen: round2(m.pxLen), angDeg: round2(m.angDeg), butt: m.butt.map(round2), groundErrU: round2(m.groundErrU) })
  const r = {
    cell: i, name: NAMES[i], compId: LM[i].compId, compPx: LM[i].px, nativeBounds: LM[i].bounds,
    nativeLandmarks: { butt: LM[i].butt.map(round2), tip: LM[i].tip, crownY: LM[i].crown, soleY: LM[i].sole, helmetWNative: LM[i].helmetW, rearGripTNative: LM[i].rearGripT.map(round2), frontGripTNative: LM[i].frontGripT.map(round2) },
    registration: { scale: S, dx: reg.dx, dy: reg.dy, canvas: [CANVAS_W, CANVAS_H] },
    bodyRegistered: { crownToSolePx: round2((LM[i].sole - LM[i].crown) * S), helmetWPx: round2(LM[i].helmetW * S), note: 'crown->sole at sheet scale; crouched/leaning charge poses are legitimately <459px (keeps native diffs 252-339px = 341-459px registered); ground err is the binding scale/ground gate' },
    registeredHash: sha(regBuf),
    registeredMeasure: measObj(m0),
    angleDeltas: { rawDeg: round2(m0.angDeg), vsFrozenWalkDeg: round2(m0.angDeg - FROZEN.angleDeg), note: 'charge angles recorded raw per keeps anglePolicy; frozen walk corridor not applied across charge poses' },
    retouch: rt ? { curable: rt.feasibility.reachesBand, appliedAndSaved: applied, feasibility: rt.feasibility, removeRequestedPx: rt.removeRequestedPx, buttRemovePx: rt.buttRemovePx, bladeRemovePx: rt.bladeRemovePx, bCut: rt.bCut, dCut: rt.dCut, seam: rt.seam, movedPx: rt.movedPx, outsideProof: rt.outsideProof, retouchedHash: applied ? sha(retBuf) : null, maxShortenedProofMeasure: measObj(mProof), proofNote: applied ? 'retouched cell saved; proof measure = retouched measure' : 'NOT curable: max clean-shaft shortening measured in-memory only; no retouched cell saved, nothing banked' } : null,
  }
  r.finalMeasure = applied ? r.retouch.maxShortenedProofMeasure : r.registeredMeasure
  r.finalHash = applied ? r.retouch.retouchedHash : r.registeredHash
  r.finalFile = applied ? `${NAMES[i]}-retouched.png` : `${NAMES[i]}-registered.png`
  r.lengthGate = (applied ? r.retouch.maxShortenedProofMeasure.u : (r.retouch ? r.retouch.maxShortenedProofMeasure.u : m0.u)) >= FROZEN.bandU[0] && (applied ? r.retouch.maxShortenedProofMeasure.u : (r.retouch ? r.retouch.maxShortenedProofMeasure.u : m0.u)) <= FROZEN.bandU[1] ? 'PASS' : 'FAIL'
  r.lengthGateBasisU = r.retouch ? r.retouch.maxShortenedProofMeasure.u : r.registeredMeasure.u
  results.push(r)
  contactCells.push(applied ? rt.png : reg.png)
  console.log(NAMES[i], 'regU', r.registeredMeasure.u, 'ang', r.registeredMeasure.angDeg, 'curable', rt ? rt.feasibility.reachesBand : '-', 'proofU', r.lengthGateBasisU, 'boots', JSON.stringify(r.finalMeasure.boots), 'bounds', JSON.stringify(r.finalMeasure.bounds), 'bodyPx', r.bodyRegistered.crownToSolePx, 'helmetPx', r.bodyRegistered.helmetWPx)
}
// contact sheet: cell0 keep retouched (existing gate output) + 4 spare finals, 384x256 thumbs in a row over dark grey
{
  const keep0 = PNG.sync.read(readFileSync(DIR + 'gate/cells-registered/cell0-guard-retouched.png'))
  const all = [keep0, ...contactCells]
  const TW = 384, TH = 256, sheetOut = new PNG({ width: TW * 5, height: TH })
  for (let i = 0; i < sheetOut.data.length; i += 4) { sheetOut.data[i] = 48; sheetOut.data[i + 1] = 44; sheetOut.data[i + 2] = 40; sheetOut.data[i + 3] = 255 }
  all.forEach((png, ci) => { for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const sx = Math.min(png.width - 1, x * 2), sy = Math.min(png.height - 1, y * 2), si = ((sy * png.width + sx) << 2), di = ((y * sheetOut.width + ci * TW + x) << 2), a = png.data[si + 3] / 255; if (a > 0) { sheetOut.data[di] = Math.round(png.data[si] * a + sheetOut.data[di] * (1 - a)); sheetOut.data[di + 1] = Math.round(png.data[si + 1] * a + sheetOut.data[di + 1] * (1 - a)); sheetOut.data[di + 2] = Math.round(png.data[si + 2] * a + sheetOut.data[di + 2] * (1 - a)) } } })
  writeFileSync(G + 'contact-cell0-then-spares5-8.png', PNG.sync.write(sheetOut))
}
writeFileSync(G + 'spares-measure.json', JSON.stringify({ work: 'cmr15a-charge-spares-assessment', sheetSha256: sheetSha, sheetSize: [SW, SH], components: big.length, sheetScale: S, guardBodyNativePx: bodyNative, frozen: FROZEN, targetU: TARGET_U, bandPxAtRegisteredScale: [round2(FROZEN.bandU[0] / U_PER_PX), round2(FROZEN.bandU[1] / U_PER_PX)], ledgerVerified: ledgerState, spares: results }, null, 2) + '\n')
console.log('DONE spares measure stage')
