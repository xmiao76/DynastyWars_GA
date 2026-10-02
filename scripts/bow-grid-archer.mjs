#!/usr/bin/env node
// CMR-08A: gridded zoom renderer for manual bow/arrow landmarking.
//
//   node scripts/bow-grid-archer.mjs
//
// Rationale (v1-v5 documented failures in PROGRESS): bow wood is
// color-inseparable from boots/trim (r-b 11-17 everywhere); thin-mask
// clustering catches figure edge bands; elongation gates kill
// fragmented limbs; RANSAC catches body diagonals, not shafts; run
// detectors can't separate limbs from robe edges. Human recognition +
// machine precision instead: the reviewer reads landmark grid refs from
// these zooms; `bow-reading-archer.mjs` converts refs to coordinates.
// The verification overlay redraws computed endpoints, catching any
// transcription error visibly. Unknowns stay unverified.
//
// Grid: 25px cells, columns A,B,C... left-to-right, rows 1,2,3...
// top-to-bottom, labeled every 100px. Readings name the cell containing
// each tip (e.g. "C3"), with + meaning past-center toward next cell.

import { writeFileSync, mkdirSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/archer'
const OUT = 'artifacts/motion/archer/landmarks'

// Undrawn-bow candidates (axis-aligned carry poses; bent/diagonal bows
// excluded by the orientation rule, recorded per cell at adjudication).
const BOW_CELLS = [
  ['locomotion-candidate-1.png', 0], ['locomotion-candidate-1.png', 1],
  ['locomotion-candidate-1.png', 5], ['locomotion-candidate-1.png', 6],
  ['shoot-candidate-2.png', 0], ['shoot-candidate-2.png', 5],
  ['hitstun-held-candidate-1.png', 0], ['hitstun-held-candidate-1.png', 4],
  ['hitstun-held-candidate-1.png', 7],
  ['fall-thrown-candidate-1.png', 3], ['fall-thrown-candidate-1.png', 6],
  ['fall-thrown-candidate-1.png', 7], ['getup-death-candidate-2.png', 2],
  ['getup-death-candidate-2.png', 7],
]
// Arrow candidates (nocked shafts; reloads adjudicated for straightness).
const ARROW_CELLS = [
  ['shoot-candidate-2.png', 2], ['shoot-candidate-2.png', 3],
  ['shoot-candidate-2.png', 6], ['shoot-candidate-2.png', 7],
]

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  return cv
}
function figureAt(w, h, comps, pos) {
  const cw = Math.floor(w / 3), ch = Math.floor(h / 3)
  const cx0 = pos % 3, cy0 = Math.floor(pos / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cw), cy = Math.floor((c.y0 + c.y1 + 1) / 2 / ch)
    if (cx === cx0 && cy === cy0 && (best === null || c.area > best.area)) best = c
  }
  return best
}

async function sheet(cells, name, title) {
  const CW = 360, CH = 300
  const cols = 3, rows = Math.ceil(cells.length / cols)
  const canvas = createCanvas(CW * cols + 20, 30 + CH * rows + 10)
  const s = canvas.getContext('2d')
  s.fillStyle = '#14141f'
  s.fillRect(0, 0, canvas.width, canvas.height)
  s.font = '13px sans-serif'
  s.fillStyle = '#ffe9a8'
  s.fillText(title, 10, 18)
  let i = 0
  for (const [file, pos] of cells) {
    const cv = await load(`${SRC}/${file}`)
    const g = cv.getContext('2d')
    const d = g.getImageData(0, 0, cv.width, cv.height)
    const im = { width: d.width, height: d.height, data: d.data }
    const box = figureAt(im.width, im.height, alphaComponents(im, 96), pos)
    const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1
    const ox = 10 + (i % cols) * CW, oy = 30 + Math.floor(i / cols) * CH
    const sc = Math.min((CW - 8) / w, (CH - 30) / h)
    const dw = Math.round(w * sc), dh = Math.round(h * sc)
    s.drawImage(cv, box.x0, box.y0, w, h, ox + 4, oy + 4, dw, dh)
    // 25px source grid (labeled every 100px).
    s.lineWidth = 1
    for (let gx = 0; gx <= w; gx += 25) {
      const major = gx % 100 === 0
      s.strokeStyle = major ? 'rgba(120,220,255,0.55)' : 'rgba(120,220,255,0.22)'
      s.beginPath()
      s.moveTo(ox + 4 + gx * sc, oy + 4)
      s.lineTo(ox + 4 + gx * sc, oy + 4 + dh)
      s.stroke()
      if (major) {
        s.fillStyle = '#9adcff'
        s.fillText(String.fromCharCode(65 + Math.round(gx / 25)), ox + 4 + gx * sc + 1, oy + 13)
      }
    }
    for (let gy = 0; gy <= h; gy += 25) {
      const major = gy % 100 === 0
      s.strokeStyle = major ? 'rgba(120,220,255,0.55)' : 'rgba(120,220,255,0.22)'
      s.beginPath()
      s.moveTo(ox + 4, oy + 4 + gy * sc)
      s.lineTo(ox + 4 + dw, oy + 4 + gy * sc)
      s.stroke()
      if (major) {
        s.fillStyle = '#9adcff'
        s.fillText(String(Math.round(gy / 25) + 1), ox + 4 + dw - 14, oy + 4 + gy * sc + 11)
      }
    }
    s.fillStyle = '#ffe9a8'
    s.fillText(`${file.split('-candidate')[0]}:${pos} (${w}x${h})`, ox + 4, oy + dh + 26)
    i++
  }
  writeFileSync(`${OUT}/${name}`, canvas.toBuffer('image/png'))
  console.log('wrote', `${OUT}/${name}`)
}

mkdirSync(OUT, { recursive: true })
await sheet(BOW_CELLS, 'bow-grid.png', 'BOW chord grid reads (25px cells, cols A.. rows 1..) - CMR-08A')
await sheet(ARROW_CELLS, 'arrow-grid.png', 'ARROW shaft grid reads (25px cells, cols A.. rows 1..) - CMR-08A')
