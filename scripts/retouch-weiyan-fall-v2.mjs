#!/usr/bin/env node
// CMR-11A: deterministic rigid-length retouch for Wei Yan fall v2.
//   node scripts/retouch-weiyan-fall-v2.mjs
// Tumble cell2 is SHORT (438px): rear cap piece slides BACK along the shaft
// axis and the gap is median-filled with real shaft wood (jump-landing method).
// DOWN cell4 is LONG (558px): rear cap piece slides FORWARD, overlapping
// shaft (no fill invented). Poses untouched; input hash-pinned; a documented
// authored retouch, NOT an image-model edit and NOT a request-ledger event.
import {createCanvas, loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC = 'art/motion/weiyan/fall-v2-candidate-1.png'
const OUT = 'art/motion/weiyan/fall-v2-retouched-source.png'
const EXPECTED = '3516d964263538ef8668ce7e8dba8c532ca42ae6741fe367665f8a138a960879'
// Axis through pommel-cap and ferrule centroids (tmpcheck/weiyan-fall-axis.mjs).
const OPS = [
  { cell: 2, mode: 'extend', cap: [1099.0, 200.8], angle: 1.93, t0: 24, oBand: [-40, 40], oShaft: [-4, 14], slab: [18, 24], shift: [-47, -2], gateColor: false },
  { cell: 4, mode: 'shorten', cap: [567.3, 638.4], angle: 1.39, t0: 24, oBand: [-8, 24], oShaft: null, slab: null, shift: [68, 2], gateColor: true },
]

// NOTE: an earlier version excluded skin/purple pixels from the moving piece
// by color. Removed: mid-tone shaft wood (128,89,22) kept tripping any skin
// cut that still caught real tan skin. Selection is purely geometric now;
// the transparent gap strip between head and cap is enforced as a hard gate
// instead, and the 5x seam crop is reviewed by eye like the jump retouch.

const bytes = readFileSync(SRC)
if (createHash('sha256').update(bytes).digest('hex') !== EXPECTED) throw new Error('fall source changed')
const image = await loadImage(bytes)
const W = image.width, H = image.height
const cv = createCanvas(W, H)
const g = cv.getContext('2d')
g.drawImage(image, 0, 0)
const data = g.getImageData(0, 0, W, H)
const d = data.data
const cw = Math.floor(W / 3), ch = Math.floor(H / 3)
const byCell = new Map()
for (const c of alphaComponents(data, 96).filter((c) => c.area > 64)) {
  const cell = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / ch)) * 3 + Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cw))
  if (byCell.has(cell)) throw new Error(`duplicate figure at cell ${cell}`)
  byCell.set(cell, c)
}
if (byCell.size !== 9) throw new Error('expected nine source cells')
const report = []
for (const op of OPS) {
  const comp = byCell.get(op.cell)
  const own = new Set(comp.pixels)
  const u = [Math.cos((op.angle * Math.PI) / 180), Math.sin((op.angle * Math.PI) / 180)]
  const n = [-u[1], u[0]]
  const coord = (x, y) => [(x - op.cap[0]) * u[0] + (y - op.cap[1]) * u[1], (x - op.cap[0]) * n[0] + (y - op.cap[1]) * n[1]]
  const inBand = (t, o) => t < op.t0 && o >= op.oBand[0] && o <= op.oBand[1]
  if (op.cell === 2) {
    // Cap must be isolated: transparent strips beyond o=-12 / o=+24 for t<24.
    for (let y = comp.y0 - 4; y <= comp.y1 + 4; y++) {
      for (let x = comp.x0 - 4; x <= comp.x1 + 4; x++) {
        const [t, o] = coord(x, y)
        if (t < op.t0 && (o < -12 || o > 24) && d[(y * W + x) * 4 + 3] >= 96 && own.has(y * W + x)) {
          throw new Error(`cell2: unexpected neighbor pixel in isolation strip at (${x},${y})`)
        }
      }
    }
  }
  // Lift the moving piece. Cell4's cap nearly touches the turban (1-2px
  // transparent gap), so instead of a geometric band it flood-fills from
  // the cap centroid through figure pixels with t<24: the gap stops any
  // leak into the head, and a count gate (a leak would add 10k+ turban
  // pixels to a ~1.1k cap piece) proves it. The 5x seam crop is reviewed.
  const moved = []
  if (op.cell === 4) {
    let seed = null
    for (let r = 0; r < 12 && !seed; r++) {
      for (let dy = -r; dy <= r && !seed; dy++) {
        for (let dx = -r; dx <= r && !seed; dx++) {
          const x = Math.round(op.cap[0]) + dx, y = Math.round(op.cap[1]) + dy
          if (own.has(y * W + x)) seed = [x, y]
        }
      }
    }
    if (!seed) throw new Error('cell4: no opaque seed at cap centroid')
    const seen = new Set([seed[1] * W + seed[0]])
    const stack = [seed]
    while (stack.length) {
      const [x, y] = stack.pop()
      const [t, o] = coord(x, y)
      if (!(t < 24 && o > -30 && o < 30)) continue
      const k = (y * W + x) * 4
      moved.push({ x, y, px: [d[k], d[k + 1], d[k + 2], d[k + 3]] })
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]) {
        const nk = ny * W + nx
        if (!seen.has(nk) && own.has(nk)) { seen.add(nk); stack.push([nx, ny]) }
      }
    }
    if (moved.length < 800 || moved.length > 3000) throw new Error(`cell4: cap flood size ${moved.length}, expected ~1100`)
  } else {
    for (const p of comp.pixels) {
      const x = p % W, y = (p / W) | 0
      const [t, o] = coord(x, y)
      if (!inBand(t, o)) continue
      const k = p * 4
      moved.push({ x, y, px: [d[k], d[k + 1], d[k + 2], d[k + 3]] })
    }
    if (moved.length < 800) throw new Error(`cell${op.cell}: moving piece too small: ${moved.length}`)
  }
  for (const m of moved) d[(m.y * W + m.x) * 4 + 3] = 0
  for (let y = comp.y0 - 6; y <= comp.y1 + 6; y++) {
    for (let x = comp.x0 - 6; x <= comp.x1 + 6; x++) {
      const [t, o] = coord(x, y)
      if (inBand(t, o) && !own.has(y * W + x) && d[(y * W + x) * 4 + 3] < 96) d[(y * W + x) * 4 + 3] = 0
    }
  }
  let filled = 0
  if (op.mode === 'extend') {
    // Median cross-section fill; targets must be transparent or own pixels.
    // The slab lives inside the moved zone, so sample it from the PRISTINE
    // input (re-decoded from bytes), not from the post-clear buffer.
    const im0 = await loadImage(bytes)
    const c0 = createCanvas(W, H), g0 = c0.getContext('2d')
    g0.drawImage(im0, 0, 0)
    const frozen = new Uint8ClampedArray(g0.getImageData(0, 0, W, H).data)
    const at = (x, y) => {
      const k = (Math.round(y) * W + Math.round(x)) * 4
      return [frozen[k], frozen[k + 1], frozen[k + 2], frozen[k + 3]]
    }
    const median = (arr) => [...arr].sort((a, b) => a - b)[arr.length >> 1]
    const profile = new Map()
    for (let oi = Math.ceil(op.oShaft[0]) - 1; oi <= Math.floor(op.oShaft[1]) + 1; oi++) {
      const ch4 = [[], [], [], []]
      for (let ts = op.slab[0]; ts <= op.slab[1]; ts += 0.5) {
        const s = at(op.cap[0] + ts * u[0] + oi * n[0], op.cap[1] + ts * u[1] + oi * n[1])
        for (let c = 0; c < 4; c++) ch4[c].push(s[c])
      }
      profile.set(oi, ch4.map(median))
    }
    const lenShift = Math.hypot(op.shift[0], op.shift[1])
    for (let y = comp.y0 - 80; y <= comp.y1 + 80; y++) {
      for (let x = comp.x0 - 80; x <= comp.x1 + 80; x++) {
        const [t, o] = coord(x, y)
        if (t < op.t0 - lenShift || t >= op.t0 || o < op.oShaft[0] || o > op.oShaft[1]) continue
        const p = y * W + x
        if (!own.has(p) && frozen[p * 4 + 3] >= 96) throw new Error(`cell${op.cell}: fill target hits foreign pixel at (${x},${y})`)
        const lo = Math.floor(o), hi = lo + 1, f = o - lo
        const a = profile.get(lo), b = profile.get(hi)
        if (!a || !b) continue
        const s = a.map((v, c) => v * (1 - f) + b[c] * f)
        if (s[3] < 64) continue
        const k = p * 4
        d[k] = s[0]; d[k + 1] = s[1]; d[k + 2] = s[2]; d[k + 3] = Math.min(255, s[3])
        filled++
      }
    }
  }
  for (const m of moved) {
    const k = ((m.y + op.shift[1]) * W + (m.x + op.shift[0])) * 4
    d[k] = m.px[0]; d[k + 1] = m.px[1]; d[k + 2] = m.px[2]; d[k + 3] = m.px[3]
  }
  report.push({ cell: op.cell, mode: op.mode, moved: moved.length, filled })
}
g.putImageData(data, 0, 0)
const check = alphaComponents(g.getImageData(0, 0, W, H), 96).filter((c) => c.area > 64)
if (check.length !== 9) throw new Error(`retouch changed the figure count: ${check.length} ` + JSON.stringify(check.map((c) => [c.area, c.x0, c.y0, c.x1, c.y1]).sort((a, b) => a[1] - b[1])))
for (const c of check) if (c.x0 === 0 || c.y0 === 0 || c.x1 >= W - 1 || c.y1 >= H - 1) throw new Error('figure touches outer edge')
const png = cv.toBuffer('image/png')
writeFileSync(OUT, png)
console.log(JSON.stringify({ file: OUT, sha256: createHash('sha256').update(png).digest('hex'), components: check.length, ops: report }))
