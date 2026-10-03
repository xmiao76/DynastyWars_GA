#!/usr/bin/env node
// CMR-09A: display-scale review of the PREPARED pack - every frame drawn
// exactly where the runtime would draw it (trimmed rect restored at
// trimX/trimY inside the 520x288 box, ground line at y=272), on one shared
// ruler, in manifest (play-grouped) order. Plus one strip per sequence at
// full scale for the enlarged continuity pass.
//
//   node scripts/display-sheet-zhangfei.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PACK = 'artifacts/motion/zhangfei/zhangfei'
const OUT = 'artifacts/motion/zhangfei/landmarks'
const manifest = JSON.parse(readFileSync(`${PACK}/manifest.json`, 'utf8'))
const pages = {}
for (const p of manifest.pages) pages[p.name] = await loadImage(`${PACK}/pages/${p.name}.png`)
const CELL_W = manifest.box.width * manifest.density
const CELL_H = manifest.box.height * manifest.density
const GROUND = manifest.box.groundY * manifest.density
const frames = manifest.frames

const drawCell = (g, f, ox, oy, Z, pad) => {
  const W = Math.round(CELL_W * Z), H = Math.round(CELL_H * Z)
  g.fillStyle = '#26202e'
  g.fillRect(ox, oy, W, H)
  g.drawImage(pages[f.page], f.x, f.y, f.trim.w, f.trim.h, ox + f.trim.trimX * Z, oy + f.trim.trimY * Z, f.trim.w * Z, f.trim.h * Z)
  g.strokeStyle = 'rgba(255,220,120,0.55)'
  g.beginPath(); g.moveTo(ox, oy + GROUND * Z); g.lineTo(ox + W, oy + GROUND * Z); g.stroke()
  g.strokeStyle = 'rgba(120,220,255,0.18)'
  for (let y = GROUND; y > 0; y -= 50) { g.beginPath(); g.moveTo(ox, oy + y * Z); g.lineTo(ox + W, oy + y * Z); g.stroke() }
  g.fillStyle = '#fff'
  g.font = `${f.name.length > 9 ? 11 : 13}px sans-serif`
  g.fillText(f.name, ox + 4, oy - 4 + pad)
  return { W, H }
}

// Contact sheet: all frames, play-grouped order.
{
  const COLS = 6, Z = 0.5, PAD = 18
  const W = Math.round(CELL_W * Z), H = Math.round(CELL_H * Z)
  const rows = Math.ceil(frames.length / COLS)
  const sheet = createCanvas(COLS * W + 8, rows * (H + PAD) + 34)
  const g = sheet.getContext('2d')
  g.fillStyle = '#1b1722'
  g.fillRect(0, 0, sheet.width, sheet.height)
  g.fillStyle = '#ffd27f'
  g.font = 'bold 20px sans-serif'
  g.fillText('ZHANGFEI PREPARED PACK AT DISPLAY SCALE (box 520x288, ground y=272; gridlines every 50 px) - CMR-09A', 10, 24)
  frames.forEach((f, i) => {
    const ox = (i % COLS) * W + 4
    const oy = 34 + Math.floor(i / COLS) * (H + PAD)
    drawCell(g, f, ox, oy + PAD, Z, PAD)
  })
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/display-scale.png`, sheet.toBuffer('image/png'))
  console.log('wrote', `${OUT}/display-scale.png`, sheet.width + 'x' + sheet.height, 'frames', frames.length)
}

// Per-sequence strips at full scale.
mkdirSync(`${OUT}/strips`, { recursive: true })
const bySeq = new Map()
for (const f of frames) {
  const s = f.name.split(':')[0]
  if (!bySeq.has(s)) bySeq.set(s, [])
  bySeq.get(s).push(f)
}
for (const [seq, fs] of bySeq) {
  const Z = 1.0, PAD = 22
  const W = Math.round(CELL_W * Z), H = Math.round(CELL_H * Z)
  const sheet = createCanvas(fs.length * (W + 6) + 8, H + PAD + 34)
  const g = sheet.getContext('2d')
  g.fillStyle = '#1b1722'
  g.fillRect(0, 0, sheet.width, sheet.height)
  g.fillStyle = '#ffd27f'
  g.font = 'bold 20px sans-serif'
  g.fillText(`ZHANGFEI ${seq} (${fs.length} frames, play order) - CMR-09A`, 10, 24)
  fs.forEach((f, i) => drawCell(g, f, 4 + i * (W + 6), 34 + PAD, Z, PAD))
  writeFileSync(`${OUT}/strips/${seq}.png`, sheet.toBuffer('image/png'))
  console.log('wrote', `${OUT}/strips/${seq}.png`, sheet.width + 'x' + sheet.height)
}
