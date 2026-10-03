# Zhao Yun motion pack — provenance (CMR-10A)

Every image request: reserved BEFORE the call, prompt + ordered
reference hashes + verdict recorded here. Budget: 16 shared across
10A/10B; repair reserve (3 rounds) separate, only for diagnosed
source-art defects after a failed acceptance 4.

## Attempts

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

- Authoring: 1/16 used (walk c1 accepted). 15 spare.
- Repair reserve: 3/3 untouched. Shared with CMR-10B.
