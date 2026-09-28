import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { RIDGE_H, TILE_W, paintRidge } from '../../src/game/art/backdrop'

/**
 * UIR-10 measurable acceptance (V-13 ridge part): the ridges must be
 * painted - value falloff with distance, a lit crest, a shaded flank -
 * not flat fills with an outline. Same 16x16-block luminance-std-dev
 * share metric as UIR-8/9.
 *
 * Before (flat painters, threshold 7): day 0.67, dusk 0.48 - below the
 * 0.75 floor, so this test fails on the old paint. After: both clear
 * (see run output).
 */
type Ctx = CanvasRenderingContext2D

function texturedShare(hillColor: number, hazeColor: number, thresh: number): { share: number; opaque: number } {
  const cv = createCanvas(TILE_W, RIDGE_H)
  const ctx = cv.getContext('2d')
  paintRidge(ctx as unknown as Ctx, hillColor, hazeColor)
  const d = ctx.getImageData(0, 0, TILE_W, RIDGE_H).data
  const lum = (i: number): number => 0.2126 * (d[i] ?? 0) + 0.7152 * (d[i + 1] ?? 0) + 0.0722 * (d[i + 2] ?? 0)
  let textured = 0
  let opaque = 0
  for (let by = 0; by < RIDGE_H; by += 16) {
    for (let bx = 0; bx < TILE_W; bx += 16) {
      const vals: number[] = []
      for (let y = by; y < Math.min(by + 16, RIDGE_H); y += 1) {
        for (let x = bx; x < Math.min(bx + 16, TILE_W); x += 1) {
          const i = (y * TILE_W + x) * 4
          if ((d[i + 3] ?? 0) >= 128) vals.push(lum(i))
        }
      }
      if (vals.length < 128) continue
      opaque += 1
      const mean = vals.reduce((a, v) => a + v, 0) / vals.length
      const sd = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length)
      if (sd >= thresh) textured += 1
    }
  }
  return { share: opaque === 0 ? 0 : textured / opaque, opaque }
}

describe('UIR-10 hill ridges are painted (V-13)', () => {
  it('day and dusk ridges keep most opaque blocks tonally alive', () => {
    const cases: Array<[string, number, number]> = [
      ['ridge-day', 0x5a7a4a, 0x8a9ab0],
      ['ridge-dusk', 0x4a3a5a, 0x6a5a7a],
    ]
    for (const [label, hill, haze] of cases) {
      const r = texturedShare(hill, haze, 7)
      console.log(`uir10 ${label}: share=${r.share.toFixed(2)} opaque=${r.opaque}`)
      expect(r.share, `${label}: textured block share`).toBeGreaterThanOrEqual(0.75)
    }
  })
})
