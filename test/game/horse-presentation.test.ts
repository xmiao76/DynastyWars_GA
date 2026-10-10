import { describe, expect, it } from 'vitest'
import { makeCombatant } from '../../src/core/entities'
import { joinPlayer2, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { HorsePresentation } from '../../src/game/horse-presentation'
import { makeSandbox } from '../core/helpers'

function setup() {
  const sim = makeSandbox()
  const horse = makeCombatant(95, 'horse', 'neutral', 100, 200, 40, 0, 'right')
  sim.entities.push(horse)
  const presentation = new HorsePresentation()
  presentation.observe(sim)
  return { sim, horse, presentation }
}

describe('horse presentation', () => {
  it('uses the actual second rider, and keeps two mounts independent', () => {
    const { sim, horse, presentation } = setup()
    joinPlayer2(sim, 'zhangfei')
    const p2 = sim.entities.find(e => e.id === sim.player2Id)!
    p2.mountedOn = horse.id
    p2.state = 'walk'
    p2.stateTick = 10
    expect(presentation.pose(horse, sim.entities)).toBe('walk1')
    const other = makeCombatant(96, 'horse', 'neutral', 200, 200, 40, 0, 'right')
    sim.entities.push(other)
    const p1 = playerOf(sim)
    p1.mountedOn = other.id
    p1.state = 'walk'
    p1.stateTick = 0
    expect(presentation.pose(other, sim.entities)).toBe('walk0')
    p1.stateTick = 10
    p2.state = 'attack'
    expect(presentation.pose(other, sim.entities)).toBe('walk1')
    expect(presentation.pose(horse, sim.entities)).toBe('idle')
  })

  it('observes every unfrozen flee step without renders, duplicate sync or pause advancement', () => {
    const { sim, horse, presentation } = setup()
    horse.state = 'fleeing'
    presentation.observe(sim)
    const poses = []
    for (let i = 0; i < 12; i++) {
      stepSim(sim, neutralInput())
      const snapshot = JSON.stringify(sim)
      presentation.observe(sim)
      presentation.observe(sim)
      expect(JSON.stringify(sim)).toBe(snapshot)
      poses.push(presentation.pose(horse, sim.entities))
    }
    expect(new Set(poses)).toEqual(new Set(['walk0', 'walk1']))
    expect(horse.stateTick).toBe(0)
    for (let i = 0; i < 6; i++) { stepSim(sim, neutralInput()); presentation.observe(sim) }
    expect(presentation.pose(horse, sim.entities)).toBe('walk1')
    sim.freezeTicks = 2
    for (let i = 0; i < 2; i++) { stepSim(sim, neutralInput()); presentation.observe(sim) }
    for (let i = 0; i < 10; i++) presentation.observe(sim)
    expect(presentation.pose(horse, sim.entities)).toBe('walk1')
    for (let i = 0; i < 6; i++) { stepSim(sim, neutralInput()); presentation.observe(sim) }
    expect(presentation.pose(horse, sim.entities)).toBe('walk0')
  })

  it('resets on removal, restart, re-entry and keeps fleeing clocks independent', () => {
    const { sim, horse, presentation } = setup()
    horse.state = 'fleeing'
    const other = makeCombatant(96, 'horse', 'neutral', 180, 200, 40, 0, 'right')
    sim.entities.push(other)
    presentation.observe(sim)
    for (let i = 0; i < 6; i++) { stepSim(sim, neutralInput()); presentation.observe(sim) }
    other.state = 'fleeing'
    presentation.observe(sim)
    expect(presentation.pose(horse, sim.entities)).toBe('walk1')
    expect(presentation.pose(other, sim.entities)).toBe('walk0')
    sim.entities = sim.entities.filter(e => e.id !== horse.id)
    presentation.observe(sim)
    sim.entities.push(horse)
    presentation.observe(sim)
    expect(presentation.pose(horse, sim.entities)).toBe('walk0')
    for (let i = 0; i < 6; i++) { stepSim(sim, neutralInput()); presentation.observe(sim) }
    horse.state = 'idle'
    presentation.observe(sim)
    horse.state = 'fleeing'
    presentation.observe(sim)
    expect(presentation.pose(horse, sim.entities)).toBe('walk0')
    presentation.clear()
    presentation.observe(sim)
    expect(presentation.pose(other, sim.entities)).toBe('walk0')
    const restarted = setup()
    presentation.observe(restarted.sim)
    restarted.horse.state = 'fleeing'
    presentation.observe(restarted.sim)
    expect(presentation.pose(restarted.horse, restarted.sim.entities)).toBe('walk0')
  })
})
