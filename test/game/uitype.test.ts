import { GlobalFonts, createCanvas } from '@napi-rs/canvas'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  DISPLAY_FAMILY,
  bakeBox,
  bakeDisplayText,
  displayStringTable,
  type DisplayVariant,
} from '../../src/game/ui/type'

const VARIANTS: DisplayVariant[] = ['gold', 'bone', 'crimson', 'azure']

function bake(text: string, variant: DisplayVariant, size: number): { box: { width: number; height: number }; pixels: Uint8ClampedArray } {
  const measure = createCanvas(8, 8).getContext('2d')
  const box = bakeBox(measure as unknown as CanvasRenderingContext2D, { text, size, variant })
  const canvas = createCanvas(Math.max(1, box.width * 2), Math.max(1, box.height * 2))
  const ctx = canvas.getContext('2d')
  bakeDisplayText(ctx as unknown as CanvasRenderingContext2D, { text, size, variant }, 2, box)
  return { box, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height).data }
}

const alphaPixels = (pixels: Uint8ClampedArray): number => {
  let n = 0
  for (let i = 3; i < pixels.length; i += 4) if ((pixels[i] ?? 0) > 16) n += 1
  return n
}

describe('baked display text', () => {
  beforeAll(() => {
    GlobalFonts.registerFromPath('src/game/assets/fonts/zcool-qingke-huangyou-subset.woff2', DISPLAY_FAMILY)
    expect(GlobalFonts.families.map((f) => f.family)).toContain(DISPLAY_FAMILY)
  })

  it('bakes every display string in every variant without clipping', () => {
    const strings = displayStringTable()
    expect(strings.length).toBeGreaterThan(60)
    for (const text of strings) {
      for (const variant of VARIANTS) {
        const { box, pixels } = bake(text, variant, 24)
        expect(box.width, `${variant} ${text}: zero width`).toBeGreaterThan(0)
        expect(box.height, `${variant} ${text}: zero height`).toBeGreaterThan(0)
        // Clipped text loses its edges: re-bake into a doubled box and require
        // the same drawn area, proving the measured box already held it all.
        const wide = { width: box.width * 2, height: box.height * 2 }
        const canvas = createCanvas(wide.width * 2, wide.height * 2)
        const ctx = canvas.getContext('2d')
        bakeDisplayText(ctx as unknown as CanvasRenderingContext2D, { text, size: 24, variant }, 2, wide)
        const widePixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        expect(alphaPixels(pixels), `${variant} ${text}: draws nothing`).toBeGreaterThan(0)
        expect(alphaPixels(widePixels), `${variant} ${text}: clipped by its box`).toBe(alphaPixels(pixels))
      }
    }
  }, 120_000)

  it('CJK headings stay upright while Latin leans', () => {
    const measure = createCanvas(8, 8).getContext('2d') as unknown as CanvasRenderingContext2D
    measure.font = `400 40px "${DISPLAY_FAMILY}", sans-serif`
    const size = 40
    const ink = size * 0.18
    const latinRaw = measure.measureText('DYNASTY').width
    const cjkRaw = measure.measureText('赤壁之战').width
    // Exact padding formulas: Latin carries the lean allowance, CJK none.
    // (bakeBox ceils the raw advance first, then ceils the padded total.)
    expect(bakeBox(measure, { text: 'DYNASTY', size, variant: 'gold' }).width).toBe(
      Math.ceil(Math.ceil(latinRaw) + 0.12 * size + ink * 4),
    )
    expect(bakeBox(measure, { text: '赤壁之战', size, variant: 'gold' }).width).toBe(
      Math.ceil(Math.ceil(cjkRaw) + ink * 4),
    )
    expect(
      bakeBox(measure, { text: 'Battle of Red Cliffs · 赤壁之战', size, variant: 'gold' }).width,
    ).toBe(
      Math.ceil(Math.ceil(measure.measureText('Battle of Red Cliffs · 赤壁之战').width) + ink * 4),
    )
  })

  it('baking is deterministic for the same spec', () => {
    const a = bake('CHOOSE YOUR WARRIOR 關羽', 'crimson', 20).pixels
    const b = bake('CHOOSE YOUR WARRIOR 關羽', 'crimson', 20).pixels
    expect(a.length).toBe(b.length)
    expect(Buffer.from(a)).toEqual(Buffer.from(b))
  })
})
