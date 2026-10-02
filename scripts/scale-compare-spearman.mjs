#!/usr/bin/env node
// CMR-07A: decisive same-pose scale comparison across sheets.
//
//   node scripts/scale-compare-spearman.mjs
//
// Guard cells (same standing pose): figure height = helmet-top (first
// opaque row inside the face x-band, which excludes the side-held spear)
// to boot-bottom (last opaque row in the bbox half OPPOSITE the fitted
// spear axis x, verified programmatically).
// Down cells (same prone pose, fall-thrown:3 vs getup-death:3-source):
// body length along the fitted spear axis using pixels on the body side
// (8..120px off-axis; the spear itself excluded), so spear pixels cannot
// inflate the body measurement. Same pose => same foreshortening =>
// the ratio is a valid scale ratio.

import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/spearman'
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  thrust: 'thrust-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-2.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}
const spearLines = Object.fromEntries(
  JSON.parse(readFileSync(`${SRC}/spear-lines.json`, 'utf8')).map((r) => [r.id, r]),
)
const raw = JSON.parse(readFileSync(`${SRC}/measurements-raw.json`, 'utf8'))
const faceRow = Object.fromEntries(raw.rows.filter((r) => r.face).map((r) => [r.id, r]))

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

function figureAt(im, comps, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
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

const opaque = (im, x, y) => x >= 0 && y >= 0 && x < im.width && y < im.height && im.data[(y * im.width + x) * 4 + 3] >= 96

// Guard figure height. Returns null if the geometry checks fail.
function guardHeight(im, box, faceCx, spear) {
  // Helmet top: first opaque row inside the face x-band.
  let top = -1
  for (let y = box.y0; y <= box.y1 && top < 0; y++) {
    for (let x = faceCx - 12; x <= faceCx + 12; x++) {
      if (opaque(im, x, y)) { top = y; break }
    }
  }
  if (top < 0) return null
  // Spear side check: the fitted axis x at mid height must be clearly
  // outside the boot band we are about to use.
  const midX = Math.round((box.x0 + box.x1) / 2)
  const spearLeft = spear.a[0] < midX && spear.b[0] < midX
  const spearRight = spear.a[0] > midX && spear.b[0] > midX
  if (!spearLeft && !spearRight) return null
  const x0 = spearLeft ? midX : box.x0
  const x1 = spearLeft ? box.x1 : midX
  let bottom = -1
  for (let y = box.y1; y >= box.y0 && bottom < 0; y--) {
    for (let x = x0; x <= x1; x++) {
      if (opaque(im, x, y)) { bottom = y; break }
    }
  }
  if (bottom < 0) return null
  return { top, bottom, height: bottom - top + 1, spearSide: spearLeft ? 'left' : 'right' }
}

// Down body length along the spear axis, body-side pixels only.
function downLength(im, box, spear) {
  const [ax, ay] = spear.a
  const [bx, by] = spear.b
  const len = Math.hypot(bx - ax, by - ay)
  const ux = (bx - ax) / len
  const uy = (by - ay) / len
  let plus = 0, minus = 0
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      if (!opaque(im, x, y)) continue
      const perp = (x - ax) * -uy + (y - ay) * ux
      if (Math.abs(perp) < 8 || Math.abs(perp) > 120) continue
      if (perp > 0) plus++
      else minus++
    }
  }
  const side = plus >= minus ? 1 : -1
  let tMin = Infinity, tMax = -Infinity, n = 0
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      if (!opaque(im, x, y)) continue
      const perp = (x - ax) * -uy + (y - ay) * ux
      if (perp * side < 8 || perp * side > 120) continue
      const t = (x - ax) * ux + (y - ay) * uy
      if (t < tMin) tMin = t
      if (t > tMax) tMax = t
      n++
    }
  }
  return n > 500 ? { length: Math.round(tMax - tMin), n, side } : null
}

const guards = [
  ['locomotion', 0],
  ['thrust', 0],
  ['hitstun-held', 0],
  ['getup-death', 8],
]
console.log('GUARD FIGURE HEIGHTS (helmet-top in face band -> boot-bottom in spear-free half):')
const heights = {}
for (const [seq, pos] of guards) {
  const im = await load(`${SRC}/${SHEETS[seq]}`)
  const box = figureAt(im, alphaComponents(im, 96), pos)
  const id = `${seq}:${pos}`
  const face = faceRow[id]
  // Face centroid x in sheet coords: need face box; recompute quickly.
  const { width, data } = im
  let fx0 = Infinity, fx1 = -Infinity
  for (let y = box.y0; y <= Math.min(box.y0 + 200, box.y1); y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const k = (y * width + x) * 4
      const r = data[k], g = data[k + 1], b = data[k + 2], a = data[k + 3]
      if (a >= 200 && r > 105 && r > g + 12 && g > b && b < 170) {
        if (x < fx0) fx0 = x
        if (x > fx1) fx1 = x
      }
    }
  }
  const faceCx = Math.round((fx0 + fx1) / 2)
  const h = guardHeight(im, box, faceCx, spearLines[id])
  heights[seq] = h?.height ?? null
  console.log(`  ${id.padEnd(16)} faceCx=${faceCx} helmetTop=${h?.top} bootBottom=${h?.bottom} height=${h?.height} spearSide=${h?.spearSide} (facePresent=${Boolean(face)})`)
}
const ref = heights.locomotion
const ratios = {}
for (const [seq, h] of Object.entries(heights)) {
  if (h && ref) {
    ratios[seq] = Math.round((ref / h) * 1000) / 1000
    console.log(`  ${seq.padEnd(13)} figure-height ratio vs locomotion: ${ratios[seq].toFixed(3)}`)
  }
}
writeFileSync('art/motion/spearman/scale-compare.json', `${JSON.stringify({ heights, ratios }, null, 2)}\n`)

console.log('DOWN BODY LENGTHS (along-axis extent, body-side pixels only):')
const downs = {}
for (const [seq, pos] of [['fall-thrown', 3], ['getup-death', 3]]) {
  const im = await load(`${SRC}/${SHEETS[seq]}`)
  const box = figureAt(im, alphaComponents(im, 96), pos)
  const d = downLength(im, box, spearLines[`${seq}:${pos}`])
  downs[seq] = d?.length ?? null
  console.log(`  ${seq}:${pos}  length=${d?.length} n=${d?.n} side=${d?.side}`)
}
if (downs['fall-thrown'] && downs['getup-death']) {
  console.log(`  fall/getup down-length ratio: ${(downs['fall-thrown'] / downs['getup-death']).toFixed(3)}`)
}
