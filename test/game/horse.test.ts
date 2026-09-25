import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import {
  HORSE_FRAMES,
  horseFrameFor,
  type HorseArt,
  type HorseFrameName,
} from '../../src/game/art/horse-frames'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import { publishHorseArtRecords } from '../../src/game/adapters/horse-art'
import { generateFixture } from '../../scripts/make-horse-fixture.mjs'
import fixturePrepared from '../../src/game/assets/horse-fixtures/prepared.json'
import horsePrepared from '../../src/game/assets/horse/prepared.json'

type Ctx = CanvasRenderingContext2D
const SCALE = 2

const FRAME_COLORS: Record<HorseFrameName, [number, number, number]> = {
  idle: [0xc0, 0x30, 0x30],
  walk0: [0x30, 0xc0, 0x30],
  walk1: [0x30, 0x60, 0xc0],
}

type FixtureMeta = {
  revision: string
  density: number
  sheet: { width: number; height: number }
  frames: Record<HorseFrameName, { x: number; y: number; w: number; h: number }>
  signatures: { sheet: string }
  sha256: { sheet: string }
}

function preparedFixture(): FixtureMeta {
  const meta = (fixturePrepared as unknown as Record<string, FixtureMeta>).fixture
  if (!meta) throw new Error('no fixture prepared entry')
  return meta
}

async function fixtureArt(): Promise<HorseArt> {
  const meta = preparedFixture()
  const sheet = (await loadImage(
    'src/game/assets/horse-fixtures/horse-sheet.png',
  )) as unknown as CanvasImageSource
  return { id: 'fixture', revision: meta.revision, sheet, density: meta.density, frames: meta.frames }
}

function countColor(pixels: Uint8ClampedArray, rgb: [number, number, number]): number {
  let n = 0
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] === rgb[0] && pixels[i + 1] === rgb[1] && pixels[i + 2] === rgb[2]) n += 1
  }
  return n
}

describe('BODY-5 frame table', () => {
  it('lists three frames and aliases everything else to idle', () => {
    expect(HORSE_FRAMES).toEqual(['idle', 'walk0', 'walk1'])
    expect(horseFrameFor('walk0')).toBe('walk0')
    expect(horseFrameFor('walk1')).toBe('walk1')
    for (const pose of ['idle', 'attack', 'attack2', 'jump', 'hurt', 'down', 'special', 'windup', 'recover', 'thrust', 'chop', 'sweep']) {
      expect(horseFrameFor(pose), pose).toBe('idle')
    }
  })
})

describe('BODY-5 fixture preparation', () => {
  it('regenerates a byte-identical fixture (deterministic)', async () => {
    const { png, prepared } = generateFixture()
    expect(Buffer.from(png).equals(readFileSync('src/game/assets/horse-fixtures/horse-sheet.png'))).toBe(true)
    expect(prepared).toEqual(JSON.parse(readFileSync('src/game/assets/horse-fixtures/prepared.json', 'utf8')))
  })

  it('matches committed sha256 and content signatures', async () => {
    const data = readFileSync('src/game/assets/horse-fixtures/horse-sheet.png')
    const meta = preparedFixture()
    expect(createHash('sha256').update(data).digest('hex')).toBe(meta.sha256.sheet)
    const img = await loadImage('src/game/assets/horse-fixtures/horse-sheet.png')
    const cv = createCanvas(img.width, img.height)
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const sig = imageSignature(ctx.getImageData(0, 0, img.width, img.height))
    expect(signatureMatches(sig, meta.signatures.sheet)).toBe(true)
  })
})

