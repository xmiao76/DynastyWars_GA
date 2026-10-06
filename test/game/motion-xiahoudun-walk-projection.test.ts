import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Pixels } from '../../scripts/motion-pipeline.mjs'
import { assertWalkProjectionBodyUnchanged, measureWalkMaterialEndpoints, repairWalkProjection } from '../../scripts/retouch-xiahoudun-walk-projection.mjs'
import { spreadOf } from '../../scripts/pack-projection.mjs'

let source: Pixels, result: ReturnType<typeof repairWalkProjection>
const digest = (d: Uint8ClampedArray) => createHash('sha256').update(d).digest('hex')
beforeAll(async () => {
  const img = await loadImage('art/motion/xiahoudun/walk-guard-grip-restored-source.png')
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  source = g.getImageData(0, 0, img.width, img.height)
  result = repairWalkProjection(source)
})

describe('CMR-14A true-endpoint walk projection correction', () => {
  it('regression: whole material proves old source exceeds10%; repaired complete endpoints are in the unchanged band', () => {
    const before = measureWalkMaterialEndpoints(source)
    expect(spreadOf(before.map(v => v.length))).toBeGreaterThan(0.10)
    expect(result.weaponSpread).toBeCloseTo(0.03384949916, 8)
    for (const e of result.endpoints) {
      expect(e.length).toBeGreaterThanOrEqual(404.1605167916991)
      expect(e.length).toBeLessThanOrEqual(446.70372908556226)
    }
    expect(result.reports.map(r => r.cell)).toEqual([2,3,5,7,8])
    for (const r of result.reports) expect(Math.abs(r.predicted - r.achieved)).toBeLessThan(1)
  })

  it('keeps all guarded foreground witnesses and all nontarget drawings unchanged', () => {
    expect(() => assertWalkProjectionBodyUnchanged(source, result.image)).not.toThrow()
    for (const [y0,y1,x0,x1] of [[0,341,0,1023],[341,682,512,1023],[682,1024,0,511]] as const) {
      let changed = 0
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const k = (y * source.width + x) * 4
        for (let c = 0; c < 4; c++) if (source.data[k+c] !== result.image.data[k+c]) changed++
      }
      expect(changed).toBe(0)
    }
    expect(result.composition).toEqual({ count: 9, cells: [0,1,2,3,4,5,6,7,8] })
  })

  it('negative control: even a numerically passing repair fails if the restored guard foreground is altered', () => {
    const damaged: Pixels = { ...result.image, data: new Uint8ClampedArray(result.image.data) }
    const k = (192 * damaged.width + 164) * 4
    damaged.data[k] = damaged.data[k]! ^ 1
    expect(spreadOf(measureWalkMaterialEndpoints(damaged).map(v => v.length))).toBeLessThan(0.10)
    expect(() => assertWalkProjectionBodyUnchanged(source, damaged)).toThrow(/guard hand changed/)
  })

  it('is deterministic and never mutates the immutable input', () => {
    const before = digest(source.data), repeat = repairWalkProjection(source)
    expect(digest(source.data)).toBe(before)
    expect(digest(repeat.image.data)).toBe(digest(result.image.data))
  })
})
