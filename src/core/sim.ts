import { attackById, HERO_ARROW_SPEED, totalFrames } from './attacks'
import { stepEnemy } from './ai'
import { characterById, nextComboAttack } from './characters'
import { applyHitWithAttack, canBeHit, requireAttackId, resolveAttacks } from './combat'
import {
  ARROW_CHEST_Z,
  ARROW_FALL,
  ARROW_LEVEL_TRAVEL,
  ARROW_MAX_TRAVEL,
  ARROW_Z,
  BOSS_TRIGGER_DISTANCE,
  COMBO_WINDOW_TICKS,
  DYING_TICKS,
  EDGE_MARGIN,
  GETUP_TICKS,
  GRAB_HOLD_TICKS,
  GRAB_RANGE_X,
  GRAB_RANGE_Y,
  ITEM_LIFETIME_TICKS,
  JUMP_DURATION,
  JUMP_HEIGHT,
  KNOCKDOWN_TICKS,
  PLAYER_HITSTUN_TICKS,
  PLAYER_MERCY_TICKS,
  SCORE_PER_EXTRA_LIFE,
  SCREEN_WIDTH,
  THROW_SPEED,
  THROW_TRAVEL,
  THROWN_Z,
} from './constants'
import { isProjectile, makeCombatant, makeProjectile } from './entities'
import {
  characterOf,
  isPlayerId,
  leadPlayerOf,
  livingPlayersOf,
  nearestPlayerTo,
  playerOf,
  playersOf,
} from './players'
import { enemyByKind } from './enemies'
import type { SimEvent } from './events'
import { CRATE_LOOT, ENEMY_DROP, ITEMS, rollLoot } from './items'
import { createRng } from './rng'
import { STAGE_1, STAGES, type WaveDef } from './stage'
import type { Sim } from './simtypes'
import { neutralInput, type Entity, type EntityState, type InputState } from './types'


function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Parabolic jump curve: 0 at both ends, JUMP_HEIGHT at the midpoint. */
export function jumpHeight(elapsed: number): number {
  if (elapsed <= 0 || elapsed >= JUMP_DURATION) return 0
  const t = elapsed / JUMP_DURATION
  return JUMP_HEIGHT * 4 * t * (1 - t)
}

function spawnEntity(sim: Sim, entity: Entity): void {
  sim.entities.push(entity)
  sim.events.push({ type: 'spawn', id: entity.id, kind: entity.kind })
  sim.nextEntityId += 1
}

function spawnWave(sim: Sim, wave: WaveDef | undefined): void {
  if (!wave) return
  for (const spawn of wave.spawns) {
    const def = enemyByKind(spawn.kind)
    const x = spawn.x + sim.rng.range(-10, 10)
    const y = sim.rng.range(sim.stage.walkBandTop + 4, sim.stage.walkBandBottom - 4)
    const enemy = makeCombatant(sim.nextEntityId, def.kind, 'enemy', x, y, def.maxHp, def.speed, 'left')
    enemy.thinkTick = sim.rng.range(0, def.thinkInterval)
    spawnEntity(sim, enemy)
  }
}

function spawnProps(sim: Sim): void {
  for (const prop of sim.stage.props) {
    const crate = makeCombatant(sim.nextEntityId, prop.kind, 'neutral', prop.x, sim.stage.walkBandBottom - 8, 6, 0, 'left')
    spawnEntity(sim, crate)
  }
}

export interface CreateSimOptions {
  charId?: string
  stageId?: string
  lives?: number
  /** Score carried over from earlier stages in the same run. */
  score?: number
}

