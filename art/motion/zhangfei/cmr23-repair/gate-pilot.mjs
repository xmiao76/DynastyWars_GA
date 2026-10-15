// CMR-23 Zhang Fei pilot gate (candidate 4c16459d, zero generation).
// 1) Segment candidate-raw.png deterministically: foreground = largest
//    8-connected alpha>=128 component (+ original-alpha fringe within 2px);
//    every other pixel RGBA-zeroed (the raw file carries a coloured glow in
//    alpha-0 RGB, visible in some viewers - it is NOT alpha and is killed).
// 2) Extract the naive 520x288 cell at the padded offset (508,368) used in
//    generation, then register to pack geometry with ONE uniform scale:
//    s = restoredMisc3(soleRow-topY) / candidate(soleRow-topY); candidate
//    bbox-centre-x -> restored bbox-centre-x (all 3 reference cells centre
//    their figure+weapon bbox at x~259-259.5 of the 520 cell), candidate
//    sole row -> restored sole row 271 (originY 272 ground).
// 3) Compare vs restored misc:3 outside the lead-arm exclusion, measure the
//    new hand ROI vs target cell (297.4,112)/world (248,140), weapon
//    endpoints/axis, then simulate hold4 contact vs all 6 victim collars via
//    scripts/paired-contact-measure.mjs transforms at core pin and victim
//    pin-axis offsets -3/0/+3u (cluster-assigned micro-dx from
//    scripts/paired-offset-diagnostic.mjs WARP_CLUSTERS marked).
// Run with HAND_ROI=null first to render the registered cell + hand zoom for
// ROI authoring; then set HAND_ROI from the inspected zoom and rerun.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas } from '@napi-rs/canvas'
import { PNG } from 'pngjs'
import { restoreCell, cellCanvas, alphaPoints, centroid, toWorld, minDistance, overlapCount, bootGround, frameNameOf } from '../../../../scripts/paired-contact-measure.mjs'

