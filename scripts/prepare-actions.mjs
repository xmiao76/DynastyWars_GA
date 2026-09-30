// Guan Yu all-action extension. Original motion atlas remains byte-identical.
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { components } from './prepare-motion.mjs'
const ROOT = 'art/motion/guanyu'
const OUT = 'artifacts/wholeframe/actions'
export const ACTION_SHEETS = ['jump', 'fall', 'getup', 'misc', 'special', 'rider']
const W = 448, H = 288, D = 2
function ordered(im) {
  const found = components(im).sort((a, b) => b.area - a.area).slice(0, 9).sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1))
  const rows = []
  for (let row = 0; row < 3; row++) rows.push(...found.slice(row * 3, row * 3 + 3).sort((a, b) => a.x0 - b.x0))
  if (rows.length !== 9) throw new Error('Missing/merged action figure')
  return rows
}
function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
      const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
      for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
      sums[3] += im.data[k + 3]; n++
    }
    for (const s of sums) hex += Math.round(s / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}
export async function audit() {
  mkdirSync(OUT, { recursive: true })
  const record = {}
  for (const name of ACTION_SHEETS) {
    const img = await loadImage(`${ROOT}/${name}-candidate-1.png`)
    const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0)
    record[name] = ordered(g.getImageData(0, 0, cv.width, cv.height)).map(({ area, x0, y0, x1, y1 }, index) => ({ index, area, x0, y0, x1, y1 }))
  }
  writeFileSync(`${OUT}/source-bounds.json`, `${JSON.stringify(record, null, 2)}\n`)
  console.log(JSON.stringify(record, null, 2))
}
export async function prepare() {
  mkdirSync(OUT, { recursive: true })
  const config = JSON.parse(readFileSync(`${ROOT}/action-registration.json`, 'utf8'))
  const atlas = createCanvas(W * 6, H * 9), g = atlas.getContext('2d')
  const frames = {}, audit = {}, sources = {}
  for (const [row, name] of ACTION_SHEETS.entries()) {
    const setting = config[name], buf = readFileSync(`${ROOT}/${setting.source}`)
    sources[name] = { source: setting.source, sha256: createHash('sha256').update(buf).digest('hex') }
    const img = await loadImage(buf), src = createCanvas(img.width, img.height), sg = src.getContext('2d'); sg.drawImage(img, 0, 0)
    const im = sg.getImageData(0, 0, src.width, src.height), figures = ordered(im)
    audit[name] = []
    for (let index = 0; index < 9; index++) {
      const sourceIndex = setting.order?.[index] ?? index
      const override = setting.overrides?.[index]
      let pixels = im, imageWidth = img.width, imageHeight = img.height
      let c = figures[sourceIndex], r = setting.frames[sourceIndex], scale = setting.scale
      if (override) {
        const bytes = readFileSync(`${ROOT}/${override.source}`), replacement = await loadImage(bytes)
        const cv = createCanvas(replacement.width, replacement.height), ctx = cv.getContext('2d'); ctx.drawImage(replacement, 0, 0)
        pixels = ctx.getImageData(0, 0, cv.width, cv.height); imageWidth = cv.width; imageHeight = cv.height
        c = components(pixels).sort((a, b) => b.area - a.area)[0]
        if (!c) throw new Error(`${name}:${index} empty repair`)
        r = override; scale = override.scale
        sources[`${name}:${index}`] = { source: override.source, sha256: createHash('sha256').update(bytes).digest('hex') }
      }
      const pad = 3, x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad)
      const cw = Math.min(imageWidth, c.x1 + pad + 1) - x0, ch = Math.min(imageHeight, c.y1 + pad + 1) - y0
      const support = new Uint8Array(imageWidth * imageHeight)
      for (const q of c.pixels) {
        const x = q % imageWidth, y = Math.floor(q / imageWidth)
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx >= x0 && xx < x0 + cw && yy >= y0 && yy < y0 + ch) support[yy * imageWidth + xx] = 1
        }
      }
      const cut = createCanvas(cw, ch), cg = cut.getContext('2d'), data = cg.createImageData(cw, ch)
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const p = (y + y0) * imageWidth + x + x0
        if (support[p]) data.data.set(pixels.data.subarray(p * 4, p * 4 + 4), (y * cw + x) * 4)
      }
      cg.putImageData(data, 0, 0)
      const x = (row % 2 * 3 + index % 3) * W, y = (Math.floor(row / 2) * 3 + Math.floor(index / 3)) * H
      const dx = (x0 - r.pivotX) * scale + 112, dy = (y0 - r.floorY) * scale + 136
      if (dx < 0 || dy < 0 || dx + cw * scale > 224 || dy + ch * scale > 144) throw new Error(`${name}:${index} clips action box`)
      g.drawImage(cut, x + dx * D, y + dy * D, cw * scale * D, ch * scale * D)
      frames[`${name}:${index}`] = { x, y, w: W, h: H, sheet: 'actions' }
      audit[name].push({ index, sourceIndex, scale, pivotX: r.pivotX, floorY: r.floorY, bounds: [c.x0, c.y0, c.x1, c.y1], groundClearanceU: (r.floorY - c.y1) * scale })
    }
  }
  const buf = atlas.toBuffer('image/png')
  writeFileSync('src/game/assets/motion/guanyu-actions-sheet.png', buf)
  writeFileSync('src/game/assets/motion/actions-prepared.json', `${JSON.stringify({ revision: 'actions-1', sheet: { width: atlas.width, height: atlas.height }, frames, sources, audit,
    signatures: { sheet: signature(g.getImageData(0, 0, atlas.width, atlas.height)) }, sha256: { sheet: createHash('sha256').update(buf).digest('hex') } }, null, 2)}\n`)
  // Review panels in distinct strips, avoiding a giant downscaled contact sheet.
  for (const [row, name] of ACTION_SHEETS.entries()) {
    const cv = createCanvas(W * 3, H * 3), ctx = cv.getContext('2d'); ctx.fillStyle = '#3a3440'; ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.drawImage(atlas, row % 2 * W * 3, Math.floor(row / 2) * H * 3, W * 3, H * 3, 0, 0, W * 3, H * 3)
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#a0ffb4'; ctx.font = '14px sans-serif'; ctx.fillText(`${name}:${i}`, i % 3 * W + 4, Math.floor(i / 3) * H + 20) }
    writeFileSync(`${OUT}/${name}-contact.png`, cv.toBuffer('image/png'))
  }
  console.log(`Prepared ${Object.keys(frames).length} action cells, atlas ${atlas.width}x${atlas.height}, ${buf.length} bytes`)
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prepare-actions.mjs')) {
  if (process.argv.includes('--audit')) await audit()
  else await prepare()
}
