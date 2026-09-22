import { describe, expect, it } from 'vitest'
import { nextComboAttack, ZHAO_YUN } from '../../src/core/characters'
import { createSim, drainSimEvents, playerOf, snapshotSim, stepSim } from '../../src/core/sim'
import { neutralInput, type InputState } from '../../src/core/types'

function firstSoldier(sim: ReturnType<typeof createSim>) {
  const soldier = sim.entities.find((e) => e.side === 'enemy')
  if (!soldier) throw new Error('no soldier in sim')
  return soldier
}

describe('createSim wave-1 spawns', () => {
  it('produces deterministic spawn positions from the seed', () => {
    const a = createSim(42)
    const b = createSim(42)
    const positionsA = snapshotSim(a).enemies.map(({ x, y }) => ({ x, y }))
    const positionsB = snapshotSim(b).enemies.map(({ x, y }) => ({ x, y }))
    expect(positionsA).toEqual(positionsB)
    expect(positionsA).toHaveLength(4)
    // Pinned values guard against accidental spawn-table or RNG drift.
    expect(positionsA).toEqual([
      { x: 442, y: 206 },
      { x: 494, y: 193 },
      { x: 535, y: 214 },
      { x: 589, y: 196 },
    ])

    const c = createSim(43)
    const positionsC = snapshotSim(c).enemies.map(({ x, y }) => ({ x, y }))
    expect(positionsC).not.toEqual(positionsA)
  })
})

describe('combo data', () => {
  it('chains jab1 -> jab2 -> finisher, then ends', () => {
    expect(nextComboAttack(ZHAO_YUN, 'zy.jab1')).toBe('zy.jab2')
    expect(nextComboAttack(ZHAO_YUN, 'zy.jab2')).toBe('zy.finisher')
    expect(nextComboAttack(ZHAO_YUN, 'zy.finisher')).toBeUndefined()
  })
})

describe('combat', () => {
  it('kills a soldier in 4 hits: the full combo plus the next jab', () => {
    const sim = createSim(42)
    const player = playerOf(sim)
    const soldier = firstSoldier(sim)
    // Stage the duel inside the camera view (away from the lock clamp at
    // x=368): stand adjacent, face the soldier, mash attack on a fixed cadence.
    soldier.x = 240
    player.x = 220
    player.y = soldier.y
    player.facing = 'right'

    let hits = 0
    const damages: number[] = []
    let hpAfterTwoHits: number | null = null
    for (let t = 0; t < 1200 && soldier.hp > 0; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === soldier.id) {
          hits += 1
          damages.push(event.damage)
          if (hits === 2) {
            hpAfterTwoHits = soldier.hp
            // After two landed hits the soldier is hurt but still standing.
            expect(soldier.state).not.toBe('dying')
          }
        }
      }
    }
    expect(hits).toBe(4)
    // Deterministic trace for seed 42 with this staging: Zhao Yun's 6/6/10
    // combo deals 22 to a 24-hp soldier, so the next cycle's jab1 finishes it.
    expect(damages).toEqual([6, 6, 10, 6])
    expect(hpAfterTwoHits).toBe(12)
    expect(['dying', 'dead']).toContain(soldier.state)
  })

  it('a soldier swing damages the player', () => {
    const sim = createSim(42)
    const player = playerOf(sim)
    const soldier = firstSoldier(sim)
    // Same staging: inside the camera view, adjacent to the soldier.
    soldier.x = 240
    player.x = 220
    player.y = soldier.y

    let sawHitOnPlayer = false
    for (let t = 0; t < 300 && !sawHitOnPlayer; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === player.id) sawHitOnPlayer = true
      }
    }
    expect(sawHitOnPlayer).toBe(true)
    expect(player.hp).toBeLessThan(player.maxHp)
    expect(player.hp).toBeGreaterThan(0)
  })
})

describe('determinism keystone', () => {
  it('twin sims with identical inputs stay bit-identical for 600 ticks', () => {
    // A fixed pseudo-scripted input pattern exercises movement, attacks,
    // enemy AI decisions, and combat resolution.
    const script = (t: number): InputState => ({
      up: t % 40 < 10,
      down: t % 40 >= 20 && t % 40 < 30,
      left: t % 30 >= 15,
      right: t % 30 < 15,
      attackPressed: t % 12 === 0,
      jumpPressed: t % 90 === 0,
      specialPressed: t % 150 === 45,
    })
    const a = createSim(7)
    const b = createSim(7)
    for (let t = 0; t < 600; t += 1) {
      const input = script(t)
      stepSim(a, input)
      stepSim(b, input)
    }
    expect(JSON.stringify(snapshotSim(a))).toBe(JSON.stringify(snapshotSim(b)))
    // The RNG is closure-based and invisible to serialization; compare a draw.
    expect(a.rng.next()).toBe(b.rng.next())
  })
})
