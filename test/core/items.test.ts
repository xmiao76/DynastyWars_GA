import { describe, expect, it } from 'vitest'
import { makeCombatant } from '../../src/core/entities'
import { CRATE_LOOT, ENEMY_DROP, rollLoot } from '../../src/core/items'
import { createRng } from '../../src/core/rng'
import { createSim, drainSimEvents, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

describe('loot tables', () => {
  it('rollLoot is deterministic from the seed', () => {
    const rolls = (seed: number) => {
      const rng = createRng(seed)
      return Array.from({ length: 8 }, () => rollLoot(rng, CRATE_LOOT))
    }
    expect(rolls(42)).toEqual(rolls(42))
    // Pinned sequence guards table/RNG drift.
    expect(rolls(42)).toEqual(['meat', 'meat', 'sword', 'meat', null, 'meat', null, 'meat'])
  })

  it('enemy drop table rolls deterministically too', () => {
    const rng = createRng(7)
    const drops = Array.from({ length: 8 }, () => rollLoot(rng, ENEMY_DROP))
    expect(drops).toEqual(rolls7())
    function rolls7() {
      const again = createRng(7)
      return Array.from({ length: 8 }, () => rollLoot(again, ENEMY_DROP))
    }
  })

  it('a smashed crate rolls its loot from the sim seed', () => {
    const breakFirstCrate = () => {
      const sim = createSim(42)
      const player = playerOf(sim)
      const crate = sim.entities.find((e) => e.kind === 'crate')
      if (!crate) throw new Error('no crate in stage 1')
      // Stand next to the crate (inside the camera view) and jab it.
      crate.x = 240
      player.x = 220
      player.y = crate.y
      player.facing = 'right'
      for (let t = 0; t < 600; t += 1) {
        stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
        const events = drainSimEvents(sim)
        for (const event of events) {
          if (event.type === 'ko' && event.id === crate.id) {
            // Loot (if any) spawns on the same tick.
            const spawned = events.find((e) => e.type === 'spawn')
            return spawned?.type === 'spawn' ? spawned.kind : null
          }
        }
      }
      throw new Error('crate never broke')
    }
    const first = breakFirstCrate()
    expect(breakFirstCrate()).toBe(first)
    // Pinned outcome for seed 42.
    expect(first).toBe('meat')
  })
})

describe('food', () => {
  it('heals on pickup and caps at maxHp', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    player.hp = 100
    const meat = makeCombatant(95, 'meat', 'neutral', player.x, player.y, 1, 0, 'left')
    sim.entities.push(meat)

    stepSim(sim, neutralInput())
    expect(player.hp).toBe(120) // 100 + 30, capped
    expect(sim.stats.foodEaten).toBe(1)
    expect(sim.entities.find((e) => e.id === meat.id)).toBeUndefined()
  })

  it('does not count a pickup at full hp as eaten', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    expect(player.hp).toBe(player.maxHp)
    sim.entities.push(makeCombatant(95, 'meat', 'neutral', player.x, player.y, 1, 0, 'left'))

    stepSim(sim, neutralInput())
    expect(player.hp).toBe(player.maxHp)
    expect(sim.stats.foodEaten).toBe(0)
  })
})

describe('weapons', () => {
  it('a picked-up sword boosts damage and reach until it expires', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    sim.entities.push(makeCombatant(95, 'sword', 'neutral', player.x, player.y, 1, 0, 'left'))
    stepSim(sim, neutralInput())
    expect(player.weapon).toBe('sword')

    // Target beyond plain jab reach (26) but inside sword reach (34).
    const far = makeCombatant(96, 'soldier', 'enemy', player.x + 30, player.y, 24, 0.9, 'left')
    sim.entities.push(far)
    let firstDamage: number | null = null
    for (let t = 0; t < 120 && firstDamage === null; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === far.id) firstDamage = event.damage
      }
    }
    expect(firstDamage).toBe(6 + 4)

    for (let t = 0; t < 620; t += 1) stepSim(sim, neutralInput())
    expect(player.weapon).toBeNull()
  })
})
