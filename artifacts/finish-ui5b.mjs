import { readFileSync, writeFileSync } from 'node:fs'

const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast

- Status: TODO`
if (!tasks.includes(oldBlock)) throw new Error('UIR-5 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('  1.', next.indexOf('### UIR-5'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-5 acceptance bounds')
next = next.slice(0, accStart) + `  - [x] A unit check shows the title bounds lie within the card's
        panelRect inset by at least 4px (CONTINUE_TEXT stack vs the
        184x96 dialog at cy 123; title and countdown disjoint), that
        the chip row's centre is within 1px of the panel's centre and
        no chip crosses the frame (resultChipRow() laid out from the
        x 70..410 band with even 20px gaps - test/game/hudlayout.test
        .ts UIR-5 block; the old row spanned x70-390, centre 230).
  - [x] After npm run review:capture the continue and result panels
        re-reviewed (FIXED - continue title fully below the gold rule with the dark stroke (countdown too), result title clear of the top bar, chip row centred with even gaps and LIVES off the border; matches PAUSED (delegated, before state confirmed in previous/)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 654/654,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
for (const [head, fixed] of [
  ['### V-5 - Result chip row is not centred and the LIVES chip sits on the panel frame (S2, LAYOUT) - filed UIR-5', '### V-5 - Result chip row is not centred and the LIVES chip sits on the panel frame (S2, LAYOUT) - fixed (self-check)'],
  ['### V-6 - Panel titles collide with their card\'s top frame (S2, LAYOUT) - filed UIR-5', '### V-6 - Panel titles collide with their card\'s top frame (S2, LAYOUT) - fixed (self-check)'],
  ['### V-7 - CONTINUE? title and countdown have no contrast on parchment (S2, COLOUR) - filed UIR-5', '### V-7 - CONTINUE? title and countdown have no contrast on parchment (S2, COLOUR) - fixed (self-check)'],
]) {
  if (!ledger.includes(head)) throw new Error('heading missing: ' + head)
  ledger = ledger.replace(head, fixed)
}
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 18:10 UTC - UIR-5 (attempt 1, panels - DONE)

- Status before: UIR-5 TODO (V-5/V-6/V-7: uncentred result chip row
  with LIVES on the border; CONTINUE? and STAGE CLEAR! titles colliding
  with their gold frames; un-stroked title/countdown on parchment).
- Work completed: hudlayout gains the shared composition
  (CONTINUE_TEXT stack, RESULT_CHIP + resultChipRow() laid out from
  the x70..410 panel band with even 20px gaps, centred); HudScene's
  continue texts move inside the card (title y92->102, countdown
  126->132) and take PAUSED's dark stroke; ResultScene's STAGE CLEAR!
  drops 8px clear of the top bar and the chip row uses the shared
  layout. TDD: UIR-5 block in test/game/hudlayout.test.ts (title
  insets >=4px + disjoint stack, chip centre within 1px, no chip
  crosses the frame).
- Files changed: src/game/ui/hudlayout.ts, src/game/scenes/{HudScene,
  ResultScene}.ts, test/game/hudlayout.test.ts, TASKS.md, PROGRESS.md,
  docs/UI_REVIEW_LEDGER.md (V-5/V-6/V-7 fixed self-check).
- Verification run: lint 0; tsc 0; unit 654/654 + 1 skipped (+2 new
  pins); review capture after; browser gates: E2E=0 (79), VISION=0
  (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Delegated re-review: V-5 FIXED (row centred, even gaps, chips inside frame) | V-6 FIXED (titles dropped clear of frames) | V-7 FIXED (title + countdown carry the dark stroke) - delegated review with the before state confirmed.
- Result: UIR-5 acceptance met.
- Status after: UIR-5 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-6..11.
- Next recommended task: UIR-6 (touch d-pad chevrons).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
