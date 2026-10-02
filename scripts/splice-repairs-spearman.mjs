#!/usr/bin/env node
// CMR-07A (owner-directed repair round): splice verified repair drawings
// into the source sheets. Originals rotate to art/motion/spearman/previous/.
// Unlike the soldier splice (pose-matched k, because the old cells were at
// the RIGHT scale), the spearman k is UNIFORM per repair sheet pair: it
// normalizes the repair sheet's witness-verified scale to the target
// sheet's native scale (fall/thrust/getup 1.0; hitstun 1/0.925). Per-cell
// k would be pose-wise normalization (forbidden).
// Clearing is mask-exact (union-find component labeling): the old figure's
// own pixels and only those are removed, so neighbours are provably
// untouched (a bbox+pad clear ate hitstun:4's spear-butt rows). Source
// compositing uses cleaned repair sheets (grid seams removed; verified
// that no seam lies inside any figure bbox, so bbox rectangles are safe).
//
//   node scripts/splice-repairs-spearman.mjs

import { mkdirSync, renameSync, existsSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/spearman'
const PREV = `${SRC}/previous`
const CLEAN = 'artifacts/motion/spearman/cleaned'

// { targetSheet, targetPos, repairFile, repairPos, k } - verified only.
// Round-0 (authoring budget): 7 splices. Round-2 (ledger round 2) adds 5
// (r2:2/r2:3/r2:4/r2:5 fix the 4 residuals; r2:6 replaces the borderline
// A:7 splice). A:8/B:4/B:5/B:8/r1:7/r2:7/r2:8 never verified - not spliced.
// k is UNIFORM per repair sheet pair (witness-calibrated), never per-cell.
const JOBS = [
  { sheet: 'fall-thrown', pos: 3, repair: 'fall-thrown-repair-candidate-1.png', rpos: 4, k: 0.906 },
  { sheet: 'thrust', pos: 3, repair: 'mixed-repair-candidate-1.png', rpos: 1, k: 0.919 },
  { sheet: 'thrust', pos: 4, repair: 'mixed-repair-candidate-1.png', rpos: 2, k: 0.919 },
  { sheet: 'hitstun-held', pos: 7, repair: 'mixed-repair-candidate-1.png', rpos: 3, k: 0.994 },
  { sheet: 'getup-death', pos: 2, repair: 'mixed-repair-candidate-1.png', rpos: 6, k: 0.919 },
  { sheet: 'getup-death', pos: 6, repair: 'mixed-repair-candidate-1.png', rpos: 7, k: 0.919 },
  { sheet: 'fall-thrown', pos: 7, repair: 'acceptance4-round2-candidate-1.png', rpos: 2, k: 0.86 },
  { sheet: 'getup-death', pos: 0, repair: 'acceptance4-round2-candidate-1.png', rpos: 3, k: 0.86 },
  { sheet: 'getup-death', pos: 1, repair: 'acceptance4-round2-candidate-1.png', rpos: 4, k: 0.86 },
  { sheet: 'getup-death', pos: 7, repair: 'acceptance4-round2-candidate-1.png', rpos: 5, k: 0.86 },
  { sheet: 'fall-thrown', pos: 6, repair: 'acceptance4-round2-candidate-1.png', rpos: 6, k: 0.86 },
]
const SHEET_FILE = {
  locomotion: 'locomotion-candidate-1.png',
  thrust: 'thrust-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-2.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  return cv
}
const imOf = (cv) => {
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
  return { width: d.width, height: d.height, data: d.data }
}
function figureAt(comps, w, h, cellIndex) {
  const cellW = Math.floor(w / 3)
  const cellH = Math.floor(h / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0 && (best === null || c.area > best.area)) best = c
  }
  return best
}

/** Union-find 4-connected labeling of opaque pixels. Returns label image. */
function labelSheet(im, alpha = 96) {
  const { width: W, height: H, data } = im
  const parent = new Int32Array(W * H).fill(-1)
  const find = (i) => {
    let r = i
    while (parent[r] !== r) r = parent[r]
    while (parent[i] !== r) { const n = parent[i]; parent[i] = r; i = n }
    return r
  }
  const union = (a, b) => {
    a = find(a); b = find(b)
    if (a !== b) parent[a] = b
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] < alpha) continue
      const i = y * W + x
      parent[i] = i
      if (x > 0 && parent[i - 1] >= 0) union(i, i - 1)
      if (y > 0 && parent[i - W] >= 0) union(i, i - W)
    }
  }
  return { labelOf: (x, y) => (parent[y * W + x] >= 0 ? find(y * W + x) : -1), W, H }
}

