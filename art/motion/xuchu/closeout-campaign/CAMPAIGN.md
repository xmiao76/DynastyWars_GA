# CMR-15A FINITE CLOSEOUT — campaign plan (setup package, 2026-10-12)

**Zero image generation in this setup package.** No reservation, no ledger write, no
source edit, no runtime activation, no CMR-15B work. This plan executes only under the
owner grant below; it does not itself mark CMR-15A DONE.

## Authority (owner grant, verbatim, recorded in TASKS.md CMR-15A)

> "CMR-15A FINITE CLOSEOUT (owner grant): Reset CMR-15A BLOCKED→IN_PROGRESS prospectively; historical failures, sources, waivers and ledger history are preserved and not erased. Authorize at most 12 isolated single-pose requests, reserve-before-call, in this order: walk:2, walk:3, walk:4, walk:5, walk:0, walk:1, charge, combo, heavy, misc, fall, getup. This is an explicit campaign ceiling of Xu Chu 15 total (nominal cap 12 unchanged as the recorded base) and global 182/200 maximum. No whole-sheet request, reroll, correction request, text-to-image substitution, runtime activation or 15B work is authorized. Gate every candidate for identity, anatomy, weapon corridor/length/direction, scale/ground, seams and—across walk keys—genuine opposite support/passing. Fix one brief band from the first accepted anchor; try deterministic shaft retouch before considering any deviation closed. Record raw head and weapon failures honestly; consolidate deviations once at batch end. I pre-authorize only this specific limitation if all other gates pass and visual consistency is independently reviewed: the head-size gate may close as UNVERIFIED_OWNER_ACCEPTED because Xu Chu’s beard conceals the chin/beard-base endpoint, as in CMR-14A. Source-specific weapon deviations may be waived only for exact immutable hashes after the batch; blanket or transferred waivers are not authorized. STOP on any authority/safety failure, on the second genuinely unusable source, on a walk set that still cannot demonstrate alternation after walk:5, before exceeding 15/182, or before offline pack preparation if any non-waived acceptance gate remains open. If all sources pass or receive the exact rulings above, prepare the offline pack only and return for independent review; this grant does not itself mark CMR-15A DONE."

Historical failures, sources, waivers and ledger history are preserved and not erased;
attempt accounting is preserved — this campaign is a prospective owner reset only.

## (f) Ledger state (verified at setup, no writes)

| Counter | At campaign start | Campaign ceiling | Nominal recorded base |
|---|---|---|---|
| Xu Chu used | **3 / 12 used** (`walk: 3` in `generation-budget.json`) | **15 total** (3 used + at most 12 new) | cap 12 unchanged as the recorded base |
| Global used | **170 / 200** (per-fighter `used` sum recomputed) | **182 / 200 maximum** | 200 |

Each request below shows the counter values *after* its reserve-before-call increment.
No request may be reserved or called if it would exceed 15 / 182 (stop condition (e)).

## Reference cells (existing pixels only)

Source sheet: `art/motion/xuchu/walk-candidate-2.png` (1536×1024,
SHA-256 `bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c`).
Nominal 512×512 cells (feasibility plan §a) extracted deterministically by
`refs/extract-refs.mjs` (existing-pixel crop, no generation, no source edit). `walk:2`
already exists standalone in `proof-of-control/` and is referenced there, not duplicated.

| Key | Standalone reference | Cell (x,y,w,h) in candidate-2 | SHA-256 |
|---|---|---|---|
| walk:0 | `refs/walk0-original-cell.png` | (0,0,512,512) | `6bfff0f6aa45105fd34c758e5900dd321f7c2079369faaf42dafdcad24c53eca` |
| walk:1 | `refs/walk1-original-cell.png` | (512,0,512,512) | `98c283b5283c1f87252a35f1a41c1b4aedf7844bd9fb0c191beb592c684e429d` |
| walk:2 | `art/motion/xuchu/proof-of-control/walk2-original-cell.png` (pre-existing) | (1024,0,512,512) | `75c07dc26e3490c8de17377656eb1464066fc3e44bf9616de4d3424c1efcad0f` |
| walk:3 | `refs/walk3-original-cell.png` | (0,512,512,512) | `947d6b77c73d0db2754cdbd59c13b71b4df2f7876b7823e2f032da4a5845883c` |
| walk:4 | `refs/walk4-original-cell.png` | (512,512,512,512) | `b96d7d5295488b78b042c13507d92a4e194d93c6635fa99606e7924360db4d4a` |
| walk:5 | `refs/walk5-original-cell.png` | (1024,512,512,512) | `3baccee1ca374ec693e298b2647d786af7fe578429660218dde8f5124c1e1937` |

