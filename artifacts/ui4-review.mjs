/**
 * UI-4 capture review: objective pixel checks on the look captures.
 * Run: node artifacts/ui4-review.mjs
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync } from 'node:fs'

const W = 960 // desktop captures are 960x540 logical 480x270 => scale 2

async function frame(path) {
  const img = await loadImage(path)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return { data: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height, path }
}

const px = (f, x, y) => {
  const p = (Math.round(y) * f.w + Math.round(x)) * 4
  return [f.data[p], f.data[p + 1], f.data[p + 2]]
}

/** count pixels in a logical rect where pred(rgb) holds; returns [count, total].
 * ox/oy: device-pixel offset of the game canvas inside the page capture. */
function scan(f, x, y, w, h, pred, ox = 0, oy = 0) {
  const s = f.w / 480
  let n = 0
  let tot = 0
  for (let yy = Math.round(oy + y * s); yy < Math.round(oy + (y + h) * s); yy += 1) {
    for (let xx = Math.round(ox + x * s); xx < Math.round(ox + (x + w) * s); xx += 1) {
      const [r, g, b] = px(f, xx, yy)
      tot += 1
      if (pred(r, g, b)) n += 1
    }
  }
  return [n, tot]
}

const isGold = (r, g, b) => r > 140 && g > 100 && b < 110 && r > b + 60
const isGreen = (r, g, b) => g > 110 && g > r + 30 && g > b + 30
const isRed = (r, g, b) => r > 120 && r > g + 50 && r > b + 50
const isBronze = (r, g, b) => r > 60 && r < 200 && g > 40 && g < 150 && b < 100 && r > b + 25 && r < g + 90
const notBg = (r, g, b) => r + g + b > 45 || Math.abs(r - g) + Math.abs(g - b) > 30

const results = []
const check = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`)

// --- combat: band, gold rails, green HP, pearl, pips, chip, center stack ---
{
  const f = await frame('artifacts/look/ui4-combat.png')
  const [, bandTot] = scan(f, 2, 2, 186, 36, () => true)
  const [plate] = scan(f, 2, 2, 186, 36, (r, g, b) => r + g + b < 700 || isGold(r, g, b))
  check('combat plate area painted', plate / bandTot > 0.9, `${Math.round((plate / bandTot) * 100)}%`)
  const [gold] = scan(f, 2, 2, 186, 4, isGold)
  check('combat gold rail on plate', gold > 40, `${gold}px`)
  const [green] = scan(f, 41, 17, 127, 8, isGreen)
  check('combat HP bar green fill', green > 300, `${green}px`)
  const [pearl] = scan(f, 175, 14, 10, 12, isGold)
  check('combat pearl lit', pearl > 15, `${pearl}px`)
  const [chip] = scan(f, 212, 23, 56, 14, (r, g, b) => isGold(r, g, b) || r + g + b < 380)
  check('combat chip visible', chip > 400, `${chip}px`)
  const [medal] = scan(f, 3, 3, 34, 34, isBronze)
  check('combat medallion bronze ring', medal > 60, `${medal}px`)
}

// --- boss: rail + WARNING banner + crimson accents ---
{
  const f = await frame('artifacts/look/ui4-boss.png')
  const [rail] = scan(f, 0, 40, 480, 18, (r, g, b) => isRed(r, g, b) || isGold(r, g, b) || r + g + b < 420)
  check('boss rail present', rail / (480 * 18 * 4) > 0.6, `${Math.round((rail / (480 * 18 * 4)) * 100)}%`)
  const [gold] = scan(f, 0, 40, 480, 2, isGold)
  check('boss rail gold rails', gold > 200, `${gold}px`)
  const [bannerRed] = scan(f, 80, 34, 320, 44, isRed)
  check('WARNING banner crimson', bannerRed > 60, `${bannerRed}px`)
  const [bannerGold] = scan(f, 80, 34, 320, 44, isGold)
  check('WARNING banner gold title', bannerGold > 150, `${bannerGold}px`)
}

// --- coop: two plates, two green bars, mirrored medal right ---
{
  const f = await frame('artifacts/look/ui4-coop.png')
  const [g1] = scan(f, 41, 17, 127, 8, isGreen)
  const [g2] = scan(f, 312, 17, 127, 8, isGreen)
  check('coop two HP bars', g1 > 300 && g2 > 300, `${g1}/${g2}px`)
  const [m2] = scan(f, 443, 3, 34, 34, isBronze)
  check('coop P2 medallion right', m2 > 40, `${m2}px`)
}

// --- go: chevrons gold at right-middle ---
{
  const f = await frame('artifacts/look/ui4-go.png')
  const [go] = scan(f, 386, 114, 80, 14, isGold)
  check('GO cue chevrons', go > 80, `${go}px`)
}

// --- touch portrait/landscape: bronze sheet at pad + buttons ---
/** Locate the game canvas: the HP bar's green band is ~8 logical px tall, so
 * it cannot be stepped over the way the 1.5px gold rail can. */
function findCanvasOffset(f) {
  const s = f.w / 480
  for (let y = 0; y < f.h - 10; y += 1) {
    let green = 0
    for (let x = 0; x < f.w; x += 1) {
      const [r, g, b] = px(f, x, y)
      if (isGreen(r, g, b)) green += 1
    }
    // The bar spans ~120 logical px; require half of that in device px.
    if (green > 60 * s) return { scale: s, oy: y - 19 * s }
  }
  return { scale: s, oy: 0 }
}
/** The touch sheet draws at 0.55 alpha, so its gold blends toward the dark
 * face underneath - looser than the full-alpha isGold above. */
const isSheetGold = (r, g, b) => r > 100 && g > 78 && b < 100 && r > b + 35 && g > b + 15
{
  const f = await frame('artifacts/look/ui4-touch-portrait.png')
  const { oy } = findCanvasOffset(f)
  const [pad] = scan(f, 24, 202, 44, 44, isBronze, 0, oy)
  const [goldChev] = scan(f, 24, 202, 44, 44, isSheetGold, 0, oy)
  check('portrait dpad bronze', pad > 40, `${pad}px`)
  check('portrait dpad gold chevrons', goldChev > 8, `${goldChev}px`)
  const [btn] = scan(f, 405, 202, 60, 52, isBronze, 0, oy)
  check('portrait buttons bronze', btn > 40, `${btn}px`)
}
{
  const f = await frame('artifacts/look/ui4-touch-landscape.png')
  const { oy } = findCanvasOffset(f)
  const [pad] = scan(f, 24, 202, 44, 44, isBronze, 0, oy)
  const [goldChev] = scan(f, 24, 202, 44, 44, isSheetGold, 0, oy)
  check('landscape dpad bronze', pad > 40, `${pad}px`)
  check('landscape dpad gold chevrons', goldChev > 8, `${goldChev}px`)
  const [btn] = scan(f, 405, 202, 60, 52, isBronze, 0, oy)
  check('landscape buttons bronze', btn > 40, `${btn}px`)
}
{
  const f = await frame('artifacts/look/ui4-touch-boss.png')
  const { scale, oy } = findCanvasOffset(f)
  const [rail] = scan(f, 0, 40, 480, 18, isRed, 0, oy)
  check('phone boss rail crimson', rail > 100, `${rail}px`)
}

console.log(results.join('\n'))
const fails = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - fails}/${results.length} checks passed`)
if (fails > 0) process.exit(1)
