/**
 * Playable hero definitions: the five Shu generals, in arcade select order.
 * English name plus Chinese characters per the project's bilingual rule.
 * Combat numbers reference the attack tables in attacks.ts.
 */
export interface CharacterDef {
  id: string
  nameEn: string
  nameZh: string
  maxHp: number
  /** Walk speed in px/tick. */
  walkSpeed: number
  /** Combo chain: each attack chains to the next on a buffered press. */
  combo: string[]
  /** Aerial attack id, used when attacking mid-jump. */
  jumpAttack: string
  /** Desperation special attack id. */
  specialAttack: string
  /** HP spent to activate the special. Requires hp > cost to activate. */
  specialCost: number
  /** True if the special fires a hero arrow instead of a melee AoE. */
  specialFiresProjectile?: boolean
}

export const GUAN_YU: CharacterDef = {
  id: 'guanyu',
  nameEn: 'Guan Yu',
  nameZh: '關羽',
  maxHp: 130,
  walkSpeed: 1.4,
  combo: ['gy.jab1', 'gy.jab2', 'gy.finisher'],
  jumpAttack: 'gy.jumpkick',
  specialAttack: 'gy.special',
  specialCost: 16,
}

export const ZHANG_FEI: CharacterDef = {
  id: 'zhangfei',
  nameEn: 'Zhang Fei',
  nameZh: '張飛',
  maxHp: 140,
  walkSpeed: 1.3,
  combo: ['zf.jab1', 'zf.jab2', 'zf.finisher'],
  jumpAttack: 'zf.jumpkick',
  specialAttack: 'zf.special',
  specialCost: 18,
}

export const ZHAO_YUN: CharacterDef = {
  id: 'zhaoyun',
  nameEn: 'Zhao Yun',
  nameZh: '趙雲',
  maxHp: 120,
  walkSpeed: 1.6,
  combo: ['zy.jab1', 'zy.jab2', 'zy.finisher'],
  jumpAttack: 'zy.jumpkick',
  specialAttack: 'zy.special',
  specialCost: 15,
}

export const HUANG_ZHONG: CharacterDef = {
  id: 'huangzhong',
  nameEn: 'Huang Zhong',
  nameZh: '黃忠',
  maxHp: 110,
  walkSpeed: 1.5,
  combo: ['hz.jab1', 'hz.jab2', 'hz.finisher'],
  jumpAttack: 'hz.jumpkick',
  specialAttack: 'hz.special',
  specialCost: 12,
  specialFiresProjectile: true,
}

export const WEI_YAN: CharacterDef = {
  id: 'weiyan',
  nameEn: 'Wei Yan',
  nameZh: '魏延',
  maxHp: 125,
  walkSpeed: 1.5,
  combo: ['wy.jab1', 'wy.jab2', 'wy.finisher'],
  jumpAttack: 'wy.jumpkick',
  specialAttack: 'wy.special',
  specialCost: 15,
}

/** Select-screen order, matching the arcade layout. */
export const CHARACTER_ORDER = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan'] as const

export const CHARACTERS: Record<string, CharacterDef> = {
  guanyu: GUAN_YU,
  zhangfei: ZHANG_FEI,
  zhaoyun: ZHAO_YUN,
  huangzhong: HUANG_ZHONG,
  weiyan: WEI_YAN,
}

export function characterById(id: string): CharacterDef {
  return CHARACTERS[id] ?? ZHAO_YUN
}

/** Next attack in the character's combo, or undefined at the chain's end. */
export function nextComboAttack(character: CharacterDef, attackId: string): string | undefined {
  const index = character.combo.indexOf(attackId)
  if (index < 0) return undefined
  return character.combo[index + 1]
}
