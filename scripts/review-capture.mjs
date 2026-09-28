// UI review capture runner (docs/VISUAL_REVIEW.md section 1).
// Rotates artifacts/review/latest -> previous, then runs the capture spec on
// one worker. Its web server takes browser port 5177 with --strictPort, so a
// concurrent browser check makes it fail fast instead of sharing a server.
// It deliberately does NOT refuse on artifacts/loop/run.lock: the runner holds
// that lock for the whole iteration, and loop iterations must run this.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const latest = 'artifacts/review/latest'
const previous = 'artifacts/review/previous'
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
// Section 2a: per-fighter anatomy sheets (clean, x-ray, ID map, suspects) at
// 4x, every move.
const a = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', 'test/game/anatomy-review.test.ts'],
  { stdio: 'inherit', env: { ...process.env, REVIEW_ANATOMY: '1' } },
)
if ((a.status ?? 1) !== 0) process.exit(a.status ?? 1)

// Sections 5/6: BEFORE/AFTER pair sheets. Windows depend only on the pose, so
// the previous and latest clean sheets line up tile for tile. A verifier
// judges a fix on these, never on the fixer's description of it.
const readIndex = (dir) => {
  try {
    const j = JSON.parse(readFileSync(`${dir}/anatomy/index.json`, 'utf8'))
    return Array.isArray(j) ? { commit: 'unknown', fighters: j } : j
  } catch {
    return { commit: 'unknown', fighters: [] }
  }
}
const before = readIndex(previous).commit
const now = readIndex(latest)
let pairs = 0
for (const { id } of now.fighters) {
  const pa = `${previous}/anatomy/${id}.png`
  const pb = `${latest}/anatomy/${id}.png`
  if (!existsSync(pa) || !existsSync(pb)) continue
  const ia = await loadImage(pa)
  const ib = await loadImage(pb)
  const band = 28
  const cv = createCanvas(Math.max(ia.width, ib.width), ia.height + ib.height + band * 2)
  const g = cv.getContext('2d')
  g.fillStyle = '#1c1820'
  g.fillRect(0, 0, cv.width, cv.height)
  g.font = 'bold 20px sans-serif'
  g.fillStyle = '#ffb4a0'
  g.fillText(`BEFORE  ${id}  (${before})`, 8, 21)
  g.drawImage(ia, 0, band)
  g.fillStyle = '#a0ffb4'
  g.fillText(`AFTER  ${id}  (${now.commit})`, 8, band + ia.height + 21)
  g.drawImage(ib, 0, band * 2 + ia.height)
  writeFileSync(`${latest}/anatomy/${id}-pair.png`, cv.toBuffer('image/png'))
  pairs += 1
}
console.log(pairs > 0
  ? `review:capture: ${pairs} before/after pair sheets (${before} -> ${now.commit}) in ${latest}/anatomy/*-pair.png`
  : 'review:capture: no previous anatomy sheets - pair sheets skipped')
