/**
 * Painted weapon cells (BODY-21): one shared sheet of raster weapons drawn
 * over the EXACT procedural geometry (same length, grip math and rotation,
 * so sim reach and the ART-14/15 gates stay byte-stable), with painted
 * wood/steel/brass/cloth instead of flat cel fills + ink outlines.
 *
 * Placement rules (cells painted in absolute weapon coords, butt at x=0):
 * - Hafted weapons: anchored so the grip point (absolute x = L*grip) lands
 *   on the hand, rotated to weaponRot, unscaled. Weapons ignore build bulk
 *   (the procedural path does too).
 * - Bow: painted at reference half-length BOW_REF_HALF with the riser at
 *   the cell center (the grip); scaled in x by fore/BOW_REF_HALF exactly
 *   like the procedural traceBow(fore).
 * - Tassel: separate cell in the GRAVITY frame - tied at the socket
 *   (fore-7.5 in weapon coords), drawn UNROTATED, hanging figure +y.
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets.
 */
import type { Skeleton } from './rig'

/** Reference half-length the bow cell is painted at (generator agrees). */
export const BOW_REF_HALF = 26

/** One weapon cell's rect + absolute-origin marker, in device px. */
export interface WeaponCell {
  x: number
  y: number
  w: number
  h: number
  /** Device px of the absolute origin (butt / riser / tie) in the sheet. */
  originX: number
  originY: number
}

/** The shared weapon pack: 7 weapon cells + the tassel. */
export interface WeaponArt {
  revision: string
  sheet: CanvasImageSource
  /** Device px per logical unit the sheet was painted at. */
  density: number
  parts: Partial<Record<string, WeaponCell>>
}

export type WeaponPainter = (ctx: CanvasRenderingContext2D, kind: string) => void

export interface WeaponPose {
  /** Figure-space anchor (weaponAnchor ?? handN). */
  anchor: { x: number; y: number }
  rot: number
  grip: number
  /** Weapon length in logical units (WEAPONS[kind].length). */
  length: number
  /** Whether this kind carries a tassel (WEAPONS[kind].tassel). */
  tassel: boolean
}

/**
 * A painter closure over one pose: draws the weapon cell at its anchor and
 * the tassel cell at the socket (unrotated). The caller owns the transform
 * stack; each cell saves/restores.
 */
export function weaponCellPainter(
  art: WeaponArt,
  pose: WeaponPose,
): WeaponPainter {
  return (ctx, kind) => {
    const cell = art.parts[kind]
    if (!cell) return
    const d = art.density > 0 ? art.density : 1
    const isBow = kind === 'bow'
    // Grip point in device px from the CELL's left: butt origin + L*grip
    // for hafted weapons (the bow grips at its riser = origin). Origins
    // are recorded sheet-absolute, so rebase onto the cell.
    const fore = pose.length * (1 - pose.grip)
    const gripInCellX = (cell.originX - cell.x) + (isBow ? 0 : pose.length * pose.grip * d)
    const gripInCellY = cell.originY - cell.y
    ctx.save()
    ctx.translate(pose.anchor.x, pose.anchor.y)
    ctx.rotate(pose.rot)
    if (isBow) ctx.scale(fore / BOW_REF_HALF, 1)
    ctx.drawImage(
      art.sheet,
      cell.x, cell.y, cell.w, cell.h,
      -gripInCellX / d, -gripInCellY / d, cell.w / d, cell.h / d,
    )
    ctx.restore()
    if (!pose.tassel) return
    const tuft = art.parts.tassel
    if (!tuft) return
    // Socket in figure space, then the tassel hangs unrotated.
    const sx = fore - 7.5
    const c = Math.cos(pose.rot)
    const s = Math.sin(pose.rot)
    ctx.save()
    ctx.translate(pose.anchor.x + sx * c, pose.anchor.y + sx * s)
    ctx.drawImage(
      art.sheet,
      tuft.x, tuft.y, tuft.w, tuft.h,
      -(tuft.originX - tuft.x) / d, -(tuft.originY - tuft.y) / d, tuft.w / d, tuft.h / d,
    )
    ctx.restore()
  }
}

/** Read the pose fields the painter needs from a live skeleton. */
export function weaponPoseOf(
  pose: Skeleton, length: number, tassel: boolean,
): WeaponPose {
  return {
    anchor: pose.weaponAnchor ?? pose.handN,
    rot: pose.weaponRot,
    grip: pose.weaponGrip,
    length,
    tassel,
  }
}
