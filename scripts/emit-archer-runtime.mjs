#!/usr/bin/env node
// CMR-08B: emit the archer pack's runtime metadata and asset.
//
//   node scripts/emit-archer-runtime.mjs
//
// Reads the prepared pack (scripts/prepare-archer.mjs output) and writes:
//   src/game/assets/motion/archer-prepared.json   (MotionPrepared record)
//   src/game/assets/motion/archer-motion-sheet.png (atlas page asset)
// plus the MOTION_PACKS constants (bytes/sha256/dims) to stdout.

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PACK = 'artifacts/motion/archer/archer'
const OUT_JSON = 'src/game/assets/motion/archer-prepared.json'
const OUT_PNG = 'src/game/assets/motion/archer-motion-sheet.png'

const manifest = JSON.parse(readFileSync(`${PACK}/manifest.json`, 'utf8'))
const pagePath = `${PACK}/pages/${manifest.pages[0].name}.png`
const png = readFileSync(pagePath)

// Same signature the runtime computes after decode (image-signature.ts):
// 48x32 grid of premultiplied-RGBA block averages, hex.
const img = await loadImage(pagePath)
const cv = createCanvas(img.width, img.height)
const g = cv.getContext('2d')
g.drawImage(img, 0, 0)
const im = g.getImageData(0, 0, img.width, img.height)
const COLS = 48
const ROWS = 32
let sig = ''
for (let by = 0; by < ROWS; by++) {
  for (let bx = 0; bx < COLS; bx++) {
    const sums = [0, 0, 0, 0]
    let n = 0
    for (let y = Math.floor(by * im.height / ROWS); y < Math.floor((by + 1) * im.height / ROWS); y++) {
      for (let x = Math.floor(bx * im.width / COLS); x < Math.floor((bx + 1) * im.width / COLS); x++) {
        const k = (y * im.width + x) * 4
        const a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]
        n++
      }
    }
    for (const sum of sums) sig += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
}

const frames = {}
for (const f of manifest.frames) {
  frames[f.name] = {
    x: f.x,
    y: f.y,
    w: f.trim.w,
    h: f.trim.h,
    trimX: f.trim.trimX,
    trimY: f.trim.trimY,
    srcW: f.trim.srcW,
    srcH: f.trim.srcH,
  }
}
const prepared = {
  id: manifest.id,
  revision: manifest.revision,
  density: manifest.density,
  box: manifest.box,
  sheet: { width: manifest.pages[0].width, height: manifest.pages[0].height },
  actionSheet: { width: manifest.pages[0].width, height: manifest.pages[0].height },
  singlePage: true,
  frames,
  signatures: { sheet: sig, actions: sig },
  attackBindings: {},
  sha256: createHash('sha256').update(png).digest('hex'),
}
writeFileSync(OUT_JSON, `${JSON.stringify(prepared, null, 2)}\n`)
copyFileSync(pagePath, OUT_PNG)

console.log('wrote', OUT_JSON, 'and', OUT_PNG)
console.log('PAGE CONSTANTS for MOTION_PACKS:')
console.log(`  bytes: ${png.length}, sha256: '${createHash('sha256').update(png).digest('hex')}', width: ${manifest.pages[0].width}, height: ${manifest.pages[0].height}`)
console.log('  frames:', Object.keys(frames).length, '| revision:', manifest.revision)
