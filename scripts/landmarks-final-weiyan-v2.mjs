#!/usr/bin/env node
// CMR-11A: acceptance-4 landmark record on the FINAL v2 prepared layout.
//
//   node scripts/landmarks-final-weiyan-v2.mjs
//
// Weapon: TRUE tip-to-pommel (leftmost gold + rightmost steel of the
// largest steel cluster; the exact per-sequence method) per kept cell,
// raw AND displayed (x registered sheet scale). Raw values are
// machine-checked against the overlay-verified per-sequence record
// (RECORDED, from PROVENANCE): any drift aborts the verdict.
// Head: face-cluster sqrt-area x sheet scale per kept cell, reported
// under VALUE-INDEPENDENT subsets (D0 all, D1 shape rule, D2 upright
// family, walk-only). Wei Yan is turbaned: clusters cover only the
// eyes/nose/cheeks band; verdict notes the caveat (10A precedent:
// auto-method void on headgear, consistency evidence decides).
// Direction: per-play-order consecutive angle steps, max reported.
// Writes art/motion/weiyan/landmarks-final.json + ignored overlays.

import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/weiyan'
const reg = JSON.parse(readFileSync(`${SRC}/registration.json`, 'utf8'))
const FILES = {
  walk: 'walk-v2-candidate-1.png', jab1: 'jab1-v2-prepared-source.png',
  jab2: 'jab2-v2-normalized-source.png', finisher: 'finisher-v2-normalized-source.png',
  jump: 'jump-v2-normalized-source.png', fall: 'fall-v2-retouched-source.png',
  getup: 'getup-v2-normalized-source.png', misc: 'misc-v2-prepared-source.png',
  special: 'special-v2-normalized-source.png',
}
// Campaign-achieved raw tip-to-pommel per kept POSITION (play order).
// (Pre-campaign record: walk 471,477,459,480,495,476,495,497,477;
// jab1 469,479,469,495,463; jab2 491,468,498,453,451; finisher
// 522,510,543,506,494; jump 477,491,475,506,485,483; fall
// 502,470,485,500,490; getup 500,469,500,515,485; misc 488,461,479,
// 484,501; special 483,495,482,503,510.)
const RECORDED = {
  walk: [471, 477, 459, 480, 495, 476, 495, 497, 477],
  jab1: [469, 479, 469, 495, 463],
  jab2: [491, 468, 498, 480, 481],
  finisher: [502, 503, 503, 500, 494],
  jump: [477, 491, 475, 500, 485, 483],
  fall: [502, 470, 485, 500, 490],
  getup: [554, 574, 574, 565, 574],
  misc: [488, 461, 479, 484, 501],
  special: [483, 495, 482, 503, 501],
}

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), delta = mx - mn
  let h = 0
  if (delta) {
    if (mx === r) h = ((g - b) / delta) % 6
    else if (mx === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: mx ? delta / mx : 0, v: mx / 255 }
}
const isSteel = (r, g, b) => Math.max(r, g, b) > 120 && Math.max(r, g, b) - Math.min(r, g, b) < 45
const isGold = (r, g, b) => { const { h, s, v } = hsv(r, g, b); return h >= 36 && h <= 56 && s > 0.5 && v > 0.55 }
const isSkin = (d, k) => { const r = d[k], g = d[k + 1], b = d[k + 2], a = d[k + 3]; return a >= 200 && r > 105 && r > g + 12 && g > b && b < 170 }

function endpoints(im, comp) {
  const { width: w, height: h, data: d } = im
  const mask = new Set(comp.pixels), seen = new Set()
  let best = []
  for (const p of comp.pixels) {
    if (seen.has(p)) continue
    const k = p * 4
    if (!isSteel(d[k], d[k + 1], d[k + 2])) continue
    const stack = [p], pts = []
    seen.add(p)
    while (stack.length) {
      const q = stack.pop()
      pts.push(q)
      const x = q % w, y = (q / w) | 0
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy, n = ny * w + nx
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !mask.has(n) || seen.has(n)) continue
        const a = n * 4
        if (!isSteel(d[a], d[a + 1], d[a + 2])) continue
        seen.add(n)
        stack.push(n)
      }
    }
    if (pts.length > best.length) best = pts
  }
  let tip = null, pom = null
  for (const p of best) { const x = p % w; if (!tip || x > tip[0]) tip = [x, (p / w) | 0] }
  for (const p of comp.pixels) { const k = p * 4; if (!isGold(d[k], d[k + 1], d[k + 2])) continue; const x = p % w; if (!pom || x < pom[0]) pom = [x, (p / w) | 0] }
  if (!tip || !pom) return { measured: false, steel: best.length }
  return {
    measured: true, steel: best.length, tip, pom,
    L: Math.round(Math.hypot(tip[0] - pom[0], tip[1] - pom[1])),
    angle: Math.round(Math.atan2(tip[1] - pom[1], tip[0] - pom[0]) * 180 / Math.PI),
  }
}

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
          const nx = qx + dx, ny = qy + dy, nkey = ny * width + nx
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

