#!/usr/bin/env node
// CMR-11A acceptance-4: TRUE dao endpoints by direct location (committed: it is the acceptance measurement).
//   node scripts/dao-true-weiyan.mjs   -> art/motion/weiyan/dao-true.json + ignored overlay
// The RANSAC axis fit extends through the body on a short-gripped dao (the
// overlay review proved it: jab2:2 517, jab1:4 448 read lines through the
// torso). Here: largest steel cluster = the blade; PCA axis; tip = steel
// extreme; the base end is the end with bronze (guard) nearby; the pommel
// is the farthest bronze pixel within 14px of the axis up to 140px beyond
// the base. Reports BLADE length (steel tip to guard end) and WHOLE length
// (tip to pommel, or UNVERIFIED when the pommel is hidden).
import { loadImage, createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/weiyan/'
const SHEETS = {
  walk: 'walk-candidate-1.png', jab1: 'jab1-candidate-1.png', jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png', jump: 'jump-candidate-1.png', fall: 'fall-candidate-1.png',
  getup: 'getup-candidate-1.png', misc: 'misc-candidate-1.png', special: 'special-candidate-1.png',
  rider: 'rider-candidate-1.png',
}
const KEEP = {
  walk: [0, 1, 2, 3, 4, 5, 6, 7, 8], jab1: [0, 1, 2, 3, 4], jab2: [0, 1, 2, 3, 4],
  finisher: [0, 1, 2, 3, 4], jump: [0, 1, 6, 3, 5, 7], fall: [0, 1, 2, 3, 4],
  getup: [0, 1, 2, 3, 4], misc: [0, 1, 2, 3, 4], special: [0, 1, 2, 3, 4], rider: [0, 1, 2, 3, 4, 5],
}
const SCALE = JSON.parse(readFileSync('art/motion/weiyan/registration.json', 'utf8')).sheets

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: mx ? d / mx : 0, v: mx / 255 }
}
const isSteel = (r, g, b) => Math.max(r, g, b) > 105 && Math.max(r, g, b) - Math.min(r, g, b) < 40
const isBronze = (r, g, b) => {
  const { h, s, v } = hsv(r, g, b)
  return h >= 28 && h <= 52 && s > 0.38 && v > 0.45 && r > 120
}

