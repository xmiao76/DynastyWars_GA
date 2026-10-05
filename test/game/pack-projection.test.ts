import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  DRIFT_SHEETS,
  SPREAD_LIMIT,
  WARN_SPREAD,
  driftSuspected,
  emptyProjection,
  evaluateProjection,
  fixBand,
  fixedBandFromMedian,
  loadProjection,
  meanOf,
  recordSheet,
  saveProjection,
  spreadOf,
} from '../../scripts/pack-projection.mjs'

/**
 * Running FULL-pack Acceptance-4 projection gate. Catches inter-sheet drift
 * after each sheet acceptance (the CMR-12A failure: every sheet passed
 * locally while the pack drifted 191->300), instead of at assembly with the
 * budget spent. Canonical spread is mean-normalized, matching every recorded
 * verdict (06A 5.3%, 07A 18.2%, 09A 88.3%, 12A 47.22%).
 */

const temps: string[] = []
afterAll(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }) })

describe('canonical spread math', () => {
  it('pins the mean-normalized definition and constants', () => {
    expect(SPREAD_LIMIT).toBe(0.10)
    expect(WARN_SPREAD).toBe(0.08)
    expect(DRIFT_SHEETS).toBe(3)
    // CMR-12A exact arithmetic: min 184.0, max 300.3, mean 246.31 -> 47.22%.
    expect(spreadOf([184.0, 300.3, 246.31])).toBeCloseTo(0.4775, 3)
    expect((300.3 - 184.0) / 246.31).toBeCloseTo(0.4722, 4)
    expect(spreadOf([])).toBe(0)
    expect(spreadOf([250])).toBe(0)
    expect(meanOf([184.0, 300.3])).toBeCloseTo(242.15, 10)
    expect(() => spreadOf([100, -5])).toThrow(/finite positive/)
    expect(() => meanOf([])).toThrow(/at least one/)
  })

  it('builds a ratio-symmetric band whose own edges span exactly 10%', () => {
    const band = fixedBandFromMedian(250)
    expect(spreadOf([band.lo, band.hi])).toBeCloseTo(0.10, 9)
    expect(Math.sqrt(band.lo * band.hi)).toBeCloseTo(250, 9)
    expect(() => fixedBandFromMedian(0)).toThrow(/positive/)
  })
})

describe('projection verdicts', () => {
  const band = fixedBandFromMedian(250) // [237.17, 263.52]

  it('passes a finished pack within the gate and fails one beyond it', () => {
    expect(evaluateProjection({ observed: [245, 250, 255], remaining: 0, band }).status).toBe('PASS')
    const fail = evaluateProjection({ observed: [184.0, 246.31, 300.3], remaining: 0, band })
    expect(fail.status).toBe('FAIL')
    expect(fail.observedSpread).toBeCloseTo(0.4775, 3)
  })

  it('stops mid-pack once observed extremes already exceed the gate', () => {
    // Future sheets cannot repair extremes: min/max only widen.
    const r = evaluateProjection({ observed: [230, 250, 280], remaining: 5, band })
    expect(r.status).toBe('STOP')
    expect(r.reasons.join(' ')).toMatch(/cannot repair extremes/)
  })

  it('warns within 2pp of the gate with a steering window for the next sheet', () => {
    const r = evaluateProjection({ observed: [240, 251, 262], remaining: 4, band })
    expect(r.status).toBe('WARN')
    expect(r.window.lo).toBeLessThan(r.window.hi)
    // Steering window stays inside the fixed band.
    expect(r.window.lo).toBeGreaterThanOrEqual(band.lo)
    expect(r.window.hi).toBeLessThanOrEqual(band.hi)
  })

  it('stays OK with margin and reports the steering window', () => {
    const r = evaluateProjection({ observed: [248, 250, 252], remaining: 7, band })
    expect(r.status).toBe('OK')
    expect(r.observedSpread).toBeCloseTo(4 / 250, 10)
  })

  it('stops when the fixed band no longer admits any value compatible with observations', () => {
    // Observations drifted fully above the band: band [200,210], values ~250.
    const off = evaluateProjection({ observed: [248, 250, 252], remaining: 3, band: { lo: 200, hi: 210 } })
    expect(off.status).toBe('STOP')
    expect(off.reasons.join(' ')).toMatch(/incompatible/)
  })

  it('detects monotonic sheet-mean drift over the trailing window', () => {
    expect(driftSuspected([191, 220, 250, 280])).toBe(true) // 12A ratchet shape
    expect(driftSuspected([300, 280, 250])).toBe(true)
    expect(driftSuspected([250, 280, 250])).toBe(false)
    expect(driftSuspected([250, 280])).toBe(false)
  })
})

