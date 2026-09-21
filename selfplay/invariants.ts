import { SCREEN_WIDTH } from '../src/core/constants'
import { STAGE_1 } from '../src/core/stage'
import type { GameSnapshot } from '../src/game/debug/bridge'

/**
 * Shared invariant checks for self-play runs. Each violation found is a
 * producer finding: the eval loop turns these into task proposals.
 */
export interface Violation {
  check: string
  detail: string
}

/** Must mirror EntityState in src/core/types.ts. */
const KNOWN_STATES = new Set([
  'idle',
  'walk',
  'attack',
  'jump',
  'jumpattack',
  'special',
  'grab',
  'grabbed',
  'thrown',
  'fleeing',
  'hitstun',
  'knockdown',
  'getup',
  'dying',
  'dead',
])

/** Slack around the walk band for entity y positions (knockback overshoot). */
const BAND_SLACK = 10

/** Perf invariant: max live entities (player + enemies + items) at any poll. */
const ENTITY_COUNT_BOUND = 40

function checkEntity(
  entity: { id: number; x: number; y: number; z: number; hp: number; state: string },
  label: string,
  violations: Violation[],
): void {
  if (!Number.isFinite(entity.x) || !Number.isFinite(entity.y) || !Number.isFinite(entity.z)) {
    violations.push({ check: 'coords-finite', detail: `${label} ${entity.id}: ${entity.x},${entity.y},${entity.z}` })
  }
  if (entity.z < 0) {
    violations.push({ check: 'z-nonnegative', detail: `${label} ${entity.id}: z=${entity.z}` })
  }
  if (entity.y < STAGE_1.walkBandTop - BAND_SLACK || entity.y > STAGE_1.walkBandBottom + BAND_SLACK) {
    violations.push({ check: 'y-in-band', detail: `${label} ${entity.id}: y=${entity.y}` })
  }
  if (entity.hp < 0) {
    violations.push({ check: 'hp-nonnegative', detail: `${label} ${entity.id}: hp=${entity.hp}` })
  }
  if (!KNOWN_STATES.has(entity.state)) {
    violations.push({ check: 'known-state', detail: `${label} ${entity.id}: ${entity.state}` })
  }
}

/** Invariants that must hold after every step batch. */
export function checkInvariants(snapshot: GameSnapshot): Violation[] {
  const violations: Violation[] = []
  if (!Number.isFinite(snapshot.tick) || snapshot.tick < 0) {
    violations.push({ check: 'tick-finite', detail: `tick=${snapshot.tick}` })
  }
  // Snapshot must be JSON round-trippable - the debug bridge contract.
  try {
    if (JSON.stringify(snapshot) === undefined) {
      violations.push({ check: 'snapshot-serializes', detail: 'stringify returned undefined' })
    }
  } catch (err) {
    violations.push({ check: 'snapshot-serializes', detail: String(err) })
  }
  const sim = snapshot.sim
  if (!sim) return violations

  // Perf invariant: the live entity population must stay bounded.
  const entityCount = sim.enemies.length + sim.items.length + 1
  if (entityCount > ENTITY_COUNT_BOUND) {
    violations.push({ check: 'entity-count-bounded', detail: `${entityCount} live entities` })
  }

  checkEntity({ id: -1, ...sim.player }, 'player', violations)
  if (sim.player.hp > sim.player.maxHp) {
    violations.push({ check: 'hp-capped', detail: `player hp=${sim.player.hp} > ${sim.player.maxHp}` })
  }
  // Player two gets the same scrutiny. Checking player one alone would have
  // let a co-op run go green while the second player drifted out of the walk
  // band, went NaN, or healed past their own maximum.
  if (sim.player2) {
    checkEntity({ id: -2, ...sim.player2 }, 'player2', violations)
    if (sim.player2.hp > sim.player2.maxHp) {
      violations.push({
        check: 'hp-capped',
        detail: `player2 hp=${sim.player2.hp} > ${sim.player2.maxHp}`,
      })
    }
  }
  for (const enemy of sim.enemies) checkEntity(enemy, 'enemy', violations)

  const ids = sim.enemies.map((e) => e.id)
  if (new Set(ids).size !== ids.length) {
    violations.push({ check: 'unique-ids', detail: ids.join(',') })
  }
  if (sim.scrollX < 0 || sim.scrollX > sim.stageLength - SCREEN_WIDTH) {
    violations.push({ check: 'scroll-bounds', detail: `scrollX=${sim.scrollX}` })
  }
  if (sim.waveIndex < 0) {
    violations.push({ check: 'wave-nonnegative', detail: `waveIndex=${sim.waveIndex}` })
  }
  return violations
}
