import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'

// Crop review cells from whole-body movesheets (7 cols x 2 rows, 320x258).
const jobs = [
  { id: 'guanyu', cells: [0, 3, 11], name: 'w23b-guanyu' },
  { id: 'caocao', cells: [0, 3, 11], name: 'w23b-caocao' },
]
for (const job of jobs) {
  const img = await loadImage(`artifacts/look/moves/${job.id}.png`)
  const out = createCanvas(320 * job.cells.length, 258)
  const g = out.getContext('2d')
  g.fillStyle = '#3a3440'
  g.fillRect(0, 0, out.width, out.height)
  for (const [i, idx] of job.cells.entries()) {
    const x = (idx % 7) * 320
    const y = Math.floor(idx / 7) * 258
    g.drawImage(img, x, y, 320, 258, i * 320, 0, 320, 258)
  }
  writeFileSync(`artifacts/look/diag-${job.name}.png`, out.toBuffer('image/png'))
}
console.log('ok')
