// CMR-15A zero-generation local prototype (DIAGNOSTIC ONLY, not acceptance).
// Deterministic splice/repaint from EXISTING Xu Chu pixels only. No generation.
// Donor chosen by visual inspection of the candidate cells in this package:
//   candidate-1 walk:4 (sheet cell origin 512,512) is the only existing key
//   whose SUPPORT side is opposite to walk:2 (screen-right planted boot) AND
//   whose other leg is genuinely lifted/bent off the ground (screen-left boot
//   lifted behind the hip). Candidate-2 walk:4 repeats walk:2's own raised
//   screen-right leg; candidate-2 walk:1/3 are both-feet-grounded strides.
// Regions (CMR-15A-FEASIBILITY-PLAN.md §b, walk:2, cell-local 512 coords):
//   GAIT-EDIT  (30,260,452,242), BEARD-BASE (191,110,105,35).
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const root = 'art/motion/xuchu/'
const out = root + 'prototype/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')

const GAIT = { x: 30, y: 260, w: 452, h: 242 }
const BEARD = { x: 191, y: 110, w: 105, h: 35 }
const HEAD_BEARD = { x: 191, y: 35, w: 105, h: 135 }
const DONOR = { sheet: root + 'walk-candidate-1.png', key: 'candidate-1 walk:4', origin: { x: 512, y: 512 } }

const origBuf = readFileSync(root + 'proof-of-control/walk2-original-cell.png')
const donorBuf = readFileSync(DONOR.sheet)
const pins = {
  original: '75c07dc26e3490c8de17377656eb1464066fc3e44bf9616de4d3424c1efcad0f',
  donorSheet: 'dfd7bd87e424c6a50621908eed5a0c950852ea61c033c932955b50e175eb92f7',
}
if (sha(origBuf) !== pins.original) throw new Error('original cell pin mismatch')
if (sha(donorBuf) !== pins.donorSheet) throw new Error('donor sheet pin mismatch')

const orig = PNG.sync.read(origBuf) // 512x512
const sheet = PNG.sync.read(donorBuf) // 1536x1024
if (orig.width !== 512 || orig.height !== 512) throw new Error('original not 512x512')
if (sheet.width !== 1536 || sheet.height !== 1024) throw new Error('donor sheet not 1536x1024')

const idx = (png, x, y) => (y * png.width + x) * 4
const inRect = (x, y, r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h

// ---- donor cell crop (evidence) ----
const donorCell = new PNG({ width: 512, height: 512 })
for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
  const si = idx(sheet, DONOR.origin.x + x, DONOR.origin.y + y), di = idx(donorCell, x, y)
  for (let k = 0; k < 4; k++) donorCell.data[di + k] = sheet.data[si + k]
}
writeFileSync(out + 'prototype-donor-c1-walk4-cell.png', PNG.sync.write(donorCell))

function alphaBounds(png) {
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[idx(png, x, y) + 3] >= 16) {
      if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
    }
  }
  return { xmin, ymin, xmax, ymax }
}

// ---- 1) Walk:2 composite: replace ONLY GAIT-EDIT with donor cell pixels ----
const composite = new PNG({ width: 512, height: 512 })
orig.data.copy(composite.data)
for (let y = GAIT.y; y < GAIT.y + GAIT.h; y++) for (let x = GAIT.x; x < GAIT.x + GAIT.w; x++) {
  const di = idx(composite, x, y), si = idx(sheet, DONOR.origin.x + x, DONOR.origin.y + y)
  for (let k = 0; k < 4; k++) composite.data[di + k] = sheet.data[si + k]
}
writeFileSync(out + 'prototype-walk2-composite.png', PNG.sync.write(composite))

// outside GAIT+BEARD mask equality: composite vs original
function outsideStats(a, b, rects) {
  const ba = [], bb = []
  let diff = 0, insideDiff = 0
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const i = idx(a, x, y)
    const same = a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2] && a.data[i + 3] === b.data[i + 3]
    if (rects.some((r) => inRect(x, y, r))) { if (!same) insideDiff++ } else {
      ba.push(a.data[i], a.data[i + 1], a.data[i + 2], a.data[i + 3]); bb.push(b.data[i], b.data[i + 1], b.data[i + 2], b.data[i + 3])
      if (!same) diff++
    }
  }
  return { hashA: sha(Buffer.from(ba)), hashB: sha(Buffer.from(bb)), diff, insideDiff }
}
const gaitOutside = outsideStats(orig, composite, [GAIT, BEARD])

