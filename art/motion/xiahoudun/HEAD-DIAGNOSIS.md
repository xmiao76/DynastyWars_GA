# CMR-14A — charge head gate, third diagnostic outcome

Status: **BLOCKED — owner decision/reset required** (2026-10-06).
No generation, retouch, rescale or source-sheet replacement in this iteration.

## Reproducible comparison

Run `node scripts/review-xiahoudun-heads.mjs` from the repository root.
The script hash-pins [walk source](walk-prepared-source.png) (`b395c867…`)
and [weapon-repaired charge override](charge-repair-1-spliced-source.png)
(`b547809c…`). It renders five paired 112×144 source-pixel crops, each at
exactly 4×, with a single source-coordinate grid and no head normalization.
Eye-region anchors position windows ONLY; neither opacity nor an eye anchor
establishes a crown/chin endpoint. The output manifest carries a null
anatomical chin for every inspected drawing and no fabricated head spread.

Viewed all five pairs:

| Pair | Source frames | Evidence | Observation |
| --- | --- | --- | --- |
| 0 | walk:0 / charge:0 | [fixed4x pair0](../../../artifacts/motion/xiahoudun/head-diagnosis/pair-0-fixed4x.png) | Charge's neck inclines and beard silhouette extends farther below the face; beard merges visually toward the collar. Neither drawing exposes the underlying chin. |
| 1 | walk:1 / charge:1 | [fixed4x pair1](../../../artifacts/motion/xiahoudun/head-diagnosis/pair-1-fixed4x.png) | Nose/ear/eye are readable, but the lower jaw boundary is hidden by beard. Topknot and headband cannot supply an anatomical crown/chin chord. |
| 2 | walk:2 / charge:2 | [fixed4x pair2](../../../artifacts/motion/xiahoudun/head-diagnosis/pair-2-fixed4x.png) | Charge leans forward; neck and hair silhouettes differ. A facial-feature distance or silhouette height would be only a partial proxy, not full-head acceptance. |
| 3 | walk:3 / charge:3 | [fixed4x pair3](../../../artifacts/motion/xiahoudun/head-diagnosis/pair-3-fixed4x.png) | Beard bottom projects below the face into the collar region. The previous off-ink bottom mark was correctly invalidated; there is no newly validated chin endpoint. |
| 4 | walk:4 / charge:4 | [fixed4x pair4](../../../artifacts/motion/xiahoudun/head-diagnosis/pair-4-fixed4x.png) | Braking pose exposes more neck/front torso, but the chin remains covered. Beard/robe contact cannot be counted as a skull measurement. |

**Head-size verdict: UNVERIFIED, not PASS and not a quantified FAIL.**
These pixels do not prove whether the apparent head/silhouette drift is actual
head scale, pose, hair or beard contour. No numeric claim is derived from
beard bounds, headband-top, neck length, colour-cluster area, opaque crop
bounds or an inferred hidden chin. The earlier walk-only headband/beard
7.2% record is not evidence that charge meets the cross-sheet head gate.
No change is made to the accepted walk source or its fixed weapon band.

The recovery contract's visual-consistency/independent-review route retains
an honest UNVERIFIED landmark status; it does not turn this uncertain
consumer review into ≤10% compliance. The selected task explicitly says
unknowns cannot establish compliance. Independent/owner judgment remains
necessary if no valid comparable head ruler can be obtained.

## What is preserved

- Charge weapon override has demonstrated 6.01% weapon spread and 19.53°
  maximum direction step, with the protected body-pixel/splice tests intact.
- [Round1 audit](charge-repair-1-audit.json) remains a historical weapon-only
  outcome. No charge sheet is entered into [projection](pack-projection.json).
- All image sources, authoring ledger and repair ledger are unchanged.
  Authoring: 2/12; global: 128/200; focused reserve: 1/3 spent, 2 left.
- No partial pack/runtime activation, new sequence, gameplay change or UI
  ledger verification occurs. These are offline 4× crops, not gameplay-size
  motion captures or native-video evidence.

## Retry record and owner input

Three consecutive unresolved charge consumer outcomes: `57f3d4d` (unsafe
shortens rejected), `b28d591` (weapon repaired, head gate unresolved), then
this fixed-scale head diagnosis (no trustworthy full-head endpoints).
Remaining request funds do not override the three-outcome rule. CMR-14B and
later dependent authoring cannot start while CMR-14A is blocked.

Owner may choose one bounded route and explicitly reset CMR-14A to TODO:

1. **Preserve the numerical gate:** approve a defined comparable anatomical
   head ruler, or direct a focused charge-head redraw against the unchanged
   walk anchor (using the existing reserve). It must preserve weapon/grip/
   body geometry and re-pass head, weapon and anatomy checks.
2. **Use the disclosed review route:** obtain an independent/owner judgment
   of these scale-controlled pairs, explicitly accepting the unmeasurable
   head-size limitation for this sheet. This is not a numerical PASS; record
   the scope of the acceptance before resuming.

No automated retry, budget reset, new threshold or task bypass is authorized
by this report. Only an explicit owner decision/reset reopens the task.
