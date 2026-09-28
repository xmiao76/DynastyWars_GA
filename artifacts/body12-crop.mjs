import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync, writeFileSync } from 'node:fs'

// Scratch: 8x hand-cell crop for the UIR-12 eyes-on check.
const [pack, id] = process.argv.slice(2)
const meta = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
const parts = ['gripN', 'gripF', 'relaxN', 'relaxF', 'wrapF']
const sheet = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
const Z = 8
let W = 0
let H = 0
for (const name of parts) {
  const c = meta[id].parts[name]
  W = Math.max(W, c.w * Z)
  H += c.h * Z + 22
}
const out = createCanvas(W, H)
const g = out.getContext('2d')
g.fillStyle = '#3a3440'
g.fillRect(0, 0, W, H)
g.font = '16px sans-serif'
let oy = 0
for (const name of parts) {
  const c = meta[id].parts[name]
  const cv = createCanvas(c.w, c.h)
  cv.getContext('2d').drawImage(sheet, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
  g.fillStyle = '#f5e6c8'
  g.fillText(`${id} ${name}`, 6, oy + 17)
  g.imageSmoothingEnabled = false
  g.drawImage(cv, 0, oy + 20, c.w * Z, c.h * Z)
  oy += c.h * Z + 22
}
writeFileSync(`artifacts/body12-hands-${id}.png`, out.toBuffer('image/png'))
console.log('wrote', `artifacts/body12-hands-${id}.png`)
