import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { HEROES } from '../scripts/prepare-body-parts.mjs'

// Review overlay: each master with its eyeballed joint table drawn on it
// (bones, joint dots, the derived 75% palm point and a 58% wrist tick).
mkdirSync('artifacts/look/joints', { recursive: true })
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(HEROES)
for (const id of ids) {
  const s = HEROES[id]
  const img = await loadImage(s.master)
  const W = 520
  const k = W / img.width
  const c = createCanvas(W, Math.round(img.height * k))
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0, c.width, c.height)
  const j = s.joints
  const P = (n) => [j[n][0] * k, j[n][1] * k]
  const bone = (a, b, col) => {
    g.strokeStyle = col; g.lineWidth = 2
    g.beginPath(); g.moveTo(...P(a)); g.lineTo(...P(b)); g.stroke()
  }
  for (const side of ['F', 'N']) {
    bone(`shoulder${side}`, `elbow${side}`, '#00ff66')
    bone(`elbow${side}`, `hand${side}`, '#00ccff')
    bone(`hip${side}`, `knee${side}`, '#ffcc00')
    bone(`knee${side}`, `foot${side}`, '#ff8800')
    const e = j[`elbow${side}`]; const t = j[`hand${side}`]
    for (const [f, col] of [[0.58, '#ff00ff'], [0.75, '#ff0000']]) {
      g.fillStyle = col
      g.beginPath(); g.arc((e[0] + (t[0] - e[0]) * f) * k, (e[1] + (t[1] - e[1]) * f) * k, 3.5, 0, Math.PI * 2); g.fill()
    }
  }
  bone('chest', 'hip', '#ffffff')
  g.fillStyle = '#ffffff'
  for (const n of Object.keys(j)) { const [x, y] = P(n); g.fillRect(x - 2, y - 2, 4, 4) }
  g.font = '14px sans-serif'; g.fillStyle = '#ffff00'; g.fillText(id, 6, 16)
  writeFileSync(`artifacts/look/joints/${id}.png`, c.toBuffer('image/png'))
}
console.log('wrote', ids.length)
