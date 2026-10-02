#!/usr/bin/env node
// CMR-07A: display-scale review of the PREPARED pack - every unique frame
// drawn exactly where the runtime would draw it (trimmed rect restored at
// trimX/trimY inside the 448x244 box, ground line at y=240), on one shared
// ruler. This is the view acceptance 4 is judged on: head size and spear
// length AFTER registration, side by side across sheets.
//
//   node scripts/display-sheet-spearman.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PACK = 'artifacts/motion/spearman/spearman'
const OUT = 'artifacts/motion/spearman/landmarks'
const manifest = JSON.parse(readFileSync(`${PACK}/manifest.json`, 'utf8'))
const page = await loadImage(`${PACK}/pages/${manifest.pages[0].name}.png`)
const CELL_W = manifest.box.width * manifest.density
const CELL_H = manifest.box.height * manifest.density
const GROUND = manifest.box.groundY * manifest.density

const seen = new Set()
const frames = manifest.frames.filter((f) => {
  const key = `${f.page}:${f.x}:${f.y}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})

const COLS = 6
const Z = 0.8
const W = Math.round(CELL_W * Z)
const H = Math.round(CELL_H * Z)
const rows = Math.ceil(frames.length / COLS)
const sheet = createCanvas(COLS * W, rows * (H + 22) + 34)
const g = sheet.getContext('2d')
g.fillStyle = '#1b1722'
g.fillRect(0, 0, sheet.width, sheet.height)
g.fillStyle = '#ffd27f'
g.font = 'bold 20px sans-serif'
g.fillText('SPEARMAN PREPARED PACK AT DISPLAY SCALE (box 448x244, ground y=240; gridlines every 50 px) - CMR-07A', 10, 24)
frames.forEach((f, i) => {
  const ox = (i % COLS) * W
  const oy = 34 + Math.floor(i / COLS) * (H + 22)
  g.fillStyle = '#26202e'
  g.fillRect(ox + 2, oy + 20, W - 4, H)
  g.drawImage(page, f.x, f.y, f.trim.w, f.trim.h, ox + 2 + f.trim.trimX * Z, oy + 20 + f.trim.trimY * Z, f.trim.w * Z, f.trim.h * Z)
  g.strokeStyle = 'rgba(255,220,120,0.55)'
  g.beginPath(); g.moveTo(ox + 2, oy + 20 + GROUND * Z); g.lineTo(ox + W - 2, oy + 20 + GROUND * Z); g.stroke()
  g.strokeStyle = 'rgba(120,220,255,0.18)'
  for (let y = GROUND; y > 0; y -= 50) { g.beginPath(); g.moveTo(ox + 2, oy + 20 + y * Z); g.lineTo(ox + W - 2, oy + 20 + y * Z); g.stroke() }
  g.fillStyle = '#fff'
  g.font = '13px sans-serif'
  g.fillText(f.name, ox + 6, oy + 14)
})
mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/display-scale.png`, sheet.toBuffer('image/png'))
console.log('wrote', `${OUT}/display-scale.png`, sheet.width + 'x' + sheet.height, 'unique frames', frames.length)
