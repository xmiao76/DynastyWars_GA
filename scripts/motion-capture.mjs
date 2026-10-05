#!/usr/bin/env node
// CMR-05: per-fighter/role motion capture runner.
//
//   node scripts/motion-capture.mjs --fighter guanyu --role hero --renderer canvas
//   node scripts/motion-capture.mjs --fighter guanyu --role hero --renderer webgl --strict
//
// It drives e2e/motion-capture.spec.ts (opt-in ?motion=1), which records
// ACTUAL runtime frame keys/boxes, then validates the capture with
// scripts/motion-review-core.mjs and writes report.json + contact sheet +
// before/after pair sheets. Before overwriting a capture it rotates the
// previous one to <out>/previous/, so pairs survive any number of runs.
//
// Exit codes: 0 = self-check clean (open items may be listed), 1 = hard
// defect (unknown frame, mixing, blank pack, residue, missing binding,
// stale provenance, clock defect, or an unseen pose labelled natural).
// `--strict` additionally fails on unverified landmarks.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import {
  actionsForRole,
  assertIndexIntegrity,
  buildIndex,
  coverageMatrix,
  pacingReport,
  resourceReport,
  validateTrace,
} from './motion-review-core.mjs'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const strict = argv.includes('--strict')
const fighter = arg('--fighter', 'guanyu')
const role = arg('--role', 'hero')
const enemy = arg('--enemy', '')
const renderer = arg('--renderer', 'canvas')
const out = arg('--out', 'artifacts/motion-review')
const run = `${out}/${fighter}-${renderer}`

// ---- provenance: commit, dirty state, pack revision and source hashes ----
const git = (args) => spawnSync('git', args, { encoding: 'utf8' }).stdout.trim()
const commit = git(['rev-parse', '--short', 'HEAD']) || 'unknown'
const dirty = git(['status', '--porcelain', 'src', 'scripts', 'art']) !== ''
const prepared = JSON.parse(readFileSync('src/game/assets/motion/prepared.json', 'utf8'))
const actions = JSON.parse(readFileSync('src/game/assets/motion/actions-prepared.json', 'utf8'))
let sourceHashes = {
  'guanyu-motion-sheet.png': prepared.guanyu.sha256.sheet,
  'guanyu-actions-sheet.png': actions.sha256.sheet,
}
let packRevision = 'motion-2'
let pivot = { x: prepared.guanyu.box.width, y: prepared.guanyu.box.groundY * prepared.guanyu.density }
let singlePrepared = null
if (fighter === 'soldier' || fighter === 'spearman' || fighter === 'archer' || fighter === 'huangzhong') {
  // Single-page cast packs: provenance comes from their own prepared record
  // (the guanyu literals above stay exactly as they were for guanyu runs).
  singlePrepared = JSON.parse(readFileSync(`src/game/assets/motion/${fighter}-prepared.json`, 'utf8'))
  sourceHashes = { [`${fighter}-motion-sheet.png`]: singlePrepared.sha256 }
  packRevision = singlePrepared.revision
  pivot = { x: singlePrepared.box.width, y: singlePrepared.box.groundY * singlePrepared.density }
}
if (fighter === 'zhangfei') {
  // Two-page hero pack, one prepared record: both page hashes + revision +
  // pivot come from it (pivot = full cell width, ground line in px).
  singlePrepared = JSON.parse(readFileSync(`src/game/assets/motion/zhangfei-prepared.json`, 'utf8'))
  sourceHashes = {
    'zhangfei-motion-sheet.png': singlePrepared.sha256.sheet,
    'zhangfei-actions-sheet.png': singlePrepared.sha256.actions,
  }
  packRevision = singlePrepared.revision
  pivot = { x: singlePrepared.box.width, y: singlePrepared.box.groundY * singlePrepared.density }
}
if (fighter === 'zhaoyun') {
  // Two-page hero pack, one prepared record: both page hashes + revision +
  // pivot come from it (pivot = full cell width, ground line in px).
  singlePrepared = JSON.parse(readFileSync(`src/game/assets/motion/zhaoyun-prepared.json`, 'utf8'))
  sourceHashes = {
    'zhaoyun-motion-sheet.png': singlePrepared.sha256.sheet,
    'zhaoyun-actions-sheet.png': singlePrepared.sha256.actions,
  }
  packRevision = singlePrepared.revision
  pivot = { x: singlePrepared.box.width, y: singlePrepared.box.groundY * singlePrepared.density }
}
if (fighter === 'weiyan') {
  // Two-page hero pack, one prepared record: both page hashes + revision +
  // pivot come from it (pivot = full cell width, ground line in px).
  singlePrepared = JSON.parse(readFileSync(`src/game/assets/motion/weiyan-prepared.json`, 'utf8'))
  sourceHashes = {
    'weiyan-motion-sheet.png': singlePrepared.sha256.sheet,
    'weiyan-actions-sheet.png': singlePrepared.sha256.actions,
  }
  packRevision = singlePrepared.revision
  pivot = { x: singlePrepared.box.width, y: singlePrepared.box.groundY * singlePrepared.density }
}

