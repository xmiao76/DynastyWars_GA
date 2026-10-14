import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import {
  STRIKE_POSE,
  isPropKind,
  poseForEntity,
  textureKeyFor,
  textureKeyForPose,
} from '../../src/game/adapters/sprites'
import { artBoxFor, isVectorProp, vectorKinds } from '../../src/game/art/registry'

describe('sprite key conventions', () => {
  it('pose keys follow the entity:<kind>:<pose> convention', () => {
    expect(textureKeyForPose('zhaoyun', 'walk0')).toBe('entity:zhaoyun:walk0')
    expect(textureKeyFor('arrow')).toBe('entity:arrow')
    expect(textureKeyForPose('soldier', 'attack')).toBe('entity:soldier:attack')
  })

  it('props stay single-texture', () => {
    for (const kind of ['arrow', 'crate', 'meat', 'sword']) {
      expect(isPropKind(kind)).toBe(true)
    }
    expect(isPropKind('soldier')).toBe(false)
  })

  it('walk pose alternates with stateTick; downed states use the lying pose', () => {
    expect(poseForEntity({ state: 'walk', stateTick: 0, attackId: null })).toBe('walk0')
    expect(poseForEntity({ state: 'walk', stateTick: 10, attackId: null })).toBe('walk1')
    expect(poseForEntity({ state: 'walk', stateTick: 20, attackId: null })).toBe('walk0')
    expect(poseForEntity({ state: 'knockdown', stateTick: 0, attackId: null })).toBe('down')
    expect(poseForEntity({ state: 'dying', stateTick: 0, attackId: null })).toBe('down')
    expect(poseForEntity({ state: 'jump', stateTick: 3, attackId: null })).toBe('jump')
    expect(poseForEntity({ state: 'idle', stateTick: 0, attackId: null })).toBe('idle')
  })

  it('attacks phase through windup, strike and recover by frame window', () => {
    // zy.jab1: 5 startup / 3 active / 8 recover. Boundaries are exact: the
    // tick the hitbox goes live is the tick the strike pose appears.
    const jab1 = { state: 'attack', attackId: 'zy.jab1' } as const
    expect(poseForEntity({ ...jab1, stateTick: 0 })).toBe('windup')
    expect(poseForEntity({ ...jab1, stateTick: 4 })).toBe('windup')
    expect(poseForEntity({ ...jab1, stateTick: 5 })).toBe('attack')
    expect(poseForEntity({ ...jab1, stateTick: 7 })).toBe('attack')
    expect(poseForEntity({ ...jab1, stateTick: 8 })).toBe('recover')
    expect(poseForEntity({ ...jab1, stateTick: 15 })).toBe('recover')
    // The finisher runs longer (7/4/13) and phases by its own windows, striking
    // with Zhao Yun's mapped pose (thrust).
    const fin = { state: 'attack', attackId: 'zy.finisher' } as const
    expect(poseForEntity({ ...fin, stateTick: 6 })).toBe('windup')
    expect(poseForEntity({ ...fin, stateTick: 7 })).toBe('thrust')
    expect(poseForEntity({ ...fin, stateTick: 10 })).toBe('thrust')
    expect(poseForEntity({ ...fin, stateTick: 11 })).toBe('recover')
    expect(poseForEntity({ ...fin, stateTick: 23 })).toBe('recover')
    // Per-hero frame data drives phasing: Guan Yu's heavy jab (8/5/14)
    // telegraphs longer, Zhang Fei's sweeping finisher (10/6/18) longer still.
    // Each strikes with its own mapped pose (sweep in both cases here).
    const gy = { state: 'attack', attackId: 'gy.jab1' } as const
    expect(poseForEntity({ ...gy, stateTick: 7 })).toBe('windup')
    expect(poseForEntity({ ...gy, stateTick: 8 })).toBe('sweep')
    expect(poseForEntity({ ...gy, stateTick: 12 })).toBe('sweep')
    expect(poseForEntity({ ...gy, stateTick: 13 })).toBe('recover')
    const zf = { state: 'attack', attackId: 'zf.finisher' } as const
    expect(poseForEntity({ ...zf, stateTick: 9 })).toBe('windup')
    expect(poseForEntity({ ...zf, stateTick: 10 })).toBe('sweep')
    expect(poseForEntity({ ...zf, stateTick: 15 })).toBe('sweep')
    expect(poseForEntity({ ...zf, stateTick: 16 })).toBe('recover')
    // Enemies phase by the same rule: the soldier telegraphs for 14 ticks.
    const sol = { state: 'attack', attackId: 'soldier.swing' } as const
    expect(poseForEntity({ ...sol, stateTick: 0 })).toBe('windup')
    expect(poseForEntity({ ...sol, stateTick: 13 })).toBe('windup')
    expect(poseForEntity({ ...sol, stateTick: 14 })).toBe('attack')
    expect(poseForEntity({ ...sol, stateTick: 17 })).toBe('attack')
    expect(poseForEntity({ ...sol, stateTick: 18 })).toBe('recover')
    // Jump attacks use their own def (4/20/0): a long strike, then recover
    // for whatever airtime remains - the weapon visibly comes back down.
    const jk = { state: 'jumpattack', attackId: 'zy.jumpkick' } as const
    expect(poseForEntity({ ...jk, stateTick: 3 })).toBe('windup')
    expect(poseForEntity({ ...jk, stateTick: 4 })).toBe('attack')
    expect(poseForEntity({ ...jk, stateTick: 23 })).toBe('attack')
    expect(poseForEntity({ ...jk, stateTick: 24 })).toBe('recover')
    // Melee specials strike with the special pose, phased like everything else.
    const sp = { state: 'special', attackId: 'zy.special' } as const
    expect(poseForEntity({ ...sp, stateTick: 5 })).toBe('windup')
    expect(poseForEntity({ ...sp, stateTick: 6 })).toBe('special')
    expect(poseForEntity({ ...sp, stateTick: 17 })).toBe('special')
    expect(poseForEntity({ ...sp, stateTick: 18 })).toBe('recover')
  })

  it('every hero combo hit strikes with its mapped pose', () => {
    // Each hero's (jab1, jab2, finisher) is three distinct poses, and no two
    // heroes share the same ordered triple - the ENH-5 weapon-true mapping.
    // Windup and recover are still shared.
    const TRIPLES: Record<string, [string, string, string]> = {
      gy: ['sweep', 'attack', 'chop'],
      zf: ['thrust', 'attack2', 'sweep'],
      zy: ['attack', 'attack2', 'thrust'],
      hz: ['thrust', 'chop', 'sweep'],
      wy: ['attack', 'sweep', 'chop'],
    }
    for (const [hero, triple] of Object.entries(TRIPLES)) {
      // Distinct within the hero.
      expect(new Set(triple).size, `${hero} combo repeats a pose`).toBe(3)
      for (const [i, hit] of ['jab1', 'jab2', 'finisher'].entries()) {
        const id = `${hero}.${hit}`
        const def = attackById(id)
        expect(
          poseForEntity({ state: 'attack', stateTick: def.startup, attackId: id }),
          `${id} strike pose`,
        ).toBe(triple[i])
        expect(poseForEntity({ state: 'attack', stateTick: 0, attackId: id })).toBe('windup')
        expect(
          poseForEntity({ state: 'attack', stateTick: def.startup + def.active, attackId: id }),
        ).toBe('recover')
      }
    }
    // Distinct across heroes: no two ordered triples agree.
    const seen = new Set(Object.values(TRIPLES).map((t) => t.join(',')))
    expect(seen.size, 'two heroes share a combo triple').toBe(5)
    // Enemies keep the standard strike pose.
    expect(poseForEntity({ state: 'attack', stateTick: 14, attackId: 'soldier.swing' })).toBe('attack')
    expect(poseForEntity({ state: 'attack', stateTick: 20, attackId: 'spear.thrust' })).toBe('attack')
  })

  it('strike-pose selection is table-driven by full attack id, not the suffix', () => {
    expect(STRIKE_POSE).toEqual({
      'gy.jab1': 'sweep',
      'gy.jab2': 'attack',
      'gy.finisher': 'chop',
      'zf.jab1': 'thrust',
      'zf.jab2': 'attack2',
      'zf.finisher': 'sweep',
      'zy.jab1': 'attack',
      'zy.jab2': 'attack2',
      'zy.finisher': 'thrust',
      'hz.jab1': 'thrust',
      'hz.jab2': 'chop',
      'hz.finisher': 'sweep',
      'wy.jab1': 'attack',
      'wy.jab2': 'sweep',
      'wy.finisher': 'chop',
    })
    // The mapping decides: repointing one entry moves its strike pose even
    // though the id suffix never changed. Restored before returning.
    const saved = STRIKE_POSE['zy.jab1']
    STRIKE_POSE['zy.jab1'] = 'attack2'
    try {
      expect(poseForEntity({ state: 'attack', stateTick: 5, attackId: 'zy.jab1' })).toBe('attack2')
    } finally {
      if (saved !== undefined) STRIKE_POSE['zy.jab1'] = saved
    }
    expect(poseForEntity({ state: 'attack', stateTick: 5, attackId: 'zy.jab1' })).toBe('attack')
  })

  it('zero-length windows skip phases without special-casing', () => {
    // Huang Zhong's special is an arrow shot: 4 ticks of draw, no strike at
    // all, then follow-through. The generic rule produces exactly that.
    const hz = { state: 'special', attackId: 'hz.special' } as const
    expect(poseForEntity({ ...hz, stateTick: 3 })).toBe('windup')
    expect(poseForEntity({ ...hz, stateTick: 4 })).toBe('recover')
    expect(poseForEntity({ ...hz, stateTick: 17 })).toBe('recover')
    // A fully zero def (projectile impact data) lands straight in recover.
    expect(poseForEntity({ state: 'attack', stateTick: 0, attackId: 'arrow.hit' })).toBe('recover')
  })

  it('a missing or unknown attack id renders the old single pose', () => {
    // The grab-break path nulls the id mid-state; the archer carries ''.
    // Either way the fighter renders as it always did rather than crashing.
    expect(poseForEntity({ state: 'attack', stateTick: 3, attackId: null })).toBe('attack')
    expect(poseForEntity({ state: 'attack', stateTick: 3, attackId: '' })).toBe('attack')
    expect(poseForEntity({ state: 'attack', stateTick: 3, attackId: 'no.such.attack' })).toBe('attack')
    expect(poseForEntity({ state: 'jumpattack', stateTick: 3, attackId: null })).toBe('attack')
    expect(poseForEntity({ state: 'special', stateTick: 2, attackId: null })).toBe('special')
  })

  it('the special and taking a hit have poses of their own', () => {
    // Both used to fall through. The special reused the attack pose, so the
    // move that costs health looked exactly like the one that does not, and
    // hitstun showed only as a red tint over a perfectly still idle figure.
    expect(poseForEntity({ state: 'special', stateTick: 2, attackId: null })).toBe('special')
    expect(poseForEntity({ state: 'hitstun', stateTick: 2, attackId: null })).toBe('hurt')
  })

  it('every texture key the binding can produce has art registered', () => {
    // Counted rather than merely iterated: an emptied registry would otherwise
    // make this loop over nothing and pass.
    const kinds = vectorKinds()
    expect(kinds.length).toBeGreaterThanOrEqual(15)
    for (const kind of kinds) {
      expect(artBoxFor(kind), `${kind} has no art box`).toBeDefined()
      expect(isPropKind(kind)).toBe(isVectorProp(kind))
    }
  })
})
