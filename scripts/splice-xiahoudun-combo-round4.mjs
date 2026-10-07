#!/usr/bin/env node
// CMR-14A combo round-4 splice: component-extract the 5 separated round-4
// figures, gentle K4 fit to the walk anchor, paste centered on the old
// candidate cells 0/2/3/6/7. Deterministic, hash-pinned, ignored output.
// Round-4 (owner-authorized single extra) is drawn at near-scale with no
// guide lines, so no cut columns and no rescale-severing regime apply;
// the touch-join gate still attributes gap-0 fragments to their drawing.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alphaComponents } from './motion-pipeline.mjs'
import { gridCellOf } from './motion-retouch.mjs'

export const CAND_PATH = 'art/motion/xiahoudun/combo-candidate-1.png'
export const CAND_SHA = 'c2c5fefc1ac36a8ab428dca8cc966927df1103f5bda98d8dcbbf0304bccd6e0b'
export const R4_PATH = 'art/motion/xiahoudun/acceptance4-round4-combo-raw.png'
export const R4_SHA = 'd695e78534477726d0c3d2a3ba3aa3c5c5143f8dce4c89c93cd9c74f2582685b'
export const OUT_PATH = 'art/motion/xiahoudun/combo-round4-spliced-source.png'
// K4 = walk-anchor figure-height median (321) / round-4 level-figure median
// (372, alpha>=96 components: [358,371,373,374] -> (371+373)/2).
export const K4 = 321 / 372
// [round4 left-to-right fig, candidateCell].
export const MAP4 = [[0, 0], [1, 2], [2, 3], [3, 6], [4, 7]]
export const KEEP4 = [1, 4, 5, 8]
const R4_W = 2155, R4_H = 730, C_W = 1536, C_H = 1024

function pixelsOf(image) {
  const cv = createCanvas(image.width, image.height), g = cv.getContext('2d')
  g.drawImage(image, 0, 0)
  const d = g.getImageData(0, 0, image.width, image.height)
  return { width: image.width, height: image.height, data: d.data }
}
async function loadPixels(path, sha, w, h) {
  const bytes = readFileSync(path)
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw Error(`splice4: ${path} hash changed`)
  const img = await loadImage(bytes)
  if (img.width !== w || img.height !== h) throw Error(`splice4: ${path} size changed`)
  return pixelsOf(img)
}
// Shaft-fitted endpoint measurement: rotating-calipers diameter of the
// convex hull (the spear is the longest rigid structure in these poses).
// Hull endpoints are extreme ink pixels by construction; the overlay review
// verifies each one sits on butt cap / head steel, not boot or headgear.
// Falls back to hand landmarks for any cell the overlay rejects.
export function shaftDiameter(pts) {
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop(); upper.pop()
  const hull = lower.concat(upper)
  let best = 0, bp = null, tp = null
  for (let i = 0; i < hull.length; i++) for (let j = i + 1; j < hull.length; j++) {
    const d = Math.hypot(hull[i][0] - hull[j][0], hull[i][1] - hull[j][1])
    if (d > best) { best = d; bp = hull[i]; tp = hull[j] }
  }
  const angleDeg = Math.atan2(tp[1] - bp[1], tp[0] - bp[0]) * 180 / Math.PI
  return { length: best, butt: bp, tip: tp, angleDeg }
}

