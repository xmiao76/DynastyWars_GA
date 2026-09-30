import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage, type Canvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import type { PoseName } from '../../src/game/art/poses'
import { artBoxFor, artDisplayHeight, drawKindPose } from '../../src/game/art/registry'
import type { WholeFrameArt } from '../../src/game/art/whole-frames'
import { loadCastArt } from './cast-art'

/**
 * Whole-frame pilot comparison sheet (WHOLEFRAME_COMPARE=1 only): rows =
 * current paper-doll art / painted whole frame; columns = idle, attack, down;
 * each at GAMEPLAY size (the in-game on-screen height x RENDER_SCALE 2, on
 * the stage-1 ground tone) plus a 4x zoom of the same frame.
 * Writes artifacts/wholeframe/guanyu-compare.png.
 */
const RUN = process.env.WHOLEFRAME_COMPARE === '1'
const POSES: PoseName[] = ['idle', 'attack', 'down']
const GROUND = '#5d6b3c'
const SKY = '#3a3440'

describe.runIf(RUN)('whole-frame comparison sheet (WHOLEFRAME_COMPARE=1)', () => {
  it('writes the current-vs-whole-frame sheet', async () => {
    mkdirSync('artifacts/wholeframe', { recursive: true })
    const res = await loadCastArt(['guanyu'])
    const meta = JSON.parse(readFileSync('src/game/assets/whole-frames/prepared.json', 'utf8')).guanyu
    const sheet = await loadImage(readFileSync('src/game/assets/whole-frames/guanyu-sheet.png'))
    const frames: WholeFrameArt = { id: 'guanyu', revision: meta.revision, sheet: sheet as unknown as CanvasImageSource, density: meta.density, frames: meta.frames }
    const painted = { ...res, frames: { guanyu: frames } }
    // Gameplay scale: GameScene.fitSprite sizes the idle BOX so the fighter
    // stands 92 px tall on a 480x270 logical screen, drawn at 2x device px.
    const idleBox = artBoxFor('guanyu', 'idle')!
    const standH = artDisplayHeight('guanyu', 92)!
    const gameplayZ = (standH / idleBox.height) * 2
    const Z4 = 4
    const colW = Math.max(...POSES.map((p) => artBoxFor('guanyu', p)!.width)) * Z4
    const rowH = idleBox.height * Z4
    const gpH = Math.round(idleBox.height * gameplayZ)
    const W = 170 + POSES.length * colW
    const H = 40 + 2 * (gpH + rowH + 50)
    const cv = createCanvas(W, H)
    const g = cv.getContext('2d')
    g.fillStyle = '#1c1820'
    g.fillRect(0, 0, W, H)
    g.font = 'bold 20px sans-serif'
    g.fillStyle = '#f5e6c8'
    g.fillText('Guan Yu - current paper-doll (top) vs whole-frame painting (bottom); gameplay size, then 4x', 12, 26)
    const rows: Array<[string, typeof res]> = [['CURRENT (paper-doll)', res], ['WHOLE FRAME (wf-1)', painted]]
    rows.forEach(([label, r], ri) => {
      const y0 = 40 + ri * (gpH + rowH + 50)
      g.fillStyle = ri === 0 ? '#ffb4a0' : '#a0ffb4'
      g.font = 'bold 16px sans-serif'
      g.fillText(label, 12, y0 + 24)
      POSES.forEach((pose, ci) => {
        const box = artBoxFor('guanyu', pose)!
        const x0 = 170 + ci * colW
        const draw = (z: number): Canvas => {
          const c = createCanvas(Math.round(box.width * z), Math.round(box.height * z))
          drawKindPose(c.getContext('2d') as unknown as CanvasRenderingContext2D, 'guanyu', pose, z, r)
          return c
        }
        // Gameplay-size tile on sky + ground strip.
        const gp = draw(gameplayZ)
        g.fillStyle = SKY
        g.fillRect(x0, y0 + 30, colW - 10, gpH)
        g.fillStyle = GROUND
        g.fillRect(x0, y0 + 30 + gpH - 14, colW - 10, 14)
        g.drawImage(gp, x0 + (colW - 10 - gp.width) / 2, y0 + 30 + gpH - gp.height)
        // 4x tile.
        const z4 = draw(Z4)
        g.fillStyle = SKY
        g.fillRect(x0, y0 + 36 + gpH, colW - 10, rowH)
        g.drawImage(z4, x0 + (colW - 10 - z4.width) / 2, y0 + 36 + gpH + rowH - z4.height)
        g.fillStyle = '#f5e6c8'
        g.font = '14px sans-serif'
        g.fillText(pose, x0 + 4, y0 + 46)
      })
    })
    writeFileSync('artifacts/wholeframe/guanyu-compare.png', cv.toBuffer('image/png'))
    expect(W).toBeGreaterThan(0)
  }, 120_000)
})
