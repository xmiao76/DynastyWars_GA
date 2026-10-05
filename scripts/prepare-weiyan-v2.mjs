#!/usr/bin/env node
// CMR-11A: prepare the Wei Yan pack from the ten ACCEPTED V2 sheets
// (correct long-handled dao; the v1 short-dao pack is superseded but
// reproducible via scripts/prepare-weiyan.mjs + v1 sources).
//
//   node scripts/prepare-weiyan-v2.mjs
//
// Keep maps come from PROVENANCE.md (row-major keeps, spare remaps,
// SHA-pinned splices and deterministic retouches; see KEEP table).
// Culling happens IN MEMORY, sources stay untouched. Positions map via
// the pipeline's explicit `order`, frame names seq:0..count-1.
//
// Registration model: ONE uniform scale per sheet (two-proxy guard
// evidence when measured; factor 1 UNVERIFIED until then),
// cell-centre/ground anchors, and a PAGE-AWARE base scale (the CMR-09B
// lesson: the runtime metric is packed page pixels, not trims - the
// solver targets trims under cap/1.28 measured slack and then VERIFIES
// packed pages, stepping down on miss). 16MB-FIRST: no exception is
// presumed (a zhaoyun-pattern per-pack exception needs measured proof
// plus an explicit owner option); escalate only with a proven
// contradiction. No runtime catalog activation (CMR-11B).

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

const SRC = 'art/motion/weiyan'
const OUT = 'artifacts/motion/weiyan'

// Hero art cell (same 260x144/groundY 136 registration frame as Zhang
// Fei and Zhao Yun: the sheets share the format/scale, so the fit math
// is directly comparable). Registration frame only - the pivot stays
// centre/ground.
const BOX = { width: 260, height: 144, groundY: 136 }

const SHEETS = {
  walk: 'walk-v2-candidate-1.png',
  jab1: 'jab1-v2-prepared-source.png',
  jab2: 'jab2-v2-prepared-source.png',
  finisher: 'finisher-v2-prepared-source.png',
  jump: 'jump-v2-retouched-source.png',
  fall: 'fall-v2-retouched-source.png',
  getup: 'getup-v2-prepared-source.png',
  misc: 'misc-v2-prepared-source.png',
  special: 'special-v2-prepared-source.png',
  rider: 'rider-v2-retouched-source.png',
}

// Kept source cells per sequence (row-major 0..8), IN PLAY ORDER.
// Everything else is culled in memory.
const KEEP = {
  walk: [0, 1, 2, 3, 4, 5, 6, 7, 8], // guard + genuine 8-pose cycle
  jab1: [0, 1, 2, 3, 4], // windup, drive, extension, follow, recover (1,2 spliced)
  jab2: [0, 1, 2, 3, 4], // low chamber, drive, extension, follow, recover (2,3 spliced)
  finisher: [0, 1, 3, 6, 4], // coil, launch, extension, follow, recover (cull derivative)
  jump: [0, 1, 2, 6, 4, 5], // takeoff (spliced), ascent, apex, kick (spare), descent, landing (retouched)
  fall: [0, 1, 2, 3, 4], // topple, airborne, tumble (extended), impact, DOWN (shortened)
  getup: [6, 1, 8, 3, 4], // elbow-push, kneel, crouch, half-rise, stand (spare remap)
  misc: [0, 1, 2, 7, 4], // hurt-recoil, hurt-fold, grab-clamp, grab-hold (spare), release
  special: [0, 1, 8, 3, 4], // raise, coil, pre-spin (spare), strike, follow
  rider: [0, 1, 2, 3, 4, 5], // idle, trot, mount, windup, sweep (spliced), dismount (spliced+retouched)
}

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

/** Cell (row-major) a component's centroid belongs to (all sheets 3x3). */
function cellOf(im, c) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx = Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cellW))
  const cy = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / cellH))
  return cy * 3 + cx
}

