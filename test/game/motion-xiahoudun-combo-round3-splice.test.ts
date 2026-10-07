import { describe, expect, it } from 'vitest'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync } from 'node:fs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { ACTIVE3, K3, KEEP3A, MAP3, spliceComboRound3 } from '../../scripts/splice-xiahoudun-combo-round3.mjs'

describe('CMR-14A combo round-3 splice gate', () => {
  it('fits gentle uniform scale to walk height (live medians, not estimates)', async () => {
    expect(K3).toBeCloseTo(321 / 364.5, 10)
    const img = await loadImage(readFileSync('art/motion/xiahoudun/acceptance4-round3-combo-raw.png'))
    const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
    const px = g.getImageData(0, 0, img.width, img.height)
    const figs = alphaComponents(px, 96).filter(c => c.area > 64).sort((a, b) => a.x0 - b.x0)
    expect(figs.length).toBe(5)
    const hs = figs.slice(0, 4).map(c => c.y1 - c.y0).sort((a, b) => a - b)
    expect((hs[1]! + hs[2]!) / 2).toBe(364.5)
  })

  it('banks four fittable cells and holds the vertical guard for an owner-visible decision', () => {
    expect(MAP3.map(m => m[1]).sort((a, b) => a - b)).toEqual([0, 2, 3, 6, 7])
    expect(ACTIVE3.map(m => m[1]).sort((a, b) => a - b)).toEqual([0, 2, 3, 6])
    expect(KEEP3A.sort((a, b) => a - b)).toEqual([1, 4, 5, 7, 8])
  })

  it('refuses pasting severed resample fragments instead of merging them silently', async () => {
    await expect(spliceComboRound3()).rejects.toThrow(/vs expected/)
  })
})
