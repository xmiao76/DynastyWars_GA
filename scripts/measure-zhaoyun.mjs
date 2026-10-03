#!/usr/bin/env node
// CMR-10A: measurement pass over the Zhao Yun source sheets.
//
//   node scripts/measure-zhaoyun.mjs
//
// Pass 1 (scale): face-cluster size + figure height (face centre to ground)
//   of the upright guard drawings - the per-sheet scale evidence. Zhao Yun
//   has NO aliased bookend duplicates (every kept cell is a unique drawing;
//   culled cells are just culled), and guard-like cells sit at various
//   positions (walk:0, getup:4, special:8, misc:8), so GUARD_CELLS names
//   (seq, pos) pairs instead of pos-0 sheets. Face gates widened vs Zhang
//   Fei (30..70 wide): the helmet narrows the visible fair face, and there
//   is no bare-neck merge to inflate clusters.
// Pass 2 (weapon): NOT YET - tip-to-butt lands with the landmarks turn.

import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/zhaoyun'
const SHEETS = {
  walk: 'walk-candidate-1.png',
  jab1: 'jab1-candidate-1.png',
  jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png',
  jump: 'jump-candidate-1.png',
  fall: 'fall-candidate-1.png',
  getup: 'getup-candidate-2-r1.png',
  misc: 'misc-candidate-2-r1.png',
  special: 'special-candidate-1-r1.png',
  rider: 'rider-candidate-1.png',
}
// Standing-guard-like cells usable as scale evidence (pos varies).
const GUARD_CELLS = { walk: 0, getup: 4, special: 8, misc: 8 }

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

function figureAt(im, comps, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let best = null
  for (const c of comps) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0 && (best === null || c.area > best.area)) best = c
  }
  return best
}

const isSkin = (d, k) => {
  const r = d[k], g = d[k + 1], b = d[k + 2], a = d[k + 3]
  return a >= 200 && r > 105 && r > g + 12 && g > b && b < 170
}

/** Topmost skin cluster (face): centre y and horizontal width. */
function faceOf(im, box) {
  const { width, data } = im
  const seen = new Set()
  let best = null
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const key = y * width + x
      if (seen.has(key) || !isSkin(data, key * 4)) continue
      seen.add(key)
      const stack = [[x, y]]
      let x0 = x, x1 = x, y0 = y, y1 = y, area = 0
      while (stack.length) {
        const [qx, qy] = stack.pop()
        area++
        if (qx < x0) x0 = qx
        if (qx > x1) x1 = qx
        if (qy < y0) y0 = qy
        if (qy > y1) y1 = qy
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = qx + dx, ny = qy + dy
          const nkey = ny * width + nx
          if (nx < box.x0 || nx > box.x1 || ny < box.y0 || ny > box.y1) continue
          if (seen.has(nkey) || !isSkin(data, nkey * 4)) continue
          seen.add(nkey)
          stack.push([nx, ny])
        }
      }
      if (area > 300 && (best === null || y0 < best.y0)) best = { x0, x1, y0, y1, area }
    }
  }
  return best
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const rows = []
const guards = []
for (const [seq, file] of Object.entries(SHEETS)) {
  const im = await pixelsOf(`${SRC}/${file}`)
  const comps = alphaComponents(im, 96)
  for (let pos = 0; pos < 9; pos++) {
    const id = `${seq}:${pos}`
    const box = figureAt(im, comps, pos)
    if (!box) { rows.push({ id, note: 'no figure' }); continue }
    const face = faceOf(im, box)
    const row = {
      id,
      aliased: false,
      bboxH: box.y1 - box.y0 + 1,
      bboxW: box.x1 - box.x0 + 1,
      face: face ? { w: face.x1 - face.x0 + 1, h: face.y1 - face.y0 + 1, area: face.area, cy: Math.round((face.y0 + face.y1) / 2) - box.y0 } : null,
      faceToGround: face ? box.y1 - Math.round((face.y0 + face.y1) / 2) : null,
      spear: null,
    }
    rows.push(row)
    if (GUARD_CELLS[seq] === pos) guards.push({ seq, ...row })
  }
}

