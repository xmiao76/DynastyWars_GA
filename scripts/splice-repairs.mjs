#!/usr/bin/env node
// CMR-06A (owner-directed redraw round): splice the repaired drawings into
// the three source sheets. Originals rotate to art/motion/soldier/previous/.
// Placement is pose-matched: the repair figure is uniformly rescaled so its
// drawing matches the replaced cell's drawn scale (same pose -> same
// natural height at one scale), then placed on the cell's centre column
// and the original content's ground line.
//
//   node scripts/splice-repairs.mjs

import { mkdirSync, renameSync, existsSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/soldier'
const PREV = `${SRC}/previous`

const JOBS = [
  {
    sheet: 'locomotion',
    repair: 'locomotion-repair-candidate-1.png',
    fixes: [
      { pos: 4, comps: [0] },
      { pos: 5, comps: [1] },
    ],
  },
  {
    sheet: 'fall-thrown',
    repair: 'fall-thrown-repair-candidate-1.png',
    fixes: [
      { pos: 4, comps: [0] },
      { pos: 5, comps: [1] },
    ],
  },
  {
    sheet: 'getup-death',
    repair: 'getup-death-repair-candidate-1.png',
    fixes: [
      { pos: 0, comps: [0, 1] }, // elbow getup figure + its detached sword
      { pos: 6, comps: [2] },
      { pos: 7, comps: [3, 4] }, // dead figure + its detached sword
    ],
  },
]

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  return cv
}

function compsSorted(im) {
  return alphaComponents({ width: im.width, height: im.height, data: im.getContext('2d').getImageData(0, 0, im.width, im.height).data }, 96)
    .sort((a, b) => (a.y0 - b.y0) || (a.x0 - b.x0))
}

function cellComps(data, w, h) {
  return alphaComponents({ width: w, height: h, data: data.data }, 96).filter((c) => c.area >= 200)
}

function figureAt(comps, im, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0) best = c
  }
  return best
}

function union(boxes) {
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  }
}

/**
 * Rigidly close the gap between a detached prop (the sword lying beside the
 * figure) and the main figure so the pose is ONE connected drawing - the
 * hand meets the hilt. Whole-component translation only, stepped until the
 * two masks are actually 4-adjacent in pixels (bbox guesses can leave a
 * transparent seam).
 */
function closeGaps(parts, im) {
  const masks = parts.map((p) => {
    const set = new Set()
    for (let y = p.y0; y <= p.y1; y++) {
      for (let x = p.x0; x <= p.x1; x++) {
        const k = (y * im.width + x) * 4
        if (im.data[k + 3] >= 96) set.add(y * im.width + x)
      }
    }
    return set
  })
  const boxes = parts.map((b) => ({ ...b, srcBox: { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 } }))
  const mainIdx = boxes.reduce((best, b, i) => (b.area > boxes[best].area ? i : best), 0)
  const mainMask = masks[mainIdx]
  const touching = (mask) => {
    for (const key of mask) {
      if (mainMask.has(key) || mainMask.has(key - 1) || mainMask.has(key + 1) || mainMask.has(key - im.width) || mainMask.has(key + im.width)) return true
    }
    return false
  }
  for (let i = 0; i < boxes.length; i++) {
    if (i === mainIdx) continue
    const p = boxes[i]
    const gapX = Math.max(boxes[mainIdx].x0 - p.x1, p.x0 - boxes[mainIdx].x1, 0)
    const gapY = Math.max(boxes[mainIdx].y0 - p.y1, p.y0 - boxes[mainIdx].y1, 0)
    let dx = 0
    let dy = 0
    if (gapX > 0 && gapX >= gapY) dx = p.x1 < boxes[mainIdx].x0 ? 2 : -2
    else dy = p.y1 < boxes[mainIdx].y0 ? 2 : -2
    const moved = new Set([...masks[i]])
    for (let step = 0; step < 250; step++) {
      if (touching(moved)) break
      const next = new Set()
      for (const key of moved) next.add(key + dy * im.width + dx)
      moved.clear()
      for (const key of next) moved.add(key)
      p.x0 += dx; p.x1 += dx; p.y0 += dy; p.y1 += dy
    }
  }
  return boxes
}

