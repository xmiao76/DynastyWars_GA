# CMR-14A — registered charge candidate review (attempt2 continuation)

## Scope / honest result

**Fixture timing and candidate contact registration checked; source acceptance
still HELD.** This is a consumer source/fixture review, not another independent
verdict, final atlas, live gameplay or native-video review. No generated image,
source edit, runtime publication, new sequence, or budget debit this iteration.
The earlier independent [verdict](INDEPENDENT-REVIEW.md) remains historical and
its owner-authorized reset remains applied. The task is IN_PROGRESS, not waiting
for another owner instruction.

New [candidate spec](charge-registration-candidate.json) pins corrected walk
`0aff5a39…` and charge `b547809c…`; uses one raw→art scale0.66/density2 (logical
scale0.33), box260×144/ground136u. This is comparable to the earlier boss frame
convention but is still an authoring candidate; complete pack/page budget and
final gameplay scale/hierarchy have not been solved. No per-pose head/body
normalization. Each translation records a drawn pelvis x plus a manually checked
primary sole y; airborne dash ground is explicitly virtual/UNVERIFIED.

Command: `node scripts/review-xiahoudun-registered-charge.mjs`.
Outputs: [logical-size candidate contact](../../../artifacts/motion/xiahoudun/registered-charge/logical-size-contact.png),
[density2 exposure contact](../../../artifacts/motion/xiahoudun/registered-charge/exposure-contact.png),
[manifest](../../../artifacts/motion/xiahoudun/registered-charge/manifest.json),
[offline playback aid](../../../artifacts/motion/xiahoudun/registered-charge/playback.html).
The playback aid was emitted, NOT claimed watched as normal-speed native video.
53 source stills include tick0..52; they are not screenshots of the game.

## Timings and root movement (real core test, no core changes)

Read actual charge.dash.long8/26/18 and AI3.2u/tick. Exposure proposal:

| State ticks | Drawing | Clock status |
| --- | --- | --- |
| 0..2 | exact corrected walk:0 guard | startup |
| 3..6 | charge:0 coil | startup |
| 7 | charge:1 launch | last startup tick |
| 8..20 | charge:2 dash | active |
| 21..33 | charge:3 dash2 | active |
| 34..42 | charge:4 brake | recover |
| 43..51 | SAME walk:0 guard pixels/translation | recover |
| 52 | walk:0 postattack witness | actual AI state becomes walk/stateTick0 |

Unit test calls real stepEnemy for both facings, every tick; candidate root
trace matches all53 states/ticks/displacements. Exactly26 moving ticks8..33,
83.2u travel; no startup/recover drift. The exposure map is an authoring proposal,
not a claim that the existing legacy runtime has those drawing keys.

## Contact / source landmark evidence

Opened all6 source-anchor overlays: guard, coil, launch, dash, dash2, brake.
Primary/secondary marks sit on drawn boot soles; pelvis x marks sit on belt/hip
paint (charge:2 and3 belt is occluded by forearm/shaft, so candidate hip x is a
composition landmark, not a proven skeletal joint). All drawings retain0.66
scale and fit inside the candidate canonical box, no blade/headgear/boot clipping.

- Guard: both soles, secondary error0.66u.
- Coil: crouched rear contact primary, front secondary0.99u; lower hips explain
  some head-height drop without any head-ruler assertion.
- Launch: rear sole on floor; forward boot lifted, no artificial planted-foot
  claim for it.
- Dash: open suspended stride, no planted contact recorded. Source ground334
  is a candidate virtual plane, not a numerical ground PASS.
- Dash2: low rear sole primary; forward boot raised; contact marks not head proxies.
- Brake: rear primary624,691, secondary909,687 yields1.32u from common plane691.
  First guessed932,690 was off ink and builder rejected; actual visible sole
  was checked before recording corrected coordinates. Negative controls retain
  the off-ink rejection and reject a10raw-pixel ground displacement.

These errors validate only DRAWN candidate contacts, not frame-to-frame foot
sliding under3.2u/tick movement or final in-game≤1.5u acceptance.

## Pixels actually reviewed / findings

Opened both final source sheets,6 source grids,6 exact-anchor overlays, logical
and density2 contact sheets,4 paired4x registered images, boundary stills20/21
and guard43. All paired images use one ruler; no morphological ruler substituted
for hidden anatomical chin. Head metric remains **UNVERIFIED**, numeric spread
**null**; no justified mandatory all-charge head shrink/redraw.

