import type Phaser from 'phaser'
import type { ArtResources, PortraitArt } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import heroPrepared from '../assets/hero-faces/prepared.json'
import bossPrepared from '../assets/boss-faces/prepared.json'
import mookPrepared from '../assets/mook-faces/prepared.json'
import gyPortrait from '../assets/hero-faces/guanyu-portrait.png'
import zyPortrait from '../assets/hero-faces/zhaoyun-portrait.png'
import zfPortrait from '../assets/hero-faces/zhangfei-portrait.png'
import hzPortrait from '../assets/hero-faces/huangzhong-portrait.png'
import wyPortrait from '../assets/hero-faces/weiyan-portrait.png'
import xhPortrait from '../assets/boss-faces/xiahoudun-portrait.png'
import xcPortrait from '../assets/boss-faces/xuchu-portrait.png'
import ldPortrait from '../assets/boss-faces/lidian-portrait.png'
import soPortrait from '../assets/mook-faces/soldier-portrait.png'
import spPortrait from '../assets/mook-faces/spearman-portrait.png'
import arPortrait from '../assets/mook-faces/archer-portrait.png'

/** These URL imports are content-hashed by Vite, never a legacy network manifest.
 * Heroes (ART-18) + bosses (BODY-6) + mooks (BODY-12) share the pipeline;
 * boss and mook ids are ordinary kinds, so the same publish path lights up
 * their heads. */
export const HERO_ART_CATALOG = {
  guanyu: { portrait: gyPortrait },
  zhaoyun: { portrait: zyPortrait },
  zhangfei: { portrait: zfPortrait },
  huangzhong: { portrait: hzPortrait },
  weiyan: { portrait: wyPortrait },
  lidian: { portrait: ldPortrait },
  xiahoudun: { portrait: xhPortrait },
  xuchu: { portrait: xcPortrait },
  soldier: { portrait: soPortrait },
  spearman: { portrait: spPortrait },
  archer: { portrait: arPortrait },
} as const

/** Merged preparation records for every catalogued fighter. */
type PreparedEntry = (typeof heroPrepared)[keyof typeof heroPrepared]
const preparedAll: Record<string, PreparedEntry> = {
  ...(heroPrepared as unknown as Record<string, PreparedEntry>),
  ...(bossPrepared as unknown as Record<string, PreparedEntry>),
  ...(mookPrepared as unknown as Record<string, PreparedEntry>),
}
const PARTS = ['portrait'] as const
/** Registry key for painted art packs; shared with the body-art adapter so
 * heads and bodies publish into one record without wiping each other. */
export const ART_RESOURCE_KEY = 'paintedHeroArt'
const keyFor = (id: string, part: string): string => `hero-source:${id}:${part}`

export function queueHeroArt(scene: Phaser.Scene): void {
  for (const [id, urls] of Object.entries(HERO_ART_CATALOG)) {
    for (const part of PARTS) scene.load.image(keyFor(id, part), urls[part], { responseType: 'blob', timeout: 8000 })
  }
}

/** Decode pixels once at boot to prove identity: a correctly sized but blank,
 * swapped or corrupt image is rejected here, and that hero falls back whole. */
function decodedSignature(src: CanvasImageSource & { width: number; height: number }): string | null {
  const cv = document.createElement('canvas')
  cv.width = src.width; cv.height = src.height
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(src, 0, 0)
  try {
    return imageSignature(ctx.getImageData(0, 0, cv.width, cv.height))
  } catch {
    return null
  }
}

/** Portraits publish independently of temporary rollback heads. Rig resources
 * remain atomic; all images must match their dimensions and content signature.
 * Head imports/metadata are removed jointly with the renderer and motion switch. */
export function publishHeroArt(scene: Phaser.Scene): void {
  const portraits: Record<string, PortraitArt> = {}
  for (const id of Object.keys(HERO_ART_CATALOG) as Array<keyof typeof HERO_ART_CATALOG>) {
    const meta = preparedAll[id]
    if (!meta) continue
    const images: Partial<Record<typeof PARTS[number], CanvasImageSource>> = {}
    for (const part of PARTS) {
      const key = keyFor(id, part)
      if (!scene.textures.exists(key)) continue
      const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
      const expected = [432, 480]
      if (src.width !== expected[0] || src.height !== expected[1]) continue
      const sig = decodedSignature(src)
      if (sig && signatureMatches(sig, meta.signatures[part])) images[part] = src
    }
    // Publish only validated shared portraits; legacy rig layers are not loaded.
    if (images.portrait) portraits[id] = { id, revision: meta.revision, portrait: images.portrait }
  }
  const prev = scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, portraits } satisfies ArtResources)
}

export function heroArtResources(scene: Phaser.Scene): ArtResources | undefined {
  return scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined
}
