#!/usr/bin/env node
// CMR-13B: emit the Li Dian pack's runtime metadata and asset.
//
//   node scripts/emit-lidian-runtime.mjs
//
// Reads the prepared pack (scripts/prepare-lidian.mjs output) and writes:
//   src/game/assets/motion/lidian-prepared.json   (MotionPrepared record)
//   src/game/assets/motion/lidian-motion-sheet.png (atlas page asset)
// plus the MOTION_PACKS constants (bytes/sha256/dims) to stdout.
//
// Single-page boss (all 39 frames on one atlas): the archer single-page
// shape (actionSheet mirrors sheet, shared signature, single sha256)
// plus boss attack bindings. NO decodedCapBytes: the pack fits the 16 MiB
// contract, so no per-pack exception flows.

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PACK = 'artifacts/motion/lidian/lidian'
const OUT_JSON = 'src/game/assets/motion/lidian-prepared.json'
const OUT_PNG = 'src/game/assets/motion/lidian-motion-sheet.png'

const manifest = JSON.parse(readFileSync(`${PACK}/manifest.json`, 'utf8'))
if (manifest.pages.length !== 1) throw new Error(`lidian pack must have exactly 1 page, found ${manifest.pages.length}`)
if (manifest.decodedCapBytes !== undefined) throw new Error('lidian manifest unexpectedly carries decodedCapBytes - 16MB-first holds, no exception')
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
  attackBindings: {
    'charge.dash': 'charge',
    'sword.combo': 'combo',
    'sword.heavy': 'heavy',
  },
  sha256: createHash('sha256').update(png).digest('hex'),
}
writeFileSync(OUT_JSON, `${JSON.stringify(prepared, null, 2)}\n`)
copyFileSync(pagePath, OUT_PNG)

console.log('wrote', OUT_JSON, 'and', OUT_PNG)
console.log('PAGE CONSTANTS for MOTION_PACKS:')
console.log(`  bytes: ${png.length}, sha256: '${createHash('sha256').update(png).digest('hex')}', width: ${manifest.pages[0].width}, height: ${manifest.pages[0].height}`)
console.log('  frames:', Object.keys(frames).length, '| revision:', manifest.revision)
