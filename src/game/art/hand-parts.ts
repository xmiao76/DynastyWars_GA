/**
 * Painted hand cells (BODY-20): grip fists, relaxed open hands and the
 * far-hand haft wrap, painted per fighter by `scripts/prepare-body-parts.mjs`
 * into each body sheet (skin-matched, soft form shading, NO ink outline) and
 * drawn here at the hand joints. The procedural fists/mittens
 * (drawGripHand/drawGripHandFar/drawFingertips/drawRelaxedHand in draw.ts)
 * remain the emergency path for fighters without body art.
 *
 * Placement rules (cells painted pointing +x):
 * - gripN/relaxN: anchored at handN, rotated along the near forearm
 *   (elbowN -> handN), scaled laterally by build bulk only - a hand keeps
 *   its length whatever the arm does (BODY-19 IK keeps segment lengths
 *   constant anyway; scaling by |AB| would stretch fingers on a lunge).
 * - gripF/relaxF: same, on the far arm's joints.
 * - wrapF: anchored at handF, rotated to weaponRot (x along the haft) -
 *   the fingertips cross the haft, drawn OVER the weapon.
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets.
 */
import type { BodyArt, BodyPartName } from './body-parts'
import type { Skeleton } from './rig'

/** The five hand cells, as painted into every body sheet. */
export const HAND_CELL_NAMES = ['gripN', 'gripF', 'relaxN', 'relaxF', 'wrapF'] as const
export type HandCellName = (typeof HAND_CELL_NAMES)[number]

export const isHandCell = (part: BodyPartName): part is HandCellName =>
  (HAND_CELL_NAMES as readonly string[]).includes(part)

export type HandPainter = (ctx: CanvasRenderingContext2D, part: HandCellName) => void

/**
 * A painter closure over one pose: draws `part`'s cell at its hand joint.
 * The caller owns the transform stack; each cell saves/restores.
 */
export function handCellPainter(
  art: BodyArt,
  pose: Skeleton,
  bulk: number,
): HandPainter {
  return (ctx, part) => {
    const cell = art.parts[part]
    if (!cell) return
    const near = part.endsWith('N')
    const hand = part === 'wrapF' ? pose.handF : near ? pose.handN : pose.handF
    const elbow = near ? pose.elbowN : pose.elbowF
    const ang = part === 'wrapF' ? pose.weaponRot : Math.atan2(hand.y - elbow.y, hand.x - elbow.x)
    ctx.save()
    ctx.translate(hand.x, hand.y)
    ctx.rotate(ang)
    // Lateral bulk only: hands do not foreshorten with the arm.
    ctx.scale(bulk, bulk)
    const d = art.density > 0 ? art.density : 1
    ctx.drawImage(
      art.sheet,
      cell.x, cell.y, cell.w, cell.h,
      -cell.pivotX / d, -cell.pivotY / d, cell.w / d, cell.h / d,
    )
    ctx.restore()
  }
}
