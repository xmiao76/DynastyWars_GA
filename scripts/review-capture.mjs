// UI review capture runner (docs/VISUAL_REVIEW.md section 1).
// Rotates artifacts/review/latest -> previous, then runs the capture spec on
// one worker. It owns browser port 5177, so it refuses to start while a loop
// iteration holds the runner lock.
import { spawnSync } from 'node:child_process'
import { existsSync, renameSync, rmSync } from 'node:fs'

if (existsSync('artifacts/loop/run.lock')) {
  console.error('review:capture: artifacts/loop/run.lock exists - a loop iteration is running; retry after it finishes.')
  process.exit(2)
}
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
process.exit(r.status ?? 1)
