import { INK, css, materials, shade, type Materials } from './palette'
import { chainPath, limbPath, ovalPath, polyPath, type Pt } from './rig'
import { paintCel, type Shape } from './draw'

/**
 * The horse: the one thing in the cast that is not built on the humanoid rig.
 *
 * It gets its own space and its own three poses rather than being forced
 * through `Skeleton`, because sharing a rig between a biped and a quadruped
 * means a structure that describes neither. The cel passes ARE shared, so the
 * horse is lit from the same direction as the rider on its back.
 */

export const HORSE_W = 112
export const HORSE_H = 76
const GROUND = HORSE_H

interface Leg {
  top: Pt
  knee: Pt
  hoof: Pt
}

interface HorsePose {
  frontNear: Leg
  frontFar: Leg
  backNear: Leg
  backFar: Leg
}

const leg = (tx: number, ty: number, kx: number, ky: number, hx: number, hy: number): Leg => ({
  top: { x: tx, y: ty },
  knee: { x: kx, y: ky },
  hoof: { x: hx, y: hy },
})

/**
 * Standing square, then two halves of a walk.
 *
 * The gaps between the paired legs are wide on purpose. The pixel horse once
 * placed its walk1 legs two pixels apart, the outline pass closed the gap, and
 * four legs rendered as two blobs for one frame of every cycle - the reason
 * `artquality` counts legs across a walk cycle at all. Here the ink is a
 * centred stroke rather than an inward dilation, but the failure mode is the
 * same: keep them clear of each other.
 */
const POSES: Record<string, HorsePose> = {
  idle: {
    frontNear: leg(70, 40, 72, 58, 72, GROUND),
    frontFar: leg(62, 41, 63, 58, 63, GROUND),
    backNear: leg(34, 40, 30, 58, 29, GROUND),
    backFar: leg(42, 41, 39, 58, 38, GROUND),
  },
  walk0: {
    frontNear: leg(70, 40, 78, 55, 85, GROUND - 2),
    frontFar: leg(62, 41, 61, 58, 59, GROUND),
    backNear: leg(34, 40, 27, 56, 20, GROUND - 1),
    backFar: leg(42, 41, 41, 58, 41, GROUND),
  },
  walk1: {
    frontNear: leg(70, 40, 69, 57, 67, GROUND),
    frontFar: leg(62, 41, 68, 55, 76, GROUND - 2),
    backNear: leg(34, 40, 34, 58, 35, GROUND),
    backFar: leg(42, 41, 34, 56, 26, GROUND - 1),
  },
}

export interface HorsePlan {
  coat: number
  mane: number
  tack: number
}

export const HORSE_PLAN: HorsePlan = { coat: 0x8a5432, mane: 0x3e2716, tack: 0xc8a828 }

/** Which horse pose a texture key maps to. Attack, jump and down alias idle. */
export function horsePoseName(pose: string): string {
  return pose === 'walk0' || pose === 'walk1' ? pose : 'idle'
}

export function drawHorse(ctx: CanvasRenderingContext2D, plan: HorsePlan, poseName: string): void {
  const p = POSES[horsePoseName(poseName)] ?? POSES['idle']
  if (!p) return
  const m = materials(plan.coat, plan.tack, plan.mane, plan.mane)
  const hoof = css(shade(plan.mane, 0.4))
  const shapes: Shape[] = []
  const add = (trace: Shape['trace'], fill: string): void => {
    shapes.push({ trace, fill })
  }
  const drawLeg = (l: Leg, fill: string): void => {
    add((c) => chainPath(c, [l.top, l.knee, l.hoof], [15, 9, 7]), fill)
    add((c) => limbPath(c, { x: l.hoof.x - 1, y: l.hoof.y - 4 }, { x: l.hoof.x + 1, y: l.hoof.y - 1 }, 8, 8), hoof)
  }

  // Far legs and the tail sit behind the body.
  drawLeg(p.backFar, m.clothShade)
  drawLeg(p.frontFar, m.clothShade)
  add(
    (c) =>
      polyPath(c, [
        { x: 30, y: 28 },
        { x: 22, y: 30 },
        { x: 10, y: 56 },
        { x: 19, y: 58 },
        { x: 27, y: 38 },
      ]),
    m.hair,
  )

  // Barrel, chest and hindquarters as one mass, then neck and head.
  add((c) => ovalPath(c, { x: 50, y: 34 }, 26, 15, -0.03), m.cloth)
  add((c) => ovalPath(c, { x: 33, y: 35 }, 14, 14, 0), m.cloth)
  add((c) => limbPath(c, { x: 66, y: 30 }, { x: 84, y: 15 }, 19, 12), m.cloth)
  add((c) => ovalPath(c, { x: 91, y: 11 }, 13, 7.5, 0.42), m.cloth)
  add(
    (c) =>
      polyPath(c, [
        { x: 80, y: 4 },
        { x: 84, y: -2 },
        { x: 86, y: 6 },
      ]),
    m.cloth,
  )
  // Mane along the crest of the neck.
  add(
    (c) =>
      polyPath(c, [
        { x: 66, y: 22 },
        { x: 81, y: 6 },
        { x: 86, y: 9 },
        { x: 72, y: 26 },
      ]),
    m.hair,
  )
  // Saddle and girth, so a mounted horse reads as tack rather than as paint.
  add(
    (c) =>
      polyPath(c, [
        { x: 40, y: 22 },
        { x: 60, y: 21 },
        { x: 62, y: 30 },
        { x: 38, y: 31 },
      ]),
    m.trim,
  )

  // Near legs in front of everything.
  drawLeg(p.backNear, m.cloth)
  drawLeg(p.frontNear, m.cloth)

  paintCel(ctx, shapes, HORSE_W, GROUND)

  // Eye and nostril, after the shading so they stay readable.
  drawHorseFace(ctx, m)
}

function drawHorseFace(ctx: CanvasRenderingContext2D, m: Materials): void {
  ctx.save()
  ctx.fillStyle = INK
  ovalPath(ctx, { x: 88, y: 8 }, 1.8, 2.1, 0)
  ctx.fill()
  ovalPath(ctx, { x: 101, y: 13 }, 1.5, 1.2, 0.4)
  ctx.fill()
  ctx.fillStyle = m.trimShade
  limbPath(ctx, { x: 86, y: 14 }, { x: 99, y: 17 }, 3, 2.4)
  ctx.fill()
  ctx.restore()
}
