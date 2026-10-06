import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'

/**
 * UIR-19 measurable acceptance (V-18): the hand cells carry painted FORM -
 * knuckles, finger grouping, lit/shaded planes - not flat mitten fills.
 * Two measurable properties, both weak on the old paint:
 *   1. Knuckle peaks: lit local maxima along the knuckle/finger-root rows
 *      (prominence >= 8 luminance over +-1u, plateau counted once).
 *      Before (stashed old painter + old sheets): 0-1 per cell.
 *   2. Plane contrast: upper-left (lit) mean minus lower-right (shaded)
 *      mean over the opaque silhouette. Before: 27-35 per kind, below
 *      every floor (47 failures total on the old art).
 * Measured on the committed sheets exactly like handparts.test.ts, so the
 * pin gates the art bytes a player sees. Finger-separator depth stays
 * covered by handparts' dip gate (>= 3), tone identity by its modal band.
 */
type Ctx = CanvasRenderingContext2D

const KINDS = ['gripN', 'gripF', 'relaxN', 'relaxF'] as const
const PACKS = ['hero-bodies', 'mook-bodies', 'boss-bodies'] as const

interface KindFloor {
  peaks: number
  quad: number
}
// Peaks floor: a formed hand shows >= 2 knuckle/root caps (4 caps typical).
// Quad floors: below the old-cast minima (gripN 33.7, gripF 28.1,
// relaxN 32.3, relaxF 27.1) - see the failing first run for the record.
const FLOORS: Record<string, KindFloor> = {
  gripN: { peaks: 2, quad: 40 },
  // Far floors are a SANITY floor, not the discriminator: the handparts
  // dark-share rule (unedited) caps how dark far shading may go on the
  // face-matched dark bases (xuchu far base lum 47), so far plane
  // contrast tops out ~23 where the old light-based paint reached 27
  // only by grazing ink. The fails-before discriminator on far cells is
  // the knuckle-peak count (0-1 before, >= 2 after); the near floors
  // carry the plane-contrast discrimination (old 32-34 vs floors 38/40).
  gripF: { peaks: 2, quad: 20 },
  relaxN: { peaks: 2, quad: 38 },
  relaxF: { peaks: 2, quad: 20 },
}

function analyze(crop: { w: number; h: number; data: Uint8ClampedArray }): { quad: number; peaks: number } {
  const { w, h, data } = crop
  const lum = (i: number): number =>
    0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0)
  let ul = 0
  let uln = 0
  let lr = 0
  let lrn = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4
      if ((data[i + 3] ?? 0) < 200) continue
      const v = lum(i)
      if (x < w / 2 && y < h / 2) {
        ul += v
        uln += 1
      }
      if (x >= w / 2 && y >= h / 2) {
        lr += v
        lrn += 1
      }
    }
  }
  const quad = ul / Math.max(1, uln) - lr / Math.max(1, lrn)
  // Knuckle peaks: the fist's knuckle row rides the TOP edge (horizontal
  // rows, logical y -3..-0.5 -> device rows 8..18), the open hand's
  // finger roots stack VERTICALLY (logical x 0.5..3 -> device cols 26..36).
  // A strict local max with prominence >= 8 over +-4px counts as a cap.
  const peakScan = (line: number[]): number => {
    let peaks = 0
    for (let x = 5; x < line.length - 5; x += 1) {
      const v = line[x] ?? Number.NaN
      if (Number.isNaN(v)) continue
      // Count each bump once: rising edge of a plateau, not a strict max.
      const prev = line[x - 1] ?? Number.NaN
      if (Number.isNaN(prev) || v <= prev) continue
      let isTop = true
      let prom = Infinity
      for (let k = -4; k <= 4; k += 1) {
        if (k === 0) continue
        const u = line[x + k] ?? Number.NaN
        if (Number.isNaN(u)) continue
        if (u > v) isTop = false
        prom = Math.min(prom, v - u)
      }
      if (isTop && prom >= 8) peaks += 1
    }
    return peaks
  }
  let bestPeaks = 0
  for (let y = 8; y <= 18; y += 1) {
    const row: number[] = []
    for (let x = 2; x < w - 2; x += 1) {
      const i = (y * w + x) * 4
      row.push((data[i + 3] ?? 0) >= 200 ? lum(i) : Number.NaN)
    }
    bestPeaks = Math.max(bestPeaks, peakScan(row))
  }
  for (let x = 26; x <= 36; x += 1) {
    const col: number[] = []
    for (let y = 2; y < h - 2; y += 1) {
      const i = (y * w + x) * 4
      col.push((data[i + 3] ?? 0) >= 200 ? lum(i) : Number.NaN)
    }
    bestPeaks = Math.max(bestPeaks, peakScan(col))
  }
  return { quad, peaks: bestPeaks }
}

describe('UIR-19 hands carry painted form (V-18)', () => {
  it('every grip/relax cell shows knuckle caps and lit/shaded planes', async () => {
    const failures: string[] = []
    const rows: string[] = []
    let n = 0
    for (const pack of PACKS) {
      const meta = (await import(`../../src/game/assets/${pack}/prepared.json`, {
        with: { type: 'json' },
      })).default as Record<string, { skin: string; parts: Record<string, { x: number; y: number; w: number; h: number }> }>
      for (const id of Object.keys(meta)) {
        const sheet = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
        for (const kind of KINDS) {
          const c = meta[id]?.parts[kind]
          if (!c) continue
          const cv = createCanvas(c.w, c.h)
          const ctx = cv.getContext('2d') as unknown as Ctx
          ctx.drawImage(sheet as unknown as CanvasImageSource, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
          const a = analyze({ w: c.w, h: c.h, data: ctx.getImageData(0, 0, c.w, c.h).data })
          const fl = FLOORS[kind]!
          n += 1
          rows.push(`${id}:${kind} peaks=${a.peaks} quad=${a.quad.toFixed(0)}`)
          if (a.peaks < fl.peaks) failures.push(`${id}:${kind} ${a.peaks} knuckle peaks (want >= ${fl.peaks})`)
          if (a.quad < fl.quad) failures.push(`${id}:${kind} quad ${a.quad.toFixed(1)} (want >= ${fl.quad})`)
        }
      }
    }
    console.log('UIR19 ' + rows.join(' '))
    expect(n).toBeGreaterThan(32)
    expect(failures).toEqual([])
  })
})
