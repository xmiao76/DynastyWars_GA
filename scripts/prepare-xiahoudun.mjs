#!/usr/bin/env node
// CMR-14A: OFFLINE preparation of the Xiahou Dun pack (no runtime/catalog
// activation, no CMR-14B).
//
//   node scripts/prepare-xiahoudun.mjs
//
// Modelled on scripts/prepare-lidian.mjs and the shared motion pipeline.
//
// Inventory (authoritative):
//   art/motion/xiahoudun/closeout-campaign/source-status.json (banked +
//   fixedSources), finish-batch-results.json (six new finished rasters),
//   CONSOLIDATED-DECISION.md (rulings).
//
// Banked 3x3 sheets (native scale, gameplay .66 at density 2):
//   walk   walk-projection-corrected-source.png  cells 0..8
//   charge charge-paint-harmonized-2-source.png  cells 0..4 (spares 5..8
//          culled in memory; keep map = charge-registration-candidate.json
//          anchors charge:0..4 -> cells 0..4)
//   combo  combo-round4-spliced-source.png       cells 0..4 (spares 5..8
//          culled in memory; keep map = combo-prompt.txt brief "cells 0-4
//          core in order ... Cells 5-8 spares")
//   heavy  heavy-fig1-slid-source.png            cells 0..4 (5..8 empty)
//
// misc/fall/getup: finished density-2 rasters (owner whole-source q,
// rendered at 0.66*q*2) placed UNSCALED into in-memory 3x3 container
// sheets (cells 0..4 in play order). Those rasters equal walk-sheet
// pixels x 1.32, so their per-sheet scale is walkScale / 1.32. getup:0
// (DOWN) aliases fall:4 through sequence.alias: one shared atlas rect.
//
// Originals are never written; composed container sheets are saved for
// provenance under closeout-campaign/pack-sheets/.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import {
  DENSITY,
  DECODED_CAP,
  PAGE_LIMIT,
  TRIM_PAD,
  alphaComponents,
  preparePack,
  writePackOutputs,
} from './motion-pipeline.mjs'

const SRC = 'art/motion/xiahoudun'
const OUT = 'artifacts/motion/xiahoudun'
const PACK_SHEETS = `${SRC}/closeout-campaign/pack-sheets`
const REVIEW = `${OUT}/review`

// Hero registration frame (same as Li Dian / heroes). Presentation frame
// only: no gameplay or collision data is derived from it here.
const BOX = { width: 260, height: 144, groundY: 136 }

const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const fileSha = (path) => sha(readFileSync(path))

// ---- inventory --------------------------------------------------------------
const status = JSON.parse(readFileSync(`${SRC}/closeout-campaign/source-status.json`, 'utf8'))
const finish = JSON.parse(readFileSync(`${SRC}/closeout-campaign/finish-batch-results.json`, 'utf8'))

