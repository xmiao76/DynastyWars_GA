import { describe, expect, it } from 'vitest'
import { HORSE_HP, MOUNTED_SPEED } from '../../src/core/constants'
import { makeCombatant } from '../../src/core/entities'
import { drainSimEvents, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

function sandboxWithHorse() {
  const sim = makeSandbox()
  const player = playerOf(sim)
  const horse = makeCombatant(95, 'horse', 'neutral', player.x + 40, player.y, HORSE_HP, 0, 'left')
  sim.entities.push(horse)
  return { sim, player, horse }
}

function mount(sim: ReturnType<typeof makeSandbox>) {
  for (let t = 0; t < 60 && playerOf(sim).mountedOn === null; t += 1) {
    stepSim(sim, { ...neutralInput(), right: true })
    drainSimEvents(sim)
  }
}

describe('horseback combat', () => {
  it('walking into the horse mounts it and speeds the player up', () => {
    const { sim, player, horse } = sandboxWithHorse()
    const x0 = player.x
    mount(sim)
    expect(player.mountedOn).toBe(horse.id)

    const x1 = player.x
    for (let t = 0; t < 60; t += 1) stepSim(sim, { ...neutralInput(), right: true })
    const mountedDelta = player.x - x1
    // MOUNTED_SPEED 2.2 vs walk 1.6: 60 ticks must gain > 1.6*60.
    expect(mountedDelta).toBeGreaterThan(1.6 * 60)
    expect(MOUNTED_SPEED).toBeGreaterThan(1.6)
    // The horse is pinned under the rider.
    expect(horse.x).toBe(player.x)
    expect(horse.y).toBe(player.y)
    void x0
  })

  it('mounted attacks are the long spear sweep (14 dmg, knockdown)', () => {
    const { sim, player } = sandboxWithHorse()
    mount(sim)
    const soldier = makeCombatant(96, 'soldier', 'enemy', player.x + 30, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)

    let damage: number | null = null
    for (let t = 0; t < 120 && damage === null; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 10 === 0 })
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === soldier.id) damage = event.damage
      }
    }
    expect(damage).toBe(14)
    expect(['knockdown', 'getup', 'walk', 'dying']).toContain(soldier.state)
  })

  it('jump, special, and grab are all disabled while mounted', () => {
    const { sim, player } = sandboxWithHorse()
    mount(sim)
    // Adjacent grabbable enemy.
    sim.entities.push(makeCombatant(96, 'soldier', 'enemy', player.x + 10, player.y, 24, 0.9, 'left'))

    for (let t = 0; t < 30; t += 1) {
      stepSim(sim, {
        ...neutralInput(),
        jumpPressed: t % 5 === 0,
        specialPressed: t % 7 === 0,
        right: true,
      })
      drainSimEvents(sim)
    }
    expect(player.state).not.toBe('jump')
    expect(player.state).not.toBe('jumpattack')
    expect(player.state).not.toBe('special')
    expect(player.state).not.toBe('grab')
    expect(sim.stats.specialsUsed).toBe(0)
    expect(player.mountedOn).not.toBeNull()
  })

  it('hits redirect to the horse; at 0 hp the horse flees and the rider dismounts with i-frames', () => {
    const { sim, player, horse } = sandboxWithHorse()
    mount(sim)
    expect(player.mountedOn).not.toBeNull()

    // A soldier swings at the mounted player until the horse breaks.
    const soldier = makeCombatant(96, 'soldier', 'enemy', player.x + 18, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)
    let sawDismount = false
    for (let t = 0; t < 2400 && player.mountedOn !== null; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'dismount') sawDismount = true
      }
    }
    expect(sawDismount).toBe(true)
    expect(player.hp).toBe(player.maxHp) // the horse took every hit
    expect(horse.hp).toBe(0)
    expect(horse.state).toBe('fleeing')
    expect(player.invulnerableTicks).toBeGreaterThan(0)

    // The fleeing horse runs off and is removed past the stage edge.
    for (let t = 0; t < 400 && horse.state !== 'dead'; t += 1) {
      stepSim(sim, neutralInput())
      drainSimEvents(sim)
    }
    expect(horse.state).toBe('dead')
  })
})
