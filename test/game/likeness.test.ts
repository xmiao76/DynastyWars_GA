import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure, headRadius } from '../../src/game/art/draw'
import { FACES } from '../../src/game/art/faces'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import mookPrepared from '../../src/game/assets/mook-bodies/prepared.json'
import { PORTRAIT_HW } from '../../src/game/art/portrait'
import {
  PORTRAIT_BOX,
  PORTRAIT_HEAD_Y,
  PORTRAIT_SCALE,
  PORTRAIT_ZOOM,
  drawKindPortrait,
} from '../../src/game/art/registry'
import { BODY_X, applyBuild } from '../../src/game/art/rig'

/**
 * ART-17: the cast looks as the histories describe it.
 *
 * Each gate names the 三国演义 description it checks and is FALSIFIED against
 * the art before ART-17 - see PROGRESS.md for the measured before/after. These
 * are likeness gates, not style gates: they check the one detail the sources
 * single a character out for, and nothing else about how it is drawn.
 */

const plans: Record<string, FigurePlan> = { ...HERO_FIGURES, ...ENEMY_FIGURES }

function planOf(kind: string): FigurePlan {
  const p = plans[kind]
  if (!p) throw new Error(`no figure ${kind}`)
  return p
}

describe('the cast looks as the histories describe it', () => {
  it("Zhang Fei's beard bristles instead of hanging as a smooth wedge", () => {
    // 燕颔虎须 - tiger whiskers, standing out from the jaw in spikes. Measured on
    // the PORTRAIT, the one view of him that shows the whole beard: on the
    // in-play sprite it sits behind his near arm, as every beard does.
    //
    // The beard's outer edge, row by row: the outermost beard pixel on the
    // right half. A wedge narrows steadily; whiskers go out and back in, and
    // every spike is two reversals of that edge.
    //
    // The beard is isolated as what the FACE PASS adds in beard colour: the
    // portrait rendered with and without it, differing, and within 20 of the
    // beard (INK is within 6 of it, so the beard's own outline counts). A plain
    // colour match is not enough - the neck, pauldron and body outlines are the
    // same near-black, and an outward scan ran on along the shoulder.
    const plan = planOf('zhangfei')
    const W = PORTRAIT_BOX.width * PORTRAIT_SCALE
    const H = PORTRAIT_BOX.height * PORTRAIT_SCALE
    const render = (detail: boolean): Uint8ClampedArray => {
      const canvas = createCanvas(W, H)
      const ctx = canvas.getContext('2d')
      drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, 'zhangfei', PORTRAIT_SCALE, detail)
      return ctx.getImageData(0, 0, W, H).data
    }
    const face = render(true)
    const bare = render(false)
    const built = applyBuild(POSE_TABLE.idle, plan.build)
    const R = headRadius(plan)
    const cx = Math.round((PORTRAIT_ZOOM * (built.head.x - BODY_X) + PORTRAIT_BOX.width / 2) * PORTRAIT_SCALE)
    const rowAt = (ly: number): number => Math.round((PORTRAIT_ZOOM * ly * R + PORTRAIT_HEAD_Y) * PORTRAIT_SCALE)
    const beard = plan.beardColor ?? 0
    const isBeard = (x: number, y: number): boolean => {
      const i = (y * W + x) * 4
      const toBeard = Math.hypot(
        (face[i] ?? 0) - ((beard >> 16) & 255),
        (face[i + 1] ?? 0) - ((beard >> 8) & 255),
        (face[i + 2] ?? 0) - (beard & 255),
      )
      const added = Math.hypot(
        (face[i] ?? 0) - (bare[i] ?? 0),
        (face[i + 1] ?? 0) - (bare[i + 1] ?? 0),
        (face[i + 2] ?? 0) - (bare[i + 2] ?? 0),
      )
      return (face[i + 3] ?? 0) >= 200 && added > 30 && toBeard < 20
    }
    // From below the moustache (which ends at +0.56R) to the bottom of the
    // frame, no wider than the jaw plus the longest spike could reach.
    const cap = Math.round(1.4 * PORTRAIT_HW * R * PORTRAIT_ZOOM * PORTRAIT_SCALE)
    const edges: number[] = []
    for (let y = rowAt(0.62); y < H; y += 1) {
      let edge = 0
      for (let x = cx; x <= Math.min(W - 1, cx + cap); x += 1) if (isBeard(x, y)) edge = x - cx
      edges.push(edge)
    }
    expect(edges.length, 'no beard rows sampled').toBeGreaterThan(20)
    expect(Math.max(...edges), 'no beard under the mouth at all').toBeGreaterThan(10)
    // Reversals with 3px of hysteresis, so antialiasing cannot count as a spike.
    let reversals = 0
    let dir = 0
    let pivot = edges[0] ?? 0
    for (const e of edges) {
      const d = e - pivot
      if (Math.abs(d) < 3) continue
      const s = Math.sign(d)
      if (dir !== 0 && s !== dir) reversals += 1
      dir = s
      pivot = e
    }
    expect(reversals, `Zhang Fei's beard edge reverses ${reversals} times - a smooth wedge, not 虎须`).toBeGreaterThanOrEqual(4)
  })

  it('rank and file carry no likeness fields, only measured complexions', () => {
    // 'plain' face and no likeness fields for the rank and file - but since
    // BODY-4 each mook carries a measured skin matching its painted pack
    // (see artquality), never the old shared tone and never a boss's face.
    for (const kind of ['soldier', 'spearman', 'archer']) {
      const t = planOf(kind)
      expect([t.face, t.lips, t.jaw], `${kind} gained a likeness`).toEqual([
        undefined, undefined, undefined,
      ])
      const recorded = (mookPrepared as Record<string, { skin: string }>)[kind]?.skin
      expect(t.skin, `${kind} lost its measured complexion`).toBe(
        recorded ? parseInt(recorded.slice(1), 16) : undefined,
      )
    }
  })

  it("Guan Yu's beard reaches his chest on the in-play sprite", () => {
    // 髯长二尺 - a beard two feet long. The portrait runs it off the frame; on
    // the sprite it hangs behind the near arm, so what counts is how far down
    // the VISIBLE beard reaches: the render with his beard against the same
    // figure without one, lowest differing row, in figure units below the
    // chest joint.
    const S = 4
    const W = 120
    const H = 130
    const OY = 20
    const draw = (p: FigurePlan): Uint8ClampedArray => {
      const canvas = createCanvas(W * S, H * S)
      const ctx = canvas.getContext('2d')
      ctx.scale(S, S)
      ctx.translate(10, OY)
      drawFigure(ctx as unknown as CanvasRenderingContext2D, p, POSE_TABLE.idle)
      return ctx.getImageData(0, 0, W * S, H * S).data
    }
    const plan = planOf('guanyu')
    const a = draw(plan)
    const b = draw({ ...plan, beard: 'none' })
    let lowest = -1
    for (let i = 0; i < W * S * H * S; i += 1) {
      const d =
        Math.abs((a[i * 4] ?? 0) - (b[i * 4] ?? 0)) +
        Math.abs((a[i * 4 + 1] ?? 0) - (b[i * 4 + 1] ?? 0)) +
        Math.abs((a[i * 4 + 2] ?? 0) - (b[i * 4 + 2] ?? 0))
      if (d > 40) lowest = Math.max(lowest, Math.floor(i / (W * S)))
    }
    const below = lowest / S - OY - applyBuild(POSE_TABLE.idle, plan.build).chest.y
    expect(
      below,
      `Guan Yu's visible beard ends ${below.toFixed(1)} units below his chest joint - not down the chest`,
    ).toBeGreaterThan(14)
  })

  it("Guan Yu's lips are rouge-red against his red face", () => {
    // 唇若涂脂 - "lips as if painted with rouge". On a face already 面如重枣, a
    // lip toned from the complexion comes out BROWNER than the skin round it:
    // measured before ART-17 the lower lip was less saturated red than the
    // cheek beside it. Rouge is the reverse - clearly redder than the face.
    const plan = planOf('guanyu')
    const W = PORTRAIT_BOX.width * PORTRAIT_SCALE
    const H = PORTRAIT_BOX.height * PORTRAIT_SCALE
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, 'guanyu', PORTRAIT_SCALE)
    const img = ctx.getImageData(0, 0, W, H).data
    const built = applyBuild(POSE_TABLE.idle, plan.build)
    const R = headRadius(plan)
    const tex = (lx: number, ly: number): number => {
      const x = Math.round(
        (PORTRAIT_ZOOM * (built.head.x + lx * PORTRAIT_HW * R - BODY_X) + PORTRAIT_BOX.width / 2) * PORTRAIT_SCALE,
      )
      const y = Math.round((PORTRAIT_ZOOM * ly * R + PORTRAIT_HEAD_Y) * PORTRAIT_SCALE)
      return (y * W + x) * 4
    }
    // Redness: how far red stands above the other two channels.
    const redness = (i: number): number => (img[i] ?? 0) - ((img[i + 1] ?? 0) + (img[i + 2] ?? 0)) / 2
    // The lower lip's lit centre (mouthY + 0.1) and the cheek beside the mouth.
    const lip = redness(tex(0, 0.72))
    const cheek = redness(tex(0.55, 0.4))
    expect(
      lip - cheek,
      `Guan Yu's lip (redness ${lip.toFixed(0)}) is not redder than his cheek (${cheek.toFixed(0)})`,
    ).toBeGreaterThan(40)
  })

  it('Zhao Yun has the heaviest brows, largest calm eyes and broadest jaw', () => {
    // 浓眉大眼, 阔面重颐 - thick brows, large eyes, a broad face and full jaw.
    // He shared `calm` with three bosses: lighter brows than Guan Yu (1.32) or
    // Huang Zhong (1.35), and the default head outline.
    const zy = planOf('zhaoyun')
    const f = FACES[zy.face ?? 'plain']
    const fair = (p: FigurePlan): boolean => {
      const s = p.skin ?? 0
      const l = 0.299 * ((s >> 16) & 255) + 0.587 * ((s >> 8) & 255) + 0.114 * (s & 255)
      return p.skin !== undefined && l > 180
    }
    for (const [kind, plan] of Object.entries(plans)) {
      if (kind === 'zhaoyun') continue
      const g = FACES[plan.face ?? 'plain']
      // 浓眉: the heaviest brow in the WHOLE cast, not only the fair-skinned.
      expect(f.browWeight, `${kind}'s brows are as heavy as Zhao Yun's`).toBeGreaterThan(g.browWeight)
      // 大眼: the largest eye of every face that is not the round 环眼 glare.
      if (plan.face !== 'fierce') {
        expect(f.eyeW * f.eyeH, `${kind}'s in-play eye is as large as Zhao Yun's`).toBeGreaterThan(g.eyeW * g.eyeH)
        expect(f.eyeW, `${kind}'s portrait eye is as wide as Zhao Yun's`).toBeGreaterThan(g.eyeW)
      }
    }
    expect(fair(zy), 'Zhao Yun should be one of the fair-skinned cast').toBe(true)

    // 阔面: the jaw, measured on the rendered portrait - the width of the skin
    // at the jaw angle's row, against Wei Yan, who has the default outline and
    // an almost identical head radius (0.99 vs 1.0).
    const jawWidth = (kind: string): number => {
      const plan = planOf(kind)
      const W = PORTRAIT_BOX.width * PORTRAIT_SCALE
      const H = PORTRAIT_BOX.height * PORTRAIT_SCALE
      const render = (detail: boolean): Uint8ClampedArray => {
        const canvas = createCanvas(W, H)
        const ctx = canvas.getContext('2d')
        drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, kind, PORTRAIT_SCALE, detail)
        return ctx.getImageData(0, 0, W, H).data
      }
      const face = render(false)
      const R = headRadius(plan)
      const y = Math.round((PORTRAIT_ZOOM * 0.7 * R + PORTRAIT_HEAD_Y) * PORTRAIT_SCALE)
      const s = plan.skin ?? 0
      let n = 0
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4
        const d = Math.hypot(
          (face[i] ?? 0) - ((s >> 16) & 255),
          (face[i + 1] ?? 0) - ((s >> 8) & 255),
          (face[i + 2] ?? 0) - (s & 255),
        )
        if ((face[i + 3] ?? 0) >= 200 && d < 40) n += 1
      }
      return n / (R * PORTRAIT_ZOOM * PORTRAIT_SCALE)
    }
    const zyJaw = jawWidth('zhaoyun')
    const wyJaw = jawWidth('weiyan')
    expect(
      zyJaw / wyJaw,
      `Zhao Yun's jaw (${zyJaw.toFixed(2)}R) should be clearly broader than Wei Yan's (${wyJaw.toFixed(2)}R)`,
    ).toBeGreaterThan(1.06)
  })
})