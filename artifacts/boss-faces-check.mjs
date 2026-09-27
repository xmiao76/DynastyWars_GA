import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync } from 'node:fs'

/** BODY-6 objective cell review: ink, expression liveness, face mass at the
 * pivot, portrait non-blank - the checks that stand in for eyeballing. */
const ids = ['lubu', 'caocao', 'xiahoudun', 'xuchu', 'zhangliao', 'caoren', 'xuhuang', 'zhanghe', 'lidian']
const summary = JSON.parse(readFileSync('src/game/assets/boss-faces/prepared.json', 'utf8'))
const results = []
const check = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`)

for (const id of ids) {
  const meta = summary[id]
  const layers = []
  for (const layer of ['rear', 'head', 'front']) {
    const img = await loadImage(`src/game/assets/boss-faces/${id}-${layer}.png`)
    layers.push(img)
  }
  // Composite each expression cell (rear+head+front) and measure.
  const sigs = []
  let centroids = []
  for (let i = 0; i < 3; i += 1) {
    const cell = createCanvas(160, 224)
    const c = cell.getContext('2d')
    for (const img of layers) c.drawImage(img, i * 160, 0, 160, 224, 0, 0, 160, 224)
    const d = c.getImageData(0, 0, 160, 224).data
    let n = 0, sx = 0, sy = 0
    let sig = 0
    for (let y = 0; y < 224; y += 1) {
      for (let x = 0; x < 160; x += 1) {
        const a = d[(y * 160 + x) * 4 + 3]
        if (a > 128) { n += 1; sx += x; sy += y }
        sig = (sig * 31 + a) % 1000000007
      }
    }
    sigs.push(sig)
    centroids.push(n > 0 ? [sx / n, sy / n] : [0, 0])
    if (i === 0) check(`${id} cell0 ink`, n > 3000, `${n}px`)
  }
  check(`${id} expressions distinct`, new Set(sigs).size === 3, `${new Set(sigs).size}/3`)
  // Face mass: centroid within ~45px of the pivot (100, 80).
  const drift = Math.hypot(centroids[0][0] - 100, centroids[0][1] - 80)
  check(`${id} face mass near pivot`, drift < 45, `drift ${drift.toFixed(0)}px`)
  // Portrait non-blank.
  const p = await loadImage(`src/game/assets/boss-faces/${id}-portrait.png`)
  const pc = createCanvas(p.width, p.height)
  const pctx = pc.getContext('2d')
  pctx.drawImage(p, 0, 0)
  const pd = pctx.getImageData(0, 0, p.width, p.height).data
  let pn = 0
  for (let k = 3; k < pd.length; k += 4) if (pd[k] > 128) pn += 1
  check(`${id} portrait ink`, pn > 20000, `${pn}px`)
  // prepared.json geometry sane.
  check(`${id} bounds finite`, Number.isFinite(meta.bounds.x) && Number.isFinite(meta.bounds.y), '')
}

console.log(results.join('\n'))
const fails = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - fails}/${results.length} checks passed`)
if (fails > 0) process.exit(1)
