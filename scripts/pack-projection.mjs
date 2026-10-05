// CMR running pack-projection gate (owner-approved Acceptance-4 framework).
//
// Acceptance 4 is a FULL-pack gate (weapon spread over every kept drawing),
// but authoring proceeds sheet by sheet. Every past hero block (09A, 10A,
// 12A) discovered pack-level failure only at assembly, with the budget spent.
// This module projects the final verdict after EACH sheet acceptance, while
// steering (re-brief, re-shoot, repair) is still cheap.
//
// Canonical spread: (max - min) / mean <= 0.10. This matches every recorded
// verdict (06A 5.3%, 07A 18.2%, 09A 88.3%, 12A 47.22%) and
// scripts/measure-soldier.mjs. Do NOT "fix" it to max-normalized: that would
// silently re-grade all precedent. Thresholds below are constants for the
// same reason the repair reserve caps are: weakening them weakens the gate.
//
// Steering-window math assumes future sheets land near the observed mean
// (mean stability). The per-sheet re-check makes approximation error
// self-correcting: every new sheet re-runs the projection with real data.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const SPREAD_LIMIT = 0.10
export const WARN_SPREAD = 0.08
export const DRIFT_SHEETS = 3

export function spreadOf(values) {
  if (!Array.isArray(values)) throw new Error('projection: values must be an array')
  if (values.length < 2) return 0
  let min = Infinity, max = -Infinity, sum = 0
  for (const v of values) {
    if (!Number.isFinite(v) || v <= 0) throw new Error('projection: values must be finite positive numbers')
    if (v < min) min = v
    if (v > max) max = v
    sum += v
  }
  return (max - min) / (sum / values.length)
}

export function meanOf(values) {
  if (!Array.isArray(values) || values.length === 0) throw new Error('projection: need at least one value')
  let sum = 0
  for (const v of values) {
    if (!Number.isFinite(v) || v <= 0) throw new Error('projection: values must be finite positive numbers')
    sum += v
  }
  return sum / values.length
}

/** Ratio-symmetric band around the anchor median: band edges themselves span exactly 10%.
 *  Mean-normalized spread s over [lo, hi] with hi/lo = R is 2(R-1)/(R+1), so
 *  the 10% edge ratio is R = (2+s)/(2-s), not 1/(1-s). */
export function fixedBandFromMedian(median) {
  if (!Number.isFinite(median) || median <= 0) throw new Error('projection: median must be a finite positive number')
  const half = Math.sqrt((2 + SPREAD_LIMIT) / (2 - SPREAD_LIMIT))
  return { lo: median / half, hi: median * half }
}

function sameBand(a, b) {
  return a && b && Math.abs(a.lo - b.lo) <= 1e-9 * Math.max(1, Math.abs(b.lo)) && Math.abs(a.hi - b.hi) <= 1e-9 * Math.max(1, Math.abs(b.hi))
}

function verdict({ min, max, mean, n, remaining, band }) {
  const reasons = []
  if (n === 0) {
    return { status: 'OK', observedSpread: 0, n: 0, window: { ...band }, reasons: ['no observations yet'] }
  }
  const observedSpread = (max - min) / mean
  // Steering window: future values landing inside keep the gate passable
  // under mean stability. Intersected with the fixed band below.
  const raw = { lo: max - SPREAD_LIMIT * mean, hi: min + SPREAD_LIMIT * mean }
  const window = { lo: Math.max(raw.lo, band.lo), hi: Math.min(raw.hi, band.hi) }
  if (observedSpread > SPREAD_LIMIT) {
    reasons.push(`observed spread ${(observedSpread * 100).toFixed(2)}% over n=${n} already exceeds 10%: future sheets cannot repair extremes`)
    return { status: remaining === 0 ? 'FAIL' : 'STOP', observedSpread, n, min, max, mean, window, reasons }
  }
  if (window.lo > window.hi) {
    reasons.push('fixed band is incompatible with observed extremes: no future value can keep the pack within 10%')
    return { status: 'STOP', observedSpread, n, min, max, mean, window, reasons }
  }
  if (remaining === 0) {
    reasons.push(`final spread ${(observedSpread * 100).toFixed(2)}% over n=${n}`)
    return { status: 'PASS', observedSpread, n, min, max, mean, window, reasons }
  }
  if (observedSpread > WARN_SPREAD) {
    reasons.push(`observed spread ${(observedSpread * 100).toFixed(2)}% is within 2pp of the gate: brief the next sheet inside [${window.lo.toFixed(1)}, ${window.hi.toFixed(1)}]`)
    return { status: 'WARN', observedSpread, n, min, max, mean, window, reasons }
  }
  reasons.push(`observed spread ${(observedSpread * 100).toFixed(2)}% over n=${n}; steering window [${window.lo.toFixed(1)}, ${window.hi.toFixed(1)}]`)
  return { status: 'OK', observedSpread, n, min, max, mean, window, reasons }
}

/**
 * Evaluate the running projection. `observed` are scale-NORMALIZED values
 * (displayed px); `remaining` counts unaccepted sheets; `band` is the fixed
 * global brief band. Pure: no file or image access.
 */
