import type Phaser from 'phaser'
import type { ArtResources, HeroArt } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import heroPrepared from '../assets/hero-faces/prepared.json'
import bossPrepared from '../assets/boss-faces/prepared.json'
import gyPortrait from '../assets/hero-faces/guanyu-portrait.png'
import gyHead from '../assets/hero-faces/guanyu-head.png'
import gyFront from '../assets/hero-faces/guanyu-front.png'
import gyRear from '../assets/hero-faces/guanyu-rear.png'
import zyPortrait from '../assets/hero-faces/zhaoyun-portrait.png'
import zyHead from '../assets/hero-faces/zhaoyun-head.png'
import zyFront from '../assets/hero-faces/zhaoyun-front.png'
import zyRear from '../assets/hero-faces/zhaoyun-rear.png'
import zfPortrait from '../assets/hero-faces/zhangfei-portrait.png'
import zfHead from '../assets/hero-faces/zhangfei-head.png'
import zfFront from '../assets/hero-faces/zhangfei-front.png'
import zfRear from '../assets/hero-faces/zhangfei-rear.png'
import hzPortrait from '../assets/hero-faces/huangzhong-portrait.png'
import hzHead from '../assets/hero-faces/huangzhong-head.png'
import hzFront from '../assets/hero-faces/huangzhong-front.png'
import hzRear from '../assets/hero-faces/huangzhong-rear.png'
import wyPortrait from '../assets/hero-faces/weiyan-portrait.png'
import wyHead from '../assets/hero-faces/weiyan-head.png'
import wyFront from '../assets/hero-faces/weiyan-front.png'
import wyRear from '../assets/hero-faces/weiyan-rear.png'
import lbPortrait from '../assets/boss-faces/lubu-portrait.png'
import lbHead from '../assets/boss-faces/lubu-head.png'
import lbFront from '../assets/boss-faces/lubu-front.png'
import lbRear from '../assets/boss-faces/lubu-rear.png'
import ccPortrait from '../assets/boss-faces/caocao-portrait.png'
import ccHead from '../assets/boss-faces/caocao-head.png'
import ccFront from '../assets/boss-faces/caocao-front.png'
import ccRear from '../assets/boss-faces/caocao-rear.png'
import xhPortrait from '../assets/boss-faces/xiahoudun-portrait.png'
import xhHead from '../assets/boss-faces/xiahoudun-head.png'
import xhFront from '../assets/boss-faces/xiahoudun-front.png'
import xhRear from '../assets/boss-faces/xiahoudun-rear.png'
import xcPortrait from '../assets/boss-faces/xuchu-portrait.png'
import xcHead from '../assets/boss-faces/xuchu-head.png'
import xcFront from '../assets/boss-faces/xuchu-front.png'
import xcRear from '../assets/boss-faces/xuchu-rear.png'
import zlPortrait from '../assets/boss-faces/zhangliao-portrait.png'
import zlHead from '../assets/boss-faces/zhangliao-head.png'
import zlFront from '../assets/boss-faces/zhangliao-front.png'
import zlRear from '../assets/boss-faces/zhangliao-rear.png'
import crPortrait from '../assets/boss-faces/caoren-portrait.png'
import crHead from '../assets/boss-faces/caoren-head.png'
import crFront from '../assets/boss-faces/caoren-front.png'
import crRear from '../assets/boss-faces/caoren-rear.png'
import xgPortrait from '../assets/boss-faces/xuhuang-portrait.png'
import xgHead from '../assets/boss-faces/xuhuang-head.png'
import xgFront from '../assets/boss-faces/xuhuang-front.png'
import xgRear from '../assets/boss-faces/xuhuang-rear.png'
import zhPortrait from '../assets/boss-faces/zhanghe-portrait.png'
import zhHead from '../assets/boss-faces/zhanghe-head.png'
import zhFront from '../assets/boss-faces/zhanghe-front.png'
import zhRear from '../assets/boss-faces/zhanghe-rear.png'
import ldPortrait from '../assets/boss-faces/lidian-portrait.png'
import ldHead from '../assets/boss-faces/lidian-head.png'
import ldFront from '../assets/boss-faces/lidian-front.png'
import ldRear from '../assets/boss-faces/lidian-rear.png'

