// ENH-6 one-off: tile 1:1 gameplay crops (5 heroes x 3 strikes) per device.
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const dir = join(root, 'artifacts', 'weapon-review')
const tag = 'enh6combo'
const HEROES = [
  ['guanyu', 'Guan Yu', ['sweep', 'attack', 'chop']],
  ['zhangfei', 'Zhang Fei', ['thrust', 'attack2', 'sweep']],
  ['zhaoyun', 'Zhao Yun', ['attack', 'attack2', 'thrust']],
  ['huangzhong', 'Huang Zhong', ['thrust', 'chop', 'sweep']],
  ['weiyan', 'Wei Yan', ['attack', 'sweep', 'chop']],
]
for (const device of ['desktop', 'phone']) {
  const crop = device === 'desktop' ? { x: 80, y: 250, w: 640, h: 380 } : { x: 0, y: 370, w: 390, h: 260 }
  const labelH = 24
  const canvas = createCanvas(crop.w * 3, HEROES.length * (crop.h + labelH))
  const c = canvas.getContext('2d')
  c.fillStyle = '#18202a'
  c.fillRect(0, 0, canvas.width, canvas.height)
  c.font = '16px sans-serif'
  for (let row = 0; row < HEROES.length; row += 1) {
    const [id, name, triple] = HEROES[row]
    for (let col = 0; col < 3; col += 1) {
      const pose = triple[col]
      const img = await loadImage(join(dir, device + '-' + id + '-combo-' + pose + '-' + tag + '.png'))
      const dx = col * crop.w
      const dy = row * (crop.h + labelH) + labelH
      c.fillStyle = '#fff'
      c.fillText(name + ' / ' + pose, dx + 8, row * (crop.h + labelH) + 17)
      c.drawImage(img, crop.x, crop.y, crop.w, crop.h, dx, dy, crop.w, crop.h)
    }
  }
  const out = join(dir, 'combo-sheet-' + device + '-' + tag + '.png')
  writeFileSync(out, canvas.toBuffer('image/png'))
  console.log('wrote', out, canvas.width + 'x' + canvas.height)
}
