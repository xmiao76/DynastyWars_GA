// Paired grab-contact measurement (CMR-23, Guan Yu batch).
//
// Restores FULL source cells (trim undone) for holder grab frames and victim
// grabbed frames from the prepared motion JSON + atlas sheets, then:
//
//   --render-input   write gridded inspection crops under
//                    artifacts/motion/paired/measure-input/ so the alpha ROIs
//                    in art/motion/paired-contact-landmarks.json can be
//                    authored/verified by eye against source-cell coords.
//   --validate-landmarks  load the landmarks JSON, check the schema the
//                    measurement uses, and print per-ROI alpha pixel counts
//                    (no trace/matrix run).
//   (default)        measure the Guan Yu 12-combo hold samples of the canvas
//                    trace: min gripping-hand <-> collar/neck distance in
//                    world units (u), hand/collar alpha overlap (reported
//                    separately), boot ground error, front/occlusion order,
//                    plus negative controls that MUST fail the gap gate.
//
// ROI coordinates are integer pixels of the restored full source cell
// (density-2 pixels; cell size = prepared frame srcW x srcH). Facing is
// applied by mirroring cell x (flipX), never by authoring mirrored ROIs.
// World transform follows the trace display record exactly:
//   wx = display.x + (mirroredPx - displayOriginX) * scaleX
//   wy = display.y + (py - displayOriginY) * scaleY        (z = 0 in holds)
// 1 world unit u = 1 game px = 2 source-cell px at the traced 0.5 scale.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { PNG } from 'pngjs'

const ASSETS = 'src/game/assets/motion'
const TRACE_PATH = 'artifacts/motion/paired/guanyu/canvas/trace.json'
const CROP_DIR = 'artifacts/motion/paired/guanyu/canvas'
const LANDMARKS_PATH = 'art/motion/paired-contact-landmarks.json'
const INPUT_DIR = 'artifacts/motion/paired/measure-input'
const OUT_DIR = 'artifacts/motion/paired/measure'
const HERO = 'guanyu'
const KINDS = ['soldier', 'spearman', 'archer', 'lidian', 'xiahoudun', 'xuchu']
const HOLD_PHASES = ['hold0', 'hold4', 'hold8']
/** Gap gate: a real grip reads as touching/overlapping alpha, well under 2u. */
const GAP_PASS_U = 2
/** CMR-23 acceptance gate (docs/motion-tasks/CMR-23.md): gap <= 3 units. */
const SPEC_GAP_PASS_U = 3
const ALPHA_MIN = 128
/** Crop-color survival: source vs canvas-crop RGB tolerance per channel. */
const COLOR_TOL = 48

// ---------------------------------------------------------------------------
// Prepared packs: locate the sheet page + cell geometry for a frame.
// ---------------------------------------------------------------------------

function loadPack(kind) {
  if (kind === 'guanyu') {
    const base = JSON.parse(readFileSync(`${ASSETS}/prepared.json`, 'utf8')).guanyu
    const actions = JSON.parse(readFileSync(`${ASSETS}/actions-prepared.json`, 'utf8'))
    return {
      kind, density: base.density, box: base.box,
      frames: { ...base.frames, ...actions.frames },
      sheets: { sheet: `${ASSETS}/guanyu-motion-sheet.png`, actions: `${ASSETS}/guanyu-actions-sheet.png` },
    }
  }
  const rec = JSON.parse(readFileSync(`${ASSETS}/${kind}-prepared.json`, 'utf8'))
  const page = `${ASSETS}/${kind}-motion-sheet.png`
  return { kind, density: rec.density, box: rec.box, frames: rec.frames, sheets: { sheet: page, actions: page } }
}

const packCache = new Map()
function pack(kind) {
  if (!packCache.has(kind)) packCache.set(kind, loadPack(kind))
  return packCache.get(kind)
}

const sheetCache = new Map()
function sheetPixels(path) {
  if (!sheetCache.has(path)) sheetCache.set(path, PNG.sync.read(readFileSync(path)))
  return sheetCache.get(path)
}

