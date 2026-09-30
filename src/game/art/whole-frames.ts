/**
 * Whole-frame pilot (docs/WHOLE_FRAME_TEST.md): a fighter pose painted as ONE
 * figure and blitted whole, instead of paper-doll parts on the rig. Frames
 * are prepared by `scripts/prepare-whole-frames.mjs` at exactly the pose's
 * art box (artBoxFor) at `density`, so the blit fills the same box the
 * procedural and paper-doll paths draw into - on-screen scale, bottom-centre
 * anchoring and gameplay are unchanged.
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets.
 */
import type { PoseName } from './poses'

export interface WholeFrameCell {
  /** Device-px rect of this pose's cell within the sheet. */
  x: number
  y: number
  w: number
  h: number
}

export interface WholeFrameArt {
  id: string
  revision: string
  sheet: CanvasImageSource
  /** Device px per logical unit the cells were prepared at. */
  density: number
  frames: Partial<Record<PoseName, WholeFrameCell>>
}

/**
 * Blit one painted pose into the current transform, filling `boxW` x `boxH`
 * logical units (the pose's whole art box). Returns false when this pose has
 * no painted frame; the caller then draws the fighter's existing art.
 */
export function paintWholeFrame(
  ctx: CanvasRenderingContext2D,
  art: WholeFrameArt,
  pose: PoseName,
  boxW: number,
  boxH: number,
): boolean {
  const cell = art.frames[pose]
  if (!cell) return false
  ctx.drawImage(art.sheet, cell.x, cell.y, cell.w, cell.h, 0, 0, boxW, boxH)
  return true
}

/** True when either pose of a transition is a whole frame (no rig blend). */
export function hasWholeFrame(art: WholeFrameArt | undefined, ...poses: PoseName[]): boolean {
  return art !== undefined && poses.some((p) => art.frames[p] !== undefined)
}
