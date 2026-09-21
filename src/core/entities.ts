import type { Entity, Facing, Side } from './types'

/** Entity factories. Everything spawned into the sim starts here. */

export function makeCombatant(
  id: number,
  kind: string,
  side: Side,
  x: number,
  y: number,
  maxHp: number,
  speed: number,
  facing: Facing,
): Entity {
  return {
    id,
    kind,
    side,
    x,
    y,
    z: 0,
    vx: 0,
    facing,
    state: 'idle',
    stateTick: 0,
    hp: maxHp,
    maxHp,
    speed,
    attackId: null,
    bufferedAttack: false,
    struck: [],
    thinkTick: 0,
    targetOffsetX: 0,
    targetOffsetY: 0,
    airTicks: 0,
    invulnerableTicks: 0,
    grabbedBy: null,
    thrownFromX: 0,
    weapon: null,
    weaponTicks: 0,
    lootRolled: false,
    enraged: false,
    mountedOn: null,
  }
}

/** Projectiles fly straight at constant velocity and never think. */
export function makeProjectile(
  id: number,
  kind: string,
  side: Side,
  x: number,
  y: number,
  z: number,
  vx: number,
  facing: Facing,
): Entity {
  return { ...makeCombatant(id, kind, side, x, y, 1, 0, facing), z, vx, state: 'walk' }
}

export function isProjectile(entity: Entity): boolean {
  return entity.kind === 'arrow'
}
