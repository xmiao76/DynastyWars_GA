#!/usr/bin/env node
// CMR-14A heavy prepare step 1: arrange heavy-candidate-2's 5 figures into a
// 3x3 heavy-prepared-source.png (cells 0-4 in play order, 5-8 empty) at NATIVE
// scale. Candidate 1 stands down (seam adjudication 2026-10-08: multi-element
// waist + second contact; history preserved in git). Scale is solved later by
// the pack prepare (per-sheet uniform scale, prepare-lidian.mjs pattern) - no
// k-fit here, so no resampling damage. Masked component extraction (fig pixels
// dilated 2px, other figures' pixels excluded); fig3|fig4 separated along the
// proven seam (SEAM_BOX + dual flood + color rules, zero paint loss per trial).
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alphaComponents } from './motion-pipeline.mjs'
import { gridCellOf } from './motion-retouch.mjs'

export const SRC_PATH = 'art/motion/xiahoudun/heavy-candidate-2.png'
export const SRC_SHA = '21d44dcd4d4caae76d2a92467a25e396d051cca6b39420fac690dd52587bd4bf'
export const OUT_PATH = 'art/motion/xiahoudun/heavy-prepared-source.png'
// Proven seam (03:25 tick trial): the fig3|fig4 contact is ONE localizable patch
// (steel tip vs boot edge) inside SEAM_BOX. No column cut exists (figures'
// x-ranges overlap broadly); separation is box-exclusion + dual flood from torso
// seeds + in-box color rules (light steel incl ink outline -> fig3, dark boot ->
// fig4, twilight fringe -> nearest classified) + sub-64px splinter reattach.
export const SEAM_BOX = [1765, 595, 1815, 650]
export const SEAM_SEED_3 = [1414, 422]
export const SEAM_SEED_4 = [1882, 422]
const SRC_W = 2172, SRC_H = 724
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

/**
 * Separate candidate-2's merged fig3|fig4 comp (proven trial 2026-10-08):
 * exclusion box + dual flood from torso seeds + in-box color rules (light
 * steel incl ink outline -> fig3, dark boot -> fig4, twilight fringe ->
 * nearest classified) + sub-64px splinter reattach. Pure: never mutates input.
 */
