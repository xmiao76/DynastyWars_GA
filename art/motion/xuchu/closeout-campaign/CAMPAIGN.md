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
| walk:5 | **Stop/Settle closing key** (AMENDED 2026-10-13 by owner WALK:5 ZERO-GENERATION PHASE AMENDMENT, walk:5 ONLY — replaces the exact Li Dian-guide Brake metrics; original row read "Brake / bookend transition … A front boot flat with braking heel pressure, B rear toe/partial contact; weight visibly settling back toward walk:0 guard") | Both grounded (front planted + rear closing) | None | A genuinely distinct grounded drawing after walk:4 Passing-A that reads as the final step settling toward walk:0 guard: front foot planted ahead, rear foot grounded/closing, no passing leg, not a guard duplicate, not a repeat of the walk:1/walk:3 contact arrangement |
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

### REGISTRATION AMENDMENT note (owner grant, 2026-10-12 — "CMR-15A REGISTRATION AMENDMENT", recorded verbatim in TASKS.md CMR-15A)

Prospective only; all history, the banked walk:2 anchor, the frozen brief band and
ledger counts (Xu Chu 8, global 175) are preserved. The deterministic salvage
registration cap in step (1) below is raised from **±4% to ±12%** for candidates
whose native resolution exceeds the 512px pack cell (uniform whole-candidate
scale+translate only, factor recorded). Zero-generation re-gate of the existing
03-walk4 attempt-2 candidate (`3cdc2fa8…`) under the new cap; if all gates pass it
banks as anchor 2. The grant also authorizes ONE third attempt for walk:3 only and
then continuation in amendment order (ceilings 22/189 unchanged); it does not mark
CMR-15A DONE. Re-gate result is recorded in the Amendment progress table below and
in `03-walk4/attempt2/regate.json`: **FAIL on weapon length after registration** —
the candidate remains unaccepted and CMR-15A is BLOCKED again on that exact gate.

### SHAFT-RETOUCH SALVAGE note (owner grant, 2026-10-12 — "CMR-15A SHAFT-RETOUCH SALVAGE", recorded verbatim in TASKS.md CMR-15A)

Prospective only; all history, the banked walk:2 anchor, the frozen brief band and
ledger counts (Xu Chu 8, global 175; ceilings 22/189) are preserved. The salvage
order now explicitly includes **deterministic shaft retouch after registration for
length outliers**: on the registered walk:4 cell (`03-walk4/attempt2/registered.png`,
`b0d7030b…`, weapon 145.63u), shorten the glaive along its existing shaft axis into
[124.41, 137.50]u (target ≈132u), tip redrawn on the same shaft line, no pixels
changed outside the weapon region; verify seams at gameplay size and 4x, then
re-gate fully — if all pass, bank as anchor 2. The same after-registration shaft
retouch is explicitly part of the salvage order for length outliers in the
remaining keys (walk:3 third attempt, then walk:5, walk:0, walk:1, charge, combo,
heavy, misc, fall, getup, in later packages). This grant does not mark CMR-15A DONE.

