import { describe, expect, it } from 'vitest'
import { ATTACKS, attackById, totalFrames } from '../../src/core/attacks'
import { CHARACTER_ORDER, characterById } from '../../src/core/characters'

/**
 * ENH-4 weapon-true hero movesets: every combo hit carries its own
 * damage/reach/arc/frame/knockback data per its weapon identity, while
 * full-combo DPS stays within +/-10% of the old shared-frame values.
 */

// [damage, reach, arc, startup, active, recover, knockback, knockdown]
type HitRow = [number, number, number, number, number, number, number, boolean]

const COMBO_DATA: Record<string, { jab1: HitRow; jab2: HitRow; finisher: HitRow }> = {
  gy: {
    jab1: [11, 30, 12, 8, 5, 14, 2, false],
    jab2: [11, 32, 12, 8, 5, 14, 2, false],
    finisher: [20, 34, 14, 12, 6, 22, 5, true],
  },
  zf: {
    jab1: [10, 32, 8, 5, 4, 9, 1, false],
    jab2: [10, 34, 8, 5, 4, 9, 1, false],
    finisher: [15, 36, 14, 10, 6, 18, 4, true],
  },
  zy: {
    jab1: [6, 26, 10, 5, 3, 8, 1, false],
    jab2: [6, 28, 10, 5, 3, 8, 1, false],
    finisher: [10, 30, 12, 7, 4, 13, 3, true],
  },
  hz: {
    jab1: [7, 22, 10, 6, 4, 10, 1, false],
    jab2: [7, 24, 10, 6, 4, 10, 1, false],
    finisher: [10, 26, 12, 8, 5, 14, 3, true],
  },
  wy: {
    jab1: [12, 26, 10, 9, 5, 14, 2, false],
    jab2: [12, 28, 10, 9, 5, 14, 2, false],
    finisher: [17, 30, 14, 13, 6, 18, 5, true],
  },
}

// Pre-moveset combo values: jabs 6/4/10, finisher 8/5/16, 69 ticks a chain.
// The DPS test below recomputes the live ratio against these in-test.
const OLD_COMBO: Record<string, { damage: number; frames: number }> = {
  gy: { damage: 31, frames: 69 },
  zf: { damage: 35, frames: 69 },
  zy: { damage: 28, frames: 69 },
  hz: { damage: 24, frames: 69 },
  wy: { damage: 30, frames: 69 },
}

const PREFIX_OF: Record<string, string> = {
  guanyu: 'gy',
  zhangfei: 'zf',
  zhaoyun: 'zy',
  huangzhong: 'hz',
  weiyan: 'wy',
}

function comboTotals(id: string): { damage: number; frames: number } {
  let damage = 0
  let frames = 0
  for (const attackId of characterById(id).combo) {
    const def = attackById(attackId)
    damage += def.damage
    frames += totalFrames(def)
  }
  return { damage, frames }
}

function comboDps(id: string): number {
  const { damage, frames } = comboTotals(id)
  return damage / frames
}

function oldDps(prefix: string): number {
  const old = OLD_COMBO[prefix]
  if (!old) throw new Error(`missing old combo for ${prefix}`)
  return old.damage / old.frames
}

function comboFrames(id: string): number {
  return comboTotals(id).frames
}