export function createSim(seed: number, options: CreateSimOptions = {}): Sim {
  const { charId = 'zhaoyun', stageId = 'stage1', lives = 3, score = 0 } = options
  const stage = STAGES[stageId] ?? STAGE_1
  const character = characterById(charId)
  const sim: Sim = {
    tick: 0,
    seed,
    rng: createRng(seed),
    stage,
    entities: [],
    playerId: 1,
    charId: character.id,
    player2Id: null,
    char2Id: null,
    scrollX: 0,
    cameraLocked: true,
    waveIndex: 0,
    events: [],
    nextEntityId: 1,
    bossSpawned: false,
    phase: 'fight',
    lives,
    livesEarned: Math.floor(score / SCORE_PER_EXTRA_LIFE),
    stats: { foodEaten: 0, specialsUsed: 0, score, comboHits: 0, comboTicksLeft: 0 },
    freezeTicks: 0,
  }
  const startY = Math.round((stage.walkBandTop + stage.walkBandBottom) / 2)
  const player = makeCombatant(
    sim.nextEntityId,
    character.id,
    'hero',
    120,
    startY,
    character.maxHp,
    character.walkSpeed,
    'right',
  )
  spawnEntity(sim, player)
  spawnWave(sim, stage.waves[0])
  spawnProps(sim)
  return sim
}

/** Grace period on joining or reviving, long enough to escape a crowd. */
const JOIN_INVULNERABLE_TICKS = 90

/**
 * Bring player two into an in-progress stage (arcade drop-in). Returns false
 * when someone has already joined. They arrive beside player one with the same
 * generous invulnerability a continue grants, so joining mid-fight is not an
 * instant death.
 */
export function joinPlayer2(sim: Sim, charId: string): boolean {
  if (sim.player2Id !== null) return false
  const character = characterById(charId)
  const p1 = playerOf(sim)
  const x = clamp(p1.x - 24, sim.scrollX + EDGE_MARGIN, sim.scrollX + SCREEN_WIDTH - EDGE_MARGIN)
  const player2 = makeCombatant(
    sim.nextEntityId,
    character.id,
    'hero',
    x,
    p1.y,
    character.maxHp,
    character.walkSpeed,
    'right',
  )
  player2.invulnerableTicks = JOIN_INVULNERABLE_TICKS
  spawnEntity(sim, player2)
  sim.player2Id = player2.id
  sim.char2Id = character.id
  sim.events.push({ type: 'join', id: player2.id })
  return true
}


/**
 * Spend a life to revive the player in place (arcade continue). Returns
 * false when out of lives or the player is not dead.
 */
export function tryRevivePlayer(sim: Sim, playerId?: number): boolean {
  const id = playerId ?? sim.playerId
  const player = sim.entities.find((e) => e.id === id)
  if (!player || sim.lives <= 0 || player.state !== 'dead') return false
  sim.lives -= 1
  player.hp = player.maxHp
  player.z = 0
  player.vx = 0
  player.attackId = null
  player.bufferedAttack = false
  // Respawn at a safe spot on the left of the current view, with generous
  // i-frames to escape whatever killed us.
  player.x = clamp(sim.scrollX + 80, sim.scrollX + EDGE_MARGIN, sim.scrollX + SCREEN_WIDTH - EDGE_MARGIN)
  player.y = Math.round((sim.stage.walkBandTop + sim.stage.walkBandBottom) / 2)
  enterState(player, 'idle')
  player.invulnerableTicks = JOIN_INVULNERABLE_TICKS
  sim.phase = 'fight'
  sim.events.push({ type: 'revive', id: player.id })
  return true
}

function enterState(entity: Entity, state: EntityState): void {
  entity.state = state
  entity.stateTick = 0
}

function startAttack(
  sim: Sim,
  entity: Entity,
  attackId: string,
  state: 'attack' | 'jumpattack' | 'special' = 'attack',
): void {
  enterState(entity, state)
  entity.attackId = attackId
  entity.bufferedAttack = false
  entity.struck = []
  sim.events.push({ type: 'swing', id: entity.id })
}

function startJump(sim: Sim, player: Entity): void {
  enterState(player, 'jump')
  player.airTicks = 0
  sim.events.push({ type: 'jump', id: player.id })
}

/** Ground movement shared by idle/walk and (as air control) jump states. */
function moveWithInput(player: Entity, input: InputState, walkSpeed: number): boolean {
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
  if (dx === 0 && dy === 0) return false
  player.x += dx * walkSpeed
  player.y += dy * walkSpeed * 0.75
  if (dx !== 0) player.facing = dx > 0 ? 'right' : 'left'
  return true
}

