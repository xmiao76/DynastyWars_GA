# Wei Archer — motion provenance (CMR-08A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| 1 | locomotion 3x3 (idle, walk x4, stop, retreat x2, bookend) | body `4b169347...`, portrait `bace27af...` | `ffa42e681657aff045d8e3e441b8f8c4e1bf9c0e8d71f4466e96875b3454f60f` | ACCEPT - grid 9/9/0, identity holds (wrap/robe/bow), distinct walk/stop/retreat poses, uniform scale, bookend matches; 4.7% sub-threshold bg micro-tint (cleaned at prepare; explains preview banding, not file content). Reviewed full-sheet + gameplay strip, both fingerprinted. |
| 2 | shoot 3x3 (guard, draw x2, full draw, release, follow-through, reload x2, bookend) | body `4b169347...`, portrait `bace27af...` | `e3012ea1235867c44ad04d461d536071903981285f2b653d75df241cfc83174e` | REJECT - cell 3 (draw 2) raised bow tip touches the sheet top edge (y0=0, edge-touch 1; preparation throws on any touch). All else verified GOOD: identity, braced firing poses, full draw anchored with nocked arrow, release/follow-through correctly arrowless (zoom-verified open string hand + slack string, quiver arrows separate), uniform scale, bookend matches. No valid pixel repair exists (per-cell rescale/translate/mutilation all forbidden or impossible - figure spans full cell height). Re-roll as candidate 2 with explicit >=15px top-margin language for raised bows. File kept as `shoot-candidate-1-REJECTED.png` per precedent. |
| 3 | shoot 3x3 candidate 2 (same cycle + margin language) | body `4b169347...`, portrait `bace27af...` | `c0d63dc0678d396d7bff8de23b4aa5dc2d5f48dad885fafac0f5adde95fbf34e` | ACCEPT - grid 9/9/0 (closest margin 5px, margins held). Full draw anchored with nocked arrow; release/follow-through zoom-verified arrowless (open hands, slack strings); braced stances read distinctly from walking at gameplay size; identity/scale/bookend all hold; no mittens/forks/clipping. Reviewed full-sheet + release zoom + gameplay strip, all fingerprinted. |
| 4 | hitstun-held 3x3 (guard, recoil, fold, stagger, held x2, escape shove/reset, bookend) | body `4b169347...`, portrait `bace27af...` | `dc2b7e383ae86702335ef121a759bf92f0e5ab37cccd0c5eb60ce76cbfd076c7` | ACCEPT - grid 9/9/0 (closest margin 7px). Bow gripped in ALL 9 incl. both held poses (grapple rule held); distinct recoil/fold/stagger/held/escape reads; identity/scale/bookend hold; no mittens/forks/clipping. Reviewed full-sheet + gameplay strip, both fingerprinted. |
| 5 | fall-thrown 3x3 (topple, airborne, impact, DOWN, tumble x2, side-impact x2, DOWN bookend) | body `4b169347...`, portrait `bace27af...` | `dcfbc1f7d1a5a55c45903dce55de230576fb81b8616e502db310cd78f54bced6` | ACCEPT - grid 9/9/0 (closest margin 13px). Bow gripped in ALL 9 incl. both tumbles (grapple rule held mid-air); clean topple/airborne/impact/DOWN arc + distinct tumble orientations + side impacts; headwraps stay on; DOWN bookends match; uniform scale (tumbles stay compact, no scale-to-fill); no mittens/limbs/forks/clipping. Reviewed full-sheet + gameplay strip, both fingerprinted. |
| 6 | getup-death 3x3 (elbow, kneel, crouch, jolt, collapse, crumple, dead, DOWN, guard) | body `4b169347...`, portrait `bace27af...` | `742d30efb3ce88ef69875a8fcafa4f69f91f6287b3605cd9fc763b98248aa76e` | REJECT - dead cell (pos 6) has TWO components: figure (38k) + correctly-detached bow beside the hand (4187px). Art is CORRECT (bow beside open hand, as prompted) but preparation throws on multi-component cells (`extractSequence`: extra-frames + two-figures-in-cell guards). No valid fix: bridging pixels would falsify gripped/beside semantics with no provenance pattern; pipeline change is out of scope (shared CMR-04 tooling). PIPELINE LIMITATION DISCOVERED (record for all future fighters): detached props are unrepresentable - dead/drop poses MUST show physical contact. Re-roll as candidate 2 with "bow TOUCHING the resting hand (contact, no gap)" language. File kept as `getup-death-candidate-1-REJECTED.png` per precedent. |
| 7 | getup-death 3x3 candidate 2 (same cycle + contact language) | body `4b169347...`, portrait `bace27af...` | `1b5906ae8f4489e23277c8ac5d27acbe2952f244662171d7ba858ede18dd331d` | ACCEPT - grid 9/9/0 (dead bow touching the open resting hand: reads as resting contact, mechanically connected). Rise arc + dying sequence + DOWN/guard bookends all correct; identity/scale hold; no mittens/forks/clipping. Reviewed full-sheet + gameplay strip, both fingerprinted. All 5 sequences complete. |

