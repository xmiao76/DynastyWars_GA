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

Weapon gates remain walk3.38%/2.74°, charge6.01%/19.5°, hypothetical combined6.89%
OK at unchanged fixed band; charge still NOT entered as an accepted sheet. No
combo/heavy/misc/fall/getup generated yet; full CMR-14A/14B acceptance not implied.
