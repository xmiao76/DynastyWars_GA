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
| repair-A (fall) | fall-thrown-repair-candidate-1.png | `33fcecc15c35806eca59678affe343d29d273c03375c45fcfcea822ca9c9cbbf` | PARTIAL - witness guard + all 8 fall poses with locomotion guard as 3rd scale reference. Grid: 9 figures + 8 faint panel-seam fragments (splice takes largest-component-only; sheet cleaned before splice). Witness 350px (+10.4% uniform offset, method cross-checked exactly on the reference cell). Per-cell zoom verification: A:4->fall:3 (350, SPLICE), A:7->fall:6 (361, borderline SPLICE), A:8 (390 still over, SKIP), A:2 (294 under + excluded target, SKIP), A:1/A:3/A:5/A:6 (targets excluded or kept-originals better, SKIP). |
| repair-B (mixed) | mixed-repair-candidate-1.png | `ffe7e9da10105ddbb2761d5e90c8e7ac05c7e0594990c222118de22b6b19ab10` | PARTIAL - witness + thrust:3/:4 + hitstun:7 + getup:0/:1/:2/:6/:7. Grid perfect 9/9/0. Witness 345px (+8.8% uniform). Zoom verification: B:1->thrust:3 (347, SPLICE), B:2->thrust:4 (350, cleanest, SPLICE), B:3->hitstun:7 (360 borderline, SPLICE), B:6->getup:2 (335, converts unverified->verified, SPLICE), B:7->getup:6 (314, SPLICE); B:4 (401), B:5 (370), B:8 (282) still out-band (SKIP - targets unfixable, see residuals). |

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