/** These URL imports are content-hashed by Vite, never a legacy network manifest.
 * Heroes (ART-18) + bosses (BODY-6) share the pipeline; boss ids are ordinary
 * VECTOR_ART kinds, so the same publish path lights up their heads. */
export const HERO_ART_CATALOG = {
  guanyu: { portrait: gyPortrait, head: gyHead, front: gyFront, rear: gyRear },
  zhaoyun: { portrait: zyPortrait, head: zyHead, front: zyFront, rear: zyRear },
  zhangfei: { portrait: zfPortrait, head: zfHead, front: zfFront, rear: zfRear },
  huangzhong: { portrait: hzPortrait, head: hzHead, front: hzFront, rear: hzRear },
  weiyan: { portrait: wyPortrait, head: wyHead, front: wyFront, rear: wyRear },
  lidian: { portrait: ldPortrait, head: ldHead, front: ldFront, rear: ldRear },
  xiahoudun: { portrait: xhPortrait, head: xhHead, front: xhFront, rear: xhRear },
  xuchu: { portrait: xcPortrait, head: xcHead, front: xcFront, rear: xcRear },
  caoren: { portrait: crPortrait, head: crHead, front: crFront, rear: crRear },
  zhangliao: { portrait: zlPortrait, head: zlHead, front: zlFront, rear: zlRear },
  xuhuang: { portrait: xgPortrait, head: xgHead, front: xgFront, rear: xgRear },
  zhanghe: { portrait: zhPortrait, head: zhHead, front: zhFront, rear: zhRear },
  caocao: { portrait: ccPortrait, head: ccHead, front: ccFront, rear: ccRear },
  lubu: { portrait: lbPortrait, head: lbHead, front: lbFront, rear: lbRear },
} as const

/** Merged preparation records for every catalogued fighter. */
type PreparedEntry = (typeof heroPrepared)[keyof typeof heroPrepared]
const preparedAll: Record<string, PreparedEntry> = {
  ...(heroPrepared as unknown as Record<string, PreparedEntry>),
  ...(bossPrepared as unknown as Record<string, PreparedEntry>),
}
const PARTS = ['portrait', 'head', 'front', 'rear'] as const
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

/** Partial load never produces half-painted characters. Resources are only
 * published when every image has decoded at its expected dimensions AND its
 * content signature matches the committed preparation record. */
export function publishHeroArt(scene: Phaser.Scene): void {
  const heroes: Record<string, HeroArt> = {}
  for (const id of Object.keys(HERO_ART_CATALOG) as Array<keyof typeof HERO_ART_CATALOG>) {
    const meta = preparedAll[id]
    if (!meta) continue
    const images: Partial<Record<typeof PARTS[number], CanvasImageSource>> = {}
    for (const part of PARTS) {
      const key = keyFor(id, part)
      if (!scene.textures.exists(key)) continue
      const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
      const expected = part === 'portrait' ? [432, 480] : [meta.cell.width * 3, meta.cell.height]
      if (src.width !== expected[0] || src.height !== expected[1]) continue
      const sig = decodedSignature(src)
      if (sig && signatureMatches(sig, meta.signatures[part])) images[part] = src
    }
    if (images.portrait && images.head && images.front && images.rear) {
      heroes[id] = { id, revision: meta.revision, portrait: images.portrait, head: images.head,
        front: images.front, rear: images.rear, cell: meta.cell, bounds: meta.bounds,
        skin: parseInt(meta.skin.slice(1), 16) }
    }
  }
  const prev = scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined
  scene.registry.set(ART_RESOURCE_KEY, { heroes, bodies: prev?.bodies, horse: prev?.horse } satisfies ArtResources)
}

export function heroArtResources(scene: Phaser.Scene): ArtResources | undefined {
  return scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined
}
