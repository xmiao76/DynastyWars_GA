import type { EntityId } from './types'

/**
 * Per-tick simulation events. The sim appends; the presentation layer (or a
 * test) drains them each frame to drive flashes, sfx, and assertions.
 */
export type SimEvent =
  | { type: 'spawn'; id: EntityId; kind: string }
  /** Player two dropped into the stage (co-op). */
  | { type: 'join'; id: EntityId }
  | { type: 'swing'; id: EntityId }
  | { type: 'jump'; id: EntityId }
  | { type: 'land'; id: EntityId }
  | { type: 'hit'; attackerId: EntityId; targetId: EntityId; damage: number }
  | { type: 'ko'; id: EntityId }
  | { type: 'wave-cleared'; waveIndex: number }
  | { type: 'throw'; id: EntityId }
  | { type: 'pickup'; id: EntityId; kind: string }
  | { type: 'special'; id: EntityId }
  | { type: 'enrage'; id: EntityId }
  | { type: 'stageclear' }
  | { type: 'gameover' }
  | { type: 'revive'; id: EntityId }
  | { type: 'extralife' }
