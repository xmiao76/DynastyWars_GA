#!/usr/bin/env node
// CMR-06A (owner-directed redraw round): head-comparison review sheets.
// Every unique drawing gets a FIXED 220x220 sheet-px window centred on its
// face/head, drawn at the same scale with a ruler - directly comparable
// head sizes, which is what acceptance 4 tests.
//
//   node scripts/head-review-sheet.mjs

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

/** Head centre: topmost face/skin cluster, else the content top centre. */
function headCentre(im, c) {
  const iw = im.width
  const isSkin = (x, y) => {
    const k = (y * iw + x) * 4
    const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3]
    return a >= 200 && r > 105 && r > g + 12 && g > b && b < 170
  }
  const seen = new Set()
  let best = null
  for (let y = c.y0; y <= c.y1; y++) {
    for (let x = c.x0; x <= c.x1; x++) {
      const key = y * iw + x
      if (seen.has(key) || !isSkin(x, y)) continue
      seen.add(key)
      const stack = [[x, y]]
      let x0 = x, x1 = x, y0 = y, y1 = y, area = 0
      while (stack.length) {
        const [qx, qy] = stack.pop()
        area++
        if (qx < x0) x0 = qx
        if (qx > x1) x1 = qx
        if (qy < y0) y0 = qy
        if (qy > y1) y1 = qy
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = qx + dx, ny = qy + dy
          const nkey = ny * iw + nx
          if (nx < c.x0 || nx > c.x1 || ny < c.y0 || ny > c.y1) continue
          if (seen.has(nkey) || !isSkin(nx, ny)) continue
          seen.add(nkey)
          stack.push([nx, ny])
        }
      }
      const cluster = { x0, x1, y0, y1, area }
      if (cluster.area > 120 && (best === null || cluster.y0 < best.y0)) best = cluster
    }
  }
  if (best) return { x: Math.round((best.x0 + best.x1) / 2), y: Math.round((best.y0 + best.y1) / 2), src: 'face' }
  return { x: Math.round((c.x0 + c.x1) / 2), y: c.y0 + 30, src: 'content-top' }
}

const loaded = {}
for (const [name, file] of Object.entries(SHEETS)) loaded[name] = await pixelsOf(`${SRC}/${file}`)

const frames = []
for (const seq of Object.keys(SHEETS)) {
  const im = loaded[seq]
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    if (alias[pos] !== undefined) continue // identical pixels
    const c = figureAt(im, pos)
    if (!c) continue
    frames.push({ seq, pos, im, c, head: headCentre(im, c) })
  }
}

const WIN = 220 // fixed window: same scale for every head
const Z = 2
const COLS = 7
const CELL_W = WIN * Z + 24
const CELL_H = WIN * Z + 54
const perSheet = 100
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
  g.fillText(`SOLDIER HEAD COMPARISON ${s + 1} - fixed 220px windows, one scale (CMR-06A redraw round r2)`, 12, 26)
  for (const [idx, f] of slice.entries()) {
    const ox = (idx % COLS) * CELL_W
    const oy = 34 + Math.floor(idx / COLS) * CELL_H
    const x0 = Math.round(f.head.x - WIN / 2)
    const y0 = Math.round(f.head.y - WIN / 2)
    const from = createCanvas(f.im.width, f.im.height)
    const fg = from.getContext('2d')
    const id = fg.createImageData(f.im.width, f.im.height)
    id.data.set(f.im.data)
    fg.putImageData(id, 0, 0)
    const dx = ox + 12
    const dy = oy + 34
    g.drawImage(from, x0, y0, WIN, WIN, dx, dy, WIN * Z, WIN * Z)
    g.font = '11px sans-serif'
    for (let s2 = 0; s2 <= WIN; s2 += 50) {
      const px = dx + s2 * Z
      const py = dy + s2 * Z
      g.strokeStyle = s2 % 100 === 0 ? 'rgba(255,220,120,0.8)' : 'rgba(255,220,120,0.3)'
      g.beginPath(); g.moveTo(px, dy); g.lineTo(px, dy + WIN * Z); g.stroke()
      g.strokeStyle = s2 % 100 === 0 ? 'rgba(120,220,255,0.8)' : 'rgba(120,220,255,0.3)'
      g.beginPath(); g.moveTo(dx, py); g.lineTo(dx + WIN * Z, py); g.stroke()
      if (s2 % 100 === 0) {
        g.fillStyle = '#ffd27f'
        g.fillText(String(s2), px + 2, dy + 11)
        g.fillStyle = '#78dcff'
        g.fillText(String(s2), dx + 2, py - 2)
      }
    }
    g.fillStyle = '#ffffff'
    g.font = '15px sans-serif'
    g.fillText(`${f.seq}:${f.pos} (${f.head.src})`, ox + 10, oy + 20)
  }
  writeFileSync(`${OUT}/head-review-${s + 1}.png`, sheet.toBuffer('image/png'))
  console.log('wrote', `${OUT}/head-review-${s + 1}.png`, sheet.width + 'x' + sheet.height, 'from', f0(slice))
}
function f0(slice) { return `${slice[0].seq}:${slice[0].pos}..${slice[slice.length - 1].seq}:${slice[slice.length - 1].pos}` }