const BANKED = {
  walk: { file: `${SRC}/walk-projection-corrected-source.png`, keep: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  charge: { file: `${SRC}/charge-paint-harmonized-2-source.png`, keep: [0, 1, 2, 3, 4] },
  combo: { file: `${SRC}/combo-round4-spliced-source.png`, keep: [0, 1, 2, 3, 4] },
  heavy: { file: `${SRC}/heavy-fig1-slid-source.png`, keep: [0, 1, 2, 3, 4] },
}
for (const [name, b] of Object.entries(BANKED)) {
  const rec = status.banked.find((r) => r.source.path === b.file.replace(`${SRC}/`, 'art/motion/xiahoudun/'))
  if (!rec) throw new Error(`${name}: banked source ${b.file} not in source-status.json`)
  const got = fileSha(b.file)
  if (got !== rec.source.sha256) throw new Error(`${name}: ${b.file} sha ${got} != inventory ${rec.source.sha256}`)
  b.sha256 = got
  b.inventoryStatus = rec.status
  b.limitations = rec.limitations
}

// Raster ids in play order for the composed sheets.
const COMPOSED = {
  misc: ['misc:0', 'misc:1', 'misc:2', 'misc:3', 'misc:4'],
  fall: ['fall:0', 'fall:1', 'fall:2', 'fall:3', 'fall:4'],
  getup: ['getup:0', 'getup:1', 'getup:2', 'getup:3', 'getup:4'],
}
const COMMON_Q = 0.27655409211353954
function rasterFor(id) {
  const fixed = status.fixedSources.find((r) => r.id === id || r.id.split('/').includes(id))
  if (fixed) {
    return {
      id,
      inventoryId: fixed.id,
      path: fixed.proof.path,
      sha256: fixed.proof.sha256,
      q: fixed.q,
      inventory: 'source-status.json fixedSources',
      acceptance: fixed.acceptance,
      waiver: fixed.waiver ? fixed.waiver.path : null,
    }
  }
  const fin = finish.find((r) => r.drawingId === id)
  if (fin) {
    return {
      id,
      inventoryId: fin.drawingId,
      path: fin.raster,
      sha256: fin.rasterSha256,
      q: fin.q,
      inventory: 'finish-batch-results.json',
      acceptance: 'CONSOLIDATED-DECISION.md item 1 (owner q approved)',
      waiver: fin.weapon?.disposition ?? null,
    }
  }
  throw new Error(`no finished raster for ${id} in the inventory`)
}

// misc/fall/getup rasters = walk-sheet pixels x 1.32 (0.66 * 2 density).
const RASTER_TO_WALK = 0.66 * DENSITY

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

/** Compose one 3x3 container sheet from unscaled rasters (cells 0..4). */
async function composeSheet(name, ids) {
  const rasters = []
  for (const id of ids) {
    const r = rasterFor(id)
    if (Math.abs(r.q - COMMON_Q) > 1e-15) throw new Error(`${id}: q ${r.q} != common ${COMMON_Q}`)
    const got = fileSha(r.path)
    if (got !== r.sha256) throw new Error(`${id}: ${r.path} sha ${got} != inventory ${r.sha256}`)
    r.image = await loadImage(r.path)
    r.size = [r.image.width, r.image.height]
    rasters.push(r)
  }
  // Cell holds the largest raster of ALL composed sequences + margin, so
  // all three container sheets share one geometry.
  const cv = createCanvas(CELL_W * 3, CELL_H * 3)
  const g = cv.getContext('2d')
  rasters.forEach((r, i) => {
    const cx = (i % 3) * CELL_W + Math.floor((CELL_W - r.image.width) / 2)
    const cy = Math.floor(i / 3) * CELL_H + Math.floor((CELL_H - r.image.height) / 2)
    g.drawImage(r.image, cx, cy) // integer offset, natural size: no resampling
    r.placedAt = [cx, cy]
    delete r.image
  })
  const d = g.getImageData(0, 0, cv.width, cv.height)
  mkdirSync(PACK_SHEETS, { recursive: true })
  const png = cv.toBuffer('image/png')
  const path = `${PACK_SHEETS}/${name}-pack-sheet.png`
  writeFileSync(path, png)
  return {
    im: { width: d.width, height: d.height, data: d.data },
    meta: {
      composedSheet: path,
      composedPixelsSha256: sha(Buffer.from(d.data)),
      cell: [CELL_W, CELL_H],
      rasters: rasters.map((r) => ({ id: r.id, inventoryId: r.inventoryId, path: r.path, sha256: r.sha256, size: r.size, placedAt: r.placedAt, inventory: r.inventory, acceptance: r.acceptance, waiver: r.waiver })),
    },
  }
}

// Size the shared container cell from every raster used.
let maxW = 0, maxH = 0
for (const ids of Object.values(COMPOSED)) {
  for (const id of ids) {
    const im = await loadImage(rasterFor(id).path)
    maxW = Math.max(maxW, im.width)
    maxH = Math.max(maxH, im.height)
  }
}
const CELL_W = maxW + 32
const CELL_H = maxH + 32

// ---- cull (prepare-lidian.mjs pattern, in memory) ---------------------------
function cellOf(im, c) {
  const cellW = Math.floor(im.width / 3)
  const cellH = Math.floor(im.height / 3)
  const cx = Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / cellW))
  const cy = Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / cellH))
  return cy * 3 + cx
}
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

