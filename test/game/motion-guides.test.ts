import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { GUAN_YU } from '../../src/core/characters'
import { headRadius } from '../../src/game/art/draw'
import { HERO_FIGURES, type FigurePlan } from '../../src/game/art/figures'
import { HEAD_PAINTED_SCALE } from '../../src/game/art/hero-resources'
import { lerpSkeleton } from '../../src/game/art/interpolate'
import { materials } from '../../src/game/art/palette'
import { POSE_TABLE } from '../../src/game/art/poses'
import { applyBuild, chainPath, FIG_H, ovalPath, polyPath, type Pt, type Skeleton } from '../../src/game/art/rig'
import { addWeapon, weaponPose } from '../../src/game/art/weapons'

const OUT = 'art/motion/guanyu'
const BOX = { width: 224, height: 144, ox: 64, oy: 44, groundY: 136 }
const CELL = { width: 512, height: 341 }
const PERIOD = 32
const plan = HERO_FIGURES.guanyu!

function mannequin(g: CanvasRenderingContext2D, p: Skeleton, plan: FigurePlan): void {
  const b = plan.build.bulk
  const fill = (trace: () => void, col: string): void => {
    trace(); g.fillStyle = col; g.fill(); g.lineWidth = 0.7; g.strokeStyle = '#303038'; g.stroke()
  }
  fill(() => chainPath(g, [p.hipF, p.kneeF, p.footF], [12 * b, 9.5 * b, 7 * b]), '#606068')
  fill(() => ovalPath(g, { x: p.footF.x + 2.5, y: p.footF.y - 2 }, 5, 2), '#606068')
  fill(() => chainPath(g, [p.shoulderF, p.elbowF, p.handF], [8.5 * b, 7 * b, 5.4 * b]), '#606068')
  fill(() => polyPath(g, [p.shoulderF, p.shoulderN, p.hipN, p.hipF]), '#82828a')
  fill(() => chainPath(g, [p.hipN, p.kneeN, p.footN], [12.5 * b, 10 * b, 7.5 * b]), '#aaaab2')
  fill(() => ovalPath(g, { x: p.footN.x + 2.5, y: p.footN.y - 2 }, 5.2, 2), '#aaaab2')
  const r = headRadius(plan) * HEAD_PAINTED_SCALE * 1.15
  fill(() => ovalPath(g, p.head, r * 0.85, r, p.headRot), '#82828a')
  const shapes: Array<(c: CanvasRenderingContext2D) => void> = []
  addWeapon((t) => shapes.push(t), plan, p, materials(0xaaaaae, 0xaaaaae, 0xaaaaae, 0xaaaaae, 0xaaaaae))
  for (const t of shapes) { g.save(); fill(() => t(g), '#ceced2'); g.restore() }
  fill(() => chainPath(g, [p.shoulderN, p.elbowN, p.handN], [9 * b, 7.4 * b, 5.6 * b]), '#aaaab2')
  fill(() => ovalPath(g, p.handN, 3.4, 2.8), '#aaaab2')
}

const built = (name: keyof typeof POSE_TABLE): Skeleton => weaponPose(plan, applyBuild(POSE_TABLE[name], plan.build))
const idle = built('idle')

/** A stance foot travels backwards exactly as fast as the sim moves forward. */
function gait(tick: number): Skeleton {
  const phase = tick / PERIOD
  const radius = GUAN_YU.walkSpeed * PERIOD / 4
  const foot = (p: number, cx: number): Pt => {
    const f = (p + 1) % 1
    if (f < 0.5) return { x: cx + radius - f * GUAN_YU.walkSpeed * PERIOD, y: FIG_H }
    const swing = (f - 0.5) * 2
    return { x: cx - radius + 2 * radius * swing, y: FIG_H - 8 * Math.sin(Math.PI * swing) }
  }
  const p = structuredClone(idle)
  const bob = 1.2 * Math.sin(phase * 4 * Math.PI)
  for (const k of ['hip', 'chest', 'neck', 'head', 'shoulderF', 'elbowF', 'handF', 'shoulderN', 'elbowN', 'handN', 'hipF', 'hipN'] as const) p[k].y += bob
  p.footN = foot(phase, 51)
  p.footF = foot(phase + 0.5, 45)
  p.kneeN = { x: (p.hipN.x + p.footN.x) / 2 + 4, y: (p.hipN.y + p.footN.y) / 2 - 2 }
  p.kneeF = { x: (p.hipF.x + p.footF.x) / 2 + 4, y: (p.hipF.y + p.footF.y) / 2 - 2 }
  return p
}

function combat(strike: 'sweep' | 'attack' | 'chop'): Skeleton[] {
  const wind = built('windup')
  const hit = built(strike)
  const follow = structuredClone(hit)
  follow.weaponRot += strike === 'chop' ? 0.42 : 0.18
  follow.headRot += 0.03
  const recover = built('recover')
  return [idle, lerpSkeleton(idle, wind, 0.5), wind, lerpSkeleton(wind, hit, 0.5), hit, follow, recover, lerpSkeleton(recover, idle, 0.5), idle]
}

export const MOTION_GUIDES = {
  walk: [idle, ...Array.from({ length: 8 }, (_, i) => gait(i * PERIOD / 8))],
  jab1: combat('sweep'),
  jab2: combat('attack'),
  finisher: combat('chop'),
}

describe.runIf(process.env.MOTION_GUIDES === '1')('Guan Yu sequence guides', () => {
  it('writes fixed-registration 3x3 guides and joint metadata', () => {
    mkdirSync(OUT, { recursive: true })
    for (const [clip, poses] of Object.entries(MOTION_GUIDES)) {
      const cv = createCanvas(1536, 1024)
      const g = cv.getContext('2d')
      g.fillStyle = '#ff00ff'; g.fillRect(0, 0, cv.width, cv.height)
      for (const [i, p] of poses.entries()) {
        g.save(); g.translate(i % 3 * CELL.width, Math.floor(i / 3) * CELL.height)
        g.scale(CELL.width / BOX.width, CELL.height / BOX.height)
        g.translate(BOX.ox, BOX.oy)
        mannequin(g as unknown as CanvasRenderingContext2D, p, plan)
        g.restore()
      }
      writeFileSync(`${OUT}/guide-${clip}.png`, cv.toBuffer('image/png'))
      writeFileSync(`${OUT}/guide-${clip}.json`, `${JSON.stringify({ clip, box: BOX, cell: CELL, period: PERIOD, walkSpeed: GUAN_YU.walkSpeed, poses }, null, 2)}\n`)
      expect(poses).toHaveLength(9)
    }
  })
})
