import { describe, expect, it } from 'vitest'
import { ATTACKS, attackById, totalFrames } from '../../src/core/attacks'
import { CHARACTER_ORDER, characterById } from '../../src/core/characters'
import { makeCombatant } from '../../src/core/entities'
import { createSim, drainSimEvents, playerOf, stepSim } from '../../src/core/sim'
import { neutralInput } from '../../src/core/types'
import { makeSandbox } from './helpers'

describe('character data schema', () => {
  it('every hero has a complete, sane moveset', () => {
    for (const id of CHARACTER_ORDER) {
      const character = characterById(id)
      expect(character.id).toBe(id)
      expect(character.nameEn.length).toBeGreaterThan(0)
      expect(character.nameZh.length).toBeGreaterThan(0)
      expect(character.maxHp).toBeGreaterThan(0)
      expect(character.walkSpeed).toBeGreaterThan(0)
      expect(character.specialCost).toBeGreaterThan(0)
      expect(character.specialCost).toBeLessThan(character.maxHp)

      for (const attackId of [...character.combo, character.jumpAttack, character.specialAttack]) {
        const def = ATTACKS[attackId]
        expect(def, `missing attack ${attackId}`).toBeDefined()
        if (!def) throw new Error(`missing attack ${attackId}`)
        expect(totalFrames(def), `zero-length attack ${attackId}`).toBeGreaterThan(0)
      }
      // Combos are 3-hit chains ending without a successor.
      expect(character.combo).toHaveLength(3)
      for (const jabId of character.combo) {
        if (!character.specialFiresProjectile) {
          expect(attackById(jabId).damage, `non-positive damage ${jabId}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('heroes differ in stats: Zhang Fei hits hardest, Zhao Yun is fastest', () => {
    const zhangfei = characterById('zhangfei')
    const zhaoyun = characterById('zhaoyun')
    const gyu = characterById('guanyu')
    expect(attackById(zhangfei.combo[0] ?? '').damage).toBeGreaterThan(
      attackById(zhaoyun.combo[0] ?? '').damage,
    )
    expect(zhangfei.maxHp).toBeGreaterThan(zhaoyun.maxHp)
    expect(zhaoyun.walkSpeed).toBeGreaterThan(zhangfei.walkSpeed)
    expect(attackById(gyu.combo[0] ?? '').reach).toBeGreaterThan(attackById(zhaoyun.combo[0] ?? '').reach)
  })

  it('sim construction reflects per-character stats', () => {
    expect(playerOf(createSim(1, { charId: 'zhangfei' })).maxHp).toBe(140)
    expect(playerOf(createSim(1, { charId: 'huangzhong' })).maxHp).toBe(110)
    expect(playerOf(createSim(1, { charId: 'zhangfei' })).speed).toBeCloseTo(1.3)
    expect(createSim(1, { charId: 'guanyu' }).charId).toBe('guanyu')
  })
})

describe('Huang Zhong bow special', () => {
  it('fires a hero-side arrow that damages enemies', () => {
    const sim = makeSandbox()
    const player = playerOf(sim)
    sim.charId = 'huangzhong'
    const target = makeCombatant(96, 'soldier', 'enemy', player.x + 80, player.y, 24, 0.9, 'left')
    sim.entities.push(target)

    stepSim(sim, { ...neutralInput(), specialPressed: true })
    expect(player.hp).toBe(120 - 12) // hz specialCost
    expect(sim.stats.specialsUsed).toBe(1)

    let sawHeroArrow = false
    let arrowDamage: number | null = null
    for (let t = 0; t < 90 && arrowDamage === null; t += 1) {
      stepSim(sim, neutralInput())
      for (const event of drainSimEvents(sim)) {
        if (event.type === 'spawn' && event.kind === 'arrow') {
          const arrow = sim.entities.find((e) => e.id === event.id)
          if (arrow?.side === 'hero') sawHeroArrow = true
        }
        if (event.type === 'hit' && event.targetId === target.id) arrowDamage = event.damage
      }
    }
    expect(sawHeroArrow).toBe(true)
    expect(arrowDamage).toBe(12) // heroarrow.hit, not the enemy 5-dmg arrow
  })
})
