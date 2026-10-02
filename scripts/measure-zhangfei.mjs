#!/usr/bin/env node
// CMR-09A: measurement pass over the Zhang Fei source sheets.
//
//   node scripts/measure-zhangfei.mjs
//
// Pass 1 (scale): face-cluster size + figure height (face centre to ground)
//   of the upright guard drawings - the per-sheet scale evidence.
// Pass 2 (weapon): NOT YET - the pike tip-to-butt method lands with
//   scale-compare at the landmarks turn. This pass writes rows/guards/
//   guardScale/scaleEvidence only.
//
// Aliases are inline (registration.json does not exist until prepare runs);
// they only mark aliased rows so face medians skip them.

import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/zhangfei'
const SHEETS = {
  walk: 'walk-candidate-2.png',
  jab1: 'jab1-candidate-2.png',
  jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png',
  jump: 'jump-candidate-1.png',
  fall: 'fall-candidate-1.png',
  getup: 'getup-candidate-1.png',
  misc: 'misc-candidate-1.png',
  special: 'special-candidate-1.png',
  rider: 'rider-candidate-1.png',
}
// Rows aliased to a canonical drawing (kept in the sheet, skipped by medians).
const ALIASES = {
  walk: {},
  jab1: { 0: 'walk:0', 7: 'walk:0', 8: 'walk:0' },
  jab2: { 0: 'walk:0', 7: 'walk:0', 8: 'walk:0' },
  finisher: { 0: 'walk:0', 7: 'walk:0', 8: 'walk:0' },
  jump: { 0: 'walk:0', 8: 'walk:0' },
  fall: { 0: 'walk:0', 7: 'fall:6', 8: 'walk:0' },
  getup: { 0: 'fall:6', 8: 'walk:0' },
  misc: { 0: 'walk:0', 8: 'walk:0' },
  special: { 0: 'walk:0', 8: 'walk:0' },
  rider: { 8: 'rider:0' },
}
// Sheets whose pos-0 cell is a standing guard (scale evidence). fall:0 is a
// guard; getup:0 is DOWN (use pos 8 instead); rider:0 is mounted (excluded).
const GUARD_SHEETS = ['walk', 'jab1', 'jab2', 'finisher', 'jump', 'fall', 'misc', 'special']

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
  const alias = ALIASES[seq] ?? {}
  for (let pos = 0; pos < 9; pos++) {
    const id = `${seq}:${pos}`
    const box = figureAt(im, comps, pos)
    if (!box) { rows.push({ id, note: 'no figure' }); continue }
    const aliased = alias[pos] !== undefined
    const face = faceOf(im, box)
    const row = {
      id,
      aliased,
      bboxH: box.y1 - box.y0 + 1,
      face: face ? { w: face.x1 - face.x0 + 1, h: face.y1 - face.y0 + 1, area: face.area, cy: Math.round((face.y0 + face.y1) / 2) - box.y0 } : null,
      faceToGround: face ? box.y1 - Math.round((face.y0 + face.y1) / 2) : null,
      spear: null,
    }
    rows.push(row)
    if (pos === 0 && GUARD_SHEETS.includes(seq)) guards.push({ seq, ...row })
  }
  const g8 = rows.find((r) => r.id === `${seq}:8`)
  if (seq === 'getup' && g8) guards.push({ seq, ...g8 })
}
writeFileSync(`${SRC}/measurements-raw.json`, `${JSON.stringify({ rows, guards }, null, 2)}\n`)

// ---- per-sheet scale evidence --------------------------------------------
// Face size (sqrt of the skin-cluster bbox area) over UPRIGHT, UNALIASED
// drawings with a plausible face cluster. Zhang Fei's face merges with his
// bare neck/shoulders (sleeveless vest), so clusters run 52-58px wide -
// the mook gate (18..34) rejected every one; widened here (40..70 wide,
// 30..64 tall) with the merge noted. Reference = walk.
const faceSizes = {}
for (const r of rows) {
  if (!r.face || r.aliased) continue
  if (r.face.w < 40 || r.face.w > 70 || r.face.h < 30 || r.face.h > 64) continue
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

// ---- controlled guard-cell comparison (a scale input the pack uses) ----
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
// Guard figure bbox height of each sheet over walk's, same stance - feeds
// scale-compare.json for prepare's two-proxy rule. Rider has no standing
// guard (mounted), so it stays absent = UNVERIFIED there.
const heightRatios = {}
if (guardBy.walk) {
  for (const g of guards) {
    heightRatios[g.seq] = Math.round((guardBy.walk.bboxH / g.bboxH) * 1000) / 1000
  }
}
writeFileSync(`${SRC}/scale-compare.json`, `${JSON.stringify({
  method: 'guard figure bbox height ratio vs walk (same standing-guard pose); rider has no standing guard',
  ratios: heightRatios,
}, null, 2)}\n`)
console.log('GUARD-CELL HEIGHT RATIOS (vs walk):', JSON.stringify(heightRatios))
console.log('GUARD-CELL SCALE (controlled pose; factor = mean of two proxies):')
for (const [seq, e] of Object.entries(guardScale)) console.log(' ', seq.padEnd(9), 'ground', e.ground, 'face', e.face, '=> factor', e.factor, '(proxy disagreement', e.disagreement + ')')
console.log('PER-SHEET SCALE EVIDENCE (reference = walk face size', refFace.toFixed(2) + '):')
for (const [seq, e] of Object.entries(scaleEvidence)) console.log(' ', seq.padEnd(9), e.method.padEnd(34), 'n=' + e.n, 'size=' + e.size, 'factor=' + e.factor)
console.log('GUARD cells (upright figure scale evidence):')
for (const g of guards) console.log(' ', g.seq.padEnd(9), 'bboxH', g.bboxH, 'faceToGround', g.faceToGround, 'faceW', g.face?.w, 'faceH', g.face?.h)
