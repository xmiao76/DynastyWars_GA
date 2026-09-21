import { attackById, totalFrames } from './attacks'
import {
  ARCHER_FIRE_ARC,
  ARCHER_FIRE_RANGE,
  ARCHER_MAX_RANGE,
  ARCHER_MIN_RANGE,
  ARCHER_SCREEN_MARGIN,
  ARROW_SPEED,
  enemyByKind,
  type EnemyDef,
} from './enemies'
import { makeProjectile } from './entities'
import { GETUP_TICKS, KNOCKDOWN_TICKS, SCREEN_WIDTH } from './constants'
import type { Sim } from './sim'
import type { Entity } from './types'

/** Enrage threshold: bosses flip to their aggressive pattern below this HP ratio. */
export const ENRAGE_HP_RATIO = 0.3

/** Boss dash speed during charge.dash's active window (px/tick). */
const BOSS_DASH_SPEED = 3.2

/**
 * Enemy behavior. Melee enemies align depth, close in, and swing; archers
 * hold a distance band and fire arrows; bosses run a pattern FSM with an
 * enrage. Decisions re-evaluate on a think cadence; randomness comes from
 * the sim's seeded RNG, so runs replay.
 * (`Sim` is a type-only import, so the module graph stays acyclic.)
 */
export function stepEnemy(sim: Sim, enemy: Entity, player: Entity): void {
  const def = enemyByKind(enemy.kind)
  // Grabbed and thrown states are driven by the grabber / throw physics in
  // sim.ts; the enemy's own AI clock does not run during them.
  if (enemy.state === 'grabbed' || enemy.state === 'thrown') return
  enemy.stateTick += 1

  switch (enemy.state) {
    case 'walk':
    case 'idle': {
      if (player.state === 'dying' || player.state === 'dead') {
        enemy.state = 'idle'
        break
      }
      enemy.state = 'walk'
      if (def.kind === 'archer') stepArcher(sim, enemy, def, player)
      else if (def.boss) stepBoss(sim, enemy, def, player)
      else stepMelee(sim, enemy, def, player)
      break
    }
    case 'attack': {
      const atk = attackById(enemy.attackId ?? def.attackId)
      // Charge attacks drive the boss forward through the active window.
      if (enemy.attackId?.startsWith('charge.') && enemy.stateTick >= atk.startup && enemy.stateTick < atk.startup + atk.active) {
        enemy.x += (enemy.facing === 'right' ? 1 : -1) * BOSS_DASH_SPEED
      }
      if (enemy.stateTick >= totalFrames(atk)) {
        enemy.state = 'walk'
        enemy.stateTick = 0
        enemy.attackId = null
        enemy.thinkTick = sim.rng.range(10, 30)
      }
      break
    }
    case 'hitstun': {
      if (enemy.stateTick >= def.hitstunTicks) {
        enemy.state = 'walk'
        enemy.stateTick = 0
      }
      break
    }
    case 'knockdown': {
      if (enemy.stateTick >= KNOCKDOWN_TICKS) {
        enemy.state = 'getup'
        enemy.stateTick = 0
      }
      break
    }
    case 'getup': {
      if (enemy.stateTick >= GETUP_TICKS) {
        enemy.state = 'walk'
        enemy.stateTick = 0
      }
      break
    }
    case 'dying':
    case 'dead':
      break
  }
}

function startEnemyAttack(sim: Sim, enemy: Entity, attackId: string): void {
  enemy.state = 'attack'
  enemy.stateTick = 0
  enemy.attackId = attackId
  enemy.struck = []
  sim.events.push({ type: 'swing', id: enemy.id })
}

function stepMelee(sim: Sim, enemy: Entity, def: EnemyDef, player: Entity): void {
  enemy.thinkTick -= 1
  if (enemy.thinkTick <= 0) {
    enemy.thinkTick = def.thinkInterval
    enemy.targetOffsetX = sim.rng.range(-12, 12)
    enemy.targetOffsetY = sim.rng.range(-6, 6)
  }
  const goalX = player.x + enemy.targetOffsetX
  const goalY = player.y + enemy.targetOffsetY
  const dx = goalX - enemy.x
  const dy = goalY - enemy.y
  const atk = attackById(def.attackId)
  const inReach = Math.abs(player.x - enemy.x) <= atk.reach - 4
  const inArc = Math.abs(player.y - enemy.y) <= atk.arc - 2
  if (inReach && inArc) {
    enemy.facing = player.x >= enemy.x ? 'right' : 'left'
    startEnemyAttack(sim, enemy, def.attackId)
  } else {
    if (Math.abs(dx) > 1) enemy.x += Math.sign(dx) * Math.min(def.speed, Math.abs(dx))
    if (Math.abs(dy) > 1) enemy.y += Math.sign(dy) * Math.min(def.speed * 0.7, Math.abs(dy))
    enemy.facing = dx >= 0 ? 'right' : 'left'
  }
}

