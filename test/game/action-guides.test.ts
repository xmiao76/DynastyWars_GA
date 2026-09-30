import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { HERO_FIGURES } from '../../src/game/art/figures'
import { lerpSkeleton } from '../../src/game/art/interpolate'
import { POSE_TABLE } from '../../src/game/art/poses'
import { applyBuild, type Pt, type Skeleton } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import { mannequin } from './motion-guides.test'

const plan = HERO_FIGURES.guanyu!
const box = { width: 224, height: 144, ox: 64, oy: 44, groundY: 136 }
const built = (pose: keyof typeof POSE_TABLE): Skeleton => weaponPose(plan, applyBuild(POSE_TABLE[pose], plan.build))
const idle = built('idle')
function modify(base: Skeleton, values: Partial<Skeleton>): Skeleton { return { ...structuredClone(base), ...values } }
const crouch = modify(idle, {
  hip: { x: 48, y: 62 }, chest: { x: 47, y: 40 }, neck: { x: 48, y: 35 }, head: { x: 49, y: 23 },
  hipN: { x: 53, y: 63 }, hipF: { x: 43, y: 63 },
  kneeN: { x: 66, y: 75 }, kneeF: { x: 37, y: 76 },
  footN: { x: 59, y: 92 }, footF: { x: 40, y: 92 },
})
const tuck = modify(idle, {
  footN: { x: 66, y: 80 }, footF: { x: 38, y: 82 },
  kneeN: { x: 70, y: 62 }, kneeF: { x: 34, y: 68 },
})
const kick = modify(tuck, { footN: { x: 87, y: 63 }, kneeN: { x: 74, y: 62 }, footF: { x: 41, y: 81 } })
const hurt = built('hurt')
const jointKeys = ['hip', 'chest', 'neck', 'head', 'shoulderF', 'elbowF', 'handF', 'shoulderN', 'elbowN', 'handN', 'hipF', 'kneeF', 'footF', 'hipN', 'kneeN', 'footN'] as const
function tilt(angle: number, lift: number): Skeleton {
  const pivot: Pt = { x: 48, y: 72 }
  const p = structuredClone(idle), c = Math.cos(angle), s = Math.sin(angle)
  for (const key of jointKeys) {
    const q = idle[key]
    p[key] = { x: pivot.x + (q.x - pivot.x) * c - (q.y - pivot.y) * s, y: pivot.y + (q.x - pivot.x) * s + (q.y - pivot.y) * c - lift }
  }
  p.weaponRot += angle
  return p
}
// Authored floor skeleton uses full standing-body length, not the old compact
// 50u prone rig. This keeps head->boot dimensions coherent across the fall.
const down = modify(idle, {
  hip: { x: 48, y: 81 }, chest: { x: 27, y: 78 }, neck: { x: 18, y: 77 }, head: { x: 9, y: 74 },
  shoulderN: { x: 26, y: 75 }, elbowN: { x: 34, y: 64 }, handN: { x: 45, y: 68 },
  shoulderF: { x: 25, y: 82 }, elbowF: { x: 37, y: 85 }, handF: { x: 47, y: 86 },
  hipN: { x: 48, y: 79 }, kneeN: { x: 69, y: 81 }, footN: { x: 88, y: 84 },
  hipF: { x: 48, y: 85 }, kneeF: { x: 68, y: 88 }, footF: { x: 88, y: 89 },
  weaponRot: 0, weaponGrip: 0.4, headRot: -1.3, lying: true,
})
const seated = modify(down, {
  chest: { x: 34, y: 62 }, neck: { x: 30, y: 54 }, head: { x: 28, y: 43 },
  shoulderN: { x: 39, y: 63 }, elbowN: { x: 46, y: 73 }, handN: { x: 54, y: 78 },
  shoulderF: { x: 30, y: 65 }, elbowF: { x: 27, y: 76 }, handF: { x: 29, y: 89 },
  weaponRot: -0.55, headRot: -0.1, lying: false,
})
const kneel = modify(crouch, {
  hip: { x: 47, y: 70 }, hipN: { x: 52, y: 71 }, hipF: { x: 42, y: 71 },
  kneeF: { x: 34, y: 89 }, footF: { x: 23, y: 90 }, kneeN: { x: 65, y: 75 }, footN: { x: 61, y: 92 },
  chest: { x: 47, y: 47 }, neck: { x: 48, y: 42 }, head: { x: 49, y: 30 },
})
const grab = modify(idle, { handN: { x: 72, y: 38 }, elbowN: { x: 65, y: 37 }, handF: { x: 57, y: 55 } })
const rider = modify(idle, { hip: { x: 48, y: 59 }, hipN: { x: 53, y: 60 }, hipF: { x: 43, y: 60 }, kneeN: { x: 64, y: 72 }, kneeF: { x: 36, y: 72 }, footN: { x: 61, y: 91 }, footF: { x: 38, y: 91 } })
const sweep = built('special')
const wind = built('windup')
const recover = built('recover')
export const ACTION_GUIDES = {
  jump: [idle, crouch, lerpSkeleton(crouch, tuck, 0.5), tuck, kick, tuck, lerpSkeleton(tuck, idle, 0.5), crouch, idle],
  fall: [idle, hurt, tilt(-0.35, 0), tilt(-0.75, 6), tilt(-1.15, 6), lerpSkeleton(tilt(-1.15, 6), down, 0.65), down, down, down],
  getup: [down, lerpSkeleton(down, seated, 0.5), seated, lerpSkeleton(seated, kneel, 0.5), kneel, lerpSkeleton(kneel, crouch, 0.5), crouch, lerpSkeleton(crouch, idle, 0.5), idle],
  misc: [idle, lerpSkeleton(idle, hurt, 0.5), hurt, lerpSkeleton(hurt, idle, 0.6), idle, grab, grab, lerpSkeleton(grab, idle, 0.5), idle],
  special: [idle, lerpSkeleton(idle, wind, 0.5), wind, lerpSkeleton(wind, sweep, 0.5), sweep, modify(sweep, { weaponRot: 0.6 }), recover, lerpSkeleton(recover, idle, 0.5), idle],
  rider: [rider, modify(rider, { chest: { x: 48, y: 32 }, head: { x: 49, y: 17 } }), rider, lerpSkeleton(rider, wind, 0.4), modify(built('attack'), { hipN: rider.hipN, hipF: rider.hipF, kneeN: rider.kneeN, kneeF: rider.kneeF, footN: rider.footN, footF: rider.footF }), rider, rider, lerpSkeleton(rider, idle, 0.5), idle],
}

describe.runIf(process.env.ACTION_GUIDES === '1')('Guan Yu remaining action guides', () => {
  it('writes guide and metadata for each complete action sheet', () => {
    mkdirSync('art/motion/guanyu', { recursive: true })
    for (const [action, poses] of Object.entries(ACTION_GUIDES)) {
      const cv = createCanvas(1536, 1024), g = cv.getContext('2d')
      g.fillStyle = '#ff00ff'; g.fillRect(0, 0, cv.width, cv.height)
      for (const [i, p] of poses.entries()) {
        g.save(); g.translate(i % 3 * 512, Math.floor(i / 3) * 341)
        g.scale(512 / box.width, 341 / box.height); g.translate(box.ox, box.oy)
        mannequin(g as unknown as CanvasRenderingContext2D, p, plan); g.restore()
      }
      writeFileSync(`art/motion/guanyu/guide-${action}.png`, cv.toBuffer('image/png'))
      writeFileSync(`art/motion/guanyu/guide-${action}.json`, `${JSON.stringify({ action, box, poses }, null, 2)}\n`)
      expect(poses).toHaveLength(9)
    }
  })
})
