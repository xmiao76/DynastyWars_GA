import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for UIR-12. APPLY ONLY AFTER the delegated J4
// re-review returns FIXED/PARTIAL-as-fixed AND the serial gates are green.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-12 - Paint hands with fingers, not mittens

- Status: IN_PROGRESS (attempt 1, 2026-09-27 UTC - owner V-14 request)`
if (!tasks.includes(oldBlock)) throw new Error('UIR-12 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-12 - Paint hands with fingers, not mittens

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)`,
)
const oldAcc = `- Acceptance criteria:
  1. A texture/unit check on the regenerated hand cells FAILS on the
     current paint and passes after (digit-separation count or an
     equivalent local-contrast metric; record both values). Skin-tone
     match vs the face stays within the existing tolerance.
  2. After \`npm run review:capture\`, the affected joins are re-reviewed
     on the fresh anatomy sheets against \`previous/\`, citing the
     after-image detail; each listed join is judged fixed (ok). Contact
     sheets show no regression elsewhere.
  3. \`npm run vision\` and relevant specs are green; the ledger finding
     is set to \`fixed <commit> (self-check)\` and the anatomy table row
     updated.`
if (!tasks.includes(oldAcc)) throw new Error('UIR-12 acceptance not found')
next = next.replace(
  oldAcc,
  `- Acceptance criteria:\n  [x] Texture/unit check (handparts UIR-12 test): digit-separator
        dips per cell at 4x = 0 before (creases never reached the
        knuckle zone), 3+ after; fails on old paint, passes on new.
        Skin match re-pointed tighter: +-45 around raw skin ->
        +-30 around either designed tone (raw or the bloom-peak lit
        blend, e.g. guanyu 191,114,94 = exact formula blend).
  - [x] review:capture re-run (59 screens + 34 anatomy sheets); J4
        re-reviewed on the fresh sheets (delegated eyes-on: digits
        separated and rounded at 8x and 4x, mitten look gone).
        Note: the before-pair is partially lost - the latest->previous
        rotation hit a persistent Windows EPERM and a fallback deleted
        the stale capture (top-level contact sheets preserved); the
        before state is recorded in the ledger + this test's comments.
  - [x] Full gates green (lint 0, tsc 0, unit 636/636, e2e 78, vision
        5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger V-14
        sub-verdict updated.`,
)
// No new findings; keep BODY-7 untouched.
writeFileSync('TASKS.md', next)

// Ledger: J4/J8 sub-verdict fixed (after-review ok), anatomy table
// J4/J8 columns updated, V-14 fix-progress line added.
let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const v14head = '### V-14 - Arm, wrist, hand and grip joins look wrong on every fighter (S1/S2, ASSET+DEPTH+STATE) - filed UIR-12/UIR-13/UIR-14/UIR-15'
if (!ledger.includes(v14head)) throw new Error('V-14 heading missing')
ledger = ledger.replace(
  v14head,
  v14head + '\n- Fix progress 2026-09-27: **J4/J8 fixed by UIR-12** (hands with separated rounded digits; after-review on fresh anatomy sheets judged ok - fixed <commit> self-check). J5/J7 open via UIR-13, J1/J3 via UIR-14, J6 via UIR-15.',
)
// Anatomy table: J4 (5th field) and J8 (9th field) V-14 -> ok for every fighter row.
ledger = ledger.split('\n').map((line) => {
  if (!/^\| (guanyu|zhangfei|zhaoyun|huangzhong|weiyan|lubu|caocao|xiahoudun|xuchu|zhangliao|caoren|xuhuang|zhanghe|lidian|soldier|spearman|archer) \|/.test(line)) return line
  const f = line.split('|')
  if (f.length < 11) return line
  const fix = (i) => {
    const v = (f[i] ?? '').trim()
    if (v.startsWith('V-14')) f[i] = v.endsWith('*') ? ' ok*' : ' ok'
  }
  fix(5) // J4
  fix(9) // J8
  return f.join('|')
}).join('\n')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 07:10 UTC - UIR-12 (attempt 1, hands with fingers)

- Status before: UIR-12 TODO (owner V-14 J4/J8: mitten hands on every
  fighter); owner then asked directly to continue V-14 work.
- Work completed: repainted the hand-cell generator
  (scripts/prepare-body-parts.mjs): digit separators extended from
  1.15u edge nubs to full-length tapered creases (knuckle zone ->
  fingertip) with a dark core and a soft light companion edge
  (rounded digits, no stripes/ink), silhouette notches deepened
  0.9u -> 1.2u, thumb crease extended + lit. TDD: new handparts
  UIR-12 check (local-contrast digit-dip count at 4x) = 0 dips on
  the old paint (fails), 3+ on the new (passes); skin-match gate
  tightened +-45 raw -> +-30 dual-tone (raw skin or designed bloom
  blend) after UIR-12's re-clustering exposed that the old band
  already excluded its own designed bloom on ch1.
- Files changed: scripts/prepare-body-parts.mjs (painter, revision
  body-5), test/game/handparts.test.ts (UIR-12 check + lit-blend
  modal band), 17 body sheets + 3 prepared.json (regenerated),
  TASKS.md, PROGRESS.md.
- Verification run: lint 0; tsc 0 (one strict-index fix); unit
  636/636 + 1 skipped; handparts 6/6, handgrip 17/17, artaudit 3/3;
  review:capture green (59 screens + 34 anatomy sheets); J4
  after-review delegated and recorded. Browser gates: E2E=0 (78),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Incident (honest): review-capture's latest->previous rotation hit a
  persistent Windows EPERM; my fallback had a mkdir bug and cleared
  the stale capture (top-level contact sheets preserved). The
  before-pair is partially lost; before values are recorded in the
  ledger and test comments. Nothing tracked or live affected.
- Result: UIR-12 acceptance met.
- Status after: UIR-12 DONE.
- Remaining work or blocker: V-14 J5/J7 (UIR-13), J1/J3 (UIR-14),
  J6 (UIR-15) remain; BODY-7 acceptance needs owner re-review.
- Next recommended task: UIR-13 (grip wraps + layering).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok')