**Shaft-retouch salvage result (2026-10-12, zero generation): PASS — banked as
anchor 2.** Deterministic `03-walk4/attempt2/retouch.mjs` shortened the registered
cell (`b0d7030b…`, 145.63u) along its measured shaft axis: terminal blade segment
(t≥510px) copy/shifted inward by (−47,+23)px to joint t=457.67px (seam width match
dLo −1.51 / dHi +2.55px) → `retouched.png` (`75488eb1…`). Outside-weapon-region
RGBA hash identical (`6cbac8ab…`, 0 changed px outside; 4575 inside). Full re-gate
(`retouch-gate.json`): weapon **132.03u in band**, angle Δ−0.12°, corridor ≤5.33px,
body 459px, ground 0.00u, seams verified at gameplay size + 4x, gait Passing-A,
head RAW 0px. `accepted.png` banked (byte copy of `retouched.png`, `75488eb1…`;
registered + retouched hashes recorded). **Consecutive unusable = 0.**

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
| walk:3 second attempt (`02-walk3/attempt2/`) | **REJECTED after salvage — unaccepted, not banked** (candidate `d92a24afe7060fd40201acf74c252676f1fa0c5be670b3450f9b0d9e5fb4424b`, reserve commit `822d907`, Xu Chu 7 / global 174, ceilings 22/189). One gpt-preferred EDIT (serving UNCONFIRMED) with padded walk3 ref + accepted walk:2 anchor, briefed on attempt-1 failure. Gates (`02-walk3/attempt2/gate.json`): identity/anatomy PASS; weapon PASS (125.65u in band [124.41,137.50]u, angle Δ−0.45°, corridor ≤12.03px/14px, tip not clipped, right margin 37px native recorded raw); scale/ground FAIL (body 414.42 vs 459px@512 −9.71%; ground 474.85 vs 500@512 = 6.54u >1.5u; salvage step (1) factor 1.1076 exceeds ±4% cap, not applied; steps (2)–(3) do not cure); seams FAIL (retained painted green ground line, 4065 green px); gait FAIL (front-flat/rear-toe same screen arrangement as walk:1, Contact-B opposite occlusion not proven); head RAW gap 0px (not a reject). **Post-amendment post-correction unusable count 0→1 (consecutive 1/2; STOP at 2 consecutive not reached).** walk:3 second attempt spent, no third attempt. Next amendment key: walk:4 (manager/owner direction). |
| walk:4 SHAFT-RETOUCH SALVAGE (`03-walk4/attempt2/retouch.mjs`/`retouch-gate.json`/`retouched.png`/`accepted.png`) | **PASS — BANKED AS ANCHOR 2** (zero generation; ledger unchanged Xu Chu 8 / global 175). Glaive shortened on the registered cell along its existing shaft axis 145.63u → **132.03u in band [124.41,137.50]u** (507.89px@512, Δ+0.95% vs anchor, angle −26.43° Δ−0.12°, corridor butt 5.33/tip 4.24px vs 14px, tip margin 50.30px); outside-weapon-region RGBA hash identical (`6cbac8ab…`, 0 changed px outside); seams PASS at gameplay + 4x (joint seam continuous, greenPx=0); body 459px, ground 0.00u; gait Passing-A PASS; head RAW 0px. `accepted.png` = byte copy of `retouched.png` (`75488eb18b330aef398faede00f59a000f20d7a3659d6c2ec24e031f29c0a6ad`); registered `b0d7030be18132b855d43d35a03cc72a24fe875e3994b44777d06239eaa32803`. **Consecutive unusable = 0.** CMR-15A stays IN_PROGRESS; continuation in later packages. |
| walk:3 THIRD attempt (`02-walk3/attempt3/`) | **REJECTED after salvage — unaccepted, not banked (no accepted.png)** (candidate `29e06c60ffa49a95dc3c2466553596b2f38b2be138facb9a165d43e3c10acd7f`, reserve commit `d7453de` Xu Chu 8→9 / global 175→176, candidate commit `982540f`, ceilings 22/189). Exactly ONE gpt EDIT with padded walk3 ref `8a952923…` + banked walk:2 `893c90d7…` + banked walk:4 `75488eb1…`, briefed on scale/gait/weapon-ratio failures. Salvage step (1) registration applied: factor 1.0707 (+7.07%, within ±12%, native 1254px) → `registered.png` (`2d21f6cd…`); step (2) shaft retouch not applied (registered length 132.13u in band; retouch cannot cure corridor — shortening to band low 124.41u still leaves tip perp ≈14.68px >14px); step (3) splice precondition (exact grip alignment) not demonstrated. Gates (`02-walk3/attempt3/gate.json`, rerun hash-identical by correction worker cmr15a-walk3-attempt3, zero new generation): identity/anatomy/seams PASS (greenPx=0, no clipping); weapon length PASS 132.13u in band [124.41,137.50]u, direction PASS (−24.98°, Δ+1.33°); **weapon corridor FAIL — tip perp 15.36px vs 14px limit (butt 3.54px)**; scale/ground PASS after registration (body 459px@512, ground 0.00u); gait Contact-B PASS (screen-right flat front support, screen-left toe-off 9px native clear); head RAW 0px (not a reject). **Post-correction consecutive unusable 0→1 (STOP at 2 not reached).** walk:3 third attempt spent; CMR-15A stays IN_PROGRESS; next key walk:5 in a later package under manager direction. |
| walk:5 FIRST attempt (`04-walk5/`) | **REJECTED after salvage — unaccepted, not banked (no accepted.png)** (candidate `cc99a96b9b805d1e4c7fb36a65cd91f79b30eed1d74492adc3653b5e077fbd89`, reserve commit `2f17d0b` Xu Chu 9→10 / global 176→177, candidate commit `9637b28`, ceilings 22/189). Exactly ONE grok EDIT with padded walk5 ref `df0f13a1…` + banked walk:2 `893c90d7…` + banked walk:4 `75488eb1…`; correction worker cmr15a-walk5-attempt1 made NO second reservation/generation. Salvage step (1) registration factor 1.0099 (+0.99% ≤±12%, native 1024px) → `registered.png` (`95c9c452…`, gate rerun hash-identical); step (2) no length outlier (131.97u in band); step (3) splice grips not demonstrated aligned and cannot cure gait. Gates (`04-walk5/gate.json`): identity/anatomy/seams PASS (greenPx=0, no clipping); weapon PASS 131.97u in band [124.41,137.50]u, Δ−0.15°, corridor butt 5.73/tip 7.09px vs 14px, tip margin 28.77px@512; scale/ground PASS (body 459px, ground 0.00u); head RAW 0px (not a reject); **gait Brake FAIL — screen-right boot flat with shin vertical under hip (support, not forward-planted braced braking leg) + screen-left toe-down trailing at sole row (contact/toe-off pair); Brake/bookend phase per §(a) not proven, weight-settling-back not demonstrated**. **FIRST-attempt rejection: eligible for exactly one future briefed second attempt; NOT counted post-correction unusable yet — consecutive stays 1 (STOP at 2 not reached).** CMR-15A stays IN_PROGRESS. |
| walk:5 SECOND attempt (`04-walk5/attempt2/`) | **REJECTED after salvage — unaccepted, not banked (no accepted.png); POST-CORRECTION UNUSABLE 1→2 = CAMPAIGN STOP** (candidate `998735e68a04c380b6aecbe1f93ef531f7019634f534fac5d4261f876234c1f4`, reserve commit `da1296b` Xu Chu 10→11 / global 177→178, candidate commit `5574195`, ceilings 22/189). Exactly ONE grok EDIT with padded walk5 ref `df0f13a1…` + banked walk:2 `893c90d7…` + banked walk:4 `75488eb1…`, explicitly briefed that attempt 1 failed ONLY Brake gait (vertical-shin flat support + trailing toe-off contact pair) and requiring §(a) Brake as a diagonal braced front strut with digging heel, hips low/back, rear leg catching settling weight. Salvage step (1) registration factor 1.1034 (+10.34% ≤±12%, native 1024px; raw body 416px@512) → `registered.png` (`3608a9d0…`); step (2) shaft retouch not applicable (registered 129.72u in band, no length outlier); step (3) splice grips not demonstrated aligned and cannot cure gait. Gates (`04-walk5/attempt2/gate.json`): identity/anatomy/seams PASS (greenPx=0, no clipping); weapon PASS 129.72u in band [124.41,137.50]u, Δ+1.05°, corridor butt 10.50/tip 1.36px vs 14px; scale/ground PASS (body 459px, ground 0.00u); head RAW gap 13px (not a reject); **gait Brake FAIL — correction did not take: screen-right flat boot with shin/boot-shaft vertical under a bent knee (weight over the boot, heel flat not digging) + screen-left toe-down trailing boot at/below the front-sole row (955 vs 944 native) = the same contact/toe-off pair as attempt 1; braced-forward braking and weight-settling-back per §(a) not proven**. **Walk:5 counted post-correction unusable: consecutive 1→2 (walk:3 third attempt = 1) = revised STOP reached — campaign STOPPED, CMR-15A BLOCKED WAITING_FOR_OWNER; walk:0 onward not reserved/called.** |
| walk:4 attempt-2 REGISTRATION AMENDMENT re-gate (`03-walk4/attempt2/regate.mjs`/`regate.json`/`registered.png`) | **FAIL — candidate remains UNACCEPTED, not banked (no accepted.png); CMR-15A BLOCKED again on exact gate** (zero generation; ledger unchanged Xu Chu 8 / global 175). One uniform scale+translate (factor 1.1032300355740923, +10.32% within new ±12% cap, native 1254px > 512px cell; dx −33.63, dy −8.10 @512) produced `registered.png` (`b0d7030b…`, 512×512). Re-measured: identity/anatomy PASS; **weapon length FAIL — 560.22px@512 = 145.63u vs frozen band [124.41,137.50]u** (pre-registration 132.01u scaled by the same uniform factor; +11.35% vs anchor, spread 10.74%; no in-batch waiver); corridor PASS (butt 5.33 / tip 4.46px vs 14px), direction PASS (−26.40°, Δ−0.09°), tip inside frame (margin 3.30px@512, not clipped); scale/ground PASS after registration (body 459.00px@512, ground 500@512 = 0.00u ≤1.5u, raster crown 41 / ground 500); seams PASS (greenPx=0, no edge clipping); gait Passing-A PASS (visually reconfirmed on registered cell, opposite walk:2); head RAW 0px (not a reject). |
| walk:4 second attempt (`03-walk4/attempt2/`) | **REJECTED after salvage — unaccepted, not banked; AMENDMENT STOP (2 consecutive)** (candidate `3cdc2fa8ea1923e0fe3a8b9af09cd7d65b814d216ed0461b09d4e87dcf94e2b0`, reserve commits `176213f`+`952a5b9`, candidate commit `d267a38`, Xu Chu 8 / global 175, ceilings 22/189). Exactly one gpt EDIT (provider gpt, serving UNCONFIRMED, no substitution) with padded walk4 ref `5b79aeb0…` + accepted walk:2 anchor `893c90d7…` (read via identical-bytes candidate-raw.jpg due accepted.png extension mismatch), briefed on walk:4 attempt-1 failure (ground +7.15u, Δ+3.53°, tip clipped/corridor 46.26px, trailing toe-down gait) AND walk:3 attempt-2 lessons (−9.71% too small, retained green line; explicitly no ground/guide line drawn, anchor-scale body, feet on ground level). Gates (`03-walk4/attempt2/gate.json`): identity/anatomy PASS; weapon PASS (132.01u in band [124.41,137.50]u, angle Δ−0.09°, corridor ≤3.99px/14px, tip not clipped, margin 50px native); seams PASS (greenPx=0, no retained guide line, no clipping); gait PASS (screen-left flat support + screen-right bent forward passing boot 68px native clear, opposite arrangement to walk:2); scale/ground FAIL (body 416.05 vs 459px@512 −9.36%; ground 460.56 vs 500@512 = 10.25u >1.5u; salvage step (1) factor 1.1032 exceeds ±4% cap, not applied; steps (2)–(3) do not cure scale/ground); head RAW gap 0px (not a reject). **Post-amendment consecutive unusable 1→2 = revised STOP reached: campaign STOPPED, no further amendment requests; CMR-15A BLOCKED WAITING_FOR_OWNER.** walk:4 second attempt spent, no third attempt. |