describe('BODY-5 frame rendering', () => {
  function render(pose: string, horse?: HorseArt): Uint8ClampedArray {
    const box = artBoxFor('horse', pose as 'idle')
    if (!box) throw new Error(`no box for horse:${pose}`)
    const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
    const ctx = canvas.getContext('2d')
    drawKindPose(ctx as unknown as Ctx, 'horse', pose as 'idle', SCALE, { heroes: {}, horse })
    return ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
  }

  it('selects the right frame per pose, including aliases', async () => {
    const art = await fixtureArt()
    expect(countColor(render('walk0', art), FRAME_COLORS.walk0)).toBeGreaterThan(100)
    expect(countColor(render('walk1', art), FRAME_COLORS.walk1)).toBeGreaterThan(100)
    expect(countColor(render('idle', art), FRAME_COLORS.idle)).toBeGreaterThan(100)
    // Aliases land on the idle cell.
    expect(countColor(render('attack', art), FRAME_COLORS.idle)).toBeGreaterThan(100)
    expect(countColor(render('down', art), FRAME_COLORS.idle)).toBeGreaterThan(100)
  })

  it('falls back to byte-identical procedural art without horse resources', () => {
    const box = artBoxFor('horse', 'walk0')
    if (!box) throw new Error('no box')
    const plain = (() => {
      const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(ctx as unknown as Ctx, 'horse', 'walk0', SCALE)
      return ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
    })()
    const empty = (() => {
      const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
      const ctx = canvas.getContext('2d')
      drawKindPose(ctx as unknown as Ctx, 'horse', 'walk0', SCALE, { heroes: {} })
      return ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data
    })()
    expect(Buffer.from(empty).equals(Buffer.from(plain))).toBe(true)
  })

  it('rejects missing, undersized and tampered sheets, preserving heads and bodies', async () => {
    const meta = preparedFixture()
    const napiFactory = (w: number, h: number): Ctx | null => {
      const canvas = createCanvas(w, h)
      return canvas.getContext('2d') as unknown as Ctx
    }
    // Missing texture.
    const missing = {
      textures: { exists: (): boolean => false, get: (): never => { throw new Error('unused') } },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(
      publishHorseArtRecords(missing as never, { fixture: { sheet: 'x' } }, { fixture: meta }, napiFactory),
    ).toBeUndefined()
    // Wrong dimensions.
    const small = createCanvas(8, 8)
    const wrong = {
      textures: { exists: (): boolean => true, get: () => ({ getSourceImage: () => small as unknown }) },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(
      publishHorseArtRecords(wrong as never, { fixture: { sheet: 'x' } }, { fixture: meta }, napiFactory),
    ).toBeUndefined()
    // Right size, wrong content.
    const tampered = createCanvas(meta.sheet.width, meta.sheet.height)
    const tctx = tampered.getContext('2d')
    tctx.fillStyle = '#123456'
    tctx.fillRect(0, 0, meta.sheet.width, meta.sheet.height)
    const bad = {
      textures: { exists: (): boolean => true, get: () => ({ getSourceImage: () => tampered as unknown }) },
      registry: { get: (): unknown => undefined, set: (): void => {} },
    }
    expect(
      publishHorseArtRecords(bad as never, { fixture: { sheet: 'x' } }, { fixture: meta }, napiFactory),
    ).toBeUndefined()
    // Valid sheet publishes and preserves already-published packs.
    const img = await loadImage('src/game/assets/horse-fixtures/horse-sheet.png')
    const cv = createCanvas(img.width, img.height)
    cv.getContext('2d').drawImage(img, 0, 0)
    const registry = new Map<string, unknown>()
    registry.set('paintedHeroArt', { heroes: { zhaoyun: { id: 'zhaoyun' } }, bodies: { zhaoyun: { id: 'zhaoyun' } } })
    const scene = {
      textures: {
        exists: (k: string): boolean => k === 'horse-source:fixture',
        get: () => ({ getSourceImage: () => cv as unknown }),
      },
      registry: {
        get: (k: string): unknown => registry.get(k),
        set: (k: string, v: unknown): void => {
          registry.set(k, v)
        },
      },
    }
    const out = publishHorseArtRecords(
      scene as never,
      { fixture: { sheet: 'horse-sheet.png' } },
      { fixture: meta },
      napiFactory,
    )
    expect(out?.id).toBe('fixture')
    const stored = registry.get('paintedHeroArt') as { heroes: object; bodies: object; horse: object }
    expect(Object.keys(stored.heroes)).toEqual(['zhaoyun'])
    expect(Object.keys(stored.bodies)).toEqual(['zhaoyun'])
    expect(stored.horse).toBeDefined()
  })

  it('production horse pack is still pending (BODY-5 art not yet generated)', () => {
    // The image provider is down as of this writing; the pipeline above is
    // fully verified on fixtures. Wiring the real sheet flips this pin and
    // the parity/saddle tests below go live with it.
    expect(Object.keys(horsePrepared).length).toBe(0)
  })

  it('holds parity, liveness and saddle seat on the production horse', async () => {
    // Vacuous until the real sheet lands; then every frame is gated.
    const { PARITY_FLOOR } = await import('../../src/game/art/body-parts')
    const { maskIou } = await import('../../src/game/art/body-parts')
    for (const id of Object.keys(horsePrepared)) {
      const meta = (horsePrepared as Record<string, FixtureMeta>)[id]
      if (!meta) continue
      const sheet = (await loadImage('src/game/assets/horse/horse-sheet.png')) as unknown as CanvasImageSource
      const art: HorseArt = {
        id, revision: meta.revision, sheet, density: meta.density, frames: meta.frames,
      }
      for (const frame of ['idle', 'walk0', 'walk1'] as const) {
        const box = artBoxFor('horse', frame)
        if (!box) throw new Error(`no box for horse:${frame}`)
        const render = (horse?: HorseArt): { width: number; height: number; data: Uint8Array } => {
          const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
          const ctx = canvas.getContext('2d')
          drawKindPose(ctx as unknown as Ctx, 'horse', frame, SCALE, { heroes: {}, horse })
          return {
            width: box.width * SCALE,
            height: box.height * SCALE,
            data: new Uint8Array(ctx.getImageData(0, 0, box.width * SCALE, box.height * SCALE).data),
          }
        }
        const paper = render(art)
        const iou = maskIou(render(), paper)
        expect(iou, `horse:${frame} parity ${iou.toFixed(3)}`).toBeGreaterThanOrEqual(PARITY_FLOOR)
        expect(iou, `horse:${frame} looks fallen back`).toBeLessThan(0.99)
        // Saddle seat: gold tack pixels must sit in the procedural saddle
        // zone (x38-62, y21-31), or riders float.
        const W = box.width * SCALE
        let tack = 0
        for (let y = 0; y < paper.height; y += 1) {
          for (let x = 0; x < paper.width; x += 1) {
            const p = (y * W + x) * 4
            // Saddle zone in device px: box has HEADROOM 8 above the 76-tall art.
            const lx = x / SCALE
            const ly = y / SCALE - 8
            if (lx < 38 || lx > 62 || ly < 21 || ly > 31) continue
            const r = paper.data[p] ?? 0
            const g = paper.data[p + 1] ?? 0
            const b = paper.data[p + 2] ?? 0
            if (r > 140 && g > 100 && b < 110 && r > b + 40) tack += 1
          }
        }
        expect(tack, `horse:${frame} saddle tack missing`).toBeGreaterThan(20)
      }
    }
  })
})
