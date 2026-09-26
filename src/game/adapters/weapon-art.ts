import type Phaser from 'phaser'
import type { WeaponArt, WeaponCell } from '../art/weapon-parts'
import type { ArtResources } from '../art/hero-resources'
import { imageSignature, signatureMatches } from '../art/image-signature'
import { ART_RESOURCE_KEY } from './hero-art'
import weaponsPrepared from '../assets/weapons/prepared.json'
import weaponsSheet from '../assets/weapons/weapons-sheet.png'

/**
 * Painted weapon art loading (BODY-21), mirroring the body chain: one
 * shared sheet for all 7 kinds + the tassel, signature-verified at boot.
 * A missing/corrupt pack drops the WHOLE pack and every fighter keeps the
 * procedural weapons (the atomic fallback is per pack here, not per kind,
 * because a half-painted armoury would read worse than a consistent one).
 */

const keyFor = (): string => 'weapon-source:weapons'

export function queueWeaponArt(scene: Phaser.Scene): void {
  scene.load.image(keyFor(), weaponsSheet, { responseType: 'blob', timeout: 8000 })
}

/** 2d-context factory, injectable so unit tests can decode with @napi-rs. */
export type CtxFactory = (w: number, h: number) => CanvasRenderingContext2D | null

const documentFactory: CtxFactory = (w, h) => {
  if (typeof document === 'undefined') return null
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return cv.getContext('2d', { willReadFrequently: true })
}

interface WeaponPreparedEntry {
  revision: string
  density: number
  sheet: { width: number; height: number }
  parts: Partial<Record<string, WeaponCell>>
  signatures: { sheet: string }
  sha256: { sheet: string }
}

/**
 * Publish the shared pack iff the sheet decoded at its expected dimensions
 * AND its content signature matches the committed preparation record.
 */
export function publishWeaponArtRecords(
  scene: Phaser.Scene,
  prepared: Record<string, WeaponPreparedEntry>,
  makeCtx: CtxFactory = documentFactory,
): WeaponArt | undefined {
  const meta = prepared.weapons
  if (!meta) return undefined
  const key = keyFor()
  if (!scene.textures.exists(key)) return undefined
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement
  if (src.width !== meta.sheet.width || src.height !== meta.sheet.height) return undefined
  const ctx = makeCtx(src.width, src.height)
  if (!ctx) return undefined
  ctx.drawImage(src, 0, 0)
  let sig: string | null
  try {
    sig = imageSignature(ctx.getImageData(0, 0, src.width, src.height))
  } catch {
    return undefined
  }
  if (!sig || !signatureMatches(sig, meta.signatures.sheet)) return undefined
  const weapons: WeaponArt = {
    revision: meta.revision,
    sheet: src,
    density: meta.density,
    parts: meta.parts,
  }
  const prev = (scene.registry.get(ART_RESOURCE_KEY) as ArtResources | undefined) ?? { heroes: {} }
  scene.registry.set(ART_RESOURCE_KEY, { ...prev, weapons } satisfies ArtResources)
  return weapons
}

export function publishWeaponArt(scene: Phaser.Scene): WeaponArt | undefined {
  return publishWeaponArtRecords(scene, weaponsPrepared as Record<string, WeaponPreparedEntry>)
}
