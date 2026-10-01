#!/usr/bin/env node
// CMR-06A: manual landmark review sheet - gridded 2x crops of the frames
// that carry the acceptance-4 measurement, with a labelled ruler so the
// reviewer reads actual sheet-pixel positions (all frames share one sheet
// scale, so sheet px are directly comparable across frames).
//
//   node scripts/landmark-review-sheet.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/soldier'
const OUT = 'artifacts/motion/soldier/landmarks'
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  swing: 'swing-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}
// Frames selected for measurement: the full-view blade candidates plus
// upright head candidates (aliases excluded - identical pixels).
const FRAMES = [
  ['locomotion', 0], ['locomotion', 1], ['locomotion', 2], ['locomotion', 3],
  ['locomotion', 4], ['locomotion', 5],
  ['swing', 1], ['swing', 3], ['swing', 4],
  ['hitstun-held', 0], ['hitstun-held', 2],
  ['getup-death', 4],
]

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

const loaded = {}
for (const [name, file] of Object.entries(SHEETS)) loaded[name] = await pixelsOf(`${SRC}/${file}`)

const Z = 2 // 2x crop; grid every 25 sheet px = 50 crop px
const GRID = 25
const COLS = 4
const CELL_W = 440
const CELL_H = 560
const rows = Math.ceil(FRAMES.length / COLS)
const sheet = createCanvas(COLS * CELL_W, rows * CELL_H)
const g = sheet.getContext('2d')
g.fillStyle = '#201c28'
g.fillRect(0, 0, sheet.width, sheet.height)

for (const [idx, [seq, pos]] of FRAMES.entries()) {
  const im = loaded[seq]
  const c = figureAt(im, pos)
  const ox = (idx % COLS) * CELL_W
  const oy = Math.floor(idx / COLS) * CELL_H
  if (!c) continue
  const pad = 12
  const x0 = Math.max(0, c.x0 - pad)
  const y0 = Math.max(0, c.y0 - pad)
  const cw = Math.min(im.width - x0, c.x1 - c.x0 + 1 + 2 * pad)
  const ch = Math.min(im.height - y0, c.y1 - c.y0 + 1 + 2 * pad)
  const from = createCanvas(im.width, im.height)
  const fg = from.getContext('2d')
  const id = fg.createImageData(im.width, im.height)
  id.data.set(im.data)
  fg.putImageData(id, 0, 0)
  const scale = Math.min((CELL_W - 20) / (cw * Z), (CELL_H - 50) / (ch * Z))
  const dw = cw * Z * scale
  const dh = ch * Z * scale
  const dx = ox + (CELL_W - dw) / 2
  const dy = oy + 30
  g.drawImage(from, x0, y0, cw, ch, dx, dy, dw, dh)
  // Ruler: lines every GRID sheet px, labelled; positions are sheet px
  // measured from the crop origin (x0, y0).
  g.font = '11px sans-serif'
  for (let sx = 0; sx <= cw; sx += GRID) {
    const px = dx + (sx * Z * scale)
    g.strokeStyle = sx % 100 === 0 ? 'rgba(255,220,120,0.85)' : 'rgba(255,220,120,0.35)'
    g.beginPath(); g.moveTo(px, dy); g.lineTo(px, dy + dh); g.stroke()
    if (sx % 100 === 0) {
      g.fillStyle = '#ffd27f'
      g.fillText(String(sx), px + 2, dy + 12)
    }
  }
  for (let sy = 0; sy <= ch; sy += GRID) {
    const py = dy + (sy * Z * scale)
    g.strokeStyle = sy % 100 === 0 ? 'rgba(120,220,255,0.85)' : 'rgba(120,220,255,0.35)'
    g.beginPath(); g.moveTo(dx, py); g.lineTo(dx + dw, py); g.stroke()
    if (sy % 100 === 0) {
      g.fillStyle = '#78dcff'
      g.fillText(String(sy), dx + 2, py - 2)
    }
  }
  g.fillStyle = '#ffffff'
  g.font = '15px sans-serif'
  g.fillText(`${seq}:${pos}`, ox + 8, oy + 18)
}
mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/landmark-review-sheet.png`, sheet.toBuffer('image/png'))
console.log('wrote', `${OUT}/landmark-review-sheet.png`, sheet.width + 'x' + sheet.height, 'grid every', GRID, 'sheet px; crop origin top-left label 0,0')
