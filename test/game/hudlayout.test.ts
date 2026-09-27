import { describe, expect, it } from 'vitest'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../src/core/constants'
import { CHARACTER_ORDER, characterById } from '../../src/core/characters'
import { ENEMIES } from '../../src/core/enemies'
import {
  BANNER,
  CHIP,
  COMBO,
  CONTINUE_TEXT,
  GO,
  MEDAL,
  PEARL,
  PLATE,
  RAIL,
  RAIL_BAR,
  RESULT_CHIP,
  SCORE,
  STAGE_LABEL,
  WARNING_BANNER_DROP,
  bossSegments,
  decayGhost,
  mirrorX,
  resultChipRow,
  playerSegments,
  slotFor,
} from '../../src/game/ui/hudlayout'
import { DIALOG_TEX } from '../../src/game/art/flowart'

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

/**
 * UIR-1 (V-1): the HUD centre column's three lines never share pixels.
 * Extents match the origins HudScene creates them with: STAGE_LABEL is
 * top-origin (y .. y + size + 2 for the font's descent), SCORE is
 * centre-origin (y - size/2 - 1 .. y + size/2 + 1), the CHIP is a
 * top-origin image of height h. Before the fix STAGE_LABEL spanned
 * y1-11 and SCORE y6.5-17.5 - ~5px of shared pixels (博望坡 printed
 * over "SCORE 0").
 */
describe('UIR-1 HUD centre column never shares pixels (V-1)', () => {
  const stageSpan = [STAGE_LABEL.y, STAGE_LABEL.y + STAGE_LABEL.size + 2] as const
  const scoreSpan = [SCORE.y - SCORE.size / 2 - 1, SCORE.y + SCORE.size / 2 + 1] as const
  const chipSpan = [CHIP.y, CHIP.y + CHIP.h] as const
  const gap = (a: readonly [number, number], b: readonly [number, number]): number =>
    (a[0] <= b[0] ? b[0] - a[1] : a[0] - b[1])

  it('stage label, score and chip extents are disjoint with >= 1px gaps', () => {
    expect(gap(stageSpan, scoreSpan)).toBeGreaterThanOrEqual(1)
    expect(gap(scoreSpan, chipSpan)).toBeGreaterThanOrEqual(1)
    expect(gap(stageSpan, chipSpan)).toBeGreaterThanOrEqual(1)
  })

  it('the column stays inside its 40px centre band', () => {
    expect(stageSpan[0]).toBeGreaterThanOrEqual(0)
    expect(chipSpan[1]).toBeLessThanOrEqual(40)
  })
})

/**
 * UIR-2 (V-2): the boss WARNING banner must read while the boss rail is
 * up. It used to sit at BANNER.y behind the rail band (40..58) and only
 * its subtitle showed. The fix drops the WARNING variant
 * (WARNING_BANNER_DROP) so the banner's title clears the rail's bounds
 * - nothing is covered, keeping the banner's "never covers a persistent
 * readout" rule. Stage banners keep their position.
 */
describe('UIR-2 WARNING banner clears the boss rail (V-2)', () => {
  const railSpan = [RAIL.y, RAIL.y + RAIL.h] as const
  // The title sits at -8 in the banner container (HudScene.raiseBanner).
  const titleSpanAt = (containerY: number): readonly [number, number] =>
    [containerY - 18, containerY + 2]
  it('the WARNING title band does not intersect the rail band', () => {
    const warn = titleSpanAt(BANNER.y + WARNING_BANNER_DROP)
    expect(warn[0]).toBeGreaterThanOrEqual(railSpan[1])
  })
  it('stage banners keep their current look (unchanged position)', () => {
    const plain = titleSpanAt(BANNER.y)
    expect(plain[0]).toBeLessThan(railSpan[1])
  })
})

/**
 * UIR-5 (V-5/V-6/V-7): the continue and result panels. Titles must lie
 * within their card/panel inset by >= 4px (the CONTINUE? title used to
 * sit ON the dialog's gold top rule; STAGE CLEAR! touched the panel's),
 * the result chip row is centred on the panel and no chip crosses its
 * frame (the row used to span x70-390, centre 230, LIVES on the
 * border), and the continue texts keep PAUSED's dark stroke.
 */
describe('UIR-5 panel titles and chip rows (V-5/V-6/V-7)', () => {
  it('the continue dialog texts lie inside the card inset by >= 4px', () => {
    const cardTop = 123 - DIALOG_TEX.height / 2
    const cardBottom = 123 + DIALOG_TEX.height / 2
    // Title (22px), countdown (30px), hint (10px): half-extents cover the
    // font's ascender/descender slack.
    const spans: Array<readonly [number, number]> = [
      [CONTINUE_TEXT.titleY - 11, CONTINUE_TEXT.titleY + 11],
      [CONTINUE_TEXT.countdownY - 15, CONTINUE_TEXT.countdownY + 15],
      [CONTINUE_TEXT.hintY - 5, CONTINUE_TEXT.hintY + 5],
    ]
    for (const [top, bottom] of spans) {
      expect(top).toBeGreaterThanOrEqual(cardTop + 4)
      expect(bottom).toBeLessThanOrEqual(cardBottom - 4)
    }
    // Title and countdown stay disjoint too.
    expect(spans[0]![1]).toBeLessThan(spans[1]![0])
  })

  it('the result chip row is centred and inside the panel frame', () => {
    const row = resultChipRow()
    expect(Math.abs((row.left + row.right) / 2 - SCREEN_WIDTH / 2)).toBeLessThanOrEqual(1)
    expect(row.left).toBeGreaterThanOrEqual(RESULT_CHIP.panelX0)
    expect(row.right).toBeLessThanOrEqual(RESULT_CHIP.panelX1)
  })
})
