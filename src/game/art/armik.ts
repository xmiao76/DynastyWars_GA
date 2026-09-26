/**
 * Two-bone IK arms (BODY-19): constant natural segment lengths in every
 * movement, for every fighter.
 *
 * Before this, elbows came from the frozen pose table while hands were
 * choreographed per weapon, so arm segments stretched and shrank across
 * poses (measured up to 128% on the near arm, ~150% on the far arm when
 * BODY-15 parked the far fist 12u down the haft). The fix solves the elbow
 * from the shoulder and the hand every pose, with per-fighter segment
 * lengths taken from the built idle pose:
 *
 * - the weapon anchor (handN) and tip reach never move (except the bow fit
 *   below and the down-pose drop), so ART-14/15 reach stays put;
 * - when the hand out-reaches the arm (broad-shouldered thrusts), the
 *   SHOULDER protracts toward the hand - the lunge a real thrust makes -
 *   instead of the arm stretching. The shoulder stays inside the torso
 *   silhouette (measured worst case ~6u on lubu/xuchu thrusts);
 * - the elbow branch follows the authored pose-table elbow, so the
 *   animator's bend intent survives and only the lengths are corrected.
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets.
 */
import { IDLE } from './poses'
import { applyBuild, type Build, type Pt, type Skeleton } from './rig'

/** Natural arm segment lengths for one build, in canonical units. */
export interface ArmLengths {
  upperN: number
  foreN: number
  upperF: number
  foreF: number
}

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * The built idle-pose segment lengths: what each arm measures when the
 * figure stands relaxed. Builds scale the idle joints first, so broad and
 * tall fighters get proportionally longer naturals.
 */
export function naturalArmLengths(build: Build): ArmLengths {
  const idle = applyBuild(IDLE, build)
  return {
    upperN: dist(idle.shoulderN, idle.elbowN),
    foreN: dist(idle.elbowN, idle.handN),
    upperF: dist(idle.shoulderF, idle.elbowF),
    foreF: dist(idle.elbowF, idle.handF),
  }
}

export interface IkSolution {
  /** Solved elbow position (exact L1/L2 lengths, modulo float error). */
  elbow: Pt
  /** Shoulder, moved toward the hand only when the arm cannot reach. */
  shoulder: Pt
  /** How far the shoulder protracted (0 when the hand was in reach). */
  protracted: number
}

/**
 * Two-bone IK for segments L1/L2 from the shoulder to the hand. Picks the
 * elbow branch nearer the authored hint (the pose-table elbow). If the hand
 * is out of reach the shoulder protracts toward it just enough to leave a
 * hair of bend, so the elbow stays defined and the segments stay exact.
 */
export function solveArm(shoulder: Pt, hand: Pt, hint: Pt, l1: number, l2: number): IkSolution {
  const reach = l1 + l2
  let sx = shoulder.x
  let sy = shoulder.y
  let protracted = 0
  let d = dist(shoulder, hand)
  if (d > reach && d > 0.001) {
    const target = reach * 0.995
    const k = (d - target) / d
    sx = shoulder.x + (hand.x - shoulder.x) * k
    sy = shoulder.y + (hand.y - shoulder.y) * k
    protracted = d - target
    d = target
  }
  if (d < 0.5) return { elbow: { ...hint }, shoulder: { x: sx, y: sy }, protracted }
  // Law of cosines: a = along-bone distance from the shoulder to the elbow
  // foot, h = its height off the shoulder-hand line.
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0))
  const ux = (hand.x - sx) / d
  const uy = (hand.y - sy) / d
  const mx = sx + ux * a
  const my = sy + uy * a
  const e1 = { x: mx - uy * h, y: my + ux * h }
  const e2 = { x: mx + uy * h, y: my - ux * h }
  const elbow = dist(e1, hint) <= dist(e2, hint) ? e1 : e2
  return { elbow, shoulder: { x: sx, y: sy }, protracted }
}

/**
 * Head radius in canonical units. This duplicates `headRadius` in draw.ts,
 * which this module cannot import (draw.ts imports weapons.ts, which
 * imports this file). `armik.test.ts` cross-checks the two across builds so
 * a changed head size fails loudly instead of drifting the bow/down fits.
 */
export function ikHeadRadius(headMult: number): number {
  return 10.4 * headMult
}

