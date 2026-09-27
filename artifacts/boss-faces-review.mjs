import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync, readFileSync } from 'node:fs'

const ids = ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian']
const summary = JSON.parse(readFileSync('src/game/assets/boss-faces/prepared.json', 'utf8'))
// Compose per boss: portrait | 3 expression cells (all layers) | 3 cells at gameplay size.
const CW = 160
const CH = 224
const rowH = CH + 30
const canvas = createCanvas(432 + CW * 3 + 3 * 44 + 40, rowH * ids.length + 20)
const g = canvas.getContext('2d')
g.fillStyle = '#241c2c'
g.fillRect(0, 0, canvas.width, canvas.height)
g.font = '14px sans-serif'
for (const [row, id] of ids.entries()) {
  const y = 10 + row * rowH
  const portrait = await loadImage(`src/game/assets/boss-faces/${id}-portrait.png`)
  g.drawImage(portrait, 10, y, 216, 240)
  for (const [i, expr] of ['neutral', 'shout', 'hurt'].entries()) {
    const cell = createCanvas(CW, CH)
    const c = cell.getContext('2d')
    for (const layer of ['rear', 'head', 'front']) {
      const img = await loadImage(`src/game/assets/boss-faces/${id}-${layer}.png`)
      c.drawImage(img, i * CW, 0, CW, CH, 0, 0, CW, CH)
    }
    g.drawImage(cell, 460 + i * CW, y)
    // gameplay scale (~21px wide head cell shown at 2x for visibility)
    g.drawImage(cell, 460 + CW * 3 + 10 + i * 44, y + 20, 42, 59)
    g.fillStyle = '#f5e6c8'
    g.fillText(expr, 460 + i * CW + 4, y + CH + 16)
    g.fillText('game', 460 + CW * 3 + 10, y + 14)
    g.fillStyle = '#f5e6c8'
    g.fillText(id, 10, y + CH + 16)
  }
}
writeFileSync('artifacts/boss-faces-review.png', canvas.toBuffer('image/png'))
console.log('wrote artifacts/boss-faces-review.png')
