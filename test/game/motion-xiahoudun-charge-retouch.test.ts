import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents, type Pixels } from '../../scripts/motion-pipeline.mjs'
import { applyRetouchOp, gridCellOf } from '../../scripts/motion-retouch.mjs'
import { assertChargeProtectedPixels, retouchXiahoudunCharge } from '../../scripts/retouch-xiahoudun-charge.mjs'

const path = 'art/motion/xiahoudun/charge-candidate-1.png'
const expectedSourceHash = '0afda71c6406eb103465f7f859bcdd8bf6ba9b85f26e341524f06efde29c5257'
const cellOf = gridCellOf(3, 3)
const copy = (im: Pixels): Pixels => ({ width: im.width, height: im.height, data: new Uint8ClampedArray(im.data) })
const hash = (data: Uint8ClampedArray): string => createHash('sha256').update(data).digest('hex')
let source: Pixels
let result: ReturnType<typeof retouchXiahoudunCharge>

beforeAll(async () => {
  expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(expectedSourceHash)
  const img = await loadImage(path), cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  source = g.getImageData(0, 0, img.width, img.height)
  result = retouchXiahoudunCharge(source)
}, 20_000)

describe('CMR-14A charge retouch is partial and body-safe', () => {
  it('touches only pair-reviewed cells 1/2, retaining the other seven drawings byte-identically', () => {
    expect(result.heldCells).toEqual([0, 3, 4])
    expect(result.report.map(r => r.cell)).toEqual([1, 2])
    for (const comp of alphaComponents(source, 96).filter(c => c.area > 64)) {
      if ([1, 2].includes(cellOf(comp, source.width, source.height))) continue
      let changed = 0
      for (const p of comp.pixels) for (let c = 0; c < 4; c++) {
        if (source.data[p * 4 + c] !== result.image.data[p * 4 + c]) changed++
      }
      expect(changed, `untouched cell ${cellOf(comp, source.width, source.height)}`).toBe(0)
    }
  })

  it('preserves both grip/cloth witness rectangles despite shortening the nearby haft', () => {
    expect(() => assertChargeProtectedPixels(source, result.image)).not.toThrow()
    const bad = copy(result.image)
    bad.data[(174 * bad.width + 738) * 4 + 3] = 0
    expect(() => assertChargeProtectedPixels(source, bad)).toThrow(/cell1 rear grip changed/)
  })

  it('regression control: the old wide band passes numeric gates but moves a hand, and the witness check rejects it', () => {
    const bad = copy(source), cap: [number, number] = [24, 207], tip: [number, number] = [504, 149]
    const dx = tip[0] - cap[0], dy = tip[1] - cap[1], len = Math.hypot(dx, dy)
    const ux = dx / len, uy = dy / len, band = 18
    const measure = (image: Pixels, comp: { pixels: number[] }): number => {
      let lo = Infinity, hi = -Infinity
      for (const p of comp.pixels) {
        const x = p % image.width, y = (p / image.width) | 0
        const t = (x - cap[0]) * ux + (y - cap[1]) * uy
        const o = -(x - cap[0]) * uy + (y - cap[1]) * ux
        if (Math.abs(o) > band) continue
        lo = Math.min(lo, t); hi = Math.max(hi, t)
      }
      return hi - lo
    }
    const comp = alphaComponents(bad, 96).filter(c => c.area > 64).find(c => cellOf(c, bad.width, bad.height) === 0)!
    const shift: [number, number] = [58, -7], predicted = measure(bad, comp) - Math.hypot(...shift)
    const trial = applyRetouchOp(bad, {
      cell: 0, mode: 'shorten', cap, angleDeg: Math.atan2(dy, dx) * 180 / Math.PI,
      t0: 65, band, shift, predicted,
    }, { cellOf, measure })
    expect(Math.abs(trial.achieved - predicted)).toBeLessThan(1)
    expect(() => assertChargeProtectedPixels(source, bad)).toThrow(/cell0 rear grip changed/)
  })

  it('retains nine separated figures, zero edge contact and the identical pre-existing speck inventory', () => {
    expect(result.composition).toEqual({ count: 9, cells: [0, 1, 2, 3, 4, 5, 6, 7, 8] })
    const specks = (im: Pixels) => alphaComponents(im, 96).filter(c => c.area <= 64).map(c => [c.area, c.x0, c.y0, c.x1, c.y1])
    expect(specks(result.image)).toEqual(specks(source))
    expect(specks(source)).toHaveLength(22)
  })

  it('repeats deterministically without mutating the candidate pixels', () => {
    const before = hash(source.data), again = retouchXiahoudunCharge(source)
    expect(hash(source.data)).toBe(before)
    expect(hash(again.image.data)).toBe(hash(result.image.data))
    for (const r of result.report) expect(Math.abs(r.achieved - r.predicted)).toBeLessThan(1)
  })
})