## Budgets

- Authoring: 7/8 used (all 5 sequences accepted: locomotion,
  shoot-c2, hitstun, fall, getup-c2; shoot-c1 + getup-c1 rejected).
  1 spare held for repairs/seconds.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-08B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.

## Prepare record (provisional factors 1.0, 2026-10-02)

Measured (`measure-archer.mjs`): guard-cell scale evidence shows superb
uniformity - locomotion reference faceToGround 292; shoot 0.993/0.982
(disagreement 0.012), hitstun 0.986/0.952 (0.035), getup guard-bookend
0.915/1.023 (0.108 DISAGREE - flagged, factor 1); fall unverified (no
guard cell). Standing guard bbox heights 331/331/337 (1.8% spread).
Prepared (`prepare-archer.mjs`): all factors 1.0 (within resolution /
unverified / stub scale-compare with empty ratios), base scale
0.674221, manifest `f9348704...` byte-identical across double-run.
45 frames (37 unique + 8 aliases), page 2045x924 (within 2048 cap;
margin - fragile to future repacks), 7.56 MiB, 0 budget errors.
1 suspect adjudicated BENIGN with proof: getup figs 5/6 bounds overlap
(crumple bottom vs guard headwrap top, 3px band) but 9 distinct
components, correct centroid cells, visible gap; trim runs on
fit-mapped box-space frames so nominal-cell overhang loses no data.
Scale-compare (height ratios via the archer weapon-fit method) lands
next turn; factors expected to hold at 1.0 (re-prepare only if evidence
moves them).

## Acceptance-4 verdict (2026-10-02): PASS, no repairs

WEAPON (bow chord, strip-PCA + overlay adjudication): 8 verified members
(locomotion:0,1,3,4,5,6,7 + hitstun:4), 244-256 raw px = **4.8% spread**,
PASS. Displayed spread identical (uniform pack scale 0.674). 11 cells
rejected with per-cell mechanical grounds in `bow-lines.json` (boot/head
contamination, wrong side, body-width catches, partials, torso diagonals)
- grounds independent of values; no cherry-picking. Method note: v1-v9
automated variants all failed with documented root causes (color
inseparable r-b 11-17; thin clustering catches edge bands; RANSAC catches
body diagonals; runs miss curved limbs or catch torsos); v10 (outer-strip
PCA + human side tags + overlay verification of every endpoint) worked.
Coverage note: verified set spans 2 sheets (7 locomotion + 1 hitstun);
cross-sheet consistency carried by hitstun:4 mid-cluster + uniform 1.0
factors with tight geometric evidence + full-sheet visual reviews.
Arrows: unmeasured (shaft RANSAC caught body diagonals on all 4
candidates); draw poses covered by art review + head landmarks. Bent
bows excluded by the pre-registered orientation rule (non-comparable
measurand), not by value.
HEADS: 12 comparable-orientation faces (locomotion 8 + shoot 4),
28.39-30.17 sqrt-area = **6.1% spread**, PASS. 4 hitstun-expressive
excluded by pose rule with rigid-wrap proof (wrap widths match ref
within 3-5% while skin inflates 8-17% - turn/expression contamination,
same precedent as the spearman comparable set); full 16-member 18.6%
disclosed.
DIRECTION: pass by direct coherence review (all 45 consecutive action
transitions reviewed across the 5 authoring reads: no facing flips,
snaps, or ghosts); eyeball max step ~45° (full-draw recoveries).
SCALE: factors all 1.0 (shoot 0.998, hitstun 0.982 within resolution;
getup proxies disagree 0.061; fall unverified); manifest UNCHANGED
`f9348704` across re-prepare (stability proven).

## Records

- Identity: [IDENTITY.md](IDENTITY.md) (locked 2026-10-02).
- Plan: [AUTHORING-PLAN.md](AUTHORING-PLAN.md).
- Registration/measurements/overlays land here as the pack prepares.