const DIR = 'art/motion/zhangfei/cmr23-repair/'
const CAND_SHA = '4c16459dc96bbc923e3570f7ee779b0481f7e9da2cbdf8e82402b4e346dd24c4'
const ALPHA = 128
const PAD = { x: 508, y: 368, w: 520, h: 288 }
const TARGET_CELL = [297.4, 112]
const KINDS = ['soldier', 'spearman', 'archer', 'lidian', 'xiahoudun', 'xuchu']
const CLUSTER_MICRO = { soldier: 3, archer: -3, spearman: 3, xiahoudun: -3, xuchu: 3, lidian: -3 } // paired-offset-diagnostic WARP_CLUSTERS
// Lead-arm exclusion (cell px): new extended-arm corridor east of the front
// shoulder + the old misc:3 crossed lead arm/fist on the chest. Body-drift
// regions are measured OUTSIDE this union.
const LEAD_ARM_EXCL = [{ x: 235, y: 70, w: 285, h: 90 }, { x: 195, y: 95, w: 85, h: 85 }]
// Hand ROI: authored from hand-zoom.png of the registered cell (4x grid crop
// x180-400/y50-180, personally inspected): wrist cut at x320 (forearm mass
// west, thumb/palm skin from ~x320), raised index fingertip top ~y82,
// east fingertips to ~x372 (verified: ROI alpha bbox x320-372/y82-133 on the
// first full run; rect tightened to it), little-finger underside ~y133.
// Rect x320-373, y80-134 contains palm+fingers only (spear at y>=155 out).
const HAND_ROI = { x: 320, y: 80, w: 54, h: 55 }
const r2 = (v) => +v.toFixed(2), r3 = (v) => +v.toFixed(3)
const sha = (b) => createHash('sha256').update(b).digest('hex')
const inRect = (x, y, r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
const excluded = (x, y) => LEAD_ARM_EXCL.some((r) => inRect(x, y, r))

const rawBuf = readFileSync(DIR + 'candidate-raw.png')
if (sha(rawBuf) !== CAND_SHA) throw new Error('candidate hash drift')
const raw = PNG.sync.read(rawBuf)
const W = raw.width, H = raw.height
if (W !== 1536 || H !== 1024) throw new Error(`candidate size ${W}x${H}`)

// --- segmentation -----------------------------------------------------------
function components(mask) {
  const seen = new Uint8Array(W * H), out = []
  for (let p = 0; p < W * H; p++) {
    if (seen[p] || !mask[p]) continue
    seen[p] = 1; const st = [p], px = []
    while (st.length) {
      const q = st.pop(), x = q % W, y = (q / W) | 0; px.push(q)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const r = ny * W + nx; if (!seen[r] && mask[r]) { seen[r] = 1; st.push(r) }
      }
    }
    out.push(px)
  }
  return out.sort((a, b) => b.length - a.length)
}
const solid = new Uint8Array(W * H)
let alpha0GlowPx = 0
for (let p = 0; p < W * H; p++) {
  if (raw.data[p * 4 + 3] >= ALPHA) solid[p] = 1
  if (raw.data[p * 4 + 3] === 0 && Math.max(raw.data[p * 4], raw.data[p * 4 + 1], raw.data[p * 4 + 2]) > 16) alpha0GlowPx++
}
const comps = components(solid)
const main = new Uint8Array(W * H)
for (const p of comps[0]) main[p] = 1
const keep = new Uint8Array(W * H)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = y * W + x; if (!main[p]) continue
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) keep[ny * W + nx] = 1
  }
}
const seg = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) }
let keptPx = 0
for (let p = 0; p < W * H; p++) if (keep[p] && raw.data[p * 4 + 3] > 0) { seg.data.set(raw.data.subarray(p * 4, p * 4 + 4), p * 4); keptPx++ }
const segRestored = { kind: 'candidate', frame: 'raw1536', srcW: W, srcH: H, data: seg.data, density: 2, box: { groundY: 0 } }
function statsOf(restored) {
  const pts = alphaPoints(restored)
  let mnx = 1e9, mxx = -1, mny = 1e9, mxy = -1
  for (const [x, y] of pts) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y }
  let sole = -1, soleW = 0
  for (let y = restored.srcH - 1; y >= 0; y--) { let w = 0; for (let x = 0; x < restored.srcW; x++) if (restored.data[(y * restored.srcW + x) * 4 + 3] >= ALPHA) w++; if (w >= 14) { sole = y; soleW = w; break } }
  const topXs = pts.filter((p) => p[1] <= mny + 2).map((p) => p[0])
  return { alphaPx: pts.length, bbox: { x: [mnx, mxx], y: [mny, mxy] }, soleRow: sole, soleW, topRowXs: [Math.min(...topXs), Math.max(...topXs)] }
}
const candStats = statsOf(segRestored)
const misc3 = restoreCell('zhangfei', 'misc:3')
const misc2 = restoreCell('zhangfei', 'misc:2')
const m3Stats = statsOf(misc3), m2Stats = statsOf(misc2)

// --- naive padded extraction -------------------------------------------------
function canvasOf(restoredLike) { const r = { srcW: restoredLike.width ?? restoredLike.srcW, srcH: restoredLike.height ?? restoredLike.srcH, data: restoredLike.data }; return cellCanvas(r) }
const segCanvas = canvasOf(seg)
const naiveCv = createCanvas(520, 288); naiveCv.getContext('2d').drawImage(segCanvas, -PAD.x, -PAD.y)
const naiveData = naiveCv.getContext('2d').getImageData(0, 0, 520, 288).data
const naive = { kind: 'candidate', frame: 'naive', srcW: 520, srcH: 288, data: naiveData, density: 2, box: misc3.box }
const naiveStats = statsOf(naive)
let naiveEdgePx = 0
for (let x = 0; x < 520; x++) for (const y of [0, 287]) if (naiveData[(y * 520 + x) * 4 + 3] >= ALPHA) naiveEdgePx++
for (let y = 0; y < 288; y++) for (const x of [0, 519]) if (naiveData[(y * 520 + x) * 4 + 3] >= ALPHA) naiveEdgePx++

