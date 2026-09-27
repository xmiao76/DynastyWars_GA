/**
 * UI-5 capture review: objective pixel checks on the flow-card captures.
 * Run: node artifacts/ui5-review-cards.mjs  (after introcard.spec has run)
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
  let tot = 0
  for (let yy = Math.round(y * s); yy < Math.round((y + h) * s); yy += 1) {
    for (let xx = Math.round(x * s); xx < Math.round((x + w) * s); xx += 1) {
      const [r, g, b] = px(f, xx, yy)
      tot += 1
      if (pred(r, g, b)) n += 1
    }
  }
  return [n, tot]
}

const isParchment = (r, g, b) => r > 185 && g > 165 && b > 115 && b < 210 && r > b + 40
const isGold = (r, g, b) => r > 140 && g > 100 && b < 110 && r > b + 60
const isRed = (r, g, b) => r > 120 && r > g + 50 && r > b + 50
const isInk = (r, g, b) => r < 70 && g < 70 && b < 70

const results = []
const check = (name, ok, detail) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`)

// intro card: parchment body + gold rails + dark lore ink, centre screen
{
  const f = await frame('artifacts/look/ui5-intro.png')
  const [body] = scan(f, 150, 90, 180, 60, isParchment)
  check('intro parchment body', body > 2_000, `${body}px`)
  const [gold] = scan(f, 130, 70, 220, 8, isGold)
  check('intro gold rail', gold > 80, `${gold}px`)
  const [ink] = scan(f, 160, 100, 160, 40, isInk)
  check('intro lore ink text', ink > 60, `${ink}px`)
}

// victory: parchment scroll x 70..410, y 66..216 with chips
{
  const f = await frame('artifacts/look/ui5-victory.png')
  const [body] = scan(f, 100, 90, 280, 100, isParchment)
  check('victory parchment body', body > 4_000, `${body}px`)
  const [gold] = scan(f, 70, 66, 340, 8, isGold)
  check('victory gold rails', gold > 150, `${gold}px`)
  const [titleGold] = scan(f, 120, 72, 240, 26, isGold)
  check('victory STAGE CLEAR title', titleGold > 300, `${titleGold}px`)
}

// gameover: crimson-railed scroll with red title
{
  const f = await frame('artifacts/look/ui5-gameover.png')
  const [body] = scan(f, 110, 90, 260, 90, isParchment)
  check('defeat parchment body', body > 3_000, `${body}px`)
  const [red] = scan(f, 90, 62, 300, 10, isRed)
  check('defeat crimson rails', red > 120, `${red}px`)
  const [titleRed] = scan(f, 140, 76, 200, 26, isRed)
  check('defeat GAME OVER title', titleRed > 300, `${titleRed}px`)
}

// pause: parchment dialog under the PAUSED text at (240,120)
{
  const f = await frame('artifacts/look/ui5-pause.png')
  const [body] = scan(f, 160, 90, 160, 50, isParchment)
  check('pause parchment dialog', body > 1_500, `${body}px`)
  const [gold] = scan(f, 148, 75, 184, 8, isGold)
  check('pause gold rail', gold > 60, `${gold}px`)
}

// complete: gold scroll + hero row
{
  const f = await frame('artifacts/look/ui5-complete.png')
  const [body] = scan(f, 100, 60, 280, 80, isParchment)
  check('complete parchment body', body > 3_000, `${body}px`)
  const [gold] = scan(f, 70, 25, 340, 8, isGold)
  check('complete gold rails', gold > 150, `${gold}px`)
}

console.log(results.join('\n'))
const fails = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - fails}/${results.length} checks passed`)
if (fails > 0) process.exit(1)
