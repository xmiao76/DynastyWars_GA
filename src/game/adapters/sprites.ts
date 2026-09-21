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
import { RENDER_SCALE } from '../render'

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
 * The second hit of the hero combo (`*.jab2`) uses the alternate strike pose,
 * so jab1 and jab2 read as different swings. Specials strike with their own
 * pose - the move that costs health keeps the distinct look it was given for
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
        return entity.attackId !== null && entity.attackId.endsWith('.jab2') ? 'attack2' : 'attack'
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
  if (entry?.type === 'horse') return entry.plan.coat
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
    canvas.width = PORTRAIT_TEXTURE.width
    canvas.height = PORTRAIT_TEXTURE.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    if (!drawKindPortrait(ctx, kind, PORTRAIT_SCALE)) continue
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
  if (!drawKindPose(ctx, kind, pose as PoseName, RENDER_SCALE)) return
  scene.textures.addCanvas(key, canvas)
}
