import { attackById, type AttackDef } from '../src/core/attacks'
import { characterById } from '../src/core/characters'
import type { EnemySnapshot } from '../src/core/sim'
import { STAGE_1 } from '../src/core/stage'
import { neutralInput, type InputState } from '../src/core/types'
import type { GameSnapshot } from '../src/game/debug/bridge'

/**
 * Number of sim ticks the harness advances per bot decision. The bot emits
 * one input per tick; entries without presses are neutral movement.
 */
export const BOT_STEP_BATCH = 12

/**
 * Spacing def for the bot's swings: mounted riders use the long spear sweep,
 * on foot the DRIVEN hero's own opening combo hit (ENH-4: per-hero reach).
 */
function spacingDef(charId: string, mounted: boolean): AttackDef {
  if (mounted) return attackById('mounted.sweep')
  return attackById(characterById(charId).combo[0] ?? 'zy.jab1')
}

/**
 * Greedy deterministic autopilot:
 *  1. step off the line of any incoming arrow
 *  2. throw whatever enemy is currently held in a grab
 *  3. fire the desperation special when surrounded (and able to pay the HP)
 *  4. seek food when hurt
 *  5. attack when the nearest hittable enemy is inside jab range
 *  6. leap in with a jump kick when a hittable enemy is aligned and close
 *     (knocks it down and dodges ground swings while airborne)
 *  7. otherwise walk toward the target (downed enemies are walked to, not
 *     swung at, since swings would whiff on i-frames)
 * No randomness anywhere, so self-play runs replay exactly.
 */
