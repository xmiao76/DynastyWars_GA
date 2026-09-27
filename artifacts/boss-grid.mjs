import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'

/** Grid + silhouette-group boxes for boss heads masters (landmark source). */
function components(im, ctx, tol) {
  const d = ctx.getImageData(0, 0, im.width, im.height).data
  const seen = new Uint8Array(im.width * im.height)
  const groups = []
  for (let k = 0; k < seen.length; k++) {
    if (seen[k]) continue
    const p = k * 4
    if ((d[p] + d[p + 1] + d[p + 2]) / 3 <= tol) continue
    const q = [k]; seen[k] = 1
    let n = 0
    let x0 = im.width, x1 = 0, y0 = im.height, y1 = 0
    for (let h = 0; h < q.length; h++) {
      const t = q[h]; const x = t % im.width; const y = Math.floor(t / im.width)
      n += 1
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      for (const j of [x > 0 ? t - 1 : -1, x + 1 < im.width ? t + 1 : -1,
        y > 0 ? t - im.width : -1, y + 1 < im.height ? t + im.width : -1]) {
        if (j >= 0 && !seen[j]) {
          const q2 = j * 4
          if ((d[q2] + d[q2 + 1] + d[q2 + 2]) / 3 > tol) { seen[j] = 1; q.push(j) }
        }
      }
    }
    groups.push({ n, x0, x1, y0, y1 })
  }
  return groups.sort((a, b) => a.x0 - b.x0)
}

const ids = ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian']
for (const id of ids) {
  const img = await loadImage(`art/boss-faces/${id}-heads-master.jpg`)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const groups = components(img, ctx, 16).filter((g) => g.n > 1000)
  // Grid every 5%.
  ctx.strokeStyle = 'rgba(0,255,255,0.55)'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(0,255,255,0.9)'
  ctx.font = `${Math.round(img.height / 45)}px sans-serif`
  for (let i = 1; i < 20; i += 1) {
    const x = Math.round((img.width * i) / 20)
    const y = Math.round((img.height * i) / 20)
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, img.height); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(img.width, y); ctx.stroke()
    ctx.fillText(`${i * 5}`, x + 3, 18)
    ctx.fillText(`${i * 5}`, 3, y - 4)
  }
  groups.forEach((g, i) => {
    const top3 = [...groups].sort((a, b) => b.n - a.n).slice(0, 3).includes(g)
    ctx.strokeStyle = top3 ? 'rgba(0,255,0,0.95)' : 'rgba(255,80,80,0.95)'
    ctx.lineWidth = 3
    ctx.strokeRect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0)
    ctx.fillStyle = top3 ? '#00ff00' : '#ff5050'
    ctx.fillText(`G${i}:${g.n}px`, g.x0 + 4, g.y0 + 22)
    ctx.fillStyle = 'rgba(0,255,255,0.9)'
  })
  writeFileSync(`artifacts/boss-grid-${id}.jpg`, c.toBuffer('image/jpeg', 88))
  console.log(id, groups.length, 'groups; top3:', [...groups].sort((a, b) => b.n - a.n).slice(0, 3).map((g) => `${g.n}px`).join(' '))
}
