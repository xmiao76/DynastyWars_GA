import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { shade } from '../../src/game/art/palette'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import type { HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'

/**
 * BODY-8 measurable acceptance: a skin-toned hand region of >= 24 px at
 * gameplay scale (SCALE 2) sits at the grip point (within +-3 logical px)
 * in every pose, for every fighter - and a relaxed far hand at handF.
 * Before the fix these counts were ~0: the plain haft covered the clipped
 * palm stubs entirely.
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const POSES = Object.keys(POSE_TABLE) as PoseName[]

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

function rgb(n: number): [number, number, number] {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

describe('BODY-8 hands at the grip', () => {
  it.each(FIGHTERS.map((f) => [f.id, f] as const))('%s: grip and far hand present in every pose', async (id, f) => {
    const plan: FigurePlan = (HERO_FIGURES[f.id] ?? ENEMY_FIGURES[f.id])!
    const head = await loadPack(f.id, f.dir)
    const body = f.bodyDir ? await loadBody(f.id, f.bodyDir) : undefined
    // Same skin flow as drawFigure: body art > painted head > plan > default.
    const skinNum = body?.skin ?? head?.skin ?? plan.skin ?? 0xf0c8a0
    const handSkin = rgb(skinNum)
    const farTone = rgb(shade(skinNum, 0.22))
    const painted = head || body ? { art: head, poseName: 'idle' as PoseName, body } : undefined
    for (const poseName of POSES) {
      const pose = weaponPose(plan, applyBuild(POSE_TABLE[poseName], plan.build))
      const canvas = createCanvas(120 * SCALE, 110 * SCALE)
      const ctx = canvas.getContext('2d')
      ctx.scale(SCALE, SCALE)
      const art = painted ? { ...painted, poseName } : undefined
      drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[poseName], art)
      const data = ctx.getImageData(0, 0, 120 * SCALE, 110 * SCALE).data
      const near = (cx: number, cy: number, tone: [number, number, number], r = 3): number => {
        let n = 0
        const W = 120 * SCALE
        const H = 110 * SCALE
        for (let y = Math.round((cy - r) * SCALE); y <= Math.round((cy + r) * SCALE); y += 1) {
          for (let x = Math.round((cx - r) * SCALE); x <= Math.round((cx + r) * SCALE); x += 1) {
            if (x < 0 || y < 0 || x >= W || y >= H) continue
            const p = (y * W + x) * 4
            if ((data[p + 3] ?? 0) < 128) continue
            if (data[p] === tone[0] && data[p + 1] === tone[1] && data[p + 2] === tone[2]) n += 1
          }
        }
        return n
      }
      const grip = near(pose.handN.x, pose.handN.y, handSkin)
      expect(grip, `${id}:${poseName} grip hand missing (${grip}px)`).toBeGreaterThanOrEqual(24)
      // BODY-15: the far hand is choreographed visible in every pose but
      // down (far fist on the haft for polearms, counterbalance mitten
      // for one-handers) - both paint in the shaded tone.
      if (poseName !== 'down') {
        // Wider box: the far fist wraps the haft, so its visible tone is
        // the side slivers plus the fingertips crossing the haft - not
        // just the covered center.
        const far = near(pose.handF.x, pose.handF.y, farTone, 5)
        expect(far, `${id}:${poseName} far hand missing (${far}px)`).toBeGreaterThanOrEqual(12)
      }
    }
  }, 30_000)
})
