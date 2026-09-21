import { characterById } from './characters'
import type { Sim } from './simtypes'
import type { Entity } from './types'

/**
 * Read-only queries over the players in a Sim.
 *
 * Split out of `sim.ts`, which had reached 978 lines against the 800 this
 * project sets itself, because these are pure questions about world state and
 * nothing here advances it.
 *
 * The dependency is on the STATE (`simtypes.ts`), not on the engine, so this
 * module never touches `sim.ts` at all. The mutating counterparts -
 * `joinPlayer2` and `tryRevivePlayer` - deliberately stayed behind: they need
 * `spawnEntity` and `enterState`, which are private to the engine, and
 * dragging those into the open to move two functions would have put a real
 * runtime cycle through the code the sim's determinism rests on.
 */

/** Every player entity present, player one first. */
export function playersOf(sim: Sim): Entity[] {
  const out: Entity[] = []
  for (const e of sim.entities) {
    if (e.id === sim.playerId || (sim.player2Id !== null && e.id === sim.player2Id)) out.push(e)
  }
  return out
}

/** Players still standing. Empty means the run is over. */
export function livingPlayersOf(sim: Sim): Entity[] {
  return playersOf(sim).filter((e) => e.state !== 'dead')
}

/** Is this entity one of the players? */
export function isPlayerId(sim: Sim, id: number): boolean {
  return id === sim.playerId || (sim.player2Id !== null && id === sim.player2Id)
}

/** The character sheet driving a given player entity. */
export function characterOf(sim: Sim, player: Entity): ReturnType<typeof characterById> {
  const id = player.id === sim.player2Id && sim.char2Id !== null ? sim.char2Id : sim.charId
  return characterById(id)
}

/**
 * The player the camera and the enemies orient on: the one furthest into the
 * stage. With a single player this is that player, unchanged.
 */
export function leadPlayerOf(sim: Sim): Entity {
  const living = livingPlayersOf(sim)
  const pool = living.length > 0 ? living : playersOf(sim)
  let lead = pool[0] ?? playerOf(sim)
  for (const p of pool) if (p.x > lead.x) lead = p
  return lead
}

/** Nearest living player to a point - who an enemy should go after. */
export function nearestPlayerTo(sim: Sim, x: number, y: number): Entity {
  const living = livingPlayersOf(sim)
  const pool = living.length > 0 ? living : playersOf(sim)
  let best = pool[0] ?? playerOf(sim)
  let bestD = Number.POSITIVE_INFINITY
  for (const p of pool) {
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

export function playerOf(sim: Sim): Entity {
  const player = sim.entities.find((e) => e.id === sim.playerId)
  if (!player) throw new Error('player entity missing from sim')
  return player
}
