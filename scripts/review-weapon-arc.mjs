// Document actual displayed exposure order, not all unused source poses.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync, writeFileSync } from 'node:fs'
const meta = JSON.parse(readFileSync('src/game/assets/motion/actions-prepared.json', 'utf8'))
const old = JSON.parse(readFileSync('src/game/assets/motion/prepared.json', 'utf8')).guanyu
const regular = await loadImage('src/game/assets/motion/guanyu-motion-sheet.png')
const actions = await loadImage('src/game/assets/motion/guanyu-actions-sheet.png')
const clips = {
  special: ['walk:0', 'special:7', 'special:2', 'special:3', 'special:4', 'special:5', 'special:3', 'special:6', 'special:7', 'walk:0'],
  mounted: ['rider:0', 'rider:5', 'rider:4', 'rider:5', 'rider:6'],
}
for (const [name, ids] of Object.entries(clips)) {
  const c = createCanvas(448 * 5, 320 * Math.ceil(ids.length / 5)), g = c.getContext('2d')
  g.fillStyle = '#3a3440'; g.fillRect(0, 0, c.width, c.height)
  for (const [i, id] of ids.entries()) {
    const f = meta.frames[id] ?? old.frames[id]
    const x = i % 5 * 448, y = Math.floor(i / 5) * 320
    g.fillStyle = '#a0ffb4'; g.font = '16px sans-serif'; g.fillText(`${i}: ${id}`, x + 4, y + 22)
    g.drawImage(f.sheet === 'actions' ? actions : regular, f.x, f.y, f.w, f.h, x, y + 32, f.w, f.h)
  }
  writeFileSync(`artifacts/wholeframe/actions/${name}-exposure-order.png`, c.toBuffer('image/png'))
}