function inFaceEllipse(
  p: Pt, head: Pt, headRot: number, rx: number, ry: number,
): boolean {
  const dx = p.x - head.x
  const dy = p.y - head.y
  const lx = dx * Math.cos(headRot) + dy * Math.sin(headRot)
  const ly = -dx * Math.sin(headRot) + dy * Math.cos(headRot)
  return (lx / rx) ** 2 + (ly / ry) ** 2 <= 1
}

/**
 * Conservative geometric face check for a bow, sampling the DRAWN CURVE in
 * the weapon's local frame: both limbs (the traceBow quads, resampled),
 * the string, and the riser, each thickened +-2u for the ribbon and ink.
 * Two coarser models failed first and are recorded so they stay dead:
 * boundary-only sampling MISSES overlaps (a small ellipse can sit inside
 * the sampled box touching the curve while every sample stays outside -
 * measured 268px of face pixels that way), and gridding the whole +-fore
 * box OVER-shifts (most of the box is air, and air samples inside the
 * ellipse read as blocked - measured shift 11 at idle, lunging the
 * shoulder 4.7u in a relaxed stance). The ellipse carries a +2 pad, so any
 * drawn pixel inside the true ellipse has a curve sample within ~1u that
 * falls inside the padded ellipse. A geometric clear must imply a pixel
 * clear, and `weapons.test.ts` (pixel-exact) is the backstop.
 */
export function bowClearsFace(
  hand: Pt, rot: number, grip: number, length: number,
  head: Pt, headRot: number, headR: number,
): boolean {
  // The bow is drawn SYMMETRIC: traceBow takes fore as its half-length and
  // spans -fore..+fore with the riser at the hand (the grip split only
  // applies to hafted weapons). Bounding the negative side by -length*grip
  // instead missed the whole near limb - measured 135px of face pixels.
  const h = length * (1 - grip)
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  const rx = headR * 0.8 + 2
  const ry = headR * 0.85 + 2
  const pts: Pt[] = []
  const quad = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): void => {
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 6
      const u = 1 - t
      pts.push({ x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 })
    }
  }
  // Limb centerlines, mirroring traceBow's quads.
  quad(-h, -10, -h + 1, -4, -h * 0.73, 0)
  quad(-h * 0.73, 0, -h * 0.35, 5, -3, 1.4)
  quad(3, 1.4, h * 0.35, 5, h * 0.73, 0)
  quad(h * 0.73, 0, h - 1, -4, h, -10)
  // String nock to nock, and the riser block.
  for (let x = -h; x <= h; x += 2) pts.push({ x, y: -10 })
  for (let x = -3; x <= 3; x += 2) pts.push({ x, y: 0 })
  for (const q of pts) {
    for (const qy of [q.y - 2, q.y, q.y + 2]) {
      const p = { x: hand.x + q.x * c - qy * s, y: hand.y + q.x * s + qy * c }
      if (inFaceEllipse(p, head, headRot, rx, ry)) return false
    }
  }
  return true
}

export interface BowFit {
  /** Forward (+x) shift of the holding hand. */
  shift: number
  /** Bow rotation (canted toward vertical when the shift alone over-reaches). */
  rot: number
}

/**
 * Bow fit (BODY-19): the old fixed +14 forward shift kept the 42-long bow
 * clear of the face but parked the hand up to 38u from the shoulder - no
 * arm can reach that (measured natural ~23u). Real archers cant the bow,
 * so this keeps the smallest rotation change that clears the face with a
 * shift the arm can reach: rotation first toward vertical in 0.1 steps,
 * then the minimal shift 0..14. Idle-like poses keep shift ~3 at their
 * authored rotation; horizontal strike poses cant up and read as high
 * bashes instead of face-high horizontal sweeps.
 */
/**
 * Shoulder protraction the bow fit may assume: solveArm keeps segments
 * exact by lunging the shoulder, and ~6u keeps it inside the torso.
 */
export const BOW_PROTRACT_SLACK = 6

