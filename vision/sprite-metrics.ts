/**
 * Structural legibility metrics for a single sprite texture.
 *
 * These exist because the frame-level metrics in `metrics.ts` cannot see a
 * character at all: coverage / colorRichness / saturation / regionFill are
 * frame-GLOBAL, so a bright sky and a green field carry them to ~0.93 / 700 /
 * 0.9 / 9 no matter what the actors look like. The one character-level probe
 * that existed (`regionLegibility`) sampled a screen box that INCLUDED the
 * backdrop, so an empty patch of sky scored 4-17 colors at 0.29 dominance and
 * passed - the guard could not fail, and a cast of featureless rectangles
 * shipped through a green gate.
 *
 * Everything here runs on the sprite's own RGBA texture and ignores every
 * pixel below the alpha cutoff, so the background can never contribute. The
 * property that separates a drawn figure from a stack of boxes is SHAPE, not
 * color: a rectangle repeats two edges down every row, while a figure narrows
 * at the neck, widens at the shoulders, splits at the legs, and holds a weapon
 * out to one side.
 */

export interface SpriteImage {
  width: number
  height: number
  /** RGBA, length === width*height*4. */
  data: Uint8Array
}

/** Alpha at or above this counts as drawn. */
export const ALPHA_CUTOFF = 128
/** A boundary pixel this dark counts as outline. */
export const OUTLINE_MAX_LUM = 110

/**
 * Alpha below which a pixel is background *for the purpose of locating the
 * silhouette edge*. Deliberately far lower than ALPHA_CUTOFF.
 *
 * `getImageData` returns un-premultiplied RGBA, so an anti-aliased edge pixel
 * carries the INK's colour at partial coverage. Treating those as background
 * (alpha < 128) put the detected edge one pixel further in - on the fill, not
 * on the ink - and collapsed outlineRatio for any smooth art, while hard-edged
 * pixel art, which only ever has alpha 0 or 255, was unaffected. The gate would
 * have failed drawn-and-outlined art and passed the blocky art it was built to
 * catch: a property of the ruler, not of the picture.
 *
 * Kept well above zero because un-premultiplying a very low alpha amplifies
 * rounding error. At alpha 32 the per-channel error is at most ~8, nowhere near
 * the ink-versus-fill separation this metric turns on.
 */
export const EDGE_ALPHA_MIN = 32

function alphaAt(img: SpriteImage, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return 0
  return img.data[(y * img.width + x) * 4 + 3] ?? 0
}

function isOpaque(img: SpriteImage, x: number, y: number): boolean {
  return alphaAt(img, x, y) >= ALPHA_CUTOFF
}

function lumAt(img: SpriteImage, x: number, y: number): number {
  const i = (y * img.width + x) * 4
  return ((img.data[i] ?? 0) + (img.data[i + 1] ?? 0) + (img.data[i + 2] ?? 0)) / 3
}

/** Contiguous opaque runs on one row, as [startX, endX] inclusive pairs. */
export function rowRuns(img: SpriteImage, y: number): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  let start = -1
  for (let x = 0; x < img.width; x += 1) {
    if (isOpaque(img, x, y)) {
      if (start < 0) start = x
    } else if (start >= 0) {
      runs.push([start, x - 1])
      start = -1
    }
  }
  if (start >= 0) runs.push([start, img.width - 1])
  return runs
}

/** Bounding box of the drawn pixels, or null when nothing is drawn. */
export function opaqueBounds(
  img: SpriteImage,
): { x0: number; y0: number; x1: number; y1: number; count: number } | null {
  let x0 = img.width
  let y0 = img.height
  let x1 = -1
  let y1 = -1
  let count = 0
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      if (!isOpaque(img, x, y)) continue
      count += 1
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return count === 0 ? null : { x0, y0, x1, y1, count }
}

/** Rows the silhouette is resampled onto before it is scored. */
export const SILHOUETTE_GRID = 32

/**
 * How often the silhouette changes down the figure, as a fraction. A rectangle
 * repeats one (left, right) pair down its whole height and scores near 0; a
 * figure that narrows at the neck, widens at the shoulders and splits at the
 * legs scores high. Rows are keyed on their full run structure, so an arm gap
 * counts as a different profile from a solid row.
 *
 * The silhouette is resampled onto a fixed grid first, because the raw ratio
 * is resolution-dependent: rendering the same art at 2x duplicates every row
 * and halves the score without changing the shape by one pixel. Art authored
 * small and upscaled would be judged worse than identical art authored large,
 * which is a property of the ruler and not of the picture.
 */
