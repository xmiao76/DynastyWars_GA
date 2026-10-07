#!/usr/bin/env node
// CMR-14A combo round-2 splice: k-fit the 5 redrawn round-2 figures into
// combo-candidate-1 cells 0/2/3/6/7. Deterministic, hash-pinned, ignored output.
// Round-2 provider drew ~1.39x over scale; uniform K preserves proportions
// (heads end walk-matched, which is the requirement). Non-target cells 1/4/5/8
// stay byte-exact. Fringe touches are split on empty-space cut columns.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alphaComponents } from './motion-pipeline.mjs'
import { gridCellOf, verifySheetComposition } from './motion-retouch.mjs'

export const CAND_PATH = 'art/motion/xiahoudun/combo-candidate-1.png'
export const CAND_SHA = 'c2c5fefc1ac36a8ab428dca8cc966927df1103f5bda98d8dcbbf0304bccd6e0b'
export const R2_PATH = 'art/motion/xiahoudun/acceptance4-round2-combo-raw.png'
export const R2_SHA = '26427f3000e9f12fd63417da6ca24adf5cf14deff21354cec6e8d1ae965fd788'
export const OUT_PATH = 'art/motion/xiahoudun/combo-round2-spliced-source.png'
// K = walk-anchor figure-height median (321) / round-2 level-figure median (424).
export const K = 321 / 424
// [r2figIndex, candidateCell, r2 x-band] in round-2 left-to-right order.
export const MAP = [[0, 0], [1, 2], [2, 3], [3, 6], [4, 7]]
export const KEEP = [1, 4, 5, 8]
const R2_W = 2172, R2_H = 724, C_W = 1536, C_H = 1024

function pixelsOf(image) {
  const cv = createCanvas(image.width, image.height), g = cv.getContext('2d')
  g.drawImage(image, 0, 0)
  const d = g.getImageData(0, 0, image.width, image.height)
  return { width: image.width, height: image.height, data: d.data }
}
async function loadPixels(path, sha, w, h) {
  const bytes = readFileSync(path)
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw Error(`splice: ${path} hash changed`)
  const img = await loadImage(bytes)
  if (img.width !== w || img.height !== h) throw Error(`splice: ${path} size changed`)
  return pixelsOf(img)
}
// Emptiest column in [a,b) = cut line through the fringe touch.
function cutColumn(alpha, W, H, a, b) {
  let best = a, bestN = Infinity
  for (let x = a; x < b; x++) {
    let n = 0
    for (let y = 0; y < H; y++) if (alpha[(y * W + x) * 4 + 3] >= 96) n++
    if (n < bestN) { bestN = n; best = x }
  }
  return { x: best, opaque: bestN }
}
// Longest-extent axis of a pixel set via PCA; endpoints + length + angle.
function pcaLength(pts) {
  let mx = 0, my = 0
  for (const [x, y] of pts) { mx += x; my += y }
  mx /= pts.length; my /= pts.length
  let sxx = 0, sxy = 0, syy = 0
  for (const [x, y] of pts) { const dx = x - mx, dy = y - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy }
  const tr = sxx + syy, det = sxx * syy - sxy * sxy
  const l1 = tr / 2 + Math.sqrt(Math.max(0, (tr / 2) ** 2 - det))
  let ux = l1 - syy, uy = sxy
  const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m
  let lo = Infinity, hi = -Infinity, loP = null, hiP = null
  for (const [x, y] of pts) {
    const t = (x - mx) * ux + (y - my) * uy
    if (t < lo) { lo = t; loP = [x, y] } if (t > hi) { hi = t; hiP = [x, y] }
  }
  return { length: hi - lo, butt: loP, tip: hiP, angleDeg: Math.atan2(uy, ux) * 180 / Math.PI }
}

