#!/usr/bin/env node
// CMR-12A: measurement pass over the Huang Zhong source sheets.
//
//   node scripts/measure-huangzhong.mjs
//
// Pass 1 (scale): face-cluster size + figure height (face centre to ground)
//   of the upright guard drawings - the per-sheet scale evidence. Huang
//   Zhong has NO aliased bookend duplicates (every kept cell is a unique
//   drawing; culled cells are just culled). Guard-like cells: walk:0 +
//   getup:5 only (standing-guard pose; rider mounted, excluded; other
//   sheets' ready cells differ in stance - face-size medians cover them
//   informationally). Face gates as Wei Yan (25..70 wide, 20..64 tall):
//   the headband crops the forehead and the beard crops the jaw, leaving
//   only the eyes/nose/cheeks band visible. A face-box verification
//   overlay is REQUIRED (mustard headband can merge into the skin gate).
// Pass 2 (weapon): bow chords are already overlay-verified per sequence
//   in PROVENANCE.md; cross-sequence acceptance-4 rescales them by the
//   pack scales arithmetically (no re-reads) after factors land.

import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/huangzhong'
const SHEETS = {
  walk: 'walk-candidate-1.png',
  jab1: 'jab1-prepared-source.png',
  jab2: 'jab2-prepared-source.png',
  finisher: 'finisher-candidate-1.png',
  jump: 'jump-candidate-1.png',
  fall: 'fall-candidate-1.png',
  getup: 'getup-prepared-source.png',
  misc: 'misc-candidate-1.png',
  special: 'special-candidate-1.png',
  rider: 'rider-candidate-1.png',
}
// Standing-guard-like cells usable as scale evidence (pos varies).
const GUARD_CELLS = { walk: 0, getup: 5 }

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
const guardShots = []
for (const [seq, file] of Object.entries(SHEETS)) {
  const img = await loadImage(`${SRC}/${file}`)
  const cv = createCanvas(img.width, img.height)
  const g2d = cv.getContext('2d')
  g2d.drawImage(img, 0, 0)
  const d = g2d.getImageData(0, 0, img.width, img.height)
  const im = { width: d.width, height: d.height, data: d.data }
  const comps = alphaComponents(im, 96)
  for (let pos = 0; pos < 9; pos++) {
    const id = `${seq}:${pos}`
    const box = figureAt(im, comps, pos)
    if (!box) { rows.push({ id, note: 'no figure' }); continue }
    const face = faceOf(im, box)
    if (GUARD_CELLS[seq] === pos) guardShots.push({ seq, pos, cv, box, face })
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
  if (r.face.w < 25 || r.face.w > 70 || r.face.h < 20 || r.face.h > 64) continue
  const seq = r.id.split(':')[0]
  ;(faceSizes[seq] ??= []).push(Math.sqrt(r.face.w * r.face.h))
}
const refFace = (faceSizes.walk?.length ?? 0) > 0 ? median(faceSizes.walk) : null
const guardBy = Object.fromEntries(guards.map((g) => [g.seq, g]))
const scaleEvidence = {}
for (const seq of Object.keys(SHEETS)) {
  const faces = faceSizes[seq] ?? []
  if (faces.length >= 3 && refFace !== null) {
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
  if (!g.face || !refGuard?.face) continue
  const ground = refGuard.faceToGround / g.faceToGround
  const face = Math.sqrt(refGuard.face.area) / Math.sqrt(g.face.area)
  guardScale[g.seq] = {
    ground: Math.round(ground * 1000) / 1000,
    face: Math.round(face * 1000) / 1000,
    factor: Math.round(((ground + face) / 2) * 1000) / 1000,
    disagreement: Math.round(Math.abs(ground - face) * 1000) / 1000,
  }
}
const raw = { rows, guards, referenceFaceSize: refFace === null ? null : Math.round(refFace * 100) / 100, scaleEvidence, guardScale }
writeFileSync(`${SRC}/measurements-raw.json`, `${JSON.stringify(raw, null, 2)}\n`)

// ---- controlled guard-cell height ratios (the 2nd geometric proxy) ----
const heightRatios = {}
if (guardBy.walk) {
  for (const g of guards) {
    heightRatios[g.seq] = Math.round((guardBy.walk.bboxH / g.bboxH) * 1000) / 1000
  }
}
let prevScale = {}
try { prevScale = JSON.parse(readFileSync(`${SRC}/scale-compare.json`, 'utf8')) } catch { /* first run */ }
writeFileSync(`${SRC}/scale-compare.json`, `${JSON.stringify({
  method: prevScale.method ?? 'guard figure bbox height ratio vs walk (same standing-guard pose); only sheets with a guard-like cell',
  ratios: heightRatios,
  ...Object.fromEntries(Object.entries(prevScale).filter(([k]) => !['method', 'ratios'].includes(k))),
}, null, 2)}\n`)
console.log('GUARD-CELL HEIGHT RATIOS (vs walk):', JSON.stringify(heightRatios))
console.log('GUARD-CELL SCALE (controlled pose; factor = mean of two proxies):')
for (const [seq, e] of Object.entries(guardScale)) console.log(' ', seq.padEnd(9), 'ground', e.ground, 'face', e.face, '=> factor', e.factor, '(proxy disagreement', e.disagreement + ')')
console.log('PER-SHEET SCALE EVIDENCE (reference = walk face size', (refFace === null ? 'NONE FOUND' : refFace.toFixed(2)) + '):')
for (const [seq, e] of Object.entries(scaleEvidence)) console.log(' ', seq.padEnd(9), e.method.padEnd(34), 'n=' + e.n, 'size=' + e.size, 'factor=' + e.factor)
console.log('GUARD cells (upright figure scale evidence):')
for (const g of guards) console.log(' ', g.seq.padEnd(9), 'bboxH', g.bboxH, 'faceToGround', g.faceToGround, 'faceW', g.face?.w, 'faceH', g.face?.h)
// Face-box verification contact: EVERY guard face box must sit on the
// eyes/nose/cheeks band (headband-merge = corrupt proxies = re-gate).
{
  const CW = 420, CH = 460
  const sheet = createCanvas(CW * Math.max(1, guardShots.length) + 20, CH + 40)
  const s = sheet.getContext('2d')
  s.fillStyle = '#14141f'; s.fillRect(0, 0, sheet.width, sheet.height)
  s.font = '13px sans-serif'; s.fillStyle = '#ffe9a8'
  s.fillText('GUARD face boxes (green must bound the face band only) - CMR-12A', 10, 18)
  guardShots.forEach(({ seq, pos, cv, box, face }, i) => {
    const ox = 10 + i * CW, oy = 30
    const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1
    const sc = Math.min((CW - 8) / w, (CH - 8) / h)
    s.drawImage(cv, box.x0, box.y0, w, h, ox + 4, oy + 4, Math.round(w * sc), Math.round(h * sc))
    s.fillStyle = '#9adcff'
    s.fillText(`${seq}:${pos}`, ox + 4, oy + 13)
    if (face) {
      s.strokeStyle = '#44ff88'; s.lineWidth = 2
      s.strokeRect(ox + 4 + (face.x0 - box.x0) * sc, oy + 4 + (face.y0 - box.y0) * sc, (face.x1 - face.x0 + 1) * sc, (face.y1 - face.y0 + 1) * sc)
    } else {
      s.fillStyle = '#ff4444'; s.fillText('NO FACE', ox + 4, oy + 30)
    }
  })
  writeFileSync('artifacts/tmpcheck/huangzhong-guard-faces.png', sheet.toBuffer('image/png'))
  console.log('wrote artifacts/tmpcheck/huangzhong-guard-faces.png')
}
