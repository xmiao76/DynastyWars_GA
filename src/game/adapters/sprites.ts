import type Phaser from 'phaser'
import { attackById, type AttackDef } from '../../core/attacks'
import type { EntityState } from '../../core/types'
import {
  PORTRAIT_SCALE,
  PORTRAIT_TEXTURE,
  artBoxFor,
  drawKindPortrait,
  drawKindPose,
  isVectorProp,
  vectorArtFor,
} from '../art/registry'
import type { PoseName } from '../art/poses'
import { POSE_TABLE } from '../art/poses'
import { blendEase, leanEnvelope, lerpSkeleton, torsoLean } from '../art/interpolate'
import { blendBoxFor, blendMarginFor, drawKindSkeleton } from '../art/registry'
import { hasWholeFrame } from '../art/whole-frames'
import { RENDER_SCALE } from '../render'
import { heroArtResources } from './hero-art'

/**
 * Texture generation from the art engine (art/registry.ts) and
 * the texture-key convention. Everything renders through canvas textures at
 * boot under `entity:<kind>:<pose>` (combatants) and `entity:<kind>` (props).
 * Nothing here changes when the art is replaced: same keys, same poses.
 */

export const POSES = [
  'idle',
  'walk0',
  'walk1',
  'attack',
  'attack2',
  'thrust',
  'chop',
  'sweep',
  'windup',
  'recover',
  'jump',
  'down',
  'hurt',
  'special',
] as const
export type Pose = (typeof POSES)[number]

export function textureKeyFor(kind: string): string {
  return `entity:${kind}`
}

export function textureKeyForPose(kind: string, pose: Pose): string {
  return `entity:${kind}:${pose}`
}

/**
 * Strike-pose selection, keyed by full attack id. Every hero's combo reads as
 * its weapon (ENH-5): three distinct poses per (jab1, jab2, finisher), and no
 * two heroes share the same ordered triple. Enemies and
 * unknown ids fall through to the standard strike pose.
 *
 *   guanyu glaive:     sweep -> attack -> chop    (wide cuts, chop finisher)
 *   zhangfei pike:     thrust -> attack2 -> sweep (thrust-first, sweep finisher)
 *   zhaoyun spear:     attack -> attack2 -> thrust (all thrust-family)
 *   huangzhong bow:    thrust -> chop -> sweep    (compact staff-work)
 *   weiyan dao:        attack -> sweep -> chop    (cuts, big chop finisher)
 */
export const STRIKE_POSE: Record<string, Pose> = {
  'gy.jab1': 'sweep',
  'gy.jab2': 'attack',
  'gy.finisher': 'chop',
  'zf.jab1': 'thrust',
  'zf.jab2': 'attack2',
  'zf.finisher': 'sweep',
  'zy.jab1': 'attack',
  'zy.jab2': 'attack2',
  'zy.finisher': 'thrust',
  'hz.jab1': 'thrust',
  'hz.jab2': 'chop',
  'hz.finisher': 'sweep',
  'wy.jab1': 'attack',
  'wy.jab2': 'sweep',
  'wy.finisher': 'chop',
}

/** Frame data for the entity's current attack, if it has one we know. */
function attackDefOf(attackId: string | null): AttackDef | undefined {
  if (attackId === null) return undefined
  try {
    return attackById(attackId)
  } catch {
    return undefined
  }
}

/**
 * Entity state -> art pose. Walk alternates legs every 10 ticks; attacks phase
 * through windup / strike / recover by `stateTick` against the attack's own
 * frame data, so every swing visibly extends AND retracts.
 *
 * Each hero combo hit maps through STRIKE_POSE to its own strike pose, so a
 * full combo shows three distinct swings. Specials strike with their own pose
 * - the move that costs health keeps the distinct look it was given for
 * exactly that reason.
  *
  * Zero-length windows need no special-casing: Huang Zhong's special has an
 * active window of 0, so it phases windup -> recover and never shows a strike,
 * which is correct for an archer loosing an arrow. A null or unknown attack id
 * falls back to the state's old single pose, which is also what renders while
 * the sim is between attacks.
 */
export function poseForEntity(entity: {
  state: EntityState
  stateTick: number
  attackId: string | null
}): Pose {
  switch (entity.state) {
    case 'walk':
      return Math.floor(entity.stateTick / 10) % 2 === 0 ? 'walk0' : 'walk1'
    case 'attack':
    case 'jumpattack':
    case 'special': {
      const fallback = entity.state === 'special' ? 'special' : 'attack'
      const def = attackDefOf(entity.attackId)
      if (!def) return fallback
      if (entity.stateTick < def.startup) return 'windup'
      if (entity.stateTick < def.startup + def.active) {
        if (entity.state === 'special') return 'special'
        if (entity.attackId !== null) return STRIKE_POSE[entity.attackId] ?? 'attack'
        return 'attack'
      }
      return 'recover'
    }
    case 'hitstun':
      return 'hurt'
    case 'jump':
      return 'jump'
    case 'knockdown':
    case 'dying':
    case 'dead':
    case 'thrown':
    case 'grabbed':
      return 'down'
    default:
      return 'idle'
  }
}