export function fitBow(
  hand: Pt, shoulder: Pt, rot: number, grip: number, length: number,
  head: Pt, headRot: number, headR: number, reach: number,
): BowFit {
  // Far-forward hands (thrust/sweep/special) already sit past a straight
  // arm at shift 0, so the fit must allow the protraction solveArm applies
  // rather than demanding bare reach - or nothing is feasible.
  const limit = reach * 0.99 + BOW_PROTRACT_SLACK
  for (let step = 0; step <= 16; step += 1) {
    const r = Math.max(rot - step * 0.1, -1.45)
    for (let shift = 0; shift <= 14; shift += 1) {
      const hx = hand.x + shift
      if (dist(shoulder, { x: hx, y: hand.y }) > limit) continue
      if (bowClearsFace({ x: hx, y: hand.y }, r, grip, length, head, headRot, headR)) {
        return { shift, rot: r }
      }
    }
    if (r <= -1.45) break
  }
  // Unreachable in practice (a vertical bow at shift 14 clears everything
  // and idle reach always fits it); best effort, and the pixel gate complains.
  return { shift: 14, rot: -1.4 }
}

export interface HaftFit {
  /** Far-hand position on the haft (meaningful only when gripping). */
  handF: Pt
  /** False when no reachable grip exists - the arm relaxes instead. */
  gripping: boolean
}

/** Minimum fist separation along the haft (BODY-15 measured 12u). */
export const HAFT_MIN_SEP = 12

/**
 * Far-hand placement on the haft for two-handed weapons (BODY-19). Searches
 * both directions along the haft for the reachable point nearest a
 * comfortable 85%-of-reach bend, keeping 12u of fist separation and staying
 * off the butt fitting and the ferrule/blade. Returns gripping:false when
 * nothing is reachable (the caller relaxes the arm instead) - a floating
 * stretched fist is worse than a relaxed arm.
 */
export function fitFarHand(
  handN: Pt, rot: number, grip: number, length: number,
  shoulderF: Pt, reachF: number,
): HaftFit {
  const dx = Math.cos(rot)
  const dy = Math.sin(rot)
  const back = -length * grip
  const fore = length * (1 - grip)
  const sMin = Math.ceil(back + 4)
  const sMax = Math.floor(fore - 14)
  const comfort = reachF * 0.85
  const limit = reachF * 0.99
  let best: Pt | null = null
  let bestScore = Infinity
  let bestBack = false
  for (let s = sMin; s <= sMax; s += 1) {
    if (Math.abs(s) < HAFT_MIN_SEP) continue
    const p = { x: handN.x + s * dx, y: handN.y + s * dy }
    const d = dist(shoulderF, p)
    if (d > limit) continue
    const score = Math.abs(d - comfort)
    const isBack = s < 0
    if (score < bestScore - 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && isBack && !bestBack)) {
      best = p
      bestScore = score
      bestBack = isBack
    }
  }
  if (!best) return { handF: { ...handN }, gripping: false }
  return { handF: best, gripping: true }
}

/**
 * Relaxed counterbalance target for one-handed weapons (BODY-15's swung-out-
 * back arm), clamped to 97% of the far arm's reach so IK never stretches.
 * The authored offset (|(-14,+12)| = 18.4u) fits every fighter's reach, so
 * the clamp is a guard, not a behavior change.
 */
export function relaxedFarTarget(shoulderF: Pt, reachF: number): Pt {
  const t = { x: shoulderF.x - 14, y: shoulderF.y + 12 }
  const d = dist(shoulderF, t)
  const limit = reachF * 0.97
  if (d <= limit) return t
  return {
    x: shoulderF.x + ((t.x - shoulderF.x) / d) * limit,
    y: shoulderF.y + ((t.y - shoulderF.y) / d) * limit,
  }
}

export interface DownFit {
  /** Relaxed near hand, palm resting on the dropped haft. */
  handN: Pt
  /** Weapon anchor: on the haft above the shoulder, right of the head. */
  anchor: Pt
  /** Near-horizontal lay, tip toward the feet. */
  rot: number
}

/**
 * Down-pose weapon drop (BODY-19). The old pose gripped the weapon up in
 * mid-air (hand lifted 9u, fist wrapped). The dropped weapon lies across
 * the body instead: horizontal, just above the face ellipse so the
 * face-clear gate holds, fully inside the pose box. The near hand relaxes
 * onto the haft (an open mitt, not a wrapped fist - see drawFigure) and
 * the arm IK folds it there from the shoulder.
 */
export function fitDown(pose: Skeleton, headR: number): DownFit {
  const faceTop = pose.head.y - headR * 0.85
  const haftY = faceTop - 4.5
  const anchorX = pose.shoulderN.x + 4
  return {
    handN: { x: anchorX, y: haftY + 1 },
    anchor: { x: anchorX, y: haftY },
    rot: -0.03,
  }
}
