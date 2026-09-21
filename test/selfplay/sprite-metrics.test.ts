import { describe, expect, it } from 'vitest'
import {
  appendageRatio,
  assessSprite,
  assessWeaponReach,
  drawnWidth,
  EDGE_ALPHA_MIN,
  hasVisiblePixels,
  opaqueBounds,
  opaqueColorStats,
  outlineRatio,
  rowRuns,
  silhouetteComplexity,
  tonalBands,
  type SpriteImage,
} from '../../vision/sprite-metrics'
import { CHARACTER_SPRITE_THRESHOLDS, MIN_WEAPON_REACH_PX } from '../../vision/thresholds'

/**
 * Build a sprite from an ASCII map. '.' is transparent; any other character
 * indexes the palette. This mirrors how the game authors its art, so the
 * fixtures below are the real shapes the gate has to tell apart.
 */
function sprite(rows: string[], palette: Record<string, [number, number, number]>): SpriteImage {
  const width = Math.max(...rows.map((r) => r.length))
  const height = rows.length
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ch = rows[y]?.[x] ?? '.'
      if (ch === '.') continue
      const rgb = palette[ch]
      if (!rgb) continue
      const i = (y * width + x) * 4
      data[i] = rgb[0]
      data[i + 1] = rgb[1]
      data[i + 2] = rgb[2]
      data[i + 3] = 255
    }
  }
  return { width, height, data }
}

const PALETTE: Record<string, [number, number, number]> = {
  D: [20, 20, 24], // dark outline
  S: [240, 200, 160], // skin
  s: [188, 148, 112], // skin shadow
  E: [30, 30, 30], // eye
  B: [60, 90, 200], // armor
  b: [38, 58, 132], // armor shadow
  L: [110, 140, 235], // armor highlight
  T: [200, 60, 60], // trim
  t: [138, 36, 36], // trim shadow
  W: [200, 200, 210], // weapon
  P: [42, 42, 58], // pants
  p: [28, 28, 40], // pants shadow
  K: [64, 48, 36], // boot
  k: [44, 32, 24], // boot shadow
}

/**
 * The failure the gate shipped: head box, torso box, two leg boxes. Every
 * torso row has the identical profile, and nothing reaches sideways.
 */
const BOX_STACK = [
  '.DDDDDDDD.',
  '.DBBBBBBD.',
  '.DBBBBBBD.',
  '.DBBBBBBD.',
  '.DDDDDDDD.',
  'DBBBBBBBBD',
  'DBBBBBBBBD',
  'DBBBBBBBBD',
  'DBBBBBBBBD',
  'DBBBBBBBBD',
  'DBBBBBBBBD',
  'DBBBBBBBBD',
  'DDDPPPPDDD',
  '.DPD..DPD.',
  '.DPD..DPD.',
  '.DPD..DPD.',
  '.DPD..DPD.',
  '.DDD..DDD.',
]

/**
 * A readable figure: helmet, face with eyes, shoulders, an arm clear of the
 * torso, a staff held to one side, and split legs - with two shading tones on
 * every material, which is what real art carries and a slab does not.
 */
const FIGURE_IDLE = [
  '....DDDD.....',
  '...DTTTTD....',
  '..DDDDDDDD...',
  '..DSSSSSsD...',
  '..DSESSEsD...',
  '..DSSSSSsD...',
  '...DSsssD.DDD',
  '....DSSD..DWD',
  '..DDDDDDD.DWD',
  '.DLBBBBBBbDWD',
  'DSBBTTTTtbDWD',
  'DSLBBBBBBbDWD',
  'DsLBBBBBBbDWD',
  '.DLBBBBBBbDWD',
  '.DBTTTTttBDWD',
  '..DBBBBbbDDWD',
  '..DPPPPppDDDD',
  '..DPPDDppD...',
  '..DPD..DpD...',
  '..DKD..DkD...',
  '.DDDD..DDDD..',
]

/** The same figure mid-swing: the weapon sweeps out to the right. */
const FIGURE_ATTACK = [
  '....DDDD...........',
  '...DTTTTD..........',
  '..DDDDDDDD.........',
  '..DSSSSSsD.........',
  '..DSESSEsD.........',
  '..DSSSSSsD.........',
  '...DSsssD..........',
  '....DSSD...........',
  '..DDDDDDD..........',
  '.DLBBBBBBbD........',
  'DSBBTTTTtbDDDDDDDDD',
  'DSLBBBBBBbSWWWWWWWD',
  'DsLBBBBBBbDDDDDDDDD',
  '.DLBBBBBBbD........',
  '.DBTTTTttBD........',
  '..DBBBBbbD.........',
  '..DPPPPppD.........',
  '..DPPDDppD.........',
  '..DPD..DpD.........',
  '..DKD..DkD.........',
  '.DDDD..DDDD........',
]

