import { describe, expect, it } from 'vitest'
import {
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
    // zy.jab1: 6 startup / 4 active / 10 recover. Boundaries are exact: the
    // tick the hitbox goes live is the tick the strike pose appears.
    const jab1 = { state: 'attack', attackId: 'zy.jab1' } as const
    expect(poseForEntity({ ...jab1, stateTick: 0 })).toBe('windup')
    expect(poseForEntity({ ...jab1, stateTick: 5 })).toBe('windup')
    expect(poseForEntity({ ...jab1, stateTick: 6 })).toBe('attack')
    expect(poseForEntity({ ...jab1, stateTick: 9 })).toBe('attack')
    expect(poseForEntity({ ...jab1, stateTick: 10 })).toBe('recover')
    expect(poseForEntity({ ...jab1, stateTick: 19 })).toBe('recover')
    // The finisher runs longer (8/5/16) and phases by its own windows.
    const fin = { state: 'attack', attackId: 'zy.finisher' } as const
    expect(poseForEntity({ ...fin, stateTick: 7 })).toBe('windup')
    expect(poseForEntity({ ...fin, stateTick: 8 })).toBe('attack')
    expect(poseForEntity({ ...fin, stateTick: 12 })).toBe('attack')
    expect(poseForEntity({ ...fin, stateTick: 13 })).toBe('recover')
    expect(poseForEntity({ ...fin, stateTick: 28 })).toBe('recover')
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

  it('the second combo hit strikes with the alternate pose', () => {
    // jab1 thrusts low and level; jab2 answers with the high backhand, so the
    // two read as different swings. Windup and recover are shared.
    const jab2 = { state: 'attack', attackId: 'zy.jab2' } as const
    expect(poseForEntity({ ...jab2, stateTick: 0 })).toBe('windup')
    expect(poseForEntity({ ...jab2, stateTick: 6 })).toBe('attack2')
    expect(poseForEntity({ ...jab2, stateTick: 9 })).toBe('attack2')
    expect(poseForEntity({ ...jab2, stateTick: 10 })).toBe('recover')
    // Every other strike in the game uses the standard pose, including the
    // finisher, the mounted sweep and the enemy swings.
    expect(poseForEntity({ state: 'attack', stateTick: 8, attackId: 'zy.finisher' })).toBe('attack')
    expect(poseForEntity({ state: 'attack', stateTick: 8, attackId: 'mounted.sweep' })).toBe('attack')
    expect(poseForEntity({ state: 'attack', stateTick: 14, attackId: 'soldier.swing' })).toBe('attack')
    expect(poseForEntity({ state: 'attack', stateTick: 20, attackId: 'spear.thrust' })).toBe('attack')
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
    expect(kinds.length).toBeGreaterThanOrEqual(18)
    for (const kind of kinds) {
      expect(artBoxFor(kind), `${kind} has no art box`).toBeDefined()
      expect(isPropKind(kind)).toBe(isVectorProp(kind))
    }
  })
})
