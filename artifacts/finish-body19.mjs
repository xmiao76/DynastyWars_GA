import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-19: mark DONE, archive UI-5 (21 DONE -> 20),
// file review findings to BODY-21/22, prepend the PROGRESS entry.
// APPLY ONLY AFTER FULL GATES GO GREEN.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-19 - Arms connected and natural in every movement

- Status: IN_PROGRESS (attempt 1, 2026-09-26 UTC - owner round-3 goal)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-19 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-19 - Arms connected and natural in every movement

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)`,
)
const oldAcc = `  - [ ] Every arm segment within 95-105% of natural length in every
        movement for every fighter (test); wrist-to-hand continuity
        (hand drawn at its forearm's end) asserted.
  - [ ] Human-style review of all movements: arms read attached and
        natural; findings filed.
  - [ ] Reach tests unchanged; full gates green.`
if (!next.includes(oldAcc)) throw new Error('BODY-19 acceptance not found')
next = next.replace(
  oldAcc,
  `  - [x] Every arm segment within 95-105% of natural length in every
        movement for every fighter (test/game/armik.test.ts: 6 tests;
        measured exactly 100.0% on all 17x14; far-hand reach + 12u fist
        separation asserted; protraction capped, worst 5.9u xuchu:thrust,
        shoulder inside torso); wrist-to-hand continuity via wrist-cut
        forearm cells + fist backs extended to -3.2u (raw cell verified).
  - [x] Human-style review of all movements (docs/CHARACTER_REVIEW.md
        BODY-19 section): anatomy 4 in every movement (recover/down were
        1); close pass on 10 fighters + fresh motion clips/sheets for all
        5 heroes; findings filed (dao socket blob -> BODY-21, fists ->
        BODY-20, frozen walk arms + chin-drop note -> BODY-22).
  - [x] Reach tests unchanged; full gates green: lint 0, typecheck 0,
        unit 616/616 (55 files, +6 armik), e2e 78 passed, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4.
- Delivered: src/game/art/armik.ts (new: two-bone IK, natural lengths,
  bow cant+shift fit, far-hand haft search, down-pose drop),
  weapons.ts (weaponPose rewrite, weaponAnchor), draw.ts (gripping far
  forearm in front of torso, open lying hand, fist backs -3.2, neck G7),
  rig.ts (weaponAnchor), scripts/prepare-body-parts.mjs (68 arm joints
  re-landmarked from gridded crops, wrist-cut, revision body-2), 17
  body sheets + 3 prepared.json regenerated, test/game/armik.test.ts.`,
)
// Review findings filed forward.
const b21 = '- Non-goals: no new weapon kinds; no sim changes.'
if (!next.includes(b21)) throw new Error('BODY-21 tail not found')
next = next.replace(
  b21,
  `- From BODY-19 review: purple/white blob at the dao blade socket in
  some poses (walk1/windup/down/hurt) - pre-existing, verified against
  the pre-19 baseline side by side; weapon geometry, in scope here.
- Non-goals: no new weapon kinds; no sim changes.`,
)
const b22tail = '- Non-goals: no sim/timing changes.'
if (!next.includes(b22tail)) throw new Error('BODY-22 tail not found')
next = next.replace(
  b22tail,
  `- From BODY-19 review: standing heads never received the BODY-16 chin
  drop (dead code on the standing branch - applying it shifts heads
  4.8u and grazes the face gate); any head re-seat must re-verify
  weapons.test. Walk arms are frozen copies of idle (no counter-swing).
- Non-goals: no sim/timing changes.`,
)

// Archive UI-5 (the oldest DONE, first task heading).
const start = next.indexOf('### UI-5 - ')
const end = next.indexOf('### ART-19 - ')
if (start < 0 || end < start) throw new Error('UI-5 bounds')
const ui5 = next.slice(start, end)
next = next.slice(0, start) + next.slice(end)
const done = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (done !== 20) throw new Error(`DONE count ${done}`)
writeFileSync('TASKS.md', next)

let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### UI-5 - Flow screens')) throw new Error('UI-5 already archived')
arch = arch.replace(/\n*$/, '\n\n') + ui5.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-26 20:30 UTC - BODY-19 (attempt 1, IK arms + connected hands)

- Status before: BODY-19 TODO (owner round-3 objections (a)+(c): arms
  missing/unconnected/unnatural). Round-3 baseline (BODY-17 review):
  far fist floating with no arm (37u reach on a 24.5u arm), open palm +
  stamped fist (two hands), arm lengths varying to 128% (recover
  forearm 3u), down pose gripping mid-air.
- Work completed: two-bone IK arms with constant natural segment lengths
  (src/game/art/armik.ts, new): elbows solved per pose with the authored
  elbow as the bend hint; overreach protracts the shoulder (worst 5.9u
  xuchu:thrust, inside torso) instead of stretching; far hand searched
  along the haft both directions (12u fist separation, 85%-reach comfort,
  relaxed fallback); bow canted toward vertical + minimal shift per pose
  (curve-model face check: idle shift 6-7, strikes cant -0.1..-0.55 with
  shift 0-5, all within reach + protraction); down pose drops the weapon
  across the body with an open resting hand (new weaponAnchor). Paint:
  gripping far forearm moved in front of the torso; fist/mitten backs to
  -3.2u; flat neck wedge removed over painted collars (G7). Prep: all 34
  arm joint landmarks re-measured from gridded crops (old elbows sat at
  the cuff); forearm cells cut at the wrist (revision body-2); Wei Yan's
  forearms now carry sleeve (fill 19-21% -> 32-33%, G3 fixed). Found en
  route: the BODY-16 standing chin drop is dead code (preserved; flagged
  for BODY-22) and the bow is drawn symmetric (+-fore, not the grip
  split) - both documented in code. Review: anatomy 4 in every movement
  (recover/down were 1), 10/17 fighters close-passed + fresh motion
  clips/sheets; dao socket blob filed to BODY-21 (pre-existing).
- Files changed: src/game/art/{armik.ts (new),weapons.ts,draw.ts,
  rig.ts}, scripts/prepare-body-parts.mjs, 17 body sheets + 3
  prepared.json (regen), test/game/armik.test.ts (new, 6 tests),
  docs/CHARACTER_REVIEW.md (BODY-19 section), TASKS.md (BODY-19 DONE,
  findings to BODY-21/22, UI-5 archived), TASKS-ARCHIVE.md (UI-5),
  PROGRESS.md.
- Verification run: eslint 0; tsc 0; vitest 616/616 (55 files, +6);
  browser gates (artifacts/run-body2-gates.ps1): E2E=0 (78 passed),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4);
  motion review re-captured (5 heroes, 1 passed).
- Result: BODY-19 acceptance met; arms attached + constant-length,
  hands continuous at the wrist, down weapon dropped, bow cants clear.
- Status after: BODY-19 DONE.
- Remaining work or blocker: BODY-20..23 then the BODY-7 re-review
  sweep; owner acceptance of round 3 outstanding.
- Next recommended task: BODY-20 (painted hands).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok, DONE', done)
