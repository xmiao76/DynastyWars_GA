import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
// Highlight residual "holes" (transparent inside a row's painted span) in
// red on the cell, for diagnosis of the BODY-23 re-key.
const [pack, id, ...parts] = process.argv.slice(2)
const prep = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
const img = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
const S = 3
let W = 0
let H = 0
for (const part of parts) {
  const c = prep[id].parts[part]
  W = Math.max(W, c.w * S + 10)
  H += c.h * S + 24
}
const out = createCanvas(W, H)
const g = out.getContext('2d')
g.fillStyle = '#6a6470'
g.fillRect(0, 0, out.width, out.height)
g.font = '13px sans-serif'
let oy = 0
for (const part of parts) {
  const c = prep[id].parts[part]
  const cv = createCanvas(c.w, c.h)
  const cx = cv.getContext('2d')
  cx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
  const px = cx.getImageData(0, 0, c.w, c.h)
  const d = px.data
  let holes = 0
  for (let y = 0; y < c.h; y += 1) {
    let a = -1
    let z = -1
    for (let x = 0; x < c.w; x += 1) if ((d[(y * c.w + x) * 4 + 3] ?? 0) > 200) { if (a < 0) a = x; z = x }
    if (a < 0) continue
    for (let x = a; x <= z; x += 1) {
      const p = (y * c.w + x) * 4
      if ((d[p + 3] ?? 0) <= 200) {
        d[p] = 255; d[p + 1] = 0; d[p + 2] = 0; d[p + 3] = 255
        holes += 1
      }
    }
  }
  cx.putImageData(px, 0, 0)
  g.fillStyle = '#fff'
  g.fillText(`${part} holes=${holes}`, 4, oy + 15)
  g.imageSmoothingEnabled = false
  g.drawImage(cv, 0, oy + 20, c.w * S, c.h * S)
  oy += c.h * S + 24
}
writeFileSync(`artifacts/look/diag-holes-${id}.png`, out.toBuffer('image/png'))
console.log('wrote diag-holes-' + id)
