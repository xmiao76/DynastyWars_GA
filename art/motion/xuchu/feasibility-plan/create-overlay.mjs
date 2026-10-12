// Existing-pixel overlay only: draws region/mask definitions over a copy of
// walk-candidate-2.png. No generation, no source pixels altered.
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const srcPath = 'art/motion/xuchu/walk-candidate-2.png'
const outPath = 'art/motion/xuchu/feasibility-plan/candidate2-named-regions-overlay.png'
const img = await loadImage(srcPath)
const W = 1536, H = 1024
const canvas = createCanvas(W, H)
const ctx = canvas.getContext('2d')
ctx.drawImage(img, 0, 0)

// Nominal 3x2 cells (candidate2 layout; weapons cross some boundaries).
ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8])
for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) ctx.strokeRect(c * 512, r * 512, 512, 512)
ctx.setLineDash([])

// Head/beard windows from named-cell-feasibility.md; beard-base band = window-local y 75..110.
const heads = [[190, 25], [730, 35], [1215, 35], [230, 525], [750, 525], [1210, 535]]
heads.forEach(([x, y], i) => {
  ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.strokeRect(x, y, 105, 135)
  // Beard-base/collar boundary band: beard lower third into collar (window-local y 85..120).
  ctx.fillStyle = 'rgba(255,40,40,0.30)'; ctx.fillRect(x, y + 75, 105, 35)
  ctx.strokeStyle = '#ff2828'; ctx.strokeRect(x, y + 75, 105, 35)
  ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 15px sans-serif'
  ctx.fillText(`H${i} HEAD-BEARD`, x, Math.max(14, y - 6))
})

// Gait edit regions for keys 2,3,4,5: hips/skirt through boots, cell-local (30,260,452,242).
const gaitCells = { 2: [1024, 0], 3: [0, 512], 4: [512, 512], 5: [1024, 512] }
for (const [k, [cx, cy]] of Object.entries(gaitCells)) {
  ctx.fillStyle = 'rgba(255,165,0,0.10)'; ctx.fillRect(cx + 30, cy + 260, 452, 242)
  ctx.strokeStyle = '#ffa500'; ctx.lineWidth = 3; ctx.strokeRect(cx + 30, cy + 260, 452, 242)
  ctx.fillStyle = '#ffa500'; ctx.font = 'bold 15px sans-serif'
  ctx.fillText(`G${k} GAIT-EDIT hips->boots`, cx + 34, cy + 278)
}

// Weapon preserve corridors: measured butt->tip endpoints (measurements.json).
const weapons = [
  [[56, 303], [516, 90]], [[572, 309], [1040, 96]], [[1059, 315], [1507, 95]],
  [[68, 801], [528, 580]], [[575, 787], [1047, 577]], [[1060, 808], [1508, 595]],
]
ctx.strokeStyle = 'rgba(0,255,120,0.55)'; ctx.lineWidth = 14; ctx.lineCap = 'round'
for (const [[x1, y1], [x2, y2]] of weapons) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() }

ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, H - 64, W, 64)
ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif'
ctx.fillText('candidate2 named regions: cyan=HEAD-BEARD window, red=BEARD-BASE-COLLAR band, orange=GAIT-EDIT (keys 2/3/4/5), green=WEAPON-PRESERVE corridor, dashed=nominal 512px cells', 10, H - 38)
ctx.fillText('Existing pixels only (copy of walk-candidate-2.png bad2aee5...); no generation, no source edit.', 10, H - 16)

const buf = canvas.toBuffer('image/png')
writeFileSync(outPath, buf)
console.log(outPath, buf.length, createHash('sha256').update(buf).digest('hex'))
