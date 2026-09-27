import { createCanvas, loadImage } from '@napi-rs/canvas'
const f = await loadImage('artifacts/look/ui4-touch-portrait.png')
const c = createCanvas(f.width, f.height); const ctx = c.getContext('2d'); ctx.drawImage(f, 0, 0)
const d = ctx.getImageData(0, 0, f.width, f.height).data
const px = (x, y) => { const p = (y * f.width + x) * 4; return [d[p], d[p+1], d[p+2]] }
const isGold = (r,g,b) => r > 140 && g > 100 && b < 110 && r > b + 60
const isBronze = (r,g,b) => r > 60 && r < 200 && g > 40 && g < 150 && b < 100 && r > b + 25 && r < g + 90
let gold = 0, bronze = 0, minY = 1e9, maxY = -1
for (let y = 300; y < f.height; y++) for (let x = 0; x < f.width; x++) {
  const [r,g,b] = px(x, y)
  if (isGold(r,g,b)) { gold++; if (y<minY) minY=y; if (y>maxY) maxY=y }
  if (isBronze(r,g,b)) bronze++
}
console.log('portrait lower half: gold', gold, 'bronze', bronze, 'goldY', minY, maxY, 'size', f.width, f.height)
// Also dump where the canvas region is: find rows containing green HP pixels
const isGreen = (r,g,b) => g > 110 && g > r + 30 && g > b + 30
let firstGreen = -1
for (let y = 0; y < f.height && firstGreen < 0; y++) { let n=0; for (let x=0;x<f.width;x++){ const [r,g,b]=px(x,y); if(isGreen(r,g,b)) n++ } if (n>30) firstGreen=y }
console.log('first green HP row:', firstGreen)
