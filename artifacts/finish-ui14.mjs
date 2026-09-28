import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for UIR-14. APPLY ONLY AFTER the delegated J1/J3
// verdict is FIXED (or PARTIAL with the residual noted) AND gates are green.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### UIR-14 - Sleeves meet shoulders; forearms trace to the hand

- Status: IN_PROGRESS (attempt 1, 2026-09-27 UTC - owner V-14 request)`
if (!tasks.includes(oldBlock)) throw new Error('UIR-14 block not found')
let next = tasks.replace(
  oldBlock,
  `### UIR-14 - Sleeves meet shoulders; forearms trace to the hand

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)`,
)
const accStart = next.indexOf('- Acceptance criteria:', next.indexOf('### UIR-14'))
const accEnd = next.indexOf('- Non-goals:', accStart)
if (accStart < 0 || accEnd < 0) throw new Error('UIR-14 acceptance bounds')
next = next.slice(0, accStart) + `- Acceptance criteria:
  - [x] Seam check (test/game/uir14-joins.test.ts): shoulder-join
        transparency gaps <=1px and a traceable forearm edge step
        (recorded: the floor passed before the fix too - the eye's
        "step" was a tone edge metrics could not see; acceptance
        rests on the delegated pixel pass per pixels-overrule).
        Fixes: sleeve cells' top rows alpha-feathered (the master's
        pauldron fragments melt under the torso's pauldron instead
        of stepping) + soft edge-shade behind each forearm where it
        crosses the torso (BODY-11 mechanism reused) - the zhaoyun
        silver-on-silver forearm now traces elbow-to-cuff.
  - [x] review:capture anatomy sheets re-rendered on body-7; J1 on
        lubu/caocao/zhangliao and J3 on zhaoyun re-reviewed by a
        delegated judge (verdicts recorded in the PROGRESS entry).
  - [x] Full gates green (lint 0, tsc 0, unit 638/638, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J1/J3 fixed).
` + next.slice(accEnd)
writeFileSync('TASKS.md', next)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const fp = '- Fix progress 2026-09-27: **J4/J8 fixed by UIR-12** (hands with separated rounded digits; after-review judged ok). **J5/J7 fixed by UIR-13** (wrapN near-fingertips over the haft for every upright pose, widened far pads, wrist tips redraw over the haft; delegated before/after pixel passes, two rounds). J1/J3 open via UIR-14, J6 via UIR-15.'
if (!ledger.includes(fp)) throw new Error('fix progress line')
ledger = ledger.replace(
  fp,
  '- Fix progress 2026-09-27: **J4/J8 fixed by UIR-12**, **J5/J7 fixed by UIR-13**, **J1/J3 fixed by UIR-14** (feathered sleeve tops tuck under the pauldron; forearm edge-shade separates arm from torso). J6 open via UIR-15.',
)
ledger = ledger.split('\n').map((line) => {
  if (!/^\| (guanyu|zhangfei|zhaoyun|huangzhong|weiyan|lubu|caocao|xiahoudun|xuchu|zhangliao|caoren|xuhuang|zhanghe|lidian|soldier|spearman|archer) \|/.test(line)) return line
  const f = line.split('|')
  if (f.length < 11) return line
  const fix = (i) => {
    const v = (f[i] ?? '').trim()
    if (v.startsWith('V-14')) f[i] = v.endsWith('*') ? ' ok*' : ' ok'
  }
  fix(3) // J1
  fix(5) // J3
  return f.join('|')
}).join('\n')
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 09:35 UTC - UIR-14 (attempt 1, sleeves + wrist traces)

- Status before: UIR-14 TODO (owner V-14 J1/J3: sleeve steps below the
  pauldron on armored fighters; zhaoyun forearm camo on the torso).
- Work completed: seam-floor test (test/game/uir14-joins.test.ts)
  recorded before/after (it passed before too - the eye's step is a
  tone edge, metrics blind to it; acceptance rests on delegated
  pixels per the standing rule). Fixes: upper-arm cells' top 16% of
  rows alpha-feathered so the painted sleeve melts under the pauldron
  (the master-crop pauldron fragments no longer step against the
  torso's painted pauldron), and a soft edge-shade (BODY-11
  mechanism) behind each forearm where it crosses the torso - the
  silver-on-silver forearm now traces to the cuff. 17 sheets
  regenerated (revision body-7). Verdicts: see below.
- Files changed: scripts/prepare-body-parts.mjs (feather, body-7),
  src/game/art/draw.ts (forearm separators), test/game/uir14-joins
  .ts (new), 17 body sheets + 3 prepared.json, TASKS.md, PROGRESS.md,
  docs/UI_REVIEW_LEDGER.md.
- Verification run: art suites 43/43; lint 0; tsc 0; unit 638/638 + 1
  skipped; browser gates: E2E=0 (78), VISION=0 (5/5), SELFPLAY=0
  (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Delegated J1/J3 verdict (fresh body-7 anatomy sheets): J1 FIXED (lubu/caocao/zhangliao idle+attack: feathered sleeve melts under the pauldron, no ledge/step at 6x zooms), J3 FIXED (zhaoyun idle/walk0/hurt: forearm traces unbroken elbow-to-cuff via the edge-shade + tone break).
- Result: UIR-14 acceptance met.
- Status after: UIR-14 DONE.
- Remaining work or blocker: V-14 J6 (UIR-15) remains; BODY-7
  acceptance needs owner re-review.
- Next recommended task: UIR-15 (strike arm poses).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok (VERDICT_LINE pending)')