/** Props register a single pose-less texture rather than a pose per state. */
export function isPropKind(kind: string): boolean {
  return isVectorProp(kind)
}

/**
 * Body color for a kind - used by the select screen's card tint, which is the
 * one place UI chrome takes its colour from the art. Figure-engine kinds carry
 * it on their plan; pixel kinds read it out of their palette.
 */
export function paletteColorFor(kind: string): number {
  const entry = vectorArtFor(kind)
  if (entry?.type === 'figure') return entry.plan.body
  return 0x666666
}

/** Generate any missing textures for the given kinds. Idempotent. */
export function ensureEntityTextures(scene: Phaser.Scene, kinds: string[]): void {
  for (const kind of kinds) {
    if (!vectorArtFor(kind)) continue // unknown kinds simply never render a texture
    if (isVectorProp(kind)) {
      ensureVectorKey(scene, kind, textureKeyFor(kind), 'idle')
      continue
    }
    for (const pose of POSES) ensureVectorKey(scene, kind, textureKeyForPose(kind, pose), pose)
  }
}

/** Texture key for a character's head-and-shoulders portrait. */
export function portraitKeyFor(kind: string): string {
  return `portrait:${kind}`
}

/** Generate the portrait textures for the given kinds. Idempotent. */
export function ensurePortraitTextures(scene: Phaser.Scene, kinds: string[]): void {
  for (const kind of kinds) {
    const key = portraitKeyFor(kind)
    if (scene.textures.exists(key)) continue
    const canvas = document.createElement('canvas')
    const resources = heroArtResources(scene)
    const scale = resources?.heroes[kind] ? PORTRAIT_SCALE * 2 : PORTRAIT_SCALE
    canvas.width = PORTRAIT_TEXTURE.width * (scale / PORTRAIT_SCALE)
    canvas.height = PORTRAIT_TEXTURE.height * (scale / PORTRAIT_SCALE)
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    if (!drawKindPortrait(ctx, kind, scale, true, resources)) continue
    scene.textures.addCanvas(key, canvas)
  }
}

/** Rasterize one art-engine pose at device density. */
function ensureVectorKey(scene: Phaser.Scene, kind: string, key: string, pose: Pose): void {
  if (scene.textures.exists(key)) return
  const box = artBoxFor(kind, pose as PoseName)
  if (!box) return
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(box.width * RENDER_SCALE)
  canvas.height = Math.round(box.height * RENDER_SCALE)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (!drawKindPose(ctx, kind, pose as PoseName, RENDER_SCALE, heroArtResources(scene))) return
  scene.textures.addCanvas(key, canvas)
}

/**
 * BODY-24: one in-between frame between two keys, as a texture. Cached by
 * pair and step, so a transition costs at most two rasterizations for the
 * whole session. The skeleton blends with eased t and the strike lean.
 */
export function blendKeyFor(kind: string, from: Pose, to: Pose, step: 1 | 2): string {
  // The entity: prefix is a contract: e2e lookups (and any key-based
  // sprite finder) match `entity:${kind}` to locate a fighter's sprite.
  return `entity:${kind}:blend:${from}>${to}:${step}`
}

export function ensureBlendKey(
  scene: Phaser.Scene,
  kind: string,
  from: Pose,
  to: Pose,
  step: 1 | 2,
): string | undefined {
  const entry = vectorArtFor(kind)
  if (!entry || entry.type !== 'figure') return undefined
  // Whole-frame pilot: rig in-betweens of a painted whole pose would show
  // paper-doll art between two painted frames - cut straight to the key.
  if (hasWholeFrame(heroArtResources(scene)?.frames?.[kind], from as PoseName, to as PoseName)) return undefined
  const a = POSE_TABLE[from as PoseName]
  const b = POSE_TABLE[to as PoseName]
  if (!a || !b) return undefined
  const key = blendKeyFor(kind, from, to, step)
  if (scene.textures.exists(key)) return key
  const box = blendBoxFor(kind, from as PoseName, to as PoseName)
  if (!box) return undefined
  const t = blendEase(step === 1 ? 1 / 3 : 2 / 3)
  const sk = torsoLean(lerpSkeleton(a, b, t), leanEnvelope(a, b, t))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(box.width * RENDER_SCALE)
  canvas.height = Math.round(box.height * RENDER_SCALE)
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined
  const margin = blendMarginFor(from as PoseName, to as PoseName)
  if (!drawKindSkeleton(ctx, kind, sk, to as PoseName, RENDER_SCALE, heroArtResources(scene), margin)) return undefined
  scene.textures.addCanvas(key, canvas)
  return key
}
