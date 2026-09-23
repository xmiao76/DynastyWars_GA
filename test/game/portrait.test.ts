import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { INK_W } from '../../src/game/art/draw'
import { EYE_BASE_W, FACES, SCLERA } from '../../src/game/art/faces'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import {
  PORTRAIT_BROW_Y,
  PORTRAIT_EYE_X,
  PORTRAIT_EYE_Y,
  PORTRAIT_HW,
  PORTRAIT_MOUTH_Y,
  portraitHeadTop,
} from '../../src/game/art/portrait'
import { SKIN, shade } from '../../src/game/art/palette'
import { POSE_TABLE } from '../../src/game/art/poses'
import {
  PORTRAIT_BOX,
  PORTRAIT_HEAD_Y,
  PORTRAIT_SCALE,
  PORTRAIT_ZOOM,
  drawKindPortrait,
} from '../../src/game/art/registry'
import { BODY_X, applyBuild } from '../../src/game/art/rig'

/**
 * Portrait structure gates.
 *
 * `artquality.test.ts` records five "the face has marks on it" metrics that
 * were tried and dropped because none could FAIL when the marks were removed.
 * These are different in kind: each is a geometric property of a human face
 * that the art before it measurably did not have. Baseline, on the 3/4
 * portraits ART-9 replaced:
 *
 *   both eyes in one half   the nose reached 1.16 HW past a 1.02 half-width
 *   no mouth on 3 of 5      the beard covered it
 *   one hard tonal edge     the cel band crossed the face at x = +0.09 headR
 *   every mark one-sided    aperture, lash, eyeTilt and browAngle unmirrored
 *
 * All coordinates here are TEST-local: x and y both in headR units. The
 * drawing measures x in HW units, so a layout constant like `PORTRAIT_EYE_X`
 * is multiplied by `PORTRAIT_HW` to get here.
 */

const HEROES = Object.keys(HERO_FIGURES)
const TEX_W = PORTRAIT_BOX.width * PORTRAIT_SCALE
const TEX_H = PORTRAIT_BOX.height * PORTRAIT_SCALE
/** Eye centre, in headR units either side of the centre line. */
const EYE_X = PORTRAIT_EYE_X * PORTRAIT_HW

interface Shot {
  data: Uint8ClampedArray
  width: number
  height: number
  headR: number
  tex: (lx: number, ly: number) => [number, number]
  px: (x: number, y: number) => [number, number, number, number]
  isSkin: (p: readonly number[]) => boolean
}

const dist = (a: readonly number[], b: readonly number[]): number =>
  Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0))

