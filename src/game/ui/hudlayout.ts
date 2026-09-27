/**
 * HUD geometry (UI-4): the WoF-style top band. Pure numbers - no Phaser, so
 * the layout is unit-testable and both HudScene and the look spec read the
 * same source of truth.
 *
 * The band is two floating plates (P1 left, P2 right when joined) plus a
 * centre column (stage label, score, WAVE chip); the full-width boss rail
 * drops in below the band while a boss is up; the "GO" cue blinks at the
 * right once the camera unlocks. Every rect is logical (480x270).
 */
import { SCREEN_WIDTH } from '../../core/constants'

export type Side = 'p1' | 'p2'

export const PLATE = { x: 2, y: 2, w: 186, h: 36 } as const
export const MEDAL = { cx: 20, cy: 20, d: 34 } as const
export const NAME = { x: 41, y: 4 } as const
export const HP = { x: 41, y: 17, w: 127, h: 8 } as const
export const PEARL = { cx: 180, cy: 21, d: 10 } as const
export const PIP_ROW = { x0: 41, y: 27, d: 8, gap: 2, max: 8 } as const
/** Plate meta line (the HORSE row). UIR-4 (V-4): 9, not 7 - below
 * DISPLAY_MIN_SIZE the display family drops to a generic sans that is
 * ~6 CSS px on a Pixel 7 (the ledger measured it); 9 logical clears
 * 7 CSS px there and keeps the display family. */
export const META_ROW = { x: 122, y: 27, size: 9 } as const

/** P2's slot: the mirrored counterpart of every P1 rect. */
export function mirrorX(x: number, w: number): number {
  return SCREEN_WIDTH - (x + w)
}

/** Segment ticks: players read in ~20hp blocks, bosses in ~40hp blocks. */
export function playerSegments(maxHp: number): number {
  return Math.max(1, Math.round(maxHp / 20))
}

export function bossSegments(maxHp: number): number {
  return Math.max(2, Math.min(12, Math.round(maxHp / 40)))
}

/** Full-width boss rail, shown only while a boss is alive. */
export const RAIL = { x: 0, y: 40, w: SCREEN_WIDTH, h: 18 } as const
export const RAIL_BAR = { x: 112, y: 45, w: 304, h: 8 } as const
export const RAIL_NAME = { x: 8, y: 44 } as const
export const RAIL_TAG = { x: 422, y: 44 } as const

/** Centre column between the plates (the 40px band above the boss rail).
 * UIR-1 (V-1): the three lines never share pixels. The stage label is
 * top-origin, the score centre-origin (HudScene's setOrigin pair) - the
 * old 1/12/23 stack put the label's descent into the score's ascent
 * ("博望坡" printed over "SCORE 0"). Gaps >= 1px, pinned in
 * test/game/hudlayout.test.ts. */
export const STAGE_LABEL = { x: SCREEN_WIDTH / 2, y: 0, size: 9 } as const
export const SCORE = { x: SCREEN_WIDTH / 2, y: 18, size: 9 } as const
export const CHIP = { w: 56, h: 14, x: SCREEN_WIDTH / 2, y: 25 } as const

/** Advance cue: chevrons at the screen right once the camera unlocks. */
export const GO = { w: 44, h: 14, x: SCREEN_WIDTH - 58, y: 114 } as const

/**
 * UIR-5 (V-6/V-7): the continue dialog's text stack. The card is the
 * 184x96 dialog at centre y 123 (HudScene); the title used to sit at y92
 * ON the gold top rule. The stack keeps every text inside the panelRect
 * with >= 4px insets (test/game/hudlayout.test.ts), the title and
 * countdown carry PAUSED's dark stroke (V-7), and the title/countdown
 * stay disjoint.
 */
export const CONTINUE_TEXT = { titleY: 102, countdownY: 132, hintY: 154 } as const

