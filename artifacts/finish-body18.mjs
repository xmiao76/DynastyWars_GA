import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-18: mark DONE, archive UI-4 (21 DONE -> 20),
// prepend the PROGRESS entry.
const tasks = readFileSync('TASKS.md', 'utf8')
const oldBlock = `- Status: TODO
- Owner objection round 3 (d): "review all art/image materials to
  ensure each part is completed and no parts are missing."`
if (!tasks.includes(oldBlock)) throw new Error('BODY-18 block not found')
let next = tasks.replace(
  oldBlock,
  `- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (d): "review all art/image materials to
  ensure each part is completed and no parts are missing."`,
)
next = next.replace(
  `  - [ ] Audit test asserts no fighter silently lacks a part it draws;
        placeholders/orphans listed with disposition.
  - [ ] Every gap (e.g. no painted grip hands, no painted weapons,
        forearm cells ending in open palms) traced to a task.
  - [ ] Full gates green.
- Non-goals: no new art in this task.`,
  `  - [x] Audit test asserts no fighter silently lacks a part it draws;
        placeholders/orphans listed with disposition
        (test/game/artaudit.test.ts: 17 fighters x head pack + 10 cells,
        fill floor 0.15, interior-hole ratchet 0.40 -> BODY-23 lowers to
        0.08; beardless plans must ship an empty front layer; art/raw's
        109 inert placeholders + masters->consumers table in
        docs/ART_AUDIT.md).
  - [x] Every gap traced to a task: G1 no painted hands -> BODY-20; G2
        forearm cells end in open palms, G3 Wei Yan forearm cells are
        hand-only, G7 flat neck tube -> BODY-19; G4 procedural weapons ->
        BODY-21; G5 procedural capes, G6 keyed holes, G8 procedural
        boots -> BODY-23 (new).
  - [x] Full gates green: lint 0, typecheck 0, unit 610/610 (54 files),
        e2e 78 passed (motion spec opt-in), vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: test/game/artaudit.test.ts (3 tests; writes
  artifacts/look/audit/<id>-cells.png + inventory.json), docs/ART_AUDIT.md.
- Non-goals: no new art in this task.`,
)
if (next === tasks) throw new Error('no change')
if (!next.includes('  - [x] Every gap traced to a task')) throw new Error('acceptance not replaced')

// Archive UI-4 (the oldest DONE, first task heading).
const start = next.indexOf('### UI-4 - ')
const end = next.indexOf('### UI-5 - ')
if (start < 0 || end < start) throw new Error('UI-4 bounds')
const ui4 = next.slice(start, end)
next = next.slice(0, start) + next.slice(end)
const done = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (done !== 20) throw new Error(`DONE count ${done}`)
writeFileSync('TASKS.md', next)

let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### UI-4 - ')) throw new Error('UI-4 already archived')
arch = arch.replace(/\n*$/, '\n\n') + ui4.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-26 18:40 UTC - BODY-18 (attempt 1, art-materials completeness audit)

- Status before: BODY-18 TODO (owner round-3 objection (d): review all
  art/image materials so every part is complete and none is missing).
- Work completed: automated per-fighter inventory of every part the
  renderer draws (head pack portrait/head/front/rear, the 10 paper-doll
  cells, hands, weapon) marking painted / procedural / by-design-empty,
  with fill and interior-hole metrics per cell; composite contact sheet
  per fighter for the visual pass (all 17 reviewed with read_image);
  masters->consumers table and art/raw disposition (109 inert
  placeholders, no manifest consumer). Visual findings: forearm cells end
  in open palms (the fist is stamped over them, so two hands show); Wei
  Yan's forearm cells are hand-only (19-21% fill); Cao Cao / Xiahou Dun /
  Zhang Liao / Zhang He cells carry keyed holes (8-36% interior); capes,
  boots and weapons are procedural; neck tube is a flat shape over the
  collar. Every gap G1-G8 filed: BODY-19 (G2/G3/G7), BODY-20 (G1),
  BODY-21 (G4), new BODY-23 (G5/G6/G8). First gate run hit a 3-spec e2e
  flake (title scene not ready in 15 s); those specs passed 6/6 alone and
  the full rerun was green.
- Files changed: test/game/artaudit.test.ts (new), docs/ART_AUDIT.md
  (new), TASKS.md (BODY-18 DONE, BODY-19 G3/G7 lines, BODY-23 filed, UI-4
  archived), TASKS-ARCHIVE.md (UI-4), PROGRESS.md.
- Verification run: eslint 0; tsc 0; vitest 610/610 (54 files); browser
  gates (artifacts/run-body2-gates.ps1): E2E=0 (78 passed), VISION=0
  (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Result: BODY-18 acceptance met; no art changed (audit only).
- Status after: BODY-18 DONE.
- Remaining work or blocker: BODY-19..23 then the BODY-7 re-review
  sweep; owner acceptance of round 3 outstanding.
- Next recommended task: BODY-19 (IK arms, wrist-cut forearm cells,
  separate hand cell, Wei Yan re-cut, neck tube).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok, DONE', done, 'progress lines', (prog.split('\n').length + entry.split('\n').length - 1))