function stepPlayer(sim: Sim, player: Entity, input: InputState): void {
  const character = characterOf(sim, player)
  player.stateTick += 1
  if (player.invulnerableTicks > 0) player.invulnerableTicks -= 1
  if (player.weaponTicks > 0) {
    player.weaponTicks -= 1
    if (player.weaponTicks === 0) player.weapon = null
  }

  switch (player.state) {
    case 'attack': {
      if (input.attackPressed) player.bufferedAttack = true
      const attackId = requireAttackId(player)
      if (player.stateTick >= totalFrames(attackById(attackId))) {
        const next = player.bufferedAttack ? nextComboAttack(character, attackId) : undefined
        if (next) {
          startAttack(sim, player, next)
        } else {
          enterState(player, 'idle')
          player.attackId = null
          player.bufferedAttack = false
        }
      }
      break
    }
    case 'special': {
      if (player.stateTick >= totalFrames(attackById(requireAttackId(player)))) {
        player.attackId = null
        enterState(player, 'idle')
      }
      break
    }
    case 'grab': {
      if (input.attackPressed) {
        const held = sim.entities.find((e) => e.grabbedBy === player.id)
        if (held) {
          held.grabbedBy = null
          enterState(held, 'thrown')
          held.vx = (player.facing === 'right' ? 1 : -1) * THROW_SPEED
          held.thrownFromX = held.x
          held.z = THROWN_Z
          held.struck = []
          sim.events.push({ type: 'throw', id: held.id })
        }
        enterState(player, 'idle')
      }
      break
    }
    case 'jump': {
      // airTicks counts airborne ticks only on unfrozen frames - hit-stop
      // must never fast-forward the arc.
      player.airTicks += 1
      player.z = jumpHeight(player.airTicks)
      if (player.airTicks >= JUMP_DURATION) {
        player.z = 0
        enterState(player, 'idle')
        sim.events.push({ type: 'land', id: player.id })
        break
      }
      moveWithInput(player, input, character.walkSpeed)
      if (input.attackPressed) startAttack(sim, player, character.jumpAttack, 'jumpattack')
      break
    }
    case 'jumpattack': {
      player.airTicks += 1
      player.z = jumpHeight(player.airTicks)
      if (player.airTicks >= JUMP_DURATION) {
        player.z = 0
        player.attackId = null
        enterState(player, 'idle')
        sim.events.push({ type: 'land', id: player.id })
        break
      }
      moveWithInput(player, input, character.walkSpeed)
      break
    }
    case 'hitstun': {
      if (player.stateTick >= PLAYER_HITSTUN_TICKS) {
        enterState(player, 'idle')
        player.invulnerableTicks = PLAYER_MERCY_TICKS
      }
      break
    }
    case 'knockdown': {
      if (player.stateTick >= KNOCKDOWN_TICKS) enterState(player, 'getup')
      break
    }
    case 'getup': {
      if (player.stateTick >= GETUP_TICKS) {
        enterState(player, 'idle')
        player.invulnerableTicks = PLAYER_MERCY_TICKS
      }
      break
    }
    case 'idle':
    case 'walk': {
      if (input.specialPressed && player.hp > character.specialCost) {
        // Desperation special: costs HP, i-frames for the move's duration.
        player.hp -= character.specialCost
        startAttack(sim, player, character.specialAttack, 'special')
        const specialDef = attackById(character.specialAttack)
        player.invulnerableTicks = Math.max(player.invulnerableTicks, totalFrames(specialDef))
        sim.stats.specialsUsed += 1
        sim.events.push({ type: 'special', id: player.id })
        if (character.specialFiresProjectile) {
          // Huang Zhong's bow shot.
          const dir = player.facing === 'right' ? 1 : -1
          const arrow = makeProjectile(
            sim.nextEntityId,
            'arrow',
            'hero',
            player.x + dir * 10,
            player.y,
            ARROW_Z,
            dir * HERO_ARROW_SPEED,
            player.facing,
          )
          spawnEntity(sim, arrow)
        }
        break
      }
      if (input.attackPressed) {
        const attackId = character.combo[0]
        if (attackId) {
          startAttack(sim, player, attackId)
          break
        }
      }
      if (input.jumpPressed) {
        startJump(sim, player)
        break
      }
      player.state = moveWithInput(player, input, character.walkSpeed) ? 'walk' : 'idle'
      break
    }
    case 'grabbed':
    case 'thrown':
    case 'dying':
    case 'dead':
      break
  }
}

