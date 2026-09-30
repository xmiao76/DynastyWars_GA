// Contact sheets from the PREPARED drawings and from ACTUAL recorded frames.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const OUT = 'artifacts/wholeframe/motion'
mkdirSync(OUT, { recursive: true })
const atlas = await loadImage('src/game/assets/motion/guanyu-motion-sheet.png')
const cv = createCanvas(1344, 3552), g = cv.getContext('2d')
g.fillStyle = '#3a3440'; g.fillRect(0, 0, cv.width, cv.height)
for (let row = 0; row < 12; row++) {
  g.drawImage(atlas, 0, row * 288, 1344, 288, 0, row * 296 + 8, 1344, 288)
  for (let col = 0; col < 3; col++) {
    g.fillStyle = '#a0ffb4'; g.font = '12px sans-serif'
    g.fillText(`${['walk', 'jab1', 'jab2', 'finisher'][Math.floor(row / 3)]}:${row % 3 * 3 + col}`, col * 448 + 4, row * 296 + 18)
  }
}
writeFileSync(`${OUT}/drawings-contact.png`, cv.toBuffer('image/png'))

for (const variant of ['motion', 'current']) {
  const files = readdirSync(`${OUT}/video-frames`).filter((p) => p.startsWith(`${variant}-`)).sort()
  // The last ~7 sec contain the measured input sequence; sample every 4
  // extracted 15Hz frames (~0.267sec). No animation is invented here.
  const selected = files.slice(Math.max(0, files.length - 112)).filter((_p, i) => i % 4 === 0)
  const c = createCanvas(4 * 480, Math.ceil(selected.length / 4) * 294), ctx = c.getContext('2d')
  ctx.fillStyle = '#191820'; ctx.fillRect(0, 0, c.width, c.height)
  for (const [i, file] of selected.entries()) {
    const img = await loadImage(`${OUT}/video-frames/${file}`)
    const x = i % 4 * 480, y = Math.floor(i / 4) * 294
    ctx.fillStyle = '#ffffff'; ctx.font = '14px sans-serif'; ctx.fillText(file, x + 4, y + 18)
    ctx.drawImage(img, x, y + 24)
  }
  writeFileSync(`${OUT}/${variant}-recording-contact.png`, c.toBuffer('image/png'))
}
