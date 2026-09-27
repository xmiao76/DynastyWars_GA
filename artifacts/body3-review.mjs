/**
 * BODY-3 capture review: objective pixel checks on the look captures.
 * Each hero's gameplay frame must carry his signature armor hue class in
 * the figure band, and the five captures must be pairwise distinct.
 * Run: node artifacts/body3-review.mjs
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'

async function frame(path) {
  const img = await loadImage(path)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return { data: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height }
}

const px = (f, x, y) => {
  const p = (Math.round(y) * f.w + Math.round(x)) * 4
  return [f.data[p], f.data[p + 1], f.data[p + 2]]
}

function scan(f, x, y, w, h, pred) {
  const s = f.w / 480
  let n = 0
  for (let yy = Math.round(y * s); yy < Math.round((y + h) * s); yy += 1) {
    for (let xx = Math.round(x * s); xx < Math.round((x + w) * s); xx += 1) {
      const [r, g, b] = px(f, xx, yy)
      if (pred(r, g, b)) n += 1
    }
  }
  return n
}

// Hue classes: broad enough for painted gradients, distinct from each other
// and from stage-1 backdrop (sky blues are pale; armor blue is deep).
const isGreen = (r, g, b) => g > 70 && g > r + 18 && g > b + 18
const isRedBrown = (r, g, b) => r > 90 && r > g + 30 && r > b + 30 && g < b + 40
const isBlue = (r, g, b) => b > 80 && b > r + 30 && b > g + 20
const isOchre = (r, g, b) => r > 120 && g > 80 && b < 90 && r > b + 60 && Math.abs(r - g) < 90
const isPurple = (r, g, b) => r > 60 && b > 70 && r > g + 15 && b > g + 15

const HEROES = [
  ['zhangfei', isRedBrown],
  ['guanyu', isGreen],
  ['huangzhong', isOchre],
  ['weiyan', isPurple],
  ['zhaoyun', isBlue],
]

const results = []
const check = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`)

for (const [hero, pred] of HEROES) {
  const f = await frame(`artifacts/look/body3-game-${hero}.png`)
  // Figure band: walk band, x centred on the player's usual start third.
  const n = scan(f, 60, 130, 360, 130, pred)
  check(`${hero} armor hue present`, n > 150, `${n}px`)
}

// Pairwise distinctness of the five gameplay captures (coarse signature).
const sigs = new Map()
for (const [hero] of HEROES) {
  const f = await frame(`artifacts/look/body3-game-${hero}.png`)
  const cells = []
  for (let gy = 0; gy < 6; gy += 1) {
    for (let gx = 0; gx < 10; gx += 1) {
      const [r, g, b] = px(f, ((gx + 0.5) * f.w) / 10, ((gy + 0.5) * f.h) / 6)
      cells.push(`${Math.round(r / 48)}${Math.round(g / 48)}${Math.round(b / 48)}`)
    }
  }
  sigs.set(hero, cells.join(''))
}
const uniq = new Set(sigs.values()).size
check('five hero frames pairwise distinct', uniq === 5, `${uniq}/5 unique`)

// Select capture: five card windows each hold figure ink (non-background).
{
  const f = await frame('artifacts/look/body3-select.png')
  let inked = 0
  for (let i = 0; i < 5; i += 1) {
    const x0 = 40 + i * 88
    const n = scan(f, x0, 60, 70, 120, (r, g, b) => r + g + b > 90 && Math.abs(r - g) + Math.abs(g - b) > 24)
    if (n > 400) inked += 1
  }
  check('select cards all populated', inked === 5, `${inked}/5`)
}

// Mounted + co-op + phone captures exist and are non-empty.
for (const name of ['body3-mounted', 'body3-coop', 'body3-phone-guanyu']) {
  const f = await frame(`artifacts/look/${name}.png`)
  let ink = 0
  for (let y = 0; y < f.h; y += 4) {
    for (let x = 0; x < f.w; x += 4) {
      const [r, g, b] = px(f, x, y)
      if (Math.abs(r - g) + Math.abs(g - b) > 30) ink += 1
    }
  }
  check(`${name} non-empty`, ink > 500, `${ink}px`)
}

console.log(results.join('\n'))
const fails = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - fails}/${results.length} checks passed`)
if (fails > 0) process.exit(1)
