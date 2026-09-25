import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { materials } from '../../src/game/art/palette'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild } from '../../src/game/art/rig'
import type { HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'

/**
 * BODY-11 measurable acceptance: no straight procedural sash/belt bars
 * over painted waists, in any pose. The bars are exact m.trim / m.leather
 * flat fills - tones the painted art never reproduces exactly - so the
 * count must be zero on paper-doll fighters and positive on the
 * procedural-body control (the bars still belong to cel bodies).
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const POSES = Object.keys(POSE_TABLE) as PoseName[]

const PAINTED: Array<{ id: string; bodyDir: 'hero-bodies' | 'mook-bodies' | 'boss-bodies' }> = [
  { id: 'guanyu', bodyDir: 'hero-bodies' },
  { id: 'zhangfei', bodyDir: 'hero-bodies' },
  { id: 'zhaoyun', bodyDir: 'hero-bodies' },
  { id: 'huangzhong', bodyDir: 'hero-bodies' },
  { id: 'weiyan', bodyDir: 'hero-bodies' },
  { id: 'soldier', bodyDir: 'mook-bodies' },
  { id: 'spearman', bodyDir: 'mook-bodies' },
  { id: 'archer', bodyDir: 'mook-bodies' },
  { id: 'lubu', bodyDir: 'boss-bodies' },
  { id: 'caocao', bodyDir: 'boss-bodies' },
  { id: 'xiahoudun', bodyDir: 'boss-bodies' },
  { id: 'xuchu', bodyDir: 'boss-bodies' },
  { id: 'zhangliao', bodyDir: 'boss-bodies' },
  { id: 'caoren', bodyDir: 'boss-bodies' },
  { id: 'xuhuang', bodyDir: 'boss-bodies' },
  { id: 'zhanghe', bodyDir: 'boss-bodies' },
  { id: 'lidian', bodyDir: 'boss-bodies' },
]

async function loadBody(id: string, dir: string): Promise<BodyArt | undefined> {
  const m = (await import(`../../src/game/assets/${dir}/prepared.json`)).default as Record<string, {
    revision: string; skin: string; density: number; parts: BodyArt['parts']
  }>
  const meta = m[id]
  if (!meta) return undefined
  const sheet = (await loadImage(`src/game/assets/${dir}/${id}-sheet.png`)) as unknown as CanvasImageSource
  return {
    id, revision: meta.revision, sheet, density: meta.density, parts: meta.parts,
    skin: parseInt(meta.skin.slice(1), 16),
  }
}

function waistBarCount(plan: FigurePlan, data: Uint8ClampedArray, W: number): number {
  const m = materials(plan.body, plan.trim, plan.gear, plan.beardColor ?? 0x3a2a18, plan.skin)
  const parse = (cssColor: string): [number, number, number] => {
    const s = cssColor.slice(1)
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  }
  const tones = [parse(m.trim), parse(m.leather)]
  const pose = applyBuild(POSE_TABLE.idle, plan.build)
  const hip = pose.hip
  // Count BAR FRAGMENTS: horizontal runs of one procedural tone >= 20px
  // (10 logical units). A straight bar is runs; painted-gradient edges may
  // collide with a tone hex for a pixel or two and are not bars.
  let runs = 0
  for (let y = Math.round((hip.y - 6) * SCALE); y <= Math.round((hip.y + 3) * SCALE); y += 1) {
    let runTone = -1
    let runLen = 0
    for (let x = Math.round((hip.x - 12) * SCALE); x <= Math.round((hip.x + 11) * SCALE); x += 1) {
      const p = (y * W + x) * 4
      let tone = -1
      if ((data[p + 3] ?? 0) >= 128) {
        for (const [ti, t] of tones.entries()) {
          if (data[p] === t[0] && data[p + 1] === t[1] && data[p + 2] === t[2]) tone = ti
        }
      }
      if (tone >= 0 && tone === runTone) {
        runLen += 1
      } else {
        if (runLen >= 20) runs += 1
        runTone = tone
        runLen = tone >= 0 ? 1 : 0
      }
    }
    if (runLen >= 20) runs += 1
  }
  return runs
}

function renderFighter(id: string, plan: FigurePlan, body?: BodyArt, head?: HeroArt): Uint8ClampedArray {
  const canvas = createCanvas(120 * SCALE, 110 * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  const painted = head || body ? { art: head, poseName: 'idle' as PoseName, body } : undefined
  drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE.idle, painted)
  return ctx.getImageData(0, 0, 120 * SCALE, 110 * SCALE).data
}

describe('BODY-11 no procedural bars over painted waists', () => {
  it.each(PAINTED.map((f) => [f.id, f] as const))('%s: zero procedural waist bars in any pose', async (id, f) => {
    const plan: FigurePlan = (HERO_FIGURES[id] ?? ENEMY_FIGURES[id])!
    const body = await loadBody(id, f.bodyDir)
    expect(body, `${id} body pack missing`).toBeTruthy()
    for (const poseName of POSES) {
      const canvas = createCanvas(120 * SCALE, 110 * SCALE)
      const ctx = canvas.getContext('2d')
      ctx.scale(SCALE, SCALE)
      drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[poseName], { poseName, body })
      const data = ctx.getImageData(0, 0, 120 * SCALE, 110 * SCALE).data
      const n = waistBarCount(plan, data, 120 * SCALE)
      expect(n, `${id}:${poseName} still draws ${n} procedural waist-bar fragments`).toBe(0)
    }
  }, 30_000)

  it('procedural-body fighters keep their waist details (control)', () => {
    // Boss bodies are still cel-painted; their belt/sash bars belong there.
    const plan: FigurePlan = ENEMY_FIGURES['caocao']!
    const data = renderFighter('caocao', plan)
    expect(waistBarCount(plan, data, 120 * SCALE), 'control lost its waist details').toBeGreaterThan(0)
  })
})