// --- registration ------------------------------------------------------------
const s = (m3Stats.soleRow - m3Stats.bbox.y[0]) / (candStats.soleRow - candStats.bbox.y[0])
const candCx = (candStats.bbox.x[0] + candStats.bbox.x[1]) / 2
const m3Cx = (m3Stats.bbox.x[0] + m3Stats.bbox.x[1]) / 2
const dx = m3Cx - candCx * s, dy = m3Stats.soleRow - candStats.soleRow * s
const regCv = createCanvas(520, 288); const rg = regCv.getContext('2d')
rg.imageSmoothingEnabled = true
rg.drawImage(segCanvas, dx, dy, W * s, H * s)
const regData = rg.getImageData(0, 0, 520, 288).data
const reg = { kind: 'zhangfei', frame: 'misc:3-pilot-4c16459d', srcW: 520, srcH: 288, data: new Uint8ClampedArray(regData), density: 2, box: misc3.box }
const regStats = statsOf(reg)
let regEdgePx = 0
for (let x = 0; x < 520; x++) for (const y of [0, 287]) if (reg.data[(y * 520 + x) * 4 + 3] >= ALPHA) regEdgePx++
for (let y = 0; y < 288; y++) for (const x of [0, 519]) if (reg.data[(y * 520 + x) * 4 + 3] >= ALPHA) regEdgePx++

const save = (name, cv) => { const b = cv.toBuffer('image/png'); writeFileSync(DIR + name, b); return { path: DIR + name, sha256: sha(b), bytes: b.length } }
const files = {}
files.segmented = save('candidate-segmented.png', segCanvas)
files.naiveCell = save('candidate-naive-cell.png', naiveCv)
files.registeredCell = save('candidate-registered-cell.png', regCv)

// Gridded renders for ROI authoring / evidence.
function gridZoom(restored, crop, scale, title, marks = []) {
  const L = 40, T = 24, cv = createCanvas(L + crop.w * scale + 8, T + crop.h * scale + 22), g = cv.getContext('2d')
  g.fillStyle = '#28222e'; g.fillRect(0, 0, cv.width, cv.height)
  g.drawImage(cellCanvas(restored), crop.x, crop.y, crop.w, crop.h, L, T, crop.w * scale, crop.h * scale)
  g.font = '10px sans-serif'
  for (let px = Math.ceil(crop.x / 10) * 10; px <= crop.x + crop.w; px += 10) {
    g.strokeStyle = px % 50 === 0 ? 'rgba(255,255,120,.6)' : 'rgba(255,255,255,.18)'
    g.beginPath(); g.moveTo(L + (px - crop.x) * scale, T); g.lineTo(L + (px - crop.x) * scale, T + crop.h * scale); g.stroke()
    if (px % 50 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(px), L + (px - crop.x) * scale - 8, 12) }
  }
  for (let py = Math.ceil(crop.y / 10) * 10; py <= crop.y + crop.h; py += 10) {
    g.strokeStyle = py % 50 === 0 ? 'rgba(255,255,120,.6)' : 'rgba(255,255,255,.18)'
    g.beginPath(); g.moveTo(L, T + (py - crop.y) * scale); g.lineTo(L + crop.w * scale, T + (py - crop.y) * scale); g.stroke()
    if (py % 50 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(py), 4, T + (py - crop.y) * scale) }
  }
  for (const m of marks) {
    g.strokeStyle = m.color; g.lineWidth = 2
    if (m.roi) g.strokeRect(L + (m.roi.x - crop.x) * scale, T + (m.roi.y - crop.y) * scale, m.roi.w * scale, m.roi.h * scale)
    if (m.pt) { const [mx, my] = [L + (m.pt[0] - crop.x) * scale, T + (m.pt[1] - crop.y) * scale]; g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); g.moveTo(mx, my - 8); g.lineTo(mx, my + 8); g.stroke() }
  }
  g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(title, L, T + crop.h * scale + 15)
  return cv
}
files.handZoom = save('hand-zoom.png', gridZoom(reg, { x: 180, y: 50, w: 220, h: 130 }, 4,
  `registered pilot hand zone, target cross = cell ${TARGET_CELL} (red)${HAND_ROI ? ' ROI box green' : ' ROI NOT YET AUTHORED'}`,
  [{ pt: TARGET_CELL, color: '#ff4040' }, ...(HAND_ROI ? [{ roi: HAND_ROI, color: '#40ff80' }] : [])]))
