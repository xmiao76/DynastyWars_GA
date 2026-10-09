### CMR-12A - Huang Zhong: author/prepare full motion pack

- Status: DONE (attempt 1, 2026-10-05, verified same day). Owner
  waived item 4 ("waive now, mark DONE"): weapons 47.22% FULL +
  head-void with documented limitation (07A 18.2% / 09A 88.3%
  precedent class). All other items verified: 57/57 unique frames,
  1 page, 12.1MiB, deterministic `0e8b5c49`; continuity PASS all
  11 sheets; zero 12A src/game changes; no runtime activation.
  Repair reserve 3/3 handed to 12B intact (+ fall-DOWN re-confirm
  handoff). CMR-12B unblocked. Prior: owner funded +3 2026-10-05
  for
  sequential single-cell getup fixes (cap 20); all three DONE
  (c3 266.2, c4 270.1, c5 270.2, poses kept); spliced
  (`0ea3732e`, deterministic) keep [0..5] = 7.45% robust PASS,
  direction 0.9° pass → getup ACCEPTED (5 requests). 7/10 done.
  Misc sheet 1/2 (`bad2eceb`, 9/9 verticals, poses pass): cell 4
  DETACHED bow (mechanical defect, 10 components) → release
  remapped to spare cell 8 (upright ward-off read); deterministic
  repair assessed + rejected (68px gap too large). Keep
  [0,1,2,3,8] = ~0% PASS overlay-verified, direction 0.2° pass →
  misc ACCEPTED (1 request). 8/10 done. Special sheet 1/2
  (`10607c60`, 9/9 clean verticals, ZERO arrows, poses pass):
  keep [0..4] = ~0% PASS overlay-verified, direction 0.4° pass →
  special ACCEPTED (1 request). 9/10 done. Rider sheet 1/2
  (`8f6b81db`, 9/9 seated riders, zero horse parts, poses pass):
  keep [0..5] = 1.34% PASS overlay-verified, direction 0.2° pass
  → rider ACCEPTED (LAST request, 20/20). **10/10 sequences
  done.** Pack huangzhong-1 BUILT (`prepare-huangzhong.mjs`,
  weiyan pattern): 57/57 unique frames, 1 page 1988×1594,
  12.1MiB ≤ 16MiB (0 step-downs), deterministic manifest
  `0e8b5c49`, registration.json committed; 6 suspects dismissed
  as bbox-overlap noise. Acceptance-4 measured: weapons 47.22%
  FAIL (N=57 verified chords, monotonic 191→300 provider drift)
  + head-void (face gate merges gold/beard — demonstrated);
  figures uniform (guards agree 2.7%) so factors correctly stay 1
  (re-prepare byte-identical). Repair infeasible (~40 cells vs 27
  capacity). → BLOCKED, WAIVER REQUESTED (07A 18.2% / 09A 88.3%
  precedents bracket 47.22%). Ledger 20/20; global 112/200.
  Prior waiver detail preserved below. Owner chose waiver (c)
  2026-10-05:
  fall ACCEPTED [0,1,2,3,4] 9.26% + diagonal-DOWN waiver recorded;
  12B handoff: re-confirm DOWN at integration, repair reserve as
  backstop. Prior BLOCKED detail preserved below. Fall verdict: best
  verified keep [0,1,2,3,4] = 9.29% marginal but DOWN is diagonal
  (flat-DOWN bookend broken); flat-DOWN sets fail at 11.8%; zero
  budget margin (4 left for 4 sheets) forbids unilateral fixes —
  options: accept diagonal DOWN, +1 budget, waive 9.3%, or re-brief
  DOWN. Prior IN_PROGRESS detail preserved below; identity locked
  from inspected
  masters `338d9c9e`/`4dcac826`, weapon from rig files — 42u
  recurve, hand-centred riser, continuous string, no tassel;
  10-sheet plan recorded. Walk sheet candidate 1/2 ACCEPTED
  (`806bb045`, 9/9 clean, bow chords 184–201px = 9.09% marginal
  pass overlay-verified, direction max 3.7°). Jab1 sheet 1/2
  generated (`0d319260`, 9/9 clean): poses accepted but core
  weapons REJECTED (cells 1,2 extra arrow-like shaft; 3,5,6
  partial thrust bows, strike nock unobservable — no spare
  remap). Focused fix-1 (`8e767cc2`) PARTIAL: cell 1 fixed
  (shaft gone, 4x-verified), cell 2 proven always-clean
  (request-2 sleeve misread corrected), cell 3 UNCHANGED (still
  partial ~76px hook — sideways recurve failed 6/6). Pivot:
  fix-2 (`8221b0bf`) FIXED cell 3 (vertical pivot proven:
  complete recurve, chord 220.1). Spliced v1 (`c593c6f9`,
  deterministic, hash-proofed) but keep-set FAILS 14.51%
  (cell 2 short at 189.7 vs 205–220 cluster; direction 19.6°
  pass). Fix-3 (`ef0e14d8`) lengthened cell 2 (190→224px,
  overshot but in-band); splice v2 (`5a750da4`, deterministic)
  keep-set 8.96% marginal PASS, direction 19.6° pass → jab1
  ACCEPTED (4 requests). Rule: all melee bows vertical.
  Jab2 sheet 1/2 (`1cb7304b`, 9/9 clean verticals, poses pass):
  keep-set 10.40% FAIL on c4 outlier (208 vs 188–195 cluster;
  direction 8.1° pass; no spare remap — 7,8 also long). Tool
  lesson: read_image local files before using as refs (2
  attachment errors, same reservation retry). Fix (`f10b0768`)
  landed cell 4 at 199.0px in-band; splice (`303148c9`,
  deterministic) keep-set 5.80% robust PASS, direction 8.1°
  pass → jab2 ACCEPTED (2 requests). Finisher sheet 1/2
  (`dae97d05`, 9/9 clean verticals, poses pass): keep-set FAILS
  ~19.5% — pose-correlated lengths (c4 207 < c0 221 < c1 230 <
  c2 238 < c3 252; deeper lunge = longer bow; spares 5,6 also
  long, no remap). Fix (`c2b52933`) REJECTED (reshuffled: c2 to
  183, c3 to ~266). Micro-verified TRUTH: orig keep
  [241.5,232.1,241.0,251.0,231.6] = 8.13% PASS (2x reads had
  under-read curled tips) → finisher ORIG ACCEPTED as-is (no
  splice). Jump sheet 1/2 (`82ed19c3`, 9/9 clean verticals,
  genuine kick, poses pass): LENGTH INCONCLUSIVE — 5 micro/ASCII
  rounds contradict (±20px swings). Stopped the spiral. Next: ONE
  automated chord tool (archer-v10) + verdict. Tool v1 built:
  fits only isolated limbs (c1/c2 plausible); merged cells fail
  honestly; fallback micros contradicted (±20–30px). Length
  STILL unresolved. Full-curve maps then gave the verdict: c3
  short+diagonal (~199 vs 232–256 cluster) → jump FAILS on
  demonstrated grounds (c4 read still open; PCA fits retired for
  recurves — they overshoot curled tips). Next: c4 closing micro
  + focused fix (c3 vertical re-brief; c4 if out-of-band) +
  splice + re-measure. Concurrent turn raced + died silent;
  adopted its jump fix (`2eba6a10`, ledger 11): fix cell 3 broke
  the kick pose (tuck now — REJECTED), cell 4 unmeasured.
  Remap hunt via ASCII maps inconclusive (unreadable at width).
  Jump MUST close with zero new calls (5 left for 5 sheets):
  kick from {orig c6/c8} + descent from {orig/fix c4} via 2x
  views + one overlay. Else BLOCKED. Ledger 11/16, global
  103/200; repair reserve 3/3 untouched).
  Jump verdict: 2x zone views measured remap candidates — kick =
  orig c6 (deepest extension, 255.9 in-band), descent = orig c4
  (260.4; fix c4 identical so orig kept) → keep [0,1,2,6,4,5]
  = 8.78% marginal PASS, direction 10.0° pass (overlay: all 12
  markers on wood) → jump ORIG ACCEPTED as-is, no splice. 5/10
  done. ZERO margin: 5 requests left for fall/getup/misc/special/
  rider (11/16). Fall sheet 1/2 (`f7eca5e1`, 9/9 clean verticals,
  three flat DOWNs, poses pass): length INCONCLUSIVE — overlay
  round 1 exposed systematic +10px top bias (measured RAW alpha
  incl. generator halo; must measure CLEANED). Next: gradient-tip
  tool on cleaned data + single overlay verdict (no image call).
  Ledger 12/16, global 104/200; 4 left for 4 sheets. Width-
  profile tool v3 FAILED (0/6 verified). CORRECTION: prior "c3
  short+diagonal / kick spare" lines were jump findings
  copy-pasted into fall's record — struck; fall c3 measures
  ~260 in-band. Overlay round 2 verified all 12 rings on wood:
  best 5-set [0,1,2,3,4] = 9.29% marginal BUT its DOWN (c4) is
  diagonal, breaking the shared flat-DOWN bookend; flat-DOWN
  sets fail centrally (11.8%). No passing path within authority
  (c0/c2 bind 9.29%; zero budget margin forbids fixes). RESUMED
  2026-10-05: owner chose waiver (c) → fall ACCEPTED (script-exact
  9.26%, correcting 9.29% hand math; diagonal-DOWN waiver recorded;
  no splice). Next: getup sheet (reserve first). Ledger 12/16;
  4 left for 4 sheets (getup/misc/special/rider). Getup sheet 1/2
  (`735ab57a`, 9/9 clean verticals, observability obeyed, poses
  pass): LENGTH FAILS — overlay-verified [260.6,260.4,280.3,310.3,
  300.3,310.3] = 17.38%, pose-correlated tiers (prone/kneel vs
  crouch/stand); every 5-keep spans tiers (min ~14%+); spares
  cannot bridge (extremes locked). BLOCKED (owner options: fund
  +1 fix, waive 17.5%, re-brief, redirect). Ledger 13/16; 3 left
  for 3 sheets (misc/special/rider).
- Dependency: CMR-11B DONE (earlier foundation dependencies apply transitively)
- Specification: [CMR-12A](docs/motion-tasks/CMR-12A.md); read with [shared contract](docs/CAST_MOTION_ROLLOUT.md).
- Acceptance: Complete applicable huangzhong identity/actions/registration/provenance/landmark budgets; offline review; no partial runtime activation.
- Non-goals: unrelated tasks/characters, core rebalance, default activation, push/deploy or loop infrastructure changes.

