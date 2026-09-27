import { createCanvas } from '@napi-rs/canvas'
import { it } from 'vitest'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE } from '../../src/game/art/poses'
import { PORTRAIT_BOX, PORTRAIT_HEAD_Y, PORTRAIT_SCALE, PORTRAIT_ZOOM, drawKindPortrait } from '../../src/game/art/registry'
import { BODY_X, applyBuild } from '../../src/game/art/rig'

const TEX_W = PORTRAIT_BOX.width * PORTRAIT_SCALE
const TEX_H = PORTRAIT_BOX.height * PORTRAIT_SCALE
const luma = (p: number[]): number => 0.299 * p[0]! + 0.587 * p[1]! + 0.114 * p[2]!

it('smudge probe', () => {
  const out: string[] = []
  for (const kind of [...Object.keys(HERO_FIGURES), ...Object.keys(ENEMY_FIGURES)]) {
    const plan = HERO_FIGURES[kind] ?? ENEMY_FIGURES[kind]!
    const c = createCanvas(TEX_W, TEX_H)
    const ctx = c.getContext('2d')
    if (!drawKindPortrait(ctx as unknown as CanvasRenderingContext2D, kind, PORTRAIT_SCALE)) continue
    const img = ctx.getImageData(0, 0, TEX_W, TEX_H)
    const R = 10.4 * plan.build.head
    const b = applyBuild(POSE_TABLE.idle, plan.build)
    const tex = (lx: number, ly: number): [number, number] => [
      Math.round((PORTRAIT_ZOOM * (b.head.x + lx * R - BODY_X) + PORTRAIT_BOX.width / 2) * PORTRAIT_SCALE),
      Math.round((PORTRAIT_ZOOM * (ly * R) + PORTRAIT_HEAD_Y) * PORTRAIT_SCALE),
    ]
    const mean = (x0: number, y0: number, x1: number, y1: number): number => {
      const [a, bb] = tex(x0, y0)
      const [cc, d] = tex(x1, y1)
      let s = 0
      let n = 0
      for (let y = bb; y <= d; y += 1) for (let x = a; x <= cc; x += 1) {
        const i = (y * TEX_W + x) * 4
        s += luma([img.data[i]!, img.data[i + 1]!, img.data[i + 2]!])
        n += 1
      }
      return s / n
    }
    const between = mean(-0.08, -0.08, 0.08, 0.06)
    const forehead = mean(-0.24, -0.5, 0.24, -0.4)
    out.push(`${kind} between/forehead ${(between / forehead).toFixed(3)}`)
  }
  console.log('SMUDGE\n' + out.join('\n'))
})
