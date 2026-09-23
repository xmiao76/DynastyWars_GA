import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { beforeAll, describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose, drawKindPortrait } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import { expressionFor, headPainter } from '../../src/game/art/hero-resources'
import { HERO_FIGURES } from '../../src/game/art/figures'
import { applyBuild, FIG_H, FIG_W } from '../../src/game/art/rig'
import { POSE_TABLE } from '../../src/game/art/poses'
import { POSES } from '../../src/game/adapters/sprites'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import prepared from '../../src/game/assets/hero-faces/prepared.json'

const resources: ArtResources = { heroes: {} }
const IDS = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan'] as const
const root = 'src/game/assets/hero-faces'
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

function shot(id: string, pose: typeof POSES[number], r = resources, extra = 0) {
  const b = artBoxFor(id, pose)!
  const cv = createCanvas((b.width + extra * 2) * 2, (b.height + extra * 2) * 2)
  const c = cv.getContext('2d')
  c.translate(extra * 2, extra * 2)
  drawKindPose(c as unknown as CanvasRenderingContext2D, id, pose, 2, r)
  return c.getImageData(0, 0, cv.width, cv.height)
}

function escaped(id: string, pose: typeof POSES[number], r = resources): number {
  const extra = 90, b = artBoxFor(id, pose)!
  const cv = createCanvas((b.width + extra * 2) * 2, (b.height + extra * 2) * 2)
  const c = cv.getContext('2d') as unknown as CanvasRenderingContext2D
  c.translate(extra * 2, extra * 2); c.scale(2, 2)
  c.translate((b.width - FIG_W) / 2, b.height - FIG_H)
  const plan = HERO_FIGURES[id]!
  const paint = headPainter(r.heroes[id]!, pose, applyBuild(POSE_TABLE[pose], plan.build), plan.build.head)
  for (const layer of ['rear', 'head', 'front'] as const) paint(c, layer)
  // Feet intentionally meet/cross the ground boundary in the original rig;
  // this guard isolates the NEW head layers, including the full beard.
  const im = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
  let n = 0
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    if (x >= extra * 2 && x < (extra + b.width) * 2 && y >= extra * 2 && y < (extra + b.height) * 2) continue
    if (im.data[(y * im.width + x) * 4 + 3]! >= 32) n++
  }
  return n
}

describe('painted hero pilot shipping resources', () => {
  it('decodes all complete assets and pins committed derivative hashes', () => {
    expect(Object.keys(resources.heroes).sort()).toEqual([...IDS].sort())
    for (const id of IDS) for (const part of ['portrait', 'head', 'front', 'rear'] as const) {
      const data = readFileSync(`${root}/${id}-${part}.png`)
      expect(createHash('sha256').update(data).digest('hex')).toBe(prepared[id].sha256[part])
    }
  })

  it('decoded shipping images match their committed content signatures', async () => {
    for (const id of IDS) for (const part of ['portrait', 'head', 'front', 'rear'] as const) {
      const img = await loadImage(`${root}/${id}-${part}.png`)
      const cv = createCanvas(img.width, img.height)
      const c = cv.getContext('2d')
      c.drawImage(img, 0, 0)
      const sig = imageSignature(c.getImageData(0, 0, cv.width, cv.height))
      expect(signatureMatches(sig, prepared[id].signatures[part]), `${id}:${part} content drifted`).toBe(true)
    }
  })

  it('signatures reject blank, swapped and erased art', async () => {
    const meta = prepared.guanyu
    const blank = createCanvas(meta.cell.width * 3, meta.cell.height)
    const blankSig = imageSignature(blank.getContext('2d').getImageData(0, 0, blank.width, blank.height))
    expect(signatureMatches(blankSig, meta.signatures.head), 'blank head accepted').toBe(false)

    const zy = await loadImage(`${root}/zhaoyun-head.png`)
    const cv = createCanvas(zy.width, zy.height)
    const c = cv.getContext('2d')
    c.drawImage(zy, 0, 0)
    const swapped = imageSignature(c.getImageData(0, 0, cv.width, cv.height))
    expect(signatureMatches(swapped, meta.signatures.head), 'swapped hero head accepted').toBe(false)

    const gy = await loadImage(`${root}/guanyu-head.png`)
    const erased = createCanvas(gy.width, gy.height)
    const ec = erased.getContext('2d')
    ec.drawImage(gy, 0, 0)
    // Erase the facial-feature band of the neutral frame (eyes through mouth).
    ec.clearRect(40, 55, 80, 45)
    const erasedSig = imageSignature(ec.getImageData(0, 0, erased.width, erased.height))
    expect(signatureMatches(erasedSig, meta.signatures.head), 'erased features accepted').toBe(false)
  })

  it('maps exertion and hurt without changing pose timing', () => {
    expect(expressionFor('idle')).toBe(0)
    expect(expressionFor('recover')).toBe(0)
    expect(expressionFor('thrust')).toBe(1)
    expect(expressionFor('down')).toBe(2)
  })

  it('paints portraits from the shipping image, not the old parameter table', () => {
    for (const id of IDS) {
      const cv = createCanvas(432, 480), c = cv.getContext('2d')
      drawKindPortrait(c as unknown as CanvasRenderingContext2D, id, 12, true, resources)
      const expected = createCanvas(432, 480)
      ;(expected.getContext('2d') as unknown as CanvasRenderingContext2D).drawImage(resources.heroes[id]!.portrait, 0, 0)
      expect(cv.toBuffer('image/png').equals(expected.toBuffer('image/png'))).toBe(true)
    }
  })

  it.each(IDS.flatMap(id => POSES.map(pose => [id, pose] as const)))(
    '%s:%s keeps painted head, cloth and beard inside its frame', (id, pose) => {
      expect(escaped(id, pose)).toBe(0)
    })

  it('clipping guard rejects a displaced head pivot', () => {
    const art = resources.heroes.guanyu!
    const broken: ArtResources = { heroes: { guanyu: { ...art, bounds: { ...art.bounds, y: -100 } } } }
    expect(escaped('guanyu', 'idle', broken)).toBeGreaterThan(100)
  })

  it('painted gameplay really differs from the complete fallback', () => {
    for (const id of IDS) {
      const full = shot(id, 'idle'), fallback = shot(id, 'idle', { heroes: {} })
      let differing = 0
      for (let i = 0; i < full.data.length; i += 4) {
        if (Math.abs(full.data[i]! - fallback.data[i]!) + Math.abs(full.data[i + 1]! - fallback.data[i + 1]!) > 60) differing++
      }
      expect(differing).toBeGreaterThan(500)
    }
  })
})
