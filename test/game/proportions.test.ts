import { describe, expect, it } from 'vitest'
import { naturalArmLengths, naturalLegLengths } from '../../src/game/art/armik'
import { headRadius } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, WEAPONS } from '../../src/game/art/figures'
import { HEAD_PAINTED_SCALE } from '../../src/game/art/hero-resources'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, GROUND, type Pt } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'

/**
 * BODY-22 measurable acceptance: the whole-body ratio table, asserted per
 * fighter. Definitions (all in canonical figure units on the built idle
 * pose unless noted):
 * - stature: painted crown to sole. Painted heads render at
 *   HEAD_PAINTED_SCALE, so the crown is the head joint minus the scaled
 *   half-ellipse - NOT the procedural ellipse (which stands ~4u taller).
 * - head:body is asserted per fighter by the BODY-14 review harness
 *   (1:4.5-6.5, render-measured); this file cites it rather than
 *   duplicating the render measurement.
 * - arm: shoulder to palm joint (upper+fore natural lengths).
 * - leg: hip to foot joints (thigh+shin natural lengths).
 * - fist: the painted grip cell's 8.8u span.
 * - weapon total: haft length + head extension past the socket.
 *
 * Bands are heroic-stylized, calibrated to the shipped art with room for
 * build variety: they catch regressions (a swapped length, a rescaled
 * head), not anatomical exactness. The CHARACTER_REVIEW.md table records
 * the measured values beside their anatomical references.
 */
const POSES = Object.keys(POSE_TABLE) as PoseName[]
const FIGHTERS = Object.entries({ ...HERO_FIGURES, ...ENEMY_FIGURES })
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y)

/** Painted-crown stature of one built pose. */
function statureOf(built: { head: Pt }, headR: number): number {
  const crown = built.head.y - headR * 1.14 * HEAD_PAINTED_SCALE
  return GROUND - crown
}

/** Head extension past the socket, per head kind (from the weapon traces). */
const HEAD_EXT: Record<string, number> = {
  crescent: 22,
  serpent: 22,
  leaf: 22,
  jian: 26,
  dao: 23,
  ji: 15,
  bow: 0, // symmetric: total height is 2*fore at the reference draw
}

