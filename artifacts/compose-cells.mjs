import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
const groups = [['guanyu','huangzhong','zhaoyun','spearman','archer','caocao'],['xiahoudun','xuchu','zhangliao','caoren','xuhuang','zhanghe','lidian']]
for (const [gi, ids] of groups.entries()) {
  const cols = 3, w = 750, h = 476
  const cv = createCanvas(cols * w, Math.ceil(ids.length / cols) * (h + 24))
  const g = cv.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0,0,cv.width,cv.height); g.font = 'bold 22px sans-serif'
  for (const [i, id] of ids.entries()) {
    const img = await loadImage(`artifacts/look/audit/${id}-cells.png`)
    const x = (i % cols) * w, y = Math.floor(i / cols) * (h + 24)
    g.drawImage(img, x, y + 24); g.fillStyle = '#ffd24a'; g.fillText(id.toUpperCase(), x + 6, y + 20)
  }
  writeFileSync(`artifacts/look/audit/all-cells-${gi}.png`, cv.toBuffer('image/png'))
}
