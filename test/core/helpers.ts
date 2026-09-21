import { createSim, drainSimEvents, type Sim } from '../../src/core/sim'

/**
 * A sim with all spawned entities stripped except the player and the camera
 * unlocked, so a test can inject exactly the entities it wants to observe.
 * Not a test file - shared helper.
 */
export function makeSandbox(seed = 42): Sim {
  const sim = createSim(seed)
  sim.entities = sim.entities.filter((e) => e.side === 'hero')
  sim.cameraLocked = false
  drainSimEvents(sim)
  return sim
}
