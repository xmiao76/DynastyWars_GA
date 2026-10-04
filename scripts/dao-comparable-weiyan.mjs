#!/usr/bin/env node
// CMR-11A acceptance-4: comparable-set classification for the dao-length
// item. Exclusion grounds are GEOMETRIC and independent of the measured
// length (the 08A rule - no value-based cherry-picking), per
// docs/MOTION_ACCEPTANCE4_RECOVERY.md "foreshortened/occluded blades are
// excluded from the comparable set, never counted as passes":
//   guard   - bronze guard pixels near the blade base (>= half the walk
//             median: the guard is the base fitting; if it is hidden the
//             base end is not observable)
//   tipFree - nothing but empty space (or steel) within 36px beyond the
//             steel tip along the axis; a body pixel there means the tip
//             may be hidden behind the body
// Only guard + tipFree are EXCLUSION grounds (occlusion). Blade WIDTH is
// reported as a DESIGN-CONSISTENCY indicator, never an exclusion: the
// rotated-blade crops (artifacts, fingerprinted read) show every blade
// lying IN the image plane with the guard edge-on, so a wider blade is a
// differently drawn blade (source-art drift), not a foreshortened one.
// Excluding it would pass the item by exclusion - the cherry-picking the
// recovery protocol forbids. widthDrift flags |width/walk median - 1| > 25%.
// COMPARABLE = measured and not occlusion-excluded.
// Reads art/motion/weiyan/dao-true.json (written by dao-true-weiyan.mjs),
// writes dao-comparable.json.
import { loadImage, createCanvas } from '@napi-rs/canvas'
import { readFileSync, writeFileSync } from 'node:fs'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/weiyan/'
const SHEETS = {
  walk: 'walk-candidate-1.png', jab1: 'jab1-candidate-1.png', jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png', jump: 'jump-candidate-1.png', fall: 'fall-candidate-1.png',
  getup: 'getup-candidate-1.png', misc: 'misc-candidate-1.png', special: 'special-candidate-1.png',
  rider: 'rider-candidate-1.png',
}
const rows = JSON.parse(readFileSync(`${SRC}dao-true.json`, 'utf8'))

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: mx ? d / mx : 0, v: mx / 255 }
}
const isSteel = (r, g, b) => Math.max(r, g, b) > 105 && Math.max(r, g, b) - Math.min(r, g, b) < 40
const isBronze = (r, g, b) => { const { h, s, v } = hsv(r, g, b); return h >= 28 && h <= 52 && s > 0.38 && v > 0.45 && r > 120 }

const sheets = {}
for (const [seq, file] of Object.entries(SHEETS)) {
  const img = await loadImage(SRC + file)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  const im = { width: d.width, height: d.height, data: d.data }
  const cw = Math.floor(im.width / 3), ch = Math.floor(im.height / 3)
  const byCell = new Map()
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cw)), cy = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / ch))
    const k = cy * 3 + cx
    if (!byCell.has(k) || c.area > byCell.get(k).area) byCell.set(k, c)
  }
  sheets[seq] = { im, byCell }
}

