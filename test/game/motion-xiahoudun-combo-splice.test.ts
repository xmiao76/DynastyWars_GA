import { describe, expect, it } from 'vitest'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync } from 'node:fs'
import { alphaComponents } from '../../scripts/motion-pipeline.mjs'
import { gridCellOf } from '../../scripts/motion-retouch.mjs'
import { K, KEEP, MAP, spliceComboRound2 } from '../../scripts/splice-xiahoudun-combo-round2.mjs'

const med = (a: number[]) => [...a].sort((x, y) => x - y)[a.length >> 1]!

async function heights(path: string, cells: number): Promise<number[]> {
  const img = await loadImage(readFileSync(path))
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  const px = g.getImageData(0, 0, img.width, img.height)
  const cellOf = gridCellOf(3, 3), out: number[] = []
  for (let i = 0; i < cells; i++) {
    let y0 = Infinity, y1 = 0
    for (const c of alphaComponents(px, 96).filter(c => c.area > 64)) {
      if (cells === 9 && cellOf(c, img.width, img.height) !== i) continue
      for (const p of c.pixels) { const y = (p / img.width) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y }
    }
    out.push(y1 - y0)
  }
  return out
}

describe('CMR-14A combo round-2 splice gate', () => {
  it('fits uniform scale to walk figure height, not mass (mass is spear-biased)', async () => {
    expect(K).toBeCloseTo(321 / 424, 10)
    const walk = await heights('art/motion/xiahoudun/walk-projection-corrected-source.png', 9)
    expect(med(walk)).toBe(321)
  })

  it('covers exactly the five failing cells and keeps the rest disjoint', () => {
    expect(MAP.map(m => m[1]).sort((a, b) => a - b)).toEqual([0, 2, 3, 6, 7])
    expect(KEEP.sort((a, b) => a - b)).toEqual([1, 4, 5, 8])
    for (const [, j] of MAP) expect(KEEP).not.toContain(j)
  })

  it('refuses a blind cut through steel spearhead and tassel mass', async () => {
    await expect(spliceComboRound2()).rejects.toThrow(/not empty/)
  })
})
