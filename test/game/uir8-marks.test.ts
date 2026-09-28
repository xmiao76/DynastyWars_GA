import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { MARKS_H, TILE_W, paintMarks, type MarksKind } from '../../src/game/art/backdrop'

/**
 * UIR-8 measurable acceptance (V-11): the landmark strips must be painted,
 * not flat fills. For every 16x16 block that is at least half opaque, the
 * luminance standard deviation measures in-block tonal life; the share of
 * blocks clearing the threshold must clear the floor on every kind.
 *
 * Before (flat painter, threshold 10): gorge 1.00, village 0.44, riverbank
 * 0.25, bridge 1.00, outskirts 1.00, warships 0.67, inferno 0.31, flagship
 * 0.25, arena 0.44 - five kinds below the 0.55 floor, so this test fails
 * on the old paint. After: every kind clears 0.55 (see run output).
 */
const KINDS: MarksKind[] = [
  'gorge',
  'village',
  'riverbank',
  'bridge',
  'outskirts',
  'warships',
  'inferno',
  'flagship',
  'arena',
]

export function texturedShare(kind: MarksKind, thresh: number): { share: number; opaque: number } {
  const cv = createCanvas(TILE_W, MARKS_H)
  const ctx = cv.getContext('2d')
  paintMarks(ctx as unknown as CanvasRenderingContext2D, kind)
  const d = ctx.getImageData(0, 0, TILE_W, MARKS_H).data
  const lum = (i: number): number => 0.2126 * (d[i] ?? 0) + 0.7152 * (d[i + 1] ?? 0) + 0.0722 * (d[i + 2] ?? 0)
  let textured = 0
  let opaque = 0
  for (let by = 0; by < MARKS_H; by += 16) {
    for (let bx = 0; bx < TILE_W; bx += 16) {
      const vals: number[] = []
      for (let y = by; y < by + 16; y += 1) {
        for (let x = bx; x < bx + 16; x += 1) {
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

describe('UIR-8 landmark strips are painted (V-11)', () => {
  it('every kind keeps most opaque blocks tonally alive', () => {
    for (const kind of KINDS) {
      const r = texturedShare(kind, 10)
      console.log(`uir8 ${kind}: share=${r.share.toFixed(2)} opaque=${r.opaque}`)
      expect(r.share, `${kind}: textured block share`).toBeGreaterThanOrEqual(0.55)
    }
  })
})
