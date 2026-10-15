import type Phaser from 'phaser'
import { PORTRAIT_SCALE, PORTRAIT_TEXTURE, drawKindPortrait } from '../art/painted-portraits'
import { artBoxFor, drawKindProp, isVectorProp } from '../art/registry'
import { RENDER_SCALE } from '../render'
import { heroArtResources } from './hero-art'

/** Shared prop and portrait keys only; no humanoid texture generation. */
export function textureKeyFor(kind: string): string { return `entity:${kind}` }
export function isPropKind(kind: string): boolean { return isVectorProp(kind) }
export function ensurePropTextures(scene: Phaser.Scene, kinds: string[]): void {
  for (const kind of kinds) {
    const key = textureKeyFor(kind), box = artBoxFor(kind)
    if (!box || scene.textures.exists(key)) continue
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(box.width * RENDER_SCALE)
    canvas.height = Math.round(box.height * RENDER_SCALE)
    const ctx = canvas.getContext('2d')
    if (ctx && drawKindProp(ctx, kind, RENDER_SCALE)) scene.textures.addCanvas(key, canvas)
  }
}
export function portraitKeyFor(kind: string): string { return `portrait:${kind}` }
export function ensurePortraitTextures(scene: Phaser.Scene, kinds: string[]): void {
  for (const kind of kinds) {
    const key = portraitKeyFor(kind)
    if (scene.textures.exists(key)) continue
    const resources = heroArtResources(scene)
    if (!resources?.portraits?.[kind]) continue
    const canvas = document.createElement('canvas')
    const scale = PORTRAIT_SCALE * 2
    canvas.width = PORTRAIT_TEXTURE.width * (scale / PORTRAIT_SCALE)
    canvas.height = PORTRAIT_TEXTURE.height * (scale / PORTRAIT_SCALE)
    const ctx = canvas.getContext('2d')
    if (ctx && drawKindPortrait(ctx, kind, scale, resources)) scene.textures.addCanvas(key, canvas)
  }
}
