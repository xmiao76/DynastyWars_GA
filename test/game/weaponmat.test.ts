import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { css, materials, shade } from '../../src/game/art/palette'
import { clothMat, metalMat, steelMat, woodMat } from '../../src/game/art/weapons'

/**
 * BODY-10 material gates: the painted overlays must turn flat fills into
 * multi-tone surfaces (wood grain, steel bevel shine, metal ring light,
 * cloth folds). Geometry is deliberately NOT re-measured here - the
 * ART-14/15 reach and silhouette tests already pin the paths and run
 * unchanged, which is the proof that only materials moved.
 */

function renderWith(paint: (c: CanvasRenderingContext2D) => void): number[] {
  const canvas = createCanvas(120, 40)
  const ctx = canvas.getContext('2d')
  paint(ctx as unknown as CanvasRenderingContext2D)
  const data = ctx.getImageData(0, 0, 120, 40).data
  const lum: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 128) continue
    lum.push((data[i] ?? 0) * 0.299 + (data[i + 1] ?? 0) * 0.587 + (data[i + 2] ?? 0) * 0.114)
  }
  return lum
}

function spread(lum: number[]): number {
  return Math.max(...lum) - Math.min(...lum)
}

describe('BODY-10 painted weapon materials', () => {
  const m = materials(0x8b3a2a, 0x5a2a1a, 0x6a5a4a, 0x3a2a18)

  it('wood grain breaks the flat haft into lit and shadowed tones', () => {
    const mat = woodMat(0, 120, 8)
    const lum = renderWith((c) => {
      // The mat paints in the weapon's frame: haft band at y -haft..haft.
      c.translate(0, 20)
      c.fillStyle = m.haft
      c.fillRect(0, -8, 120, 16)
      c.save()
      c.beginPath()
      c.rect(0, -8, 120, 16)
      c.clip()
      mat(c)
      c.restore()
    })
    expect(spread(lum), 'haft stays flat').toBeGreaterThanOrEqual(25)
  })

  it('steel bevel adds a shine streak above the flat steel luminance', () => {
    const flat = css(shade(0xc8d0dc, 0))
    const mat = steelMat(50)
    const lum = renderWith((c) => {
      c.fillStyle = flat
      c.fillRect(0, 0, 120, 40)
      c.save()
      c.beginPath()
      c.rect(0, 0, 120, 40)
      c.clip()
      mat(c)
      c.restore()
    })
    // Flat steel tops out at lum 208; the bevel shine reaches ~223.
    const shine = lum.filter((l) => l >= 220).length
    expect(shine, 'no steel shine streak').toBeGreaterThanOrEqual(8)
    expect(spread(lum), 'steel stays flat').toBeGreaterThanOrEqual(20)
  })

  it('metal fittings carry a ring light and a shadow side', () => {
    const mat = metalMat()
    const lum = renderWith((c) => {
      c.translate(60, 20)
      c.fillStyle = m.trim
      c.fillRect(-20, -6, 40, 12)
      c.save()
      c.beginPath()
      c.rect(-20, -6, 40, 12)
      c.clip()
      mat(c)
      c.restore()
    })
    expect(spread(lum), 'fittings stay flat').toBeGreaterThanOrEqual(25)
  })

  it('the tassel reads as gathered cloth, not a red capsule', () => {
    const mat = clothMat()
    const lum = renderWith((c) => {
      c.translate(60, 8)
      c.fillStyle = m.tassel
      c.fillRect(-20, -6, 40, 30)
      c.save()
      c.beginPath()
      c.rect(-20, -6, 40, 30)
      c.clip()
      mat(c)
      c.restore()
    })
    expect(spread(lum), 'tassel stays flat').toBeGreaterThanOrEqual(20)
    const mid = lum.filter((l) => l > 60 && l < 130).length
    expect(mid, 'no fold tones').toBeGreaterThanOrEqual(30)
  })
})
