import { readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
// Check wrist-cut: alpha profile down the forearm cells of the new sheets.
for (const [pack, id] of [['hero-bodies', 'weiyan'], ['hero-bodies', 'guanyu']]) {
  const prep = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
  const img = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  for (const part of ['foreArmF', 'foreArmN']) {
    const c = prep[id].parts[part]
    const im = g.getImageData(c.x, c.y, c.w, c.h)
    const rows = []
    for (let y = 0; y < c.h; y += 4) {
      let n = 0
      for (let x = 0; x < c.w; x += 2) if (im.data[(y * c.w + x) * 4 + 3] > 128) n++
      rows.push(n > 0 ? '#' : '.')
    }
    console.log(id, part, `h=${c.h}`, rows.join(''))
  }
}
