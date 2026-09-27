import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { drawFigure } from '../../src/game/art/draw'
import { HERO_FIGURES, WEAPONS } from '../../src/game/art/figures'
import { headRadius } from '../../src/game/art/draw'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, FIG_W, FIG_H } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import { leanEnvelope, lerpSkeleton, torsoLean } from '../../src/game/art/interpolate'
import { weaponCellPainter, weaponPoseOf, type WeaponArt } from '../../src/game/art/weapon-parts'
import { loadCastArt } from './cast-art'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { HeroArt } from '../../src/game/art/hero-resources'

/**
 * BODY-24 acceptance (2): the reach/legibility/parity gates hold on
 * INTERPOLATED frames - a mid-swing can sweep the weapon through the
 * face even when no key does. Checks the painted weapon against the
 * face ellipse across windup->attack and attack->recover at three
 * blend points (the keys' own face-clear is already gated elsewhere).
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const CHAINS: Array<[PoseName, PoseName]> = [['windup', 'attack'], ['attack', 'recover']]
const TS = [0.25, 0.5, 0.75]
const HEROES = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan']

describe('BODY-24 interpolated frames stay legible', () => {
  it('no painted weapon pixel enters the face ellipse mid-transition', async () => {
    const resources = await loadCastArt()
    const wm = (await import('../../src/game/assets/weapons/prepared.json')).default as Record<string, {
      revision: string; density: number; parts: WeaponArt['parts']
    }>
    const sheet = (await import('@napi-rs/canvas')).loadImage('src/game/assets/weapons/weapons-sheet.png')
    const weapons: WeaponArt = {
      revision: wm.weapons!.revision,
      sheet: (await sheet) as unknown as CanvasImageSource,
      density: wm.weapons!.density,
      parts: wm.weapons!.parts,
    }
    const failures: string[] = []
    for (const id of HEROES) {
      const plan = HERO_FIGURES[id]!
      const body = resources.bodies?.[id] as BodyArt | undefined
      const head = resources.heroes[id] as HeroArt | undefined
      for (const [from, to] of CHAINS) {
        const a = applyBuild(POSE_TABLE[from], plan.build)
        const b = applyBuild(POSE_TABLE[to], plan.build)
        for (const t of TS) {
          const base = lerpSkeleton(a, b, t)
          const leaned = torsoLean(base, leanEnvelope(a, b, t))
          // The renderer derives the weapon through weaponPose on the
          // skeleton it draws (fits re-run there), so measure the DERIVED
          // pose - the same path drawFigure takes.
          const pose = weaponPose(plan, leaned)
          const cv = createCanvas(640, 480)
          const ctx = cv.getContext('2d')
          ctx.translate(320, 160)
          ctx.scale(SCALE, SCALE)
          const spec = WEAPONS[plan.weapon]
          weaponCellPainter(weapons, weaponPoseOf(pose, spec.length, spec.tassel ?? false))(ctx as never, plan.weapon)
          const data = ctx.getImageData(0, 0, cv.width, cv.height).data
          const r = headRadius(plan)
          let overlap = 0
          for (let dy = -r * 1.14; dy <= r * 1.14; dy += 0.5) {
            for (let dx = -r; dx <= r; dx += 0.5) {
              if ((dx / r) ** 2 + (dy / (r * 1.14)) ** 2 > 1) continue
              const x = pose.head.x + dx * Math.cos(pose.headRot) - dy * Math.sin(pose.headRot)
              const y = pose.head.y + dx * Math.sin(pose.headRot) + dy * Math.cos(pose.headRot)
              const px = Math.round(320 + x * SCALE)
              const py = Math.round(160 + y * SCALE)
              if ((data[(py * cv.width + px) * 4 + 3] ?? 0) > 127) overlap += 1
            }
          }
          if (overlap > 0) failures.push(`${id}:${from}->${to}@${t} face hit ${overlap}px`)
          // The blend must still draw a full figure (painted path alive).
          const fv = createCanvas(120 * SCALE, 110 * SCALE)
          const fctx = fv.getContext('2d')
          fctx.scale(SCALE, SCALE)
          drawFigure(fctx as unknown as Ctx, plan, pose, head || body
            ? { art: head, poseName: to, body }
            : undefined)
          let ink = 0
          const fd = fctx.getImageData(0, 0, fv.width, fv.height).data
          for (let i = 3; i < fd.length; i += 4) if ((fd[i] ?? 0) > 128) ink += 1
          if (ink < 2000) failures.push(`${id}:${from}->${to}@${t} figure thin (${ink}px)`)
        }
      }
    }
    expect(failures).toEqual([])
  }, 120_000)
})

void FIG_W
void FIG_H
void weaponPose