/**
 * Projectiles fly at chest height, fall to the ground past their level range,
 * hit the first opposing combatant they touch, and die at the stage edges or
 * at their farthest range. `stateTick` counts flight ticks (nothing else reads
 * it on a projectile), so travelled distance is exact and deterministic.
 */
function stepProjectiles(sim: Sim): void {
  for (const projectile of sim.entities) {
    if (!isProjectile(projectile) || projectile.state === 'dead') continue
    projectile.stateTick += 1
    projectile.x += projectile.vx
    const traveled = projectile.stateTick * Math.abs(projectile.vx)
    if (projectile.x < 0 || projectile.x > sim.stage.length) {
      projectile.state = 'dead'
      continue
    }
    // Past its level range the arrow drops toward the ground and is gone at
    // contact; the travel cap catches anything still airborne at max range.
    if (traveled >= ARROW_LEVEL_TRAVEL) projectile.z -= ARROW_FALL
    if (projectile.z <= 0 || traveled >= ARROW_MAX_TRAVEL) {
      projectile.state = 'dead'
      continue
    }
    for (const target of sim.entities) {
      if (target.side === projectile.side) continue
      if (isProjectile(target)) continue
      if (!canBeHit(target)) continue
      const inRange =
        Math.abs(target.x - projectile.x) <= 8 &&
        Math.abs(target.y - projectile.y) <= 10 &&
        // Chest-band z. The arrow flies at ARROW_Z and is tested against
        // ARROW_CHEST_Z above the target's feet, so grounded targets are hit
        // and jumps clear the arrow exactly as when arrows flew at z = 10
        // against target.z (ARROW_Z - ARROW_CHEST_Z is that old offset). As
        // the arrow falls, the band slides down with it - a dying arrow skims
        // low, which is what a falling arrow should hit.
        Math.abs(target.z + ARROW_CHEST_Z - projectile.z) <= 16
      if (inRange) {
        const impact = attackById(projectile.side === 'hero' ? 'heroarrow.hit' : 'arrow.hit')
        applyHitWithAttack(projectile, target, impact, sim.events, sim.entities)
        projectile.state = 'dead'
        break
      }
    }
  }
}

/** Thrown enemies fly straight, bowl through other enemies, and crash. */
function stepThrown(sim: Sim): void {
  for (const thrown of sim.entities) {
    if (thrown.state !== 'thrown') continue
    thrown.z = THROWN_Z
    for (const target of sim.entities) {
      if (target.id === thrown.id || target.side === 'hero') continue
      if (isProjectile(target)) continue
      if (!canBeHit(target)) continue
      if (thrown.struck.includes(target.id)) continue
      const inRange =
        Math.abs(target.x - thrown.x) <= 12 &&
        Math.abs(target.y - thrown.y) <= 12 &&
        target.z <= 24
      if (inRange) applyHitWithAttack(thrown, target, attackById('throw.body'), sim.events, sim.entities)
    }
    const traveled = Math.abs(thrown.x - thrown.thrownFromX)
    if (traveled >= THROW_TRAVEL || thrown.x <= 0 || thrown.x >= sim.stage.length) {
      // The landing impact hurts the thrown enemy too.
      thrown.vx = 0
      thrown.z = 0
      applyHitWithAttack(thrown, thrown, attackById('throw.land'), sim.events, sim.entities)
    }
  }
}

/** Grab lifecycle: pin the held enemy, expire the hold, start new grabs. */
function stepGrab(sim: Sim): void {
  for (const player of playersOf(sim)) stepGrabFor(sim, player)
}

