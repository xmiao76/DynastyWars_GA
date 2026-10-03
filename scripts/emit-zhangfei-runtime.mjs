#!/usr/bin/env node
// CMR-09B: emit the Zhang Fei pack's runtime metadata and assets.
//
//   node scripts/emit-zhangfei-runtime.mjs
//
// Reads the prepared pack (scripts/prepare-zhangfei.mjs output) and writes:
//   src/game/assets/motion/zhangfei-prepared.json        (MotionPrepared record)
//   src/game/assets/motion/zhangfei-motion-sheet.png     (regular atlas page)
//   src/game/assets/motion/zhangfei-actions-sheet.png    (action atlas page)
// plus the MOTION_PACKS constants (bytes/sha256/dims) to stdout.
//
// Two textures (regular + actions), like Guan Yu: pipeline page 1 becomes
// the sheet texture, pipeline page 2 the actions texture; frames carry
// `sheet: 'actions'` exactly when they live on page 2. The top-level
// `sha256: { sheet, actions }` mirrors the guanyu per-page shape for the
// capture provenance (the single-string mook shape cannot hold two pages).

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PACK = 'artifacts/motion/zhangfei/zhangfei'
const OUT_JSON = 'src/game/assets/motion/zhangfei-prepared.json'
const OUT_PNG = {
  sheet: 'src/game/assets/motion/zhangfei-motion-sheet.png',
  actions: 'src/game/assets/motion/zhangfei-actions-sheet.png',
}

const manifest = JSON.parse(readFileSync(`${PACK}/manifest.json`, 'utf8'))
if (manifest.pages.length !== 2) throw new Error(`zhangfei pack must have exactly 2 pages, found ${manifest.pages.length}`)

// Same signature the runtime computes after decode (image-signature.ts):
// 48x32 grid of premultiplied-RGBA block averages, hex.
async function signature(pagePath) {
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
  return sig
}

const [page1, page2] = manifest.pages
const pagePath1 = `${PACK}/pages/${page1.name}.png`
const pagePath2 = `${PACK}/pages/${page2.name}.png`
const png1 = readFileSync(pagePath1)
const png2 = readFileSync(pagePath2)

const frames = {}
for (const f of manifest.frames) {
  const cell = {
    x: f.x,
    y: f.y,
    w: f.trim.w,
    h: f.trim.h,
    trimX: f.trim.trimX,
    trimY: f.trim.trimY,
    srcW: f.trim.srcW,
    srcH: f.trim.srcH,
  }
  if (f.page === page2.name) cell.sheet = 'actions'
  else if (f.page !== page1.name) throw new Error(`zhangfei frame ${f.name} on unknown page ${f.page}`)
  frames[f.name] = cell
}
const prepared = {
  id: manifest.id,
  revision: manifest.revision,
  density: manifest.density,
  box: manifest.box,
  sheet: { width: page1.width, height: page1.height },
  actionSheet: { width: page2.width, height: page2.height },
  frames,
  signatures: { sheet: await signature(pagePath1), actions: await signature(pagePath2) },
  attackBindings: {
    'zf.jab1': 'jab1',
    'zf.jab2': 'jab2',
    'zf.finisher': 'finisher',
    'zf.special': 'special',
    'mounted.sweep': 'dismountedsweep',
  },
  sha256: {
    sheet: createHash('sha256').update(png1).digest('hex'),
    actions: createHash('sha256').update(png2).digest('hex'),
  },
}
writeFileSync(OUT_JSON, `${JSON.stringify(prepared, null, 2)}\n`)
copyFileSync(pagePath1, OUT_PNG.sheet)
copyFileSync(pagePath2, OUT_PNG.actions)

console.log('wrote', OUT_JSON, 'and', OUT_PNG.sheet, 'and', OUT_PNG.actions)
console.log('PAGE CONSTANTS for MOTION_PACKS:')
console.log(`  sheet: bytes: ${png1.length}, sha256: '${createHash('sha256').update(png1).digest('hex')}', width: ${page1.width}, height: ${page1.height}`)
console.log(`  actions: bytes: ${png2.length}, sha256: '${createHash('sha256').update(png2).digest('hex')}', width: ${page2.width}, height: ${page2.height}`)
console.log('  frames:', Object.keys(frames).length, '| revision:', manifest.revision)