/**
 * Isolate banked drawings IN MEMORY: each kept drawing's solid component
 * (alpha >= 96, 8-connected, area > speckMaxPx - exactly the pixels the
 * pipeline's cleanAlpha keeps) is copied byte-exact, unscaled, at an integer
 * offset into its own cell of a fresh 3x3 container. This stops the
 * pipeline's rect copy from pulling a NEIGHBOUR's pixels into a frame where
 * bounds overlap (combo 1/2: cell-1 spearhead vs cell-2 figure). No paint,
 * no resampling; dropped pixels are the same sub-threshold/speck pixels
 * cleanAlpha removes anyway. Originals stay untouched.
 */
function isolateKept(im, keep) {
  const comps = alphaComponents(im, 96).filter((c) => c.area > 64)
  const byCell = new Map()
  for (const c of comps) {
    const cell = cellOf(im, c)
    if (!byCell.has(cell) || c.area > byCell.get(cell).area) byCell.set(cell, c)
  }
  const picked = keep.map((cell) => {
    const c = byCell.get(cell)
    if (!c) throw new Error(`isolate: kept cell ${cell} has no drawing`)
    return c
  })
  const cw = Math.max(...picked.map((c) => c.x1 - c.x0 + 1)) + 64
  const ch = Math.max(...picked.map((c) => c.y1 - c.y0 + 1)) + 64
  const out = { width: cw * 3, height: ch * 3, data: new Uint8ClampedArray(cw * 3 * ch * 3 * 4) }
  keep.forEach((cell, i) => {
    const c = picked[i]
    const ox = (cell % 3) * cw + Math.floor((cw - (c.x1 - c.x0 + 1)) / 2) - c.x0
    const oy = Math.floor(cell / 3) * ch + Math.floor((ch - (c.y1 - c.y0 + 1)) / 2) - c.y0
    for (const p of c.pixels) {
      const x = p % im.width, y = Math.floor(p / im.width)
      const s = p * 4, d = ((y + oy) * out.width + (x + ox)) * 4
      out.data[d] = im.data[s]; out.data[d + 1] = im.data[s + 1]; out.data[d + 2] = im.data[s + 2]; out.data[d + 3] = im.data[s + 3]
    }
  })
  return { im: out, cell: [cw, ch], droppedNonKept: comps.length - picked.length }
}

// ---- load sheets, measure kept drawings -------------------------------------
const ORDER = ['walk', 'charge', 'combo', 'heavy', 'misc', 'fall', 'getup']
const KEEP = {
  walk: BANKED.walk.keep,
  charge: BANKED.charge.keep,
  combo: BANKED.combo.keep,
  heavy: BANKED.heavy.keep,
  misc: [0, 1, 2, 3, 4],
  fall: [0, 1, 2, 3, 4],
  getup: [0, 1, 2, 3, 4],
}
const sheets = {}
const measured = {}
const rawDims = {}
for (const name of ORDER) {
  let im
  if (BANKED[name]) {
    im = await pixelsOf(BANKED[name].file)
    measured[name] = { source: BANKED[name].file, sha256: BANKED[name].sha256, inventoryStatus: BANKED[name].inventoryStatus, limitations: BANKED[name].limitations }
  } else {
    const c = await composeSheet(name, COMPOSED[name])
    im = c.im
    measured[name] = { source: 'composed in memory from finished density-2 rasters', ...c.meta }
  }
  measured[name].keptCells = KEEP[name]
  measured[name].culledCells = cullInMemory(im, KEEP[name])
  if (BANKED[name]) {
    const iso = isolateKept(im, KEEP[name])
    im = iso.im
    measured[name].isolatedContainer = { cell: iso.cell, method: 'solid alpha>=96 component per kept drawing, byte-exact integer translation, no resampling' }
  }
  sheets[name] = im
  const byCell = new Map()
  for (const c of alphaComponents(im, 96)) {
    const cell = cellOf(im, c)
    if (!byCell.has(cell) || c.area > byCell.get(cell).area) byCell.set(cell, c)
  }
  KEEP[name].forEach((cell, i) => {
    const c = byCell.get(cell)
    if (!c) throw new Error(`${name}: kept cell ${cell} has no drawing`)
    rawDims[`${name}:${i}`] = { w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1, seq: name }
  })
}

