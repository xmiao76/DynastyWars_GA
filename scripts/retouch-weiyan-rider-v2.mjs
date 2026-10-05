#!/usr/bin/env node
// CMR-11A: deterministic dismount-shaft extension for Wei Yan rider v2 cell 5.
//   node scripts/retouch-weiyan-rider-v2.mjs
// The spliced dismount drawing is a correct pose whose rigid dao reads 450px
// against ~481-516px in the neighbouring rider poses: the generator drew the
// rear haft short. The shaft is a straight, uniform wood cylinder, so
// lengthening it is a pure translation along its own axis (jump-landing
// method): the pommel/cap piece slides back along the measured 13.51 axis
// and the gap is filled from a per-row MEDIAN cross-section of the real
// shaft wood. Input hash-pinned; a documented authored retouch, NOT an
// image-model edit and NOT a request-ledger event.
import {createCanvas, loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC = 'art/motion/weiyan/rider-v2-prepared-source.png'
const OUT = 'art/motion/weiyan/rider-v2-retouched-source.png'
const EXPECTED = 'c80ff854b4126f4d8a7cc3bdf922a0132ce94f5906d6e0213b0edf6356472c8c'
const CELL = 5
// Axis through the pommel-cap centroid and ferrule centroid (measured with
// artifacts/tmpcheck/weiyan-rider5-axis.mjs on the pinned input).
const CAP = [1107.7, 492.4]
const ANGLE = (13.51 * Math.PI) / 180
const T0 = 20 // cap/flare end: profile stays shaft-narrow below, body at t>=24
const SLAB = [14, 20] // clean wood strip whose median fills the gap
const BAND = 40 // |o| limit of the moving piece
const O_SHAFT = [-8, 13] // wood cross-section at the slab
const SHIFT = [-29, -7] // integer shift, |shift| = 29.83px along the axis

const bytes = readFileSync(SRC)
if (createHash('sha256').update(bytes).digest('hex') !== EXPECTED) throw new Error('rider prepared source changed')
const image = await loadImage(bytes)
const W = image.width, H = image.height
const cv = createCanvas(W, H)
const g = cv.getContext('2d')
g.drawImage(image, 0, 0)
const data = g.getImageData(0, 0, W, H)
const d = data.data
const u = [Math.cos(ANGLE), Math.sin(ANGLE)]
const n = [-u[1], u[0]]
const coord = (x, y) => [(x - CAP[0]) * u[0] + (y - CAP[1]) * u[1], (x - CAP[0]) * n[0] + (y - CAP[1]) * n[1]]

const cw = Math.floor(W / 3), ch = Math.floor(H / 3)
const comp = alphaComponents(data, 96).filter((c) => c.area > 64).find((c) => {
  const cell = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / ch)) * 3 + Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cw))
  return cell === CELL
})
if (!comp) throw new Error('dismount component not found')
const own = new Set(comp.pixels)
// Isolation gate: the moving zone must hold nothing but cap/shaft.
for (const p of comp.pixels) {
  const x = p % W, y = (p / W) | 0
  const [t, o] = coord(x, y)
  if (t < T0 && (o < -15 || o > 25)) throw new Error(`cell5: unexpected pixel in moving zone at (${x},${y}) o=${o.toFixed(1)}`)
}

// 1. Lift the moving piece out of the sheet.
const moved = []
for (const p of comp.pixels) {
  const x = p % W, y = (p / W) | 0
  const [t, o] = coord(x, y)
  if (!(t < T0 && Math.abs(o) <= BAND)) continue
  moved.push({ x, y, px: [d[p * 4], d[p * 4 + 1], d[p * 4 + 2], d[p * 4 + 3]] })
}
if (moved.length < 800) throw new Error(`moving piece too small: ${moved.length}`)
for (const m of moved) d[(m.y * W + m.x) * 4 + 3] = 0
for (let y = comp.y0 - 6; y <= comp.y1 + 6; y++) {
  for (let x = comp.x0 - 6; x <= comp.x1 + 6; x++) {
    const [t, o] = coord(x, y)
    if (t < T0 && Math.abs(o) <= BAND && !own.has(y * W + x) && d[(y * W + x) * 4 + 3] < 96) d[(y * W + x) * 4 + 3] = 0
  }
}

// 2. Gap fill from a MEDIAN cross-section of the real shaft, sampled from
// the PRISTINE input (the slab sits inside the moved zone).
const im0 = await loadImage(bytes)
const c0 = createCanvas(W, H), g0 = c0.getContext('2d')
g0.drawImage(im0, 0, 0)
const frozen = new Uint8ClampedArray(g0.getImageData(0, 0, W, H).data)
const lenShift = Math.hypot(SHIFT[0], SHIFT[1])
const at = (x, y) => {
  const k = (Math.round(y) * W + Math.round(x)) * 4
  return [frozen[k], frozen[k + 1], frozen[k + 2], frozen[k + 3]]
}
const median = (arr) => [...arr].sort((a, b) => a - b)[arr.length >> 1]
const profile = new Map() // integer o -> [r,g,b,a]
for (let oi = Math.ceil(O_SHAFT[0]) - 1; oi <= Math.floor(O_SHAFT[1]) + 1; oi++) {
  const ch4 = [[], [], [], []]
  for (let ts = SLAB[0]; ts <= SLAB[1]; ts += 0.5) {
    const s = at(CAP[0] + ts * u[0] + oi * n[0], CAP[1] + ts * u[1] + oi * n[1])
    for (let c = 0; c < 4; c++) ch4[c].push(s[c])
  }
  profile.set(oi, ch4.map(median))
}
let filled = 0
for (let y = comp.y0 - 80; y <= comp.y1 + 80; y++) {
  for (let x = comp.x0 - 80; x <= comp.x1 + 80; x++) {
    const [t, o] = coord(x, y)
    if (t < T0 - lenShift || t >= T0 || o < O_SHAFT[0] || o > O_SHAFT[1]) continue
    const p = y * W + x
    if (!own.has(p) && frozen[p * 4 + 3] >= 96) throw new Error(`fill target hits foreign pixel at (${x},${y})`)
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
// 3. Re-place the moved piece (over the filler at its seam).
for (const m of moved) {
  const k = ((m.y + SHIFT[1]) * W + (m.x + SHIFT[0])) * 4
  d[k] = m.px[0]; d[k + 1] = m.px[1]; d[k + 2] = m.px[2]; d[k + 3] = m.px[3]
}
g.putImageData(data, 0, 0)

// Gates: nine separated figures, no edge contact.
const check = alphaComponents(g.getImageData(0, 0, W, H), 96).filter((c) => c.area > 64)
if (check.length !== 9) throw new Error(`retouch changed the figure count: ${check.length}`)
for (const c of check) if (c.x0 === 0 || c.y0 === 0 || c.x1 >= W - 1 || c.y1 >= H - 1) throw new Error('figure touches outer edge')
const png = cv.toBuffer('image/png')
writeFileSync(OUT, png)
console.log(JSON.stringify({ file: OUT, sha256: createHash('sha256').update(png).digest('hex'), moved: moved.length, filled, components: check.length }))
