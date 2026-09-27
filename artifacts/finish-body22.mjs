import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-22: mark DONE, archive BODY-1 (21 DONE -> 20),
// prepend the PROGRESS entry.
// APPLY ONLY AFTER FULL GATES GO GREEN.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-22 - Whole-body proportions and natural motion pass

- Status: IN_PROGRESS (attempt 1, 2026-09-26 UTC - owner round-3 goal)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-22 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-22 - Whole-body proportions and natural motion pass

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)`,
)
const oldAcc = `  - [ ] Ratio table in CHARACTER_REVIEW.md, each value in its
        reference band, asserted per fighter.
  - [ ] Human-style motion review of every sequence reads natural;
        findings filed and fixed.
  - [ ] Full gates green.`
if (!next.includes(oldAcc)) throw new Error('BODY-22 acceptance not found')
next = next.replace(
  oldAcc,
  `  - [x] Ratio table in CHARACTER_REVIEW.md (11 rows: head, arm, leg,
        torso, fist, 4 weapon classes, taper, arm/leg constancy), each
        value in its reference band, asserted per fighter
        (test/game/proportions.test.ts: 5 tests; head cited from the
        BODY-14 harness which asserts it render-measured).
  - [x] Human-style motion review of every sequence (guanyu all-14 +
        caocao all-14 + fresh motion clips/sheets): legs bend at knees,
        lunges plant, walk free arm alternates; in-betweens/torso
        dynamics filed as BODY-24 (engine feature, out of scope here).
  - [x] Full gates green: lint 0, typecheck 0, unit 635/635 (58 files,
        +5 proportions), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: src/game/art/{armik.ts (naturalLegLengths, fitLeg, gait
  swungFreeTarget, solveArm protract flag),weapons.ts (leg IK +
  counter-swing in weaponPose)}, test/game/proportions.test.ts (new),
  docs/CHARACTER_REVIEW.md (ratio table + BODY-22 section), BODY-24
  filed (pose interpolation engine future).`,
)
const done = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (done !== 21) throw new Error(`DONE count ${done} (expected 21, BODY-1 archives)`)

// Archive BODY-1 (the oldest DONE, first task heading).
const start = next.indexOf('### BODY-1 - ')
const end = next.indexOf('### BODY-2 - ')
if (start < 0 || end < start) throw new Error('BODY-1 bounds')
const body1 = next.slice(start, end)
next = next.slice(0, start) + next.slice(end)
const doneAfter = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (doneAfter !== 20) throw new Error(`DONE count ${doneAfter} (expected 20 after archive)`)
writeFileSync('TASKS.md', next)

let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### BODY-1 - ')) throw new Error('BODY-1 already archived')
arch = arch.replace(/\n*$/, '\n\n') + body1.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-26 23:30 UTC - BODY-22 (attempt 1, proportions + natural motion)

- Status before: BODY-22 TODO (owner round-3 objection (c): correct
  whole-body/weapon/hand ratios + natural movement).
- Work completed: measured every ratio (probe: legs varied 0.56-1.14,
  worse than arms ever were; arms 0.26-0.27H ~ anatomical; weapons
  total 1.0-1.24H; fists 0.10H; taper 1.25). Fixes: two-bone IK legs
  (knees solve from pinned hips+feet, authored-knee branch; overreach
  to 9.7% stretches uniformly on straight legs, stances preserved to
  the pixel; down exempt as stylized compression) and a gait-swinging
  free arm for one-handers (stride-phase arc biased back for
  visibility; polearm grips untouched). Ratio table (11 rows) in
  CHARACTER_REVIEW.md with per-fighter test bands. Deliberate
  non-changes: no head re-seat (natural + gated), hand/blade polish
  deferred, in-betweens filed as BODY-24.
- Files changed: src/game/art/{armik.ts,weapons.ts},
  test/game/proportions.test.ts (new), docs/CHARACTER_REVIEW.md
  (table + section), TASKS.md (BODY-22 DONE, BODY-24 filed, BODY-1
  archived), TASKS-ARCHIVE.md (BODY-1), PROGRESS.md.
- Verification run: eslint 0; tsc 0; vitest 635/635 (58 files, +5);
  browser gates (artifacts/run-body2-gates.ps1): E2E=0 (78 passed),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4);
  motion review re-captured (5 heroes, 1 passed).
- Result: BODY-22 acceptance met; ratios tabled + banded, legs bend
  naturally, walk swings, gates green.
- Status after: BODY-22 DONE.
- Remaining work or blocker: BODY-23..24 then the BODY-7 re-review
  sweep; owner acceptance of round 3 outstanding.
- Next recommended task: BODY-23 (clean painted cells).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok, DONE', doneAfter)
