import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
// Crop arm-zoom cells at full res: 7 cols x 2 rows, 256x(232+20).
const MOVES = ['idle', 'walk0', 'walk1', 'attack', 'attack2', 'thrust', 'chop', 'sweep', 'windup', 'recover', 'jump', 'down', 'hurt', 'special']
const [id, ...moves] = process.argv.slice(2)
const img = await loadImage(`artifacts/look/moves/${id}-arms.png`)
for (const mv of moves) {
  const i = MOVES.indexOf(mv)
  const x = (i % 7) * 256
  const y = Math.floor(i / 7) * 252
  const out = createCanvas(256, 252)
  out.getContext('2d').drawImage(img, x, y, 256, 252, 0, 0, 256, 252)
  // 2x nearest for inspection
  const big = createCanvas(512, 504)
  const g = big.getContext('2d')
  g.imageSmoothingEnabled = false
  g.drawImage(out, 0, 0, 512, 504)
  writeFileSync(`artifacts/look/cell-${id}-${mv}.png`, big.toBuffer('image/png'))
  console.log(mv, 'ok')
}