## ALTERNATIVE COMPLETION Phase 1 (2026-10-12; work cmr15a-alt-phase1-bank, ZERO generation)

Prospective reset BLOCKED→IN_PROGRESS for Phase 1 only; all prior BLOCKED/STOP
history above, banked walk:2 (`893c90d7…`) + walk:4 (`75488eb1…`), the frozen
brief band (weapon 130.79u, band [124.41,137.50]u, angle −26.31°, groundY
500@512, body 459px@512) and ledger (Xu Chu 11 / global 178, file SHA-256
`371a8bcf…`) are preserved. Owner grant (Alternative Completion, verbatim): "CMR-15A ALTERNATIVE COMPLETION: Reset BLOCKED→IN_PROGRESS prospectively; preserve all history, banked walk:2/walk:4, frozen band, and ledger counts (Xu Chu 11/global 178); ceilings 22/189 unchanged. Phase 1, zero generation: rerun the campaign-standard gate with independent raster re-measurement on the alternative diagnostic outputs; bank walk:3, walk:0, and walk:1 only if every gate passes, correcting walk:1’s description to heel-strike Contact-A. Phase 2: reserve and make ONE guide-guided walk:5 edit using a grey-mannequin Brake guide derived from Li Dian’s braced legs and banked Xu Chu anchors for identity; if Brake gait fails, STOP for my decision. Phase 3: charge, combo, heavy, misc, fall, and getup as one 3×3 sheet each using the Li Dian method and Xu Chu identity/band briefs; deterministic retouch before at most one focused fix per sheet. STOP on two consecutive post-salvage unusable sources or before exceeding 22/189. Prepare the offline pack only, apply the batch-end head/exact-hash rulings already authorized, and return for independent review; do not mark CMR-15A DONE or start CMR-15B."

Campaign-standard gate (`alternative-phase1/gate.mjs`, CAMPAIGN (c) checklist,
FRESH raster landmarks — alpha≥16 butt-band centroid / max-projection tip /
crown-ground / boot-column soles — not the diagnostic scripts or their carried
landmarks) on the EXACT alternative outputs. Full per-key reports + fresh
marked/gameplay/head/legs/tip-4x/soles-4x imagery in each key's `alternative/`
dir (`gate.json`):

| Key | Exact output SHA-256 | Fresh raster weapon (u / Δangle / corridor butt·tip px) | Body·ground | Boots soles @512 | Verdict |
|---|---|---|---|---|---|
| walk:3 Contact-B | `dc3e699fabf115ea6ab3c064b51680862697a59a85c70cfa627252f41dff1ea7` (`alternative/walk3-rotated.png`; source attempt3 registered `2d21f6cd…`) | 131.96u in band / +0.76° / 4.48·11.22 ≤14 | 459px / 0.00u | rear 496, front 500 | **PASS — BANKED** `02-walk3/alternative/accepted.png` (`dc3e699f…`, byte copy) |
| walk:0 Guard | `2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450` (`alternative/walk0-registered.png`; sheet `bad2aee5…` comp id0, reg 0.9808) | 129.66u in band / +1.05° / 10.45·1.32 ≤14 | 458px / 0.00u | 500 / 493 both flat | **PASS — BANKED** `05-walk0/alternative/accepted.png` (`2a4a415d…`) |
| walk:1 heel-strike Contact-A | `2de4d8490eff7f1751785c312dc1fac6518e6d6d40d03befefc8e9bee113367c` (`alternative/walk1-registered.png`; sheet `bad2aee5…` comp id1, reg 1.0000) | 134.45u in band / +1.65° / 11.77·3.11 ≤14 | 458px / 0.00u | rear 497 toe-off, front heel 500 toe-up | **PASS — BANKED** `06-walk1/alternative/accepted.png` (`2de4d849…`) |

Identity/anatomy PASS all three (fresh full + head reads); seams PASS
(greenPx=0, zero edge-opaque; walk:3 grip-exit rotation seam continuous at
gameplay 1x + `gate-seam-grip-4x.png`; walk:0/1 whole-component tips complete,
neighbour fragment excluded); gait as tabled — walk:1 description CORRECTED to
**heel-strike Contact-A** (diagnostic "front flat" was wrong); head endpoint
RAW 0px all three (not a reject, batch-end ruling reserved). Walk set now
banked: walk:0 guard, walk:1 Contact-A, walk:2 Passing-B, walk:3 Contact-B,
walk:4 Passing-A; walk:5 Brake still unbanked/rejected. Ledger verified
unchanged Xu Chu 11 / global 178 (ceilings 22/189 untouched); CMR-15A stays
IN_PROGRESS, not DONE; no pack preparation, no runtime/15B work in Phase 1.

