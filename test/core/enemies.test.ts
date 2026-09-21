import { describe, expect, it } from 'vitest'
import { attackById } from '../../src/core/attacks'
import { makeCombatant } from '../../src/core/entities'
import { enemyByKind } from '../../src/core/enemies'
import { createSim, drainSimEvents, playerOf, stepSim, type Sim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'

/** A sim sandbox with the wave-1 soldiers stripped and the camera unlocked,
 * so a single injected enemy can be observed in isolation. */
function sandbox(): Sim {
  const sim = createSim(42)
  sim.entities = sim.entities.filter((e) => e.side === 'hero')
  sim.cameraLocked = false
  drainSimEvents(sim)
  return sim
}

describe('spearman', () => {
  it('outreaches the soldier', () => {
    expect(attackById(enemyByKind('spearman').attackId).reach).toBeGreaterThan(
      attackById(enemyByKind('soldier').attackId).reach,
    )
  })

  it('attacks from beyond soldier range', () => {
    const sim = sandbox()
    const player = playerOf(sim)
    const spearman = makeCombatant(99, 'spearman', 'enemy', player.x + 32, player.y, 32, 0.7, 'left')
    sim.entities.push(spearman)

    let attackDistance: number | null = null
    for (let t = 0; t < 180 && attackDistance === null; t += 1) {
      stepSim(sim, neutralInput())
      if (spearman.state === 'attack') attackDistance = Math.abs(spearman.x - player.x)
      drainSimEvents(sim)
    }
    expect(attackDistance).not.toBeNull()
    // Soldier reach is 24; the spear thrust reaches 36.
    expect(attackDistance ?? 0).toBeGreaterThan(28)
    expect(attackDistance ?? 0).toBeLessThanOrEqual(36)
  })
})

describe('archer', () => {
  it('fires an arrow that travels and can hit the player', () => {
    const sim = sandbox()
    const player = playerOf(sim)
    const archer = makeCombatant(99, 'archer', 'enemy', player.x + 180, player.y, 18, 0.8, 'left')
    sim.entities.push(archer)

    // Wait for the first arrow to appear.
    let arrowId: number | null = null
    for (let t = 0; t < 120 && arrowId === null; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'spawn' && event.kind === 'arrow') arrowId = event.id
      }
    }
    expect(arrowId).not.toBeNull()

    // Track the arrow: it must move toward the player and then hit.
    const startX = sim.entities.find((e) => e.id === arrowId)?.x ?? 0
    let sawHit = false
    let midX: number | null = null
    for (let t = 0; t < 200 && !sawHit; t += 1) {
      stepSim(sim, neutralInput())
      if (t === 20) midX = sim.entities.find((e) => e.id === arrowId)?.x ?? null
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'hit' && event.targetId === player.id) sawHit = true
      }
    }
    expect(midX).not.toBeNull()
    expect((midX ?? 0)).toBeLessThan(startX)
    expect(sawHit).toBe(true)
    expect(player.hp).toBe(player.maxHp - 5)
    // The arrow is consumed by the hit.
    expect(sim.entities.find((e) => e.id === arrowId)).toBeUndefined()
  })
})