describe('durable projection state', () => {
  it('fixes the band once and forbids silent re-centering (the 12A ratchet)', () => {
    let s = emptyProjection('huangzhong', 10)
    expect(() => recordSheet(s, { name: 'walk', rawValues: [190], scale: 1, band: { lo: 1, hi: 2 } })).toThrow(/fix the global band/)
    s = fixBand(s, 250, 'walk')
    const band = s.band!
    expect(() => fixBand(s, 260, 'jab1')).toThrow(/already fixed/)
    // Same band: accepted.
    const ok = recordSheet(s, { name: 'walk', rawValues: [245, 250, 255], scale: 1, band })
    expect(ok.state.sheets).toHaveLength(1)
    expect(ok.evaluation.status).toBe('OK')
    // Re-centered band without approval: rejected.
    expect(() => recordSheet(ok.state, { name: 'jab1', rawValues: [280], scale: 1, band: fixedBandFromMedian(280) }))
      .toThrow(/outside the fixed band/)
    // Owner-approved re-brief with reason: recorded, auditable.
    const rebrief = recordSheet(ok.state, {
      name: 'jab1', rawValues: [280], scale: 1, band: fixedBandFromMedian(280),
      approvedDeviation: 'Owner 2026-10-06: re-anchor after walk re-shoot, see TASKS.md',
    })
    expect(rebrief.state.sheets[1]!.approvedDeviation).toMatch(/Owner/)
  })

  it('normalizes by per-sheet scale and aggregates exact extremes across sheets', () => {
    const s = fixBand(emptyProjection('test', 10), 250, 'walk')
    const band = s.band!
    // Sheet 2 drawn at half scale: raw 125 == normalized 250.
    const r = recordSheet(s, { name: 'jab1', rawValues: [120, 125, 130], scale: 2, band })
    expect(r.state.sheets[0]).toMatchObject({ n: 3, min: 240, max: 260, mean: 250 })
    expect(r.evaluation.observedSpread).toBeCloseTo(20 / 250, 10)
    // Re-recording a re-shot sheet keeps history instead of rewriting it.
    const r2 = recordSheet(r.state, { name: 'jab1', rawValues: [124, 125, 126], scale: 2, band })
    expect(r2.state.sheets).toHaveLength(1)
    expect(r2.state.sheets[0]!.history).toHaveLength(1)
    expect(r2.state.sheets[0]!.history[0]).toMatchObject({ min: 240, max: 260 })
    expect(r2.state.sheets[0]).toMatchObject({ min: 248, max: 252 })
  })

  it('flags drift across recorded sheets and persists the ledger', () => {
    let s = fixBand(emptyProjection('drift', 10), 250, 's1')
    const band = s.band!
    let ev = recordSheet(s, { name: 's1', rawValues: [240], scale: 1, band }).evaluation
    expect(ev.driftSuspected).toBe(false)
    s = recordSheet(s, { name: 's1', rawValues: [240], scale: 1, band }).state
    s = recordSheet(s, { name: 's2', rawValues: [255], scale: 1, band }).state
    ev = recordSheet(s, { name: 's3', rawValues: [262], scale: 1, band }).evaluation
    expect(ev.driftSuspected).toBe(true)
    expect(ev.sheetMeans).toEqual([240, 255, 262])
    const file = join(mkdtempSync(join(tmpdir(), 'pack-proj-')), 'p.json')
    temps.push(join(file, '..'))
    saveProjection(recordSheet(s, { name: 's3', rawValues: [262], scale: 1, band }).state, file)
    expect(loadProjection(file).sheets.map((x) => x.name)).toEqual(['s1', 's2', 's3'])
    expect(() => saveProjection(emptyProjection('x', 10), file)).toThrow(/incomplete state/)
  })
})