export async function spliceComboRound2() {
  const cand = await loadPixels(CAND_PATH, CAND_SHA, C_W, C_H)
  const r2 = await loadPixels(R2_PATH, R2_SHA, R2_W, R2_H)
  const cellOf = gridCellOf(3, 3)
  // 1. Assign candidate drawings; keep-cell pixel sets for the exactness gate.
  const candComps = alphaComponents(cand, 96).filter(c => c.area > 64)
  const byCell = new Map()
  for (const c of candComps) {
    const i = cellOf(c, C_W, C_H)
    if (!byCell.has(i)) byCell.set(i, [])
    byCell.get(i).push(c)
  }
  for (const i of [...KEEP, ...MAP.map(m => m[1])]) if (!byCell.get(i)?.length) throw Error(`splice: candidate cell ${i} drawing missing`)
  const oldBox = new Map()
  for (const [, j] of MAP) {
    let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0
    for (const c of byCell.get(j)) for (const p of c.pixels) {
      const x = p % C_W, y = (p / C_W) | 0
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    oldBox.set(j, { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 })
  }
  // 2. Round-2 components; split fringe touches on empty-space cut columns.
  const cutA = cutColumn(r2.data, R2_W, R2_H, 926, 979)
  const cutB = cutColumn(r2.data, R2_W, R2_H, 1650, 1800)
  if (cutA.opaque > 4 || cutB.opaque > 4) throw Error(`splice: cut column not empty (${cutA.x}:${cutA.opaque}, ${cutB.x}:${cutB.opaque})`)
  const bands = [[0, 430], [430, cutA.x], [cutA.x, 1330], [1330, cutB.x], [cutB.x, R2_W]]
  // 3. Erase replaced drawings; paste k-scaled figures centered on old centers.
  const out = { width: C_W, height: C_H, data: new Uint8ClampedArray(cand.data) }
  const erase = (px, py) => { const k = (py * C_W + px) * 4; out.data[k] = 0; out.data[k + 1] = 0; out.data[k + 2] = 0; out.data[k + 3] = 0 }
  for (const [, j] of MAP) for (const c of byCell.get(j)) for (const p of c.pixels) erase(p % C_W, (p / C_W) | 0)
  const placements = []
  for (const [fi, j] of MAP) {
    const [a, b] = bands[fi]
    let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0
    const r2c = await loadImage(readFileSync(R2_PATH))
    const tmp = createCanvas(R2_W, R2_H), tg = tmp.getContext('2d')
    tg.drawImage(r2c, 0, 0)
    const full = tg.getImageData(0, 0, R2_W, R2_H)
    for (let y = 0; y < R2_H; y++) for (let x = a; x < b; x++) {
      if (full.data[(y * R2_W + x) * 4 + 3] >= 96) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      }
    }
    const sw = x1 - x0 + 1, sh = y1 - y0 + 1
    const dw = Math.max(1, Math.round(sw * K)), dh = Math.max(1, Math.round(sh * K))
    const box = oldBox.get(j)
    const dx = Math.round(box.cx - dw / 2), dy = Math.round(box.cy - dh / 2)
    // Resample with smoothing on (recorded); paste additively over cleared zone.
    const src = createCanvas(R2_W, R2_H), sg = src.getContext('2d')
    sg.drawImage(r2c, 0, 0)
    const piece = createCanvas(sw, sh), pg = piece.getContext('2d')
    pg.drawImage(src, x0, y0, sw, sh, 0, 0, sw, sh)
    const scaled = createCanvas(dw, dh), gg = scaled.getContext('2d')
    gg.imageSmoothingEnabled = true; gg.imageSmoothingQuality = 'high'
    gg.drawImage(piece, 0, 0, dw, dh)
    const sd = gg.getImageData(0, 0, dw, dh)
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const ox = dx + x, oy = dy + y
      if (ox < 0 || oy < 0 || ox >= C_W || oy >= C_H) throw Error(`splice: fig ${fi} paste out of bounds`)
      const sk = (y * dw + x) * 4
      if (sd.data[sk + 3] === 0) continue
      const dk = (oy * C_W + ox) * 4
      for (let ch = 0; ch < 4; ch++) out.data[dk + ch] = sd.data[sk + ch]
    }
    placements.push({ fig: fi, cell: j, srcBox: [x0, y0, sw, sh], dst: [dx, dy, dw, dh] })
  }
  // 4. Gates: keep-cells exact, 9 drawings, 0 edge contact.
  for (const c of candComps) {
    const i = cellOf(c, C_W, C_H)
    if (!KEEP.includes(i)) continue
    for (const p of c.pixels) for (let ch = 0; ch < 4; ch++) {
      if (cand.data[p * 4 + ch] !== out.data[p * 4 + ch]) throw Error(`splice: keep cell ${i} changed`)
    }
  }
  const composition = verifySheetComposition(out, { expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8], cellOf })
  const post = alphaComponents(out, 96).filter(c => c.area > 64)
  for (const c of post) {
    if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= C_W - 1 || c.y1 >= C_H - 1) throw Error('splice: edge contact')
  }
  // 5. Per-new-cell PCA lengths (axis-measured at overlay review next).
  const cellOfOut = gridCellOf(3, 3)
  const measured = []
  for (const [, j] of MAP) {
    const pts = []
    for (const c of post) {
      if (cellOfOut(c, C_W, C_H) !== j) continue
      for (const p of c.pixels) pts.push([p % C_W, (p / C_W) | 0])
    }
    measured.push({ cell: j, n: pts.length, ...pcaLength(pts) })
  }
  return { image: out, placements, cuts: { A: cutA, B: cutB }, composition, measured }
}

export const CELL0_OUT = 'art/motion/xiahoudun/combo-cell0-spliced-source.png'