files.fullGrid = save('registered-grid.png', gridZoom(reg, { x: 0, y: 0, w: 520, h: 288 }, 2, 'registered pilot full cell; red cross = target hand centroid', [{ pt: TARGET_CELL, color: '#ff4040' }]))
files.restoredGrid = save('restored-grid.png', gridZoom(misc3, { x: 0, y: 0, w: 520, h: 288 }, 2, 'restored misc:3 full cell (compare weapon grip / stance)', []))

const base = {
  work: 'cmr23-zhangfei-pilot-gate', candidate: { path: DIR + 'candidate-raw.png', sha256: CAND_SHA, size: [W, H] },
  segmentation: { rule: 'largest 8-connected alpha>=128 component + original-alpha fringe within 2px; all else RGBA=0 (black/glow-to-alpha: raw alpha-0 pixels carry glow RGB, zeroed; no RGB-based keying of solid pixels)', componentsAt128: comps.map((c) => c.length), keptPx, alpha0GlowRgbPxZeroed: alpha0GlowPx },
  candidateNative: candStats, restoredMisc3: m3Stats, restoredMisc2Donor: m2Stats,
  naivePaddedCell: { offset: [PAD.x, PAD.y], ...naiveStats, edgeAlphaPx: naiveEdgePx, note: 'briefed 1:1 extraction; figure was generated ~1.9x and recentred, so this cell is a clipped centre crop' },
  registration: { scale: r3(s), dx: r2(dx), dy: r2(dy), anchor: 'uniform scale by soleRow-topY body span; bbox-centre-x and sole-row aligned to restored misc:3', nativeBodySpanPx: candStats.soleRow - candStats.bbox.y[0], restoredBodySpanPx: m3Stats.soleRow - m3Stats.bbox.y[0], registered: regStats, edgeAlphaPx: regEdgePx },
  files,
}
if (!HAND_ROI) {
  writeFileSync(DIR + 'gate-stage1.json', JSON.stringify({ ...base, stage: 'ROI authoring renders only' }, null, 2) + '\n')
  console.log(JSON.stringify({ stage: 1, scale: r3(s), candStats, regStats, naiveStats, naiveEdgePx }, null, 2))
  process.exit(0)
}

