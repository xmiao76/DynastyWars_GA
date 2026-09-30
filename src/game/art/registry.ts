import { HORSE_H, HORSE_W, HORSE_PLAN, drawHorse, type HorsePlan } from './beasts'
import { drawFigure } from './draw'
import type { ArtResources, HeroArt } from './hero-resources'
import type { BodyArt } from './body-parts'
import type { WeaponArt } from './weapon-parts'
import { horseFrameFor, paintHorseFrame } from './horse-frames'
import { paintWholeFrame } from './whole-frames'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from './figures'
import { POSE_TABLE, type PoseName } from './poses'
import { drawPortraitFigure } from './portrait'
import { PROPS, drawProp, type PropPlan } from './props'
import { BODY_X, FIG_H, FIG_W, applyBuild, type Skeleton } from './rig'

/**
 * Every kind the game draws, and how.
 *
 * Three art types rather than one, because a quadruped and a crate are not
 * badly-posed people: forcing them through the humanoid rig would give a
 * structure that describes none of the three well. What they DO share is the
 * cel pipeline in `draw.ts`, so a crate is lit from the same direction as the
 * fighter standing next to it - which is most of what makes a cast look like
 * one cast rather than three sets of assets.
 */

export type ArtEntry =
  | { type: 'figure'; plan: FigurePlan }
  | { type: 'horse'; plan: HorsePlan }
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
 * Headroom for the horse's ears and pricked mane, and a small pad on every
 * side of a prop. Both were found by the clipping check rather than reasoned
 * about: the ear, the drumstick's bone, the sword's pommel and the arrow's
 * fletching were each sitting on their own border.
 */
const HORSE_HEADROOM = 8
const PROP_PAD = 4

const HORSE_BOX: ArtBox = {
  width: HORSE_W,
  height: HORSE_H + HORSE_HEADROOM,
  standH: HORSE_H,
}

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
  horse: { type: 'horse', plan: HORSE_PLAN },
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
  return entry.type === 'horse' ? HORSE_BOX : figureBoxFor(pose)
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

/**
 * A head-and-shoulders portrait box, for the HUD plate and the select screen.
 *
 * Drawn from the same figure as the fighter rather than as separate art, so a
 * portrait can never disagree with the character it is labelling - which is
 * exactly what the old select screen did, showing flat palette rectangles next
 * to the names of five distinct warriors.
 */
export const PORTRAIT_BOX = { width: 36, height: 40 } as const

/**
 * The portrait's own render scale, and the reason it is not RENDER_SCALE.
 *
 * A portrait was the in-play figure magnified - the same drawing at a bigger
 * scale - and at RENDER_SCALE 2 that meant a 72x80 texture whose whole face was
 * about 28x24 PIXELS. Raising the zoom did not help and could not: zoom
 * magnifies, it does not add resolution, so the face simply got bigger and
 * softer. Four marks is all that fits in 28x24, which is why the portraits read
 * as blobs with dots however carefully the marks were placed.
 *
 * 6 gives a 216x240 texture and a face of roughly 84x72 pixels - nine times the
 * area - which is a budget an eyelid, a nostril, a lip line and an ear can
 * actually be drawn into. `drawPortraitDetail` draws exactly those, and only
 * here: the in-play sprites keep the coarse face, so nothing about the fighters
 * or the art gates moves.
 */
export const PORTRAIT_SCALE = 6

/** The pixel size a portrait texture must be allocated at. */
export const PORTRAIT_TEXTURE = {
  width: PORTRAIT_BOX.width * PORTRAIT_SCALE,
  height: PORTRAIT_BOX.height * PORTRAIT_SCALE,
} as const

/**
 * How much of the figure fills the portrait, and where its head sits.
 *
 * The first framing zoomed 1.45x and cropped to the face, which cut the top off
 * every helmet and turned the roster into a row of extreme close-ups - readable
 * as faces, useless as a way of telling five armoured warriors apart. Head AND
 * shoulders is what carries the headgear, the pauldron and the collar, which is
 * most of what distinguishes them.
 *
 * Raised from 1.02 to 1.3 when the faces were given real structure. At 1.02 the
 * portrait was almost exactly the play-scale head, so a face with a brow, two
 * eyes, a nose and a mouth had no more pixels here than it did in a fight - and
 * the portrait is where anyone actually looks at a character.
 *
 * 1.33 is the CEILING, not a preference: the tallest head-plus-headgear in the
 * cast is Zhang Fei's at 2.44 headR = 26.4 figure units, and 40 box units less
 * a top margin and the neck leaves room for no more. Above this a headgear bowl
 * starts being cropped, which is the mistake the earlier 1.45 made - that was
 * framing on the FACE and cutting helmets off, and it turned the roster into a
 * row of close-ups that could not be told apart. Cropping a plume CREST is a
 * different thing and is deliberate; the bowl is what carries the identity.
 *
 * `PORTRAIT_HEAD_Y` is where the head CENTRE lands, which in the portrait
 * layout is also the eye line. 21 clears the tallest bowl - including the
 * overshoot a smoothed crown curve adds beyond its own control points - and
 * still leaves a couple of units of neck below the chin.
 */
export const PORTRAIT_ZOOM = 1.33
export const PORTRAIT_HEAD_Y = 21

export function drawKindPortrait(
  ctx: CanvasRenderingContext2D,
  kind: string,
  scale: number,
  detail = true,
  resources?: ArtResources,
): boolean {
  const entry = VECTOR_ART[kind]
  if (entry?.type !== 'figure') return false
  const painted = resources?.heroes[kind]
  if (painted) {
    ctx.drawImage(painted.portrait, 0, 0, PORTRAIT_BOX.width * scale, PORTRAIT_BOX.height * scale)
    return true
  }
  ctx.save()
  ctx.scale(scale, scale)
  // Frame on the head: scale up about the portrait's centre, then slide the
  // figure so its head lands where the box wants it.
  ctx.beginPath()
  ctx.rect(0, 0, PORTRAIT_BOX.width, PORTRAIT_BOX.height)
  ctx.clip()
  ctx.translate(PORTRAIT_BOX.width / 2, PORTRAIT_HEAD_Y)
  ctx.scale(PORTRAIT_ZOOM, PORTRAIT_ZOOM)
  // Anchor on the head the figure is actually DRAWN with, not the raw pose.
  // `applyBuild` scales joint positions about GROUND, so a taller hero's head
  // sits higher: 12.69 for Guan Yu against 18.08 for Zhang Fei. Anchoring on
  // the raw 15 therefore slid each portrait by its own build - a 42px spread in
  // a 240px frame, with four of the five clipped at the top edge.
  const posed = applyBuild(POSE_TABLE.idle, entry.plan.build)
  ctx.translate(-BODY_X, -posed.head.y)
  drawPortraitFigure(ctx, entry.plan, POSE_TABLE.idle, detail)
  ctx.restore()
  return true
}

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
    case 'horse': {
      ctx.translate(0, HORSE_HEADROOM)
      const horse = resources?.horse
      const frame = horseFrameFor(pose)
      if (horse && paintHorseFrame(ctx, horse, frame, HORSE_W, HORSE_H)) break
      drawHorse(ctx, entry.plan, pose)
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