function stepGrabFor(sim: Sim, player: Entity): void {
  for (const entity of sim.entities) {
    if (entity.grabbedBy !== player.id) continue
    if (player.state !== 'grab') {
      // Grab broken (throw, or the player got hit): the enemy is free.
      entity.grabbedBy = null
      if (entity.state === 'grabbed') enterState(entity, 'walk')
      continue
    }
    entity.state = 'grabbed'
    entity.stateTick += 1
    entity.x = player.x + (player.facing === 'right' ? 16 : -16)
    entity.y = player.y
    entity.vx = 0
    if (entity.stateTick >= GRAB_HOLD_TICKS) {
      entity.grabbedBy = null
      enterState(entity, 'knockdown')
      enterState(player, 'idle')
    }
  }

  if (player.state !== 'walk') return
  for (const enemy of sim.entities) {
    if (enemy.side !== 'enemy' || isProjectile(enemy)) continue
    // Someone else's hostage. Held enemies are already excluded by the state
    // check below - the holder pins them to 'grabbed' every tick - but in
    // co-op this invariant matters enough to say out loud rather than leave it
    // resting on a side effect of another loop.
    if (enemy.grabbedBy !== null) continue
    if (enemy.state !== 'walk' && enemy.state !== 'idle' && enemy.state !== 'attack') continue
    const toward = player.facing === 'right' ? enemy.x >= player.x : enemy.x <= player.x
    if (!toward) continue
    if (Math.abs(enemy.x - player.x) > GRAB_RANGE_X) continue
    if (Math.abs(enemy.y - player.y) > GRAB_RANGE_Y) continue
    enterState(player, 'grab')
    enemy.grabbedBy = player.id
    enterState(enemy, 'grabbed')
    enemy.attackId = null
    break
  }
}

/** Crate corpses and enemy KOs roll their loot tables once, and every fresh
 * corpse pays out score (crates 50, boss 1000, other enemies 100). Score
 * milestones grant extra lives (arcade 1UP). */
function stepLoot(sim: Sim): void {
  for (const entity of sim.entities) {
    if (entity.lootRolled || entity.state !== 'dying' || entity.stateTick > 0) continue
    if (entity.kind === 'crate') {
      entity.lootRolled = true
      sim.stats.score += 50
      const drop = rollLoot(sim.rng, CRATE_LOOT)
      if (drop) spawnItem(sim, drop, entity.x, entity.y)
    } else if (entity.side === 'enemy' && !isProjectile(entity)) {
      entity.lootRolled = true
      sim.stats.score += entity.kind === sim.stage.bossKind ? 1000 : 100
      const drop = rollLoot(sim.rng, ENEMY_DROP)
      if (drop) spawnItem(sim, drop, entity.x, entity.y)
    }
  }
  // Extra life at each SCORE_PER_EXTRA_LIFE milestone.
  const earned = Math.floor(sim.stats.score / SCORE_PER_EXTRA_LIFE)
  if (earned > sim.livesEarned) {
    sim.lives += earned - sim.livesEarned
    sim.livesEarned = earned
    sim.events.push({ type: 'extralife' })
  }
}

function spawnItem(sim: Sim, kind: string, x: number, y: number): void {
  const item = makeCombatant(sim.nextEntityId, kind, 'neutral', x, y, 1, 0, 'left')
  spawnEntity(sim, item)
}

/** Ground items age out; the player picks up overlapped items. */
function stepItems(sim: Sim): void {
  // Any player can pick anything up. This looped over player one alone, so in
  // co-op player two could not eat or arm themselves at all - they walked over
  // food and weapons and nothing happened. Player one keeps first claim when
  // both are standing on the same item, which is the order players are in.
  const players = playersOf(sim).filter((p) => p.state !== 'dying' && p.state !== 'dead')
  for (const item of sim.entities) {
    if (item.side !== 'neutral' || item.kind === 'crate') continue
    if (item.state !== 'idle') continue
    item.stateTick += 1
    if (item.stateTick >= ITEM_LIFETIME_TICKS) {
      item.state = 'dead'
      continue
    }
    const def = ITEMS[item.kind]
    if (!def) continue
    for (const player of players) {
      if (player.z > 8) continue
      if (Math.abs(item.x - player.x) > 10 || Math.abs(item.y - player.y) > 8) continue
      if (def.heal) {
        if (player.hp < player.maxHp) sim.stats.foodEaten += 1
        player.hp = Math.min(player.maxHp, player.hp + def.heal)
      }
      if (def.weapon) {
        player.weapon = item.kind
        player.weaponTicks = def.weapon.ticks
      }
      item.state = 'dead'
      sim.events.push({ type: 'pickup', id: item.id, kind: item.kind })
      break // one item, one taker
    }
  }
}