// --- drift vs restored misc:3 outside lead-arm exclusion ----------------------
function regionMetrics(name, rect) {
  let inter = 0, union = 0, xor = 0, rgbDiff = 0
  const aPts = [], bPts = []
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
    if (excluded(x, y)) continue
    const i = (y * 520 + x) * 4
    const a = reg.data[i + 3] >= ALPHA, b = misc3.data[i + 3] >= ALPHA
    if (a) aPts.push([x, y]); if (b) bPts.push([x, y])
    if (a && b) { inter++; rgbDiff += (Math.abs(reg.data[i] - misc3.data[i]) + Math.abs(reg.data[i + 1] - misc3.data[i + 1]) + Math.abs(reg.data[i + 2] - misc3.data[i + 2])) / 3 }
    if (a || b) union++; if (a !== b) xor++
  }
  const ca = aPts.length ? centroid(aPts) : null, cb = bPts.length ? centroid(bPts) : null
  const bb = (pts) => pts.length ? { x: [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))], y: [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))] } : null
  return { name, rect, candAlphaPx: aPts.length, restAlphaPx: bPts.length, inter, xor, iou: union ? r3(inter / union) : null, meanAbsRgbOnInter: inter ? r2(rgbDiff / inter) : null, candCentroid: ca?.map(r2), restCentroid: cb?.map(r2), centroidDriftPx: ca && cb ? [r2(ca[0] - cb[0]), r2(ca[1] - cb[1])] : null, centroidDriftDistPx: ca && cb ? r2(Math.hypot(ca[0] - cb[0], ca[1] - cb[1])) : null, candBbox: bb(aPts), restBbox: bb(bPts) }
}
const regions = [
  regionMetrics('head+headband (west of lead-arm)', { x: 90, y: 25, w: 150, h: 85 }),
  regionMetrics('torso/vest (west strip)', { x: 110, y: 100, w: 90, h: 95 }),
  regionMetrics('legs+boots', { x: 90, y: 175, w: 270, h: 103 }),
  regionMetrics('whole cell outside lead-arm exclusion', { x: 0, y: 0, w: 520, h: 288 }),
]
// Weapon endpoints from alpha extremes (west cap / east tip are the cell
// x-extremes in both drawings; y = median of the extreme 4px band).
function weaponOf(restored) {
  const pts = alphaPoints(restored)
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]))
  const med = (a) => a.sort((x, y) => x - y)[a.length >> 1]
  const cap = [minX, med(pts.filter((p) => p[0] <= minX + 3).map((p) => p[1]))]
  const tip = [maxX, med(pts.filter((p) => p[0] >= maxX - 3).map((p) => p[1]))]
  return { cap, tip, lengthPx: r2(Math.hypot(tip[0] - cap[0], tip[1] - cap[1])), lengthU: r2(Math.hypot(tip[0] - cap[0], tip[1] - cap[1]) / 2), angleDeg: r2(Math.atan2(tip[1] - cap[1], tip[0] - cap[0]) * 180 / Math.PI) }
}
const weapon = { candidate: weaponOf(reg), restoredMisc3: weaponOf(misc3), donorMisc2: weaponOf(misc2) }
weapon.lengthDeltaPctVsMisc3 = r2((weapon.candidate.lengthPx / weapon.restoredMisc3.lengthPx - 1) * 100)
weapon.angleDeltaDegVsMisc3 = r2(weapon.candidate.angleDeg - weapon.restoredMisc3.angleDeg)
weapon.tipDriftPx = [weapon.candidate.tip[0] - weapon.restoredMisc3.tip[0], weapon.candidate.tip[1] - weapon.restoredMisc3.tip[1]]
weapon.capDriftPx = [weapon.candidate.cap[0] - weapon.restoredMisc3.cap[0], weapon.candidate.cap[1] - weapon.restoredMisc3.cap[1]]

// --- hand ROI ------------------------------------------------------------------
const trace = JSON.parse(readFileSync('artifacts/motion/paired/zhangfei/canvas/trace.json', 'utf8'))
const landmarks = JSON.parse(readFileSync('art/motion/paired-contact-landmarks.json', 'utf8'))
const hold4 = trace.core.filter((c) => c.phase === 'hold4')
const handPts = alphaPoints(reg, HAND_ROI)
const handC = centroid(handPts)
let fingerSpanMax = 0, spanPair = null
for (let i = 0; i < handPts.length; i += 3) for (let j = i + 3; j < handPts.length; j += 3) { const d = Math.hypot(handPts[i][0] - handPts[j][0], handPts[i][1] - handPts[j][1]); if (d > fingerSpanMax) { fingerSpanMax = d; spanPair = [handPts[i], handPts[j]] } }
const hDispR = hold4.find((c) => c.facing === 'right').holder.sprite.display
const handWorldC = [hDispR.x + (handC[0] - hDispR.displayOriginX) * hDispR.scaleX, hDispR.y + (handC[1] - hDispR.displayOriginY) * hDispR.scaleY]
const hand = {
  roi: HAND_ROI, alphaPx: handPts.length,
  bbox: { x: [Math.min(...handPts.map((p) => p[0])), Math.max(...handPts.map((p) => p[0]))], y: [Math.min(...handPts.map((p) => p[1])), Math.max(...handPts.map((p) => p[1]))] },
  centroidCell: handC.map(r2), targetCell: TARGET_CELL,
  centroidErrPx: [r2(handC[0] - TARGET_CELL[0]), r2(handC[1] - TARGET_CELL[1])],
  centroidErrDistPx: r2(Math.hypot(handC[0] - TARGET_CELL[0], handC[1] - TARGET_CELL[1])),
  centroidErrDistU: r2(Math.hypot(handC[0] - TARGET_CELL[0], handC[1] - TARGET_CELL[1]) / 2),
  centroidWorld: handWorldC.map(r2), targetWorld: [248, 140],
  fingerSpanPx: { bboxW: Math.max(...handPts.map((p) => p[0])) - Math.min(...handPts.map((p) => p[0])) + 1, bboxH: Math.max(...handPts.map((p) => p[1])) - Math.min(...handPts.map((p) => p[1])) + 1, maxPairwiseSampled: r2(fingerSpanMax), pair: spanPair },
  donorMisc2Roi: landmarks.frames['zhangfei:misc:2'].roi,
}

