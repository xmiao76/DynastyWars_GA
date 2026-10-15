import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { limbPath } from '../../src/game/art/paths'

/**
 * The two path primitives every figure is built from must FILL.
 *
 * ART-16. Both traced their two sides crossed - out along one side of the
 * limb, back along the SAME side - so every shape was a bow-tie whose middle
 * the nonzero fill left empty. It shipped in the first commit and no gate
 * noticed, because the ink pass strokes the outline fat enough to close most
 * of the hole and every other gate here measures silhouette, not interior.
 *
 * So this fills one shape of each kind on a clean canvas and counts the
 * middle directly: a column across the widest point of the limb must be
 * painted nearly its full width.
 */
const W = 120
const H = 120

function column(draw: (ctx: CanvasRenderingContext2D) => void, x: number): number {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  draw(ctx)
  ctx.fill()
  const img = canvas.getContext('2d').getImageData(0, 0, W, H)
  let painted = 0
  for (let y = 0; y < H; y += 1) {
    if ((img.data[(y * W + x) * 4 + 3] ?? 0) >= 128) painted += 1
  }
  return painted
}

describe('path primitives', () => {
  it('limbPath fills the whole limb, not just its caps', () => {
    // Horizontal, 60 wide tapering to 40: the middle column spans ~50px.
    const painted = column((ctx) => limbPath(ctx, { x: 20, y: 60 }, { x: 100, y: 60 }, 60, 40), 60)
    expect(painted, 'the middle of the limb is hollow - the sides cross').toBeGreaterThan(44)
  })

  it('limbPath fills whichever way the limb points', () => {
    // A crossed path is direction-dependent in where it pinches; a correct one
    // is not. Diagonal, and drawn from the far end back.
    for (const [a, b] of [
      [{ x: 100, y: 100 }, { x: 20, y: 20 }],
      [{ x: 20, y: 100 }, { x: 100, y: 20 }],
    ] as const) {
      const painted = column((ctx) => limbPath(ctx, a, b, 40, 40), 60)
      // Across a 40-wide limb at 45deg the column spans 40 * sqrt(2).
      expect(painted, 'the diagonal limb is hollow in the middle').toBeGreaterThan(50)
    }
  })


})
