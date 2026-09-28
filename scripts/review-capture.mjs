// UI review capture runner (docs/VISUAL_REVIEW.md section 1).
// Rotates artifacts/review/latest -> previous, then runs the capture spec on
// one worker. Its web server takes browser port 5177 with --strictPort, so a
// concurrent browser check makes it fail fast instead of sharing a server.
// It deliberately does NOT refuse on artifacts/loop/run.lock: the runner holds
// that lock for the whole iteration, and loop iterations must run this.
//
// Before/after evidence (sections 5-6). The plain latest/previous rotation
// alone LOST the pre-fix pixels once: the fixer's second capture moved the
// pre-fix sheets to previous, and the verifier's capture then deleted them,
// so the verifier compared post-fix with post-fix. Now:
//   --pin <V-n>   run BEFORE fixing: after capturing, copy latest/anatomy to
//                 artifacts/review/baselines/<V-n>/ (never rotated away).
//                 Repeatable; an existing pin is kept, never overwritten.
//   every run     writes pair sheets against previous/ (as before) AND, for
//                 every pinned baseline, against that baseline into
//                 artifacts/review/pairs/<V-n>/<id>-pair.png, labelled with
//                 both captures' commits and dirty files.
//   --unpin <V-n> the verifier removes a baseline after verified/reopened.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const root = 'artifacts/review'
const latest = `${root}/latest`
const previous = `${root}/previous`
const baselines = `${root}/baselines`
const pairsDir = `${root}/pairs`

const argv = process.argv.slice(2)
/** Every value of a repeatable `--name V-n` flag. */
const flagAll = (name) => {
  const out = []
  argv.forEach((a, i) => {
    if (a !== name) return
    const v = argv[i + 1]
    if (!v || !/^V-\d+[a-z]*$/.test(v)) {
      console.error(`${name} needs a finding id like V-15 (got ${v ?? 'nothing'})`)
      process.exit(2)
    }
    out.push(v)
  })
  return out
}
const pins = flagAll('--pin')
const unpins = flagAll('--unpin')

if (unpins.length > 0) {
  // Admin only: no capture. The verifier calls this after verified/reopened.
  for (const v of unpins) {
    rmSync(`${baselines}/${v}`, { recursive: true, force: true })
    rmSync(`${pairsDir}/${v}`, { recursive: true, force: true })
    console.log(`review:capture: unpinned ${v}`)
  }
  process.exit(0)
}

if (existsSync(latest)) {
  rmSync(previous, { recursive: true, force: true })
  renameSync(latest, previous)
}
const r = spawnSync(
  process.execPath,
  ['node_modules/@playwright/test/cli.js', 'test', '--project=chromium', 'e2e/ui-review.spec.ts', '--workers=1'],
  { stdio: 'inherit', env: { ...process.env, UI_REVIEW: '1' } },
)
if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1)
// Section 2a: per-fighter anatomy sheets (clean, x-ray, ID map, suspects,
// a crop per move) at 4x, every move.
const a = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', 'test/game/anatomy-review.test.ts'],
  { stdio: 'inherit', env: { ...process.env, REVIEW_ANATOMY: '1' } },
)
if ((a.status ?? 1) !== 0) process.exit(a.status ?? 1)

const readIndex = (dir) => {
  try {
    const j = JSON.parse(readFileSync(`${dir}/index.json`, 'utf8'))
    return Array.isArray(j) ? { commit: 'unknown', dirty: [], fighters: j } : { dirty: [], ...j }
  } catch {
    return { commit: 'unknown', dirty: [], fighters: [] }
  }
}
const label = (ix) => (ix.dirty?.length ? `${ix.commit} + ${ix.dirty.length} uncommitted: ${ix.dirty.slice(0, 3).join(', ')}${ix.dirty.length > 3 ? ', ...' : ''}` : ix.commit)

for (const pin of pins) {
  const dest = `${baselines}/${pin}`
  if (existsSync(dest)) {
    console.log(`review:capture: ${pin} already pinned (${label(readIndex(dest))}); keeping the original baseline`)
  } else {
    mkdirSync(baselines, { recursive: true })
    cpSync(`${latest}/anatomy`, dest, { recursive: true })
    console.log(`review:capture: pinned ${pin} baseline (${label(readIndex(dest))}) -> ${dest}`)
  }
}

/** Stack BEFORE over AFTER for every fighter; the windows depend only on the pose. */
async function writePairs(beforeDir, afterDir, outDir, tag) {
  const b = readIndex(beforeDir)
  const n = readIndex(afterDir)
  mkdirSync(outDir, { recursive: true })
  let count = 0
  for (const { id } of n.fighters) {
    const pa = `${beforeDir}/${id}.png`
    const pb = `${afterDir}/${id}.png`
    if (!existsSync(pa) || !existsSync(pb)) continue
    const ia = await loadImage(pa)
    const ib = await loadImage(pb)
    const band = 28
    const cv = createCanvas(Math.max(ia.width, ib.width), ia.height + ib.height + band * 2)
    const g = cv.getContext('2d')
    g.fillStyle = '#1c1820'
    g.fillRect(0, 0, cv.width, cv.height)
    g.font = 'bold 18px sans-serif'
    g.fillStyle = '#ffb4a0'
    g.fillText(`BEFORE ${tag}  ${id}  (${label(b)})`, 8, 20)
    g.drawImage(ia, 0, band)
    g.fillStyle = '#a0ffb4'
    g.fillText(`AFTER  ${id}  (${label(n)})`, 8, band + ia.height + 20)
    g.drawImage(ib, 0, band * 2 + ia.height)
    writeFileSync(`${outDir}/${id}-pair.png`, cv.toBuffer('image/png'))
    count += 1
  }
  return { count, before: label(b), after: label(n) }
}

// Pairs against the previous capture (the consumer's own before/after).
const prev = await writePairs(`${previous}/anatomy`, `${latest}/anatomy`, `${latest}/anatomy`, '(previous)')
console.log(prev.count > 0
  ? `review:capture: ${prev.count} pair sheets vs previous (${prev.before} -> ${prev.after}) in ${latest}/anatomy/*-pair.png`
  : 'review:capture: no previous anatomy sheets - previous pairs skipped')
// Pairs against every pinned baseline (what the verifier judges).
if (existsSync(baselines)) {
  for (const v of readdirSync(baselines)) {
    const res = await writePairs(`${baselines}/${v}`, `${latest}/anatomy`, `${pairsDir}/${v}`, `[${v} baseline]`)
    console.log(`review:capture: ${res.count} ${v} pair sheets (${res.before} -> ${res.after}) in ${pairsDir}/${v}/`)
  }
}
