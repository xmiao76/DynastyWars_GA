import { describe, expect, it } from 'vitest'
import {
  applyAlphaKey,
  buildManifest,
  composeIntoBox,
  despill,
  sniffKeyColor,
  trimBox,
} from '../../scripts/bake-core.mjs'

/** Build a synthetic RGBA image: solid background + an opaque center block. */
function synthImage({ width, height, bg, block }: {
  width: number
  height: number
  bg: { r: number; g: number; b: number }
  block: { x: number; y: number; w: number; h: number }
}) {
  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = bg.r
    data[i * 4 + 1] = bg.g
    data[i * 4 + 2] = bg.b
    data[i * 4 + 3] = 255
  }
  for (let y = block.y; y < block.y + block.h; y += 1) {
    for (let x = block.x; x < block.x + block.w; x += 1) {
      const i = (y * width + x) * 4
      data[i] = 40
      data[i + 1] = 60
      data[i + 2] = 120
      data[i + 3] = 255
    }
  }
  return { width, height, data }
}

describe('bake core', () => {
  it('sniffs the corner key color (magenta)', () => {
    const image = synthImage({
      width: 20,
      height: 20,
      bg: { r: 255, g: 0, b: 255 },
      block: { x: 8, y: 8, w: 4, h: 4 },
    })
    expect(sniffKeyColor(image).name).toBe('magenta')
  })

  it('sniffs green and blue corners too', () => {
    const green = synthImage({ width: 10, height: 10, bg: { r: 0, g: 255, b: 0 }, block: { x: 4, y: 4, w: 2, h: 2 } })
    expect(sniffKeyColor(green).name).toBe('green')
    const blue = synthImage({ width: 10, height: 10, bg: { r: 0, g: 0, b: 255 }, block: { x: 4, y: 4, w: 2, h: 2 } })
    expect(sniffKeyColor(blue).name).toBe('blue')
  })

  it('alpha-keys the background out and keeps the subject', () => {
    const image = synthImage({
      width: 20,
      height: 20,
      bg: { r: 255, g: 0, b: 255 },
      block: { x: 8, y: 8, w: 4, h: 4 },
    })
    applyAlphaKey(image, { name: 'magenta', r: 255, g: 0, b: 255 })
    expect(image.data[3]).toBe(0) // corner: transparent
    const center = (9 * 20 + 9) * 4
    expect(image.data[center + 3]).toBe(255) // block: opaque
  })

  it('despills magenta-tinted edge texels', () => {
    const image = {
      width: 1,
      height: 1,
      data: new Uint8Array([250, 120, 240, 255]), // magenta spill
    }
    despill(image, { name: 'magenta', r: 255, g: 0, b: 255 })
    expect(image.data[0]).toBe(120) // R pulled down to G
    expect(image.data[2]).toBe(120) // B pulled down to G
  })

  it('trims to the alpha bounding box', () => {
    const image = synthImage({
      width: 20,
      height: 20,
      bg: { r: 255, g: 0, b: 255 },
      block: { x: 5, y: 6, w: 7, h: 8 },
    })
    applyAlphaKey(image, { name: 'magenta', r: 255, g: 0, b: 255 })
    expect(trimBox(image)).toEqual({ x: 5, y: 6, w: 7, h: 8 })
    const empty = synthImage({ width: 4, height: 4, bg: { r: 255, g: 0, b: 255 }, block: { x: 0, y: 0, w: 0, h: 0 } })
    applyAlphaKey(empty, { name: 'magenta', r: 255, g: 0, b: 255 })
    expect(trimBox(empty)).toBeNull()
  })

  it('composes into a fixed frame box: feet on the bottom, never upscaled', () => {
    const image = synthImage({
      width: 100,
      height: 50,
      bg: { r: 255, g: 0, b: 255 },
      block: { x: 20, y: 5, w: 60, h: 40 },
    })
    applyAlphaKey(image, { name: 'magenta', r: 255, g: 0, b: 255 })
    const box = trimBox(image)
    if (!box) throw new Error('empty')
    const out = composeIntoBox(image, box, 72, 92)
    expect(out.width).toBe(72)
    expect(out.height).toBe(92)
    // scale = min(72/60, 92/40, 1) = 1.2 -> capped at 1 (no upscale): 60x40
    // dx = (72-60)/2 = 6, dy = 92-40 = 52
    const px = (x: number, y: number) => out.data[(y * 72 + x) * 4 + 3]
    expect(px(6, 52)).toBe(255) // top-left of the block
    expect(px(5, 52)).toBe(0) // just outside
    expect(px(35, 91)).toBe(255) // bottom-center of the block
    expect(px(35, 92 - 1)).toBe(255)
  })

  it('manifest is per-kind atomic: incomplete kinds are dropped', () => {
    const names = [
      'zhaoyun-idle',
      'zhaoyun-walk0',
      'zhaoyun-walk1',
      'zhaoyun-attack',
      'zhaoyun-jump',
      'zhaoyun-down',
      'soldier-idle', // incomplete: no manifest entry
      'crate-idle',
      'zhaoyun-portrait',
    ]
    const manifest = buildManifest(names)
    expect(Object.keys(manifest.sprites)).toEqual(['zhaoyun', 'crate'])
    expect(manifest.sprites.zhaoyun).toHaveLength(6)
    expect(manifest.portraits).toEqual(['zhaoyun'])
  })
})
