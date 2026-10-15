import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { PNG } from 'pngjs'

// Portrait-only preparation (legacy head/front/rear rig layers retired).
// Emits <kind>-portrait.png + slimmed prepared.json (revision + portrait
// signature/sha256) — the only fields hero-art and the face tests consume.
const root = 'art/hero-faces'
const out = 'src/game/assets/hero-faces'
const spec = JSON.parse(readFileSync(`${root}/preparation.json`, 'utf8'))
mkdirSync(out, { recursive: true })
const summary = {}
// Mirror of the pure TS signature algorithm, compared by unit tests. Node runs
// this preparation script without TypeScript loader or browser dependencies.
function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) {
      for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]; n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}

function grade(im, kind) {
  // Author-directed complexion adjustment, applied to warm flesh only. Preserve
  // eye whites, hair, cloth and armor; the portrait mask excludes bronze armor.
  if (kind !== 'guanyu' && kind !== 'weiyan') return im
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    if (x < im.width * 0.31 || x > im.width * 0.76 || y < im.height * 0.13 || y > im.height * 0.69) continue
    const k = (y * im.width + x) * 4
    const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2]
    if (r > 75 && r > g * 1.16 && g > b * 1.12 && r - b > 35) {
      const amount = Math.min(1, (r - g - 10) / 25)
      im.data[k] = Math.round(r * (1 - 0.035 * amount))
      im.data[k + 1] = Math.round(g * (1 - 0.19 * amount))
      im.data[k + 2] = Math.round(b * (1 - 0.10 * amount))
    }
  }
  return im
}

for (const [kind, hero] of Object.entries(spec.heroes)) {
  const portrait = await loadImage(PNG.sync.write(grade(PNG.sync.read(readFileSync(`${root}/${hero.portrait}`)), kind)))
  const p = createCanvas(spec.portrait.width, spec.portrait.height)
  const pc = p.getContext('2d')
  // Contain, never stretch a face. A small top margin prevents brim cropping.
  const ps = Math.min((p.width - 12) / portrait.width, (p.height - 12) / portrait.height)
  pc.drawImage(portrait, (p.width - portrait.width * ps) / 2, 6, portrait.width * ps, portrait.height * ps)
  writeFileSync(`${out}/${kind}-portrait.png`, p.toBuffer('image/png'))
  summary[kind] = {
    revision: spec.revision,
    signatures: { portrait: signature(PNG.sync.read(readFileSync(`${out}/${kind}-portrait.png`))) },
    sha256: { portrait: createHash('sha256').update(readFileSync(`${out}/${kind}-portrait.png`)).digest('hex') },
  }
}
writeFileSync(`${out}/prepared.json`, `${JSON.stringify(summary, null, 2)}\n`)
console.log(Object.fromEntries(Object.entries(summary).map(([id, m]) => [id, { revision: m.revision }])))
