import { readFileSync, writeFileSync } from 'node:fs'

const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-6 - Point the touch d-pad chevrons outward

- Status: TODO`
if (!tasks.includes(oldBlock)) throw new Error('UIR-6 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-6 - Point the touch d-pad chevrons outward

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('  1.', next.indexOf('### UIR-6'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-6 acceptance bounds')
next = next.slice(0, accStart) + `  - [x] A unit test on the painted sheet shows each arm's chevron
        pointing the way it moves (test/game/uir6-chevrons.test.ts:
        the chevron's combined ink+gold pixels keep the tip at the arm
        centre and the wings behind it - pinned failing first, the old
        path read "wings not behind (inward -2.0px)" on every arm).
  - [x] After npm run review:capture the phone crops show outward
        arrows (FIXED - all four arms point outward in both phone frames (pixel-level ASCII-map confirmation by the reviewer; before state confirmed all four inward)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 655/655,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const v10 = '### V-10 - Touch d-pad chevrons point inward (S2, ASSET) - filed UIR-6'
if (!ledger.includes(v10)) throw new Error('V-10 heading')
ledger = ledger.replace(v10, '### V-10 - Touch d-pad chevrons point inward (S2, ASSET) - fixed (self-check)')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 19:20 UTC - UIR-6 (attempt 1, d-pad chevrons - DONE)

- Status before: UIR-6 TODO (V-10: every d-pad chevron pointed
  inward - hudart's chevron path had its apex at +y while the call
  angles assumed -y).
- Work completed: flipped the chevron path (tip at the arm centre,
  wings trailing behind; angle 0 points up). TDD: test/game/uir6-
  chevrons.test.ts measures the chevron's combined ink+gold pixels
  per arm (tip at the centre plane, wings inward by >=1px) - pinned
  failing first ("wings not behind (inward -2.0px)" on every arm),
  green after. Debug findings recorded: the chevron is a 1u band
  whose 0.8u ink stroke nearly covers its gold core, so the shape
  reads as an ink arrow; the test measures the combined shape and
  the ink match is tight (20,15,20 +/-8 - the lacquer's dark stop
  22,16,32 must not leak into the centroid).
- Files changed: src/game/art/hudart.ts, test/game/uir6-chevrons.test.ts
  (new), TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-10 fixed
  self-check).
- Verification run: lint 0; tsc 0; unit 655/655 + 1 skipped (+1 new
  pin); review capture after; browser gates: E2E=0 (79), VISION=0
  (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Delegated re-review: V-10 FIXED (up/down/left/right all OUTWARD in landscape + portrait; before state confirmed all four INWARD; one non-defect note: the down caret is slightly skewed at AA scale).
- Result: UIR-6 acceptance met.
- Status after: UIR-6 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-7..11.
- Next recommended task: UIR-7 (rotate-your-phone overlay).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