/**
 * UIR-5 (V-5): the result panel's chip row. The old hard-coded offsets
 * spanned x70-390 (centre 230 - the LIVES chip sat on the parchment
 * border). The row is laid out from the panel band (x 70..410) with
 * even gaps, centred on SCREEN_WIDTH/2.
 */
export const RESULT_CHIP = {
  y: 156,
  widths: [62, 120, 90] as const,
  gap: 20,
  panelX0: 70,
  panelX1: 410,
} as const

/** Chip row's left edges and span, centred in the result panel band. */
export function resultChipRow(): { lefts: number[]; left: number; right: number } {
  const total =
    RESULT_CHIP.widths.reduce((a, b) => a + b, 0) + RESULT_CHIP.gap * (RESULT_CHIP.widths.length - 1)
  const left = SCREEN_WIDTH / 2 - total / 2
  const lefts: number[] = []
  let x = left
  for (const w of RESULT_CHIP.widths) {
    lefts.push(x)
    x += w + RESULT_CHIP.gap
  }
  return { lefts, left, right: left + total }
}

/** Stage/boss nameplate banner, slid under the band. */
export const BANNER = { y: 56, w: 320, h: 44 } as const

/**
 * UIR-2 (V-2): the boss WARNING drops below the boss rail instead of
 * hiding under it. The rail band is RAIL.y..RAIL.y+RAIL.h (40..58);
 * +22 puts the banner's title (at -8 in the container) clear of it,
 * so the WARNING reads while the rail is up - and nothing is covered,
 * keeping the banner's "never covers a persistent readout" rule.
 */
export const WARNING_BANNER_DROP = 22

/** Combo readout position (the number; the 'HIT' suffix hugs its right). */
export const COMBO = { x: SCREEN_WIDTH / 2, y: 78 } as const

/**
 * Damage ghost: presentation-only lag behind losses. Holds briefly so the
 * eye can see where the bar just was, then eases down at ~1.2/s. The live
 * ratio written into the bar's `bar` record is never derived from this.
 */
export function decayGhost(ghost: number, ratio: number, deltaMs: number): number {
  if (ghost <= ratio) return ratio
  const held = deltaMs <= 250 ? 0 : (deltaMs - 250) / 1000
  return Math.max(ratio, ghost - held * 1.2)
}

/** A P2 slot: same geometry as P1's, mirrored about the screen centre. */
export interface SlotGeometry {
  plate: { x: number; y: number; w: number; h: number }
  medalX: number
  medalY: number
  nameX: number
  nameRight: boolean
  hp: { x: number; y: number; w: number; h: number }
  pearlX: number
  pearlY: number
  pipX0: number
  pipY: number
  metaX: number
  metaY: number
}

export function slotFor(side: Side): SlotGeometry {
  if (side === 'p1') {
    return {
      plate: PLATE,
      medalX: MEDAL.cx,
      medalY: MEDAL.cy,
      nameX: NAME.x,
      nameRight: false,
      hp: HP,
      pearlX: PEARL.cx,
      pearlY: PEARL.cy,
      pipX0: PIP_ROW.x0,
      pipY: PIP_ROW.y,
      metaX: META_ROW.x,
      metaY: META_ROW.y,
    }
  }
  return {
    plate: { x: mirrorX(PLATE.x, PLATE.w), y: PLATE.y, w: PLATE.w, h: PLATE.h },
    medalX: mirrorX(MEDAL.cx - MEDAL.d / 2, MEDAL.d) + MEDAL.d / 2,
    medalY: MEDAL.cy,
    nameX: mirrorX(NAME.x, 0),
    nameRight: true,
    hp: { x: mirrorX(HP.x, HP.w), y: HP.y, w: HP.w, h: HP.h },
    pearlX: mirrorX(PEARL.cx - PEARL.d / 2, PEARL.d) + PEARL.d / 2,
    pearlY: PEARL.cy,
    pipX0: mirrorX(PIP_ROW.x0, 0),
    pipY: PIP_ROW.y,
    metaX: mirrorX(META_ROW.x, 0),
    metaY: META_ROW.y,
  }
}
