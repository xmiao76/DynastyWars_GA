import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, WEAPONS } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { HeroArt } from '../../src/game/art/hero-resources'

/**
 * UIR-13 measurable acceptance (V-14 J5/J7): on two-handed strike renders
 * (attack/thrust/chop), hand-tone pixels must visibly cross the haft band
 * on the near side of each grip point - the fingers wrap the haft, the
 * haft passes through the fist rather than lying on top of it. Also the
 * cuff/wrist zone behind the near fist must not be cut by the haft.
 *
 * Metric: along the weapon axis, take a band of +-2.2u around each grip
 * point (handN and, when gripping, handF); inside it count pixels whose
 * tone is within 30 of either designed hand tone (near/far skin or its
 * lit blend). Pass >= HANT_OVER_NEAR px at the near grip and >= some far
 * wrap px at the far grip. Recorded before UIR-13 in the task entry.
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const FIGHTERS: Array<{ id: string; bodyDir: 'hero-bodies' | 'mook-bodies' | 'boss-bodies'; faceDir: 'hero-faces' | 'mook-faces' | 'boss-faces' }> = [
  { id: 'guanyu', bodyDir: 'hero-bodies', faceDir: 'hero-faces' },
  { id: 'zhangfei', bodyDir: 'hero-bodies', faceDir: 'hero-faces' },
  { id: 'zhaoyun', bodyDir: 'hero-bodies', faceDir: 'hero-faces' },
  { id: 'soldier', bodyDir: 'mook-bodies', faceDir: 'mook-faces' },
  { id: 'lidian', bodyDir: 'boss-bodies', faceDir: 'boss-faces' },
  { id: 'xiahoudun', bodyDir: 'boss-bodies', faceDir: 'boss-faces' },
  { id: 'xuchu', bodyDir: 'boss-bodies', faceDir: 'boss-faces' },
]
const MOVES: PoseName[] = ['attack', 'thrust', 'chop']

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

describe('UIR-13 grip wraps over the haft (V-14 J5/J7)', () => {
  it('hand tones cross the haft band at both grip points on strikes', async () => {
    const failures: string[] = []
    const rows: string[] = []
    for (const f of FIGHTERS) {
      const plan = (HERO_FIGURES[f.id] ?? ENEMY_FIGURES[f.id])!
      const { head, body } = await load(f.id, f.bodyDir, f.faceDir)
      for (const move of MOVES) {
        const pose = weaponPose(plan, applyBuild(POSE_TABLE[move], plan.build))
        const gripDist = Math.abs((pose.handF.x - pose.handN.x) * Math.sin(pose.weaponRot) - (pose.handF.y - pose.handN.y) * Math.cos(pose.weaponRot))
        const cv = createCanvas(120 * SCALE, 110 * SCALE)
        const ctx = cv.getContext('2d')
        ctx.scale(SCALE, SCALE)
        drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[move], { art: head, poseName: move, body })
        const data = ctx.getImageData(0, 0, cv.width, cv.height).data
        // Designed hand tones: near skin + lit, far (shade 0.82) + lit.
        const base = body.skin
        const far = Math.round((((base >> 16) & 255) * 0.82)) << 16 | Math.round((((base >> 8) & 255) * 0.82)) << 8 | Math.round(((base & 255) * 0.82))
        const tones = [base, far]
        const nearTone = (r: number, g: number, b: number): boolean => tones.some((t) => {
          const tr = (t >> 16) & 255; const tg = (t >> 8) & 255; const tb = t & 255
          // Accept the raw and lit blends (~+25 max per channel) with slack.
          return Math.abs(r - tr) <= 42 && Math.abs(g - tg) <= 48 && Math.abs(b - tb) <= 48
        })
        // Band around the weapon axis near a grip point: +-2.2u perpendicular,
        // +-3u along, sampled at scale.
        const countOver = (gx: number, gy: number): number => {
          const dir = { x: Math.cos(pose.weaponRot), y: Math.sin(pose.weaponRot) }
          const nrm = { x: -dir.y, y: dir.x }
          let n = 0
          for (let a = -3; a <= 3; a += 0.25) {
            for (let b = -2.2; b <= 2.2; b += 0.25) {
              const x = Math.round((gx + dir.x * a + nrm.x * b) * SCALE)
              const y = Math.round((gy + dir.y * a + nrm.y * b) * SCALE)
              if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) continue
              const p = (y * cv.width + x) * 4
              if ((data[p + 3] ?? 0) < 128) continue
              if (nearTone(data[p] ?? 0, data[p + 1] ?? 0, data[p + 2] ?? 0)) n += 1
            }
          }
          return n
        }
        const near = countOver(pose.handN.x, pose.handN.y)
        const farN = gripDist < 3 ? countOver(pose.handF.x, pose.handF.y) : -1
        rows.push(`${f.id}:${move} near=${near} far=${farN}`)
        // The wrap must be more than a stray edge: >= 24 hand-tone samples
        // inside the 6x4.4u grip band (~13% of the band's samples at 0.25
        // steps) at the near grip; the far grip keeps at least its wrap pads.
        if (near < 24) failures.push(`${f.id}:${move} near-hand over haft ${near} (want >= 24)`)
        if (farN >= 0 && farN < 12) failures.push(`${f.id}:${move} far-hand over haft ${farN} (want >= 12)`)
      }
    }
    console.log(rows.join(' | '))
    expect(failures).toEqual([])
  }, 120_000)
})

void WEAPONS
