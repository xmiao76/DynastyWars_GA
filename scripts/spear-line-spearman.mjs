#!/usr/bin/env node
// CMR-07A: spear length by straight-line fit (RANSAC on wood-coloured
// shaft pixels), with an annotated overlay so every endpoint can be
// checked by eye. Pose-independent when the spear is seen side-on.
//
//   node scripts/spear-line-spearman.mjs

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
// Aliased bookends are the same pixels as their target; skip all but
// the canonical guard (locomotion:0) and down (fall-thrown:3) cells.
const ALIASES = {
  locomotion: { 8: 0 },
  thrust: { 0: 'locomotion:0', 8: 'locomotion:0' },
  'hitstun-held': { 0: 'locomotion:0', 8: 'locomotion:0' },
  'fall-thrown': { 8: 3 },
  'getup-death': { 3: 'fall-thrown:3', 8: 'locomotion:0' },
}

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: mx ? d / mx : 0, v: mx / 255 }
}
const isWood = (r, g, b) => {
  if (r < 60 || r > 150) return false
  const { h, s, v } = hsv(r, g, b)
  return h >= 12 && h <= 42 && s >= 0.22 && s <= 0.75 && v >= 0.18 && v <= 0.62
}
const isSteel = (r, g, b) => Math.max(r, g, b) > 140 && Math.max(r, g, b) - Math.min(r, g, b) < 35

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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

/** Longest straight wood-coloured line, then its head-to-butt extent. */
function spearLine(im, box, seed) {
  const wood = []
  const all = []
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const k = (y * im.width + x) * 4
      if (im.data[k + 3] < 200) continue
      const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
      const w = isWood(r, g, b)
      if (w || isSteel(r, g, b)) all.push([x, y, w])
      if (w && x % 2 === 0 && y % 2 === 0) wood.push([x, y])
    }
  }
  if (wood.length < 200) return null
  const rand = rng(seed)
  let best = { n: 0, px: 0, py: 0, ux: 1, uy: 0 }
  for (let it = 0; it < 2500; it++) {
    const a = wood[(rand() * wood.length) | 0]
    const b = wood[(rand() * wood.length) | 0]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len = Math.hypot(dx, dy)
    if (len < 120) continue
    const ux = dx / len, uy = dy / len
    let n = 0
    for (const p of wood) {
      if (Math.abs((p[0] - a[0]) * -uy + (p[1] - a[1]) * ux) <= 3) n++
    }
    if (n > best.n) best = { n, px: a[0], py: a[1], ux, uy }
  }
  if (best.n < 60) return null
  // Refine: total-least-squares on the inliers.
  const inl = wood.filter((p) => Math.abs((p[0] - best.px) * -best.uy + (p[1] - best.py) * best.ux) <= 3)
  const mx = inl.reduce((s, p) => s + p[0], 0) / inl.length
  const my = inl.reduce((s, p) => s + p[1], 0) / inl.length
  let sxx = 0, syy = 0, sxy = 0
  for (const p of inl) { sxx += (p[0] - mx) ** 2; syy += (p[1] - my) ** 2; sxy += (p[0] - mx) * (p[1] - my) }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  const ux = Math.cos(th), uy = Math.sin(th)
  // Shaft run: wood pixels within 5px of the axis, gaps <= 40px (hands and
  // the torso legitimately interrupt the wood colour).
  const bins = new Map()
  for (const [x, y, w] of all) {
    if (!w) continue
    const perp = Math.abs((x - mx) * -uy + (y - my) * ux)
    if (perp > 5) continue
    const t = Math.round((x - mx) * ux + (y - my) * uy)
    bins.set(t, (bins.get(t) ?? 0) + 1)
  }
  const ts = [...bins.keys()].sort((a, b) => a - b)
  const GAP = 40
  let bestRun = null
  let runStart = ts[0], prev = ts[0], covered = 1
  const close = (a, b, cov) => {
    const extent = b - a + 1
    if (extent >= 100 && (bestRun === null || extent > bestRun.extent)) bestRun = { t0: a, t1: b, extent, coverage: cov / extent }
  }
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - prev > GAP) { close(runStart, prev, covered); runStart = ts[i]; covered = 0 }
    covered++
    prev = ts[i]
  }
  close(runStart, prev, covered)
  if (!bestRun) return null

  // Which end is the tip? The steel head + red tassel sit at the tip end.
  let sumT = 0
  let nHead = 0
  for (const [x, y] of all) {
    const k = (y * im.width + x) * 4
    const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
    const head = isSteel(r, g, b) || (r > 110 && r > g * 1.5 && r > b * 1.5)
    if (!head) continue
    const perp = Math.abs((x - mx) * -uy + (y - my) * ux)
    if (perp > 16) continue
    const t = (x - mx) * ux + (y - my) * uy
    if (t < bestRun.t0 - 30 || t > bestRun.t1 + 150) continue
    sumT += t
    nHead++
  }
  const mid = (bestRun.t0 + bestRun.t1) / 2
  const tipAtHigh = nHead === 0 ? true : sumT / nHead > mid

  // Extend the tip end THROUGH the head: walk outward while any opaque
  // pixel lies within 8px of the axis (gaps <= 5px), capped at +150px.
  // Without this the tassel/head (which are not wood-coloured) are counted
  // inconsistently between drawings.
  const opaqueAt = (t) => {
    const cx = mx + t * ux, cy = my + t * uy
    for (let o = -8; o <= 8; o += 2) {
      const x = Math.round(cx - o * uy), y = Math.round(cy + o * ux)
      if (x < 0 || y < 0 || x >= im.width || y >= im.height) continue
      if (im.data[(y * im.width + x) * 4 + 3] >= 200) return true
    }
    return false
  }
  const dir = tipAtHigh ? 1 : -1
  let tip = tipAtHigh ? bestRun.t1 : bestRun.t0
  let gap = 0
  for (let step = 1; step <= 150; step++) {
    const t = (tipAtHigh ? bestRun.t1 : bestRun.t0) + dir * step
    if (opaqueAt(t)) { tip = t; gap = 0 } else if (++gap > 5) break
  }
  const butt = tipAtHigh ? bestRun.t0 : bestRun.t1
  const t0 = Math.min(tip, butt)
  const t1 = Math.max(tip, butt)
  return {
    length: Math.round(t1 - t0 + 1),
    shaftCoverage: Math.round(bestRun.coverage * 100) / 100,
    inliers: best.n,
    angle: Math.round((Math.atan2(uy, ux) * 180) / Math.PI),
    tipAtHigh,
    a: [Math.round(mx + t0 * ux), Math.round(my + t0 * uy)],
    b: [Math.round(mx + t1 * ux), Math.round(my + t1 * uy)],
    tip: [Math.round(mx + tip * ux), Math.round(my + tip * uy)],
  }
}
const frames = []
const loaded = {}
for (const [seq, file] of Object.entries(SHEETS)) {
  const { cv, im } = await load(`${SRC}/${file}`)
  loaded[seq] = { cv, im, comps: alphaComponents(im, 96) }
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    const box = figureAt(im, loaded[seq].comps, pos)
    if (box) frames.push({ seq, pos, box, id: `${seq}:${pos}`, aliased: alias[pos] !== undefined })
  }
}