/** Restore the full source cell: trimmed atlas rect pasted at (trimX, trimY). */
export function restoreCell(kind, frameName) {
  const p = pack(kind)
  const cell = p.frames[frameName]
  if (!cell) throw new Error(`no prepared frame ${kind}:${frameName}`)
  const srcW = cell.srcW ?? cell.w, srcH = cell.srcH ?? cell.h
  const sheet = sheetPixels(p.sheets[cell.sheet ?? 'sheet'])
  const data = new Uint8ClampedArray(srcW * srcH * 4)
  const trimX = cell.trimX ?? 0, trimY = cell.trimY ?? 0
  for (let y = 0; y < cell.h; y++) {
    const sRow = ((cell.y + y) * sheet.width + cell.x) * 4
    const dRow = ((trimY + y) * srcW + trimX) * 4
    data.set(sheet.data.subarray(sRow, sRow + cell.w * 4), dRow)
  }
  return { kind, frame: frameName, cell, srcW, srcH, data, density: p.density, box: p.box }
}

export function cellCanvas(restored) {
  const cv = createCanvas(restored.srcW, restored.srcH)
  const g = cv.getContext('2d')
  const im = g.createImageData(restored.srcW, restored.srcH)
  im.data.set(restored.data)
  g.putImageData(im, 0, 0)
  return cv
}

/** Trace frame id `entity:<kind>:motion:<clip>:<idx>` -> prepared frame name. */
export function frameNameOf(traceFrame) {
  const parts = traceFrame.split(':')
  return parts.slice(3).join(':')
}

// ---------------------------------------------------------------------------
// Gridded inspection renders (manual ROI authoring input).
// ---------------------------------------------------------------------------

function gridRender(restored, { scale = 2, crop = null, minor = 10, majorEvery = 4 } = {}) {
  const body = cellCanvas(restored)
  const x0 = crop?.x ?? 0, y0 = crop?.y ?? 0
  const w = crop?.w ?? restored.srcW, h = crop?.h ?? restored.srcH
  const L = 44, T = 26, B = 22
  const cv = createCanvas(L + w * scale + 8, T + h * scale + B)
  const g = cv.getContext('2d')
  g.fillStyle = '#28222e'; g.fillRect(0, 0, cv.width, cv.height)
  g.imageSmoothingEnabled = true
  g.drawImage(body, x0, y0, w, h, L, T, w * scale, h * scale)
  const ox = Math.floor(restored.srcW / 2), oy = restored.box.groundY * restored.density
  g.font = '10px sans-serif'; g.textBaseline = 'top'
  for (let px = Math.ceil(x0 / minor) * minor; px <= x0 + w; px += minor) {
    const major = px % (minor * majorEvery) === 0
    g.strokeStyle = px === ox ? 'rgba(255,80,80,0.9)' : major ? 'rgba(255,255,120,0.55)' : 'rgba(255,255,255,0.16)'
    g.beginPath(); g.moveTo(L + (px - x0) * scale, T); g.lineTo(L + (px - x0) * scale, T + h * scale); g.stroke()
    if (major) { g.fillStyle = '#ffe98a'; g.fillText(String(px), L + (px - x0) * scale - 8, 6) }
  }
  for (let py = Math.ceil(y0 / minor) * minor; py <= y0 + h; py += minor) {
    const major = py % (minor * majorEvery) === 0
    g.strokeStyle = py === oy ? 'rgba(255,80,80,0.9)' : major ? 'rgba(255,255,120,0.55)' : 'rgba(255,255,255,0.16)'
    g.beginPath(); g.moveTo(L, T + (py - y0) * scale); g.lineTo(L + w * scale, T + (py - y0) * scale); g.stroke()
    if (major) { g.fillStyle = '#ffe98a'; g.fillText(String(py), 4, T + (py - y0) * scale - 4) }
  }
  g.fillStyle = '#ffffff'; g.font = '12px sans-serif'
  g.fillText(`${restored.kind}:${restored.frame} full-cell ${restored.srcW}x${restored.srcH} origin=(${ox},${oy}) grid=${minor}px zoom=${scale}x`, L, T + h * scale + 5)
  return cv
}

function primaryFrames() {
  // Holder grab frames + grabbed victim frames, as used by the trace holds.
  const out = [
    { kind: HERO, frame: 'misc:5', role: 'holder-hand' },
    { kind: HERO, frame: 'misc:6', role: 'holder-hand' },
  ]
  for (const kind of KINDS) {
    out.push({ kind, frame: ['soldier', 'spearman', 'archer'].includes(kind) ? 'hitstun-held:5' : 'misc:2', role: 'victim-collar' })
  }
  return out
}

