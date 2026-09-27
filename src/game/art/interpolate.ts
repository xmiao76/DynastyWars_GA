/**
 * Pose interpolation (BODY-24, motion engine): the rendered path between
 * combat keys. The sim keeps its poses, timing and hits unchanged - this
 * module only produces the IN-BETWEEN skeletons the renderer draws while
 * transitioning from one key to the next (windup -> strike -> recover,
 * walk0 <-> walk1), plus the torso lean/rotation into strikes that the
 * BODY-22 motion review found missing.
 *
 * Pure data + pure functions: no Phaser, no DOM, no assets.
 */
import type { Pt, Skeleton } from './rig'

/** Ease a transition parameter: smoothstep, so keys ease rather than snap. */
export function blendEase(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t
  return x * x * (3 - 2 * x)
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) })

/** Shortest-path angle blend (the weapon sweeps the short way round). */
function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return a + d * t
}

/**
 * Blend two keys. Endpoints are exact (t=0/1 return the keys' geometry),
 * so drawing a blend at its ends can never drift from the authored poses.
 * Discrete flags come from the nearer key.
 */
export function lerpSkeleton(a: Skeleton, b: Skeleton, tRaw: number): Skeleton {
  const t = tRaw < 0 ? 0 : tRaw > 1 ? 1 : tRaw
  const near = t < 0.5 ? a : b
  const out: Skeleton = {
    hip: lerpPt(a.hip, b.hip, t),
    chest: lerpPt(a.chest, b.chest, t),
    neck: lerpPt(a.neck, b.neck, t),
    head: lerpPt(a.head, b.head, t),
    shoulderF: lerpPt(a.shoulderF, b.shoulderF, t),
    elbowF: lerpPt(a.elbowF, b.elbowF, t),
    handF: lerpPt(a.handF, b.handF, t),
    shoulderN: lerpPt(a.shoulderN, b.shoulderN, t),
    elbowN: lerpPt(a.elbowN, b.elbowN, t),
    handN: lerpPt(a.handN, b.handN, t),
    hipF: lerpPt(a.hipF, b.hipF, t),
    kneeF: lerpPt(a.kneeF, b.kneeF, t),
    footF: lerpPt(a.footF, b.footF, t),
    hipN: lerpPt(a.hipN, b.hipN, t),
    kneeN: lerpPt(a.kneeN, b.kneeN, t),
    footN: lerpPt(a.footN, b.footN, t),
    weaponRot: lerpAngle(a.weaponRot, b.weaponRot, t),
    weaponGrip: lerp(a.weaponGrip, b.weaponGrip, t),
    headRot: lerpAngle(a.headRot, b.headRot, t),
  }
  if (near.lying === true) out.lying = true
  if (near.strike === true) out.strike = true
  if (a.weaponAnchor || b.weaponAnchor) {
    out.weaponAnchor = lerpPt(a.weaponAnchor ?? a.handN, b.weaponAnchor ?? b.handN, t)
  }
  return out
}

/**
 * Torso dynamics (BODY-24): the torso rotates into a swing. The upper
 * body (chest, neck, head, both shoulders and elbows - hands stay pinned
 * on their targets so the IK refills the arms) leans about the hip by
 * `amount` radians, positive = toward the weapon side. Applied as a
 * transition multiplier by the caller, peaking mid-strike.
 */
export function torsoLean(sk: Skeleton, amount: number): Skeleton {
  if (amount === 0) return sk
  const c = Math.cos(amount)
  const s = Math.sin(amount)
  const rot = (p: Pt): Pt => {
    const dx = p.x - sk.hip.x
    const dy = p.y - sk.hip.y
    return { x: sk.hip.x + dx * c - dy * s, y: sk.hip.y + dx * s + dy * c }
  }
  return {
    ...sk,
    chest: rot(sk.chest),
    neck: rot(sk.neck),
    head: rot(sk.head),
    shoulderF: rot(sk.shoulderF),
    elbowF: rot(sk.elbowF),
    shoulderN: rot(sk.shoulderN),
    elbowN: rot(sk.elbowN),
  }
}

/**
 * Lean envelope for a transition: 0 at the keys, peaking at mid-transition
 * (a sine arch), signed by the strike direction (the weapon's side).
 */
export function leanEnvelope(a: Skeleton, b: Skeleton, t: number, maxLean = 0.07): number {
  const arch = Math.sin(Math.PI * (t < 0 ? 0 : t > 1 ? 1 : t))
  const intoStrike = b.strike === true && a.strike !== true ? 1 : 0
  const outOfStrike = a.strike === true && b.strike !== true ? -1 : 0
  const side = Math.sign(b.handN.x - a.handN.x) || 1
  const v = arch * maxLean * (intoStrike + outOfStrike) * side
  // Normalize -0 (a side of -1 makes a zero envelope -0; tests see the sign).
  return v === 0 ? 0 : v
}
