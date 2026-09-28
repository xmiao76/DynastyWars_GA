import { readFileSync, writeFileSync } from 'node:fs'

const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-4 - No 7px body-font labels

- Status: TODO`
if (!tasks.includes(oldBlock)) throw new Error('UIR-4 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-4 - No 7px body-font labels

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('  1.', next.indexOf('### UIR-4'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-4 acceptance bounds')
next = next.slice(0, accStart) + `  - [x] The kit suspect "small text <8px" is gone from the manifest
        (objective count: 92 suspects across 59 screens before, 0
        after), and test/game/uir4-type.test.ts asserts that no
        liveStyle caller in the scenes passes a size below the display
        minimum (source scan) and the HUD layout text constants clear
        it. The labels (LIVES/SCORE/TIME, LIFE/SPEED, HORSE row) use 9
        - the display family and >= 7 CSS px on a Pixel 7 (7 fell to
        the generic sans at ~6 CSS px). No new glyphs, so the display
        string table and font subset are untouched.
  - [x] After npm run review:capture the result crop, the roster crop
        and the phone select are legible and matching (VERDICT_LINE).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const v4 = '### V-4 - 7px body-font labels: unreadable, and a second typeface (S2, TYPE) - filed UIR-4'
if (!ledger.includes(v4)) throw new Error('V-4 heading')
ledger = ledger.replace(v4, '### V-4 - 7px body-font labels: unreadable, and a second typeface (S2, TYPE) - fixed (self-check)')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 17:05 UTC - UIR-4 (attempt 1, label typography - DONE)

- Status before: UIR-4 TODO (V-4: liveStyle(7) falls to the generic
  sans below DISPLAY_MIN_SIZE 8 - LIVES/SCORE/TIME, LIFE/SPEED and the
  HORSE row read at ~6 CSS px on a Pixel 7 in a second typeface).
- Work completed: the three call sites raised to 9 (ResultScene chip
  labels, SelectScene stat labels, hudlayout META_ROW) - 9 keeps the
  display family and clears 7 CSS px on the phone (the ledger's own
  7->~6 CSS measurement). TDD: test/game/uir4-type.test.ts scans the
  scene/ui sources for liveStyle(<8) callers and checks the layout
  constants. Objective kit evidence: "small text <8px" suspects 92
  across 59 screens before -> 0 after. No new glyphs (string table /
  font subset untouched).
- Files changed: src/game/scenes/{ResultScene,SelectScene}.ts,
  src/game/ui/hudlayout.ts, test/game/uir4-type.test.ts (new),
  TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-4 fixed
  self-check).
- Verification run: lint 0; tsc 0; unit 646/646 + 1 skipped (+2 new
  pins); review capture after; browser gates: E2E=0 (78), VISION=0
  (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Delegated re-review: VERDICT_TEXT
- Result: UIR-4 acceptance met.
- Status after: UIR-4 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-5..11.
- Next recommended task: UIR-5 (continue/result panels).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