// Single-cell salvage: fig1 (fully isolated round-2 windup) into candidate
// cell 0 by component extraction - no cut column needed. Cells 1-8 stay exact.
export async function spliceComboCell0() {
  const cand = await loadPixels(CAND_PATH, CAND_SHA, C_W, C_H)
  const r2 = await loadPixels(R2_PATH, R2_SHA, R2_W, R2_H)
  const cellOf = gridCellOf(3, 3)
  const candComps = alphaComponents(cand, 96).filter(c => c.area > 64)
  const old = candComps.filter(c => cellOf(c, C_W, C_H) === 0)
  if (!old.length) throw Error('splice cell0: candidate cell 0 drawing missing')
  let ox0 = 1e9, ox1 = 0, oy0 = 1e9, oy1 = 0
  for (const c of old) for (const p of c.pixels) {
    const x = p % C_W, y = (p / C_W) | 0
    if (x < ox0) ox0 = x; if (x > ox1) ox1 = x; if (y < oy0) oy0 = y; if (y > oy1) oy1 = y
  }
  const r2big = alphaComponents(r2, 96).filter(c => c.area > 64)
  const figs = r2big.filter(c => c.x1 <= 410)
  if (figs.length !== 1) throw Error(`splice cell0: expected 1 isolated fig, found ${figs.length}`)
  const fig = figs[0]
  const fw = fig.x1 - fig.x0 + 1, fh = fig.y1 - fig.y0 + 1
  const out = { width: C_W, height: C_H, data: new Uint8ClampedArray(cand.data) }
  for (const c of old) for (const p of c.pixels) {
    const k = p * 4
    out.data[k] = 0; out.data[k + 1] = 0; out.data[k + 2] = 0; out.data[k + 3] = 0
  }
  const r2img = await loadImage(readFileSync(R2_PATH))
  const src = createCanvas(R2_W, R2_H), sg = src.getContext('2d')
  sg.drawImage(r2img, 0, 0)
  const piece = createCanvas(fw, fh), pg = piece.getContext('2d')
  pg.drawImage(src, fig.x0, fig.y0, fw, fh, 0, 0, fw, fh)
  const dw = Math.max(1, Math.round(fw * K)), dh = Math.max(1, Math.round(fh * K))
  const scaled = createCanvas(dw, dh), gg = scaled.getContext('2d')
  // Nearest-neighbor: bilinear pinches the thin shaft below the alpha gate
  // and severs the head (proven by the 718+1134px fragments on the first try).
  gg.imageSmoothingEnabled = false
  gg.drawImage(piece, 0, 0, dw, dh)
  const sd = gg.getImageData(0, 0, dw, dh)
  const dx = Math.round((ox0 + ox1) / 2 - dw / 2), dy = Math.round((oy0 + oy1) / 2 - dh / 2)
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const ox = dx + x, oy = dy + y
    if (ox < 0 || oy < 0 || ox >= C_W || oy >= C_H) throw Error('splice cell0: paste out of bounds')
    const sk = (y * dw + x) * 4
    if (sd.data[sk + 3] === 0) continue
    const dk = (oy * C_W + ox) * 4
    for (let ch = 0; ch < 4; ch++) out.data[dk + ch] = sd.data[sk + ch]
  }
  for (const c of candComps) {
    if (cellOf(c, C_W, C_H) === 0) continue
    for (const p of c.pixels) for (let ch = 0; ch < 4; ch++) {
      if (cand.data[p * 4 + ch] !== out.data[p * 4 + ch]) throw Error('splice cell0: non-target cell changed')
    }
  }
  const composition = verifySheetComposition(out, { expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8], cellOf })
  const post = alphaComponents(out, 96).filter(c => c.area > 64)
  for (const c of post) {
    if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= C_W - 1 || c.y1 >= C_H - 1) throw Error('splice cell0: edge contact')
  }
  const pts = []
  for (const c of post) {
    if (cellOf(c, C_W, C_H) !== 0) continue
    for (const p of c.pixels) pts.push([p % C_W, (p / C_W) | 0])
  }
  return { image: out, placement: { srcBox: [fig.x0, fig.y0, fw, fh], dst: [dx, dy, dw, dh] }, composition, measured: { cell: 0, n: pts.length, ...pcaLength(pts) } }
}

async function main() {
  if (process.argv.includes('cell0')) {
    const r = await spliceComboCell0()
    const cv = createCanvas(C_W, C_H), g = cv.getContext('2d')
    const d = g.createImageData(C_W, C_H); d.data.set(r.image.data); g.putImageData(d, 0, 0)
    const png = cv.toBuffer('image/png')
    writeFileSync(CELL0_OUT, png)
    console.log(JSON.stringify({ file: CELL0_OUT, sha256: createHash('sha256').update(png).digest('hex'), k: K, placement: r.placement, composition: r.composition, measured: { cell: 0, n: r.measured.n, length: +r.measured.length.toFixed(1), angle: +r.measured.angleDeg.toFixed(1) } }, null, 2))
    return
  }
  const r = await spliceComboRound2()
  const cv = createCanvas(C_W, C_H), g = cv.getContext('2d')
  const d = g.createImageData(C_W, C_H); d.data.set(r.image.data); g.putImageData(d, 0, 0)
  const png = cv.toBuffer('image/png')
  writeFileSync(OUT_PATH, png)
  console.log(JSON.stringify({ file: OUT_PATH, sha256: createHash('sha256').update(png).digest('hex'), k: K, cuts: r.cuts, placements: r.placements, composition: r.composition, measured: r.measured.map(m => ({ cell: m.cell, length: +m.length.toFixed(1), angle: +m.angleDeg.toFixed(1) })) }, null, 2))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