Identity masters (unchanged, for identity reference only): body master
`art/fighter-bodies/xuchu-body-master.jpg`
(`98c1847b17dca605e637954e0a9679c23d97f9fcd58d0a4ebb01c37665abb6cd`), portrait master
`art/boss-faces/xuchu-portrait-master.jpg`
(`c663fd5428314ced899d98ce41b5fa2e55fecb9b12335b1f9de4803afefb3a0d`). Note: nominal cells clip the glaive tip that crosses cell
boundaries in the sheet (feasibility §a); the reference cell is the identity/pose
reference, and the weapon corridor/length is gated against the brief band (below),
not against a clipped cell tip.

## (a) Gait phase map for walk:0–5 (authoring contract guaranteeing alternation)

Leg labels are tracked by occlusion/boot order across keys, not by an anatomical
left/right claim the skirt occludes: **Leg-A** = the leg that makes the first contact
(walk:1); **Leg-B** = the other leg. Support alternates A → B across the cycle and the
passing leg alternates B → A; no two consecutive keys may share the same support leg
as sole support, and walk:2 / walk:4 must be provably opposite passing poses.

| Key | Phase | Support leg | Passing leg | Foot state |
|---|---|---|---|---|
| walk:0 | Guard / bookend (double support) | Both (A+B) | None | Both boots flat, separated, knees soft; start/end bookend, torso upright |
| walk:1 | Contact-A | Leg-A (front, under hip) + Leg-B trailing push-off | None (B leaving ground) | A heel-strike→flat at front; B toe-off at rear, heel raised |
| walk:2 | **Passing-B (FIRST request — riskiest opposite-passing proof)** | Leg-A sole support, flat under hip | Leg-B passing forward | B knee bent, toe tucked/clear of ground, feet clearly separated; A boot flat. Must not read as a grounded stride or a kick |
| walk:3 | Contact-B (opposite contact to walk:1) | Leg-B (front, under hip) + Leg-A trailing push-off | None (A leaving ground) | B heel-strike→flat at front; A toe-off at rear — support/occlusion visibly reversed vs walk:1 |
| walk:4 | Passing-A (opposite passing to walk:2) | Leg-B sole support, flat under hip | Leg-A passing forward | A knee bent, toe tucked/clear of ground, feet clearly separated; passing leg is the opposite leg to walk:2 |
| walk:5 | Brake / bookend transition | Leg-A front braking + Leg-B rear support (double support, decelerating) | None | A front boot flat with braking heel pressure, B rear toe/partial contact; weight visibly settling back toward walk:0 guard — not a plain guard duplicate |
| (→ walk:0) | Loop closes to guard bookend | Both | None | Matches walk:0 framing/ground so the cycle can loop or stop |

Alternation proof required across the accepted set: support sequence
A(+B toe) → A → B(+A toe) → B → A/B double → both, passing sequence B (walk:2) then
A (walk:4). Mirroring/recoloring a leg to fake alternation is forbidden. If the walk
set still cannot demonstrate this alternation after walk:5, STOP (stop condition (e)).

## (b) Per-request table (grant order; at most 12; reserve-before-call)

Common prompt contract for every request: single isolated pose EDIT/generation from
the named reference only; preserve Xu Chu identity (huge blunt-faced helmeted
dark/full-bearded ochre-armoured boss), glaive design, camera (orthographic
right-facing three-quarter gameplay), body scale/ground, lighting and background;
**only the named pose changes**. No whole-sheet, no reroll, no correction request,
no text-to-image substitution. Reservation: before any call, durably increment
`art/motion/generation-budget.json` (fighter `used` + sequence count) and write the
reservation file; no refunds. Reservation file naming:
`art/motion/xuchu/closeout-campaign/<NN>-<slug>/reservation.json` with the exact
prompt in `<NN>-<slug>/prompt.txt` beside it (candidate, gates and disposition land
in the same `<NN>-<slug>/` directory).

Downstream reference rule (requests 7–12): primary reference is the **accepted walk
anchor / accepted guard (walk:0) identity reference once banked**. Fallback until an
anchor/guard is banked: the existing candidate cell `refs/walk0-original-cell.png`
(guard identity cell). No downstream request may be called while a walk anchor it
depends on is unbanked if that would break the stop conditions; the fallback is a
reference-image fallback only, not permission to skip walk gating.

