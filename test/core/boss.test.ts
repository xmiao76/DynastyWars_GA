import { describe, expect, it } from 'vitest'
import { ENRAGE_HP_RATIO } from '../../src/core/ai'
import { makeCombatant } from '../../src/core/entities'
import { enemyByKind } from '../../src/core/enemies'
import { drainSimEvents, playerOf, stepSim, type Sim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

function injectBoss(sim: Sim, kind = 'lidian') {
  const player = playerOf(sim)
  const def = enemyByKind(kind)
  const boss = makeCombatant(99, kind, 'enemy', player.x + 220, player.y, def.maxHp, def.speed, 'left')
  sim.entities.push(boss)
  sim.bossSpawned = true
  return boss
}

describe('boss pattern FSM', () => {
  it('approaches from range, then attacks in melee', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const boss = injectBoss(sim)
    const distBefore = Math.abs(boss.x - player.x)
    for (let t = 0; t < 60; t += 1) {
      stepSim(sim, neutralInput())
      drainSimEvents(sim)
    }
    expect(Math.abs(boss.x - player.x)).toBeLessThan(distBefore)

    let attacked = false
    for (let t = 0; t < 300 && !attacked; t += 1) {
      stepSim(sim, neutralInput())
      if (boss.state === 'attack') attacked = true
      drainSimEvents(sim)
    }
    expect(attacked).toBe(true)
  })

  it('charges from long range and the dash moves it forward', () => {
    const sim = makeSandbox()
    const boss = injectBoss(sim)
    let charging = false
    for (let t = 0; t < 120 && !charging; t += 1) {
      stepSim(sim, neutralInput())
      if (boss.state === 'attack' && boss.attackId === 'charge.dash') charging = true
      drainSimEvents(sim)
    }
    expect(charging).toBe(true)

    const xAtChargeStart = boss.x
    for (let t = 0; t < 20; t += 1) stepSim(sim, neutralInput())
    expect(Math.abs(boss.x - xAtChargeStart)).toBeGreaterThan(20)
  })

  it('enrages below the HP threshold with an event', () => {
    const sim = makeSandbox()
    const boss = injectBoss(sim)
    boss.hp = Math.floor(boss.maxHp * ENRAGE_HP_RATIO)

    let sawEnrage = false
    for (let t = 0; t < 120 && !sawEnrage; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'enrage' && event.id === boss.id) sawEnrage = true
      }
    }
    expect(sawEnrage).toBe(true)
    expect(boss.enraged).toBe(true)
  })

  it('boss death emits stageclear, flips the phase, and pays 1000 score', () => {    const sim = makeSandbox()
    const player = playerOf(sim)
    const boss = injectBoss(sim)
    boss.hp = 1
    // Stage the kill inside the camera view.
    boss.x = 240
    boss.y = player.y
    player.x = 220
    player.y = boss.y
    player.facing = 'right'
    player.state = 'attack'
    player.attackId = 'zy.jab1'
    player.stateTick = 0
    player.struck = []

    let sawStageclear = false
    for (let t = 0; t < 120 && !sawStageclear; t += 1) {
      stepSim(sim, { ...neutralInput(), attackPressed: t % 6 === 0 })
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'stageclear') sawStageclear = true
      }
    }
    expect(sawStageclear).toBe(true)
    expect(sim.phase).toBe('clear')
    expect(sim.stats.score).toBeGreaterThanOrEqual(1000)
  })

  it('Xiahou Dun uses the longer charge attack', () => {
    const sim = makeSandbox()
    const boss = injectBoss(sim, 'xiahoudun')
    let charging = false
    for (let t = 0; t < 120 && !charging; t += 1) {
      stepSim(sim, neutralInput())
      if (boss.state === 'attack' && boss.attackId === 'charge.dash.long') charging = true
      drainSimEvents(sim)
    }
    expect(charging).toBe(true)
  })
})
