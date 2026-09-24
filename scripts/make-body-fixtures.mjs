import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas } from '@napi-rs/canvas'

/**
 * BODY-2 fixture generator: synthetic paper-doll parts with the exact
 * procedural silhouettes (same path geometry, flat distinct colors) so the
 * parity gate runs for real before production art exists. Deterministic:
 * the unit suite regenerates and byte-compares against the committed files.
 *
 * Layout: 10 uniform cells in one row. Logical cell 32x48 at 4x density
 * (128x192 device). Pivot (joint A) at logical (16, 8) of every cell.
 */
export const CELL_W = 32
export const CELL_H = 48
export const DENSITY = 4
export const PIVOT = { x: 16, y: 8 }

export const PARTS = [
  { name: 'cloth', len: 30, wA: 18, wB: 26, color: '#808080' },
  { name: 'upperArmF', len: 12.37, wA: 9, wB: 7.2, color: '#3060e0' },
  { name: 'foreArmF', len: 12.17, wA: 7.2, wB: 5.4, color: '#30c0e0' },
  { name: 'thighF', len: 18.11, wA: 12.5, wB: 9.5, color: '#30e080' },
  { name: 'shinF', len: 21.1, wA: 9.5, wB: 7, color: '#a0e030' },
  { name: 'torso', len: 22, wA: 23.5, wB: 15.5, color: '#e03030' },
  { name: 'thighN', len: 18.25, wA: 13, wB: 10, color: '#8040e0' },
  { name: 'shinN', len: 21.21, wA: 10, wB: 7.5, color: '#40e0c0' },
  { name: 'upperArmN', len: 12.65, wA: 9.5, wB: 7.4, color: '#e0a030' },
  { name: 'foreArmN', len: 11.05, wA: 7.4, wB: 5.6, color: '#e030a0' },
]

/** Tapered limb pointing down from (cx, y0), round caps both ends. */
function limb(ctx, cx, y0, len, wA, wB) {
  ctx.beginPath()
  ctx.moveTo(cx - wA / 2, y0)
  ctx.lineTo(cx - wB / 2, y0 + len)
  ctx.arc(cx, y0 + len, wB / 2, Math.PI, 0, true)
  ctx.lineTo(cx + wA / 2, y0)
  ctx.arc(cx, y0, wA / 2, 0, Math.PI, true)
  ctx.closePath()
  ctx.fill()
}

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

export function generateFixtures() {
  const W = CELL_W * PARTS.length * DENSITY
  const H = CELL_H * DENSITY
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  ctx.scale(DENSITY, DENSITY)
  const parts = {}
  PARTS.forEach((p, i) => {
    const ox = i * CELL_W
    const cx = ox + PIVOT.x
    const y0 = PIVOT.y - p.len * 0.2
    const total = p.len * 1.4
    ctx.fillStyle = p.color
    limb(ctx, cx, y0, total, p.wA, p.wB)
    // Hand/foot blobs on distal parts so tips read in order tests.
    if (p.name.startsWith('foreArm') || p.name.startsWith('shin')) {
      ctx.beginPath()
      ctx.arc(cx, y0 + total, p.wB * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }
    parts[p.name] = {
      x: ox * DENSITY, y: 0, w: CELL_W * DENSITY, h: CELL_H * DENSITY,
      pivotX: PIVOT.x * DENSITY, pivotY: PIVOT.y * DENSITY,
    }
  })
  const png = canvas.toBuffer('image/png')
  const im = ctx.getImageData(0, 0, W, H)
  const prepared = {
    fixture: {
      revision: 'fixture-1',
      skin: '#c08060',
      density: DENSITY,
      sheet: { width: W, height: H },
      parts,
      signatures: { sheet: signature(im) },
      sha256: { sheet: createHash('sha256').update(png).digest('hex') },
    },
  }
  return { png, prepared }
}

const out = 'src/game/assets/body-fixtures'

function main() {
  mkdirSync(out, { recursive: true })
  const { png, prepared } = generateFixtures()
  const pngPath = `${out}/fixture-sheet.png`
  const jsonPath = `${out}/prepared.json`
  const prevPng = existsSync(pngPath) ? readFileSync(pngPath) : null
  writeFileSync(pngPath, png)
  writeFileSync(jsonPath, `${JSON.stringify(prepared, null, 2)}\n`)
  console.log(`fixture-sheet.png ${png.length} bytes${prevPng && prevPng.equals(png) ? ' (identical)' : ' (UPDATED)'}`)
}

// Unit tests import generateFixtures() for the determinism check; only write
// files when executed directly.
if (process.argv[1]?.endsWith('make-body-fixtures.mjs')) main()
