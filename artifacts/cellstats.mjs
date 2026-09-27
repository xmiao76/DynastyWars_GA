import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync } from 'node:fs'
const packs = ['hero-bodies','mook-bodies','boss-bodies']
for (const p of packs) {
  const m = JSON.parse(readFileSync(`src/game/assets/${p}/prepared.json`,'utf8'))
  for (const id of Object.keys(m)) {
    const sheet = await loadImage(`src/game/assets/${p}/${id}-sheet.png`)
    const out = []
    for (const [name, c] of Object.entries(m[id].parts)) {
      const cv = createCanvas(c.w, c.h); const g = cv.getContext('2d'); g.drawImage(sheet, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h)
      const d = g.getImageData(0,0,c.w,c.h).data
      let op = 0, inner = 0, holes = 0
      for (let y = 0; y < c.h; y++) {
        let a = -1, b = -1
        for (let x = 0; x < c.w; x++) if (d[(y*c.w+x)*4+3] > 200) { if (a < 0) a = x; b = x }
        if (a < 0) continue
        for (let x = a; x <= b; x++) { inner++; if (d[(y*c.w+x)*4+3] <= 200) holes++; else op++ }
      }
      out.push(`${name}:${(op/(c.w*c.h)*100).toFixed(0)}/${(holes/Math.max(1,inner)*100).toFixed(0)}`)
    }
    console.log(id.padEnd(11), out.join(' '))
  }
}
