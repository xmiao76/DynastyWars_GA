# Wei Yan authoring plan (CMR-11A, v1 short-saber plan SUPERSEDED)

Weapon instructions and the 16-request budget below belong to the
superseded v1 attempt. The owner authorized option A on 2026-10-04;
for all subsequent requests use [AUTHORING-PLAN-V2.md](AUTHORING-PLAN-V2.md)
with the corrected long-handled dao and durable 26-request Wei Yan
cap. Keep this v1 record for provenance, not as an active prompt.

## Sequences (10 sheets, 3x3 1536x1024, play-order keep maps)

Same layout as the zhaoyun pack (proven): walk (guard + 8-cycle),
jab1 (wy.jab1 dao slash 9/5/14), jab2 (wy.jab2 sweep 9/5/14),
finisher (wy.finisher chop 13/6/18), jump (takeoff/ascent/apex/
kick/descent/landing), fall (topple/airborne/tumble/impact/DOWN),
getup (elbow/kneel/crouch/half-rise/stand), misc (hurt-recoil/
hurt-fold/grab-clamp/grab-hold/release), special (wy.special),
rider (idle/trot/mount/windup/sweep/dismount, seated, no horse
parts). Keep maps finalize at prepare time (non-row-major remaps
allowed with spare-sub rules as in 10A).

## Budget and rules (all 09A/10A learnings baked in)

- 16 requests (10 sheets + spares + focused); 2 candidates max per
  sequence; reserve BEFORE every call; repair reserve 3/3 separate
  (shared with 11B).
- Bracketing refs on every call (body + portrait masters +
  pose/length anchors); walk-guard cell as the length anchor once
  it exists (it held the 10A rider sheet).
- Length contract + split rule + no-vertical rule (dao-adapted to
  ~50° - see IDENTITY.md) + turban/headroom (the tail flows, keep
  it inside gutters) + defined fingers + no text/grid/effects.
- Grid-constrained redraws ONLY (the free-form 10A redraw came back
  oversized and was rejected; the grid retry worked).
- Rejects stay honest: drift/extra limbs/forks/clipping fail the
  sheet; no second attempts beyond the per-sequence cap.

## Fit strategy (16MB first - the 10A path in reverse)

- The dao (~58u, ~380px raw) is much shorter than spear/pike, so
  trims run smaller: SOLVE AGAINST THE 16MB CONTRACT FIRST with
  page-aware solving (trim target cap/1.28 measured slack, then
  packed pages verified, step-down on miss - the 10A machinery).
- Base target ~0.70 (guard ~226px hero band) in the SAME 260x144/
  groundY-136 registration frame (directly comparable fit math).
- Escalate to owner options (exception/cuts) ONLY with a proven
  contradiction (measured bounds, like 10A's BLOCKED turn) - never
  by assumption. No exception is presumed.
- Factors: two-proxy guard evidence per sheet when measured;
  factor 1 UNVERIFIED until then; nothing invented.

## Known accepted limitations (carried, not re-litigated)

- Ghost slivers: kept<->kept straddles WILL ghost in atlas trims
  (shared pipeline defect, filed for producer triage in 10A).
  Brief WIDE gutters to minimize (the short dao straddles less
  than spears, so expect fewer than 10A's 14/56). Ship with
  disclosure at the demonstrated bar; no fighter-local masking
  (proven ineffective - see 10A PROVENANCE.md).
- Face clusters: the turban (like helmets/plumes) defeats the skin
  gate - expect the auto head method to need the same consistency-
  evidence treatment as 10A (figures + visual uniformity).
- RANSAC shaft fits misfire on occluded/diagonal blades: TRUE
  endpoint lengths (fitting-to-fitting direct) are the diagnostic
  truth for acceptance-4, as in 10A R1.