// ---- per-sheet factors (relative to walk) -----------------------------------
const factors = {
  walk: 1,
  charge: 1,
  combo: 1,
  heavy: 1,
  misc: 1 / RASTER_TO_WALK,
  fall: 1 / RASTER_TO_WALK,
  getup: 1 / RASTER_TO_WALK,
}
const evidence = {
  walk: 'reference sheet (band anchor; pack-projection.json walk scale 1)',
  charge: 'factor 1 DOCUMENTED: charge-registration-candidate.json uses ONE raw->art scale 0.66 for walk AND charge; pack-projection.json charge scale 1 in band [404.16,446.70]',
  combo: 'factor 1 DOCUMENTED: acceptance4-round4-combo-audit.json heightFitK 0.875 fit the redrawn figures to walk height in the splice (sheet at walk scale); weapon item 4 owner-waived so no projection record - figure-height evidence only',
  heavy: 'factor 1 DOCUMENTED: owner-2026-10-08-cmr14a-heavy-bigboss accepted heavy at k=1 as intentional BIG boss; heavy-fig1-retouch-audit.json projectionRecord scale 1, all 5 spears in band',
  misc: 'factor 1/1.32: finished rasters rendered at 0.66*q*2 (finish-batch uniformTransform 0.36505 = 0.66*2*q); banked sheets are native where gameplay = .66',
  fall: 'factor 1/1.32: same as misc (owner q 0.27655409211353954, CONSOLIDATED-DECISION.md item 1)',
  getup: 'factor 1/1.32: same as misc; getup:0 aliases fall:4',
}

// ---- page-aware base (prepare-lidian.mjs solver) ----------------------------
const PAGE_CAP = DECODED_CAP
const PACK_SLACK = 1.28
const frameList = Object.entries(rawDims)
const capsFor = (box) => ({ h: box.groundY * DENSITY - TRIM_PAD - 2, w: box.width * DENSITY - 2 * TRIM_PAD - 2 })
function boundsFor(box) {
  const caps = capsFor(box)
  let fitBound = Infinity
  let binding = null
  for (const [name, d] of frameList) {
    const f = factors[d.seq]
    const bh = caps.h / (d.h * f)
    const bw = caps.w / (d.w * f)
    if (bh < fitBound) { fitBound = bh; binding = `${name} height` }
    if (bw < fitBound) { fitBound = bw; binding = `${name} width` }
  }
  return { caps, fitBound, binding }
}
const trimBytesAt = (b) => {
  let sum = 0
  for (const [name, d] of frameList) {
    if (name === 'getup:0') continue // alias of fall:4: no own atlas rect
    const s = b * factors[d.seq]
    sum += (Math.round(s * d.w) + 2 * TRIM_PAD) * (Math.round(s * d.h) + 2 * TRIM_PAD) * 4
  }
  return sum
}
let lo = 0.05, hi = 2
for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2
  if (trimBytesAt(mid) <= PAGE_CAP / PACK_SLACK) lo = mid
  else hi = mid
}
const budgetBound = lo
const hero = boundsFor(BOX)
const WIDE_BOX = { width: 360, height: 144, groundY: 136 }
const wide = boundsFor(WIDE_BOX)
// Analysis only (NOT applied): ground height needed for the documented .66
// gameplay walk scale given the binding frame.
const tallest = frameList.reduce((a, [n, d]) => (d.h * factors[d.seq] > a.h ? { n, h: d.h * factors[d.seq] } : a), { n: '', h: 0 })
const groundYFor066 = Math.ceil((0.66 * tallest.h + TRIM_PAD + 2) / DENSITY)

