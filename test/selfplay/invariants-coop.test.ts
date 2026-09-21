import { describe, expect, it } from 'vitest'
import { createSim, joinPlayer2, playersOf, snapshotSim } from '../../src/core/sim'
import { checkInvariants } from '../../selfplay/invariants'
import type { GameSnapshot } from '../../src/game/debug/bridge'

/**
 * The self-play invariants used to examine player one only, so a co-op run
 * could go green while the second player drifted out of the walk band, went
 * NaN, or healed past their own maximum. These prove the checker now looks.
 */

function snapshotOf(sim: ReturnType<typeof createSim>): GameSnapshot {
  return {
    scene: 'game',
    tick: sim.tick,
    sim: snapshotSim(sim),
    sfxPlayed: 0,
    muted: false,
  } as GameSnapshot
}

function coopSim(): ReturnType<typeof createSim> {
  const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
  joinPlayer2(sim, 'guanyu')
  return sim
}

describe('self-play invariants cover player two', () => {
  it('a healthy co-op snapshot reports nothing', () => {
    expect(checkInvariants(snapshotOf(coopSim()))).toEqual([])
  })

  it('catches player two healed past their own maximum', () => {
    const sim = coopSim()
    const p2 = playersOf(sim)[1]!
    p2.hp = p2.maxHp + 40
    const violations = checkInvariants(snapshotOf(sim))
    expect(violations.some((v) => v.check === 'hp-capped' && v.detail.includes('player2'))).toBe(true)
  })

  it('catches player two leaving the walk band', () => {
    const sim = coopSim()
    const p2 = playersOf(sim)[1]!
    p2.y = sim.stage.walkBandBottom + 200
    const violations = checkInvariants(snapshotOf(sim))
    expect(violations.some((v) => v.check === 'y-in-band' && v.detail.includes('player2'))).toBe(true)
  })

  it('catches player two going non-finite', () => {
    const sim = coopSim()
    const p2 = playersOf(sim)[1]!
    p2.x = Number.NaN
    const violations = checkInvariants(snapshotOf(sim))
    expect(violations.some((v) => v.check === 'coords-finite' && v.detail.includes('player2'))).toBe(true)
  })

  it('still reports nothing for a solo snapshot, where player two is absent', () => {
    const solo = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    expect(checkInvariants(snapshotOf(solo))).toEqual([])
  })
})
