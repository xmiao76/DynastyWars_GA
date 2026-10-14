#!/usr/bin/env node
// CMR-10A: spear length by straight-line fit (RANSAC on wood-coloured shaft
// pixels), adapted from pike-line-zhangfei.mjs: component-masked sampling,
// both-end extension through fittings (tip through leaf blade + tassel,
// butt through the gold cap) for tip-to-butt, annotated overlay.
// Largest-wins cell mapping throughout (the zhangfei last-wins mapping
// measured a 1px speck as the walk guard once - fixed here and in
// prepare-zhaoyun.mjs).
//
//   node scripts/spear-line-zhaoyun.mjs
//
// Writes art/motion/zhaoyun/spear-lines.json (raw px) and
// artifacts/motion/zhaoyun/landmarks/spear-line-overlay.png.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/zhaoyun'
const OUT = 'artifacts/motion/zhaoyun/landmarks'
const SHEETS = {
  walk: 'walk-candidate-1.png',
  jab1: 'jab1-candidate-1.png',
  jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png',
  jump: 'jump-candidate-1b.png',
  fall: 'fall-candidate-1b.png',
  getup: 'getup-candidate-2-r1.png',
  misc: 'misc-candidate-2-r1.png',
  special: 'special-candidate-1-r1.png',
}
// Kept cells (prepare layout): position -> source cell (play order).
const KEEP = {
  walk: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  jab1: [1, 2, 3, 4, 5],
  jab2: [1, 2, 3, 4, 5],
  finisher: [1, 6, 3, 4, 5],
  jump: [1, 0, 2, 3, 5, 7],
  fall: [0, 1, 2, 3, 4],
  getup: [0, 1, 2, 8, 4],
  misc: [0, 1, 7, 3, 4],
  special: [0, 1, 2, 3, 4],
}
const LABELS = {
  walk: ['guard', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'],
  jab1: ['windup', 'drive', 'extension', 'follow', 'recover'],
  jab2: ['chamber-low', 'drive', 'extension', 'follow', 'recover'],
  finisher: ['coil', 'drive', 'extension', 'follow', 'recover'],
  jump: ['takeoff', 'ascent', 'apex', 'kick', 'descent', 'landing'],
  fall: ['topple', 'airborne', 'tumble', 'impact', 'DOWN'],
  getup: ['elbow', 'kneel', 'crouch', 'half-rise', 'stand'],
  misc: ['hurt-recoil', 'hurt-fold', 'grab-clamp', 'grab-hold', 'release'],
  special: ['raise', 'coil', 'pre-spin', 'strike', 'follow'],
}
const registration = JSON.parse(readFileSync(`${SRC}/registration.json`, 'utf8'))

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
// The serpent pike's shaft is a very DARK red-brown (rgb ~23,5,3 to
// 70,30,12; hue 0-22, s 0.5-0.95, v 0.02-0.45) - much darker than the
// spearman's wood, and the first gate missed it entirely in the
// getup/misc/special sheets. Hair/beard are near-black low-hue-wrap
// (hue ~340) and the tassel is bright red (v ~0.98): both excluded. Boots
// share the family but are short blobs the RANSAC pair-distance rejects.
const isWood = (r, g, b) => {
  if (r > 110 || r < 3) return false
  const { h, s, v } = hsv(r, g, b)
  return h <= 22 && s >= 0.5 && v >= 0.015 && v <= 0.45
}
const isSteel = (r, g, b) => Math.max(r, g, b) > 105 && Math.max(r, g, b) - Math.min(r, g, b) < 45

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

/** Pike line for one drawing, sampled ONLY through its component mask. */
function pikeLine(im, comp, mask, seed) {
  const wood = []
  const all = []
  for (const p of comp.pixels) {
    const x = p % im.width, y = (p / im.width) | 0
    const k = p * 4
    const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
    const w = isWood(r, g, b)
    if (w || isSteel(r, g, b)) all.push([x, y, w])
    if (w && x % 2 === 0 && y % 2 === 0) wood.push([x, y])
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
  if (ts.length < 40) return null
  // The torso legitimately interrupts the shaft when the pike crosses the
  // body (hands ~40px, chest ~120px) - a 40px gap rule split those runs.
  const GAP = 130
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

  // Which end is the tip? The serpent blade + red tassel sit at the tip end.
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

  // Extend BOTH ends through non-wood fittings (blade/tassel at the tip,
  // gold cap at the butt): walk outward while any MASK pixel of this
  // drawing lies within 8px of the axis (gaps <= 5px), capped at 150px.
  const opaqueAt = (t) => {
    const cx = mx + t * ux, cy = my + t * uy
    for (let o = -8; o <= 8; o += 2) {
      const x = Math.round(cx - o * uy), y = Math.round(cy + o * ux)
      if (x < 0 || y < 0 || x >= im.width || y >= im.height) continue
      if (mask[y * im.width + x]) return true
    }
    return false
  }
  const extend = (from, dir) => {
    let end = from, gap = 0
    for (let step = 1; step <= 180; step++) {
      const t = from + dir * step
      if (opaqueAt(t)) { end = t; gap = 0 } else if (++gap > 5) break
    }
    return end
  }
  const tip = extend(tipAtHigh ? bestRun.t1 : bestRun.t0, tipAtHigh ? 1 : -1)
  const butt = extend(tipAtHigh ? bestRun.t0 : bestRun.t1, tipAtHigh ? -1 : 1)
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
  }
}

const frames = []
const loaded = {}
for (const [seq, file] of Object.entries(SHEETS)) {
  const { cv, im } = await load(`${SRC}/${file}`)
  const comps = alphaComponents(im, 96)
  // All sheets 3x3. Largest-wins mapping (see header).
  const rows = 3, cols = 3
  const cellW = Math.floor(im.width / cols), cellH = Math.floor(im.height / rows)
  const byCell = new Map()
  for (const c of comps) {
    const cx = Math.min(cols - 1, Math.floor((c.x0 + c.x1 + 1) / 2 / cellW))
    const cy = Math.min(rows - 1, Math.floor((c.y0 + c.y1 + 1) / 2 / cellH))
    const k = cy * cols + cx
    if (!byCell.has(k) || c.area > byCell.get(k).area) byCell.set(k, c)
  }
  loaded[seq] = { cv, im }
  KEEP[seq].forEach((cell, pos) => {
    const comp = byCell.get(cell)
    if (!comp) return
    const mask = new Uint8Array(im.width * im.height)
    for (const p of comp.pixels) mask[p] = 1
    frames.push({ seq, pos, cell, label: LABELS[seq][pos], comp, mask, id: `${seq}:${pos}` })
  })
}

const results = []
frames.forEach((f, i) => {
  const L = loaded[f.seq]
  const scale = registration.sheets[f.seq].scale
  const raw = pikeLine(L.im, f.comp, f.mask, 1000 + i) ?? { length: null }
  const displayed = raw.length === null ? null : Math.round(raw.length * scale * 10) / 10
  results.push({ id: f.id, label: f.label, seq: f.seq, pos: f.pos, cell: f.cell, scale, displayed, ...raw })
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
g.fillText('ZHAO YUN SPEAR-LINE FIT (red = fitted axis, circles = tip/butt) - CMR-10A', 10, 24)
frames.forEach((f, idx) => {
  const L = loaded[f.seq]
  const r = results[idx]
  const ox = (idx % COLS) * CW
  const oy = 34 + Math.floor(idx / COLS) * CH
  const pad = 14
  const bx = f.comp.x0 - pad, by = f.comp.y0 - pad
  const bw = f.comp.x1 - f.comp.x0 + 1 + 2 * pad, bh = f.comp.y1 - f.comp.y0 + 1 + 2 * pad
  const k = Math.min((CW - 12) / bw, (CH - 34) / bh)
  g.drawImage(L.cv, bx, by, bw, bh, ox + 6, oy + 26, bw * k, bh * k)
  g.font = '13px sans-serif'
  g.fillStyle = '#fff'
  g.fillText(`${f.id} ${f.label} raw=${r.length ?? 'UNVERIFIED'} disp=${r.displayed ?? '-'}`, ox + 6, oy + 18)
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
for (const r of results) {
  console.log(`${r.id} ${String(r.label).padEnd(13)} raw=${String(r.length ?? 'UNVER').padStart(4)} disp=${String(r.displayed ?? '-').padStart(6)} cov=${String(r.shaftCoverage ?? '-').padStart(4)} angle=${String(r.angle ?? '-').padStart(4)} inliers=${r.inliers ?? '-'}`)
}
// Spread on fully-measurable cells (displayed px).
const vals = results.filter((r) => r.displayed !== null).map((r) => r.displayed)
if (vals.length) {
  const mn = Math.min(...vals), mx = Math.max(...vals)
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  console.log(`\nmeasured ${vals.length}/${results.length} cells | displayed ${mn}-${mx} | spread ${(100 * (mx - mn) / mean).toFixed(1)}% of mean`)
}
