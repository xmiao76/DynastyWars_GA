#!/usr/bin/env node
// CMR-06A: sword STACK - every drawing's blade pixels PCA-rotated to
// horizontal about their centroid and plotted on one shared x-ruler.
// Identical rigid swords stack into one line; a length outlier sticks out.
//
//   node scripts/sword-stack.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/soldier'
const OUT = 'artifacts/motion/soldier/landmarks'
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  swing: 'swing-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-1.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}
const ALIASES = {
  locomotion: { 8: 0 },
  swing: { 0: 'locomotion:0', 8: 'locomotion:0' },
  'hitstun-held': { 0: 'locomotion:0', 8: 'locomotion:0' },
  'fall-thrown': { 8: 3 },
  'getup-death': { 3: 'fall-thrown:3', 8: 'locomotion:0' },
}

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

function figureAt(im, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let best = null
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0) best = c
  }
  return best
}

const rows = []
for (const [seq, file] of Object.entries(SHEETS)) {
  const im = await pixelsOf(`${SRC}/${file}`)
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    if (alias[pos] !== undefined) continue
    const c = figureAt(im, pos)
    if (!c) continue
    // Bright low-chroma pixels = blade highlight (plus possible noise).
    const pts = []
    for (let y = c.y0; y <= c.y1; y++) {
      for (let x = c.x0; x <= c.x1; x++) {
        const k = (y * im.width + x) * 4
        const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3]
        if (a < 200) continue
        const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
        if (hi > 168 && hi - lo < 28) pts.push([x, y])
      }
    }
    if (pts.length < 100) continue
    const n = pts.length
    const mx = pts.reduce((s, p) => s + p[0], 0) / n
    const my = pts.reduce((s, p) => s + p[1], 0) / n
    let sxx = 0, syy = 0, sxy = 0
    for (const [px, py] of pts) {
      sxx += (px - mx) ** 2
      syy += (py - my) ** 2
      sxy += (px - mx) * (py - my)
    }
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const ux = Math.cos(theta)
    const uy = Math.sin(theta)
    const proj = pts.map(([px, py]) => [(px - mx) * ux + (py - my) * uy, -(px - mx) * uy + (py - my) * ux])
    proj.sort((a, b) => a[0] - b[0])
    // Robust extent: drop the outermost 2% (stray highlights).
    const lo2 = proj[Math.floor(n * 0.02)][0]
    const hi2 = proj[Math.floor(n * 0.98) - 1][0]
    rows.push({ id: `${seq}:${pos}`, proj, extent: Math.round(hi2 - lo2) })
  }
}

const ROW_H = 26
const SHEET_W = 760
const sheet = createCanvas(SHEET_W, rows.length * ROW_H + 46)
const g = sheet.getContext('2d')
g.fillStyle = '#201c28'
g.fillRect(0, 0, sheet.width, sheet.height)
g.fillStyle = '#ffd27f'
g.font = 'bold 16px sans-serif'
g.fillText('SOLDIER SWORD STACK - blade pixels rotated to one axis, shared ruler in sheet px (CMR-06A r2)', 8, 20)
const OX = 200
for (let r2 = 0; r2 <= 520; r2 += 50) {
  const px = OX + r2
  g.strokeStyle = r2 % 100 === 0 ? 'rgba(255,220,120,0.7)' : 'rgba(255,220,120,0.25)'
  g.beginPath(); g.moveTo(px, 30); g.lineTo(px, rows.length * ROW_H + 40); g.stroke()
  if (r2 % 100 === 0) {
    g.fillStyle = '#ffd27f'
    g.font = '11px sans-serif'
    g.fillText(String(r2), px + 2, 42)
  }
}
rows.forEach((row, i) => {
  const y = 46 + i * ROW_H
  g.fillStyle = '#9aa'
  g.font = '11px sans-serif'
  g.fillText(`${row.id} (${row.extent})`, 6, y + 10)
  for (const [px, py] of row.proj) {
    const x = OX + px
    if (x < 2 || x > SHEET_W - 2) continue
    const yy = y + 10 + Math.max(-8, Math.min(8, py * 0.12))
    g.fillStyle = 'rgba(220,225,235,0.9)'
    g.fillRect(x, yy, 1, 1)
  }
})
mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/sword-stack.png`, sheet.toBuffer('image/png'))
console.log('wrote', `${OUT}/sword-stack.png`, sheet.width + 'x' + sheet.height, 'rows:', rows.length)
console.log(rows.map((r) => `${r.id}=${r.extent}`).join(' '))
