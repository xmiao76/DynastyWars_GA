import { HERO_FIGURES, ENEMY_FIGURES } from '../../src/game/art/figures'
import { headRadius, paintCel, type Shape } from '../../src/game/art/draw'
import { materials } from '../../src/game/art/palette'
import { POSE_TABLE } from '../../src/game/art/poses'
import { applyBuild, FIG_W, FIG_H } from '../../src/game/art/rig'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { addWeapon, weaponPose, traceBlade, traceBow, type BladeHead, type WeaponTrace } from '../../src/game/art/weapons'
import { traceLegacyBlade, traceLegacyBow } from './fixtures/weapon-heads-before'

const SCALE = 8

/** Measure the weapon alone: armour, backdrop and tassels cannot mask a bad head. */
function silhouette(trace: WeaponTrace) {
  const canvas = createCanvas(64 * SCALE, 48 * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.translate(16, 24)
  trace(ctx as unknown as CanvasRenderingContext2D)
  ctx.fillStyle = '#fff'
  ctx.fill()
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const columns: Array<{ x: number; thickness: number; center: number }> = []
  let top = canvas.height, bottom = -1
  for (let x = 0; x < canvas.width; x++) {
    const ys: number[] = []
    for (let y = 0; y < canvas.height; y++) {
      if ((pixels.data[(y * canvas.width + x) * 4 + 3] ?? 0) > 127) ys.push(y)
    }
    if (ys.length === 0) continue
    const y0 = ys[0]!, y1 = ys[ys.length - 1]!
    top = Math.min(top, y0)
    bottom = Math.max(bottom, y1)
    columns.push({ x: x / SCALE - 16, thickness: ys.length / SCALE, center: (y0 + y1) / (2 * SCALE) - 24 })
  }
  if (columns.length === 0) throw new Error('Weapon drew no pixels')
  const first = columns[0]!, last = columns[columns.length - 1]!
  const width = last.x - first.x + 1 / SCALE
  const height = (bottom - top + 1) / SCALE
  const body = columns.filter(c => c.x > -4 && c.x < 18)
  const tip = columns[columns.length - 4]!
  return {
    aspect: width / height,
    thickness: Math.max(...body.map(c => c.thickness)),
    centerSwing: Math.max(...body.map(c => c.center)) - Math.min(...body.map(c => c.center)),
    tipThickness: tip.thickness,
    columns,
  }
}

function defects(head: BladeHead, m: ReturnType<typeof silhouette>): string[] {
  const found: string[] = []
  if (head === 'crescent' && m.aspect < 2.1) found.push('paddle-shaped guandao')
  if (head === 'dao' && m.aspect < 2.4) found.push('shovel-shaped dao')
  if (head === 'serpent') {
    if (m.thickness > 4.5) found.push('thick leaf instead of serpent ribbon')
    if (m.centerSwing < 5.5) found.push('missing serpent undulation')
  }
  if (m.tipThickness > 2) found.push('blunt tip')
  return found
}

describe('legend-readable weapon silhouettes', () => {
  for (const head of ['crescent', 'serpent', 'leaf', 'dao'] as const) {
    it(`${head} has an elongated/sharp or slender/wavy blade`, () => {
      const measured = silhouette(c => traceBlade(c, head))
      expect(defects(head, measured), JSON.stringify(measured)).toEqual([])
    })
  }

  for (const head of ['crescent', 'serpent', 'dao'] as const) {
    it(`rejects the photographed pre-fix ${head} silhouette`, () => {
      expect(defects(head, silhouette(c => traceLegacyBlade(c, head)))).not.toEqual([])
    })
  }

  it('rejects a straight blade substituted for the serpent', () => {
    expect(defects('serpent', silhouette(c => traceBlade(c, 'leaf')))).toContain('missing serpent undulation')
  })

  it('keeps Zhao Yun’s spearhead symmetrical around the shaft', () => {
    const blade = silhouette(c => traceBlade(c, 'leaf'))
    expect(Math.max(...blade.columns.map(c => Math.abs(c.center)))).toBeLessThanOrEqual(1 / SCALE)
  })

  it('puts the bow riser in the hand, including both melee grips', () => {
    const ctx = createCanvas(120, 120).getContext('2d')
    for (const grip of [0.28, 0.3, 0.32, 0.34, 0.38, 0.4]) {
      traceBow(ctx as unknown as CanvasRenderingContext2D, 42 * (1 - grip))
      expect(ctx.isPointInPath(0, 0), `grip ${grip}`).toBe(true)
    }
  })

  it('rejects the old bow that floats away from the hand', () => {
    const ctx = createCanvas(120, 120).getContext('2d')
    traceLegacyBow(ctx as unknown as CanvasRenderingContext2D, 42 * 0.66)
    expect(ctx.isPointInPath(0, 0)).toBe(false)
  })
})
describe('weapon placement across the shared cast', () => {
  it('keeps every face clear in every pose and both facings', () => {
    const canvas = createCanvas(640, 480)
    const ctx = canvas.getContext('2d')
    const failures: string[] = []
    let checked = 0
    for (const [kind, plan] of Object.entries({ ...HERO_FIGURES, ...ENEMY_FIGURES })) {
      for (const [name, raw] of Object.entries(POSE_TABLE)) for (const facing of [1, -1]) {
        ctx.resetTransform()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.translate(320, 160)
        ctx.scale(facing * 2, 2)
        const pose = weaponPose(plan, applyBuild(raw, plan.build))
        const shapes: Shape[] = []
        addWeapon((trace, fill, outline) => shapes.push({ trace, fill, outline }), plan, pose,
          materials(plan.body, plan.trim, plan.gear))
        paintCel(ctx as unknown as CanvasRenderingContext2D, shapes, FIG_W, FIG_H)
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const radius = headRadius(plan)
        let overlap = 0
        for (let dy = -radius; dy <= radius; dy += 0.5) for (let dx = -radius; dx <= radius; dx += 0.5) {
          // Inner face ellipse, excluding hair/helmet; rotate with the head.
          if ((dx / (radius * 0.8)) ** 2 + (dy / (radius * 0.85)) ** 2 > 1) continue
          const x = pose.head.x + dx * Math.cos(pose.headRot) - dy * Math.sin(pose.headRot)
          const y = pose.head.y + dx * Math.sin(pose.headRot) + dy * Math.cos(pose.headRot)
          const px = Math.round(320 + facing * x * 2), py = Math.round(160 + y * 2)
          if ((pixels[(py * canvas.width + px) * 4 + 3] ?? 0) > 127) overlap++
        }
        if (overlap > 0) failures.push(`${kind}:${name}:${facing} ${overlap} face pixels`)
        checked++
      }
    }
    expect(checked).toBe(17 * 11 * 2)
    expect(failures).toEqual([])
  })
})
describe('bow construction', () => {
  it('has a continuous string and limbs enclosing visible open space', () => {
    const canvas = createCanvas(256, 160)
    const ctx = canvas.getContext('2d')
    ctx.translate(128, 80)
    ctx.scale(2, 2)
    const plan = HERO_FIGURES.huangzhong!
    const pose = { ...POSE_TABLE.idle, handN: { x: 0, y: 0 }, weaponRot: 0 }
    const shapes: Shape[] = []
    addWeapon((trace, fill, outline) => shapes.push({ trace, fill, outline }), plan, pose,
      materials(plan.body, plan.trim, plan.gear))
    paintCel(ctx as unknown as CanvasRenderingContext2D, shapes, FIG_W, FIG_H)
    const pixels = ctx.getImageData(0, 0, 256, 160).data
    const outside = new Uint8Array(256 * 160)
    const queue = [0]
    outside[0] = 1
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i]!
      const x = current % 256, y = Math.floor(current / 256)
      for (const next of [x > 0 ? current - 1 : -1, x < 255 ? current + 1 : -1,
        y > 0 ? current - 256 : -1, y < 159 ? current + 256 : -1]) {
        if (next < 0 || outside[next] || (pixels[next * 4 + 3] ?? 0) > 63) continue
        outside[next] = 1
        queue.push(next)
      }
    }
    let enclosed = 0
    for (let i = 0; i < outside.length; i++) {
      if (!outside[i] && (pixels[i * 4 + 3] ?? 0) < 64) enclosed++
    }
    // An open/disconnected bowstring, or an opaque paddle, cannot enclose air.
    expect(enclosed).toBeGreaterThan(200)
  })
})