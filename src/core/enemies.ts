/**
 * Enemy archetype definitions. Behavior code lives in ai.ts; this is data.
 */
/** Boss pattern data, consumed by the boss FSM in ai.ts. */
export interface BossDef {
  /** Charge attack id (dash movement runs during its active window). */
  charge: string
  combo: string
  heavy: string
  /** Think cadence ranges in ticks, [min, max], normal and enraged. */
  thinkRange: [number, number]
  enragedThinkRange: [number, number]
  /** Enrage when hp falls to this fraction of maxHp. */
  enrageRatio: number
}

export interface EnemyDef {
  kind: string
  nameEn: string
  nameZh: string
  maxHp: number
  /** Approach speed in px/tick. */
  speed: number
  /** Melee attack id from attacks.ts; empty string for pure shooters. */
  attackId: string
  hitstunTicks: number
  /** Ticks between AI re-evaluations of the approach target. */
  thinkInterval: number
  /** Ticks between arrow shots (archers); 0 = never fires. */
  fireInterval: number
  /** Present for stage bosses only. */
  boss?: BossDef
}

export const ENEMIES: Record<string, EnemyDef> = {
  soldier: {
    kind: 'soldier',
    nameEn: 'Wei Soldier',
    nameZh: '魏兵',
    maxHp: 24,
    speed: 0.9,
    attackId: 'soldier.swing',
    hitstunTicks: 18,
    thinkInterval: 45,
    fireInterval: 0,
  },
  spearman: {
    kind: 'spearman',
    nameEn: 'Wei Spearman',
    nameZh: '槍兵',
    maxHp: 32,
    speed: 0.7,
    attackId: 'spear.thrust',
    hitstunTicks: 14,
    thinkInterval: 50,
    fireInterval: 0,
  },
  archer: {
    kind: 'archer',
    nameEn: 'Wei Archer',
    nameZh: '弓兵',
    maxHp: 18,
    speed: 0.8,
    attackId: '',
    hitstunTicks: 16,
    thinkInterval: 40,
    fireInterval: 90,
  },
  lidian: {
    kind: 'lidian',
    nameEn: 'Li Dian',
    nameZh: '李典',
    maxHp: 180,
    speed: 1.1,
    // Boss attacks are chosen by the boss FSM (ai.ts), not this field.
    attackId: 'sword.heavy',
    hitstunTicks: 10,
    thinkInterval: 26,
    fireInterval: 0,
    boss: {
      charge: 'charge.dash',
      combo: 'sword.combo',
      heavy: 'sword.heavy',
      thinkRange: [18, 30],
      enragedThinkRange: [8, 16],
      enrageRatio: 0.3,
    },
  },
  xiahoudun: {
    kind: 'xiahoudun',
    nameEn: 'Xiahou Dun',
    nameZh: '夏侯惇',
    maxHp: 210,
    speed: 1.2,
    attackId: 'sword.heavy',
    hitstunTicks: 12,
    thinkInterval: 22,
    fireInterval: 0,
    // Faster cadence and a longer charge than Li Dian.
    boss: {
      charge: 'charge.dash.long',
      combo: 'sword.combo',
      heavy: 'sword.heavy',
      thinkRange: [16, 26],
      enragedThinkRange: [8, 14],
      enrageRatio: 0.35,
    },
  },
  xuchu: {
    kind: 'xuchu',
    nameEn: 'Xu Chu',
    nameZh: '許褚',
    maxHp: 260,
    speed: 1.0,
    attackId: 'sword.heavy',
    hitstunTicks: 10,
    thinkInterval: 24,
    fireInterval: 0,
    // Charge-heavy bruiser with the crushing dash.
    boss: {
      charge: 'charge.crush',
      combo: 'sword.combo',
      heavy: 'sword.heavy',
      thinkRange: [12, 20],
      enragedThinkRange: [5, 10],
      enrageRatio: 0.4,
    },
  },
}

export function enemyByKind(kind: string): EnemyDef {
  const def = ENEMIES[kind]
  if (!def) throw new Error(`unknown enemy kind: ${kind}`)
  return def
}

/** Arrow flight speed in px/tick. Damage data lives in attacks.ts ('arrow.hit'). */
export const ARROW_SPEED = 3

/**
 * Archer spacing, in px from the player: backs off inside MIN, closes in
 * beyond MAX. Crucially, archers fight INSIDE the visible screen - a locked
 * camera leashes the player to the screen, so an offscreen archer would be
 * unreachable and could plink forever (observed: bot death at t=3753).
 */
export const ARCHER_MIN_RANGE = 90
export const ARCHER_MAX_RANGE = 150
/** Archers only fire when roughly level with the player and within range. */
export const ARCHER_FIRE_ARC = 6
export const ARCHER_FIRE_RANGE = 220
/** Archers keep this many px inside the visible screen edges. */
export const ARCHER_SCREEN_MARGIN = 40