describe('weapon-true hero movesets', () => {
  it('pins every combo hit: damage, reach, arc, frames, knockback, knockdown', () => {
    let checked = 0
    for (const [prefix, hits] of Object.entries(COMBO_DATA)) {
      for (const [name, row] of Object.entries(hits)) {
        const id = `${prefix}.${name}`
        const def = attackById(id)
        const [damage, reach, arc, startup, active, recover, knockback, knockdown] = row
        expect(def.damage, `${id} damage`).toBe(damage)
        expect(def.reach, `${id} reach`).toBe(reach)
        expect(def.arc, `${id} arc`).toBe(arc)
        expect(def.startup, `${id} startup`).toBe(startup)
        expect(def.active, `${id} active`).toBe(active)
        expect(def.recover, `${id} recover`).toBe(recover)
        expect(def.knockback, `${id} knockback`).toBe(knockback)
        expect(def.knockdown, `${id} knockdown`).toBe(knockdown)
        checked += 1
      }
    }
    expect(checked).toBe(15)
  })

  it('chain speed follows the weapon identity: Zhao Yun fastest, Guan Yu slowest', () => {
    expect(comboFrames('guanyu')).toBe(94)
    expect(comboFrames('zhangfei')).toBe(70)
    expect(comboFrames('zhaoyun')).toBe(56)
    expect(comboFrames('huangzhong')).toBe(67)
    expect(comboFrames('weiyan')).toBe(93)
    expect(comboFrames('zhaoyun')).toBeLessThan(comboFrames('guanyu'))
  })

  it('reach and arc follow the weapon: zf longest and narrowest, gy widest, hz shortest', () => {
    const jab1Reach = (prefix: string): number => attackById(`${prefix}.jab1`).reach
    expect(attackById('zf.jab1').reach).toBe(32)
    for (const other of ['gy', 'zy', 'hz', 'wy']) {
      expect(jab1Reach('zf'), `zf.jab1 reach vs ${other}.jab1`).toBeGreaterThan(jab1Reach(other))
    }
    expect(attackById('zf.jab1').arc).toBe(8)
    expect(attackById('gy.jab1').arc).toBe(12)
    expect(attackById('hz.jab1').reach).toBe(22)
    for (const other of ['gy', 'zf', 'zy', 'wy']) {
      expect(jab1Reach('hz'), `hz.jab1 reach vs ${other}.jab1`).toBeLessThan(jab1Reach(other))
    }
  })

  it('every combo hit has a positive length, and only finishers knock down', () => {
    for (const id of CHARACTER_ORDER) {
      const character = characterById(id)
      for (const attackId of character.combo) {
        expect(totalFrames(attackById(attackId)), `${attackId} length`).toBeGreaterThan(0)
      }
      // Jabs that knocked down would end the combo on the first hit: the
      // follow-up would whiff on knockdown i-frames by combat design.
      expect(attackById(character.combo[0] ?? '').knockdown, `${id} jab1`).toBe(false)
      expect(attackById(character.combo[1] ?? '').knockdown, `${id} jab2`).toBe(false)
      expect(attackById(character.combo[2] ?? '').knockdown, `${id} finisher`).toBe(true)
    }
  })

  it('full-combo DPS stays within 10% of the old shared-frame value, computed live', () => {
    for (const id of CHARACTER_ORDER) {
      const prefix = PREFIX_OF[id] ?? ''
      const ratio = Math.abs(comboDps(id) - oldDps(prefix)) / oldDps(prefix)
      expect(ratio, `${id} dps drift ${ratio}`).toBeLessThanOrEqual(0.1)
    }
  })

  it('jumpkicks, specials, the mounted sweep and enemy attacks are untouched', () => {
    // Jumpkicks keep their old damage and old (reach+2, arc+4) geometry.
    const kicks: Record<string, [number, number, number]> = {
      gy: [10, 30, 14],
      zf: [11, 28, 14],
      zy: [10, 28, 14],
      hz: [9, 26, 14],
      wy: [10, 28, 14],
    }
    for (const [prefix, [damage, reach, arc]] of Object.entries(kicks)) {
      const def = attackById(`${prefix}.jumpkick`)
      expect(
        [def.damage, def.reach, def.arc, def.startup, def.active, def.recover],
        `${prefix}.jumpkick`,
      ).toEqual([damage, reach, arc, 4, 20, 0])
    }
    // Melee specials keep their damage and the 70/26 aoe shape.
    const specials: Record<string, number> = { gy: 22, zf: 24, zy: 20, wy: 20 }
    for (const [prefix, damage] of Object.entries(specials)) {
      const def = attackById(`${prefix}.special`)
      expect(
        [def.damage, def.reach, def.arc, def.startup, def.active, def.recover],
        `${prefix}.special`,
      ).toEqual([damage, 70, 26, 6, 12, 12])
    }
    // Huang Zhong draw stays inert: the arrow projectile does the work.
    const hz = attackById('hz.special')
    expect([hz.damage, hz.reach, hz.arc, hz.startup, hz.active, hz.recover]).toEqual([0, 0, 0, 4, 0, 14])
    // The mounted sweep and enemy defs are byte-identical data.
    expect(ATTACKS['mounted.sweep']).toEqual({
      id: 'mounted.sweep', damage: 14, reach: 38, arc: 12, startup: 8, active: 6,
      recover: 14, knockback: 3, knockdown: true, aerial: false, aoe: false,
    })
    expect(ATTACKS['soldier.swing']).toEqual({
      id: 'soldier.swing', damage: 6, reach: 24, arc: 10, startup: 14, active: 4,
      recover: 20, knockback: 2, knockdown: false, aerial: false, aoe: false,
    })
  })
})
