import { createCanvas, loadImage } from '@napi-rs/canvas'
import { it, expect, describe } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { HeroArt } from '../../src/game/art/hero-resources'

/**
 * UIR-14 measurable acceptance (V-14 J1/J3): shoulder joins carry no
 * backdrop gaps or >1px step seams where the sleeve meets the pauldron,
 * and forearms crossing the torso keep a tone/edge seam (the arm traces
 * unbroken to the cuff). Metric A: transparent gap runs wider than 1px
 * inside the shoulder-join band = 0. Metric B: a vertical luminance scan
 * across the forearm-over-torso crossing shows at least one >=14-lum
 * separation step (the arm edge is traceable, not camo).
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const CASES: Array<{ id: string; bodyDir: string; faceDir: string; moves: PoseName[] }> = [
  { id: 'lidian', bodyDir: 'boss-bodies', faceDir: 'boss-faces', moves: ['idle', 'attack'] },
  { id: 'xiahoudun', bodyDir: 'boss-bodies', faceDir: 'boss-faces', moves: ['idle', 'attack'] },
  { id: 'xuchu', bodyDir: 'boss-bodies', faceDir: 'boss-faces', moves: ['idle', 'attack'] },
  { id: 'zhaoyun', bodyDir: 'hero-bodies', faceDir: 'hero-faces', moves: ['idle', 'walk0', 'hurt'] },
]

async function load(id: string, bodyDir: string, faceDir: string): Promise<{ head: HeroArt; body: BodyArt }> {
  const bm = (await import(`../../src/game/assets/${bodyDir}/prepared.json`)).default as Record<string, {
    revision: string; skin: string; density: number; parts: BodyArt['parts']
  }>
  const fm = (await import(`../../src/game/assets/${faceDir}/prepared.json`)).default as Record<string, {
    revision: string; skin: string; cell: { width: number; height: number }
    bounds: { x: number; y: number; width: number; height: number }
  }>
  const sheet = (await loadImage(`src/game/assets/${bodyDir}/${id}-sheet.png`)) as unknown as CanvasImageSource
  const body: BodyArt = {
    id, revision: bm[id]!.revision, sheet, density: bm[id]!.density,
    parts: bm[id]!.parts, skin: parseInt(bm[id]!.skin.slice(1), 16),
  }
  const image = async (part: string) => await loadImage(`src/game/assets/${faceDir}/${id}-${part}.png`) as unknown as CanvasImageSource
  const f = fm[id]!
  const head: HeroArt = {
    id, revision: f.revision, portrait: await image('portrait'), head: await image('head'),
    front: await image('front'), rear: await image('rear'), cell: f.cell, bounds: f.bounds,
    skin: parseInt(f.skin.slice(1), 16),
  }
  return { head, body }
}

describe('UIR-14 shoulder joins and forearm traces (V-14 J1/J3)', () => {
  it('no gap/step seams at the shoulder join; forearm edge traceable over the torso', async () => {
    const failures: string[] = []
    for (const c of CASES) {
      const plan = (HERO_FIGURES[c.id] ?? ENEMY_FIGURES[c.id])!
      const { head, body } = await load(c.id, c.bodyDir, c.faceDir)
      for (const move of c.moves) {
        const pose = weaponPose(plan, applyBuild(POSE_TABLE[move], plan.build))
        const cv = createCanvas(120 * SCALE, 110 * SCALE)
        const ctx = cv.getContext('2d')
        ctx.scale(SCALE, SCALE)
        drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[move], { art: head, poseName: move, body })
        const data = ctx.getImageData(0, 0, cv.width, cv.height).data
        const opaque = (x: number, y: number): boolean => {
          const p = (y * cv.width + x) * 4
          return (data[p + 3] ?? 0) >= 200
        }
        const lum = (x: number, y: number): number => {
          const p = (y * cv.width + x) * 4
          return (data[p] ?? 0) * 0.299 + (data[p + 1] ?? 0) * 0.587 + (data[p + 2] ?? 0) * 0.114
        }
        // A: near-shoulder join band - transparent runs inside the painted
        // span of each row must be <= 1px wide (no background seam).
        for (const side of ['N', 'F'] as const) {
          const sh = side === 'N' ? pose.shoulderN : pose.shoulderF
          let seam = 0
          for (let ly = -5; ly <= 4; ly += 0.5) {
            const y = Math.round((sh.y + ly) * SCALE)
            let x0 = -1
            let x1 = -1
            for (let lx = sh.x - 7; lx <= sh.x + 7; lx += 0.5) {
              const x = Math.round(lx * SCALE)
              if (opaque(x, y)) {
                if (x0 < 0) x0 = x
                x1 = x
              }
            }
            if (x0 < 0) continue
            let run = 0
            for (let x = x0; x <= x1; x += 1) {
              if (opaque(x, y)) {
                if (run > 2) seam += 1 // >1 logical px = 2 device px
                run = 0
              } else run += 1
            }
          }
          if (seam > 0) failures.push(`${c.id}:${move} shoulder${side} ${seam} gap-runs > 1px`)
        }
        // B: forearm-over-torso edge (zhaoyun cases): a perpendicular
        // luminance scan across the forearm at its midpoint must show a
        // >=14-lum step somewhere (the arm edge is traceable).
        if (c.id === 'zhaoyun') {
          const mid = { x: (pose.elbowN.x + pose.handN.x) / 2, y: (pose.elbowN.y + pose.handN.y) / 2 }
          const dir = { x: pose.handN.x - pose.elbowN.x, y: pose.handN.y - pose.elbowN.y }
          const len = Math.hypot(dir.x, dir.y) || 1
          const nrm = { x: -dir.y / len, y: dir.x / len }
          let maxStep = 0
          let prev: number | null = null
          for (let t = -4; t <= 4; t += 0.25) {
            const x = Math.round((mid.x + nrm.x * t) * SCALE)
            const y = Math.round((mid.y + nrm.y * t) * SCALE)
            if (!opaque(x, y)) { prev = null; continue }
            const l = lum(x, y)
            if (prev !== null) maxStep = Math.max(maxStep, Math.abs(l - prev))
            prev = l
          }
          if (maxStep < 14) failures.push(`${c.id}:${move} forearm edge step ${maxStep.toFixed(0)} (want >= 14)`)
        }
      }
    }
    expect(failures).toEqual([])
  }, 120_000)
})
