// UI review capture runner (docs/VISUAL_REVIEW.md section 1).
// Rotates artifacts/review/latest -> previous, then runs the capture spec on
// one worker. Its web server takes browser port 5177 with --strictPort, so a
// concurrent browser check makes it fail fast instead of sharing a server.
// It deliberately does NOT refuse on artifacts/loop/run.lock: the runner holds
// that lock for the whole iteration, and loop iterations must run this.
import { spawnSync } from 'node:child_process'
import { existsSync, renameSync, rmSync } from 'node:fs'

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
// Section 2a: per-fighter anatomy sheets (clean + x-ray) at 4x, every move.
const a = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', 'test/game/anatomy-review.test.ts'],
  { stdio: 'inherit', env: { ...process.env, REVIEW_ANATOMY: '1' } },
)
process.exit(a.status ?? 1)
