import { loadImage, createCanvas } from '@napi-rs/canvas'

/** Same silhouette rule as prepare-hero-faces.mjs components(): connected
 * ink (alpha >= 16 after white->alpha conversion is NOT done here; these
 * are JPEG masters on black, so ink = luminance > 16). Groups > 1000px. */
function components(im, ctx) {
  const d = ctx.getImageData(0, 0, im.width, im.height).data
  const seen = new Uint8Array(im.width * im.height)
  const groups = []
  for (let k = 0; k < seen.length; k++) {
    if (seen[k]) continue
    const p = k * 4
    if ((d[p] + d[p + 1] + d[p + 2]) / 3 <= 16) continue
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
          if ((d[q2] + d[q2 + 1] + d[q2 + 2]) / 3 > 16) { seen[j] = 1; q.push(j) }
        }
      }
    }
    if (n > 1000) groups.push({ n, x0, x1, y0, y1 })
  }
  return groups.sort((a, b) => a.x0 - b.x0)
}

for (const id of ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian']) {
  const img = await loadImage(`art/boss-faces/${id}-heads-master.jpg`)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const g = components(img, ctx)
  const desc = g.map((x) => `${Math.round(x.x0 / img.width * 100)}%..${Math.round(x.x1 / img.width * 100)}%(${x.n}px)`).join(' ')
  console.log(`${id.padEnd(10)} ${g.length} groups: ${desc}`)
}
