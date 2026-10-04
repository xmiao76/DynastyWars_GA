// Walk v2 acceptance numbers: tip-to-pommel length of the long-handled dao in
// every cell, relative to the 451px contract target derived from the game's
// own unit ladder (figures.ts: dao 69u + blade overhang 23u = 92u; scale from
// Zhao Yun's drawn 72u spear = 4.90 raw px/unit => ~451px). Walk cells all
// carry the weapon pointing right, so: pommel = leftmost bronze/gold pixel,
// tip = rightmost pixel of the largest steel cluster.
import { loadImage, createCanvas } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
import { alphaComponents } from './motion-pipeline.mjs'

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
const isSteel = (r, g, b) => Math.max(r, g, b) > 120 && Math.max(r, g, b) - Math.min(r, g, b) < 45
const isGold = (r, g, b) => { const { h, s, v } = hsv(r, g, b); return h >= 36 && h <= 56 && s > 0.5 && v > 0.55 }

const img = await loadImage('art/motion/weiyan/walk-v2-candidate-1.png')
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
const TARGET = 451
const overlay = createCanvas(img.width, img.height)
const og = overlay.getContext('2d')
og.fillStyle = '#17151f'
og.fillRect(0, 0, img.width, img.height)
og.drawImage(img, 0, 0)
const rows = []
for (let cell = 0; cell < 9; cell++) {
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
  let tip = null
  for (const q of best) { const x = q % im.width; if (!tip || x > tip[0]) tip = [x, (q / im.width) | 0] }
  // pommel: leftmost gold pixel in the component, left of the tip's cell center
  let pom = null
  for (const p of comp.pixels) {
    const k = p * 4
    if (!isGold(im.data[k], im.data[k + 1], im.data[k + 2])) continue
    const x = p % im.width
    if (!pom || x < pom[0]) pom = [x, (p / im.width) | 0]
  }
  if (!tip || !pom) throw new Error(`walk cell ${cell}: blade tip or bronze pommel unmeasurable`)
  const L = Math.hypot(tip[0] - pom[0], tip[1] - pom[1])
  const angle = Math.round(Math.atan2(tip[1] - pom[1], tip[0] - pom[0]) * 180 / Math.PI)
  rows.push({ cell, steelPx: best.length, L: Math.round(L), angle, tip, pommel: pom, bboxW: comp.x1 - comp.x0 + 1, bboxH: comp.y1 - comp.y0 + 1 })
  og.strokeStyle = '#ff4355';og.lineWidth = 2
  og.beginPath();og.moveTo(...pom);og.lineTo(...tip);og.stroke()
  for (const [pt,col] of [[tip,'#43ff4f'],[pom,'#38dfff']]) {
    og.beginPath();og.arc(pt[0],pt[1],6,0,Math.PI*2)
    og.fillStyle = '#17151f';og.fill();og.strokeStyle = col;og.lineWidth = 3;og.stroke()
  }
  og.fillStyle = '#ffe099';og.font = 'bold 15px sans-serif'
  og.fillText(`${cell}: ${Math.round(L)}px`,(cell%3)*cw+10,Math.floor(cell/3)*ch+23)
}
const Ls = rows.map((r) => r.L)
const mean = Ls.reduce((a, b) => a + b, 0) / Ls.length
for (const r of rows) console.log(`cell ${r.cell}  tip-to-pommel ${String(r.L).padStart(3)}px (${(100 * r.L / TARGET).toFixed(0)}% of ${TARGET})  angle ${String(r.angle).padStart(3)}deg  steel ${r.steelPx}px  figure bboxH ${r.bboxH}`)
console.log(`\nspread across 9 cells: ${Math.min(...Ls)}-${Math.max(...Ls)} = ${(100 * (Math.max(...Ls) - Math.min(...Ls)) / mean).toFixed(1)}%   mean ${mean.toFixed(0)}px = ${(100 * mean / TARGET).toFixed(0)}% of the contract target`)
console.log('v1 short saber: tip-to-pommel 270px, about 60% of target')
writeFileSync('artifacts/tmpcheck/weiyan-v2-walk-endpoints.png',overlay.toBuffer('image/png'))
console.log('endpoint overlay: artifacts/tmpcheck/weiyan-v2-walk-endpoints.png')
