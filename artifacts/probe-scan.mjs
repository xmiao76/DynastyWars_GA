import { createCanvas, loadImage } from '@napi-rs/canvas'
const img = await loadImage('artifacts/look/ui4-touch-portrait.png')
const c = createCanvas(img.width, img.height); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
const f = { data: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height }
const px = (f, x, y) => { const p = (Math.round(y) * f.w + Math.round(x)) * 4; return [f.data[p], f.data[p+1], f.data[p+2]] }
const isBronze = (r,g,b) => r > 60 && r < 200 && g > 40 && g < 150 && b < 100 && r > b + 25 && r < g + 90
const s = f.w / 480, oy = 373.7
let n = 0, tot = 0
for (let yy = Math.round(oy + 202 * s); yy < Math.round(oy + 246 * s); yy += 1) {
  for (let xx = Math.round(0 + 24 * s); xx < Math.round(0 + 68 * s); xx += 1) {
    const [r,g,b] = px(f, xx, yy); tot++
    if (isBronze(r,g,b)) n++
  }
}
console.log('bronze', n, 'of', tot, 'window y', Math.round(oy+202*s), '-', Math.round(oy+246*s), 'x', Math.round(24*s), '-', Math.round(68*s))
