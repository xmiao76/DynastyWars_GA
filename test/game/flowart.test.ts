import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import {
  CARD_TEX,
  CHIP_PLATE_TEX,
  DIALOG_TEX,
  paintDialogCard,
  paintIntroCard,
  paintStatChip,
} from '../../src/game/art/flowart'
import { STAGE_ORDER } from '../../src/core/stage'
import { loreStageIds, stageLore } from '../../src/game/data/stagelore'

type Ctx = CanvasRenderingContext2D

function render(paint: (ctx: Ctx, scale: number) => void, w: number, h: number): Uint8ClampedArray {
  const canvas = createCanvas(w * 2, h * 2)
  const ctx = canvas.getContext('2d')
  paint(ctx as unknown as Ctx, 2)
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data
}

const alphaCount = (pixels: Uint8ClampedArray): number => {
  let n = 0
  for (let i = 3; i < pixels.length; i += 4) if ((pixels[i] ?? 0) > 16) n += 1
  return n
}

const distinctColors = (pixels: Uint8ClampedArray): number => {
  const colors = new Set<number>()
  for (let i = 0; i < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) > 16) colors.add((((pixels[i + 2] ?? 0) * 256 + (pixels[i + 1] ?? 0)) * 256) + (pixels[i] ?? 0))
  }
  return colors.size
}

describe('UI-5 flow-card painters', () => {
  it('paints the intro card as rich parchment', () => {
    const pixels = render((ctx, s) => paintIntroCard(ctx, s), CARD_TEX.width, CARD_TEX.height)
    expect(alphaCount(pixels)).toBeGreaterThan(CARD_TEX.width * CARD_TEX.height * 0.7)
    expect(distinctColors(pixels)).toBeGreaterThan(40)
  })

  it('paints both dialog variants and the stat chip', () => {
    for (const variant of ['gold', 'crimson'] as const) {
      const pixels = render((ctx, s) => paintDialogCard(ctx, s, variant), DIALOG_TEX.width, DIALOG_TEX.height)
      expect(alphaCount(pixels)).toBeGreaterThan(DIALOG_TEX.width * DIALOG_TEX.height * 0.7)
      expect(distinctColors(pixels)).toBeGreaterThan(30)
    }
    const chip = render((ctx, s) => paintStatChip(ctx, s), CHIP_PLATE_TEX.width, CHIP_PLATE_TEX.height)
    expect(alphaCount(chip)).toBeGreaterThan(CHIP_PLATE_TEX.width * CHIP_PLATE_TEX.height * 0.8)
  })
})

describe('UI-5 stage lore table', () => {
  it('covers every stage in order, with no fallback needed', () => {
    expect(loreStageIds()).toEqual(STAGE_ORDER)
    for (const id of STAGE_ORDER) {
      const lore = stageLore(id)
      expect(lore.number).toBeGreaterThan(0)
      expect(lore.lines[0]?.length).toBeGreaterThan(8)
      expect(lore.lines[1]?.length).toBeGreaterThan(8)
      expect(lore.captionZh.length).toBeGreaterThan(3)
    }
  })

  it('numbers the stages to match their order', () => {
    STAGE_ORDER.forEach((id, i) => {
      expect(stageLore(id).number).toBe(i + 1)
    })
  })

  it('keeps lore lines short enough for the parchment card', () => {
    for (const id of STAGE_ORDER) {
      for (const line of stageLore(id).lines) {
        expect(line.length).toBeLessThanOrEqual(46)
      }
    }
  })
})
