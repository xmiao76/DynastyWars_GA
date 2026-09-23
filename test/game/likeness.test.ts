import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { headRadius } from '../../src/game/art/draw'
import { FACES } from '../../src/game/art/faces'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import { PORTRAIT_HW } from '../../src/game/art/portrait'
import {
  PORTRAIT_BOX,
  PORTRAIT_HEAD_Y,
  PORTRAIT_SCALE,
  PORTRAIT_ZOOM,
  artBoxFor,
  drawKindPortrait,
  drawKindPose,
} from '../../src/game/art/registry'
import { BODY_X, FIG_H, FIG_W, applyBuild } from '../../src/game/art/rig'

/**
 * ART-17: the cast looks as the histories describe it.
 *
 * Each gate names the 三国演义 description it checks and is FALSIFIED against
 * the art before ART-17 - see PROGRESS.md for the measured before/after. These
 * are likeness gates, not style gates: they check the one detail the sources
 * single a character out for, and nothing else about how it is drawn.
 */

const SCALE = 2
const plans: Record<string, FigurePlan> = { ...HERO_FIGURES, ...ENEMY_FIGURES }

function planOf(kind: string): FigurePlan {
  const p = plans[kind]
  if (!p) throw new Error(`no figure ${kind}`)
  return p
}

/**
 * How far above the head centre the figure's outline reaches, in headR, over
 * the column BEHIND the face (-3R..+0.3R). The weapon is held forward of the
 * head in `idle`, so it stays out of the column; headgear and plumes do not.
 */
function headgearReach(kind: string): number {
  const plan = planOf(kind)
  const box = artBoxFor(kind, 'idle')
  if (!box) throw new Error(`no art box for ${kind}`)
  const canvas = createCanvas(box.width * SCALE, box.height * SCALE)
  const ctx = canvas.getContext('2d')
  drawKindPose(ctx as unknown as CanvasRenderingContext2D, kind, 'idle', SCALE)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const built = applyBuild(POSE_TABLE.idle, plan.build)
  const r = headRadius(plan) * SCALE
  const hx = ((box.width - FIG_W) / 2 + built.head.x) * SCALE
  const hy = (box.height - FIG_H + built.head.y) * SCALE
  const x0 = Math.max(0, Math.round(hx - 3 * r))
  const x1 = Math.min(img.width - 1, Math.round(hx + 0.3 * r))
  for (let y = 0; y < hy; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if ((img.data[(y * img.width + x) * 4 + 3] ?? 0) >= 128) return (hy - y) / r
    }
  }
  return 0
}

describe('the cast looks as the histories describe it', () => {
  it("Lu Bu wears his own plumed crown, not Cao Cao's", () => {
    // 头戴三叉束发紫金冠 ... 雉尾 - the three-pronged purple-gold crown with
    // pheasant-tail plumes. Before ART-17 both villains wore `crown`, and the
    // two outlines topped out within a few hundredths of a head of each other.
    const lubu = headgearReach('lubu')
    const caocao = headgearReach('caocao')
    expect(
      lubu - caocao,
      `Lu Bu's plumes should rise well clear of Cao Cao's crown (${lubu.toFixed(2)}R vs ${caocao.toFixed(2)}R)`,
    ).toBeGreaterThan(1)
    expect(planOf('lubu').headgear, 'Lu Bu and Cao Cao share a headgear kind').not.toBe(
      planOf('caocao').headgear,
    )
  })

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

  it("Cao Cao has the narrowest eyes in the cast", () => {
    // 细眼长髯 - narrow eyes and a long beard. He shared `sharp` with Wei Yan and
    // Xu Huang, whose aperture is ROUNDER than Guan Yu's phoenix eye, so the one
    // man the sources name for narrow eyes had some of the widest in the cast.
    const cao = FACES[planOf('caocao').face ?? 'plain']
    for (const [kind, plan] of Object.entries(plans)) {
      if (kind === 'caocao') continue
      const f = FACES[plan.face ?? 'plain']
      if ((plan.face ?? 'plain') === (planOf('caocao').face ?? 'plain')) {
        throw new Error(`${kind} shares Cao Cao's eye shape`)
      }
      // Both passes: the portrait's aperture ratio and the in-play eye height.
      expect(cao.eyeAspect, `${kind}'s portrait eye is as narrow as Cao Cao's`).toBeGreaterThan(f.eyeAspect)
      expect(cao.eyeH, `${kind}'s in-play eye is as narrow as Cao Cao's`).toBeLessThan(f.eyeH)
    }
    expect(planOf('caocao').beard, 'Cao Cao is 长髯, long-bearded').toBe('long')
  })
})