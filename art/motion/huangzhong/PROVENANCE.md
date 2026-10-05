# Huang Zhong provenance (CMR-12A)

- Authoring: 12/16 used (5/10 ACCEPTED; fall 1/2 design PASS,
  length INCONCLUSIVE — halo bias found, gradient tool next).
  Global 104/200; fall 1/2 left. Repair reserve 3/3 untouched
  (shared with CMR-12B, acceptance-4 only). BUDGET: 4 left for
  4 sheets — zero margin stands.
- Masters (inspected 2026-10-05, before any request): body
  `338d9c9e…`, portrait `4dcac826…`. Identity locked in
  `IDENTITY.md`; weapon from rig files only
  (`WEAPONS.bow` 42u recurve, hand-centred riser, continuous
  string, no tassel).
- Attempt log starts below. Every image call records: request
  n/16, kind (sheet/focused) + sequence, reserve-before-call
  proof, exact prompt file, ordered reference hashes, provider,
  mechanical audit, overlay-verified verdict, remaining allowance.

## Attempt log

### Fall verdict round: BLOCKED on diagonal DOWN + marginal spread (no image call) 2026-10-05

- Fresh 2x reads + overlay round 2 (all 12 rings adjudicated):
  keep [260.3(c0),254.4(c1),240.6(c2),260.3(c3),260.4(c4),
  234.5(c5)]. Rings sit on wood (tops placed halo-aware after
  round 1's lesson); chords track bows. Halo bias largely
  CANCELS in spread (uniform shift both extremes).
- Best 5-set is [0,1,2,3,4] = 9.29% central (min c2 240.6, max
  c0/c4 ~260.4) with ±2% method noise → [7.3%,11.3%] straddles
  the gate (marginal-passable by 4/4 prior precedents at 8–9%).
  BUT its DOWN (cell 4) is DIAGONAL (~30°), breaking the shared
  flat-DOWN bookend convention (FUNCTIONAL: getup/dead start from
  DOWN; weiyan's flat DOWN was an explicitly checked criterion).
  Flat-DOWN options ([0,1,2,3,5] 11.80%, [0,1,2,4,5] 11.80%)
  fail centrally. c0/c2 alone bind any keep at 9.29% — no
  remap or adjustment within authority can do better.
- VERDICT: fall BLOCKED — not on effort (5 methods exhausted:
  2x, micro, ASCII, column-scan, PCA, width-profile, overlay×2)
  but as an OWNER DECISION: (a) accept diagonal DOWN as-is,
  (b) extend budget +1 for a targeted fix, (c) waive to measured
  9.3%, or (d) re-brief DOWN. Zero budget margin (4 left for 4
  sheets) forbids unilateral fixes. No spend (still 12/16).

### Width-profile tool v3: FAILED on fall (no image call) 2026-10-05

- Built per-row-width-profile tracer (narrow-run segments + ONE
  collinear bridge + overlay adjudication) to replace untrustworthy
  hand reads. Overlay verdict: c0 ring mid-limb (207px, UNDER-read:
  segment broke early), c1/c2 NO FIT (25% strip too wide, all rows
  blob-wide), c3 rings OFF-wood (108px garbage on boot/space), c4
  ring ON but length suspect (207 vs map 260+), c5 top ring FLOATING
  (99px garbage). 0/6 verified. v3 REJECTED as a method (worse than
  v1: wider strip admitted more body; strict narrowness dropped
  real limb rows).
- Standing facts (multi-method agreement ONLY): c3 is SHORT (~199,
  diagonal 30°, column-proven, solid) → c3 CANNOT stay in keep;
  all other bows complete + vertical + roughly sibling-sized
  (~235–265 across methods, exact numbers untrusted).
- BINDING DECISION (stops the spiral): next turn measures ONLY
  what the verdict needs, simplest method first — 2x zone views
  for remap candidates (orig c6/c8 spare kicks? one must replace
  c3 as impact) + orig c4 (descent, still open) + re-confirm
  c0/c1/c2/c5 from existing verified reads; ONE overlay; adjust
  ONCE; verdict. PASS only if central spread ≤7% (3pp noise
  margin); else fall BLOCKED honestly (method exhaustion after 3
  turns + zero budget margin for fixes: 4 left for 4 sheets).
  No more new methods without retiring this one by verdict.
  No spend (still 12/16).

### Request 12/16 — fall 3x3 sheet candidate 1/2: design PASS, length INCONCLUSIVE (halo bias) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/fall)` → used 12,
  remaining 4, total 104 (guard: expected used=11, held).
- Exact prompt: `fall-prompt.txt` (topple→DOWN arc, vertical
  bows, 240–255px band). Ordered refs: weapon-spec, body,
  portrait, jump `82ed19c3` (all tool-issued — first try, zero
  errors).
- Output: `fall-candidate-1.png` sha `f7eca5e1…` (1536×1024).
  Mechanical: 9/9, 0 edge (prone straddles legal, separated).
  Design: 9/9 vertical recurves, distinct fall arc incl. THREE
  flat DOWN variants (5,7,8), lock match, zero defects — the
  cleanest sheet yet for design. Poses ACCEPTED.
- Length: INCONCLUSIVE with a diagnosed cause. 2x reads → overlay
  round 1 ADJUDICATED every top marker ~10px HIGH (floating in
  empty space): measuring RAW alpha catches generator HALO above
  true wood tips (cleanAlpha removes ~134k halo px for a reason —
  I measured pre-cleanup!). Bottom markers mostly on wood. All
  prior endpoint rounds inherit this +10px top bias unevenly,
  plus curl/merge noise — combined method noise ±15px ENDPOINT,
  exceeding the gate. No honest number exists yet; direction
  likewise unmeasured (all near-vertical visually).
- Fix (next turn, no image call): gradient-tip tool — endpoints
  = last STRONG-EDGE + wood-colored pixel along the limb axis on
  cleanAlpha-CLEANED data (never raw), all 12 endpoints uniform,
  ONE overlay verification, then verdict. If STILL inconclusive
  → fall BLOCKED with arithmetic (cannot pass unknowns; cannot
  afford re-brief: 4 left for 4 sheets).

### Jump verdict (no image call): spare remap [0,1,2,6,4,5] → 8.78% PASS, ACCEPTED 2026-10-05

- 2x zone views for orig c6/c8 (spare kicks) + fix c4 + orig c4,
  read carefully in ONE pass (no peepholes): c6 kick (deepest
  extension, bbox width 439) bow (417,670)-(395,925) = 255.9;
  c4 orig (908,355)-(893,615) = 260.4; fix c4 nearly identical
  (259.4) → orig kept (immutable-first; fix contributes nothing).
  c8 unmeasured (c6 already fills the slot — deepest kick wins).
- Final overlay on UNMODIFIED candidate-1 (read; all 12 markers
  on wood, chords track): keep [251.1,238.4,256.1,255.9,260.4,
  240.4] in play order [0,1,2,6,4,5], mean 250.4, spread **8.78%
  marginal PASS** (±2–3% method tolerance disclosed — same class
  as all prior accepts); direction max step 10.0° PASS. Culls:
  3 (short+diagonal defect), 7 (tuck spare), 8 (kick spare).
- Remap grounds (independent of values): (1) orig c3 FORCED out
  (demonstrated 199px + 30° diagonal — previous turn); (2) c6 is
  the deepest-extension kick (bbox width, pose read) — selected
  for pose FIRST, then verified in-band (255.9). The weiyan-jump
  [0,1,2,6,4,5] pattern recurses exactly.
- Verdict: jump ORIG ACCEPTED via remap (no splice — walk/
  finisher precedent: candidate IS the source). Cost: 2 requests
  (sheet 10 + adopted fix 11, fully unused). 5/10 sequences done.

### Chord tool v1 + jump length STILL inconclusive (no image call) 2026-10-05

- Built `artifacts/tmpcheck/huangzhong-jump-chord.mjs` (archer-v10
  pattern: 18% outer-strip PCA + narrow-run ≤20px blob filter +
  overlay adjudication). Result: c1/c2 fits plausible (265/261),
  c0 marginal (274, boot-adjacent), c3 fragment (75px), c4 NO FIT,
  c5 boot-caught (308px). Overlay read confirmed the pattern:
  the tool works ONLY where limbs hang isolated; huangzhong's
  bows merge with robe/legs/boots/headband-tails in most cells.
- Fallback micros then CONTRADICTED each other and the fits
  (±20–30px swings on c0B/c1B/c3T/c4T/c4B: peephole misses,
  string-vs-limb confusion, headband-tail mistaken for limb,
  boot-vs-tip merges). Full-curve maps (c3/c4) proved the ONLY
  reliable view — but mapping all six + adjudicating exceeds this
  already-long turn. STOPPED (bounded discipline, second time).
- Status: jump length genuinely UNRESOLVED. Design PASS stands.
  No verdict, no fix, no spend (ledger untouched at 10/16).
- Next (strict protocol, no peepholes): (1) full-curve alpha maps
  for all six keep bows in ONE script; (2) read tips ONLY from
  complete curves (trace each limb end-to-end; distrust isolated
  crops); (3) ONE overlay verification; (4) verdict from those
  numbers only. If any tip stays merged/unresolvable → that cell
  is honestly UNKNOWN (never a pass) and the sheet fails to a
  targeted fix or remap on demonstrated grounds.

### Full-curve maps + jump verdict: FAIL on c3 short/diagonal (no image call) 2026-10-05

- Rendered full-curve alpha maps for all six keep bows in ONE
  script and traced each limb end-to-end (no peepholes). Also ran
  objective 1px column scans for disputed lower tips. Results:
  - c0: (366,28)-(390,278) = 250.4 (both micro/map, solid).
  - c1: (834,12)-(868,248) = 238.4 (top from map; bottom = traced
    string-end, crisp transparent gap below; solid).
  - c2: (1354,16)-(1346,272) = 256.1 (map; lone pixel at x1323
    adjudicated headband/speck, not tip).
  - c3: (273,353)-(~372,524) ≈ 198–200, DIAGONAL 30° lean
    (column scans prove wood ends y513–523; below is transparent
    37px+ — the tip is real, not cut off). SHORT outlier +
    orientation-flagged (archer diagonal rule).
  - c4: top (805,353) solid (map); bottom UNRESOLVED (merged w/
    leg; micro vs map contradict 606 vs 642 — needs one wide-net
    micro to close).
  - c5: (1405,375)-(1428,615) = 243.3 (top overlay-verified,
    bottom micro with transparent gap; solid).
- Verdict: FAIL on demonstrated grounds — c3 (~199, diagonal)
  sits 40px+ below the solid cluster (c0/c1/c2/c5: 232–256,
  spread 9.4% among themselves). c4's exact value cannot save
  c3 (and c4's own read is still open). Rejected alternative:
  PCA fits (v1 tool) systematically OVERSHOOT curled recurve tips
  by 10–25px (extreme projection past the curl) — method retired
  for recurves; map-tracing + column-scan gaps are authoritative.
- Fix (next turn): focused re-brief of cell 3 (vertical bow per
  banked rule, ~240–250px cluster size, kick pose kept); include
  cell 4 ONLY if its closing micro lands out-of-band. Then splice
  + re-measure + verdict. No spend this turn (10/16).

### Request 11/16 (concurrent-turn artifact, ADOPTED) — jump fix: kick pose broken, remap hunt next 2026-10-05

- PROVENANCE ALERT: this request was reserved + generated by a
  CONCURRENT loop turn racing mine (ledger 10→11 at 07:25, image
  07:26, while my yielded turn watched). That turn died silent
  (10+ min no activity, no commit). I adopted the orphaned image
  rather than waste the spend. Its EXACT prompt text is LOST (my
  yield-turn file write overwrote their prompt draft — I have
  since DELETED the misleading file instead of committing a false
  record). Known intent (shared plan): fix cells 3+4.
- Adopted output: `jump-fix-1.png` sha `2eba6a10…` (9/9, 0 edge,
  re-audited by me). My verdicts (clean review read): fix cell 3
  REJECTED for the kick slot — provider REMOVED the kick leg
  (tuck pose now; bbox width 423→288), violating pose-keep;
  fix cell 4 plausible (descent kept?) but UNMEASURED; fix cell 2
  gained a stray kick (position-locked, unusable — no cross-file
  relocation precedent, refused as method invention).
- Remap hunt (same turn): full-curve maps for orig c6/c8 (spare
  kicks) + fix c4 + orig c4 are INCONCLUSIVE at ASCII resolution
  (my column-counting on 150-char rows is unreliable — admitted).
  Nothing scored. NO more blind ASCII squinting.
- BUDGET ALARM: 5 requests left for 5 sheets (fall/getup/misc/
  special/rider) = ZERO margin. Jump MUST complete with ZERO
  further image calls: kick from {orig c6, orig c8}, descent from
  {orig c4, fix c4}, all existing pixels. If no combination
  verifies → jump BLOCKED with arithmetic for the owner.
- Next: 2x zone VIEWS (not maps) for orig c6, orig c8, fix c4,
  orig c4 → direct grid reads → ONE overlay → adjust once max →
  verdict. 2x+overlay CONVERGES (walk/jab precedent).

### Request 10/16 — jump 3x3 sheet candidate 1/2: design PASS, length INCONCLUSIVE (method failed) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/jump)` → used 10,
  remaining 6, total 102 (guard: expected used=9, held).
- Exact prompt: `jump-prompt.txt` (takeoff→kick→landing, vertical
  bows, 225–240px band). Ordered refs: weapon-spec, body,
  portrait, finisher `dae97d05` (tool-issued — first try, zero
  errors).
- Output: `jump-candidate-1.png` sha
  `82ed19c36b5ff8e321a40cbb3d5aa19a530cfcc152235c97d47f85c184309c74`
  (1536×1024). Mechanical: 9/9, 0 edge. Design: 9/9 vertical
  recurves, role-correct arc incl. a genuine kick strike (cell 3,
  leg extended + braced bow), lock match, zero defects. Poses
  ACCEPTED; keep map [0..5] (takeoff/ascent/apex/kick/descent/
  landing) + spares 6,7,8.
- Length: UNRESOLVED. Five micro/ASCII rounds produced
  CONTRADICTORY reads (±20px swings: 2x under-reads curled tips;
  peephole centers miss; boot/limb color confusion; string-vs-
  limb ambiguity). Candidate values span ~185–260 depending on
  method — no better than noise. STOPPED the spiral per bounded-
  iteration discipline instead of burning a fix on garbage reads
  (the finisher lesson, applied one turn late).
- Next: ONE automated bow-chord tool (archer-v10 pattern:
  narrow-run limb tracing + full-curve maps + overlay verification
  of all 12 endpoints in a single pass), then verdict from ITS
  numbers only. No more hand-read peepholes.

### Request 9/16 — finisher fix (unneeded!) + TRUE measure → ORIG ACCEPTED at 8.13% 2026-10-05

- Reserve-before-call: `reserve(..., focused/finisher)` → used 9,
  remaining 7, total 101 (guard: expected used=8, held).
- Exact prompt: `finisher-fix-prompt.txt` (cells 1,2,3 shorter
  into ~210–215). Ordered refs: finisher orig (vehicle), weapon-
  spec, jab2-prepared, body, portrait. One image, first try.
- Output: `finisher-fix-1.png` sha `c2b52933…` (9/9, 0 edge).
  Measured: fix c1 230.2 (unchanged), c2 183 (OVERSHOT short!),
  c3 ~266 (GREW longer!). The fix actively HURT — REJECTED,
  unused. Provider absolute noise confirmed ±10–20% per redraw.
- PIVOT: micro-verified the ORIGINAL properly (5x micros + 1px
  maps for all 10 endpoints — my 2x reads had under-read curled
  tips by 10–24px, fabricating the "~19% fail"): TRUE orig keep
  [241.5,232.1,241.0,251.0,231.6], mean 239.4, spread **8.13%
  marginal PASS** (overlay read, all 10 on wood); direction max
  5.0° PASS. The "pose-correlated gradient" was MEASUREMENT
  ARTIFACT (bad reads), not provider behavior — CORRECTION to
  the request-8 log. No splice (walk precedent: candidate IS
  source).
- Verdict: finisher ORIG ACCEPTED (2 requests, 1 wasted).
  HARD LESSONS: (1) NEVER trust 2x eye-reads for curled tips —
  micro FIRST, prescribe from micros; (2) fixes reshuffle, don't
  converge — verify ground truth before prescribing (this fix
  was prescribed from garbage reads); (3) provider redraws vary
  ±10–20%, so fixes are for DEFECTS (missing/extra parts), not
  fine length tuning.

### Request 8/16 — finisher 3x3 sheet candidate 1/2: keep FAILS ~19% (pose-correlated lengths) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/finisher)` → used 8,
  remaining 8, total 100 (guard: expected used=7, held).
- Exact prompt: `finisher-prompt.txt` (vertical-bow sweep,
  185–200px band briefed). Ordered refs: weapon-spec, body,
  portrait, jab2-prepared (read_image'd FIRST per lesson —
  first try, zero errors).
- Output: `finisher-candidate-1.png` sha
  `dae97d059c3420dfc41b6dbcb638bdba468c392cdb9015c874095c2285094232`
  (1536×1024). Mechanical: 9/9, 0 edge. Design fully clean:
  9/9 vertical recurves, distinct sweep poses, lock match, zero
  defects. Vertical-only brief holds 3/3 sheets.
- Keep-set [0..4] (uppers 2x/5x, lowers 5x micros — my 2x reads
  under-read curled tips by 10–20px, micros corrected):
  [221.0,230.0,238.0,252.0,207.1], spread **~19.5% FAIL**.
  [SUPERSEDED at request 9: those 2x reads were systematically
  SHORT; TRUE micro-verified keep is [241.5,232.1,241.0,251.0,
  231.6] = 8.13% PASS. The "pose correlation" was measurement
  artifact — the fix below was prescribed from garbage reads.]
- Fix path (EXECUTED at request 9, then REJECTED): ONE focused
  edit on cells 1,2,3 — output reshuffled (c1 230 unchanged, c2
  overshot to 183, c3 grew to ~266). Unused. Lesson: fixes are
  for DEFECTS, not fine tuning; verify ground truth FIRST.

### Request 7/16 — jab2 fix (cell 4 shorter) + splice + keep 5.80% PASS → ACCEPTED 2026-10-05

- Reserve-before-call: `reserve(..., focused/jab2)` → used 7,
  remaining 9, total 99 (guard: expected used=6, held).
- Exact prompt: `jab2-fix-prompt.txt` (ONLY cell 4, pose kept,
  bow ~6–8% shorter into 188–196). Ordered refs: jab2 orig
  `1cb7304b` (vehicle, FIRST), weapon-spec, walk, body, portrait
  (all tool-issued attachments — no repeat of the request-6
  registration failure). One image, first try, no errors.
- Output: `jab2-fix-1.png` sha
  `f10b07687a218795ce6b2a844c317914a46d9b08122a34cd8f02c4f0b5502688`
  (1536×1024). Mechanical: 9/9, 0 edge. 3x zone read: lunge kept,
  single bow + string + air; 5x tip micros: (909,411)-(905,610)
  = 199.0px — dead in-band (no overshoot this time).
- Splice (`scripts/splice-huangzhong-jab2.mjs`, committed):
  {4: fix-1} + rest orig, SHA-pinned, gates + hash proof, byte-
  identical rerun → `jab2-prepared-source.png` sha `303148c9`.
- Keep-set [0..4] on spliced (overlay read; all 10 on wood):
  [188.7,195.0,187.9,191.4,199.0], mean 192.4, spread **5.80%
  robust PASS** (4pp under gate); direction max step 8.1° PASS.
  Culls 5,6,7,8 (spares; 7,8 run long ~219 — unused).
- Verdict: jab2 source ACCEPTED (2 requests). Running lesson:
  brief absolute bands AND verify after — provider noise ±10%.

### Request 6/16 — jab2 3x3 sheet candidate 1/2: keep 10.40% FAIL (c4 outlier) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/jab2)` → used 6,
  remaining 10, total 98 (guard: expected used=5, held).
- Exact prompt: `jab2-prompt.txt` (vertical-bow chop, 205–220px
  band briefed). Ordered refs: weapon-spec, body, portrait,
  jab1-prepared `5a750da4` (sibling size authority). TOOL LESSON:
  the first TWO calls failed `Attachment object is missing`
  because the splice-output ref had never been registered —
  constructed sha256 IDs don't resolve; `read_image` on the
  local file first (done), then the IDENTICAL third call
  succeeded under the SAME reservation. No extra spend.
- Output: `jab2-candidate-1.png` sha
  `1cb7304ba12bf9b280abe8bcb3490ecfa052d195dcda158472d767d6dfdcd135`
  (1536×1024). Mechanical: 9/9, 0 edge (cells 1,2 bows pass 4–6px
  from the top edge — legal, zero edge pixels), specks 5, glow
  cleaned with no residue (clean review read).
- Design: 9/9 CORRECT vertical recurves (banked rule obeyed —
  zero horizontal/sideways bows, zero arrows/shafts); poses
  distinct + role-correct (ready/raise/apex/impact/recover +
  spares); lock match; no defects. The vertical-only brief
  eliminated the jab1 failure modes entirely.
- Keep-set [0..4] (10 endpoints via 5x micros + 1px maps; c1B by
  traced string-end (873,199); c4B by wood-end (905,638)):
  [188.7,195.0,187.9,191.4,208.1], mean 194.2, spread **10.40%
  FAIL** (over by 0.4pp; c4's merge-adjacent tip keeps it
  robustly over); direction max step 8.1° PASS. Four cluster
  187.9–195.0 (3.7%) — c4 alone (+13–20px) fails it. Spares 7,8
  run long too (~219–220), so NO spare remap. Fix path: ONE
  focused edit redrawing ONLY cell 4's bow ~6% shorter into
  188–196 (pose kept), then splice + re-measure. (Provider
  absolute accuracy is ±10% noise — brief the band, verify after.)

### Request 5/16 — jab1 fix-3 (cell 2 longer) + splice v2 + keep-set 8.96% PASS → ACCEPTED 2026-10-05

- Reserve-before-call: `reserve(..., focused/jab1)` → used 5,
  remaining 11, total 97 (guard: expected used=4, held).
- Exact prompt: `jab1-fix3-prompt.txt` (ONLY cell 2, pose kept,
  bow ~8–10% longer into 205–210). Ordered refs: fix-2 `8221b0bf`
  (vehicle, FIRST), weapon-spec, walk, body, portrait. One image.
- Output: `jab1-fix-3.png` sha
  `ef0e14d873b7f299c09f0690e93a1057060072f74b29a7b771fb563f4f95f10b`
  (1536×1024). Mechanical: 9/9, 0 edge. 3x zone read: lunge kept,
  single bow + string + air, visibly longer — provider OVERSHOT
  to 224.4px (target was 205–210; overshoot pattern noted).
- Splice v2 (script updated: REPLACE now {1: fix-1, 2: fix-3,
  3: fix-2}): SHA-pinned, gates + hash proof + byte-identical
  rerun (one scare: a Windows-missing-`head` pipe broke the first
  determinism check's harness, NOT the code — clean rerun proved
  identical; use Select-Object on pwsh) → `jab1-prepared-source.png`
  v2 sha `5a750da4` (supersedes v1 `c593c6f9`, never accepted).
- Keep-set [0..4] on v2 (overlay read; all 10 markers on wood):
  [205.0,212.8,224.4,220.1,219.1], mean 214.3, spread **8.96%
  marginal source-level PASS** (±2% read tolerance disclosed —
  same class as walk 9.09% / weiyan-jab2 9.95%); direction max
  step 19.6° PASS. Culls: 5,6 (partial thrust bows), 7,8 (unused
  guard spares).
- Verdict: jab1 source ACCEPTED. Cost 4 requests (sheet + 3
  focused). Lesson banked: provider cannot draw sideways recurves
  (0/6) but draws vertical ones reliably — brief ALL future melee
  action bows vertical (thrust = body lunges, bow stays upright).

### Request 4/16 — jab1 fix-2 (cell 3 vertical pivot) + splice v1 + keep-set 14.51% FAIL 2026-10-05

- Reserve-before-call: `reserve(..., focused/jab1)` → used 4,
  remaining 12, total 96 (guard: expected used=3, held).
- Exact prompt: `jab1-fix2-prompt.txt` (vertical-bow thrust for
  ONLY cell 3, pose kept). Ordered refs: fix-1 `8e767cc2`
  (vehicle, FIRST), weapon-spec, walk, body, portrait. One image.
- Output: `jab1-fix-2.png` sha
  `8221b0bf65a46ce1bec341cd8a4f7e60db9de2afb4f978afaba636bf42e9b63a`
  (1536×1024). Mechanical: 9/9, 0 edge. Cell-3 bbox narrowed
  (x1 503→437: horizontal bar gone).
- Cell 3: FIXED ✓ — 3x zone read: extended lunge kept, COMPLETE
  vertical recurve in the fists (both nocks + full string + air
  gap, no arrows/shafts). Chord 220.1px programmatic
  ((394,352)-(387,572)). The pivot is proven: provider draws
  vertical recurves correctly, not sideways ones.
- Splice v1 (`scripts/splice-huangzhong-jab1.mjs`, committed):
  {1: fix-1, 3: fix-2} + {0,2,4,5,6,7,8: orig}, SHA-pinned,
  collision + edge gates, unchanged-cell hash proof, byte-
  identical rerun → `jab1-prepared-source.png` v1 sha `c593c6f9`
  (9 figures; SUPERSEDED pending fix-3 — not accepted).
- Keep-set [0..4] on v1 (overlay `huangzhong-jab1-keepmeasure.png`
  read; all 10 markers on wood): [205.0,212.8,189.7,220.1,219.1],
  mean 209.3, spread **14.51% FAIL**; direction max step 19.6°
  PASS. Sole driver: cell 2 short (189.7 vs 205–220 cluster).
  Cell 2 is correctly drawn + in-plane (no foreshortening dodge)
  — a clean LENGTH defect. Swapping in fix-1/fix-2's redrawn
  cell 2 for length alone would be value cherry-picking
  (archer precedent) — FORBIDDEN without independent grounds.
- Next: request 5/16 focused fix of ONLY cell 2 (pose kept, bow
  redrawn ~8–10% longer into the 205–215 cluster), then re-splice
  v2 + re-measure. Spares 5,6 stay culled.

### Request 3/16 — jab1 focused fix cells 1,2,3: PARTIAL (cell 1 fixed, cell 3 failed) 2026-10-05

- Reserve-before-call: `reserve(..., focused/jab1)` → used 3,
  remaining 13, total 95 (guard: expected used=2, held). Focused
  edits don't consume sheet slots (jab1 still 1/2).
- Exact prompt: `jab1-fix-prompt.txt` (committed; sideways-recurve
  geometry spelled out). Ordered refs: jab1 orig `0d319260`
  (edit vehicle, FIRST), weapon-spec `398dfd56`, walk `806bb045`,
  body `338d9c9e`, portrait `4dcac826`. One image, no retry.
- Output: `jab1-fix-1.png` sha
  `8e767cc22f415c0d23834cf8129688c42a1813831a3be048f28f400d7c881194`
  (1536×1024). Mechanical: 9/9, 0 edge (audit read). Untargeted
  cells micro-redrawn (bboxes shifted) — will NOT be used.
- Cell 1: FIXED ✓ (4x before/after: extra shaft gone, clean robe,
  lunge + vertical bow intact).
- Cell 2: CORRECTION — was NEVER defective. My request-2 verdict
  misread the extended gold sleeve as a shaft at 1x/2x. Direct
  3x zone view of the ORIGINAL (`huangzhong-jab1-c2orig.png`,
  read) proves a clean single vertical bow, both hands on it.
  The error cost nothing (fix-all-3 still correct; fix cell 2
  also clean). Splice will use ORIGINAL cell 2 (immutable first).
- Cell 3: FAILED ✗ — before/after near-identical (4x pairs read):
  still one limb + partial string, no observable second nock
  (~76px hooked fragment vs the 185–200 band). The provider can
  NOT draw the sideways recurve (failed 6/6 thrust cells across
  both sheets). PIVOT (evidence-based): re-brief cell 3 as a
  VERTICAL-bow thrust — extended lunge pose kept, same proven
  vertical recurve (13/13 correct: walk 9 + jab1 0,4,7,8) punched
  forward at arm's length, full nocks + string + air. Play to
  demonstrated strength, not repetition.
- Next: request 4/16 focused fix of ONLY cell 3 (vertical-bow
  thrust), then ONE splice {1: fix-1, 3: fix-2} + {0,2,4: orig},
  then keep-set measure + verdict. Spares 5,6 stay culled.

### Request 2/16 — jab1 3x3 sheet candidate 1/2: core REJECTED (poses accepted, weapons rejected) 2026-10-05

- Reserve-before-call: `reserve(..., sheet/jab1)` → used 2,
  remaining 14, total 94 (guard: expected used=1, held).
- Exact prompt: `jab1-prompt.txt` (committed; briefs the MEASURED
  walk band 185–200px, mean 190.7). Ordered refs: weapon-spec
  `398dfd56`, body `338d9c9e`, portrait `4dcac826`, walk
  `806bb045`. Preferred provider, one image.
- Output: `jab1-candidate-1.png` sha
  `0d31926004827357f951b9c802c45dfb63a5a675890ff1f65aa160ffc50f577c`
  (1536×1024). No retry.
- Mechanical: 9/9 components, 0 edge, specks 10, glow 104855
  cleaned with no residue (clean review read). All separated.
- Identity/poses ACCEPTED: all 9 distinct, role-correct
  (ready/windup/drive/extension/recover + spares), lock match,
  connected anatomy, no extra limbs/horse/text. The lunges and
  guards are right; only the weapons fail.
- Weapon verdicts (clean review + 2x thrust grid + 2× 4x zooms,
  all read): cells 0,4,7,8 carry CORRECT vertical recurves
  (string + air, walk-matching). Cells 1,2 show the correct bow
  PLUS an extra horizontal arrow-like shaft from the off-hand
  (4x: thin straight uniform wood ~140px, no nocks — forbidden
  either as a painted arrow or a second weapon; verdict is
  interpretation-proof). [CORRECTION logged at request 3: the 4x
  proof covered cell 1 only; cell 2 never had the shaft (gold
  sleeve misread at 1x/2x) and was always clean.] Cells 3,5,6
  thrust bows are PARTIAL:
  cell-3 4x shows one limb + partial string only, lower nock
  unobservable (staff-with-hook read) — length UNVERIFIABLE,
  and as the extension core cell this alone fails [0..4].
- Consequence: NO spare remap (all thrust cells defective; only
  guards survive). Repair path = ONE focused edit redrawing ONLY
  cells 1,2,3 (poses preserved) with explicit sideways-recurve
  geometry (both tips + full string + air in-plane), then
  SHA-pinned splice + re-measure — the weiyan-jab1 precedent.
  NOT a whole-sheet re-roll (conceptual defect needs isolation,
  not repetition). Cells 5,6 culled unused.
- Remaining: 14/16, jab1 sheet 1/2 left.

### Request 1/16 — walk 3x3 sheet candidate 1/2: ACCEPTED 2026-10-05

- Reserve-before-call: `reserve(huangzhong, hero, sheet/walk)`
  → used 1, cap 16, remaining 15, total 93 (slot auto-created;
  ledger saved BEFORE the call; verified in
  `generation-budget.json` diff).
- Exact prompt: `walk-prompt.txt` (committed). Ordered refs:
  (1) `weapon-spec-reference.png` sha `398dfd56…` (legacy rig
  crop: idle+walk0 windows from `artifacts/review/latest/anatomy/
  huangzhong.png` sha `1c22d358…`, rendered by
  `artifacts/tmpcheck/huangzhong-weapon-crop.mjs`; crop sha
  recorded at render time), (2) body master `338d9c9e…`,
  (3) portrait master `4dcac826…`. Preferred provider, one image.
- Output: `walk-candidate-1.png` sha
  `806bb0457c65e95259974dad23295ca1fad0936d390ae8076050adec8fe83ae4`
  (1536×1024). No second image, no retry.
- Mechanical audit (`huangzhong-walk-audit.mjs`, cleanAlpha ≥96):
  9/9 components, 0 outer-edge pixels, 0 specks; glow-halo
  83851px removed (reviewed: no key residue in
  `huangzhong-walk-clean-review.png`, read this turn). Bboxes
  heights 329–335 (uniform figure scale); all figures separated.
- Identity/poses (clean review + 2x bow grid, both read):
  cell0 planted guard + 8 distinct alternating walk phases,
  upright elderly bearing; gold-mustard robe, bronze beast
  pauldrons, headband + topknot, waist beard, aged face — all
  match the lock. Hands grip the riser with defined fingers; no
  mitten/extra/floating hands, no second fighter/horse/arrows/
  quiver/text/panels. No verticals (carry pose), no forks.
- Weapon design: compact recurve, hand-centred riser, BOTH nocks
  + continuous string enclosing visible air in all 9 (cell0
  proven at 4x + string-column runs; all 9 show string + air gap
  at 2x; isolation scan found the thin-run/air-gap/limb pattern
  in 5/9 rows). No arrows painted, no effects. Matches the
  legacy authority (same chest-to-shin proportion).
- Weapon length (nock-to-nock, overlay-verified):
  [194.1,184.0,185.2,201.4,189.0,188.1,186.0,192.0,196.2] raw
  px, mean 190.7, spread **9.09% — marginal source-level PASS**
  (≤10%). Method: uppers via right-edge walk-up (programmatic,
  ±1px), lowers eye-read from 5x micro-crops (±2–3px; alpha
  CANNOT separate the merged limb/robe silhouette — proven by
  2D hood map + failed color/string/detector variants v1–v5,
  documented in tmpcheck scripts). All 18 endpoints verified on
  wood in `huangzhong-bow-endpoints.png` (read). Mean lands
  inside the brief's 190–210 estimate. Direction: all chords
  within 3.5° of vertical, max consecutive step 3.72° PASS.
- Verdict: source ACCEPTED, keep [0..8] provisionally. Pack NOT
  prepared; cross-sheet acceptance + gameplay continuity come at
  pack time. Remaining: 15/16, walk 1/2 left.
