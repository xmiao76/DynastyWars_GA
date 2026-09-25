import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { PNG } from 'pngjs'

/**
 * BODY-12 preparation: mook heads through the ART-18 cell pipeline (clone of the BODY-6 boss script).
 *
 * Differences from prepare-hero-faces.mjs (which must stay byte-stable):
 *  - Masters are opaque JPEGs: border-flood keying (tol 4 - validated to
 *    keep near-black beards/gauze whole while clearing true-black bg)
 *    before the alpha-based silhouette split.
 *  - Silhouette split keeps the 3 LARGEST groups (fragments auto-dropped);
 *    heroes keep the strict exactly-3 rule.
 *  - Landmarks are per-boss fractions of each group bbox (calibrated from
 *    the heroes' authored data, stable within a boss across frames), with
 *    per-boss overrides where hair/plume mass shifts the fractions.
 *  - Portraits normalize by ink-bbox crop before contain-fit (some came
 *    back as wide strips with centered busts).
 */

export const CELL = { width: 160, height: 224, pixelsPerUnit: 3, pivot: [100, 80] }
export const PORTRAIT = { width: 432, height: 480 }
export const REVISION = 'body12-1'
export const KEY_TOL = 4
const S = CELL.pixelsPerUnit
const W = CELL.width
const H = CELL.height
const pivot = CELL.pivot

/** Landmark fractions within each heads group (x of width; y of height).
 * eye lands at the cell pivot; eye->chin maps to 12 logical units. */
export const DEFAULT_FRACS = {
  eyeX: 0.72, eyeY: 0.35, chinY: 0.63,
  // Beard front split (bearded bosses only): beard falls over the chest.
  frontY: 0.56, frontX: 0.45,
}

export const MOOKS = {
  soldier: { heads: 'soldier-heads-master.jpg', portrait: 'soldier-portrait-master.jpg', skin: '#875640', beard: false },
  spearman: { heads: 'spearman-heads-master.jpg', portrait: 'spearman-portrait-master.jpg', skin: '#936149', beard: false },
  archer: { heads: 'archer-heads-master.jpg', portrait: 'archer-portrait-master.jpg', skin: '#8f604a', beard: false },
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

/** Silhouettes: alpha >= 16 connected groups > 1000px, sorted by x. */
function components(im) {
  const seen = new Uint8Array(im.width * im.height)
  const groups = []
  for (let k = 0; k < seen.length; k++) {
    if (seen[k] || im.data[k * 4 + 3] < 16) continue
    const q = [k]; seen[k] = 1
    let n = 0
    let x0 = im.width, x1 = 0, y0 = im.height, y1 = 0
    for (let h = 0; h < q.length; h++) {
      const t = q[h], x = t % im.width, y = Math.floor(t / im.width)
      n += 1
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      for (const j of [x > 0 ? t - 1 : -1, x + 1 < im.width ? t + 1 : -1,
        y > 0 ? t - im.width : -1, y + 1 < im.height ? t + im.width : -1]) {
        if (j >= 0 && !seen[j] && im.data[j * 4 + 3] >= 16) { seen[j] = 1; q.push(j) }
      }
    }
    if (n > 1000) groups.push({ pixels: q, x0, x1, y0, y1 })
  }
  return groups.sort((a, b) => a.x0 - b.x0)
}

/** Keep the three largest groups (fragments are dropped), x-sorted. */
function threeHeads(groups) {
  const big = [...groups].sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0)).slice(0, 3)
  if (big.length !== 3) throw new Error(`expected 3 heads, got ${big.length}`)
  return big.sort((a, b) => a.x0 - b.x0)
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

