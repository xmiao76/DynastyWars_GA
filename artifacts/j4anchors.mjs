import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync, writeFileSync } from 'node:fs'

// Anchors for the attempt-3 review: each sheet's gripN modal colour (the
// bytes the reviewer should be seeing). If a verdict describes a hand
// whose colour contradicts its anchor, that view is stale.
const PACKS = ['hero-bodies', 'mook-bodies', 'boss-bodies']
const lines = []
for (const pack of PACKS) {
  const meta = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
  for (const id of Object.keys(meta)) {
    const sheet = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
    const c = meta[id].parts.gripN
    const cv = createCanvas(c.w, c.h)
    const g = cv.getContext('2d')
    g.drawImage(sheet, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
    const d = g.getImageData(0, 0, c.w, c.h).data
    const counts = new Map()
    for (let i = 0; i < d.length; i += 4) {
      if ((d[i + 3] ?? 0) < 200) continue
      const k = `${d[i]},${d[i + 1]},${d[i + 2]}`
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    let best = ''
    let bestN = -1
    for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k }
    const [r, g2, b] = best.split(',').map(Number)
    const desc = r > 170 && g2 > 140 ? 'pale/cream' : r > 120 ? 'tan/medium' : r > 80 ? 'brown' : 'dark brown'
    lines.push(`${id} gripN-modal rgb(${best}) n=${bestN} => ${desc}`)
  }
}
writeFileSync('artifacts/j4-anchors.txt', lines.join('\n') + '\n')
console.log('wrote artifacts/j4-anchors.txt')
