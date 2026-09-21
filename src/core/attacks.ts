/**
 * Attack data tables. All combat numbers live here as data so balance passes
 * touch values, not code. Frame counts are in 1/60s ticks.
 */
export interface AttackDef {
  id: string
  damage: number
  /** Horizontal reach in front of the attacker (px). */
  reach: number
  /** Depth tolerance: |dy| must be within arc for a hit (px). */
  arc: number
  /** Ticks before the hitbox goes live. */
  startup: number
  /** Ticks the hitbox is live. */
  active: number
  /** Ticks of recovery after the active window. */
  recover: number
  /** Initial knockback velocity applied to the target (px/tick). */
  knockback: number
  /** True if the hit knocks the target down (granting wake-up i-frames). */
  knockdown: boolean
  /** True if the attack connects only while the attacker is airborne. */
  aerial: boolean
  /** True if the hitbox surrounds the attacker instead of reaching forward. */
  aoe: boolean
}

interface HeroAttackNumbers {
  jabDamage: number
  finisherDamage: number
  reach: number
  arc: number
  kickDamage: number
  specialDamage: number
}

/** Build the standard hero moveset: 3-hit combo, jump kick, aoe special. */
function defineHeroAttacks(prefix: string, n: HeroAttackNumbers): Record<string, AttackDef> {
  const jab = { reach: n.reach, arc: n.arc, startup: 6, active: 4, recover: 10, knockback: 1 }
  return {
    [`${prefix}.jab1`]: { id: `${prefix}.jab1`, damage: n.jabDamage, ...jab, knockdown: false, aerial: false, aoe: false },
    [`${prefix}.jab2`]: { id: `${prefix}.jab2`, damage: n.jabDamage, ...jab, knockdown: false, aerial: false, aoe: false },
    [`${prefix}.finisher`]: {
      id: `${prefix}.finisher`,
      damage: n.finisherDamage,
      reach: n.reach + 4,
      arc: n.arc + 2,
      startup: 8,
      active: 5,
      recover: 16,
      knockback: 4,
      knockdown: true,
      aerial: false,
      aoe: false,
    },
    [`${prefix}.jumpkick`]: {
      id: `${prefix}.jumpkick`,
      damage: n.kickDamage,
      reach: n.reach + 2,
      arc: n.arc + 4,
      startup: 4,
      active: 20,
      recover: 0,
      knockback: 3,
      knockdown: true,
      aerial: true,
      aoe: false,
    },
    [`${prefix}.special`]: {
      id: `${prefix}.special`,
      damage: n.specialDamage,
      reach: 70,
      arc: 26,
      startup: 6,
      active: 12,
      recover: 12,
      knockback: 5,
      knockdown: true,
      aerial: false,
      aoe: true,
    },
  }
}