const hex = (v: string): [number, number, number] => {
  const n = parseInt(v.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const luma = (p: readonly number[]): number =>
  0.299 * (p[0] ?? 0) + 0.587 * (p[1] ?? 0) + 0.114 * (p[2] ?? 0)

function shoot(kind: string, detail = true): Shot {
  const plan = HERO_FIGURES[kind] ?? ENEMY_FIGURES[kind]
  if (!plan) throw new Error(`no figure ${kind}`)
  const canvas = createCanvas(TEX_W, TEX_H)
  const ctx = canvas.getContext('2d')
  const ok = drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, kind, PORTRAIT_SCALE, detail)
  expect(ok, `${kind} portrait did not render`).toBe(true)
  const img = ctx.getImageData(0, 0, TEX_W, TEX_H)
  const headR = 10.4 * plan.build.head
  const built = applyBuild(POSE_TABLE.idle, plan.build)
  const base = plan.skin ?? SKIN
  // Skin is a GRADIENT now, so the exact nine-tone list the flat art used no
  // longer works: anything between the lit core and the shaded rim is legal.
  // Matched by hue family and a luma band around the complexion instead.
  const br = (base >> 16) & 255
  const bg = (base >> 8) & 255
  const bb = base & 255
  const darkest = shade(base, 0.42)
  const loLuma = luma([(darkest >> 16) & 255, (darkest >> 8) & 255, darkest & 255]) - 8
  const hiLuma = luma([br, bg, bb]) * 1.3 + 14
  const px = (x: number, y: number): [number, number, number, number] => {
    const i = (y * TEX_W + x) * 4
    return [img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0, img.data[i + 3] ?? 0]
  }
  return {
    data: img.data,
    width: TEX_W,
    height: TEX_H,
    headR,
    tex: (lx, ly) => [
      Math.round(
        (PORTRAIT_ZOOM * (built.head.x + lx * headR - BODY_X) + PORTRAIT_BOX.width / 2) * PORTRAIT_SCALE,
      ),
      Math.round((PORTRAIT_ZOOM * (ly * headR) + PORTRAIT_HEAD_Y) * PORTRAIT_SCALE),
    ],
    px,
    isSkin: (p) => {
      if ((p[3] ?? 0) <= 200) return false
      const l = luma(p)
      if (l < loLuma || l > hiLuma) return false
      // The same hue family as the complexion - every skin in the cast runs
      // red >= green >= blue. Rules out gear, hair, ink, sclera and iris.
      const r = p[0] ?? 0
      const g = p[1] ?? 0
      const b = p[2] ?? 0
      return r >= g && g >= b && r - b > (br - bb) * 0.35
    },
  }
}

/**
 * How much of one eye's width shows white, and how wide that white is in px.
 *
 * SCLERA only, and deliberately. Two other measurements were tried and both
 * failed for reasons worth recording:
 *   - the sclera bounding box's ASPECT works for a narrow eye and breaks for a
 *     round one. Zhang Fei's 环眼 is round BY DESIGN, so its iris nearly fills
 *     the opening and the only white left is corner slivers whose box is
 *     roughly square - it scored 1.20, inside the range of the cartoon eyes
 *     this file exists to reject, while the eye itself was correct.
 *   - measuring the whole aperture needs `IRIS`, which lands within 10 of
 *     Zhang Fei's shaded complexion and within 13 of Guan Yu's brow colour.
 *     No threshold separates those.
 * The warm white is far from every other tone in the cast, so it is the one
 * eye colour that can be matched safely.
 */
function scleraSpan(
  s: Shot,
  face: { eyeW: number; eyeAspect: number },
  side: 1 | -1,
): { px: number; share: number } {
  const white = hex(SCLERA)
  const w = EYE_BASE_W * face.eyeW * PORTRAIT_HW
  const h = w / face.eyeAspect
  const [bx0, by0] = s.tex(side * EYE_X - w * 0.7, PORTRAIT_EYE_Y - h * 0.7)
  const [bx1, by1] = s.tex(side * EYE_X + w * 0.7, PORTRAIT_EYE_Y + h * 0.7)
  let x0 = 1e9
  let x1 = -1
  for (let y = Math.min(by0, by1); y <= Math.max(by0, by1); y += 1) {
    for (let x = Math.min(bx0, bx1); x <= Math.max(bx0, bx1); x += 1) {
      if (x < 0 || y < 0 || x >= s.width || y >= s.height) continue
      if (dist(s.px(x, y), white) >= 24) continue
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
    }
  }
  if (x1 < 0) return { px: 0, share: 0 }
  const eyePx = w * s.headR * PORTRAIT_ZOOM * PORTRAIT_SCALE
  return { px: x1 - x0 + 1, share: (x1 - x0 + 1) / eyePx }
}

describe('portrait structure', () => {
  it('has skin between the brow and the headgear', () => {
    // A helmet whose brim reaches +0.34R - below the eyes - leaves none, which
    // is what two of the five heroes had.
    const MIN_FOREHEAD = 0.12
    for (const kind of HEROES) {
      const s = shoot(kind)
      let run = 0
      for (let ly = PORTRAIT_BROW_Y - 0.11; ly > PORTRAIT_BROW_Y - 0.5; ly -= 0.01) {
        const [x, y] = s.tex(EYE_X, ly)
        if (x < 0 || y < 0 || x >= s.width || y >= s.height) break
        if (!s.isSkin(s.px(x, y))) break
        run += 0.01
      }
      expect(
        run,
        `${kind}: the brow has no forehead above it - the face is on the headgear`,
      ).toBeGreaterThan(MIN_FOREHEAD)
    }
  })

  it('shows white in both eyes', () => {
    // The floor, not the ceiling: an eye that renders no sclera at all is
    // either missing or wholly covered. BOTH eyes - before ART-9 the far one
    // was a 66%-scaled copy and only the near one was ever measured.
    for (const kind of HEROES) {
      const plan = HERO_FIGURES[kind]
      if (!plan) continue
      const face = FACES[plan.face ?? 'plain']
      const s = shoot(kind)
      for (const side of [1, -1] as const) {
        const where = side > 0 ? 'right' : 'left'
        expect(
          scleraSpan(s, face, side).px,
          `${kind}: the ${where} eye shows no white`,
        ).toBeGreaterThan(3)
      }
    }
  })

  /*
   * A GATE THAT WAS DESIGNED, MEASURED AND DROPPED, recorded rather than
   * shipped - the same judgement `artquality.test.ts` records for five other
   * metrics.
   *
   * The defect the eye work exists to reject is the googly disc: white all
   * round a floating iris, instead of a lid cutting it so white shows only at
   * the corners. The obvious probe is "count sclera directly above the iris",
   * and it does not work: on correct art it returns 2, 4, 6, 4, 2 for the five
   * heroes - anti-aliasing along the lid on an eye 6.7px tall for Guan Yu - and
   * a disc would have to score below that to be rejected.
   *
   * What makes the disc impossible here is structural rather than measured:
   * `portraitEye` draws the iris inside a CLIP of the aperture, so white cannot
   * appear above it unless the aperture itself is round - and `scleraSpan`
   * below is what watches the aperture's shape.
   */

  it('separates the historical eye shapes', () => {
    // 环眼 against 丹凤眼. A narrow eye shows white across most of its width;
    // a round one is nearly filled by its own iris. Measured: Guan Yu 0.72,
    // Zhang Fei 0.20. These differed by eyeW and eyeH alone before, and that
    // difference vanished once both were drawn as circles.
    expect(FACES.fierce.eyeAspect, 'Zhang Fei 环眼 must be rounder than Guan Yu 丹凤眼').toBeLessThan(
      FACES.phoenix.eyeAspect,
    )
    const span = (kind: string): number => {
      const plan = HERO_FIGURES[kind]
      if (!plan) throw new Error(kind)
      return scleraSpan(shoot(kind), FACES[plan.face ?? 'plain'], 1).share
    }
    expect(
      span('zhangfei'),
      'Zhang Fei 环眼 should show visibly less white across its width than Guan Yu 丹凤眼',
    ).toBeLessThan(span('guanyu') - 0.3)
  })

  it('draws the face symmetrically', () => {
    // Replaces the nose-profile gate, which required a protruding 3/4 nose and
    // is impossible on a frontal head. Strictly stronger for the design that
    // replaced it: the 3/4 art put both eyes in one half of the head and
    // applied the aperture, lash, eyeTilt and browAngle with ONE sign to both
    // sides, so it fails this by a wide margin.
    //
    // Xiahou Dun is excluded, and that is not a fudge - he is missing an eye,
    // and measures 21.5 where the heroes measure 7.9-11.8.
    const MAX_MIRROR = 16
    for (const kind of HEROES) {
      const s = shoot(kind)
      const [cx] = s.tex(0, 0)
      const [, y0] = s.tex(0, -0.35)
      const [, y1] = s.tex(0, 0.85)
      const reach = Math.round(0.5 * s.headR * PORTRAIT_ZOOM * PORTRAIT_SCALE)
      let total = 0
      let n = 0
      for (let y = y0; y <= y1; y += 1) {
        for (let k = 3; k < reach; k += 1) {
          const a = s.px(cx + k, y)
          const b = s.px(cx - k, y)
          if ((a[3] ?? 0) < 200 || (b[3] ?? 0) < 200) continue
          total += dist(a, b)
          n += 1
        }
      }
      expect(n, `${kind}: nothing sampled for symmetry`).toBeGreaterThan(500)
      expect(
        total / n,
        `${kind}: the two halves of the face do not match (${(total / n).toFixed(1)})`,
      ).toBeLessThan(MAX_MIRROR)
    }
  })

  it('shades the face smoothly, not as one flat field', () => {
    // Replaces the cheek-vs-temple gate, which on a symmetric head passes
    // trivially - and, being one-sided, actively REWARDED the vertical tonal
    // split this work removed.
    //
    // Measured on the FOREHEAD, which is the one sizeable patch of face with
    // no feature drawn on it. Counting tones over the whole face was tried
    // first and cannot fail: the eyes, brows, lips, nose and age lines are all
    // skin-family tones and carry the count on their own, so flattening the
    // skin entirely still scored above any usable threshold. Across the
    // forehead the separation is absolute - 10.3 to 12.3 luma with the
    // gradient, and exactly 0.0 with a flat fill.
    const MIN_RANGE = 5
    for (const kind of HEROES) {
      const s = shoot(kind)
      const [x0, y0] = s.tex(-0.3, PORTRAIT_BROW_Y - 0.26)
      const [x1, y1] = s.tex(0.3, PORTRAIT_BROW_Y - 0.1)
      let lo = 999
      let hi = -1
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const p = s.px(x, y)
          if ((p[3] ?? 0) < 200) continue
          lo = Math.min(lo, luma(p))
          hi = Math.max(hi, luma(p))
        }
      }
      expect(hi, `${kind}: nothing sampled on the forehead`).toBeGreaterThan(0)
      expect(
        hi - lo,
        `${kind}: the forehead is one flat tone (range ${(hi - lo).toFixed(1)})`,
      ).toBeGreaterThan(MIN_RANGE)
    }
  })

  it('keeps the bridge between the eyes lit, not smudged', () => {
    // ART-16. Every gradient in `paintSkin` faded to 'rgba(0,0,0,0)', and
    // canvas interpolates stops unpremultiplied - so the fading edge of the
    // bridge HIGHLIGHT, and of both eye sockets, was translucent near-black.
    // The result was a grey-brown ring round the eyes and across the bridge
    // on all seventeen portraits, which read as dirt. On a lit frontal face
    // the bridge between the eyes is a raised plane and at least as bright as
    // the forehead; with the smudge it measured 0.81 to 0.91 of it, and after
    // the fix 1.005 to 1.05. Troops and bosses too: the smudge was cast-wide.
    const MIN_RATIO = 0.96
    const mean = (s: Shot, x0: number, y0: number, x1: number, y1: number): number => {
      const [a, b] = s.tex(x0, y0)
      const [c, d] = s.tex(x1, y1)
      let sum = 0
      let n = 0
      for (let y = b; y <= d; y += 1) {
        for (let x = a; x <= c; x += 1) {
          sum += luma(s.px(x, y))
          n += 1
        }
      }
      return sum / n
    }
    for (const kind of [...HEROES, ...Object.keys(ENEMY_FIGURES)]) {
      const s = shoot(kind)
      const bridge = mean(s, -0.08, PORTRAIT_EYE_Y - 0.08, 0.08, PORTRAIT_EYE_Y + 0.06)
      const forehead = mean(s, -0.24, PORTRAIT_BROW_Y - 0.22, 0.24, PORTRAIT_BROW_Y - 0.12)
      expect(
        bridge / forehead,
        `${kind}: the bridge between the eyes is ${(bridge / forehead).toFixed(3)} of the forehead - a smudge`,
      ).toBeGreaterThan(MIN_RATIO)
    }
  })

  it('gives every hero a visible mouth', () => {
    // Three of five had none: the beard swallowed it. Looks for the dark
    // horizontal run of the ink lip separation on the mouth line.
    const MIN_RUN = 12
    for (const kind of HEROES) {
      const s = shoot(kind)
      let best = 0
      for (let ly = PORTRAIT_MOUTH_Y - 0.06; ly <= PORTRAIT_MOUTH_Y + 0.06; ly += 0.01) {
        const [, y] = s.tex(0, ly)
        let run = 0
        for (let lx = -0.45; lx <= 0.45; lx += 0.01) {
          const [x] = s.tex(lx, ly)
          if (x < 0 || y < 0 || x >= s.width || y >= s.height) continue
          const p = s.px(x, y)
          if ((p[3] ?? 0) > 200 && luma(p) < 70) {
            run += 1
            best = Math.max(best, run)
          } else {
            run = 0
          }
        }
      }
      expect(best, `${kind}: no mouth found on the mouth line`).toBeGreaterThanOrEqual(MIN_RUN)
    }
  })

  it('frames every hero identically', () => {
    // `drawKindPortrait` anchored on the RAW pose head while `applyBuild` moves
    // it by the hero's height - a 42px spread in a 240px frame, four of five
    // clipped at the top. Measured from the RENDERED eye line, not from the
    // transform: an earlier version recomputed the expected position with the
    // same arithmetic as the code it tested, so reverting the bug moved the
    // prediction too and the gate could not fail.
    const white = hex(SCLERA)
    const centres = HEROES.map((kind) => {
      const s = shoot(kind)
      let y0 = 1e9
      let y1 = -1
      for (let y = 0; y < s.height; y += 1) {
        for (let x = 0; x < s.width; x += 1) {
          if (dist(s.px(x, y), white) > 24) continue
          y0 = Math.min(y0, y)
          y1 = Math.max(y1, y)
        }
      }
      expect(y1, `${kind}: no sclera anywhere in the portrait`).toBeGreaterThan(0)
      return Math.round((y0 + y1) / 2 - PORTRAIT_EYE_Y * s.headR * PORTRAIT_ZOOM * PORTRAIT_SCALE)
    })
    const spread = Math.max(...centres) - Math.min(...centres)
    expect(spread, `heads land at different heights (${centres.join(', ')})`).toBeLessThanOrEqual(6)
  })

  it('fits every head and headgear inside the frame', () => {
    // Geometry rather than pixels, deliberately: at the top of the frame a
    // helmet crest and a glaive blade are both opaque, and a glaive running
    // out of frame is correct framing rather than a cropped head. No pixel
    // test can tell them apart.
    const inkHalf = INK_W * PORTRAIT_ZOOM * PORTRAIT_SCALE
    for (const kind of HEROES) {
      const plan = HERO_FIGURES[kind]
      if (!plan) throw new Error(`no hero ${kind}`)
      const headR = 10.4 * plan.build.head
      const top = portraitHeadTop(plan.headgear)
      const deviceY = (PORTRAIT_ZOOM * (top * headR) + PORTRAIT_HEAD_Y) * PORTRAIT_SCALE
      expect(
        deviceY - inkHalf,
        `${kind}: the headgear is cropped by the top of the frame (${deviceY.toFixed(1)}px)`,
      ).toBeGreaterThan(2)
      expect(deviceY, `${kind}: the head is framed far too low`).toBeLessThan(TEX_H * 0.25)
    }
  })

  it('leaves the one-eyed general one eye', () => {
    // 夏侯惇 Xiahou Dun lost an eye: a socket on one side, a NORMAL eye on the
    // other. Both passes have to agree, and for a while they did not - the
    // portrait had both eyes inside the `else`, which left him with a socket
    // and no eye at all. No screen shows a boss portrait, so nothing but this
    // exercises the branch.
    const s = shoot('xiahoudun')
    const white = hex(SCLERA)
    const sclera = (lx: number): number => {
      let n = 0
      for (let dx = -0.12; dx <= 0.12; dx += 0.01) {
        for (let dy = -0.08; dy <= 0.08; dy += 0.01) {
          const [x, y] = s.tex(lx + dx, PORTRAIT_EYE_Y + dy)
          if (x < 0 || y < 0 || x >= s.width || y >= s.height) continue
          if (dist(s.px(x, y), white) < 24) n += 1
        }
      }
      return n
    }
    expect(sclera(-EYE_X), 'the good eye is missing').toBeGreaterThan(8)
    expect(sclera(EYE_X), 'the wounded socket was drawn as an eye').toBe(0)
  })

  it('actually paints the portrait face pass', () => {
    // The general form of the ART-5 check: a pass that traces paths without
    // filling them produces a portrait identical to one drawn without it. No
    // duplicated geometry, so unlike the gate it replaced it cannot drift.
    for (const kind of HEROES) {
      const full = shoot(kind, true)
      const bare = shoot(kind, false)
      const [x0, y0] = full.tex(-0.6, -0.35)
      const [x1, y1] = full.tex(0.6, 0.8)
      let differing = 0
      let total = 0
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          if (x < 0 || y < 0 || x >= full.width || y >= full.height) continue
          total += 1
          const i = (y * full.width + x) * 4
          const a = [full.data[i] ?? 0, full.data[i + 1] ?? 0, full.data[i + 2] ?? 0]
          const b = [bare.data[i] ?? 0, bare.data[i + 1] ?? 0, bare.data[i + 2] ?? 0]
          if (dist(a, b) > 20) differing += 1
        }
      }
      expect(total, `${kind}: empty face window`).toBeGreaterThan(1000)
      expect(
        differing / total,
        `${kind}: the face pass changed almost nothing - it is tracing without painting`,
      ).toBeGreaterThan(0.05)
    }
  })
})
