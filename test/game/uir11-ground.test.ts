import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { GROUND_H, TILE_W, paintGround } from '../../src/game/art/backdrop'

/**
 * UIR-11 measurable acceptance (V-13 ground part): the walkable ground
 * must be painted - varied strokes and falloff, not one tint with dots.
 * Same 16x16-block luminance-std-dev share metric as UIR-8/9/10.
 *
 * Before (flat painter, threshold 7): grass 0.19, earth 0.19 - below the
 * 0.55 floor, so this test fails on the old paint. After: both clear
 * (see run output).
 */
type Ctx = CanvasRenderingContext2D

function texturedShare(baseColor: number, thresh: number): { share: number; opaque: number } {
  const cv = createCanvas(TILE_W, GROUND_H)
  const ctx = cv.getContext('2d')
  paintGround(ctx as unknown as Ctx, baseColor)
  const d = ctx.getImageData(0, 0, TILE_W, GROUND_H).data
  const lum = (i: number): number => 0.2126 * (d[i] ?? 0) + 0.7152 * (d[i + 1] ?? 0) + 0.0722 * (d[i + 2] ?? 0)
  let textured = 0
  let opaque = 0
  for (let by = 0; by < GROUND_H; by += 16) {
    for (let bx = 0; bx < TILE_W; bx += 16) {
      const vals: number[] = []
      for (let y = by; y < Math.min(by + 16, GROUND_H); y += 1) {
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

describe('UIR-11 walkable ground is painted (V-13)', () => {
  it('grass and earth grounds keep most opaque blocks tonally alive', () => {
    const cases: Array<[string, number]> = [
      ['ground-grass', 0x7a9a5a],
      ['ground-earth', 0x8a6a48],
    ]
    for (const [label, base] of cases) {
      const r = texturedShare(base, 7)
      console.log(`uir11 ${label}: share=${r.share.toFixed(2)} opaque=${r.opaque}`)
      expect(r.share, `${label}: textured block share`).toBeGreaterThanOrEqual(0.55)
    }
  })
})
