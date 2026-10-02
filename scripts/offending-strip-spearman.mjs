#!/usr/bin/env node
// CMR-07A recovery round 1: contact strip of the 4 convicted residual cells
// (offending sources for the repair request's contrastive reference).
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const CELLS = [
  ['fall-thrown', 'art/motion/spearman/fall-thrown-candidate-1.png', 7],
  ['getup-death', 'art/motion/spearman/getup-death-candidate-1.png', 0],
  ['getup-death', 'art/motion/spearman/getup-death-candidate-1.png', 1],
  ['getup-death', 'art/motion/spearman/getup-death-candidate-1.png', 7],
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
crops.forEach((c, i) => {
  const w = c.box.x1 - c.box.x0 + 1
  const h = c.box.y1 - c.box.y0 + 1
  g.drawImage(c.cv, c.box.x0, c.box.y0, w, h, ox + PAD, PAD, w, h)
  // NOTE: no text labels - this strip is a generator reference and burned-in
  // text risks being copied into the output. Order left to right is
  // fall-thrown:7, getup-death:0, getup-death:1, getup-death:7 (see the
  // -labeled records copy and the prompt).
  ox += widths[i] + 6
})
const { writeFileSync, mkdirSync } = await import('node:fs')
mkdirSync('artifacts/motion/spearman/landmarks', { recursive: true })
writeFileSync('artifacts/motion/spearman/landmarks/offending-strip-r1.png', sheet.toBuffer('image/png'))
console.log('wrote offending-strip-r1.png', sheet.width + 'x' + sheet.height)
