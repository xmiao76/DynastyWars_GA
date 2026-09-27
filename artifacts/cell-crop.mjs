import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
// Crop named cells at 3x on grey for direct inspection.
const [pack, id, ...parts] = process.argv.slice(2)
const prep = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
const img = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
for (const part of parts) {
  const c = prep[id].parts[part]
  const out = createCanvas(c.w * 3, c.h * 3)
  const g = out.getContext('2d')
  g.fillStyle = '#6a6470'
  g.fillRect(0, 0, out.width, out.height)
  g.imageSmoothingEnabled = false
  g.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w * 3, c.h * 3)
  writeFileSync(`artifacts/look/raw-${id}-${part}.png`, out.toBuffer('image/png'))
  console.log(part, c.w, c.h)
}
