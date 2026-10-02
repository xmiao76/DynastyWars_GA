#!/usr/bin/env node
// Grid validation for a 3x3 motion sheet: component count, cell occupancy,
// sheet-edge cuts. Usage: node scripts/validate-sheet.mjs <path> [label]
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const [path, label] = process.argv.slice(2)
const img = await loadImage(path)
const cv = createCanvas(img.width, img.height)
const g = cv.getContext('2d')
g.drawImage(img, 0, 0)
const raw = g.getImageData(0, 0, img.width, img.height)
const im = { width: raw.width, height: raw.height, data: raw.data }
const comps = alphaComponents(im, 96).filter((c) => c.area >= 200)
console.log(`${label ?? path}: ${img.width}x${img.height} components>=200px: ${comps.length}`)
const cw = Math.floor(im.width / 3)
const ch = Math.floor(im.height / 3)
const cells = new Set()
let edge = 0
for (const c of comps) {
  cells.add(`${Math.floor((c.x0 + c.x1 + 1) / 2 / cw)},${Math.floor((c.y0 + c.y1 + 1) / 2 / ch)}`)
  if (c.x0 <= 0 || c.y0 <= 0 || c.x1 >= im.width - 1 || c.y1 >= im.height - 1) edge++
}
console.log(`  cells: ${[...cells].sort().join(' ')} edge-touch: ${edge}`)
for (const c of comps) console.log(`  comp x0=${c.x0} y0=${c.y0} x1=${c.x1} y1=${c.y1} area=${c.area}`)