export function evaluateProjection({ observed, remaining, band }) {
  if (!Array.isArray(observed)) throw new Error('projection: observed must be an array')
  if (!Number.isInteger(remaining) || remaining < 0) throw new Error('projection: remaining must be a non-negative integer')
  if (!band || !Number.isFinite(band.lo) || !Number.isFinite(band.hi) || !(band.lo > 0) || !(band.hi > band.lo)) {
    throw new Error('projection: band must be { lo, hi } with 0 < lo < hi')
  }
  if (observed.length === 0) return verdict({ min: 0, max: 0, mean: 0, n: 0, remaining, band })
  return verdict({ min: Math.min(...observed), max: Math.max(...observed), mean: meanOf(observed), n: observed.length, remaining, band })
}

/** True when the last DRIFT_SHEETS sheet means move monotonically (the 12A ratchet signature). */
export function driftSuspected(sheetMeans) {
  if (!Array.isArray(sheetMeans) || sheetMeans.length < DRIFT_SHEETS) return false
  const tail = sheetMeans.slice(-DRIFT_SHEETS)
  if (tail.some((v) => !Number.isFinite(v) || v <= 0)) throw new Error('projection: sheet means must be finite positive numbers')
  const up = tail.every((v, i) => i === 0 || v > tail[i - 1])
  const down = tail.every((v, i) => i === 0 || v < tail[i - 1])
  return up || down
}

export function defaultProjectionPath(fighterId) {
  if (typeof fighterId !== 'string' || !/^[a-z][a-z0-9-]*$/.test(fighterId)) throw new Error('projection: invalid fighter id')
  return join('art', 'motion', fighterId, 'pack-projection.json')
}

export function emptyProjection(fighterId, totalSheets) {
  if (!Number.isInteger(totalSheets) || totalSheets < 1) throw new Error('projection: totalSheets must be a positive integer')
  defaultProjectionPath(fighterId)
  return { version: 1, fighter: fighterId, totalSheets, band: null, bandAnchor: null, sheets: [] }
}

/** Fix the global brief band ONCE from the anchor (walk/locomotion) sheet median. */
export function fixBand(state, median, anchorSheet) {
  const next = JSON.parse(JSON.stringify(state))
  if (next.band) throw new Error('projection: band already fixed; changing it is a re-brief needing owner approval, not a silent edit')
  if (typeof anchorSheet !== 'string' || anchorSheet.length === 0) throw new Error('projection: anchor sheet name required')
  next.band = fixedBandFromMedian(median)
  next.bandAnchor = anchorSheet
  return next
}

/**
 * Record one accepted sheet. Values are normalized to displayed px by `scale`
 * here so unit errors surface immediately. The sheet's brief band must equal
 * the fixed band unless an approved deviation (owner re-brief) is recorded.
 */
export function recordSheet(state, { name, rawValues, scale, band, approvedDeviation }) {
  const next = JSON.parse(JSON.stringify(state))
  if (!next.band) throw new Error('projection: fix the global band from the anchor sheet before recording')
  if (typeof name !== 'string' || name.length === 0) throw new Error('projection: sheet name required')
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('projection: sheet display scale must be finite positive')
  if (!Array.isArray(rawValues) || rawValues.length === 0) throw new Error('projection: sheet needs at least one measured value')
  const values = rawValues.map((v) => {
    if (!Number.isFinite(v) || v <= 0) throw new Error('projection: values must be finite positive numbers')
    return v * scale
  })
  if (!sameBand(band, next.band)) {
    if (typeof approvedDeviation !== 'string' || approvedDeviation.trim().length < 16) {
      throw new Error(`projection: sheet ${name} briefed outside the fixed band — the 12A ratchet. Re-brief needs owner approval with a recorded reason`)
    }
  }
  const entry = {
    name,
    scale,
    n: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: meanOf(values),
    band: { ...band },
    ...(approvedDeviation ? { approvedDeviation: approvedDeviation.trim() } : {}),
    history: [],
  }
  const prior = next.sheets.findIndex((s) => s.name === name)
  if (prior >= 0) {
    entry.history = [...next.sheets[prior].history, { ...next.sheets[prior], history: undefined }]
    delete entry.history[entry.history.length - 1].history
    next.sheets[prior] = entry
  } else {
    next.sheets.push(entry)
  }
  // Exact global aggregates from per-sheet extremes + n-weighted mean, no
  // need to store every drawing value.
  let total = 0, count = 0
  for (const s of next.sheets) {
    total += s.mean * s.n
    count += s.n
  }
  const exact = { min: Math.min(...next.sheets.map((s) => s.min)), max: Math.max(...next.sheets.map((s) => s.max)), mean: total / count }
  const evaluation = verdict({
    ...exact,
    n: count,
    remaining: Math.max(0, next.totalSheets - next.sheets.length),
    band: next.band,
  })
  const means = next.sheets.map((s) => s.mean)
  return { state: next, evaluation: { ...evaluation, sheetMeans: means, driftSuspected: driftSuspected(means) } }
}

export function loadProjection(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function saveProjection(state, path) {
  if (!state || state.version !== 1 || !state.band || !Array.isArray(state.sheets)) {
    throw new Error('projection: refusing to save an incomplete state (fix the band first)')
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`)
}
