/**
 * The 2D rig every humanoid in the game is drawn from.
 *
 * A pose is a table of JOINT POSITIONS rather than a chain of joint angles.
 * Both can express the same six poses, but positions can be read straight off
 * the number - a hand at (62, 30) is a hand at (62, 30) - while an angle chain
 * has to be simulated in your head through four parents before you know where
 * anything ended up, and a wrong sign shows as a limb somewhere unexpected
 * rather than as a number that looks off. With a fixed pose set there is
 * nothing to gain from the extra indirection.
 *
 * Poses are authored once in the canonical space below and SHARED by every
 * humanoid kind. What makes a boss a boss, or Zhang Fei not Zhao Yun, is the
 * build applied over the top - height, bulk, limb weight - plus colours,
 * headgear and weapon. Nineteen fighters therefore cost six pose tables, not
 * a hundred and fourteen.
 */

import type { Pt } from './paths'

/** Path helpers now live in `paths.ts` (B2 extraction, shared with props);
 * re-exported here for legacy rig consumers until this module's deletion. */
export { limbPath, ovalPath, polyPath, type Pt } from './paths'

/** Canonical figure box. Feet sit on GROUND; the box centre is BODY_X. */
export const FIG_W = 96
export const FIG_H = 92
export const BODY_X = FIG_W / 2
export const GROUND = FIG_H

/**
 * One pose, in canonical figure space. `F` is the far side of the body (drawn
 * behind the torso) and `N` the near side (drawn in front), which is what gives
 * a flat figure its depth.
 */
export interface Skeleton {
  hip: Pt
  chest: Pt
  neck: Pt
  head: Pt
  shoulderF: Pt
  elbowF: Pt
  handF: Pt
  shoulderN: Pt
  elbowN: Pt
  handN: Pt
  hipF: Pt
  kneeF: Pt
  footF: Pt
  hipN: Pt
  kneeN: Pt
  footN: Pt
  /** Rotation of the held weapon, radians, 0 = pointing right. */
  weaponRot: number
  /** Where the weapon crosses the hand, as a fraction of its length. */
  weaponGrip: number
  /** Head tilt, radians. */
  headRot: number
  /** A floored figure is drawn lying down and skips the ground shadow logic. */
  lying?: boolean
  /** UIR-15: a two-handed strike - the far grip spreads wider along the
   * haft so the two arm chains stop running parallel (V-14 J6). */
  strike?: boolean
  /**
   * Weapon anchor override (BODY-19 down-pose drop). The weapon is drawn
   * through this point instead of the hand, so a released hand can rest
   * beside the dropped weapon instead of gripping it. Unset in every other
   * pose, where the anchor is the gripping hand.
   */
  weaponAnchor?: Pt
}

/** How heavy a given kind is built. Applied over the shared pose tables. */
export interface Build {
  /** Overall figure height as a fraction of FIG_H. */
  height: number
  /** Limb and torso thickness multiplier. */
  bulk: number
  /** Shoulder width multiplier. */
  shoulders: number
  /** Head size multiplier. */
  head: number
}

export const STANDARD_BUILD: Build = { height: 1, bulk: 1, shoulders: 1, head: 1 }

const JOINTS = [
  'hip', 'chest', 'neck', 'head',
  'shoulderF', 'elbowF', 'handF',
  'shoulderN', 'elbowN', 'handN',
  'hipF', 'kneeF', 'footF',
  'hipN', 'kneeN', 'footN',
] as const

/**
 * Apply a build to a pose.
 *
 * Height scales about the GROUND line so the feet stay on the floor whatever
 * the figure's size - scaling about the box centre instead would leave bosses
 * hovering and grunts sunk. Shoulder width scales about the body's centre line
 * so a broad fighter widens both ways rather than leaning.
 */
export function applyBuild(pose: Skeleton, build: Build): Skeleton {
  const out = { ...pose }
  for (const joint of JOINTS) {
    const p = pose[joint]
    const widen = joint.endsWith('F') || joint.endsWith('N') ? build.shoulders : 1
    out[joint] = {
      x: BODY_X + (p.x - BODY_X) * widen,
      y: GROUND - (GROUND - p.y) * build.height,
    }
  }
  return out
}

/**
 * Trace a whole limb - shoulder through elbow to hand - as ONE tapered shape.
 *
 * Drawing a limb as two capsules gives each segment its own rounded cap and its
 * own ink outline, and the joints come out as beads: the first cast built that
 * way read as a string of sausages rather than as arms and legs. One path
 * through both segments has a single outline and a continuous taper, which is
 * how a limb is drawn.
 *
 * The offset at the middle joint uses the bisector of the two segment normals,
 * so the outline turns the corner instead of crossing itself. The outbound
 * side is the MINUS side for the same reason as in `limbPath`, which had the
 * same crossed sides until ART-16.
 */
export function chainPath(
  ctx: CanvasRenderingContext2D,
  pts: readonly [Pt, Pt, Pt],
  widths: readonly [number, number, number],
): void {
  const norm = (a: Pt, b: Pt): Pt => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    return { x: -dy / len, y: dx / len }
  }
  const n01 = norm(pts[0], pts[1])
  const n12 = norm(pts[1], pts[2])
  const bis = (() => {
    const x = n01.x + n12.x
    const y = n01.y + n12.y
    const len = Math.hypot(x, y) || 1
    return { x: x / len, y: y / len }
  })()
  const off = (p: Pt, n: Pt, w: number, sign: number): Pt => ({
    x: p.x + n.x * (w / 2) * sign,
    y: p.y + n.y * (w / 2) * sign,
  })
  const startAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x)
  const endAngle = Math.atan2(pts[2].y - pts[1].y, pts[2].x - pts[1].x)

  ctx.beginPath()
  ctx.arc(pts[0].x, pts[0].y, widths[0] / 2, startAngle + Math.PI / 2, startAngle - Math.PI / 2)
  const a1 = off(pts[1], bis, widths[1], -1)
  ctx.lineTo(a1.x, a1.y)
  const a2 = off(pts[2], n12, widths[2], -1)
  ctx.lineTo(a2.x, a2.y)
  ctx.arc(pts[2].x, pts[2].y, widths[2] / 2, endAngle - Math.PI / 2, endAngle + Math.PI / 2)
  const b1 = off(pts[1], bis, widths[1], 1)
  ctx.lineTo(b1.x, b1.y)
  const b0 = off(pts[0], n01, widths[0], 1)
  ctx.lineTo(b0.x, b0.y)
  ctx.closePath()
}

/** Linear interpolation between two joints, for placing things along a limb. */
export function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}
