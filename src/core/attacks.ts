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

/** One grounded combo hit: damage, geometry, frame data, knockback. */
interface ComboHitNumbers {
  damage: number
  reach: number
  arc: number
  startup: number
  active: number
  recover: number
  knockback: number
  knockdown: boolean
}

interface HeroAttackNumbers {
  jab1: ComboHitNumbers
  jab2: ComboHitNumbers
  finisher: ComboHitNumbers
  kickDamage: number
  kickReach: number
  kickArc: number
  specialDamage: number
}

/** Build one hero moveset: weapon-true 3-hit combo, jump kick, aoe special. */
function defineHeroAttacks(prefix: string, n: HeroAttackNumbers): Record<string, AttackDef> {
  const combo = (name: 'jab1' | 'jab2' | 'finisher'): AttackDef => {
    const hit = n[name]
    return {
      id: `${prefix}.${name}`,
      damage: hit.damage,
      reach: hit.reach,
      arc: hit.arc,
      startup: hit.startup,
      active: hit.active,
      recover: hit.recover,
      knockback: hit.knockback,
      knockdown: hit.knockdown,
      aerial: false,
      aoe: false,
    }
  }
  return {
    [`${prefix}.jab1`]: combo('jab1'),
    [`${prefix}.jab2`]: combo('jab2'),
    [`${prefix}.finisher`]: combo('finisher'),
    [`${prefix}.jumpkick`]: {
      id: `${prefix}.jumpkick`,
      damage: n.kickDamage,
      reach: n.kickReach,
      arc: n.kickArc,
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
  // Hero movesets (ENH-4): every combo hit carries its own weapon-true
  // damage/geometry/frame/knockback data. Jump kicks, specials and all
  // enemy defs below are byte-identical to the old tables.
  ...defineHeroAttacks('gy', {
    // Guan Yu, glaive: slowest chain, wide arc, heavy overhead-chop finisher.
    jab1: { damage: 11, reach: 30, arc: 12, startup: 8, active: 5, recover: 14, knockback: 2, knockdown: false },
    jab2: { damage: 11, reach: 32, arc: 12, startup: 8, active: 5, recover: 14, knockback: 2, knockdown: false },
    finisher: { damage: 20, reach: 34, arc: 14, startup: 12, active: 6, recover: 22, knockback: 5, knockdown: true },
    kickDamage: 10, kickReach: 30, kickArc: 14, specialDamage: 22,
  }),
  ...defineHeroAttacks('zf', {
    // Zhang Fei, serpent pike: longest reach, narrow arc, quick thrusts,
    // wide sweeping-knockdown finisher.
    jab1: { damage: 10, reach: 32, arc: 8, startup: 5, active: 4, recover: 9, knockback: 1, knockdown: false },
    jab2: { damage: 10, reach: 34, arc: 8, startup: 5, active: 4, recover: 9, knockback: 1, knockdown: false },
    finisher: { damage: 15, reach: 36, arc: 14, startup: 10, active: 6, recover: 18, knockback: 4, knockdown: true },
    kickDamage: 11, kickReach: 28, kickArc: 14, specialDamage: 24,
  }),
  ...defineHeroAttacks('zy', {
    // Zhao Yun, spear: fastest chain, lowest damage per hit.
    jab1: { damage: 6, reach: 26, arc: 10, startup: 5, active: 3, recover: 8, knockback: 1, knockdown: false },
    jab2: { damage: 6, reach: 28, arc: 10, startup: 5, active: 3, recover: 8, knockback: 1, knockdown: false },
    finisher: { damage: 10, reach: 30, arc: 12, startup: 7, active: 4, recover: 13, knockback: 3, knockdown: true },
    kickDamage: 10, kickReach: 28, kickArc: 14, specialDamage: 20,
  }),
  ...defineHeroAttacks('hz', {
    // Huang Zhong, bow: compact short-range melee, moderate speed.
    jab1: { damage: 7, reach: 22, arc: 10, startup: 6, active: 4, recover: 10, knockback: 1, knockdown: false },
    jab2: { damage: 7, reach: 24, arc: 10, startup: 6, active: 4, recover: 10, knockback: 1, knockdown: false },
    finisher: { damage: 10, reach: 26, arc: 12, startup: 8, active: 5, recover: 14, knockback: 3, knockdown: true },
    kickDamage: 9, kickReach: 26, kickArc: 14, specialDamage: 0,
  }),
  // Huang Zhong's special is his bow shot: the swing itself is inert
  // (zero-length active window); the hero arrow projectile does the work.
  'hz.special': { id: 'hz.special', damage: 0, reach: 0, arc: 0, startup: 4, active: 0, recover: 14, knockback: 0, knockdown: false, aerial: false, aoe: true },
  ...defineHeroAttacks('wy', {
    // Wei Yan, dao: slow heavy chops, high damage, long recover, big finisher.
    jab1: { damage: 12, reach: 26, arc: 10, startup: 9, active: 5, recover: 14, knockback: 2, knockdown: false },
    jab2: { damage: 12, reach: 28, arc: 10, startup: 9, active: 5, recover: 14, knockback: 2, knockdown: false },
    finisher: { damage: 17, reach: 30, arc: 14, startup: 13, active: 6, recover: 18, knockback: 5, knockdown: true },
    kickDamage: 10, kickReach: 28, kickArc: 14, specialDamage: 20,
  }),

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
