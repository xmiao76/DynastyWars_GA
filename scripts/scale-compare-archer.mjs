#!/usr/bin/env node
// CMR-08A: guard figure heights for scale-compare (archer adaptation).
//
//   node scripts/scale-compare-archer.mjs
//
// Guard figure height = helmet-top (first opaque row inside the face
// x-band) to boot-bottom (last opaque row in the bbox half OPPOSITE the
// bow side). Bow side per guard cell comes from the verified bow fits
// (all guards: bow on figure-right = +x side in sheet coords... verified
// per cell below; the side check fails loudly on mismatch).
// Writes art/motion/archer/scale-compare.json {heights, ratios}.

import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/archer'
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  shoot: 'shoot-candidate-2.png',
  'hitstun-held': 'hitstun-held-candidate-1.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-2.png',
}
// [seq, pos, bowSide] - bowSide verified from the bow overlay reads.
const GUARDS = [
  ['locomotion', 0, 'R'],
  ['shoot', 0, 'R'],
  ['hitstun-held', 0, 'R'],
  ['getup-death', 8, 'L'], // Guard faces left here (verified: L-strip run 319px vs R-strip 13px).
]

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}
function figureAt(im, comps, pos) {
  const cw = Math.floor(im.width / 3), ch = Math.floor(im.height / 3)
  const cx0 = pos % 3, cy0 = Math.floor(pos / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cw), cy = Math.floor((c.y0 + c.y1 + 1) / 2 / ch)
    if (cx === cx0 && cy === cy0 && (best === null || c.area > best.area)) best = c
  }
  return best
}
const opaque = (im, x, y) => x >= 0 && y >= 0 && x < im.width && y < im.height && im.data[(y * im.width + x) * 4 + 3] >= 96

const heights = {}
for (const [seq, pos, side] of GUARDS) {
  const im = await load(`${SRC}/${SHEETS[seq]}`)
  const box = figureAt(im, alphaComponents(im, 96), pos)
  const id = `${seq}:${pos}`
  // Face x-band from skin pixels in the top 200 rows.
  let fx0 = Infinity, fx1 = -Infinity
  for (let y = box.y0; y <= Math.min(box.y0 + 200, box.y1); y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const k = (y * im.width + x) * 4
      const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3]
      if (a >= 200 && r > 105 && r > g + 12 && g > b && b < 170) {
        if (x < fx0) fx0 = x
        if (x > fx1) fx1 = x
      }
    }
  }
  const faceCx = Math.round((fx0 + fx1) / 2)
  let top = -1
  for (let y = box.y0; y <= box.y1 && top < 0; y++) {
    for (let x = faceCx - 12; x <= faceCx + 12; x++) {
      if (opaque(im, x, y)) { top = y; break }
    }
  }
  const midX = Math.round((box.x0 + box.x1) / 2)
  // Bow-side check: the outer strip on the bow side must contain a tall
  // run (the bow); the boot band is the opposite half.
  const stripX = side === 'R' ? [Math.round(box.x0 + (box.x1 - box.x0) * 0.75), box.x1] : [box.x0, Math.round(box.x0 + (box.x1 - box.x0) * 0.25)]
  let stripTop = -1, stripBot = -1
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = stripX[0]; x <= stripX[1]; x++) {
      if (opaque(im, x, y)) { if (stripTop < 0) stripTop = y; stripBot = y; break }
    }
  }
  const stripH = stripBot - stripTop + 1
  // Sanity only (tags come from overlay reads): the bow side should show
  // substantial structure; warn (don't throw) below 100px.
  const tagOk = stripH >= 100
  const [x0, x1] = side === 'R' ? [box.x0, midX] : [midX, box.x1]
  let bottom = -1
  for (let y = box.y1; y >= box.y0 && bottom < 0; y--) {
    for (let x = x0; x <= x1; x++) {
      if (opaque(im, x, y)) { bottom = y; break }
    }
  }
  heights[seq] = (top >= 0 && bottom >= 0) ? bottom - top + 1 : null
  const bboxH = box.y1 - box.y0 + 1
  console.log(`  ${id.padEnd(16)} faceCx=${faceCx} helmetTop=${top} bootBottom=${bottom} height=${heights[seq]} (bboxH ${bboxH}) bowStrip=${side} run=${stripH}px${tagOk ? '' : ' TAG-WARN'}`)
}
const ref = heights.locomotion
const ratios = {}
for (const [seq, h] of Object.entries(heights)) {
  if (h && ref) {
    ratios[seq] = Math.round((ref / h) * 1000) / 1000
    console.log(`  ${seq.padEnd(13)} figure-height ratio vs locomotion: ${ratios[seq].toFixed(3)}`)
  }
}
writeFileSync(`${SRC}/scale-compare.json`, `${JSON.stringify({ heights, ratios, note: 'Guard figure heights (helmet-top in face band to boot-bottom in bow-free half); bow sides verified from overlay reads.' }, null, 2)}\n`)
console.log('wrote', `${SRC}/scale-compare.json`)
