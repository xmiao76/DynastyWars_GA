#!/usr/bin/env node
// CMR-09A: prepare the Zhang Fei pack from the ten accepted sheets.
//
//   node scripts/prepare-zhangfei.mjs
//
// Registration model (the accepted one): ONE uniform scale per sheet,
// measured so the tallest drawing fits its cell with the trim pad - never
// a per-pose normalisation - with translations anchored on the drawing
// cell's centre and the figure's ground contact. Shared guard/down
// bookends are enforced by aliasing their positions to ONE canonical
// drawing (the aliased source cells count as unused). Trim, dedup,
// <=2048 packing, restored-pixel + pivot hashes, budget and report all
// come from the CMR-04 toolkit. No runtime catalog activation (CMR-09B).

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

const SRC = 'art/motion/zhangfei'
const OUT = 'artifacts/motion/zhangfei'

// Canonical pack box: the HERO box (same 224x144/groundY 136 as the Guan Yu
// reference), so heroes register at one scale and the mook/boss hierarchy is
// preserved. Zhang Fei's HEAVY build (0.96 height) lives in his drawings,
// which the fit scale maps into this cell unchanged in proportion.
const BOX = { width: 224, height: 144, groundY: 136 }

const SHEETS = {
  walk: 'walk-candidate-2.png',
  jab1: 'jab1-candidate-2.png',
  jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png',
  jump: 'jump-candidate-1.png',
  fall: 'fall-candidate-1.png',
  getup: 'getup-candidate-1.png',
  misc: 'misc-candidate-1.png',
  special: 'special-candidate-1.png',
  rider: 'rider-candidate-1.png',
}

// Bookends alias ONE canonical drawing: guards -> walk:0, DOWN -> fall:6,
// rider idle bookend -> rider:0. Aliased cells' own drawings count unused.
// walk has NO bookend: cells 1-8 are the genuine 8-pose cycle (cell 8 is the
// kick-back snap, verified at c2 acceptance - never alias it away).
const SEQUENCES = [
  { name: 'walk', count: 9, rows: 3, cols: 3, alias: {} },
  { name: 'jab1', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 7: 'walk:0', 8: 'walk:0' } },
  { name: 'jab2', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 7: 'walk:0', 8: 'walk:0' } },
  { name: 'finisher', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 7: 'walk:0', 8: 'walk:0' } },
  { name: 'jump', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 8: 'walk:0' } },
  { name: 'fall', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 7: 'fall:6', 8: 'walk:0' } },
  { name: 'getup', count: 9, rows: 3, cols: 3, alias: { 0: 'fall:6', 8: 'walk:0' } },
  { name: 'misc', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 8: 'walk:0' } },
  { name: 'special', count: 9, rows: 3, cols: 3, alias: { 0: 'walk:0', 8: 'walk:0' } },
  { name: 'rider', count: 9, rows: 3, cols: 3, alias: { 8: 'rider:0' } },
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

/** Widest drawn figure (component bbox width) on a sheet - horizontal fits. */
function maxContentWidth(im) {
  let best = 0
  for (const c of alphaComponents(im, 96)) best = Math.max(best, c.x1 - c.x0 + 1)
  return best
}

const sheets = {}
const measured = {}
for (const [name, file] of Object.entries(SHEETS)) {
  const im = await pixelsOf(`${SRC}/${file}`)
  sheets[name] = im
  measured[name] = {
    guardHeight: cellContentHeight(im, 0),
    guardAltHeight: cellContentHeight(im, 8),
    downHeight: cellContentHeight(im, 3),
    maxContentHeight: maxContentHeight(im),
    maxContentWidth: maxContentWidth(im),
    sha256: createHash('sha256').update(readFileSync(`${SRC}/${file}`)).digest('hex'),
  }
}