/**
 * The same map, drawn the way a 2D canvas draws it: the solid shape at full
 * alpha with a one-pixel ring of PARTIAL alpha around it. `getImageData`
 * returns un-premultiplied RGBA, so that ring carries the colour of whatever
 * was stroked there - the ink on outlined art, the fill on un-outlined art.
 * A 1px ink stroke on a shape boundary lands almost entirely in this band,
 * which is what made the binary-alpha edge rule misread smooth art.
 */
function softSprite(
  rows: string[],
  palette: Record<string, [number, number, number]>,
  ringChar: string,
  ringAlpha: number,
): SpriteImage {
  const img = sprite(rows, palette)
  const solid = new Uint8Array(img.data)
  const at = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : (solid[(y * img.width + x) * 4 + 3] ?? 0)
  const rgb = palette[ringChar] ?? [0, 0, 0]
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      if (at(x, y) !== 0) continue
      const touches = at(x - 1, y) > 0 || at(x + 1, y) > 0 || at(x, y - 1) > 0 || at(x, y + 1) > 0
      if (!touches) continue
      const i = (y * img.width + x) * 4
      img.data[i] = rgb[0]
      img.data[i + 1] = rgb[1]
      img.data[i + 2] = rgb[2]
      img.data[i + 3] = ringAlpha
    }
  }
  return img
}

/** FIGURE_IDLE's silhouette with every drawn pixel flattened to one colour. */
function flatten(rows: string[], ch: string): string[] {
  return rows.map((r) => [...r].map((c) => (c === '.' ? '.' : ch)).join(''))
}

describe('sprite structure primitives', () => {
  it('finds the opaque runs on a row and ignores transparent gaps', () => {
    const img = sprite(['.BB..BB.'], PALETTE)
    expect(rowRuns(img, 0)).toEqual([
      [1, 2],
      [5, 6],
    ])
  })

  it('reports the drawn bounding box, and null when nothing is drawn', () => {
    expect(opaqueBounds(sprite(['..B..'], PALETTE))).toEqual({ x0: 2, y0: 0, x1: 2, y1: 0, count: 1 })
    expect(opaqueBounds(sprite(['.....'], PALETTE))).toBeNull()
    expect(hasVisiblePixels(sprite(['.....'], PALETTE))).toBe(false)
  })

  it('scores a solid rectangle at the floor of silhouette complexity', () => {
    // Every row has the identical profile, so exactly one profile on the grid.
    const rect = sprite(Array.from({ length: 10 }, () => 'BBBBBB'), PALETTE)
    expect(silhouetteComplexity(rect)).toBeCloseTo(1 / 32, 5)
    expect(appendageRatio(rect)).toBe(0)
  })

  it('scores the same shape identically at any scale', () => {
    // The raw ratio halved every time art was rendered at 2x, which would have
    // judged small art upscaled for display worse than identical large art.
    const upscale = (rows: string[], s: number): string[] =>
      rows.flatMap((r) => Array.from({ length: s }, () => [...r].flatMap((c) => Array<string>(s).fill(c)).join('')))
    const base = silhouetteComplexity(sprite(FIGURE_IDLE, PALETTE))
    for (const s of [2, 3, 4]) {
      expect(silhouetteComplexity(sprite(upscale(FIGURE_IDLE, s), PALETTE)), `scale ${s}`).toBeCloseTo(base, 5)
    }
  })

  it('counts split rows as appendages', () => {
    const legs = sprite(['BBBB', 'B..B', 'B..B'], PALETTE)
    expect(appendageRatio(legs)).toBeCloseTo(2 / 3, 5)
  })

  it('counts split columns too, so a prone figure is not called featureless', () => {
    // A body lying flat with its dropped weapon below it: no row is split,
    // but every column through both is. Scanning rows alone scored this 0.
    const prone = sprite(['BBBBBB', 'BBBBBB', '......', 'WWWWWW'], PALETTE)
    expect(appendageRatio(prone)).toBe(1)
  })

  it('measures colors and outline only over drawn pixels', () => {
    // A transparent border must not count as content or dilute the outline.
    const img = sprite(['.DD.', '.DD.'], PALETTE)
    expect(opaqueColorStats(img)).toEqual({ colorCount: 1, dominantFraction: 1 })
    expect(outlineRatio(img)).toBe(1) // every drawn pixel is on the edge and dark
    const bright = sprite(['.SS.', '.SS.'], PALETTE)
    expect(outlineRatio(bright)).toBe(0) // skin-coloured edge is not an outline
  })
})

