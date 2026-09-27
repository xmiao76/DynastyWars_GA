import fs from 'node:fs'
import pngjs from 'pngjs'
const { PNG } = pngjs

function goldInBand(file, x0, x1, y0, y1) {
  const png = PNG.sync.read(fs.readFileSync(file))
  let gold = 0
  let total = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * png.width + x) * 4
      total += 1
      if (png.data[i] > 200 && png.data[i + 1] > 150 && png.data[i + 2] < 130) gold += 1
    }
  }
  return { w: png.width, h: png.height, gold, total }
}

for (const f of ['unpaused.png', 'paused.png', 'resumed.png']) {
  console.log(f, JSON.stringify(goldInBand(`artifacts/pause/${f}`, 560, 720, 300, 340)))
}
