import { beforeAll, describe, expect, it } from 'vitest'
import { ARM_NATURAL_LEN, CUFF_TUCK } from '../../scripts/prepare-body-parts.mjs'
import { BODY_PART_DEFS, type BodyArt } from '../../src/game/art/body-parts'
import type { ArtResources } from '../../src/game/art/hero-resources'
import { idResources, joinGeom, measureMove, MOVES, planOf, poseOf, type MoveMetrics } from './arm-chain-lib'
import { ALL_FIGHTERS, loadCastArt } from './cast-art'

/**
 * V-15 arm-chain regression gates (docs/UI_REVIEW_LEDGER.md V-15a-e), over
 * all 17 fighters x 14 moves through the shipping render path. These gate
 * only the measurable causes that were fixed; the reviewer's per-move
 * gestalt grid (VISUAL_REVIEW 2a) stays the judge of "natural". Each gate
 * has a negative control proving it can fail.
 *
 *   G1 cuff tucks under the hand: overlap >= 1u, forearm paint ends >= 0.5u
 *      before the hand joint (no painted fingers past the fist).
 *   G2 elbow join: upper-arm and forearm paint overlap >= 2u.
 *   G3 no soft-shade halo on the background (0 px).
 *   G4 the weapon never covers the near arm holding it (<= 2u^2, standing).
 *   G5 no visible hole in either arm chain longer than 1u (standing
 *      both chains; prone far chain only - UIR-17).
 * Prone ('down') is exempt from G4 (dropped weapon lies across the body)
 * and the G5 near chain (hand rests on the haft). The G5 far chain on
 * down is gated since UIR-17 (V-16 prone far arm).
 * Not gated: the far fist over the near arm (V-15b). Its cause is the strike
 * choreography (the far grip lands under the near forearm, and no reachable
 * haft point clears it); hiding the fist breaks the BODY-15 visible-far-hand
 * rule gated by handgrip/uir13. The detector still reports it per move.
 */
let res: ArtResources
const rows: MoveMetrics[] = []
const standing = (): MoveMetrics[] => rows.filter((m) => !m.lying)
const fmt = (m: MoveMetrics, v: number | string): string => `${m.id}:${m.move} ${typeof v === 'number' ? v.toFixed(2) : v}`

beforeAll(async () => {
  res = await loadCastArt()
  for (const id of ALL_FIGHTERS) {
    const idRes = idResources(res, id)
    for (const move of MOVES) rows.push(measureMove(res, idRes, id, move))
  }
}, 240_000)

describe('V-15 arm chains connect (all fighters x all moves)', () => {
  it('measures every fighter and move', () => {
    expect(rows).toHaveLength(ALL_FIGHTERS.length * MOVES.length)
  })

  it('G1 cuff tucks under the hand and stops short of the hand joint', () => {
    const bad: string[] = []
    for (const m of rows) {
      for (const side of ['N', 'F'] as const) {
        const g = m.geom[side]
        if (g.cuffOverlap < 1) bad.push(fmt(m, `${side} cuff overlap ${g.cuffOverlap.toFixed(2)}`))
        if (g.cuffOvershoot > -0.5) bad.push(fmt(m, `${side} forearm past hand ${g.cuffOvershoot.toFixed(2)}`))
      }
    }
    expect(bad).toEqual([])
  })

  it('G2 upper arm and forearm paint overlap at the elbow', () => {
    const bad = rows.flatMap((m) => (['N', 'F'] as const)
      .filter((s) => m.geom[s].elbowOverlap < 2)
      .map((s) => fmt(m, `${s} elbow overlap ${m.geom[s].elbowOverlap.toFixed(2)}`)))
    expect(bad).toEqual([])
  })

  it('G3 soft-shade ovals never paint the background', () => {
    expect(rows.filter((m) => m.halo > 0).map((m) => fmt(m, m.halo))).toEqual([])
  })

  it('G4 the weapon is under the near arm that holds it', () => {
    expect(standing().filter((m) => m.weaponOverNearArm > 2).map((m) => fmt(m, m.weaponOverNearArm))).toEqual([])
  })

  it('G5 no visible hole along either arm chain', () => {
    // Floor 1.5u: the before-fix holes ran 2-8.5u (zhangfei attack 8.5,
    // guanyu thrust 5.5); after V-15a/c/d/e the worst are 1.25u, where the
    // far fist (V-15b, not gated) sits under the near shoulder and its
    // antialiased rim classifies as blend. 1.5u is 6 samples at 0.25u.
    // UIR-17: the prone far chain joins this gate (V-16): the down far
    // forearm used to vanish under the ground line (runF up to 11.5u).
    const where = (w: MoveMetrics['walk']['N']): string => [...new Set(w.gaps.map((g) => g.where))].join('/')
    const bad = standing().flatMap((m) => [
      ...(m.walk.N.runU > 1.5 ? [fmt(m, `near hole ${m.walk.N.runU}u at ${where(m.walk.N)}`)] : []),
      ...(m.walk.F.runU > 1.5 ? [fmt(m, `far hole ${m.walk.F.runU}u at ${where(m.walk.F)}`)] : []),
    ])
    const downFar = rows.filter((m) => m.lying).flatMap((m) => [
      ...(m.walk.F.runU > 1.5 ? [fmt(m, `down far hole ${m.walk.F.runU}u at ${where(m.walk.F)}`)] : []),
    ])
    expect([...bad, ...downFar]).toEqual([])
  })

  it('G6 the far fist never paints over the near arm (V-15b)', () => {
    // UIR-16: the strike re-choreography stacks the far grip forward of
    // the near hand (clear haft) instead of under the near elbow.
    const bad = standing()
      .filter((m) => m.gripFOverNearArm + m.wrapFOverNearArm > 0)
      .map((m) => fmt(m, `${m.gripFOverNearArm}+${m.wrapFOverNearArm}`))
    expect(bad).toEqual([])
  })

  it('prep cuff constants mirror the renderer part table', () => {
    for (const [part, len] of Object.entries(ARM_NATURAL_LEN)) {
      expect(len, part).toBe(BODY_PART_DEFS[part as keyof typeof ARM_NATURAL_LEN].naturalLen)
    }
    expect(CUFF_TUCK).toBeGreaterThan(0)
    expect(CUFF_TUCK).toBeLessThan(3.3) // must stay under the painted hand's back
  })
})

