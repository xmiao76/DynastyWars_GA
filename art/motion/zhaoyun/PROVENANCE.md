# Zhao Yun motion pack — provenance (CMR-10A)

Every image request: reserved BEFORE the call, prompt + ordered
reference hashes + verdict recorded here. Budget: 16 shared across
10A/10B; repair reserve (3 rounds) separate, only for diagnosed
source-art defects after a failed acceptance 4.

## Attempts

### jab2-candidate-1 (ACCEPTED 2026-10-03) — sha `3dc80660…`

- Request 3/16 (jab2 sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 low second
  hit per AUTHORING-PLAN (cells 1-5 = chamber-low/drive/extension/
  follow/recover with the LOW chamber differentiator; 0/6/7/8
  spares) + identity lock + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 31.6%; sheet-edge 0px;
  18 components @96 -> 9 survivors after cleanup (glow 102426,
  specks 12px, within tolerance); gate green.
- Length spot-check: the quick RANSAC tool misfit cells 2/3
  (279 @ -66deg, 302 @ -32deg - steep-axis lock onto the diagonal
  lunge + fragmented shaft mask). Full-bbox crops PROVE both spears
  whole (butt cap + leaf blade + tassel, straddling cleanly with no
  merges: bboxes 627/605px vs 512 cells). All 9 spears visually
  full-length; no shortened cells. Lesson recorded: the quick tool
  is a gross-shortening screen only - occluded/diagonal poses need
  the bbox check or the full adjudicator.
- Visual (gameplay + 2x zooms cells 1/2/3 + bbox crops 2/3): low
  chamber reads DISTINCT from jab1's high coil; drive/extension arc
  genuine; identity locked; wrapped fingers; single shafts; uniform
  heads; cape behind; no clipping, drift, extra limbs, forks,
  panels, or text.
- Keep/cull (provisional, finalized at prepare): keep cells 1-5,
  cull 0/6/7/8 in memory.

### jab1-candidate-1 (ACCEPTED 2026-10-03) — sha `e90fb80b…`

- Request 2/16 (jab1 sheet 1/2). Refs in order: body master
  `a1067c2a`, portrait master `dff59167`. Prompt: 3x3 combo opener
  per AUTHORING-PLAN (cells 1-5 = windup/drive/extension/follow/
  recover; 0/6/7/8 alternate takes as cull spares) + identity lock
  + length contract + cape rule.
- Mechanical: 1536x1024; opaque≥96 share 29.9%; sheet-edge 0px;
  28 components @96 -> 9 survivors after cleanup (glow 104129,
  specks 34px, within tolerance); gate green.
- Length spot-check (same RANSAC method): tip-to-butt 382-560 raw.
  The wide spread is METHOD noise, not drawn variance: the low-
  inlier cells (106-155 vs 157-262 elsewhere) are arm-occluded
  thrusts where the shaft mask fragments, and angled poses project
  shorter in 2D. Visually all 9 spears span full length (no
  09A-style shortened outliers). Rigorous endpoint-adjudicated
  measurement lands after all 10 sheets, per the plan.
- Visual (gameplay + 2x zooms cells 1/2/3): thrust arc reads
  coil -> drive -> full extension; identity locked (helmet/plume,
  fair beardless face, silver armor, blue robe + red sash, cape
  behind, boots); wrapped fingers, single shafts with leaf blade +
  gold collar/butt + red tassel; uniform heads; no clipping,
  drift, extra limbs, forks, panels, or text.
- Keep/cull (provisional, finalized at prepare): keep cells 1-5,
  cull 0/6/7/8 in memory.

### walk-candidate-1 (ACCEPTED 2026-10-03) — sha `ee9cc74d…`

- Request 1/16 (walk sheet 1/2). Refs in order: body master
  `a1067c2a` (jpg 720x1280), portrait master `dff59167` (png
  1145x1374). Prompt: 3x3 guard + 8-cycle per AUTHORING-PLAN (identity
  lock, 72-unit rigid spear with the length contract, cape rule,
  helmet headroom, transparent bg).
- Mechanical: 1536x1024; opaque≥96 share 26.6%; sheet-edge 0px;
  20 components @96 -> 9 survivors after cleanup (glow 103103,
  specks 17px, within the 150000 tolerance); gate green.
- Length spot-check (tip-to-butt RANSAC + both-end extension, same
  method as zhangfei): 430-474 raw across 9 cells (9.7% spread,
  axes -5..-15deg, inliers 163-204) - no shortened outliers; the
  length contract holds on sheet 1.
- Visual (gameplay + 2x zooms cells 0/4/8): identity locked in all
  cells (helmet + red plume, fair beardless bold face, silver
  armor, blue robe + red sash, cape behind, boots); genuine
  alternating strides (guard/stride/kick-back all distinct); hands
  wrap with defined fingers; single spear shafts with leaf blade +
  gold collar/butt + red tassel; uniform head size; no clipping,
  drift, extra limbs, forks, panels, or text.
- Note: the preview composite shows a dark backdrop, but pixel
  measurement proves it is sub-96 haze (stripped by cleanup) over
  transparency - file verified, not eyeballed.

## Budgets

- Authoring: 3/16 used (walk + jab1 + jab2 c1 accepted). 13 spare.
- Repair reserve: 3/3 untouched. Shared with CMR-10B.
