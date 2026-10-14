// Capture review output from actual in-game PNG frames, not reconstructed poses.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const OUT = 'artifacts/wholeframe/actions'
mkdirSync(OUT, { recursive: true })
const names = ['jump', 'jumpkick', 'hurt', 'knockdown', 'special', 'grab', 'airfall', 'ko']
const shots = readdirSync(`${OUT}/frames`).filter((f) => f.endsWith('.png')).sort()
for (const name of names) {
  const files = shots.filter((f) => f.startsWith(`right-${name}-`))
  if (!files.length) continue
  const width = 400, height = 340
  const cv = createCanvas(width * 4, height * Math.ceil(files.length / 4)), g = cv.getContext('2d')
  g.fillStyle = '#191820'; g.fillRect(0, 0, cv.width, cv.height)
  for (const [i, file] of files.entries()) {
    const img = await loadImage(`${OUT}/frames/${file}`)
    const x = i % 4 * width, y = Math.floor(i / 4) * height
    // Crop actual stage around fixed review actor x230 y216 including the jump.
    g.drawImage(img, 290, 145, 400, 330, x, y + 10, 400, 330)
    g.fillStyle = '#ffffff'; g.font = '12px sans-serif'; g.fillText(file.replace('.png', ''), x + 4, y + 13)
  }
  writeFileSync(`${OUT}/${name}-ingame-strip.png`, cv.toBuffer('image/png'))
}
const timeline = JSON.parse(readFileSync(`${OUT}/canvas-all-actions.json`, 'utf8'))
console.log('Recorded actions', [...new Set(timeline.records.map((r) => r.action))].join(', '))
