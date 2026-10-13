// Probe zooms + alpha raster bounds for landmark reading (zero generation). Candidate is 1254x1254 transparent PNG.
import { writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/gpt-attempt/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const buf = readFileSync(dir + 'candidate-raw.png')
if (sha(buf) !== '1bc806bbd4eb977e4581811c4b41aaf33c9db4b7078b5d627a30a04d37a1e4ce') throw new Error('candidate SHA mismatch ' + sha(buf))
const img = await loadImage(dir + 'candidate-raw.png')
const N = 1254
const cv = createCanvas(N, N); const g = cv.getContext('2d'); g.drawImage(img, 0, 0)
const d = g.getImageData(0, 0, N, N).data
const A = (x, y) => d[(y * N + x) * 4 + 3]
let xmin = N, xmax = -1, ymin = N, ymax = -1, green = 0, magenta = 0, alphaPx = 0, edgeOpaque = 0
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const i = (y * N + x) * 4, a = d[i + 3]
  if (a >= 16) { alphaPx++; if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; if (x === 0 || y === 0 || x === N - 1 || y === N - 1) edgeOpaque++ }
  if (a >= 128 && d[i + 1] > 150 && d[i] < 120 && d[i + 2] < 120) green++
  if (a >= 128 && d[i] > 180 && d[i + 2] > 180 && d[i + 1] < 120) magenta++
}
// crown: topmost alpha within head column band x 450..800; soles: bottommost alpha per boot x-band
function topIn(x0, x1) { for (let y = 0; y < N; y++) for (let x = x0; x <= x1; x++) if (A(x, y) >= 16) return y; return -1 }
function botIn(x0, x1, yMin = 800) { let b = -1; for (let y = yMin; y < N; y++) for (let x = x0; x <= x1; x++) if (A(x, y) >= 16) b = y; return b }
function colBot(x, yMin = 900) { let b = -1; for (let y = yMin; y < N; y++) if (A(x, y) >= 16) b = y; return b }
const raster = {
  candidateSha256: sha(buf), size: [N, N], alphaBounds: { xmin, xmax, ymin, ymax }, alphaPx, edgeOpaquePx: edgeOpaque, greenPx: green, magentaPx: magenta,
  crownY_headBand450_800: topIn(450, 800),
  soleBottom_rearBootBand250_500: botIn(250, 500), soleBottom_frontBootBand750_1100: botIn(750, 1100),
  soleProfileEvery25pxFrom250to1100: Array.from({ length: 35 }, (_, i) => { const x = 250 + i * 25; return [x, colBot(x)] }),
}
writeFileSync(dir + 'probe-raster.json', JSON.stringify(raster, null, 2) + '\n')
console.log(JSON.stringify(raster, null, 1))
function zoom(x, y, w, h, s, out, grid) {
  const c = createCanvas(w * s, h * s); const q = c.getContext('2d')
  q.fillStyle = '#3a3a3a'; q.fillRect(0, 0, w * s, h * s)
  q.imageSmoothingEnabled = false; q.drawImage(img, x, y, w, h, 0, 0, w * s, h * s)
  if (grid) { q.strokeStyle = 'rgba(0,255,128,0.5)'; q.fillStyle = '#00ff80'; q.font = `${6 * s}px sans-serif`; for (let gy = Math.ceil(y / 25) * 25; gy < y + h; gy += 25) { q.beginPath(); q.moveTo(0, (gy - y) * s); q.lineTo(w * s, (gy - y) * s); q.stroke(); q.fillText(String(gy), 2, (gy - y) * s - 2) } for (let gx = Math.ceil(x / 50) * 50; gx < x + w; gx += 50) { q.beginPath(); q.moveTo((gx - x) * s, 0); q.lineTo((gx - x) * s, h * s); q.stroke(); q.fillText(String(gx), (gx - x) * s + 2, 12 * s) } }
  writeFileSync(dir + out, c.toBuffer('image/png'))
}
zoom(400, 50, 500, 450, 2, 'probe-head-zoom.png', true)
zoom(200, 600, 950, 654, 1, 'probe-legs-zoom.png', true)
zoom(0, 600, 450, 350, 2, 'probe-butt-zoom.png', true)
zoom(800, 100, 454, 450, 2, 'probe-tip-zoom.png', true)
zoom(200, 900, 950, 354, 1, 'probe-soles-zoom.png', true)
zoom(0, 0, 1254, 1254, 1, 'probe-full-grid.png', true)
console.log('probe zooms written')