export function silhouetteComplexity(img: SpriteImage, grid = SILHOUETTE_GRID): number {
  const bounds = opaqueBounds(img)
  if (bounds === null) return 0
  const spanY = bounds.y1 - bounds.y0 + 1
  const profiles = new Set<string>()
  for (let i = 0; i < grid; i += 1) {
    const y = bounds.y0 + Math.min(spanY - 1, Math.floor((i * spanY) / grid))
    const runs = rowRuns(img, y)
    if (runs.length === 0) {
      profiles.add('empty')
      continue
    }
    // Quantize x against the HEIGHT span, not the width span: normalizing by
    // width would squeeze the body's detail away whenever a pose throws a
    // weapon out to one side, scoring a mid-swing fighter as less shaped than
    // the same fighter standing still. Height is the stable dimension and
    // scales with the sprite, so this stays resolution-invariant.
    const key = runs
      .map(([a, b]) => {
        const qa = Math.round(((a - bounds.x0) * grid) / spanY)
        const qb = Math.round(((b - bounds.x0) * grid) / spanY)
        return `${qa}-${qb}`
      })
      .join(',')
    profiles.add(key)
  }
  return profiles.size / grid
}

/** Contiguous opaque runs down one column, as [startY, endY] inclusive pairs. */
export function columnRuns(img: SpriteImage, x: number): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  let start = -1
  for (let y = 0; y < img.height; y += 1) {
    if (isOpaque(img, x, y)) {
      if (start < 0) start = y
    } else if (start >= 0) {
      runs.push([start, y - 1])
      start = -1
    }
  }
  if (start >= 0) runs.push([start, img.height - 1])
  return runs
}

/**
 * How much of the figure stands clear of its own mass: the larger of the
 * fraction of drawn rows split into two or more runs and the same fraction
 * over columns. Limbs, the gap between the legs and a held weapon all split a
 * line; a solid block never does.
 *
 * Both axes are measured because scanning rows alone quietly assumes every
 * figure is upright. A floored fighter is a horizontal mass with its dropped
 * weapon below it - nothing splits a row, but plenty splits a column - and a
 * row-only reading called that sprite featureless when it is not.
 */
export function appendageRatio(img: SpriteImage): number {
  const ratio = (lines: number, split: number): number => (lines === 0 ? 0 : split / lines)
  let drawnRows = 0
  let splitRows = 0
  for (let y = 0; y < img.height; y += 1) {
    const runs = rowRuns(img, y)
    if (runs.length === 0) continue
    drawnRows += 1
    if (runs.length >= 2) splitRows += 1
  }
  let drawnCols = 0
  let splitCols = 0
  for (let x = 0; x < img.width; x += 1) {
    const runs = columnRuns(img, x)
    if (runs.length === 0) continue
    drawnCols += 1
    if (runs.length >= 2) splitCols += 1
  }
  return Math.max(ratio(drawnRows, splitRows), ratio(drawnCols, splitCols))
}

/**
 * Distinct quantized colors among drawn pixels, and the share held by the
 * single most common one. Alpha-masked, so unlike the screen-space probe this
 * measures the character and nothing else.
 */
export function opaqueColorStats(img: SpriteImage): { colorCount: number; dominantFraction: number } {
  const colors = new Map<number, number>()
  let drawn = 0
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      if (!isOpaque(img, x, y)) continue
      drawn += 1
      const i = (y * img.width + x) * 4
      const k =
        (((img.data[i] ?? 0) >> 3) << 10) |
        (((img.data[i + 1] ?? 0) >> 3) << 5) |
        ((img.data[i + 2] ?? 0) >> 3)
      colors.set(k, (colors.get(k) ?? 0) + 1)
    }
  }
  if (drawn === 0) return { colorCount: 0, dominantFraction: 1 }
  return { colorCount: colors.size, dominantFraction: Math.max(...colors.values()) / drawn }
}

/**
 * Fraction of silhouette-edge pixels that are dark. An outlined sprite holds
 * its shape against any backdrop; an un-outlined one dissolves into whatever
 * is behind it, which is most of why the old cast read as coloured smudges over
 * a bright sky.
 *
 * The edge is found at EDGE_ALPHA_MIN rather than ALPHA_CUTOFF so that an
 * anti-aliased ink line is measured on the ink; see that constant for why.
 */
export function outlineRatio(img: SpriteImage): number {
  const drawn = (x: number, y: number): boolean => alphaAt(img, x, y) >= EDGE_ALPHA_MIN
  let edge = 0
  let dark = 0
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      if (!drawn(x, y)) continue
      const onEdge = !drawn(x - 1, y) || !drawn(x + 1, y) || !drawn(x, y - 1) || !drawn(x, y + 1)
      if (!onEdge) continue
      edge += 1
      if (lumAt(img, x, y) <= OUTLINE_MAX_LUM) dark += 1
    }
  }
  return edge === 0 ? 0 : dark / edge
}

/** Luminance buckets the figure's tones are sorted into. */
export const TONAL_BUCKETS = 16
/** Share of the drawn area a bucket needs before it counts as a band. */
export const MIN_BAND_SHARE = 0.02

