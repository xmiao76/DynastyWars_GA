import { describe, expect, it } from 'vitest'
import {
  ARROW_CHEST_Z,
  ARROW_FALL,
  ARROW_LEVEL_TRAVEL,
  ARROW_MAX_TRAVEL,
  ARROW_Z,
  EDGE_MARGIN,
  SCREEN_WIDTH,
} from '../../src/core/constants'
import { makeCombatant, makeProjectile } from '../../src/core/entities'
import { drainSimEvents, playerOf, stepSim, type Sim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

/**
 * Arrow flight (owner request 2026-09-22): arrows fly at chest height - the
 * middle of a standing fighter's body - not at its feet, and past their level
 * range they fall to the ground and disappear instead of hanging in the air.
 *
 * The level-flight hit set is pinned as the IDENTITY it is designed to be:
 * with the arrow at ARROW_Z and the target tested at ARROW_CHEST_Z above its
 * feet, hits and jump-dodges are exactly the set the old feet-level arrows
 * (z = 10 tested against target.z) had: ARROW_Z - ARROW_CHEST_Z is that
 * old 10-unit offset.
 */

function arrowIn(sim: Sim, id: number) {
  return sim.entities.find((e) => e.id === id)
}

describe('arrow spawn height (both spawn paths)', () => {
  it("Huang Zhong's special fires at chest height", () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    sim.charId = 'huangzhong'
    stepSim(sim, { ...neutralInput(), specialPressed: true })
    const arrow = sim.entities.find((e) => e.kind === 'arrow' && e.side === 'hero')
    expect(arrow).toBeDefined()
    expect(arrow?.z).toBe(ARROW_Z)
    expect(player.z).toBe(0) // the shooter stays grounded; the ARROW is up
  })

  it('archers fire at chest height', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    const archer = makeCombatant(99, 'archer', 'enemy', player.x + 180, player.y, 18, 0.8, 'left')
    sim.entities.push(archer)
    let arrowId: number | null = null
    for (let t = 0; t < 120 && arrowId === null; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'spawn' && event.kind === 'arrow') arrowId = event.id
      }
    }
    expect(arrowId).not.toBeNull()
    expect(arrowIn(sim, arrowId ?? -1)?.z).toBe(ARROW_Z)
  })
})