describe('the character gate separates a figure from a stack of boxes', () => {
  it('REJECTS the box-stack sprite that the old gate passed', () => {
    const r = assessSprite(sprite(BOX_STACK, PALETTE), 'box-stack', CHARACTER_SPRITE_THRESHOLDS)
    expect(r.pass).toBe(false)
    expect(r.failures.some((f) => f.startsWith('silhouetteComplexity'))).toBe(true)
  })

  it('ACCEPTS a readable figure with a head, arms and a weapon', () => {
    const r = assessSprite(sprite(FIGURE_IDLE, PALETTE), 'figure', CHARACTER_SPRITE_THRESHOLDS)
    expect(r.failures).toEqual([])
    expect(r.pass).toBe(true)
  })

  it('REJECTS an entirely transparent sprite instead of scoring it 0 silently', () => {
    const blank = sprite(Array.from({ length: 8 }, () => '........'), PALETTE)
    const r = assessSprite(blank, 'blank', CHARACTER_SPRITE_THRESHOLDS)
    expect(r.pass).toBe(false)
    expect(r.failures).toContain('sprite is entirely transparent')
  })

  it('REJECTS a flat single-colour blob', () => {
    const blob = sprite(Array.from({ length: 12 }, () => 'BBBBBBBB'), PALETTE)
    const r = assessSprite(blob, 'blob', CHARACTER_SPRITE_THRESHOLDS)
    expect(r.pass).toBe(false)
    expect(r.failures.some((f) => f.startsWith('dominantFraction'))).toBe(true)
    expect(r.failures.some((f) => f.startsWith('colorCount'))).toBe(true)
  })
})

describe('weapon reach', () => {
  it('passes when the attack pose swings a weapon clear of the body', () => {
    const idle = sprite(FIGURE_IDLE, PALETTE)
    const attack = sprite(FIGURE_ATTACK, PALETTE)
    const r = assessWeaponReach(idle, attack, 'figure', MIN_WEAPON_REACH_PX)
    expect(drawnWidth(attack)).toBeGreaterThan(drawnWidth(idle))
    expect(r.pass).toBe(true)
  })

  it('FAILS when the attack pose is no wider than idle - the shipped bug', () => {
    // Every stand-in attack pose measured 1px NARROWER than its idle pose.
    const idle = sprite(BOX_STACK, PALETTE)
    const attack = sprite(
      BOX_STACK.map((r) => r.replace(/^(.)/, '.')),
      PALETTE,
    )
    const r = assessWeaponReach(idle, attack, 'box-stack', MIN_WEAPON_REACH_PX)
    expect(r.pass).toBe(false)
    expect(r.failures[0]).toContain('attack pose shows no weapon')
  })

  it('does not credit reach that comes only from a bigger frame box', () => {
    // Same figure in a frame twice as wide: the drawn silhouette is unchanged,
    // so no reach is earned. Empty frame padding must never read as a weapon.
    const idle = sprite(FIGURE_IDLE, PALETTE)
    const padded = sprite(
      FIGURE_IDLE.map((r) => r.padEnd((FIGURE_IDLE[0]?.length ?? 0) * 2, '.')),
      PALETTE,
    )
    const r = assessWeaponReach(idle, padded, 'padded', MIN_WEAPON_REACH_PX)
    expect(r.extra).toBe(0)
    expect(r.pass).toBe(false)
  })
})

/**
 * The edge rule has to work on smooth art WITHOUT becoming unable to fail.
 * These four cases are the whole argument: a thin ink stroke lives in the
 * partial-alpha band, so a binary-alpha edge rule reads the fill underneath it
 * and calls outlined art un-outlined - while still, correctly, calling
 * un-outlined art un-outlined. Fixing that must not also make it accept art
 * that genuinely has no ink.
 */
describe('outlineRatio on anti-aliased art', () => {
  // A fill whose only ink is a 1px stroke sitting in the anti-aliased band.
  // Padded with a transparent frame so that band has somewhere to live - without
  // it the shape touches the canvas edge, the ring has nowhere to go, and the
  // fixture quietly measures something else.
  const INK_IN_THE_AA_BAND = [
    '........',
    '..BBBB..',
    '.BBBBBB.',
    '.BBBBBB.',
    '..BBBB..',
    '........',
  ]

  it('ACCEPTS a figure whose ink line lives in the partial-alpha band', () => {
    const inked = softSprite(INK_IN_THE_AA_BAND, PALETTE, 'D', 100)
    expect(outlineRatio(inked)).toBeGreaterThan(0.9)
  })

  it('REJECTS the same figure when that band carries the fill colour, not ink', () => {
    const bare = softSprite(INK_IN_THE_AA_BAND, PALETTE, 'B', 100)
    expect(outlineRatio(bare)).toBe(0)
  })

  it('ignores a band too faint to read, where un-premultiplying is unreliable', () => {
    // Below the cutoff the ring is not treated as the edge, so the metric falls
    // back to the solid pixels underneath - which here are bare fill.
    const whisper = softSprite(INK_IN_THE_AA_BAND, PALETTE, 'D', EDGE_ALPHA_MIN - 1)
    expect(outlineRatio(whisper)).toBe(0)
  })

  it('scores hard-edged art exactly as before, because it has no partial alpha', () => {
    // The pixel art the game ships today is alpha 0 or 255 and nothing else, so
    // lowering the edge cutoff cannot reach it. Confirmed across the real cast:
    // all 112 sprites measure outlineRatio 1.0, unchanged by this metric.
    const hard = sprite(FIGURE_IDLE, PALETTE)
    for (let i = 3; i < hard.data.length; i += 4) {
      expect(hard.data[i] === 0 || hard.data[i] === 255).toBe(true)
    }
    expect(outlineRatio(hard)).toBe(1)
  })
})