async function loadPng(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { img, width: d.width, height: d.height, data: d.data }
}

const cells = []
const mismatches = []
const faceCrops = []
for (const [seq, file] of Object.entries(FILES)) {
  const im = await loadPng(`${SRC}/${file}`)
  const cw = Math.floor(im.width / 3), ch = Math.floor(im.height / 3)
  const byCell = new Map()
  for (const c of alphaComponents({ width: im.width, height: im.height, data: im.data }, 96)) {
    const k = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / ch)) * 3 + Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cw))
    if (!byCell.has(k) || c.area > byCell.get(k).area) byCell.set(k, c)
  }
  const out = createCanvas(im.width, im.height), og = out.getContext('2d')
  og.fillStyle = '#17151f'
  og.fillRect(0, 0, im.width, im.height)
  og.drawImage(im.img, 0, 0)
  const scale = reg.sheets[seq].scale
  const { positions } = reg.layout[seq]
  positions.forEach((p, i) => {
    const comp = byCell.get(p.cell)
    if (!comp) throw new Error(`${seq} position ${i}: cell ${p.cell} has no drawing`)
    const e = endpoints(im, comp)
    if (!e.measured) throw new Error(`${seq}:${p.position} (cell ${p.cell}): endpoint detector failed (steel ${e.steel})`)
    if (Math.abs(e.L - RECORDED[seq][i]) > 1) mismatches.push(`${seq}:${p.position}=${e.L}px vs recorded ${RECORDED[seq][i]}px`)
    const f = faceOf(im, comp)
    og.beginPath(); og.moveTo(...e.pom); og.lineTo(...e.tip); og.strokeStyle = '#ff4355'; og.lineWidth = 2; og.stroke()
    for (const [pt, col] of [[e.pom, '#38dfff'], [e.tip, '#43ff4f']]) {
      og.beginPath(); og.arc(pt[0], pt[1], 5, 0, Math.PI * 2); og.fillStyle = '#17151f'; og.fill(); og.strokeStyle = col; og.lineWidth = 3; og.stroke()
    }
    og.fillStyle = '#ffe099'; og.font = 'bold 16px sans-serif'
    og.fillText(`${p.position}: ${e.L}px`, (p.cell % 3) * cw + 8, Math.floor(p.cell / 3) * ch + 23)
    let face = null, displayedHead = null
    if (f) {
      face = { w: f.x1 - f.x0 + 1, h: f.y1 - f.y0 + 1, area: f.area }
      displayedHead = Math.round(Math.sqrt(f.area) * scale * 100) / 100
      og.strokeStyle = '#ffe14a'; og.lineWidth = 2
      og.strokeRect(f.x0, f.y0, f.x1 - f.x0 + 1, f.y1 - f.y0 + 1)
      faceCrops.push({ id: `${seq}:${p.position}`, im, f })
    }
    cells.push({
      id: `${seq}:${p.position}`, seq, position: p.position, cell: p.cell, label: p.label, scale,
      rawL: e.L, angle: e.angle, tip: e.tip, pom: e.pom, steel: e.steel,
      displayed: Math.round(e.L * scale * 100) / 100,
      face, displayedHead,
    })
  })
  writeFileSync(`artifacts/tmpcheck/weiyan-v2-landmarks-${seq}.png`, out.toBuffer('image/png'))
}
if (mismatches.length) throw new Error(`recorded-length cross-check FAILED:\n  ${mismatches.join('\n  ')}`)

