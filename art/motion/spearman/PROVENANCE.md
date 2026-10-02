# Wei Spearman motion pack — generation provenance (CMR-07A)

Every request: `image_generate`, preferred GPT / quality high / 1536x1024
(3x3 cells of 512x341), actual serving backend not disclosed. Ordered
references per request: `[body master, portrait master]` (hashes in
IDENTITY.md). Original art only; no third-party references. Shared prompt
requirements in every request: exact 3x3 grid at fixed cell size, same
scale/camera/ground line, one rigid spear identical in every cell,
transparent background, no glow/shadow/text/panels/effects, full helmet
finial + boots + spearhead inside every cell.

Budget ledger (`art/motion/generation-budget.json`, authoritative): the
spearman allowance is 8, shared across CMR-07A/CMR-07B; two whole-sheet
candidates per sequence. Used 6 (one second candidate after an honest
rejection), 2 remaining.

| seq | candidate | sha256 | verdict |
| --- | --- | --- | --- |
| locomotion | locomotion-candidate-1.png | `a1eede91f7bfefddedd62785987fb52cdd2e92d8cdb2c5f2c8b73bcf845b7fdf` | ACCEPT - 9/9 figures in 9 cells (idle, walk contact/pass/far-leg/pass2, stop, retreat x2, guard bookend); identity/spear/scale consistent; full boots/spearhead/finial in frame; mechanical grid check + fingerprint-verified visual review both pass |
| thrust | thrust-candidate-1.png | `dd123d6a565ac2e93d5e4d9e3e610b73dfee43d40e729a660b0693390017b1d9` | ACCEPT - 9/9 cells (guard, windup, startup, strike x2 at full extension with both hands spaced on the shaft, recover x3, guard bookend = cell 1); spear length constant, no forks; direction steps <= 60 deg with intervening drawings; 1 bbox-overlap suspect = wide thrust crossing nominal territory (reviewed, not a merge: component count is 9/9) |
| hitstun-held | hitstun-held-candidate-1-REJECTED.png | `f480e8bf4cb2fc386b13c4ed91cf48ed84ce829e87be0d16c1d6213d709a4806` | REJECT - only 8 figures in 8 cells: cell (2,1)/position 5 (the HELD 2 struggling pose) is EMPTY (mechanical grid check + preview). A pack cannot ship a missing drawing ("no old-part frames used as missing new poses"). Quarantined in place; not used by preparation. |
| hitstun-held | hitstun-held-candidate-2.png | `ae03032aec5b43933be241ca9c75836dd8bfa64285ecf49c6f0951c28e9b2627` | ACCEPT - 9/9 cells (guard, hitstun recoil/fold/stagger, held upright x2 with both arms pinned and spear still gripped, escape shove/reset, guard bookend); coherent progression, rigid spear, no forks/mittens/extra limbs; 5 bbox-overlap suspects from dynamic poses crossing nominal territory (reviewed, not merges: component count is 9/9) |
| fall-thrown | fall-thrown-candidate-1.png | `2d25cc829058e0d4efd0dbd26c7c56b216d9020649a2e091cd76dd119ddd8b04` | ACCEPT - 9/9 cells (topple, airborne, impact, DOWN bookend, thrown tumble x2, side impact x2, DOWN bookend); prep note: the two DOWN cells drifted slightly -> enforce shared down bookend by mapping position 9 to cell 4's pixels |
| getup-death | getup-death-candidate-1.png | `b78c4af9eaa50bc40231ed18dc38c0aba27d14e394e9165bbfb2b6ed649959ba` | ACCEPT - 9/9 cells (elbow push-up, kneel, crouch, DOWN bookend, fatal jolt, knee collapse, crumple, dead on side, guard bookend); prep note: shared guard/down bookends are drawn independently on each sheet -> enforce by mapping every bookend position to ONE reference cell across the pack |

All five accepted candidates: mechanical grid checks pass (9 figures / 9
cells / no sheet-edge cuts) and the reviews were fingerprint-verified
reads.

## Session tooling note

The review of every sheet used the mandatory fingerprint protocol
(soldier AUTHORING-PLAN.md): preview pixels were cross-checked against a
mechanical fingerprint of the file (dims/aspect/alpha share) before any
verdict. Both reads this round matched on first attempt; the accepted
verdicts rest on verified reads.

## Preparation record (2026-10-02, `scripts/prepare-spearman.mjs`)

Registration model (the accepted one): ONE uniform scale for the whole
pack (0.6-packMax-derived, target the tallest drawing fitting its cell
with trim pad), cell-centre/ground anchors, shared guard/down bookends
enforced by alias (aliased source cells count as unused). No runtime
catalog activation (that is CMR-07B).

Scale-consistency evidence: the guard-bbox heights read 336/345/364px
(8.04% spread) because the upright spear extends above the helmet by a
grip-dependent amount - NOT a scale difference. Verified visually: a 1:1
composite of the three guard cells on a shared ground line shows helmet,
shoulder, belt, knee and boot landmarks aligned at the same heights. The
driver gate therefore trips only on gross disagreement (>12%); fine
consistency is verified by the acceptance-4 head-size measurement.

Cleanup evidence: low-alpha glow is proportional to figure area on every
sheet (23-35% of opaque pixels); fall-thrown reads highest absolute
(124,281px) because its tumbling/prone figures cover the most area. The
per-fighter residue tolerance is 150,000 (measured max + headroom).

Pack result (deterministic - manifest sha256 re-ran identical):

| field | value |
| --- | --- |
| manifest sha256 | `3a1472ef3481872711e011c190226ed93c25bfb0f669c9f3c91d7041d1bd911d` |
| frames | 45 (37 displayed unique + 8 shared-bookend aliases) |
| pages | `spearman-1` 2039x928 (<= 2048^2) |
| decoded RGBA | 6,648,260 B (6.34 MiB <= 16 MiB) |
| GPU (shared atlas) | 6,648,260 B; cloned-canvas 0 B |
| counts | sourceCells 45 / displayedUnique 37 / duplicate 8 / unused 8 |
| suspects | 7 bbox-overlap hints (wide poses crossing nominal territory; reviewed, component counts exact) |

Outputs: `artifacts/motion/spearman/spearman/` (manifest.json, report.json,
pages/) - temporary output; accepted sources remain in
`art/motion/spearman/`.

Still unverified (cannot establish compliance): head-size and
spear-length spreads (<=10% requirement) and the offline continuity
review citing frame IDs - next unit of work.

## Remaining budget plan (2 left)

Authoring is COMPLETE at 6/8 (five whole-sheet candidates accepted, one
honest rejection spent a repair reserve). The 2 remaining requests are
reserved for targeted repairs / second candidates during preparation and
review.
