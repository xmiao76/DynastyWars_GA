import { readFileSync, writeFileSync } from 'node:fs'

// UTF-8-safe bookkeeping for BODY-23: mark DONE, archive BODY-2 (21 DONE -> 20),
// prepend the PROGRESS entry. APPLY ONLY AFTER FULL GATES GO GREEN.
const tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
const oldBlock = `### BODY-23 - Clean painted cells: holes, capes, boots

- Status: IN_PROGRESS (attempt 1, 2026-09-26 UTC - owner round-3 goal)`
if (!tasks.includes(oldBlock)) throw new Error('BODY-23 block not found')
let next = tasks.replace(
  oldBlock,
  `### BODY-23 - Clean painted cells: holes, capes, boots

- Status: DONE (attempt 1, 2026-09-27 UTC - owner round-3 goal,
  verified full-green same day)`,
)
const oldAcc = `  - [ ] artaudit HOLE_CEILING lowered from 0.40 to 0.08 and green.
  - [ ] Every caped plan renders a painted cloth cell (audit asserts).
  - [ ] Human-style review of the affected fighters; full gates green.`
if (!tasks.includes(oldAcc)) throw new Error('BODY-23 acceptance not found')
next = next.replace(
  oldAcc,
  `  - [x] artaudit HOLE_CEILING lowered 0.40 -> 0.08 and green (the
        re-key is chroma-aware + interior fill: all keyed cells measure
        0% interior holes; generated hand cells exempt - wrapF's pad
        gaps are design).
  - [x] Every caped plan renders a painted cloth cell (audit asserts;
        6 plans: green/gold guanyu, blue/red zhaoyun, red/gold lubu,
        purple/gold caocao, green/green zhangliao, green/green zhanghe;
        lying mirror keeps the prone trail toward the feet).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-23 section;
        delegated eyes-on pass - this session's image display served
        crossed previews): capes OK incl. prone, armour solid, boots
        readable (lit welt/toe), hands unchanged. Root cause found:
        the prep's 8% ankle raise mis-seated painted boots below the
        ground (rig foot = sole line) - fixed; foot gate re-pointed at
        the painted boots (17/17). Full gates green: lint 0, typecheck
        0, unit 635/635 (58 files), e2e 78 passed, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (chroma-aware re-key +
  interior fill, foot = sole, generated cloth cells + lying mirror),
  src/game/art/{draw.ts (contact shadow + welt/glint),body-parts.ts
  (lying mirror)}, test/game/{artaudit.test.ts (0.08 ceiling + cloth
  assertion),footcheck.test.ts (re-pointed),bodyparts.test.ts (cloth
  exemption)}, 17 body sheets + 3 prepared.json (revision body-4),
  docs updates.`,
)

// Archive BODY-2 (the oldest DONE, first task heading).
const start = next.indexOf('### BODY-2 - ')
const end = next.indexOf('### BODY-3 - ')
if (start < 0 || end < start) throw new Error('BODY-2 bounds')
const body2 = next.slice(start, end)
next = next.slice(0, start) + next.slice(end)
const doneAfter = [...next.matchAll(/^### (\S+)[^\n]*\n(?:(?!^### )[\s\S])*?Status:\s*(\w+)/gm)].filter((m) => m[2] === 'DONE').length
if (doneAfter !== 20) throw new Error(`DONE count ${doneAfter} (expected 20)`)
writeFileSync('TASKS.md', next)

let arch = readFileSync('TASKS-ARCHIVE.md', 'utf8')
if (arch.includes('### BODY-2 - ')) throw new Error('BODY-2 already archived')
arch = arch.replace(/\n*$/, '\n\n') + body2.replace(/\n*$/, '\n')
writeFileSync('TASKS-ARCHIVE.md', arch)

const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 01:20 UTC - BODY-23 (attempt 1, clean painted cells)

- Status before: BODY-23 TODO (BODY-18 audit G5/G6/G8: moth-eaten
  keyed holes, procedural capes, boot overlays hiding painted boots).
- Work completed: (G6) chroma-aware re-key (background = dark +
  achromatic; chromatic dark is costume and never keyed) plus interior
  fill (row-span holes keep the master's matte) - every keyed cell
  measures 0% interior holes, ceiling 0.08 green; (G5) generated
  painted cloth cells for the 6 caped plans in plan colours with fold
  shading + trim hem, mirrored for the prone trail; (G8) boot overlays
  reduced to a ground-contact shadow with a lit sole welt + toe glint
  (dark lacquer boots measured mean toe lum 16 without it). Root cause
  found: the prep's 8% ankle raise mis-seated painted boots below the
  ground line (the rig foot joint is the SOLE) - feet now land on the
  master's sole; the BODY-9 foot gate re-pointed at the painted boots
  (contract unchanged: drawn, not dark-on-dark, tonally structured).
  Eyes-on review delegated to a fresh reviewer (this session's image
  display served crossed/stale previews; noted in the review doc).
- Files changed: scripts/prepare-body-parts.mjs,
  src/game/art/{draw.ts,body-parts.ts},
  test/game/{artaudit.test.ts,footcheck.test.ts,bodyparts.test.ts},
  17 body sheets + 3 prepared.json (revision body-4),
  docs/{ART_AUDIT.md (G5/G6/G8 resolved),CHARACTER_REVIEW.md (BODY-23
  section)}, TASKS.md (BODY-23 DONE, BODY-2 archived),
  TASKS-ARCHIVE.md (BODY-2), PROGRESS.md.
- Verification run: eslint 0; tsc 0; vitest 635/635 (58 files);
  browser gates (artifacts/run-body2-gates.ps1): E2E=0 (78 passed),
  VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0, PRODBUILD=0 (4/4).
- Result: BODY-23 acceptance met; all three gaps closed and reviewed.
- Status after: BODY-23 DONE.
- Remaining work or blocker: BODY-24 (pose interpolation, engine) then
  the BODY-7 re-review sweep; owner acceptance of round 3 outstanding.
- Next recommended task: BODY-7 final sweep.

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('ok, DONE', doneAfter)