// PER-SHEET scale (the accepted model is "one uniform scale PER SHEET").
// Factors come from the controlled standing-guard pose via TWO GEOMETRIC
// proxies: face-to-ground distance (measurements-raw.json guardScale.
// ground) and guard figure height (scale-compare.json ratios). The
// face-area proxy is recorded for corroboration only (expression/turn
// contamination). Rule - apply the mean ONLY when the two geometric
// proxies agree within 0.05 AND the mean differs from 1.0 by more than
// the ~0.05 resolution; otherwise factor 1. Sheets with no standing
// guard cell are UNVERIFIED (factor 1).
const evidence = JSON.parse(readFileSync(`${SRC}/measurements-raw.json`, 'utf8'))
const guardScale = evidence.guardScale ?? {}
const compare = JSON.parse(readFileSync(`${SRC}/scale-compare.json`, 'utf8'))
const heightRatio = compare.ratios ?? {}
const factors = {}
const status = {}
for (const name of Object.keys(SHEETS)) {
  const e = guardScale[name]
  const h = heightRatio[name]
  if (name === 'walk') {
    factors[name] = 1
    status[name] = 'reference sheet'
  } else if (!e || h === undefined) {
    factors[name] = 1
    status[name] = 'UNVERIFIED (guardScale or heightRatio missing) - factor 1'
  } else {
    const mean = Math.round(((e.ground + h) / 2) * 1000) / 1000
    const spread = Math.abs(e.ground - h)
    if (spread <= 0.05 && Math.abs(1 - mean) > 0.05) {
      factors[name] = mean
      status[name] = `applied: geometric proxies agree (ground ${e.ground}, height ${h}; face ${e.face} corroborates differently - expression-contaminated)`
    } else if (spread > 0.05) {
      factors[name] = 1
      status[name] = `UNRESOLVED: proxies disagree (spread ${Math.round(spread * 1000) / 1000} > 0.05; ground ${e.ground}, height ${h}, face ${e.face}) - factor 1`
    } else {
      factors[name] = 1
      status[name] = `UNRESOLVED: geometric mean ${mean} within resolution (ground ${e.ground}, height ${h}, face ${e.face}) - factor 1`
    }
  }
}
// Pack base scale: every drawing, AFTER its sheet factor, fits its cell in
// BOTH axes. Vertical anchor is the ground line (content bottom lands at
// groundY*DENSITY, so the height cap is groundY*DENSITY - pad, not
// height*DENSITY - 2*pad - those coincide only for the mook box where
// groundY = height - 2). Horizontal centre anchor gives width*DENSITY/2
// each side. The wide pike poses bind horizontally (jab1:2's extension is
// 528px raw content) and the rider mount binds vertically.
const CONTENT_CAP = BOX.groundY * DENSITY - TRIM_PAD - 2
const WIDTH_CAP = BOX.width * DENSITY - 2 * TRIM_PAD - 2
const base = Math.min(...Object.keys(SHEETS).map((n) => Math.min(
  CONTENT_CAP / (measured[n].maxContentHeight * factors[n]),
  WIDTH_CAP / (measured[n].maxContentWidth * factors[n]),
)))
const sheetScale = Object.fromEntries(Object.keys(SHEETS).map((n) => [n, Math.floor(base * factors[n] * 1e6) / 1e6]))
const standing = ['walk', 'jab1', 'jab2', 'finisher', 'jump', 'fall', 'getup', 'misc', 'special'].map((n) => measured[n].guardHeight)
const meanStanding = standing.reduce((a, b) => a + b, 0) / standing.length
for (const name of Object.keys(SHEETS)) {
  measured[name].scale = sheetScale[name]
  measured[name].scaleFactor = factors[name]
  measured[name].scaleEvidence = status[name]
}
console.log(`base scale ${base.toFixed(6)} (every drawing after factor fits its cell in both axes; height cap ${CONTENT_CAP}, width cap ${WIDTH_CAP})`)
for (const name of Object.keys(SHEETS)) {
  console.log(`  ${name.padEnd(9)} factor ${factors[name]}  scale ${sheetScale[name]}  ${status[name]}`)
}
console.log(`standing guard bbox heights ${standing.join('/')}px (mean ${meanStanding.toFixed(0)}; pike overhang varies - not used as scale)`)

const registration = measured

const fighter = {
  id: 'zhangfei',
  role: 'hero',
  density: DENSITY,
  box: BOX,
  revision: 'zhangfei-1',
  // Generated sheets carry low-alpha glow around figures; cleanup removes
  // it (alpha-only, never eating near-black costume). The tolerance only
  // trips on gross residue.
  cleanup: { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 },
  sequences: SEQUENCES.map((s) => ({ ...s, registration: { scale: sheetScale[s.name] } })),
}

const pack = preparePack(fighter, sheets)
const paths = writePackOutputs(fighter, pack, { outputRoot: OUT })

// Registration record (the accepted "registration.json" pattern).
mkdirSync(SRC, { recursive: true })
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'zhangfei',
  model: 'one uniform scale PER SHEET (guard face-to-ground + guard-height factors vs walk) + cell-centre/ground anchors; shared bookends by alias',
  box: BOX,
  density: DENSITY,
  contentCapPx: CONTENT_CAP,
  widthCapPx: WIDTH_CAP,
  sheets: registration,
  aliases: Object.fromEntries(SEQUENCES.map((s) => [s.name, s.alias])),
}, null, 2)}\n`)

// Determinism check: the whole pipeline must be re-runnable to the same
// manifest identity.
const again = preparePack(fighter, sheets)
const deterministic = again.manifestSha256 === pack.manifestSha256

// Honest decode accounting: the tool's budget metric sums every frame's
// trim (aliased bookends carry their target's trim and are counted twice);
// the pixels that actually decode are the packed pages. Report both plus
// the alias-deduped sum so the <=16MiB cap is judged on real decode.
const uniqueFrames = pack.frames.filter((f) => !f.aliasOf)
const sumAll = pack.frames.reduce((a, f) => a + f.trim.w * f.trim.h * 4, 0)
const sumUnique = uniqueFrames.reduce((a, f) => a + f.trim.w * f.trim.h * 4, 0)
const pagePixels = pack.pages.reduce((a, p) => a + p.width * p.height * 4, 0)

console.log('--- zhangfei pack report ---')
console.log('manifest sha256:', pack.manifestSha256, deterministic ? '(deterministic)' : '(NOT DETERMINISTIC)')
console.log('frames:', pack.frames.length, `(${uniqueFrames.length} unique + ${pack.frames.length - uniqueFrames.length} alias)`, '| pages:', pack.pages.map((p) => `${p.name} ${p.width}x${p.height}`).join(', '))
console.log('counts:', JSON.stringify(pack.report.counts))
console.log('budget:', JSON.stringify(pack.budget))
console.log(`decode accounting: sum-all-frames ${sumAll} B (tool metric, aliases double-counted) | sum-unique-trims ${sumUnique} B | page pixels ${pagePixels} B (actual decode) | cap ${16 * 1024 * 1024} B`)
console.log('suspects:', pack.report.suspects.length)
console.log('outputs:', paths.output)
if (!deterministic) {
  console.log('DEFECT: preparation is not deterministic')
  process.exit(1)
}
