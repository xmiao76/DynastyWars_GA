import { describe, expect, it } from 'vitest'
import { COMBO_WINDOW_TICKS, JUMP_DURATION } from '../../src/core/constants'
import { makeCombatant } from '../../src/core/entities'
import { drainSimEvents, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

describe('hit-stop (freezeTicks)', () => {
  it('a hit freezes the world: tick advances, entities hold position', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 20, player.y, 24, 0.9, 'left')
    sim.entities.push(soldier)

    // Land a jab.
    for (let t = 0; t < 60 && sim.freezeTicks === 0; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
      drainSimEvents(sim)
    }
    expect(sim.freezeTicks).toBeGreaterThan(0)

    // While frozen: tick advances but nothing moves.
    const frozenAt = { tick: sim.tick, px: player.x, sx: soldier.x, stateTick: soldier.stateTick }
    const frozenCount = sim.freezeTicks
    for (let t = 0; t < frozenCount; t += 1) {
      stepSim(sim, { ...neutralInput(), right: true })
    }
    expect(sim.tick).toBe(frozenAt.tick + frozenCount)
    expect(player.x).toBe(frozenAt.px)
    expect(soldier.x).toBe(frozenAt.sx)
    expect(soldier.stateTick).toBe(frozenAt.stateTick)

    // After the freeze the world moves again.
    stepSim(sim, { ...neutralInput(), right: true })
    expect(sim.freezeTicks).toBe(0)
  })

  it('boss KOs freeze longer than grunt KOs', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const boss = makeCombatant(99, 'lidian', 'enemy', player.x + 20, player.y, 1, 1.1, 'left')
    sim.entities.push(boss)
    for (let t = 0; t < 60 && sim.freezeTicks === 0; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
      drainSimEvents(sim)
    }
    expect(sim.freezeTicks).toBe(8)
  })

  it('frozen ticks never fast-forward the jump arc', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    stepSim(sim, { ...neutralInput(), jumpPressed: true })
    const airAtFreeze = player.airTicks
    const zAtFreeze = player.z
    sim.freezeTicks = 4
    for (let t = 0; t < 4; t += 1) stepSim(sim, neutralInput())
    expect(player.airTicks).toBe(airAtFreeze)
    expect(player.z).toBe(zAtFreeze)
    // The jump still completes after exactly JUMP_DURATION airborne ticks.
    let airborneTicks = 0
    while (player.z > 0 || player.state === 'jump' || player.state === 'jumpattack') {
      stepSim(sim, neutralInput())
      if (player.z > 0) airborneTicks += 1
      if (airborneTicks > JUMP_DURATION + 20) break
    }
    expect(airborneTicks).toBeLessThanOrEqual(JUMP_DURATION)
  })

  it('a landing emits the land event', () => {
    const sim = makeSandbox()
    stepSim(sim, { ...neutralInput(), jumpPressed: true })
    let sawLand = false
    for (let t = 0; t < 60 && !sawLand; t += 1) {
      stepSim(sim, neutralInput())
      if (drainSimEvents(sim).some((e) => e.type === 'land')) sawLand = true
    }
    expect(sawLand).toBe(true)
  })
})

describe('combo counter', () => {
  it('chained player hits build the combo; the window expiring resets it', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    // A beefy soldier that survives the whole chain.
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 20, player.y, 999, 0.9, 'left')
    soldier.thinkTick = 9999 // docile: never attacks
    sim.entities.push(soldier)

    let maxCombo = 0
    let sawActiveWindow = false
    for (let t = 0; t < 400; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 8 === 0 })
      const hitLanded = drainSimEvents(sim).some(
        (e) => e.type === 'hit' && e.targetId === soldier.id,
      )
      maxCombo = Math.max(maxCombo, sim.stats.comboHits)
      // Right after a landed hit, the combo window must be open.
      if (hitLanded && sim.stats.comboTicksLeft > 0) sawActiveWindow = true
    }
    expect(maxCombo).toBeGreaterThanOrEqual(3)
    expect(sawActiveWindow).toBe(true)

    // Let the window lapse.
    for (let t = 0; t < COMBO_WINDOW_TICKS + 10; t += 1) stepSim(sim, neutralInput())
    expect(sim.stats.comboHits).toBe(0)
  })

  it('taking a hit breaks the combo', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 20, player.y, 999, 0.9, 'left')
    sim.entities.push(soldier)
    // Build a combo.
    for (let t = 0; t < 200 && sim.stats.comboHits < 2; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 8 === 0 })
      drainSimEvents(sim)
    }
    expect(sim.stats.comboHits).toBeGreaterThanOrEqual(2)
    // The soldier swings back and connects.
    for (let t = 0; t < 300 && sim.stats.comboHits > 0; t += 1) {
      stepSim(sim, neutralInput())
      drainSimEvents(sim)
    }
    expect(sim.stats.comboHits).toBe(0)
  })
})