mkdirSync(PREV, { recursive: true })
const log = []
for (const job of JOBS) {
  const sheetPath = `${SRC}/${job.sheet}-candidate-1.png`
  const rotated = `${PREV}/${job.sheet}-candidate-1.original.png`
  // Idempotent: always splice from the pristine original.
  const sourcePath = existsSync(rotated) ? rotated : sheetPath
  const repairPath = `${SRC}/${job.repair}`
  const sheetCv = await pixelsOf(sourcePath)
  const repairCv = await pixelsOf(repairPath)
  const sheetComps = compsSorted(sheetCv)
  const repairIm = repairCv.getContext('2d').getImageData(0, 0, repairCv.width, repairCv.height)
  const repairComps = compsSorted(repairCv)
  const g = sheetCv.getContext('2d')
  // Solve placements right-to-left so wide figures never overlap: each
  // figure's centre must stay inside its cell, within the sheet, clear of
  // the edges and of the next figure.
  const planned = []
  for (const fix of [...job.fixes].sort((a, b) => b.pos - a.pos)) {
    const old = figureAt(sheetComps, sheetCv, fix.pos)
    if (!old) throw new Error(`${job.sheet}:${fix.pos} original figure not found`)
    const parts = closeGaps(fix.comps.map((i) => ({ ...repairComps[i] })), repairIm)
    const src = union(parts)
    const cellW = Math.floor(sheetCv.width / 3)
    const cellX0 = (fix.pos % 3) * cellW
    const k = (old.y1 - old.y0 + 1) / (src.y1 - src.y0 + 1)
    const dw = Math.round((src.x1 - src.x0 + 1) * k)
    const dh = Math.round((src.y1 - src.y0 + 1) * k)
    const rangeLo = Math.max(6, cellX0 + 1 - Math.floor(dw / 2))
    const rangeHi = Math.min(sheetCv.width - dw - 6, cellX0 + cellW - 1 - Math.floor(dw / 2))
    const next = planned[0]
    const desired = Math.round(cellX0 + cellW / 2 - dw / 2)
    const dx = Math.max(rangeLo, Math.min(desired, next ? next.dx - dw - 8 : rangeHi))
    planned.unshift({ fix, old, parts, src, k, dw, dh, dx })
  }
  // Place each pose at its exact cell-centre column (the fit anchors the
  // cell centre - never the silhouette). Wide neighbours may only touch in
  // pixels: resolve any contact with small vertical nudges (no scale change).
  for (const p of [...planned].reverse()) {
    const { fix, old, parts, src, k, dw, dh } = p
    const cellW = Math.floor(sheetCv.width / 3)
    const cellH = Math.floor(sheetCv.height / 3)
    const cellX0 = (fix.pos % 3) * cellW
    const cy0 = Math.floor(fix.pos / 3) * cellH
    // Placement only needs DISJOINTNESS and sheet-safe bounds: the
    // registration fit recentres every drawing in the canonical box by
    // recorded translation (one scale per sheet), so sheet position is free.
    const desired = Math.round(cellX0 + cellW / 2 - dw / 2)
    const xlo = 6
    const xhi = sheetCv.width - dw - 6
    const xs = []
    for (const d of [0, -30, 30, -60, 60, -90, 90, -120, 120, -150, 150, -180, 180, -210, 210]) {
      const v = Math.max(xlo, Math.min(desired + d, xhi))
      if (!xs.includes(v)) xs.push(v)
    }
    const ys = [0, -28, 28, -56, 56, -84, 84, -112, 112, -140, 140, -168, 168]
    const baseDy = cy0 + Math.round((cellH - dh) / 2)
    // Render the pose offscreen where NO neighbour exists, then connect its
    // parts (detached sword, anti-aliasing seams) into one drawing - a
    // stroke in the fragment's own colour, the hilt meeting the hand.
    const temp = createCanvas(dw + 2, dh + 2)
    const tg = temp.getContext('2d')
    for (const part of parts) {
      const s = part.srcBox
      const px = 1 + Math.round((part.x0 - src.x0) * k)
      const py = 1 + Math.round((part.y0 - src.y0) * k)
      tg.drawImage(repairCv, s.x0, s.y0, s.x1 - s.x0 + 1, s.y1 - s.y0 + 1, px, py, Math.round((s.x1 - s.x0 + 1) * k), Math.round((s.y1 - s.y0 + 1) * k))
    }
    for (let iter = 0; iter < 4; iter++) {
      const check = tg.getImageData(0, 0, temp.width, temp.height)
      const comps = cellComps(check, temp.width, temp.height)
      if (comps.length <= 1) break
      const main = comps.reduce((a, b) => (b.area > a.area ? b : a))
      const stray = comps.filter((c) => c !== main).reduce((a, b) => (b.area < a.area ? b : a))
      const scx = (stray.x0 + stray.x1) / 2
      const scy = (stray.y0 + stray.y1) / 2
      const mcx = (main.x0 + main.x1) / 2
      const mcy = (main.y0 + main.y1) / 2
      const kx = Math.round(scx)
      const ky = Math.round(scy)
      const r = check.data[(ky * temp.width + kx) * 4]
      const gg = check.data[(ky * temp.width + kx) * 4 + 1]
      const b = check.data[(ky * temp.width + kx) * 4 + 2]
      tg.strokeStyle = `rgb(${r},${gg},${b})`
      tg.lineWidth = 5
      tg.beginPath()
      tg.moveTo(scx, scy)
      tg.lineTo(mcx + (mcx - scx) * 0.4, mcy + (mcy - scy) * 0.4) // overshoot
      tg.stroke()
    }
    const tempData = tg.getImageData(0, 0, temp.width, temp.height)
    // Clear the old drawing (its own bbox plus pad) before compositing.
    g.clearRect(old.x0 - 10, old.y0 - 10, old.x1 - old.x0 + 20, old.y1 - old.y0 + 20)
    // 2-D nudge search: pick the first placement whose pixels are disjoint
    // (no overlap, no 4-adjacency) from everything already composited.
    let placedX = xs[0]
    let placedY = baseDy
    let placed = false
    for (const ny of ys) {
      for (const nx of xs) {
        const dy = baseDy + ny
        const sx = Math.max(0, nx - 2)
        const sy = Math.max(0, dy - 2)
        const sheetNow = g.getImageData(sx, sy, Math.min(temp.width + 4, sheetCv.width - sx), Math.min(temp.height + 4, sheetCv.height - sy))
        let contact = false
        for (let y = 0; y < sheetNow.height && !contact; y += 1) {
          for (let x = 0; x < sheetNow.width && !contact; x += 1) {
            const tX = x + sx - (nx - 1)
            const tY = y + sy - (dy - 1)
            if (tX < 0 || tY < 0 || tX >= temp.width || tY >= temp.height) continue
            if (tempData.data[(tY * temp.width + tX) * 4 + 3] < 96) continue
            // Overlap OR 4-adjacency with an opaque sheet pixel = connected.
            const here = (y * sheetNow.width + x) * 4 + 3
            const left = x > 0 ? here - 4 : -1
            const right = x < sheetNow.width - 1 ? here + 4 : -1
            const up = y > 0 ? here - sheetNow.width * 4 : -1
            const down = y < sheetNow.height - 1 ? here + sheetNow.width * 4 : -1
            if (sheetNow.data[here] >= 96 || (left >= 0 && sheetNow.data[left] >= 96) || (right >= 0 && sheetNow.data[right] >= 96) || (up >= 0 && sheetNow.data[up] >= 96) || (down >= 0 && sheetNow.data[down] >= 96)) contact = true
          }
        }
        if (!contact) {
          placedX = nx
          placedY = dy
          placed = true
          break
        }
      }
      if (placed) break
    }
    if (!placed) console.log(`WARNING: ${job.sheet}:${fix.pos} placed with residual contact`)
    g.drawImage(temp, placedX - 1, placedY - 1)
    log.push(`${job.sheet}:${fix.pos} <- ${job.repair} comps[${fix.comps.join(',')}] k=${k.toFixed(4)} dst=${placedX},${placedY} ${dw}x${dh}${placed ? '' : ' CONTACT'}`)
  }
  if (!existsSync(rotated)) renameSync(sheetPath, rotated)
  writeFileSync(sheetPath, sheetCv.toBuffer('image/png'))
}
console.log(log.join('\n'))
console.log('spliced sheets updated; originals in', PREV)