function renderInput(extraCrops) {
  mkdirSync(`${INPUT_DIR}/full`, { recursive: true })
  mkdirSync(`${INPUT_DIR}/grid`, { recursive: true })
  mkdirSync(`${INPUT_DIR}/zoom`, { recursive: true })
  const written = []
  const save = (dir, name, cv) => { writeFileSync(`${INPUT_DIR}/${dir}/${name}.png`, cv.toBuffer('image/png')); written.push(`${dir}/${name}.png`) }
  for (const { kind, frame } of primaryFrames()) {
    const r = restoreCell(kind, frame)
    const name = `${kind}-${frame.replaceAll(':', '-')}`
    save('full', name, cellCanvas(r))
    save('grid', name, gridRender(r, { scale: 2, minor: 20 }))
    // Upper-body zoom: hands, heads and collars live in the top ~62%.
    save('zoom', name, gridRender(r, { scale: 3, minor: 10, crop: { x: 0, y: 0, w: r.srcW, h: Math.ceil(r.srcH * 0.62) } }))
  }
  // Context strips: every Guan Yu misc cell (wrong-pose control candidates)
  // and each victim's first non-grabbed held/hitstun cell.
  const guanyuStrip = []
  for (let i = 0; i <= 8; i++) guanyuStrip.push(restoreCell(HERO, `misc:${i}`))
  save('grid', 'guanyu-misc-strip', stripRender(guanyuStrip, 1))
  for (const kind of KINDS) {
    const frame = ['soldier', 'spearman', 'archer'].includes(kind) ? 'hitstun-held:0' : 'misc:0'
    const r = restoreCell(kind, frame)
    save('grid', `${kind}-${frame.replaceAll(':', '-')}--wrongpose-candidate`, gridRender(r, { scale: 2, minor: 20 }))
  }
  for (const spec of extraCrops) {
    const [kind, frame, x, y, w, h, scale = '4'] = spec.split(':').length >= 7
      ? [spec.split(':')[0], `${spec.split(':')[1]}:${spec.split(':')[2]}`, ...spec.split(':').slice(3)]
      : []
    if (!kind) throw new Error(`bad --crop spec ${spec} (want kind:clip:idx:x:y:w:h[:scale])`)
    const r = restoreCell(kind, frame)
    save('zoom', `${kind}-${frame.replaceAll(':', '-')}-crop${x}x${y}w${w}h${h}`,
      gridRender(r, { scale: Number(scale), minor: 5, majorEvery: 2, crop: { x: +x, y: +y, w: +w, h: +h } }))
  }
  console.log(JSON.stringify({ renderInput: `${INPUT_DIR}/`, files: written }, null, 2))
}

function stripRender(restoredList, scale) {
  const labelH = 18
  const w = restoredList.reduce((a, r) => a + r.srcW * scale + 6, 0)
  const h = Math.max(...restoredList.map((r) => r.srcH)) * scale + labelH
  const cv = createCanvas(w, h), g = cv.getContext('2d')
  g.fillStyle = '#28222e'; g.fillRect(0, 0, w, h)
  let x = 0
  for (const r of restoredList) {
    g.drawImage(cellCanvas(r), x, labelH, r.srcW * scale, r.srcH * scale)
    g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(`${r.kind}:${r.frame}`, x + 4, 13)
    x += r.srcW * scale + 6
  }
  return cv
}

// ---------------------------------------------------------------------------
// Measurement.
// ---------------------------------------------------------------------------

/** Alpha>=ALPHA_MIN pixel coords of `roi` (cell px), optionally of whole cell. */
export function alphaPoints(restored, roi = null) {
  const pts = []
  const x0 = roi?.x ?? 0, y0 = roi?.y ?? 0
  const x1 = roi ? Math.min(restored.srcW, roi.x + roi.w) : restored.srcW
  const y1 = roi ? Math.min(restored.srcH, roi.y + roi.h) : restored.srcH
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (restored.data[(y * restored.srcW + x) * 4 + 3] >= ALPHA_MIN) pts.push([x, y])
  }
  return pts
}

/** Cell px -> world units via the trace display record (flip mirrors x). */
export function toWorld(pts, display, srcW) {
  return pts.map(([x, y]) => {
    const mx = display.flipX ? srcW - 1 - x : x
    return [display.x + (mx - display.displayOriginX) * display.scaleX,
      display.y + (y - display.displayOriginY) * display.scaleY, x, y]
  })
}

