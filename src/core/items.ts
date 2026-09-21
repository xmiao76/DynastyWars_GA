import type { Rng } from './rng'

/**
 * Item and loot-table data. Crates and enemy KOs roll these weighted tables
 * with the sim's seeded RNG, so drops replay exactly from the seed.
 */
export interface ItemDef {
  kind: string
  nameEn: string
  nameZh: string
  /** Food: HP restored on pickup. */
  heal?: number
  /** Weapon: temporary attack modifier while held. */
  weapon?: { damageBonus: number; reachBonus: number; ticks: number }
}

export const ITEMS: Record<string, ItemDef> = {
  meat: { kind: 'meat', nameEn: 'Meat', nameZh: '肉', heal: 30 },
  sword: {
    kind: 'sword',
    nameEn: 'Sword',
    nameZh: '劍',
    weapon: { damageBonus: 4, reachBonus: 8, ticks: 600 },
  },
}

export interface LootEntry {
  /** Item kind to drop; null = nothing. */
  kind: string | null
  weight: number
}

export const CRATE_LOOT: LootEntry[] = [
  { kind: null, weight: 40 },
  { kind: 'meat', weight: 40 },
  { kind: 'sword', weight: 20 },
]

export const ENEMY_DROP: LootEntry[] = [
  { kind: null, weight: 75 },
  { kind: 'meat', weight: 25 },
]

/** Weighted pick from a loot table. Draws exactly one rng.next(). */
export function rollLoot(rng: Rng, table: LootEntry[]): string | null {
  const total = table.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = rng.next() * total
  for (const entry of table) {
    roll -= entry.weight
    if (roll < 0) return entry.kind
  }
  return table[table.length - 1]?.kind ?? null
}

export function itemByKind(kind: string): ItemDef {
  const def = ITEMS[kind]
  if (!def) throw new Error(`unknown item kind: ${kind}`)
  return def
}