function applyPhysics(sim: Sim): void {
  for (const entity of sim.entities) {
    if (!isProjectile(entity) && entity.state !== 'thrown') {
      entity.x += entity.vx
      entity.vx = Math.abs(entity.vx) < 0.1 ? 0 : entity.vx * 0.75
      entity.y = clamp(entity.y, sim.stage.walkBandTop, sim.stage.walkBandBottom)
    } else if (entity.state === 'thrown') {
      entity.x += entity.vx // constant flight speed, no decay
      entity.y = clamp(entity.y, sim.stage.walkBandTop, sim.stage.walkBandBottom)
    }
    // Projectiles fly unclamped on either side: the hero clamp used to pin a
    // hero arrow to the screen edge, where it hovered forever (stateTick kept
    // counting, x could not advance). They die by travel instead.
    if (entity.side === 'hero' && !isProjectile(entity)) {
      const minX = sim.scrollX + EDGE_MARGIN
      const maxX = Math.min(sim.scrollX + SCREEN_WIDTH - EDGE_MARGIN, sim.stage.length - EDGE_MARGIN)
      entity.x = clamp(entity.x, minX, maxX)
    } else if (!isProjectile(entity) && entity.state !== 'fleeing') {
      // Fleeing entities leave the stage; everyone else stays in bounds.
      entity.x = clamp(entity.x, 0, sim.stage.length)
    }
  }
}

function updateDeaths(sim: Sim): void {
  for (const entity of sim.entities) {
    if (entity.state === 'dying' && entity.stateTick >= DYING_TICKS) {
      entity.state = 'dead'
    }
  }
  // Dead heroes stay in the list (revive reads them); everything else that is
  // dead goes now, projectiles included. Hero arrows used to survive this
  // filter and hang in the air forever - the exact defect the fall fixes.
  sim.entities = sim.entities.filter(
    (e) => !((e.side !== 'hero' || isProjectile(e)) && e.state === 'dead'),
  )
}

function updateWaveAndCamera(sim: Sim): void {
  if (sim.cameraLocked) {
    const anyEnemyAlive = sim.entities.some(
      (e) => e.side === 'enemy' && !isProjectile(e) && e.state !== 'dying' && e.state !== 'dead',
    )
    if (!anyEnemyAlive) {
      sim.waveIndex += 1
      sim.events.push({ type: 'wave-cleared', waveIndex: sim.waveIndex })
      const nextWave = sim.stage.waves[sim.waveIndex]
      if (nextWave) {
        spawnWave(sim, nextWave)
      } else {
        sim.cameraLocked = false
      }
    }
  }

  // Death outranks everything - but in co-op only once nobody is left standing.
  if (sim.phase === 'fight' && livingPlayersOf(sim).length === 0) {
    sim.phase = 'gameover'
    sim.events.push({ type: 'gameover' })
  }
  // The boss arena: once all waves are done, pushing toward the stage end
  // summons the boss and re-locks the camera for the duel.
  if (
    !sim.bossSpawned &&
    sim.waveIndex >= sim.stage.waves.length &&
    leadPlayerOf(sim).x >= sim.stage.length - BOSS_TRIGGER_DISTANCE
  ) {
    spawnBossNow(sim)
  }
  // Stage clear: the spawned boss entering dying/dead ends the fight phase.
  if (sim.phase === 'fight' && sim.bossSpawned) {
    const boss = sim.entities.find((e) => e.kind === sim.stage.bossKind)
    if (!boss || boss.state === 'dying' || boss.state === 'dead') {
      sim.phase = 'clear'
      sim.events.push({ type: 'stageclear' })
    }
  }

  if (!sim.cameraLocked) {
    sim.scrollX = clamp(leadPlayerOf(sim).x - SCREEN_WIDTH / 2, 0, sim.stage.length - SCREEN_WIDTH)
  }
}

/** Force the stage boss to spawn now (used by the debug bridge for the
 * visual harness - lets a screenshot reach the boss duel deterministically
 * without a long bot marathon). */