export function separateHeavyMerge(image) {
  const W = image.width, H = image.height, d = image.data
  const at = (x, y) => d[(y * W + x) * 4 + 3]
  const comps = alphaComponents({ width: W, height: H, data: d }, 96).filter(c => c.area > 64).sort((a, b) => a.x0 - b.x0)
  if (comps.length !== 4) throw Error(`heavy-seam: expected 4 big comps, found ${comps.length}`)
  const m = comps[3], inM = new Set(m.pixels)
  const [bx0, by0, bx1, by1] = SEAM_BOX
  const inBox = (x, y) => x >= bx0 && x < bx1 && y >= by0 && y < by1
  for (const [sx, sy, who] of [[...SEAM_SEED_3, 'fig3'], [...SEAM_SEED_4, 'fig4']]) {
    if (at(sx, sy) < 96 || !inM.has(sy * W + sx)) throw Error(`heavy-seam: ${who} seed not solid merge ink`)
  }
  function flood(sx, sy) {
    const seen = new Set([sy * W + sx]), q = [[sx, sy]]
    while (q.length) {
      const [x, y] = q.pop()
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, np = ny * W + nx
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || inBox(nx, ny) || !inM.has(np) || seen.has(np)) continue
        seen.add(np); q.push([nx, ny])
      }
    }
    return seen
  }
  const f3 = flood(...SEAM_SEED_3), f4 = flood(...SEAM_SEED_4)
  let both = 0, neither = 0
  for (const p of m.pixels) {
    const x = p % W, y = (p / W) | 0
    if (inBox(x, y)) continue
    const a = f3.has(p), b = f4.has(p)
    if (a && b) both++
    if (!a && !b) neither++
  }
  if (both || neither) throw Error(`heavy-seam: box does not isolate sides: both=${both} neither=${neither}`)
  const cls = new Map()
  const lumaSat = (p) => {
    const k = p * 4, r = d[k], gg = d[k + 1], b = d[k + 2]
    return [.2126 * r + .7152 * gg + .0722 * b, Math.max(r, gg, b) - Math.min(r, gg, b)]
  }
  for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) {
    const p = y * W + x
    if (at(x, y) < 96 || !inM.has(p)) continue
    const [l, s] = lumaSat(p)
    if (l >= 68 && s < 45) cls.set(p, 3)
    else if (l < 60) cls.set(p, 4)
  }
  for (let pass = 0; pass < 2; pass++) for (const [p, c] of [...cls]) {
    if (c !== 4) continue
    const [l, s] = lumaSat(p)
    if (l >= 35 || s >= 20) continue
    const x = p % W, y = (p / W) | 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (cls.get((y + dy) * W + (x + dx)) === 3) { cls.set(p, 3); dx = 9; dy = 9 }
    }
  }
  let twilight = 0
  for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) {
    const p = y * W + x
    if (at(x, y) < 96 || !inM.has(p) || cls.has(p)) continue
    twilight++
    let best = null
    for (let rad = 1; rad <= 6 && best === null; rad++)
      for (let dy = -rad; dy <= rad && best === null; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (cls.get((y + dy) * W + (x + dx)) === 3) best = 3
      }
    if (best === null) for (let rad = 1; rad <= 6 && best === null; rad++)
      for (let dy = -rad; dy <= rad && best === null; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (cls.get((y + dy) * W + (x + dx)) === 4) best = 4
      }
    if (best === null) throw Error(`heavy-seam: twilight pixel (${x},${y}) has no classified neighbor`)
    cls.set(p, best)
  }
  for (const [p, c] of cls) (c === 3 ? f3 : f4).add(p)
  function reattach(set, other) {
    const seen = new Set()
    let moved = 0
    for (const p of [...set]) {
      if (seen.has(p)) continue
      const frag = [], q = [p]
      seen.add(p)
      while (q.length) {
        const c = q.pop()
        frag.push(c)
        const x = c % W, y = (c / W) | 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const np = (y + dy) * W + (x + dx)
          if (set.has(np) && !seen.has(np)) { seen.add(np); q.push(np) }
        }
      }
      if (frag.length > 64) continue
      let mine = 0, theirs = 0
      for (const f of frag) {
        const x = f % W, y = (f / W) | 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const np = (y + dy) * W + (x + dx)
          if (np === f) continue
          if (set.has(np)) mine++
          else if (other.has(np)) theirs++
        }
      }
      if (theirs > mine) { for (const f of frag) { set.delete(f); other.add(f); moved++ } }
    }
    return moved
  }
  const reattached = reattach(f3, f4) + reattach(f4, f3)
  function compCount(set) {
    const seen = new Set()
    let n = 0
    for (const p of set) {
      if (seen.has(p)) continue
      n++
      const q = [p]
      seen.add(p)
      while (q.length) {
        const c = q.pop(), x = c % W, y = (c / W) | 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const np = (y + dy) * W + (x + dx)
          if (set.has(np) && !seen.has(np)) { seen.add(np); q.push(np) }
        }
      }
    }
    return n
  }
  if (compCount(f3) !== 1 || compCount(f4) !== 1) throw Error('heavy-seam: separation fragmented a figure')
  function toFig(set) {
    const fig = { area: set.size, x0: W, x1: 0, y0: H, y1: 0, pixels: [...set] }
    for (const p of set) {
      const x = p % W, y = (p / W) | 0
      if (x < fig.x0) fig.x0 = x; if (x > fig.x1) fig.x1 = x
      if (y < fig.y0) fig.y0 = y; if (y > fig.y1) fig.y1 = y
    }
    return fig
  }
  const a = toFig(f3), b = toFig(f4)
  if (a.area + b.area !== m.area) throw Error('heavy-seam: paint loss in separation')
  return { figs: [comps[0], comps[1], comps[2], a, b], seam: { box: [...SEAM_BOX], fig3Area: a.area, fig4Area: b.area, reattached, twilight } }
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
  // Separate the merged fig3|fig4 comp along the proven seam.
  const { figs, seam } = separateHeavyMerge({ width: SRC_W, height: SRC_H, data: px.data })
  const out = createCanvas(OUT_W, OUT_H), og = out.getContext('2d')
  og.clearRect(0, 0, OUT_W, OUT_H)
  const placements = []
  const owner = new Map()
  figs.forEach((fig, fi) => { for (const p of fig.pixels) owner.set(p, fi) })
  figs.forEach((fig, fi) => {
    const fw = fig.x1 - fig.x0 + 1, fh = fig.y1 - fig.y0 + 1
    const [cx, cy, cw, ch] = cellRect(CELLS[fi])
    // Masked extraction with 2px dilation (same doctrine as the combo splice:
    // figure pixels only, disconnected junk excluded, soft rims kept). Pixels
    // owned by another figure are never absorbed (matters exactly at the seam,
    // where fig3/fig4 ink touches).
    const mask = new Set(fig.pixels)
    for (let pass = 0; pass < 2; pass++) {
      const add = []
      for (const p of mask) {
        const x = p % SRC_W, y = (p / SRC_W) | 0
        for (let ay = -1; ay <= 1; ay++) for (let ax = -1; ax <= 1; ax++) {
          const np = (y + ay) * SRC_W + (x + ax)
          if (!mask.has(np) && (!owner.has(np) || owner.get(np) === fi)) add.push(np)
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
  if (post.length !== 5) throw Error(`heavy-prepare: expected 5 drawings, found ${post.length} :: ${JSON.stringify(post.map(c => [c.area, c.x0, c.y0, c.x1, c.y1]))}`)
  const got = post.map(c => cellOf(c, OUT_W, OUT_H)).sort((a, b) => a - b)
  if (JSON.stringify(got) !== JSON.stringify([0, 1, 2, 3, 4])) throw Error(`heavy-prepare: drawings in cells [${got}] vs [0,1,2,3,4]`)
  for (const c of post) {
    if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= OUT_W - 1 || c.y1 >= OUT_H - 1) throw Error('heavy-prepare: edge contact')
  }
  return { image: od, placements, composition: { drawings: post.length }, seam }
}

async function main() {
  const r = await prepareHeavySource()
  const cv = createCanvas(OUT_W, OUT_H), g = cv.getContext('2d')
  g.putImageData(r.image, 0, 0)
  const png = cv.toBuffer('image/png')
  writeFileSync(OUT_PATH, png)
  console.log(JSON.stringify({ file: OUT_PATH, sha256: createHash('sha256').update(png).digest('hex'), placements: r.placements, composition: r.composition, seam: r.seam }))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