export async function prepareMook(id, boss, root, out) {
  // --- Heads master: key, split, compose cells ---
  const img = await loadImage(`${root}/${boss.heads}`)
  const keyed = createCanvas(img.width, img.height)
  const kctx = keyed.getContext('2d')
  kctx.drawImage(img, 0, 0)
  floodKey(kctx, img.width, img.height, KEY_TOL)
  const kim = kctx.getImageData(0, 0, img.width, img.height)
  const groups = threeHeads(components(kim))
  const fracs = { ...DEFAULT_FRACS, ...boss.fracs }
  const layers = { head: createCanvas(W * 3, H), front: createCanvas(W * 3, H), rear: createCanvas(W * 3, H) }
  for (const [i, group] of groups.entries()) {
    const gw = group.x1 - group.x0 + 1
    const gh = group.y1 - group.y0 + 1
    const eye = [group.x0 + fracs.eyeX * gw, group.y0 + fracs.eyeY * gh]
    const chinY = group.y0 + fracs.chinY * gh
    const frontY = group.y0 + fracs.frontY * gh
    const frontX = group.x0 + fracs.frontX * gw
    const scale = (12 * S) / (chinY - eye[1])
    if (!Number.isFinite(scale) || scale <= 0) throw new Error(`${id}: invalid landmarks`)
    const dx = pivot[0] + (group.x0 - eye[0]) * scale
    const dy = pivot[1] + (group.y0 - eye[1]) * scale
    if (dx < 1 || dy < 1 || dx + gw * scale >= W - 1 || dy + gh * scale >= H - 1) {
      throw new Error(`${id}:${i}: head would clip (${dx.toFixed(1)},${dy.toFixed(1)},${(gw * scale).toFixed(1)},${(gh * scale).toFixed(1)})`)
    }
    for (const [layer, canvas] of Object.entries(layers)) {
      const isolated = new PNG({ width: gw, height: gh })
      for (const k of group.pixels) {
        const x = k % img.width, y = Math.floor(k / img.width)
        const front = boss.beard && y >= frontY && x >= frontX
        const rear = !front && y > chinY && x < eye[0] - 0.6 * (chinY - eye[1])
        if (layer !== (front ? 'front' : rear ? 'rear' : 'head')) continue
        const j = ((y - group.y0) * gw + x - group.x0) * 4
        isolated.data.set(kim.data.subarray(k * 4, k * 4 + 4), j)
      }
      const image = await loadImage(PNG.sync.write(isolated))
      canvas.getContext('2d').drawImage(image, i * W + dx, dy, gw * scale, gh * scale)
    }
  }
  // Restrained dark rim (same recipe as heroes), computed on the complete head.
  const combined = createCanvas(W * 3, H), cc = combined.getContext('2d')
  for (const cv of Object.values(layers)) cc.drawImage(cv, 0, 0)
  const rgba = cc.getImageData(0, 0, W * 3, H), rim = cc.createImageData(W * 3, H)
  const radius = Math.ceil(S * 0.7)
  for (let y = radius; y < H - radius; y += 1) {
    for (let x = radius; x < W * 3 - radius; x += 1) {
      const k = (y * W * 3 + x) * 4
      if (rgba.data[k + 3] > 230) continue
      let alpha = 0
      for (let dy2 = -radius; dy2 <= radius; dy2 += 1) {
        for (let dx2 = -radius; dx2 <= radius; dx2 += 1) {
          if (dx2 * dx2 + dy2 * dy2 <= radius * radius) alpha = Math.max(alpha, rgba.data[((y + dy2) * W * 3 + x + dx2) * 4 + 3])
        }
      }
      rim.data[k] = 34; rim.data[k + 1] = 28; rim.data[k + 2] = 26
      rim.data[k + 3] = alpha
    }
  }
  cc.clearRect(0, 0, W * 3, H); cc.putImageData(rim, 0, 0)
  cc.drawImage(layers.rear, 0, 0)
  layers.rear = combined

  // --- Portrait: ink-bbox normalize, then contain-fit 432x480 ---
  const pimg = await loadImage(`${root}/${boss.portrait}`)
  const pc = createCanvas(pimg.width, pimg.height)
  const px = pc.getContext('2d')
  px.drawImage(pimg, 0, 0)
  const bb = inkBBox(px, pimg.width, pimg.height)
  const portrait = createCanvas(PORTRAIT.width, PORTRAIT.height)
  const pctx = portrait.getContext('2d')
  const ps = Math.min((PORTRAIT.width - 12) / bb.w, (PORTRAIT.height - 12) / bb.h)
  pctx.drawImage(pimg, bb.x, bb.y, bb.w, bb.h,
    (PORTRAIT.width - bb.w * ps) / 2, 6, bb.w * ps, bb.h * ps)

  // --- Write shipping assets + summary ---
  const files = { portrait, ...layers }
  const summary = {
    revision: REVISION, skin: boss.skin,
    cell: { width: W, height: H }, pivot,
    bounds: { x: -pivot[0] / S, y: -pivot[1] / S, width: W / S, height: H / S },
    signatures: {}, sha256: {}, bytes: 0,
  }
  for (const [name, cv] of Object.entries(files)) {
    const png = cv.toBuffer('image/png')
    writeFileSync(`${out}/${id}-${name}.png`, png)
    summary.signatures[name] = signature(PNG.sync.read(readFileSync(`${out}/${id}-${name}.png`)))
    summary.sha256[name] = createHash('sha256').update(readFileSync(`${out}/${id}-${name}.png`)).digest('hex')
    summary.bytes += png.length
  }
  return summary
}

export async function main() {
  const root = 'art/mook-faces'
  const out = 'src/game/assets/mook-faces'
  mkdirSync(out, { recursive: true })
  const summary = {}
  for (const [id, boss] of Object.entries(MOOKS)) {
    summary[id] = await prepareMook(id, boss, root, out)
    console.log(`${id}: ${summary[id].bytes} bytes`)
  }
  writeFileSync(`${out}/prepared.json`, `${JSON.stringify(summary, null, 2)}\n`)
  console.log('prepared.json written')
}

if (process.argv[1]?.endsWith('prepare-mook-faces.mjs')) await main()
