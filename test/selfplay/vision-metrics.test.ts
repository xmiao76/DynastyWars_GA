import { describe, expect, it } from 'vitest'
import { assessFrame, coverage, regionFill, regionLegibility, saturation, type FrameImage } from '../../vision/metrics'
import { DEFAULT_THRESHOLDS, thresholdsFor } from '../../vision/thresholds'

function makeImg(width: number, height: number, fill: 'black' | 'vivid' | 'gray' | 'flat'): FrameImage {
  const data = new Uint8Array(width * height * 4)
  const rgb: [number, number, number] =
    fill === 'black' ? [0, 0, 0] : fill === 'gray' ? [120, 120, 120] : fill === 'flat' ? [200, 120, 30] : [200, 60, 240]
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
    data[i + 3] = 255
  }
  return { width, height, data }
}

describe('visual metrics', () => {
  it('a fully black frame has zero coverage and fails every threshold', () => {
    const img = makeImg(64, 64, 'black')
    expect(coverage(img)).toBe(0)
    const r = assessFrame(img, 'game_combat', thresholdsFor('game_combat'))
    expect(r.pass).toBe(false)
    expect(r.failures.length).toBeGreaterThanOrEqual(3)
  })

  it('a vivid full frame has full coverage and high saturation', () => {
    const img = makeImg(64, 64, 'vivid')
    const r = assessFrame(img, 'game_combat', thresholdsFor('game_combat'))
    expect(r.coverage).toBe(1)
    expect(r.saturation).toBeGreaterThan(0.5)
    // A solid-color frame is still "flat" - the richness guard catches it.
    expect(r.failures.some((f) => f.startsWith('colorRichness'))).toBe(true)
    expect(r.failures.some((f) => f.startsWith('regionFill'))).toBe(false)
  })

  it('a gray flat frame is high-coverage but low-saturation', () => {
    const img = makeImg(64, 64, 'gray')
    expect(coverage(img)).toBe(1)
    expect(saturation(img)).toBe(0)
    const r = assessFrame(img, 'game_combat', thresholdsFor('game_combat'))
    expect(r.failures.some((f) => f.startsWith('saturation'))).toBe(true)
  })

  it('a content-free corner does not fill all regions', () => {
    // Only the top-left quarter has content; the 3x3 grid should see <=4.
    const { width: w, height: h } = { width: 96, height: 96 }
    const data = new Uint8Array(w * h * 4)
    for (let y = 0; y < h / 2; y += 1) {
      for (let x = 0; x < w / 2; x += 1) {
        const i = (y * w + x) * 4
        data[i] = 200
        data[i + 1] = 80
        data[i + 2] = 60
        data[i + 3] = 255
      }
    }
    expect(regionFill({ width: w, height: h, data })).toBeLessThanOrEqual(4)
  })

  it('regionLegibility catches a flat single-color character', () => {
    const { width: w, height: h } = { width: 64, height: 64 }
    const data = new Uint8Array(w * h * 4)
    // A 20x40 solid-gray "character" at center.
    for (let y = 12; y < 52; y += 1) for (let x = 22; x < 42; x += 1) {
      const i = (y * w + x) * 4
      data[i] = 128
      data[i + 1] = 128
      data[i + 2] = 128
      data[i + 3] = 255
    }
    const leg = regionLegibility({ width: w, height: h, data }, 32, 32, 35)
    expect(leg.colorCount).toBe(1)
    expect(leg.dominantFraction).toBe(1)
  })

  it('regionLegibility sees a multi-color character as legible', () => {
    const { width: w, height: h } = { width: 64, height: 64 }
    const data = new Uint8Array(w * h * 4)
    for (let y = 12; y < 52; y += 1) for (let x = 22; x < 42; x += 1) {
      const i = (y * w + x) * 4
      if (y < 22) { data[i] = 200; data[i + 1] = 200; data[i + 2] = 200 } // helm (white)
      else if (y < 30) { data[i] = 240; data[i + 1] = 200; data[i + 2] = 160 } // face (skin)
      else if (x < 32) { data[i] = 60; data[i + 1] = 90; data[i + 2] = 200 } // armor (blue)
      else { data[i] = 150; data[i + 1] = 95; data[i + 2] = 45 } // weapon (wood)
      data[i + 3] = 255
    }
    const leg = regionLegibility({ width: w, height: h, data }, 32, 32, 35)
    expect(leg.colorCount).toBeGreaterThanOrEqual(4)
    expect(leg.dominantFraction).toBeLessThan(1)
  })

  it('regionLegibility rounds fractional centers so sampling is stable', () => {
    // A fractional center must not index Uint8Array with a non-canonical key
    // (every such read is undefined -> black -> the window reads as empty).
    const { width: w, height: h } = { width: 64, height: 64 }
    const data = new Uint8Array(w * h * 4)
    const cx = 31.7 // fractional, like a sim position after the player moves
    const cy = 32.3
    // Empty frame at a fractional center reports empty (not a crash).
    const leg = regionLegibility({ width: w, height: h, data }, cx, cy, 16)
    expect(leg.colorCount).toBe(0)
    expect(leg.dominantFraction).toBe(1)
    // A multi-color figure still resolves at fractional centers.
    for (let y = 30; y <= 34; y += 1) for (let x = 28; x <= 36; x += 1) {
      const i = (y * w + x) * 4
      if (x < 31) {
        data[i] = 200
        data[i + 1] = 200
        data[i + 2] = 230 // helm (pale)
      } else if (y < 33) {
        data[i] = 240
        data[i + 1] = 200
        data[i + 2] = 160 // face (skin)
      } else {
        data[i] = 60
        data[i + 1] = 90
        data[i + 2] = 200 // armor (blue)
      }
      data[i + 3] = 255
    }
    const leg2 = regionLegibility({ width: w, height: h, data }, cx, cy, 16)
    expect(leg2.colorCount).toBeGreaterThanOrEqual(3)
    expect(leg2.dominantFraction).toBeLessThan(1)
  })

  it('thresholds are per-screen and merge with defaults', () => {
    const t = thresholdsFor('title')
    expect(t.coverage).toBeGreaterThan(0)
    expect(t.colorRichness).toBeGreaterThan(0)
    // unknown screen falls back to the default baseline, not a tuned screen's
    expect(thresholdsFor('missing')).toEqual(DEFAULT_THRESHOLDS)
    // tuned screens raise the bar above the baseline (real renders are bright)
    expect(thresholdsFor('game_combat').coverage).toBeGreaterThan(DEFAULT_THRESHOLDS.coverage)
  })
})