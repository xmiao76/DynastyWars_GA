#!/usr/bin/env node
// CMR-09A: prepare the Zhang Fei pack from the ten accepted sheets.
//
//   node scripts/prepare-zhangfei.mjs
//
// OWNER DECISION 2026-10-02 (option c): budget-driven pose counts. The
// sheets stay untouched on disk; culling happens IN MEMORY on the prepare
// inputs: (i) shared bookend duplicates (their pixels were never displayed -
// guards and DOWN come from walk:0 / the fall DOWN by clip convention, the
// same pattern as Guan Yu's clips) and (ii) redundant in-betweens/recoveries
// the clip table can hold through. Positions map to source cells via the
// pipeline's explicit `order`, and frame names are seq:0..count-1.
//
// Registration model (the accepted one): ONE uniform scale per sheet from
// the two-proxy guard evidence, cell-centre/ground anchors, and a
// budget-aware base scale: the largest base that fits BOTH axes of the
// 260x144 art cell (the 丈八蛇矛 is the roster's longest weapon, so the
// registration cell is wider than Guan Yu's 224) AND the 16MiB decoded
// budget on the pipeline's own metric. Deterministic double-run at the end.
// No runtime catalog activation (CMR-09B).

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import {
  DENSITY,
  DECODED_CAP,
  TRIM_PAD,
  alphaComponents,
  preparePack,
  writePackOutputs,
} from './motion-pipeline.mjs'

const SRC = 'art/motion/zhangfei'
const OUT = 'artifacts/motion/zhangfei'

// Hero art cell, widened from the Guan Yu reference 224x144/groundY 136:
// horizontal full-extension pike strikes (jab1:2 649px, jab2:2 698px raw)
// need the extra width to register at hero scale. Registration frame only -
// the pivot stays centre/ground and no displayed pixel changes by it.
const BOX = { width: 260, height: 144, groundY: 136 }

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

// Kept source cells per sequence (row-major 0..8), in clip order. Everything
// else on the sheet is culled from the prepare input. The walk cycle keeps
// all 8 poses (the signature motion); strike/impact/DOWN money poses are
// kept; culled cells are guard/DOWN bookend duplicates (0/7/8) plus one
// redundant recovery/in-between per action where the clip can hold.
const KEEP = {
  walk: [0, 1, 2, 3, 4, 5, 6, 7, 8], // guard + genuine 8-pose cycle (no bookends)
  jab1: [1, 2, 3, 4, 5], // windup, drive, extension, follow, recover (guards+recover2 dup)
  jab2: [1, 2, 3, 4, 5], // low chamber, drive, extension, follow, recover
  finisher: [1, 2, 3, 4, 5], // coil, launch, bridge, impact, follow
  jump: [1, 2, 3, 4, 5, 7], // takeoff, ascent, apex, kick, descent, landing (contact cut)
  fall: [1, 2, 3, 4, 6], // topple, airborne, tumble, impact, DOWN (settle cut)
  getup: [1, 2, 3, 4, 5], // elbow, kneel, crouch, half-rise, stand
  misc: [1, 2, 5, 6, 7], // hurt recoil, hurt fold (=grabbed), clamp, hold, release
  special: [1, 2, 3, 4, 5], // raise, coil, pre-spin, strike, follow
  rider: [0, 1, 3, 4, 5, 7], // idle, trotA, mount, sweep, windup, dismount (trotB+recover cut)
}

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

/** Cell (row-major) a component's centroid belongs to. */
function cellOf(im, c) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx = Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cellW))
  const cy = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / cellH))
  return cy * 3 + cx
}

/**
 * Cull a sheet IN MEMORY: zero each culled drawing's solid pixels plus its
 * sub-threshold halo near the drawing (kept drawings' solid pixels survive -
 * they may straddle into a culled cell's territory; their own halos are the
 * alpha-only glow the pipeline removes anyway). Originals stay untouched.
 */
function cullInMemory(im, keep) {
  const keepSet = new Set(keep)
  const comps = alphaComponents(im, 96)
  const culledCells = []
  for (const c of comps) {
    const cell = cellOf(im, c)
    if (keepSet.has(cell)) continue
    culledCells.push(cell)
    for (const p of c.pixels) im.data[p * 4 + 3] = 0
    const G = 8
    for (let y = Math.max(0, c.y0 - G); y <= Math.min(im.height - 1, c.y1 + G); y++) {
      for (let x = Math.max(0, c.x0 - G); x <= Math.min(im.width - 1, c.x1 + G); x++) {
        const k = (y * im.width + x) * 4 + 3
        if (im.data[k] < 96) im.data[k] = 0
      }
    }
  }
  return culledCells.sort((a, b) => a - b)
}

