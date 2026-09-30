import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import type { PoseName } from '../../src/game/art/poses'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import { hasWholeFrame, type WholeFrameArt } from '../../src/game/art/whole-frames'
import { COVERAGE_FLOOR } from '../../scripts/prepare-whole-frames.mjs'

/**
 * Whole-frame pilot gates (docs/WHOLE_FRAME_TEST.md). The committed sheet is
 * what prepare-whole-frames.mjs recorded, every cell is exactly its pose's
 * art box at density, the box pad is clear, no key colour survived, and the
 * recorded fit meets the pilot's pose criteria. The renderer path: with
 * frames the box is the painted cell; without frames nothing changes.
 */
type Fit = { coverage: number; feetOffGroundU: number | null; weaponTipErrU: number; borderOpaquePx: number; magentaPx: number }
interface Entry {
  revision: string
  density: number
  sheet: { width: number; height: number }
  frames: Record<string, { x: number; y: number; w: number; h: number }>
  signatures: { sheet: string }
  sha256: { sheet: string }
  fit: Record<string, Fit>
}
const prepared = JSON.parse(readFileSync('src/game/assets/whole-frames/prepared.json', 'utf8')) as Record<string, Entry>
const SHEET = 'src/game/assets/whole-frames/guanyu-sheet.png'
const POSES: PoseName[] = ['idle', 'attack', 'down']

describe('whole-frame pilot: Guan Yu sheet', () => {
  const g = prepared.guanyu!

  it('sheet bytes and content match the preparation record', async () => {
    const buf = readFileSync(SHEET)
    expect(createHash('sha256').update(buf).digest('hex')).toBe(g.sha256.sheet)
    const img = await loadImage(buf)
    expect([img.width, img.height]).toEqual([g.sheet.width, g.sheet.height])
    const cv = createCanvas(img.width, img.height)
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0)
    expect(signatureMatches(imageSignature(ctx.getImageData(0, 0, img.width, img.height)), g.signatures.sheet)).toBe(true)
  })

  it('each cell is exactly its art box at density, pad clear, no key colour', async () => {
    const img = await loadImage(readFileSync(SHEET))
    for (const pose of POSES) {
      const c = g.frames[pose]!
      const box = artBoxFor('guanyu', pose)!
      expect([c.w, c.h], pose).toEqual([Math.round(box.width * g.density), Math.round(box.height * g.density)])
      const cv = createCanvas(c.w, c.h)
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
      const d = ctx.getImageData(0, 0, c.w, c.h).data
      let edge = 0
      let magenta = 0
      for (let y = 0; y < c.h; y++) {
        for (let x = 0; x < c.w; x++) {
          const i = (y * c.w + x) * 4
          const a = d[i + 3]!
          if ((x === 0 || y === 0 || x === c.w - 1) && a >= 32) edge++
          if (a >= 128 && d[i]! > 200 && d[i + 1]! < 80 && d[i + 2]! > 200) magenta++
        }
      }
      expect(edge, `${pose} opaque px on the box edge`).toBe(0)
      expect(magenta, `${pose} magenta px`).toBe(0)
    }
  })

  it('recorded fit meets the pilot pose criteria', () => {
    for (const pose of POSES) {
      const f = g.fit[pose]!
      expect(f.coverage, `${pose} guide coverage`).toBeGreaterThanOrEqual(COVERAGE_FLOOR[pose as 'idle' | 'attack' | 'down'] - 0.02)
      expect(f.weaponTipErrU, `${pose} blade point vs guide`).toBeLessThanOrEqual(6)
      if (f.feetOffGroundU !== null) expect(Math.abs(f.feetOffGroundU), `${pose} feet vs ground`).toBeLessThanOrEqual(1.5)
      expect(f.borderOpaquePx + f.magentaPx, pose).toBe(0)
    }
  })

  it('the renderer blits the painted cell with frames and is unchanged without them', async () => {
    const img = await loadImage(readFileSync(SHEET))
    const art: WholeFrameArt = { id: 'guanyu', revision: g.revision, sheet: img as unknown as CanvasImageSource, density: g.density, frames: g.frames }
    const box = artBoxFor('guanyu', 'idle')!
    const render = (res?: { heroes: Record<string, never>; frames?: Record<string, WholeFrameArt> }): Uint8ClampedArray => {
      const cv = createCanvas(box.width * 2, box.height * 2)
      drawKindPose(cv.getContext('2d') as unknown as CanvasRenderingContext2D, 'guanyu', 'idle', 2, res)
      return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
    }
    const plain = render()
    const same = render({ heroes: {} })
    expect(Buffer.from(same).equals(Buffer.from(plain))).toBe(true)
    const painted = render({ heroes: {}, frames: { guanyu: art } })
    expect(Buffer.from(painted).equals(Buffer.from(plain))).toBe(false)
    // A pose without a frame falls through to the existing art.
    const walkBox = artBoxFor('guanyu', 'walk0')!
    const w = (res?: { heroes: Record<string, never>; frames?: Record<string, WholeFrameArt> }): Uint8ClampedArray => {
      const cv = createCanvas(walkBox.width * 2, walkBox.height * 2)
      drawKindPose(cv.getContext('2d') as unknown as CanvasRenderingContext2D, 'guanyu', 'walk0', 2, res)
      return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
    }
    expect(Buffer.from(w({ heroes: {}, frames: { guanyu: art } })).equals(Buffer.from(w({ heroes: {} })))).toBe(true)
    expect(hasWholeFrame(art, 'walk0', 'idle')).toBe(true)
    expect(hasWholeFrame(art, 'walk0', 'walk1')).toBe(false)
  })
})