| # | Request | Reference image | Prompt要点 (pose only; common contract above applies) | Reservation file | After (Xu Chu / global) |
|---|---|---|---|---|---|
| 1 | walk:2 | `art/motion/xuchu/proof-of-control/walk2-original-cell.png` (`75c07dc2…`) | Passing-B phase per (a): Leg-A sole flat support under hip, Leg-B bent forward passing with tucked toe clear of ground, feet clearly separated; natural hip/skirt overlap, not a grounded stride/kick | `01-walk2/reservation.json` | 4 / 171 |
| 2 | walk:3 | `refs/walk3-original-cell.png` (`947d6b77…`) | Contact-B phase per (a): Leg-B front heel-strike support, Leg-A rear toe-off; support/occlusion visibly opposite to walk:1 | `02-walk3/reservation.json` | 5 / 172 |
| 3 | walk:4 | `refs/walk4-original-cell.png` (`b96d7d52…`) | Passing-A phase per (a): Leg-B sole flat support, Leg-A bent forward passing — provably opposite passing leg to accepted walk:2 | `03-walk4/reservation.json` | 6 / 173 |
| 4 | walk:5 | `refs/walk5-original-cell.png` (`3baccee1…`) | Brake phase per (a): front braking boot flat, rear toe/partial support, weight settling toward guard; not a guard duplicate | `04-walk5/reservation.json` | 7 / 174 |
| 5 | walk:0 | `refs/walk0-original-cell.png` (`6bfff0f6…`) | Guard/bookend: both boots flat double support, upright massive stance; exact shared guard bookend for cycle start/end | `05-walk0/reservation.json` | 8 / 175 |
| 6 | walk:1 | `refs/walk1-original-cell.png` (`98c283b5…`) | Contact-A phase per (a): Leg-A front heel-strike support, Leg-B rear toe-off; completes the alternation set with walk:3 | `06-walk1/reservation.json` | 9 / 176 |
| 7 | charge | Primary: accepted walk anchor / accepted walk:0 guard once banked. Fallback: `refs/walk0-original-cell.png` | `charge.crush` committed crushing-advance pose: massive forward drive, glaive levelled in the preserved corridor family, grounded support foot, no shrinking to fit | `07-charge/reservation.json` | 10 / 177 |
| 8 | combo | Primary: accepted walk anchor / accepted walk:0 guard once banked. Fallback: `refs/walk0-original-cell.png` | `sword.combo` glaive strike pose: draw-back→strike commitment readable in one key, connected two-hand grip, stable body mass | `08-combo/reservation.json` | 11 / 178 |
| 9 | heavy | Primary: accepted walk anchor / accepted walk:0 guard once banked. Fallback: `refs/walk0-original-cell.png` | `sword.heavy` committed heavy chop pose: prepared/raised glaive driving down-forward, planted support, no forked shaft | `09-heavy/reservation.json` | 12 / 179 |
| 10 | misc | Primary: accepted walk anchor / accepted walk:0 guard once banked. Fallback: `refs/walk0-original-cell.png` | Hurt/hitstun (misc) pose: upright recoil, identity/weapon retained in hand, feet grounded, no extra limbs | `10-misc/reservation.json` | 13 / 180 |
| 11 | fall | Primary: accepted walk anchor / accepted walk:0 guard once banked. Fallback: `refs/walk0-original-cell.png` | Fall/down pose: knocked-down/impact body on the ground plane, glaive still rigid and un-forked, shared down bookend framing | `11-fall/reservation.json` | 14 / 181 |
| 12 | getup | Primary: accepted walk anchor / accepted walk:0 guard once banked. Fallback: `refs/walk0-original-cell.png` | Getup pose: kneeling→rising transition returning toward the exact guard bookend, support knee/boot readable | `12-getup/reservation.json` | 15 / 182 |

Order is binding: walk:2 first (riskiest opposite-passing proof), then walk:3,
walk:4, walk:5, walk:0, walk:1, then charge, combo, heavy, misc, fall, getup.
No parallel requests.

## (c) Gate checklist per candidate (record every item; raw values, no silent pass)

Gate every candidate before banking it; a banked candidate is the only reference a
later request may build on.

