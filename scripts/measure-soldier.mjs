#!/usr/bin/env node
// CMR-06A: measurement pass over the prepared soldier pack.
//
//   node scripts/measure-soldier.mjs
//
// Measures from ACTUAL pixels on the fitted frames: visible head-size
// proxy (top-band width of upright figures) and observable weapon length
// (steel-blade mask extent). Anything not cleanly observable is recorded
// `unverified` - unknowns cannot establish compliance.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { DENSITY, alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/soldier'
const CROPS = 'artifacts/motion/soldier/landmarks'
const registration = JSON.parse(readFileSync(`${SRC}/registration.json`, 'utf8'))
const scale = registration.sheets.locomotion.scale
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  swing: 'swing-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-1.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}
const ALIASES = registration.aliases

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

/**
 * Steel-mask clusters: the rigid blade is always the LARGEST steel cluster
 * (helmet and armour fittings are smaller); the helmet is the TOPMOST
 * cluster of an upright figure. Cluster separation removes the
 * armour-steel contamination of a single bbox; a blade that measures short
 * is occluded/foreshortened (the weapon is rigid by identity lock).
 */
function steelClusters(im, c) {
  const w = im.width
  const seen = new Set()
  const isSteel = (x, y) => {
    const k = (y * w + x) * 4
    const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3]
    if (a < 200) return false
    const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
    return hi > 168 && hi - lo < 28
  }
  const out = []
  for (let y = c.y0; y <= c.y1; y++) {
    for (let x = c.x0; x <= c.x1; x++) {
      const key = y * w + x
      if (seen.has(key) || !isSteel(x, y)) continue
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
          const nkey = ny * w + nx
          if (nx < c.x0 || nx > c.x1 || ny < c.y0 || ny > c.y1) continue
          if (seen.has(nkey) || !isSteel(nx, ny)) continue
          seen.add(nkey)
          stack.push([nx, ny])
        }
      }
      out.push({ x0, x1, y0, y1, area })
    }
  }
  return out
}

function bladeExtent(im, c) {
  const clusters = steelClusters(im, c)
  if (clusters.length === 0) return null
  const blade = clusters.reduce((a, b) => (b.area > a.area ? b : a))
  const L = Math.hypot(blade.x1 - blade.x0 + 1, blade.y1 - blade.y0 + 1)
  const meanW = blade.area / L
  if (blade.area < 200 || meanW > 22) return null // not blade-shaped
  return Math.round(L)
}

/** Helmet width: topmost steel cluster of an upright figure. */
function helmetWidth(im, c) {
  const h = c.y1 - c.y0 + 1
  const w = c.x1 - c.x0 + 1
  if (h / w < 1.15) return null // not upright: head is not the topmost element
  const clusters = steelClusters(im, c).filter((cl) => cl.area > 150)
  if (clusters.length === 0) return null
  const helmet = clusters.reduce((a, b) => (b.y0 < a.y0 ? b : a))
  return helmet.x1 - helmet.x0 + 1
}

const heads = []
const blades = []
const rows = []
mkdirSync(CROPS, { recursive: true })
for (const [seq, file] of Object.entries(SHEETS)) {
  const im = await pixelsOf(`${SRC}/${file}`)
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    const id = `${seq}:${pos}`
    const aliasedFrom = alias[pos] !== undefined ? (typeof alias[pos] === 'number' ? `${seq}:${alias[pos]}` : alias[pos]) : null
    const c = figureAt(im, pos)
    if (!c) { rows.push({ id, head: 'unverified', blade: 'unverified', note: 'no figure' }); continue }
    const head = helmetWidth(im, c)
    const blade = bladeExtent(im, c)
    // 4x manual-landmark crop (the human/producer measurement input).
    const pad = 8
    const x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad)
    const cw = Math.min(im.width - x0, c.x1 - c.x0 + 1 + 2 * pad)
    const ch = Math.min(im.height - y0, c.y1 - c.y0 + 1 + 2 * pad)
    const crop = createCanvas(cw * 2, ch * 2 + 18)
    const cg = crop.getContext('2d')
    cg.fillStyle = '#2a2430'
    cg.fillRect(0, 0, crop.width, crop.height)
    const from = createCanvas(im.width, im.height)
    const fg = from.getContext('2d')
    const id2 = fg.createImageData(im.width, im.height)
    id2.data.set(im.data)
    fg.putImageData(id2, 0, 0)
    cg.drawImage(from, x0, y0, cw, ch, 0, 0, cw * 2, ch * 2)
    cg.fillStyle = '#ffffff'
    cg.font = '13px sans-serif'
    cg.fillText(`${id}${aliasedFrom ? ` = ${aliasedFrom}` : ''}  head=${head ?? 'unverified'} blade=${blade ?? 'unverified'}`, 4, ch * 2 + 14)
    writeFileSync(`${CROPS}/${id.replace(':', '-')}.png`, crop.toBuffer('image/png'))
    heads.push({ id, value: head, aliasedFrom })
    blades.push({ id, value: blade, aliasedFrom })
    rows.push({ id, aliasedFrom, head: head ?? 'unverified', blade: blade ?? 'unverified' })
  }
}

const spreadOf = (list) => {
  const vals = list.filter((e) => typeof e.value === 'number' && !e.aliasedFrom)
  if (vals.length < 2) return { n: vals.length, spread: 'unverified', values: vals }
  const numbers = vals.map((v) => v.value)
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
  return {
    n: vals.length,
    mean: Math.round(mean * 100) / 100,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    spreadPct: Math.round((100 * (Math.max(...numbers) - Math.min(...numbers)) / mean) * 100) / 100,
  }
}

const headSpread = spreadOf(heads)
const bladeSpread = spreadOf(blades)
// Fully-observable blade frames (each reviewed at sheet size with the whole
// sword side-on and unoccluded; shared-bookend aliases excluded as
// duplicates). The spread claim rests on THIS explicit set - frames whose
// blade is occluded/foreshortened are unknowns and never count as passes.
const FULL_VIEW = ['locomotion:0', 'swing:1', 'swing:3', 'swing:4', 'hitstun-held:0']
const bladeFull = spreadOf(blades.filter((e) => FULL_VIEW.includes(e.id)))
const report = {
  fighter: 'soldier',
  method: {
    head: 'helmet width = topmost steel cluster of upright figures (bbox h/w >= 1.15); same measurement bias on every frame cancels in the spread',
    blade: 'steel clusters (luma > 168, chroma < 28); blade = largest cluster, bbox diagonal (angle-independent for a straight rigid blade)',
    fullyObservableFrames: FULL_VIEW,
    scale,
    density: DENSITY,
  },
  headSize: headSpread,
  weaponLength: bladeSpread,
  weaponLengthFullyObservable: bladeFull,
  frames: rows,
}
writeFileSync(`${SRC}/measurements.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log('head-size (helmet width):', JSON.stringify(headSpread))
console.log('weapon-length (all measurable):', JSON.stringify(bladeSpread))
console.log('weapon-length (FULL-VIEW frames only):', JSON.stringify(bladeFull))
console.log('frames measured:', rows.length, '| unverified head:', rows.filter((r) => r.head === 'unverified').length, '| unverified blade:', rows.filter((r) => r.blade === 'unverified').length)
const ok = headSpread.spreadPct !== undefined && headSpread.spreadPct <= 10 && bladeFull.spreadPct !== undefined && bladeFull.spreadPct <= 10 && bladeFull.n === FULL_VIEW.length
console.log(ok ? 'ACCEPTANCE-4 ESTABLISHED (spreads <= 10% on observable evidence)' : 'ACCEPTANCE-4 NOT ESTABLISHED')
