import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { artBoxFor, drawKindPose } from '../../src/game/art/registry'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import { applyBuild, FIG_H, FIG_W, type Pt, type Skeleton } from '../../src/game/art/rig'
import { weaponPose } from '../../src/game/art/weapons'
import { ALL_FIGHTERS, loadCastArt } from './cast-art'

/**
 * Anatomy review sheets (docs/VISUAL_REVIEW.md section 2a). Written only by
 * `npm run review:capture` (REVIEW_ANATOMY=1); skipped in ordinary test runs.
 * For every fighter and movement, two sheets of arm-chain windows at 4x:
 *   anatomy/<id>.png       clean - judged FIRST, the way a player sees it
 *   anatomy/<id>-xray.png  same art dimmed, with the skeleton on top
 *                          (shoulder o, elbow +, hand x, weapon line) - used
 *                          only AFTER the clean look, to locate root causes.
 * Each window is centred on the shoulder-elbow-hand chain, so a hand is
 * never cropped away the way a fixed chest-relative window can crop it.
 */
const RUN = process.env.REVIEW_ANATOMY === '1'
const OUT = 'artifacts/review/latest/anatomy'
const MOVES = Object.keys(POSE_TABLE) as PoseName[]
const BG = '#3a3440'
const Z = 4
const WIN_W = 72
const WIN_H = 64
const COLS = 7

const armChain = (p: Skeleton): Pt[] => [p.shoulderF, p.elbowF, p.handF, p.shoulderN, p.elbowN, p.handN]

function xray(g: SKRSContext2D, p: Skeleton, map: (q: Pt) => [number, number]): void {
  const line = (a: Pt, b: Pt, colour: string): void => {
    const [ax, ay] = map(a)
    const [bx, by] = map(b)
    g.strokeStyle = colour
    g.beginPath()
    g.moveTo(ax, ay)
    g.lineTo(bx, by)
    g.stroke()
  }
  g.lineWidth = 2
  // Far arm cyan, near arm yellow, weapon axis magenta (through the near hand).
  line(p.shoulderF, p.elbowF, '#4fd8ff')
  line(p.elbowF, p.handF, '#4fd8ff')
  line(p.shoulderN, p.elbowN, '#ffe14f')
  line(p.elbowN, p.handN, '#ffe14f')
  const reach = 40
  const dir = { x: Math.cos(p.weaponRot), y: Math.sin(p.weaponRot) }
  line(
    { x: p.handN.x - dir.x * reach, y: p.handN.y - dir.y * reach },
    { x: p.handN.x + dir.x * reach, y: p.handN.y + dir.y * reach },
    'rgba(255,79,216,0.8)',
  )
  for (const [q, mark] of [
    [p.shoulderF, 'o'],
    [p.elbowF, '+'],
    [p.handF, 'x'],
    [p.shoulderN, 'o'],
    [p.elbowN, '+'],
    [p.handN, 'x'],
  ] as const) {
    const [x, y] = map(q)
    g.fillStyle = '#ffffff'
    g.font = 'bold 14px sans-serif'
    g.fillText(mark, x - 4, y + 5)
  }
}

describe.runIf(RUN)('anatomy review sheets (review:capture only)', () => {
  it('writes clean and x-ray arm-chain sheets for every fighter', async () => {
    mkdirSync(OUT, { recursive: true })
    const resources = await loadCastArt()
    const index: { id: string; clean: string; xray: string; moves: string[] }[] = []
    for (const id of ALL_FIGHTERS) {
      const plan = HERO_FIGURES[id] ?? ENEMY_FIGURES[id]
      if (!plan) throw new Error(`no plan ${id}`)
      const cw = WIN_W * Z
      const ch = WIN_H * Z
      const rows = Math.ceil(MOVES.length / COLS)
      const clean = createCanvas(COLS * cw, rows * (ch + 20))
      const ray = createCanvas(COLS * cw, rows * (ch + 20))
      const gc = clean.getContext('2d')
      const gx = ray.getContext('2d')
      for (const g of [gc, gx]) {
        g.fillStyle = BG
        g.fillRect(0, 0, clean.width, clean.height)
      }
      for (const [i, move] of MOVES.entries()) {
        const box = artBoxFor(id, move)
        if (!box) throw new Error(`no box ${id}:${move}`)
        const cv = createCanvas(box.width * Z, box.height * Z)
        drawKindPose(cv.getContext('2d') as unknown as CanvasRenderingContext2D, id, move, Z, resources)
        const p = weaponPose(plan, applyBuild(POSE_TABLE[move], plan.build))
        const ox = (box.width - FIG_W) / 2
        const oy = box.height - FIG_H
        // Centre the window on the arm chain's bounding box (units).
        const pts = armChain(p)
        const cx = (Math.min(...pts.map((q) => q.x)) + Math.max(...pts.map((q) => q.x))) / 2
        const cy = (Math.min(...pts.map((q) => q.y)) + Math.max(...pts.map((q) => q.y))) / 2
        const sx = (cx + ox - WIN_W / 2) * Z
        const sy = (cy + oy - WIN_H / 2) * Z
        const x = (i % COLS) * cw
        const y = Math.floor(i / COLS) * (ch + 20)
        gc.drawImage(cv, sx, sy, cw, ch, x, y + 20, cw, ch)
        gx.globalAlpha = 0.45
        gx.drawImage(cv, sx, sy, cw, ch, x, y + 20, cw, ch)
        gx.globalAlpha = 1
        gx.save()
        gx.beginPath()
        gx.rect(x, y + 20, cw, ch)
        gx.clip()
        xray(gx, p, (q) => [x + ((q.x + ox) * Z - sx), y + 20 + ((q.y + oy) * Z - sy)])
        gx.restore()
        for (const g of [gc, gx]) {
          g.fillStyle = '#f5e6c8'
          g.font = '14px sans-serif'
          g.fillText(`${id} ${move}`, x + 4, y + 15)
        }
      }
      writeFileSync(`${OUT}/${id}.png`, clean.toBuffer('image/png'))
      writeFileSync(`${OUT}/${id}-xray.png`, ray.toBuffer('image/png'))
      index.push({ id, clean: `anatomy/${id}.png`, xray: `anatomy/${id}-xray.png`, moves: MOVES })
    }
    writeFileSync(`${OUT}/index.json`, JSON.stringify(index, null, 2))
    expect(index).toHaveLength(ALL_FIGHTERS.length)
  }, 300_000)
})