/**
 * Character-select roster geometry (UI-3), shared by the card painter and the
 * scene so the baked frame and the live content cannot drift apart.
 *
 * Pure data + pure functions: no Phaser, no DOM - unit tests check the layout
 * fits the 480x270 screen without running a browser.
 */
import { SCREEN_WIDTH } from '../../core/constants'

/** One roster card, in logical px, relative to the card's top-left corner. */
export const CARD = {
  w: 84,
  h: 160,
  /** Portrait recess. 76x84 matches the 0.9 aspect of the painted portraits. */
  window: { x: 4, y: 4, w: 76, h: 84 },
  /** Parchment name plate. */
  plate: { x: 4, y: 92, w: 76, h: 34 },
  /** Stat tray. */
  tray: { x: 4, y: 130, w: 76, h: 26 },
} as const

/** The faction-blue roster frame the cards sit in (baked into the backdrop). */
export const FRAME = { x: 6, y: 34, w: 468, h: 176 } as const
/** The bottom lacquer command strip (baked into the backdrop). */
export const STRIP = { x: 20, y: 222, w: 440, h: 26 } as const

/** Screen top of every card. */
export const CARD_TOP = 42
/** Centre-to-centre distance between neighbouring cards. */
export const CARD_SPACING = 92
/** How far the cursor halo reaches outside the card on each side. */
export const GLOW_PAD = 6
/** Pips per stat row. */
export const STAT_PIPS = 5

/** Centre x of card `index` in a row of `count`, centred on the screen. */
export function cardCenterX(index: number, count: number): number {
  return SCREEN_WIDTH / 2 - (CARD_SPACING * (count - 1)) / 2 + index * CARD_SPACING
}

/** Centre y of every card. */
export function cardCenterY(): number {
  return CARD_TOP + CARD.h / 2
}

/**
 * Filled pips (1..pips) for `value` within the roster's spread of `values`.
 * Normalised across the roster - the pips compare the five to each other, not
 * to an invented maximum - and never zero, so no hero reads as having none.
 */
export function statPips(values: number[], value: number, pips: number = STAT_PIPS): number {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  if (hi === lo) return pips
  return 1 + Math.round(((pips - 1) * (value - lo)) / (hi - lo))
}
