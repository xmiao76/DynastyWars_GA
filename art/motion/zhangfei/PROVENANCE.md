# Zhang Fei — motion provenance (CMR-09A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| 12 | rider 3x3 (mounted idle upright, trot A/B, mount, sweep strike/windup/recover, dismount, bookend; special-c1 as identity ref; NO horse) | body `546fc302...`, portrait `36b41443...`, special-c1 `f8e2fd2b...` (pixel-attached) | `453f94295512ba9e89b036e9f30e86edf090bbca713f734824470b0c6bb65305` | ACCEPT - grid 9/9/0 (0 sheet-edge-opaque px; pipeline's own cleanAlpha gate: 9 survivors). Mounted set with EMPTY saddle: seated straddle + upright pike in idle/trot, foot-raised mount, twisted sweep strike, windup/recover, leg-over dismount; seat/thigh contact poses clean for CMR-22 composition; NO horse/saddle drawn. Identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands defined; bookend matches; no extra limbs/forks/clipping. Methodology note: the tmpcheck stride-2 census FALSELY merged cells[1,2]+[2,2] (9px real gap); full-res flood + the pipeline gate prove separation - census fixed to stride 1, pipeline gate scripted for future turns. Reviewed white full-sheet (a164cd33) + gameplay strip (91d805a2) + 3 targeted zooms (idle/sweep/dismount), all fingerprinted. rider DONE on candidate 1. ALL 10 SEQUENCES COMPLETE. |
| 11 | special 3x3 (guard, overhead raise, coil, pre-spin, WHIRLWIND strike, follow, recover, bridge, bookend; getup-c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, getup-c1 `253d897b...` (pixel-attached) | `f8e2fd2b22f9e8c0809013f7183f7489e34fa60e31b8d6e5a9669cea71fc81c1` | ACCEPT - grid 9/9/0 EXACT (0 sheet-edge-opaque px, ZERO specks). Whirlwind arc: overhead raise, tight coil, pre-spin step, full-spin strike (pike horizontal at max reach both directions, spinning step with lifted foot), follow, recover, bridge; NO projectile/glow/effects - the sweep IS the special. Identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands wrap with fingers; bookend matches; no extra limbs/forks/clipping. Reviewed white full-sheet (d114a3ee) + gameplay strip (12f5e4c8) + 3 targeted zooms (raise/strike/guard), all fingerprinted. special DONE on candidate 1. |
| 10 | getup 3x3 (DOWN flat, elbow propped, kneel, crouch, half-rise, stand, steady, guard-approach, bookend; fall-c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, fall-c1 `e41d51c6...` (pixel-attached) | `253d897b80f2077396e70b5c2bc999154a4438fe64190a5682e48f6dba14b4d4` | ACCEPT - grid 9/9/0 EXACT (0 sheet-edge-opaque px, ZERO specks). Smooth rise arc DOWN->propped->kneel->crouch->half-rise->stand->steady->guard; DOWN matches the fall DOWN (shared bookend will alias at prepare); pike gripped in ALL 9; no extra limbs/forks/clipping. Reviewed white full-sheet (5a8795ae) + gameplay strip (d315bec0) + 3 targeted zooms (DOWN/crouch/guard), all fingerprinted. getup DONE on candidate 1. |
| 9 | fall 3x3 (guard, topple, airborne, tumble, side impact, settle, DOWN flat, DOWN bookend, guard; misc-c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, misc-c1 `892af670...` (pixel-attached) | `e41d51c6ab1ef1afcf2006e0f0b348c613a4ef04cc3cfb6bbba9f9e559150631` | ACCEPT - grid 9/9/0 (0 sheet-edge-opaque px; 4x4px specks cleanable). Full knockdown arc: topple windmilling, airborne sprawl, upside-down curled tumble (pike to chest), side impact, settle sprawl, DOWN flat on back with closed eyes + hand draped over the shaft (contact, not detached - satisfies the 08A pipeline rule; also the dead pose), DOWN + guard bookends match. Pike gripped in ALL 9; no extra limbs/forks/clipping. Reviewed white full-sheet (1feebefb) + gameplay strip (7e6cf75b) + 3 targeted zooms (tumble/DOWN/guard), all fingerprinted. fall DONE on candidate 1. |
| 8 | misc 3x3 (guard, hurt recoil/fold/stagger, escape shove, grab clamp/hold, release, bookend; jump-c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, jump-c1 `6afa5c80...` (pixel-attached) | `892af67024ee57c1bb90349f27dfa475b90256e4d8a5e16644d71df3fb9d4506` | ACCEPT - grid 9/9/0 (0 sheet-edge-opaque px; 2x4px specks cleanable). All 9 distinct: recoil (rocked back, hand up), fold (doubled, clutching - doubles as grabbed per hero dispatch), stagger (off-balance slide), shove (arms out), clamp (open 5-finger reach + pike gripped), hold (closed brace, clearly differs from clamp), release (arm flung open), bookend matches. Pike gripped in ALL 9 (grapple rule held); no second figure; defined fingers incl. the spread clamp hand; no extra limbs/forks/clipping. Reviewed white full-sheet (e07c41d1) + gameplay strip (130fc6eb) + 3 targeted zooms (fold/clamp/hold), all fingerprinted. misc DONE on candidate 1. |
| 7 | jump 3x3 (guard, takeoff crouch, tucked ascent, apex pike-high, FLYING KICK, descent retract, contact, landing crouch, bookend; finisher-c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, finisher-c1 `26d9b14d...` (pixel-attached) | `6afa5c807b7bf2da697c0805d9bfe03bbe2825485eebb8e962c323e8ad83a225` | ACCEPT - grid 9/9/0 (0 sheet-edge-opaque px; 3x4px specks cleanable). Full air arc: grounded takeoff/contact/landing vs airborne tuck/apex/kick/descent with clear space under the boots; kick money pose (leg extended straight, other tucked, torso leaning in, pike swept back, right hand gripping); apex pike-high with both hands. Identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands defined; bookend matches; no extra limbs/forks/clipping. Reviewed white full-sheet (cfb188d6) + gameplay strip (4aa9e4a2) + 3 cell zooms, all fingerprinted. jump DONE on candidate 1. |
| 6 | finisher 3x3 (guard, wide coil, launch, mid-sweep bridge, FULL horizontal sweep, follow, recover, bookend, guard; jab2-c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, jab2-c1 `009cee58...` (pixel-attached) | `26d9b14dfffb9853cf87423b8d4a33563691486688f077a41c4bbb850d315467` | ACCEPT - grid 9/9/0 EXACT (0 sheet-edge-opaque px, ZERO specks - cleanest sheet yet). Sweep reads as a SWEEP (pike angle rotates coil->launch->diagonal-bridge->horizontal-impact->follow while the shaft stays rigid; body twist progresses; no >60° jump cut); all 9 poses distinct; strip reads the full arc. Identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands wrap with fingers/knuckles in the impact zoom; guard bookend matches; no extra limbs/forks/clipping. Zoom slivers (boot, head-top, pike tip) are benign-overhang crop artifacts (distinct components, centroid assignment lossless). Reviewed white full-sheet (017d9473) + gameplay strip (abcdf107) + 3 cell zooms, all fingerprinted. finisher DONE on candidate 1. |
| 5 | jab2 3x3 (guard, LOW crouch windup, rising drive, extension, follow, recover x2, bookend, guard; jab1-c2 as identity ref) | body `546fc302...`, portrait `36b41443...`, jab1-c2 `83ed8b93...` (pixel-attached) | `009cee58b1b6098a666b5f577cabe4ce784c2a7053e72195a696510f94d0c4e8` | ACCEPT - grid 9/9/0 (0 sheet-edge-opaque px; edge-cell margins 7-54px - the baked-in margin language worked; 1x4px speck (770,432) cleanable). Distinct from jab1 as planned (deep-crouch LOW chamber at the hip vs jab1's high over-shoulder coil; deeper stances throughout); all 9 poses distinct, on-line thrust arc; strip reads guard->crouch->rise->lunge->follow->recover->guards. Identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands wrap with fingers/knuckles; guard bookend matches; no extra limbs/forks/clipping. Neighbor slivers in zooms are benign-overhang crop artifacts (distinct components, centroid assignment lossless). Reviewed white full-sheet (350677d7) + gameplay strip (50444fcb) + 3 cell zooms, all fingerprinted. jab2 DONE on candidate 1. |
| 4 | jab1 3x3 candidate 2 (same choreography + >=15px sheet-edge margins, c1 as ref) | body `546fc302...`, portrait `36b41443...`, jab1-c1 `09c34b2a...` (pixel-attached) | `83ed8b93d35692d5022183fb7c5a0b78f4a7ee5d41db098a2f1d21ea3911d7ef` | ACCEPT - grid 9/9/0 (0 sheet-edge-opaque px - the c1 tip-touch FIXED, closest sheet margin 11px; tight nominal margins benign per precedent; 2x4px specks (1524,524)+(1014,914) cleanable). Same snappy choreography as c1, all 9 poses distinct and on-line; identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); both hands wrap with fingers/knuckles in the extension zoom; guard bookend matches; no extra limbs/forks/clipping. Neighbor slivers in zooms (butt cap, serpent head, head-top) are nominal-crop artifacts of benign overhang (distinct components, centroid assignment lossless). Reviewed white full-sheet (e484d032) + gameplay strip (a9fc7621) + 3 cell zooms, all fingerprinted. jab1 DONE. |
| 3 | jab1 3x3 (guard, windup, drive, extension, follow, recover x2, bookend, guard; walk-c2 as identity ref) | body `546fc302...`, portrait `36b41443...`, walk-c2 `981477d7...` (pixel-attached) | `09c34b2a51cc3edc3d32d284ce8a12276ee134bfab3b7029426ba08be2e9051f` | REJECT - cell[1,2] pike tip touches the SHEET right edge (1px at (1535,515)); preparation throws `clipped figure` on any sheet-edge touch (pipeline line 180; same as 08A shoot-c1). All else verified GOOD: snappy windup/drive/extension/follow/recover choreography all distinct and on-line; identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands wrap with fingers/knuckles; 9/9 components correct centroids + 1x4px speck (230,418) cleanable; neighbor serpent-head slivers in zooms are nominal-crop artifacts of benign overhang (no merge - distinct components, centroid assignment lossless). No valid pixel repair exists (per-cell rescale/translate/mutilation all forbidden or impossible - the tip is real content at the sheet edge). Re-roll as candidate 2 (LAST for jab1) with explicit >=15px sheet-edge-margin language for extended pikes; file kept as `jab1-candidate-1-REJECTED.png`. Reviewed white full-sheet (158df20e) + gameplay strip (f3a7f66b) + extension zoom, all fingerprinted. |
| 2 | walk 3x3 candidate 2 (same cycle + per-cell leg choreography, c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, walk-c1 `4f63c23b...` (pixel-attached) | `981477d7ffed0ad0290f69197b2f8f82411cbb512013758978aea787190be383` | ACCEPT - grid 9/9/0 (closest nominal margin 0-1px, non-touching overhang, benign per the 08A precedent; 0 sheet-edge-opaque px; 1x4px speck at (1296,214) cleanable). GENUINE alternating cycle: idle guard + contact/pass/push-off/double-stance/snap phases all distinct with wide readable silhouettes (cell4 wide stride, cell7 dipped double-stance, cell8 kick-back snap); strip reads as real walking. Identity preserved from c1 (heavy/short, vest+rope belt, headband+tails, bristle beard, serpent pike + tassel, no armor/cape; uniform heads); right hand wraps the shaft, left fists show knuckle definition; no extra limbs/forks/clipping. Zoom edge slivers are nominal-crop artifacts of the benign overhang (whole-component centroid assignment loses no data). Reviewed white full-sheet (d3ef73f8) + gameplay strip (f306ca4f) + 3 cell zooms, all fingerprinted. Walk (the scale anchor) DONE. |
| 1 | walk 3x3 (idle guard + 8-cycle) | body `546fc302...`, portrait `36b41443...` (text-grounded from the lock; this host cannot pixel-attach master refs - identity judged against masters at review) | `4f63c23bedd2ab4dd07254077f802d07ba43c97d1842894b89b154609d236068` | REJECT - static walk cycle: all 9 torsos/heads/arms/pikes near-identical, feet shuffle without genuine alternation (no passing/crossed pose, no wide stride, no push-off; cell0/4/8 zooms show legs together -> small step -> together). Identity/costume/pike GOOD (heavy/short, vest+rope belt, headband+tails, bristle beard, serpent pike + tassel, no armor/cape; uniform head size). Mechanics GOOD: 1536x1024, 74.82% transparent (preview's dark backdrop is the viewer matte, not file content), 0 sheet-edge-opaque px, 9/9 components with correct centroid cells + 1x4px dust speck at (192,888) in cell[2,0] (cleanable, not a reject ground), tight but non-touching nominal margins. No valid repair exists (legs must be redrawn, not rescaled). Re-roll as candidate 2 (LAST allowed for walk) with explicit per-cell leg choreography + finger definition; candidate 1 kept as `walk-candidate-1-REJECTED.png` and reused as the identity reference. Reviewed white full-sheet (c6796310) + gameplay strip (42608975) + 3 cell zooms, all fingerprinted. |
| - | (none yet - foundation turn) | body `546fc302...`, portrait `36b41443...` | - | Identity locked + 10-sequence plan written; 0/16 spent. |

## Prepare record (2026-10-02): option (c) owner-selected - PACK PREPARED

**Owner decision 2026-10-02: option (c), budget-driven pose counts** (the
historical measurement table and options (a)-(d) are preserved below).
Executed as designed: 21 shared bookend duplicates + 13 redundant
in-betweens culled IN MEMORY from the prepare inputs (sources untouched;
the culled cells' pixels were never displayed - guards/DOWN come from
walk:0 / the fall DOWN by clip convention, Guan Yu's clip pattern), the
registration cell widened to 260x144 (the 丈八蛇矛 is the roster's
longest weapon; registration frame only), and a budget-aware base scale
(largest base fitting both cell axes AND the 16MiB decoded metric).

Outcome (`registration.json`, `artifacts/motion/zhangfei/`):
- base 0.699018 (fit bound = budget bound); 56 frames (90 source cells,
  34 culled, 0 aliases), pages zhangfei-1 2022x2044 + zhangfei-2 2041x741
  (both <=2048); manifest sha256 `63bd0be68855f946336ab15c7e642d1ab864cfe030327f46e17617d599ae3ed`
  byte-identical across the double-run.
- **Budget metric 16,418,924 B = 15.66 MiB <= 16 MiB - PASS** (the first
  zhangfei configuration to clear the gate). Real page decode 22.58 MB is
  recorded honestly alongside it - the enforced trim metric under-counts
  page pixels for every pack (soldier: 7.9 metric vs 10.9 pages); the
  128MiB stage cache stays the binding memory control (a stage loads
  ~70MB with guanyu + zhangfei + 3 mooks).
- **Display: walk guard 226.5px = 94.4% of Guan Yu (240) and above the
  mook archer (223)** - the hero/mook ordering is preserved and the
  HEAVY/TALL build ratio (90.6%) is met within 4%.
- 12 extract suspects = the known benign wide-pike bounds overlap
  (distinct components, centroid assignment lossless - the repeated
  08A-precedent adjudication).
- Clip-name map (CMR-09B): positions are compact seq:0..count-1, cell
  mapping + labels in registration.json's `layout` (walk:0 guard, walk:1..8
  cycle; fall:4 = DOWN; misc:1 = hurt fold = grabbed; rider:2 mount/3 sweep/
  4 windup/5 dismount). No alias records exist; guards/DOWN are shared by
  clip convention (walk:0 / fall:4), which is a stronger form of the
  "shared guard/down bookends" property than the alias bookends were.
- Acceptance-4 landmarks (head/weapon spread), offline continuity review
  and the checklist remain; re-prepare is deterministic if evidence moves.

## Historical measurement table (pre-decision, 2026-10-02)

`measure-zhangfei.mjs` + `prepare-zhangfei.mjs` (CMR-04 toolkit, hero box
224x144/groundY 136 = the Guan Yu reference box) run deterministically up
to the budget gate. Registration factors follow the accepted two-proxy
rule (guard face-to-ground + guard-height vs walk): jab1 **1.133**
applied, jump **1.093** applied, getup **0.946** applied; jab2/finisher
within resolution and fall/misc/special unresolved -> factor 1; rider
UNVERIFIED (no standing guard) -> factor 1. Per-sheet evidence in
`registration.json` + `measurements-raw.json` + `scale-compare.json`.

**Conflict: the 16MiB decoded cap and the hero display hierarchy cannot
both hold for these sheets.** Measurements (trim accounting, density 2):

| base | enforced metric (90 frame records incl. 21 alias bookends) | alias-deduped (69 unique trims, the real decode) | walk guard fitted (raw 324) vs Guan Yu 240 |
|---|---|---|---|
| 0.547 | 16.07 MB **PASS** | 12.04 MB | 177 px = **74%** |
| 0.601 (max buildable) | 19.76 MB **FAIL** (preparePack throws) | 14.49 MB | 195 px = 81% |
| 0.670 (build-ratio 0.906 target) | 23.9 MB FAIL | 17.9 MB FAIL | 217 px = 90% |
| 0.728 (height-bound) | 28.2 MB FAIL | 21.1 MB FAIL | 236 px = 98% |

Two independent constraints bind:
1. **Cell fit**: the wide pike poses (jab1:2 649px, jab2:2 698px raw
   content - the horizontal full-extension strikes) overflow the 448px
   art cell at any base > 0.601 (`trim error: content+pad leaves the
   cell`). At the hierarchy target 0.670 they need ~660px of cell.
2. **Budget**: `validateBudget` refuses above 16MiB (enforced error:
   `decoded 19763944 exceeds the 16777216 per-fighter cap` at the
   maximum buildable base 0.601). Note the enforced metric sums ALL 90
   frame records; the 21 shared bookends carry their target's trim and
   are counted twice, so the pixels that actually decode are the 69
   unique trims + packing waste (14.49 MB at 0.601 - under the cap on
   that reading).

Root cause of both: the carry/guard style. Every sheet's guard holds the
pike HORIZONTAL (504px raw content) and the strikes span 649-698px,
while the Guan Yu reference carries his glaive narrow/upright (walk:0
content 113x240 fitted) - his trims are ~3x smaller per carry pose. The
drawings follow the approved briefs ("pike held low horizontal"), so
this is a plan-level consequence, not a drawing defect.

Nothing was published while this was open; no limits were raised and no
thresholds lowered. The owner selected **(c)** on 2026-10-02 - see the
"Prepare record" section above for the executed layout and outcome. The
option list is preserved for the historical record:
(a) **Hero budget exception**: authorize a higher per-fighter decoded cap
    for hero packs (Guan Yu's own pre-CMR baseline is 44.3MB full-cell /
    ~14MB trimmed pages) and a wider registration cell (e.g. 260x144) so
    the wide strikes fit at hierarchy scale (~0.70). Zhang Fei decodes
    ~20MB (unique) / ~26MB (enforced metric); the 128MiB stage cache
    stays the binding memory control.
(b) **Re-roll carry poses upright/narrow** (pike vertical at the side,
    like Guan Yu's carry) - the budget then fits at hierarchy scale.
    Full fix needs ~6-10 whole-sheet re-rolls; only 4 authoring requests
    remain (12/16 used), so this needs a budget grant or partial
    acceptance.
(c) **Erase redundant bookend cells** from the source sheets (90 records
    -> ~55) so the enforced metric fits at ~0.65; modifies accepted art
    and thins the clips to ~5 poses/sequence.
(d) **Accept the budget-compliant base 0.547-0.56** with Zhang Fei
    displaying 74-78% of Guan Yu - at/below the mook archer (111.5
    world px vs 97) - hierarchy caveat recorded for CMR-24.

## Acceptance-4 verdict (2026-10-03): weapon criterion FAILS (drawn-length drift); head passes; direction OK

**Weapon length - FAIL (cannot certify <=10%).** The measurement is solid
(method v2, 54/56, deterministic; endpoint adjudicator
`pike-adjudicate-zhangfei.mjs` with value-independent grounds - fitting
pixels vs body pixels at the axis ends). The failure is in the ART, and
the bbox geometry alone proves it (preview-independent):
- The max-reach strike draws the pike at 639px raw (special:3 component
  bbox 639 wide; RANSAC 639).
- The walk carries top out at bbox 504-540 / measured 492-559 - a 639px
  pike at 15deg would span 617px, impossible in those boxes. Walk-internal
  spread alone is 12.8%; walk-vs-strike ~21%.
- The rider carries are worse: components are <=351px tall, so a vertical
  full-length pike cannot fit - the generator shortened the weapon to fit
  the 341px cell (rider:0 measures 348 = ~54% of the strike length).
Root cause: the briefs' "fit the whole pike inside every cell, never
crop" conflicted with "never shorten the pike"; the generator resolved
it by drawing the pike shorter in tight cells. Every comparable family
exceeds 10% (walk 12.8% internal; strikes 281-447 across cells with
cut ends), so no comparable-subset definition certifies it.

**Head size - PASS on the comparable subset.** Upright combat stances
(walk+jab, face-cluster sqrt-area x sheet scale): 24.3-25.9 = 6.4%
(walk-internal 2.8%). Full 56-cell disclosure: 19.1-57.5 raw (135.8%),
including 9 limb-merged clusters (excluded on cluster-shape grounds,
w/h>70 = arm merges, independent of the value) and tilted/rider heads
(excluded as non-comparable orientation), per the 08A precedent.

**Direction - OK.** Play-order steps are all <=36deg (walk 0-18, jabs
<=21, finisher 36 via the authored mid-sweep bridge, special 20 via the
pre-spin bridge, fall/getup/misc <=21). The two >60deg steps in the raw
table are sheet-order artifacts (rider trot->mount, sweep->dismount are
not play transitions); the dismount->guard transition is bridged by the
landing pose (clip table lands in CMR-09B).

**Remaining limitation:** the image-preview pipeline served stale/other
files during this pass (the documented harness bug; every file was
fingerprint-verified and the row-0 walk strip WAS visually confirmed -
endpoints on caps/tips), so the per-cell visual adjudication is
geometric rather than eyeballed. The producer's independent review
(bounded work 6) re-checks on fresh captures regardless.

**Resolution options (owner decision - the spearman's 18.2% precedent,
option (d), is the closest history):**
(a) Waive with a documented band (like CMR-07A option d): accept the
    pack with the measured drift recorded.
(b) Spend the 3-round Acceptance-4 repair reserve on the worst sheets
    (rider carries -> walk carries -> misc/getup carries). Arithmetic:
    the residual stays >10% because the jab/finisher/jump/fall/special
    carries are also short - the defect is pack-wide, so 3 rounds
    narrow the band but cannot reach <=10%.
(c) Authorize a larger repair campaign (whole-pack carry redraws at the
    strike length, ~6-8 sheet requests) to genuinely reach <=10%.
Not recommended: fabricating a pass via a cherry-picked subset - the
exclusion grounds rule (independent of values) forbids it.

## Acceptance-4 repair rounds (owner option (b) 2026-10-03)

Owner selected (b): spend zhangfei's own 3-round Acceptance-4 repair
reserve (splice-redraw named cells), fallback to (a) documented waiver
if the residual exceeds 10% after round 3.

**Round 1 (ACCEPTED, source override adopted, remeasured):** reserved
via `acceptance4-repair-budget.json` before generation (3->2 left). One
request, 6 named cells (rider sheet grid 0/1/3/4/5/7 = idle/trot/mount/
sweep/sweep-windup/dismount), source sha `453f9429...`, bracketing
references (offending rider sheet + the 639px strike length-anchor cell
+ body/portrait masters). Output `acceptance4-round1-candidate-1.png`
sha `8c022451...` (3x2, 6 clean components, pipeline gate green).
Measured: carry pikes landed at 480-500 raw (shaft runs 355-389 +
fittings) vs the 348 originals - big improvement, now inside the pack
carry band (308-391 displayed) - but still short of the 639 strike
target: the spearman's round-1 "systematic shortening" bias repeated,
softened by the bracket. The sweep cell is FULL length (shaft 529 +
fittings = 639) and replaces the 527-raw original. Uniform splice
k = 0.92 (height-fit to the 383px content cap: cells came back 385-416
tall at ~40deg pike lean vs the requested 15-30deg; witness = the
content-height budget; k keeps base 0.699 and the 94% display).

Adopted as the **rider source override** (the protocol's "new source
override" form) rather than an in-sheet splice: the repair sheet's 6
clean components sit in exactly the kept label order on a 3x2 grid, and
splicing 442-602px-wide drawings into adjacent 512px cells would make
neighbours touch (component merges). rider-candidate-1.png is preserved
as the immutable before; the 0.92 normalization runs through the
pipeline's own per-sheet factor (FACTOR_OVERRIDE, witness-recorded -
never per-cell). Untouched-source proof: the 9 non-rider sheet files are
byte-identical (git hashes); the budget margin lowered the global base
0.699 -> 0.692 (walk guard 224.2px = 93.4% of guanyu, still above the
mook 223), which re-scales every displayed frame by 0.99 and is
recorded (future rounds save the manifest before re-preparing to diff
at equal scale). Re-prepared deterministic (manifest `55e09318...`,
56 frames, pages 2004x2026 + 1693x768, budget 16,730,172 B = 15.95
MiB <= 16 MiB PASS on the first attempt - the solver's 3.96%
under-count is now covered by a 1% base margin). Remeasured: rider
carries 436-500 raw pike (was 348; shaft runs 305-389 + fittings),
sweep 590; the pack's residual band (carry mass ~278-387 displayed vs
the 442 strike) is rounds 2-3's target.

## Budgets

- Authoring: 12/16 used (ALL 10 sequences accepted: walk + jab1
  at c2, jab2/finisher/jump/misc/fall/getup/special/rider at c1).
  4 spare held for repairs/seconds. Reserve BEFORE each call.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-09B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.
