import { describe, expect, it } from 'vitest'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../src/core/constants'
import { CHARACTER_ORDER, characterById } from '../../src/core/characters'
import { ENEMIES } from '../../src/core/enemies'
import {
  BANNER,
  CHIP,
  COMBO,
  GO,
  MEDAL,
  PEARL,
  PLATE,
  RAIL,
  RAIL_BAR,
  bossSegments,
  decayGhost,
  mirrorX,
  playerSegments,
  slotFor,
} from '../../src/game/ui/hudlayout'

const onScreen = (r: { x: number; y: number; w: number; h: number }): void => {
  expect(r.x).toBeGreaterThanOrEqual(0)
  expect(r.y).toBeGreaterThanOrEqual(0)
  expect(r.x + r.w).toBeLessThanOrEqual(SCREEN_WIDTH)
  expect(r.y + r.h).toBeLessThanOrEqual(SCREEN_HEIGHT)
}

describe('UI-4 HUD geometry', () => {
  it('keeps both plates fully on screen, leaving the centre column a lane', () => {
    for (const side of ['p1', 'p2'] as const) {
      onScreen(slotFor(side).plate)
    }
    const p2 = slotFor('p2')
    expect(p2.plate.x).toBeGreaterThan(PLATE.x + PLATE.w)
    // Medallions and pearls stay inside their plates.
    for (const side of ['p1', 'p2'] as const) {
      const s = slotFor(side)
      expect(s.medalX - MEDAL.d / 2).toBeGreaterThanOrEqual(s.plate.x)
      expect(s.medalX + MEDAL.d / 2).toBeLessThanOrEqual(s.plate.x + s.plate.w)
      expect(s.pearlX + PEARL.d / 2).toBeLessThanOrEqual(s.plate.x + s.plate.w)
    }
  })

  it('mirrors P2 exactly so the two plates flank the centre stack', () => {
    expect(mirrorX(PLATE.x, PLATE.w)).toBe(SCREEN_WIDTH - PLATE.x - PLATE.w)
    const left = PLATE.x + PLATE.w
    const right = mirrorX(PLATE.x, PLATE.w)
    expect(SCREEN_WIDTH / 2).toBeGreaterThan(left)
    expect(SCREEN_WIDTH / 2).toBeLessThan(right)
    // And the centre stack (label/score/chip) fits the lane.
    expect(CHIP.w).toBeLessThanOrEqual(right - left)
  })

  it('segments scale with each hero/boss health pool', () => {
    for (const id of CHARACTER_ORDER) {
      const segs = playerSegments(characterById(id).maxHp)
      expect(segs).toBeGreaterThanOrEqual(1)
      expect(segs).toBeLessThanOrEqual(10)
    }
    const bosses = Object.values(ENEMIES).filter((e) => e.maxHp > 150)
    expect(bosses.length).toBeGreaterThan(0)
    for (const b of bosses) {
      const segs = bossSegments(b.maxHp)
      expect(segs).toBeGreaterThanOrEqual(2)
      expect(segs).toBeLessThanOrEqual(12)
    }
  })

  it('sits the boss rail below the band and sizes its bar for the names', () => {
    expect(RAIL.y).toBeGreaterThanOrEqual(PLATE.y + PLATE.h)
    expect(RAIL_BAR.x).toBeGreaterThanOrEqual(RAIL.x)
    expect(RAIL_BAR.x + RAIL_BAR.w).toBeLessThanOrEqual(RAIL.x + RAIL.w)
    // Longest boss name (Xiahou Dun 夏侯惇 ~ 70px) clears the bar's start.
    expect(RAIL_BAR.x).toBeGreaterThanOrEqual(80)
  })

  it('positions the GO cue and banner inside the screen', () => {
    onScreen({ x: GO.x, y: GO.y, w: GO.w, h: GO.h })
    onScreen({ x: SCREEN_WIDTH / 2 - BANNER.w / 2, y: BANNER.y - BANNER.h / 2, w: BANNER.w, h: BANNER.h })
    // The banner still overlaps some HUD element (the rail's rect) so the
    // depth gate stays non-vacuous.
    const top = BANNER.y - BANNER.h / 2
    const bottom = BANNER.y + BANNER.h / 2
    expect(top).toBeLessThan(RAIL.y + RAIL.h)
    expect(bottom).toBeGreaterThan(RAIL.y)
    expect(COMBO.y).toBeLessThan(SCREEN_HEIGHT)
  })
})

describe('UI-4 damage ghost', () => {
  it('snaps up on heal and holds losses before decaying', () => {
    expect(decayGhost(0.6, 0.9, 100)).toBe(0.9)
    // Within the hold window nothing moves.
    expect(decayGhost(0.9, 0.6, 200)).toBe(0.9)
    // Afterwards it eases toward the live ratio without overshooting.
    const next = decayGhost(0.9, 0.6, 450)
    expect(next).toBeLessThan(0.9)
    expect(next).toBeGreaterThanOrEqual(0.6)
  })
})
