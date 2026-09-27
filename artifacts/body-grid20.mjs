import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'

const id = process.argv[2] ?? 'zhangfei'
const file = process.argv[3] ?? `art/fighter-bodies/${id}-body-master.jpg`
const img = await loadImage(file)
const c = createCanvas(img.width, img.height)
const ctx = c.getContext('2d')
ctx.drawImage(img, 0, 0)
// Figure bbox via corner flood.
const d = ctx.getImageData(0, 0, img.width, img.height).data
const W = img.width
const H = img.height
const lum = (x, y) => {
  const p = (y * W + x) * 4
  return (d[p] + d[p + 1] + d[p + 2]) / 3
}
const seen = new Uint8Array(W * H)
const stack = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]
while (stack.length > 0) {
  const [x, y] = stack.pop()
  if (x < 0 || y < 0 || x >= W || y >= H) continue
  const i = y * W + x
  if (seen[i]) continue
  if (lum(x, y) > 18) continue
  seen[i] = 1
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
}
let x0 = W
let y0 = H
let x1 = 0
let y1 = 0
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (seen[y * W + x]) continue
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
}
console.log(`bbox x:${x0}..${x1} y:${y0}..${y1} (${(((x1 - x0) / W) * 100).toFixed(0)}%w x ${(((y1 - y0) / H) * 100).toFixed(0)}%h)`)
ctx.strokeStyle = 'rgba(0,255,0,0.9)'
ctx.lineWidth = 3
ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
ctx.strokeStyle = 'rgba(0,255,255,0.7)'
ctx.lineWidth = 1.5
ctx.fillStyle = 'rgba(0,255,255,0.9)'
ctx.font = `${Math.round(H / 50)}px sans-serif`
for (let i = 1; i < 20; i += 1) {
  const x = Math.round((W * i) / 20)
  const y = Math.round((H * i) / 20)
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, H)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(W, y)
  ctx.stroke()
  ctx.fillText(`${i * 5}`, x + 3, 20)
  ctx.fillText(`${i * 5}`, 3, y - 4)
}
writeFileSync(`artifacts/body-grid20-${id}.jpg`, c.toBuffer('image/jpeg', 88))
console.log('wrote', `artifacts/body-grid20-${id}.jpg`)
