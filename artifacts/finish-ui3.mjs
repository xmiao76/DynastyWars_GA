import { readFileSync, writeFileSync } from 'node:fs'

const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-3 - One stage announcement, not two at once

- Status: TODO`
if (!tasks.includes(oldBlock)) throw new Error('UIR-3 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-3 - One stage announcement, not two at once

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('  1.', next.indexOf('### UIR-3'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-3 acceptance bounds')
next = next.slice(0, accStart) + `  - [x] A spec shows that no frame has the introCard at alpha > 0
        while stageBanner is at alpha > 0.05 (e2e/introcard.spec.ts
        UIR-3: samples every animation frame across a stage entry;
        pinned failing first - the offenders list recorded the old
        overlap, e.g. "t=1642ms card=0.21 banner=1.00"). Autopilot
        still dismisses the card by tick count (existing test green;
        run() never stalls).
  - [x] After npm run review:capture the stage-entry screens show one
        announcement at a time (FIXED - intro-card moment shows the card alone, banner moment shows the banner alone, no doubles across the flow sheet (delegated)). Sequencing is enforced
        by a state gate (the card refuses to rise while a stageBanner
        shows - the banner tween's alpha tail outlives a naive
        duration sum) plus a derived nominal delay
        (INTRO_CARD_DELAY_MS).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const v3 = '### V-3 - Stage banner and intro card announce the same thing at the same time (S2, TIMING) - filed UIR-3'
if (!ledger.includes(v3)) throw new Error('V-3 heading')
ledger = ledger.replace(v3, '### V-3 - Stage banner and intro card announce the same thing at the same time (S2, TIMING) - fixed (self-check)')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 16:15 UTC - UIR-3 (attempt 1, stage announcements - DONE)

- Status before: UIR-3 TODO (V-3: banner + intro card naming the same
  stage at once; the card rose at 1_600ms into the banner's life).
- Work completed: sequencing by state gate - the intro card refuses
  to rise while any stageBanner shows (alpha > 0.05), plus a derived
  nominal delay (INTRO_CARD_DELAY_MS = hold + 2 sweeps + slack;
  BANNER_SWEEP_MS extracted so the tween and the math share one
  source). TDD: e2e/introcard.spec.ts UIR-3 samples every animation
  frame across a stage entry and asserts no co-show; pinned failing
  first (offenders recorded: "t=1642ms card=0.21 banner=1.00" etc.
  - the tween's alpha tail outlived the naive duration sum, which is
  why the state gate is the real contract). Autopilot tick dismissal
  unchanged (existing tests green).
- Files changed: src/game/scenes/HudScene.ts, e2e/introcard.spec.ts,
  TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-3 fixed
  self-check).
- Verification run: lint 0; tsc 0; unit 646/646 + 1 skipped; spec
  5/5 (incl. the new pin); review capture after; browser gates:
  E2E=0 (78), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4).
- Delegated re-review: V-3 FIXED (each capture moment shows exactly one stage announcement; no double announcement across the flow sheet).
- Result: UIR-3 acceptance met.
- Status after: UIR-3 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-4..11.
- Next recommended task: UIR-4 (no 7px body-font labels).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
