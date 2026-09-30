// Real-input choreography contact panels follow the actor's actual screen x.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync, writeFileSync } from 'node:fs'
const OUT = 'artifacts/wholeframe/actions/mixed'
const trace = JSON.parse(readFileSync(`${OUT}/canvas-trace.json`, 'utf8')).frames
for (const [name, lo, hi] of [['walk-jump-land', 12, 50], ['late-kick-land-combo', 140, 194], ['combo-special', 50, 128]]) {
  const frames = trace.filter((f) => f.i >= lo && f.i <= hi)
  const selected = []
  for (const f of frames) {
    const path = `${OUT}/frames/${String(f.i).padStart(3, '0')}.png`
    try { selected.push({ ...f, image: await loadImage(path) }) } catch { /* Unsampled ticks are intentionally omitted. */ }
  }
  const cv = createCanvas(400 * 4, 460 * Math.ceil(selected.length / 4)), g = cv.getContext('2d')
  g.fillStyle = '#191820'; g.fillRect(0, 0, cv.width, cv.height)
  for (const [i, f] of selected.entries()) {
    const x = i % 4 * 400, y = Math.floor(i / 4) * 460
    const sx = Math.max(0, Math.min(560, Math.round((f.x - f.scrollX) * 2 - 200)))
    g.drawImage(f.image, sx, 80, 400, 440, x, y + 20, 400, 440)
    g.fillStyle = '#ffffff'; g.font = '12px sans-serif'; g.fillText(`${f.i} ${f.state}:${f.stateTick} ${f.key.split(':motion:')[1]}`, x + 4, y + 15)
  }
  writeFileSync(`${OUT}/${name}-strip.png`, cv.toBuffer('image/png'))
}
console.log('Reviewed sample pace', trace.at(-1).elapsedMs, 'ms for', trace.at(-1).tick - trace[0].tick + 2, 'sim ticks')