export const ATTACKS: Record<string, AttackDef> = {
  // Hero movesets. Numbers differ per hero; frame data is shared.
  ...defineHeroAttacks('gy', { jabDamage: 9, finisherDamage: 13, reach: 28, arc: 10, kickDamage: 10, specialDamage: 22 }),
  ...defineHeroAttacks('zf', { jabDamage: 10, finisherDamage: 15, reach: 26, arc: 10, kickDamage: 11, specialDamage: 24 }),
  ...defineHeroAttacks('zy', { jabDamage: 8, finisherDamage: 12, reach: 26, arc: 10, kickDamage: 10, specialDamage: 20 }),
  ...defineHeroAttacks('hz', { jabDamage: 7, finisherDamage: 10, reach: 24, arc: 10, kickDamage: 9, specialDamage: 0 }),
  // Huang Zhong's special is his bow shot: the swing itself is inert
  // (zero-length active window); the hero arrow projectile does the work.
  'hz.special': { id: 'hz.special', damage: 0, reach: 0, arc: 0, startup: 4, active: 0, recover: 14, knockback: 0, knockdown: false, aerial: false, aoe: true },
  ...defineHeroAttacks('wy', { jabDamage: 9, finisherDamage: 12, reach: 26, arc: 10, kickDamage: 10, specialDamage: 20 }),

  // Mounted spear sweep: long reach, knockdown; replaces the ground combo
  // on horseback (every press swings once - no chain).
  'mounted.sweep': { id: 'mounted.sweep', damage: 14, reach: 38, arc: 12, startup: 8, active: 6, recover: 14, knockback: 3, knockdown: true, aerial: false, aoe: false },

  // Enemy attacks.
  'soldier.swing': { id: 'soldier.swing', damage: 6, reach: 24, arc: 10, startup: 14, active: 4, recover: 20, knockback: 2, knockdown: false, aerial: false, aoe: false },
  'spear.thrust': { id: 'spear.thrust', damage: 10, reach: 36, arc: 8, startup: 20, active: 5, recover: 26, knockback: 3, knockdown: true, aerial: false, aoe: false },
  // Boss (Li Dian): quick combo swing, heavy chop, and a charging dash whose
  // movement is driven by the boss FSM during the active window.
  'sword.combo': { id: 'sword.combo', damage: 9, reach: 30, arc: 10, startup: 9, active: 4, recover: 12, knockback: 1, knockdown: false, aerial: false, aoe: false },
  'sword.heavy': { id: 'sword.heavy', damage: 14, reach: 34, arc: 12, startup: 16, active: 6, recover: 24, knockback: 4, knockdown: true, aerial: false, aoe: false },
  'charge.dash': { id: 'charge.dash', damage: 12, reach: 30, arc: 12, startup: 10, active: 18, recover: 20, knockback: 5, knockdown: true, aerial: false, aoe: false },
  // Xiahou Dun's longer charge: more distance, slightly faster windup.
  'charge.dash.long': { id: 'charge.dash.long', damage: 12, reach: 32, arc: 12, startup: 8, active: 26, recover: 18, knockback: 5, knockdown: true, aerial: false, aoe: false },
  // Xu Chu's crushing charge: the hardest-hitting dash.
  'charge.crush': { id: 'charge.crush', damage: 14, reach: 32, arc: 14, startup: 12, active: 22, recover: 22, knockback: 6, knockdown: true, aerial: false, aoe: false },
  // Cao Ren's shield bash: short reach, heavy knockdown.
  'shield.bash': { id: 'shield.bash', damage: 11, reach: 26, arc: 14, startup: 12, active: 6, recover: 22, knockback: 6, knockdown: true, aerial: false, aoe: false },
  // Zhang Liao's blade flurry: fast, light, rapid-fire.
  'blade.flurry': { id: 'blade.flurry', damage: 7, reach: 30, arc: 10, startup: 6, active: 4, recover: 8, knockback: 1, knockdown: false, aerial: false, aoe: false },
  // Zhang He's dagger dance: a two-step flourish, between flurry and combo.
  'dagger.dance': { id: 'dagger.dance', damage: 8, reach: 28, arc: 12, startup: 7, active: 5, recover: 10, knockback: 2, knockdown: false, aerial: false, aoe: false },
  // Xu Huang's axe cleave: slow, heavy, wide.
  'axe.cleave': { id: 'axe.cleave', damage: 16, reach: 34, arc: 12, startup: 18, active: 6, recover: 26, knockback: 5, knockdown: true, aerial: false, aoe: false },
  // Cao Cao's imperial sword: regal reach and damage.
  'imperial.sword': { id: 'imperial.sword', damage: 18, reach: 36, arc: 14, startup: 14, active: 8, recover: 20, knockback: 5, knockdown: true, aerial: false, aoe: false },
  // Lu Bu's halberd storm: the widest, hardest boss swing in the game.
  'halberd.storm': { id: 'halberd.storm', damage: 20, reach: 40, arc: 16, startup: 10, active: 10, recover: 16, knockback: 6, knockdown: true, aerial: false, aoe: false },
  // Projectile impact data. Arrows move as projectile entities, not states.
  'arrow.hit': { id: 'arrow.hit', damage: 5, reach: 0, arc: 0, startup: 0, active: 0, recover: 0, knockback: 1, knockdown: false, aerial: false, aoe: false },
  'heroarrow.hit': { id: 'heroarrow.hit', damage: 12, reach: 0, arc: 0, startup: 0, active: 0, recover: 0, knockback: 1, knockdown: false, aerial: false, aoe: false },
  // Thrown bodies: collateral hits while flying, plus the landing impact.
  'throw.body': { id: 'throw.body', damage: 10, reach: 0, arc: 0, startup: 0, active: 0, recover: 0, knockback: 2, knockdown: true, aerial: false, aoe: false },
  'throw.land': { id: 'throw.land', damage: 12, reach: 0, arc: 0, startup: 0, active: 0, recover: 0, knockback: 0, knockdown: true, aerial: false, aoe: false },
}

/** Hero arrow flight speed in px/tick (Huang Zhong's special). */
export const HERO_ARROW_SPEED = 4

export function attackById(id: string): AttackDef {
  const def = ATTACKS[id]
  if (!def) throw new Error(`unknown attack id: ${id}`)
  return def
}

export function totalFrames(def: AttackDef): number {
  return def.startup + def.active + def.recover
}
