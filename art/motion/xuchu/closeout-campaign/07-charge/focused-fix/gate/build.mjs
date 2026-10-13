// CMR-15A charge FOCUSED-FIX gate (work cmr15a-charge-focused-fix-gates). Zero generation.
// Identical method to 07-charge/gate/build.mjs (copied + adapted): component-extracts the
// focused-fix candidate-raw.png (4791a19e...), registers the 5 keeps corresponding to the
// original keeps 0-4 with ONE uniform sheet scale from cell0 guard crown->sole = 459px,
// ground->500, canvas 768x512; measures fresh raster weapon/body/ground/seam landmarks vs
// the frozen band; attempts deterministic shaft retouch FIRST for any OUT_HIGH length
// outlier, re-measures; emits final cells + marked (butt/tip/ground) + head/tip/soles
// zooms + sequence/compare contact sheets for personal inspection; records native
// pose/layout continuity deltas vs the original gate measure.json. Banking is decided
// in gate-verdict.mjs. Deterministic: rerun reproduces byte-identical outputs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const DIR = 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/'
const G = DIR + 'gate/'
const ORIG_G = 'art/motion/xuchu/closeout-campaign/07-charge/gate/'
mkdirSync(G + 'cells-registered', { recursive: true })
const sha = (b) => createHash('sha256').update(b).digest('hex')
const U_PER_PX = 124 / 477
const FROZEN = { bodyPx: 459, groundY: 500, weaponU: 130.79017343848048, bandU: [124.40626991803302, 137.50166675151021], angleDeg: -26.31040494480514, weaponPxAt512: 503.12026395286443 }
const TARGET_U = 132, TARGET_PX = TARGET_U / U_PER_PX
const CANVAS_W = 768, CANVAS_H = 512
const round2 = (v) => Math.round(v * 100) / 100

const sheetBuf = readFileSync(DIR + 'candidate-raw.png')
const sheetSha = sha(sheetBuf)
if (!sheetSha.startsWith('4791a19e')) throw new Error('sheet hash mismatch ' + sheetSha)
const sheet = PNG.sync.read(sheetBuf)
const SW = sheet.width, SH = sheet.height
const A = (x, y) => sheet.data[((y * SW + x) << 2) + 3]

// ---- ledger verify (no writes) ----
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, xuchuCharge: ledger.fighters.xuchu.sheetCandidates?.charge ?? null, globalUsed, expected: 'Xu Chu 15 (charge 2) / global 182', matches: ledger.fighters.xuchu.used === 15 && globalUsed === 182 }
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
const KEEP = [0, 1, 2, 3, 4]

