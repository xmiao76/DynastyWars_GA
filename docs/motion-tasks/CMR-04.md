# CMR-04 — Generic guide, preparation and provenance tooling

- Queue status: DONE (attempt 1, 2026-10-01; verified same day) (live queue TASKS.md is authoritative).
- Dependencies: CMR-03 DONE; foundation/reference contract mandatory.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), inventory, generic profile/pack loader, existing `scripts/{prepare-motion,prepare-actions}.mjs`, guide generators, registration/provenance and prepared assets. Inspect existing files before replacement.

## Bounded work

- Parameterize fighter/role rather than copying Guan Yu paths. Guides cover applicable sequences, anatomy/proportions/weapon pose, stable camera and ground/saddle axes, and small-size readability.
- Support variable frame counts, named pages, per-sequence captures, explicit identity references, shared bookends, trimming/deduplication and ≤2048-page packing. Hash restored untrimmed frame pixels and pivots.
- Extract provider alpha or use a documented keying procedure. Remove halos/residue/specks without eating near-black costume. Validate order/bounds; do not blindly select the nine largest components or crop across merged figures.
- Keep fixed scale/registration. No silhouette-driven normalization per pose. Focused overrides record density/pivots explicitly; no dynamic retargeting or affine body warps.
- Same originals/config must produce deterministic frame pixels/pages/metadata. Record SHA-256, signatures, identity/source hashes, exact prompts, provider preference versus actual known backend, ordered references and candidate verdicts.
- Persist per-character request counters across A/B tasks and rounds. Enforce the 200-request total, character caps and two whole-sheet candidates per sequence before calling tools. Missing image capability is a blocker, not permission to install providers/plugins.

## Acceptance

- [x] Fighter ID selects separated source/output directories, never overwriting another accepted fighter. (`fighterPaths` validates ids and pins `art/motion/<id>` + `artifacts/motion/<id>`; `assertOwnOutput` refuses any write outside the id's own tree; the sentinel test proves fighter B's files survive fighter A's write.)
- [x] Hero/mook/boss/shooter fixtures exercise variable frames/page counts. (hero 8+5 frames with an explicit order permutation, mook 6/1 page, boss 20 across two sequences, shooter 4; no fixed 9-cell/90-frame assumption anywhere.)
- [x] Repeated preparation hashes are deterministic; Guan Yu displayed RGBA/pivot round-trip unchanged. (Double-run manifest/frame/page hashes identical; all 90 Guan Yu frames restore through the generic `restoreCellPixels` to their CMR-01 frozen RGBA hashes in `guanyu-reference.json`, with the fixed pivot 224,272 px = box centre over groundY at density 2.)
- [x] Missing/merged/clipped/wrongly ordered frames, residue, trim errors and budget violations fail explicitly. (10 named negative controls: missing, extra, merged-figure refusal (never crop across), edge-clipped, swapped-sheet identity mismatch, empty declared cell, residue over tolerance, trim overflow, page-limit and per-fighter decode-cap violations.)
- [x] Ground/pivot/identity/landmark reports measure actual pixels and leave unknown values unverified. (`buildReport` returns measured numbers when supplied and the literal string `unverified` for camera/ground/saddle/landmarks it cannot measure; provenance unknowns likewise.)
- [x] Outputs satisfy CMR-03 resource budgets. Reports distinguish displayed unique drawings from unused/duplicate source cells. (`validateBudget` enforces the 2048px page limit and 16 MiB/fighter decode cap with the CMR-03 constants; shared-atlas accounting shows cloned-canvas 0 and GPU = decoded; the duplicate fixture reports 5 unique / 2 duplicate / 3 unused of 10 source cells.)
- [x] No new production cast generation in this foundation task. (No image tool is called anywhere; the durable ledger `art/motion/generation-budget.json` records Guan Yu's grandfathered 17 requests and closes his allowance at cap 0.)

## Verification record (attempt 1)

- New tooling: `scripts/motion-pipeline.mjs` (fighter-parameterized extraction,
  alpha-only cleanup, order/bounds validation, trim/dedup/<=2048 packing,
  restored-pixel + pivot hashing, budget and provenance reports,
  per-fighter output writing) and `scripts/motion-budget.mjs` (durable
  request ledger: hero 16 / boss 12 / mook 8 / horse 4, 200 total, two
  whole-sheet candidates per sequence, counters persist across rounds).
  The Guan Yu pilot scripts (`prepare-motion.mjs`/`prepare-actions.mjs`) are
  left in place as the historical path; new fighters use the generic toolkit.
- Tests: `test/game/motion-pipeline.test.ts` (21) + `test/game/motion-budget.test.ts`
  (7) - fixtures are synthesized pixel arrays, no provider involved.
- Gates: lint + `tsc --noEmit` clean; unit `787 passed | 1 failed | 6 skipped`
  (the 1 failure is the known G6 V-15b arm-chain pin, UIR-16 BLOCKED; all
  motion regressions green). Browser/vision/prodbuild intentionally not run:
  no `src/game` or runtime-facing file changed in this task (tooling + tests
  + the committed ledger only).

## Checks

Run targeted pipeline units and current motion regressions, lint/typecheck; applicable browser, vision/prodbuild for runtime-sensitive changes. Keep bulky captures ignored; track accepted sources, retained candidates and provenance distinctly. Local commit; hand off to CMR-05.