## ALTERNATIVE COMPLETION Phase 2 — Brake guide preparation (2026-10-12; work cmr15a-walk5-guide, ZERO generation, NO reservation)

Preparation only: the Phase-2 guide-guided walk:5 edit is **not reserved and not
called** in this package (ledger verified unchanged, file SHA-256 `371a8bcf…`,
Xu Chu 11 / global 178, ceilings 22/189). The edit itself is a later separate
reserve-before-call package; if Brake gait then fails, STOP for owner decision.

**Donor cell identified:** Li Dian `charge-prepared-source.png` (`40054db9…`)
cell **4 "brake"** — `charge-prompt.txt` authors cells 0–4 as
coil/launch/dash/dash-alt/brake and `art/motion/lidian/registration.json`
layout.charge maps position 4 → cell 4 "brake" (keptCells 0–4); row-major 3×3
on 1536×1024 ⇒ centre cell, origin (512,341). Traced front leg (sheet px):
hip (757,516) → knee (834,586) → ankle (870,646), heel (860,666) — a
near-straight diagonal strut 41.0° from vertical, shin 31.0°, knee bend 16.8°.
The donor's forward-leaning torso and trailing rear leg are deliberately NOT
copied (the trailing read is what failed walk:5 attempts 1–2).

**Guide built deterministically** (`04-walk5/phase2-guide/build-guide.mjs`,
method after `test/game/wholeframe-guides.test.ts`/`motion-guides.test.ts`
grey mannequin; joints authored @512, rendered ×2 on a 1024×1024 #FF00FF
canvas at the frozen anchor geometry: crown 82@1024, ground 1000@1024,
weapon butt [70,636] tip [972,190] = 503.12px@512 / −26.31°; raster
non-magenta bounds x54–975, y80–1001 incl. outline, tip 49px inside right
edge). Xu Chu upright torso/head/weapon = banked walk:2 skeleton
(cross-checked walk:4); lower body adapted from the donor trace to Xu Chu
proportions: front strut 31.87° / shin 25.94° from vertical, knee bend 11.17°,
front heel 80px@512 ahead of the front hip, hips low/back over the rear boot;
rear leg a 52.94° bent support with ankle −4px@512 vs its hip and heel raised
only 6px (partial support under the body — not trailing toe-off, not
vertical-shin front contact). Thigh/shin lengths matched across legs
(92.8/91.4 and 82.3/80.6 px@512). Clean guide + marked overlay + donor crop
were all opened and read against the donor and both anchors: braced diagonal
front strut with planted heel, weight back over the rear support — PASS as a
guide (no generation judged here).

| File (`04-walk5/phase2-guide/`) | SHA-256 | Role |
|---|---|---|
| `guide-walk5-brake.png` | `6e7819c34e8395838575f78b6645e7383c8f326828e281e982f0bba4cd9215fe` | CLEAN guide, sent as reference 1 — mannequin+weapon on magenta only, no text/ground/guide lines |
| `guide-walk5-brake-marked.png` | `c788f2de061dab592c7a5c3324f22c7751fea8ccffac5b06f7940ec9ed2f6ec8` | Marked diagnostic (hip/knee/ankle/sole/ground/weapon + angles) — NEVER sent |
| `guide-spec.json` | (hash in file set; sources/joints/metrics/prompt) | Source hashes, donor trace, guide joints @512/@1024, metrics, rejection-pattern checks, exact Phase-2 prompt + reference order |
| `prompt.txt` | (exact byte copy of spec `phase2.promptExact` + LF) | Exact intended Phase-2 prompt text (2683 chars in spec) |
| `lidian-charge-cell4-donor.png` | `836e65c9ef6ee199f18e950230d4fbbf7cf35ac34c6662554a2bb57daf19dae1` | Unchanged nominal-cell donor crop on dark grey (donor blade spills past the nominal cell; legs fully inside) |
| `build-guide.mjs` | — | Reproducible builder; double-run reproduced every output hash byte-identically |

**Phase-2 reference order (binding, when later reserved):** (1) clean guide
`guide-walk5-brake.png` (`6e7819c3…`) — exact pose/silhouette/weapon;
(2) banked walk:2 (`893c90d7…`, sent via `01-walk2/candidate-raw.jpg` —
`accepted.png` is identical JPEG bytes under a .png name) — identity/weapon/
scale; (3) banked walk:4 `03-walk4/attempt2/accepted.png` (`75488eb1…`) —
identity/gait context. The padded walk:5 original cell is intentionally
omitted (its guard legs pull against Brake; attempts 1–2 with it as primary
failed Brake twice). Kind: isolated single-pose EDIT, provider grok
(amendment rule), 1024×1024; after-counts if reserved Xu Chu 12 / global 179.
Exact prompt text lives verbatim in `guide-spec.json: phase2.promptExact` and
`prompt.txt`: it requires copying the guide pose limb-for-limb (diagonal
braced front strut, heel planted ahead, hips low/back, rear bent support
under the hip with heel only slightly raised — no vertical shin, no trailing
toe-off, no passing leg, no square guard), Xu Chu identity/scale/weapon from
the anchors (918px@1024 body, weapon/body 503/459, ~26°, tip ≥40px inside),
and forbids reproducing the magenta/grey guide surface or any line/text.
Post-call: full campaign (c) gate + salvage order as usual, Brake judged
against this guide's metrics. CMR-15A stays IN_PROGRESS, not DONE.

## ALTERNATIVE COMPLETION Phase 2 — walk:5 gate result (2026-10-13; work cmr15a-walk5-phase2-gates, ZERO generation)

**REJECTED after salvage — candidate `4d9a7308…` UNACCEPTED, not banked (no
`04-walk5/phase2/accepted.png`); Brake FAIL = grant STOP.** The sole Phase-2
guide-guided edit (reserve `2c2d7e2`, Xu Chu 11→12 / global 178→179; references
clean guide `6e7819c3…` → walk:2 `893c90d7…` → walk:4 `75488eb1…`) was gated
campaign-standard with the authorized salvage order (`04-walk5/phase2/gate.mjs`/
`gate.json`; probe + gate head/legs/tip/soles/soles-4x + marked + registered +
candidate all opened; gate rerun reproduced `registered.png`
`01b4c21477e39e8ba540adbdb8deb68a686b9e833970e5eb7788e8ad583f7b73` identically):

1. **Registration applied**: factor 1.0528 (+5.28% ≤±12%, native 1024px; raw body
   436px@512) → body 459px@512, front-heel ground 500@512 = 0.00u.
