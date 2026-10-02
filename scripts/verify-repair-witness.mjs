#!/usr/bin/env node
// CMR-07A repair verification: witness guard figure height (helmet-top in
// face band -> boot-bottom in spear-free half) vs the 317px locomotion
// reference. A repair sheet is REJECTED if its witness is off-scale.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const REF = 317
const SHEETS = {
  'repair-A': 'art/motion/spearman/fall-thrown-repair-candidate-1.png',
  'repair-B': 'art/motion/spearman/mixed-repair-candidate-1.png',
}

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}
const opaque = (im, x, y) => x >= 0 && y >= 0 && x < im.width && y < im.height && im.data[(y * im.width + x) * 4 + 3] >= 96

for (const [name, path] of Object.entries(SHEETS)) {
  const im = await load(path)
  const cw = Math.floor(im.width / 3)
  const ch = Math.floor(im.height / 3)
  let box = null
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cw)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / ch)
    if (cx === 0 && cy === 0 && (box === null || c.area > box.area)) box = c
  }
  // Face x-band from skin pixels in the upper half of the figure.
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
  // Spear side: RANSAC-free heuristic - the vertical wood line; boot band
  // is the bbox half with the FEWER opaque pixels in its bottom strip.
  const midX = Math.round((box.x0 + box.x1) / 2)
  // Boot bottom: min over both halves. Boots sit in both halves (feet
  // together); a spear butt below the soles contaminates at most one half,
  // so the min is the soles.
  const halfBottom = (x0, x1) => {
    for (let y = box.y1; y >= box.y0; y--) {
      for (let x = x0; x <= x1; x++) {
        if (opaque(im, x, y)) return y
      }
    }
    return -1
  }
  const bottom = Math.min(halfBottom(box.x0, midX), halfBottom(midX + 1, box.x1))
  const h = bottom - top + 1
  const verdict = Math.abs(h - REF) / REF <= 0.05 ? 'ACCEPT (within 5%)' : 'REJECT (off-scale)'
  console.log(`${name}: witness height=${h} (ref ${REF}, ${(100 * (h - REF) / REF).toFixed(1)}%) => ${verdict}`)
}
