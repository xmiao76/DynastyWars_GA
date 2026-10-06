import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import type { ArtResources, HeroArt } from '../../src/game/art/hero-resources'
import type { BodyArt } from '../../src/game/art/body-parts'
import type { PoseName } from '../../src/game/art/poses'
import prepared from '../../src/game/assets/boss-faces/prepared.json'
import bodiesPrepared from '../../src/game/assets/boss-bodies/prepared.json'

/** BODY-6/13 review board: every boss, procedural vs painted, idle +
 * attack + down. BODY-13 extends the NEW side to painted bodies.
 * Writes artifacts/look/boss-beforeafter.png; the assertions are the
 * painted-vs-fallback liveness per cell. */
const IDS = ['xiahoudun', 'xuchu', 'lidian'] as const
const SCALE = 2

describe('BODY-6 review board (permanent generator)', () => {
  it('writes the boss before/after board at gameplay scale', async () => {
    const resources: ArtResources = { heroes: {}, bodies: {} }
    for (const id of IDS) {
      const image = async (part: string) => await loadImage(`src/game/assets/boss-faces/${id}-${part}.png`) as unknown as CanvasImageSource
      const m = prepared[id]
      ;(resources.heroes as Record<string, HeroArt>)[id] = {
        id, revision: m.revision, portrait: await image('portrait'), head: await image('head'),
        front: await image('front'), rear: await image('rear'), cell: m.cell, bounds: m.bounds,
        skin: parseInt(m.skin.slice(1), 16),
      }
      const bm = bodiesPrepared[id] as { revision: string; skin: string; density: number; parts: BodyArt['parts'] }
      const sheet = (await loadImage(`src/game/assets/boss-bodies/${id}-sheet.png`)) as unknown as CanvasImageSource
      ;(resources.bodies as Record<string, BodyArt>)[id] = {
        id, revision: bm.revision, sheet, density: bm.density, parts: bm.parts,
        skin: parseInt(bm.skin.slice(1), 16),
      }
    }
    const poses: PoseName[] = ['idle', 'attack', 'down']
    const CW = 260
    const CH = 300
    const fighters = IDS.length
    const board = createCanvas(CW * poses.length * 2 + 40, CH * fighters + 40)
    const g = board.getContext('2d')
    g.fillStyle = '#181420'
    g.fillRect(0, 0, board.width, board.height)
    g.font = '13px sans-serif'
    for (const [row, id] of IDS.entries()) {
      poses.forEach((pose, i) => {
        for (const [j, painted] of [false, true].entries()) {
          const b = artBoxFor(id, pose)
          if (!b) throw new Error(`no box for ${id}:${pose}`)
          const c = createCanvas(b.width * SCALE, b.height * SCALE)
          const ctx = c.getContext('2d')
          drawKindPose(ctx as unknown as CanvasRenderingContext2D, id, pose, SCALE, painted ? resources : undefined)
          const dx = 20 + (i * 2 + j) * CW
          const dy = 20 + row * CH
          g.drawImage(c, dx, dy)
          g.fillStyle = '#f5e6c8'
          g.fillText(painted ? `${pose} NEW` : `${pose} old`, dx + 6, dy + 14)
        }
      })
      // Liveness per cell: painted must differ from procedural on idle.
      const b = artBoxFor(id, 'idle')
      if (!b) throw new Error('no idle box')
      const render = (painted: boolean) => {
        const c = createCanvas(b.width * SCALE, b.height * SCALE)
        const ctx = c.getContext('2d')
        drawKindPose(ctx as unknown as CanvasRenderingContext2D, id, 'idle', SCALE, painted ? resources : undefined)
        return ctx.getImageData(0, 0, b.width * SCALE, b.height * SCALE)
      }
      const a = render(false)
      const n = render(true)
      let differing = 0
      for (let k = 0; k < a.data.length; k += 4) {
        if (Math.abs((a.data[k] ?? 0) - (n.data[k] ?? 0)) + Math.abs((a.data[k + 1] ?? 0) - (n.data[k + 1] ?? 0)) > 60) differing += 1
      }
      expect(differing, `${id} board liveness`).toBeGreaterThan(500)
    }
    writeFileSync('artifacts/look/boss-beforeafter.png', board.toBuffer('image/png'))
    expect(true).toBe(true)
  }, 60_000)
})
