import type { SimEvent } from './events'
import type { Rng } from './rng'
import type { StageDef } from './stage'
import type { Entity } from './types'

/**
 * The shape of the world, on its own.
 *
 * `sim.ts` advances this, `snapshot.ts` projects it and `players.ts` asks it
 * questions, and all three need the type. Keeping it here is what lets those
 * modules depend on the STATE rather than on the engine - without it they each
 * had to type-import `sim.ts`, which works only because the import is erased
 * at runtime, and is the kind of arrangement that stops working the moment
 * someone needs a value from it.
 */

/**
 * The world state. Plain data plus the injected RNG; advanced only by
 * stepSim at a fixed 1/60s tick. Given the same seed and the same input
 * sequence, every run is bit-identical.
 */
export interface Sim {
  tick: number
  /** The seed this sim was built from (threaded through scene transitions). */
  seed: number
  rng: Rng
  stage: StageDef
  entities: Entity[]
  playerId: number
  charId: string
  /**
   * Co-op second player. Null until someone joins, and null is the ONLY state
   * the single-player game ever sees - every multi-player branch below reduces
   * to exactly the one-player behaviour when this is null, which is what keeps
   * the existing determinism guarantees intact.
   */
  player2Id: number | null
  char2Id: string | null
  /** Camera left edge in world x. Frozen while a wave is active. */
  scrollX: number
  cameraLocked: boolean
  waveIndex: number
  /** Accumulates during a tick; drained by the caller via drainSimEvents. */
  events: SimEvent[]
  nextEntityId: number
  /** Boss lifecycle: spawned once the player reaches the arena trigger. */
  bossSpawned: boolean
  /** 'fight' until the boss dies ('clear') or the player dies ('gameover'). */
  phase: 'fight' | 'clear' | 'gameover'
  /** Continues remaining. */
  lives: number
  /** Extra-life milestones already paid out: floor(score / 2000). */
  livesEarned: number
  /** Player-facing counters, exposed via the snapshot for the self-play
   * harness (e.g. proving the bot ate food and used the special). */
  stats: {
    foodEaten: number
    specialsUsed: number
    score: number
    /** Current combo chain and its remaining window ticks. */
    comboHits: number
    comboTicksLeft: number
  }
  /** Hit-stop: remaining ticks the world is frozen (tick still advances). */
  freezeTicks: number
}
