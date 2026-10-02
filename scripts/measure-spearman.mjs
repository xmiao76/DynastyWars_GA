#!/usr/bin/env node
// CMR-07A: measurement pass over the spearman source sheets.
//
//   node scripts/measure-spearman.mjs
//
// Pass 1 (scale): face-cluster size + figure height (face centre to ground)
//   of the upright guard drawings - the per-sheet scale evidence.
// Pass 2 (spear): thin-structure + steel + tassel candidate pixels,
//   dilated and clustered; the longest elongated cluster's PCA extent is
//   the spear length. Everything not cleanly observable is `unverified`.

import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/spearman'
const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  thrust: 'thrust-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-2.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}
const ALIASES = JSON.parse(readFileSync(`${SRC}/registration.json`, 'utf8')).aliases

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

/** Two-pass chamfer distance transform of the opaque mask (px to nearest transparent). */
function distanceToEdge(im, box) {
  const w = box.x1 - box.x0 + 3
  const h = box.y1 - box.y0 + 3
  const INF = 1e9
  const dist = new Float32Array(w * h).fill(INF)
  const at = (x, y) => (y + 1) * w + (x + 1)
  for (let y = 0; y < h - 2; y++) {
    for (let x = 0; x < w - 2; x++) {
      const k = ((y + box.y0) * im.width + (x + box.x0)) * 4
      dist[at(x, y)] = im.data[k + 3] >= 96 ? INF : 0
    }
  }
  for (let y = -1; y <= h - 2; y++) for (let x = -1; x <= w - 2; x++) {
    const i = at(x, y)
    if (x < 0 || y < 0 || x >= w - 2 || y >= h - 2) { dist[i] = 0; continue }
  }
  // Interior pixels start at INF where opaque; forward + backward sweeps.
  for (let y = 0; y < h - 2; y++) for (let x = 0; x < w - 2; x++) {
    const i = at(x, y)
    if (dist[i] === 0) continue
    dist[i] = Math.min(dist[i], dist[at(x - 1, y)] + 1, dist[at(x, y - 1)] + 1, dist[at(x - 1, y - 1)] + 1.414, dist[at(x + 1, y - 1)] + 1.414)
  }
  for (let y = h - 3; y >= 0; y--) for (let x = w - 3; x >= 0; x--) {
    const i = at(x, y)
    if (dist[i] === 0) continue
    dist[i] = Math.min(dist[i], dist[at(x + 1, y)] + 1, dist[at(x, y + 1)] + 1, dist[at(x + 1, y + 1)] + 1.414, dist[at(x - 1, y + 1)] + 1.414)
  }
  return { dist, at, w, h }
}

/**
 * Spear length: the shaft/head/tassel is the structure whose local
 * half-thickness is small AND that is long. Candidate pixels = thin
 * structure (half-thickness <= 9px, generous for the ~9px-wide shaft and
 * the wider leaf head), steel head or red tassel; dilate by a small
 * radius to bridge hand overlaps, cluster, and take the longest
 * principal-axis extent among elongated clusters (extent >= 2.5x width).
 * The torso is excluded because its half-thickness is far above 9px.
 */
