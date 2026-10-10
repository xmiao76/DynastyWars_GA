import type { Entity } from '../core/types'
import type { Sim } from '../core/sim'
import type { Pose } from './adapters/sprites'

type HorseHistory = { x: number; tick: number; fleeing: boolean; fleeTick: number }

/** Observe each actual simulation step, not each render. No core writes/clocks. */
export class HorsePresentation {
  private sim: Sim | undefined
  private history = new Map<number, HorseHistory>()

  clear(): void {
    this.history.clear()
    this.sim = undefined
  }

  observe(sim: Sim): void {
    if (this.sim !== sim) {
      this.clear()
      this.sim = sim
    }
    const seen = new Set<number>()
    for (const horse of sim.entities) {
      if (horse.kind !== 'horse') continue
      seen.add(horse.id)
      const previous = this.history.get(horse.id)
      const fleeing = horse.state === 'fleeing'
      // Core flee movement is one positive-x advance per unfrozen step.
      // Comparing positions also freezes the last hit-stop step (whose
      // freezeTicks has already decremented to zero). Repeated sync is inert.
      const moved = previous && sim.tick > previous.tick && horse.x > previous.x
      const fleeTick = fleeing ? (previous?.fleeing ? previous.fleeTick : 0) + (moved ? 1 : 0) : 0
      this.history.set(horse.id, { x: horse.x, tick: sim.tick, fleeing, fleeTick })
    }
    for (const id of this.history.keys()) if (!seen.has(id)) this.history.delete(id)
  }

  pose(horse: Entity, entities: readonly Entity[]): Pose {
    const rider = entities.find(e => e.side === 'hero' && e.mountedOn === horse.id)
    if (rider) {
      return rider.state === 'walk' ? (Math.floor(rider.stateTick / 10) % 2 === 0 ? 'walk0' : 'walk1') : 'idle'
    }
    const tick = this.history.get(horse.id)?.fleeTick ?? 0
    return horse.state === 'fleeing' ? (Math.floor(tick / 6) % 2 === 0 ? 'walk0' : 'walk1') : 'idle'
  }
}
