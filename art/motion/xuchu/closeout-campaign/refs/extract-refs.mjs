// Existing-pixel extraction ONLY: nominal 512x512 cells from walk-candidate-2.png.
// No generation, no source edit. walk:2 already exists standalone in proof-of-control/
// (walk2-original-cell.png, sha256 75c07dc2...) and is NOT duplicated here.
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const srcPath = 'art/motion/xuchu/walk-candidate-2.png'
const srcSha256 = 'bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c'
const img = await loadImage(srcPath)
// Nominal 3x2 cells of 512x512 (feasibility plan §a). Key -> [x, y].
const cells = { 'walk0': [0, 0], 'walk1': [512, 0], 'walk3': [0, 512], 'walk4': [512, 512], 'walk5': [1024, 512] }
for (const [name, [x, y]] of Object.entries(cells)) {
  const canvas = createCanvas(512, 512)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, x, y, 512, 512, 0, 0, 512, 512)
  const buf = canvas.toBuffer('image/png')
  const out = `art/motion/xuchu/closeout-campaign/refs/${name}-original-cell.png`
  writeFileSync(out, buf)
  console.log(out, buf.length, createHash('sha256').update(buf).digest('hex'), `srcCell=(${x},${y},512,512) srcSha256=${srcSha256}`)
}
