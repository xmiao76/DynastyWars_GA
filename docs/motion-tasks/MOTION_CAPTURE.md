# Motion capture & review — the actual whole-character motion path (CMR-05)

The UI review (`docs/VISUAL_REVIEW.md`) captures default art and rig
anatomy. This harness captures the **opt-in runtime motion path**
(`?motion=1`) itself: actual decoded/drawn runtime frame keys and boxes,
per-tick traces with player/AI/projectile provenance, named actions, both
facings, Canvas/WebGL, real mixed choreography and labelled injected stress
cases. It never relabels rig anatomy as motion evidence.

## Capture command (per fighter / role / renderer)

```bash
# Guan Yu (hero) on canvas - the accepted reference fighter
node scripts/motion-capture.mjs --fighter guanyu --role hero --renderer canvas

# Same fighter on WebGL (renderer parity evidence)
node scripts/motion-capture.mjs --fighter guanyu --role hero --renderer webgl

# Strict mode: unverified landmarks fail the run instead of listing open items
node scripts/motion-capture.mjs --fighter guanyu --role hero --renderer canvas --strict
```

The runner gathers provenance (git commit, dirty state, pack revision
`motion-2`, page SHA-256s from `src/game/assets/motion/*.json`, the pack
pivot), rotates the previous capture to `artifacts/motion-review/previous/`
(so before/after pairs survive any number of runs), drives
`e2e/motion-capture.spec.ts` with `MOTION_CAPTURE=1`, then validates the
live capture through `scripts/motion-review-core.mjs` and writes
`report.json`, `index.json`, `contact-sheet.png` and `pairs/`.

Role selects the action inventory (`hero`, `shooter`, `boss`, `mook`,
`horse`) and the capability list that must become observable before that
role's first character integration — shooter `projectile`, boss `charge`/
`enrage`, and `held`/`thrown`/`recovery`/`ko`/`coop`/`interruptions` for
the player-capable roles (see `ROLE_CAPABILITIES`).

## Outputs (`artifacts/motion-review/<fighter>-<renderer>/`)

| file | contents |
| --- | --- |
| `trace.json` | per-tick rows: `key` (actual runtime frame id `entity:<kind>:motion:<clip>:<idx>` or the legacy key), `state`/`stateTick`/`tick`, `attackId`, `facing`, `actor`/`kind`, `source` (player/ai/projectile/injected), `origin` (gameplay/injected), `clock` (phase/lives/continueMsLeft), `box` (full untrimmed cell on screen, camera-scroll aware) |
| `frames/<action>-<facing>.png` | 4x-of-logical crops of the full cell box (full boots/head/blade), captured with the HUD hidden |
| `index.json` | commit/dirty, pack revision + source hashes, measured + `unverified` landmarks, capability list, coverage matrix, evidence links |
| `report.json` | trace validation verdict, integrity split (hard defects vs open items), pacing report, resource report (CMR-03 budget vocabulary), coverage summary |
| `contact-sheet.png`, `pairs/` | contact sheet of the crops; before/after pair sheets against the rotated previous capture, labelled with both commits |
| `<fighter>-<renderer>.webm` | owner-playable video of the capture run |

## Validation (negative controls, `scripts/motion-review-core.mjs`)

`validateTrace` rejects, each with its own explicit error: **unknown frames**
(key not in the pack), **old/new texture mixing** (one fighter showing motion
and legacy art in one capture; per-fighter, so a co-op pair with a legacy
partner is not mixing), **blank/missing packs**, **residue** over tolerance,
**missing bindings** (an observed attack with no clip binding), **stale
provenance** (rows not from the commit they claim) and **clock defects**
(per-actor tick/stateTick/wall regressions outside freeze/pause).
`assertIndexIntegrity` rejects an **unseen pose labelled natural** and any
**null/unseen landmark** — those can never pass.

The runner additionally rejects **blank/black crops** (a frame that is ~all
black is a capture bug, never review evidence). This guard exists because
the first webgl capture produced 100% black crops silently: the spec drew
`game.canvas` outside the render frame, and with `preserveDrawingBuffer:
false` a WebGL drawing buffer is already cleared there. Crops now come from
`game.renderer.snapshot()` (post-render `gl.readPixels`), which is correct
on both renderers.

Coverage cells are `captured` or `unseen`; there is no silent `N`.
`--strict` fails a run whose landmarks are unverified; without it they are
listed as OPEN items (consumer self-check only — producers verify fresh).

## Inspection limitations (stated, not hidden)

- Headless capture pacing is NOT normal-speed playback evidence; the pacing
  report measures wall ms per sim tick and says so.
- Videos are owner-playable evidence; the trace's `elapsedMs` is reported,
  never smoothed.
- Reviewer image previews were unreliable in one session (harness attached
  stale previews); crops were then verified mechanically instead (the
  CONTINUE-card parchment metric: 0.0% in a clean crop vs >25% with the
  card). A future pass should still eyeball fresh crops.
- Landmarks `contactU`/`weaponTipU` stay `unverified` until measured from
  pixels (producer verification); `groundErrorU` and `pivotU` are recorded
  from the capture (feet registration 0u; pivot 224,272 px).

## Relationship to the existing review

Everything in `docs/VISUAL_REVIEW.md`, `docs/UI_REVIEW_LEDGER.md` and
`scripts/review-capture.mjs` stays authoritative for default art: the
ledger cadence, pinning (`--pin`/`--unpin`), rubric and independent
producer verification are unchanged. This harness ADDS the opt-in motion
path's evidence on top; consumers self-check with it and mark findings
`fixed <commit> (unverified)`, never `verified`.
