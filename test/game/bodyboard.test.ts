import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import { maskIou, PARITY_FLOOR, type BodyArt, type BodyPartName } from '../../src/game/art/body-parts'
import prepared from '../../src/game/assets/hero-bodies/prepared.json'
import mookPrepared from '../../src/game/assets/mook-bodies/prepared.json'
import type { PoseName } from '../../src/game/art/poses'

type Ctx = CanvasRenderingContext2D
const SCALE = 2

type Meta = {
  revision: string
  skin: string
  density: number
  sheet: { width: number; height: number }
  parts: Partial<Record<BodyPartName, BodyArt['parts'][BodyPartName]>>
}

/** Before/after board: every wired fighter, old vs paper-doll, idle +
 * attack + down. Writes artifacts/look/body3-beforeafter.png (a review
 * artifact; the assertions are parity + liveness). */
describe('BODY-3 review board (permanent generator)', () => {
  it('writes the before/after board at gameplay scale', async () => {
    const packs = [
      { dir: 'hero-bodies', ids: Object.keys(prepared) },
      { dir: 'mook-bodies', ids: Object.keys(mookPrepared) },
    ]
    const fighters = packs.flatMap((p) => p.ids.map((id) => ({ ...p, id })))
    expect(fighters.length).toBe(8)
    const poses: PoseName[] = ['idle', 'attack', 'down']
    const CW = 260
    const CH = 300
    const board = createCanvas(CW * poses.length * 2 + 40, CH * fighters.length + 40)
    const g = board.getContext('2d')
    g.fillStyle = '#181420'
    g.fillRect(0, 0, board.width, board.height)
    g.font = '13px sans-serif'
    for (const [row, f] of fighters.entries()) {
      const { dir, id } = f
      const pack = dir === 'hero-bodies' ? prepared : mookPrepared
      const meta = (pack as Record<string, Meta>)[id]
      if (!meta) continue
      const sheet = (await loadImage(`src/game/assets/${dir}/${id}-sheet.png`)) as unknown as CanvasImageSource
      const art: BodyArt = {
        id,
        revision: meta.revision,
        sheet,
        density: meta.density,
        parts: meta.parts as BodyArt['parts'],
        skin: parseInt(meta.skin.slice(1), 16),
      }
      poses.forEach((pose, i) => {
        for (const [j, body] of [undefined, art].entries()) {
          const b = artBoxFor(id, pose)
          if (!b) throw new Error(`no box for ${id}:${pose}`)
          const c = createCanvas(b.width * SCALE, b.height * SCALE)
          const ctx = c.getContext('2d')
          drawKindPose(ctx as unknown as Ctx, id, pose, SCALE, {
            heroes: {},
            bodies: body ? { [id]: body } : {},
          })
          const dx = 20 + (i * 2 + j) * CW
          const dy = 20 + row * CH
          g.drawImage(c, dx, dy)
          g.fillStyle = '#f5e6c8'
          g.fillText(body ? `${pose} NEW` : `${pose} old`, dx + 6, dy + 14)
        }
      })
      // Parity + liveness for the board's own record.
      const b = artBoxFor(id, 'idle')
      if (!b) throw new Error('no idle box')
      const render = (body?: BodyArt): { width: number; height: number; data: Uint8Array } => {
        const c = createCanvas(b.width * SCALE, b.height * SCALE)
        const ctx = c.getContext('2d')
        drawKindPose(ctx as unknown as Ctx, id, 'idle', SCALE, {
          heroes: {},
          bodies: body ? { [id]: body } : {},
        })
        return {
          width: b.width * SCALE,
          height: b.height * SCALE,
          data: new Uint8Array(ctx.getImageData(0, 0, b.width * SCALE, b.height * SCALE).data),
        }
      }
      const iou = maskIou(render(), render(art))
      expect(iou, `${id} board parity`).toBeGreaterThanOrEqual(PARITY_FLOOR)
      expect(iou, `${id} board liveness`).toBeLessThan(0.99)
    }
    writeFileSync('artifacts/look/body-beforeafter.png', board.toBuffer('image/png'))
    expect(true).toBe(true)
  })
})
