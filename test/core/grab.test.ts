import { describe, expect, it } from 'vitest'
import { GRAB_HOLD_TICKS, THROW_TRAVEL } from '../../src/core/constants'
import { makeCombatant } from '../../src/core/entities'
import { drainSimEvents, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

describe('grab', () => {
  it('requires adjacency and facing: walking into an enemy grabs it', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 12, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)

    for (let t = 0; t < 10 && player.state !== 'grab'; t += 1) {
      stepSim(sim, { ...neutralInput(), right: true })
    }
    expect(player.state).toBe('grab')
    expect(soldier.state).toBe('grabbed')
    expect(soldier.grabbedBy).toBe(player.id)
  })

  it('does not grab an enemy behind the player', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x - 10, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)

    for (let t = 0; t < 20; t += 1) {
      stepSim(sim, { ...neutralInput(), right: true }) // facing + walking right, away
      expect(player.state).not.toBe('grab')
    }
    expect(soldier.grabbedBy).toBeNull()
  })

  it('does not grab at range without walking into contact', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 20, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)

    for (let t = 0; t < 30; t += 1) stepSim(sim, neutralInput())
    expect(player.state).not.toBe('grab')
  })

  it('throw damages the thrown enemy on landing and bowls through bystanders', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const held = makeCombatant(91, 'soldier', 'enemy', player.x + 12, player.y, 24, 0.9, 'left')
    const bystander = makeCombatant(92, 'soldier', 'enemy', player.x + 70, player.y, 24, 0.9, 'left')
    sim.entities.push(held, bystander)

    for (let t = 0; t < 10 && player.state !== 'grab'; t += 1) {
      stepSim(sim, { ...neutralInput(), right: true })
    }
    expect(player.state).toBe('grab')

    stepSim(sim, { ...neutralInput(), attackPressed: true })
    const events = drainSimEvents(sim)
    expect(events.some((e) => e.type === 'throw' && e.id === held.id)).toBe(true)
    expect(held.state).toBe('thrown')
    expect(held.vx).toBeGreaterThan(0)

    for (let t = 0; t < 120 && held.state === 'thrown'; t += 1) {
      stepSim(sim, neutralInput())
    }
    // Bystander took the collateral hit (10) and was knocked down.
    expect(bystander.hp).toBe(24 - 10)
    expect(['knockdown', 'getup', 'walk', 'dying']).toContain(bystander.state)
    // The thrown soldier took the landing impact (12) and is down.
    expect(held.hp).toBe(24 - 12)
    expect(['knockdown', 'getup', 'walk', 'dying']).toContain(held.state)
    expect(Math.abs(held.x - held.thrownFromX)).toBeLessThanOrEqual(THROW_TRAVEL + 8)
  })

  it('a held enemy collapses free after the grab expires', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 12, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)

    for (let t = 0; t < 10 && player.state !== 'grab'; t += 1) {
      stepSim(sim, { ...neutralInput(), right: true })
    }
    expect(player.state).toBe('grab')

    for (let t = 0; t < GRAB_HOLD_TICKS + 20; t += 1) stepSim(sim, neutralInput())
    expect(player.state).not.toBe('grab')
    expect(soldier.grabbedBy).toBeNull()
    expect(['knockdown', 'getup', 'walk']).toContain(soldier.state)
  })
})

describe('desperation special', () => {
  it('costs exact HP, grants i-frames, and hits enemies on both sides', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const front = makeCombatant(91, 'soldier', 'enemy', player.x + 40, player.y, 24, 0.9, 'left')
    const behind = makeCombatant(92, 'soldier', 'enemy', player.x - 40, player.y, 24, 0.9, 'left')
    sim.entities.push(front, behind)

    stepSim(sim, { ...neutralInput(), specialPressed: true })
    expect(player.hp).toBe(120 - 15)
    expect(player.state).toBe('special')
    expect(player.invulnerableTicks).toBeGreaterThan(0)
    expect(sim.stats.specialsUsed).toBe(1)

    for (let t = 0; t < 40; t += 1) stepSim(sim, neutralInput())
    expect(front.hp).toBe(24 - 20)
    expect(behind.hp).toBe(24 - 20)
    expect(['knockdown', 'getup', 'walk', 'dying']).toContain(front.state)
    expect(['knockdown', 'getup', 'walk', 'dying']).toContain(behind.state)
  })

  it('cannot be activated at or below the HP cost', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    player.hp = 15 // == specialCost
    stepSim(sim, { ...neutralInput(), specialPressed: true })
    expect(player.state).not.toBe('special')
    expect(player.hp).toBe(15)
    expect(sim.stats.specialsUsed).toBe(0)
  })
})
