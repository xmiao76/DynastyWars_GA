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
export const META_ROW = { x: 122, y: 27, size: 7 } as const

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

/** Centre column between the plates. */
export const STAGE_LABEL = { x: SCREEN_WIDTH / 2, y: 1, size: 9 } as const
export const SCORE = { x: SCREEN_WIDTH / 2, y: 12, size: 9 } as const
export const CHIP = { w: 56, h: 14, x: SCREEN_WIDTH / 2, y: 23 } as const

/** Advance cue: chevrons at the screen right once the camera unlocks. */
export const GO = { w: 44, h: 14, x: SCREEN_WIDTH - 58, y: 114 } as const

/** Stage/boss nameplate banner, slid under the band. */
export const BANNER = { y: 56, w: 320, h: 44 } as const

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