describe('arrow flight envelope', () => {
  it('holds chest height past every fire range, then falls to the ground and is gone', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    // Away from the shooter into empty stage: the flight itself is the target.
    const arrow = makeProjectile(500, 'arrow', 'enemy', player.x + 250, player.y, ARROW_Z, 3, 'right')
    sim.entities.push(arrow)

    const zs: number[] = []
    for (let t = 0; t < 200; t += 1) {
      stepSim(sim, neutralInput())
      const a = arrowIn(sim, 500)
      if (!a) break
      zs.push(a.z)
    }
    // Level flight exactly until ARROW_LEVEL_TRAVEL px: 80 ticks at 3px/tick,
    // (zs[t] is the height after tick t + 1).
    const firstLow = zs.findIndex((z) => z < ARROW_Z)
    expect(firstLow).toBe(ARROW_LEVEL_TRAVEL / 3 - 1)
    expect(zs.slice(0, firstLow).every((z) => z === ARROW_Z)).toBe(true)
    // Then it drops ARROW_FALL per tick...
    expect(zs[firstLow]).toBe(ARROW_Z - ARROW_FALL)
    // ...all the way down: gone from the entity list within two ticks of the
    // ground, never left hanging in the air.
    expect(zs[zs.length - 1]).toBeLessThanOrEqual(ARROW_FALL * 2)
    expect(arrowIn(sim, 500)).toBeUndefined()
  })

  it('an arrow never outlives its farthest range', () => {
    // A lobbed arrow cannot land inside its level window; the travel cap is
    // the guarantee that it still disappears at ARROW_MAX_TRAVEL.
    const sim = makeSandbox()
    const player = playerOf(sim)
    const arrow = makeProjectile(501, 'arrow', 'enemy', player.x + 150, player.y, 200, 3, 'right')
    sim.entities.push(arrow)
    let ticks = 0
    while (arrowIn(sim, 501) && ticks < 400) {
      stepSim(sim, neutralInput())
      ticks += 1
    }
    expect(arrowIn(sim, 501)).toBeUndefined()
    expect(ticks * 3).toBeLessThanOrEqual(ARROW_MAX_TRAVEL + 3)
  })

  it('hero arrows fall and are removed too - no hanging hero arrows', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    // Launched toward empty ground ahead of the shooter. Before the fix a
    // dead hero arrow survived the dead-entity filter and hung in the air
    // forever - this is the test that keeps it gone.
    const arrow = makeProjectile(502, 'arrow', 'hero', player.x + 250, player.y, ARROW_Z, 4, 'right')
    sim.entities.push(arrow)
    let sawFall = false
    for (let t = 0; t < 200; t += 1) {
      stepSim(sim, neutralInput())
      const a = arrowIn(sim, 502)
      if (!a) break
      if (a.z < ARROW_Z) sawFall = true
    }
    expect(sawFall).toBe(true)
    expect(arrowIn(sim, 502)).toBeUndefined()
  })

  it('a hero arrow is not pinned to the screen edge (the old hang)', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    // The hero x-clamp used to freeze hero arrows at scrollX + SCREEN_WIDTH -
    // EDGE_MARGIN forever. This arrow starts short of that line and must
    // cross it, then fall and vanish like any other.
    const arrow = makeProjectile(503, 'arrow', 'hero', player.x + 280, player.y, ARROW_Z, 4, 'right')
    sim.entities.push(arrow)
    const clampX = sim.scrollX + SCREEN_WIDTH - EDGE_MARGIN
    let maxX = 0
    for (let t = 0; t < 200; t += 1) {
      stepSim(sim, neutralInput())
      const a = arrowIn(sim, 503)
      if (!a) break
      maxX = Math.max(maxX, a.x)
    }
    expect(maxX).toBeGreaterThan(clampX) // it flew past, never froze there
    expect(arrowIn(sim, 503)).toBeUndefined()
  })
})

describe('level-flight hit set is the old one', () => {
  it('a grounded target is hit at chest height', () => {
    // |feet + ARROW_CHEST_Z - ARROW_Z| is the old feet-level offset.
    expect(Math.abs(0 + ARROW_CHEST_Z - ARROW_Z)).toBeLessThanOrEqual(16)
    const sim = makeSandbox()
    const player = playerOf(sim)
    const arrow = makeProjectile(504, 'arrow', 'enemy', player.x + 170, player.y, ARROW_Z, -3, 'left')
    sim.entities.push(arrow)
    let sawHit = false
    for (let t = 0; t < 120 && !sawHit; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === player.id) sawHit = true
      }
    }
    expect(sawHit).toBe(true)
    expect(arrowIn(sim, 504)).toBeUndefined() // consumed by the hit
  })

  it('an airborne target still clears the arrow exactly as before', () => {
    // z is held at a height a jump passes through (nothing in idle/walk
    // writes z, so this pins the hit math without jump-arc timing).
    const zAir = 44
    expect(Math.abs(zAir + ARROW_CHEST_Z - ARROW_Z)).toBeGreaterThan(16) // dodges
    expect(Math.abs(zAir - ARROW_Z)).toBeLessThanOrEqual(16) // ...but the
    // chest offset dropped would make the airborne target eat this arrow.
    const sim = makeSandbox()
    const player = playerOf(sim)
    player.z = zAir
    const arrow = makeProjectile(505, 'arrow', 'enemy', player.x + 45, player.y, ARROW_Z, -3, 'left')
    sim.entities.push(arrow)
    let sawHit = false
    for (let t = 0; t < 30; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === player.id) sawHit = true
      }
    }
    // Old arrows: |z - 10| > 16 dodged from z = 26; the chest-shifted test
    // keeps that set exactly (ARROW_Z - ARROW_CHEST_Z = 10).
    expect(sawHit).toBe(false)
    expect(playerOf(sim).hp).toBe(playerOf(sim).maxHp)
    expect(arrowIn(sim, 505)).toBeDefined() // passed by unharmed; falls later
  })
})