export function decideBotScript(snapshot: GameSnapshot): InputState[] {
  const script = Array.from({ length: BOT_STEP_BATCH }, () => neutralInput())
  const sim = snapshot.sim
  if (!sim) return script
  const player = sim.player

  for (const arrow of sim.enemies) {
    if (arrow.kind !== 'arrow') continue
    if (Math.abs(arrow.y - player.y) > 12) continue
    if (Math.abs(arrow.x - player.x) > 110) continue
    if ((player.x - arrow.x) * arrow.vx <= 0) continue
    const bandMid = (STAGE_1.walkBandTop + STAGE_1.walkBandBottom) / 2
    for (const entry of script) {
      entry.up = player.y >= bandMid
      entry.down = player.y < bandMid
    }
    return script
  }

  if (player.state === 'grab') {
    const press = script[0]
    if (press) press.attackPressed = true
    return script
  }

  // A free horse is a force multiplier: mount it before fighting.
  if (!player.mounted) {
    for (const item of sim.items) {
      if (item.kind !== 'horse' || item.state !== 'idle') continue
      for (const entry of script) {
        entry.up = item.y < player.y - 2
        entry.down = item.y > player.y + 2
        entry.left = item.x < player.x - 2
        entry.right = item.x > player.x + 2
      }
      return script
    }
  }

  // An unarmed fighter picks up a sword within reach.
  if (player.weapon === null) {
    for (const item of sim.items) {
      if (item.kind !== 'sword' || item.state !== 'idle') continue
      if (sim.cameraLocked && (item.x < sim.scrollX + 16 || item.x > sim.scrollX + 368)) continue
      for (const entry of script) {
        entry.up = item.y < player.y - 2
        entry.down = item.y > player.y + 2
        entry.left = item.x < player.x - 2
        entry.right = item.x > player.x + 2
      }
      return script
    }
  }

  let target: EnemySnapshot | undefined
  let fallback: EnemySnapshot | undefined
  let bestDist = Number.POSITIVE_INFINITY
  let fallbackDist = Number.POSITIVE_INFINITY
  const nearIds: EnemySnapshot[] = []
  for (const enemy of sim.enemies) {
    if (enemy.kind === 'arrow') continue // projectiles are not targets
    if (enemy.state === 'dying' || enemy.state === 'dead') continue
    const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y)
    if (enemy.state !== 'knockdown' && enemy.state !== 'getup' && enemy.state !== 'grabbed') {
      if (dist <= 44) nearIds.push(enemy)
      if (dist < bestDist) {
        bestDist = dist
        target = enemy
      }
      continue
    }
    if (dist < fallbackDist) {
      fallbackDist = dist
      fallback = enemy
    }
  }

  const onLeft = nearIds.some((e) => e.x < player.x - 6)
  const onRight = nearIds.some((e) => e.x > player.x + 6)
  if (player.hp > 25 && ((onLeft && onRight) || nearIds.length >= 3)) {
    const press = script[0]
    if (press) press.specialPressed = true
    return script
  }

  if (player.hp < player.maxHp) {
    let food: { x: number; y: number } | undefined
    let foodDist = Number.POSITIVE_INFINITY
    // While the camera is locked the player is leashed to the screen; food
    // beyond the leash is unreachable, so ignore it.
    const leashMin = sim.scrollX + 16
    const leashMax = sim.scrollX + 368
    for (const item of sim.items) {
      if (item.kind !== 'meat' || item.state !== 'idle') continue
      if (sim.cameraLocked && (item.x < leashMin || item.x > leashMax)) continue
      const dist = Math.abs(item.x - player.x) + Math.abs(item.y - player.y)
      if (dist < foodDist) {
        foodDist = dist
        food = item
      }
    }
    if (food) {
      for (const entry of script) {
        entry.up = food.y < player.y - 2
        entry.down = food.y > player.y + 2
        entry.left = food.x < player.x - 2
        entry.right = food.x > player.x + 2
      }
      return script
    }
  }

  const goal = target ?? fallback
  if (!goal) {
    // No enemies standing: loot unbroken crates on screen, then push right.
    let crate: { x: number; y: number } | undefined
    let crateDist = Number.POSITIVE_INFINITY
    for (const item of sim.items) {
      if (item.kind !== 'crate' || item.state !== 'idle') continue
      if (item.x < sim.scrollX + 16 || item.x > sim.scrollX + 368) continue
      const d = Math.abs(item.x - player.x) + Math.abs(item.y - player.y)
      if (d < crateDist) {
        crateDist = d
        crate = item
      }
    }
    if (crate) {
      const cdx = crate.x - player.x
      const cdy = crate.y - player.y
      const reachDef = spacingDef(sim.charId, player.mounted)
      if (Math.abs(cdx) <= reachDef.reach - 4 && Math.abs(cdy) <= reachDef.arc - 2) {
        const face = script[0]
        if (face) {
          face.left = cdx < 0
          face.right = cdx > 0
        }
        const press = script[1]
        if (press) {
          press.attackPressed = true
          press.left = cdx < 0
          press.right = cdx > 0
        }
        return script
      }
      for (const entry of script) {
        entry.up = cdy < -2
        entry.down = cdy > 2
        entry.left = cdx < -2
        entry.right = cdx > 2
      }
      return script
    }
    // Nothing to loot: push right toward the boss arena while fighting.
    if (sim.phase === 'fight') {
      for (const entry of script) entry.right = true
    }
    return script
  }

  const dx = goal.x - player.x
  const dy = goal.y - player.y
  // Mounted riders swing the long spear sweep; on foot it's the driven
  // hero's own jab.
  const reachDef = spacingDef(sim.charId, player.mounted)
  const dist = Math.abs(dx) + Math.abs(dy)
  const aligned = Math.abs(dy) <= 12

  // Bosses outrange the jab and combo fast, so never trade jabs with them:
  // jump-kick instead (the kick knocks them down and the jump arc dodges
  // their ground swings). Mounted riders can't jump - the sweep outranges
  // every boss weapon, so just swing. Checked BEFORE the jab rule: a boss
  // that closes in must still be kicked.
  if (target && target.boss && !player.mounted && aligned && dist <= 70 && dist > 4) {
    for (const entry of script) {
      entry.left = dx < -2
      entry.right = dx > 2
      entry.up = dy < -4
      entry.down = dy > 4
    }
    const jump = script[0]
    if (jump) jump.jumpPressed = true
    const kick = script[4]
    if (kick) kick.attackPressed = true
    return script
  }

  if (target && Math.abs(dx) <= reachDef.reach - 4 && Math.abs(dy) <= reachDef.arc - 2) {
    // Face first: a press from a stale facing swings behind the target when
    // overlapping. Tick 0 turns, tick 1 attacks.
    const face = script[0]
    if (face) {
      face.left = dx < 0
      face.right = dx > 0
    }
    const press = script[1]
    if (press) {
      press.attackPressed = true
      press.left = dx < 0
      press.right = dx > 0
    }
    return script
  }

  if (target && !player.mounted && aligned && dist <= 90 && dist > 10) {
    for (const entry of script) {
      entry.left = dx < -2
      entry.right = dx > 2
    }
    const jump = script[0]
    if (jump) jump.jumpPressed = true
    const kick = script[4]
    if (kick) kick.attackPressed = true
    return script
  }

  for (const entry of script) {
    entry.up = dy < -2
    entry.down = dy > 2
    entry.left = dx < -2
    entry.right = dx > 2
  }
  return script
}
