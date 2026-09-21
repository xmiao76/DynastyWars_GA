import { describe, expect, it } from 'vitest'
import {
  GETUP_TICKS,
  JUMP_DURATION,
  JUMP_HEIGHT,
  KNOCKDOWN_TICKS,
  PLAYER_MERCY_TICKS,
} from '../../src/core/constants'
import { resolveAttacks } from '../../src/core/combat'
import { makeCombatant } from '../../src/core/entities'
import type { SimEvent } from '../../src/core/events'
import { createSim, drainSimEvents, jumpHeight, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'

describe('jump', () => {
  it('follows a deterministic parabolic z-curve and lands back at z=0', () => {
    const sim = createSim(42)
    const player = playerOf(sim)
    stepSim(sim, { ...neutralInput(), jumpPressed: true })
    expect(player.state).toBe('jump')

    const heights: number[] = []
    for (let t = 0; t < JUMP_DURATION + 4; t += 1) {
      stepSim(sim, neutralInput())
      heights.push(player.z)
    }
    // Rises immediately, peaks at the midpoint, lands exactly at z=0.
    expect(heights[0]).toBeGreaterThan(0)
    expect(Math.max(...heights)).toBeCloseTo(JUMP_HEIGHT, 5)
    expect(player.z).toBe(0)
    expect(player.state).toBe('idle')
    // Curve sanity: monotonic rise to the peak, then fall.
    expect(heights[8]).toBeGreaterThan(heights[2] ?? 0)
    expect((heights[30] ?? 1)).toBeLessThan(heights[20] ?? 0)
  })

  it('jump curve helper is zero at both ends and peaked in the middle', () => {
    expect(jumpHeight(0)).toBe(0)
    expect(jumpHeight(JUMP_DURATION)).toBe(0)
    expect(jumpHeight(JUMP_DURATION / 2)).toBeCloseTo(JUMP_HEIGHT, 5)
  })
})

describe('aerial combat rules', () => {
  it('aerial attacks connect only while the attacker is airborne', () => {
    const attacker = makeCombatant(1, 'zhaoyun', 'hero', 100, 210, 120, 1.6, 'right')
    const target = makeCombatant(2, 'soldier', 'enemy', 120, 210, 24, 0.9, 'left')
    attacker.state = 'jumpattack'
    attacker.attackId = 'zy.jumpkick'
    attacker.stateTick = 10 // inside the active window
    attacker.z = 0
    const events: SimEvent[] = []
    resolveAttacks([attacker, target], events)
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(0)

    attacker.z = 20
    resolveAttacks([attacker, target], events)
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(1)
  })

  it('ground attacks miss targets above swing height', () => {
    const attacker = makeCombatant(1, 'soldier', 'enemy', 100, 210, 24, 0.9, 'right')
    const target = makeCombatant(2, 'zhaoyun', 'hero', 118, 210, 120, 1.6, 'left')
    attacker.state = 'attack'
    attacker.attackId = 'soldier.swing'
    attacker.stateTick = 15 // inside the active window
    target.z = 30
    const events: SimEvent[] = []
    resolveAttacks([attacker, target], events)
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(0)

    target.z = 0
    resolveAttacks([attacker, target], events)
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(1)
  })
})

describe('knockdown i-frames', () => {
  it('a knocked-down enemy is invulnerable until its getup window ends', () => {
    const sim = createSim(42)
    const player = playerOf(sim)
    const soldier = sim.entities.find((e) => e.side === 'enemy')
    if (!soldier) throw new Error('no soldier in sim')
    // Stage the duel inside the camera view (away from the lock clamp).
    soldier.x = 240
    player.x = 220
    player.y = soldier.y
    player.facing = 'right'
    // Lead with the finisher so the first landed hit knocks the soldier down.
    player.state = 'attack'
    player.attackId = 'zy.finisher'
    player.stateTick = 0
    player.struck = []

    const hitTicks: number[] = []
    const damages: number[] = []
    for (let t = 0; t < 300 && damages.length < 2; t += 1) {
      const gap = soldier.x - player.x
      stepSim(sim, {
        ...neutralInput(),
        right: gap > 22,
        attackPressed: t % 6 === 0 && gap <= 22,
      })
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === soldier.id) {
          hitTicks.push(sim.tick)
          damages.push(event.damage)
        }
      }
    }

    expect(damages).toEqual([12, 8])
    expect(hitTicks).toHaveLength(2)
    const downedWindow = KNOCKDOWN_TICKS + GETUP_TICKS
    expect((hitTicks[1] ?? 0) - (hitTicks[0] ?? 0)).toBeGreaterThanOrEqual(downedWindow)
    expect(soldier.hp).toBe(4)
  })
})

describe('mercy invulnerability', () => {
  it('invulnerable entities cannot be hit', () => {
    const attacker = makeCombatant(1, 'soldier', 'enemy', 100, 210, 24, 0.9, 'right')
    const target = makeCombatant(2, 'zhaoyun', 'hero', 118, 210, 120, 1.6, 'left')
    attacker.state = 'attack'
    attacker.attackId = 'soldier.swing'
    attacker.stateTick = 15 // inside the active window
    target.invulnerableTicks = 10
    const events: SimEvent[] = []
    resolveAttacks([attacker, target], events)
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(0)

    target.invulnerableTicks = 0
    resolveAttacks([attacker, target], events)
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(1)
  })

  it('the player gains a mercy window when hitstun ends', () => {
    const sim = createSim(42)
    const player = playerOf(sim)
    const soldier = sim.entities.find((e) => e.side === 'enemy')
    if (!soldier) throw new Error('no soldier in sim')
    soldier.x = 240
    player.x = 220
    player.y = soldier.y

    let firstHitTick: number | null = null
    let mercyObserved = false
    for (let t = 0; t < 300 && !mercyObserved; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === player.id && firstHitTick === null) {
          firstHitTick = sim.tick
        }
      }
      if (firstHitTick !== null && player.state === 'idle') {
        // Hitstun just ended; the mercy window must be active now.
        expect(player.invulnerableTicks).toBeGreaterThanOrEqual(PLAYER_MERCY_TICKS - 2)
        mercyObserved = true
      }
    }
    expect(firstHitTick).not.toBeNull()
    expect(mercyObserved).toBe(true)
  })
})
