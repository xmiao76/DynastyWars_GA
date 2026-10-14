// Focused original-sprite references for weapon-direction continuity repairs.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { components } from './prepare-motion.mjs'
mkdirSync('art/motion/guanyu/details', { recursive: true })
for (const [name, index] of [['special', 1]]) {
  const img = await loadImage(`art/motion/guanyu/${name}-candidate-1.png`)
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  const im = g.getImageData(0, 0, cv.width, cv.height)
  const sorted = components(im).sort((a, b) => b.area - a.area).slice(0, 9).sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1))
  const row = Math.floor(index / 3), figure = sorted.slice(row * 3, row * 3 + 3).sort((a, b) => a.x0 - b.x0)[index % 3]
  const pad = 8, x0 = figure.x0 - pad, y0 = figure.y0 - pad
  const w = figure.x1 - figure.x0 + 1 + 2 * pad, h = figure.y1 - figure.y0 + 1 + 2 * pad
  const foreground = createCanvas(w, h), fg = foreground.getContext('2d'), data = fg.createImageData(w, h)
  const support = new Set()
  for (const p of figure.pixels) {
    const x = p % cv.width, y = Math.floor(p / cv.width)
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) {
      if (x + xx >= 0 && x + xx < cv.width && y + yy >= 0 && y + yy < cv.height) support.add((y + yy) * cv.width + x + xx)
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y + y0) * cv.width + x + x0
    if (support.has(p)) data.data.set(im.data.subarray(p * 4, p * 4 + 4), (y * w + x) * 4)
  }
  fg.putImageData(data, 0, 0)
  const dst = createCanvas(512, 512), dg = dst.getContext('2d')
  const dx = (512 - w) / 2, dy = (512 - h) / 2
  dg.drawImage(foreground, dx, dy)
  writeFileSync(`art/motion/guanyu/details/${name}-${index}-repair-reference.png`, dst.toBuffer('image/png'))
  console.log(name, index, { sourceX: x0, sourceY: y0, w, h, dx, dy })
}
