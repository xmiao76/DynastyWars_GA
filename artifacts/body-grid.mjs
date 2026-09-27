import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'

for (const id of ['guanyu', 'zhangfei', 'huangzhong', 'weiyan', 'zhaoyun']) {
  const img = await loadImage(`art/hero-bodies/${id}-body-master.jpg`)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  ctx.strokeStyle = 'rgba(0,255,255,0.8)'
  ctx.lineWidth = 2
  ctx.fillStyle = 'rgba(0,255,255,0.9)'
  ctx.font = `${Math.round(img.height / 40)}px sans-serif`
  for (let i = 1; i < 10; i += 1) {
    const x = Math.round((img.width * i) / 10)
    const y = Math.round((img.height * i) / 10)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, img.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(img.width, y)
    ctx.stroke()
    ctx.fillText(`${i * 10}`, x + 4, 24)
    ctx.fillText(`${i * 10}`, 4, y - 6)
  }
  writeFileSync(`artifacts/body-grid-${id}.jpg`, c.toBuffer('image/jpeg', 88))
  console.log(id, img.width, img.height)
}