/**
 * Cull a sheet IN MEMORY: zero each culled drawing's solid pixels plus its
 * sub-threshold halo near the drawing. Originals stay untouched.
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

// NOTE (ghosts): an owner-masking rebuild was tried here and REVERTED:
// it is a proven no-op (identical manifest) because ghost pixels enter
// through fit-shifted trim windows, not source-rect adjacency. Ghost
// slivers from kept<->kept straddles (v1 measured 14/56 here; v2 value
// unverified, 17/56 zhangfei) are a
// SHARED pipeline defect (raw-rect trims): documented for producer
// triage in PROVENANCE.md, not fixed by fighter-local preprocessing.

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
  // Largest-wins per cell: kept cells also hold sub-threshold haze
  // fragments and specks, and last-wins mapping measured a 1px speck
  // as the walk guard (0.6px fitted height) on the first run. The
  // kept drawing is always the largest component in its cell.
  const byCell = new Map()
  for (const c of comps) {
    const cell = cellOf(im, c)
    if (!byCell.has(cell) || c.area > byCell.get(cell).area) byCell.set(cell, c)
  }
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
// V2 guard measurements land in a follow-up turn (measurements-v2-raw.json
// + scale-compare-v2.json); until then every non-walk sheet is UNVERIFIED at
// factor 1 and the first pack reports it honestly. V1 measurement files are
// NOT read (different art).
let guardScale = {}
let heightRatio = {}
try {
  guardScale = JSON.parse(readFileSync(`${SRC}/measurements-v2-raw.json`, 'utf8')).guardScale ?? {}
  heightRatio = JSON.parse(readFileSync(`${SRC}/scale-compare-v2.json`, 'utf8')).ratios ?? {}
} catch {
  // Not measured yet: all factors stay 1 (UNVERIFIED) below.
}
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

// ---- page-aware base scale ------------------------------------------------
// 16MB-FIRST (CMR-11A plan): no exception presumed - the long dao must
// still fit the contract cap. Escalate to owner options only with a
// proven contradiction (measured bounds). Not a cap raise (no override).
const PAGE_CAP = DECODED_CAP
// Fit bound: every kept drawing, after its sheet factor, fits the art cell
// (ground-anchored vertically, centre-anchored horizontally). Budget bound:
// the largest base whose summed trims fit PAGE_CAP / PACK_SLACK - the
// CMR-09B lesson is that the runtime metric is PACKED PAGE pixels, and
// prior packs measured single-page overhead ~1.24x, so 1.28 targets pages
// with margin. Bisect with the exact rounded trim sizes the pipeline will
// compute; the post-pack page check below is the hard gate (no silent
// over-cap packs).
const PACK_SLACK = 1.28
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
  if (trimBytesAt(mid) <= PAGE_CAP / PACK_SLACK) lo = mid
  else hi = mid
}
const budgetBound = lo
// 1% margin so the first preparePack attempt passes the pipeline's trim
// gate (the solver's estimate runs slightly under the pipeline's own
// rounding chain); the step-down loop below is the small backup.
let base = Math.floor(Math.min(fitBound, budgetBound) * 0.99 * 1e6) / 1e6
let sheetScale = Object.fromEntries(Object.keys(SHEETS).map((n) => [n, Math.floor(base * factors[n] * 1e6) / 1e6]))
for (const name of Object.keys(SHEETS)) {
  measured[name].scale = sheetScale[name]
  measured[name].scaleFactor = factors[name]
  measured[name].scaleEvidence = status[name]
}
const walkGuardPx = rawDims['walk:0'].h * sheetScale.walk
console.log(`base scale ${base.toFixed(6)} (fit bound ${fitBound.toFixed(6)}, budget bound ${budgetBound.toFixed(6)})`)
console.log(`caps: height ${CONTENT_CAP} width ${WIDTH_CAP} | frames ${frameList.length} | trim sum at base ${trimBytesAt(base)} B (page-aware target ${(PAGE_CAP / PACK_SLACK).toFixed(0)} B, page cap ${PAGE_CAP} B)`)
console.log(`walk guard fitted height ${walkGuardPx.toFixed(1)}px = ${(100 * walkGuardPx / 240).toFixed(1)}% of Guan Yu 240px (mook archer 223px)`)
for (const name of Object.keys(SHEETS)) {
  console.log(`  ${name.padEnd(9)} factor ${factors[name]}  scale ${sheetScale[name]}  kept ${KEEP[name].join(',')}  culled ${(culledCellsBy[name] ?? []).join(',') || '-'}`)
}

const buildFighter = () => ({
  id: 'weiyan',
  role: 'hero',
  density: DENSITY,
  box: BOX,
  revision: 'weiyan-2',
  // NO decodedCapBytes: 16MB-first (the long dao must still fit the
  // contract cap); escalate only with a proven contradiction.
  cleanup: { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 },
  sequences: Object.keys(SHEETS).map((name) => ({
    name,
    count: KEEP[name].length,
    rows: 3,
    cols: 3,
    order: KEEP[name],
    registration: { scale: sheetScale[name] },
  })),
})

// Retry loop: the pipeline's trim gate AND the post-pack page-pixel gate
// (the runtime metric). Page misses step the base down the same way;
// persistent misses mean a pose-count cut (honest BLOCKED input, per the
// authoring plan - never a silent over-cap pack).
let fighter = buildFighter()
let pack
let budgetRetries = 0
for (;;) {
  try {
    pack = preparePack(fighter, sheets)
  } catch (e) {
    if (!String(e?.message ?? '').includes('budget:') || budgetRetries >= 4) throw e
    budgetRetries++
    base = Math.floor((base - 0.002) * 1e6) / 1e6
    sheetScale = Object.fromEntries(Object.keys(SHEETS).map((n) => [n, Math.floor(base * factors[n] * 1e6) / 1e6]))
    for (const name of Object.keys(SHEETS)) measured[name].scale = sheetScale[name]
    fighter = buildFighter()
    continue
  }
  const pagePx = pack.pages.reduce((a, p) => a + p.width * p.height * 4, 0)
  if (pagePx <= PAGE_CAP) break
  if (budgetRetries >= 4) {
    throw new Error(`budget: page pixels ${pagePx} exceed ${PAGE_CAP} after ${budgetRetries} step-downs (base ${base}); pose-count cut required`)
  }
  budgetRetries++
  base = Math.floor((base - 0.002) * 1e6) / 1e6
  sheetScale = Object.fromEntries(Object.keys(SHEETS).map((n) => [n, Math.floor(base * factors[n] * 1e6) / 1e6]))
  for (const name of Object.keys(SHEETS)) measured[name].scale = sheetScale[name]
  fighter = buildFighter()
}
const walkGuardFinalPx = rawDims['walk:0'].h * sheetScale.walk
console.log(`FINAL base ${base.toFixed(6)} after ${budgetRetries} budget step-down(s) | walk guard ${walkGuardFinalPx.toFixed(1)}px = ${(100 * walkGuardFinalPx / 240).toFixed(1)}% of Guan Yu (mook archer 223px)`)
const paths = writePackOutputs(fighter, pack, { outputRoot: OUT })

// Registration record: cell map (position -> source cell -> label), cull
// list, factors and the page-aware fit, so CMR-10B can build the exact
// clip exposures and a later re-prepare reproduces this pack exactly.
const LABELS = {
  walk: ['guard', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'],
  jab1: ['windup', 'drive', 'extension', 'follow', 'recover'],
  jab2: ['chamber-low', 'drive', 'extension', 'follow', 'recover'],
  finisher: ['coil', 'launch', 'extension', 'follow', 'recover'],
  jump: ['takeoff', 'ascent', 'apex', 'kick', 'descent', 'landing'],
  fall: ['topple', 'airborne', 'tumble', 'impact', 'DOWN'],
  getup: ['elbow', 'kneel', 'crouch', 'half-rise', 'stand'],
  misc: ['hurt-recoil', 'hurt-fold', 'grab-clamp', 'grab-hold', 'release'],
  special: ['raise', 'coil', 'pre-spin', 'strike', 'follow'],
  rider: ['idle', 'trot', 'mount', 'sweep-windup', 'sweep', 'dismount'],
}
mkdirSync(SRC, { recursive: true })
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'weiyan',
  revision: 'weiyan-2', // supersedes the v1 short-dao registration (kept in git history)
  model: 'one uniform scale PER SHEET (two-proxy guard evidence when measured; factor 1 UNVERIFIED until then) + cell-centre/ground anchors; page-aware base (largest base fitting both cell axes with trims under cap/1.28 packing slack, then packed pages verified under the 16MiB contract)',
  box: BOX,
  density: DENSITY,
  contentCapPx: CONTENT_CAP,
  widthCapPx: WIDTH_CAP,
  packSlack: PACK_SLACK,
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

console.log('--- weiyan pack report ---')
console.log('manifest sha256:', pack.manifestSha256, deterministic ? '(deterministic)' : '(NOT DETERMINISTIC)')
console.log('frames:', pack.frames.length, `(${uniqueFrames.length} unique)`, '| pages:', pack.pages.map((p) => `${p.name} ${p.width}x${p.height}`).join(', '))
console.log('counts:', JSON.stringify(pack.report.counts))
console.log('budget:', JSON.stringify(pack.budget))
console.log(`decode accounting: records ${sumAll} B | unique-trims ${sumUnique} B | page pixels ${pagePixels} B | cap ${PAGE_CAP} B (contract cap, 16MB-first) | contract ${DECODED_CAP} B`)
console.log('suspects:', pack.report.suspects.length)
console.log('outputs:', paths.output)
if (!deterministic) {
  console.log('DEFECT: preparation is not deterministic')
  process.exit(1)
}
