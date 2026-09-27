import { writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const out = createCanvas(1400, 700); const g = out.getContext('2d'); g.fillStyle = '#6a6070'; g.fillRect(0,0,1400,700)
let x = 10
for (const [dir, id] of [['hero-bodies','zhangfei'],['hero-bodies','guanyu'],['boss-bodies','caocao'],['mook-bodies','soldier']]) {
  const j = JSON.parse(await (await import('node:fs/promises')).readFile(`src/game/assets/${dir}/prepared.json`, 'utf8'))[id]
  const img = await loadImage(`src/game/assets/${dir}/${id}-sheet.png`)
  let y = 10
  for (const n of ['upperArmN','foreArmN','upperArmF','foreArmF']) {
    const c = j.parts[n]; if (!c) continue
    g.drawImage(img, c.x, c.y, c.w, c.h, x, y, c.w*2, c.h*2)
    g.fillStyle = '#ff0'; g.fillRect(x + c.pivotX*2 - 2, y + c.pivotY*2 - 2, 4, 4)
    y += c.h*2 + 8
    if (y > 520) { y = 10; x += 120 }
  }
  x += 130
}
writeFileSync('artifacts/look/r3-armcells.png', out.toBuffer('image/png'))