const rows = []
const COLS = 8, CW = 300, CH = 250
const frames = []
for (const [seq, file] of Object.entries(SHEETS)) {
  const img = await loadImage(SRC + file)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  const im = { width: d.width, height: d.height, data: d.data }
  const cw = Math.floor(im.width / 3), ch = Math.floor(im.height / 3)
  const byCell = new Map()
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cw)), cy = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / ch))
    const k = cy * 3 + cx
    if (!byCell.has(k) || c.area > byCell.get(k).area) byCell.set(k, c)
  }
  KEEP[seq].forEach((cell, pos) => {
    const comp = byCell.get(cell)
    const inset = new Set(comp.pixels)
    // largest 4-connected steel cluster
    const seen = new Set()
    let best = null
    for (const p of comp.pixels) {
      if (seen.has(p)) continue
      const k = p * 4
      if (!isSteel(im.data[k], im.data[k + 1], im.data[k + 2])) continue
      const stack = [p]; seen.add(p)
      const pts = []
      while (stack.length) {
        const q = stack.pop(); pts.push(q)
        const qx = q % im.width, qy = (q / im.width) | 0
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nk = (qy + dy) * im.width + (qx + dx)
          if (!inset.has(nk) || seen.has(nk)) continue
          const kk = nk * 4
          if (!isSteel(im.data[kk], im.data[kk + 1], im.data[kk + 2])) continue
          seen.add(nk); stack.push(nk)
        }
      }
      if (!best || pts.length > best.length) best = pts
    }
    const rec = { id: `${seq}:${pos}`, seq, pos, cell, blade: null, whole: null, steelPx: best ? best.length : 0 }
    if (best && best.length > 800) {
      const xs = best.map((q) => q % im.width), ys = best.map((q) => (q / im.width) | 0)
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length
      let sxx = 0, syy = 0, sxy = 0
      for (let i = 0; i < xs.length; i++) { sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; sxy += (xs[i] - mx) * (ys[i] - my) }
      const th = 0.5 * Math.atan2(2 * sxy, sxx - syy)
      const ux = Math.cos(th), uy = Math.sin(th)
      let tmin = 1e9, tmax = -1e9
      for (let i = 0; i < xs.length; i++) {
        const t = (xs[i] - mx) * ux + (ys[i] - my) * uy
        if (t < tmin) tmin = t
        if (t > tmax) tmax = t
      }
      // bronze near each end
      const bronzeNear = (t) => {
        let n = 0
        const cx = mx + t * ux, cy = my + t * uy
        for (let dy = -22; dy <= 22; dy += 2) for (let dx = -22; dx <= 22; dx += 2) {
          const x = Math.round(cx + dx), y = Math.round(cy + dy)
          const p = y * im.width + x
          if (x < 0 || y < 0 || x >= im.width || y >= im.height || !inset.has(p)) continue
          const k = p * 4
          if (isBronze(im.data[k], im.data[k + 1], im.data[k + 2])) n++
        }
        return n
      }
      const bLo = bronzeNear(tmin), bHi = bronzeNear(tmax)
      const baseAtHigh = bHi >= bLo
      const tBase = baseAtHigh ? tmax : tmin, tTip = baseAtHigh ? tmin : tmax
      const dir = baseAtHigh ? 1 : -1
      // pommel: farthest bronze within 14px of the axis up to 140px beyond base
      let tPom = null
      for (let t = tBase; Math.abs(t - tBase) <= 140; t += dir) {
        let hit = false
        for (let o = -14; o <= 14 && !hit; o += 2) {
          const x = Math.round(mx + t * ux - o * uy), y = Math.round(my + t * uy + o * ux)
          const p = y * im.width + x
          if (x < 0 || y < 0 || x >= im.width || y >= im.height || !inset.has(p)) continue
          const k = p * 4
          if (isBronze(im.data[k], im.data[k + 1], im.data[k + 2])) hit = true
        }
        if (hit) tPom = t
      }
      rec.blade = Math.round(Math.abs(tBase - tTip))
      rec.whole = tPom === null ? null : Math.round(Math.abs(tPom - tTip))
      rec.angle = Math.round(th * 180 / Math.PI)
      rec.tip = [Math.round(mx + tTip * ux), Math.round(my + tTip * uy)]
      rec.base = [Math.round(mx + tBase * ux), Math.round(my + tBase * uy)]
      rec.pommel = tPom === null ? null : [Math.round(mx + tPom * ux), Math.round(my + tPom * uy)]
      rec.bronzeEnds = [bLo, bHi]
    }
    rec.scale = SCALE[seq].scale
    rec.bladeDisp = rec.blade === null ? null : Math.round(rec.blade * rec.scale * 10) / 10
    rec.wholeDisp = rec.whole === null ? null : Math.round(rec.whole * rec.scale * 10) / 10
    rows.push(rec)
    frames.push({ img, im, comp, rec })
  })
}
// overlay
const sheet = createCanvas(COLS * CW, Math.ceil(frames.length / COLS) * CH + 30)
const sg = sheet.getContext('2d')
sg.fillStyle = '#201c28'; sg.fillRect(0, 0, sheet.width, sheet.height)
sg.fillStyle = '#ffd27f'; sg.font = 'bold 18px sans-serif'
sg.fillText('WEI YAN TRUE DAO ENDPOINTS (green tip, orange blade-base, cyan pommel)', 10, 22)
frames.forEach((f, i) => {
  const pad = 14
  const bx = f.comp.x0 - pad, by = f.comp.y0 - pad
  const bw = f.comp.x1 - f.comp.x0 + 1 + 2 * pad, bh = f.comp.y1 - f.comp.y0 + 1 + 2 * pad
  const sc = Math.min((CW - 8) / bw, (CH - 34) / bh)
  const ox = (i % COLS) * CW, oy = 30 + Math.floor(i / COLS) * CH
  sg.drawImage(f.img, bx, by, bw, bh, ox + 4, oy + 26, bw * sc, bh * sc)
  sg.font = '12px sans-serif'; sg.fillStyle = '#fff'
  sg.fillText(`${f.rec.id} blade=${f.rec.blade ?? 'UNV'} whole=${f.rec.whole ?? 'UNV'}`, ox + 4, oy + 18)
  const P = (pt) => [ox + 4 + (pt[0] - bx) * sc, oy + 26 + (pt[1] - by) * sc]
  const dot = (pt, col) => { if (!pt) return; const [x, y] = P(pt); sg.strokeStyle = col; sg.lineWidth = 2; sg.beginPath(); sg.arc(x, y, 5, 0, Math.PI * 2); sg.stroke() }
  if (f.rec.tip) {
    const [x1, y1] = P(f.rec.tip), [x2, y2] = P(f.rec.pommel ?? f.rec.base)
    sg.strokeStyle = '#ff5050'; sg.lineWidth = 1.5; sg.beginPath(); sg.moveTo(x1, y1); sg.lineTo(x2, y2); sg.stroke()
    dot(f.rec.tip, '#30ff60'); dot(f.rec.base, '#ffa030'); dot(f.rec.pommel, '#30e0ff')
  }
})
mkdirSync('artifacts/motion/weiyan/landmarks', { recursive: true })
writeFileSync('artifacts/motion/weiyan/landmarks/dao-true-endpoints.png', sheet.toBuffer('image/png'))
writeFileSync('art/motion/weiyan/dao-true.json', JSON.stringify(rows.map(({ id, seq, pos, cell, blade, whole, bladeDisp, wholeDisp, angle, steelPx, tip, base, pommel }) => ({ id, seq, pos, cell, blade, whole, bladeDisp, wholeDisp, angle, steelPx, tip, base, pommel })), null, 2) + '\n')
for (const r of rows) console.log(`${r.id.padEnd(11)} steel=${String(r.steelPx).padStart(6)} blade=${String(r.blade ?? 'UNV').padStart(4)} whole=${String(r.whole ?? 'UNV').padStart(4)} bladeDisp=${String(r.bladeDisp ?? '-').padStart(6)} wholeDisp=${String(r.wholeDisp ?? '-').padStart(6)} angle=${r.angle ?? '-'}`)
