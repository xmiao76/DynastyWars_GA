import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { PNG } from 'pngjs'

/**
 * Portrait-only mook preparation (legacy head/front/rear rig layers retired).
 * Clone of the boss portrait path: ink-bbox normalize, then contain-fit.
 * Emits <id>-portrait.png + slimmed prepared.json (revision + portrait
 * signature/sha256).
 */

export const PORTRAIT = { width: 432, height: 480 }
export const REVISION = 'body12-1'

export const MOOKS = {
  soldier: { portrait: 'soldier-portrait-master.jpg' },
  spearman: { portrait: 'spearman-portrait-master.jpg' },
  archer: { portrait: 'archer-portrait-master.jpg' },
}

/** Mirror of the pure TS signature algorithm (see prepare-hero-faces.mjs). */
function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor((by * im.height) / 32); y < Math.floor(((by + 1) * im.height) / 32); y++) {
      for (let x = Math.floor((bx * im.width) / 48); x < Math.floor(((bx + 1) * im.width) / 48); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]; n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}

function inkBBox(ctx, w, h) {
  const im = ctx.getImageData(0, 0, w, h)
  const d = im.data
  let x0 = w, y0 = h, x1 = 0, y1 = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = (y * w + x) * 4
      if ((d[p] + d[p + 1] + d[p + 2]) / 3 <= 16) continue
      if (x < x0) x0 = x; if (y < y0) y0 = y
      if (x > x1) x1 = x; if (y > y1) y1 = y
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

export async function prepareMook(id, mook, root, out) {
  // --- Portrait: ink-bbox normalize, then contain-fit 432x480 ---
  const pimg = await loadImage(`${root}/${mook.portrait}`)
  const pc = createCanvas(pimg.width, pimg.height)
  const px = pc.getContext('2d')
  px.drawImage(pimg, 0, 0)
  const bb = inkBBox(px, pimg.width, pimg.height)
  const portrait = createCanvas(PORTRAIT.width, PORTRAIT.height)
  const pctx = portrait.getContext('2d')
  const ps = Math.min((PORTRAIT.width - 12) / bb.w, (PORTRAIT.height - 12) / bb.h)
  pctx.drawImage(pimg, bb.x, bb.y, bb.w, bb.h,
    (PORTRAIT.width - bb.w * ps) / 2, 6, bb.w * ps, bb.h * ps)
  const png = portrait.toBuffer('image/png')
  writeFileSync(`${out}/${id}-portrait.png`, png)
  return {
    revision: REVISION,
    signatures: { portrait: signature(PNG.sync.read(readFileSync(`${out}/${id}-portrait.png`))) },
    sha256: { portrait: createHash('sha256').update(readFileSync(`${out}/${id}-portrait.png`)).digest('hex') },
  }
}

export async function main() {
  const root = 'art/mook-faces'
  const out = 'src/game/assets/mook-faces'
  mkdirSync(out, { recursive: true })
  const summary = {}
  for (const [id, mook] of Object.entries(MOOKS)) {
    summary[id] = await prepareMook(id, mook, root, out)
    console.log(`${id}: portrait prepared`)
  }
  writeFileSync(`${out}/prepared.json`, `${JSON.stringify(summary, null, 2)}\n`)
  console.log('prepared.json written')
}

if (process.argv[1]?.endsWith('prepare-mook-faces.mjs')) await main()