for (const r of rows) {
  if (r.blade === null || !r.tip || !r.base) { r.guardPx = null; r.tipFree = null; r.widthPx = null; continue }
  const { im, byCell } = sheets[r.seq]
  const inset = new Set(byCell.get(r.cell).pixels)
  const L = Math.hypot(r.tip[0] - r.base[0], r.tip[1] - r.base[1])
  const ux = (r.tip[0] - r.base[0]) / L, uy = (r.tip[1] - r.base[1]) / L
  // guard: bronze pixels within 22px of the base point
  let guardPx = 0
  for (let dy = -22; dy <= 22; dy += 2) for (let dx = -22; dx <= 22; dx += 2) {
    const x = r.base[0] + dx, y = r.base[1] + dy
    const p = y * im.width + x
    if (x < 0 || y < 0 || x >= im.width || y >= im.height || !inset.has(p)) continue
    const k = p * 4
    if (isBronze(im.data[k], im.data[k + 1], im.data[k + 2])) guardPx++
  }
  // tip-adjacent body: opaque NON-steel mask pixels 6..36px beyond the tip along the axis, +/-8px lateral
  let bodyBeyond = 0
  for (let t = 6; t <= 36; t += 2) for (let o = -8; o <= 8; o += 2) {
    const x = Math.round(r.tip[0] + t * ux - o * uy), y = Math.round(r.tip[1] + t * uy + o * ux)
    const p = y * im.width + x
    if (x < 0 || y < 0 || x >= im.width || y >= im.height || !inset.has(p)) continue
    const k = p * 4
    if (!isSteel(im.data[k], im.data[k + 1], im.data[k + 2])) bodyBeyond++
  }
  r.guardPx = guardPx
  r.tipBodyBeyond = bodyBeyond
  r.tipFree = bodyBeyond === 0
  r.widthPx = Math.round((r.steelPx / r.blade) * 10) / 10
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const walk = rows.filter((r) => r.seq === 'walk' && r.guardPx !== null)
const guardRef = median(walk.map((r) => r.guardPx))
const widthRef = median(walk.map((r) => r.widthPx))
const guardMin = guardRef * 0.5
for (const r of rows) {
  if (r.guardPx === null) { r.class = 'UNVERIFIED (blade unmeasurable)'; continue }
  const why = []
  if (r.guardPx < guardMin) why.push(`guard hidden (${r.guardPx} < ${guardMin.toFixed(0)})`)
  if (!r.tipFree) why.push(`body beyond tip (${r.tipBodyBeyond})`)
  r.widthDrift = r.widthPx < widthRef * 0.75 || r.widthPx > widthRef * 1.25
  r.class = why.length ? `EXCLUDED (occlusion): ${why.join('; ')}` : 'COMPARABLE'
}
const full = rows.filter((r) => r.class === 'COMPARABLE' && r.bladeDisp !== null)
const bySeq = {}
for (const r of rows) (bySeq[r.seq] ??= { full: 0, excl: 0, unv: 0 })[r.class === 'COMPARABLE' ? 'full' : r.class.startsWith('EXCL') ? 'excl' : 'unv']++
const vals = full.map((r) => r.bladeDisp)
const mean = vals.reduce((a, b) => a + b, 0) / vals.length
const spreadPct = Math.round((1000 * (Math.max(...vals) - Math.min(...vals))) / mean) / 10
writeFileSync(`${SRC}dao-comparable.json`, `${JSON.stringify({
  grounds: { guardRefWalkMedian: guardRef, guardMin, widthRefWalkMedian: widthRef, widthBand: [0.75, 1.25] },
  full: { n: full.length, ids: full.map((r) => r.id), min: Math.min(...vals), max: Math.max(...vals), spreadPct },
  bySequence: bySeq,
  cells: rows.map(({ id, class: c, guardPx, tipBodyBeyond, widthPx, widthDrift, bladeDisp }) => ({ id, class: c, guardPx, tipBodyBeyond, widthPx, widthDrift, bladeDisp })),
}, null, 2)}\n`)
console.log(`refs: guard walk-median ${guardRef} (min ${guardMin}), width walk-median ${widthRef}`)
for (const r of rows) console.log(`${r.id.padEnd(11)} blade=${String(r.bladeDisp ?? '-').padStart(6)} guard=${String(r.guardPx ?? '-').padStart(3)} tipBody=${String(r.tipBodyBeyond ?? '-').padStart(3)} width=${String(r.widthPx ?? '-').padStart(5)}${r.widthDrift ? ' DRIFT' : '      '} ${r.class}`)
const drift = rows.filter((r) => r.widthDrift)
console.log(`\nwidth drift (design indicator, not an exclusion): ${drift.length}/${rows.filter((r) => r.widthPx !== null).length} cells`)
console.log('\nPER SEQUENCE (full / excluded / unverified):', JSON.stringify(bySeq))
console.log(`COMPARABLE set: n=${full.length}  min ${Math.min(...vals)}  max ${Math.max(...vals)}  spread ${spreadPct}%`)