// ---- load, cull, measure kept drawings ------------------------------------
const sheets = {}
const culledCellsBy = {}
const rawDims = {} // `${seq}:${pos}` -> { w, h, seq }
const measured = {}
for (const [name, file] of Object.entries(SHEETS)) {
  const im = await pixelsOf(`${SRC}/${file}`)
  culledCellsBy[name] = cullInMemory(im, KEEP[name])
  sheets[name] = im
  const comps = alphaComponents(im, 96)
  const byCell = new Map()
  for (const c of comps) byCell.set(cellOf(im, c), c)
  const keep = KEEP[name]
  for (let i = 0; i < keep.length; i++) {
    const c = byCell.get(keep[i])
    if (!c) throw new Error(`${name}: kept cell ${keep[i]} has no drawing after culling`)
    rawDims[`${name}:${i}`] = { w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1, seq: name }
  }
  measured[name] = {
    keptCells: keep,
    culledCells: culledCellsBy[name],
    sha256: createHash('sha256').update(readFileSync(`${SRC}/${file}`)).digest('hex'),
  }
}

// ---- per-sheet scale factors (the accepted two-proxy rule) ----------------
// Evidence from the drawn standing guards (measure-zhangfei.mjs; the guards
// are culled from the pack but remain valid scale evidence in the sources):
// factor = mean of guard face-to-ground and guard-height ratios vs walk,
// applied ONLY when the two agree within 0.05 and the mean is off 1.0 by
// more than the ~0.05 resolution. Otherwise factor 1 (recorded as such).
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
      status[name] = `applied: two geometric proxies agree (ground ${e.ground}, height ${h})`
    } else if (spread > 0.05) {
      factors[name] = 1
      status[name] = `UNRESOLVED: proxies disagree (spread ${Math.round(spread * 1000) / 1000} > 0.05; ground ${e.ground}, height ${h}) - factor 1`
    } else {
      factors[name] = 1
      status[name] = `UNRESOLVED: mean ${mean} within resolution (ground ${e.ground}, height ${h}) - factor 1`
    }
  }
}

// ---- budget-aware base scale ---------------------------------------------
// Fit bound: every kept drawing, after its sheet factor, fits the art cell
// (ground-anchored vertically, centre-anchored horizontally). Budget bound:
// the largest base whose summed trims fit DECODED_CAP on the pipeline's own
// metric (trim area x4 over every frame record). Bisect with the exact
// rounded trim sizes the pipeline will compute.
const CONTENT_CAP = BOX.groundY * DENSITY - TRIM_PAD - 2
const WIDTH_CAP = BOX.width * DENSITY - 2 * TRIM_PAD - 2
const frameList = Object.entries(rawDims)
let fitBound = Infinity
for (const [, d] of frameList) {
  const f = factors[d.seq]
  fitBound = Math.min(fitBound, CONTENT_CAP / (d.h * f), WIDTH_CAP / (d.w * f))
}
const trimBytesAt = (b) => {
  let sum = 0
  for (const [, d] of frameList) {
    const s = b * factors[d.seq]
    const w = Math.round(s * d.w) + 2 * TRIM_PAD
    const h = Math.round(s * d.h) + 2 * TRIM_PAD
    sum += w * h * 4
  }
  return sum
}
let lo = 0.2, hi = fitBound
for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2
  if (trimBytesAt(mid) <= DECODED_CAP) lo = mid
  else hi = mid
}
const budgetBound = lo
const base = Math.floor(Math.min(fitBound, budgetBound) * 1e6) / 1e6
const sheetScale = Object.fromEntries(Object.keys(SHEETS).map((n) => [n, Math.floor(base * factors[n] * 1e6) / 1e6]))
for (const name of Object.keys(SHEETS)) {
  measured[name].scale = sheetScale[name]
  measured[name].scaleFactor = factors[name]
  measured[name].scaleEvidence = status[name]
}
const walkGuardPx = rawDims['walk:0'].h * sheetScale.walk
console.log(`base scale ${base.toFixed(6)} (fit bound ${fitBound.toFixed(6)}, budget bound ${budgetBound.toFixed(6)})`)
console.log(`caps: height ${CONTENT_CAP} width ${WIDTH_CAP} | frames ${frameList.length} | trim sum at base ${trimBytesAt(base)} B <= ${DECODED_CAP} B`)
console.log(`walk guard fitted height ${walkGuardPx.toFixed(1)}px = ${(100 * walkGuardPx / 240).toFixed(1)}% of Guan Yu 240px (mook archer 223px)`)
for (const name of Object.keys(SHEETS)) {
  console.log(`  ${name.padEnd(9)} factor ${factors[name]}  scale ${sheetScale[name]}  kept ${KEEP[name].join(',')}  culled ${(culledCellsBy[name] ?? []).join(',') || '-'}`)
}

