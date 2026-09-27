import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync } from 'node:fs'

/** Calibrate eye/chin fractions within each heads group from the heroes'
 * hand-authored landmarks + their keyed PNG masters. If the fractions
 * cluster, boss prep can derive landmarks per group; outliers get
 * eyeballed overrides. */
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

const spec = JSON.parse(readFileSync('art/hero-faces/preparation.json', 'utf8'))
for (const [id, hero] of Object.entries(spec.heroes)) {
  const img = await loadImage(`art/hero-faces/${hero.heads}`)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const groups = componentsAlpha(ctx, img.width, img.height)
  if (groups.length !== 3) { console.log(id, 'groups', groups.length); continue }
  const rows = hero.frames.map((f, i) => {
    const g = groups[i]
    const gw = g.x1 - g.x0 + 1
    const gh = g.y1 - g.y0 + 1
    const ex = (f.eye[0] - g.x0) / gw
    const ey = (f.eye[1] - g.y0) / gh
    const cy = (f.chin[1] - g.y0) / gh
    return `f${i} eye(${ex.toFixed(2)},${ey.toFixed(2)}) chinY(${cy.toFixed(2)})`
  })
  console.log(id.padEnd(10), rows.join('  '))
}
