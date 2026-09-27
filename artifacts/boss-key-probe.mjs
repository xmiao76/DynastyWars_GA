import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'node:fs'

/**
 * BODY-6 conversion probe: border-flood key the JPEG masters (same
 * tolerance ladder as the horse pipeline) then count silhouettes on
 * ALPHA, matching the ART-18 components() contract exactly.
 */
function floodKey(ctx, w, h, tol) {
  const im = ctx.getImageData(0, 0, w, h)
  const d = im.data
  const lum = (x, y) => {
    const p = (y * w + x) * 4
    return (d[p] + d[p + 1] + d[p + 2]) / 3
  }
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x += 1) stack.push([x, 0], [x, h - 1])
  for (let y = 0; y < h; y += 1) stack.push([0, y], [w - 1, y])
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const i = y * w + x
    if (seen[i]) continue
    if (lum(x, y) > tol) continue
    seen[i] = 1
    d[i * 4 + 3] = 0
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  ctx.putImageData(im, 0, 0)
}

function componentsAlpha(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data
  const seen = new Uint8Array(w * h)
  const groups = []
  for (let k = 0; k < seen.length; k++) {
    if (seen[k]) continue
    if (d[k * 4 + 3] < 16) continue
    const q = [k]; seen[k] = 1
    let n = 0
    let x0 = w, x1 = 0, y0 = h, y1 = 0
    for (let h2 = 0; h2 < q.length; h2++) {
      const t = q[h2]; const x = t % w; const y = Math.floor(t / w)
      n += 1
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      for (const j of [x > 0 ? t - 1 : -1, x + 1 < w ? t + 1 : -1, y > 0 ? t - w : -1, y + 1 < h ? t + w : -1]) {
        if (j >= 0 && !seen[j] && d[j * 4 + 3] >= 16) { seen[j] = 1; q.push(j) }
      }
    }
    if (n > 1000) groups.push({ n, x0, x1, y0, y1 })
  }
  return groups.sort((a, b) => a.x0 - b.x0)
}

mkdirSync('artifacts/boss-keyed', { recursive: true })
for (const id of ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian']) {
  const img = await loadImage(`art/boss-faces/${id}-heads-master.jpg`)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  floodKey(ctx, img.width, img.height, 16)
  writeFileSync(`artifacts/boss-keyed/${id}-keyed.png`, c.toBuffer('image/png'))
  const g = componentsAlpha(ctx, img.width, img.height)
  const desc = g.map((x) => `${Math.round((100 * x.x0) / img.width)}%..${Math.round((100 * x.x1) / img.width)}%(${x.n}px)`).join(' ')
  console.log(`${id.padEnd(10)} ${g.length} groups: ${desc}`)
}