// ---- 2) Beard test: repaint a background separation inside BEARD-BASE only ----
// Per beard column (contiguous dark-hair cluster containing x=255): endpoint =
// last dark (mean RGB < 48, alpha>=128) row, capped at y=136; then clear the
// next 8 rows in that column to transparent. This cuts a >=8px background gap
// between the beard base and the collar/armour resuming below the band.
const beard = new PNG({ width: 512, height: 512 })
composite.data.copy(beard.data)
const isDark = (png, x, y) => {
  const i = idx(png, x, y)
  return png.data[i + 3] >= 128 && (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3 < 48
}
const capY = BEARD.y + 26 // 136
const candidateCols = []
for (let x = BEARD.x; x < BEARD.x + BEARD.w; x++) {
  let n = 0
  for (let y = BEARD.y; y < BEARD.y + BEARD.h; y++) if (isDark(beard, x, y)) n++
  if (n >= 5) candidateCols.push(x)
}
// contiguous cluster containing x=255
let cluster = []
if (candidateCols.includes(255)) {
  cluster = [255]
  for (let x = 254; candidateCols.includes(x); x--) cluster.unshift(x)
  for (let x = 256; candidateCols.includes(x); x++) cluster.push(x)
}
const endpoints = {}
for (const x of cluster) {
  const darkRows = []
  for (let y = BEARD.y; y < BEARD.y + BEARD.h; y++) if (isDark(beard, x, y)) darkRows.push(y)
  const endpoint = darkRows.some((y) => y > capY) ? capY : Math.max(...darkRows)
  endpoints[x] = endpoint
  for (let y = endpoint + 1; y <= Math.min(endpoint + 8, BEARD.y + BEARD.h - 1); y++) {
    const i = idx(beard, x, y)
    beard.data[i] = 0; beard.data[i + 1] = 0; beard.data[i + 2] = 0; beard.data[i + 3] = 0
  }
}
writeFileSync(out + 'prototype-beard.png', PNG.sync.write(beard))
// measured clear background gap per beard column: contiguous alpha<16 rows
// directly below the repaint endpoint recorded above (dark armour resuming
// below the gap is the collar the endpoint must read against, not beard).
const gaps = cluster.map((x) => {
  const ep = endpoints[x]
  let gap = 0
  for (let y = ep + 1; y < 512 && beard.data[idx(beard, x, y) + 3] < 16; y++) gap++
  return { x, endpoint: ep, gap }
})
const gapVals = gaps.map((g) => g.gap).sort((a, b) => a - b)
const beardOutside = outsideStats(composite, beard, [BEARD])

// ---- marked renders (display only; never fed back) ----
async function markedComposite() {
  const img = await loadImage(out + 'prototype-walk2-composite.png')
  const cv = createCanvas(512, 512), g = cv.getContext('2d')
  g.fillStyle = '#3a3436'; g.fillRect(0, 0, 512, 512); g.drawImage(img, 0, 0)
  g.strokeStyle = '#ff4040'; g.lineWidth = 2; g.strokeRect(GAIT.x, GAIT.y, GAIT.w, GAIT.h)
  g.fillStyle = '#ff4040'; g.font = '13px sans-serif'; g.fillText('GAIT-EDIT (donor candidate-1 walk:4)', GAIT.x + 4, GAIT.y - 6)
  g.strokeStyle = '#ffe040'; g.strokeRect(BEARD.x, BEARD.y, BEARD.w, BEARD.h)
  g.fillStyle = '#ffe040'; g.fillText('BEARD-BASE (unchanged here)', BEARD.x - 40, BEARD.y - 6)
  writeFileSync(out + 'prototype-walk2-composite-marked.png', cv.toBuffer('image/png'))
}
async function markedBeardZoom() {
  const img = await loadImage(out + 'prototype-beard.png')
  const S = 4, W = HEAD_BEARD.w * S, H = HEAD_BEARD.h * S
  const cv = createCanvas(W, H), g = cv.getContext('2d')
  g.fillStyle = '#3a3436'; g.fillRect(0, 0, W, H)
  g.imageSmoothingEnabled = false
  g.drawImage(img, HEAD_BEARD.x, HEAD_BEARD.y, HEAD_BEARD.w, HEAD_BEARD.h, 0, 0, W, H)
  g.strokeStyle = '#ffe040'; g.lineWidth = 2
  g.strokeRect(0, (BEARD.y - HEAD_BEARD.y) * S, BEARD.w * S, BEARD.h * S)
  g.fillStyle = '#ffe040'; g.font = '14px sans-serif'; g.fillText('BEARD-BASE', 4, (BEARD.y - HEAD_BEARD.y) * S - 6)
  g.strokeStyle = '#00ff80'; g.beginPath()
  for (const x of cluster) { const ex = (x - HEAD_BEARD.x) * S, ey = (endpoints[x] - HEAD_BEARD.y) * S; g.moveTo(ex, ey); g.lineTo(ex + S, ey) }
  g.stroke(); g.fillStyle = '#00ff80'; g.fillText('repainted beard endpoint (per column)', 4, H - 8)
  writeFileSync(out + 'prototype-beard-marked-zoom.png', cv.toBuffer('image/png'))
}
await markedComposite()
await markedBeardZoom()

console.log(JSON.stringify({
  donor: { ...DONOR, sheetSha256: sha(donorBuf), cellCropPath: out + 'prototype-donor-c1-walk4-cell.png', cellCropSha256: sha(readFileSync(out + 'prototype-donor-c1-walk4-cell.png')) },
  originalSha256: sha(origBuf),
  compositeSha256: sha(readFileSync(out + 'prototype-walk2-composite.png')),
  beardSha256: sha(readFileSync(out + 'prototype-beard.png')),
  regions: { GAIT, BEARD },
  gaitOutsideMask: gaitOutside,
  beardOutsideMask: beardOutside,
  alphaBounds: { original: alphaBounds(orig), donorCell: alphaBounds(donorCell), composite: alphaBounds(composite) },
  beardClusterX: cluster.length ? [cluster[0], cluster[cluster.length - 1]] : [],
  beardGapPx: { min: gapVals[0], median: gapVals[Math.floor(gapVals.length / 2)], max: gapVals[gapVals.length - 1], atX255: gaps.find((g) => g.x === 255) },
}, null, 1))
