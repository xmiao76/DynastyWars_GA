import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents, cleanAlpha, type Pixels } from '../../scripts/motion-pipeline.mjs'
import { applyRetouchOp, gridCellOf } from '../../scripts/motion-retouch.mjs'
import { assertRepairBodyUnchanged, extendRepairedChargeCoil, spliceChargeRepair } from '../../scripts/prepare-xiahoudun-charge-repair.mjs'

let base: Pixels, repair: Pixels, result: ReturnType<typeof spliceChargeRepair>
const hash = (data: Uint8ClampedArray): string => createHash('sha256').update(data).digest('hex')
const clone = (im: Pixels): Pixels => ({ width: im.width, height: im.height, data: new Uint8ClampedArray(im.data) })
const cellOf = gridCellOf(3, 3)
async function load(path: string, expected: string): Promise<Pixels> {
  expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(expected)
  const img = await loadImage(path), cv = createCanvas(img.width, img.height), g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  return g.getImageData(0, 0, img.width, img.height)
}

beforeAll(async () => {
  base = await load('art/motion/xiahoudun/charge-partial-retouched-source.png', 'dedac2b17b122fccce30700963795876b7a2b681529e46db66e16a781fb0ab57')
  repair = await load('art/motion/xiahoudun/charge-repair-1.png', '4c578feefc6045fe3e80e93f349b9ce305aa06c64e1139c50f790aefbb037c82')
  result = spliceChargeRepair(base, repair)
}, 20_000)

describe('CMR-14A focused charge repair1 preparation', () => {
  it('imports only three named repaired drawings and preserves cells1/2 plus the four spares exactly after alpha cleanup', () => {
    expect(result.frames.filter(f => f.source.startsWith('repair')).map(f => f.cell)).toEqual([0, 3, 4])
    const cleaned = clone(base)
    cleanAlpha(cleaned, { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 })
    for (const comp of alphaComponents(cleaned, 96).filter(c => c.area > 64)) {
      const cell = cellOf(comp, cleaned.width, cleaned.height)
      if ([0, 3, 4].includes(cell)) continue
      let changed = 0
      for (const p of comp.pixels) for (let c = 0; c < 4; c++) if (result.image.data[p * 4 + c] !== cleaned.data[p * 4 + c]) changed++
      expect(changed, `untouched cleaned cell ${cell}`).toBe(0)
    }
  })

  it('extends the undershooting coil into the fixed band without touching grip or cloth witness pixels', () => {
    const extended = extendRepairedChargeCoil(repair)
    expect(extended.report.achieved).toBeGreaterThan(404.16)
    expect(extended.report.achieved).toBeLessThan(446.71)
    expect(Math.abs(extended.report.achieved - extended.report.predicted)).toBeLessThan(1)
    expect(() => assertRepairBodyUnchanged(repair, extended.image)).not.toThrow()
    expect(extended.report.moved).toBe(620)
  })

  it('negative control: the wider band still passes numeric length gates but moves cloth and is rejected', () => {
    const bad = clone(repair), W = bad.width, cap: [number, number] = [56, 202]
    const dx = 421 - cap[0], dy = 164 - cap[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len
    const measure = (im: Pixels, comp: { pixels: number[] }): number => {
      let lo = Infinity, hi = -Infinity
      for (const p of comp.pixels) {
        const x = p % W, y = (p / W) | 0, t = (x - cap[0]) * ux + (y - cap[1]) * uy
        const o = -(x - cap[0]) * uy + (y - cap[1]) * ux
        if (Math.abs(o) > 13) continue
        lo = Math.min(lo, t); hi = Math.max(hi, t)
      }
      return hi - lo
    }
    const c = alphaComponents(bad, 96).filter(c => c.area > 64).find(c => cellOf(c, W, bad.height) === 0)!
    const predicted = measure(bad, c) + Math.hypot(-40, 4)
    const report = applyRetouchOp(bad, {
      cell: 0, mode: 'extend', cap, angleDeg: Math.atan2(dy, dx) * 180 / Math.PI,
      t0: 42, band: 13, shift: [-40, 4], oShaft: [-5, 6], slab: [33, 49], predicted,
    }, { cellOf, measure })
    expect(Math.abs(report.achieved - predicted)).toBeLessThan(1)
    expect(() => assertRepairBodyUnchanged(repair, bad)).toThrow(/cloth fringe changed/)
  })

  it('retains exactly nine separated figures, no edge contact and no remaining specks after cleanup', () => {
    expect(result.composition).toEqual({ count: 9, cells: [0, 1, 2, 3, 4, 5, 6, 7, 8] })
    expect(alphaComponents(result.image, 96).filter(c => c.area <= 64)).toHaveLength(0)
  })

  it('is deterministic and never mutates either immutable input', () => {
    const b = hash(base.data), r = hash(repair.data), repeat = spliceChargeRepair(base, repair)
    expect(hash(base.data)).toBe(b); expect(hash(repair.data)).toBe(r)
    expect(hash(repeat.image.data)).toBe(hash(result.image.data))
    expect(repeat.frames).toEqual(result.frames)
  })
})
