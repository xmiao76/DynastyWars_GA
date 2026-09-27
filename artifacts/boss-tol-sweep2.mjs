import { createCanvas, loadImage } from '@napi-rs/canvas'

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
    for (let h2 = 0; h2 < q.length; h2++) {
      const t = q[h2]; const x = t % w; const y = Math.floor(t / w)
      n += 1
      for (const j of [x > 0 ? t - 1 : -1, x + 1 < w ? t + 1 : -1, y > 0 ? t - w : -1, y + 1 < h ? t + w : -1]) {
        if (j >= 0 && !seen[j] && d[j * 4 + 3] >= 16) { seen[j] = 1; q.push(j) }
      }
    }
    if (n > 1000) groups.push(n)
  }
  return groups.sort((a, b) => b - a)
}

for (const id of ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian']) {
  const img = await loadImage(`art/boss-faces/${id}-heads-master.jpg`)
  const line = []
  for (const tol of [4, 6, 16]) {
    const c = createCanvas(img.width, img.height)
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    floodKey(ctx, img.width, img.height, tol)
    const g = componentsAlpha(ctx, img.width, img.height)
    line.push(`tol${tol}:${g.length}grp[${g.slice(0, 4).join(',')}]`)
  }
  console.log(id.padEnd(10), line.join('  '))
}
