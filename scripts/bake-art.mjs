/**
 * Bake AI-generated raw art into game-ready sprites.
 *
 *   node scripts/bake-art.mjs
 *
 * Reads art/raw/<kind>-<pose>.png (magenta/green/blue backdrop), keys out the
 * backdrop, despills, trims, composes into the per-kind frame box, and writes
 * public/assets/sprites/<kind>/<pose>.png. Portraits read
 * art/raw/<charId>-portrait.png -> public/assets/portraits/<charId>.png.
 * Writes public/assets/manifest.json with per-kind atomic coverage.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import {
  FRAME_BOXES,
  applyAlphaKey,
  buildManifest,
  composeIntoBox,
  despill,
  sniffKeyColor,
  trimBox,
} from './bake-core.mjs'

const RAW_DIR = 'art/raw'
const OUT_SPRITES = 'public/assets/sprites'
const OUT_PORTRAITS = 'public/assets/portraits'
const MANIFEST_PATH = 'public/assets/manifest.json'

const PORTRAIT_BOX = { w: 42, h: 54 }

function bakeFile(file) {
  const png = PNG.sync.read(readFileSync(join(RAW_DIR, file)))
  const image = { width: png.width, height: png.height, data: new Uint8Array(png.data) }
  const key = sniffKeyColor(image)
  applyAlphaKey(image, key)
  despill(image, key)
  const box = trimBox(image)
  if (!box) return null

  const dash = file.replace(/\.png$/i, '').lastIndexOf('-')
  const kind = file.slice(0, dash)
  const pose = file.slice(0, -4).slice(dash + 1)

  if (pose === 'portrait') {
    const composed = composeIntoBox(image, box, PORTRAIT_BOX.w, PORTRAIT_BOX.h)
    mkdirSync(OUT_PORTRAITS, { recursive: true })
    writeFileSync(join(OUT_PORTRAITS, `${kind}.png`), PNG.sync.write(composedToPng(composed)))
    return `${kind}-portrait`
  }

  const frame = FRAME_BOXES[kind]
  if (!frame || !frame.poses.includes(pose)) {
    console.warn(`skip unknown ${kind}/${pose}`)
    return null
  }
  const composed = composeIntoBox(image, box, frame.w, frame.h)
  mkdirSync(join(OUT_SPRITES, kind), { recursive: true })
  writeFileSync(join(OUT_SPRITES, kind, `${pose}.png`), PNG.sync.write(composedToPng(composed)))
  return `${kind}-${pose}`
}

function composedToPng(composed) {
  const png = new PNG({ width: composed.width, height: composed.height })
  png.data = Buffer.from(composed.data)
  return png
}

function main() {
  if (!existsSync(RAW_DIR)) {
    console.log(`no ${RAW_DIR}/ directory - nothing to bake`)
    return
  }
  const files = readdirSync(RAW_DIR).filter((f) => f.toLowerCase().endsWith('.png'))
  const baked = []
  for (const file of files) {
    const name = bakeFile(file)
    if (name) {
      baked.push(name)
      console.log(`baked ${name}`)
    }
  }
  const manifest = buildManifest(baked)
  mkdirSync('public/assets', { recursive: true })
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log(
    `manifest: ${Object.keys(manifest.sprites).length} complete kinds, ${manifest.portraits.length} portraits`,
  )
}

main()