// --- hold4 contact simulation ----------------------------------------------------
function contact(sample, victimDxU) {
  const vFrame = frameNameOf(sample.victim.sprite.frame)
  const collarLm = landmarks.frames[`${sample.kind}:${vFrame}`]
  const victim = restoreCell(sample.kind, vFrame)
  const hD = sample.holder.sprite.display
  const vD = { ...sample.victim.sprite.display, x: sample.victim.sprite.display.x + victimDxU * (sample.facing === 'right' ? 1 : -1) }
  const hw = toWorld(handPts, hD, 520), cw = toWorld(alphaPoints(victim, collarLm.roi), vD, victim.srcW)
  const gap = minDistance(hw, cw)
  return { gapU: gap.distU === null ? null : r3(gap.distU), gapPairWorld: gap.pair, overlapPx: overlapCount(hw, cw), handAlphaPx: hw.length, collarAlphaPx: cw.length, victim, vD, hD, collarLm, vFrame }
}
const bootDisp = hDispR
const contacts = []
for (const kind of KINDS) for (const facing of ['right', 'left']) {
  const sample = hold4.find((c) => c.kind === kind && c.facing === facing)
  const byOff = {}
  for (const off of [-3, 0, 3]) { const c = contact(sample, off); byOff[String(off)] = { gapU: c.gapU, overlapPx: c.overlapPx, gapPassSpec3u: c.gapU !== null && c.gapU <= 3, gapPassStrict2u: c.gapU !== null && c.gapU <= 2, gapPairWorld: c.gapPairWorld } }
  contacts.push({ kind, facing, victimFrame: frameNameOf(sample.victim.sprite.frame), pin: sample.pin, clusterMicroDxU: CLUSTER_MICRO[kind], byOffset: byOff, corePassSpec: byOff['0'].gapPassSpec3u, clusterPassSpec: byOff[String(CLUSTER_MICRO[kind])].gapPassSpec3u, anyWithin3PassSpec: Object.values(byOff).some((v) => v.gapPassSpec3u) })
}
const rightC = contacts.filter((c) => c.facing === 'right')
const contactSummary = {
  right: { corePassSpec: `${rightC.filter((c) => c.corePassSpec).length}/6`, clusterAssignedPassSpec: `${rightC.filter((c) => c.clusterPassSpec).length}/6`, anyWithinPlusMinus3PassSpec: `${rightC.filter((c) => c.anyWithin3PassSpec).length}/6` },
  all12: { corePassSpec: `${contacts.filter((c) => c.corePassSpec).length}/12`, clusterAssignedPassSpec: `${contacts.filter((c) => c.clusterPassSpec).length}/12` },
  note: 'victim pin-axis sprite offset in world u (mirrored by facing); holder = registered candidate cell at traced hold4 holder display; gap = min hand-ROI to collar-ROI alpha distance (paired-contact-measure transform).',
}
const ground = { candidateRegistered: bootGround(reg, bootDisp), restoredMisc3: bootGround(misc3, bootDisp), naiveCellSoleRow: naiveStats.soleRow }

