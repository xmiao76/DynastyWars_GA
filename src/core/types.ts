/**
 * Core shared types. Everything here is plain JSON-serializable data:
 * no classes, no Phaser imports, no closures in entity state.
 */

export type EntityId = number
export type Facing = 'left' | 'right'
/** Combat alignment; 'neutral' entities (crates, items) can be hit by heroes. */
export type Side = 'hero' | 'enemy' | 'neutral'

/**
 * Abstract input consumed by the simulation. Real play fills this from the
 * keyboard; tests and the self-play harness synthesize it. `attackPressed`
 * and `jumpPressed` are edge-triggered: true for exactly one tick per press.
 */
export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  attackPressed: boolean
  jumpPressed: boolean
  /** Desperation special (costs HP, grants i-frames). */
  specialPressed: boolean
}

export function neutralInput(): InputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    attackPressed: false,
    jumpPressed: false,
    specialPressed: false,
  }
}

/** All states any entity can be in. Keep in sync with KNOWN_STATES in selfplay. */
export type EntityState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'jump'
  | 'jumpattack'
  | 'special'
  | 'grab'
  | 'grabbed'
  | 'thrown'
  | 'fleeing'
  | 'hitstun'
  | 'knockdown'
  | 'getup'
  | 'dying'
  | 'dead'

/**
 * One combatant. Entities are plain data; behavior lives in sim.ts / ai.ts /
 * combat.ts functions so state stays serializable and replayable.
 */
export interface Entity {
  id: EntityId
  /** Character or enemy archetype id, e.g. 'zhaoyun', 'soldier'. */
  kind: string
  side: Side
  /** x: along-stage. y: depth within the walkable band. z: jump height (0 for now). */
  x: number
  y: number
  z: number
  /** Knockback velocity, decays each tick. */
  vx: number
  facing: Facing
  state: EntityState
  /** Ticks elapsed in the current state. */
  stateTick: number
  hp: number
  maxHp: number
  speed: number
  /** Current attack id (from attacks.ts) while attacking. */
  attackId: string | null
  /** Press buffered during an attack; consumed to chain the combo. */
  bufferedAttack: boolean
  /** Targets already struck by the current attack instance. */
  struck: EntityId[]
  /** Ticks until the AI re-evaluates its approach target. */
  thinkTick: number
  /** Per-enemy randomized offset applied to its approach target. */
  targetOffsetX: number
  targetOffsetY: number
  /** Ticks spent airborne in the current jump (freeze-safe jump clock). */
  airTicks: number
  /** Remaining mercy i-frames (post-hitstun / post-getup protection). */
  invulnerableTicks: number
  /** Id of the entity holding this one in a grab, if any. */
  grabbedBy: EntityId | null
  /** World x where a thrown flight began (travel limit). */
  thrownFromX: number
  /** Held weapon item kind, if any. */
  weapon: string | null
  /** Ticks until the held weapon is dropped. */
  weaponTicks: number
  /** Prevents double-rolling a crate/corpse's loot drop. */
  lootRolled: boolean
  /** Boss enrage flag: set once below the HP threshold (ai.ts). */
  enraged: boolean
  /** Player-only: id of the horse currently being ridden, if any. */
  mountedOn: EntityId | null
}