// ---- rotate the previous capture (before/after pairs across rotations) ----
if (existsSync(run)) {
  mkdirSync(`${out}/previous`, { recursive: true })
  rmSync(`${out}/previous/${fighter}-${renderer}`, { recursive: true, force: true })
  renameSync(run, `${out}/previous/${fighter}-${renderer}`)
}

// ---- run the capture ----
const env = {
  ...process.env,
  MOTION_CAPTURE: '1',
  MOTION_FIGHTER: fighter,
  MOTION_ROLE: role,
  MOTION_ENEMY_KIND: enemy,
  MOTION_RENDERER: renderer,
  MOTION_OUT: out,
  MOTION_COMMIT: commit,
  MOTION_DIRTY: dirty ? '1' : '0',
  MOTION_PACK_REVISION: packRevision,
  MOTION_SOURCE_HASHES: JSON.stringify(sourceHashes),
  MOTION_PIVOT: JSON.stringify(pivot),
}
const r = spawnSync(
  process.execPath,
  ['node_modules/@playwright/test/cli.js', 'test', '--project=chromium', 'e2e/motion-capture.spec.ts', '--workers=1'],
  { stdio: 'inherit', env },
)
if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1)

// ---- blank-crop guard: black frames are a harness bug, never evidence ----
// (The webgl capture once produced 100% black crops because a WebGL canvas
// is cleared outside the render frame; the trace still looked perfect.)
const frameFiles = existsSync(`${run}/frames`)
  ? readdirSync(`${run}/frames`).filter((f) => f.endsWith('.png')).sort()
  : []
const blanks = []
for (const f of frameFiles) {
  const img = await loadImage(`${run}/frames/${f}`)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height).data
  let lit = 0
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 24) lit++
  if (lit / (d.length / 4) < 0.01) blanks.push(f)
}

// ---- validate the live capture through the review core ----
const trace = JSON.parse(readFileSync(`${run}/trace.json`, 'utf8'))
const rows = trace.rows
// The pack frame inventory and attack bindings are per fighter: the review
// core rejects any captured key that is not in the fighter's own pack.
const packFrames = singlePrepared ? singlePrepared.frames : { ...prepared.guanyu.frames, ...actions.frames }
const bindings = fighter === 'soldier'
  ? { 'soldier.swing': 'swing' }
  : fighter === 'spearman'
    ? { 'spear.thrust': 'thrust' }
    : fighter === 'archer'
      ? {} // Shooters bind no melee attacks (the core skips the check on empty bindings).
      : fighter === 'zhangfei'
        ? {
          'zf.jab1': 'jab1', 'zf.jab2': 'jab2', 'zf.finisher': 'finisher',
          'zf.jumpkick': 'jumpkick', 'zf.special': 'special', 'mounted.sweep': 'mountedsweep',
        }
        : fighter === 'zhaoyun'
          ? {
            'zy.jab1': 'jab1', 'zy.jab2': 'jab2', 'zy.finisher': 'finisher',
            'zy.jumpkick': 'jumpkick', 'zy.special': 'special', 'mounted.sweep': 'mountedsweep',
          }
          : fighter === 'weiyan'
            ? {
              'wy.jab1': 'jab1', 'wy.jab2': 'jab2', 'wy.finisher': 'finisher',
              'wy.jumpkick': 'jumpkick', 'wy.special': 'special', 'mounted.sweep': 'mountedsweep',
            }
            : fighter === 'huangzhong'
              ? {
                'hz.jab1': 'jab1', 'hz.jab2': 'jab2', 'hz.finisher': 'finisher',
                'hz.jumpkick': 'jumpkick', 'hz.special': 'special', 'mounted.sweep': 'mountedsweep',
              }
              : {
          'gy.jab1': 'jab1', 'gy.jab2': 'jab2', 'gy.finisher': 'finisher',
          'gy.jumpkick': 'jumpkick', 'gy.special': 'special', 'mounted.sweep': 'mountedsweep',
        }
