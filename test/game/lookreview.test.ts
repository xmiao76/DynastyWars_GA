import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { HorseArt } from '../../src/game/art/horse-frames'
import type { PoseName } from '../../src/game/art/poses'

/** Owner objection review sheets (BODY-8..13 evidence): full figures at
 * 3x + feet strip + grip strip, through the shipping render path. Writes
 * artifacts/look/obs-*.png. */
const GROUPS = [
  ['zhangfei', 'zhaoyun', 'guanyu'],
  ['huangzhong', 'weiyan', 'soldier'],
  ['spearman', 'archer', 'lubu'],
  ['caocao', 'xiahoudun', 'xuchu'],
  ['zhangliao', 'caoren', 'xuhuang'],
  ['zhanghe', 'lidian', 'horse'],
] as const

async function loadResources(): Promise<ArtResources> {
  const resources: ArtResources = { heroes: {}, bodies: {} }
  for (const [id, dir] of [
    ['guanyu', 'hero-faces'], ['zhangfei', 'hero-faces'], ['zhaoyun', 'hero-faces'],
    ['huangzhong', 'hero-faces'], ['weiyan', 'hero-faces'],
    ['lubu', 'boss-faces'], ['caocao', 'boss-faces'], ['xiahoudun', 'boss-faces'], ['xuchu', 'boss-faces'],
    ['zhangliao', 'boss-faces'], ['caoren', 'boss-faces'], ['xuhuang', 'boss-faces'],
    ['zhanghe', 'boss-faces'], ['lidian', 'boss-faces'],
    ['soldier', 'mook-faces'], ['spearman', 'mook-faces'], ['archer', 'mook-faces'],
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
    ['lubu', 'boss-bodies'], ['caocao', 'boss-bodies'], ['xiahoudun', 'boss-bodies'], ['xuchu', 'boss-bodies'],
    ['zhangliao', 'boss-bodies'], ['caoren', 'boss-bodies'], ['xuhuang', 'boss-bodies'],
    ['zhanghe', 'boss-bodies'], ['lidian', 'boss-bodies'],
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

function render(id: string, pose: PoseName, r: ArtResources, scale: number) {
  const b = artBoxFor(id, pose) ?? artBoxFor(id, 'idle')
  if (!b) throw new Error(`no box ${id}:${pose}`)
  const cv = createCanvas(b.width * scale, b.height * scale)
  const ctx = cv.getContext('2d')
  drawKindPose(ctx as unknown as CanvasRenderingContext2D, id, pose, scale, r)
  return { cv, w: b.width * scale, h: b.height * scale }
}

describe('owner objection review sheets (permanent generator)', () => {
  it('writes full + feet + grip sheets per group', async () => {
    const r = await loadResources()
    for (const [gi, group] of GROUPS.entries()) {
      // Full figures: 3 fighters x 2 poses at 3x.
      const cells = group.map((id) => ({
        id,
        idle: render(id, 'idle', r, 3),
        attack: render(id, 'attack', r, 3),
      }))
      const cw = Math.max(...cells.map((c) => Math.max(c.idle.w, c.attack.w)))
      const chh = Math.max(...cells.map((c) => Math.max(c.idle.h, c.attack.h)))
      const sheet = createCanvas(cw * 2 + 30, (chh + 26) * 3)
      const g = sheet.getContext('2d')
      g.fillStyle = '#181420'
      g.fillRect(0, 0, sheet.width, sheet.height)
      g.font = '15px sans-serif'
      cells.forEach((c, row) => {
        const y = row * (chh + 26)
        g.fillStyle = '#f5e6c8'
        g.fillText(`${c.id} idle`, 4, y + 15)
        g.drawImage(c.idle.cv, 5, y + 18)
        g.fillStyle = '#f5e6c8'
        g.fillText(`${c.id} attack`, cw + 20, y + 15)
        g.drawImage(c.attack.cv, cw + 25, y + 18)
      })
      writeFileSync(`artifacts/look/obs-full-${gi}.png`, sheet.toBuffer('image/png'))

      // Feet strip: bottom 26% of idle at 5x.
      const feetCells = group.map((id) => {
        const im = render(id, 'idle', r, 5)
        const cropH = Math.round(im.h * 0.26)
        return { id, im, cropH }
      })
      const fw = Math.max(...feetCells.map((c) => c.im.w))
      const fh = Math.max(...feetCells.map((c) => c.cropH))
      const fsheet = createCanvas(fw + 120, (fh + 24) * 3)
      const fg = fsheet.getContext('2d')
      fg.fillStyle = '#181420'
      fg.fillRect(0, 0, fsheet.width, fsheet.height)
      fg.font = '15px sans-serif'
      feetCells.forEach((c, row) => {
        const y = row * (fh + 24)
        fg.fillStyle = '#f5e6c8'
        fg.fillText(`${c.id} feet`, 4, y + 15)
        fg.drawImage(c.im.cv, 0, c.im.h - c.cropH, c.im.w, c.cropH, 110, y + 2, c.im.w, c.cropH)
      })
      writeFileSync(`artifacts/look/obs-feet-${gi}.png`, fsheet.toBuffer('image/png'))

      // Grip strip: attack mid-band (weapon hand zone) at 5x.
      const gripCells = group.map((id) => {
        const im = render(id, 'attack', r, 5)
        return {
          id,
          im,
          sx: Math.round(im.w * 0.22),
          sy: Math.round(im.h * 0.28),
          sw: Math.round(im.w * 0.62),
          sh: Math.round(im.h * 0.42),
        }
      })
      const gw = Math.max(...gripCells.map((c) => c.sw))
      const gh = Math.max(...gripCells.map((c) => c.sh))
      const gsheet = createCanvas(gw + 120, (gh + 24) * 3)
      const gg = gsheet.getContext('2d')
      gg.fillStyle = '#181420'
      gg.fillRect(0, 0, gsheet.width, gsheet.height)
      gg.font = '15px sans-serif'
      gripCells.forEach((c, row) => {
        const y = row * (gh + 24)
        gg.fillStyle = '#f5e6c8'
        gg.fillText(`${c.id} grip`, 4, y + 15)
        gg.drawImage(c.im.cv, c.sx, c.sy, c.sw, c.sh, 110, y + 2, c.sw, c.sh)
      })
      writeFileSync(`artifacts/look/obs-grip-${gi}.png`, gsheet.toBuffer('image/png'))
    }
    expect(true).toBe(true)
  }, 120_000)
})