/** Min distance between two world point sets (grid-hashed; sets are small). */
export function minDistance(a, b) {
  if (!a.length || !b.length) return { distU: null, pair: null }
  const bucket = new Map()
  const key = (x, y) => `${Math.round(x)},${Math.round(y)}`
  for (const p of b) {
    const k = key(p[0], p[1])
    if (!bucket.has(k)) bucket.set(k, [])
    bucket.get(k).push(p)
  }
  const search = (pts, radius) => {
    let best = null
    for (const p of pts) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      for (const q of bucket.get(key(p[0] + dx, p[1] + dy)) ?? []) {
        const d = Math.hypot(p[0] - q[0], p[1] - q[1])
        if (!best || d < best.distU) best = { distU: d, pair: { hand: [p[0], p[1]], collar: [q[0], q[1]] } }
      }
    }
    return best
  }
  // Grow the search radius until the true minimum is provably inside it.
  for (let radius = 2; radius <= 64; radius *= 2) {
    const best = search(a, radius)
    if (best && best.distU <= radius - 1) return best
    if (radius === 64) return best ?? brute(a, b)
  }
  return brute(a, b)
}
function brute(a, b) {
  let best = { distU: Infinity, pair: null }
  for (const p of a) for (const q of b) {
    const d = Math.hypot(p[0] - q[0], p[1] - q[1])
    if (d < best.distU) best = { distU: d, pair: { hand: [p[0], p[1]], collar: [q[0], q[1]] } }
  }
  return best
}

/** Count world-space alpha collisions between two point sets (0.5u cells). */
export function overlapCount(a, b) {
  const cells = new Set(b.map(([x, y]) => `${Math.round(x * 2)},${Math.round(y * 2)}`))
  let n = 0
  for (const [x, y] of a) if (cells.has(`${Math.round(x * 2)},${Math.round(y * 2)}`)) n++
  return n
}

/**
 * Boot sole row: lowest cell row carrying >=14 alpha px (a sole is wide; a
 * spear/polearm butt reaching the floor is not). Raw lowest alpha is kept
 * alongside so a weapon tip below the sole stays visible in the report.
 */
export function bootGround(restored, display) {
  let solePx = -1, soleWidth = 0, rawLowest = -1
  for (let y = restored.srcH - 1; y >= 0; y--) {
    let width = 0
    for (let x = 0; x < restored.srcW; x++) if (restored.data[(y * restored.srcW + x) * 4 + 3] >= ALPHA_MIN) width++
    if (width > 0 && rawLowest < 0) rawLowest = y
    if (width >= 14) { solePx = y; soleWidth = width; break }
  }
  if (solePx < 0) return null
  return {
    soleRowPx: solePx, soleRowWidthPx: soleWidth, rawLowestAlphaRowPx: rawLowest,
    groundErrU: (solePx - display.displayOriginY) * display.scaleY,
  }
}

/**
 * Crop-color survival: reproject world ROI points into the canvas capture
 * crop and compare RGB with the source cell pixel. A point "survives" when
 * the composited crop still shows this actor's color there (not painted
 * over by a front actor/bg). The world -> crop mapping is EXACT, derived
 * from the capture harness (e2e/paired-grab-capture.spec.ts) and the game
 * camera (GameScene pins camera origin to (0,0), so backing-store px =
 * (world - scroll) * cameraZoom):
 *   boxOf:     unionBox is in backing px, (world - scroll) * cameraZoom
 *   crop draw: snapshot drawn at drawScale = crop.width / unionBox.w (= 2),
 *              offset by -unionBox * drawScale
 *   => cropPx = ((world - scroll) * cameraZoom - unionBox.xy) * drawScale
 * With the traced camera (zoom 2, scroll 0) that is world * 4 - union * 2.
 * No offset fitting: a sample is infeasible when the FRONT actor's whole
 * body does not agree under this exact mapping.
 */
