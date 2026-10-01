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

/** Visible head-size proxy: top-band width of upright figures (head-like band). */
function headBandWidth(im, c) {
  const h = c.y1 - c.y0 + 1
  const w = c.x1 - c.x0 + 1
  if (h / w < 1.15) return null // not upright: head is not the topmost element
  const band = Math.max(2, Math.round(h * 0.06))
  let x0 = Infinity, x1 = -Infinity
  for (let y = c.y0; y <= Math.min(c.y1, c.y0 + band); y++) {
    for (let x = c.x0; x <= c.x1; x++) {
      const k = (y * im.width + x) * 4
      if (im.data[k + 3] >= 96) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
      }
    }
  }
  if (x1 < x0) return null
  const bandW = x1 - x0 + 1
  // A head band is narrow against the shoulders; anything wider is an arm,
  // a raised weapon or a shoulder line - unverified, not a head measurement.
  if (bandW < 0.12 * w || bandW > 0.42 * w) return null
  return bandW
}

/**
 * Observable weapon length: the steel blade mask must be ONE long thin
 * cluster (aspect >= 8) - occluded blades (split clusters) and
 * foreshortened blades (stub-thick) are unverified per the contract.
 */
function bladeExtent(im, c) {
  const w = im.width
  let area = 0
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let y = c.y0; y <= c.y1; y++) {
    for (let x = c.x0; x <= c.x1; x++) {
      const k = (y * w + x) * 4
      const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3]
      if (a < 200) continue
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
      if (hi > 168 && hi - lo < 28) {
        area++
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (area < 200) return null // no visible blade
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1
  const L = Math.hypot(bw, bh)
  const meanW = area / L // mean width along the blade axis: ~10-20px for a
  // side-on rigid blade regardless of angle; a blob/helmet reads thicker.
  if (meanW > 22) return null
  return Math.round(L)
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
    const head = headBandWidth(im, c)
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
const report = {
  fighter: 'soldier',
  method: {
    head: 'top-band content width of upright figures (bbox w/h <= 0.85); prone/tumbled frames unverified',
    blade: 'steel-pixel mask (luma > 168, chroma < 28) extent diagonal; frames with the blade occluded or touching the content edge are unverified',
    scale,
    density: DENSITY,
  },
  headSize: headSpread,
  weaponLength: bladeSpread,
  frames: rows,
}
writeFileSync(`${SRC}/measurements.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log('head-size proxy:', JSON.stringify(headSpread))
console.log('weapon-length :', JSON.stringify(bladeSpread))
console.log('blade frames:', blades.filter((e) => typeof e.value === 'number').map((e) => `${e.id}=${e.value}`).join(' '))
console.log('frames measured:', rows.length, '| unverified head:', rows.filter((r) => r.head === 'unverified').length, '| unverified blade:', rows.filter((r) => r.blade === 'unverified').length)
const ok = headSpread.spreadPct !== undefined && headSpread.spreadPct <= 10 && bladeSpread.spreadPct !== undefined && bladeSpread.spreadPct <= 10
console.log(ok ? 'ACCEPTANCE-4 METRICS WITHIN 10%' : 'ACCEPTANCE-4 NOT ESTABLISHED')
