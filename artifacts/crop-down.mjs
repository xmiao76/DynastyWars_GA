import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
// Crop the down cell (index 11) from whole-body movesheets at full res.
for (const id of ['guanyu', 'lubu', 'huangzhong']) {
  const img = await loadImage(`artifacts/look/moves-before19/${id}.png`)
  const i = 11
  const cw = 320
  const chh = (img.height - 40) / 2 - 20 + 20 // rows: 2*(chh+20)
  const rh = (img.height - 40) / 2
  const x = (i % 7) * cw
  const y = Math.floor(i / 7) * (rh + 20)
  const out = createCanvas(cw, rh + 20)
  out.getContext('2d').drawImage(img, x, y, cw, rh + 20, 0, 0, cw, rh + 20)
  writeFileSync(`artifacts/look/down-before19-${id}.png`, out.toBuffer('image/png'))
  console.log(id, img.width, img.height, 'cell', x, y, cw, rh + 20)
}
