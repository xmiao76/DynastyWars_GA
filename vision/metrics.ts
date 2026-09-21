/**
 * Objective visual-health metrics for rendered frames. Pure functions over a
 * flat RGBA buffer - unit-testable in Node, used by the vision producer.
 *
 * These are heuristics for "does the frame render like a game should", not an
 * art critic. The loop asserts thresholds so a broken (empty/flat/dark) render
 * files a task instead of silently passing.
 */

export interface FrameImage {
  width: number
  height: number
  data: Uint8Array // RGBA, data.length === width*height*4
}

/** Luminance-ish brightness of a pixel (0..255). */
function lum(data: Uint8Array, i: number): number {
  return ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0)) / 3
}

/** Is this pixel "content" (not near-black)? */
export function isContent(data: Uint8Array, i: number, minLum = 20): boolean {
  return lum(data, i) > minLum
}

/**
 * Fraction of pixels that are content (not near-black). A fully black or
 * unrendered frame scores ~0.
 */
export function coverage(img: FrameImage): number {
  let n = 0
  const { data } = img
  for (let i = 0; i < data.length; i += 4) if (isContent(data, i)) n += 1
  return n / (img.width * img.height)
}

/**
 * Number of distinct quantized colors among content pixels (5 bits/channel).
 * A flat 2-color placeholder scores low; rich painted art scores high.
 */
export function colorRichness(img: FrameImage): number {
  const colors = new Set<number>()
  const { data } = img
  for (let i = 0; i < data.length; i += 4) {
    if (!isContent(data, i)) continue
    const r: number = data[i] ?? 0
    const g: number = data[i + 1] ?? 0
    const b: number = data[i + 2] ?? 0
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    colors.add(k)
  }
  return colors.size
}

/**
 * Fraction of content pixels that are strongly saturated (max-min channel
 * difference >= 40/255). A gray/flat image scores low; a vivid game high.
 */
export function saturation(img: FrameImage): number {
  const { data } = img
  let content = 0
  let vivid = 0
  for (let i = 0; i < data.length; i += 4) {
    if (!isContent(data, i)) continue
    content += 1
    const r: number = data[i] ?? 0
    const g: number = data[i + 1] ?? 0
    const b: number = data[i + 2] ?? 0
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max - min >= 40) vivid += 1
  }
  return content === 0 ? 0 : vivid / content
}

/**
 * How many of the 3x3 frame cells have any content at all (0..9). Guards
 * against a render that only fills a corner - a game UI should use the screen.
 */
export function regionFill(img: FrameImage, minCellContent = 0.02): number {
  const { width, height, data } = img
  const cells = new Array(9).fill(0)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      if (!isContent(data, i)) continue
      const cy = Math.min(2, Math.floor((y / height) * 3))
      const cx = Math.min(2, Math.floor((x / width) * 3))
      cells[cy * 3 + cx] += 1
    }
  }
  let filled = 0
  const cellPixels = (width / 3) * (height / 3)
  for (const c of cells) if (c / cellPixels >= minCellContent) filled += 1
  return filled
}

/** Mean brightness of every pixel (0..255) - how lit the frame is overall. */
export function meanLuminance(img: FrameImage): number {
  const { data } = img
  let total = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    total += lum(data, i)
    n += 1
  }
  return n === 0 ? 0 : total / n
}

/** Content fraction of the top band (rows [0, h*band)) - HUD presence. */
export function bandCoverage(img: FrameImage, band = 0.18, minLum = 20): number {
  const { width, height, data } = img
  const yEnd = Math.floor(height * band)
  let n = 0
  let total = 0
  for (let y = 0; y < yEnd; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      total += 1
      if (isContent(data, i, minLum)) n += 1
    }
  }
  return total === 0 ? 0 : n / total
}

/** A frame is healthy iff every metric meets its threshold. */
export interface MetricThresholds {
  coverage: number
  colorRichness: number
  saturation: number
  regionFill: number
}

export interface MetricResult {
  screen: string
  coverage: number
  colorRichness: number
  saturation: number
  regionFill: number
  pass: boolean
  failures: string[]
}

/**
 * Measure a specific screen-box's inner contrast - the character-legibility
 * guard the frame-average metrics miss. Samples a window around (cx, cy) and
 * reports (a) how many distinct quality colors the content has and (b) the
 * fraction of content pixels in the single most common color. A flat blob
 * (one-color character) scores colorCount=1 and dominance=1.0; a real
 * character with armor, skin, and weapon scores higher.
 */
export function regionLegibility(
  img: FrameImage,
  cx: number,
  cy: number,
  radius = 30,
): { colorCount: number; dominantFraction: number } {
  const { width, height, data } = img
  const colors = new Map<number, number>()
  let content = 0
  // Round center to whole px: a fractional index into Uint8Array is not a
  // canonical numeric key - every read is undefined, so the window silently
  // reports empty (colorCount 0) whenever a character stands on a fractional
  // position. Callers pass sim coordinates that can be fractional.
  const rx = Math.round(cx)
  const ry = Math.round(cy)
  const x0 = Math.max(0, rx - radius)
  const x1 = Math.min(width - 1, rx + radius)
  const y0 = Math.max(0, ry - radius)
  const y1 = Math.min(height - 1, ry + radius)
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = (y * width + x) * 4
      if (!isContent(data, i)) continue
      content += 1
      const k = ((data[i] ?? 0) >> 3) << 10 | (((data[i + 1] ?? 0) >> 3) << 5) | ((data[i + 2] ?? 0) >> 3)
      colors.set(k, (colors.get(k) ?? 0) + 1)
    }
  }
  if (content === 0) return { colorCount: 0, dominantFraction: 1 }
  const dominant = Math.max(...colors.values())
  return { colorCount: colors.size, dominantFraction: dominant / content }
}

export function assessFrame(
  img: FrameImage,
  screen: string,
  t: MetricThresholds,
): MetricResult {
  const c = coverage(img)
  const r = colorRichness(img)
  const s = saturation(img)
  const f = regionFill(img)
  const failures: string[] = []
  if (c < t.coverage) failures.push(`coverage ${c.toFixed(3)} < ${t.coverage}`)
  if (r < t.colorRichness) failures.push(`colorRichness ${r} < ${t.colorRichness}`)
  if (s < t.saturation) failures.push(`saturation ${s.toFixed(3)} < ${t.saturation}`)
  if (f < t.regionFill) failures.push(`regionFill ${f} < ${t.regionFill}`)
  return { screen, coverage: c, colorRichness: r, saturation: s, regionFill: f, pass: failures.length === 0, failures }
}