2. **Shaft retouch not applicable**: registered weapon 517.92px@512 = **134.64u
   in frozen band [124.41,137.50]u** (Δ+2.94% vs anchor, spread 2.90%), angle
   −25.91° Δ+0.40°, corridor butt 6.45/tip 2.87px vs 14px, tip inside (margin
   24.39px@512) — no in-frame length outlier.
3. **Weapon splice not attempted**: both-grips exact alignment not demonstrated,
   and a splice cannot cure gait; precondition (grips align + seams gameplay+4x)
   not met.

Other gates PASS: identity/anatomy (same helmeted full-bearded ochre/dark Xu
Chu as both anchors, connected two-hand grip, no extra limbs), seams
(greenPx=0, magentaPx=0 — no retained guide line/surface, no clipping),
head RAW gap 0px (not a reject). **Gait Brake FAIL (guide values in
brackets)**: front shin/boot-shaft knee→ankle **0.0° from vertical [25.94°]**
with knee bend **53.5° [11.17°]** and whole-leg strut 19.0° [31.87°], heel
57.9px@512 ahead of hip [80px] — a bent-knee forward heel-strike with toe
raised 47px native, not a near-straight diagonal braced strut with a flat
digging heel; rear boot is a **trailing toe-down** boot with ankle
**−84.2px@512 vs its hip [−4px, under the hip]** and toe 13px native above
the front-heel row (registered 493.16@512), so no grounded rear support;
head/torso lean forward over the stride — no weight settling back toward
guard. This is materially the vertical-shin + trailing toe-off stride
rejected in walk:5 attempts 1–2.

**Disposition: sole Phase-2 attempt spent; per the Alternative Completion
grant ("if Brake gait fails, STOP for my decision") CMR-15A is BLOCKED
WAITING_FOR_OWNER — no further requests, no Phase 3, no pack preparation.**
Walk set remains banked except walk:5 (walk:0/1/2/3/4 banked). Ledger
unchanged by this zero-generation gate: Xu Chu 12 / global 179 (file
`088825cd…`, ceilings 22/189); not DONE.

## WALK:5 GPT GUIDE ATTEMPT — gate result (2026-10-13; work cmr15a-walk5-gpt-gates, ZERO generation)

**REJECTED after salvage — candidate `1bc806bb…` UNACCEPTED, not banked (no
`04-walk5/gpt-attempt/accepted.png`); Brake FAIL = final-attempt STOP.** The one
additional gpt-preferred guide-guided edit (reserve `eada279`, Xu Chu 12→13 /
global 179→180; references clean guide `6e7819c3…` → walk:2 `893c90d7…` →
walk:4 `75488eb1…`) was gated campaign-standard with the authorized salvage
order (`04-walk5/gpt-attempt/probe.mjs`/`gate.mjs`/`gate.json`; candidate +
probe/gate head/legs/tip/butt/soles/soles-4x + marked + registered all opened
with the guide/anchors; rerun reproduced `registered.png` `fcca9950…`
identically):

1. **Registration applied**: factor 1.0458 (+4.58% ≤±12%, native 1254px; raw
   body 438.87px@512) → body 459px@512, front-sole ground 500@512 = 0.00u.
2. **Shaft retouch NOT banked (length outlier, gait-incurable)**: registered
   weapon 536.58px@512 = **139.49u OUT_HIGH vs frozen band [124.41,137.50]u**,
   tip inside (margin 16.47px@512) — an in-frame length outlier; projected
   shortening to 132u along the candidate axis stays in corridor, so length
   alone was retouch-curable, but retouch cannot cure the Brake gait failure
   below, so no retouched art is banked (phase2/walk3-attempt3 precedent; raw
   FAIL recorded, no in-batch waiver). Angle −26.97° Δ−0.66° and corridor butt
   0.08/tip 6.29px vs 14px PASS.
3. **Weapon splice not attempted**: two-grip exact alignment not demonstrated,
   seams gameplay+4x unproven, and a splice cannot cure gait.

Identity/anatomy PASS (same helmeted full-bearded ochre/dark Xu Chu as both
anchors, connected two-hand grip, no extra limbs); seams PASS (greenPx=0,
magentaPx=0, edge-opaque=0, alpha fringe clean); head RAW gap 0px (not a
reject). **Exact Brake FAIL (conjunctive; guide in brackets): front strut
PASSES for the first time** (shin 35.4° from vertical [25.94°], knee bend 8.4°
[11.17°], strut 29.3° [31.87°], heel 87.5px@512 ahead [80px], flat front sole)
**&mdash; but hips/weight are NOT back** (hip centre 220.1@512, head centre
252.2@512 over mid-stance, ahead of the rear forefoot contact [141,180]@512;
guide hip centre 195 within rear boot [160,210]) **and the rear leg is the
rejected trailing toe-off** (ankle −51.2px@512 vs its hip [−4px], heel raised
23.5px@512 [6px], forefoot-only at 497.0@512; raster sole 1141→1189 native vs
front 1196). Stance front-heel−rear-toe 158.0px@512 [84px] = a wide ordinary
forward stride/contact stance with a straighter front leg, not weight jammed
back over a rear support under the hips. Joint-uncertainty robust (±30px
native hips; see gate.json).

