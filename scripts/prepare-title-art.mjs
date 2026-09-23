// Deterministic title key-art preparation (UI-2).
// Cover-crops art/ui-title/keyart-master.jpg to 16:9 (crop taken from the
// bottom, which also removes the model's gibberish caption strip), downscales
// to 960x540, and bakes a bottom scrim so the plaque/prompt keep contrast over
// bright river fire. Writes src/game/assets/title/keyart-backdrop.jpg.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const img = await loadImage('art/ui-title/keyart-master.jpg')
const TARGET_W = 960
const TARGET_H = 540
// Cover: full width, crop the excess height off the bottom (caption zone).
const cropH = Math.round(img.width * (TARGET_H / TARGET_W))
if (cropH <= 0 || cropH > img.height) throw new Error(`bad crop geometry for ${img.width}x${img.height}`)
const canvas = createCanvas(TARGET_W, TARGET_H)
const ctx = canvas.getContext('2d')
ctx.drawImage(img, 0, 0, img.width, cropH, 0, 0, TARGET_W, TARGET_H)
// Bottom scrim: transparent at 60%, deep dusk at the foot.
const scrim = ctx.createLinearGradient(0, TARGET_H * 0.6, 0, TARGET_H)
scrim.addColorStop(0, 'rgba(8, 4, 8, 0)')
scrim.addColorStop(1, 'rgba(8, 4, 8, 0.62)')
ctx.fillStyle = scrim
ctx.fillRect(0, TARGET_H * 0.6, TARGET_W, TARGET_H * 0.4)
const out = 'src/game/assets/title/keyart-backdrop.jpg'
writeFileSync(out, canvas.toBuffer('image/jpeg', 82))
const bytes = readFileSync(out)
console.log(`${out}: ${bytes.length} bytes sha256=${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}`)