### Guard correction visibly retained

[Guard→coil pair](../../../artifacts/motion/xiahoudun/registered-charge/guard-coil-4x.png):
corrected guard rear fingers wrap OVER shaft; moved bronze cap no longer cuts
through fist. Guard bookends are exact same frame/source/transform. Neck/collar
joins coherent; no extra/floating arms or split spear observed. Coil shoulder
plane expands as body leans; not proof of skull/body size growth.

### Concrete paint-consistency target — charge:0/3/4

[Coil→launch pair](../../../artifacts/motion/xiahoudun/registered-charge/coil-launch-4x.png):
coil has lighter copper/pink shoulder rims, warmer exposed upper arm/face and
brighter magenta skirt than launch. Launch dark brown/gray palette is closer to
walk. The difference is visible at logical candidate size too, not just4x.

[Dash→dash2 pair](../../../artifacts/motion/xiahoudun/registered-charge/dash-paint-4x.png):
dash2 shoulder plates/rims/forearm/tassel and skirt are warmer/brighter than dash.
The contrast falls on the13-tick active drawing boundary, so there is no
intermediate source appearance. Connected grips are intact; paint difference
is a concrete named correction target, not a need to regenerate whole sheets.

[Brake→guard pair](../../../artifacts/motion/xiahoudun/registered-charge/brake-guard-4x.png):
brake chest/shoulder and bare arms likewise warmer than dark guard. Wide stance
and opened chest explain much silhouette variation; no numerical head-size
claim. Corrected guard hand maintained in returning frame.

### Continuity concern localized to tick20→21 (not a proven skull failure)

[Tick20 dash](../../../artifacts/motion/xiahoudun/registered-charge/ticks/tick-020.png)
to [tick21 dash2](../../../artifacts/motion/xiahoudun/registered-charge/ticks/tick-021.png)
keeps real root delta3.2u, but drawn candidate pelvis height changes92.44→79.90u
(upward12.54u). This comes from two different leg/torso poses plus their grounded
candidate registration, not sim y movement. The held-still transition is visibly
large; normal-speed acceptability remains unverified. Do not hide it with
pose-wise resizing or a shifted grounded boot. Existing unused charge spares may
supply an authored bridge without image spend; inspect them before requesting art.

## Bounded next step

1. Attempt deterministic PAINT-only harmonization of named charge:0/3/4 toward
   dark walk/charge:1/2 treatment, preserving alpha/body/weapon geometry and
   immutable before/after hashes; review at logical size and4x. This is not a
   generic full-frame darken request or numerical head waiver.
2. Inspect unused charge spares for a coherent dash→dash2 bridge; propose explicit
   exposures entirely inside the existing26 active ticks, test actual core
   boundaries again. No game-timing changes or blanket head rescale.
3. Review actual normal-speed offline playback and registered after-pairs. Source
   acceptance still requires all remaining scale/style/continuity evidence. The
   independent completed verdict does not automatically verify after-corrections.

## Next bounded iteration completed — paint-only improvement and spare inspection

[Paint audit](charge-paint-audit.json) now records new source98e2531f from
immutableb547809c, localized RGB only0/3/4, exact alpha/weapon/nontargets.
Opened all3 [material pairs](../../../artifacts/motion/xiahoudun/charge-paint-review/paint-pair-0-4x.png),
[3](../../../artifacts/motion/xiahoudun/charge-paint-review/paint-pair-3-4x.png),
[4](../../../artifacts/motion/xiahoudun/charge-paint-review/paint-pair-4-4x.png), and
[logical before/after](../../../artifacts/motion/xiahoudun/charge-paint-review/logical-before-after.png):
copper/pink armor and warm skin more restrained, fine shading retained. Style
mismatch reduced, not full continuity/independent after-acceptance. Candidate
spec now points at new paint source, priorb547 retained for before evidence.

[All4 spares](../../../artifacts/motion/xiahoudun/charge-paint-review/spare-contact.png)
opened:5/7 open airborne stride similar to dash phase;8 rising spear/brake-like;
6 darker original bent-front-knee/rear-supported run is a plausible alternate
dash2 candidate, NOT accepted (spear overlong, registration/head/whole-body
acceptance still needed). [Spare6 source grid](../../../artifacts/motion/xiahoudun/charge-paint-review/spare6-source-grid.png)
opened; no new art requested. Next: safe isolated cap shorten6 with exact body
witnesses, true endpoints +registered comparison, then actual normal-speed
playback inside26active ticks. No pose normalization or mandatory skull resize.