- [ ] **Identity**: same helmeted, full-bearded, ochre-armoured massive Xu Chu as the
  reference/masters; no Guan Yu/other-fighter substitution, no costume/cape drift.
- [ ] **Anatomy**: natural connected anatomy; no mitten/extra/floating hands, extra
  limbs, pasted-on legs; hip/skirt overlap authored, grips connected to the glaive.
- [ ] **Weapon corridor / length / direction vs brief band**: rigid glaive, butt→tip
  corridor, length and direction measured against the ONE brief band fixed in (d);
  spread/direction evaluated by the canonical `(max−min)/mean` rule
  (`scripts/pack-projection.mjs`). **Raw failure recorded honestly**; try deterministic
  shaft retouch before considering any deviation closed. A deviation may be waived
  only source-specifically, for the exact immutable candidate hash, after the batch —
  never blanket or transferred, and never during per-candidate gating.
- [ ] **Scale / ground ≤1.5u**: body scale consistent with the brief band; grounded
  error ≤1.5u at the fixed registration; no shrinking to fit a box, no floating soles.
- [ ] **Seams**: no splice/seam incoherence, halo/key residue, clipped headgear/boots/
  blade, or unintended panel pixels at gameplay size and 4x.
- [ ] **Gait phase match** (walk keys only): candidate demonstrably matches its (a)
  phase — support leg, passing leg and foot state as tabled — and, across the walk
  set, genuine opposite support/passing (walk:2 vs walk:4 passing legs opposite;
  walk:1 vs walk:3 contacts opposite). A pose that reads well alone does not pass
  this comparative gate.
- [ ] **Head endpoint — recorded raw, NOT a per-candidate reject**: measure/record the
  visible head endpoint state (crown→beard-base endpoint readability, clear-background
  gap) honestly per candidate. Because Xu Chu's beard conceals the chin/beard-base
  endpoint, an unreadable endpoint does **not** reject the candidate here; it is
  reserved for the batch-end ruling in which the head-size gate may close only as
  **UNVERIFIED_OWNER_ACCEPTED**, only if all other gates pass and visual consistency
  is independently reviewed (pre-authorized limitation in the grant).
- [ ] **Weapon deviations — recorded raw** for the batch-end hash-specific ruling;
  no per-candidate waiver is issued during the batch.

Consolidate deviations **once at batch end**: one consolidated record listing every
raw head/weapon failure with its exact immutable candidate hash; only there may the
head UNVERIFIED_OWNER_ACCEPTED ruling and any exact-hash source-specific weapon
waivers be applied. Unknown/unmeasured values stay UNVERIFIED, never a pass.

## (d) Brief-band rule

