import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import type { TouchGeometry } from '../../src/game/art/hudart'
import {
  BANNER_TEX,
  CHIP_TEX,
  GO_TEX,
  MEDAL_TEX,
  PEARL_TEX,
  PIP_TEX,
  PLATE_TEX,
  RAIL_TEX,
  TOUCH_TEX,
  paintBanner,
  paintChip,
  paintGoArrow,
  paintLivesPip,
  paintMedallion,
  paintPearl,
  paintPlate,
  paintRail,
  paintTouchControls,
} from '../../src/game/art/hudart'

type Ctx = CanvasRenderingContext2D

function render(paint: (ctx: Ctx, scale: number) => void, w: number, h: number): Uint8ClampedArray {
  const canvas = createCanvas(w * 2, h * 2)
  const ctx = canvas.getContext('2d')
  paint(ctx as unknown as Ctx, 2)
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data
}

function alphaCount(pixels: Uint8ClampedArray): number {
  let n = 0
  for (let i = 3; i < pixels.length; i += 4) if ((pixels[i] ?? 0) > 16) n += 1
  return n
}

function distinctColors(pixels: Uint8ClampedArray): number {
  const colors = new Set<number>()
  for (let i = 0; i < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) > 16) colors.add(((pixels[i + 2] ?? 0) * 256 + (pixels[i + 1] ?? 0)) * 256 + (pixels[i] ?? 0))
  }
  return colors.size
}

describe('UI-4 HUD art painters', () => {
  it('paints the plate richly, with the same render for both variants', () => {
    for (const variant of ['p1', 'p2'] as const) {
      const pixels = render((ctx, s) => paintPlate(ctx, s, variant), PLATE_TEX.width, PLATE_TEX.height)
      expect(alphaCount(pixels)).toBeGreaterThan(PLATE_TEX.width * PLATE_TEX.height * 0.7)
      expect(distinctColors(pixels)).toBeGreaterThan(24)
    }
  })

  it('paints the medallion with a portrait window', () => {
    const source = createCanvas(24, 24)
    const sCtx = source.getContext('2d')
    sCtx.fillStyle = '#d8a868'
    sCtx.fillRect(0, 0, 24, 24)
    for (const withPortrait of [false, true] as const) {
      const pixels = render(
        (ctx, s) => paintMedallion(ctx, s, withPortrait ? (source as unknown as CanvasImageSource) : undefined),
        MEDAL_TEX.width,
        MEDAL_TEX.height,
      )
      expect(alphaCount(pixels)).toBeGreaterThan(MEDAL_TEX.width * MEDAL_TEX.height * 0.6)
      expect(distinctColors(pixels)).toBeGreaterThan(16)
    }
  })

  it('paints lit and idle pearls', () => {
    for (const lit of [true, false] as const) {
      const pixels = render((ctx, s) => paintPearl(ctx, s, lit), PEARL_TEX.width, PEARL_TEX.height)
      expect(alphaCount(pixels)).toBeGreaterThan(PEARL_TEX.width * PEARL_TEX.height * 0.2)
    }
  })

  it('paints the lives pip, chip and GO chevrons', () => {
    const pip = render((ctx, s) => paintLivesPip(ctx, s), PIP_TEX.width, PIP_TEX.height)
    expect(alphaCount(pip)).toBeGreaterThan(PIP_TEX.width * PIP_TEX.height * 0.3)
    const chip = render((ctx, s) => paintChip(ctx, s), CHIP_TEX.width, CHIP_TEX.height)
    expect(alphaCount(chip)).toBeGreaterThan(CHIP_TEX.width * CHIP_TEX.height * 0.8)
    const go = render((ctx, s) => paintGoArrow(ctx, s), GO_TEX.width, GO_TEX.height)
    expect(alphaCount(go)).toBeGreaterThan(GO_TEX.width * GO_TEX.height * 0.25)
  })

  it('paints rail and banner backings in both variants', () => {
    const rail = render((ctx, s) => paintRail(ctx, s), RAIL_TEX.width, RAIL_TEX.height)
    expect(alphaCount(rail)).toBeGreaterThan(RAIL_TEX.width * RAIL_TEX.height * 0.9)
    for (const variant of ['gold', 'red'] as const) {
      const banner = render((ctx, s) => paintBanner(ctx, s, variant), BANNER_TEX.width, BANNER_TEX.height)
      expect(alphaCount(banner)).toBeGreaterThan(BANNER_TEX.width * BANNER_TEX.height * 0.7)
    }
  })

  it('paints the touch sheet over real hit-zone geometry', () => {
    const geo: TouchGeometry = {
      padCx: 46,
      padCy: 224,
      padArm: 17,
      btnR: 15,
      buttons: [
        { x: 440, y: 230 },
        { x: 402, y: 234 },
        { x: 424, y: 196 },
      ],
      pauseCx: 240,
      pauseCy: 248,
      pauseR: 12,
    }
    const pixels = render((ctx, s) => paintTouchControls(ctx, s, geo), TOUCH_TEX.width, TOUCH_TEX.height)
    expect(alphaCount(pixels)).toBeGreaterThan(2_500)
    expect(distinctColors(pixels)).toBeGreaterThan(24)
  })
})
