// Retain full-resolution source crops for explicit manual landmark review.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { components } from './prepare-motion.mjs'
const OUT = 'artifacts/wholeframe/motion/landmarks'
mkdirSync(OUT, { recursive: true })
for (const clip of ['walk', 'jab1', 'jab2', 'finisher']) {
  const img = await loadImage(`art/motion/guanyu/${clip}-candidate-1.png`)
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const im = g.getImageData(0, 0, cv.width, cv.height)
  const cs = components(im).sort((a, b) => a.y0 - b.y0)
  const figures = []
  for (let row = 0; row < 3; row++) figures.push(...cs.slice(row * 3, row * 3 + 3).sort((a, b) => a.x0 - b.x0))
  for (const [i, c] of figures.entries()) {
    const crop = createCanvas(512, 380), cg = crop.getContext('2d')
    cg.fillStyle = '#3a3440'; cg.fillRect(0, 0, crop.width, crop.height)
    // Same origin as source grid horizontally, vertically record y0-4.
    const sx = Math.floor(i % 3) * 512, sy = Math.max(0, c.y0 - 4)
    const data = cg.createImageData(512, 370)
    for (let y = 0; y < 370; y++) for (let x = 0; x < 512; x++) {
      const q = (y + sy) * cv.width + x + sx
      if (y + sy >= cv.height || im.data[q * 4 + 3] < 96) continue
      data.data.set(im.data.subarray(q * 4, q * 4 + 4), (y * 512 + x) * 4)
    }
    const foreground = createCanvas(512, 370); foreground.getContext('2d').putImageData(data, 0, 0)
    cg.drawImage(foreground, 0, 0)
    cg.fillStyle = '#ffffff'; cg.font = '12px sans-serif'; cg.fillText(`${clip}:${i} source offset x=${sx} y=${sy}`, 4, 376)
    writeFileSync(`${OUT}/${clip}-${i}.png`, crop.toBuffer('image/png'))
  }
}
