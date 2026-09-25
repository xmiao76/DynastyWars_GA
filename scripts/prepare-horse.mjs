import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

/**
 * BODY-5 preparation: split the 3-panel horse master into painted frames.
 *
 * The master holds idle/walk0/walk1 side by side facing right. Each panel is
 * bbox-cropped, bottom-anchored (hooves at y76) and center-anchored (body
 * center x50) into the 112x76 logical box, keyed, and packed into one sheet.
 * Per-frame nudge config exists for rider-seat alignment if the review shows
 * the saddle drifting from the procedural x38-62/y21-31 zone.
 */
export const DENSITY = 4
export const KEY_TOLERANCE = 10
export const BOX_W = 112
export const BOX_H = 76
export const FRAMES = ['idle', 'walk0', 'walk1']
export const NUDGE = { idle: [0, 0], walk0: [0, 0], walk1: [0, 0] }

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

function inkBBox(ctx, x0, y0, w, h, tol) {
  const im = ctx.getImageData(x0, y0, w, h)
  const d = im.data
  let ax0 = w
  let ay0 = h
  let ax1 = 0
  let ay1 = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = (y * w + x) * 4
      if ((d[p] + d[p + 1] + d[p + 2]) / 3 <= tol) continue
      if (x < ax0) ax0 = x
      if (y < ay0) ay0 = y
      if (x > ax1) ax1 = x
      if (y > ay1) ay1 = y
    }
  }
  return { x: x0 + ax0, y: y0 + ay0, w: ax1 - ax0 + 1, h: ay1 - ay0 + 1 }
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
  const img = await loadImage('art/fighter-bodies/horse-master.jpg')
  const src = createCanvas(img.width, img.height)
  const sctx = src.getContext('2d')
  sctx.drawImage(img, 0, 0)
  const cw = BOX_W * DENSITY
  const ch = BOX_H * DENSITY
  const sheet = createCanvas(cw * FRAMES.length, ch)
  const sctx2 = sheet.getContext('2d')
  const frames = {}
  const pw = img.width / FRAMES.length
  FRAMES.forEach((name, i) => {
    const bb = inkBBox(sctx, Math.round(i * pw), 0, Math.round(pw), img.height, KEY_TOLERANCE)
    const cell = createCanvas(cw, ch)
    const c = cell.getContext('2d')
    // Fit the horse bbox into the box: feet at y76, body center x50.
    const s = Math.min(cw / bb.w, ch / bb.h)
    const dw = bb.w * s
    const dh = bb.h * s
    const [nx, ny] = NUDGE[name]
    // Exact placement: bbox center-x onto logical x50, bbox bottom
    // onto logical y76, plus the configured nudge.
    const destX = 50 * DENSITY - (bb.w * s) / 2 + nx
    const destY = 76 * DENSITY - bb.h * s + ny
    c.drawImage(img, bb.x, bb.y, bb.w, bb.h, destX, destY, dw, dh)
    floodKey(c, cw, ch, KEY_TOLERANCE)
    sctx2.drawImage(cell, i * cw, 0)
    frames[name] = { x: i * cw, y: 0, w: cw, h: ch }
  })
  const png = sheet.toBuffer('image/png')
  const im = sctx2.getImageData(0, 0, cw * FRAMES.length, ch)
  mkdirSync('src/game/assets/horse', { recursive: true })
  writeFileSync('src/game/assets/horse/horse-sheet.png', png)
  const prepared = {
    horse: {
      revision: 'body-1',
      density: DENSITY,
      sheet: { width: cw * FRAMES.length, height: ch },
      frames,
      signatures: { sheet: signature(im) },
      sha256: { sheet: createHash('sha256').update(png).digest('hex') },
    },
  }
  writeFileSync('src/game/assets/horse/prepared.json', `${JSON.stringify(prepared, null, 2)}\n`)
  console.log(`horse-sheet.png ${png.length} bytes`)
}

if (process.argv[1]?.endsWith('prepare-horse.mjs')) await main()
