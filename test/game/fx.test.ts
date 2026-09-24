import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import {
  FX_BURST,
  FX_DUST,
  FX_SPARK,
  paintBurst,
  paintDust,
  paintSpark,
} from '../../src/game/art/fx'

type Ctx = CanvasRenderingContext2D

function render(paint: (ctx: Ctx) => void, w: number, h: number): { pixels: Uint8ClampedArray; w: number; h: number } {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  paint(ctx as unknown as Ctx)
  return { pixels: ctx.getImageData(0, 0, canvas.width, canvas.height).data, w, h }
}

const alpha = (r: { pixels: Uint8ClampedArray }, x: number, y: number, w: number): number =>
  r.pixels[(y * w + x) * 4 + 3] ?? 0

function distinctColors(r: { pixels: Uint8ClampedArray }): number {
  const colors = new Set<number>()
  for (let i = 0; i < r.pixels.length; i += 4) {
    if ((r.pixels[i + 3] ?? 0) > 16) {
      colors.add((((r.pixels[i + 2] ?? 0) * 256 + (r.pixels[i + 1] ?? 0)) * 256) + (r.pixels[i] ?? 0))
    }
  }
  return colors.size
}

describe('ART-20 impact textures', () => {
  it('paints the hit spark as a layered starburst with a hot core', () => {
    const r = render(paintSpark, FX_SPARK.width, FX_SPARK.height)
    const cx = Math.floor(FX_SPARK.width / 2)
    const cy = Math.floor(FX_SPARK.height / 2)
    expect(distinctColors(r)).toBeGreaterThanOrEqual(4)
    // White-hot centre.
    const p = (cy * FX_SPARK.width + cx) * 4
    expect(r.pixels[p] ?? 0).toBeGreaterThan(230)
    expect(r.pixels[p + 1] ?? 0).toBeGreaterThan(230)
    // Ink flecks near the rim so it reads on bright skies.
    let dark = 0
    for (let y = 0; y < FX_SPARK.height; y += 1) {
      for (let x = 0; x < FX_SPARK.width; x += 1) {
        const q = (y * FX_SPARK.width + x) * 4
        if ((r.pixels[q] ?? 255) < 60 && (r.pixels[q + 3] ?? 0) > 100) dark += 1
      }
    }
    expect(dark).toBeGreaterThan(0)
    expect(alpha(r, cx, cy, FX_SPARK.width)).toBeGreaterThan(200)
  })

  it('paints the KO burst bigger, with a shockwave ring and embers', () => {
    expect(FX_BURST.width).toBeGreaterThan(FX_SPARK.width)
    const r = render(paintBurst, FX_BURST.width, FX_BURST.height)
    expect(distinctColors(r)).toBeGreaterThanOrEqual(5)
    // Ring ink near the rim.
    const cx = Math.floor(FX_BURST.width / 2)
    let rim = 0
    for (let x = 0; x < FX_BURST.width; x += 1) {
      if (alpha(r, x, 2, FX_BURST.width) > 100) rim += 1
    }
    expect(rim).toBeGreaterThan(0)
    expect(cx).toBeGreaterThan(0)
  })

  it('paints landing dust soft, brightest at the centre', () => {
    const r = render(paintDust, FX_DUST.width, FX_DUST.height)
    const cx = Math.floor(FX_DUST.width / 2)
    const cy = Math.floor(FX_DUST.height / 2)
    const centre = alpha(r, cx, cy, FX_DUST.width)
    const edge = alpha(r, 0, cy, FX_DUST.width)
    expect(centre).toBeGreaterThan(150)
    expect(edge).toBeLessThan(centre)
  })
})
