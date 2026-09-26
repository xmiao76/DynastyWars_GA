import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, FIG_H, FIG_W } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import { ALL_FIGHTERS, loadCastArt } from './cast-art'

/**
 * BODY-17 per-movement review sheets (permanent generator). For EVERY
 * fighter, EVERY movement the game renders:
 *   artifacts/look/moves/<id>.png       whole body, 14 movements, 2x
 *   artifacts/look/moves/<id>-arms.png  upper body (arms/hands/grip), 4x
 * on a mid-grey ground so dark costumes and ink both read. These are the
 * sheets the human-style review in docs/CHARACTER_REVIEW.md critiques;
 * this test only guarantees they are complete and non-empty.
 */
const MOVES = Object.keys(POSE_TABLE) as PoseName[]
const BG = '#3a3440'
const OUT = 'artifacts/look/moves'

function inked(data: Uint8ClampedArray): number {
  let n = 0
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 128) n += 1
  return n
}

describe('BODY-17 per-movement review sheets (permanent generator)', () => {
  it('renders every fighter in every movement, whole-body and arm zooms', async () => {
    mkdirSync(OUT, { recursive: true })
    const resources = await loadCastArt()
    const empty: string[] = []
    for (const id of ALL_FIGHTERS) {
      const plan = HERO_FIGURES[id] ?? ENEMY_FIGURES[id]
      if (!plan) throw new Error(`no plan ${id}`)
      // Whole-body sheet: 7 x 2 grid of fixed windows (50 units behind the
      // body centre, 110 ahead - enough for every weapon tip).
      const S = 2
      const boxes = MOVES.map((m) => artBoxFor(id, m))
      const WIN_BACK = 50
      const WIN_W = 160
      const cw = WIN_W * S
      const chh = Math.max(...boxes.map((b) => b?.height ?? 0)) * S
      const cols = 7
      const sheet = createCanvas(cols * cw, 2 * (chh + 20))
      const g = sheet.getContext('2d')
      g.fillStyle = BG
      g.fillRect(0, 0, sheet.width, sheet.height)
      g.font = '14px sans-serif'
      // Arm-zoom sheet: 7 x 2 grid of 64x58-unit crops at 4x.
      const Z = 4
      const zw = 64 * Z
      const zh = 58 * Z
      const zoom = createCanvas(cols * zw, 2 * (zh + 20))
      const zg = zoom.getContext('2d')
      zg.fillStyle = BG
      zg.fillRect(0, 0, zoom.width, zoom.height)
      zg.font = '14px sans-serif'
      for (const [i, move] of MOVES.entries()) {
        const box = boxes[i]
        if (!box) throw new Error(`no box ${id}:${move}`)
        const cv = createCanvas(box.width * S, box.height * S)
        const ctx = cv.getContext('2d')
        drawKindPose(ctx as unknown as CanvasRenderingContext2D, id, move, S, resources)
        if (inked(ctx.getImageData(0, 0, cv.width, cv.height).data) < 200) empty.push(`${id}:${move}`)
        const x = (i % cols) * cw
        const y = Math.floor(i / cols) * (chh + 20)
        const wx = ((box.width - FIG_W) / 2 + FIG_W / 2 - WIN_BACK) * S
        g.drawImage(cv, wx, 0, cw, cv.height, x, y + 20 + (chh - cv.height), cw, cv.height)
        g.fillStyle = '#f5e6c8'
        g.fillText(`${id} ${move}`, x + 4, y + 15)
        // Zoom crop around the upper body.
        const zc = createCanvas(box.width * Z, box.height * Z)
        drawKindPose(zc.getContext('2d') as unknown as CanvasRenderingContext2D, id, move, Z, resources)
        const p = weaponPose(plan, applyBuild(POSE_TABLE[move], plan.build))
        const ox = (box.width - FIG_W) / 2
        const oy = box.height - FIG_H
        const sx = (p.chest.x + ox - 30) * Z
        const sy = (Math.min(p.head.y, p.chest.y - 14) + oy - 10) * Z
        const zx = (i % cols) * zw
        const zy = Math.floor(i / cols) * (zh + 20)
        zg.drawImage(zc, sx, sy, zw, zh, zx, zy + 20, zw, zh)
        zg.fillStyle = '#f5e6c8'
        zg.fillText(`${id} ${move} (arms 4x)`, zx + 4, zy + 15)
      }
      writeFileSync(`${OUT}/${id}.png`, sheet.toBuffer('image/png'))
      writeFileSync(`${OUT}/${id}-arms.png`, zoom.toBuffer('image/png'))
    }
    expect(empty, 'movements that rendered (almost) nothing').toEqual([])
  }, 240_000)
})
