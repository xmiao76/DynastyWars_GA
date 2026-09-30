// Inspect real screen output around intentionally adversarial action boundaries.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readdirSync, writeFileSync } from 'node:fs'
const OUT = 'artifacts/wholeframe/actions/transitions'
for (const name of ['late-kick', 'air-hit', 'landing-walk', 'landing-mount', 'mount-break-strike', 'thrown-impact', 'getup-defeat']) {
  const files = readdirSync(OUT).filter((p) => p.startsWith(`canvas-${name}-`) && p.endsWith('.png')).sort()
  const cv = createCanvas(400 * Math.min(4, files.length), 350 * Math.ceil(files.length / 4)), g = cv.getContext('2d')
  g.fillStyle = '#191820'; g.fillRect(0, 0, cv.width, cv.height)
  for (const [i, file] of files.entries()) {
    const im = await loadImage(`${OUT}/${file}`), x = i % 4 * 400, y = Math.floor(i / 4) * 350
    g.drawImage(im, 290, 110, 400, 330, x, y + 20, 400, 330)
    g.fillStyle = '#ffffff'; g.font = '14px sans-serif'; g.fillText(`${name}:${i}`, x + 5, y + 16)
  }
  writeFileSync(`${OUT}/${name}-strip.png`, cv.toBuffer('image/png'))
}
