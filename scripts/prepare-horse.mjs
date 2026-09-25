import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

/**
 * BODY-5 preparation: split the 3-panel horse master into painted frames.
 *
 * Auto-normalization was tried and REJECTED: centering the ink bbox shifts
 * asymmetric figures (a horse's head extends far right of its barrel), which
 * broke rider seating in the dry run (round-trip IoU 0.452). Instead each
 * frame carries explicit eyeballed geometry - source crop in master px plus
 * dest rect in the 112x76 logical cell - verified by the parity, saddle and
 * eyeball reviews. Deterministic: same master + same numbers = same bytes.
 */
export const DENSITY = 4
/** Flood-key tolerance. 10 suits true-black AI masters; the HORSE_KEY_TOL
 * override exists for dry runs (procedural synthetics carry cel bands). */
export const KEY_TOLERANCE = 10
export const BOX_W = 112
export const BOX_H = 76

/**
 * Per-frame geometry. crop: master-px source rect; dest: device-px rect in
 * the 448x304 cell. Uniform scale 0.93 for all frames: hooves anchor at
 * logical y76, saddle centers register at logical x50/y27.4 (inside the
 * procedural x38-62/y21-31 saddle zone), ears reach y-4.4 (inside the -8
 * headroom). Rider seating and ground contact hold by construction.
 */
export const FRAMES = {
  idle: { crop: [20, 150, 395, 380], dest: [15.9, -31.7, 367.4, 353.4] },
  walk0: { crop: [455, 150, 380, 380], dest: [27.9, -31.7, 353.4, 353.4] },
  walk1: { crop: [875, 150, 380, 380], dest: [37.2, -31.7, 353.4, 353.4] },
}

/** Mirror of the pure TS signature algorithm (see prepare-hero-faces.mjs). */
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

function floodKey(ctx, w, h, tol) {
  const im = ctx.getImageData(0, 0, w, h)
  const d = im.data
  const lum = (x, y) => {
    const p = (y * w + x) * 4
    return (d[p] + d[p + 1] + d[p + 2]) / 3
  }
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x += 1) stack.push([x, 0], [x, h - 1])
  for (let y = 0; y < h; y += 1) stack.push([0, y], [w - 1, y])
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const i = y * w + x
    if (seen[i]) continue
    if (lum(x, y) > tol) continue
    seen[i] = 1
    d[i * 4 + 3] = 0
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  ctx.putImageData(im, 0, 0)
}

export async function main() {
  // Overrides exist for dry-running the pipeline on synthetic input; the
  // production master + pack paths are the defaults.
  const masterPath = process.env.HORSE_MASTER ?? 'art/fighter-bodies/horse-master.jpg'
  const outDir = process.env.HORSE_OUT ?? 'src/game/assets/horse'
  const tol = Number(process.env.HORSE_KEY_TOL ?? KEY_TOLERANCE)
  const configured = Object.entries(FRAMES).filter(([, v]) => v !== null)
  if (configured.length === 0 && !process.env.HORSE_SYNTH) {
    throw new Error('no frame geometry configured (art pending) - set HORSE_SYNTH=1 for the dry run')
  }
  const img = await loadImage(masterPath)
  const cw = BOX_W * DENSITY
  const ch = BOX_H * DENSITY
  const sheet = createCanvas(cw * 3, ch)
  const sctx2 = sheet.getContext('2d')
  const frames = {}
  const names = ['idle', 'walk0', 'walk1']
  // Synthetic dry run: exact panel thirds map 1:1 onto cells.
  const pw = img.width / 3
  const table = process.env.HORSE_SYNTH
    ? Object.fromEntries(names.map((name, i) => [name, { crop: [i * pw, 0, pw, img.height], dest: [0, 0, cw, ch] }]))
    : Object.fromEntries(configured)
  names.forEach((name, i) => {
    const spec = table[name]
    if (!spec) throw new Error(`no geometry for ${name}`)
    const [sx, sy, sw, sh] = spec.crop
    const [dx, dy, dw, dh] = spec.dest
    const cell = createCanvas(cw, ch)
    const c = cell.getContext('2d')
    c.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    floodKey(c, cw, ch, tol)
    sctx2.drawImage(cell, i * cw, 0)
    frames[name] = { x: i * cw, y: 0, w: cw, h: ch }
  })
  const png = sheet.toBuffer('image/png')
  const im = sctx2.getImageData(0, 0, cw * 3, ch)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(`${outDir}/horse-sheet.png`, png)
  const prepared = {
    horse: {
      revision: 'body-1',
      density: DENSITY,
      sheet: { width: cw * 3, height: ch },
      frames,
      signatures: { sheet: signature(im) },
      sha256: { sheet: createHash('sha256').update(png).digest('hex') },
    },
  }
  writeFileSync(`${outDir}/prepared.json`, `${JSON.stringify(prepared, null, 2)}\n`)
  console.log(`horse-sheet.png ${png.length} bytes -> ${outDir}`)
}

if (process.argv[1]?.endsWith('prepare-horse.mjs')) await main()
