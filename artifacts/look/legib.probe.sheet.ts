import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { CHARACTER_ORDER } from '../../src/core/characters'
import { artBoxFor, drawKindPose, isVectorProp, vectorKinds } from '../../src/game/art/registry'
import type { PoseName } from '../../src/game/art/poses'
import { POSES } from '../../src/game/adapters/sprites'
import { assessSprite, type SpriteImage } from '../../vision/sprite-metrics'
import { CHARACTER_SPRITE_THRESHOLDS } from '../../vision/thresholds'

function raster(kind: string, pose: PoseName): SpriteImage {
  const box = artBoxFor(kind, pose)
  if (!box) throw new Error(kind)
  const c = createCanvas(box.width * 2, box.height * 2)
  const ctx = c.getContext('2d')
  drawKindPose(ctx as unknown as CanvasRenderingContext2D, kind, pose, 2)
  return { width: c.width, height: c.height, data: new Uint8Array(ctx.getImageData(0, 0, c.width, c.height).data) }
}

it('legibility + silhouette probe', () => {
  for (const kind of vectorKinds().filter((k) => !isVectorProp(k))) {
    for (const pose of POSES) {
      const r = assessSprite(raster(kind, pose as PoseName), `${kind}:${pose}`, CHARACTER_SPRITE_THRESHOLDS)
      if (!r.pass) console.log('LEGFAIL', r.label, r.failures.join('; ')); if (pose === 'down') console.log('DOWN', kind, r.appendageRatio)
    }
  }
  const m = new Map(CHARACTER_ORDER.map((k) => [k, raster(k, 'idle')]))
  for (let i = 0; i < CHARACTER_ORDER.length; i += 1) {
    for (let j = i + 1; j < CHARACTER_ORDER.length; j += 1) {
      const a = m.get(CHARACTER_ORDER[i] as string) as SpriteImage
      const b = m.get(CHARACTER_ORDER[j] as string) as SpriteImage
      let d = 0
      let t = 0
      for (let px = 0; px < a.width * a.height; px += 1) {
        const x = (a.data[px * 4 + 3] ?? 0) >= 128
        const y = (b.data[px * 4 + 3] ?? 0) >= 128
        if (!x && !y) continue
        t += 1
        if (x !== y) d += 1
      }
      console.log('SIL', CHARACTER_ORDER[i], CHARACTER_ORDER[j], (d / t).toFixed(3))
    }
  }
})