Fix ONE brief band from the **first accepted anchor's** measured body/weapon scale
(measured body height and whole rigid glaive butt→tip length/direction at the fixed
registration, recorded with the anchor's hash). That band is then frozen for every
later candidate: never re-center, never re-fix per sheet, never substitute a
helmet-only/forehead-only or per-pose fit. All later weapon length/direction and
scale/ground gates are judged against this single band; deterministic shaft retouch
is attempted before any length deviation is considered closed.

## (e) Stop conditions (from the grant, verbatim)

> "STOP on any authority/safety failure, on the second genuinely unusable source, on a walk set that still cannot demonstrate alternation after walk:5, before exceeding 15/182, or before offline pack preparation if any non-waived acceptance gate remains open."

Additionally, per the grant: no whole-sheet request, reroll, correction request,
text-to-image substitution, runtime activation or 15B work is authorized; if all
sources pass or receive the exact rulings above, prepare the **offline pack only**
and return for independent review — this grant does not itself mark CMR-15A DONE.

## Campaign progress

| # | Request | Status | Candidate SHA-256 | Reserve (Xu Chu / global) | Gates / band |
|---|---|---|---|---|---|
| 03 | walk:4 (Passing-A) | **REJECTED — unaccepted, not banked; CAMPAIGN STOP (2/2 unusable)** | `990fefd79981394af812a495a98183ed5da972535249976c1417e13f32c5f144` (`03-walk4/candidate-raw.jpg`) | 6 / 173 (reserve commit `0c51789`) | Identity/anatomy PASS; weapon FAIL (blade tip clipped at frame edge despite tip-inside prompt, length unmeasurable frame-exit lower-bound 132.24u vs band [124.41,137.50]u, angle Δ+3.53° vs −26.31°, corridor tip perp 46.26px/14px), scale/ground FAIL (ground 472.5 vs frozen 500@512 = 7.15u >1.5u; body 445 vs 459px −3.05%), seams FAIL (clipped blade), gait FAIL (screen-left toe-down trailing leg, not bent forward Passing-A; opposite passing vs walk:2 not proven); head endpoint RAW gap 0px (not a reject). **Genuinely unusable = 2/2 = grant STOP: campaign stops, no further requests.** Evidence: `03-walk4/gate.json`, `gate.mjs`. |
| 02 | walk:3 (Contact-B) | **REJECTED — unaccepted, not banked** | `ec73c75ab600ced5b4935cc29081824617dc3f5ed2c7ce1857f8d802602c48c7` (`02-walk3/candidate-raw.jpg`) | 5 / 172 (reserve commit `2f6579a`) | Identity/anatomy PASS; weapon FAIL (blade tip clipped at frame edge, length unmeasurable lower-bound 123.46u vs band [124.41,137.50]u, angle Δ+4.69° vs −26.31°, corridor tip perp 38.19px/14px), scale/ground FAIL (ground 469.5 vs frozen 500@512 = 7.93u >1.5u; body 450.5 vs 459px −1.85%), seams FAIL (clipped blade), gait FAIL (front-flat/rear-toe-off same screen arrangement as walk:1, opposite-contact not proven); head endpoint RAW gap 0px (not a reject). **Genuinely unusable = 1/2** (STOP at 2, not reached). Evidence: `02-walk3/gate.json`, `gate.mjs`. |
| 01 | walk:2 (Passing-B) | **ACCEPTED — banked anchor 1** (whole-candidate, no splice) | `893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6` (`01-walk2/accepted.png`, byte copy of candidate-raw.jpg) | 4 / 171 (reserve commit `9ee925b`) | Identity/anatomy/weapon/scale-ground/seams/gait PASS (weapon 503.12px@512, +0.80% vs original, Δangle −0.16°, corridor ≤2.69px/14px; ground 0.26u ≤1.5u; body +0.44%); head endpoint RAW gap 0px (not a reject, batch-end ruling reserved); **brief band FIXED from this anchor**: body 459px@512, weapon 503.12px@512 = 130.79u, band [124.41, 137.50]u, angle −26.31°, groundY 500@512. Genuinely unusable = 0. Evidence: `01-walk2/gate.json`, `gate.mjs`. |

## AMENDMENT — CMR-15A CLOSEOUT AMENDMENT (owner grant, 2026-10-12; setup package, zero generation)

The original FINITE CLOSEOUT grant text above is preserved unchanged. This section
records the amendment that prospectively supersedes its ceilings, stop rule and
no-second-attempt limit from 2026-10-12. The amendment grant is recorded verbatim
in TASKS.md CMR-15A as a new authorization bullet (owner, 2026-10-12,
"CMR-15A CLOSEOUT AMENDMENT (owner grant): …"). All history, the accepted walk:2
anchor (`893c90d7…`), the frozen brief band (weapon 130.79u, band [124.41,137.50]u,
angle −26.31°, groundY 500@512, body 459px@512) and ledger counts (Xu Chu 6,
global 173) are preserved.

### Amended ceilings and order

| Counter | Preserved now | Amended ceiling | Nominal recorded base |
|---|---|---|---|
| Xu Chu used | **6** | **22 total** | cap 12 unchanged |
| Global used | **173 / 200** | **189 / 200 maximum** | 200 |

Reserve-before-call, no refunds. Order (sequential, no parallel):
walk:3, walk:4, walk:5, walk:0, walk:1, charge, combo, heavy, misc, fall, getup.
No whole-sheet, no text-to-image substitution, no runtime activation or 15B work.
This grant does not mark CMR-15A DONE.

### Second-attempt rule

Each key gets at most ONE second attempt, only after a first failure, briefed in
writing on that failure's measured values (ground error u, angle/corridor deltas,
gait defect); no blind rerolls. References: the key's original cell on a
deterministically padded canvas (ground line and tip margin marked; see
`padded-refs/`), plus accepted walk:2 as second reference for walk:3/4/5.
Provider: gpt-preferred for walk:3/4 second attempts, grok otherwise; serving
provider recorded.

Second-attempt pool bookkeeping: the amendment's remaining budget is
22 − 6 = 16 requests for 11 keys in the order above; a key banked
zero-generation (below) returns its slot to this pool (i.e. its first-attempt
slot stays unspent and is available for second attempts). At setup, no slot has
been returned (see zero-generation result below).

