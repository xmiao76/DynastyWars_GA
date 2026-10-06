import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import {
  CLOUD_H,
  CLOUD_W,
  SKY_H,
  TILE_W,
  paintCloud,
  paintSky,
} from '../../src/game/art/backdrop'

/**
 * UIR-9 measurable acceptance (V-13 sky part): the sky and the clouds must
 * be painted, not a flat gradient with flat lobes. Same metric as UIR-8:
 * for every 16x16 block that is at least half opaque, the luminance
 * standard deviation measures tonal life; the share clearing the threshold
 * must clear the floor.
 *
 * Before (flat painters, threshold 7): sky-day 0.04, cloud 0.80 -
 * both below their floors (0.55 / 0.9), so this test fails on the old
 * paint. After: all clear (see run output).
 */
type Ctx = CanvasRenderingContext2D

function texturedShare(
  paint: (ctx: Ctx) => void,
  w: number,
  h: number,
  thresh: number,
): { share: number; opaque: number } {
  const cv = createCanvas(w, h)
  const ctx = cv.getContext('2d')
  paint(ctx as unknown as Ctx)
  const d = ctx.getImageData(0, 0, w, h).data
  const lum = (i: number): number => 0.2126 * (d[i] ?? 0) + 0.7152 * (d[i + 1] ?? 0) + 0.0722 * (d[i + 2] ?? 0)
  let textured = 0
  let opaque = 0
  for (let by = 0; by < h; by += 16) {
    for (let bx = 0; bx < w; bx += 16) {
      const vals: number[] = []
      for (let y = by; y < Math.min(by + 16, h); y += 1) {
        for (let x = bx; x < Math.min(bx + 16, w); x += 1) {
          const i = (y * w + x) * 4
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

describe('UIR-9 sky and clouds are painted (V-13)', () => {
  it('day sky and cloud keep most opaque blocks tonally alive', () => {
    const cases: Array<[string, (ctx: Ctx) => void, number, number, number]> = [
      ['sky-day', (c) => paintSky(c, 0x3a6fd8, 0x8a9ab0), TILE_W, SKY_H, 0.55],
      ['cloud', (c) => paintCloud(c), CLOUD_W, CLOUD_H, 0.9],
    ]
    for (const [label, paint, w, h, floor] of cases) {
      const r = texturedShare(paint, w, h, 7)
      console.log(`uir9 ${label}: share=${r.share.toFixed(2)} opaque=${r.opaque}`)
      expect(r.share, `${label}: textured block share`).toBeGreaterThanOrEqual(floor)
    }
  })
})
