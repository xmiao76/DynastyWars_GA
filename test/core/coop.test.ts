import { describe, expect, it } from 'vitest'
import {
  createSim,
  joinPlayer2,
  leadPlayerOf,
  livingPlayersOf,
  nearestPlayerTo,
  playerOf,
  playersOf,
  snapshotSim,
  stepSim,
  tryRevivePlayer,
} from '../../src/core/sim'
import { makeCombatant } from '../../src/core/entities'
import { neutralInput, type InputState } from '../../src/core/types'

/**
 * Two-player co-op. The load-bearing property is that player two is ABSENT by
 * default and every multi-player branch collapses to the single-player
 * behaviour when they are - which is what lets the rest of the suite, and the
 * determinism guarantees it rests on, stay exactly as they were.
 */

function walk(dir: 'left' | 'right'): InputState {
  return { ...neutralInput(), [dir]: true }
}

function run(sim: ReturnType<typeof createSim>, ticks: number, p1: InputState, p2?: InputState): void {
  for (let i = 0; i < ticks; i += 1) stepSim(sim, p1, p2)
}

describe('co-op: player two is absent until they join', () => {
  it('a fresh sim has exactly one player and no second character', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    expect(sim.player2Id).toBeNull()
    expect(sim.char2Id).toBeNull()
    expect(playersOf(sim)).toHaveLength(1)
    expect(snapshotSim(sim).player2).toBeNull()
  })

  it('a second input is ignored entirely while nobody has joined', () => {
    const opts = { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 } as const
    const alone = createSim(42, { ...opts })
    const withGhostInput = createSim(42, { ...opts })
    run(alone, 240, walk('right'))
    // The same run, but feeding a busy second input that has no player behind it.
    for (let i = 0; i < 240; i += 1) {
      stepSim(withGhostInput, walk('right'), { ...neutralInput(), left: true, attackPressed: true })
    }
    expect(snapshotSim(withGhostInput)).toEqual(snapshotSim(alone))
  })
})

describe('co-op: joining', () => {
  it('drops player two in beside player one, once', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    expect(joinPlayer2(sim, 'guanyu')).toBe(true)
    expect(joinPlayer2(sim, 'zhangfei')).toBe(false) // already two players
    expect(playersOf(sim)).toHaveLength(2)
    const snap = snapshotSim(sim)
    expect(snap.player2).not.toBeNull()
    expect(snap.char2Id).toBe('guanyu')
    // Arrives near player one and briefly invulnerable, so joining a brawl in
    // progress is not an instant death.
    expect(Math.abs((snap.player2?.x ?? 0) - snap.player.x)).toBeLessThanOrEqual(40)
    expect(snap.player2?.invulnerable).toBe(true)
  })

  it('gives each player their own character sheet', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'zhangfei')
    const snap = snapshotSim(sim)
    // Zhao Yun and Zhang Fei do not share a max HP, so this proves player two
    // is not silently running on player one's stats.
    expect(snap.player2?.maxHp).not.toBe(snap.player.maxHp)
  })

  it('moves each player from its own input', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const before = snapshotSim(sim)
    run(sim, 60, walk('right'), walk('left'))
    const after = snapshotSim(sim)
    expect(after.player.x).toBeGreaterThan(before.player.x)
    expect(after.player2!.x).toBeLessThan(before.player2!.x)
  })
})

describe('co-op: the world orients on both players', () => {
  it('enemies chase whoever is nearest', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const [p1, p2] = playersOf(sim)
    p1!.x = 100
    p2!.x = 400
    expect(nearestPlayerTo(sim, 90, p1!.y).id).toBe(p1!.id)
    expect(nearestPlayerTo(sim, 410, p2!.y).id).toBe(p2!.id)
  })

  it('the camera follows whoever is furthest into the stage', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const [p1, p2] = playersOf(sim)
    p1!.x = 100
    p2!.x = 400
    expect(leadPlayerOf(sim).id).toBe(p2!.id)
    p1!.x = 900
    expect(leadPlayerOf(sim).id).toBe(p1!.id)
  })

  it('the run ends only when BOTH players are down', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const [p1, p2] = playersOf(sim)
    p1!.state = 'dead'
    stepSim(sim, neutralInput(), neutralInput())
    expect(sim.phase, 'one player down should not end the run').toBe('fight')
    expect(livingPlayersOf(sim)).toHaveLength(1)
    p2!.state = 'dead'
    stepSim(sim, neutralInput(), neutralInput())
    expect(sim.phase).toBe('gameover')
  })

  it('a continue can revive either player from the shared pool', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const p2 = playersOf(sim)[1]!
    p2.state = 'dead'
    const livesBefore = sim.lives
    expect(tryRevivePlayer(sim, p2.id)).toBe(true)
    expect(sim.lives).toBe(livesBefore - 1)
    expect(p2.state).not.toBe('dead')
    expect(playerOf(sim).state).not.toBe('dead')
  })
})

describe('co-op: determinism survives a second player', () => {
  it('two sims fed identical inputs stay bit-identical', () => {
    const opts = { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 } as const
    const a = createSim(7, { ...opts })
    const b = createSim(7, { ...opts })
    joinPlayer2(a, 'guanyu')
    joinPlayer2(b, 'guanyu')
    for (let i = 0; i < 600; i += 1) {
      const p1 = i % 3 === 0 ? { ...neutralInput(), attackPressed: true } : walk('right')
      const p2 = i % 5 === 0 ? { ...neutralInput(), jumpPressed: true } : walk('left')
      stepSim(a, p1, p2)
      stepSim(b, p1, p2)
    }
    expect(snapshotSim(a)).toEqual(snapshotSim(b))
  })
})

describe('co-op: things the world has only one of', () => {
  it('both players can pick items up, not just player one', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const p2 = playersOf(sim)[1]!
    p2.hp = 10
    // Drop food exactly where player two is standing.
    sim.entities.push(makeCombatant(95, 'meat', 'neutral', p2.x, p2.y, 1, 0, 'left'))

    stepSim(sim, neutralInput(), neutralInput())
    expect(p2.hp, 'player two walked over food and nothing happened').toBeGreaterThan(10)
  })

  it('two players cannot grab the same enemy', () => {
    const sim = createSim(42, { charId: 'zhaoyun', stageId: 'stage1', lives: 3, score: 0 })
    joinPlayer2(sim, 'guanyu')
    const enemy = sim.entities.find((e) => e.side === 'enemy')
    expect(enemy, 'stage 1 should have an enemy').toBeDefined()
    // Both players walk into the same enemy on the same tick.
    for (const p of playersOf(sim)) {
      p.x = enemy!.x - 8
      p.y = enemy!.y
      p.z = 0
    }
    stepSim(sim, walk('right'), walk('right'))
    const holders = playersOf(sim).filter((p) => enemy!.grabbedBy === p.id)
    expect(holders.length, 'an enemy should be held by at most one player').toBeLessThanOrEqual(1)
    expect(playersOf(sim).filter((p) => p.state === 'grab').length).toBeLessThanOrEqual(1)
  })
})