// landmark boxes in SHEET coords, chosen from the focused-fix grid views
// (gate/cells-native/*-grid.png, recorded constants; tips moved inward vs original)
const BOX = {
  0: { butt: [70, 195, 112, 235], tip: [400, 40, 475, 125], crownX: [208, 262], rearGrip: [132, 172, 178, 212], frontGrip: [318, 122, 365, 170], headX: [205, 278], socketPt: [385, 120] },
  1: { butt: [590, 225, 645, 270], tip: [880, 110, 970, 210], crownX: [750, 820], rearGrip: [660, 205, 725, 260], frontGrip: [790, 190, 850, 250], headX: [745, 825], socketPt: [855, 195] },
  2: { butt: [1090, 195, 1145, 240], tip: [1380, 75, 1475, 175], crownX: [1240, 1315], rearGrip: [1170, 180, 1235, 235], frontGrip: [1305, 155, 1370, 215], headX: [1235, 1320], socketPt: [1375, 160] },
  3: { butt: [145, 495, 200, 540], tip: [430, 405, 522, 500], crownX: [298, 365], rearGrip: [255, 480, 315, 535], frontGrip: [390, 465, 450, 525], headX: [295, 368], socketPt: [450, 485] },
  4: { butt: [640, 535, 695, 580], tip: [870, 380, 962, 470], crownX: [730, 800], rearGrip: [700, 490, 765, 545], frontGrip: [815, 445, 880, 505], headX: [725, 805], socketPt: [885, 455] },
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
const LM = {}; for (const i of KEEP) LM[i] = landmarks(i)
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
  // Correction (cmr15a-charge-focused-fix-gates): start the butt scan at capEnd, not t=4.
  // The pommel ball itself is >30px wide at t~14 on focused cell0, so the original scan
  // broke inside the movable cap segment and falsely reported 0 availability despite a
  // clean shaft run to t~68 (probe-butt-run.mjs). The cap (t<capEnd) is the segment being
  // moved, so cleanliness only matters from capEnd to the rear grip.
  const capEndScan = 16
  let buttCleanEnd = capEndScan
  for (let t = capEndScan; t < rearGripT[0]; t += 2) { if (shaftOnly(t)) buttCleanEnd = t; else break }
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

// ---- build all keeps ----
const results = []
for (const i of KEEP) {
  const reg = register(i)
  const regBuf = PNG.sync.write(reg.png)
  writeFileSync(G + `cells-registered/${NAMES[i]}-registered.png`, regBuf)
  const buttHint = toReg(LM[i].butt, reg), tipHint = toReg(LM[i].tip, reg)
  const m0 = measureReg(reg.png, buttHint, tipHint)
  const lmReg = { rearGripT: LM[i].rearGripT.map(v => v * S), frontGripT: LM[i].frontGripT.map(v => v * S), socketT: LM[i].socketT * S }
  let rt = null, m1 = null, retBuf = null
  if (m0.u > FROZEN.bandU[1] || m0.u < FROZEN.bandU[0]) {
    rt = m0.u > FROZEN.bandU[1] ? retouch(reg.png, m0, lmReg) : null
    if (rt) {
      retBuf = PNG.sync.write(rt.png)
      writeFileSync(G + `cells-registered/${NAMES[i]}-retouched.png`, retBuf)
      m1 = measureReg(rt.png, buttHint, tipHint)
    }
  }
  const r = {
    cell: i, name: NAMES[i], compId: LM[i].compId, compPx: LM[i].px, nativeBounds: LM[i].bounds,
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
const spareInfo = [5, 6, 7, 8].map(i => { const c = big[i]; return { cell: i, name: NAMES[i], compId: c.id, compPx: c.n, nativeBounds: [c.xmin, c.ymin, c.xmax, c.ymax] } })

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
  for (let x = 0; x < marked.width; x++) { setPx(marked, x, FROZEN.groundY, [255, 0, 255]); setPx(marked, x, FROZEN.groundY + 1, [255, 0, 255]) }
  cross(marked, fm.butt[0], fm.butt[1], [255, 64, 64])
  cross(marked, fm.tip[0], fm.tip[1], [0, 255, 255])
  writeFileSync(G + `cells-registered/${r.name}-marked.png`, PNG.sync.write(marked))
  const bgr = onBg(final)
  const headCX = (BOX[r.cell].headX[0] + BOX[r.cell].headX[1]) / 2 * S + r.registration.dx, headCY = (LM[r.cell].crown + 42) * S + r.registration.dy
  writeFileSync(G + `cells-registered/${r.name}-head-zoom.png`, PNG.sync.write(cropScale(bgr, headCX - 80, headCY - 80, headCX + 80, headCY + 80, 3)))
  writeFileSync(G + `cells-registered/${r.name}-tip-4x.png`, PNG.sync.write(cropScale(bgr, fm.tip[0] - 70, fm.tip[1] - 70, fm.tip[0] + 70, fm.tip[1] + 70, 4)))
  writeFileSync(G + `cells-registered/${r.name}-soles-zoom.png`, PNG.sync.write(cropScale(bgr, fm.bounds.xmin - 8, 440, fm.bounds.xmax + 8, 511, 2)))
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
const origFinals = results.map(r => PNG.sync.read(readFileSync(ORIG_G + `cells-registered/${r.name}-retouched.png`)))
contact([finals], 'contact-focused-sequence.png')
contact([origFinals, finals], 'compare-original-top-vs-focused-bottom.png')

// ---- pose/layout continuity vs original keeps (native sheet coords; registered x
// is comp-centred per sheet so x-positions are not cross-compared) ----
const origMeasure = JSON.parse(readFileSync(ORIG_G + 'measure.json', 'utf8'))
const continuity = results.map(r => {
  const o = origMeasure.keeps[r.cell]
  return {
    cell: r.cell, name: r.name,
    nativeBoundsOrig: o.nativeBounds, nativeBoundsFocused: r.nativeBounds,
    dYmin: r.nativeBounds[1] - o.nativeBounds[1], dYmaxSole: r.nativeBounds[3] - o.nativeBounds[3],
    dXmin: r.nativeBounds[0] - o.nativeBounds[0], dXmaxTipSide: r.nativeBounds[2] - o.nativeBounds[2],
    crownOrig: o.nativeLandmarks.crownY, crownFocused: r.nativeLandmarks.crownY, dCrown: r.nativeLandmarks.crownY - o.nativeLandmarks.crownY,
    soleOrig: o.nativeLandmarks.soleY, soleFocused: r.nativeLandmarks.soleY, dSole: r.nativeLandmarks.soleY - o.nativeLandmarks.soleY,
    helmetWOrig: o.nativeLandmarks.helmetWNative, helmetWFocused: r.nativeLandmarks.helmetWNative,
    compPxOrig: o.compPx, compPxFocused: r.compPx, compPxDeltaPct: round2((r.compPx - o.compPx) / o.compPx * 100),
    bodyNativeOrig: o.nativeLandmarks.soleY - o.nativeLandmarks.crownY, bodyNativeFocused: r.bodyNativePx,
    angRegOrig: o.registeredMeasure.angDeg, angRegFocused: r.registeredMeasure.angDeg, dAngReg: round2(r.registeredMeasure.angDeg - o.registeredMeasure.angDeg),
    uRegOrig: o.registeredMeasure.u, uRegFocused: r.registeredMeasure.u,
  }
})
writeFileSync(G + 'measure.json', JSON.stringify({ work: 'cmr15a-charge-focused-fix-gates', sheetSha256: sheetSha, sheetSize: [SW, SH], components: big.length, sheetScale: S, guardBodyNativePx: bodyNative, frozen: FROZEN, targetU: TARGET_U, ledgerVerified: ledgerState, keeps: results, spares: spareInfo, continuityVsOriginal: continuity }, null, 2) + '\n')
console.log('spares', JSON.stringify(spareInfo))
console.log('DONE measure stage')
