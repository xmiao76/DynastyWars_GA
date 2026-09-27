import { createCanvas, loadImage } from '@napi-rs/canvas'
const f = await loadImage('artifacts/look/ui4-touch-portrait.png')
const c = createCanvas(f.width, f.height); const ctx = c.getContext('2d'); ctx.drawImage(f, 0, 0)
const d = ctx.getImageData(0, 0, f.width, f.height).data
const px = (x, y) => { const p = (y * f.width + x) * 4; return [d[p], d[p+1], d[p+2]] }
const isGreen = (r,g,b) => g > 110 && g > r + 30 && g > b + 30
for (let y = 380; y < 400; y++) {
  let n = 0
  for (let x = 0; x < f.width; x++) { const [r,g,b] = px(x,y); if (isGreen(r,g,b)) n++ }
  console.log(y, 'green:', n)
}
