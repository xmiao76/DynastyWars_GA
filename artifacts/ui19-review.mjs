/**
 * ART-19 capture review: objective pixel checks on the nine stage captures.
 * Run: node artifacts/ui19-review.mjs  (after backdrop-look.spec has run)
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'

const STAGE_ORDER = [
  'stage1',
  'stage2',
  'stage3',
  'stage4',
  'stage5',
  'stage6',
  'stage7',
  'stage8',
  'stage9',
]

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

/** Coarse signature of the landmark band: 16x6 grid of quantized colors. */
function bandSignature(f) {
  const s = f.w / 480
  const cells = []
  for (let gy = 0; gy < 6; gy += 1) {
    for (let gx = 0; gx < 16; gx += 1) {
      const x = Math.round((100 + gx * 17) * s)
      const y = Math.round((102 + gy * 10) * s)
      const [r, g, b] = px(f, x, y)
      cells.push(`${Math.round(r / 48)}${Math.round(g / 48)}${Math.round(b / 48)}`)
    }
  }
  return cells.join('')
}

const results = []
const check = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`)

const sigs = new Map()
for (const id of STAGE_ORDER) {
  const f = await frame(`artifacts/look/ui19-${id}.png`)
  const sig = bandSignature(f)
  sigs.set(id, sig)

  // The landmark band must add silhouette pixels (dark ink edges) that the
  // old backdrops did not have between the hills and the ground.
  const ink = scan(f, 100, 100, 280, 60, (r, g, b) => r < 60 && g < 60 && b < 60)
  check(`${id} landmark band ink`, ink > 40, `${ink}px`)

  if (id === 'stage7' || id === 'stage8') {
    const embers = scan(f, 0, 100, 480, 60, (r, g, b) => r > 190 && g > 100 && b < 90)
    check(`${id} embers rising`, embers > 15, `${embers}px`)
  } else {
    const embers = scan(f, 0, 100, 480, 60, (r, g, b) => r > 200 && g > 130 && b < 80)
    check(`${id} no ember wash`, embers < 60, `${embers}px`)
  }
  if (id === 'stage7') {
    const redSun = scan(f, 0, 100, 480, 40, (r, g, b) => r > 150 && r > g + 60 && b < 110)
    check('stage7 ember sky', redSun > 300, `${redSun}px`)
  }
}

const unique = new Set(sigs.values()).size
check('nine visually distinct bands', unique === 9, `${unique}/9 unique`)
check('gorge differs from arena', sigs.get('stage1') !== sigs.get('stage9'), '')

console.log(results.join('\n'))
const fails = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - fails}/${results.length} checks passed`)
if (fails > 0) process.exit(1)
