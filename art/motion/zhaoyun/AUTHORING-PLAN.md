# Zhao Yun motion pack — authoring plan (CMR-10A)

Follows the Zhang Fei proven layout (56 frames, 10 sequences) with the
hard lessons baked in. Every image request cites IDENTITY.md + both
masters as bracketing references (body + portrait on EVERY call - the
bracketing that defeated drift and shortening bias in 09A).

## Format (all sheets)

- 1536x1024 PNG, 3x3 grid, 512x341 cells, transparent background,
  painted semi-realism, upper-left key light, side view, feet on the
  ground line. Same figure scale in all 9 cells.
- THE LENGTH CONTRACT in every brief, verbatim in spirit: the 72-unit
  spear is rigid and NEVER shortens to fit a cell; when long it angles
  diagonally and may cross nominal cell lines into EMPTY space, never
  touching a neighboring drawing or the sheet border (sheet-edge touch
  fails the pipeline gate outright). SPLIT RULE (getup lesson): the
  gutter/separation rule applies to FIGURES (bodies must not touch
  across cell lines - merged components are unusable); SPEARS keep
  the straddle allowance (a full-length spear that fits only by
  straddling MUST straddle, never shorten - the getup-2 brief's
  no-straddle overcorrection produced two short vertical spears and
  is not repeated).
- Helmet + plume need headroom: keep ~30px clear above the headband
  line in every cell (the content cap punishes tall drawings).
- Defined fingers on both hands; gold butt cap + collar + leaf blade
  + red tassel on every spear; no text/grid/effects/panels.

## Sequences (brief order; ~1 request each, 2 candidates max per seq)

1. **walk** (9: guard + 8-cycle): guard standing alert, spear low;
   genuine alternating strides (contact/pass/stride/crossing/
   double-stance/kick-back, no identical copies). THE foundation:
   guard is the clip bookend and the cross-pack ruler.
2. **jab1** (5: windup/drive/extension/follow/recover): fastest
   combo opener (5/3/8 core), high coil into a straight thrust.
3. **jab2** (5: chamber-low/drive/extension/follow/recover): distinct
   low hip chamber, same snap.
4. **finisher** (5: coil/launch/bridge/impact/follow): heavy sweep
   (7/4/13 core); the pike-length lesson applies - the sweep arc
   must read WITHOUT shortening the spear (bridge cell authored).
5. **jump** (6: takeoff/ascent/apex/kick/descent/landing): takeoff
   crouch, tucked rise, apex tall, kick money pose (leg extended,
   pike... spear swept back), descent fold, landing crouch.
6. **fall** (5: topple/airborne/tumble/impact/DOWN): DOWN flat on
   back, eyes closed, spear gripped - the shared down bookend.
7. **getup** (5: elbow/kneel/crouch/half-rise/stand): rise arc from
   DOWN to guard.
8. **misc** (5: hurt-recoil/hurt-fold/grab-clamp/grab-hold/release):
   the fold doubles as the grabbed pose; no second figure drawn.
9. **special** (5: raise/coil/pre-spin/strike/follow): whirlwind
   sweep; the sweep IS the special (no projectiles/glow).
10. **rider** (6: idle/trot/mount/sweep/sweep-windup/dismount +
    culled spares): seated straddle + upright carried spear; NO
    horse/saddle drawn (CMR-22 composes). THE rider lesson: the
    generator shortens weapons to fit 341px cells - the rider brief
    pins full-length carries with the length contract + the walk
    guard cell as the length anchor.

## Budget (16 shared across 10A/10B; repair reserve separate)

- 10 sequences x ~1 request = ~10-11 planned; 5-6 held for targeted
  fixes/seconds. Reserve BEFORE every call
  (`scripts/motion-budget.mjs`); record prompt + ordered reference
  hashes + verdict in PROVENANCE.md. Never a third candidate for one
  sequence; fix by targeted edit or accept-and-repair-rounds.
- Acceptance-4 repair reserve (3 rounds, separate cap): only for
  diagnosed source-art defects after a failed acceptance 4, per the
  recovery protocol. Never polish.

## Page-aware fit (the CMR-09B lesson)

- The pipeline budget gate counts FULL PAGE pixels (the runtime
  metric), not trims: 56 zhangfei-sized trims pack to ~21.4 MB pages.
  The zhaoyun prepare script solves the base against PACKED PAGES
  (verify + step down + re-pack until pages fit), not the trim sum.
- Layout target: 56 frames in 2 pages ≤2048² totaling ≤16 MiB
  decoded, walk guard ≥224px (above the mook 223). If the solver
  cannot hold both, it reports BLOCKED input (pose-count cut like
  09A option (c)) rather than silently shrinking the hero.

## Review gates (before requesting more)

- Mechanical per sheet: 9 clean components + halo-only residue within
  tolerance, 0 specks, 0 sheet-edge pixels, transparent share sane,
  identity/anatomy checklist, length-contract spot lengths.
- Visual at gameplay size + 4x: neighboring poses cohere, cape
  behaves, helmet/plume clear, fingers defined, single shafts.
- Reject drift/extra limbs/forks/clipping outright; cull bad cells in
  memory (originals untouched) when the sheet is otherwise good.