function spearExtent(im, box) {
  const { dist, at } = distanceToEdge(im, box)
  const bw = box.x1 - box.x0 + 1
  const bh = box.y1 - box.y0 + 1
  const cand = new Uint8Array(bw * bh)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const k = ((y + box.y0) * im.width + (x + box.x0)) * 4
      if (im.data[k + 3] < 200) continue
      const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
      const thin = dist[at(x, y)] <= 9
      const steel = hi > 150 && hi - lo < 30
      const tassel = r > 110 && r > g * 1.5 && r > b * 1.5
      if (thin || steel || tassel) cand[y * bw + x] = 1
    }
  }
  const R = 4
  const dil = new Uint8Array(bw * bh)
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    if (!cand[y * bw + x]) continue
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < bw && ny < bh) dil[ny * bw + nx] = 1
    }
  }
  const seen = new Uint8Array(bw * bh)
  let best = null
  for (let sy = 0; sy < bh; sy++) for (let sx = 0; sx < bw; sx++) {
    const s = sy * bw + sx
    if (seen[s] || !dil[s]) continue
    seen[s] = 1
    const stack = [s]
    const pts = []
    while (stack.length) {
      const q = stack.pop()
      const qx = q % bw, qy = (q / bw) | 0
      if (cand[q]) pts.push([qx, qy])
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = qx + dx, ny = qy + dy
        if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue
        const nk = ny * bw + nx
        if (seen[nk] || !dil[nk]) continue
        seen[nk] = 1
        stack.push(nk)
      }
    }
    if (pts.length < 300) continue
    const n = pts.length
    const mx = pts.reduce((a, p) => a + p[0], 0) / n
    const my = pts.reduce((a, p) => a + p[1], 0) / n
    let sxx = 0, syy = 0, sxy = 0
    for (const [px, py] of pts) { sxx += (px - mx) ** 2; syy += (py - my) ** 2; sxy += (px - mx) * (py - my) }
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const ux = Math.cos(theta), uy = Math.sin(theta)
    let pMin = Infinity, pMax = -Infinity, qMin = Infinity, qMax = -Infinity
    for (const [px, py] of pts) {
      const p = (px - mx) * ux + (py - my) * uy
      const q = -(px - mx) * uy + (py - my) * ux
      if (p < pMin) pMin = p
      if (p > pMax) pMax = p
      if (q < qMin) qMin = q
      if (q > qMax) qMax = q
    }
    const extent = pMax - pMin
    const width = Math.max(1, qMax - qMin)
    if (extent >= 2.5 * width && (best === null || extent > best.extent)) best = { extent: Math.round(extent), width: Math.round(width), n }
  }
  return best
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const rows = []
const guards = []
const shaftBy = {}

/**
 * Shaft thickness (px): median half-thickness along the ridge of shaft-
 * coloured thin structure. The shaft is a cylinder of one fixed diameter,
 * so its apparent thickness is a POSE-INDEPENDENT scale proxy (unlike face
 * area, which changes with turn angle).
 */
function shaftHalfThickness(im, box) {
  const { dist, at } = distanceToEdge(im, box)
  const bw = box.x1 - box.x0 + 1
  const bh = box.y1 - box.y0 + 1
  const vals = []
  for (let y = 1; y < bh - 1; y++) {
    for (let x = 1; x < bw - 1; x++) {
      const d0 = dist[at(x, y)]
      if (d0 < 2 || d0 > 9) continue
      let ridge = true
      for (let dy = -1; dy <= 1 && ridge; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dist[at(x + dx, y + dy)] > d0) { ridge = false; break }
      }
      if (!ridge) continue
      const k = ((y + box.y0) * im.width + (x + box.x0)) * 4
      const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
      if (im.data[k + 3] >= 200 && r > g && g > b && r > 70 && r < 160 && b < 90 && r - b > 25 && r - b < 80) vals.push(d0)
    }
  }
  return vals.length >= 80 ? { half: median(vals), n: vals.length } : null
}
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
    const spear = aliased ? null : spearExtent(im, box)
    const shaft = aliased ? null : shaftHalfThickness(im, box)
    if (shaft) (shaftBy[seq] ??= []).push(shaft.half)
    const row = {
      id,
      aliased,
      bboxH: box.y1 - box.y0 + 1,
      face: face ? { w: face.x1 - face.x0 + 1, h: face.y1 - face.y0 + 1, area: face.area, cy: Math.round((face.y0 + face.y1) / 2) - box.y0 } : null,
      faceToGround: face ? box.y1 - Math.round((face.y0 + face.y1) / 2) : null,
      spear,
    }
    rows.push(row)
    if (pos === 0 && seq !== 'fall-thrown' && seq !== 'getup-death') guards.push({ seq, ...row })
  }
  const g8 = rows.find((r) => r.id === `${seq}:8`)
  if (seq === 'getup-death' && g8) guards.push({ seq, ...g8 })
}
writeFileSync(`${SRC}/measurements-raw.json`, `${JSON.stringify({ rows, guards }, null, 2)}\n`)