// Clean a repair sheet: keep ONLY each cell's figure-label pixels
// (mask-aware). Bbox rectangles can include neighbor-figure bleed (wide
// poses span nominal boundaries); compositing raw rectangles would stamp
// foreign pixels into the target. Union-find labels identify the figure
// exactly (most frequent label among opaque pixels in the figure bbox).
async function cleanedRepair(file) {
  const cv = await pixelsOf(`${SRC}/${file}`)
  const im = imOf(cv)
  const labels = labelSheet(im)
  const out = createCanvas(cv.width, cv.height)
  const g = out.getContext('2d')
  const src = cv.getContext('2d')
  for (let pos = 0; pos < 9; pos++) {
    const c = figureAt(alphaComponents(im, 96), im.width, im.height, pos)
    if (!c) throw new Error(`${file}:${pos} repair figure not found`)
    const counts = new Map()
    for (let y = c.y0; y <= c.y1; y++) {
      for (let x = c.x0; x <= c.x1; x++) {
        const l = labels.labelOf(x, y)
        if (l >= 0) counts.set(l, (counts.get(l) ?? 0) + 1)
      }
    }
    let best = -1, bestN = 0
    for (const [l, n] of counts) if (n > bestN) { best = l; bestN = n }
    const part = src.getImageData(c.x0, c.y0, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1)
    const cleaned = g.createImageData(part.width, part.height)
    for (let y = 0; y < part.height; y++) {
      for (let x = 0; x < part.width; x++) {
        if (labels.labelOf(c.x0 + x, c.y0 + y) !== best) continue
        const k = (y * part.width + x) * 4
        cleaned.data[k] = part.data[k]
        cleaned.data[k + 1] = part.data[k + 1]
        cleaned.data[k + 2] = part.data[k + 2]
        cleaned.data[k + 3] = part.data[k + 3]
      }
    }
    g.putImageData(cleaned, c.x0, c.y0)
    console.log(`  ${file}:${pos} figure label pixels=${bestN}`)
  }
  return out
}

mkdirSync(PREV, { recursive: true })
mkdirSync(CLEAN, { recursive: true })
const cleaned = {}
for (const f of [...new Set(JOBS.map((j) => j.repair))]) {
  const cv = await cleanedRepair(f)
  writeFileSync(`${CLEAN}/${f}`, cv.toBuffer('image/png'))
  cleaned[f] = cv
  const n = alphaComponents(imOf(cv), 96).filter((c) => c.area >= 200).length
  console.log(`cleaned ${f}: ${n} components>=200px`)
  if (n !== 9) throw new Error(`${f}: expected 9 figure components after cleaning, got ${n}`)
}

