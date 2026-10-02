#!/usr/bin/env node
// CMR-07A: splice-verification sheet for repair cells. Full-res crops with
// fitted spear endpoints, plus per-cell head (face-cluster) numbers, so
// every splice decision (spear in-band AND head consistent) is checkable.
// Usage: node scripts/repair-verify-spearman.mjs [specJson]
//   specJson: {sheets:{seq:file}, cells:[[seq,pos,target,k]...],
//              lines:'lines-file.json', overlay:'overlay-name.png'}
//   Default (no argv): the round-0 A/B verification set below.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

// [repairSeq, repairPos, targetId, spliceK]
const SPEC = process.argv[2] ? JSON.parse(process.argv[2]) : null
const CELLS = SPEC?.cells ?? [
  ['repair-A', 4, 'fall-thrown:3', 0.906],
  ['repair-A', 7, 'fall-thrown:6', 0.906],
  ['repair-A', 8, 'fall-thrown:7', 0.906],
  ['repair-A', 2, 'fall-thrown:1', 0.906],
  ['repair-B', 1, 'thrust:3', 0.919],
  ['repair-B', 2, 'thrust:4', 0.919],
  ['repair-B', 3, 'hitstun-held:7', 0.994],
  ['repair-B', 4, 'getup-death:0', 0.919],
  ['repair-B', 5, 'getup-death:1', 0.919],
  ['repair-B', 6, 'getup-death:2', 0.919],
  ['repair-B', 7, 'getup-death:6', 0.919],
  ['repair-B', 8, 'getup-death:7', 0.919],
]
const FILES = SPEC?.sheets ?? {
  'repair-A': 'art/motion/spearman/fall-thrown-repair-candidate-1.png',
  'repair-B': 'art/motion/spearman/mixed-repair-candidate-1.png',
}
const OVERLAY = SPEC?.overlay ?? 'repair-verify.png'
const lines = Object.fromEntries(JSON.parse(readFileSync(`art/motion/spearman/${SPEC?.lines ?? 'repair-lines.json'}`, 'utf8')).map((r) => [`${r.seq}:${r.pos}`, r]))

async function load(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { cv, im: { width: d.width, height: d.height, data: d.data } }
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
const skin = (d, k) => d[k + 3] >= 200 && d[k] > 105 && d[k] > d[k + 1] + 12 && d[k + 1] > d[k + 2] && d[k + 2] < 170
function faceArea(im, box) {
  // Largest skin cluster = face (hands are smaller and lower).
  const seen = new Set()
  let best = 0
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const key = y * im.width + x
      if (seen.has(key) || !skin(im.data, key * 4)) continue
      seen.add(key)
      const stack = [[x, y]]
      let area = 0
      while (stack.length) {
        const [qx, qy] = stack.pop()
        area++
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = qx + dx, ny = qy + dy
          const nk = ny * im.width + nx
          if (nx < box.x0 || nx > box.x1 || ny < box.y0 || ny > box.y1) continue
          if (seen.has(nk) || !skin(im.data, nk * 4)) continue
          seen.add(nk)
          stack.push([nx, ny])
        }
      }
      if (area > best) best = area
    }
  }
  return best
}

const COLS = 4
const CW = 560
const CH = 470
const rows = Math.ceil(CELLS.length / COLS)
const sheet = createCanvas(COLS * CW, rows * CH + 34)
const g = sheet.getContext('2d')
g.fillStyle = '#201c28'
g.fillRect(0, 0, sheet.width, sheet.height)
g.fillStyle = '#ffd27f'
g.font = 'bold 20px sans-serif'
g.fillText('SPEARMAN REPAIR SPLICE VERIFICATION (full-res crops, green = spear endpoints) - CMR-07A', 10, 24)
console.log('id'.padEnd(12), 'target'.padEnd(15), 'spearRaw'.padStart(8), 'spliced'.padStart(7), 'vsRef'.padStart(7), 'faceArea'.padStart(9), 'faceVsRef'.padStart(9))
for (const [idx, [seq, pos, target, k]] of CELLS.entries()) {
  const { cv, im } = await load(FILES[seq])
  const box = figureAt(im, alphaComponents(im, 96), pos)
  const fit = lines[`${seq}:${pos}`]
  const pad = 10
  const bx = box.x0 - pad, by = box.y0 - pad
  const bw = box.x1 - box.x0 + 1 + 2 * pad, bh = box.y1 - box.y0 + 1 + 2 * pad
  const kk = Math.min((CW - 12) / bw, (CH - 34) / bh)
  const ox = (idx % COLS) * CW
  const oy = 34 + Math.floor(idx / COLS) * CH
  g.drawImage(cv, bx, by, bw, bh, ox + 6, oy + 26, bw * kk, bh * kk)
  const packF = target.startsWith('hitstun-held:') ? 0.925 : 1
  const spliced = fit.length ? Math.round(fit.length * k * packF) : null
  const verdict = spliced === null ? 'UNVERIFIED' : Math.abs(spliced - 330) / 330 <= 0.1 ? 'SPEAR-OK' : 'SPEAR-OUT'
  g.fillStyle = '#fff'
  g.font = '14px sans-serif'
  g.fillText(`${seq}:${pos} -> ${target} k=${k} len=${fit.length ?? '?'} spl=${spliced ?? '?'} ${verdict}`, ox + 6, oy + 18)
  if (fit.a) {
    const P = (p) => [ox + 6 + (p[0] - bx) * kk, oy + 26 + (p[1] - by) * kk]
    g.strokeStyle = '#30ff60'
    g.lineWidth = 2
    for (const p of [fit.a, fit.b]) {
      const [x, y] = P(p)
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.stroke()
    }
    const [x1, y1] = P(fit.a)
    const [x2, y2] = P(fit.b)
    g.strokeStyle = '#ff3030'
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
  }
  const fa = faceArea(im, box)
  // Face reference: locomotion median face-cluster sqrt-area = 19.2
  // (area-based, matching faceArea above; NOT the 24.65 bbox-based median).
  const faceVsRef = (Math.sqrt(fa) * k * packF) / 19.2 - 1
  const faceVerdict = Math.abs(faceVsRef) <= 0.1 ? 'HEAD-OK' : Math.abs(faceVsRef) <= 0.2 ? 'HEAD-WIDE' : 'HEAD-OUT'
  console.log(
    `${seq}:${pos}`.padEnd(12), target.padEnd(15), String(fit.length ?? '?').padStart(8),
    String(spliced ?? '?').padStart(7), (spliced ? ((spliced / 330 - 1) * 100).toFixed(1) + '%' : '-').padStart(7),
    String(fa).padStart(9), ((faceVsRef >= 0 ? '+' : '') + (faceVsRef * 100).toFixed(1) + '%').padStart(9), faceVerdict,
  )
}
mkdirSync('artifacts/motion/spearman/landmarks', { recursive: true })
writeFileSync(`artifacts/motion/spearman/landmarks/${OVERLAY}`, sheet.toBuffer('image/png'))
console.log('wrote', `artifacts/motion/spearman/landmarks/${OVERLAY}`, sheet.width + 'x' + sheet.height)
