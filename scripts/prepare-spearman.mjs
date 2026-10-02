#!/usr/bin/env node
// CMR-07A: prepare the Wei Spearman pack from the five accepted sheets.
//
//   node scripts/prepare-spearman.mjs
//
// Registration model (the accepted one): ONE uniform scale per sheet,
// measured so the tallest drawing fits its cell with the trim pad - never
// a per-pose normalisation - with translations anchored on the drawing
// cell's centre and the figure's ground contact. Shared guard/down
// bookends are enforced by aliasing their positions to ONE canonical
// drawing (the aliased source cells count as unused). Trim, dedup,
// <=2048 packing, restored-pixel + pivot hashes, budget and report all
// come from the CMR-04 toolkit. No runtime catalog activation (CMR-07B).

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import {
  DENSITY,
  TRIM_PAD,
  alphaComponents,
  preparePack,
  writePackOutputs,
} from './motion-pipeline.mjs'

const SRC = 'art/motion/spearman'
const OUT = 'artifacts/motion/spearman'

// Canonical pack box: a mook stands ~116 display px (density 2), below the
// hero hierarchy (Guan Yu motion displays 144). Shared with the soldier
// pack so mooks register at one scale.
const BOX = { width: 224, height: 122, groundY: 120 }

const SHEETS = {
  locomotion: 'locomotion-candidate-1.png',
  thrust: 'thrust-candidate-1.png',
  'hitstun-held': 'hitstun-held-candidate-2.png',
  'fall-thrown': 'fall-thrown-candidate-1.png',
  'getup-death': 'getup-death-candidate-1.png',
}

const SEQUENCES = [
  { name: 'locomotion', count: 9, rows: 3, cols: 3, alias: { 8: 0 } },
  { name: 'thrust', count: 9, rows: 3, cols: 3, alias: { 0: 'locomotion:0', 8: 'locomotion:0' } },
  { name: 'hitstun-held', count: 9, rows: 3, cols: 3, alias: { 0: 'locomotion:0', 8: 'locomotion:0' } },
  { name: 'fall-thrown', count: 9, rows: 3, cols: 3, alias: { 8: 3 } },
  { name: 'getup-death', count: 9, rows: 3, cols: 3, alias: { 3: 'fall-thrown:3', 8: 'locomotion:0' } },
]

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

/** Content-bbox height of the drawing centred in a nominal cell. */
function cellContentHeight(im, cellIndex) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx0 = cellIndex % 3
  const cy0 = Math.floor(cellIndex / 3)
  let top = Infinity, bottom = -Infinity
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.floor((c.x0 + c.x1 + 1) / 2 / cellW)
    const cy = Math.floor((c.y0 + c.y1 + 1) / 2 / cellH)
    if (cx === cx0 && cy === cy0) {
      top = Math.min(top, c.y0)
      bottom = Math.max(bottom, c.y1)
    }
  }
  return bottom >= top ? bottom - top + 1 : 0
}

/** Tallest drawn figure (component bbox height) on a sheet. */
function maxContentHeight(im) {
  let best = 0
  for (const c of alphaComponents(im, 96)) best = Math.max(best, c.y1 - c.y0 + 1)
  return best
}

const sheets = {}
const measured = {}
let packMax = 0
for (const [name, file] of Object.entries(SHEETS)) {
  const im = await pixelsOf(`${SRC}/${file}`)
  sheets[name] = im
  const maxH = maxContentHeight(im)
  packMax = Math.max(packMax, maxH)
  measured[name] = {
    guardHeight: cellContentHeight(im, 0),
    guardAltHeight: cellContentHeight(im, 8),
    downHeight: cellContentHeight(im, 3),
    maxContentHeight: maxH,
    sha256: createHash('sha256').update(readFileSync(`${SRC}/${file}`)).digest('hex'),
  }
}