const walkGuardRaw = rawDims['walk:0'].h
// Per-sequence binding (analysis): which sheet limits the base, per box.
const perSeqBound = (box) => Object.fromEntries(ORDER.map((n) => {
  const caps = capsFor(box)
  let b = Infinity, by = ''
  for (const [name, d] of frameList) {
    if (d.seq !== n) continue
    const f = factors[n]
    if (caps.h / (d.h * f) < b) { b = caps.h / (d.h * f); by = `${name} height` }
    if (caps.w / (d.w * f) < b) { b = caps.w / (d.w * f); by = `${name} width` }
  }
  return [n, { bound: b, binding: by, walkGuardPxAtBound: b * walkGuardRaw }]
}))
const heroPerSeq = perSeqBound(BOX)
const widePerSeq = perSeqBound({ width: 360, height: 144, groundY: 136 })
for (const n of ORDER) console.log(`  bound ${n.padEnd(7)} hero ${heroPerSeq[n].bound.toFixed(4)} (${heroPerSeq[n].binding}, guard ${heroPerSeq[n].walkGuardPxAtBound.toFixed(1)}px) | wide360 ${widePerSeq[n].bound.toFixed(4)} (${widePerSeq[n].binding})`)
console.log(`hero box fit bound ${hero.fitBound.toFixed(6)} (binding ${hero.binding}) | budget bound ${budgetBound.toFixed(6)}`)
console.log(`wide box ${WIDE_BOX.width} fit bound ${wide.fitBound.toFixed(6)} (binding ${wide.binding})`)
console.log(`tallest frame ${tallest.n} ${tallest.h.toFixed(1)} walk-px; groundY needed for .66 walk scale: ${groundYFor066}`)

// OWNER DECISION (2026-10-11): taller PRESENTATION frame so the overhead
// heavy raise fits at a walk scale comparable to Li Dian. Width and gameplay
// data unchanged; not runtime-activated (CMR-14B).
const OWNER_TALL_BOX = { width: 260, height: groundYFor066 + 8, groundY: groundYFor066 }
const BOX_USED = OWNER_TALL_BOX
const used = boundsFor(BOX_USED)
let base = Math.floor(Math.min(used.fitBound, budgetBound) * 0.99 * 1e6) / 1e6
const scalesAt = (b) => Object.fromEntries(ORDER.map((n) => [n, Math.floor(b * factors[n] * 1e6) / 1e6]))
let sheetScale = scalesAt(base)

const buildFighter = () => ({
  id: 'xiahoudun',
  role: 'boss',
  density: DENSITY,
  box: BOX_USED,
  revision: 'xiahoudun-1',
  // NO decodedCapBytes: 16MB-first.
  cleanup: { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 },
  sequences: ORDER.map((name) => ({
    name,
    count: KEEP[name].length,
    rows: 3,
    cols: 3,
    order: KEEP[name],
    registration: { scale: sheetScale[name] },
    ...(name === 'getup' ? { alias: { 0: 'fall:4' } } : {}),
  })),
})

// cleanAlpha mutates sheets in place; keep pristine copies so both
// determinism runs see identical inputs.
const pristine = Object.fromEntries(ORDER.map((n) => [n, { width: sheets[n].width, height: sheets[n].height, data: new Uint8ClampedArray(sheets[n].data) }]))
const freshSheets = () => Object.fromEntries(ORDER.map((n) => [n, { width: pristine[n].width, height: pristine[n].height, data: new Uint8ClampedArray(pristine[n].data) }]))

