#!/usr/bin/env node
// CMR-06A: sword-comparison review sheet - fixed 360x260 sheet-px windows
// centred on each drawing's sword region, drawn at ONE scale with a ruler.
// This is the manual landmark review for acceptance 4's weapon half: blade
// lengths read against the same ruler, directly comparable.
//
//   node scripts/sword-review-sheet.mjs

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
  return cv
}

function figureAt(comps, im, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0) best = c
  }
  return best
}

/** Sword anchor: centroid of the bright steel mask inside the figure. */
function swordCentre(im, c) {
  const iw = im.width
  let sx = 0, sy = 0, n = 0
  for (let y = c.y0; y <= c.y1; y++) {
    for (let x = c.x0; x <= c.x1; x++) {
      const k = (y * iw + x) * 4
      const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3]
      if (a < 200) continue
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
      if (hi > 150 && hi - lo < 45) {
        sx += x
        sy += y
        n++
      }
    }
  }
  return n > 150 ? { x: Math.round(sx / n), y: Math.round(sy / n) } : { x: Math.round((c.x0 + c.x1) / 2), y: Math.round((c.y0 + c.y1) / 2) }
}

const loaded = {}
for (const seq of Object.keys(SHEETS)) {
  const cv = await pixelsOf(`${SRC}/${SHEETS[seq]}`)
  loaded[seq] = { cv, im: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height), comps: alphaComponents({ width: cv.width, height: cv.height, data: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data }, 96).sort((a, b) => (a.y0 - b.y0) || (a.x0 - b.x0)) }
}

const WIN_W = 360
const WIN_H = 260
const Z = 2
const COLS = 4
const CELL_W = WIN_W * Z + 24
const CELL_H = WIN_H * Z + 54
const frames = []
for (const [seq] of Object.entries(SHEETS)) {
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    if (alias[pos] !== undefined) continue
    const L = loaded[seq]
    const c = figureAt(L.comps, L.im, pos)
    if (!c) continue
    frames.push({ seq, pos, L, centre: swordCentre(L.im, c) })
  }
}
const perSheet = 16
mkdirSync(OUT, { recursive: true })
for (let s = 0; s * perSheet < frames.length; s++) {
  const slice = frames.slice(s * perSheet, (s + 1) * perSheet)
  const rows = Math.ceil(slice.length / COLS)
  const sheet = createCanvas(COLS * CELL_W, rows * CELL_H + 34)
  const g = sheet.getContext('2d')
  g.fillStyle = '#201c28'
  g.fillRect(0, 0, sheet.width, sheet.height)
  g.fillStyle = '#ffd27f'
  g.font = 'bold 22px sans-serif'
  g.fillText(`SOLDIER SWORD COMPARISON ${s + 1} - fixed 360x260 windows, one scale, ruler in sheet px (CMR-06A)`, 12, 26)
  for (const [idx, f] of slice.entries()) {
    const ox = (idx % COLS) * CELL_W
    const oy = 34 + Math.floor(idx / COLS) * CELL_H
    const x0 = Math.round(f.centre.x - WIN_W / 2)
    const y0 = Math.round(f.centre.y - WIN_H / 2)
    const dx = ox + 12
    const dy = oy + 34
    g.drawImage(f.L.cv, x0, y0, WIN_W, WIN_H, dx, dy, WIN_W * Z, WIN_H * Z)
    g.font = '11px sans-serif'
    for (let r2 = 0; r2 <= WIN_W; r2 += 50) {
      const px = dx + r2 * Z
      g.strokeStyle = r2 % 100 === 0 ? 'rgba(255,220,120,0.8)' : 'rgba(255,220,120,0.3)'
      g.beginPath(); g.moveTo(px, dy); g.lineTo(px, dy + WIN_H * Z); g.stroke()
      if (r2 % 100 === 0) {
        g.fillStyle = '#ffd27f'
        g.fillText(String(r2), px + 2, dy + 11)
      }
    }
    for (let r2 = 0; r2 <= WIN_H; r2 += 50) {
      const py = dy + r2 * Z
      g.strokeStyle = r2 % 100 === 0 ? 'rgba(120,220,255,0.8)' : 'rgba(120,220,255,0.3)'
      g.beginPath(); g.moveTo(dx, py); g.lineTo(dx + WIN_W * Z, py); g.stroke()
      if (r2 % 100 === 0) {
        g.fillStyle = '#78dcff'
        g.fillText(String(r2), dx + 2, py - 2)
      }
    }
    g.fillStyle = '#ffffff'
    g.font = '15px sans-serif'
    g.fillText(`${f.seq}:${f.pos}`, ox + 10, oy + 20)
  }
  writeFileSync(`${OUT}/sword-review-${s + 1}.png`, sheet.toBuffer('image/png'))
  console.log('wrote', `${OUT}/sword-review-${s + 1}.png`, sheet.width + 'x' + sheet.height, slice[0].seq + ':' + slice[0].pos, '..', slice[slice.length - 1].seq + ':' + slice[slice.length - 1].pos)
}
