import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { motionPreparedRecord } from '../../src/game/adapters/motion-art'
import { guanyuClips, validMotionPack } from '../../src/game/art/motion-clips'

/**
 * CMR-03 permanent pin for the trimmed repack: every displayed frame must
 * round-trip to its CMR-01 frozen RGBA, pages must respect the 2048 limit,
 * decoded bytes must respect the 16 MiB per-fighter cap, and the clip
 * timing hash must be unchanged. Any future repack re-runs this gate.
 */
const manifest = JSON.parse(readFileSync('docs/motion-tasks/guanyu-reference.json', 'utf8'))

describe('motion repack: trim/pivot round-trip and budgets', () => {
  it('every frame round-trips to the frozen CMR-01 RGBA hash', async () => {
    const meta = motionPreparedRecord()
    const sheet = await loadImage('src/game/assets/motion/guanyu-motion-sheet.png')
    const actions = await loadImage('src/game/assets/motion/guanyu-actions-sheet.png')
    for (const [name, c] of Object.entries(meta.frames)) {
      const src = c.sheet === 'actions' ? actions : sheet
      const rt = createCanvas(c.srcW ?? c.w, c.srcH ?? c.h)
      const g = rt.getContext('2d')
      g.drawImage(src, c.x, c.y, c.w, c.h, c.trimX ?? 0, c.trimY ?? 0, c.w, c.h)
      const d = g.getImageData(0, 0, rt.width, rt.height).data
      const h = createHash('sha256').update(Buffer.from(d)).digest('hex')
      expect(h, `${name} displayed RGBA`).toBe(manifest.frames[name].rgba)
    }
  }, 120_000)

  it('pages respect the 2048 limit and decoded bytes fit the 16 MiB cap', () => {
    const meta = motionPreparedRecord()
    expect(meta.sheet.width).toBeLessThanOrEqual(2048)
    expect(meta.sheet.height).toBeLessThanOrEqual(2048)
    expect(meta.actionSheet.width).toBeLessThanOrEqual(2048)
    expect(meta.actionSheet.height).toBeLessThanOrEqual(2048)
    let decoded = 0
    for (const c of Object.values(meta.frames)) decoded += c.w * c.h * 4
    expect(decoded / 1048576, 'trimmed decoded per humanoid').toBeLessThanOrEqual(16)
    // density and the art box (registration anchors) are unchanged.
    expect(meta.density).toBe(2)
    expect(meta.box).toEqual({ width: 224, height: 144, groundY: 136 })
    expect(validMotionPack(meta), 'trim-aware validation accepts the repack').toBe(true)
  })

  it('clip timing is untouched (clipsHash pin)', () => {
    const norm = Object.fromEntries(
      Object.entries(guanyuClips()).map(([k, v]) => [k, { loop: v.loop, duration: v.duration, keys: v.keys }]),
    )
    const hash = createHash('sha256').update(JSON.stringify(norm)).digest('hex')
    expect(hash).toBe('cd926d062b86def8f6a309b480d4b9383a6a612985dbff920837e28fa06ec31f')
  })
})
