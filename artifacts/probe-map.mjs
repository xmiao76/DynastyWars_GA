import { createCanvas, loadImage } from '@napi-rs/canvas'
const f = await loadImage('artifacts/look/ui4-touch-portrait.png')
const c = createCanvas(f.width, f.height); const ctx = c.getContext('2d'); ctx.drawImage(f, 0, 0)
const d = ctx.getImageData(0, 0, f.width, f.height).data
const px = (x, y) => { const p = (y * f.width + x) * 4; return [d[p], d[p+1], d[p+2]] }
const isGold = (r,g,b) => r > 140 && g > 100 && b < 110 && r > b + 60
const isBronze = (r,g,b) => r > 60 && r < 200 && g > 40 && g < 150 && b < 100 && r > b + 25 && r < g + 90
// cluster map: for each cell of 20px, count gold/bronze in lower canvas area
for (let cy = 360; cy < 620; cy += 20) {
  let row = ''
  for (let cx = 0; cx < 400; cx += 20) {
    let g2 = 0, b2 = 0
    for (let y = cy; y < cy+20; y++) for (let x = cx; x < cx+20; x++) {
      const [r,g,b] = px(x,y); if (isGold(r,g,b)) g2++; if (isBronze(r,g,b)) b2++
    }
    row += g2 > 10 ? 'G' : (b2 > 10 ? 'b' : (g2+b2 > 3 ? '.' : ' '))
  }
  console.log(cy, row)
}
