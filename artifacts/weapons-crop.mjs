import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
// Crop each weapon cell + the tassel at 2x on dark for review.
const prep = JSON.parse(readFileSync('src/game/assets/weapons/prepared.json', 'utf8'))
const img = await loadImage('src/game/assets/weapons/weapons-sheet.png')
const names = Object.keys(prep.weapons.parts)
const S = 2
let W = 0
let H = 0
const rects = {}
for (const n of names) {
  const c = prep.weapons.parts[n]
  rects[n] = c
  W = Math.max(W, c.w * S)
  H += c.h * S + 26
}
const out = createCanvas(W + 10, H)
const g = out.getContext('2d')
g.fillStyle = '#232028'
g.fillRect(0, 0, out.width, out.height)
g.font = '13px sans-serif'
let y = 0
for (const n of names) {
  const c = rects[n]
  g.fillStyle = '#f5e6c8'
  g.fillText(n, 5, y + 15)
  g.imageSmoothingEnabled = true
  g.drawImage(img, c.x, c.y, c.w, c.h, 5, y + 20, c.w * S, c.h * S)
  // Grip marker: butt origin tick.
  g.fillStyle = '#00ff00'
  g.fillRect(5 + (c.originX - c.x) * S - 1, y + 20, 2, c.h * S)
  y += c.h * S + 26
}
writeFileSync('artifacts/look/diag-weapons-a.png', out.toBuffer('image/png'))
console.log('wrote', out.width + 'x' + out.height)