/**
 * tonalBands takes over from colorCount as the thing that can tell shaded art
 * from a flat fill. colorCount was calibrated against a ~14-slot indexed
 * palette; anti-aliasing alone pushes it into the hundreds, so on smooth art
 * that floor can no longer fail. A band has to hold 2% of the drawn area, so an
 * anti-aliased ring cannot manufacture one.
 */
describe('tonalBands counts shading, not anti-aliasing', () => {
  it('scores a flat fill 1 and a flat fill with an ink outline 2', () => {
    const flat = sprite(Array.from({ length: 12 }, () => 'BBBBBBBB'), PALETTE)
    expect(tonalBands(flat)).toBe(1)
    const outlined = sprite(flatten(FIGURE_IDLE, 'B').map((r) => r), PALETTE)
    expect(tonalBands(outlined)).toBe(1)
    const inked = sprite(['DDDDDD', 'DBBBBD', 'DBBBBD', 'DBBBBD', 'DBBBBD', 'DDDDDD'], PALETTE)
    expect(tonalBands(inked)).toBe(2)
  })

  it('scores real shaded art well clear of that', () => {
    expect(tonalBands(sprite(FIGURE_IDLE, PALETTE))).toBeGreaterThanOrEqual(4)
  })

  it('cannot be fooled by an anti-aliased ring of ink', () => {
    // A solid body inside a transparent frame, so the ring genuinely exists -
    // asserted, because a fixture with no room for one would pass this test
    // while measuring nothing.
    const map = ['..........', ...Array.from({ length: 8 }, () => '.BBBBBBBB.'), '..........']
    const flat = sprite(map, PALETTE)
    const ringed = softSprite(map, PALETTE, 'D', 100)
    const partial = [...Array(ringed.height * ringed.width).keys()].filter((i) => {
      const a = ringed.data[i * 4 + 3] ?? 0
      return a > 0 && a < 255
    }).length
    expect(partial, 'fixture has no anti-aliased ring to test').toBeGreaterThan(20)
    expect(tonalBands(ringed)).toBe(tonalBands(flat))
  })
})

/**
 * THE SECOND NEGATIVE CONTROL. The browser gate proves it can fail by feeding
 * itself a patch of empty backdrop, which works only while the backdrop is
 * flat - a painted, cel-shaded sky would start passing it and the proof would
 * evaporate silently. This control does not depend on the background at all:
 * a figure-shaped silhouette with no shading and no ink is the exact thing the
 * gate exists to refuse, whatever is drawn behind it.
 */
describe('the character gate rejects a figure-shaped flat silhouette', () => {
  it('REJECTS it, naming the shading as the reason', () => {
    const r = assessSprite(sprite(flatten(FIGURE_IDLE, 'B'), PALETTE), 'flat-silhouette', CHARACTER_SPRITE_THRESHOLDS)
    expect(r.pass).toBe(false)
    expect(r.failures.some((f) => f.startsWith('tonalBands'))).toBe(true)
  })

  it('and it is a real silhouette, not a rectangle smuggled past on shape alone', () => {
    // The point of the fixture: it has the figure's shape, so the shape metrics
    // pass and only the shading metrics catch it. A flat rectangle would have
    // been caught by silhouetteComplexity and proved nothing new.
    const flatFigure = sprite(flatten(FIGURE_IDLE, 'B'), PALETTE)
    expect(silhouetteComplexity(flatFigure)).toBeGreaterThanOrEqual(
      CHARACTER_SPRITE_THRESHOLDS.minSilhouetteComplexity,
    )
    expect(appendageRatio(flatFigure)).toBeGreaterThanOrEqual(CHARACTER_SPRITE_THRESHOLDS.minAppendageRatio)
  })
})