function colorScore(crop, restored, worldPts, scale, ox, oy) {
  let hit = 0, total = 0
  for (const [wx, wy, cx, cy] of worldPts) {
    const px = Math.round(wx * scale + ox), py = Math.round(wy * scale + oy)
    if (px < 0 || py < 0 || px >= crop.width || py >= crop.height) continue
    total++
    const si = (cy * restored.srcW + cx) * 4, ci = (py * crop.width + px) * 4
    if (Math.abs(restored.data[si] - crop.data[ci]) <= COLOR_TOL
      && Math.abs(restored.data[si + 1] - crop.data[ci + 1]) <= COLOR_TOL
      && Math.abs(restored.data[si + 2] - crop.data[ci + 2]) <= COLOR_TOL) hit++
  }
  return { ratio: total ? hit / total : 0, hit, total }
}
function strideSample(pts, target) {
  const stride = Math.max(1, Math.floor(pts.length / target))
  return pts.filter((_, i) => i % stride === 0)
}
function cropSurvival(sample, frontKey, cells, camera = { zoom: 2, scrollX: 0, scrollY: 0 }) {
  let crop
  try { crop = PNG.sync.read(readFileSync(`${CROP_DIR}/${sample.cropFile}`)) } catch { return { feasible: false, reason: 'crop file unreadable' } }
  const drawScale = crop.width / sample.unionBox.w
  if (!Number.isFinite(drawScale) || Math.abs(crop.height / sample.unionBox.h - drawScale) > 0.01) {
    return { feasible: false, reason: 'unionBox/crop aspect mismatch' }
  }
  const scale = camera.zoom * drawScale
  const ox = (-camera.scrollX * camera.zoom - sample.unionBox.x) * drawScale
  const oy = (-camera.scrollY * camera.zoom - sample.unionBox.y) * drawScale
  const front = cells[frontKey]
  const frontBody = strideSample(toWorld(alphaPoints(front.restored), front.display, front.restored.srcW), 600)
  const frontScore = colorScore(crop, front.restored, frontBody, scale, ox, oy)
  if (frontScore.ratio < 0.25) {
    return { feasible: false, reason: `front actor disagrees under exact crop mapping (${(frontScore.ratio * 100).toFixed(1)}% of ${frontScore.total})`, frontBodyRatio: frontScore.ratio }
  }
  const score = (c) => colorScore(crop, c.restored, c.worldPts, scale, ox, oy)
  return {
    feasible: true, cropPxPerWorldUnit: scale, camera,
    frontBodyRatio: frontScore.ratio,
    handSurvival: score(cells.holder), collarSurvival: score(cells.victim),
  }
}

export function centroid(pts) {
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]
}

function measureSample(sample, landmarks, { victimShiftLaneU = 0, victimShiftPinU = 0, wrongPose = false, camera } = {}) {
  const holderFrame = frameNameOf(sample.holder.sprite.frame)
  const victimFrame = frameNameOf(sample.victim.sprite.frame)
  const handLm = landmarks.frames[`${HERO}:${holderFrame}`]
  const collarLm = landmarks.frames[`${sample.kind}:${victimFrame}`]
  if (!handLm || !collarLm) throw new Error(`missing landmark for ${HERO}:${holderFrame} or ${sample.kind}:${victimFrame}`)
  const holderCell = restoreCell(HERO, wrongPose ? landmarks.controls.wrongPoseHolderFrame : holderFrame)
  const victimCell = restoreCell(sample.kind, victimFrame)
  const hDisp = sample.holder.sprite.display
  const vDisp = { ...sample.victim.sprite.display }
  const handWorld = toWorld(alphaPoints(holderCell, handLm.roi), hDisp, holderCell.srcW)
  // Negative controls: victim displaced 6u in lane/depth (world y) AWAY
  // from the gripping hand - dy sign from the ROI centroids of the
  // unshifted sample, so the shift always increases lane separation (a
  // fixed +y would move collar-above-hand victims INTO the hand) - or
  // (diagnostic) +6u along the pin axis away from the holder.
  const appliedShiftU = { laneDyU: 0, pinDxU: 0 }
  if (victimShiftLaneU) {
    const collarBase = toWorld(alphaPoints(victimCell, collarLm.roi), vDisp, victimCell.srcW)
    appliedShiftU.laneDyU = Math.sign(centroid(collarBase)[1] - centroid(handWorld)[1] || 1) * victimShiftLaneU
    vDisp.y += appliedShiftU.laneDyU
  }
  if (victimShiftPinU) {
    appliedShiftU.pinDxU = Math.sign(sample.pin.dx || 1) * victimShiftPinU
    vDisp.x += appliedShiftU.pinDxU
  }
  const collarWorld = toWorld(alphaPoints(victimCell, collarLm.roi), vDisp, victimCell.srcW)
  const gap = minDistance(handWorld, collarWorld)
  const overlap = overlapCount(handWorld, collarWorld)
  const front = sample.holder.sprite.depth !== sample.victim.sprite.depth
    ? (sample.holder.sprite.depth > sample.victim.sprite.depth ? 'holder' : 'victim')
    : (sample.holder.sprite.index > sample.victim.sprite.index ? 'holder' : 'victim')
  const out = {
    kind: sample.kind, facing: sample.facing, phase: sample.phase,
    holderFrame, victimFrame,
    handAlphaPx: handWorld.length, collarAlphaPx: collarWorld.length,
    gapU: gap.distU === null ? null : Number(gap.distU.toFixed(3)),
    gapPairWorld: gap.pair,
    overlapPx: overlap,
    gapPass: gap.distU !== null && gap.distU <= GAP_PASS_U,
    gapPassSpec: gap.distU !== null && gap.distU <= SPEC_GAP_PASS_U,
    appliedShiftU,
    holderBoot: bootGround(restoreCell(HERO, holderFrame), hDisp),
    victimBoot: bootGround(victimCell, sample.victim.sprite.display),
    front,
    depthOrder: { holder: [sample.holder.sprite.depth, sample.holder.sprite.index], victim: [sample.victim.sprite.depth, sample.victim.sprite.index] },
    pin: sample.pin,
  }
  if (!victimShiftLaneU && !victimShiftPinU && !wrongPose) {
    out.cropSurvival = cropSurvival(sample, front, {
      holder: { restored: holderCell, display: hDisp, worldPts: handWorld },
      victim: { restored: victimCell, display: sample.victim.sprite.display, worldPts: collarWorld },
    }, camera)
  }
  return { result: out, handWorld, collarWorld, holderCell, victimCell }
}

