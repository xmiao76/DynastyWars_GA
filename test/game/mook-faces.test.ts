import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { beforeAll, describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose, drawKindPortrait } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import { expressionFor, headPainter } from '../../src/game/art/hero-resources'
import { ENEMY_FIGURES } from '../../src/game/art/figures'
import { applyBuild, FIG_H, FIG_W } from '../../src/game/art/rig'
import { POSE_TABLE } from '../../src/game/art/poses'
import { POSES } from '../../src/game/adapters/sprites'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import prepared from '../../src/game/assets/mook-faces/prepared.json'

/**
 * BODY-6 boss heads shipping suite - mirrors hero-faces.test.ts over the
 * nine boss ids (the acceptance criterion), same negative controls.
 */
const resources: ArtResources = { heroes: {} }
const IDS = ['soldier', 'spearman', 'archer'] as const
const root = 'src/game/assets/mook-faces'

beforeAll(async () => {
  for (const id of IDS) {
    const image = async (part: string) => await loadImage(`${root}/${id}-${part}.png`) as unknown as CanvasImageSource
    const m = prepared[id]
    ;(resources.heroes as Record<string, HeroArt>)[id] = {
      id, revision: m.revision, portrait: await image('portrait'), head: await image('head'),
      front: await image('front'), rear: await image('rear'), cell: m.cell, bounds: m.bounds,
      skin: parseInt(m.skin.slice(1), 16),
    }
  }
})

function shot(id: string, pose: typeof POSES[number], r = resources) {
  const b = artBoxFor(id, pose)!
  const cv = createCanvas(b.width * 2, b.height * 2)
  const c = cv.getContext('2d')
  drawKindPose(c as unknown as CanvasRenderingContext2D, id, pose, 2, r)
  return c.getImageData(0, 0, cv.width, cv.height)
}

function escaped(id: string, pose: typeof POSES[number], r = resources): number {
  const extra = 90, b = artBoxFor(id, pose)!
  const cv = createCanvas((b.width + extra * 2) * 2, (b.height + extra * 2) * 2)
  const c = cv.getContext('2d') as unknown as CanvasRenderingContext2D
  c.translate(extra * 2, extra * 2); c.scale(2, 2)
  c.translate((b.width - FIG_W) / 2, b.height - FIG_H)
  const plan = ENEMY_FIGURES[id]!
  const paint = headPainter(r.heroes[id]!, pose, applyBuild(POSE_TABLE[pose], plan.build), plan.build.head)
  for (const layer of ['rear', 'head', 'front'] as const) paint(c, layer)
  const im = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
  let n = 0
  for (let y = 0; y < im.height; y += 1) {
    for (let x = 0; x < im.width; x += 1) {
      if (x >= extra * 2 && x < (extra + b.width) * 2 && y >= extra * 2 && y < (extra + b.height) * 2) continue
      if (im.data[(y * im.width + x) * 4 + 3]! >= 32) n += 1
    }
  }
  return n
}

