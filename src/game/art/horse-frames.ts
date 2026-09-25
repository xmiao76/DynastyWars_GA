/**
 * Painted horse frames (BODY-5): full-frame raster replacement for the
 * procedural beast, one frame per distinct horse pose (idle/walk0/walk1;
 * everything else aliases idle, mirroring `horsePoseName`).
 *
 * Unlike paper-doll bodies, frames are blitted whole - the beast rig has no
 * part joints. Same asset chain shape as bodies: tracked master + committed
 * shipping sheet, Vite-hashed import, bounded boot preload, decode +
 * signature verification, atomic procedural fallback for the whole horse.
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets.
 */

export type HorseFrameName = 'idle' | 'walk0' | 'walk1'

export const HORSE_FRAMES: HorseFrameName[] = ['idle', 'walk0', 'walk1']

/** Which painted frame a texture key uses. Mirrors `horsePoseName`. */
export function horseFrameFor(pose: string): HorseFrameName {
  return pose === 'walk0' || pose === 'walk1' ? pose : 'idle'
}

export interface HorseFrameCell {
  /** Device-px rect of this frame's cell within the sheet. */
  x: number
  y: number
  w: number
  h: number
}

export interface HorseArt {
  id: string
  revision: string
  sheet: CanvasImageSource
  /** Device px per logical unit the sheet was painted at. */
  density: number
  frames: Partial<Record<HorseFrameName, HorseFrameCell>>
}

/**
 * Blit one painted frame into the current transform (canonical horse space,
 * 112x76 logical). A missing frame paints nothing and the caller falls back
 * to the procedural horse for that frame.
 */
export function paintHorseFrame(
  ctx: CanvasRenderingContext2D,
  art: HorseArt,
  frame: HorseFrameName,
  destW: number,
  destH: number,
): boolean {
  const cell = art.frames[frame]
  if (!cell) return false
  ctx.drawImage(art.sheet, cell.x, cell.y, cell.w, cell.h, 0, 0, destW, destH)
  return true
}