const log = []
const bySheet = new Map()
for (const job of JOBS) {
  if (!bySheet.has(job.sheet)) bySheet.set(job.sheet, [])
  bySheet.get(job.sheet).push(job)
}
for (const [sheet, jobs] of bySheet) {
  const sheetPath = `${SRC}/${SHEET_FILE[sheet]}`
  const rotated = `${PREV}/${SHEET_FILE[sheet]}.original.png`
  if (!existsSync(rotated)) renameSync(sheetPath, rotated)
  const pristine = await pixelsOf(rotated)
  const pristineIm = imOf(pristine)
  const sheetCv = await pixelsOf(rotated)
  for (const job of jobs) {
    const repairCv = cleaned[job.repair]
    const sheetComps = alphaComponents(imOf(sheetCv), 96)
    const repairComps = alphaComponents(imOf(repairCv), 96)
    const old = figureAt(sheetComps, sheetCv.width, sheetCv.height, job.pos)
    const src = figureAt(repairComps, repairCv.width, repairCv.height, job.rpos)
    if (!old) throw new Error(`${job.sheet}:${job.pos} original figure not found`)
    if (!src) throw new Error(`${job.repair}:${job.rpos} repair figure not found`)
    // Mask-exact clear: label the sheet, find the old figure's label (the
    // label whose centroid is in the target cell with max area - mirrors
    // figureAt), clear exactly its pixels. Neighbours provably untouched.
    const labels = labelSheet(imOf(sheetCv))
    const cellW = Math.floor(sheetCv.width / 3)
    const cellH = Math.floor(sheetCv.height / 3)
    const stats = new Map()
    for (let y = old.y0; y <= old.y1; y++) {
      for (let x = old.x0; x <= old.x1; x++) {
        const l = labels.labelOf(x, y)
        if (l < 0) continue
        let s = stats.get(l)
        if (!s) { s = { n: 0, sx: 0, sy: 0 }; stats.set(l, s) }
        s.n++; s.sx += x; s.sy += y
      }
    }
    let target = -1, targetN = 0
    for (const [l, s] of stats) {
      const ccx = Math.floor(s.sx / s.n / cellW)
      const ccy = Math.floor(s.sy / s.n / cellH)
      if (ccx === job.pos % 3 && ccy === Math.floor(job.pos / 3) && s.n > targetN) { target = l; targetN = s.n }
    }
    if (target < 0) throw new Error(`${job.sheet}:${job.pos} old-figure label not found`)
    const g = sheetCv.getContext('2d')
    const img = g.getImageData(0, 0, sheetCv.width, sheetCv.height)
    for (let y = 0; y < sheetCv.height; y++) {
      for (let x = 0; x < sheetCv.width; x++) {
        if (labels.labelOf(x, y) === target) img.data[(y * sheetCv.width + x) * 4 + 3] = 0
      }
    }
    g.putImageData(img, 0, 0)
    // Composite the rescaled repair figure centred on the OLD figure's
    // centroid (same pose => same footprint; the fit recentres anyway),
    // clamped inside the sheet (edge touch is a preparation hard error).
    const dw = Math.max(1, Math.round((src.x1 - src.x0 + 1) * job.k))
    const dh = Math.max(1, Math.round((src.y1 - src.y0 + 1) * job.k))
    const cx = (old.x0 + old.x1 + 1) / 2
    const cy = (old.y0 + old.y1 + 1) / 2
    const dx = Math.max(2, Math.min(Math.round(cx - dw / 2), sheetCv.width - dw - 2))
    const dy = Math.max(2, Math.min(Math.round(cy - dh / 2), sheetCv.height - dh - 2))
    g.drawImage(repairCv, src.x0, src.y0, src.x1 - src.x0 + 1, src.y1 - src.y0 + 1, dx, dy, dw, dh)
    log.push(`${job.sheet}:${job.pos} <- ${job.repair}:${job.rpos} k=${job.k} dst=${dx},${dy} ${dw}x${dh} cleared=${targetN}px`)
    // Record rects for the proof below.
    job._old = { ...old }
    job._new = { x0: dx, y0: dy, x1: dx + dw - 1, y1: dy + dh - 1 }
  }
  // PROOF: every pixel differing from pristine must lie inside (old bbox
  // UNION new dst rect) of some job on this sheet. Anything outside is
  // neighbour damage and fails loudly.
  const finalIm = imOf(sheetCv)
  let stray = 0
  let firstStray = null
  for (let y = 0; y < sheetCv.height; y++) {
    for (let x = 0; x < sheetCv.width; x++) {
      const k = (y * sheetCv.width + x) * 4
      const a = pristineIm.data
      if (a[k] === finalIm.data[k] && a[k + 1] === finalIm.data[k + 1] && a[k + 2] === finalIm.data[k + 2] && a[k + 3] === finalIm.data[k + 3]) continue
      const inside = jobs.some((j) => {
        const o = j._old, n = j._new
        return (x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1) || (x >= n.x0 && x <= n.x1 && y >= n.y0 && y <= n.y1)
      })
      if (!inside) {
        stray++
        if (!firstStray) firstStray = [x, y]
      }
    }
  }
  const after = alphaComponents(imOf(sheetCv), 96).filter((c) => c.area >= 200)
  log.push(`  ${sheet}: components>=200px: ${after.length}; out-of-rect diff pixels: ${stray}${firstStray ? ` (first at ${firstStray})` : ''}`)
  if (stray > 0 || after.length !== 9) throw new Error(`${sheet}: splice proof FAILED (stray=${stray}, comps=${after.length})`)
  writeFileSync(sheetPath, sheetCv.toBuffer('image/png'))
}
console.log(log.join('\n'))
console.log('spliced sheets updated; originals in', PREV)
