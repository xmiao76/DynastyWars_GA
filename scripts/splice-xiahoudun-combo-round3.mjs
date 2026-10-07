#!/usr/bin/env node
// CMR-14A combo round-3 splice: component-extract the 5 separated round-3
// figures, gentle K3 fit to the walk anchor, paste centered on the old
// candidate cells 0/2/3/6/7. Deterministic, hash-pinned, ignored output.
// Round-3 needs no cut columns (zero shared pixels between figures).
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alphaComponents } from './motion-pipeline.mjs'
import { gridCellOf, verifySheetComposition } from './motion-retouch.mjs'

export const CAND_PATH = 'art/motion/xiahoudun/combo-candidate-1.png'
export const CAND_SHA = 'c2c5fefc1ac36a8ab428dca8cc966927df1103f5bda98d8dcbbf0304bccd6e0b'
export const R3_PATH = 'art/motion/xiahoudun/acceptance4-round3-combo-raw.png'
export const R3_SHA = '7f52f1afe55e7911fe88be00d3e8dd4fa3bc2c0bd79103e6fdf4d92984a1f509'
export const OUT_PATH = 'art/motion/xiahoudun/combo-round3-spliced-source.png'
// K3 = walk-anchor figure-height median (321) / round-3 level-figure median
// (364.5, alpha>=96 components only; unfiltered bands read 365.5 on dust).
export const K3 = 321 / 364.5
// [round3 left-to-right fig, candidateCell].
export const MAP3 = [[0, 0], [1, 2], [2, 3], [3, 6], [4, 7]]
export const KEEP3 = [1, 4, 5, 8]
// ACTIVE excludes fig4 (guard, near-vertical 526px spear): centered placement
// overflows the sheet (proven: paste out of bounds), and any fit needs an
// owner-visible decision (rigid rotation vs occluded original). Bank 0/2/3/6.
export const ACTIVE3 = [[0, 0], [1, 2], [2, 3], [3, 6]]
export const KEEP3A = [1, 4, 5, 7, 8]
const R3_W = 2073, R3_H = 758, C_W = 1536, C_H = 1024

function pixelsOf(image) {
  const cv = createCanvas(image.width, image.height), g = cv.getContext('2d')
  g.drawImage(image, 0, 0)
  const d = g.getImageData(0, 0, image.width, image.height)
  return { width: image.width, height: image.height, data: d.data }
}
async function loadPixels(path, sha, w, h) {
  const bytes = readFileSync(path)
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw Error(`splice3: ${path} hash changed`)
  const img = await loadImage(bytes)
  if (img.width !== w || img.height !== h) throw Error(`splice3: ${path} size changed`)
  return pixelsOf(img)
}
// PCA axis of a pixel set, then true spear endpoints inside a +/-band corridor.
export function spearLength(pts, band = 10) {
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
    const t = (x - mx) * ux + (y - my) * uy, o = -(x - mx) * uy + (y - my) * ux
    if (Math.abs(o) > band) continue
    if (t < lo) { lo = t; loP = [x, y] } if (t > hi) { hi = t; hiP = [x, y] }
  }
  return { length: hi - lo, butt: loP, tip: hiP, angleDeg: Math.atan2(uy, ux) * 180 / Math.PI, ux, uy, mx, my }
}