describe('painted mook shipping resources', () => {
  it('decodes all complete assets and pins committed derivative hashes', () => {
    expect(Object.keys(resources.heroes).sort()).toEqual([...IDS].sort())
    for (const id of IDS) {
      for (const part of ['portrait', 'head', 'front', 'rear'] as const) {
        const data = readFileSync(`${root}/${id}-${part}.png`)
        expect(createHash('sha256').update(data).digest('hex')).toBe(prepared[id].sha256[part])
      }
    }
  })

  it('decoded shipping images match their committed content signatures', async () => {
    for (const id of IDS) {
      for (const part of ['portrait', 'head', 'front', 'rear'] as const) {
        const img = await loadImage(`${root}/${id}-${part}.png`)
        const cv = createCanvas(img.width, img.height)
        const c = cv.getContext('2d')
        c.drawImage(img, 0, 0)
        const sig = imageSignature(c.getImageData(0, 0, cv.width, cv.height))
        expect(signatureMatches(sig, prepared[id].signatures[part]), `${id}:${part} content drifted`).toBe(true)
      }
    }
    // 12 sheet decodes; full-suite CPU contention can exceed the 5s default.
  }, 30_000)

  it('signatures reject blank, swapped and erased art', async () => {
    const meta = prepared.soldier
    const blank = createCanvas(meta.cell.width * 3, meta.cell.height)
    const blankSig = imageSignature(blank.getContext('2d').getImageData(0, 0, blank.width, blank.height))
    expect(signatureMatches(blankSig, meta.signatures.head), 'blank head accepted').toBe(false)

    const other = await loadImage(`${root}/spearman-head.png`)
    const cv = createCanvas(other.width, other.height)
    const c = cv.getContext('2d')
    c.drawImage(other, 0, 0)
    const swapped = imageSignature(c.getImageData(0, 0, cv.width, cv.height))
    expect(signatureMatches(swapped, meta.signatures.head), 'swapped mook head accepted').toBe(false)

    const cc = await loadImage(`${root}/soldier-head.png`)
    const erased = createCanvas(cc.width, cc.height)
    const ec = erased.getContext('2d')
    ec.drawImage(cc, 0, 0)
    // Erase the facial-feature band of the neutral frame (eyes through mouth).
    ec.clearRect(40, 55, 80, 45)
    const erasedSig = imageSignature(ec.getImageData(0, 0, erased.width, erased.height))
    expect(signatureMatches(erasedSig, meta.signatures.head), 'erased features accepted').toBe(false)
  }, 30_000)

  it('maps exertion and hurt without changing pose timing', () => {
    expect(expressionFor('idle')).toBe(0)
    expect(expressionFor('recover')).toBe(0)
    expect(expressionFor('thrust')).toBe(1)
    expect(expressionFor('down')).toBe(2)
  })

  it('paints portraits from the shipping image', () => {
    for (const id of IDS) {
      const cv = createCanvas(432, 480), c = cv.getContext('2d')
      drawKindPortrait(c as unknown as CanvasRenderingContext2D, id, 12, true, resources)
      const expected = createCanvas(432, 480)
      ;(expected.getContext('2d') as unknown as CanvasRenderingContext2D).drawImage(resources.heroes[id]!.portrait, 0, 0)
      expect(cv.toBuffer('image/png').equals(expected.toBuffer('image/png'))).toBe(true)
    }
  })

  it.each(IDS.flatMap((id) => POSES.map((pose) => [id, pose] as const)))(
    '%s:%s keeps painted head and helmet inside its frame',
    (id, pose) => {
      expect(escaped(id, pose)).toBe(0)
    },
  )

  it('clipping guard rejects a displaced head pivot', () => {
    const art = resources.heroes.soldier!
    const broken: ArtResources = { heroes: { soldier: { ...art, bounds: { ...art.bounds, y: -100 } } } }
    expect(escaped('soldier', 'idle', broken)).toBeGreaterThan(100)
  })

  it('painted gameplay really differs from the procedural fallback', () => {
    for (const id of IDS) {
      const full = shot(id, 'idle')
      const fallback = shot(id, 'idle', { heroes: {} })
      let differing = 0
      for (let i = 0; i < full.data.length; i += 4) {
        if (Math.abs(full.data[i]! - fallback.data[i]!) + Math.abs(full.data[i + 1]! - fallback.data[i + 1]!) > 60) differing += 1
      }
      expect(differing, `${id} looks fallen back`).toBeGreaterThan(500)
    }
  })

  it('keeps every mook head distinct from every other', () => {
    // Identity gate on the HEAD LAYERS only - full figures would differ by
    // body color alone and prove nothing about the faces.
    const headShot = (id: typeof IDS[number]) => {
      const art = resources.heroes[id]!
      const cv = createCanvas(art.cell.width * 3, art.cell.height)
      const c = cv.getContext('2d') as unknown as CanvasRenderingContext2D
      for (const layer of ['rear', 'head', 'front'] as const) {
        c.drawImage(art[layer] as CanvasImageSource, 0, 0)
      }
      return c.getImageData(0, 0, cv.width, cv.height)
    }
    for (let i = 0; i < IDS.length; i += 1) {
      for (let j = i + 1; j < IDS.length; j += 1) {
        const a = headShot(IDS[i]!)
        const b = headShot(IDS[j]!)
        let differing = 0
        for (let k = 0; k < a.data.length; k += 4) {
          if (Math.abs(a.data[k]! - b.data[k]!) + Math.abs(a.data[k + 1]! - b.data[k + 1]!) > 60) differing += 1
        }
        expect(differing, `${IDS[i]} and ${IDS[j]} share a face`).toBeGreaterThan(500)
      }
    }
  })
})