let fighter = buildFighter()
let pack
let budgetRetries = 0
for (;;) {
  try {
    pack = preparePack(fighter, freshSheets())
  } catch (e) {
    if (!String(e?.message ?? '').includes('budget:') || budgetRetries >= 4) throw e
    budgetRetries++
    base = Math.floor((base - 0.002) * 1e6) / 1e6
    sheetScale = scalesAt(base)
    fighter = buildFighter()
    continue
  }
  const pagePx = pack.pages.reduce((a, p) => a + p.width * p.height * 4, 0)
  if (pagePx <= PAGE_CAP) break
  if (budgetRetries >= 4) throw new Error(`budget: page pixels ${pagePx} exceed ${PAGE_CAP} after ${budgetRetries} step-downs`)
  budgetRetries++
  base = Math.floor((base - 0.002) * 1e6) / 1e6
  sheetScale = scalesAt(base)
  fighter = buildFighter()
}
for (const n of ORDER) {
  measured[n].scale = sheetScale[n]
  measured[n].scaleFactor = factors[n]
  measured[n].scaleEvidence = evidence[n]
}
const walkGuardPx = walkGuardRaw * sheetScale.walk
const paths = writePackOutputs(fighter, pack, { outputRoot: 'artifacts/motion' })

// Determinism: second independent run from pristine inputs.
const again = preparePack(fighter, freshSheets())
const deterministic = again.manifestSha256 === pack.manifestSha256

// Alias check: getup:0 shares fall:4's atlas rect and pixels.
const mf = (n) => pack.manifest.frames.find((f) => f.name === n)
const a = mf('getup:0'), t = mf('fall:4')
const aliasOk = a.page === t.page && a.x === t.x && a.y === t.y && a.restoredSha256 === t.restoredSha256 && a.contentSha256 === t.contentSha256
  && pack.frames.find((f) => f.name === 'getup:0').aliasOf === 'fall:4'

const uniqueFrames = pack.frames.filter((f) => !f.aliasOf)
const pagePixels = pack.pages.reduce((x, p) => x + p.width * p.height * 4, 0)
const pagesOk = pack.pages.every((p) => p.width <= PAGE_LIMIT && p.height <= PAGE_LIMIT)

// ---- ANALYSIS ONLY (not applied, nothing written): taller presentation box
// that would hold heavy:0 at a walk scale comparable to Li Dian. Owner
// decision required; reported so the trade-off is measured, not guessed.
const TALL_BOX = { width: 260, height: groundYFor066 + 8, groundY: groundYFor066 }
let tallAnalysis
try {
  const tb = boundsFor(TALL_BOX)
  const tBase = Math.floor(Math.min(tb.fitBound, budgetBound) * 0.99 * 1e6) / 1e6
  const tScale = scalesAt(tBase)
  const tFighter = { ...buildFighter(), box: TALL_BOX, sequences: buildFighter().sequences.map((s) => ({ ...s, registration: { scale: tScale[s.name] } })) }
  const tPack = preparePack(tFighter, freshSheets())
  tallAnalysis = {
    box: TALL_BOX, fitBound: tb.fitBound, binding: tb.binding, base: tBase,
    walkGuardPx: walkGuardRaw * tScale.walk,
    pages: tPack.pages.map((p) => ({ name: p.name, width: p.width, height: p.height })),
    decodedBytes: tPack.budget.decodedBytes, applied: false,
  }
} catch (e) {
  tallAnalysis = { box: TALL_BOX, error: String(e?.message ?? e), applied: false }
}
console.log('ANALYSIS tall box (not applied):', JSON.stringify(tallAnalysis))

