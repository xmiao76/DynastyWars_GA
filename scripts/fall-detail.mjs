// Isolate rejected fall candidate's middle row for focused weapon repair.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { components } from './prepare-motion.mjs'
const source = await loadImage('art/motion/guanyu/fall-candidate-2-rejected.png')
const cv = createCanvas(source.width, source.height), g = cv.getContext('2d'); g.drawImage(source, 0, 0)
const im = g.getImageData(0, 0, cv.width, cv.height)
const cs = components(im).sort((a, b) => b.area - a.area).slice(0, 9).sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1))
const middle = cs.slice(3, 6).sort((a, b) => a.x0 - b.x0)
mkdirSync('art/motion/guanyu/details', { recursive: true })
for (const [i, c] of middle.entries()) {
  const crop = createCanvas(512, 512), ctx = crop.getContext('2d')
  // Keep the original 512px source scale and a generous centred border.
  const sx = i * 512, sy = 390
  ctx.drawImage(source, sx, sy, 512, 430, 0, 40, 512, 430)
  writeFileSync(`art/motion/guanyu/details/fall-${i + 3}-repair-reference.png`, crop.toBuffer('image/png'))
  console.log(i + 3, c.x0, c.y0, c.x1, c.y1)
}