const fighter = {
  id: 'zhangfei',
  role: 'hero',
  density: DENSITY,
  box: BOX,
  revision: 'zhangfei-1',
  cleanup: { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 },
  sequences: Object.keys(SHEETS).map((name) => ({
    name,
    count: KEEP[name].length,
    rows: 3,
    cols: 3,
    order: KEEP[name],
    registration: { scale: sheetScale[name] },
  })),
}

const pack = preparePack(fighter, sheets)
const paths = writePackOutputs(fighter, pack, { outputRoot: OUT })

// Registration record: cell map (position -> source cell -> label), cull
// list, factors and the budget-aware fit, so CMR-09B can build the exact
// clip exposures and a later re-prepare reproduces this pack exactly.
const LABELS = {
  walk: ['guard', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'],
  jab1: ['windup', 'drive', 'extension', 'follow', 'recover'],
  jab2: ['chamber-low', 'drive', 'extension', 'follow', 'recover'],
  finisher: ['coil', 'launch', 'bridge', 'impact', 'follow'],
  jump: ['takeoff', 'ascent', 'apex', 'kick', 'descent', 'landing'],
  fall: ['topple', 'airborne', 'tumble', 'impact', 'DOWN'],
  getup: ['elbow', 'kneel', 'crouch', 'half-rise', 'stand'],
  misc: ['hurt-recoil', 'hurt-fold', 'grab-clamp', 'grab-hold', 'release'],
  special: ['raise', 'coil', 'pre-spin', 'strike', 'follow'],
  rider: ['idle', 'trot', 'mount', 'sweep', 'sweep-windup', 'dismount'],
}
mkdirSync(SRC, { recursive: true })
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'zhangfei',
  ownerDecision: '2026-10-02 option (c): budget-driven pose counts (21 shared bookend duplicates + 13 redundant in-betweens culled in memory; sources untouched)',
  model: 'one uniform scale PER SHEET (two-proxy guard evidence) + cell-centre/ground anchors; budget-aware base (largest base fitting both cell axes and the 16MiB decoded metric)',
  box: BOX,
  density: DENSITY,
  contentCapPx: CONTENT_CAP,
  widthCapPx: WIDTH_CAP,
  fitBound,
  budgetBound,
  base,
  guanyuWalkGuardPx: 240,
  mookArcherGuardPx: 223,
  walkGuardFittedPx: walkGuardPx,
  sheets: measured,
  layout: Object.fromEntries(Object.keys(SHEETS).map((n) => [n, {
    positions: KEEP[n].map((cell, i) => ({ position: i, cell, label: LABELS[n][i] })),
    culledCells: measured[n].culledCells,
  }])),
}, null, 2)}\n`)

// Determinism check: the whole pipeline must be re-runnable to the same
// manifest identity.
const again = preparePack(fighter, sheets)
const deterministic = again.manifestSha256 === pack.manifestSha256

const uniqueFrames = pack.frames.filter((f) => !f.aliasOf)
const sumAll = pack.frames.reduce((a, f) => a + f.trim.w * f.trim.h * 4, 0)
const sumUnique = uniqueFrames.reduce((a, f) => a + f.trim.w * f.trim.h * 4, 0)
const pagePixels = pack.pages.reduce((a, p) => a + p.width * p.height * 4, 0)

console.log('--- zhangfei pack report ---')
console.log('manifest sha256:', pack.manifestSha256, deterministic ? '(deterministic)' : '(NOT DETERMINISTIC)')
console.log('frames:', pack.frames.length, `(${uniqueFrames.length} unique)`, '| pages:', pack.pages.map((p) => `${p.name} ${p.width}x${p.height}`).join(', '))
console.log('counts:', JSON.stringify(pack.report.counts))
console.log('budget:', JSON.stringify(pack.budget))
console.log(`decode accounting: records ${sumAll} B | unique-trims ${sumUnique} B | page pixels ${pagePixels} B | cap ${DECODED_CAP} B`)
console.log('suspects:', pack.report.suspects.length)
console.log('outputs:', paths.output)
if (!deterministic) {
  console.log('DEFECT: preparation is not deterministic')
  process.exit(1)
}