// --- composites ------------------------------------------------------------------
function compositePanel(kind) {
  const sample = hold4.find((c) => c.kind === kind && c.facing === 'right')
  const offs = [0, CLUSTER_MICRO[kind]]
  const PW = 560, PH = 300, LH = 34
  const cv = createCanvas(PW * 2, PH + LH), g = cv.getContext('2d')
  g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
  offs.forEach((off, idx) => {
    const c = contact(sample, off)
    const px = idx * PW, S = 2, cx = px + PW / 2, groundPx = LH + PH - 26
    g.save(); g.beginPath(); g.rect(px, LH, PW, PH); g.clip()
    const draw = (restored, display, tint) => {
      const body = cellCanvas(restored)
      const dw = restored.srcW * display.scaleX * S, dh = restored.srcH * display.scaleY * S
      const left = cx + (display.x - 240) * S - display.displayOriginX * display.scaleX * S
      const top = groundPx - display.displayOriginY * display.scaleY * S
      g.drawImage(body, left, top, dw, dh)
      if (tint) { g.fillStyle = tint.color; for (const [x, y] of alphaPoints(restored, tint.roi)) g.fillRect(cx + (display.x - 240) * S + (x - display.displayOriginX) * display.scaleX * S, groundPx + (y - display.displayOriginY) * display.scaleY * S, 1.7, 1.7) }
    }
    const front = sample.holder.sprite.depth !== sample.victim.sprite.depth
      ? (sample.holder.sprite.depth > sample.victim.sprite.depth ? 'holder' : 'victim')
      : (sample.holder.sprite.index > sample.victim.sprite.index ? 'holder' : 'victim')
    const actors = [
      { r: reg, d: c.hD, t: { roi: HAND_ROI, color: 'rgba(255,60,60,0.9)' } },
      { r: c.victim, d: c.vD, t: { roi: c.collarLm.roi, color: 'rgba(60,220,255,0.9)' } },
    ]
    if (front === 'holder') actors.reverse()
    for (const a of actors) draw(a.r, a.d, a.t)
    const row = contacts.find((r) => r.kind === kind && r.facing === 'right')
    const pair = row.byOffset[String(off)].gapPairWorld
    if (pair) {
      const map = ([wx, wy]) => [cx + (wx - 240) * S, groundPx + (wy - 220) * S]
      const [hx, hy] = map(pair.hand), [vx, vy] = map(pair.collar)
      g.strokeStyle = '#ffe98a'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx, hy); g.lineTo(vx, vy); g.stroke()
      const [tx, ty] = map([248, 140]); g.strokeStyle = '#40ff80'; g.beginPath(); g.moveTo(tx - 7, ty); g.lineTo(tx + 7, ty); g.moveTo(tx, ty - 7); g.lineTo(tx, ty + 7); g.stroke()
    }
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(px, groundPx); g.lineTo(px + PW, groundPx); g.stroke()
    g.restore()
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`${kind} right hold4 ${off === 0 ? 'CORE pin' : `cluster micro ${off > 0 ? '+' : ''}${off}u`}`, px + 8, 15)
    g.font = '12px sans-serif'
    const o = contacts.find((r) => r.kind === kind && r.facing === 'right').byOffset
    g.fillText(`gap this=${o[String(off)].gapU}u ov=${o[String(off)].overlapPx} | -3:${o['-3'].gapU} 0:${o['0'].gapU} +3:${o['3'].gapU} | hand red collar cyan target green+`, px + 8, 30)
  })
  return cv
}
{
  const panels = ['soldier', 'archer', 'lidian'].map(compositePanel)
  const sheet = createCanvas(panels[0].width, panels.reduce((a, p) => a + p.height, 0)), g = sheet.getContext('2d')
  let y = 0; for (const p of panels) { g.drawImage(p, 0, y); y += p.height }
  files.contactSheet = save('contact-sheet.png', sheet)
}
{ // drift overlay: restored (cyan) vs candidate (red) silhouette xor, lead-arm exclusion boxed
  const cv = createCanvas(520 * 2 + 8, 288 * 2 + 28), g = cv.getContext('2d')
  g.fillStyle = '#141118'; g.fillRect(0, 0, cv.width, cv.height)
  g.imageSmoothingEnabled = false
  g.drawImage(cellCanvas(misc3), 0, 24, 1040, 576)
  const tint = createCanvas(520, 288), tg = tint.getContext('2d')
  const im = tg.createImageData(520, 288)
  for (let p = 0; p < 520 * 288; p++) { const a = reg.data[p * 4 + 3] >= ALPHA, b = misc3.data[p * 4 + 3] >= ALPHA; if (a && !b) { im.data[p * 4] = 255; im.data[p * 4 + 3] = 190 } else if (!a && b) { im.data[p * 4 + 1] = 220; im.data[p * 4 + 2] = 255; im.data[p * 4 + 3] = 190 } }
  tg.putImageData(im, 0, 0); g.drawImage(tint, 0, 24, 1040, 576)
  g.strokeStyle = '#ffe98a'; g.lineWidth = 2
  for (const r of LEAD_ARM_EXCL) g.strokeRect(r.x * 2, 24 + r.y * 2, r.w * 2, r.h * 2)
  g.strokeStyle = '#40ff80'; g.strokeRect(HAND_ROI.x * 2, 24 + HAND_ROI.y * 2, HAND_ROI.w * 2, HAND_ROI.h * 2)
  g.fillStyle = '#fff'; g.font = '14px sans-serif'
  g.fillText('restored misc:3 under at 2x; RED=candidate-only alpha, CYAN=restored-only; yellow=lead-arm exclusion, green=hand ROI', 6, 17)
  files.driftOverlay = save('drift-overlay.png', cv)
}

