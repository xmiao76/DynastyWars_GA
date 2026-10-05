// CMR deterministic shaft retouch (owner-approved Acceptance-4 framework).
//
// Generalizes the CMR-11A mechanism that took Wei Yan FULL-56 weapon spread
// 31.3% -> 9.1% with ZERO image requests: a rigid shaft end slides along its
// own axis (extend: cap moves back + median-profile wood fill; shorten: cap
// moves forward + overlap). Poses untouched, inputs hash-pinned by the
// driver, per-op isolation/fill/achieved gates, per-file count/edge gates,
// atomic staging (drivers must not write unless every gate passes).
//
// This module is pixel mechanics only: axis params come from agent-measured
// crops, endpoint measurement via a caller hook. It is authored pixel
// repair, NOT an image-model edit and NOT a request-ledger event.
import { alphaComponents } from './motion-pipeline.mjs'

export const ALPHA = 96
export const SPECK_PX = 64
export const DEFAULT_TOLERANCE_PX = 1
export const DEFAULT_MIN_PIECE_PX = 500
export const DEFAULT_MAX_SHORTEN_PX = 3000
export const DEFAULT_ISOLATION_MARGIN = 12

/** Cell index of a component's bbox centre on a rows×cols sheet grid. */
export function gridCellOf(rows, cols) {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new Error('retouch: grid needs positive integer rows/cols')
  }
  return (comp, W, H) => {
    const cx = Math.min(cols - 1, Math.floor((comp.x0 + comp.x1 + 1) / 2 / Math.floor(W / cols)))
    const cy = Math.min(rows - 1, Math.floor((comp.y0 + comp.y1 + 1) / 2 / Math.floor(H / rows)))
    return cy * cols + cx
  }
}

function frame(cap, angleDeg) {
  const a = (angleDeg * Math.PI) / 180
  const u = [Math.cos(a), Math.sin(a)]
  const n = [-u[1], u[0]]
  return {
    u,
    n,
    coord: (x, y) => [(x - cap[0]) * u[0] + (y - cap[1]) * u[1], (x - cap[0]) * n[0] + (y - cap[1]) * n[1]],
  }
}

function bandTest(band) {
  if (Array.isArray(band)) {
    if (band.length !== 2 || !band.every(Number.isFinite) || !(band[0] < band[1])) throw new Error('retouch: band must be a width or [lo, hi]')
    return { test: (t, o, t0) => t < t0 && o >= band[0] && o <= band[1], lo: band[0], hi: band[1] }
  }
  if (!Number.isFinite(band) || band <= 0) throw new Error('retouch: band must be a width or [lo, hi]')
  return { test: (t, o, t0) => t < t0 && Math.abs(o) <= band, lo: -band, hi: band }
}

function checkOp(op) {
  if (!op || !Number.isInteger(op.cell) || op.cell < 0) throw new Error('retouch: op needs an integer cell')
  if (op.mode !== 'extend' && op.mode !== 'shorten') throw new Error('retouch: mode must be extend or shorten')
  if (!Array.isArray(op.cap) || op.cap.length !== 2 || !op.cap.every(Number.isFinite)) throw new Error('retouch: cap must be [x, y]')
  if (!Number.isFinite(op.angleDeg)) throw new Error('retouch: angleDeg must be finite')
  if (!Number.isFinite(op.t0)) throw new Error('retouch: t0 must be finite')
  if (!Array.isArray(op.shift) || op.shift.length !== 2 || !op.shift.every(Number.isInteger)) throw new Error('retouch: shift must be [int, int]')
  if (!Number.isFinite(op.predicted)) throw new Error('retouch: predicted achieved length required')
  if (op.mode === 'extend') {
    if (!Array.isArray(op.oShaft) || op.oShaft.length !== 2 || !op.oShaft.every(Number.isFinite) || !(op.oShaft[0] < op.oShaft[1])) {
      throw new Error('retouch: extend needs oShaft [lo, hi]')
    }
    if (!Array.isArray(op.slab) || op.slab.length !== 2 || !op.slab.every(Number.isFinite) || !(op.slab[0] < op.slab[1])) {
      throw new Error('retouch: extend needs slab [t0, t1] of clean shaft')
    }
  }
}

