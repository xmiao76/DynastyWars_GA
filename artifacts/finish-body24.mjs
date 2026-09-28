import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-24 (applied only when the motion review
// verdict is good and the gates are green).
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-24 - Pose interpolation and torso dynamics (motion engine)

- Status: IN_PROGRESS (attempt 1, 2026-09-27 UTC)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-24 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-24 - Pose interpolation and torso dynamics (motion engine)

- Status: DONE (attempt 2, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('- Acceptance criteria:', next.indexOf('### BODY-24'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('BODY-24 acceptance bounds')
next = next.slice(0, accStart) + `- Acceptance criteria:
  - [x] Motion review: combo and walk read as continuous movement
        (CONTINUOUS - eased in-between poses between every walk and combo key on all 3 hero sheets, no snapping/jitter/double-image (delegated review)). The blend frames come from lerpSkeleton +
        torsoLean/leanEnvelope (smoothstep easing; the upper body
        rotates into strikes about the pinned hip), inserted as two
        cached in-between textures at each pose swap - sim timing,
        poses and hits untouched.
  - [x] Reach/legibility/parity gates hold on interpolated frames
        (test/game/body24-frames.test.ts: face-clear + figure-ink on
        blend frames, heroes x 2 chains x 3 blend points; the weapon
        fits re-run per frame and re-clear the bow mid-sweep).
  - [x] Full gates green (lint 0, tsc 0, unit 646/646, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 13:10 UTC - BODY-24 (attempt 2, motion engine - DONE)

- Status before: BODY-24 IN_PROGRESS (attempt 1: interpolate.ts core
  + frame gates green; wiring pending).
- Work completed: the sprite wiring - registry.drawKindSkeleton +
  blendBoxFor/blendMarginFor (the blend box takes the wider reach
  margin so neither key's weapon clips), adapters/sprites.ts
  ensureBlendKey (lazy cached in-between textures, t=eased 1/3 and
  2/3, lerpSkeleton + strike lean) and GameScene's per-entity blend
  queue (two in-between frames step one per update at each pose
  swap; re-targeting mid-blend restarts; horse rig and the death
  fade swap directly). Sim timing, poses and hits untouched.
- Files changed: src/game/art/{interpolate.ts (attempt 1),
  registry.ts}, src/game/adapters/sprites.ts,
  src/game/scenes/GameScene.ts, test/game/{interpolate,
  body24-frames}.test.ts (attempt 1), TASKS.md, PROGRESS.md.
- Verification run: lint 0; tsc 0; unit 646/646 + 1 skipped;
  motion re-capture (delegated review: CONTINUOUS - eased in-between poses between every walk and combo key on guanyu/zhangfei/zhaoyun sheets, no snapping/jitter/double-image); browser gates: E2E=0 (78),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Result: BODY-24 acceptance met.
- Status after: BODY-24 DONE.
- Remaining work or blocker: BODY-7 acceptance needs the owner's
  cast review (the standing goal's last gate).
- Next recommended task: BODY-7 owner re-review; then UIR-1 queue.

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
