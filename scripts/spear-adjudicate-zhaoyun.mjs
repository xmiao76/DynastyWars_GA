#!/usr/bin/env node
// CMR-10A: acceptance-4 spear adjudication. Exclusion grounds are
// GEOMETRIC and independent of the measured length (the 08A rule: no
// value-based cherry-picking). For every measured cell, classify each
// endpoint's pixel family: true fittings (gold butt cap / steel blade /
// red tassel) = FULL; boot/leather or skin = axis BLEED into the body;
// mid-shaft wood or nothing = OCCLUDED/CUT extension. Also computes the
// >60-degree direction-step check per sequence from the fitted angles.
// Largest-wins cell mapping (see spear-line-zhaoyun.mjs header).
//
//   node scripts/spear-adjudicate-zhaoyun.mjs

import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/zhaoyun'
const SHEETS = {
  walk: 'walk-candidate-1.png', jab1: 'jab1-candidate-1.png', jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png', jump: 'jump-candidate-1b.png', fall: 'fall-candidate-1b.png',
  getup: 'getup-candidate-2.png', misc: 'misc-candidate-2.png', special: 'special-candidate-1.png',
  rider: 'rider-candidate-1.png',
}
const lines = JSON.parse(readFileSync(`${SRC}/spear-lines.json`, 'utf8'))

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
// Pixel families around an endpoint (warm bright gold cap, grey-blue
// blade, bright red tassel, dark red-brown shaft, leather boot, skin).
const family = (r, g, b) => {
  const { h, s, v } = hsv(r, g, b)
  if (r > 150 && g > 105 && b < 130 && h >= 25 && h <= 55 && s > 0.3) return 'gold'
  if (r > 140 && g < 95 && b < 95 && s > 0.5) return 'red'
  if (v > 0.32 && s < 0.4 && b >= g - 8) return 'steel'
  if (v > 0.72 && s > 0.25 && s < 0.62 && h >= 10 && h <= 40) return 'skin'
  if (h <= 22 && s >= 0.5 && v >= 0.015 && v <= 0.45 && r <= 110) return 'wood'
  if (h >= 12 && h <= 40 && s >= 0.45 && v > 0.22 && v <= 0.72 && r > 90) return 'leather'
  return 'other'
}

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

const out = []
const loaded = {}
for (const r of lines) {
  if (r.length === null) {
    out.push({ id: r.id, label: r.label, verdict: 'UNVERIFIED (no line fit)', grounds: 'RANSAC found no shaft run' })
    continue
  }
  if (!loaded[r.seq]) loaded[r.seq] = await load(`${SRC}/${SHEETS[r.seq]}`)
  const im = loaded[r.seq]
  const comps = alphaComponents(im, 96)
  const rows = 3, cols = 3
  const cellW = Math.floor(im.width / cols), cellH = Math.floor(im.height / rows)
  let comp = null
  for (const c of comps) {
    const cx = Math.min(cols - 1, Math.floor((c.x0 + c.x1 + 1) / 2 / cellW))
    const cy = Math.min(rows - 1, Math.floor((c.y0 + c.y1 + 1) / 2 / cellH))
    if (cy * cols + cx === r.cell && (!comp || c.area > comp.area)) comp = c
  }
  const mask = new Uint8Array(im.width * im.height)
  if (comp) for (const p of comp.pixels) mask[p] = 1
  const fams = (pt) => {
    const counts = {}
    for (let dy = -7; dy <= 7; dy++) {
      for (let dx = -7; dx <= 7; dx++) {
        const x = pt[0] + dx, y = pt[1] + dy
        if (x < 0 || y < 0 || x >= im.width || y >= im.height) continue
        const p = y * im.width + x
        if (!mask[p]) continue
        const k = p * 4
        const f = family(im.data[k], im.data[k + 1], im.data[k + 2])
        counts[f] = (counts[f] ?? 0) + 1
      }
    }
    return counts
  }
  const ca = fams(r.a), cb = fams(r.b)
  // Ink outlines and unclassified edge pixels are the drawings' line work -
  // they dominate any neighbourhood and carry no endpoint information.
  const fittingCount = (c) => (c.gold ?? 0) + (c.steel ?? 0) + (c.red ?? 0)
  const bodyCount = (c) => (c.skin ?? 0) + (c.leather ?? 0)
  // Presence-based per side: the butt carries the gold cap (>=4px), the tip
  // the tapered blade/tassel (steel+red >= 2px - the tip is thin and a
  // 7px-radius sample legitimately sees only a few blade pixels). Ink
  // outlines dominate any neighbourhood and carry no endpoint information.
  const endState = (c) => {
    const fit = fittingCount(c), body = bodyCount(c)
    if ((c.gold ?? 0) >= 4 || (c.steel ?? 0) + (c.red ?? 0) >= 2) return 'fitting'
    if (body >= 12 && body > fit) return 'body'
    return 'cut'
  }
  const endA = endState(ca), endB = endState(cb)
  const detail = (c) => JSON.stringify(Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'other')))
  let verdict, grounds
  if (endA === 'fitting' && endB === 'fitting') {
    verdict = 'FULL'
    grounds = `endpoints on spear fittings (a ${detail(ca)}; b ${detail(cb)})`
  } else if (endA === 'body' || endB === 'body') {
    verdict = 'REJECT (axis bleed)'
    grounds = `endpoint on body/boot pixels at the axis end (a=${endA} ${detail(ca)}; b=${endB} ${detail(cb)})`
  } else {
    verdict = 'REJECT (occluded/cut)'
    grounds = `endpoint past the visible fitting (a=${endA} ${detail(ca)}; b=${endB} ${detail(cb)})`
  }
  out.push({ id: r.id, label: r.label, seq: r.seq, displayed: r.displayed, angle: r.angle, verdict, grounds, endA, endB })
}

// Direction steps per sequence (fitted angles; >60deg needs an authored bridge).
const seqs = {}
for (const o of out) if (o.angle !== undefined) (seqs[o.seq] ??= []).push(o)
const steps = []
for (const [seq, rows] of Object.entries(seqs)) {
  rows.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  for (let i = 1; i < rows.length; i++) {
    const d = Math.abs(rows[i].angle - rows[i - 1].angle)
    const step = d > 180 ? 360 - d : d
    steps.push({ seq, from: rows[i - 1].id, to: rows[i].id, step, angleFrom: rows[i - 1].angle, angleTo: rows[i].angle })
  }
}
const over = steps.filter((s) => s.step > 60)
console.log('=== per-cell adjudication ===')
for (const o of out) console.log(`${o.id} ${String(o.label).padEnd(13)} disp=${String(o.displayed ?? '-').padStart(6)}  ${o.verdict.padEnd(24)} ${o.grounds}`)
const full = out.filter((o) => o.verdict === 'FULL')
if (full.length) {
  const vals = full.map((o) => o.displayed)
  const mn = Math.min(...vals), mx = Math.max(...vals), mean = vals.reduce((a, b) => a + b, 0) / vals.length
  console.log(`\n=== FULL set: ${full.length}/${out.length} cells | displayed ${mn}-${mx} | spread ${(100 * (mx - mn) / mean).toFixed(1)}% of mean ===`)
  for (const o of full) console.log('  ', o.id, o.displayed)
}
console.log(`\n=== direction steps >60deg: ${over.length} ===`)
for (const s of over) console.log(`  ${s.seq}: ${s.from}(${s.angleFrom}) -> ${s.to}(${s.angleTo}) step ${s.step}deg`)
console.log(`total steps ${steps.length}`)