const verdict = validateTrace(rows, {
  pack: { frames: packFrames },
  bindings,
  claimsMotion: true,
  expectedCommit: commit,
  removedResiduePx: 0,
  residueTolerancePx: 0,
})
const injectedActions = fighter === 'soldier'
  ? ['idle', 'swing', 'hurt', 'knockdown', 'getup', 'grabbed', 'thrown', 'dying', 'dead']
  : fighter === 'spearman'
    ? ['idle', 'thrust', 'hurt', 'knockdown', 'getup', 'grabbed', 'thrown', 'dying', 'dead']
    : fighter === 'archer'
      ? ['idle', 'shoot-release', 'shoot-reload', 'shoot-draw', 'shoot-aim', 'hurt', 'knockdown', 'getup', 'grabbed', 'thrown', 'dying', 'dead']
      : fighter === 'zhangfei'
        ? ['idle', 'jab1', 'hurt', 'jab2', 'knockdown', 'finisher', 'getup', 'special', 'jump', 'jumpkick', 'grab', 'grabbed', 'thrown', 'mount', 'mountedsweep', 'dying', 'dead']
        : fighter === 'zhaoyun'
          ? ['idle', 'jab1', 'hurt', 'jab2', 'knockdown', 'finisher', 'getup', 'special', 'jump', 'jumpkick', 'grab', 'grabbed', 'thrown', 'mount', 'mountedsweep', 'dying', 'dead']
          : fighter === 'weiyan'
            ? ['idle', 'jab1', 'hurt', 'jab2', 'knockdown', 'finisher', 'getup', 'special', 'jump', 'jumpkick', 'grab', 'grabbed', 'thrown', 'mount', 'mountedsweep', 'dying', 'dead']
            : fighter === 'huangzhong'
              ? ['idle', 'jab1', 'hurt', 'jab2', 'knockdown', 'finisher', 'getup', 'special', 'jump', 'jumpkick', 'grab', 'grabbed', 'thrown', 'mount', 'mountedsweep', 'dying', 'dead']
              : ['idle', 'jab1', 'hurt', 'knockdown', 'getup', 'dying', 'dead', 'grabbed']
const coverage = coverageMatrix(rows, {
  actions: actionsForRole(role).filter((a) => a !== 'revive'),
  facings: ['right', 'left'],
  renderers: [renderer],
  injected: injectedActions,
})
const index = buildIndex({
  fighter,
  role,
  commit,
  dirty,
  packRevision,
  sourceHashes,
  landmarks: {
    groundErrorU: 0,
    pivotU: pivot,
    contactU: 'unverified',
    weaponTipU: 'unverified',
  },
  coverage,
  rows: rows.length,
  facings: ['right', 'left'],
  renderers: [renderer],
  tracePath: `${run}/trace.json`,
  videoPath: `${run}/${fighter}-${renderer}.webm`,
  contactSheet: `${run}/contact-sheet.png`,
})
const integrity = assertIndexIntegrity(index)
// Unverified landmarks are OPEN items (consumer self-check, producer later);
// mislabelled poses are hard defects.
const hard = integrity.filter((e) => !e.includes('unseen landmark cannot pass'))
const open = integrity.filter((e) => e.includes('unseen landmark cannot pass'))

