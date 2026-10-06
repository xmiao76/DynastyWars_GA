import { loadImage } from '@napi-rs/canvas'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { WeaponArt } from '../../src/game/art/weapon-parts'

/**
 * Shared loader for the review harnesses (BODY-17): the SHIPPING head +
 * body packs of every fighter, so review sheets render exactly what the
 * game renders.
 */
export const CAST = {
  heroes: ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan'],
  mooks: ['soldier', 'spearman', 'archer'],
  bosses: ['xiahoudun', 'xuchu', 'lidian'],
} as const
export const ALL_FIGHTERS: string[] = [...CAST.heroes, ...CAST.mooks, ...CAST.bosses]

function dirs(id: string): { face: string; body: string } {
  if ((CAST.heroes as readonly string[]).includes(id)) return { face: 'hero-faces', body: 'hero-bodies' }
  if ((CAST.mooks as readonly string[]).includes(id)) return { face: 'mook-faces', body: 'mook-bodies' }
  return { face: 'boss-faces', body: 'boss-bodies' }
}

interface FaceMeta {
  revision: string
  skin: string
  cell: { width: number; height: number }
  bounds: { x: number; y: number; width: number; height: number }
}
interface BodyMeta {
  revision: string
  skin: string
  density: number
  parts: BodyArt['parts']
}

export async function loadCastArt(ids: readonly string[] = ALL_FIGHTERS): Promise<ArtResources> {
  const resources: ArtResources = { heroes: {}, bodies: {} }
  // BODY-21: the shared painted weapon pack, so review sheets render
  // exactly what the game renders.
  const wm = (await import('../../src/game/assets/weapons/prepared.json')).default as Record<string, {
    revision: string; density: number; parts: WeaponArt['parts']
  }>
  const w = wm.weapons
  if (w) {
    const sheet = (await loadImage('src/game/assets/weapons/weapons-sheet.png')) as unknown as CanvasImageSource
    resources.weapons = { revision: w.revision, sheet, density: w.density, parts: w.parts }
  }
  for (const id of ids) {
    const d = dirs(id)
    const fm = (await import(`../../src/game/assets/${d.face}/prepared.json`)).default as Record<string, FaceMeta>
    const f = fm[id]
    if (f) {
      const image = async (part: string): Promise<CanvasImageSource> =>
        (await loadImage(`src/game/assets/${d.face}/${id}-${part}.png`)) as unknown as CanvasImageSource
      ;(resources.heroes as Record<string, HeroArt>)[id] = {
        id, revision: f.revision, portrait: await image('portrait'), head: await image('head'),
        front: await image('front'), rear: await image('rear'), cell: f.cell, bounds: f.bounds,
        skin: parseInt(f.skin.slice(1), 16),
      }
    }
    const bm = (await import(`../../src/game/assets/${d.body}/prepared.json`)).default as Record<string, BodyMeta>
    const b = bm[id]
    if (b) {
      const sheet = (await loadImage(`src/game/assets/${d.body}/${id}-sheet.png`)) as unknown as CanvasImageSource
      ;(resources.bodies as Record<string, BodyArt>)[id] = {
        id, revision: b.revision, sheet, density: b.density, parts: b.parts, skin: parseInt(b.skin.slice(1), 16),
      }
    }
  }
  return resources
}
