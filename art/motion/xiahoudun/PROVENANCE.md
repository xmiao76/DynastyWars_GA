# Xiahou Dun provenance (CMR-14A)

- Task BLOCKED — owner authorized one independent review THEN reset;
  reviewer executions failed without verdict, so review pending/reset
  not applied. Authoring2/12/global128/200, 1/7 accepted; head metric
  UNVERIFIED, weapon source unchanged; repair round1 spent, 2/3 left.
- Weapon override `b547809c…`: five keep lengths [412.6,434.4,437.2,
  438.4,428.9], spread6.01%, direction19.5°; hypothetical walk+charge
  6.06% OK. Fixed band [404.16,446.70] unchanged; projection is still
  walk-only because charge head-size acceptance is UNVERIFIED.
- Masters (inspected 2026-10-06, before any request): body
  `a57630a2…`, portrait `01bb7271…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (spear 72u/haft 4.6/leaf/tassel — never the `sword.*`
  attack-id names).

## Attempt log

### Direct owner authorization — independent review then reset, execution failed before verdict

- Owner explicitly selected: `do " use one independent visual review to
  resolve the head uncertainty, then explicitly reset the task"`.
  No consumer/image attempt; old owner-decision blocker superseded.
- Read-only reviewers `41931e03` (flagship/max), `6a5bed32`
  (flagship/xhigh retry), `7fa6ad09` (configured-default fallback)
  all ended before closing message. No verdict/observations reported;
  exact provider failure cause unknown. Parent self-check is NOT an
  independent review; no acceptance or TODO reset falsely recorded.
- Head pairs regenerated and all5 hashes match historical record.
  New source-hash-pinned offline full-body/ordered-transition fixture
  at ONE provisional0.66 raw->art scale, density2. Exact component
  pixels, no silhouette normalization; belt/ground composition only,
  not finalized registration/gameplay-size or native-video evidence.
- [Review handoff](INDEPENDENT-REVIEW.md) and [state](independent-review.json)
  persist conditional reset authorization and source hashes. Current
  blocker is functioning independent reviewer/verdict, not missing
  owner instruction. No new generation, thresholds, source/budget/
  projection/runtime/scheduler changes. Historical BLOCKED diagnosis
  below remains intact. Next: complete review, THEN reset as authorized.

### Third charge diagnostic — fixed-scale head comparison; BLOCKED 2026-10-06

- Zero image requests/source edits. New diagnostic script hash-pins
  walk `b395c867` and charge override `b547809c`; crops112×144 at4x,
  no normalization, source-coordinate grids, eye anchors for view
  positioning ONLY. Viewed pairs0..4 (all ten drawings) fresh.
- Beard hides anatomical chin in both sequences. Neck, headband,
  tied hair and beard contour vary with posing; apparent head drift
  remains unquantified. No opaque/color/face-feature/headband/beard
  proxy substituted for full-head crown/chin. Unknown stays unknown.
- Detailed image observations and independent/owner-review choices:
  [HEAD-DIAGNOSIS.md](HEAD-DIAGNOSIS.md); pinned crop/source hashes:
  [head-diagnosis.json](head-diagnosis.json). Earlier7.2% walk-only
  silhouette claim is not evidence for charge cross-sheet compliance.
- Third consecutive unresolved charge outcome after `57f3d4d` and
  `b28d591`: CMR-14A BLOCKED under rule5. Image funds unchanged but
  do not authorize a fourth consumer retry. Owner must choose a
  trustworthy landmark/redraw route or explicitly judge/accept the
  disclosed head-size limitation, then reset task to TODO.
- Sources, budgets, fixed projection and runtime unchanged; no new
  sequence, no independent verification/native-video acceptance claim.

### Repair reserve round1 — charge:0/3/4 weapon repair salvaged; sheet HELD on head gate (2026-10-06)

- Persisted round1 reservation BEFORE one image call; refs in order:
  candidate `0afda71c…`, body `a57630a2…`, portrait `01bb7271…`.
  Exact prompt: [charge-repair-1-prompt.txt](charge-repair-1-prompt.txt).
  No authoring debit; budgets remain 2/12 and global128/200.
- Raw output [charge-repair-1.png](charge-repair-1.png), SHA
  `4c578feefc6045fe3e80e93f349b9ce305aa06c64e1139c50f790aefbb037c82`.
  Same 1536×1024, 9 figures, no outer-edge contact; source re-renders
  other cells too, so only NAMED 0/3/4 are selected. Intact hands,
  connected wrists/forearms, spear/leaf/tassel and original pose family
  seen in 2x full-cell and 4x hand pairs.
- Raw named lengths 372.4/438.4/428.9: c0 undershot, others in-band.
  Free c0 extension uses a now-clear corridor: shift(-40,+4), t0=42,
  band9, shaft offsets[-5,6], slab[33,49]. A first band13 trial moved
  14 cloth-fringe pixels and was REJECTED; band9 pair retains cloth,
  hands, robe and shaft join. Protected RGBA, off-corridor immutability,
  unchanged specks and ±1px achieved gates enforce the fix. Final
  predicted412.5596 / achieved412.5592 (620 moved,442 filled).
