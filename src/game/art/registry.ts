import { drawFigure } from './draw'
import type { ArtResources, HeroArt } from './hero-resources'
import type { BodyArt } from './body-parts'
import type { WeaponArt } from './weapon-parts'
import { paintWholeFrame } from './whole-frames'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from './figures'
import { POSE_TABLE, type PoseName } from './poses'
import { PROPS, drawProp, type PropPlan } from './props'
import { FIG_H, FIG_W, type Skeleton } from './rig'

/**
 * Every kind the game draws, and how.
 *
 * Two art types rather than one, because a crate is not
 * a badly-posed person: forcing it through the humanoid rig would give a
 * structure that describes neither well. What they DO share is the
 * cel pipeline in `draw.ts`, so a crate is lit from the same direction as the
 * fighter standing next to it - which is most of what makes a cast look like
 * one cast rather than three sets of assets.
 */

export type ArtEntry =
  | { type: 'figure'; plan: FigurePlan }
  | { type: 'prop'; plan: PropPlan }

/**
 * Horizontal room each side, PER POSE.
 *
 * MEASURED: every pose drawn into a deliberately oversized box across all
 * eighteen characters, then the drawn bounds taken relative to the body centre.
 * Units reached beyond the 96-wide pose space:
 *
 *   idle 0   walk0 0   walk1 0   hurt 8   jump 18   down 27   special 59   attack 59
 *   windup 8   attack2 41   recover 18
 *
 * Re-measured at ART-14 (the silhouette pass): attack, attack2 and special
 * grew 4/2/5 because Zhang Fei's serpent now swings +-10 and reaches fore+22,
 * which makes him the driver of all three (attack 59, special 59). The tip was
 * first drawn to fore+25, which reached 26 units above the pose space in walk0
 * against a 24-unit HEADROOM and clipped - so the tip came back to fore+22 and
 * HEADROOM stayed shared and untouched. windup/recover/jump/hurt each came in
 * 1-2 UNDER the ART-12 numbers, because the new crescent's horn is shallower
 * than the old -20.
 *
 * ENH-5 adds three strikes, measured the same way (oversized box, all figure
 * kinds, max beyond the pose space): thrust 64.5, chop 29.5, sweep 61.0, all
 * driven by Zhang Fei's pike. The table holds the ceiling of each (65/30/61),
 * so the uniform +5 pad sits on top of the true reach. The thrust
 * out-reaches the level attack it extends (61.0) by a hand; the chop's steep
 * diagonal keeps it under the shared HEADROOM while still clearing the
 * recover it must beat.
  *
  * A single margin sized for the worst of those - a pike thrust - was being paid
  * eight times per character, and 89% of every texture came out transparent.
  * Sizing per pose takes one character's eight boxes from 1696 units of width to
  * 1192.
 *
 * The margin stays SYMMETRIC even though almost every pose reaches only one
 * way. Sprites anchor bottom-CENTRE, so an asymmetric box would move the
 * character sideways; symmetric means the figure's centre is the box's centre
 * in every pose, which is the invariant the centring check in `artquality` is
 * written against. A tighter asymmetric box would need a per-pose anchor
 * offset, and a wrong offset puts a fighter in the wrong place - a worse
 * failure than the memory it saves.
 *
 * The pad absorbs rounding and small future tweaks. The clipping check is what
 * catches a margin set too small, and it has caught exactly that four times.
 */
const POSE_MARGIN_PAD = 5
const POSE_REACH: Record<PoseName, number> = {
  idle: 0,
  walk0: 0,
  walk1: 0,
  attack: 59,
  attack2: 41,
  thrust: 65,
  chop: 30,
  sweep: 61,
  windup: 8,
  recover: 18,
  jump: 18,
  down: 27,
  hurt: 8,
  special: 59,
}
function marginFor(pose: PoseName): number {
  return (POSE_REACH[pose] ?? 57) + POSE_MARGIN_PAD
}

/**
 * Vertical room above the figure, for crests and raised arms. Uniform across
 * poses, unlike the width: `GameScene.fitSprite` derives ONE scale from the
 * idle frame's HEIGHT and applies it to every pose, so the heights have to
 * agree. ART-15 measured the raised guandao reaching 24 units above the
 * body; 27 leaves room for its antialiased outline without changing standH.
 */
const HEADROOM = 27

export interface ArtBox {
  width: number
  height: number
  /** The subject's own height inside the box, excluding margin. */
  standH: number
}

function figureBoxFor(pose: PoseName): ArtBox {
  return { width: FIG_W + marginFor(pose) * 2, height: FIG_H + HEADROOM, standH: FIG_H }
}

/**
 * BODY-24: the box and margin for an interpolated frame between two keys.
 * Heights are uniform across poses; the width takes the wider of the two
 * reach margins so a blend frame can never clip either key's weapon.
 */
export function blendBoxFor(kind: string, from: PoseName, to: PoseName): ArtBox | undefined {
  const entry = VECTOR_ART[kind]
  if (!entry || entry.type !== 'figure') return undefined
  return { width: FIG_W + blendMarginFor(from, to) * 2, height: FIG_H + HEADROOM, standH: FIG_H }
}

export function blendMarginFor(from: PoseName, to: PoseName): number {
  return Math.max(marginFor(from), marginFor(to))
}

/**
 * A small pad on every side of a prop. Found by the clipping check rather
 * than reasoned about: the drumstick's bone, the sword's pommel and the
 * arrow's fletching were each sitting on their own border.
 */
