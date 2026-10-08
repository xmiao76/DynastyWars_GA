#!/usr/bin/env node
// CMR-14A heavy prepare step 1: arrange heavy-candidate-1's 5 figures into a
// 3x3 heavy-prepared-source.png (cells 0-4 in play order, 5-8 empty) at NATIVE
// scale. Scale is solved later by the pack prepare (per-sheet uniform scale,
// prepare-lidian.mjs pattern) - no k-fit here, so no resampling damage.
// Masked component extraction (fig pixels dilated 2px); fig4|fig5 split at
// the emptiest column (x1479, fringe touch, parts intact per 3x review).
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alphaComponents } from './motion-pipeline.mjs'
import { gridCellOf } from './motion-retouch.mjs'

export const SRC_PATH = 'art/motion/xiahoudun/heavy-candidate-1.png'
export const SRC_SHA = '7c5de005ae47c239bdeeb0ece6d0c7d5dd4fdf742b74c41d54c3d1a182c0ffb2'
export const OUT_PATH = 'art/motion/xiahoudun/heavy-prepared-source.png'
export const SPLIT_X = 1479
const SRC_W = 1933, SRC_H = 814
// Container sheet only: per-sheet uniform scale is solved later by the pack
// prepare (prepare-lidian.mjs pattern), so native mutual scale is preserved
// here and cells just need to HOLD the tallest drawing (fig0 raise, 640px).
// 3x3 row-major convention kept for pipeline cell tooling.
const OUT_W = 1920, OUT_H = 1980
// Play-order cells for the 5 heavy drawings (raise/hold/chop/follow/recover).
export const CELLS = [0, 1, 2, 3, 4]

function cellRect(i) {
  const cw = OUT_W / 3, ch = OUT_H / 3
  return [(i % 3) * cw, Math.floor((i / 3) | 0) * ch, cw, ch]
}

export async function prepareHeavySource() {
  const bytes = readFileSync(SRC_PATH)
  if (createHash('sha256').update(bytes).digest('hex') !== SRC_SHA) throw Error('heavy-prepare: source hash changed')
  const img = await loadImage(bytes)
  if (img.width !== SRC_W || img.height !== SRC_H) throw Error('heavy-prepare: source size changed')
  const cv = createCanvas(SRC_W, SRC_H), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  const px = g.getImageData(0, 0, SRC_W, SRC_H)
  const comps = alphaComponents({ width: SRC_W, height: SRC_H, data: px.data }, 96).filter(c => c.area > 64).sort((a, b) => a.x0 - b.x0)
  if (comps.length !== 4) throw Error(`heavy-prepare: expected 4 big comps, found ${comps.length}`)
  // Split the merged fig4|fig5 comp at the emptiest column.
  const figs = [comps[0], comps[1], comps[2]]
  {
    const m = comps[3]
    const a = { area: 0, x0: SRC_W, x1: 0, y0: SRC_H, y1: 0, pixels: [] }
    const b = { area: 0, x0: SRC_W, x1: 0, y0: SRC_H, y1: 0, pixels: [] }
    for (const p of m.pixels) {
      const x = p % SRC_W, y = (p / SRC_W) | 0
      const t = x < SPLIT_X ? a : b
      t.area++; t.pixels.push(p)
      if (x < t.x0) t.x0 = x; if (x > t.x1) t.x1 = x
      if (y < t.y0) t.y0 = y; if (y > t.y1) t.y1 = y
    }
    if (!a.area || !b.area) throw Error('heavy-prepare: split left an empty figure')
    figs.push(a, b)
  }
  const out = createCanvas(OUT_W, OUT_H), og = out.getContext('2d')
  og.clearRect(0, 0, OUT_W, OUT_H)
  const placements = []
  figs.forEach((fig, fi) => {
    const fw = fig.x1 - fig.x0 + 1, fh = fig.y1 - fig.y0 + 1
    const [cx, cy, cw, ch] = cellRect(CELLS[fi])
    // Masked extraction with 2px dilation (same doctrine as the combo splice:
    // figure pixels only, disconnected junk excluded, soft rims kept).
    const mask = new Set(fig.pixels)
    for (let pass = 0; pass < 2; pass++) {
      const add = []
      for (const p of mask) {
        const x = p % SRC_W, y = (p / SRC_W) | 0
        for (let ay = -1; ay <= 1; ay++) for (let ax = -1; ax <= 1; ax++) {
          const np = (y + ay) * SRC_W + (x + ax)
          if (!mask.has(np)) add.push(np)
        }
      }
      for (const np of add) mask.add(np)
    }
    // Center in cell; fail (don't clip) if the native drawing overflows.
    const dx = Math.round(cx + (cw - fw) / 2), dy = Math.round(cy + (ch - fh) / 2)
    if (dx < 0 || dy < 0 || dx + fw > OUT_W || dy + fh > OUT_H) {
      throw Error(`heavy-prepare: fig ${fi} (${fw}x${fh}) overflows its cell - needs owner-visible layout call`)
    }
    const piece = createCanvas(fw, fh), pg = piece.getContext('2d')
    const pdata = pg.createImageData(fw, fh)
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const sp = (fig.y0 + y) * SRC_W + (fig.x0 + x)
      if (!mask.has(sp)) continue
      const dk = (y * fw + x) * 4
      for (let ch2 = 0; ch2 < 4; ch2++) pdata.data[dk + ch2] = px.data[sp * 4 + ch2]
    }
    pg.putImageData(pdata, 0, 0)
    og.drawImage(piece, dx, dy)
    placements.push({ fig: fi, cell: CELLS[fi], srcBox: [fig.x0, fig.y0, fw, fh], dst: [dx, dy, fw, fh] })
  })
  const od = og.getImageData(0, 0, OUT_W, OUT_H)
  const cellOf = gridCellOf(3, 3)
  const post = alphaComponents({ width: OUT_W, height: OUT_H, data: od.data }, 96).filter(c => c.area > 64)
  if (post.length !== 5) throw Error(`heavy-prepare: expected 5 drawings, found ${post.length}`)
  const got = post.map(c => cellOf(c, OUT_W, OUT_H)).sort((a, b) => a - b)
  if (JSON.stringify(got) !== JSON.stringify([0, 1, 2, 3, 4])) throw Error(`heavy-prepare: drawings in cells [${got}] vs [0,1,2,3,4]`)
  for (const c of post) {
    if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= OUT_W - 1 || c.y1 >= OUT_H - 1) throw Error('heavy-prepare: edge contact')
  }
  return { image: od, placements, composition: { drawings: post.length } }
}

async function main() {
  const r = await prepareHeavySource()
  const cv = createCanvas(OUT_W, OUT_H), g = cv.getContext('2d')
  g.putImageData(r.image, 0, 0)
  const png = cv.toBuffer('image/png')
  writeFileSync(OUT_PATH, png)
  console.log(JSON.stringify({ file: OUT_PATH, sha256: createHash('sha256').update(png).digest('hex'), placements: r.placements, composition: r.composition }))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
