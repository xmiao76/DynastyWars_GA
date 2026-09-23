import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { PNG } from 'pngjs'

// Source-controlled landmarks, never inferred from a render's colors at runtime.
const root = 'art/hero-faces'
const out = 'src/game/assets/hero-faces'
const spec = JSON.parse(readFileSync(`${root}/preparation.json`, 'utf8'))
const { width: W, height: H, pixelsPerUnit: S, pivot } = spec.cell
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

/** Isolate the three real connected silhouettes instead of assuming AI columns
 * are equally spaced. Thin detached hairs are omitted, never neighboring heads. */
function components(im) {
  const seen = new Uint8Array(im.width * im.height)
  const groups = []
  for (let k = 0; k < seen.length; k++) {
    if (seen[k] || im.data[k * 4 + 3] < 16) continue
    const q = [k]; seen[k] = 1
    let x0 = im.width, x1 = 0, y0 = im.height, y1 = 0
    for (let h = 0; h < q.length; h++) {
      const t = q[h], x = t % im.width, y = Math.floor(t / im.width)
      x0 = Math.min(x0, x); x1 = Math.max(x1, x)
      y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      for (const j of [x > 0 ? t - 1 : -1, x + 1 < im.width ? t + 1 : -1,
        y > 0 ? t - im.width : -1, y + 1 < im.height ? t + im.width : -1]) {
        if (j >= 0 && !seen[j] && im.data[j * 4 + 3] >= 16) { seen[j] = 1; q.push(j) }
      }
    }
    if (q.length > 1000) groups.push({ pixels: q, x0, x1, y0, y1 })
  }
  return groups.sort((a, b) => a.x0 - b.x0)
}

function grade(im, kind, portrait = false) {
  // Author-directed complexion adjustment, applied to warm flesh only. Preserve
  // eye whites, hair, cloth and armor; the portrait mask excludes bronze armor.
  if (kind !== 'guanyu' && kind !== 'weiyan') return im
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    if (portrait && (x < im.width * 0.31 || x > im.width * 0.76 || y < im.height * 0.13 || y > im.height * 0.69)) continue
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
  const portrait = await loadImage(PNG.sync.write(grade(PNG.sync.read(readFileSync(`${root}/${hero.portrait}`)), kind, true)))
  const p = createCanvas(spec.portrait.width, spec.portrait.height)
  const pc = p.getContext('2d')
  // Contain, never stretch a face. A small top margin prevents brim cropping.
  const ps = Math.min((p.width - 12) / portrait.width, (p.height - 12) / portrait.height)
  pc.drawImage(portrait, (p.width - portrait.width * ps) / 2, 6, portrait.width * ps, portrait.height * ps)
  writeFileSync(`${out}/${kind}-portrait.png`, p.toBuffer('image/png'))

  const im = grade(PNG.sync.read(readFileSync(`${root}/${hero.heads}`)), kind)
  const groups = components(im)
  if (groups.length !== 3 || hero.frames.length !== 3) throw new Error(`${kind}: expected 3 isolated expressions`)
  const layers = Object.fromEntries(['head', 'front', 'rear'].map(k => [k, createCanvas(W * 3, H)]))
  for (const [i, group] of groups.entries()) {
    const f = hero.frames[i]
    const scale = (12 * S) / (f.chin[1] - f.eye[1])
    if (!Number.isFinite(scale) || scale <= 0) throw new Error(`${kind}: invalid landmarks`)
    const iw = group.x1 - group.x0 + 1, ih = group.y1 - group.y0 + 1
    const dx = pivot[0] + (group.x0 - f.eye[0]) * scale
    const dy = pivot[1] + (group.y0 - f.eye[1]) * scale
    if (dx < 1 || dy < 1 || dx + iw * scale >= W - 1 || dy + ih * scale >= H - 1) {
      throw new Error(`${kind}:${i}: head would clip (${dx},${dy},${iw * scale},${ih * scale})`)
    }
    for (const [layer, canvas] of Object.entries(layers)) {
      const isolated = new PNG({ width: iw, height: ih })
      for (const k of group.pixels) {
        const x = k % im.width, y = Math.floor(k / im.width)
        // Split continuous beard at authored jaw transition. Exactly one layer
        // owns each pixel, so recomposition is lossless before resampling.
        const front = f.frontY !== undefined && y >= f.frontY && x >= f.frontX
        const rear = !front && y > f.chin[1] && x < f.eye[0] - 0.6 * (f.chin[1] - f.eye[1])
        if (layer !== (front ? 'front' : rear ? 'rear' : 'head')) continue
        const j = ((y - group.y0) * iw + x - group.x0) * 4
        isolated.data.set(im.data.subarray(k * 4, k * 4 + 4), j)
      }
      const image = await loadImage(PNG.sync.write(isolated))
      canvas.getContext('2d').drawImage(image, i * W + dx, dy, iw * scale, ih * scale)
    }
  }
  // A restrained dark silhouette rim keeps silver hair legible on the pale
  // sky and ground. Compute on the COMPLETE head, never along layer seams.
  const combined = createCanvas(W * 3, H), cc = combined.getContext('2d')
  for (const cv of Object.values(layers)) cc.drawImage(cv, 0, 0)
  const rgba = cc.getImageData(0, 0, W * 3, H), rim = cc.createImageData(W * 3, H)
  const radius = Math.ceil(S * 0.7)
  for (let y = radius; y < H - radius; y++) for (let x = radius; x < W * 3 - radius; x++) {
    const k = (y * W * 3 + x) * 4
    if (rgba.data[k + 3] > 230) continue
    let alpha = 0
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) alpha = Math.max(alpha, rgba.data[((y + dy) * W * 3 + x + dx) * 4 + 3])
    }
    rim.data[k] = 34; rim.data[k + 1] = 28; rim.data[k + 2] = 26
    rim.data[k + 3] = alpha
  }
  cc.clearRect(0, 0, W * 3, H); cc.putImageData(rim, 0, 0)
  cc.drawImage(layers.rear, 0, 0)
  layers.rear = combined
  for (const [layer, cv] of Object.entries(layers)) writeFileSync(`${out}/${kind}-${layer}.png`, cv.toBuffer('image/png'))
  const files = ['portrait', 'head', 'front', 'rear']
  summary[kind] = {
    revision: spec.revision, skin: hero.skin,
    cell: { width: W, height: H }, pivot,
    bounds: { x: -pivot[0] / S, y: -pivot[1] / S, width: W / S, height: H / S },
    signatures: Object.fromEntries(files.map(f => [f, signature(PNG.sync.read(readFileSync(`${out}/${kind}-${f}.png`)))])),
    sha256: Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(`${out}/${kind}-${f}.png`)).digest('hex')])),
    bytes: files.reduce((s, f) => s + readFileSync(`${out}/${kind}-${f}.png`).length, 0),
  }
}
writeFileSync(`${out}/prepared.json`, `${JSON.stringify(summary, null, 2)}\n`)
console.log(Object.fromEntries(Object.entries(summary).map(([id, m]) => [id, { bytes: m.bytes, cell: m.cell, revision: m.revision }])))
