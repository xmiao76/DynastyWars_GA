#!/usr/bin/env node
// CMR-07A recovery round 2: contact strip of round-1's SHORT repairs
// (r1:2/r1:3/r1:4/r1:5 came back 274-292, under-band) as the lower-bound
// contrastive reference. No text labels (generator reference).
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const CELLS = [
  ['r1', 'art/motion/spearman/acceptance4-round1-candidate-1.png', 2],
  ['r1', 'art/motion/spearman/acceptance4-round1-candidate-1.png', 3],
  ['r1', 'art/motion/spearman/acceptance4-round1-candidate-1.png', 4],
  ['r1', 'art/motion/spearman/acceptance4-round1-candidate-1.png', 5],
]
const crops = []
for (const [seq, file, pos] of CELLS) {
  const img = await loadImage(file)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  const im = { width: d.width, height: d.height, data: d.data }
  const cw = Math.floor(im.width / 3)
  const ch = Math.floor(im.height / 3)
  let box = null
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cw)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / ch)
    if (cx === pos % 3 && cy === Math.floor(pos / 3) && (box === null || c.area > box.area)) box = c
  }
  crops.push({ seq, pos, cv, box })
}
const PAD = 12
const widths = crops.map((c) => c.box.x1 - c.box.x0 + 1 + 2 * PAD)
const height = Math.max(...crops.map((c) => c.box.y1 - c.box.y0 + 1)) + 2 * PAD
const sheet = createCanvas(widths.reduce((a, b) => a + b, 0) + 30, height)
const g = sheet.getContext('2d')
g.fillStyle = '#201c28'
g.fillRect(0, 0, sheet.width, sheet.height)
let ox = 6
crops.forEach((c) => {
  const w = c.box.x1 - c.box.x0 + 1
  const h = c.box.y1 - c.box.y0 + 1
  g.drawImage(c.cv, c.box.x0, c.box.y0, w, h, ox + PAD, PAD, w, h)
  ox += w + 2 * PAD + 6
})
const { writeFileSync, mkdirSync } = await import('node:fs')
mkdirSync('artifacts/motion/spearman/landmarks', { recursive: true })
writeFileSync('artifacts/motion/spearman/landmarks/short-strip-r1.png', sheet.toBuffer('image/png'))
console.log('wrote short-strip-r1.png', sheet.width + 'x' + sheet.height)