// ONE scale for the whole pack, sized so the TALLEST drawing fits its cell
// with the transparent trim pad (never a per-pose normalisation). The gate
// below catches GROSS scale disagreement only: the upright spear extends
// above the helmet by a grip-dependent amount, so raw guard-bbox heights
// legitimately vary ~8% at one true scale (verified visually: helmet,
// shoulder, belt, knee and boot landmarks align across sheets - see the
// guard comparison in PROVENANCE). Fine scale consistency is verified by
// the acceptance-4 head-size measurement on the prepared pack; per-sheet
// scales remain available if it ever fails.
const CONTENT_CAP = BOX.height * DENSITY - 2 * TRIM_PAD - 2
const scale = Math.floor((CONTENT_CAP / packMax) * 1e6) / 1e6
const standing = ['locomotion', 'thrust', 'hitstun-held'].map((n) => measured[n].guardHeight)
const meanStanding = standing.reduce((a, b) => a + b, 0) / standing.length
const standingSpread = (Math.max(...standing) - Math.min(...standing)) / meanStanding
const guards = [...standing, measured['getup-death'].guardAltHeight]
const guardSpread = (Math.max(...guards) - Math.min(...guards)) / (guards.reduce((a, b) => a + b, 0) / guards.length)
for (const name of Object.keys(SHEETS)) measured[name].scale = scale
console.log(`tallest drawing ${packMax}px -> scale ${scale} (standing figures ${(meanStanding * scale).toFixed(1)}px content)`)
console.log(`standing bookends ${standing.join('/')}px spread ${(100 * standingSpread).toFixed(2)}%`)
console.log(`all guard cells ${guards.join('/')}px spread ${(100 * guardSpread).toFixed(2)}%`)
console.log(`DOWN cell heights (pose variance, aliased to one drawing): fall=${measured['fall-thrown'].downHeight} getup-death=${measured['getup-death'].downHeight}`)
if (standingSpread > 0.12 || guardSpread > 0.12) {
  console.log('DEFECT: drawn scales disagree - measure and re-normalise')
  process.exit(1)
}

const registration = measured

const fighter = {
  id: 'spearman',
  role: 'mook',
  density: DENSITY,
  box: BOX,
  revision: 'spearman-1',
  // Generated sheets carry low-alpha glow around figures; the measured
  // glow is proportional to figure area on every sheet (23-35% of opaque
  // pixels; fall-thrown reads highest at 124,281px absolute because its
  // tumbling/prone figures cover the most area). Cleanup removes it
  // (alpha-only, never eating near-black costume). The tolerance only
  // trips on gross residue.
  cleanup: { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 },
  sequences: SEQUENCES.map((s) => ({ ...s, registration: { scale } })),
}

const pack = preparePack(fighter, sheets)
const paths = writePackOutputs(fighter, pack, { outputRoot: OUT })

// Registration record (the accepted "registration.json" pattern).
mkdirSync(SRC, { recursive: true })
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'spearman',
  model: 'one uniform scale per sheet + cell-centre/ground anchors; shared bookends by alias',
  box: BOX,
  density: DENSITY,
  contentCapPx: CONTENT_CAP,
  sheets: registration,
  aliases: Object.fromEntries(SEQUENCES.map((s) => [s.name, s.alias])),
}, null, 2)}\n`)

// Determinism check: the whole pipeline must be re-runnable to the same
// manifest identity.
const again = preparePack(fighter, sheets)
const deterministic = again.manifestSha256 === pack.manifestSha256

console.log('--- spearman pack report ---')
console.log('manifest sha256:', pack.manifestSha256, deterministic ? '(deterministic)' : '(NOT DETERMINISTIC)')
console.log('frames:', pack.frames.length, '| pages:', pack.pages.map((p) => `${p.name} ${p.width}x${p.height}`).join(', '))
console.log('counts:', JSON.stringify(pack.report.counts))
console.log('budget:', JSON.stringify(pack.budget))
console.log('suspects:', pack.report.suspects.length)
console.log('outputs:', paths.output)
if (!deterministic) {
  console.log('DEFECT: preparation is not deterministic')
  process.exit(1)
}
