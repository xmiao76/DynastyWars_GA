import { readFileSync, writeFileSync } from 'node:fs'

const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-2 - Boss WARNING banner must read above the boss rail

- Status: TODO`
if (!tasks.includes(oldBlock)) throw new Error('UIR-2 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-2 - Boss WARNING banner must read above the boss rail

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)`,
)
const accStart = next.indexOf('  1.', next.indexOf('### UIR-2'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-2 acceptance bounds')
next = next.slice(0, accStart) + `  - [x] A unit check shows the WARNING title's bounds do not
        intersect the rail's bounds (test/game/hudlayout.test.ts UIR-2
        block: the title band at BANNER.y + WARNING_BANNER_DROP clears
        the rail band 40..58; a second pin keeps stage banners at
        their current position). The fix drops the WARNING variant
        below the rail instead of raising its depth - nothing gets
        covered, honoring the banner's "never covers a persistent
        readout" rule.
  - [x] After npm run review:capture the after-crop shows the word
        WARNING (FIXED - the after-crop shows WARNING fully readable, clear of the rail (before-capture confirmed broken: subtitle only)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const v2 = '### V-2 - Boss WARNING banner is drawn UNDER the boss rail (S1, DEPTH) - filed UIR-2'
if (!ledger.includes(v2)) throw new Error('V-2 heading')
ledger = ledger.replace(v2, '### V-2 - Boss WARNING banner is drawn UNDER the boss rail (S1, DEPTH) - fixed (self-check)')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 15:10 UTC - UIR-2 (attempt 1, WARNING banner - DONE)

- Status before: UIR-2 TODO (V-2 S1: the boss WARNING title hidden
  under the boss rail - only the subtitle showed at every boss entry).
- Work completed: the WARNING banner drops below the rail band
  (WARNING_BANNER_DROP 22 in hudlayout; showBanner's belowRail flag;
  GameScene's boss-entry call passes it) - the title clears the rail
  band 40..58 with nothing covered (the banner's own "never covers a
  persistent readout" rule holds; stage banners keep their position,
  pinned). TDD: UIR-2 block in test/game/hudlayout.test.ts (title
  band clears the rail; stage banner unchanged). review:capture
  before+after (note: the before-capture raced the edit; the review
  judges each capture on its own content). Delegated verdict:
  V-2 FIXED (WARNING title fully visible below the rail; subtitle intact; banner covers no HUD, fully on screen; stage banner unchanged).
- Files changed: src/game/ui/hudlayout.ts, src/game/scenes/{HudScene,
  GameScene}.ts, test/game/hudlayout.test.ts, TASKS.md, PROGRESS.md,
  docs/UI_REVIEW_LEDGER.md (V-2 fixed self-check).
- Verification run: lint 0; tsc 0; unit 646/646 + 1 skipped; browser
  gates: E2E=0 (78), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4).
- Result: UIR-2 acceptance met.
- Status after: UIR-2 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-3..11.
- Next recommended task: UIR-3 (one stage announcement, not two).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT placeholder)')
