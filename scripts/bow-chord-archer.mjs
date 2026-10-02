#!/usr/bin/env node
// CMR-08A: bow-chord fits via region-restricted PCA (v10, final method).
//
//   node scripts/bow-chord-archer.mjs
//
// Rationale (v1-v9 documented failures in PROGRESS): color inseparable,
// thin clustering catches edge bands, elongation gates kill fragments,
// RANSAC catches body diagonals, run detectors catch torsos or miss
// curved limbs, manual grids too coarse. What works: HUMAN specifies
// which side strip holds the bow (coarse, robust, verifiable); MACHINE
// takes all opaque pixels in that strip and PCA-fits them (exact tips).
// The overlay verifies each fit caught the bow (not robe/boot/strap);
// failures read as unverified, never as bow numbers. Orientation rule:
// vertical and horizontal bows form separate sub-spreads (different
// geometry); diagonal/bent bows are unverified (non-comparable).

import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/archer'
const OUT = 'artifacts/motion/archer/landmarks'
// [file, pos, side] - side = outer strip holding the bow (from sheet review).
const CELLS = [
  ['locomotion-candidate-1.png', 0, 'R'], ['locomotion-candidate-1.png', 1, 'R'],
  ['locomotion-candidate-1.png', 2, 'R'], ['locomotion-candidate-1.png', 3, 'R'],
  ['locomotion-candidate-1.png', 4, 'R'], ['locomotion-candidate-1.png', 5, 'R'],
  ['locomotion-candidate-1.png', 6, 'R'], ['locomotion-candidate-1.png', 7, 'R'],
  ['shoot-candidate-2.png', 0, 'R'], ['shoot-candidate-2.png', 5, 'R'],
  ['hitstun-held-candidate-1.png', 0, 'R'], ['hitstun-held-candidate-1.png', 4, 'R'],
  ['hitstun-held-candidate-1.png', 5, 'R'], ['hitstun-held-candidate-1.png', 7, 'R'],
  ['fall-thrown-candidate-1.png', 3, 'L'], ['fall-thrown-candidate-1.png', 6, 'B'],
  ['fall-thrown-candidate-1.png', 7, 'B'], ['getup-death-candidate-2.png', 2, 'R'],
  ['getup-death-candidate-2.png', 7, 'B'],
]

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  return cv
}

const rows = []
const crops = []
for (const [file, pos, side] of CELLS) {
  const id = `${file.split('-candidate')[0]}:${pos}`
  const cv = await load(`${SRC}/${file}`)
  const g = cv.getContext('2d')
  const d = g.getImageData(0, 0, cv.width, cv.height)
  const im = { width: d.width, height: d.height, data: d.data }
  let box = null
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / 512), cy = Math.floor((c.y0 + c.y1 + 1) / 2 / 341)
    if (cx === pos % 3 && cy === Math.floor(pos / 3) && (box === null || c.area > box.area)) box = c
  }
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1
  const q = (side === 'L' || side === 'R') ? Math.floor(w * 0.3) : Math.floor(h * 0.3)
  const pts = []
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const inStrip = side === 'L' ? x - box.x0 < q : side === 'R' ? box.x1 - x < q
        : side === 'T' ? y - box.y0 < q : box.y1 - y < q
      if (!inStrip) continue
      const k = (y * im.width + x) * 4
      if (im.data[k + 3] >= 200) pts.push([x, y])
    }
  }
  let fit = null
  if (pts.length >= 300) {
    const n = pts.length
    const mx = pts.reduce((a, p) => a + p[0], 0) / n
    const my = pts.reduce((a, p) => a + p[1], 0) / n
    let sxx = 0, syy = 0, sxy = 0
    for (const [px, py] of pts) { sxx += (px - mx) ** 2; syy += (py - my) ** 2; sxy += (px - mx) * (py - my) }
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const ux = Math.cos(theta), uy = Math.sin(theta)
    let pMin = Infinity, pMax = -Infinity
    for (const [px, py] of pts) {
      const p = (px - mx) * ux + (py - my) * uy
      if (p < pMin) pMin = p
      if (p > pMax) pMax = p
    }
    fit = {
      len: Math.round(pMax - pMin), n,
      a: [Math.round(mx + ux * pMin), Math.round(my + uy * pMin)],
      b: [Math.round(mx + ux * pMax), Math.round(my + uy * pMax)],
    }
  }
  rows.push({ id, side, length: fit?.len ?? null, a: fit?.a ?? null, b: fit?.b ?? null, n: fit?.n ?? null })
  crops.push({ id, cv, box, fit })
  console.log(id.padEnd(16), fit ? `${fit.len}px n=${fit.n}` : 'NO FIT', `side ${side}`)
}

// Combined verification overlay.
const CW = 300, CH = 220
const cols = 4, rowsN = Math.ceil(crops.length / cols)
const sheet = createCanvas(CW * cols + 20, 30 + CH * rowsN + 10)
const s = sheet.getContext('2d')
s.fillStyle = '#14141f'
s.fillRect(0, 0, sheet.width, sheet.height)
s.font = '13px sans-serif'
s.fillStyle = '#ffe9a8'
s.fillText('BOW chord fits (red = strip-PCA axis; verify endpoints on limb tips) - CMR-08A', 10, 18)
crops.forEach(({ id, cv, box, fit }, i) => {
  const ox = 10 + (i % cols) * CW, oy = 30 + Math.floor(i / cols) * CH
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1
  const sc = Math.min((CW - 8) / w, (CH - 8) / h)
  const dw = Math.round(w * sc), dh = Math.round(h * sc)
  const g2 = cv.getContext('2d')
  s.drawImage(cv, box.x0, box.y0, w, h, ox + 4, oy + 4, dw, dh)
  void g2
  s.fillStyle = '#9adcff'
  s.fillText(`${id} ${fit ? fit.len + 'px' : 'NO FIT'}`, ox + 4, oy + 13)
  if (fit) {
    s.strokeStyle = '#ff4444'
    s.lineWidth = 2
    s.beginPath()
    s.moveTo(ox + 4 + (fit.a[0] - box.x0) * sc, oy + 4 + (fit.a[1] - box.y0) * sc)
    s.lineTo(ox + 4 + (fit.b[0] - box.x0) * sc, oy + 4 + (fit.b[1] - box.y0) * sc)
    s.stroke()
    s.strokeStyle = '#44ff88'
    for (const p of [fit.a, fit.b]) {
      s.beginPath()
      s.arc(ox + 4 + (p[0] - box.x0) * sc, oy + 4 + (p[1] - box.y0) * sc, 4, 0, 7)
      s.stroke()
    }
  }
})
writeFileSync(`${OUT}/bow-chord-verify.png`, sheet.toBuffer('image/png'))
console.log('wrote', `${OUT}/bow-chord-verify.png`)
writeFileSync(`${SRC}/bow-lines.json`, `${JSON.stringify(rows, null, 2)}\n`)
console.log('wrote', `${SRC}/bow-lines.json`)
