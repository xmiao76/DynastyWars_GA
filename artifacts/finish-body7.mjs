import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for the BODY-7 sweep: record the green serial run
// + report, keep BODY-7 IN_PROGRESS (owner acceptance is criterion 2 and
// only the owner can close it). No DONE-count change -> no archive.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-7 - Full verification sweep for the body overhaul

- Status: IN_PROGRESS (attempt 1)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-7 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-7 - Full verification sweep for the body overhaul

- Status: IN_PROGRESS (sweep complete 2026-09-27 UTC, awaiting owner
  acceptance - the one gate only the owner can close)`,
)
const oldAcc = `  - [ ] Every gate green in one serial run; report recorded.
  - [ ] Owner accepts the final cast (unresolved objections stay open).`
if (!next.includes(oldAcc)) throw new Error('BODY-7 acceptance not found')
next = next.replace(
  oldAcc,
  `  - [x] Every gate green in one serial run; report recorded (this
        round: lint 0, tsc 0, unit 635/635, e2e 78, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4; whole-cast review of
        all 17x14 + motion, 18 flags all dismissed with evidence, no
        UIR filings; byte/decode/boot report in PROGRESS).
  - [ ] Owner accepts the final cast (unresolved objections stay open).`,
)
writeFileSync('TASKS.md', next)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 02:10 UTC - BODY-7 (final sweep, gates + whole-cast review)

- Status before: BODY-7 IN_PROGRESS (attempt 1); round-3 work
  BODY-19..23 DONE and committed; owner UI review (ledger + UIR
  batches) owns the screens, BODY track owns the characters.
- Work completed: full serial run green in one go (lint 0, tsc 0,
  unit 635/635 over 58 files, e2e 78 passed, vision 5/5 incl. the
  sprite gate on live textures, selfplay 13/13, build 0, prodbuild
  4/4). Whole-cast review: all 17 fighters x 14 poses read (12
  direct + 3 parallel review passes), motion re-captured for all 5
  heroes and reviewed (162 frames each: clean alternation, phasing,
  no popping/detachment). 18 review flags adjudicated, ALL dismissed
  with evidence (exact grip geometry, 0 painted-weapon face pixels
  across 17x14, verified crops; several were crossed-image misreads
  - see the BODY-7 section in CHARACTER_REVIEW.md). No S1-S3
  findings: no UIR tasks filed from the character sweep. Byte
  report: 8.60 MB shipped PNG (bodies 2.2, faces 6.2, weapons 0.06,
  horse 0.3), ~46.3 MB decoded RGBA, boot-to-title 6.8s with 17/17
  bodies + heads + horse + weapons published.
- Files changed: docs/CHARACTER_REVIEW.md (BODY-7 sweep section),
  TASKS.md (BODY-7 progress note), PROGRESS.md. No code or art
  changes (sweep found nothing to fix).
- Verification run: the serial run above IS the verification (one
  run, all green); review material regenerated in it (movesheets,
  audit, motion clips).
- Result: BODY-7 acceptance (1) met and recorded; acceptance (2)
  needs the owner.
- Status after: BODY-7 IN_PROGRESS (awaiting owner acceptance).
- Remaining work or blocker: owner acceptance of the final cast;
  BODY-24 (pose interpolation) and ENH-12 remain TODO/queued.
- Next recommended task: owner review; then BODY-7 DONE + goal close.

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok')
