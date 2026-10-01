# CMR-04 — Generic guide, preparation and provenance tooling

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
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

- [ ] Fighter ID selects separated source/output directories, never overwriting another accepted fighter.
- [ ] Hero/mook/boss/shooter fixtures exercise variable frames/page counts.
- [ ] Repeated preparation hashes are deterministic; Guan Yu displayed RGBA/pivot round-trip unchanged.
- [ ] Missing/merged/clipped/wrongly ordered frames, residue, trim errors and budget violations fail explicitly.
- [ ] Ground/pivot/identity/landmark reports measure actual pixels and leave unknown values unverified.
- [ ] Outputs satisfy CMR-03 resource budgets. Reports distinguish displayed unique drawings from unused/duplicate source cells.
- [ ] No new production cast generation in this foundation task.

## Checks

Run targeted pipeline units and current motion regressions, lint/typecheck; applicable browser, vision/prodbuild for runtime-sensitive changes. Keep bulky captures ignored; track accepted sources, retained candidates and provenance distinctly. Local commit; hand off to CMR-05.
