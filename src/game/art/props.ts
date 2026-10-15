import { INK, css, shade, tint } from './palette'
import { limbPath, ovalPath, polyPath, type Pt } from './paths'
import { paintCel, type Shape } from './cel'

/**
 * The four pickups: crate, meat, weapon drop, arrow.
 *
 * They go through the same cel passes as the cast, which is most of the point.
 * The old pickups were flat rectangles - the sword was one grey rectangle with
 * no outline at all - and the reason they read as placeholders next to the
 * fighters was that they were lit by nothing while the fighters were lit from
 * the upper left. Same pipeline, same light, and they belong to the same world.
 */

export interface PropPlan {
  /** Canonical drawing box. Props are small, so each gets its own. */
  width: number
  height: number
  /** On-screen height in logical px, since a crate is not a fighter. */
  onScreenH: number
  draw: (add: (trace: Shape['trace'], fill: string) => void) => void
  /** Marks drawn after shading, for anything that must stay crisp. */
  detail?: (ctx: CanvasRenderingContext2D) => void
}

const WOOD = 0x6a4a24
const STEEL = 0xc8d0dc
const BONE = 0xe8dcc0
const MEAT = 0x9e3a2a

function band(a: Pt, b: Pt, w: number): (c: CanvasRenderingContext2D) => void {
  return (c) => limbPath(c, a, b, w, w)
}

export const PROPS: Record<string, PropPlan> = {
  crate: {
    width: 52,
    height: 46,
    onScreenH: 52,
    draw: (add) => {
      add(
        (c) =>
          polyPath(c, [
            { x: 5, y: 8 },
            { x: 47, y: 8 },
            { x: 45, y: 44 },
            { x: 7, y: 44 },
          ]),
        css(WOOD),
      )
      // Planks, then iron banding across them, then a diagonal brace.
      add(band({ x: 9, y: 17 }, { x: 43, y: 17 }, 5), css(tint(WOOD, 0.22)))
      add(band({ x: 9, y: 28 }, { x: 43, y: 28 }, 5), css(tint(WOOD, 0.12)))
      add(band({ x: 9, y: 38 }, { x: 43, y: 38 }, 5), css(shade(WOOD, 0.22)))
      add(band({ x: 8, y: 10 }, { x: 8, y: 42 }, 6), css(0x8a8a92))
      add(band({ x: 44, y: 10 }, { x: 44, y: 42 }, 6), css(0x8a8a92))
      add(band({ x: 10, y: 40 }, { x: 42, y: 12 }, 4), css(shade(WOOD, 0.3)))
    },
    detail: (ctx) => {
      // Iron studs where the bands meet the planks, plus wood grain.
      ctx.fillStyle = '#3a3a42'
      for (const [x, y] of [
        [8, 17],
        [8, 28],
        [8, 38],
        [44, 17],
        [44, 28],
        [44, 38],
      ] as const) {
        ctx.beginPath()
        ctx.arc(x, y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(40, 26, 12, 0.5)'
      ctx.lineWidth = 0.8
      for (const y of [22, 33]) {
        ctx.beginPath()
        ctx.moveTo(12, y)
        ctx.quadraticCurveTo(26, y + 1.6, 40, y)
        ctx.stroke()
      }
    },
  },

  meat: {
    width: 38,
    height: 30,
    onScreenH: 26,
    draw: (add) => {
      // A drumstick: bone out one side so it is not just a red lump.
      add((c) => ovalPath(c, { x: 22, y: 17 }, 13, 10, -0.25), css(MEAT))
      add((c) => ovalPath(c, { x: 25, y: 14 }, 7, 5, -0.25), css(tint(MEAT, 0.22)))
      add(band({ x: 12, y: 21 }, { x: 5, y: 11 }, 6), css(BONE))
      add((c) => ovalPath(c, { x: 4, y: 9 }, 5, 4.5, 0), css(BONE))
      // Glaze band around the meat's fat end.
      add((c) => ovalPath(c, { x: 30, y: 20 }, 5, 4, -0.25), css(tint(MEAT, 0.4)))
    },
    detail: (ctx) => {
      // Sheen dot on the glaze, knuckle lines on the bone.
      ctx.fillStyle = 'rgba(255, 240, 220, 0.8)'
      ctx.beginPath()
      ctx.arc(28, 18, 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(120, 100, 70, 0.7)'
      ctx.lineWidth = 0.9
      ctx.beginPath()
      ctx.moveTo(8, 15)
      ctx.lineTo(5, 12)
      ctx.moveTo(10, 18)
      ctx.lineTo(7, 15)
      ctx.stroke()
    },
  },

  sword: {
    width: 46,
    height: 20,
    onScreenH: 18,
    draw: (add) => {
      add(
        (c) =>
          polyPath(c, [
            { x: 14, y: 6 },
            { x: 40, y: 8 },
            { x: 44, y: 10 },
            { x: 40, y: 12 },
            { x: 14, y: 14 },
          ]),
        css(STEEL),
      )
      add(band({ x: 13, y: 4 }, { x: 13, y: 16 }, 4.5), css(0xc8a828))
      add(band({ x: 11, y: 10 }, { x: 3, y: 10 }, 5.5), css(0x4a3524))
    },
    detail: (ctx) => {
      // Fuller groove down the blade, wrap bands on the grip.
      ctx.strokeStyle = 'rgba(90, 100, 120, 0.8)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(17, 10)
      ctx.lineTo(37, 10)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(200, 168, 40, 0.85)'
      ctx.lineWidth = 1.1
      for (const x of [5, 8]) {
        ctx.beginPath()
        ctx.moveTo(x, 8)
        ctx.lineTo(x, 12)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.fillRect(34, 8.6, 5, 1)
    },
  },

  arrow: {
    width: 44,
    height: 14,
    onScreenH: 10,
    draw: (add) => {
      add(band({ x: 8, y: 7 }, { x: 34, y: 7 }, 3.6), css(0x7a5230))
      add(
        (c) =>
          polyPath(c, [
            { x: 32, y: 2 },
            { x: 42, y: 7 },
            { x: 32, y: 12 },
          ]),
        css(STEEL),
      )
      add(
        (c) =>
          polyPath(c, [
            { x: 4, y: 1 },
            { x: 13, y: 5 },
            { x: 13, y: 9 },
            { x: 4, y: 13 },
            { x: 8, y: 7 },
          ]),
        css(0xd8d0c0),
      )
    },
    detail: (ctx) => {
      // Fletching barbs, shaft bands, and a glint on the head.
      ctx.strokeStyle = 'rgba(120, 100, 80, 0.8)'
      ctx.lineWidth = 0.8
      for (const y of [3.4, 6, 10.6]) {
        ctx.beginPath()
        ctx.moveTo(5, y)
        ctx.lineTo(12, y)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(60, 40, 20, 0.6)'
      ctx.fillRect(20, 5.4, 1.6, 3.2)
      ctx.fillRect(27, 5.4, 1.6, 3.2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(36, 5.6, 3, 1.2)
    },
  },
}

export function drawProp(ctx: CanvasRenderingContext2D, kind: string): boolean {
  const plan = PROPS[kind]
  if (!plan) return false
  const shapes: Shape[] = []
  plan.draw((trace, fill) => shapes.push({ trace, fill }))
  paintCel(ctx, shapes, plan.width, plan.height)
  plan.detail?.(ctx)
  return true
}

export { INK }
