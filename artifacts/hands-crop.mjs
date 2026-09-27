import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
// Crop each fighter's 5 hand cells at 4x on grey for review.
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['guanyu', 'zhangfei', 'weiyan', 'huangzhong', 'lubu', 'xuchu', 'caocao', 'zhaoyun']
const HANDS = ['gripN', 'gripF', 'relaxN', 'relaxF', 'wrapF']
const packs = { guanyu: 'hero-bodies', zhangfei: 'hero-bodies', huangzhong: 'hero-bodies', weiyan: 'hero-bodies', zhaoyun: 'hero-bodies' }
for (const id of ids) {
  const pack = packs[id] ?? (['soldier', 'spearman', 'archer'].includes(id) ? 'mook-bodies' : 'boss-bodies')
  const prep = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
  const meta = prep[id]
  const img = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
  if (img.width !== meta.sheet.width) throw new Error(`${id}: sheet width ${img.width} != ${meta.sheet.width}`)
  const S = 4
  const out = createCanvas(HANDS.length * 48 * S, (40 * S) + 34)
  const g = out.getContext('2d')
  g.fillStyle = '#6a6470'
  g.fillRect(0, 0, out.width, out.height)
  g.font = '12px sans-serif'
  for (const [i, name] of HANDS.entries()) {
    const c = meta.parts[name]
    if (!c) throw new Error(`${id}: no ${name} cell`)
    g.imageSmoothingEnabled = false
    g.drawImage(img, c.x, c.y, c.w, c.h, i * 48 * S, 30, c.w * S, c.h * S)
    g.fillStyle = '#f5e6c8'
    g.fillText(name, i * 48 * S + 4, 16)
  }
  writeFileSync(`artifacts/look/hands-${id}.png`, out.toBuffer('image/png'))
  console.log(id, 'ok', img.width + 'x' + img.height, 'rev', meta.revision)
}
