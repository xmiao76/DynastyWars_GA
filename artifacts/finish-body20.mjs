import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-20: mark DONE, archive ART-19 (21 DONE -> 20),
// file review findings to BODY-22, prepend the PROGRESS entry.
// APPLY ONLY AFTER FULL GATES GO GREEN.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-20 - Realistic painted hands

- Status: IN_PROGRESS (attempt 1, 2026-09-26 UTC - owner round-3 goal)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-20 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-20 - Realistic painted hands

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)`,
)
const oldAcc = `  - [ ] Every fighter's hands render from painted cells in every
        movement (test); procedural hands only on the emergency path.
  - [ ] Human-style review: hands read realistic and gripping.
  - [ ] Full gates green.`
if (!next.includes(oldAcc)) throw new Error('BODY-20 acceptance not found')
next = next.replace(
  oldAcc,
  `  - [x] Every fighter's hands render from painted cells in every
        movement (test/game/handparts.test.ts: 5 tests - byte-identical
        regeneration, all 17x5 cells non-empty + skin-matched +
        hand-sized + ink-free, painted-vs-procedural liveness, per-part
        procedural fallback; handgrip now asserts the painted render
        tolerantly + the bare render exactly).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-20 section):
        soft-shaded fists/open hands/fingertip wraps, skinned per
        fighter, scalloped digits, no ink; close pass on guanyu (all 14
        movements 4x + whole-body 2x), weiyan, zhangfei + fresh motion
        clips/sheets; residual polish filed (finger articulation, thumb
        separation -> BODY-22).
  - [x] Full gates green: lint 0, typecheck 0, unit 621/621 (56 files,
        +5 handparts), e2e 78 passed, vision 5/5, selfplay 13/13, build
        0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (hand cell painter: fist /
  open-hand silhouettes, form shading, thumb, creases; 5 cells appended
  to each body sheet, revision body-3), scripts/prepare-body-parts.d.mts
  (new), src/game/art/hand-parts.ts (new: dispatch painter),
  body-parts.ts (5 hand defs), draw.ts (painted near/far/relaxed/wrap
  at all 5 hand sites, procedural fallback intact), 17 sheets + 3
  prepared.json regenerated, test/game/handparts.test.ts (new),
  handgrip + review-harness tolerant matches.`,
)
const b22tail = '- Non-goals: no sim/timing changes.'
if (!next.includes(b22tail)) throw new Error('BODY-22 tail not found')
next = next.replace(
  b22tail,
  `- From BODY-20 review: hands ship at "painted" quality - remaining
  polish is finer finger articulation + thumb separation at 4x+ zoom
  (gameplay size reads well). Revisit if the owner wants gallery-grade
  digits; candidate route is generator refinement, no new pipeline.
- Non-goals: no sim/timing changes.`,
)

// Archive ART-19 (the oldest DONE, first task heading).
const start = next.indexOf('### ART-19 - ')
const end = next.indexOf('### ART-20 - ')
if (start < 0 || end < start) throw new Error('ART-19 bounds')
const art19 = next.slice(start, end)
next = next.slice(0, start) + next.slice(end)
const done = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (done !== 20) throw new Error(`DONE count ${done}`)
writeFileSync('TASKS.md', next)

let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### ART-19 - Painted per-stage backdrops')) throw new Error('ART-19 already archived')
arch = arch.replace(/\n*$/, '\n\n') + art19.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-26 22:30 UTC - BODY-20 (attempt 1, painted hands)

- Status before: BODY-20 IN_PROGRESS (owner round-3 objection (b):
  "the hand not realistic" - flat cartoon capsules with ink outlines
  on painted-realistic bodies).
- Work completed: five painted hand cells per fighter (gripN/gripF
  fists, relaxN/relaxF open hands, wrapF far fingertips), generated in
  the prep script and appended to each body sheet (revision body-3):
  skin-matched from the joints table, far cells shaded dark, soft form
  light/shadow, thumb, scalloped digit fronts, short creases, NO ink
  outline. Draw time: new handCellPainter orients cells by the IK arm
  (fists/relaxed along the forearm, wrap along the haft) and swaps all
  five hand sites to the cells with per-part procedural fallback
  (no-art fighters keep the old capsules as the emergency path). Two
  refinement passes driven by an art-director cell review (first cut
  too egg-like with claw-scar creases; fixed silhouette + crease
  direction). Incidental: prepare-body-parts.d.mts (unit tests import
  the prep module); unused tintC removed. Gates: handgrip + the BODY-14
  harness now match hand tones tolerantly on the painted render while
  keeping exact matches on the procedural render.
- Files changed: scripts/{prepare-body-parts.mjs,prepare-body-parts
  .d.mts (new)}, src/game/art/{hand-parts.ts (new),body-parts.ts,
  draw.ts}, 17 body sheets + 3 prepared.json (regen),
  test/game/{handparts.test.ts (new),handgrip.test.ts,
  reviewharness.test.ts,bodyparts.test.ts}, docs/{CHARACTER_REVIEW.md
  (BODY-20 section),ART_AUDIT.md (G1 resolved)}, TASKS.md (BODY-20
  DONE, polish note to BODY-22, ART-19 archived), TASKS-ARCHIVE.md
  (ART-19), PROGRESS.md.
- Verification run: eslint 0; tsc 0; vitest 621/621 (56 files, +5);
  browser gates (artifacts/run-body2-gates.ps1): E2E=0 (78 passed),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4);
  motion review re-captured (5 heroes, 1 passed).
- Result: BODY-20 acceptance met; every fighter's hands render from
  painted cells, read realistic + gripping, gates green.
- Status after: BODY-20 DONE.
- Remaining work or blocker: BODY-21..23 then the BODY-7 re-review
  sweep; owner acceptance of round 3 outstanding.
- Next recommended task: BODY-21 (painted weapons).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok, DONE', done)