Registration model (the accepted one): ONE uniform scale PER SHEET (the
soldier's measured 0.3% cross-sheet agreement justified a pack-wide scale;
the spearman's does not), cell-centre/ground anchors, shared guard/down
bookends enforced by alias (aliased source cells count as unused). No
runtime catalog activation (that is CMR-07B).

### Scale evidence and a correction (read this)

The first preparation used one pack-wide scale and the gate trip at 8.04%
(guard bbox 336/345/364px) was attributed to spear overhang with the claim
that "helmet, shoulder, belt, knee and boot landmarks align". That claim
was too generous: re-reading the composite, the hitstun-held guard's helmet
sits visibly higher than locomotion's. Controlled measurement
(`scripts/measure-spearman.mjs`; the standing-guard pose is identical in
every sheet that has one, so it isolates scale from pose) with TWO
independent proxies gave:

| sheet | face-to-ground ratio | face sqrt-area ratio | verdict |
| --- | --- | --- | --- |
| locomotion | 1 | 1 | reference |
| thrust | 1.034 | 0.961 | proxies disagree in sign -> within resolution, factor 1 (UNRESOLVED) |
| hitstun-held | 0.919 | 0.847 | both say smaller -> factor 0.883 applied (+/-0.036) |
| fall-thrown | - | - | no standing guard cell -> UNVERIFIED, factor 1 |
| getup-death | 0.951 | 1.104 | proxies disagree in sign -> UNRESOLVED, factor 1 |

Rule: a factor is applied only where both proxies agree on direction; the
proxies resolve about +/-5%, so one-sided corrections would be invented
precision. Pose-dependent measures (guard bbox with the spear tip, torso
mass, face area on tilted heads, shaft thickness on 2-5 drawings) were
tried and rejected as scale evidence for exactly that reason (shaft
thickness read 4/4/4/5/4.6 px - quantised to whole pixels, no resolving
power below 25%).

Effect: only hitstun-held changes (scale 0.553 vs 0.626); the other four
sheets share one scale. Whether the residual uncertainty meets the <=10%
head-size requirement is NOT claimed here - it is the acceptance-4 question
(next section) and stays open.

### Cleanup evidence

Low-alpha glow is proportional to figure area on every sheet (23-35% of
opaque pixels); fall-thrown reads highest absolute (124,281px) because its
tumbling/prone figures cover the most area. Per-fighter residue tolerance
is 150,000 (measured max + headroom).

### Pack result (deterministic - manifest sha256 re-ran identical)

| field | value |
| --- | --- |
| manifest sha256 | `59493b2b0e5a2b79e4aa8d8c65b6f94d42a091ef07a3e26d97e3e3bebd2f2d94` |
| frames | 45 (37 displayed unique + 8 shared-bookend aliases) |
| pages | `spearman-1` 2038x923 (<= 2048^2), 26.2% opaque (non-blank verified) |
| decoded RGBA | 6,416,716 B (6.12 MiB <= 16 MiB) |
| GPU (shared atlas) | 6,416,716 B; cloned-canvas 0 B |
| counts | sourceCells 45 / displayedUnique 37 / duplicate 8 / unused 8 |
| suspects | 7 bbox-overlap hints (wide poses crossing nominal territory; reviewed, component counts exact) |

Outputs: `artifacts/motion/spearman/spearman/` (manifest.json, report.json,
pages/) - temporary output; accepted sources remain in
`art/motion/spearman/`.

### Acceptance-4 evidence status (diagnosis complete, owner-directed redraw round)

Method (`scripts/spear-line-spearman.mjs` + `scale-compare-spearman.mjs`,
both committed): RANSAC straight-line fit on wood shaft pixels + extension
through the head, per-cell endpoint overlay adjudicated by
fingerprint-verified eye; same-pose cross-sheet ratios so foreshortening
cancels. CONVICTION RULE: an over-band in-plane measurement is a definite
defect (foreshortening only shortens, so true length is worse); an in-band
but possibly-foreshortened measurement is excluded as unverified (kept,
not counted); fit failures are excluded as unverified.

Reference (solid): locomotion 8 upright spears 325-334 raw (2.8% spread),
faces 22-23px. All comparisons in displayed units (raw x sheet factor).

CONVICTED (redraw, endpoints verified on the overlay):
- thrust:3 (406 raw, +23%), thrust:4 (389, +18%): horizontal full
  extension, endpoints at rear hand + head; also +10-15% over own
  sheet-mates :5/:6/:7 (352-356, in-band, kept).
- hitstun-held:7 (417 raw): +17% over own sheet-mates, in-plane diagonal.
- fall-thrown:0/:1/:4 (365-389): over-band despite foreshortening-prone
  tumbling poses, so true lengths are worse. fall-thrown:3/:7 (433/401):
  lying side-on, fully observable.
- getup-death:0/:1 (396/407, rise), getup-death:6/:7 (428/419, dead
  side-on): over-band, in-plane enough that foreshortening cannot explain
  +20-30%.

EXCLUDED as unverified (kept, not counted): thrust:1/:2, hitstun:2,
fall:2/:5, getup:4/:5 (in-band but plausibly foreshortened poses);
fall:6, getup:2 (fit runs onto body/boot); getup:8 spear (476px is
geometrically impossible inside a 341px cell => fit error; the guard
FIGURE height 319 is valid and used for scale).

ROOT CAUSE: the generator scales poses to fill their cells. Getup prone
body length (427, along-axis, spear excluded) vs getup guard figure height
(319): >=34% larger DESPITE foreshortening shrinking the lying measure,
with spear-to-body ratio preserved (1.04 vs locomotion 1.05) => uniform
per-pose scaling, intra-sheet break. Per-sheet factors cannot fix this;
the poses must be redrawn at reference scale.

SCALE UPDATES (ride with the post-splice re-prepare): hitstun 0.883 ->
0.925 (geometric-proxy mean 0.919/0.930; the 0.847 face proxy is
expression/frontal-turn contaminated; independent check: hitstun spears
snap to +/-4% under 0.925 vs systematic -4-8% under 0.883). Thrust stays
1.0 (3.5% geometric effect within resolution; moving it would newly
convict :5/:6/:7 on a coin flip - documented ambiguity). Fall/getup stay
1.0 (fixed by redraws, not factors).

REPAIR PLAN (the last 2 image requests, no slack left after): Sheet A =
witness standing guard + all 8 fall-thrown poses (full re-attempt; splice
verified improvements only). Sheet B = witness + thrust:3/:4 +
hitstun:7 + getup:0/:1/:2/:6/:7 (8 fixes). The witness (locomotion:0 guard
as 3rd reference image + explicit match-this-size instruction) VERIFIES
each repair sheet's scale BEFORE any splice from it; reject the sheet if
the witness is off-scale. Splice rule (soldier precedent): splice a cell
ONLY if the repair verifies in-band + heads ok + no new art defects, else
keep the original. Then re-prepare (hitstun 0.925), re-measure observable
spreads (need <=10% spear AND head), continuity review, checklist.
Residual risks: kept getup:4/:5 heads must post-verify via dome read (no
budget remains); repair round is measurement attempt 3 - on failure the
task BLOCKEDs per rule 5 with this exact record.

Acceptance item 4 is NOT ESTABLISHED (measurement attempt 2 of 3).

## Remaining budget plan (0 left - exhausted)

Both repair requests spent 2026-10-02 (fall-thrown-repair + mixed-repair).
No image budget remains for CMR-07A/07B. Unfixable residuals (observable +
out-band in both versions): fall:7, getup:0/:1/:7. If the splice round
does not establish acceptance 4, the task BLOCKEDs; recovery (further
requests, band amendment, or re-scope) is an owner call.