/**
 * Boss pattern FSM: approach -> charge at range, combo/heavy up close, and
 * enrage below the boss's ratio (faster cadence, charge-happy). Pattern data
 * comes from EnemyDef.boss, so each boss plays differently.
 */
function stepBoss(sim: Sim, boss: Entity, def: EnemyDef, player: Entity): void {
  const bossDef = def.boss
  if (!bossDef) throw new Error(`boss pattern data missing for ${def.kind}`)

  if (!boss.enraged && boss.hp <= boss.maxHp * bossDef.enrageRatio) {
    boss.enraged = true
    sim.events.push({ type: 'enrage', id: boss.id })
  }

  const dx = player.x - boss.x
  const dy = player.y - boss.y
  const dist = Math.abs(dx)
  const speed = boss.enraged ? def.speed * 1.4 : def.speed

  // Always drifting toward the player while deciding.
  if (dist > 1) boss.x += Math.sign(dx) * Math.min(speed, dist)
  if (Math.abs(dy) > 1) boss.y += Math.sign(dy) * Math.min(speed * 0.7, Math.abs(dy))
  boss.facing = dx >= 0 ? 'right' : 'left'

  boss.thinkTick -= 1
  if (boss.thinkTick > 0) return
  boss.thinkTick = boss.enraged
    ? sim.rng.range(bossDef.enragedThinkRange[0], bossDef.enragedThinkRange[1])
    : sim.rng.range(bossDef.thinkRange[0], bossDef.thinkRange[1])

  const heavy = attackById(bossDef.heavy)
  const inMelee = dist <= heavy.reach - 4 && Math.abs(dy) <= heavy.arc - 2
  if (dist > 110) {
    startEnemyAttack(sim, boss, bossDef.charge)
  } else if (inMelee) {
    startEnemyAttack(sim, boss, sim.rng.next() < 0.6 ? bossDef.combo : bossDef.heavy)
  }
  // Mid-range: keep drifting (the next think comes soon).
}

function stepArcher(sim: Sim, enemy: Entity, def: EnemyDef, player: Entity): void {
  // Archers fight inside the visible screen: the locked camera leashes the
  // player to it, so an offscreen archer is unreachable and unbeatable.
  const screenMin = sim.scrollX + ARCHER_SCREEN_MARGIN
  const screenMax = sim.scrollX + SCREEN_WIDTH - ARCHER_SCREEN_MARGIN
  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const dist = Math.abs(dx)

  if (enemy.x > screenMax) {
    enemy.x -= def.speed
  } else if (enemy.x < screenMin) {
    enemy.x += def.speed
  } else if (dist < ARCHER_MIN_RANGE) {
    // Back off when crowded; if exactly on top of the player, pick a side
    // deterministically by entity id.
    const away = dist > 0 ? -Math.sign(dx) : enemy.id % 2 === 0 ? 1 : -1
    enemy.x += away * def.speed
    enemy.x = Math.min(Math.max(enemy.x, screenMin), screenMax)
  } else if (dist > ARCHER_MAX_RANGE) {
    enemy.x += Math.sign(dx) * def.speed
  }
  if (Math.abs(dy) > 4) enemy.y += Math.sign(dy) * def.speed * 0.6
  enemy.facing = dx >= 0 ? 'right' : 'left'

  enemy.thinkTick -= 1
  if (enemy.thinkTick <= 0) {
    enemy.thinkTick = def.fireInterval
    if (Math.abs(dy) <= ARCHER_FIRE_ARC && dist <= ARCHER_FIRE_RANGE) {
      const direction = enemy.facing === 'right' ? 1 : -1
      const arrow = makeProjectile(
        sim.nextEntityId,
        'arrow',
        'enemy',
        enemy.x + direction * 10,
        enemy.y,
        10,
        direction * ARROW_SPEED,
        enemy.facing,
      )
      sim.nextEntityId += 1
      sim.entities.push(arrow)
      sim.events.push({ type: 'spawn', id: arrow.id, kind: 'arrow' })
    }
  }
}
