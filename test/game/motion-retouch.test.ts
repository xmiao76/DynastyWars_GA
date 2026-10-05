import { describe, expect, it } from 'vitest'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import {
  applyRetouchOp,
  gridCellOf,
  verifySheetComposition,
  type RetouchComponent,
} from '../../scripts/motion-retouch.mjs'

/**
 * Deterministic rigid-axis shaft retouch, generalized from the CMR-11A
 * campaign (FULL-56 weapon spread 31.3% -> 9.1% with zero image requests).
 * Pure pixel mechanics on synthetic fixtures: no canvas, no files.
 */

interface Pixels { width: number; height: number; data: Uint8ClampedArray }

const WOOD: [number, number, number, number] = [150, 100, 50, 255]
const GOLD: [number, number, number, number] = [200, 150, 60, 255]

function blank(w: number, h: number): Pixels {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }
}

function rect(im: Pixels, x0: number, y0: number, x1: number, y1: number, c: [number, number, number, number]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const k = (y * im.width + x) * 4
      im.data[k] = c[0]; im.data[k + 1] = c[1]; im.data[k + 2] = c[2]; im.data[k + 3] = c[3]
    }
  }
}

/** Shaft x[59,220] y[55,64] + pommel cap x[40,58] y[52,67]: one component, bbox length 181. */
function shaftFixture(): Pixels {
  const im = blank(300, 120)
  rect(im, 59, 55, 220, 64, WOOD)
  rect(im, 40, 52, 58, 67, GOLD)
  return im
}

const cellOf = gridCellOf(1, 1)
const hooks = {
  cellOf,
  measure: (_im: Pixels, c: RetouchComponent) => c.x1 - c.x0 + 1,
}

function comps(im: Pixels): RetouchComponent[] {
  return alphaComponents(im, 96).filter((c) => c.area > 64) as RetouchComponent[]
}

describe('rigid-axis extend', () => {
  const op = {
    cell: 0, mode: 'extend' as const, cap: [44, 60] as [number, number], angleDeg: 0,
    t0: 15, band: 12, shift: [-20, 0] as [number, number],
    oShaft: [-5, 4] as [number, number], slab: [20, 40] as [number, number],
    predicted: 201, minPiecePx: 100,
  }

  it('lengthens the shaft by the shift with median-profile fill', () => {
    const r = applyRetouchOp(shaftFixture(), op, hooks)
    expect(r.achieved).toBe(201)
    expect(r.moved).toBe(19 * 16) // whole cap piece lifted
    expect(r.filled).toBeGreaterThan(100)
  })

  it('keeps one connected component and touches nothing outside the work zone', () => {
    const im = shaftFixture()
    // Witness blob far from the work zone must survive byte-identical.
    rect(im, 260, 10, 279, 29, GOLD)
    const leftHooks = { ...hooks, cellOf: gridCellOf(1, 2) } // shaft in cell 0, witness in cell 1
    const before = Array.from(im.data.slice((10 * 300 + 260) * 4, (30 * 300 + 280) * 4))
    applyRetouchOp(im, op, leftHooks)
    expect(comps(im)).toHaveLength(2)
    expect(Array.from(im.data.slice((10 * 300 + 260) * 4, (30 * 300 + 280) * 4))).toEqual(before)
  })

  it('is deterministic across runs', () => {
    const a = shaftFixture(), b = shaftFixture()
    applyRetouchOp(a, op, hooks)
    applyRetouchOp(b, op, hooks)
    expect(Array.from(a.data)).toEqual(Array.from(b.data))
  })

  it('rejects a wrong prediction instead of landing an unplanned length', () => {
    expect(() => applyRetouchOp(shaftFixture(), { ...op, predicted: 190 }, hooks)).toThrow(/achieved 201px vs predicted 190px/)
  })

  it('refuses moves that leave the sheet instead of wrapping rows', () => {
    expect(() => applyRetouchOp(shaftFixture(), { ...op, shift: [-60, 0], predicted: 241 }, hooks)).toThrow(/out of bounds/)
  })

  it('refuses fill over a foreign opaque pixel', () => {
    // Fixture variant: short cap y[52,60] so obstacle x[45,48] y[62,64]
    // sits in the fill zone yet disconnected from the figure.
    const im = blank(300, 120)
    rect(im, 59, 55, 220, 64, WOOD)
    rect(im, 40, 52, 58, 60, GOLD)
    rect(im, 45, 62, 48, 64, [90, 90, 90, 255]) // 12px speck: filtered from comps, opaque to fill
    expect(comps(im)).toHaveLength(1)
    expect(() => applyRetouchOp(im, op, hooks)).toThrow(/foreign pixel/)
  })
})