function contactSheet(rows, landmarks, trace) {
  // One annotated panel per combo at hold4: both restored cells composited at
  // traced world placement (back actor first), ROI alpha tinted, gap pair
  // linked. Scale: 2 image px per world unit (== source-cell resolution).
  const S = 2, W = 560, H = 300, labelH = 30, cols = 2
  const sheetRows = Math.ceil(rows.length / cols)
  const cv = createCanvas(cols * W, sheetRows * (H + labelH)), g = cv.getContext('2d')
  g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
  rows.forEach((row, i) => {
    const sample = trace.core.find((c) => c.kind === row.kind && c.facing === row.facing && c.phase === 'hold4')
    const { holderCell, victimCell } = measureSample(sample, landmarks)
    const px = (i % cols) * W, py = Math.floor(i / cols) * (H + labelH)
    g.save()
    g.beginPath(); g.rect(px, py + labelH, W, H); g.clip()
    const cx = px + W / 2, groundPx = py + labelH + H - 26
    const draw = (restored, display, tintRoi) => {
      const body = cellCanvas(restored)
      const dw = restored.srcW * display.scaleX * S, dh = restored.srcH * display.scaleY * S
      const left = cx + (display.x - 240) * S - display.displayOriginX * display.scaleX * S
      const top = groundPx - display.displayOriginY * display.scaleY * S
      g.save()
      if (display.flipX) { g.translate(left + dw, top); g.scale(-1, 1); g.drawImage(body, 0, 0, dw, dh) }
      else g.drawImage(body, left, top, dw, dh)
      g.restore()
      if (tintRoi) {
        g.fillStyle = tintRoi.color
        for (const [x, y] of alphaPoints(restored, tintRoi.roi)) {
          const mx = display.flipX ? restored.srcW - 1 - x : x
          g.fillRect(cx + (display.x - 240) * S + (mx - display.displayOriginX) * display.scaleX * S,
            groundPx + (y - display.displayOriginY) * display.scaleY * S, 1.6, 1.6)
        }
      }
    }
    const handLm = landmarks.frames[`${HERO}:${row.holderFrame}`]
    const collarLm = landmarks.frames[`${row.kind}:${row.victimFrame}`]
    const actors = [
      { restored: holderCell, display: sample.holder.sprite.display, tint: { roi: handLm.roi, color: 'rgba(255,60,60,0.85)' } },
      { restored: victimCell, display: sample.victim.sprite.display, tint: { roi: collarLm.roi, color: 'rgba(60,220,255,0.85)' } },
    ]
    if (row.front === 'holder') actors.reverse()
    for (const a of actors) draw(a.restored, a.display, a.tint)
    if (row.gapPairWorld) {
      const map = ([wx, wy]) => [cx + (wx - 240) * S, groundPx + (wy - 220) * S]
      const [hx, hy] = map(row.gapPairWorld.hand), [vx, vy] = map(row.gapPairWorld.collar)
      g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(vx, vy); g.stroke()
    }
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(px, groundPx); g.lineTo(px + W, groundPx); g.stroke()
    g.restore()
    g.fillStyle = '#fff'; g.font = '12px sans-serif'
    g.fillText(`${row.kind} ${row.facing} hold4`, px + 6, py + 12)
    g.font = '11px sans-serif'
    g.fillText(`gap=${row.gapU}u overlap=${row.overlapPx}px front=${row.front}`, px + 6, py + 25)
  })
  return cv
}

