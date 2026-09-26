import { describe, expect, it } from 'vitest'
import { HAFT_MIN_SEP, ikHeadRadius, naturalArmLengths, solveArm } from '../../src/game/art/armik'
import { headRadius } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, WEAPONS } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, type Pt } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'

/**
 * BODY-19 measurable acceptance: two-bone IK arms with constant natural
 * segment lengths. Before the fix, elbows came from the frozen pose table
 * while hands were choreographed per weapon, so arm segments stretched to
 * 128% (near) and ~150% (far, idle) across movements.
 */
const POSES = Object.keys(POSE_TABLE) as PoseName[]
const FIGHTERS = Object.entries({ ...HERO_FIGURES, ...ENEMY_FIGURES })
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y)

describe('BODY-19 IK arms', () => {
  it('holds every arm segment within 95-105% of natural length in every movement', () => {
    const failures: string[] = []
    let worst = 1
    let worstAt = ''
    for (const [id, plan] of FIGHTERS) {
      const nat = naturalArmLengths(plan.build)
      for (const name of POSES) {
        const p = weaponPose(plan, applyBuild(POSE_TABLE[name], plan.build))
        const segs: Array<[string, number, number]> = [
          ['upperN', dist(p.shoulderN, p.elbowN), nat.upperN],
          ['foreN', dist(p.elbowN, p.handN), nat.foreN],
          ['upperF', dist(p.shoulderF, p.elbowF), nat.upperF],
          ['foreF', dist(p.elbowF, p.handF), nat.foreF],
        ]
        for (const [seg, got, want] of segs) {
          const ratio = got / want
          if (Math.abs(ratio - 1) > Math.abs(worst - 1)) { worst = ratio; worstAt = `${id}:${name}:${seg}` }
          if (ratio < 0.95 || ratio > 1.05) {
            failures.push(`${id}:${name}:${seg} ${got.toFixed(2)}/${want.toFixed(2)} = ${ratio.toFixed(3)}`)
          }
        }
      }
    }
    expect(failures).toEqual([])
    // Record, not gate: IK solves exact lengths, so this should sit at 1.0.
    expect(Math.abs(worst - 1), `worst segment drift at ${worstAt}`).toBeLessThan(0.02)
  })

  it('keeps natural arm lengths anatomically sane for every build', () => {
    // Guards the tautology (IK is exact against its own naturals): naturals
    // must look like arms - upper and forearm each 10-17u at height 1, and
    // the two sides must agree within 15%.
    for (const [id, plan] of FIGHTERS) {
      const nat = naturalArmLengths(plan.build)
      const h = plan.build.height
      for (const [seg, len] of Object.entries(nat)) {
        expect(len / h, `${id}:${seg}`).toBeGreaterThan(10)
        expect(len / h, `${id}:${seg}`).toBeLessThan(17)
      }
      expect(nat.upperN / nat.upperF, `${id} upper-arm asymmetry`).toBeGreaterThan(0.85)
      expect(nat.upperN / nat.upperF, `${id} upper-arm asymmetry`).toBeLessThan(1.15)
      expect(nat.foreN / nat.foreF, `${id} forearm asymmetry`).toBeGreaterThan(0.85)
      expect(nat.foreN / nat.foreF, `${id} forearm asymmetry`).toBeLessThan(1.15)
    }
  })

  it('never protracts a shoulder out of the torso', () => {
    // Overreach lunges the shoulder instead of stretching the arm; the
    // shoulder must stay inside the torso silhouette (worst case measured
    // ~6u on broad-shouldered thrusts; torso half-width is ~12u).
    let worst = 0
    let worstAt = ''
    for (const [id, plan] of FIGHTERS) {
      const nat = naturalArmLengths(plan.build)
      for (const name of POSES) {
        const built = applyBuild(POSE_TABLE[name], plan.build)
        const p = weaponPose(plan, built)
        const limN = nat.upperN + nat.foreN
        const limF = nat.upperF + nat.foreF
        const reachN = dist(built.shoulderN, p.handN)
        const reachF = dist(built.shoulderF, p.handF)
        // Mirror of solveArm: protract past straight to 99.5% of reach.
        const proN = reachN > limN ? reachN - limN * 0.995 : 0
        const proF = reachF > limF ? reachF - limF * 0.995 : 0
        // The solved shoulder must match the protraction the reach implies.
        expect(dist(p.shoulderN, built.shoulderN), `${id}:${name} near protraction`).toBeLessThanOrEqual(proN + 0.01)
        expect(dist(p.shoulderF, built.shoulderF), `${id}:${name} far protraction`).toBeLessThanOrEqual(proF + 0.01)
        for (const [at, v] of [[`${id}:${name}:N`, proN], [`${id}:${name}:F`, proF]] as const) {
          if (v > worst) { worst = v; worstAt = at }
        }
        expect(proN, `${id}:${name} near shoulder leaves the torso`).toBeLessThanOrEqual(7)
        expect(proF, `${id}:${name} far shoulder leaves the torso`).toBeLessThanOrEqual(7)
      }
    }
    expect(worst, `worst protraction at ${worstAt}`).toBeGreaterThanOrEqual(0)
  })

  it('places the far hand on a reachable haft point with fist separation', () => {
    const failures: string[] = []
    for (const [id, plan] of FIGHTERS) {
      const nat = naturalArmLengths(plan.build)
      const reachF = nat.upperF + nat.foreF
      const twoHanded = ['crescent', 'serpent', 'leaf', 'ji'].includes(WEAPONS[plan.weapon].head)
      for (const name of POSES) {
        if (name === 'down') continue
        const p = weaponPose(plan, applyBuild(POSE_TABLE[name], plan.build))
        const d = dist(p.shoulderF, p.handF)
        if (d > reachF * 1.0) failures.push(`${id}:${name} far hand out of reach ${d.toFixed(1)}/${reachF.toFixed(1)}`)
        if (!twoHanded) continue
        const gripDist = Math.abs(
          (p.handF.x - p.handN.x) * Math.sin(p.weaponRot) - (p.handF.y - p.handN.y) * Math.cos(p.weaponRot),
        )
        const spec = WEAPONS[plan.weapon]
        const along =
          (p.handF.x - p.handN.x) * Math.cos(p.weaponRot) + (p.handF.y - p.handN.y) * Math.sin(p.weaponRot)
        const gripping = gripDist < 3
        if (!gripping) continue // relaxed fallback: allowed, reach-checked above
        if (Math.abs(along) < HAFT_MIN_SEP - 1e-6) {
          failures.push(`${id}:${name} fists ${Math.abs(along).toFixed(1)}u apart on the haft`)
        }
        // On the haft proper: off the butt fitting and the ferrule/blade.
        if (along < -spec.length * p.weaponGrip + 4 || along > spec.length * (1 - p.weaponGrip) - 14) {
          failures.push(`${id}:${name} far hand off the haft at ${along.toFixed(1)}u`)
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('matches draw.headRadius across builds (shared constant)', () => {
    for (const [, plan] of FIGHTERS) {
      expect(ikHeadRadius(plan.build.head)).toBe(headRadius(plan))
    }
  })

  it('solves textbook two-bone cases', () => {
    // Straight arm: elbow on the line.
    const straight = solveArm({ x: 0, y: 0 }, { x: 24, y: 0 }, { x: 12, y: -3 }, 12, 12)
    expect(straight.elbow.x).toBeCloseTo(12, 6)
    expect(straight.elbow.y).toBeCloseTo(0, 6)
    expect(straight.protracted).toBe(0)
    // Right-angle reach: elbow at the corner nearest the hint.
    const bent = solveArm({ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 6, y: 6 }, 6 * Math.SQRT2, 6 * Math.SQRT2)
    expect(bent.elbow.x).toBeCloseTo(6, 6)
    expect(bent.elbow.y).toBeCloseTo(6, 6)
    // Out of reach: shoulder protracts, segments stay exact.
    const far = solveArm({ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 12, y: -3 }, 12, 12)
    expect(far.protracted).toBeCloseTo(30 - 24 * 0.995, 6)
    expect(dist(far.shoulder, far.elbow)).toBeCloseTo(12, 6)
    expect(dist(far.elbow, { x: 30, y: 0 })).toBeCloseTo(12, 6)
  })
})