// ---- contact sheets (play order, shared ground line) -------------------------
const LABELS = {
  walk: ['guard', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'],
  charge: ['crouch-coil', 'launch', 'dash', 'dash2', 'brake'],
  combo: ['windup', 'rising-strike', 'follow-through', 'sweep', 'recover'],
  heavy: ['raise', 'hold', 'chop', 'follow', 'recover'],
  misc: ['hurt-recoil', 'hurt-fold', 'held-clamp', 'held-struggle', 'release'],
  fall: ['topple', 'airborne', 'tumble', 'impact', 'DOWN'],
  getup: ['DOWN', 'chestlift', 'kneel', 'crouch', 'rise'],
}
function contactSheet(zoom) {
  // zoom 1 = gameplay size (1 logical unit = 1px), zoom 2 = density-2 art px.
  const cw = BOX_USED.width * zoom, ch = BOX_USED.height * zoom
  const labelH = 14 * zoom, gutterL = 70 * zoom
  const cols = Math.max(...ORDER.map((n) => KEEP[n].length))
  const cv = createCanvas(gutterL + cols * cw, ORDER.length * (ch + labelH))
  const g = cv.getContext('2d')
  g.fillStyle = '#c9c4b8'
  g.fillRect(0, 0, cv.width, cv.height)
  const pageCanvas = new Map()
  for (const p of pack.pages) {
    const pc = createCanvas(p.width, p.height)
    pc.getContext('2d').putImageData(p.pixels, 0, 0)
    pageCanvas.set(p.name, pc)
  }
  g.font = `${10 * zoom}px sans-serif`
  ORDER.forEach((seq, row) => {
    const y0 = row * (ch + labelH)
    g.fillStyle = '#000'
    g.fillText(seq, 4 * zoom, y0 + labelH + ch / 2)
    for (let i = 0; i < KEEP[seq].length; i++) {
      const x0 = gutterL + i * cw
      const f = mf(`${seq}:${i}`)
      g.strokeStyle = '#8a857a'
      g.lineWidth = 1
      g.strokeRect(x0 + 0.5, y0 + labelH + 0.5, cw - 1, ch - 1)
      g.fillStyle = '#000'
      g.fillText(`${i} ${LABELS[seq][i]}${seq === 'getup' && i === 0 ? ' =fall:4' : ''}`, x0 + 3 * zoom, y0 + 11 * zoom)
      const s = zoom / DENSITY
      g.drawImage(pageCanvas.get(f.page), f.x, f.y, f.trim.w, f.trim.h,
        x0 + f.trim.trimX * s, y0 + labelH + f.trim.trimY * s, f.trim.w * s, f.trim.h * s)
      g.strokeStyle = '#c03020'
      g.beginPath()
      g.moveTo(x0, y0 + labelH + BOX_USED.groundY * zoom + 0.5)
      g.lineTo(x0 + cw, y0 + labelH + BOX_USED.groundY * zoom + 0.5)
      g.stroke()
    }
  })
  return cv.toBuffer('image/png')
}
mkdirSync(REVIEW, { recursive: true })
writeFileSync(`${REVIEW}/contact-gameplay.png`, contactSheet(1))
writeFileSync(`${REVIEW}/contact-2x.png`, contactSheet(2))

// ---- registration record ------------------------------------------------------
const frameExtents = Object.fromEntries(pack.manifest.frames.map((f) => [f.name, {
  heightPx: f.trim.h - 2 * TRIM_PAD, widthPx: f.trim.w - 2 * TRIM_PAD, topPx: f.trim.trimY + TRIM_PAD,
}]))
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'xiahoudun',
  status: 'OFFLINE PACK PREPARATION ONLY - not runtime/catalog activated, no CMR-14B',
  model: 'one uniform scale PER SHEET (walk reference; charge/combo/heavy factor 1 documented; misc/fall/getup factor 1/1.32 from the finished density-2 rasters) + cell-centre/ground anchors; page-aware base (largest base fitting both cell axes with trims under cap/1.28 packing slack, then packed pages verified under the 16MiB contract)',
  box: BOX_USED,
  boxDecision: `OWNER DECISION 2026-10-11: taller presentation frame ${BOX_USED.width}x${BOX_USED.height}/groundY ${BOX_USED.groundY}. In the hero 260x144/groundY 136 frame the fit is bound by ${hero.binding} (overhead raised spear, height), giving a walk guard of only ${(hero.fitBound * walkGuardRaw).toFixed(1)}px; a wider box gives the same bound ${wide.fitBound.toFixed(6)}. Presentation frame only; width, gameplay, hitboxes and timing unchanged; not runtime-activated (CMR-14B).`,
  density: DENSITY,
  contentCapPx: used.caps.h,
  widthCapPx: used.caps.w,
  packSlack: PACK_SLACK,
  fitBound: used.fitBound,
  fitBinding: used.binding,
  heroBoxFitBound: hero.fitBound,
  heroBoxBinding: hero.binding,
  budgetBound,
  base,
  budgetStepDowns: budgetRetries,
  guanyuWalkGuardPx: 240,
  lidianWalkGuardPx: 217.681205,
  walkGuardFittedPx: walkGuardPx,
  alternativesNotApplied: {
    wideBox: { box: WIDE_BOX, fitBound: wide.fitBound, binding: wide.binding },
    tallestFrame: { name: tallest.n, walkScaleHeightPx: tallest.h },
    groundYNeededForWalkScale066: groundYFor066,
    perSequenceBoundHero: heroPerSeq,
    perSequenceBoundWide360: widePerSeq,
    tallBoxAnalysis: tallAnalysis,
  },
  sheets: measured,
  layout: Object.fromEntries(ORDER.map((n) => [n, {
    positions: KEEP[n].map((cell, i) => ({ position: i, cell, label: LABELS[n][i], ...(n === 'getup' && i === 0 ? { aliasOf: 'fall:4' } : {}) })),
    culledCells: measured[n].culledCells,
  }])),
  frameExtentsPx: frameExtents,
  manifestSha256: pack.manifestSha256,
}, null, 2)}\n`)

console.log('--- xiahoudun pack report ---')
console.log(`FINAL base ${base.toFixed(6)} after ${budgetRetries} step-down(s) | walk guard ${walkGuardPx.toFixed(2)}px (Li Dian 217.68, Guan Yu 240)`)
for (const n of ORDER) console.log(`  ${n.padEnd(7)} factor ${factors[n].toFixed(6)} scale ${sheetScale[n]} kept ${KEEP[n].join(',')} culled ${measured[n].culledCells.join(',') || '-'}`)
console.log('manifest sha256:', pack.manifestSha256, deterministic ? '(deterministic)' : '(NOT DETERMINISTIC)')
console.log('frames:', pack.frames.length, `(${uniqueFrames.length} unique)`, '| pages:', pack.pages.map((p) => `${p.name} ${p.width}x${p.height}`).join(', '), pagesOk ? '(<=2048)' : '(OVER 2048)')
console.log(`decoded page pixels ${pagePixels} B / cap ${PAGE_CAP} B ${pagePixels <= PAGE_CAP ? 'OK' : 'OVER'}`)
console.log('counts:', JSON.stringify(pack.report.counts))
console.log('budget:', JSON.stringify(pack.budget))
console.log('alias getup:0 -> fall:4:', aliasOk ? 'OK (shared rect, identical hashes)' : 'FAILED')
console.log('suspects:', pack.report.suspects.length, JSON.stringify(pack.report.suspects))
console.log('outputs:', paths.output, '| review:', REVIEW)
if (!deterministic || !aliasOk || !pagesOk || pagePixels > PAGE_CAP) {
  console.log('DEFECT: determinism/alias/budget check failed')
  process.exit(1)
}
