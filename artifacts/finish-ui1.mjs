import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for UIR-1 (applied when the V-1 verdict is FIXED
// and the gates are green).
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-1 - Separate the stage name from the SCORE readout

- Status: TODO`
if (!tasks.includes(oldBlock)) throw new Error('UIR-1 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-1 - Separate the stage name from the SCORE readout

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('  1.', next.indexOf('### UIR-1'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-1 acceptance bounds')
next = next.slice(0, accStart) + `  - [x] A unit test on hudlayout asserts the STAGE_LABEL, SCORE and
        CHIP vertical extents (font size and origin) are disjoint with
        a gap of at least 1px (test/game/hudlayout.test.ts; pinned
        failing first - the old 1/12/23 stack overlapped ~5px). The kit
        suspect "overlapping text" is gone from every manifest entry
        (objective count: 42 suspects across 59 screens before, 0
        after).
  - [x] After npm run review:capture the affected screens are
        re-reviewed against previous/ (V-1 FIXED - before crop shows the glyph overlap, after shows three cleanly stacked lines; contact sheets and phone HUD clean (delegated)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const v1 = '### V-1 - Stage name is printed over the SCORE readout (S2, LAYOUT) - filed UIR-1'
if (!ledger.includes(v1)) throw new Error('V-1 heading')
ledger = ledger.replace(v1, '### V-1 - Stage name is printed over the SCORE readout (S2, LAYOUT) - fixed (self-check)')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 14:10 UTC - UIR-1 (attempt 1, HUD centre column - DONE)

- Status before: UIR-1 TODO (V-1: stage name printed over SCORE on
  every in-game screen; hudlayout STAGE_LABEL y1 top-origin spanned
  y1-11 into SCORE y12 centre-origin spanning y6.5-17.5).
- Work completed: re-spaced the centre column inside its 40px band
  (stage label y0, score y18, chip y25 - 1.5px gaps, above the boss
  rail at y40). TDD: test/game/hudlayout.test.ts extent model
  (matching HudScene's origins) pinned failing first, green after.
  Objective kit evidence: "overlapping text" suspects 42 across 59
  screens before -> 0 after. Before/after capture pair retained
  (manual rotation again: the latest->previous rename hits the
  persistent Windows EPERM; copy+delete with per-dir mkdirs worked).
  Delegated re-review: V-1 FIXED (before: glyphs share pixels and both texts unreadable; after: three cleanly stacked lines with clear gaps; no regressions on 21 screens or the phone HUD).
- Files changed: src/game/ui/hudlayout.ts, test/game/hudlayout.test.ts
  (UIR-1 block), TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md
  (V-1 fixed self-check).
- Verification run: lint 0; tsc 0; unit 646/646 + 1 skipped; review
  capture before+after; browser gates: E2E=0 (78), VISION=0 (5/5),
  SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Result: UIR-1 acceptance met.
- Status after: UIR-1 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-2..11 in
  the queue.
- Next recommended task: UIR-2 (boss WARNING banner depth).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