/** Schema + ROI alpha-count check for the landmarks file (no matrix run). */
function validateLandmarks() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  if (!landmarks.frames || typeof landmarks.frames !== 'object') throw new Error('landmarks: missing frames object')
  if (typeof landmarks.controls?.wrongPoseHolderFrame !== 'string') throw new Error('landmarks: missing controls.wrongPoseHolderFrame')
  restoreCell(HERO, landmarks.controls.wrongPoseHolderFrame) // must resolve
  const rows = []
  for (const { kind, frame, role } of primaryFrames()) {
    const key = `${kind}:${frame}`
    const roi = landmarks.frames[key]?.roi
    if (!roi || ![roi.x, roi.y, roi.w, roi.h].every(Number.isInteger) || roi.w <= 0 || roi.h <= 0) {
      throw new Error(`landmarks: bad/missing roi for ${key}`)
    }
    const restored = restoreCell(kind, frame)
    if (roi.x < 0 || roi.y < 0 || roi.x + roi.w > restored.srcW || roi.y + roi.h > restored.srcH) {
      throw new Error(`landmarks: roi out of cell bounds for ${key} (${restored.srcW}x${restored.srcH})`)
    }
    const pts = alphaPoints(restored, roi)
    if (!pts.length) throw new Error(`landmarks: zero alpha>=${ALPHA_MIN} px in roi for ${key}`)
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
    rows.push({
      key, role, roi, cell: `${restored.srcW}x${restored.srcH}`, alphaPx: pts.length,
      alphaBbox: { x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] },
    })
  }
  console.log(JSON.stringify({ landmarks: LANDMARKS_PATH, alphaMin: ALPHA_MIN, frames: rows.length, rows }, null, 2))
}

