/**
 * Paper-doll body parts (BODY-2): raster limbs posed on the existing
 * skeleton, the body counterpart to ART-18's painted heads.
 *
 * A part is painted once pointing DOWN (+Y) with its pivot at top-center
 * (joint A) and a rounded cap past each end; the renderer translates to A,
 * rotates toward B, and scales axially to |AB| (limb lengths vary across
 * poses - foreshortening up to 128% - so rigid rotation alone cannot fit)
 * and laterally by build bulk (fixtures are painted at bulk 1.0).
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets - unit
 * tests render through `drawFigure` with fixture art.
 */
import type { Pt } from './rig'

export type BodyPartName =
  | 'cloth'
  | 'upperArmF'
  | 'foreArmF'
  | 'thighF'
  | 'shinF'
  | 'torso'
  | 'thighN'
  | 'shinN'
  | 'upperArmN'
  | 'foreArmN'
  /** BODY-20 painted hand cells (see hand-parts.ts); never in DRAW order. */
  | 'gripN'
  | 'gripF'
  | 'relaxN'
  | 'relaxF'
  | 'wrapF'

export interface BodyPartDef {
  /** Skeleton joints this part spans, from pivot (A) to tip (B). */
  from: string
  to: string
  /** Idle-pose |AB|, the length the part is painted at. */
  naturalLen: number
}

export const BODY_PART_DEFS: Record<BodyPartName, BodyPartDef> = {
  cloth: { from: 'shoulderN', to: 'hip', naturalLen: 22 },
  upperArmF: { from: 'shoulderF', to: 'elbowF', naturalLen: 12.37 },
  foreArmF: { from: 'elbowF', to: 'handF', naturalLen: 12.17 },
  thighF: { from: 'hipF', to: 'kneeF', naturalLen: 18.11 },
  shinF: { from: 'kneeF', to: 'footF', naturalLen: 21.1 },
  torso: { from: 'chest', to: 'hip', naturalLen: 22 },
  thighN: { from: 'hipN', to: 'kneeN', naturalLen: 18.25 },
  shinN: { from: 'kneeN', to: 'footN', naturalLen: 21.21 },
  upperArmN: { from: 'shoulderN', to: 'elbowN', naturalLen: 12.65 },
  foreArmN: { from: 'elbowN', to: 'handN', naturalLen: 11.05 },
  // BODY-20 hand cells: the hand painter (hand-parts.ts) orients by these
  // joints but never stretches to |AB| - a hand keeps its size while the
  // arm above it varies. naturalLen is the painted cell's span, for the
  // audit's geometry sanity only.
  gripN: { from: 'elbowN', to: 'handN', naturalLen: 8.8 },
  gripF: { from: 'elbowF', to: 'handF', naturalLen: 8.8 },
  relaxN: { from: 'elbowN', to: 'handN', naturalLen: 8.4 },
  relaxF: { from: 'elbowF', to: 'handF', naturalLen: 8.4 },
  wrapF: { from: 'elbowF', to: 'handF', naturalLen: 8.4 },
}

/** Draw order, matching the procedural slots in `figureShapes`. */
export const BODY_PART_ORDER: BodyPartName[] = [
  'cloth',
  'upperArmF',
  'foreArmF',
  'thighF',
  'shinF',
  'torso',
  'thighN',
  'shinN',
  'upperArmN',
  'foreArmN',
]

export interface BodyPartCell {
  /** Device-px rect of this part's cell within the sheet. */
  x: number
  y: number
  w: number
  h: number
  /** Pivot in device px from the cell's top-left (= joint A when drawn). */
  pivotX: number
  pivotY: number
}

export interface BodyArt {
  id: string
  revision: string
  sheet: CanvasImageSource
  /** Device px per logical unit the sheet was painted at (fixtures: 4). */
  density: number
  /**
   * Painted parts. Partial ON PURPOSE: a missing part falls back to its
   * procedural shape in the same slot (e.g. heroes whose masters show no
   * cape keep the procedural cape). This is a design-time mix, distinct
   * from the atomic whole-fighter fallback on missing/corrupt sheets.
   */
  parts: Partial<Record<BodyPartName, BodyPartCell>>
  /** Complexion, so procedural skin still matches where it shows. */
  skin: number
}

export interface BodyArtResources {
  bodies: Readonly<Partial<Record<string, BodyArt>>>
}

export type BodyPainter = (ctx: CanvasRenderingContext2D, part: BodyPartName) => void

/**
 * A painter closure over one pose: draws `part` spanning its joints. `bulk`
 * is the fighter's build bulk (fixtures are painted at 1.0). The caller
 * owns the transform stack; each part saves/restores. `lying` mirrors the
 * cloth cell: a prone cape trails toward the feet (the procedural polygon
 * flips its trail side the same way), so the painted cape flips with it.
 */
export function bodyPainter(
  art: BodyArt,
  joints: Readonly<Record<string, Pt>>,
  bulk: number,
  lying = false,
): BodyPainter {
  return (ctx, part) => {
    const def = BODY_PART_DEFS[part]
    const cell = art.parts[part]
    const a = joints[def.from]
    const b = joints[def.to]
    if (!a || !b || !cell) return
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy)
    if (dist < 0.01 || def.naturalLen < 0.01) return
    ctx.save()
    ctx.translate(a.x, a.y)
    ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2)
    ctx.scale(bulk, dist / def.naturalLen)
    if (part === 'cloth' && lying) ctx.scale(-1, 1)
    // Source rect in device px, dest rect converted to logical units: the
    // caller draws in canonical figure space. Forgetting the density once
    // rendered every part 4x too large and buried the far side entirely.
    const d = art.density > 0 ? art.density : 1
    ctx.drawImage(
      art.sheet,
      cell.x,
      cell.y,
      cell.w,
      cell.h,
      -cell.pivotX / d,
      -cell.pivotY / d,
      cell.w / d,
      cell.h / d,
    )
    ctx.restore()
  }
}

/** Minimal image shape for mask comparison (matches SpriteImage). */
export interface MaskImage {
  width: number
  height: number
  data: Uint8Array
}

/**
 * Alpha-mask IoU of two renders in the SAME box. Callers must only compare
 * same-pose renders: per-pose boxes carry different margins, so cross-pose
 * IoU is meaningless (validated in BODY-1 prep: identical renders score
 * exactly 1.0; two heroes in one pose score 0.763).
 */
export function maskIou(a: MaskImage, b: MaskImage): number {
  if (a.width !== b.width || a.height !== b.height) return NaN
  let inter = 0
  let union = 0
  for (let i = 3; i < a.data.length; i += 4) {
    const ma = (a.data[i] ?? 0) > 128
    const mb = (b.data[i] ?? 0) > 128
    if (ma && mb) inter += 1
    if (ma || mb) union += 1
  }
  return union === 0 ? 1 : inter / union
}

/**
 * Old-vs-new parity floor: a silhouette DRIFT bound, not a breakage test.
 * Calibrated on real art - honest renders score 0.787-0.878 (heroes
 * 0.845+, the lean archer reshapes most at 0.787), cross-identity scores
 * 0.657-0.777. 0.75 sits below every honest render with margin while still
 * tripping on catastrophic breakage; precise breakage detection (missing
 * or misseated parts) belongs to the per-part position tests, which are
 * immune to enrichment, and readability belongs to the vision sprite gate.
 */
export const PARITY_FLOOR = 0.75