export function spawnBossNow(sim: Sim): void {
  sim.bossSpawned = true
  sim.cameraLocked = true
  sim.waveIndex = sim.stage.waves.length
  const def = enemyByKind(sim.stage.bossKind)
  const bossX = clamp(sim.scrollX + 320, 0, sim.stage.length - 40)
  const bossY = Math.round((sim.stage.walkBandTop + sim.stage.walkBandBottom) / 2)
  const boss = makeCombatant(sim.nextEntityId, def.kind, 'enemy', bossX, bossY, def.maxHp, def.speed, 'left')
  spawnEntity(sim, boss)
}

/** Ticks of hit-stop per event kind (max-not-sum across a tick). */
const FREEZE_ON_HIT = 2
const FREEZE_ON_KO = 5
const FREEZE_ON_BOSS_KO = 8

/** Advance the world one fixed tick. This is the only way the sim changes.
 * Hit-stop: while freezeTicks remain, the tick counter advances (harness
 * batch accounting is tick-based) but the world does not move. */
export function stepSim(sim: Sim, input: InputState, input2?: InputState): void {
  sim.tick += 1
  if (sim.freezeTicks > 0) {
    sim.freezeTicks -= 1
    return
  }
  const eventsBefore = sim.events.length
  const player = playerOf(sim)
  stepPlayer(sim, player, input)
  if (sim.player2Id !== null) {
    const player2 = sim.entities.find((e) => e.id === sim.player2Id)
    if (player2) stepPlayer(sim, player2, input2 ?? neutralInput())
  }
  for (const entity of sim.entities) {
    // Each enemy goes after whoever is closest. With one player that is always
    // that player, so this is the same behaviour the single-player game had.
    if (entity.side === 'enemy' && !isProjectile(entity)) {
      stepEnemy(sim, entity, nearestPlayerTo(sim, entity.x, entity.y))
    }
  }
  stepProjectiles(sim)
  stepThrown(sim)
  resolveAttacks(sim.entities, sim.events)
  applyPhysics(sim)
  stepGrab(sim)
  stepLoot(sim)
  stepItems(sim)
  updateDeaths(sim)
  updateWaveAndCamera(sim)
  applyFreezeAndCombo(sim, eventsBefore)
}

/** Hit-stop + combo bookkeeping from this tick's events. A frozen world emits
 * nothing, so freeze can never chain. */
function applyFreezeAndCombo(sim: Sim, eventsBefore: number): void {
  for (let i = eventsBefore; i < sim.events.length; i += 1) {
    const event = sim.events[i]
    if (!event) continue
    if (event.type === 'hit') {
      sim.freezeTicks = Math.max(sim.freezeTicks, FREEZE_ON_HIT)
      if (isPlayerId(sim, event.attackerId)) {
        // Melee-only combo attribution (classic): arrows and thrown bodies
        // don't extend the chain.
        sim.stats.comboHits += 1
        sim.stats.comboTicksLeft = COMBO_WINDOW_TICKS
      }
      if (isPlayerId(sim, event.targetId)) {
        sim.stats.comboHits = 0
        sim.stats.comboTicksLeft = 0
      }
    } else if (event.type === 'ko') {
      const downed = sim.entities.find((e) => e.id === event.id)
      const isBoss = downed?.kind === sim.stage.bossKind
      sim.freezeTicks = Math.max(sim.freezeTicks, isBoss ? FREEZE_ON_BOSS_KO : FREEZE_ON_KO)
    }
  }
  if (sim.stats.comboTicksLeft > 0) {
    sim.stats.comboTicksLeft -= 1
    if (sim.stats.comboTicksLeft === 0) sim.stats.comboHits = 0
  }
}

/** Drain accumulated events. Callers: the renderer each frame, tests anytime. */
export function drainSimEvents(sim: Sim): SimEvent[] {
  const drained = sim.events.slice()
  sim.events.length = 0
  return drained
}

/**
 * Re-exported so `sim.ts` remains the single import site the rest of the
 * codebase already uses. Splitting the file was meant to make it navigable,
 * not to make two dozen callers change their imports.
 */
export type { Sim } from './simtypes'
export {
  playersOf,
  livingPlayersOf,
  isPlayerId,
  characterOf,
  leadPlayerOf,
  nearestPlayerTo,
  playerOf,
} from './players'
export {
  snapshotSim,
  type PlayerSnapshot,
  type EnemySnapshot,
  type ItemSnapshot,
  type SimSnapshot,
} from './snapshot'
