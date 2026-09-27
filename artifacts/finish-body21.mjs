import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-21: mark DONE, archive ART-20 (21 DONE -> 20),
// file review findings to BODY-22, prepend the PROGRESS entry.
// APPLY ONLY AFTER FULL GATES GO GREEN.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-21 - Realistic painted weapons

- Status: IN_PROGRESS (attempt 1, 2026-09-26 UTC - owner round-3 goal)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-21 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-21 - Realistic painted weapons

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)`,
)
const oldAcc = `  - [ ] All 7 weapons painted; drawn length/grip identical to the specs
        (test); ART-14/15 reach + silhouette gates hold.
  - [ ] Human-style review: weapons read realistic at gameplay size.
  - [ ] Full gates green.`
if (!next.includes(oldAcc)) throw new Error('BODY-21 acceptance not found')
next = next.replace(
  oldAcc,
  `  - [x] All 7 weapons painted; drawn length/grip identical to the specs
        (test/game/weaponparts.test.ts: 9 tests - byte-identical
        regeneration, spec parity, cell geometry, procedural-silhouette
        IoU>0.8 incl. bow at 3 draws, reach gates re-verified on painted
        renders, drawn width within 3u, gravity tassels, procedural
        fallback, boot publish atomicity).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-21 section):
        wood/steel/brass/cloth with bevels and grain, no ink; close pass
        on guanyu/huangzhong/weiyan (all 14 movements) + fresh motion
        clips/sheets; dao socket blob gone; residual polish filed
        (battle-worn blades -> BODY-22).
  - [x] Full gates green: lint 0, typecheck 0, unit 630/630 (57 files,
        +9 weaponparts), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: scripts/prepare-weapon-cells.mjs (new: 7 weapons + tassel,
  absolute-frame paint, per-head steel shading) + .d.mts (new),
  src/game/art/weapon-parts.ts (new: painter with per-pose grip pivot,
  bow x-scale, gravity tassel), adapters/weapon-art.ts (new: shared
  pack boot publish), hero-resources/BootScene/registry/drawFigure/
  figureShapes integration (weaponPart marks, procedural fallback),
  src/game/assets/weapons/ (new pack), test/game/weaponparts.test.ts
  (new), cast-art weapons loading, docs updates.`,
)
const b22tail = '- Non-goals: no sim/timing changes.'
if (!next.includes(b22tail)) throw new Error('BODY-22 tail not found')
next = next.replace(
  b22tail,
  `- From BODY-21 review: blades ship as clean studio paintwork; if the
  owner wants battle-worn character (nicks, fuller engraving, hamon),
  refine the generator - no pipeline change needed.
- Non-goals: no sim/timing changes.`,
)

// Archive ART-20 (the oldest DONE, first task heading).
const start = next.indexOf('### ART-20 - ')
const end = next.indexOf('### BODY-1 - ')
if (start < 0 || end < start) throw new Error('ART-20 bounds')
const art20 = next.slice(start, end)
next = next.slice(0, start) + next.slice(end)
const done = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (done !== 20) throw new Error(`DONE count ${done}`)
writeFileSync('TASKS.md', next)

let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### ART-20 - ')) throw new Error('ART-20 already archived')
arch = arch.replace(/\n*$/, '\n\n') + art20.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-26 23:30 UTC - BODY-21 (attempt 1, painted weapons)

- Status before: BODY-21 IN_PROGRESS (owner round-3 objection (b):
  "the weapons are not realistic" - flat hafts, block tassels, capsule
  butt caps, thick ink outlines).
- Work completed: one shared painted sheet (7 weapons + tassel) drawn
  over the EXACT procedural geometry - absolute-frame paint with
  per-pose grip pivots, bow x-scaled like traceBow(fore), tassel in
  the gravity frame. Materials: wood grain hafts, per-head steel
  bevels (crescent belly, serpent thread, leaf ridge, jian fuller +
  tip, dao belly, ji ridge + wings), brass fittings, cloth tassels;
  no ink anywhere. Draw time: weaponPart marks + painter with full
  procedural fallback; boot signature-verifies the pack. Tests gate
  byte-identical regeneration, spec parity, procedural-silhouette
  IoU>0.8 (incl. 3 bow draws), reach gates re-run on painted renders,
  drawn width within 3u, gravity tassels, fallback ink presence, and
  publish atomicity. Review: weapons 4, dao socket blob gone, no
  regressions vs the pre-21 baseline.
- Files changed: scripts/{prepare-weapon-cells.mjs (new),
  prepare-weapon-cells.d.mts (new)}, src/game/art/{weapon-parts.ts
  (new),draw.ts,registry.ts,hero-resources.ts}, src/game/adapters/
  weapon-art.ts (new), src/game/scenes/BootScene.ts, src/game/assets/
  weapons/ (new pack), test/game/{weaponparts.test.ts (new),cast-art.
  ts,artaudit.test.ts}, docs/{CHARACTER_REVIEW.md (BODY-21 section),
  ART_AUDIT.md (G4 resolved)}, TASKS.md (BODY-21 DONE, polish note to
  BODY-22, ART-20 archived), TASKS-ARCHIVE.md (ART-20), PROGRESS.md.
- Verification run: eslint 0; tsc 0; vitest 630/630 (57 files, +9);
  browser gates (artifacts/run-body2-gates.ps1): E2E=0 (78 passed),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4);
  motion review re-captured (5 heroes, 1 passed).
- Result: BODY-21 acceptance met; all 7 weapons painted on identical
  geometry, review reads realistic, gates green.
- Status after: BODY-21 DONE.
- Remaining work or blocker: BODY-22..23 then the BODY-7 re-review
  sweep; owner acceptance of round 3 outstanding.
- Next recommended task: BODY-22 (proportions + natural motion).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok, DONE', done)
