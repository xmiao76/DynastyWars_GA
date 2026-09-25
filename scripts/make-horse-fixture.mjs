import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas } from '@napi-rs/canvas'

/**
 * BODY-5 fixture generator: a synthetic 3-frame horse sheet with distinct
 * flat colors per frame (idle red, walk0 green, walk1 blue), so frame
 * selection, publish atomicity and fallback are all unit-testable before
 * production art exists. Deterministic: the unit suite regenerates and
 * byte-compares against the committed files.
 *
 * Logical frame 112x76 at density 4 (448x304 device), three in a row.
 */
export const FRAME_W = 112
export const FRAME_H = 76
export const DENSITY = 4
export const FRAMES = [
  { name: 'idle', color: '#c03030' },
  { name: 'walk0', color: '#30c030' },
  { name: 'walk1', color: '#3060c0' },
]

/** Mirror of the pure TS signature algorithm (see prepare-hero-faces.mjs). */
function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) {
      for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]; n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}

export function generateFixture() {
  const cw = FRAME_W * DENSITY
  const ch = FRAME_H * DENSITY
  const canvas = createCanvas(cw * FRAMES.length, ch)
  const ctx = canvas.getContext('2d')
  const frames = {}
  FRAMES.forEach((f, i) => {
    ctx.fillStyle = f.color
    // Inset 8px so keying/alpha tests have real transparent margins.
    ctx.fillRect(i * cw + 8, 8, cw - 16, ch - 16)
    frames[f.name] = { x: i * cw, y: 0, w: cw, h: ch }
  })
  const png = canvas.toBuffer('image/png')
  const im = ctx.getImageData(0, 0, cw * FRAMES.length, ch)
  const prepared = {
    fixture: {
      revision: 'fixture-1',
      density: DENSITY,
      sheet: { width: cw * FRAMES.length, height: ch },
      frames,
      signatures: { sheet: signature(im) },
      sha256: { sheet: createHash('sha256').update(png).digest('hex') },
    },
  }
  return { png, prepared }
}

function main() {
  const out = 'src/game/assets/horse-fixtures'
  mkdirSync(out, { recursive: true })
  const { png, prepared } = generateFixture()
  const pngPath = `${out}/horse-sheet.png`
  const jsonPath = `${out}/prepared.json`
  const prevPng = existsSync(pngPath) ? readFileSync(pngPath) : null
  writeFileSync(pngPath, png)
  writeFileSync(jsonPath, `${JSON.stringify(prepared, null, 2)}\n`)
  console.log(`horse-sheet.png ${png.length} bytes${prevPng && prevPng.equals(png) ? ' (identical)' : ' (UPDATED)'}`)
}

// Unit tests import generateFixture() for the determinism check; only write
// files when executed directly.
if (process.argv[1]?.endsWith('make-horse-fixture.mjs')) main()