// Face contact: every kept face at 2x in one grid for review.
{
  const per = 100, cols = 8
  const rows = Math.ceil(faceCrops.length / cols)
  const c = createCanvas(cols * per, rows * per + 22), g = c.getContext('2d')
  g.fillStyle = '#17141e'; g.fillRect(0, 0, c.width, c.height)
  faceCrops.forEach((f, i) => {
    const cx = f.f.x0 + (f.f.x1 - f.f.x0 + 1) / 2, cy = f.f.y0 + (f.f.y1 - f.f.y0 + 1) / 2
    const s = Math.max(f.f.x1 - f.f.x0 + 1, f.f.y1 - f.f.y0 + 1) + 16
    g.drawImage(f.im.img, cx - s / 2, cy - s / 2, s, s, (i % cols) * per + 5, Math.floor(i / cols) * per + 5, per - 10, per - 10)
    g.fillStyle = '#ffe1a0'; g.font = '10px sans-serif'
    g.fillText(f.id, (i % cols) * per + 4, Math.floor(i / cols) * per + per - 4)
  })
  g.fillStyle = '#ffe1a0'; g.font = 'bold 13px sans-serif'
  g.fillText(`kept faces with cluster: ${faceCrops.length}/${cells.length}`, 8, rows * per + 15)
  writeFileSync('artifacts/tmpcheck/weiyan-v2-face-contact.png', c.toBuffer('image/png'))
}

const spread = (vals) => {
  if (!vals.length) return null
  const mn = Math.min(...vals), mx = Math.max(...vals), mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return { n: vals.length, min: Math.round(mn * 10) / 10, max: Math.round(mx * 10) / 10, spreadPct: Math.round((1000 * (mx - mn)) / mean) / 10 }
}
const bySeq = (seq) => cells.filter((c) => c.seq === seq)
const weapon = {
  perSequenceDisplayed: Object.fromEntries(Object.keys(FILES).map((s) => [s, spread(bySeq(s).map((c) => c.displayed))])),
  FULL_all_kept_displayed: spread(cells.map((c) => c.displayed)),
  FULL_ids: cells.map((c) => c.id),
}
const withFace = cells.filter((c) => c.face)
const aspectOk = (c) => { const a = c.face.w / c.face.h; return a >= 0.85 && a <= 1.35 }
const head = {
  D0_all: spread(withFace.map((c) => c.displayedHead)),
  D1_shape_rule: spread(withFace.filter(aspectOk).map((c) => c.displayedHead)),
  D1_ids: withFace.filter(aspectOk).map((c) => c.id),
  D1_rejected_ids: withFace.filter((c) => !aspectOk(c)).map((c) => `${c.id}(${Math.round((c.face.w / c.face.h) * 100) / 100})`),
  D2_upright_family: spread(withFace.filter((c) => ['walk', 'jab1', 'jab2'].includes(c.seq)).map((c) => c.displayedHead)),
  D2_walk_only: spread(withFace.filter((c) => c.seq === 'walk').map((c) => c.displayedHead)),
  missing_face_ids: cells.filter((c) => !c.face).map((c) => c.id),
}
const steps = {}
for (const seq of Object.keys(FILES)) {
  const cs = bySeq(seq)
  let mx = 0
  for (let i = 1; i < cs.length; i++) mx = Math.max(mx, Math.abs(cs[i].angle - cs[i - 1].angle))
  steps[seq] = mx
}
const direction = { perSequenceMaxStep: steps, globalMaxStep: Math.max(...Object.values(steps)) }
const result = {
  generatedFrom: 'registration.json v2 scales + kept-cell source drawings (TRUE endpoints, overlay-verified method; raw lengths cross-checked vs PROVENANCE record)',
  revision: 'weiyan-2',
  weapon, head, direction, cells,
}
writeFileSync(`${SRC}/landmarks-final.json`, `${JSON.stringify(result, null, 2)}\n`)
console.log('WEAPON displayed tip-to-pommel (raw x sheet scale):')
for (const [s, v] of Object.entries(weapon.perSequenceDisplayed)) console.log(' ', s.padEnd(9), `n=${v.n} min=${v.min} max=${v.max} spread=${v.spreadPct}%`)
console.log('  FULL-56   ', JSON.stringify(weapon.FULL_all_kept_displayed))
console.log('HEAD displayed sqrt(face-area) x scale:')
for (const k of ['D0_all', 'D1_shape_rule', 'D2_upright_family', 'D2_walk_only']) {
  const v = head[k]
  console.log(' ', k.padEnd(20), v ? `n=${v.n} min=${v.min} max=${v.max} spread=${v.spreadPct}%` : 'none')
}
console.log('  D1 rejected (aspect):', head.D1_rejected_ids.join(' ') || 'none')
console.log('  missing faces:', head.missing_face_ids.join(' ') || 'none')
console.log('DIRECTION max consecutive step per play order:', JSON.stringify(steps), 'global max', direction.globalMaxStep)
