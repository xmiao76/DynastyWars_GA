import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { FACES } from '../../src/game/art/faces'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import mookPrepared from '../../src/game/assets/mook-bodies/prepared.json'
import { applyBuild } from '../../src/game/art/rig'

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
  // RETIRED by D0: procedural-portrait beard/lip/jaw gates, not painted-art passes.
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

  it('Zhao Yun has the heaviest brows and largest calm eyes', () => {
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

    // Procedural portrait jaw comparison retired by D0; rig likeness above remains.
  })
})
