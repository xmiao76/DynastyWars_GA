import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { guanyuClips } from '../../src/game/art/motion-clips'
import actions from '../../src/game/assets/motion/actions-prepared.json'
import regular from '../../src/game/assets/motion/prepared.json'

interface Landmark { butt: [number, number]; tip: [number, number] }
const landmarks = (JSON.parse(readFileSync('art/motion/guanyu/weapon-review.json', 'utf8')) as { frames: Record<string, Landmark> }).frames
function directionDelta(a: Landmark, b: Landmark): number {
  const angle = (m: Landmark): number => Math.atan2(m.tip[1] - m.butt[1], m.tip[0] - m.butt[0])
  let d = Math.abs(angle(b) - angle(a))
  if (d > Math.PI) d = 2 * Math.PI - d
  return d * 180 / Math.PI
}
const peakStep = (ids: string[]): number => Math.max(...ids.slice(1).map((id, i) => directionDelta(landmarks[ids[i]!]!, landmarks[id]!)))

describe('Guan Yu special/mounted weapon direction continuity', () => {
  it('current displayed adjacent poses avoid abrupt backwards-to-forwards reversals', () => {
    for (const action of ['special', 'mountedsweep'] as const) {
      const ids = guanyuClips()[action].keys.map((k) => k.frame)
      expect(peakStep(ids), action).toBeLessThanOrEqual(60)
    }
  })
  it('negative control rejects original mounted windup and special recovery jump', () => {
    expect(peakStep(['rider:0', 'rider:3', 'rider:4'])).toBeGreaterThan(60)
    expect(peakStep(['special:4', 'special:5', 'special:6'])).toBeGreaterThan(60)
  })
  it('landmark endpoints are actually supported by drawn sprite pixels', async () => {
    const sheets = [await loadImage('src/game/assets/motion/guanyu-motion-sheet.png'), await loadImage('src/game/assets/motion/guanyu-actions-sheet.png')]
    const frames = { ...regular.guanyu.frames, ...actions.frames } as Record<string, { x: number; y: number; w: number; h: number; sheet?: string; trimX?: number; trimY?: number; srcW?: number; srcH?: number }>
    for (const [id, mark] of Object.entries(landmarks)) {
      const c = frames[id]!, image = sheets[c.sheet ? 1 : 0]!
      // CMR-03 repack: restore the trimmed content at (trimX, trimY) inside
      // the full cell, exactly as the display blit does - landmarks live in
      // full-cell coordinates.
      const cw = c.srcW ?? c.w, ch = c.srcH ?? c.h
      const cv = createCanvas(cw, ch), g = cv.getContext('2d')
      g.drawImage(image, c.x, c.y, c.w, c.h, c.trimX ?? 0, c.trimY ?? 0, c.w, c.h)
      const data = g.getImageData(0, 0, cw, ch).data
      for (const [name, [x, y]] of Object.entries(mark)) {
        let found = false
        for (let yy = Math.max(0, Math.round(y * 2) - 6); yy <= Math.min(ch - 1, Math.round(y * 2) + 6); yy++) {
          for (let xx = Math.max(0, Math.round(x * 2) - 6); xx <= Math.min(cw - 1, Math.round(x * 2) + 6); xx++) {
            if (data[(yy * cw + xx) * 4 + 3]! >= 96) found = true
          }
        }
        expect(found, `${id}:${name} landmark has no nearby drawn pixel`).toBe(true)
      }
    }
  })
})