function measure() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  const trace = JSON.parse(readFileSync(TRACE_PATH, 'utf8'))
  mkdirSync(OUT_DIR, { recursive: true })
  const samples = trace.core.filter((c) => HOLD_PHASES.includes(c.phase))
  const results = samples.map((s) => measureSample(s, landmarks, { camera: trace.camera }).result)
  const combos = []
  for (const kind of KINDS) for (const facing of ['right', 'left']) {
    const mine = results.filter((r) => r.kind === kind && r.facing === facing)
    combos.push({
      kind, facing,
      samples: mine.map((r) => r.phase),
      worstGapU: Math.max(...mine.map((r) => r.gapU ?? Infinity)),
      minGapU: Math.min(...mine.map((r) => r.gapU ?? Infinity)),
      totalOverlapPx: mine.reduce((a, r) => a + r.overlapPx, 0),
      holderBootErrU: mine[0].holderBoot?.groundErrU ?? null,
      victimBootErrU: mine[0].victimBoot?.groundErrU ?? null,
      front: mine[0].front,
      gapPassAll: mine.every((r) => r.gapPass),
      gapPassAllSpec: mine.every((r) => r.gapPassSpec),
    })
  }
  // Negative controls on hold4 of every combo: the gated controls (6u lane
  // shift AWAY from the hand, wrong-pose holder frame) MUST fail the gap
  // gate. A pin-axis +6u shift is reported as a non-gated diagnostic only:
  // the traced hand OVERSHOOTS the collar along x (see gap pairs), so
  // moving the victim away from the holder moves the collar INTO the hand
  // and cannot serve as a separation control for this batch.
  const controls = []
  for (const s of trace.core.filter((c) => c.phase === 'hold4')) {
    const lane = measureSample(s, landmarks, { victimShiftLaneU: 6 }).result
    const pinDiag = measureSample(s, landmarks, { victimShiftPinU: 6 }).result
    const wrong = measureSample(s, landmarks, { wrongPose: true }).result
    controls.push({
      kind: s.kind, facing: s.facing,
      plus6uVictimShift: { axis: 'lane/depth away from hand', appliedDyU: lane.appliedShiftU.laneDyU, gapU: lane.gapU, overlapPx: lane.overlapPx, gapPass: lane.gapPass, failsAsDesigned: !lane.gapPass },
      wrongPoseHolder: { frame: landmarks.controls.wrongPoseHolderFrame, gapU: wrong.gapU, handAlphaPx: wrong.handAlphaPx, gapPass: wrong.gapPass, failsAsDesigned: !wrong.gapPass },
      diagnosticPinAxisPlus6u: { gapU: pinDiag.gapU, gapPass: pinDiag.gapPass, note: 'non-gated: collar moves into the overshooting hand' },
    })
  }
  const hold4 = results.filter((r) => r.phase === 'hold4')
  const matrix = {
    hero: HERO, trace: TRACE_PATH, landmarks: LANDMARKS_PATH,
    alphaMin: ALPHA_MIN, gapPassU: GAP_PASS_U, specGapPassU: SPEC_GAP_PASS_U,
    note: 'gapU = min Euclidean distance between hand-ROI and collar-ROI alpha in world units; overlapPx counts coincident 0.5u world cells and is reported separately, never folded into gapU. gapPass uses the strict 2u gate; gapPassSpec/gapPassAllSpec use the CMR-23 acceptance gate of 3u. Boot ground error = (sole row - displayOriginY) * scaleY where sole row = lowest row with >=14 alpha px; negative = sole above the entity ground line y. The 6u gated control shifts the victim in lane/depth AWAY from the gripping hand (dy sign from the unshifted ROI centroids, recorded as appliedDyU): a fixed +y shift would move collar-above-hand victims into the hand, and along the pin (x) axis the traced hand overshoots past the collar, so a pin-axis shift also moves the collar into the hand (kept as diagnosticPinAxisPlus6u, non-gated). cropSurvival reprojects ROI alpha into the canvas capture crop via the exact harness mapping cropPx = ((world - scroll) * cameraZoom - unionBox) * (crop.width / unionBox.w) and reports RGB-agreement ratios; a sample is feasible only when the front actor whole-body agrees >= 25% under that mapping.',
    combos, samples: results, controls,
    summary: {
      combosPassing: combos.filter((c) => c.gapPassAll).length,
      combosPassingSpec: combos.filter((c) => c.gapPassAllSpec).length,
      combosTotal: combos.length,
      controlsFailingAsDesigned: controls.filter((c) => c.plus6uVictimShift.failsAsDesigned && c.wrongPoseHolder.failsAsDesigned).length,
      controlsTotal: controls.length,
    },
  }
  writeFileSync(`${OUT_DIR}/guanyu-12combo-matrix.json`, `${JSON.stringify(matrix, null, 2)}\n`)
  writeFileSync(`${OUT_DIR}/guanyu-hold4-contact-sheet.png`, contactSheet(hold4, landmarks, trace).toBuffer('image/png'))
  console.log(JSON.stringify({
    summary: matrix.summary,
    combos: combos.map((c) => `${c.kind}-${c.facing}: worstGap=${c.worstGapU}u overlap=${c.totalOverlapPx} front=${c.front} boots h=${c.holderBootErrU} v=${c.victimBootErrU} pass=${c.gapPassAll}`),
    controls: controls.map((c) => `${c.kind}-${c.facing}: +6uLaneAway(dy=${c.plus6uVictimShift.appliedDyU}) gap=${c.plus6uVictimShift.gapU} fail=${c.plus6uVictimShift.failsAsDesigned}; wrongpose gap=${c.wrongPoseHolder.gapU} fail=${c.wrongPoseHolder.failsAsDesigned}; pinDiag gap=${c.diagnosticPinAxisPlus6u.gapU}`),
  }, null, 2))
}

// CLI only when invoked directly; paired-offset-diagnostic.mjs imports the
// restoration/transform helpers above without re-running a measurement.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (args.includes('--render-input')) {
    const crops = []
    for (let i = 0; i < args.length; i++) if (args[i] === '--crop') crops.push(args[++i])
    renderInput(crops)
  } else if (args.includes('--validate-landmarks')) {
    validateLandmarks()
  } else {
    measure()
  }
}