### Salvage before "genuinely unusable" (in order)

1. One deterministic uniform scale+translate registration to groundY 500
   (whole candidate, factor recorded, ≤±4%), then re-gate. Campaign
   registration rule used here: factor = 459 / bodyHeightPxAt512, then translate
   ground to 500@512.
2. Deterministic shaft retouch for in-frame length outliers.
3. Weapon-region splice from the original cell only where both grips align and
   seams pass at gameplay and 4x.

A clipped weapon tip may not be fabricated and goes directly to the second
attempt (steps 2–3 do not apply to it).

### Gates (unchanged in substance)

Identity, anatomy, weapon corridor/length/direction vs the frozen band,
scale/ground ≤1.5u after authorized registration, seams, and genuine opposite
support/passing across walk keys. Head-size gate may still close only as
UNVERIFIED_OWNER_ACCEPTED at batch end if all other gates pass with independent
visual review; weapon waivers only for exact immutable hashes at batch end.

### walk:0 / walk:1 zero-generation option — setup result (NOT banked)

walk:0/walk:1 may alternatively be banked zero-generation from the original
candidate-2 cells if they pass ALL gates on existing pixels, returning their
slots to the second-attempt pool. Setup result
(`00-zerogen/gate.json`, script `00-zerogen/gate-zerogen.mjs`): **both FAIL and
are NOT banked** — weapon blade tip clipped at the cell edge (whole length
unmeasurable; frame-exit lower bounds 126.05u walk:0 / 128.65u walk:1 after
registration, recorded raw) and seams FAIL (walk:1 also carries a neighbouring
cell's blade fragment at its left edge). Identity/anatomy/gait-phase-role pass,
scale/ground pass only after authorized registration (factors 0.9808 / 1.0000),
head RAW gap 0px. No `banked-walk0.png` / `banked-walk1.png`; **0 slots
returned**; walk:0/1 will be generated later in amendment order, briefed on
these measured failures.

### Salvage-for-the-record on rejected 02/03 candidates

`00-zerogen/salvage-record.json`: salvage step (1) applied to the rejected
02-walk3 (factor 1.0189) and 03-walk4 (1.0315) raw candidates cures ground/scale
only (0u after registration); tip-clip (whole length still unmeasurable,
corridor tip perp 38.91px / 47.71px scaled vs 14px), seams and gait still FAIL.
Their REJECT status is unchanged; they are not banked and not recounted.

### Padded references built at setup

`padded-refs/` (script `padded-refs/build-padded-refs.mjs`, manifest
`padded-refs/padded-refs.json`): each original cell centred 1:1 at (256,256) on
a 1024×1024 **transparent** canvas. The reference to send carries a subtle ground
line at the scaled groundY (1000@1024 = frozen 500@512 ×2); a separate marked
preview (never sent) additionally draws the tip-margin box inset 40px from every
edge and the cell placement box. Sent-reference SHA-256: walk3 `8a952923ecdbba82f85930f5dddee1a4704da3d0d7082d738f7b37390e8c016c`,
walk4 `5b79aeb05b531205da9314d070d32c402eafc77a7815c16053e6ebf5bf15182b`,
walk5 `df0f13a12ef1f2e69cc204bd775734d8169c82f7e1b48c8f969e18a173cb4bf8`.

### Revised STOP rule (amendment; supersedes (e) prospectively)

STOP on any authority/safety failure, on two consecutive sources still unusable
after salvage and second attempt, on walk alternation unproven after walk:5, or
before exceeding 22/189. If all sources pass or receive the exact rulings above,
prepare the offline pack only and return for independent review.

### Amendment progress

| Step | Status |
|---|---|
| Setup (this package) | DONE — grant recorded, IN_PROGRESS, zero-gen gates, padded refs, salvage record; ledger unchanged 6/173 |
| walk:3 first attempt | Next (amendment order) |

## Setup checks (this package)

Ledger recomputed (Xu Chu 3/12 used, global 170/200) — matches grant ceilings
15 / 182. Reference cells extracted from existing pixels and hashed above;
`walk:3` cell opened and visually confirmed as the candidate-2 bottom-left cell.
Zero `image_generate` calls, zero reservations, zero ledger writes in this setup.
No tests/browser/build run: no code, runtime, UI or shipping change (docs + reference
crops only); `git diff --check` at commit time.