const PROP_PAD = 4

/** Kept for callers that only ever deal with humanoids. */
export const FIGURE_BOX = figureBoxFor('idle')
export const FIGURE_STAND_H = FIG_H

export const VECTOR_ART: Record<string, ArtEntry> = {
  ...Object.fromEntries(
    Object.entries({ ...HERO_FIGURES, ...ENEMY_FIGURES }).map(([kind, plan]): [string, ArtEntry] => [
      kind,
      { type: 'figure', plan },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(PROPS).map(([kind, plan]): [string, ArtEntry] => [kind, { type: 'prop', plan }]),
  ),
}

export function vectorArtFor(kind: string): ArtEntry | undefined {
  return VECTOR_ART[kind]
}

/** Kinds the art engine owns. Derived, so nothing has to be kept in step. */
export function vectorKinds(): string[] {
  return Object.keys(VECTOR_ART)
}

/** Kinds drawn as a single static object rather than as a posed character. */
export function isVectorProp(kind: string): boolean {
  return VECTOR_ART[kind]?.type === 'prop'
}

export function artBoxFor(kind: string, pose: PoseName = 'idle'): ArtBox | undefined {
  const entry = VECTOR_ART[kind]
  if (!entry) return undefined
  if (entry.type === 'prop') {
    return {
      width: entry.plan.width + PROP_PAD * 2,
      height: entry.plan.height + PROP_PAD * 2,
      // standH is the CONTENT height, so the pad is not scaled into the thing.
      standH: entry.plan.height,
    }
  }
  return figureBoxFor(pose)
}

/**
 * How tall to draw the whole BOX so that the thing inside it lands at its
 * intended on-screen height.
 *
 * Without this, a figure box's margins would be scaled to the fighter's height
 * and the fighter itself would come out short - the box is deliberately more
 * than twice as wide as the figure in it.
 */
export function artDisplayHeight(kind: string, defaultOnScreenH: number): number | undefined {
  const box = artBoxFor(kind)
  const entry = VECTOR_ART[kind]
  if (!box || !entry) return undefined
  const onScreenH = entry.type === 'prop' ? entry.plan.onScreenH : defaultOnScreenH
  return (onScreenH * box.height) / box.standH
}

export { PORTRAIT_BOX, PORTRAIT_SCALE, PORTRAIT_TEXTURE, drawKindPortrait } from './painted-portraits'

/**
 * BODY-24: draw a PREPARED (possibly interpolated) skeleton for a kind.
 * Same box convention as drawKindPose, but the caller owns the skeleton -
 * the blend frames are `lerpSkeleton(a, b, t)` plus `torsoLean`. `pose`
 * only selects the painted head's expression and the reach margin.
 */
export function drawKindSkeleton(
  ctx: CanvasRenderingContext2D,
  kind: string,
  sk: Skeleton,
  pose: PoseName,
  scale: number,
  resources?: ArtResources,
  margin?: number,
): boolean {
  const entry = VECTOR_ART[kind]
  if (!entry || entry.type !== 'figure') return false
  ctx.save()
  ctx.scale(scale, scale)
  ctx.translate(margin ?? marginFor(pose), HEADROOM)
  const head = resources?.heroes[kind]
  const body = resources?.bodies?.[kind]
  const weaponArt = resources?.weapons
  if (head || body || weaponArt) {
    const painted: { art?: HeroArt; poseName: PoseName; body?: BodyArt; weapon?: WeaponArt } = { poseName: pose }
    if (head) painted.art = head
    if (body) painted.body = body
    if (weaponArt) painted.weapon = weaponArt
    drawFigure(ctx, entry.plan, sk, painted)
  } else {
    drawFigure(ctx, entry.plan, sk)
  }
  ctx.restore()
  return true
}

/** Draw one kind's pose into a context sized `artBoxFor(kind) * scale`. */
export function drawKindPose(
  ctx: CanvasRenderingContext2D,
  kind: string,
  pose: PoseName,
  scale: number,
  resources?: ArtResources,
): boolean {
  const entry = VECTOR_ART[kind]
  if (!entry) return false
  ctx.save()
  ctx.scale(scale, scale)
  let drawn = true
  switch (entry.type) {
    case 'figure': {
      // Whole-frame pilot: a painted whole pose fills the entire art box.
      const whole = resources?.frames?.[kind]
      if (whole) {
        const box = figureBoxFor(pose)
        if (paintWholeFrame(ctx, whole, pose, box.width, box.height)) break
      }
      ctx.translate(marginFor(pose), HEADROOM)
      const head = resources?.heroes[kind]
      const body = resources?.bodies?.[kind]
      const weaponArt = resources?.weapons
      if (head || body || weaponArt) {
        const painted: { art?: HeroArt; poseName: PoseName; body?: BodyArt; weapon?: WeaponArt } = { poseName: pose }
        if (head) painted.art = head
        if (body) painted.body = body
        if (weaponArt) painted.weapon = weaponArt
        drawFigure(ctx, entry.plan, POSE_TABLE[pose], painted)
      } else {
        drawFigure(ctx, entry.plan, POSE_TABLE[pose])
      }
      break
    }
    case 'prop':
      ctx.translate(PROP_PAD, PROP_PAD)
      drawn = drawProp(ctx, kind)
      break
  }
  ctx.restore()
  return drawn
}
