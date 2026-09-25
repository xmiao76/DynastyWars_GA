import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { HorseArt } from '../../src/game/art/horse-frames'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'

/**
 * BODY-7 whole-cast review sheet: every fighter (5 heroes + 3 mooks + 9
 * bosses + the horse), all 14 poses, both facings (left = texture mirror,
 * the same construction the sprite adapter uses). Writes
 * artifacts/look/body7-cast.png. Assertions: each cell has ink.
 */
const FIGHTERS = [
  'guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan',
  'soldier', 'spearman', 'archer', 'horse',
  'lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian',
] as const
const POSES = Object.keys(POSE_TABLE) as PoseName[]
const SCALE = 1.5

async function loadResources(): Promise<ArtResources> {
  const resources: ArtResources = { heroes: {}, bodies: {} }
  for (const [id, dir] of [
    ['guanyu', 'hero-faces'], ['zhangfei', 'hero-faces'], ['zhaoyun', 'hero-faces'],
    ['huangzhong', 'hero-faces'], ['weiyan', 'hero-faces'],
    ['lubu', 'boss-faces'], ['caocao', 'boss-faces'], ['xiahoudun', 'boss-faces'], ['xuchu', 'boss-faces'],
    ['zhangliao', 'boss-faces'], ['caoren', 'boss-faces'], ['xuhuang', 'boss-faces'],
    ['zhanghe', 'boss-faces'], ['lidian', 'boss-faces'],
  ] as const) {
    const image = async (part: string) => await loadImage(`src/game/assets/${dir}/${id}-${part}.png`) as unknown as CanvasImageSource
    const m = (await import(`../../src/game/assets/${dir}/prepared.json`)).default as Record<string, {
      revision: string; skin: string; cell: { width: number; height: number }
      bounds: { x: number; y: number; width: number; height: number }
    }>
    const meta = m[id]
    if (!meta) continue
    ;(resources.heroes as Record<string, HeroArt>)[id] = {
      id, revision: meta.revision, portrait: await image('portrait'), head: await image('head'),
      front: await image('front'), rear: await image('rear'), cell: meta.cell, bounds: meta.bounds,
      skin: parseInt(meta.skin.slice(1), 16),
    }
  }
  for (const [id, dir] of [
    ['guanyu', 'hero-bodies'], ['zhangfei', 'hero-bodies'], ['zhaoyun', 'hero-bodies'],
    ['huangzhong', 'hero-bodies'], ['weiyan', 'hero-bodies'],
    ['soldier', 'mook-bodies'], ['spearman', 'mook-bodies'], ['archer', 'mook-bodies'],
  ] as const) {
    const m = (await import(`../../src/game/assets/${dir}/prepared.json`)).default as Record<string, {
      revision: string; skin: string; density: number; parts: BodyArt['parts']
    }>
    const meta = m[id]
    if (!meta) continue
    const sheet = (await loadImage(`src/game/assets/${dir}/${id}-sheet.png`)) as unknown as CanvasImageSource
    ;(resources.bodies as Record<string, BodyArt>)[id] = {
      id, revision: meta.revision, sheet, density: meta.density, parts: meta.parts,
      skin: parseInt(meta.skin.slice(1), 16),
    }
  }
  const hm = (await import('../../src/game/assets/horse/prepared.json')).default as Record<string, {
    revision: string; density: number; frames: HorseArt['frames']
  }>
  const horse = hm['horse']
  if (horse) {
    const sheet = (await loadImage('src/game/assets/horse/horse-sheet.png')) as unknown as CanvasImageSource
    resources.horse = { id: 'horse', revision: horse.revision, sheet, density: horse.density, frames: horse.frames }
  }
  return resources
}

describe('BODY-7 whole-cast review sheet (permanent generator)', () => {
  it('writes every fighter, every pose, both facings', async () => {
    const resources = await loadResources()
    const CW = 150
    const CH = 120
    const board = createCanvas(CW * POSES.length + 90, CH * (FIGHTERS.length + 1) + 40)
    const g = board.getContext('2d')
    g.fillStyle = '#181420'
    g.fillRect(0, 0, board.width, board.height)
    g.font = '10px sans-serif'
    g.fillStyle = '#f5e6c8'
    POSES.forEach((pose, i) => g.fillText(pose, 92 + i * CW + 4, 14))
    let empties = 0
    for (const [row, id] of FIGHTERS.entries()) {
      const y = 20 + row * CH
      g.fillStyle = '#f5e6c8'
      g.fillText(id, 8, y + 18)
      for (const [col, pose] of POSES.entries()) {
        const b = artBoxFor(id, pose) ?? artBoxFor(id, 'idle')
        if (!b) throw new Error(`no box for ${id}:${pose}`)
        const c = createCanvas(b.width * SCALE, b.height * SCALE)
        const ctx = c.getContext('2d')
        drawKindPose(ctx as unknown as CanvasRenderingContext2D, id, pose, SCALE, resources)
        const im = ctx.getImageData(0, 0, c.width, c.height)
        let ink = 0
        for (let k = 3; k < im.data.length; k += 4) if ((im.data[k] ?? 0) > 32) ink += 1
        if (ink < 50) empties += 1
        const dx = 92 + col * CW
        const half = CW / 2 - 4
        const s = Math.min(half / c.width, (CH - 8) / c.height)
        const dw = c.width * s
        const dh = c.height * s
        // Right facing (as rendered) + left facing (texture mirror).
        g.drawImage(c, dx, y, dw, dh)
        g.save()
        g.translate(dx + CW - 2, y)
        g.scale(-1, 1)
        g.drawImage(c, 0, 0, dw, dh)
        g.restore()
      }
    }
    expect(empties, 'cells rendered empty').toBe(0)
    writeFileSync('artifacts/look/body7-cast.png', board.toBuffer('image/png'))
    expect(true).toBe(true)
  }, 120_000)
})