// ---- per-sheet scale evidence --------------------------------------------
// Face size (sqrt of the skin-cluster bbox area) over UPRIGHT, UNALIASED
// drawings with a plausible face cluster (18..34px wide, 20..36px tall:
// excludes hand merges and tilted/prone faces). Reference = locomotion.
// Sheets without enough clean upright faces fall back to the standing
// guard cell's face-to-ground distance (same stance in every sheet), and
// sheets with neither stay UNVERIFIED (factor 1, flagged).
const faceSizes = {}
for (const r of rows) {
  if (!r.face || r.aliased) continue
  if (r.face.w < 18 || r.face.w > 34 || r.face.h < 20 || r.face.h > 36) continue
  const seq = r.id.split(':')[0]
  ;(faceSizes[seq] ??= []).push(Math.sqrt(r.face.w * r.face.h))
}
const refFace = median(faceSizes.locomotion)
const guardBy = Object.fromEntries(guards.map((g) => [g.seq, g]))
const scaleEvidence = {}
for (const seq of Object.keys(SHEETS)) {
  const faces = faceSizes[seq] ?? []
  if (faces.length >= 3) {
    scaleEvidence[seq] = { method: 'face-size median', n: faces.length, size: Math.round(median(faces) * 100) / 100, factor: Math.round((refFace / median(faces)) * 1000) / 1000 }
  } else if (seq !== 'locomotion' && guardBy[seq] && guardBy.locomotion) {
    scaleEvidence[seq] = { method: 'guard face-to-ground', n: 1, size: guardBy[seq].faceToGround, factor: Math.round((guardBy.locomotion.faceToGround / guardBy[seq].faceToGround) * 1000) / 1000 }
  } else {
    scaleEvidence[seq] = { method: 'UNVERIFIED (no clean upright face, no guard cell) - factor 1', n: 0, size: null, factor: 1 }
  }
}
const raw = JSON.parse(readFileSync(`${SRC}/measurements-raw.json`, 'utf8'))

// ---- controlled guard-cell comparison (the scale factors the pack uses) ----
// Same standing-guard pose in every sheet that has one, two INDEPENDENT
// proxies (face-to-ground distance; face sqrt-area), factor = their mean.
// The residual disagreement between the two proxies is the recorded
// uncertainty - proxies here resolve ~+/-5%, so differences below that are
// not claimed. Sheets without a standing guard cell stay UNVERIFIED.
const guardScale = {}
const refGuard = guards.find((g) => g.seq === 'locomotion')
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
raw.guardScale = guardScale
writeFileSync(`${SRC}/measurements-raw.json`, `${JSON.stringify({ ...raw, referenceFaceSize: Math.round(refFace * 100) / 100, scaleEvidence }, null, 2)}\n`)
console.log('GUARD-CELL SCALE (controlled pose; factor = mean of two proxies):')
for (const [seq, e] of Object.entries(guardScale)) console.log(' ', seq.padEnd(13), 'ground', e.ground, 'face', e.face, '=> factor', e.factor, '(proxy disagreement', e.disagreement + ')')
console.log('PER-SHEET SCALE EVIDENCE (reference = locomotion face size', refFace.toFixed(2) + '):')
for (const [seq, e] of Object.entries(scaleEvidence)) console.log(' ', seq.padEnd(13), e.method.padEnd(34), 'n=' + e.n, 'size=' + e.size, 'factor=' + e.factor)
console.log('SHAFT half-thickness per sheet (pose-independent cylinder diameter proxy):')
const shaftMed = {}
for (const seq of Object.keys(SHEETS)) {
  if (!shaftBy[seq]?.length) { console.log(' ', seq.padEnd(13), 'no shaft ridge measured'); continue }
  shaftMed[seq] = median(shaftBy[seq])
  console.log(' ', seq.padEnd(13), 'median half-thickness', shaftMed[seq].toFixed(2), 'px over', shaftBy[seq].length, 'drawings; ratio vs locomotion', (shaftMed[seq] / shaftMed.locomotion).toFixed(3))
}
console.log('GUARD cells (upright figure scale evidence):')
for (const g of guards) console.log(' ', g.seq.padEnd(13), 'bboxH', g.bboxH, 'faceToGround', g.faceToGround, 'faceW', g.face?.w)
console.log('SPEAR extents (raw sheet px; unaliased drawings):')
console.log(rows.filter((r) => r.spear).map((r) => `${r.id}=${r.spear.extent}`).join(' '))
