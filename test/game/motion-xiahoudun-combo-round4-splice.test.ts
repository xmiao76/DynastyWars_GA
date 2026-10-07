import { describe, expect, it } from 'vitest'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync as readFs } from 'node:fs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { K4, KEEP4, MAP4, spliceComboRound4 } from '../../scripts/splice-xiahoudun-combo-round4.mjs'

async function heights(path: string): Promise<number[]> {
  const img = await loadImage(readFs(path))
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  const px = g.getImageData(0, 0, img.width, img.height)
  const figs = alphaComponents(px, 96).filter(c => c.area > 64).sort((a, b) => a.x0 - b.x0)
  expect(figs.length).toBe(5)
  return figs.slice(0, 4).map(c => c.y1 - c.y0).sort((a, b) => a - b)
}

describe('CMR-14A combo round-4 splice gate', () => {
  it('fits gentle uniform scale to walk height (live medians, not estimates)', async () => {
    expect(K4).toBeCloseTo(321 / 372, 10)
    const hs = await heights('art/motion/xiahoudun/acceptance4-round4-combo-raw.png')
    expect((hs[1]! + hs[2]!) / 2).toBe(372)
  })

  it('covers all five failing cells and keeps the rest disjoint', () => {
    expect(MAP4.map(m => m[1]).sort((a, b) => a - b)).toEqual([0, 2, 3, 6, 7])
    expect(KEEP4.sort((a, b) => a - b)).toEqual([1, 4, 5, 8])
    for (const [, j] of MAP4) expect(KEEP4).not.toContain(j)
  })

  it('ghost-clear never eats keep art that old drawings overhang (523,343 regression)', async () => {
    const r = await spliceComboRound4()
    expect(r.composition.drawings).toBe(9)
    expect(r.measured.map(m => m.cell).sort((a, b) => a - b)).toEqual([0, 2, 3, 6, 7])
    for (const m of r.measured) expect(m.n).toBeGreaterThan(10000)
  })
})