## Boundary filmstrips (consumer self-check; independent review NOT obtained)

`node scripts/render-xiahoudun-boundary-filmstrips.mjs` writes a before/after pair
for every one of the six exposure changes (the tick before and the tick after; a
one-tick hard cut at 60Hz is exactly that pair): [filmstrip 1](../../../artifacts/motion/xiahoudun/registered-charge/boundary-filmstrip-1.png)
(2→3, 6→7, 7→8) and [filmstrip 2](../../../artifacts/motion/xiahoudun/registered-charge/boundary-filmstrip-2.png)
(20→21, 33→34, 42→43). Both opened. My own reading, NOT a verdict: the 20→21 cut
(open stride → low crouched stride) changes leg configuration and torso height,
but it is not visibly larger than the inherent guard→coil (2→3) or brake→guard
(42→43) cuts, and 7→8 / 6→7 are small. Palette now reads consistent across cuts.
This is offline stills, not normal-speed playback; I cannot watch motion and will
not grade it. An independent reviewer could NOT be started this turn: the session
was itself a delegated subagent and the nesting limit (depth 2 > max 1) rejected
the spawn - an infrastructure limit, not an art result. Next: run the reviewer
from the top-level session, or take your own judgement on the two filmstrips.

## Independent stills review + paint pass 2 (supersedes the filmstrip palette line)

A working read-only fork reviewer (top-level session, so no nesting limit) opened
the paint-corrected logical/exposure contacts and ticks 7/8/19-22/33/34/42/43.
It could not judge motion from stills (stated first). Verdict **NEEDS_NAMED_REPAIR,
minor/scoped**: (1) charge:4 (ticks34-42) still visibly warmer/brighter than walk:0
and charge:1-3, felt at the 42->43 cut; (2) charge:3 mildly warmer than charge:2 at
the 20->21 cut; (3) the 20->21 pose cut is the largest ("BORDERLINE", flagged not
condemned), 42->43 borderline mainly on palette, 7->8 and 33->34 acceptable; hands,
grips, spear, necks clean in every opened frame. This **corrects** the filmstrip
self-check sentence "Palette now reads consistent across cuts": it did not.

Pass 2 (`charge-paint-harmonized-2-source.png`, `320e235a...`, 4 tests): RGB-only on
the same named polygons for charge:3 and charge:4 (stronger on :4), input the
immutable pass-1 output; alpha, protected spear/tassel and every other drawing
exact. Whole-figure means (alpha>=96, Rec709 luma): charge:3 56.2->54.8, charge:4
57.0->54.7; references charge:1/2 ~50.5, walk:0 44.0; bright-warm pixel fraction
charge:4 0.0525->0.0466 vs ~0.029 refs. The gap is **reduced, not closed** - it is
deliberately not driven to the reference (that flattens painted shading and part of
it is genuine pose/lighting). Parent opened the 6-tile logical comparison and the
charge:4 4x pass1/pass2 pair: slightly more muted copper/plum, rivets/folds/grips
intact, no gray flattening/fringe - self-check, not an independent after-verdict.
[Logical comparison](../../../artifacts/motion/xiahoudun/charge-paint-review/pass2-logical-compare.png),
[charge:4 pair](../../../artifacts/motion/xiahoudun/charge-paint-review/pass2-paint-pair-4-4x.png),
regenerated [filmstrip 2](../../../artifacts/motion/xiahoudun/registered-charge/boundary-filmstrip-2.png).

Still unresolved: the 20->21 pose cut. There is no video encoder and no in-game
`?motion=1` playback (CMR-14B not started), so smoothness cannot be judged by anyone
from stills. It needs the owner's eye on the two filmstrips or a playback-capable
review. If it reads as a hitch: no-art exposure re-timing inside the exact 26 active
ticks, or one reserve-first charge:3 repair (repair 2/3 left). Otherwise propose
scoped source acceptance with the residual palette gap and UNVERIFIED head disclosed.

Weapon gates remain walk3.38%/2.74°, charge6.01%/19.5°, hypothetical combined6.89%
OK at unchanged fixed band (weapon RGBA exact); charge still NOT entered as an
accepted sheet. No combo/heavy/misc/fall/getup generated yet; full CMR-14A/14B
acceptance not implied.