const report = {
  fighter,
  role,
  renderer,
  commit,
  dirty,
  validation: verdict,
  integrity: { hard, open },
  pacing: pacingReport(rows),
  blanks,
  resources: resourceReport({
    ...(fighter === 'soldier'
      ? { networkBytes: 1786372, sourceBytes: 1786372, decodedBytes: 1984 * 1142 * 4, gpuBytes: 1984 * 1142 * 4 }
      : fighter === 'spearman'
        ? { networkBytes: 1352663, sourceBytes: 1352663, decodedBytes: 1835 * 866 * 4, gpuBytes: 1835 * 866 * 4 }
        : fighter === 'archer'
          ? { networkBytes: 1830948, sourceBytes: 1830948, decodedBytes: 2045 * 924 * 4, gpuBytes: 2045 * 924 * 4 }
          : fighter === 'zhangfei'
            ? {
              networkBytes: 3007913 + 1028932, sourceBytes: 3007913 + 1028932,
              decodedBytes: 2004 * 2026 * 4 + 1693 * 768 * 4, gpuBytes: 2004 * 2026 * 4 + 1693 * 768 * 4,
              caps: { pageLimit: 2048, decodedPerFighter: 22 * 1024 * 1024, retainedCache: 128 * 1024 * 1024, stageDownloads: 12 * 1024 * 1024 },
            }
            : fighter === 'zhaoyun'
              ? {
                networkBytes: 3241974 + 1092445, sourceBytes: 3241974 + 1092445,
                decodedBytes: 2030 * 1847 * 4 + 1845 * 699 * 4, gpuBytes: 2030 * 1847 * 4 + 1845 * 699 * 4,
                caps: { pageLimit: 2048, decodedPerFighter: 21 * 1024 * 1024, retainedCache: 128 * 1024 * 1024, stageDownloads: 12 * 1024 * 1024 },
              }
              : fighter === 'weiyan'
                ? {
                  networkBytes: 3173250 + 146166, sourceBytes: 3173250 + 146166,
                  decodedBytes: 1948 * 1877 * 4 + 618 * 199 * 4, gpuBytes: 1948 * 1877 * 4 + 618 * 199 * 4,
                  caps: { pageLimit: 2048, decodedPerFighter: 16 * 1024 * 1024, retainedCache: 128 * 1024 * 1024, stageDownloads: 12 * 1024 * 1024 },
                }
                : fighter === 'huangzhong'
                  ? {
                    networkBytes: 3643905, sourceBytes: 3643905,
                    decodedBytes: 1988 * 1594 * 4, gpuBytes: 1988 * 1594 * 4,
                    caps: { pageLimit: 2048, decodedPerFighter: 16 * 1024 * 1024, retainedCache: 128 * 1024 * 1024, stageDownloads: 12 * 1024 * 1024 },
                  }
                  : { networkBytes: 4_328_499, sourceBytes: 4_328_499, decodedBytes: 15_543_160, gpuBytes: 15_543_160 }),
    clonedCanvasBytes: 0,
  }),
  coverageSummary: {
    captured: coverage.filter((c) => c.status === 'captured').length,
    unseen: coverage.filter((c) => c.status === 'unseen').length,
  },
}
writeFileSync(`${run}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
writeFileSync(`${run}/index.json`, `${JSON.stringify(index, null, 2)}\n`)

// ---- contact sheet + before/after pair sheets ----
if (frameFiles.length > 0) {
  const cols = Math.min(4, frameFiles.length)
  const cell = 320
  const rowsN = Math.ceil(frameFiles.length / cols)
  const sheet = createCanvas(cols * cell, rowsN * cell)
  const g = sheet.getContext('2d')
  g.fillStyle = '#181020'
  g.fillRect(0, 0, sheet.width, sheet.height)
  for (const [i, f] of frameFiles.entries()) {
    const img = await loadImage(`${run}/frames/${f}`)
    const x = (i % cols) * cell, y = Math.floor(i / cols) * cell
    g.drawImage(img, x + 4, y + 4, cell - 8, cell - 8)
  }
  writeFileSync(`${run}/contact-sheet.png`, sheet.toBuffer('image/png'))
}
const previousFrames = `${out}/previous/${fighter}-${renderer}/frames`
const previousIndexPath = `${out}/previous/${fighter}-${renderer}/index.json`
const previousIndex = existsSync(previousIndexPath) ? JSON.parse(readFileSync(previousIndexPath, 'utf8')) : undefined
const beforeLabel = previousIndex
  ? `${previousIndex.capture?.commit ?? 'unknown'}${previousIndex.capture?.dirty ? '-dirty' : ''}`
  : 'previous'
if (existsSync(previousFrames)) {
  mkdirSync(`${run}/pairs`, { recursive: true })
  for (const f of frameFiles.slice(0, 6)) {
    if (!existsSync(`${previousFrames}/${f}`)) continue
    const before = await loadImage(`${previousFrames}/${f}`)
    const after = await loadImage(`${run}/frames/${f}`)
    const w = Math.max(before.width, after.width)
    const pair = createCanvas(w, before.height + after.height + 36)
    const g = pair.getContext('2d')
    g.fillStyle = '#181020'
    g.fillRect(0, 0, pair.width, pair.height)
    g.fillStyle = '#ffd27f'
    g.font = '20px sans-serif'
    g.fillText(`BEFORE ${beforeLabel}`, 8, 20)
    g.drawImage(before, 0, 28)
    g.fillText(`AFTER ${commit}${dirty ? '-dirty' : ''}`, 8, before.height + 32)
    g.drawImage(after, 0, before.height + 36)
    writeFileSync(`${run}/pairs/${f}`, pair.toBuffer('image/png'))
  }
}

// ---- verdict ----
console.log(`motion-capture: ${fighter}/${role}/${renderer} commit ${commit}${dirty ? '-dirty' : ''}`)
console.log(`  rows ${rows.length}; trace errors ${verdict.errors.length}; hard integrity ${hard.length}; open items ${open.length}`)
console.log(`  coverage captured ${report.coverageSummary.captured} / unseen ${report.coverageSummary.unseen} (unseen stays unseen)`)
for (const e of [...verdict.errors, ...hard]) console.log(`  DEFECT: ${e}`)
for (const f of blanks) console.log(`  DEFECT: blank/black crop ${f} (capture bug, not evidence)`)
for (const e of open) console.log(`  OPEN (cannot pass): ${e}`)
if (verdict.errors.length > 0 || hard.length > 0 || blanks.length > 0 || (strict && open.length > 0)) {
  console.log('motion-capture: FAILED')
  process.exit(1)
}
console.log('motion-capture: self-check passed (consumer record; producer verifies fresh)')
