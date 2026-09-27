/**
 * BODY-1 pilot legibility sheet: pilots at the real display sizes the game
 * uses (device px at 960x540 = logical x2). Read with read_image.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'

async function load(path) {
  const img = await loadImage(path)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return { img, w: img.width, h: img.height }
}

const sheet = createCanvas(1000, 980)
const g = sheet.getContext('2d')
g.fillStyle = '#14101c'
g.fillRect(0, 0, 1000, 980)
g.fillStyle = '#f5e6c8'
g.font = '20px sans-serif'

const body = await load('artifacts/look/body1-zhaoyun-bodypilot.jpg')
const port = await load('artifacts/look/body1-caocao-portrait.jpg')
const head = await load('artifacts/look/body1-caocao-head.jpg')

function fit(img, w, h, x, y, maxH, label) {
  const s = Math.min(maxH / h, 460 / w)
  const dw = Math.round(w * s)
  const dh = Math.round(h * s)
  g.drawImage(img, x, y, dw, dh)
  g.fillStyle = '#f5e6c8'
  g.font = '20px sans-serif'
  g.fillText(label, x, y + dh + 26)
  return dh + 40
}

let y = 16
g.fillText('Zhao Yun body: full pilot (left) vs gameplay height 92 logical px (right)', 16, y + 18)
y += 40
{ // full at h=380 + gameplay 184 device px tall side by side
  const s1 = 380 / body.h
  g.drawImage(body.img, 16, y, Math.round(body.w * s1), 380)
  const gh = 184
  const gw = Math.round(body.w * (gh / body.h))
  g.drawImage(body.img, 500, y + (380 - gh), gw, gh)
  g.fillStyle = '#f5e6c8'
  g.fillText('pilot', 16, y + 380 + 26)
  g.fillText('gameplay 92px', 500, y + 380 + 26)
  y += 380 + 48
}
g.fillText('Cao Cao portrait: full (left) vs select window 76x84 logical (right)', 16, y + 18)
y += 40
{
  const s1 = 330 / port.h
  g.drawImage(port.img, 16, y, Math.round(port.w * s1), 330)
  // select window: cover-crop 76x84 logical = 152x168 device from upper body
  const sw = port.w * 0.62
  const sh = sw * (168 / 152)
  const sx = port.w * 0.19
  const sy = port.h * 0.02
  g.drawImage(port.img, sx, sy, sw, sh, 500, y + (330 - 168), 152, 168)
  g.fillStyle = '#f5e6c8'
  g.fillText('pilot', 16, y + 330 + 26)
  g.fillText('select 76x84', 500, y + 330 + 26)
  y += 330 + 48
}
{
  const label = 'Cao Cao head: medallion 34px (left) vs gameplay ~20px wide (right)'
  g.fillText(label, 16, y + 18)
  y += 40
  const s1 = 68 / head.w
  g.drawImage(head.img, 16, y, 68, Math.round(head.h * s1))
  const s2 = 40 / head.w
  g.drawImage(head.img, 200, y, 40, Math.round(head.h * s2))
}

const { writeFileSync } = await import('node:fs')
writeFileSync('artifacts/look/body1-pilot-sizes.png', sheet.toBuffer('image/png'))
console.log('wrote artifacts/look/body1-pilot-sizes.png')