/**
 * How many distinct tonal steps the figure is built from: luminance buckets
 * that each hold at least MIN_BAND_SHARE of its drawn pixels.
 *
 * This is what separates shaded art from a flat fill, and it exists because
 * colorCount stops being able to. colorCount was calibrated against a ~14-slot
 * indexed palette, where "more than 12 colours" meant someone had drawn this.
 * Anti-aliasing and gradients push that number into the hundreds on their own,
 * so on smooth art the floor becomes unfailable and a single flat fill with a
 * soft edge would clear it. A band has to hold real AREA, so an anti-aliased
 * ring cannot manufacture one: a flat blob scores 1, a flat blob with an ink
 * outline scores 2, and cel shading - ink, core shadow, base, rim light -
 * scores 4 or more.
 */
export function tonalBands(img: SpriteImage): number {
  const hist = new Array<number>(TONAL_BUCKETS).fill(0)
  let drawn = 0
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      if (!isOpaque(img, x, y)) continue
      drawn += 1
      const b = Math.min(TONAL_BUCKETS - 1, Math.floor((lumAt(img, x, y) * TONAL_BUCKETS) / 256))
      hist[b] = (hist[b] ?? 0) + 1
    }
  }
  if (drawn === 0) return 0
  return hist.filter((n) => n / drawn >= MIN_BAND_SHARE).length
}

/** Width of the drawn bounding box - how far the pose reaches sideways. */
export function drawnWidth(img: SpriteImage): number {
  const b = opaqueBounds(img)
  return b === null ? 0 : b.x1 - b.x0 + 1
}

export interface SpriteThresholds {
  minSilhouetteComplexity: number
  minAppendageRatio: number
  minColorCount: number
  maxDominantFraction: number
  minOutlineRatio: number
  minTonalBands: number
}

export interface SpriteResult {
  label: string
  silhouetteComplexity: number
  appendageRatio: number
  colorCount: number
  dominantFraction: number
  outlineRatio: number
  tonalBands: number
  pass: boolean
  failures: string[]
}

export function assessSprite(img: SpriteImage, label: string, t: SpriteThresholds): SpriteResult {
  const sc = silhouetteComplexity(img)
  const ar = appendageRatio(img)
  const { colorCount, dominantFraction } = opaqueColorStats(img)
  const or = outlineRatio(img)
  const tb = tonalBands(img)
  const failures: string[] = []
  if (opaqueBounds(img) === null) failures.push('sprite is entirely transparent')
  if (sc < t.minSilhouetteComplexity) {
    failures.push(`silhouetteComplexity ${round3(sc)} < ${t.minSilhouetteComplexity} (reads as stacked boxes)`)
  }
  if (ar < t.minAppendageRatio) {
    failures.push(`appendageRatio ${round3(ar)} < ${t.minAppendageRatio} (no limbs or weapon clear of the body)`)
  }
  if (colorCount < t.minColorCount) failures.push(`colorCount ${colorCount} < ${t.minColorCount}`)
  if (dominantFraction > t.maxDominantFraction) {
    failures.push(`dominantFraction ${round3(dominantFraction)} > ${t.maxDominantFraction} (flat blob)`)
  }
  if (or < t.minOutlineRatio) {
    failures.push(`outlineRatio ${round3(or)} < ${t.minOutlineRatio} (no dark outline; dissolves into the backdrop)`)
  }
  if (tb < t.minTonalBands) {
    failures.push(`tonalBands ${tb} < ${t.minTonalBands} (unshaded: one flat tone doing all the work)`)
  }
  return {
    label,
    silhouetteComplexity: round3(sc),
    appendageRatio: round3(ar),
    colorCount,
    dominantFraction: round3(dominantFraction),
    outlineRatio: round3(or),
    tonalBands: tb,
    pass: failures.length === 0,
    failures,
  }
}

export interface WeaponReachResult {
  label: string
  idleWidth: number
  attackWidth: number
  extra: number
  pass: boolean
  failures: string[]
}

/**
 * A weapon must be visible as reach: the attack pose has to extend measurably
 * further sideways than idle. "I cannot see the weapons" is this check failing.
 *
 * Widths are normalized by texture HEIGHT, not by frame width. Every pose is
 * drawn at the same on-screen height (GameScene scales each texture to a fixed
 * displayH), so height is the stable ruler; normalizing by frame width instead
 * would divide out exactly the horizontal growth being measured whenever the
 * attack frame is the wider one - which is the normal case for a swung weapon.
 */
export function assessWeaponReach(
  idle: SpriteImage,
  attack: SpriteImage,
  label: string,
  minExtraPixels: number,
): WeaponReachResult {
  const idleWidth = drawnWidth(idle)
  const attackWidth = drawnWidth(attack)
  const scale = idle.height === 0 || attack.height === 0 ? 1 : attack.height / idle.height
  const extra = Math.round(attackWidth / scale - idleWidth)
  const failures: string[] =
    extra < minExtraPixels
      ? [`weapon reach ${extra}px < ${minExtraPixels}px (attack pose shows no weapon)`]
      : []
  return { label, idleWidth, attackWidth, extra, pass: failures.length === 0, failures }
}

/** Any drawn pixel at all - the check a HUD bar texture has to survive. */
export function hasVisiblePixels(img: SpriteImage): boolean {
  return opaqueBounds(img) !== null
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000
}