**Disposition: final authorized walk:5 generation spent; per the grant ("If
Brake fails again, STOP for my decision—no third generation attempt") CMR-15A
is BLOCKED WAITING_FOR_OWNER / STOP — no Phase 3, no pack preparation.** Walk
set remains banked except walk:5. Ledger unchanged by this gate: Xu Chu 13 /
global 180 (file `e22523da…`, ceilings 22/189); not DONE.

## Setup checks (this package)

Ledger recomputed (Xu Chu 3/12 used, global 170/200) — matches grant ceilings
15 / 182. Reference cells extracted from existing pixels and hashed above;
`walk:3` cell opened and visually confirmed as the candidate-2 bottom-left cell.
Zero `image_generate` calls, zero reservations, zero ledger writes in this setup.
No tests/browser/build run: no code, runtime, UI or shipping change (docs + reference
crops only); `git diff --check` at commit time.

## WALK:5 ZERO-GENERATION PHASE AMENDMENT (owner grant, 2026-10-13; work cmr15a-walk5-zerogen-amendment, ZERO generation)

Grant recorded verbatim in TASKS.md CMR-15A (owner, 2026-10-13, "CMR-15A
WALK:5 ZERO-GENERATION PHASE AMENDMENT: …"). Prospective BLOCKED→IN_PROGRESS;
all history, banked walk:0–4, frozen band and ledger Xu Chu 13/global 180
(ceilings 22/189) preserved. **§(a) walk:5 amended ONLY** (row above): the
exact Li Dian-guide Brake metrics are replaced by the **Stop/Settle closing
key** definition. CMR-15A acceptance otherwise unchanged. Scope of this
package: (i) component-extract the original walk-candidate-2 walk:5 figure
(`bad2aee5…`), register it campaign-standard, shaft-retouch only if an
in-frame length outlier; (ii) shaft-retouch the GPT registered candidate
`fcca9950…` to ~132u; gate BOTH campaign-standard (identity/anatomy/seams,
weapon corridor/length/direction, body/ground, amended Stop/Settle gait,
head RAW) including comparative distinctness vs banked walk:0/1/3 and
walk:4→candidate→walk:0 continuity at gameplay size and 4x. Bank at most
one, only if every gate passes; if neither passes, STOP WAITING_FOR_OWNER
with no generation. Phase 3 is NOT started in this package.

**Result (2026-10-13, zero generation; `04-walk5/zerogen-amendment/build.mjs`
+ `finalize.mjs`/`gate.json`, reruns hash-identical; both final cells +
marked/head/legs/tip-4x/soles-4x + sequence/compare sheets personally
opened):**

| Candidate | Build | Weapon fresh raster | Body/ground | Amended Stop/Settle + distinctness | Verdict |
|---|---|---|---|---|---|
| (i) Original candidate-2 walk:5 | component [1057,542,1514,984] of `bad2aee5…` (tip complete, xmax 1514 < sheet edge), extracted → registration 1.0361 (+3.61% ≤±12%) → `orig-registered.png` `89afcca7…`; **no shaft retouch** (135.10u in band = no in-frame outlier) | 135.10u in [124.41,137.50]u, Δ+0.79°, corridor 4.02/3.11px ≤14 | 458px / 0.00u | **PASS**: front flat planted (sole 492, heelRaised 1px, centre 296.5 = +23.5px ahead of guard 273), rear full-flat grounded (sole 500, heelRaised 2px), no passing leg; stance 196 vs walk:0 171px, silhouette XOR 18.56% (legs 26.85%) ≠ guard duplicate; both heels down ≠ walk:1 (rear heelRaised 15px) / walk:3 (9px) toe-off; walk:4→5→0 settle coherent at gameplay size + legs-2x + soles-4x | **PASS — BANKED** `04-walk5/zerogen-amendment/accepted.png` (byte copy, `89afcca7…`) |
| (ii) GPT registered `fcca9950…` | deterministic shaft retouch along its axis (joint (424,116), seam width match −0.32px) → `gpt-retouched.png` `e34fb958…`; outside-weapon-region RGBA hash identical, 0 changed px outside | 140.39u fresh raster (139.49u prior landmarks) OUT_HIGH → **131.90u in band**, Δ−0.48°, corridor 4.20/8.43px ≤14 | 459px / 0.00u (carried) | **FAIL**: front planted flat (sole 500, centre 374) but rear is forefoot-only toe-off (heel 479 vs sole 497, heelRaised 18px; prior landmark 23.5px) — not grounded/closing, and front-flat + rear-toe-off repeats the walk:1/walk:3 contact arrangement the amendment excludes; reads as another stride, not a settle | **NOT banked** (weapon/body/ground/seams/identity/anatomy PASS after retouch; gait-only failure, deterministically incurable) |

Identity/anatomy/seams PASS both (green/magenta/edge-opaque = 0; GPT retouch
joint continuous at gameplay + 4x); head RAW 0px both (not a reject;
batch-end ruling reserved). **Exactly one banked — the choice is forced, as
only the original passes every gate.** Walk set now banked walk:0–5.
CMR-15A stays IN_PROGRESS; Phase 3 (per the Alternative Completion grant,
offline pack only then independent review) is a later package, NOT started
here; not DONE, no 15B. Ledger unchanged (`e22523da…`, Xu Chu 13/global
180, ceilings 22/189); zero generation.

## CHARGE EXACT-HASH WAIVER — charge BANKED (owner grant, 2026-10-13; work cmr15a-charge-waiver-bank, ZERO generation)

Grant recorded verbatim in TASKS.md CMR-15A (owner, 2026-10-13, "CMR-15A
CHARGE EXACT-HASH WAIVER: …"). Prospective BLOCKED→IN_PROGRESS; all history
and ledger Xu Chu 16/global 183 (`3a7c4545…`, ceilings 22/189) preserved.
Focused-fix spares 5–8 measured first (`07-charge/focused-fix/waiver-bank/
build.mjs`, ONE sheet scale 1.3540, max deterministic retouch, rerun
byte-identical; keeps 0–4 final hashes reproduced exactly): spare5 dash
163.88→160.66u FAIL (avail 12 vs 102px), spare6 stride 179.72→176.26u FAIL
(13 vs 163px), spare7 brake 157.18→150.42u FAIL (26 vs 76px), spare8 guard
148.85u FAIL (0 vs 44px). No spare passes role+length for cell3/cell4 → the
exact waived final cells are used. Re-verification of final cells0–4 (all
final+marked cells, tip-4x, sequence contact personally opened):
identity/anatomy/pose-role/sequence/seams/corridor/direction (steps
≤9.14°)/body/ground (≤0.52u) PASS; head RAW for batch-end ruling.

**Banked as charge accepted cells** (`07-charge/focused-fix/waiver-bank/
accepted/`, source sheet `4791a19e…`): cell0-guard `3f33dc31…` 137.25u PASS;
cell1-crouch-coil-windup `452dc8e9…` 133.67u PASS; cell2-launch `e11525d4…`
131.35u PASS; **cell3-crushing-dash `a0aec6aaacaa9f871c41d0ad0971d56aae9e28d20d440f2482fa3e6453874b69` 146.04u OUT_HIGH +8.54u — FAIL retained, NOT
PASS, waived for this exact hash only; cell4-brake `3c864aa12b4de8d157013d7431b0aaeaceb51d377c4724f3c94812de8369a374` 118.70u OUT_LOW −5.71u — FAIL
retained, NOT PASS, waived for this exact hash only**; resulting weapon
spread 20.49% NOT PASS, waived as resulting spread. No blanket/transferred
waiver. Combo remains unbanked; CMR-15A IN_PROGRESS, not DONE; no pack/15B.
Evidence: `07-charge/focused-fix/waiver-bank/gate.json` + `measure.json`.

## PHASE-3 CONTINUATION (owner grant, 2026-10-13; work cmr15a-combo-focused-fix-generate)

Grant recorded verbatim in TASKS.md CMR-15A (owner, 2026-10-13, "CMR-15A
PHASE-3 CONTINUATION: …"). **Prospective accounting only:** the new
post-salvage consecutive-unusable count starts at **0** (a banked sheet
resets it to 0; STOP again at 2 consecutive or before exceeding the
ceilings); the historical STOP (charge focused-fix #1 + combo #2) and all
prior failures/sources/counts above are preserved unchanged and never
erased. **Ceilings raised to Xu Chu 25 total / global 192 maximum**
(nominal recorded base unchanged: Xu Chu cap 12, global cap 200) to fund
one focused fix per remaining sheet. First step under this grant: combo's
one unspent focused fix, reserve-before-call **Xu Chu 16→17 / combo 1→2 /
global 183→184**, briefed on the measured combo gate failures
(`08-combo/gate/gate.json`: after max retouch cell0 173.91u, cell1
179.89u, cell3 191.16u, cell4 171.37u OUT_HIGH vs band [124.41,137.50]u;
cell2 butt cap not visible + tip clipped at registered top edge) — shorten
every glaive into [124.41,137.50]u at 459-body scale (registered
479–529px; sheet-native 321–355px target ~338px at the combo registration
scale 1.4903), poses/identity/layout frozen, cell2 butt cap fully visible
and tip inside frame; deterministic retouch then full re-gate in a later
package (only fully measurable cells with small residual length deviation
may be held for batch-end exact-hash waiver — a still-clipped/unmeasurable
cell2 fails the sheet, no waiver). Then heavy, misc, fall, getup in order,
one 3×3 sheet each + retouch before ≤1 focused fix per sheet; offline pack
only after all sources pass or receive the exact rulings already
authorized; do not mark CMR-15A DONE or start CMR-15B in this grant.

## Heavy sheet gate (2026-10-13; work cmr15a-phase3-heavy-gates, correction of timed-out call_01a133d3af8973d192ff7659bb00a954, zero generation)

**FAIL — NOT BANKED (2/5 keeps pass, no accepted cells); prospective post-salvage unusable #2 consecutive = STOP; CMR-15A BLOCKED WAITING_FOR_OWNER.** Sheet `37b72517…` (reserve `6dc3b7e`, candidate `aa3e438`, Xu Chu 18/global 185) hash-reverified; partial `09-heavy/gate/build.mjs` rerun reproduced `measure.json` byte-identically (`5a284768…`); stale combo-copy `gate-verdict.mjs` replaced with a heavy verdict (rerun twice identical, `gate.json` `fa546458…`). All 9 cells component-extracted, registered at ONE sheet scale 1.5249 (cell4-recover 301→459px, groundY500, 1024×768); deterministic shaft retouch assessed before any length verdict; sheet, keeps/spares contacts and marked cells personally opened. PASS: cell0-raise 129.07u, cell1-overhead-hold 130.47u; spare5-overhead-a 133.95u (duplicates the passing overhead beat). FAIL vs frozen band [124.41,137.50]u: **cell2-crushing-chop `6c59ba43…` and cell3-follow-through `9d7a0c02…` — butt cap not drawn, haft ends at the hands (stubs 92.10/86.68u, OUT_LOW ≥32.31/37.73u; retouch cannot lengthen, nothing fabricated)**; **cell4-recover `13ef7ecf…` 155.56u OUT_HIGH +18.06u** (retouch avail 0 vs 70px to band-hi: butt haft across skirt width 62–72px per `probe-butt-run.py`, blade run t402–406 socket 406.94). Spares 6/7/8 same stub defect (97.14/82.43/97.16u) → no coherent in-band set. Identity/anatomy/pose-role/seams (greenPx=0, no edge alpha)/body-ground (≤0.52u) PASS; shaft-axis direction steps 8.30/39.43/2.08/51.06° ≤60 PASS (directed 188° step is the overhead blade-flip artifact); spread 57.99% reported not PASS; head RAW. **0 waiver-eligible cells** (stubs not fully measurable; +18.06u not small). Ledger unchanged `adbadcd5…` Xu Chu 18 (heavy 1)/global 185, ceilings 25/192. Heavy focused-fix allowance, misc/fall/getup and pack do NOT auto-continue past STOP — owner decision only. Evidence: `09-heavy/gate/gate.json` + `measure.json`.

## PROCESS CORRECTION + COMBO WAIVER-BANK + HEAVY FIX (owner grant, 2026-10-13; work cmr15a-combo-waiver-bank, zero generation, combo part only)

Grant recorded verbatim in TASKS.md CMR-15A (owner, 2026-10-13, "CMR-15A PROCESS CORRECTION + COMBO WAIVER-BANK + HEAVY FIX: …"). CMR-15A reset BLOCKED→IN_PROGRESS prospectively; all history above (including the heavy-gate STOP record), ledger Xu Chu 18/global 185 (`adbadcd5…`) and ceilings 25/192 are preserved.

### Process rules (prospective; NOT waivers — supersede earlier counting/STOP wording)

- A sheet counts **post-salvage unusable only after deterministic salvage AND its one authorized focused fix are both exhausted** — an initial-sheet FAIL with its fix unspent never increments the count and never STOPs.
- A banked sheet resets the consecutive count to **0**; **STOP at 2 consecutive post-fix unusable** sheets or before exceeding 25/192.
- Passing cells may bank **per-cell across a sheet and its fix** (Li Dian splice method — the best passing cell per beat); all visual gates unchanged.
- Retroactively under this definition the prospective count was **1** (combo focused-fix — salvage + fix both spent); **heavy not counted** (its focused fix unspent; the prior "#2 = STOP" accounting above is superseded prospectively, history preserved).

### Combo waiver-bank result (this package)

**COMBO BANKED cells0–4.** Re-verification (`08-combo/focused-fix/waiver-bank/reverify.mjs`, rerun twice byte-identical, `gate.json` `ecda4849…`): fresh SHA-256 of all five focused-fix final cells matches the gate exactly; fresh raster spot checks reproduce measure bounds, greenPx=0, no canvas-edge alpha, soles at ground (groundErr ≤0.52u); non-waived gates PASS per the focused-fix gate (identity/anatomy/pose-role/seams/scale-ground; direction steps ≤38.41°; sequence windup→rising-cut→follow-through→sweep→recover re-opened on the keeps contact); head RAW. Banked `08-combo/focused-fix/waiver-bank/accepted/`: cell0-windup `38e98790…` 135.40u PASS · **cell1-rising-cut `df6196ff6cc638f6f8319ad18803a03ad7ab1ee82565545fc6d898d05e08a3e9` 140.96u OUT_HIGH +3.46u FAIL NOT PASS — waived exact hash only** · cell2-follow-through `8aa01ca2…` 130.49u PASS · **cell3-sweep `18c68a0075163b7245a272413eca488be3a0ee6b2fc30dcfa0a7b2120bdbbda3` 143.48u OUT_HIGH +5.98u FAIL NOT PASS — waived exact hash only** · cell4-recover `3f6a773d…` 130.71u PASS (sheet `e3161283…`, frozen band [124.41,137.50]u); **resulting spread 9.54% NOT PASS, waived** for this exact set. **Prospective post-salvage count → 0.** No heavy work in this package.

### Next under this grant (later packages)

HEAVY: reserve-before-call ONE focused sheet edit (Xu Chu 18→19/global 185→186) changing only cells2/3 (draw complete butt caps, full 479–529px registered length, caps in empty margin) and cell4 (shorten into band); cells0/1 and all poses/identity frozen; deterministic retouch then full re-gate; bank the best passing cell per beat across original+fix; no waiver for the stub cells or cell4's +18.06u original. Then misc, fall, getup in order — one 3×3 sheet + retouch + ≤1 focused fix each under the same counting rule. Offline pack only when all sources pass or receive the exact rulings above, then independent review; do not mark CMR-15A DONE or start CMR-15B.

## Heavy focused-fix gate + candidate-wise selection (2026-10-13, cmr15a-heavy-focused-fix-gates)

**FAIL — NOT BANKED (no accepted cells); heavy = post-fix unusable #1 (prospective count 0→1, STOP at 2 NOT reached).** Fix sheet `593ea8e4…` (reserve `819e4a2`, candidate `b611b09`) hash-reverified; 9 cells at ONE scale 1.5049 (cell4 305→459px); retouch first; build byte-identical (`measure.json` `32da88d4…`), verdict byte-identical (`gate.json` `51074b23…`, re-verified in the correction package). Best passing source per beat (original `37b72517…` + fix): cell0/cell1 **originals PASS retained as candidates only** (`7b416cd6…` 129.07u / `26270b4c…` 130.47u); cell2 none — original 92.10u stub, fix cap drawn but 167.02→163.30u (+25.80u, avail 14 vs 114px, NOT waiver-eligible); cell3 none — stubs on both sheets (86.68u / fix 97.74u, no cap drawn again, no waiver); cell4 none — original 155.56u +18.06u (no waiver), fix `57190b6f0d3e7b26b868ecb4e6d89a3ca6dad4b399e3db7104adcfb1861ae9a8` 145.22u **+7.72u FAIL retained, WAIVER_ELIGIBLE exact hash only, NOT banked**. Spares: overhead spare5 passes (fix 132.74u) but duplicates cell1; 6/7/8 stubs both sheets. Identity/anatomy/pose-role/seams/ground/mixed shaft-axis direction (≤42.73°) PASS, mixed spread 49.23% not PASS, head RAW. Ledger `c52a6eaf…` Xu Chu 19 (heavy 2)/global 186, ceilings 25/192. Evidence: `09-heavy/focused-fix/gate/gate.json` + `measure.json`. Next per grant: misc, fall, getup; a second consecutive post-fix unusable STOPs.

## Misc initial sheet gate (2026-10-13, cmr15a-phase3-misc-gates)

**FAIL — NOT BANKED (2/5 keeps pass, no accepted cells); initial-sheet failure does NOT increment the consecutive post-fix unusable count (stays #1 heavy); misc focused fix UNSPENT.** Sheet `6c3b5e5c…` (reserve `9e16e8b`, candidate `889f794`) hash-reverified; correction package reused hash-verified partial gate artifacts, reran `build.mjs` byte-identical (`measure.json` `27c78514…`) and `gate-verdict.mjs` (`gate.json` `8ecec2bf…`). All 9 cells component-extracted, registered at ONE sheet scale 1.3661 (cell4-release 336→459px, groundY500); deterministic shaft/pommel retouch applied BEFORE any length verdict (changedOutside=0 everywhere). PASS keeps: cell0-hurt-recoil 160.76→137.10u (91px retouch), cell1-hurt-fold 152.53→132.34u (78px) — candidates only, not banked. FAIL vs band [124.41,137.50]u: **cell2-held-clamp `49f4ccf7…` 141.63u +4.13u** (avail 8 vs 25px) **AND corridor/grip FAIL** (haft hidden behind crossed arms/torso, clasped hands do not grip the haft); **cell3-held-struggle `83e96546…` 153.22u +15.72u** (40px blade-side applied, deficit 61px); **cell4-release `cfea0675…` 159.27u +21.77u** (avail 0 vs 84px — haft across skirt/arm silhouette). Spares: cell5 137.52u (+0.02u integer-shift residual; waiver-sized but only alternates the passing cell0 beat — no waiver requested), cell6/7/8 +21.74/+26.30/+17.11u → no role-fit passing substitution, no coherent in-band 5-cell set. Identity/anatomy/pose-role/seams (greenPx=0, no edge alpha)/ground (≤0.52u)/direction steps 30.22/21.05/2.38/5.12° ≤60 PASS; keep spread 18.61% reported not PASS; head RAW. **0 waiver-eligible keeps.** All 9 butt caps drawn (every cell fully measurable). Ledger unchanged `f54e26ee…` Xu Chu 20 (misc 1)/global 187, ceilings 25/192; zero generation. Focused-fix brief in `gate.json`: redraw only cells 2/3/4 ~15% shorter, cell2 haft gripped visibly in front, no reliance on post retouch. Only a post-fix unusable misc would become #2 = STOP. Evidence: `10-misc/gate/gate.json` + `measure.json`.

## Misc focused-fix gate + candidate-wise selection (2026-10-13, cmr15a-misc-focused-fix-gates)

**MISC BANKED — coherent 5-cell set (original cells0/1 + focused-fix cells2/3/4), 0 waivers; consecutive post-fix unusable count resets #1 (heavy) → 0, no STOP.** Fix sheet `a5a6471c…` (reserve `e272c9e`, candidate `f08d4ba`, Xu Chu 21/global 188) hash-reverified; correction reused hash-verified partial artifacts, `build.mjs` rerun byte-identical (`measure.json` `08f2910f…`), stale original-copy verdict replaced (rerun twice identical, `gate.json` `2b5421ff…`); original cells0/1 hashes re-verified. Fix alone: cell0 138.28u +0.78u WAIVER_ELIGIBLE `487765fc…` held not selected, cell1 131.90u PASS, cells2/3/4 127.68/136.68/133.01u PASS (cell2 corridor/grip cured — haft gripped in front, personally confirmed on marked cell); fix spares all FAIL. Banked `10-misc/focused-fix/gate/accepted/`: `3cb8c83c…` 137.10u, `a454f232…` 132.34u, `19e1496b…` 127.68u, `e6348490…` 136.68u, `40400f92…` 133.01u; direction 30.22/24.01/3.37/3.05° PASS, spread 7.06%, identity/anatomy/roles/seams/ground PASS, head RAW. Ledger `16fc50a7…` Xu Chu 21 (misc 2)/global 188, ceilings 25/192; zero generation. Next per grant: fall, getup.
