import { describe, expect, it } from 'vitest'
import { makeCombatant } from '../../src/core/entities'
import { drainSimEvents, playerOf, stepSim, tryRevivePlayer } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

/** Run an idle player next to a soldier until the player dies. */
function runUntilDead(sim: ReturnType<typeof makeSandbox>) {
  const player = playerOf(sim)
  player.hp = 1
  const soldier = makeCombatant(91, 'soldier', 'enemy', player.x + 16, player.y, 24, 0.9, 'left')
  sim.entities.push(soldier)
  let sawGameoverEvent = false
  for (let t = 0; t < 600 && sim.phase !== 'gameover'; t += 1) {
    stepSim(sim, neutralInput())
    for (const event of drainSimEvents(sim)) {
      if (event.type === 'gameover') sawGameoverEvent = true
    }
  }
  return sawGameoverEvent
}

describe('game over and continue', () => {
  it('player death flips the phase to gameover with an event', () => {
    const sim = makeSandbox()
    expect(runUntilDead(sim)).toBe(true)
    expect(sim.phase).toBe('gameover')
    expect(playerOf(sim).state).toBe('dead')
  })

  it('revive spends a life, restores HP, and grants i-frames', () => {
    const sim = makeSandbox()
    runUntilDead(sim)
    expect(sim.lives).toBe(3)

    expect(tryRevivePlayer(sim)).toBe(true)
    const player = playerOf(sim)
    expect(sim.lives).toBe(2)
    expect(player.hp).toBe(player.maxHp)
    expect(player.state).toBe('idle')
    expect(player.invulnerableTicks).toBeGreaterThan(0)
    expect(sim.phase).toBe('fight')
    // Respawned inside the visible, reachable area.
    expect(player.x).toBeGreaterThanOrEqual(sim.scrollX + 16)
    expect(player.x).toBeLessThanOrEqual(sim.scrollX + 368)
  })

  it('rejects revive with no lives left', () => {
    const sim = makeSandbox()
    runUntilDead(sim)
    sim.lives = 0
    expect(tryRevivePlayer(sim)).toBe(false)
    expect(sim.phase).toBe('gameover')
    expect(playerOf(sim).state).toBe('dead')
  })

  it('grants an extra life at each 2000-score milestone', () => {
    const sim = makeSandbox(1)
    const player = playerOf(sim)
    expect(sim.lives).toBe(3)
    // Set up a one-hit KO on a soldier near the 2000 threshold.
    sim.stats.score = 1950
    sim.livesEarned = 0
    const soldier = makeCombatant(91, 'soldier', 'enemy', 0, 0, 1, 0.9, 'left')
    soldier.x = 240
    soldier.y = 210
    sim.entities.push(soldier)
    player.x = 220
    player.y = 210
    player.facing = 'right'
    let sawExtraLife = false
    for (let t = 0; t < 120 && sim.lives === 3; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'extralife') sawExtraLife = true
      }
    }
    expect(sim.stats.score).toBeGreaterThanOrEqual(2000)
    expect(sim.lives).toBe(4)
    expect(sawExtraLife).toBe(true)
  })
})
