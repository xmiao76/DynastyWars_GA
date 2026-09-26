import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import type { HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'

/**
 * BODY-9 measurable acceptance: at gameplay scale (SCALE 2) each standing
 * fighter shows a toe-cap region of >= 24 px with luminance delta >= 30
 * against the background, unoccluded (drawn over hems and hafts), in
 * idle/walk0/walk1. Before the fix the painted boots were dark-on-dark
 * under the robe hems and the weapon butt.
 *
 * BODY-23 (G8) re-pointed: the leather boot OVERLAY is gone on painted
 * shins - it hid the master's own boots - so the readable toe must come
 * from the painted boot itself. The contract is unchanged: the toe zone
 * must be drawn (>= 24 px), not dark-on-dark (mean luminance >= 30) and
 * not a flat slab (luminance spread >= 25, i.e. a cap highlight exists).
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const STANDING: PoseName[] = ['idle', 'walk0', 'walk1']

const FIGHTERS: Array<{ id: string; dir: 'hero-faces' | 'boss-faces' | 'mook-faces'; bodyDir: 'hero-bodies' | 'mook-bodies' | 'boss-bodies' | null }> = [
  { id: 'guanyu', dir: 'hero-faces', bodyDir: 'hero-bodies' },
  { id: 'zhangfei', dir: 'hero-faces', bodyDir: 'hero-bodies' },
  { id: 'zhaoyun', dir: 'hero-faces', bodyDir: 'hero-bodies' },
  { id: 'huangzhong', dir: 'hero-faces', bodyDir: 'hero-bodies' },
  { id: 'weiyan', dir: 'hero-faces', bodyDir: 'hero-bodies' },
  { id: 'soldier', dir: 'mook-faces', bodyDir: 'mook-bodies' },
  { id: 'spearman', dir: 'mook-faces', bodyDir: 'mook-bodies' },
  { id: 'archer', dir: 'mook-faces', bodyDir: 'mook-bodies' },
  { id: 'lubu', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'caocao', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'xiahoudun', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'xuchu', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'zhangliao', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'caoren', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'xuhuang', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'zhanghe', dir: 'boss-faces', bodyDir: 'boss-bodies' },
  { id: 'lidian', dir: 'boss-faces', bodyDir: 'boss-bodies' },
]

async function loadPack(id: string, dir: string): Promise<HeroArt | undefined> {
  const m = (await import(`../../src/game/assets/${dir}/prepared.json`)).default as Record<string, {
    revision: string; skin: string; cell: { width: number; height: number }
    bounds: { x: number; y: number; width: number; height: number }
  }>
  const meta = m[id]
  if (!meta) return undefined
  const image = async (part: string) => await loadImage(`src/game/assets/${dir}/${id}-${part}.png`) as unknown as CanvasImageSource
  return {
    id, revision: meta.revision, portrait: await image('portrait'), head: await image('head'),
    front: await image('front'), rear: await image('rear'), cell: meta.cell, bounds: meta.bounds,
    skin: parseInt(meta.skin.slice(1), 16),
  }
}

async function loadBody(id: string, dir: string): Promise<BodyArt | undefined> {
  const m = (await import(`../../src/game/assets/${dir}/prepared.json`)).default as Record<string, {
    revision: string; skin: string; density: number; parts: BodyArt['parts']
  }>
  const meta = m[id]
  if (!meta) return undefined
  const sheet = (await loadImage(`src/game/assets/${dir}/${id}-sheet.png`)) as unknown as CanvasImageSource
  return {
    id, revision: meta.revision, sheet, density: meta.density, parts: meta.parts,
    skin: parseInt(meta.skin.slice(1), 16),
  }
}

describe('BODY-9 feet visible at gameplay size', () => {
  it.each(FIGHTERS.map((f) => [f.id, f] as const))('%s: toe caps readable in standing poses', async (id, f) => {
    const plan: FigurePlan = (HERO_FIGURES[f.id] ?? ENEMY_FIGURES[f.id])!
    const head = await loadPack(f.id, f.dir)
    const body = f.bodyDir ? await loadBody(f.id, f.bodyDir) : undefined
    const painted = head || body ? { art: head, poseName: 'idle' as PoseName, body } : undefined
    for (const poseName of STANDING) {
      const pose = weaponPose(plan, applyBuild(POSE_TABLE[poseName], plan.build))
      const canvas = createCanvas(120 * SCALE, 110 * SCALE)
      const ctx = canvas.getContext('2d')
      ctx.scale(SCALE, SCALE)
      drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[poseName], painted ? { ...painted, poseName } : undefined)
      const data = ctx.getImageData(0, 0, 120 * SCALE, 110 * SCALE).data
      const W = 120 * SCALE
      // Toe zone: ahead of the near foot, on the ground line.
      let lum = 0
      let lumMin = 255
      let lumMax = 0
      let inkedN = 0
      for (let y = Math.round((pose.footN.y - 4) * SCALE); y <= Math.round(pose.footN.y * SCALE); y += 1) {
        for (let x = Math.round((pose.footN.x + 1) * SCALE); x <= Math.round((pose.footN.x + 7) * SCALE); x += 1) {
          if (x < 0 || y < 0 || x >= W || y >= 110 * SCALE) continue
          const p = (y * W + x) * 4
          if ((data[p + 3] ?? 0) < 128) continue
          inkedN += 1
          const l = (data[p] ?? 0) * 0.299 + (data[p + 1] ?? 0) * 0.587 + (data[p + 2] ?? 0) * 0.114
          lum += l
          if (l < lumMin) lumMin = l
          if (l > lumMax) lumMax = l
        }
      }
      expect(inkedN, `${id}:${poseName} toe zone empty (${inkedN}px)`).toBeGreaterThanOrEqual(24)
      expect(lum / Math.max(1, inkedN), `${id}:${poseName} toe too dark`).toBeGreaterThanOrEqual(30)
      expect(lumMax - lumMin, `${id}:${poseName} toe flat, no cap highlight (${Math.round(lumMax - lumMin)})`).toBeGreaterThanOrEqual(25)
    }
  }, 30_000)
})