describe('rigid-axis shorten', () => {
  it('overlaps the cap forward with no fill', () => {
    const r = applyRetouchOp(
      shaftFixture(),
      {
        cell: 0, mode: 'shorten', cap: [44, 60], angleDeg: 0, t0: 15, band: 12,
        shift: [12, 0], predicted: 169, minPiecePx: 100, // 181 - 12: cap re-occupies the cleared zone
      },
      hooks,
    )
    expect(r.achieved).toBe(169)
    expect(r.filled).toBe(0)
  })

  it('rejects a suspiciously large shorten piece (body included?)', () => {
    expect(() => applyRetouchOp(
      shaftFixture(),
      {
        cell: 0, mode: 'shorten', cap: [44, 60], angleDeg: 0, t0: 200, band: 40,
        shift: [12, 0], predicted: 100, minPiecePx: 100, maxShortenPx: 500,
      },
      hooks,
    )).toThrow(/too big/)
  })
})

describe('gates', () => {
  it('trips the isolation gate on body pixels inside the slide zone', () => {
    const im = shaftFixture()
    // Knee + bridge merged into the figure, inside a wide band but off-shaft.
    rect(im, 43, 64, 45, 80, WOOD)
    rect(im, 40, 80, 48, 90, WOOD)
    expect(comps(im)).toHaveLength(1)
    expect(() => applyRetouchOp(im, {
      cell: 0, mode: 'extend', cap: [44, 60], angleDeg: 0, t0: 15, band: 34,
      shift: [-20, 0], oShaft: [-5, 4], slab: [20, 40], predicted: 201, minPiecePx: 100,
    }, hooks)).toThrow(/unexpected pixel in moving zone/)
  })

  it('requires oShaft/slab for extend and rejects malformed ops', () => {
    const base = { cell: 0, mode: 'extend' as const, cap: [44, 60] as [number, number], angleDeg: 0, t0: 15, band: 12, shift: [-20, 0] as [number, number], predicted: 201 }
    expect(() => applyRetouchOp(shaftFixture(), base, hooks)).toThrow(/oShaft/)
    expect(() => applyRetouchOp(shaftFixture(), { ...base, mode: 'bend' as unknown as 'extend' }, hooks)).toThrow(/mode must be/)
    expect(() => applyRetouchOp(shaftFixture(), { ...base, oShaft: [-5, 4], slab: [20, 40], shift: [-20.5, 0] }, hooks)).toThrow(/shift must be/)
  })

  it('verifies figure count, cells and edge contact per file', () => {
    const im = blank(300, 300)
    for (let i = 0; i < 9; i++) {
      const cx = (i % 3) * 100 + 50, cy = Math.floor(i / 3) * 100 + 50
      rect(im, cx - 5, cy - 5, cx + 5, cy + 5, WOOD)
    }
    const cell3 = gridCellOf(3, 3)
    expect(verifySheetComposition(im, { expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8], cellOf: cell3 }))
      .toEqual({ count: 9, cells: [0, 1, 2, 3, 4, 5, 6, 7, 8] })
    // Clear one figure -> count/cell mismatch with diagnostics.
    const missing = blank(300, 300)
    missing.data.set(im.data)
    rect(missing, 45, 45, 55, 55, [0, 0, 0, 0])
    expect(() => verifySheetComposition(missing, { expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8], cellOf: cell3 })).toThrow(/vs expected/)
    // Edge touch -> rejected.
    const edge = blank(300, 300)
    rect(edge, 0, 0, 9, 9, WOOD)
    expect(() => verifySheetComposition(edge, { expectCells: [0], cellOf: cell3 })).toThrow(/outer edge/)
  })
})
