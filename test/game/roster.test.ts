import { describe, expect, it } from 'vitest'
import { CHARACTER_ORDER, characterById } from '../../src/core/characters'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../src/core/constants'
import { secondPlayerCharacter } from '../../src/game/players'
import {
  CARD,
  CARD_SPACING,
  CARD_TOP,
  FRAME,
  GLOW_PAD,
  STAT_PIPS,
  STRIP,
  cardCenterX,
  statPips,
} from '../../src/game/ui/roster'

describe('UI-3 roster geometry', () => {
  const n = CHARACTER_ORDER.length

  it('fits five cards, with their halos, inside the roster frame', () => {
    const first = cardCenterX(0, n) - CARD.w / 2 - GLOW_PAD
    const last = cardCenterX(n - 1, n) + CARD.w / 2 + GLOW_PAD
    expect(first).toBeGreaterThanOrEqual(FRAME.x)
    expect(last).toBeLessThanOrEqual(FRAME.x + FRAME.w)
    expect(CARD_TOP - GLOW_PAD).toBeGreaterThanOrEqual(FRAME.y)
    expect(CARD_TOP + CARD.h + GLOW_PAD).toBeLessThanOrEqual(FRAME.y + FRAME.h)
    // Neighbouring halos may touch but cards never overlap.
    expect(CARD_SPACING).toBeGreaterThan(CARD.w)
  })

  it('centres the row and keeps the frame and strip on screen, apart', () => {
    expect(cardCenterX(0, n) + cardCenterX(n - 1, n)).toBeCloseTo(SCREEN_WIDTH, 6)
    for (const r of [FRAME, STRIP]) {
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(SCREEN_WIDTH)
      expect(r.y + r.h).toBeLessThanOrEqual(SCREEN_HEIGHT)
    }
    expect(STRIP.y).toBeGreaterThan(FRAME.y + FRAME.h)
  })

  it('stacks the card sections without overlap inside the card', () => {
    const parts = [CARD.window, CARD.plate, CARD.tray]
    for (let i = 0; i < parts.length; i += 1) {
      const p = parts[i]
      if (!p) continue
      expect(p.x + p.w).toBeLessThanOrEqual(CARD.w)
      expect(p.y + p.h).toBeLessThanOrEqual(CARD.h)
      const next = parts[i + 1]
      if (next) expect(next.y).toBeGreaterThanOrEqual(p.y + p.h)
    }
    // Painted portraits are 432x480 (0.9); the recess keeps that shape.
    expect(CARD.window.w / CARD.window.h).toBeCloseTo(432 / 480, 1)
  })
})

describe('UI-3 stat pips', () => {
  it('spans 1..STAT_PIPS across the roster spread, never zero', () => {
    const values = [110, 120, 125, 130, 140]
    expect(statPips(values, 110)).toBe(1)
    expect(statPips(values, 140)).toBe(STAT_PIPS)
    for (const v of values) {
      const p = statPips(values, v)
      expect(p).toBeGreaterThanOrEqual(1)
      expect(p).toBeLessThanOrEqual(STAT_PIPS)
    }
    expect(statPips([3, 3, 3], 3)).toBe(STAT_PIPS)
  })

  it('orders the real roster the way its stats do', () => {
    const roster = CHARACTER_ORDER.map((id) => characterById(id))
    for (const key of ['maxHp', 'walkSpeed'] as const) {
      const values = roster.map((c) => c[key])
      for (const a of roster) {
        for (const b of roster) {
          if (a[key] > b[key]) expect(statPips(values, a[key])).toBeGreaterThanOrEqual(statPips(values, b[key]))
        }
      }
    }
  })
})

describe('2P preview rule', () => {
  it('never hands player two the hero player one picked', () => {
    for (const id of CHARACTER_ORDER) {
      const second = secondPlayerCharacter(id)
      expect(second).not.toBe(id)
      expect(CHARACTER_ORDER).toContain(second)
    }
  })
})