export async function spliceComboRound3() {
  const cand = await loadPixels(CAND_PATH, CAND_SHA, C_W, C_H)
  const r3 = await loadPixels(R3_PATH, R3_SHA, R3_W, R3_H)
  const cellOf = gridCellOf(3, 3)
  const candComps = alphaComponents(cand, 96).filter(c => c.area > 64)
  const byCell = new Map()
  for (const c of candComps) {
    const i = cellOf(c, C_W, C_H)
    if (!byCell.has(i)) byCell.set(i, [])
    byCell.get(i).push(c)
  }
  for (const j of [0, 2, 3, 6]) if (!byCell.get(j)?.length) throw Error(`splice3: candidate cell ${j} drawing missing`)
  const oldBox = new Map()
  for (const [, j] of ACTIVE3) {
    let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0
    for (const c of byCell.get(j)) for (const p of c.pixels) {
      const x = p % C_W, y = (p / C_W) | 0
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    oldBox.set(j, { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 })
  }
  const figs = alphaComponents(r3, 96).filter(c => c.area > 64).sort((a, b) => a.x0 - b.x0)
  if (figs.length !== 5) throw Error(`splice3: expected 5 figures, found ${figs.length}`)
  const out = { width: C_W, height: C_H, data: new Uint8ClampedArray(cand.data) }
  for (const [, j] of ACTIVE3) for (const c of byCell.get(j)) for (const p of c.pixels) {
    const k = p * 4
    out.data[k] = 0; out.data[k + 1] = 0; out.data[k + 2] = 0; out.data[k + 3] = 0
  }
  const r3img = await loadImage(readFileSync(R3_PATH))
  const src = createCanvas(R3_W, R3_H), sg = src.getContext('2d')
  sg.drawImage(r3img, 0, 0)
  const placements = []
  for (const [fi, j] of ACTIVE3) {
    const fig = figs[fi]
    const fw = fig.x1 - fig.x0 + 1, fh = fig.y1 - fig.y0 + 1
    const piece = createCanvas(fw, fh), pg = piece.getContext('2d')
    pg.drawImage(src, fig.x0, fig.y0, fw, fh, 0, 0, fw, fh)
    const dw = Math.max(1, Math.round(fw * K3)), dh = Math.max(1, Math.round(fh * K3))
    const scaled = createCanvas(dw, dh), gg = scaled.getContext('2d')
    gg.imageSmoothingEnabled = false
    gg.drawImage(piece, 0, 0, dw, dh)
    const sd = gg.getImageData(0, 0, dw, dh)
    const box = oldBox.get(j)
    const dx = Math.round(box.cx - dw / 2), dy = Math.round(box.cy - dh / 2)
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const ox = dx + x, oy = dy + y
      if (ox < 0 || oy < 0 || ox >= C_W || oy >= C_H) throw Error(`splice3: fig ${fi} paste out of bounds`)
      const sk = (y * dw + x) * 4
      if (sd.data[sk + 3] === 0) continue
      const dk = (oy * C_W + ox) * 4
      for (let ch = 0; ch < 4; ch++) out.data[dk + ch] = sd.data[sk + ch]
    }
    placements.push({ fig: fi, cell: j, srcBox: [fig.x0, fig.y0, fw, fh], dst: [dx, dy, dw, dh] })
  }
  for (const c of candComps) {
    if (!KEEP3A.includes(cellOf(c, C_W, C_H))) continue
    for (const p of c.pixels) for (let ch = 0; ch < 4; ch++) {
      if (cand.data[p * 4 + ch] !== out.data[p * 4 + ch]) throw Error('splice3: keep cell changed')
    }
  }
  const composition = verifySheetComposition(out, { expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8], cellOf })
  const post = alphaComponents(out, 96).filter(c => c.area > 64)
  for (const c of post) {
    if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= C_W - 1 || c.y1 >= C_H - 1) throw Error('splice3: edge contact')
  }
  const measured = []
  for (const [, j] of ACTIVE3) {
    const pts = []
    for (const c of post) {
      if (cellOf(c, C_W, C_H) !== j) continue
      for (const p of c.pixels) pts.push([p % C_W, (p / C_W) | 0])
    }
    measured.push({ cell: j, n: pts.length, ...spearLength(pts) })
  }
  return { image: out, placements, composition, measured }
}

async function main() {
  const r = await spliceComboRound3()
  const cv = createCanvas(C_W, C_H), g = cv.getContext('2d')
  const d = g.createImageData(C_W, C_H); d.data.set(r.image.data); g.putImageData(d, 0, 0)
  const png = cv.toBuffer('image/png')
  writeFileSync(OUT_PATH, png)
  console.log(JSON.stringify({ file: OUT_PATH, sha256: createHash('sha256').update(png).digest('hex'), k: K3, placements: r.placements, composition: r.composition, measured: r.measured.map(m => ({ cell: m.cell, n: m.n, length: +m.length.toFixed(1), angle: +m.angleDeg.toFixed(1), butt: m.butt, tip: m.tip })) }, null, 2))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