const results = []
frames.forEach((f, i) => {
  const L = loaded[f.seq]
  results.push({ id: f.id, seq: f.seq, pos: f.pos, aliased: f.aliased, ...(spearLine(L.im, f.box, 1000 + i) ?? { length: null }) })
})

// Overlay sheet: every fit drawn on its drawing so endpoints can be checked.
const COLS = 8
const CW = 300
const CH = 280
const rowsN = Math.ceil(frames.length / COLS)
const sheet = createCanvas(COLS * CW, rowsN * CH + 34)
const g = sheet.getContext('2d')
g.fillStyle = '#201c28'
g.fillRect(0, 0, sheet.width, sheet.height)
g.fillStyle = '#ffd27f'
g.font = 'bold 20px sans-serif'
g.fillText('SPEARMAN SPEAR-LINE FIT (red = fitted spear axis, circles = endpoints) - CMR-07A', 10, 24)
frames.forEach((f, idx) => {
  const L = loaded[f.seq]
  const r = results[idx]
  const ox = (idx % COLS) * CW
  const oy = 34 + Math.floor(idx / COLS) * CH
  const pad = 14
  const bx = f.box.x0 - pad, by = f.box.y0 - pad
  const bw = f.box.x1 - f.box.x0 + 1 + 2 * pad, bh = f.box.y1 - f.box.y0 + 1 + 2 * pad
  const k = Math.min((CW - 12) / bw, (CH - 34) / bh)
  g.drawImage(L.cv, bx, by, bw, bh, ox + 6, oy + 26, bw * k, bh * k)
  g.font = '14px sans-serif'
  g.fillStyle = '#fff'
  g.fillText(`${f.id}  len=${r.length ?? 'UNVERIFIED'}${r.shaftCoverage !== undefined ? ' cov=' + r.shaftCoverage : ''}`, ox + 6, oy + 18)
  if (r.a) {
    const P = (p) => [ox + 6 + (p[0] - bx) * k, oy + 26 + (p[1] - by) * k]
    const [x1, y1] = P(r.a)
    const [x2, y2] = P(r.b)
    g.strokeStyle = '#ff3030'
    g.lineWidth = 2
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
    g.strokeStyle = '#30ff60'
    for (const [x, y] of [[x1, y1], [x2, y2]]) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.stroke() }
  }
})
mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/spear-line-overlay.png`, sheet.toBuffer('image/png'))
writeFileSync(`${SRC}/spear-lines.json`, `${JSON.stringify(results, null, 2)}\n`)
console.log('wrote', `${OUT}/spear-line-overlay.png`, sheet.width + 'x' + sheet.height)
for (const r of results) console.log(r.id.padEnd(16), String(r.length ?? 'UNVERIFIED').padStart(5), 'cov', String(r.shaftCoverage ?? '-').padStart(4), 'angle', String(r.angle ?? '-').padStart(4), 'inliers', r.inliers ?? '-')
