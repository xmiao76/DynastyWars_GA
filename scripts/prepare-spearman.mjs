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

// PER-SHEET scale (the accepted model is "one uniform scale PER SHEET"; the
// soldier's measured 0.3% agreement justified a pack-wide scale, the
// spearman's does not). Factors come from the controlled standing-guard
// pose via TWO GEOMETRIC proxies: face-to-ground distance
// (measurements-raw.json guardScale.ground) and guard figure height
// (scale-compare.json ratios). The face-area proxy is recorded for
// corroboration only: hitstun faces show exertion/frontal-turn inflation,
// so it is expression-contaminated. Rule - apply the geometric mean ONLY
// when the two geometric proxies agree within 0.05 AND the mean differs
// from 1.0 by more than the ~0.05 resolution; otherwise factor 1.
// Sheets with no standing guard cell are UNVERIFIED (factor 1).
const evidence = JSON.parse(readFileSync(`${SRC}/measurements-raw.json`, 'utf8'))
const guardScale = evidence.guardScale ?? {}
const compare = JSON.parse(readFileSync(`${SRC}/scale-compare.json`, 'utf8'))
const heightRatio = compare.ratios ?? {}
const factors = {}
const status = {}
for (const name of Object.keys(SHEETS)) {
  const e = guardScale[name]
  const h = heightRatio[name]
  if (name === 'locomotion') {
    factors[name] = 1
    status[name] = 'reference sheet'
  } else if (!e || h === undefined) {
    factors[name] = 1
    status[name] = 'UNVERIFIED (no standing guard cell) - factor 1'
  } else {
    const mean = Math.round(((e.ground + h) / 2) * 1000) / 1000
    const spread = Math.abs(e.ground - h)
    if (spread <= 0.05 && Math.abs(1 - mean) > 0.05) {
      factors[name] = mean
      status[name] = `applied: geometric proxies agree (ground ${e.ground}, height ${h}; face ${e.face} corroborates differently - expression-contaminated)`
    } else {
      factors[name] = 1
      status[name] = `UNRESOLVED: geometric mean ${mean} within resolution (ground ${e.ground}, height ${h}, face ${e.face}) - factor 1`
    }
  }
}
// Pack base scale: the tallest drawing, AFTER its sheet factor, fits its cell.
const CONTENT_CAP = BOX.height * DENSITY - 2 * TRIM_PAD - 2
const base = Math.min(...Object.keys(SHEETS).map((n) => CONTENT_CAP / (measured[n].maxContentHeight * factors[n])))
const sheetScale = Object.fromEntries(Object.keys(SHEETS).map((n) => [n, Math.floor(base * factors[n] * 1e6) / 1e6]))
const standing = ['locomotion', 'thrust', 'hitstun-held'].map((n) => measured[n].guardHeight)
const meanStanding = standing.reduce((a, b) => a + b, 0) / standing.length
for (const name of Object.keys(SHEETS)) {
  measured[name].scale = sheetScale[name]
  measured[name].scaleFactor = factors[name]
  measured[name].scaleEvidence = status[name]
}
console.log(`base scale ${base.toFixed(6)} (tallest drawing after factor fits its cell)`)
for (const name of Object.keys(SHEETS)) {
  console.log(`  ${name.padEnd(13)} factor ${factors[name]}  scale ${sheetScale[name]}  ${status[name]}`)
}
console.log(`standing guard bbox heights ${standing.join('/')}px (mean ${meanStanding.toFixed(0)}; spear-overhang varies - not used as scale)`)

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
  sequences: SEQUENCES.map((s) => ({ ...s, registration: { scale: sheetScale[s.name] } })),
}

const pack = preparePack(fighter, sheets)
const paths = writePackOutputs(fighter, pack, { outputRoot: OUT })

// Registration record (the accepted "registration.json" pattern).
mkdirSync(SRC, { recursive: true })
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'spearman',
  model: 'one uniform scale PER SHEET (guard face-to-ground factors vs locomotion) + cell-centre/ground anchors; shared bookends by alias',
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
