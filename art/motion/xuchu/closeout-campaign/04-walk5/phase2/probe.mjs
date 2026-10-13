// Probe zooms for landmark reading (zero generation). Candidate is opaque 1024 JPEG.
import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/phase2/'
const img = await loadImage(dir + 'candidate-raw.jpg')
function zoom(x, y, w, h, s, out, grid) {
  const cv = createCanvas(w * s, h * s); const g = cv.getContext('2d')
  g.imageSmoothingEnabled = false; g.drawImage(img, x, y, w, h, 0, 0, w * s, h * s)
  if (grid) { g.strokeStyle = 'rgba(0,255,128,0.5)'; g.fillStyle = '#00ff80'; g.font = `${6 * s}px sans-serif`; for (let gy = Math.ceil(y / 20) * 20; gy < y + h; gy += 20) { g.beginPath(); g.moveTo(0, (gy - y) * s); g.lineTo(w * s, (gy - y) * s); g.stroke(); g.fillText(String(gy), 2, (gy - y) * s - 2) } for (let gx = Math.ceil(x / 50) * 50; gx < x + w; gx += 50) { g.beginPath(); g.moveTo((gx - x) * s, 0); g.lineTo((gx - x) * s, h * s); g.stroke(); g.fillText(String(gx), (gx - x) * s + 2, 12 * s) } }
  writeFileSync(dir + out, cv.toBuffer('image/png'))
}
zoom(300, 40, 400, 400, 3, 'probe-head-zoom.png', true)
zoom(80, 560, 760, 464, 2, 'probe-legs-zoom.png', true)
zoom(0, 540, 320, 240, 3, 'probe-butt-zoom.png', true)
zoom(680, 60, 344, 360, 3, 'probe-tip-zoom.png', true)
zoom(80, 760, 700, 264, 3, 'probe-soles-zoom.png', true)
zoom(0, 0, 1024, 1024, 1, 'probe-full-grid.png', true)
console.log('probe zooms written')
