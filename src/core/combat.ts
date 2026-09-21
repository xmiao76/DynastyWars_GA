import { attackById, type AttackDef } from './attacks'
import { DISMOUNT_IFRAMES, GROUND_ATTACK_MAX_Z } from './constants'
import type { SimEvent } from './events'
import { ITEMS } from './items'
import type { Entity, EntityId } from './types'

/**
 * An attack's effective stats after applying the attacker's held weapon.
 * Only heroes wield weapons.
 */
export function effectiveAttack(attacker: Entity, atk: AttackDef): AttackDef {
  if (attacker.side !== 'hero' || attacker.weapon === null) return atk
  const weapon = ITEMS[attacker.weapon]?.weapon
  if (!weapon) return atk
  return {
    ...atk,
    damage: atk.damage + weapon.damageBonus,
    reach: atk.reach + weapon.reachBonus,
  }
}

/**
 * Hitbox of an attack instance: normally a rectangle in front of the
 * attacker; aoe attacks (desperation specials) surround them. z overlap:
 * ground attacks miss targets above GROUND_ATTACK_MAX_Z; aerial attacks
 * connect only while the attacker is airborne.
 */
export interface Hitbox {
  x0: number
  x1: number
  y0: number
  y1: number
}

export function hitboxFor(attacker: Entity): Hitbox {
  const atk = effectiveAttack(attacker, attackById(requireAttackId(attacker)))
  const x0 = atk.aoe
    ? attacker.x - atk.reach
    : attacker.facing === 'right'
      ? attacker.x
      : attacker.x - atk.reach
  return {
    x0,
    x1: x0 + (atk.aoe ? atk.reach * 2 : atk.reach),
    y0: attacker.y - atk.arc,
    y1: attacker.y + atk.arc,
  }
}

export function requireAttackId(entity: Entity): string {
  if (entity.attackId === null) throw new Error(`entity ${entity.id} has no active attack`)
  return entity.attackId
}

export function isInHitbox(box: Hitbox, target: Entity): boolean {
  return target.x >= box.x0 && target.x <= box.x1 && target.y >= box.y0 && target.y <= box.y1
}

function isActiveWindow(entity: Entity, atk: AttackDef): boolean {
  return entity.stateTick >= atk.startup && entity.stateTick < atk.startup + atk.active
}

export function canBeHit(entity: Entity): boolean {
  // Only crates are hittable among neutral entities: pickups and horses must
  // not be destroyed by swings, arrows, or thrown bodies. A mounted horse
  // takes its rider's damage via the redirect in applyHitWithAttack.
  if (entity.side === 'neutral' && entity.kind !== 'crate') return false
  // Dying, downed, held, flying, fleeing, and mercy i-frames are unhittable.
  return entity.state !== 'dying' && entity.state !== 'dead'
    && entity.state !== 'knockdown' && entity.state !== 'getup'
    && entity.state !== 'grabbed' && entity.state !== 'thrown'
    && entity.state !== 'fleeing'
    && entity.invulnerableTicks <= 0
}

/**
 * Apply one hit. Exported so projectile and thrown-body collisions (sim.ts)
 * share the exact damage / knockback / knockdown / KO path as melee hits.
 */
export function applyHitWithAttack(
  attacker: Entity,
  target: Entity,
  atk: AttackDef,
  events: SimEvent[],
  entities?: Entity[],
): void {
  // A mounted rider's horse takes the hit instead.
  if (target.mountedOn !== null && entities) {
    const horse = entities.find((e) => e.id === target.mountedOn)
    if (horse) {
      horse.hp = Math.max(0, horse.hp - atk.damage)
      events.push({ type: 'hit', attackerId: attacker.id, targetId: horse.id, damage: atk.damage })
      if (horse.hp === 0) {
        horse.state = 'fleeing'
        horse.stateTick = 0
        target.mountedOn = null
        target.invulnerableTicks = DISMOUNT_IFRAMES
        events.push({ type: 'dismount', id: target.id })
      }
      return
    }
  }
  attacker.struck.push(target.id)
  target.hp = Math.max(0, target.hp - atk.damage)
  events.push({ type: 'hit', attackerId: attacker.id, targetId: target.id, damage: atk.damage })

  const direction = attacker.facing === 'right' ? 1 : -1
  target.vx = atk.knockback * direction
  target.attackId = null
  target.bufferedAttack = false
  target.stateTick = 0

  if (target.hp === 0) {
    target.state = 'dying'
    target.z = 0 // corpses land on the ground plane
    events.push({ type: 'ko', id: target.id })
    return
  }
  if (atk.knockdown || target.z > 0) {
    // Heavy hits - and any hit taken mid-air - knock the target down.
    target.state = 'knockdown'
    target.z = 0
    // Getting knocked down means dropping your weapon.
    target.weapon = null
    target.weaponTicks = 0
  } else {
    target.state = 'hitstun'
  }
}

const ATTACKING_STATES = new Set(['attack', 'jumpattack', 'special'])

/**
 * Resolve all live attack hitboxes against valid targets. Each attack
 * instance strikes any given target at most once (tracked via `struck`).
 */
export function resolveAttacks(entities: Entity[], events: SimEvent[]): void {
  for (const attacker of entities) {
    if (!ATTACKING_STATES.has(attacker.state)) continue
    const atk = effectiveAttack(attacker, attackById(requireAttackId(attacker)))
    if (!isActiveWindow(attacker, atk)) continue
    if (atk.aerial && attacker.z <= 0) continue
    const box = hitboxFor(attacker)
    for (const target of entities) {
      if (target.side === attacker.side) continue
      if (target.id === attacker.id) continue
      if (!canBeHit(target)) continue
      if (attacker.struck.includes(target.id)) continue
      if (!atk.aerial && target.z > GROUND_ATTACK_MAX_Z) continue
      if (isInHitbox(box, target)) applyHitWithAttack(attacker, target, atk, events, entities)
    }
  }
}

export function isAlive(id: EntityId, entities: Entity[]): boolean {
  const entity = entities.find((e) => e.id === id)
  return entity !== undefined && entity.state !== 'dying' && entity.state !== 'dead'
}
