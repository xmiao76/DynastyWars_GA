#!/usr/bin/env node
// CMR-07A: fixed-scale comparison sheets for the spearman pack.
//
//   node scripts/review-sheets-spearman.mjs
//
// head-review: a fixed 220x220 sheet-px window centred on each unique
// drawing's face (topmost skin cluster), one scale, ruler gridded.
// spear-review: a fixed 480x400 sheet-px window centred on the spear
// (steel head + red tassel centroid), one scale, ruler gridded.

import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/spearman'
const OUT = 'artifacts/motion/spearman/landmarks'
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  thrust: 'thrust-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-2.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}
const ALIASES = {
  locomotion: { 8: 0 },
  thrust: { 0: 'locomotion:0', 8: 'locomotion:0' },
  'hitstun-held': { 0: 'locomotion:0', 8: 'locomotion:0' },
  'fall-thrown': { 8: 3 },
  'getup-death': { 3: 'fall-thrown:3', 8: 'locomotion:0' },
}

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { cv, im: { width: d.width, height: d.height, data: d.data } }
}

function figureAt(im, comps, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0 && (best === null || c.area > best.area)) best = c
  }
  return best
}

const skin = (d, k) => d[k + 3] >= 200 && d[k] > 105 && d[k] > d[k + 1] + 12 && d[k + 1] > d[k + 2] && d[k + 2] < 170

function faceCentre(im, box) {
  const seen = new Set()
  let best = null
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    const key = y * im.width + x
    if (seen.has(key) || !skin(im.data, key * 4)) continue
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
        const nk = ny * im.width + nx
        if (nx < box.x0 || nx > box.x1 || ny < box.y0 || ny > box.y1) continue
        if (seen.has(nk) || !skin(im.data, nk * 4)) continue
        seen.add(nk)
        stack.push([nx, ny])
      }
    }
    if (area > 300 && (best === null || y0 < best.y0)) best = { x0, x1, y0, y1 }
  }
  return best ? { x: Math.round((best.x0 + best.x1) / 2), y: Math.round((best.y0 + best.y1) / 2) } : { x: Math.round((box.x0 + box.x1) / 2), y: box.y0 + 40 }
}

/** Spear anchor: centroid of steel head + red tassel pixels. */
function spearCentre(im, box) {
  let sx = 0, sy = 0, n = 0
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    const k = (y * im.width + x) * 4
    if (im.data[k + 3] < 200) continue
    const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
    const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
    if ((hi > 150 && hi - lo < 30) || (r > 110 && r > g * 1.5 && r > b * 1.5)) { sx += x; sy += y; n++ }
  }
  return n > 100 ? { x: Math.round(sx / n), y: Math.round(sy / n) } : { x: Math.round((box.x0 + box.x1) / 2), y: Math.round((box.y0 + box.y1) / 2) }
}

const loaded = {}
for (const [seq, file] of Object.entries(SHEETS)) {
  const { cv, im } = await load(`${SRC}/${file}`)
  loaded[seq] = { cv, im, comps: alphaComponents(im, 96) }
}
const frames = []
for (const seq of Object.keys(SHEETS)) {
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    if (alias[pos] !== undefined) continue
    const L = loaded[seq]
    const box = figureAt(L.im, L.comps, pos)
    if (box) frames.push({ seq, pos, L, box })
  }
}

function render(kind, winW, winH, z, cols, anchor, title) {
  const cellW = winW * z + 24
  const cellH = winH * z + 54
  const rows = Math.ceil(frames.length / cols)
  const sheet = createCanvas(cols * cellW, rows * cellH + 34)
  const g = sheet.getContext('2d')
  g.fillStyle = '#201c28'
  g.fillRect(0, 0, sheet.width, sheet.height)
  g.fillStyle = '#ffd27f'
  g.font = 'bold 22px sans-serif'
  g.fillText(title, 12, 26)
  frames.forEach((f, idx) => {
    const ox = (idx % cols) * cellW
    const oy = 34 + Math.floor(idx / cols) * cellH
    const a = anchor(f)
    const x0 = Math.round(a.x - winW / 2)
    const y0 = Math.round(a.y - winH / 2)
    const dx = ox + 12
    const dy = oy + 34
    g.drawImage(f.L.cv, x0, y0, winW, winH, dx, dy, winW * z, winH * z)
    g.font = '11px sans-serif'
    for (let r = 0; r <= winW; r += 50) {
      g.strokeStyle = r % 100 === 0 ? 'rgba(255,220,120,0.8)' : 'rgba(255,220,120,0.3)'
      g.beginPath(); g.moveTo(dx + r * z, dy); g.lineTo(dx + r * z, dy + winH * z); g.stroke()
      if (r % 100 === 0) { g.fillStyle = '#ffd27f'; g.fillText(String(r), dx + r * z + 2, dy + 11) }
    }
    for (let r = 0; r <= winH; r += 50) {
      g.strokeStyle = r % 100 === 0 ? 'rgba(120,220,255,0.8)' : 'rgba(120,220,255,0.3)'
      g.beginPath(); g.moveTo(dx, dy + r * z); g.lineTo(dx + winW * z, dy + r * z); g.stroke()
      if (r % 100 === 0) { g.fillStyle = '#78dcff'; g.fillText(String(r), dx + 2, dy + r * z - 2) }
    }
    g.fillStyle = '#fff'
    g.font = '15px sans-serif'
    g.fillText(`${f.seq}:${f.pos}`, ox + 10, oy + 20)
  })
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/${kind}.png`, sheet.toBuffer('image/png'))
  console.log('wrote', `${OUT}/${kind}.png`, sheet.width + 'x' + sheet.height, 'frames', frames.length)
}

render('head-review', 220, 220, 2, 7, (f) => faceCentre(f.L.im, f.box), 'SPEARMAN HEAD COMPARISON - fixed 220px windows, one scale (CMR-07A)')
render('spear-review', 480, 400, 1, 5, (f) => spearCentre(f.L.im, f.box), 'SPEARMAN SPEAR COMPARISON - fixed 480x400 windows, one scale (CMR-07A)')
