import { playerOf } from './players'
import type { Sim } from './simtypes'
import type { Entity, EntityState, Facing } from './types'

/**
 * The JSON-safe read model of a Sim, for the debug bridge, the self-play bot
 * and the tests.
 *
 * Split out of `sim.ts` because it is a projection rather than part of the
 * engine: nothing here advances the world, and the engine never calls it. It
 * depends on the STATE (`simtypes.ts`) rather than on the engine.
 */

export interface PlayerSnapshot {
  x: number
  y: number
  z: number
  hp: number
  maxHp: number
  state: EntityState
  facing: Facing
  invulnerable: boolean
  weapon: string | null
  /** Riding a horse, and its remaining HP. */
  mounted: boolean
  horseHp: number | null
}

export interface EnemySnapshot {
  id: number
  kind: string
  x: number
  y: number
  z: number
  hp: number
  state: EntityState
  vx: number
  /** True for the stage boss (drives boss-specific bot tactics). */
  boss: boolean
}

export interface ItemSnapshot {
  id: number
  kind: string
  x: number
  y: number
  state: EntityState
}

export interface SimSnapshot {
  tick: number
  scrollX: number
  cameraLocked: boolean
  waveIndex: number
  stageLength: number
  charId: string
  stageId: string
  phase: 'fight' | 'clear' | 'gameover'
  lives: number
  player: PlayerSnapshot
  /** Player two, or null when nobody has joined. */
  player2: PlayerSnapshot | null
  char2Id: string | null
  enemies: EnemySnapshot[]
  /** Neutral entities: crates, food, weapons lying on the ground. */
  items: ItemSnapshot[]
  stats: {
    foodEaten: number
    specialsUsed: number
    score: number
    comboHits: number
    comboTicksLeft: number
  }
}

/** JSON-safe view of the world for the debug bridge and the self-play bot. */
export function snapshotSim(sim: Sim): SimSnapshot {
  const player = playerOf(sim)
  const snapPlayer = (p: Entity): PlayerSnapshot => {
    const mount = p.mountedOn !== null ? sim.entities.find((e) => e.id === p.mountedOn) : undefined
    return {
      x: p.x,
      y: p.y,
      z: p.z,
      hp: p.hp,
      maxHp: p.maxHp,
      state: p.state,
      facing: p.facing,
      invulnerable: p.invulnerableTicks > 0,
      weapon: p.weapon,
      mounted: p.mountedOn !== null,
      horseHp: mount ? mount.hp : null,
    }
  }
  const player2Entity =
    sim.player2Id !== null ? sim.entities.find((e) => e.id === sim.player2Id) : undefined
  const enemies = sim.entities
    .filter((e) => e.side === 'enemy')
    .sort((a, b) => a.id - b.id)
    .map((e) => ({
      id: e.id,
      kind: e.kind,
      x: e.x,
      y: e.y,
      z: e.z,
      hp: e.hp,
      state: e.state,
      vx: e.vx,
      boss: e.kind === sim.stage.bossKind,
    }))
  const items = sim.entities
    .filter((e) => e.side === 'neutral')
    .sort((a, b) => a.id - b.id)
    .map((e) => ({ id: e.id, kind: e.kind, x: e.x, y: e.y, state: e.state }))
  return {
    tick: sim.tick,
    scrollX: sim.scrollX,
    cameraLocked: sim.cameraLocked,
    waveIndex: sim.waveIndex,
    stageLength: sim.stage.length,
    charId: sim.charId,
    stageId: sim.stage.id,
    phase: sim.phase,
    lives: sim.lives,
    player: snapPlayer(player),
    player2: player2Entity ? snapPlayer(player2Entity) : null,
    char2Id: sim.char2Id,
    enemies,
    items,
    stats: { ...sim.stats },
  }
}
