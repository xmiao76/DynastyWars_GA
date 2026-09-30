// Guan Yu-only motion experiment. Fixed scale per sheet, recorded registration.
// No costume/limb warping or old-rig rendered in-betweens.
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const ROOT = 'art/motion/guanyu'
const OUT = 'artifacts/wholeframe/motion'
export const BOX = { width: 224, height: 144, groundY: 136 }
export const DENSITY = 2
export const CLIPS = ['walk', 'jab1', 'jab2', 'finisher']

/** Alpha support components: transparent halo is not anatomy. */
export function components(im, threshold = 96) {
  const { width: w, height: h, data } = im
  const seen = new Uint8Array(w * h)
  const out = []
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < threshold) continue
    seen[p] = 1
    const stack = [p]
    const c = { area: 0, x0: w, y0: h, x1: 0, y1: 0, pixels: [] }
    while (stack.length) {
      const q = stack.pop(), x = q % w, y = Math.floor(q / w)
      c.area++; c.pixels.push(q)
      c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x)
      c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y)
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        const r = ny * w + nx
        if (!seen[r] && data[r * 4 + 3] >= threshold) { seen[r] = 1; stack.push(r) }
      }
    }
    if (c.area >= 500) out.push(c)
  }
  return out
}

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

export async function audit() {
  mkdirSync(OUT, { recursive: true })
  const reports = {}
  for (const clip of CLIPS) {
    const img = await loadImage(`${ROOT}/${clip}-candidate-1.png`)
    const cv = createCanvas(img.width, img.height), ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const im = ctx.getImageData(0, 0, img.width, img.height)
    const cs = components(im).sort((a, b) => a.y0 - b.y0)
    const figures = []
    for (let row = 0; row < 3; row++) {
      figures.push(...cs.slice(row * 3, row * 3 + 3).sort((a, b) => a.x0 - b.x0))
    }
    if (figures.length !== 9) throw new Error(`${clip}: expected 9 distinct figures, found ${figures.length}`)
    reports[clip] = figures.map((c, i) => ({ index: i, area: c.area, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, cellEdgeCrossing: c.y0 < Math.floor(i / 3) * 341 || c.y1 >= (Math.floor(i / 3) + 1) * 341 }))
    writeFileSync(`${OUT}/${clip}-components.json`, `${JSON.stringify(reports[clip], null, 2)}\n`)
  }
  writeFileSync(`${OUT}/source-audit.json`, `${JSON.stringify(reports, null, 2)}\n`)
  return reports
}

// Preparation is deliberately separate from source audit: no bad candidate is
// promoted simply because it can be cut into a sheet. See motion docs.
export async function prepare() {
  const config = JSON.parse(readFileSync(`${ROOT}/registration.json`, 'utf8'))
  mkdirSync('src/game/assets/motion', { recursive: true })
  mkdirSync(OUT, { recursive: true })
  const w = BOX.width * DENSITY, h = BOX.height * DENSITY
  const atlas = createCanvas(w * 3, h * 12), g = atlas.getContext('2d')
  const frames = {}, audit = {}, sources = {}
  for (const [ci, clip] of CLIPS.entries()) {
    const setting = config[clip]
    const buf = readFileSync(`${ROOT}/${setting.source}`)
    sources[clip] = { source: setting.source, sha256: createHash('sha256').update(buf).digest('hex') }
    const img = await loadImage(buf), cv = createCanvas(img.width, img.height), ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const im = ctx.getImageData(0, 0, img.width, img.height)
    const ordered = components(im).sort((a, b) => a.y0 - b.y0)
    const figures = []
    for (let row = 0; row < 3; row++) figures.push(...ordered.slice(row * 3, row * 3 + 3).sort((a, b) => a.x0 - b.x0))
    if (figures.length !== 9) throw new Error(`${clip}: missing or merged figure`)
    audit[clip] = []
    for (let i = 0; i < 9; i++) {
      const c = figures[i], pad = 3
      const x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad)
      const cw = Math.min(img.width, c.x1 + pad + 1) - x0, ch = Math.min(img.height, c.y1 + pad + 1) - y0
      const cut = createCanvas(cw, ch), cg = cut.getContext('2d')
      // Preserve antialias around the foreground component, but NOT the model's
      // low-alpha glow outside it. All retained pixels must lie <=2 px away.
      const support = new Uint8Array(img.width * img.height)
      for (const q of c.pixels) {
        const x = q % img.width, y = Math.floor(q / img.width)
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx >= x0 && xx < x0 + cw && yy >= y0 && yy < y0 + ch) support[yy * img.width + xx] = 1
        }
      }
      const cutData = cg.createImageData(cw, ch)
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const p = (y + y0) * img.width + x + x0, k = (y * cw + x) * 4
        if (!support[p]) continue
        cutData.data.set(im.data.subarray(p * 4, p * 4 + 4), k)
      }
      cg.putImageData(cutData, 0, 0)
      const r = setting.frames[i]
      const scale = setting.scale
      const cellX = i % 3 * w, cellY = (ci * 3 + Math.floor(i / 3)) * h
      const destX = (x0 - r.pivotX) * scale + BOX.width / 2
      const destY = (y0 - r.floorY) * scale + BOX.groundY
      g.drawImage(cut, cellX + destX * DENSITY, cellY + destY * DENSITY, cw * scale * DENSITY, ch * scale * DENSITY)
      const id = `${clip}:${i}`
      frames[id] = { x: cellX, y: cellY, w, h }
      audit[clip].push({ index: i, sourceBounds: [c.x0, c.y0, c.x1, c.y1], scale, pivotX: r.pivotX, floorY: r.floorY,
        footErrU: (c.y1 - r.floorY) * scale,
        clipped: destX < 0 || destY < 0 || destX + cw * scale > BOX.width || destY + ch * scale > BOX.height,
        headWidthU: r.headWidth === null ? null : r.headWidth * scale, weaponLengthU: r.weaponLength === null ? null : r.weaponLength * scale,
        weaponEndpoints: r.weaponEndpoints ?? null, landmarkNote: r.landmarkNote ?? null })
    }
  }
  const buf = atlas.toBuffer('image/png')
  writeFileSync('src/game/assets/motion/guanyu-motion-sheet.png', buf)
  const record = { guanyu: { revision: 'motion-1', density: DENSITY, box: BOX, sheet: { width: atlas.width, height: atlas.height }, frames,
    signatures: { sheet: signature(g.getImageData(0, 0, atlas.width, atlas.height)) }, sha256: { sheet: createHash('sha256').update(buf).digest('hex') }, sources, audit } }
  writeFileSync('src/game/assets/motion/prepared.json', `${JSON.stringify(record, null, 2)}\n`)
  writeFileSync(`${OUT}/prepared-audit.json`, `${JSON.stringify(audit, null, 2)}\n`)
  return record
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prepare-motion.mjs')) {
  const result = process.argv.includes('--audit') ? await audit() : await prepare()
  console.log(JSON.stringify(process.argv.includes('--audit') ? result : { revision: result.guanyu.revision, sheet: result.guanyu.sheet }, null, 2))
}