export async function spliceComboRound4() {
  const cand = await loadPixels(CAND_PATH, CAND_SHA, C_W, C_H)
  const r4 = await loadPixels(R4_PATH, R4_SHA, R4_W, R4_H)
  const cellOf = gridCellOf(3, 3)
  const candComps = alphaComponents(cand, 96).filter(c => c.area > 64)
  const byCell = new Map()
  for (const c of candComps) {
    const i = cellOf(c, C_W, C_H)
    if (!byCell.has(i)) byCell.set(i, [])
    byCell.get(i).push(c)
  }
  for (const [, j] of MAP4) if (!byCell.get(j)?.length) throw Error(`splice4: candidate cell ${j} drawing missing`)
  const oldBox = new Map()
  for (const [, j] of MAP4) {
    let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0
    for (const c of byCell.get(j)) for (const p of c.pixels) {
      const x = p % C_W, y = (p / C_W) | 0
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
    oldBox.set(j, { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, bottom: y1 })
  }
  const figs = alphaComponents(r4, 96).filter(c => c.area > 64).sort((a, b) => a.x0 - b.x0)
  if (figs.length !== 5) throw Error(`splice4: expected 5 figures, found ${figs.length}`)
  const out = { width: C_W, height: C_H, data: new Uint8ClampedArray(cand.data) }
  for (const [, j] of MAP4) for (const c of byCell.get(j)) for (const p of c.pixels) {
    const k = p * 4
    out.data[k] = 0; out.data[k + 1] = 0; out.data[k + 2] = 0; out.data[k + 3] = 0
  }
  // Ghost-clear: faint sub-gate construction lines (alpha<96, never in any
  // component, never erased above) persist as dotted curves. Target cells
  // hold single drawings, so clear ALL alpha>0 inside each replaced drawing's
  // bbox union - EXCEPT keep-drawing pixels (old target art overhangs grid
  // lines into keep zones; proven at (523,343)). The keeps gate below proves
  // no keep art was touched.
  const keepPx = new Set()
  for (const c of candComps) {
    if (!KEEP4.includes(cellOf(c, C_W, C_H))) continue
    for (const p of c.pixels) keepPx.add(p)
  }
  for (const [, j] of MAP4) {
    const cells = byCell.get(j)
    let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0
    for (const c of cells) {
      if (c.x0 < x0) x0 = c.x0; if (c.x1 > x1) x1 = c.x1
      if (c.y0 < y0) y0 = c.y0; if (c.y1 > y1) y1 = c.y1
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = y * C_W + x
      if (keepPx.has(p)) continue
      const k = p * 4
      out.data[k] = 0; out.data[k + 1] = 0; out.data[k + 2] = 0; out.data[k + 3] = 0
    }
  }
  const r4img = await loadImage(readFileSync(R4_PATH))
  const src = createCanvas(R4_W, R4_H), sg = src.getContext('2d')
  sg.drawImage(r4img, 0, 0)
  const placements = []
  for (const [fi, j] of MAP4) {
    const fig = figs[fi]
    const fw = fig.x1 - fig.x0 + 1, fh = fig.y1 - fig.y0 + 1
    // Masked extraction: only figure-component pixels dilated 2px (8n) may
    // paste. Disconnected dotted guide junk inside the bbox is excluded;
    // soft rims survive via dilation. Residual risk (junk within 2px of the
    // figure) is overlay-reviewed, not assumed away.
    const mask = new Set(fig.pixels)
    for (let pass = 0; pass < 2; pass++) {
      const add = []
      for (const p of mask) {
        const px = p % R4_W, py = (p / R4_W) | 0
        for (let ay = -1; ay <= 1; ay++) for (let ax = -1; ax <= 1; ax++) {
          const nx = px + ax, ny = py + ay
          if (nx < fig.x0 || ny < fig.y0 || nx > fig.x1 || ny > fig.y1) continue
          const np = ny * R4_W + nx
          if (!mask.has(np)) add.push(np)
        }
      }
      for (const np of add) mask.add(np)
    }
    const piece = createCanvas(fw, fh), pg = piece.getContext('2d')
    pg.drawImage(src, fig.x0, fig.y0, fw, fh, 0, 0, fw, fh)
    const dw = Math.max(1, Math.round(fw * K4)), dh = Math.max(1, Math.round(fh * K4))
    const scaled = createCanvas(dw, dh), gg = scaled.getContext('2d')
    gg.imageSmoothingEnabled = true; gg.imageSmoothingQuality = 'high'
    gg.drawImage(piece, 0, 0, dw, dh)
    const sd = gg.getImageData(0, 0, dw, dh)
    const box = oldBox.get(j)
    // Cell 7's diagonal guard overflows centered: seat it feet-grounded on
    // the old drawing's bottom (ground registration beats bbox centering).
    // Pair review judges feet planting and tip clearance.
    const dx = Math.round(box.cx - dw / 2)
    const dy = j === 7 ? box.bottom - dh : Math.round(box.cy - dh / 2)
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const sx = Math.min(fw - 1, Math.floor(x * fw / dw)) + fig.x0
      const sy = Math.min(fh - 1, Math.floor(y * fh / dh)) + fig.y0
      if (!mask.has(sy * R4_W + sx)) continue
      const ox = dx + x, oy = dy + y
      if (ox < 0 || oy < 0 || ox >= C_W || oy >= C_H) throw Error(`splice4: fig ${fi} paste out of bounds`)
      const sk = (y * dw + x) * 4
      if (sd.data[sk + 3] === 0) continue
      const dk = (oy * C_W + ox) * 4
      for (let ch = 0; ch < 4; ch++) out.data[dk + ch] = sd.data[sk + ch]
    }
    placements.push({ fig: fi, cell: j, srcBox: [fig.x0, fig.y0, fw, fh], dst: [dx, dy, dw, dh] })
  }
  for (const c of candComps) {
    if (!KEEP4.includes(cellOf(c, C_W, C_H))) continue
    for (const p of c.pixels) for (let ch = 0; ch < 4; ch++) {
      if (cand.data[p * 4 + ch] !== out.data[p * 4 + ch]) throw Error(`splice4: keep cell ${cellOf(c, C_W, C_H)} changed at (${p % C_W},${(p / C_W) | 0})`)
    }
  }
  // Touch-join composition: gap-0 fragments belong to their drawing; any
  // group touching two drawings (a real merge) fails. Drawings are known by
  // keep pixels (byte-exact) and new paste boxes.
  const pixOwner = new Map()
  for (const c of candComps) {
    const i = cellOf(c, C_W, C_H)
    if (!KEEP4.includes(i)) continue
    for (const p of c.pixels) pixOwner.set(p, `keep:${i}`)
  }
  for (const pl of placements) {
    const [dx, dy, dw, dh] = pl.dst
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const ox = dx + x, oy = dy + y, dk = oy * C_W + ox
      if (out.data[dk * 4 + 3] < 96) continue
      if (!pixOwner.has(dk)) pixOwner.set(dk, `new:${pl.cell}`)
    }
  }
  const seenKeys = new Set(pixOwner.values())
  for (const c of candComps) {
    const i = cellOf(c, C_W, C_H)
    if (KEEP4.includes(i) && ![...pixOwner.keys()].some(p => pixOwner.get(p) === `keep:${i}`)) throw Error(`splice4: keep cell ${i} drawing missing`)
  }
  for (const pl of placements) if (!seenKeys.has(`new:${pl.cell}`)) throw Error(`splice4: new cell ${pl.cell} drawing missing`)
  {
    const seen = new Set()
    let gi = 0
    for (const [p] of pixOwner) {
      if (seen.has(p)) continue
      const owners = new Set(), stack = [p]
      seen.add(p)
      while (stack.length) {
        const q = stack.pop(), qx = q % C_W, qy = (q / C_W) | 0
        owners.add(pixOwner.get(q))
        for (let ay = -1; ay <= 1; ay++) for (let ax = -1; ax <= 1; ax++) {
          if (!ax && !ay) continue
          const nx = qx + ax, ny = qy + ay
          if (nx < 0 || ny < 0 || nx >= C_W || ny >= C_H) continue
          const np = ny * C_W + nx
          if (pixOwner.has(np) && !seen.has(np)) { seen.add(np); stack.push(np) }
        }
      }
      if (owners.size > 1) throw Error(`splice4: group ${gi} fuses drawings (${[...owners].join('+')})`)
      gi++
    }
  }
  const composition = { drawings: seenKeys.size }
  const post = alphaComponents(out, 96).filter(c => c.area > 64)
  for (const c of post) {
    if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= C_W - 1 || c.y1 >= C_H - 1) throw Error('splice4: edge contact')
  }
  // Shaft-fitted measurement WITHOUT resampling: hull diameter of each
  // isolated round-4 figure in RAW coords (exact pixels, no resample error),
  // scaled by K4. Hull endpoints are extreme ink by construction; the overlay
  // review verifies each sits on butt cap / head steel (body-diagonal
  // contamination shows up there, not hidden in the number).
  const measured = []
  for (const [fi, j] of MAP4) {
    const fig = figs[fi]
    const pts = []
    for (const p of fig.pixels) pts.push([p % R4_W, (p / R4_W) | 0])
    const raw = shaftDiameter(pts)
    const pl = placements.find(q => q.cell === j)
    const [dx, dy, dw, dh] = pl.dst
    const [sx0, sy0, sw, sh] = pl.srcBox
    const X = ([x, y]) => [dx + (x - sx0) * dw / sw, dy + (y - sy0) * dh / sh]
    measured.push({ cell: j, n: pts.length, rawLength: raw.length, length: raw.length * K4, angleDeg: raw.angleDeg, butt: X(raw.butt), tip: X(raw.tip) })
  }
  return { image: out, placements, composition, measured }
}

async function main() {
  const r = await spliceComboRound4()
  const cv = createCanvas(C_W, C_H), g = cv.getContext('2d')
  const d = g.createImageData(C_W, C_H); d.data.set(r.image.data); g.putImageData(d, 0, 0)
  const png = cv.toBuffer('image/png')
  writeFileSync(OUT_PATH, png)
  console.log(JSON.stringify({ file: OUT_PATH, sha256: createHash('sha256').update(png).digest('hex'), k: K4, placements: r.placements, composition: r.composition, measured: r.measured.map(m => ({ cell: m.cell, n: m.n, raw: +m.rawLength.toFixed(1), length: +m.length.toFixed(1), angle: +m.angleDeg.toFixed(1), butt: m.butt.map(v => +v.toFixed(1)), tip: m.tip.map(v => +v.toFixed(1)) })) }, null, 2))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
