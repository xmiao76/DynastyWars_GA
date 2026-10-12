#!/usr/bin/env node
// CMR-14B: immutable prepared source -> one shared runtime atlas, no art processing.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PACK = 'artifacts/motion/xiahoudun'
const OUT_JSON = 'src/game/assets/motion/xiahoudun-prepared.json'
const OUT_PNG = 'src/game/assets/motion/xiahoudun-motion-sheet.png'
const EXPECTED_MANIFEST = 'fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1'
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const manifestBytes = readFileSync(`${PACK}/manifest.json`)
if (hash(manifestBytes) !== EXPECTED_MANIFEST) throw new Error('xiahoudun source manifest SHA-256 mismatch')
const manifest = JSON.parse(manifestBytes.toString('utf8'))
if (manifest.id !== 'xiahoudun' || manifest.density !== 2 || manifest.pages.length !== 1 || manifest.decodedCapBytes !== undefined) throw new Error('unsupported xiahoudun source contract')
const expectedKeys = ['walk', 'charge', 'combo', 'heavy', 'misc', 'fall', 'getup'].flatMap((group) => Array.from({ length: group === 'walk' ? 9 : 5 }, (_, i) => `${group}:${i}`))
if (manifest.frames.length !== 39 || new Set(manifest.frames.map((f) => f.name)).size !== 39 || manifest.frames.some((f) => !expectedKeys.includes(f.name))) throw new Error('source must contain exactly the 39 boss frames')
const page = manifest.pages[0]
const pagePath = `${PACK}/pages/${page.name}.png`
const png = readFileSync(pagePath)
const img = await loadImage(png)
if (img.width !== page.width || img.height !== page.height || img.width > 2048 || img.height > 2048 || img.width * img.height * 4 > 16 * 1024 * 1024) throw new Error('decoded page violates source dimensions/budget')
if (manifest.frames.some((f) => f.page !== page.name)) throw new Error('all frames must reference the sole physical page')
const down = manifest.frames.find((f) => f.name === 'fall:4')
const alias = manifest.frames.find((f) => f.name === 'getup:0')
if (down.x !== alias.x || down.y !== alias.y || JSON.stringify(down.trim) !== JSON.stringify(alias.trim) || down.contentSha256 !== alias.contentSha256 || down.restoredSha256 !== alias.restoredSha256) throw new Error('forged DOWN alias')

// Same 48x32 premultiplied-RGBA block-average signature as image-signature.ts.
const cv = createCanvas(img.width, img.height)
const g = cv.getContext('2d')
g.drawImage(img, 0, 0)
const im = g.getImageData(0, 0, img.width, img.height)
let sig = ''
for (let by = 0; by < 32; by++) {
  for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]
    let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) {
      for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
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
const frames = Object.fromEntries(manifest.frames.map((f) => [f.name, {
  x: f.x, y: f.y, w: f.trim.w, h: f.trim.h,
  trimX: f.trim.trimX, trimY: f.trim.trimY, srcW: f.trim.srcW, srcH: f.trim.srcH,
  ...(f.name === 'getup:0' ? { aliasOf: 'fall:4' } : {}),
}]))
const prepared = {
  id: manifest.id, revision: manifest.revision, density: manifest.density, box: manifest.box,
  sheet: { width: img.width, height: img.height }, actionSheet: { width: img.width, height: img.height },
  singlePage: true, frames, signatures: { sheet: sig, actions: sig },
  attackBindings: { 'charge.dash.long': 'charge', 'sword.combo': 'combo', 'sword.heavy': 'heavy' },
  source: { manifestSha256: EXPECTED_MANIFEST, manifestPath: `${PACK}/manifest.json`, page: page.name },
  sha256: hash(png),
}
writeFileSync(OUT_JSON, `${JSON.stringify(prepared, null, 2)}\n`)
copyFileSync(pagePath, OUT_PNG)
console.log(JSON.stringify({ files: [OUT_JSON, OUT_PNG], manifestSha256: EXPECTED_MANIFEST, bytes: png.length, sha256: hash(png), width: img.width, height: img.height, decodedBytes: img.width * img.height * 4, frames: 39, unique: 38 }, null, 2))
