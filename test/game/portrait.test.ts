import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawKindPortrait, PORTRAIT_BOX, PORTRAIT_SCALE, PORTRAIT_TEXTURE } from '../../src/game/art/painted-portraits'
import type { PortraitResources } from '../../src/game/art/hero-resources'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import hero from '../../src/game/assets/hero-faces/prepared.json'
import boss from '../../src/game/assets/boss-faces/prepared.json'
import mook from '../../src/game/assets/mook-faces/prepared.json'

// RETIRED: the former 11 procedural face-geometry/detail-pass tests were tied
// exclusively to deleted portrait.ts. These are new painted-only regressions,
// not those retired gates becoming green. Rig/pose/head suites remain intact.
const entries = [
  ...Object.entries(hero).map(([id, meta]) => ({ id, meta, dir: 'hero-faces' })),
  ...Object.entries(boss).map(([id, meta]) => ({ id, meta, dir: 'boss-faces' })),
  ...Object.entries(mook).map(([id, meta]) => ({ id, meta, dir: 'mook-faces' })),
]

describe('shared painted-only portraits', () => {
  it('has exactly all 11 distinct humanoid identities and unchanged texture bounds', () => {
    expect(entries.map(e => e.id).sort()).toEqual(['archer', 'guanyu', 'huangzhong', 'lidian', 'soldier', 'spearman', 'weiyan', 'xiahoudun', 'xuchu', 'zhangfei', 'zhaoyun'])
    expect(new Set(entries.map(e => e.meta.sha256.portrait)).size).toBe(11)
    expect(PORTRAIT_BOX).toEqual({ width: 36, height: 40 })
    expect(PORTRAIT_TEXTURE).toEqual({ width: 216, height: 240 })
  })

  it.each(entries)('$id preserves shipping bytes, decoded identity and exact in-bounds portrait blit', async ({ id, meta, dir }) => {
    const path = `src/game/assets/${dir}/${id}-portrait.png`
    expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(meta.sha256.portrait)
    const image = await loadImage(path)
    expect([image.width, image.height]).toEqual([432, 480])
    const expected = createCanvas(432, 480)
    expected.getContext('2d').drawImage(image, 0, 0)
    const data = expected.getContext('2d').getImageData(0, 0, 432, 480)
    expect(signatureMatches(imageSignature(data), meta.signatures.portrait)).toBe(true)
    const resources: PortraitResources = { portraits: { [id]: { id, revision: meta.revision, portrait: image as unknown as CanvasImageSource } } }
    const actual = createCanvas(436, 484)
    const ctx = actual.getContext('2d')
    ctx.translate(2, 2)
    expect(drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, id, PORTRAIT_SCALE * 2, resources)).toBe(true)
    expect(Buffer.from(ctx.getImageData(2, 2, 432, 480).data).equals(Buffer.from(data.data))).toBe(true)
    const padded = ctx.getImageData(0, 0, 436, 484)
    for (let y = 0; y < 484; y++) for (let x = 0; x < 436; x++) {
      if (x >= 2 && x < 434 && y >= 2 && y < 482) continue
      expect(padded.data[(y * 436 + x) * 4 + 3]).toBe(0)
    }
  })

  it('never substitutes procedural art for missing portraits or reads legacy layers', () => {
    const cv = createCanvas(432, 480)
    const ctx = cv.getContext('2d') as unknown as CanvasRenderingContext2D
    expect(drawKindPortrait(ctx, 'guanyu', 12)).toBe(false)
    expect(drawKindPortrait(ctx, 'guanyu', 12, { portraits: {} })).toBe(false)
    expect(cv.getContext('2d').getImageData(0, 0, 432, 480).data.every(v => v === 0)).toBe(true)
  })
})
