import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { drawFigure } from '../../src/game/art/draw'
import { ENEMY_FIGURES, HERO_FIGURES } from '../../src/game/art/figures'
import { HAND_CELLS, HAND_CELL_H, HAND_CELL_W, prepareHero, DENSITY, FAR_SHADE } from '../../scripts/prepare-body-parts.mjs'
import { shade } from '../../src/game/art/palette'
import { IDLE, POSE_TABLE, type PoseName } from '../../src/game/art/poses'
import type { BodyArt } from '../../src/game/art/body-parts'
import { HAND_CELL_NAMES } from '../../src/game/art/hand-parts'

/**
 * BODY-20 measurable acceptance: every fighter renders hands from painted
 * cells - skin-matched, soft-shaded, ink-free - and the procedural
 * capsules remain only as the no-art emergency path.
 */
type Ctx = CanvasRenderingContext2D
const SCALE = 2
const PACKS = ['hero-bodies', 'mook-bodies', 'boss-bodies'] as const

function rgbChannels(n: number): [number, number, number] {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

interface CellStats {
  opaque: number
  fill: number
  minLum: number
  darkShare: number
  modal: [number, number, number]
  bbox: { w: number; h: number } | null
}

async function cellStats(pack: string, id: string, cell: string): Promise<CellStats> {
  const meta = (await import(`../../src/game/assets/${pack}/prepared.json`)).default as Record<
    string, { skin: string; parts: Record<string, { x: number; y: number; w: number; h: number }> }
  >
  const c = meta[id]!.parts[cell]!
  const sheet = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
  const cv = createCanvas(c.w, c.h)
  const ctx = cv.getContext('2d')
  ctx.drawImage(sheet, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
  const px = ctx.getImageData(0, 0, c.w, c.h).data
  const colors = new Map<number, number>()
  let opaque = 0
  let minLum = 255
  let dark = 0
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity
  for (let y = 0; y < c.h; y += 1) {
    for (let x = 0; x < c.w; x += 1) {
      const p = (y * c.w + x) * 4
      if ((px[p + 3] ?? 0) <= 200) continue
      opaque += 1
      const k = (px[p]! << 16) | (px[p + 1]! << 8) | px[p + 2]!
      colors.set(k, (colors.get(k) ?? 0) + 1)
      const lum = Math.round(((px[p]! * 0.299) + (px[p + 1]! * 0.587) + (px[p + 2]! * 0.114)))
      if (lum < minLum) minLum = lum
      if (lum < 34) dark += 1
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  let modalKey = 0
  let modalN = -1
  for (const [k, n] of colors) if (n > modalN) { modalN = n; modalKey = k }
  return {
    opaque,
    fill: opaque / (c.w * c.h),
    minLum,
    darkShare: dark / Math.max(1, opaque),
    modal: [(modalKey >> 16) & 255, (modalKey >> 8) & 255, modalKey & 255],
    bbox: opaque === 0 ? null : { w: (x1 - x0 + 1) / DENSITY, h: (y1 - y0 + 1) / DENSITY },
  }
}

async function packFighters(): Promise<Array<{ pack: string; id: string; skin: number }>> {
  const out: Array<{ pack: string; id: string; skin: number }> = []
  for (const pack of PACKS) {
    const meta = (await import(`../../src/game/assets/${pack}/prepared.json`)).default as Record<
      string, { skin: string }
    >
    for (const [id, m] of Object.entries(meta)) {
      out.push({ pack, id, skin: parseInt(m.skin.slice(1), 16) })
    }
  }
  expect(out.length).toBe(17)
  return out
}

describe('BODY-20 painted hand cells', () => {
  it('regenerates a production sheet byte-identically (deterministic)', async () => {
    const { sheet } = await prepareHero('guanyu')
    const committed = readFileSync('src/game/assets/hero-bodies/guanyu-sheet.png')
    expect(Buffer.from(sheet.toBuffer('image/png')).equals(committed)).toBe(true)
  }, 60_000)

  it('every fighter ships all five cells, painted in their own skin', async () => {
    const failures: string[] = []
    for (const { pack, id, skin } of await packFighters()) {
      for (const cell of HAND_CELLS) {
        const s = await cellStats(pack, id, cell)
        const want: [number, number, number] = cell.endsWith('F')
          ? rgbChannels(shade(skin, 1 - FAR_SHADE))
          : rgbChannels(skin)
        if (s.opaque < 150) failures.push(`${id}:${cell} nearly empty (${s.opaque}px)`)
        if (s.fill < 0.15) failures.push(`${id}:${cell} fill ${(s.fill * 100).toFixed(0)}%`)
        // Modal tone: the lit face of the hand (base + light bloom), still
        // unmistakably THIS fighter's skin - ±45/channel keeps every other
        // fighter's tone out (measured blooms land +20..+42).
        for (const [i, ch] of s.modal.entries()) {
          if (Math.abs(ch - (want[i] ?? 0)) > 45) {
            failures.push(`${id}:${cell} modal ${s.modal.join(',')} vs skin ${want.join(',')} (ch ${i})`)
            break
          }
        }
        // No ink: the shared outline is #140f14 (lum 15) laid around the
        // WHOLE silhouette. Deep form shadow on the far cells dips to
        // ~27 legitimately, so gate the SHARE of dark pixels (a ring is
        // >25% of any outline's pixels) plus a floor above pure ink.
        if (s.minLum < 20) failures.push(`${id}:${cell} has ink-dark pixels (lum ${s.minLum})`)
        if (s.darkShare > 0.06) failures.push(`${id}:${cell} dark ring (${(s.darkShare * 100).toFixed(1)}% of pixels)`)
        if (!s.bbox) { failures.push(`${id}:${cell} no bbox`); continue }
        // wrapF measures along the haft (h); hands along the arm (w).
        // Fingertip pads are shorter than a whole fist.
        const spanAlong = cell === 'wrapF' ? s.bbox.h : s.bbox.w
        const spanAcross = cell === 'wrapF' ? s.bbox.w : s.bbox.h
        const alongMin = cell === 'wrapF' ? 5.5 : 7.2
        const alongMax = cell === 'wrapF' ? 8.5 : 11.6
        if (spanAlong < alongMin || spanAlong > alongMax) failures.push(`${id}:${cell} length ${spanAlong.toFixed(1)}u`)
        if (spanAcross < 4.2 || spanAcross > 9.2) failures.push(`${id}:${cell} width ${spanAcross.toFixed(1)}u`)
      }
    }
    expect(failures).toEqual([])
  }, 120_000)

  it('cell layout: uniform size, pivot at the hand joint', async () => {
    const meta = (await import('../../src/game/assets/hero-bodies/prepared.json')).default as Record<
      string, { parts: Record<string, { w: number; h: number; pivotX: number; pivotY: number }> }
    >
    const guanyu = meta.guanyu!
    for (const cell of HAND_CELL_NAMES) {
      const c = guanyu.parts[cell]!
      expect(c.w).toBe(HAND_CELL_W * DENSITY)
      expect(c.h).toBe(HAND_CELL_H * DENSITY)
      expect(c.pivotX).toBe((HAND_CELL_W * DENSITY) / 2)
      expect(c.pivotY).toBe((HAND_CELL_H * DENSITY) / 2)
    }
  })

  it('painted hands render and differ from the procedural capsules', async () => {
    const id = 'guanyu'
    const meta = (await import('../../src/game/assets/hero-bodies/prepared.json')).default as Record<
      string, { revision: string; skin: string; density: number; parts: BodyArt['parts'] }
    >
    const sheet = (await loadImage('src/game/assets/hero-bodies/guanyu-sheet.png')) as unknown as CanvasImageSource
    const body: BodyArt = {
      id, revision: meta[id]!.revision, sheet, density: meta[id]!.density,
      parts: meta[id]!.parts, skin: parseInt(meta[id]!.skin.slice(1), 16),
    }
    const plan = HERO_FIGURES[id]!
    for (const poseName of ['idle', 'attack', 'down'] as PoseName[]) {
      const render = (withBody: boolean): Uint8Array => {
        const canvas = createCanvas(120 * SCALE, 110 * SCALE)
        const ctx = canvas.getContext('2d')
        ctx.scale(SCALE, SCALE)
        drawFigure(ctx as unknown as Ctx, plan, POSE_TABLE[poseName],
          withBody ? { poseName, body } : undefined)
        return new Uint8Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data)
      }
      const a = render(true)
      const b = render(false)
      expect(a.length).toBe(b.length)
      let diff = 0
      for (let i = 0; i < a.length; i += 4) {
        const oa = (a[i + 3] ?? 0) > 128
        const ob = (b[i + 3] ?? 0) > 128
        if (oa !== ob) diff += 1
      }
      // The hand region (and only it, in these poses the bodies also differ
      // through the sheet) - just require the renders be genuinely
      // different so a silent no-op of the painted path cannot pass.
      expect(diff, `${poseName}: painted render identical to procedural`).toBeGreaterThan(50)
    }
  })

  it('falls back to the procedural fist when the sheet lacks hand cells', async () => {
    const id = 'guanyu'
    const meta = (await import('../../src/game/assets/hero-bodies/prepared.json')).default as Record<
      string, { revision: string; skin: string; density: number; parts: BodyArt['parts'] }
    >
    const sheet = (await loadImage('src/game/assets/hero-bodies/guanyu-sheet.png')) as unknown as CanvasImageSource
    const parts: BodyArt['parts'] = {}
    for (const [k, v] of Object.entries(meta[id]!.parts)) {
      if (!(HAND_CELL_NAMES as readonly string[]).includes(k)) parts[k as keyof typeof parts] = v
    }
    const body: BodyArt = {
      id, revision: meta[id]!.revision, sheet, density: meta[id]!.density,
      parts, skin: parseInt(meta[id]!.skin.slice(1), 16),
    }
    const plan = HERO_FIGURES[id]!
    const canvas = createCanvas(120 * SCALE, 110 * SCALE)
    const ctx = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)
    drawFigure(ctx as unknown as Ctx, plan, IDLE, { poseName: 'idle', body })
    const data = new Uint8Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data)
    // Procedural fist paints the fighter's EXACT hand material skin.
    const want = rgbChannels(body.skin)
    const { weaponPose } = await import('../../src/game/art/weapons')
    const { applyBuild } = await import('../../src/game/art/rig')
    const pose = weaponPose(plan, applyBuild(POSE_TABLE.idle, plan.build))
    let n = 0
    for (let y = Math.round((pose.handN.y - 3) * SCALE); y <= Math.round((pose.handN.y + 3) * SCALE); y += 1) {
      for (let x = Math.round((pose.handN.x - 3) * SCALE); x <= Math.round((pose.handN.x + 3) * SCALE); x += 1) {
        const p = (y * 120 * SCALE + x) * 4
        if ((data[p + 3] ?? 0) < 128) continue
        if (data[p] === want[0] && data[p + 1] === want[1] && data[p + 2] === want[2]) n += 1
      }
    }
    expect(n, 'procedural fallback fist at the grip').toBeGreaterThanOrEqual(24)
  })
})

// Enemy figure table must keep covering every pack id (cast sanity for the
// loop above).
void ENEMY_FIGURES
