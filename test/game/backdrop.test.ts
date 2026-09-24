import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { STAGE_ORDER } from '../../src/core/stage'
import {
  EMBERS_H,
  GROUND_H,
  MARKS_H,
  RIDGE_H,
  SKY_H,
  TILE_W,
  paintEmbers,
  paintGround,
  paintMarks,
  paintRidge,
  paintSky,
  type MarksKind,
} from '../../src/game/art/backdrop'
import { backdropStageIds, stageBackdrop } from '../../src/game/data/stagebackdrop'

type Ctx = CanvasRenderingContext2D

function render(paint: (ctx: Ctx) => void, w: number, h: number): Uint8ClampedArray {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  paint(ctx as unknown as Ctx)
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data
}

const stepAt = (pixels: Uint8ClampedArray, x: number, y: number, w: number, dx: number): number => {
  const a = (y * w + x) * 4
  const b = (y * w + ((x + dx + w) % w)) * 4
  return (
    Math.abs((pixels[a] ?? 0) - (pixels[b] ?? 0)) +
    Math.abs((pixels[a + 1] ?? 0) - (pixels[b + 1] ?? 0)) +
    Math.abs((pixels[a + 2] ?? 0) - (pixels[b + 2] ?? 0)) +
    Math.abs((pixels[a + 3] ?? 0) - (pixels[b + 3] ?? 0))
  )
}

/**
 * A seam is invisible when the step ACROSS it is no steeper than the
 * steepest step INSIDE the tile: a sloped ridge legitimately differs from
 * column to column, so column-equality is the wrong bar (it fails every
 * sloped edge, periodic or not). Returns [seamStep, interiorStep].
 */
function seamProfile(pixels: Uint8ClampedArray, w: number, h: number): [number, number] {
  let seam = 0
  let interior = 0
  for (let y = 0; y < h; y += 1) {
    seam = Math.max(seam, stepAt(pixels, w - 1, y, w, 1))
    for (let x = 0; x < w - 1; x += 1) {
      interior = Math.max(interior, stepAt(pixels, x, y, w, 1))
    }
  }
  return [seam, interior]
}

/** Antialiasing wobble budget on top of the interior maximum (4 channels). */
const SEAM_TOLERANCE = 24

function signature(pixels: Uint8ClampedArray): string {
  let h = 2166136261
  for (let i = 0; i < pixels.length; i += 7) {
    h = Math.imul(h ^ (pixels[i] ?? 0), 16777619)
  }
  return (h >>> 0).toString(16)
}

describe('ART-19 backdrop geometry is frozen', () => {
  it('keeps the tile sizes the scene anchors to', () => {
    expect(TILE_W).toBe(256)
    expect(SKY_H).toBe(270)
    expect(RIDGE_H).toBe(96)
    expect(GROUND_H).toBe(116)
    expect(MARKS_H).toBe(64)
    expect(EMBERS_H).toBe(64)
  })
})