describe('BODY-22 whole-body ratios', () => {
  it('holds every leg segment within 95-110% of natural length (standing poses)', () => {
    // The prone figure is a deliberate stylized compression (full-length
    // legs would not fit the down frame), so `down` keeps table knees and
    // is exempt here - like handgrip's far-hand exemption. The top end is
    // 110%: overreached strides (max 9.7% measured) stretch uniformly on
    // STRAIGHT legs, which is imperceptible without a bend for reference
    // and preserves every authored stance exactly.
    const failures: string[] = []
    for (const [id, plan] of FIGHTERS) {
      const nat = naturalLegLengths(plan.build)
      for (const name of POSES) {
        if (name === 'down') continue
        const p = weaponPose(plan, applyBuild(POSE_TABLE[name], plan.build))
        const segs: Array<[string, number, number]> = [
          ['thighF', dist(p.hipF, p.kneeF), nat.thighF],
          ['shinF', dist(p.kneeF, p.footF), nat.shinF],
          ['thighN', dist(p.hipN, p.kneeN), nat.thighN],
          ['shinN', dist(p.kneeN, p.footN), nat.shinN],
        ]
        for (const [seg, got, want] of segs) {
          const ratio = got / want
          if (ratio < 0.95 || ratio > 1.1) {
            failures.push(`${id}:${name}:${seg} ${got.toFixed(2)}/${want.toFixed(2)} = ${ratio.toFixed(3)}`)
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('keeps hips and feet exactly planted under leg IK', () => {
    // IK moves KNEES only: hips stay exactly (the torso is untouched) and
    // feet stay exactly (every authored stance is preserved). Overreach
    // resolves by uniform segment stretch (previous test), never by
    // moving a joint.
    for (const [id, plan] of FIGHTERS) {
      for (const name of POSES) {
        if (name === 'down') continue
        const built = applyBuild(POSE_TABLE[name], plan.build)
        const p = weaponPose(plan, built)
        for (const j of ['hipF', 'footF', 'hipN', 'footN'] as const) {
          expect(p[j].x, `${id}:${name}:${j}.x`).toBe(built[j].x)
          expect(p[j].y, `${id}:${name}:${j}.y`).toBe(built[j].y)
        }
      }
    }
  })

  it('holds limb, hand and weapon ratios in their bands for every fighter', () => {
    const failures: string[] = []
    for (const [id, plan] of FIGHTERS) {
      const built = applyBuild(POSE_TABLE.idle, plan.build)
      const r = headRadius(plan)
      const H = statureOf(built, r)
      const arm = naturalArmLengths(plan.build)
      const leg = naturalLegLengths(plan.build)
      const armH = (arm.upperN + arm.foreN) / H
      const legH = (leg.thighN + leg.shinN) / H
      const fistH = 8.8 / H
      const spec = WEAPONS[plan.weapon]
      const total = spec.head === 'bow' ? 2 * 26 : spec.length + (HEAD_EXT[spec.head] ?? 0)
      const weaponH = total / H
      const taper = dist(built.shoulderF, built.shoulderN) / dist(built.hipF, built.hipN)
      const torsoH = dist(built.chest, built.hip) / H
      const check = (label: string, v: number, lo: number, hi: number): void => {
        if (v < lo || v > hi) failures.push(`${id} ${label} ${v.toFixed(3)} outside [${lo}, ${hi}]`)
      }
      // Arm shoulder-to-palm ~0.29H anatomically; cast measures 0.26-0.27.
      check('arm/H', armH, 0.24, 0.3)
      // Leg hip-to-sole ~0.52H anatomically; the cast is compact-heroic
      // at 0.45-0.46 (shoulders sit slightly low, legs slightly short).
      check('leg/H', legH, 0.42, 0.49)
      // Hand wrist-to-tip ~0.11H anatomically; the fist cell is 8.8u.
      check('fist/H', fistH, 0.085, 0.115)
      // Polearms total 1.0-1.3H (丈八 pike longest, as the novel demands);
      // the jian is a large heroic sword; the bow at reference draw.
      if (['crescent', 'serpent', 'leaf', 'dao', 'ji'].includes(spec.head)) {
        check('polearm/H', weaponH, 1.0, 1.3)
      } else if (spec.head === 'jian') {
        check('sword/H', weaponH, 0.7, 1.0)
      } else {
        check('bow/H', weaponH, 0.45, 0.75)
      }
      // Athletic V-taper ~1.2-1.3; cast measures 1.25.
      check('shoulder:hip', taper, 1.1, 1.4)
      // Torso chest-to-hip ~0.30H anatomically; the cast is compact at
      // 0.24-0.26 (poses crouch from the hips, so a shorter torso keeps
      // heads clear of hafts - see the face gate).
      check('torso/H', torsoH, 0.22, 0.28)
    }
    expect(failures).toEqual([])
  })

  it('swings the free arm between the walk keys (one-handers)', () => {
    // BODY-22 motion fix: the free arm used to freeze at the idle offset
    // in walk0/walk1. One-handed fighters (sword/dao/bow) must show the
    // hand travel fore-aft between the keys while staying reachable and
    // out back of the torso (the BODY-15 visibility rule).
    for (const [id, plan] of FIGHTERS) {
      if (plan.weapon !== 'sword' && plan.weapon !== 'dao' && plan.weapon !== 'bow') continue
      const nat = naturalArmLengths(plan.build)
      const reachF = nat.upperF + nat.foreF
      const w0 = weaponPose(plan, applyBuild(POSE_TABLE.walk0, plan.build))
      const w1 = weaponPose(plan, applyBuild(POSE_TABLE.walk1, plan.build))
      // Total relocation (the arc runs diagonally up-back, not along x).
      const travel = dist(w0.handF, w1.handF)
      expect(travel, `${id} free hand frozen between walk keys`).toBeGreaterThanOrEqual(4)
      for (const [name, p] of [['walk0', w0], ['walk1', w1]] as const) {
        expect(dist(p.shoulderF, p.handF), `${id}:${name} far hand reach`).toBeLessThanOrEqual(reachF)
        expect(p.handF.x, `${id}:${name} far hand crosses the torso`).toBeLessThan(p.chest.x - 4)
      }
    }
  })

  it('keeps polearm haft grips fixed between the walk keys', () => {
    // Two-handed fighters do NOT swing: both hands stay on the haft while
    // marching (a carried polearm is stabilized, not waved). The far hand
    // must sit on the haft axis in both walk keys.
    for (const [id, plan] of FIGHTERS) {
      if (!['crescent', 'serpent', 'leaf', 'ji'].includes(WEAPONS[plan.weapon].head)) continue
      for (const name of ['walk0', 'walk1'] as const) {
        const p = weaponPose(plan, applyBuild(POSE_TABLE[name], plan.build))
        const gripDist = Math.abs(
          (p.handF.x - p.handN.x) * Math.sin(p.weaponRot) - (p.handF.y - p.handN.y) * Math.cos(p.weaponRot),
        )
        expect(gripDist, `${id}:${name} far hand off the haft`).toBeLessThan(3)
      }
    }
  })
})
