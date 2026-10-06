# Xiahou Dun provenance (CMR-14A)

- Authoring: 1/12 used (1/7 ACCEPTED — walk closed via
  sheet + 9 free retouches, 0.25% PASS). Global 127/200;
  walk 1/2 left. Repair reserve 3/3 untouched.
  Projection: band FIXED from walk median (424.9) →
  [404.2,446.7]; walk recorded, OK (0.26%, N=9).
- Masters (inspected 2026-10-06, before any request): body
  `a57630a2…`, portrait `01bb7271…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (spear 72u/haft 4.6/leaf/tassel — never the `sword.*`
  attack-id names).

## Attempt log

### Request 1/12 — walk 3x3 sheet candidate 1/2: DESIGN PASS, uniform overshoot → 9 free retouches → 0.25% PASS → ACCEPTED 2026-10-06

- Reserve-before-call: `reserve(..., sheet/walk)` → used 1,
  remaining 11, total 127 (guard: expected 0/12 — slot
  auto-created — held).
- Exact prompt: `walk-prompt.txt` (guard + genuine 8-cycle;
  anti-foreshorten + no-vertical with the 341px-height
  reason + 410–430px brief + 35px+ margins; single spear
  + leaf + tassel; band/beard/missing-eye/magenta
  identity). Ordered refs: body `a57630a2`, portrait
  `01bb7271` (both read_image'd before authoring).
- Output: `walk-candidate-1.png` sha `68a7de2b…` (1535×1024
  — provider 1px narrow; grid math unaffected).
  Mechanical: 9/9, 0 edge. Design: genuine 8-cycle +
  guard, all distinct; identity clean (headbands, beards,
  blind eyes, magenta); single spears + leaf heads +
  tassels; no extras. Poses ACCEPTED.
- Length (overlay-verified, all 18 markers on material):
  [528.2,504.4,468.3,489.6,511.2,471.0,505.7,484.8,444.1],
  spread 17.17% FAIL — uniform overshoot (brief said
  410–430, provider drew 444–528).
- Retouch (`scripts/retouch-xiahoudun-walk.mjs`, committed,
  9 pommel shortens −103/−79/−43/−65/−86/−46/−81/−60/−19):
  achieved-vs-predicted ±0.1px all; all 9 before/after
  pairs clean; speck scan matches candidate's 2
  pre-existing exactly (zero new fragments). Final
  `walk-prepared-source.png` sha `b395c867`.
- Verify (final overlay, all 18 on material): keep-set
  [425.5,425.3,425.3,424.4,424.9,425.1,424.4,424.7,424.7],
  spread **0.25% PASS**; undirected axes max step 2.3°
  PASS; heads overlay-landmark (headband-top to beard-
  bottom, all 9 upright): [65,70,70,70,70,70,70,70,70],
  7.2% PASS (c0's chin tucks slightly in guard).
- Projection: band FIXED from walk median (424.9) →
  [404.16,446.70]; walk recorded (scale 1): OK (0.26%,
  N=9); steering window [404.2,446.7] for all later
  sheets. Band never moves without owner re-brief.
- Verdict: walk source ACCEPTED (1 request + free retouch).
  1/7 sequences done. Anchor established.

### Setup (no image calls) 2026-10-06

- Read at implementation time: enemies.ts xiahoudun (hp 210,
  speed 1.2, hitstun 12, think 22, enrage 0.35, charge/
  combo/heavy bindings), attacks.ts (charge.dash.long
  8/26/18; sword.combo 9/4/12; sword.heavy 16/6/24),
  figures.ts xiahoudun plan (magenta 0x5e2247, band,
  spear, BOSS, full beard, fierce, one-eyed — matches
  masters), CMR-14A spec + shared contract.
- Wrote IDENTITY.md (lock), AUTHORING-PLAN.md (7-sheet
  plan + 13A procedure), this log. Budget verified:
  xiahoudun slot auto-creates on first reserve (0/12),
  repair 3/3, global 126/200.
- Next: walk anchor sheet 1/2 (reserve first; brief
  410–430px inside the sheet; fix band from median).
