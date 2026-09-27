import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { HEROES } from '../scripts/prepare-body-parts.mjs'

// Zoomed arm crops per master with a grid labelled in MASTER px, plus the
// current table joints (shoulder/elbow/hand) so elbow + wrist can be read
// precisely. Viewer-left arm = F, viewer-right = N.
mkdirSync('artifacts/look/joints', { recursive: true })
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(HEROES)
for (const id of ids) {
  const s = HEROES[id]
  const img = await loadImage(s.master)
  const j = s.joints
  const H = 300
  const crops = []
  for (const side of ['F', 'N']) {
    const pts = [j[`shoulder${side}`], j[`elbow${side}`], j[`hand${side}`]]
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
    const pad = span * 0.35
    const x0 = Math.max(0, Math.min(...xs) - pad)
    const y0 = Math.max(0, Math.min(...ys) - pad)
    const x1 = Math.min(img.width, Math.max(...xs) + pad)
    const y1 = Math.min(img.height, Math.max(...ys) + pad)
    crops.push({ side, x0, y0, x1, y1 })
  }
  const scale = Math.min(...crops.map((c) => H / (c.y1 - c.y0)))
  const W = crops.reduce((a, c) => a + (c.x1 - c.x0) * scale + 8, 0)
  const out = createCanvas(Math.ceil(W), H + 18)
  const g = out.getContext('2d')
  g.fillStyle = '#202020'; g.fillRect(0, 0, out.width, out.height)
  let ox = 0
  for (const c of crops) {
    const w = (c.x1 - c.x0) * scale
    const h = (c.y1 - c.y0) * scale
    g.drawImage(img, c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0, ox, 18, w, h)
    const step = (c.x1 - c.x0) > 400 ? 50 : 25
    g.font = '10px sans-serif'
    for (let x = Math.ceil(c.x0 / step) * step; x < c.x1; x += step) {
      const px = ox + (x - c.x0) * scale
      g.strokeStyle = x % (step * 2) === 0 ? 'rgba(0,255,255,0.55)' : 'rgba(0,255,255,0.25)'
      g.beginPath(); g.moveTo(px, 18); g.lineTo(px, 18 + h); g.stroke()
      if (x % (step * 2) === 0) { g.fillStyle = '#0ff'; g.fillText(String(x), px + 1, 12) }
    }
    for (let y = Math.ceil(c.y0 / step) * step; y < c.y1; y += step) {
      const py = 18 + (y - c.y0) * scale
      g.strokeStyle = y % (step * 2) === 0 ? 'rgba(255,255,0,0.55)' : 'rgba(255,255,0,0.25)'
      g.beginPath(); g.moveTo(ox, py); g.lineTo(ox + w, py); g.stroke()
      if (y % (step * 2) === 0) { g.fillStyle = '#ff0'; g.fillText(String(y), ox + 1, py - 1) }
    }
    for (const [n, col] of [['shoulder', '#0f0'], ['elbow', '#f0f'], ['hand', '#f00']]) {
      const p = j[`${n}${c.side}`]
      g.fillStyle = col
      g.beginPath(); g.arc(ox + (p[0] - c.x0) * scale, 18 + (p[1] - c.y0) * scale, 4, 0, Math.PI * 2); g.fill()
    }
    g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(`${id} ${c.side}`, ox + w - 70, 30)
    ox += w + 8
  }
  writeFileSync(`artifacts/look/joints/${id}-arms.png`, out.toBuffer('image/png'))
}
console.log('ok')