// ---- per-sheet scale evidence --------------------------------------------
const faceSizes = {}
for (const r of rows) {
  if (!r.face || r.aliased) continue
  if (r.face.w < 30 || r.face.w > 70 || r.face.h < 25 || r.face.h > 64) continue
  const seq = r.id.split(':')[0]
  ;(faceSizes[seq] ??= []).push(Math.sqrt(r.face.w * r.face.h))
}
const refFace = median(faceSizes.walk)
const guardBy = Object.fromEntries(guards.map((g) => [g.seq, g]))
const scaleEvidence = {}
for (const seq of Object.keys(SHEETS)) {
  const faces = faceSizes[seq] ?? []
  if (faces.length >= 3) {
    scaleEvidence[seq] = { method: 'face-size median', n: faces.length, size: Math.round(median(faces) * 100) / 100, factor: Math.round((refFace / median(faces)) * 1000) / 1000 }
  } else if (seq !== 'walk' && guardBy[seq] && guardBy.walk) {
    scaleEvidence[seq] = { method: 'guard face-to-ground', n: 1, size: guardBy[seq].faceToGround, factor: Math.round((guardBy.walk.faceToGround / guardBy[seq].faceToGround) * 1000) / 1000 }
  } else {
    scaleEvidence[seq] = { method: 'UNVERIFIED (no clean upright face, no guard cell) - factor 1', n: 0, size: null, factor: 1 }
  }
}

// ---- controlled guard-cell comparison ------------------------------------
const guardScale = {}
const refGuard = guards.find((g) => g.seq === 'walk')
for (const g of guards) {
  if (!g.face) continue
  const ground = refGuard.faceToGround / g.faceToGround
  const face = Math.sqrt(refGuard.face.area) / Math.sqrt(g.face.area)
  guardScale[g.seq] = {
    ground: Math.round(ground * 1000) / 1000,
    face: Math.round(face * 1000) / 1000,
    factor: Math.round(((ground + face) / 2) * 1000) / 1000,
    disagreement: Math.round(Math.abs(ground - face) * 1000) / 1000,
  }
}
const raw = { rows, guards, referenceFaceSize: Math.round(refFace * 100) / 100, scaleEvidence, guardScale }
writeFileSync(`${SRC}/measurements-raw.json`, `${JSON.stringify(raw, null, 2)}\n`)

// ---- controlled guard-cell height ratios (the 2nd geometric proxy) ----
const heightRatios = {}
if (guardBy.walk) {
  for (const g of guards) {
    heightRatios[g.seq] = Math.round((guardBy.walk.bboxH / g.bboxH) * 1000) / 1000
  }
}
writeFileSync(`${SRC}/scale-compare.json`, `${JSON.stringify({
  method: 'guard figure bbox height ratio vs walk (same standing-guard pose); only sheets with a guard-like cell',
  ratios: heightRatios,
}, null, 2)}\n`)
console.log('GUARD-CELL HEIGHT RATIOS (vs walk):', JSON.stringify(heightRatios))
console.log('GUARD-CELL SCALE (controlled pose; factor = mean of two proxies):')
for (const [seq, e] of Object.entries(guardScale)) console.log(' ', seq.padEnd(9), 'ground', e.ground, 'face', e.face, '=> factor', e.factor, '(proxy disagreement', e.disagreement + ')')
console.log('PER-SHEET SCALE EVIDENCE (reference = walk face size', refFace.toFixed(2) + '):')
for (const [seq, e] of Object.entries(scaleEvidence)) console.log(' ', seq.padEnd(9), e.method.padEnd(34), 'n=' + e.n, 'size=' + e.size, 'factor=' + e.factor)
console.log('GUARD cells (upright figure scale evidence):')
for (const g of guards) console.log(' ', g.seq.padEnd(9), 'bboxH', g.bboxH, 'faceToGround', g.faceToGround, 'faceW', g.face?.w, 'faceH', g.face?.h)