- Deterministic source builder `prepare-xiahoudun-charge-repair.mjs`
  selects repaired0/3/4, all other components from `dedac2b1` safe
  partial. Six retained drawings (including cells1/2) preserve exact
  component RGBA after alpha-only cleanup; no scaling or gridbox crop.
  [charge-repair-1-spliced-source.png](charge-repair-1-spliced-source.png)
  SHA `b547809c352dd7b8828d20452c0e7f216caede83b1c143374a704a5d301014e4`.
  9 separated figures, 0 edge, 0 detached specks.
- Final whole-material endpoint overlay: [412.5724,434.4422,437.2196,
  438.4199,428.9452], weapon spread6.01%, direction max19.53°. Diagnostic
  walk+charge projection OK6.06%, N14. NOT recorded in projection:
  sheet acceptance still fails to establish comparable head size.
- Head review: charge0..4 and walk0..2 opened at fixed4x. Possible
  visible scale drift against walk. Crown-to-beard silhouette probes
  are NOT crown/chin: beard occludes chin; several trial points were
  off ink or on robe. ALL trial head numbers invalidated, no PASS.
  No head rescale or second image request made. Next iteration must
  diagnose real anatomical landmarks before deciding redraw.
- Repair ledger settled accepted with scope explicitly WEAPON source
  salvage, not complete sheet acceptance. Audit coordinates/evidence:
  [charge-repair-1-audit.json](charge-repair-1-audit.json).
- Checks: 76/76 across seven scoped suites; lint/typecheck exit0.
  New five real-source tests include wide-band numeric-pass/cloth-
  damage negative control. Offline only; no vision/prodbuild/browser
  or native-video claims, no runtime activation. Small sequence was
  a downsample overview, not a calibrated gameplay capture.
- Outcome: CMR-14A IN_PROGRESS; charge HELD head gate, 1/7 accepted.
  This is the second consecutive incomplete charge consumer outcome;
  only one more unsuccessful iteration is allowed before BLOCKED.

### Request 2/12 — charge candidate + partial deterministic repair → HELD, not accepted (2026-10-06)

- Continued the interrupted charge iteration; no duplicate image call.
  Existing reserve is persisted: used 2/12, global 128/200, charge
  sheet count 1/2. Ordered references: body `a57630a2…`, portrait
  `01bb7271…`, walk `b395c867…` (1535×1024). The first attachment
  attempt failed metadata validation (walk width wrongly 1536); the
  corrected call returned candidate `0afda71c6406eb103465f7f859bcdd8bf6ba9b85f26e341524f06efde29c5257`.
  Prompt/reference reconciliation: [charge-prompt-note.md](charge-prompt-note.md).
- Candidate: 1536×1024, 9 separate figures, no outer-edge contact.
  Coil/launch/dash/dash2/brake poses read; headband/beard/palette and
  single leaf spear + red tassel present. This is a design review,
  NOT an Acceptance-4 pass. Head landmarks have not been measured.
- Corrected measurement: earlier gold/steel-highlight chords
  [483.5,487.3,451.9,501.5,477.7] undercounted whole-material tips
  and caps. Component-constrained alpha>=96 endpoints, visually
  checked on overlay, give [494.9,496.7,464.3,511.8,488.4]. Exact
  coordinates/hashes are in [charge-audit.json](charge-audit.json).
- Rejected five-op intermediate `507797cf…`: numeric gates passed,
  but enlarged pairs show hand movement/notch in cell0, cloth cut
  in cell3, forearm notch in cell4. Narrower cap trials still fail
  visual review. No acceptance based solely on predicted length or
  unchanged speck count. The rejected file was hash-checked and moved
  to `artifacts/tmpcheck/xiahoudun-charge-rejected-five-op.png`; no
  accepted `charge-prepared-source.png` is present.
- Safe PARTIAL only: `retouch-xiahoudun-charge.mjs` now applies cells
  1/2 with band 12, shifts (62,-6)/(27,-2). Protected grip/cloth
  rectangles, non-target RGBA, all seven untouched figures, identical
  22 pre-existing speck components, and composition/edge gates pass.
  Source is immutable; output only after all checks. Final partial
  `dedac2b17b122fccce30700963795876b7a2b681529e46db66e16a781fb0ab57`.
  Fresh pair review: caps/shaft joins clean, hands and cloth unchanged.
- Final partial lengths [494.9,434.4,437.2,511.8,488.4]: 16.34%
  spread FAIL. Hypothetical walk+charge diagnostic STOP 19.76%, N=14;
  NOT recorded in projection. Fixed walk band remains byte-unchanged.
- Verification: 71/71 across six focused suites; lint/typecheck green.
  Five real-source tests include a negative control: the previous
  wide-band op still passes numeric gates, but the new body witness
  rejects it. No vision/prodbuild: no runtime/UI/shipping changes.
- Next bounded iteration: retain cells 1/2; repair charge:0/3/4 only
  (foreground-safe retouch if provable, otherwise one focused repair
  round reserved BEFORE the call). Preserve poses and request 420–430px
  spears with clear endpoint/slide corridors. Recheck full material
  endpoints, head landmarks, anatomy and projection before acceptance.
  Repair reserve unspent; this is the first unsuccessful charge-sheet
  consumer outcome after the accepted walk iteration, not a blocker.

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