/**
 * Execute one rigid-axis retouch op on `im` ({width, height, data}) IN PLACE.
 * hooks: cellOf(comp, W, H), measure(im, comp) -> achieved length px,
 * rejectColor(r, g, b) -> true to exclude a slab sample (e.g. robe edge).
 * Returns { moved, filled, achieved }. Throws on any gate failure; callers
 * seeking atomicity across files must stage (copy-on-write) before calling.
 */
export function applyRetouchOp(im, op, hooks) {
  checkOp(op)
  const { W, H } = { W: im.width, H: im.height }
  const d = im.data
  if (!(d instanceof Uint8ClampedArray) || d.length !== W * H * 4) throw new Error('retouch: im must be { width, height, data:Uint8ClampedArray }')
  const { cellOf, measure, rejectColor } = hooks ?? {}
  if (typeof cellOf !== 'function' || typeof measure !== 'function') throw new Error('retouch: cellOf + measure hooks required')
  const reject = typeof rejectColor === 'function' ? rejectColor : () => false
  const tolerancePx = op.tolerancePx ?? DEFAULT_TOLERANCE_PX
  const minPiecePx = op.minPiecePx ?? DEFAULT_MIN_PIECE_PX
  const maxShortenPx = op.maxShortenPx ?? DEFAULT_MAX_SHORTEN_PX
  const margin = op.isolationMargin ?? DEFAULT_ISOLATION_MARGIN
  const { coord } = frame(op.cap, op.angleDeg)
  const inBand = bandTest(op.band)

  const comps = alphaComponents({ width: W, height: H, data: d }, ALPHA).filter((c) => c.area > SPECK_PX)
  const comp = comps.find((c) => cellOf(c, W, H) === op.cell)
  if (!comp) throw new Error(`retouch cell${op.cell}: component missing`)
  const own = new Set(comp.pixels)

  // Isolation gate (extend): no foreign body pixels may sit in the slide
  // zone outside the shaft + taper margin. Far body outside the band is safe.
  if (op.mode === 'extend') {
    for (const p of comp.pixels) {
      const x = p % W, y = (p / W) | 0
      const [t, o] = coord(x, y)
      if (t < op.t0 && ((o >= inBand.lo && o < op.oShaft[0] - margin) || (o > op.oShaft[1] + margin && o <= inBand.hi))) {
        throw new Error(`retouch cell${op.cell}: unexpected pixel in moving zone (${x},${y}) o=${o.toFixed(1)}`)
      }
    }
  }

  // Pristine snapshot BEFORE mutation: slabs may overlap the moved zone.
  const frozen = new Uint8ClampedArray(d)
  const moved = []
  for (const p of comp.pixels) {
    const x = p % W, y = (p / W) | 0
    const [t, o] = coord(x, y)
    if (!inBand.test(t, o, op.t0)) continue
    const k = p * 4
    moved.push({ x, y, px: [d[k], d[k + 1], d[k + 2], d[k + 3]] })
  }
  if (moved.length < minPiecePx) throw new Error(`retouch cell${op.cell}: moving piece too small: ${moved.length}`)
  if (op.mode === 'shorten' && moved.length > maxShortenPx) {
    throw new Error(`retouch cell${op.cell}: moving piece too big (${moved.length}), body included?`)
  }
  for (const m of moved) d[(m.y * W + m.x) * 4 + 3] = 0
  for (let y = comp.y0 - 6; y <= comp.y1 + 6; y++) {
    for (let x = comp.x0 - 6; x <= comp.x1 + 6; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const [t, o] = coord(x, y)
      if (inBand.test(t, o, op.t0) && !own.has(y * W + x) && d[(y * W + x) * 4 + 3] < ALPHA) d[(y * W + x) * 4 + 3] = 0
    }
  }

  let filled = 0
  if (op.mode === 'extend') {
    // Median cross-section profile from the clean slab: preserves the
    // wood's lengthwise shading without repeating per-pixel grain.
    const at = (x, y) => {
      const k = (Math.round(y) * W + Math.round(x)) * 4
      return [frozen[k], frozen[k + 1], frozen[k + 2], frozen[k + 3]]
    }
    const median = (arr) => [...arr].sort((a, b) => a - b)[arr.length >> 1]
    const profile = new Map()
    for (let oi = Math.ceil(op.oShaft[0]) - 1; oi <= Math.floor(op.oShaft[1]) + 1; oi++) {
      const ch4 = [[], [], [], []]
      for (let ts = op.slab[0]; ts <= op.slab[1]; ts += 0.5) {
        const sx = Math.round(op.cap[0] + ts * Math.cos((op.angleDeg * Math.PI) / 180) + oi * -Math.sin((op.angleDeg * Math.PI) / 180))
        const sy = Math.round(op.cap[1] + ts * Math.sin((op.angleDeg * Math.PI) / 180) + oi * Math.cos((op.angleDeg * Math.PI) / 180))
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue
        const s = at(sx, sy)
        if (reject(s[0], s[1], s[2])) continue
        for (let c = 0; c < 4; c++) ch4[c].push(s[c])
      }
      if (!ch4[3].length) throw new Error(`retouch cell${op.cell}: empty slab row o=${oi}`)
      profile.set(oi, ch4.map(median))
    }
    const lenShift = Math.hypot(op.shift[0], op.shift[1])
    for (let y = comp.y0 - 140; y <= comp.y1 + 140; y++) {
      for (let x = comp.x0 - 140; x <= comp.x1 + 140; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue // never wrap rows
        const [t, o] = coord(x, y)
        if (t < op.t0 - lenShift || t >= op.t0 || o < op.oShaft[0] || o > op.oShaft[1]) continue
        const p = y * W + x
        if (!own.has(p) && frozen[p * 4 + 3] >= ALPHA) {
          throw new Error(`retouch cell${op.cell}: fill target hits foreign pixel at (${x},${y})`)
        }
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
    const nx = m.x + op.shift[0], ny = m.y + op.shift[1]
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) throw new Error(`retouch cell${op.cell}: move target out of bounds (${nx},${ny})`)
    const k = (ny * W + nx) * 4
    d[k] = m.px[0]; d[k + 1] = m.px[1]; d[k + 2] = m.px[2]; d[k + 3] = m.px[3]
  }

  // Achieved-vs-predicted gate: the op must land its stated length.
  const after = alphaComponents({ width: W, height: H, data: d }, ALPHA).filter((c) => c.area > SPECK_PX)
  const compAfter = after.find((c) => cellOf(c, W, H) === op.cell)
  if (!compAfter) throw new Error(`retouch cell${op.cell}: component lost after op`)
  const achieved = measure({ width: W, height: H, data: d }, compAfter)
  if (!Number.isFinite(achieved) || Math.abs(achieved - op.predicted) > tolerancePx) {
    throw new Error(`retouch cell${op.cell}: achieved ${achieved}px vs predicted ${op.predicted}px`)
  }
  return { moved: moved.length, filled, achieved }
}

/**
 * Per-file gates: exact figure count at the expected cells, no outer-edge
 * contact. Returns { count, cells }. Throws with bbox diagnostics otherwise.
 */
export function verifySheetComposition(im, { expectCells, cellOf }) {
  if (!Array.isArray(expectCells) || expectCells.length === 0) throw new Error('retouch: expectCells required')
  if (typeof cellOf !== 'function') throw new Error('retouch: cellOf hook required')
  const check = alphaComponents({ width: im.width, height: im.height, data: im.data }, ALPHA).filter((c) => c.area > SPECK_PX)
  const gotCells = check.map((c) => cellOf(c, im.width, im.height)).sort((a, b) => a - b)
  const wantCells = [...expectCells].sort((a, b) => a - b)
  if (check.length !== wantCells.length || gotCells.join(',') !== wantCells.join(',')) {
    throw new Error(`retouch: figures [${gotCells}] vs expected [${wantCells}] :: ${JSON.stringify(check.map((c) => [c.area, c.x0, c.y0, c.x1, c.y1]))}`)
  }
  for (const c of check) {
    if (c.x0 === 0 || c.y0 === 0 || c.x1 >= im.width - 1 || c.y1 >= im.height - 1) throw new Error('retouch: figure touches outer edge')
  }
  return { count: check.length, cells: gotCells }
}
