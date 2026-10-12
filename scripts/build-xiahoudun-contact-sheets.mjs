#!/usr/bin/env node
// CMR-14B crit-5 gap closure: build 12B/13B-style review artifacts from the
// EXISTING precedent captures (no re-capture, no browser).
// For each run dir: contact-sheet.png (exact motion-capture.mjs layout:
// cols=min(4,n), 320px cells on #181020) + crops/<6 enlarged key frames>.
// Also prints mixed-action key inventory + box stats for the unseen-8 note.
import { readdirSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const RUNS = [
  'artifacts/motion/xiahoudun/precedent/captures/canvas',
  'artifacts/motion/xiahoudun/precedent/captures/webgl',
  'artifacts/motion/xiahoudun/precedent/captures/canvas-mobile',
]
// Lidian-style enlarged-crop sample: signature attacks both renderers' worth
// of poses, impact, death, guard — one per action family, both facings
// represented across the set.
const CROPS = ['charge-right.png', 'heavy-right.png', 'knockdown-right.png', 'combo-left.png', 'dead-right.png', 'idle-left.png']

for (const run of RUNS) {
  const frameFiles = readdirSync(`${run}/frames`).filter((f) => f.endsWith('.png')).sort()
  // contact-sheet.png — identical layout to scripts/motion-capture.mjs §contact sheet
  const cols = Math.min(4, frameFiles.length)
  const cell = 320
  const rowsN = Math.ceil(frameFiles.length / cols)
  const sheet = createCanvas(cols * cell, rowsN * cell)
  const g = sheet.getContext('2d')
  g.fillStyle = '#181020'
  g.fillRect(0, 0, sheet.width, sheet.height)
  for (const [i, f] of frameFiles.entries()) {
    const img = await loadImage(`${run}/frames/${f}`)
    const x = (i % cols) * cell, y = Math.floor(i / cols) * cell
    g.drawImage(img, x + 4, y + 4, cell - 8, cell - 8)
  }
  writeFileSync(`${run}/contact-sheet.png`, sheet.toBuffer('image/png'))
  console.log(`${run}: contact-sheet.png ${sheet.width}x${sheet.height} from ${frameFiles.length} frames`)
  // enlarged crops — native 2x box-relative captures, copied verbatim
  mkdirSync(`${run}/crops`, { recursive: true })
  for (const f of CROPS) {
    if (!existsSync(`${run}/frames/${f}`)) { console.log(`${run}: MISSING ${f}`); continue }
    copyFileSync(`${run}/frames/${f}`, `${run}/crops/enlarged-${f}`)
    const img = await loadImage(`${run}/frames/${f}`)
    console.log(`${run}/crops/enlarged-${f} ${img.width}x${img.height}`)
  }
}

// unseen-8 support: what the 180-tick AI mixed runs actually rendered
for (const run of RUNS) {
  const trace = JSON.parse(readFileSync(`${run}/trace.json`, 'utf8'))
  const mixedKeys = new Set(trace.rows.filter((r) => r.action === 'mixed' && r.kind === 'xiahoudun').map((r) => r.key.replace('entity:xiahoudun:motion:', '')))
  const walkKeys = [...mixedKeys].filter((k) => k.startsWith('walk:')).sort()
  console.log(`${run}: mixed xiahoudun distinct keys=${mixedKeys.size} walkKeys=[${walkKeys.join(',')}]`)
  const boxes = trace.rows.filter((r) => r.box && r.box.w > 0).map((r) => `${r.box.w}x${r.box.h}`)
  console.log(`${run}: distinct crop boxes=${[...new Set(boxes)].sort().join(',')} (box-relative 2x crops; no viewport record in trace)`)
}
