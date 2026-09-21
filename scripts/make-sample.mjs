/**
 * Generate the pipeline sample: programmatic zhaoyun figure PNGs on a magenta
 * backdrop, standing in for AI-generated art while the image API quota is
 * unavailable. The bake pipeline keys, trims, and composes them exactly like
 * real art. Replace by dropping real generations into art/raw/ and re-running
 * scripts/bake-art.mjs.
 *
 *   node scripts/make-sample.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'

const W = 64
const H = 64
const MAGENTA = [255, 0, 255]
const BLUE = [47, 95, 179]
const SILVER = [192, 192, 192]
const SKIN = [240, 200, 160]
const DARK = [26, 26, 26]

function newCanvas() {
  const data = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i += 1) {
    data[i * 4] = MAGENTA[0]
    data[i * 4 + 1] = MAGENTA[1]
    data[i * 4 + 2] = MAGENTA[2]
    data[i * 4 + 3] = 255
  }
  return data
}

function rect(data, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
      const i = (yy * W + xx) * 4
      data[i] = color[0]
      data[i + 1] = color[1]
      data[i + 2] = color[2]
      data[i + 3] = 255
    }
  }
}

/** A simple figure: head, armored torso, legs, spear. Pose variations. */
function drawFigure(pose) {
  const data = newCanvas()
  if (pose === 'down') {
    // Lying horizontally, head left.
    rect(data, 6, 44, 10, 10, SKIN) // head
    rect(data, 16, 46, 30, 7, BLUE) // body
    rect(data, 46, 47, 12, 5, DARK) // legs
    rect(data, 8, 40, 50, 2, SILVER) // spear on top
    return data
  }
  const tucked = pose === 'jump'
  const legSpread = pose === 'walk0' ? 5 : pose === 'walk1' ? 1 : 3
  const legTop = tucked ? 44 : 46
  const legH = tucked ? 8 : 16
  // Head + helmet.
  rect(data, 26, 6, 12, 10, SKIN)
  rect(data, 25, 4, 14, 5, SILVER)
  // Torso (blue armor with silver trim).
  rect(data, 22, 18, 20, 26, BLUE)
  rect(data, 38, 18, 4, 26, SILVER)
  // Legs.
  rect(data, 22 - (pose === 'walk0' ? 4 : 0), legTop, 8, legH, DARK)
  rect(data, 34 + (pose === 'walk0' ? 4 : 0), legTop, 8, legH, DARK)
  void legSpread
  // Spear: upright at idle/walk/jump, extended forward on attack.
  if (pose === 'attack') {
    rect(data, 42, 26, 20, 3, SILVER)
    rect(data, 36, 24, 8, 7, SKIN) // arm
  } else {
    rect(data, 40, 8, 3, 46, SILVER)
  }
  return data
}

const POSES = ['idle', 'walk0', 'walk1', 'attack', 'jump', 'down']
mkdirSync('art/raw', { recursive: true })
for (const pose of POSES) {
  const png = new PNG({ width: W, height: H })
  png.data = Buffer.from(drawFigure(pose))
  writeFileSync(join('art/raw', `zhaoyun-${pose}.png`), PNG.sync.write(png))
  console.log(`wrote art/raw/zhaoyun-${pose}.png`)
}