// --- verdict ------------------------------------------------------------------------
const gates = {
  naiveScale1to1: { pass: Math.abs(s - 1) <= 0.05, value: `registration scale needed ${r3(s)} (native body span ${candStats.soleRow - candStats.bbox.y[0]}px vs restored ${m3Stats.soleRow - m3Stats.bbox.y[0]}px); naive padded cell edgeAlpha=${naiveEdgePx}px, soleRow=${naiveStats.soleRow}` },
  salvageRegistrationBand: { pass: s >= 0.88 && s <= 1.12, value: r3(s) },
  handCentroid: { pass: hand.centroidErrDistPx <= 8, value: `centroid cell ${hand.centroidCell} vs target ${TARGET_CELL}: err ${hand.centroidErrPx}px = ${hand.centroidErrDistPx}px/${hand.centroidErrDistU}u (gate <=8px/4u)` },
  contactClusterSpec3u: { pass: rightC.every((c) => c.clusterPassSpec), value: contactSummary },
  contactCoreSpec3u: { pass: rightC.every((c) => c.corePassSpec), value: rightC.map((c) => `${c.kind}:${c.byOffset['0'].gapU}u`).join(' ') },
  bodyDriftHead: { pass: regions[0].iou >= 0.7 && regions[0].centroidDriftDistPx <= 8, value: regions[0] },
  bodyDriftLegs: { pass: regions[2].iou >= 0.7 && regions[2].centroidDriftDistPx <= 8, value: regions[2] },
  weaponLengthAxis: { pass: Math.abs(weapon.lengthDeltaPctVsMisc3) <= 5 && Math.abs(weapon.angleDeltaDegVsMisc3) <= 5, value: weapon },
  groundAfterRegistration: { pass: Math.abs(ground.candidateRegistered.groundErrU) <= 1.5, value: ground, note: 'passes only BY CONSTRUCTION of sole-anchored registration at scale 0.52x; naive 1:1 cell has no valid sole (clipped)' },
  edgeClippingRegistered: { pass: regEdgePx === 0, value: regEdgePx },
  identityVisual: { pass: true, value: 'MANUAL (inspected registered-grid vs restored-grid + hand-zoom + contact-sheet): same Zhang Fei identity - red headband/topknot, full black beard, red/black vest, serpent spear with red tassels; extended open lead hand reads clearly. Identity only; stance (both feet planted vs restored raised-leg), spear (horizontal one-handed vs diagonal) and east-shifted head are charged to the drift/weapon gates above, not identity.' },
}
const failedGates = Object.entries(gates).filter(([, g]) => g.pass === false).map(([k]) => k)
const out = {
  ...base, files, leadArmExclusion: LEAD_ARM_EXCL, regions, weapon, hand, contacts, contactSummary, ground, gates,
  identityVisualNote: gates.identityVisual.value,
  failedGates,
  verdict: failedGates.length ? 'PILOT FAIL - do NOT proceed to cluster bake' : 'PILOT PASS - may proceed to cluster bake',
}
writeFileSync(DIR + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify({ scale: r3(s), hand, contactSummary, regions: regions.map((r) => `${r.name}: IoU=${r.iou} drift=${r.centroidDriftPx} xor=${r.xor}`), weapon, gates: Object.fromEntries(Object.entries(gates).map(([k, v]) => [k, v.pass])) }, null, 2))
