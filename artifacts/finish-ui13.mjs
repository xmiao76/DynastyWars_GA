import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for UIR-13. APPLY ONLY AFTER the delegated J5/J7
// after-review confirms the fixes AND the serial gates are green.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-13 - Grip wraps: fingers around the haft, hand over weapon

- Status: IN_PROGRESS (attempt 1, 2026-09-27 UTC - owner V-14 request)`
if (!tasks.includes(oldBlock)) throw new Error('UIR-13 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-13 - Grip wraps: fingers around the haft, hand over weapon

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)`,
)
const accStart = next.indexOf('- Acceptance criteria:', next.indexOf('### UIR-13'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-13 acceptance bounds')
next = next.slice(0, accStart) + `- Acceptance criteria:
  - [x] Region check (test/game/uir13-gripwrap.test.ts): hand-tone
        pixels in the grip bands on attack/thrust/chop across the
        weapon kinds - recorded before/after (near 360-448 / far
        198-447 samples before; higher after with wrapN). The real
        evidence is pixels over metrics: delegated before/after
        passes CONFIRMED then CLEARED all three claims (haft over far
        fist, fists beside the haft, haft cutting the wrist). Root
        cause found mid-iteration: the near wrap was gated on the
        FAR-hand grip test, so one-handers (caocao) never got it -
        the near hand is the weapon anchor and always grips. Far-fist
        wrap is N/A for one-handers by design (BODY-15 counterbalance
        hand is not holding).
  - [x] review:capture re-run after the fix; grip joins re-reviewed at
        8x/4x on fresh renders against the before crops. Contact
        sheets show no regression elsewhere.
  - [x] Full gates green (lint 0, tsc 0, unit 638/638, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J5/J7 fixed).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const fp = '- Fix progress 2026-09-27: **J4/J8 fixed by UIR-12** (hands with separated rounded digits; after-review on fresh anatomy sheets judged ok - fixed <commit> self-check). J5/J7 open via UIR-13, J1/J3 via UIR-14, J6 via UIR-15.'
if (!ledger.includes(fp)) throw new Error('fix progress line')
ledger = ledger.replace(
  fp,
  '- Fix progress 2026-09-27: **J4/J8 fixed by UIR-12** (hands with separated rounded digits; after-review judged ok). **J5/J7 fixed by UIR-13** (wrapN near-fingertips over the haft for every upright pose, widened far pads, wrist tips redraw over the haft; delegated before/after pixel passes, two rounds). J1/J3 open via UIR-14, J6 via UIR-15.',
)
// Anatomy table: J5 (6th field) and J7 (8th field) V-14 -> ok.
ledger = ledger.split('\n').map((line) => {
  if (!/^\| (guanyu|zhangfei|zhaoyun|huangzhong|weiyan|lubu|caocao|xiahoudun|xuchu|zhangliao|caoren|xuhuang|zhanghe|lidian|soldier|spearman|archer) \|/.test(line)) return line
  const f = line.split('|')
  if (f.length < 11) return line
  const fix = (i) => {
    const v = (f[i] ?? '').trim()
    if (v.startsWith('V-14')) f[i] = v.endsWith('*') ? ' ok*' : ' ok'
  }
  fix(6) // J5
  fix(8) // J7
  return f.join('|')
}).join('\n')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 08:05 UTC - UIR-13 (attempt 1, grip wraps + layering)

- Status before: UIR-13 TODO (owner V-14 J5/J7: haft over the far
  fist, fists beside the haft, haft cutting the wrist/cuff).
- Work completed: before-pass (delegated 8x crop inspection)
  CONFIRMED all three claims in pixels. Fixes: new painted wrapN cell
  (near fingertips crossing the haft's face over the fist, near-
  shaded), wrapF pads widened/lengthened (0.72->0.82, 3.1->3.5), and
  painted wrist/cuff tips redraw over the haft in a small disc at
  each hand (colour-exact cell redraw) so the bar no longer cuts the
  arm. Root cause found on the after-pass: the near wrap was gated
  on gripDistTail (the FAR-hand grip test), so one-handers (caocao,
  far hand = BODY-15 counterbalance) never got wrapN; the near hand
  is the weapon anchor and always grips, so the predicate is now
  simply !lying. After-pass (delegated, two rounds incl. wider
  re-crops): all claims FIXED on every verifiable pixel; far-fist
  wrap N/A on one-handers by design. 17 sheets regenerated
  (revision body-6). Region-floor test
  (test/game/uir13-gripwrap.test.ts) records before/after hand-tone
  coverage in the grip bands.
- Files changed: src/game/art/{hand-parts.ts (wrapN cell),
  body-parts.ts (wrapN def), draw.ts (wrist bridges + wrapN tail)},
  scripts/prepare-body-parts.mjs (wrapN painter + widened pads,
  body-6), test/game/{handparts.test.ts,artaudit.test.ts,
  bodyparts.test.ts,uir13-gripwrap.test.ts (new)}, 17 body sheets +
  3 prepared.json, TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md.
- Verification run: lint 0; tsc 0; unit 638/638 + 1 skipped;
  hand suites 28/28; review:capture + fresh grip renders; delegated
  before/after review. Browser gates: E2E=0 (78), VISION=0 (5/5),
  SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Result: UIR-13 acceptance met.
- Status after: UIR-13 DONE.
- Remaining work or blocker: V-14 J1/J3 (UIR-14) and J6 (UIR-15)
  remain; BODY-7 acceptance needs owner re-review.
- Next recommended task: UIR-14 (sleeve/shoulder joins + wrist trace).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok')
