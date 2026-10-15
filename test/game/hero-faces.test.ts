import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawKindPortrait } from '../../src/game/art/painted-portraits'
import { imageSignature, signatureMatches } from '../../src/game/art/image-signature'
import prepared from '../../src/game/assets/hero-faces/prepared.json'

describe('hero shared portraits (rig-head tests retired)', () => {
  it.each(Object.entries(prepared))('%s preserves exact portrait pixels and rejects blank/swapped identity', async (id, meta) => {
    const image = await loadImage('src/game/assets/hero-faces/' + id + '-portrait.png')
    const expected = createCanvas(432, 480), actual = createCanvas(432, 480)
    expected.getContext('2d').drawImage(image, 0, 0)
    const pixels = expected.getContext('2d').getImageData(0, 0, 432, 480)
    expect(signatureMatches(imageSignature(pixels), meta.signatures.portrait)).toBe(true)
    expect(drawKindPortrait(actual.getContext('2d') as unknown as CanvasRenderingContext2D, id, 12, { portraits: { [id]: { id, revision: meta.revision, portrait: image as unknown as CanvasImageSource } } })).toBe(true)
    expect(Buffer.from(actual.getContext('2d').getImageData(0, 0, 432, 480).data)).toEqual(Buffer.from(pixels.data))
    const blank = createCanvas(432, 480)
    expect(signatureMatches(imageSignature(blank.getContext('2d').getImageData(0, 0, 432, 480)), meta.signatures.portrait)).toBe(false)
    expect(drawKindPortrait(blank.getContext('2d') as unknown as CanvasRenderingContext2D, id, 12, { portraits: {} })).toBe(false)
  })
})