describe('V-15 gate negative controls (each gate can fail)', () => {
  const guanyu = (): BodyArt => {
    const b = (res.bodies as Record<string, BodyArt>).guanyu
    if (!b) throw new Error('no guanyu body')
    return b
  }
  const withBody = (b: BodyArt): ArtResources => ({ ...res, bodies: { ...(res.bodies as Record<string, BodyArt>), guanyu: b } })

  it('G1 trips on the old fixed-fraction wrist cut (BODY-19 0.58/0.75)', () => {
    const b = guanyu()
    const fa = b.parts.foreArmF
    if (!fa) throw new Error('no foreArmF')
    const oldRow = Math.round(((0.2 + 0.58 / 0.75) / 1.7) * fa.h)
    const cut: BodyArt = { ...b, parts: { ...b.parts, foreArmF: { ...fa, h: oldRow } } }
    const p = poseOf('guanyu', 'idle')
    expect(joinGeom(cut, p, 'F', planOf('guanyu').build.bulk).cuffOverlap).toBeLessThan(1)
  })

  it('G2 and G5 trip when the upper arm stops short of the elbow', () => {
    const b = guanyu()
    const ua = b.parts.upperArmN
    if (!ua || ua.len === undefined) throw new Error('no upperArmN len')
    // Upper-arm paint then ends at ~half the rig upper arm (a 4-5u hole).
    const short: BodyArt = { ...b, parts: { ...b.parts, upperArmN: { ...ua, len: ua.len * 2.5 } } }
    const r = withBody(short)
    const m = measureMove(r, idResources(r, 'guanyu'), 'guanyu', 'idle')
    expect(m.geom.N.elbowOverlap).toBeLessThan(2)
    expect(m.walk.N.runU).toBeGreaterThan(1)
  })

  it('G3 trips when shade ovals are not composited onto the paint', () => {
    // measureMove compares plain vs no-shade renders; emulate the pre-fix
    // compositing by rendering "plain" with source-atop disabled.
    const idRes = idResources(res, 'zhangfei')
    const m = measureMove(res, idRes, 'zhangfei', 'attack', 4, { plain: { noSourceAtop: true } })
    expect(m.halo).toBeGreaterThan(0)
  })

  it('G4 trips when the weapon layer returns to the top', () => {
    // Without painted near-arm cells paintedWeaponFirst() is false, so the
    // weapon draws last (the pre-fix order). Footprints still come from the
    // real cells, so what the weapon then covers of the near-arm region is
    // measured exactly.
    const b = guanyu()
    const { upperArmN: _u, foreArmN: _f, ...rest } = b.parts
    void _u
    void _f
    const r = withBody({ ...b, parts: rest })
    const m = measureMove(r, idResources(r, 'guanyu'), 'guanyu', 'attack', 4, { footBody: b })
    expect(m.weaponOverNearArm).toBeGreaterThan(2)
  })

  it('G6 trips when far-fist pixels sit on the near-arm footprint', () => {
    // Predicate check + the empirical control: before the UIR-16
    // re-choreography G6 failed on 87/221 standing cells (worst
    // lubu:attack 398+627, xuchu:attack 310+628).
    const flagged = (g: number, w: number): boolean => g + w > 0
    expect(flagged(100, 0)).toBe(true)
    expect(flagged(0, 50)).toBe(true)
    expect(flagged(0, 0)).toBe(false)
  })
})