describe('ART-19 periodic tile seams', () => {
  const expectSeamless = (pixels: Uint8ClampedArray, w: number, h: number, label: string): void => {
    const [seam, interior] = seamProfile(pixels, w, h)
    expect(seam, `${label}: seam step ${seam} exceeds interior max ${interior}`).toBeLessThanOrEqual(
      interior + SEAM_TOLERANCE,
    )
  }

  it('joins the legacy layers seamlessly', () => {
    expectSeamless(render((c) => paintSky(c, 0x3a6fd8, 0x8a9ab0), TILE_W, SKY_H), TILE_W, SKY_H, 'sky')
    expectSeamless(render((c) => paintRidge(c, 0x5a7a4a, 0x8a9ab0), TILE_W, RIDGE_H), TILE_W, RIDGE_H, 'ridge')
    expectSeamless(render((c) => paintGround(c, 0x7a9a5a), TILE_W, GROUND_H), TILE_W, GROUND_H, 'ground')
    expectSeamless(
      render((c) => paintSky(c, 0xa06430, 0x5a3318, 'ember'), TILE_W, SKY_H),
      TILE_W,
      SKY_H,
      'ember sky',
    )
  })

  it('joins every landmark kind seamlessly', () => {
    const kinds: MarksKind[] = [
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
    for (const kind of kinds) {
      const pixels = render((c) => paintMarks(c, kind), TILE_W, MARKS_H)
      expectSeamless(pixels, TILE_W, MARKS_H, kind)
    }
  })

  it('keeps the ember strip seamless', () => {
    const pixels = render((c) => paintEmbers(c), TILE_W, EMBERS_H)
    expectSeamless(pixels, TILE_W, EMBERS_H, 'embers')
  })

  it('wraps the gorge and inferno walls exactly across the seam', () => {
    for (const kind of ['gorge', 'inferno'] as const) {
      const pixels = render((c) => paintMarks(c, kind), TILE_W, MARKS_H)
      for (let y = 0; y < MARKS_H; y += 1) {
        expect(stepAt(pixels, TILE_W - 1, y, TILE_W, 1), `${kind} row ${y}`).toBe(0)
      }
    }
  })

  it('keeps interior-only kinds clear of the tile edges', () => {
    const margins = [0, 1, 2, 3, 4, 5, 6, 7, TILE_W - 8, TILE_W - 7, TILE_W - 6, TILE_W - 5, TILE_W - 4, TILE_W - 3, TILE_W - 2, TILE_W - 1]
    for (const [kind, y1] of [
      ['village', MARKS_H],
      ['warships', MARKS_H - 13],
      ['flagship', MARKS_H - 13],
    ] as const) {
      const pixels = render((c) => paintMarks(c, kind), TILE_W, MARKS_H)
      for (let y = 0; y < y1; y += 1) {
        for (const x of margins) {
          expect(pixels[(y * TILE_W + x) * 4 + 3], `${kind} touches x=${x}`).toBe(0)
        }
      }
    }
  })

  it('repeats the patterned bands on integer periods', () => {
    const bandEqual = (kind: MarksKind, period: number, y0: number, y1: number, x1 = TILE_W - period): void => {
      const pixels = render((c) => paintMarks(c, kind), TILE_W, MARKS_H)
      for (let y = y0; y < y1; y += 1) {
        for (let x = 0; x < x1; x += 1) {
          // Antialiasing jitter at stroke vertices is a few channels deep; a
          // REAL period break (a shape that exists at x but not x+period)
          // steps by the better part of a full ink-to-empty transition.
          expect(stepAt(pixels, x, y, TILE_W, period), `${kind} breaks period ${period} at ${x},${y}`).toBeLessThanOrEqual(12)
        }
      }
    }
    // Reeds every 32 (reed rows are reeds-only); palisade every 16, checked
    // left of the first tent; arena every 64 (peaks + braziers).
    bandEqual('riverbank', 32, MARKS_H - 40, MARKS_H - 26)
    bandEqual('outskirts', 16, MARKS_H - 26, MARKS_H, 40)
    bandEqual('arena', 64, 0, MARKS_H)
  })

  it('continues the full-width bands across the seam', () => {
    for (const [kind, y0, y1] of [
      ['riverbank', MARKS_H - 22, MARKS_H],
      ['bridge', MARKS_H - 12, MARKS_H - 2],
      ['warships', MARKS_H - 12, MARKS_H],
      ['flagship', MARKS_H - 12, MARKS_H],
      ['inferno', MARKS_H - 12, MARKS_H],
    ] as const) {
      const pixels = render((c) => paintMarks(c, kind), TILE_W, MARKS_H)
      for (let y = y0; y < y1; y += 1) {
        // Within antialiasing: a real cut steps by hundreds, a clipped
        // stroke edge by a unit or two.
        expect(stepAt(pixels, TILE_W - 1, y, TILE_W, 1), `${kind} band row ${y}`).toBeLessThanOrEqual(6)
      }
    }
  })
})

describe('ART-19 per-stage distinctness', () => {
  it('covers every stage, one unique kind each', () => {
    expect(backdropStageIds()).toEqual(STAGE_ORDER)
    const kinds = STAGE_ORDER.map((id) => stageBackdrop(id).marks)
    expect(new Set(kinds).size).toBe(9)
  })

  it('paints nine visually different landmark strips', () => {
    const sigs = STAGE_ORDER.map((id) =>
      signature(render((c) => paintMarks(c, stageBackdrop(id).marks), TILE_W, MARKS_H)),
    )
    expect(new Set(sigs).size).toBe(9)
  })

  it('keeps the day sky byte-identical and makes ember different', () => {
    const a = render((c) => paintSky(c, 0x3a6fd8, 0x8a9ab0), TILE_W, SKY_H)
    const b = render((c) => paintSky(c, 0x3a6fd8, 0x8a9ab0, 'day'), TILE_W, SKY_H)
    expect(signature(a)).toBe(signature(b))
    const e = render((c) => paintSky(c, 0x3a6fd8, 0x8a9ab0, 'ember'), TILE_W, SKY_H)
    expect(signature(e)).not.toBe(signature(a))
  })

  it('lights the fire only on the burning stages', () => {
    for (const id of STAGE_ORDER) {
      expect(stageBackdrop(id).embers).toBe(id === 'stage7' || id === 'stage8')
    }
    expect(stageBackdrop('stage7').sky).toBe('ember')
    expect(stageBackdrop('stage9').marks).toBe('arena')
  })
})
