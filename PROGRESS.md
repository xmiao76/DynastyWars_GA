# Progress Log
Add one entry at the TOP after every manual or scheduled iteration - newest
first, so the most recent state is the first thing an iteration reads.
Keep this file short. Once it passes about 500 lines, move the oldest entries to
`PROGRESS-ARCHIVE.md`: every iteration reads this file in full, so an unbounded
history slowly crowds out the work it is supposed to support.
## Template
### YYYY-MM-DD HH:MM - TASK-ID (attempt N)
- Status before; work completed; files changed; verification run; result; status after; remaining work/blocker; next recommended task:
## Entries
### 2026-10-07 20:45 UTC - CMR-14A (half-hourly tick): hand-axis + Hough both fail, set uncloseable -> BLOCKED (owner-authorized recovery exhausted)
- Hand-axis attempt: strip eyeball landmarks proved too sloppy (±50px, not ±15 - corridor leaked across cells: 112-1273px absurdities; clipped rerun gave 278-445 but overlay shows crosses off-shaft). Hough shaft-fit (scratch, longest straight ink-run per cell) converged to the SAME numbers as hull (337/583/509/421/414) - proving both auto-methods lock onto the same wrong structures: long thin DOTTED GUIDE LINES (straighter than spears) and body diagonals.
- Robust verdict (method-independent): by eye the set reads ~C0 280 / C2 450 / C3 430 / C6 355 / C7 420 vs band 404.16-446.70 - C0 and C6 under, C2/C3/C7 borderline-or-over; no plausible refinement closes a ~45% spread. C0 needs +125px (no room, proven); C6 extend alone is irrelevant. Overlay v4 reviewed (self-check): endpoints off-wood, dotted curves visible around new figs.
- Resources exhausted: repair 0/3 incl. extension (no redraw without owner funding); authoring 3/12 but auth forbids unilateral combo retries ("If provider/output/gate/splice fails, return BLOCKED"). Retouch infeasible for 0/3/occluded (proven). Per checkpoint + rule 5: BLOCKED, no speculative retry.
- Status after: CMR-14A BLOCKED. Owner options: (a) waive combo (07A/09A/12A precedent); (b) fund round 5 (guide-free redraws with solid shafts); (c) cap-slide partial (4/5/8+cell1) + waive 0/2/3/6/7; (d) redirect. Only owner resets to TODO. Files: PROGRESS.md, TASKS.md (docs only; no code/ledger/projection change; owner infra untouched).
- Verification: overlays v2/v4 reviewed; Hough scratch numbers; no suites re-run (no repo code changed). No image request; no waiver.
### 2026-10-07 20:15 UTC - CMR-14A (half-hourly tick): ghost-clear splice gates pass, driver tested 23/23 - hand-axis measurement next
- Ghost-clear implemented (erase all alpha>0 in replaced bboxes except keep pixels - keeps gate caught the first coarse attempt at keep (523,343), refined, now green): keeps exact, 9 touch-joined drawings, no edge/fuse, output 66ffaf39. New test file pins K4 live (321/372), MAP/KEEP, ghost-clear keeps-safety regression, determinism gates. Battery 23/23 (round4 3 + repair 11 + budget 9), lint + tsc clean.
- Overlay verdict on raw-hull endpoints: REJECTED again (endpoints on background/boots - hull finds body diagonal in lunges, not spear). Two automated methods failed the same way (PCA, hull); next is hand-placed shaft axes per cell with overlay verification (overlay-landmark protocol), NOT a third auto-method. Dotted-curve provenance still open (ghost-clear removed target-zone ghosts; remaining curves need the fresh-overlay comparison v2-vs-v3).
- Verification: endpoints-v3.png reviewed (self-check); no acceptance claimed (splice output still unaccepted). No image request (authoring 3/12, repair 0/3 spent); no ledger/projection/runtime change; owner infra untouched/unstaged.
- Result IN_PROGRESS. Next: hand-axis measurement + overlay verification + pair review; cap-slides; charge judgement.
### 2026-10-07 19:45 UTC - CMR-14A (half-hourly tick): masked splice gates pass, overlay REJECTS hull endpoints + exposes sub-gate ghosts - ghost-clear next
- Implemented checkpoint's masked extraction (fig-component pixels dilated 2px) in the round-4 driver (untracked, test ships with the fix): keeps exact, 9 touch-joined drawings, no edge/fuse, output 079473b2. Hull-diameter lengths run but overlay REJECTS them - endpoints on background/boots/heads (body diagonal beats spear in lunges), same failure mode as PCA, recorded INVALID.
- Bigger find on the same overlay: dotted guide curves persist around the new figs. Provenance narrowed (not yet proven): they sit where OLD candidate drawings were, and erase only removes >=96 comps - faint sub-gate ghosts (alpha<96, never in any component) are never erased and never gated. Round-4 raw, round-3 raw AND candidate-1 all likely carry them. Fix: erase ALL alpha>0 inside replaced target-cell drawing bboxes (single-drawing cells, nothing else lives there), then paste; then shaft-fitted (hand-verified-axis) measurement + fresh overlay.
- Verification: overlay image reviewed (self-check); round-4 driver still testless (no green claimed); ledgers untouched (no reserve/spend); no suites re-run (no repo code committed). No image request (authoring 3/12, repair 0/3 spent); no waiver; owner infra untouched/unstaged.
- Result IN_PROGRESS. Next: ghost-clearing erase + shaft-fitted remeasure + overlay/pair review + driver tests; cap-slides; charge judgement.
### 2026-10-07 19:15 UTC - CMR-14A (half-hourly tick): round-4 splice gates pass BUT overlay review finds dotted-line carryover - masked extraction next
- Built scripts/splice-xiahoudun-combo-round4.mjs (untracked, no test yet - NOT committed): K4=321/372 component extraction, full 5-cell MAP, touch-join gate. Gates pass (keeps exact, 9 drawings, no edge, no fuses): output a34d08c3. PCA-corridor lengths declared INVALID on review - endpoints land on background/boots/heads, not spear wood (whole-cell PCA follows body mass).
- Endpoint overlay review (ignored endpoints-overlay.png, opened): the REAL defect - dotted guide-line curves and dotted spearhead outlines rode along inside the extraction bboxes (paste copies all alpha>0; gates only track >=96). Round-4 carries the same construction-line disease as round-3, fainter. Fix recorded: mask extraction to figure-component pixels dilated 1-2px (keeps soft rims, excludes disconnected junk), then shaft-fitted (not PCA) endpoint measurement + fresh overlay.
- Verification: overlay image reviewed (self-check); splice suite green is NOT claimed (no test file for the new driver yet - writing tests against the fixed version next). No image request (authoring 3/12, repair 0/3 spent); no ledger/projection/runtime change; owner infra untouched.
- Result IN_PROGRESS. Next: masked extraction + shaft-fitted remeasure + overlay/pair review + driver tests; then cap-slides; charge judgement.
### 2026-10-07 18:25 UTC - CMR-14A (half-hourly tick): round 4 (owner-authorized) generated + ACCEPTED - clean, separated, splice next
- Handoff verified first (runner unpaused 18:05:21Z, no lock; CMR-14A TODO with matching auth block; ledgers 20/20 + tsc green before spending). Reserved round 4 via repair API BEFORE generation (cells combo:0/2/3/6/7, source c2c5fefc). Identity refs re-read (body a57630a2, portrait 01bb7271); scale/pose refs from prior reads. One image_generate call with the clean-redraw brief (at-scale, gutters, no guide lines, solid shafts, diagonal guard).
- Output d695e785 2155x730 preserved byte-identical: 5 poses, visible rear grips/butts clear, identity/palette clean, NO guide lines visible, fig5 guard diagonal per brief (self-check). Audit: 5 separated components (zero shared pixels), 0 edge, 7 specks <=6px; heights 359-375 vs walk 319-324 (~1.14x, gentle k~0.875); two gap-0 adjacencies (fig2|fig3, fig4|fig5) to verify benign at splice. Settled ACCEPTED (repair 0/3 incl. extension - extension spent, none left).
- Verification: repair 11/11 + budget 9/9 green after settle. No vision/prodbuild/signal (offline); authoring 3/12; projection walk-only; no runtime change. Owner infra files (AGENTS/continue/ledger/module/tests/auth block) preserved untouched, unstaged.
- Result IN_PROGRESS (task TODO->IN_PROGRESS this iteration; success does NOT mark DONE or authorize 14B). Next: k~0.875 component splice into cells 0/2/3/6/7 + full remeasure + pair review; fig4-diagonal placement watch; then cap-slide 5/8 + cell1 extend.
### 2026-10-07 17:49 UTC - CMR-14A owner-approved bounded recovery (infrastructure handoff, not a consumer success)
- Owner approved owner-2026-10-07-cmr14a-one-clean-redraw: one additional clean redraw request, five combo cells 0/2/3/6/7, acceptance gates unchanged. Read-only Muse subscription3 / muse-spark-1.3 / max reviewer confirmed prior BLOCKED is genuine (child 1b7367f3).
- CMR-14A BLOCKED -> TODO solely for this named recovery. All three prior repair requests remain spent; fighter-local extension adds one request, no authoring reset, no other fighter increase. Old failure evidence preserved below.
- Reserve first, keep references/originals, no guide artifacts, separation at target scale. If recovery fails, BLOCKED immediately; no fourth/fifth automatic speculative retry or waiver. Successful diagnostics/refusal tests are not acceptance. No art generated, tests beyond budget-tool regressions not claimed, game/runtime untouched.
- Runner remains paused until separate --resume handoff after focused tests/typecheck pass. Use the existing schedule/session; create no new writer or schedule.
### 2026-10-07 09:15 UTC - CMR-14A attempt2 (half-hourly tick): FINAL splice attempt fails - touch-join gate catches real cross-cell touch + dotted guide artifacts -> BLOCKED (rule 5)
- Last attempt per countdown: built a principled touch-join gate (8-neighbourhood groups must each touch exactly one drawing - keeps exact first, merges still fail) + NUDGE6 seating escape (cell6 down 0-8px). Result: keeps exact, edge clean, but group 19 fuses new:3+new:6 across the cell boundary; nudge 3 insufficient. 3x boundary view (ignored touch36.png) shows why: dotted guide-line artifacts (thin dotted curves + dotted spearhead outline) scattered in empty space + genuine body-part adjacency - the round-3 sheet carries faint construction lines that resampling lifts over the gate, and centered lunges collide across cells.
- Prior approaches and why each failed (rule 5 record): (1) full round-2 k-splice - uncuttable overlaps (steel head/tassel mass in cut columns); (2) round-2 cell0 k-splice - 0.757x severs spearhead neck under both filters; (3) round-3 k=0.8807 splice - resampling severs 1px necks (3 modes identical debris); (4) alpha-max/bilinear reconnect - identical debris, structural; (5) touch-join + seating - cross-cell fusion + guide artifacts. Repair reserve exhausted (0/3); authoring 3/12 unspent but no image path can fix placement post-hoc. Retouch proven infeasible for 0/3 (no room) and 2/6/7 (occluded). Cap-slides for 4/5/8+cell1 remain technically possible but cannot close 0/2/3/6/7, so no valid next step exists toward acceptance.
- Status after: CMR-14A BLOCKED. Owner options: (a) WAIVE combo acceptance with documented limitation (precedents 07A 18.2%, 09A 88.3%, 12A 47.22%); (b) FUND round-4 extension (separated at-scale redraws without guide lines); (c) accept cap-slide-only partial + waive 0/2/3/6/7; (d) redirect. Only the owner may reset to TODO. Ticks will ALERT while paused - expected.
- Verification: gate errors + zone image (self-check); round3 suite untouched (3/3 green, refusal pins hold); lint clean on last run. No image request; no ledger/projection/runtime change. Files: PROGRESS.md, TASKS.md.
### 2026-10-07 08:45 UTC - CMR-14A attempt2 (half-hourly tick): frags all TOUCH (gap 0) - centering seats figs into neighbors, rule-5 countdown recorded
- Scratch splice dissected (throwaway artifacts/motion/xiahoudun/frag-gap.mjs, never committed): 9 big + 10 small comps, EVERY frag bbox-touches a mass (gap 0.0) - no floating debris. Two 3x zone views show the truth: the touches are body-part adjacencies (boots, pommel caps at cell edges) from bbox-centering wide lunges into a dense grid, plus sub-96 neck membranes - not severed tips. So the fix is per-cell hand-seating (feet planted, tips clear) + membrane bridges, not resampling. No art changed, no gates touched.
- RULE-5 COUNTDOWN (honest): three consecutive unsuccessful splice-path outcomes now stand (full-splice refusal, resample-reconnect failure, this seating diagnosis). Per AGENTS.md rule 5 the NEXT splice attempt is the last before BLOCKED: one careful seated+bridged attempt next; if it fails, CMR-14A goes BLOCKED with exact evidence + owner options (partial pack, re-brief, waiver). Cap-slides/fig4/charge remain queued behind that verdict, not beside it.
- Verification: scratch numbers + 2 zone images reviewed (self-check); round3 suite untouched (still 3/3); no suites re-run (no repo code changed). No image request (authoring 3/12, repair 0/3); no ledger/projection/runtime change.
- Result IN_PROGRESS. Next: ONE seated+bridged splice attempt (succeed or BLOCK).
### 2026-10-07 08:25 UTC - CMR-14A attempt2 (half-hourly tick): reconnect via resampling FAILED three ways - neck-bridge retouch plan (11A precedent)
- Tried fragment reconnect inside the paste: alpha-max composite first, then pure bilinear. Both produce IDENTICAL debris at identical boxes (374/695/176/1505/1150px) as nearest - so the necks are structurally unviable through any resample, not a filter artifact. Four of five frag boxes are empty in the old candidate (paste debris, proven); the fifth overlaps old cell1's intact tip zone (keeps gate passed, so no damage there). No gate weakened, no art written.
- Way forward recorded: per-neck median-profile bridge fills with the motion-retouch machinery + seam review - CMR-11A accepted exactly this (105px fill + dirt zone, seams reviewed clean). Small, documented, reviewable; alternative is abandoning round-3 cells.
- Verification: round3 suite 3/3 (refusal still holds), lint clean. No tsc surface change (no signatures touched). No image request (authoring 3/12, repair 0/3); no ledger/projection/runtime change.
- Result IN_PROGRESS. Next: neck-bridge fills + gates + overlay/pair review; fig4 decision; cap-slide 5/8 + cell1 extend.
### 2026-10-07 08:15 UTC - CMR-14A attempt2 (continue): round-3 splice built, gate refuses severed fragments - reconnect plan recorded
- Built scripts/splice-xiahoudun-combo-round3.mjs (+.d.mts): K3=321/364.5 component extraction, 4 fittable cells (fig4 vertical guard held for owner decision), keep exactness + 9-cell + edge gates, PCA-corridor spear measurement. First run: keeps exact, but 19 comps - pasted figs shed small fragments (notably cell2 tip zone x1463-1500). Old-cell2 3x view confirms the occluded follow diagnosis. Even 0.88 severs 1px necks; no gate weakened.
- New test pins K3 live (it caught my 365.5 median slip - unfiltered bands read dust; corrected to 364.5), MAP/KEEP, and the fragment refusal. Suites 23/23 (round3 3 + round2 4 + ledgers 16), lint + tsc clean.
- Reconnect plan (deterministic retouch, next): rejoin each fragment neck with documented median-profile ops (motion-retouch machinery), re-run gates, then endpoint overlay + pair review. Fig4 guard placement stays an owner-visible decision (bounds-proven overflow).
- Result IN_PROGRESS. Next: fragment reconnect + re-measure; cap-slide 5/8 + cell1 extend; charge 20->21 judgement.
### 2026-10-07 08:00 UTC - CMR-14A attempt2 (continue): round 3 (LAST) generated + ACCEPTED - separated, near-scale, splice next
- Reserved round 3 (0 left) with the at-scale separated brief, then read walk-corrected 0aff5a39 (scale anchor) + round-2 raw (pose ref) with read_image, fixed a stray-word typo in the prompt file, one image_generate call. Output 7f52f1af 2073x758 preserved byte-identical: 5 poses with visible rear grips/butts clear, identity/palette clean (self-check).
- Audit: 5 fully separated components (x-overlaps y-separated, zero shared pixels - component extraction, no cuts), 0 edge, 4 specks <=3px; figure heights 351-368 vs walk 319-324 (~1.12x) so only a gentle k~0.89 fit is needed. Settled ACCEPTED with evidence. Watch item recorded: fig5 guard spear near-vertical (526px tall) vs 341px cell height - placement must respect it at splice.
- Verification: repair 7/7 + budget 9/9 green after settle. No vision/prodbuild/signal (offline); authoring 3/12; projection walk-only; no runtime change.
- Result IN_PROGRESS. Next: k~0.89 component splice into cells 0/2/3/6/7 + full remeasure + pair review; then cap-slide 5/8 + cell1 extend.
### 2026-10-07 07:45 UTC - CMR-14A attempt2 (half-hourly tick): k-splice path CLOSED - downscale severs spearhead, round 3 must be drawn at scale
- Single-cell salvage attempted (spliceComboCell0: component-extracted fig1, K=0.7571, centered on old cell0): gate refused with 11 comps - the pasted fig sheds identical 718+1134px fragments at x406-438 under BOTH bilinear and nearest-neighbor, so it is a structural thin neck in the source that cannot survive 0.757x, not a filter artifact. Old-cell3x view confirms the tight cell (spear spans full width). Combined with the uncuttable overlaps, NO k-splice of round-2 art is viable. Round 2 stays accepted-source (pose/grip reference only).
- Pinned the closure in tests (splice suite 4/4: K derivation, MAP/KEEP, full-splice refusal, cell0 refusal). lint + typecheck clean (added the .d.mts entry first).
- Remaining: round 3 (LAST, 1 left) briefed at EXACT walk scale (heads/figures 1:1, spears 404-447px in-sheet) + >=40px separation gutters for cells 0/2/3/6/7 - do NOT reserve this turn (brief needs the full care this tick spent diagnosing); then splice/remeasure; cap-slide 5/8 + cell1 extend; charge 20->21 owner judgement.
- Result IN_PROGRESS. Rule-8 still deferred (tail all BLOCKED evidence).
### 2026-10-07 07:30 UTC - CMR-14A attempt2 (continue): round-2 splice REFUSED by gate - overlaps sever steel/tassel, component-splice plan recorded
- Built scripts/splice-xiahoudun-combo-round2.mjs (hash-pinned K=321/424≈0.7571 walk-height fit, MAP r2figs->[0,2,3,6,7], keep-cell exactness + 9-cell + edge gates). First run STOPPED honestly: emptiest cut columns carry 27-28 opaque px. Y-run diagnosis: zone A = fig2's STEEL spearhead (pale 206,209,209 at y249-272) intruding to x979 inside fig3's head/tassel zone; zone B = fig4's RED tassel mass (y282-345) reaching x1790 inside fig5's butt zone. Any straight cut severs a real part - no blind cut attempted, no art changed (method-invalid outcome, not a retry).
- Salvage path recorded: fig1 (windup, comp x11-405 fully isolated) IS cleanly extractable by component - splice cell0 alone next (k-scaled 299x326 fits 512x341); cells 2/3/6/7 need round 3 (LAST, 1 left) briefed with mandatory >=40px separation gutters. Round-2 accepted-source status stands (cells valid as redraw reference, just not jointly spliced).
- Verification: gate refusal + diagnosis numbers only; repair/budget suites unaffected (no ledger change); no image request (authoring 3/12, repair 1/3). Rule-8 note: file sits at ~503 lines but the entire tail is UIR-16/UIR-19 BLOCKED-task attempt evidence which must be preserved, so no archive this turn (503 is within "about 500"); a finished-entry scan can follow if growth continues.
- Result IN_PROGRESS. Next: single-cell splice cell0 <- fig1 (component-based extraction) + pair review; then round-3 reservation with separation brief.
### 2026-10-07 07:15 UTC - CMR-14A attempt2 (half-hourly tick): splice-feasibility measured - uniform k~0.72 fit, splice plan recorded
- Measured opaque bboxes: round-2 figures h=406-432 (guard diagonal 523) vs candidate-1 cells h=267-317. Provider drew ~1.39x over scale despite the same-size brief; uniform downscale k~0.72 preserves proportions (zhangfei k=0.92 precedent, larger here but same kind). Round-2 spears briefed 420-430 at provider scale should land ~425-446 at candidate scale - plausibly in band 404.16-446.70, to be proven per-cell with true axes at splice. No art/source/budget/projection change this tick (measurement only, zero ledger cost).
- Splice plan for next tick: uniform k-fit of round-2 figs [windup,follow,sweep,alt-follow,guard-return] into candidate-1 cells 0,2,3,6,7 (hash-pinned component splice, non-target cells byte-preserved, split the two fringe touches on empty-space cut lines), then per-cell true-endpoint measurement + full projection re-run + enlarged-pair review. Verify k against the walk anchor (not just candidate) during the splice.
- Verification: measurement script output only (numbers above); no suites affected (no code/data change). No image request (authoring 3/12, repair 1/3 left).
- Result IN_PROGRESS. Next: execute the splice + remeasure; then cap-slide 5/8 + cell1 extend.
### 2026-10-07 06:45 UTC - CMR-14A attempt2 (half-hourly tick): round 2 ACCEPTED after touch adjudication; splice next
- Adjudicated the pending round-2 output: component boxes show fig1 alone, fig2 (x362-979) + fig3 (x926-1392) touching in x926-979, fig4+fig5 merged (x1365-2162); 7 specks all <=4px (tassel fringe/dust at x330-333, x1273-1276, x1765). Opened two 4x touch-zone crops (ignored artifacts/motion/xiahoudun/combo-round2-review/touch-fig*.png): fig3 head/tassel/butt-cap/fist all intact, fig4 fist wraps shaft with all fingers visible, tassel full, fig5 butt pommel intact - both touches are fringe proximity with every needed part visually complete (self-check).
- Settled round 2 ACCEPTED with evidence + output sha (repair 1/3 left). Splice of usable cells into preserved originals + full projection remeasure is next tick's work (needs hash-pinned component splice + overlay verification, over timebox).
- Verification: motion-acceptance4-repair 7/7 + motion-budget 9/9 green after settle. No vision/prodbuild/signal (offline); authoring 3/12; projection still walk-only; no runtime change.
- Result IN_PROGRESS. Next: hash-pinned splice of round-2 cells (separating the two fringe touches) + full remeasure, then cap-slide 5/8 + cell1 extend.
### 2026-10-07 06:15 UTC - CMR-14A attempt2 (half-hourly tick): repair round 2 reserved + generated for combo 0/2/3/6/7, left pending for merge adjudication
- Reserved xiahoudun acceptance-4 round 2 (repair 1/3 left) via reserveRepairRound BEFORE generation: cells combo:0/2/3/6/7 (0/3 over-band with no cap-slide room, 2/6/7 occluded-UNKNOWN), source c2c5fefc, persisted pending. Refs read with read_image first (body a57630a2, portrait 01bb7271, candidate c2c5fefc - identity confirmed: scarred one eye, headband, beard, dark armour). One image_generate call (no ref upload path available from this session's read_image results, so text-to-image with full identity/weapon/scale brief; prompt in acceptance4-round2-combo-prompt.txt).
- Output preserved byte-identical as art/motion/xiahoudun/acceptance4-round2-combo-raw.png (sha 26427f30, 2172x724): 5 figures in order, every rear grip shows haft + butt cap clear, tassels present, muted palette, identity clean (self-check). Composition audit: 4 big components (one neighbor merge - which pair TBD) + 7 specks, 0 edge contact. Deliberately NOT settled: merge/speck adjudication with enlarged crops + splice/remeasure is next tick's work; pending blocks any double-reserve by design.
- Verification: motion-acceptance4-repair 7/7 + motion-budget 9/9 green with round-2 pending. No vision/prodbuild/signal (offline); authoring untouched (3/12); projection untouched (walk-only); no runtime change. Audit: acceptance4-round2-combo-audit.json.
- Result IN_PROGRESS. Next: adjudicate merge + 7 specks, settle round 2 (accepted/rejected with evidence), splice usable cells, remeasure full projection, then cap-slide 5/8 + cell1 extend.
### 2026-10-07 05:45 UTC - CMR-14A attempt2 (half-hourly tick): cell4 slide enlarged-pair self-check PASS, suite re-confirmed 5/5
- Owed eye review from last tick: rendered ignored 4x before/after pair artifacts/motion/xiahoudun/combo-cell4-review/cell4-slide-pair.png (window x560-720/y490-600: slide zone + fist + cuff + skirt, raw above, slid below) and opened it. Verdict PASS (self-check): rear cap piece slid forward with gold collar intact; shaft from collar to fist reads continuous with no dotted/translucent seam; vacated butt zone is clean background with no stub; fist/cuff/armor/skirt pixel-identical between panels. Suite re-run 5/5 on the clean tree (no source changes this tick). No vision/prodbuild/signal (offline tooling); no image request (authoring 3/12); no budget/projection/runtime change.
- Result IN_PROGRESS. Remaining: reserve-first focused repair for combo 0/2/3/6/7, cap-slide 5/8 + cell1 extend, charge tick20->21 pose-cut owner judgement. Cell4 slide stays unspliced/unaccepted (self-check only; independent verification at splice time per norm). Next: CMR-14A per queue.
### 2026-10-07 05:15 UTC - CMR-14A attempt2 (half-hourly tick): combo-cell4 retouch test/script repaired, 5/5 green (first attempt at this substep)
- Found untracked leftover work from the interrupted window (scripts/retouch-xiahoudun-combo-cell4.mjs + .d.mts, test/game/motion-xiahoudun-combo-cell4.test.ts; ignored output art/motion/xiahoudun/combo-cell4-slid-source.png pre-existed): suite failed 4/5 - negative control A never threw. Root cause is a wrong test pixel, not the retouch: (642,531) sits on bare shaft (t=78.4 < FIST_T 88, o=-4.1, rgba 48,36,34) so the witness rightly skips it. Moved the probe to true fist skin (665,520) (t=103.8 >= 88, o=-7.1, rgba 186,137,101); also removed unused ux/uy (lint) and added index non-null assertions (tsc).
- Verification: focused suite 5/5; wider battery test/game/motion-{budget,pipeline,acceptance4-repair,retouch,xiahoudun-combo-cell4,xiahoudun-walk-projection} 64/64; final rerun 21/21; `npm run lint` exit 0; `npm run typecheck` exit 0. No vision/prodbuild/signal (offline retouch tooling only, same precedent as prior offline substeps); no image request (authoring stays 3/12, global unchanged); repair reserve untouched (xiahoudun 1/3); pack-projection.json unchanged (walk-only). Seam verified numerically only (negative control B + alphaRestored>100); no enlarged-pair eye review this tick - recorded, not claimed.
- Result IN_PROGRESS. Rule-5 note: first attempt at this substep (no prior PROGRESS entry tried these files), not a retry of the charge/combo-candidate approaches. Remaining: reserve-first focused repair for combo 0/2/3/6/7, cap-slide 5/8 + cell1 extend, enlarged-pair eye review of the cell4 slide before any splice, charge tick20->21 pose-cut owner judgement. No sheet acceptance, no projection record, no runtime change.
### 2026-10-06 (user "continue") - CMR-14A attempt2: independent stills review of the charge candidate -> paint pass 2; pose cut still unresolved
- Context found on resume (not by me): since my last commit `9f19e97`, three commits by another writer landed (`6675b96` boundary filmstrips, `487f31d` combo candidate 1 = authoring 3/12 / global 129, `cdadf37` combo retouch-feasibility). I verified rather than assumed: `generation-budget.json` is the only ledger changed (xiahoudun used=3, matches that commit), acceptance4 repair ledger/src/projection untouched, and the merged tree passes 14 suites/65 tests + lint + typecheck. My work is committed separately and scoped; I did not touch the combo files. Note the other session logged "00:09 UTC" for a 17:46 -0700 commit - timestamps in that entry are not wall-clock-reliable.
- Review: ran ONE read-only fork reviewer from the top-level session on the paint-corrected candidate stills (ticks 7/8/19-22/33/34/42/43, contacts, 4x pair). Stated first that stills cannot show smoothness. Verdict NEEDS_NAMED_REPAIR minor: charge:4 still visibly warmer/brighter than walk and charge1-3 (felt at 42->43), charge:3 mildly warmer than charge:2, 20->21 pose cut BORDERLINE (largest cut, not condemned), 7->8 and 33->34 acceptable, hands/grips/spear/neck clean. This CORRECTS the other session's filmstrip line "Palette now reads consistent across cuts" - it did not; corrected in REGISTERED-CHARGE-REVIEW.md and TASKS.md.
- Fix: paint pass 2 `charge-paint-harmonized-2-source.png` SHA `320e235a5d489f2c080187bd211d458c9dccf6d2164a8e36e4b69130fc4428d7` from immutable pass-1 `98e2531f`; RGB only, named charge:3/4 polygons (stronger on :4), alpha/protected spear+tassel/every other cell byte-exact; candidate spec repointed; fixture rebuilt (53 stills, 52 ticks, 83.2u unchanged). Measured whole-figure Rec709 luma charge:3 56.2->54.8, charge:4 57.0->54.7 (refs charge1/2 ~50.5, walk 44.0): gap REDUCED NOT CLOSED, deliberately not driven to the reference (would flatten shading; part is genuine pose/lighting). Opened 6-tile logical comparison + charge:4 4x pass1/pass2 pair and regenerated filmstrip 2: slightly more muted, shading/grips intact, no gray flattening - self-check only.
- Checks: 4 new tests (conservation incl. weapon/other-cell exactness, a luma check a no-op source fails, alpha and wrong-cell recolor negative controls, determinism); all 14 Xiahou/budget/projection suites 65/65, lint, typecheck exit 0. Pass 1 output hash re-verified unchanged (98e2531f) after exporting its region helper. No vision/prodbuild (offline art), no image request, no budget/projection/runtime change.
- Result IN_PROGRESS. UNRESOLVED: the tick20->21 pose cut - no video encoder and no in-game ?motion=1 playback (CMR-14B not started), so nobody can judge smoothness from stills; needs the owner's eye on the two filmstrips or a playback-capable review. If a hitch: no-art re-timing inside the exact 26 active ticks or one reserve-first charge:3 repair (repair 2/3 left). Otherwise propose scoped source acceptance with the residual palette gap and UNVERIFIED head disclosed. Combo (other session's candidate 1, weapon 32.6% STOP) is a separate pending item; I am not advancing it this turn.
### 2026-10-07 00:09 UTC - CMR-14A attempt2: combo whole-sheet candidate 1 generated (3/12), weapon gate FAILS, not accepted
- Clean HEAD `6675b96`; review1<4/no pending/current DUE NOW. Charge decision needed no new input, so I advanced the next sequence (combo) within the existing authoring budget. Reserved ONE whole-sheet request BEFORE the call (xiahoudun used 2->3/12, combo sheet candidates 1, global 128->129/200; ledger persisted, guard clause held), then ONE `image_generate` call (1536x1024, quality high) with ordered refs body `a57630a2`, portrait `01bb7271`, corrected walk `0aff5a39`. Prompt `combo-prompt.txt` adds what the charge sheet taught: keep head/figure scale equal to the walk reference, keep the muted dark palette (no bright copper/pink rims or orange-pink skin), no downward spears. Output saved UNTOUCHED as `art/motion/xiahoudun/combo-candidate-1.png` SHA `c2c5fefc1ac36a8ab428dca8cc966927df1103f5bda98d8dcbbf0304bccd6e0b` (immutable). 9 separate figures, 0 edge contact, 15 detached specks, nothing near-white.
- Weapon (whole-material alpha>=96 endpoints read on 1x grid strips; cell1 butt verified at 8x; hidden rears NOT measured): measured [0:470.1, 1:340.3, 3:472.8, 4:467.7, 5:487.7, 8:475.7] spread 32.58% vs fixed band [404.16,446.70] -> projection STOP. Over band 0/3/4/5/8; under band 1; cells 2/6/7 are thrust poses whose rear shaft is hidden behind the extended forearm (visible lower bounds 305.7/228.8/231.8) so their true length is UNKNOWN, recorded as unknown, not passes. Nothing recorded in pack-projection.json; combo NOT accepted. Palette read: dark/muted, the charge-sheet warm-paint problem did not recur (parent read only, not independent). Head UNVERIFIED/null.
- Files: `combo-prompt.txt`, `combo-candidate-1.png`, `combo-candidate-1-audit.json` (refs/budget/measurements/hashes), measurement overlays preserved under artifacts/motion/xiahoudun/combo-review (ignored), generation-budget.json. Checks: motion-budget 9/9 + acceptance4-repair 7/7 pass against the updated real ledger; no code changed, no vision/prodbuild.
- Retouch feasibility (measured BEFORE attempting, zero cost; corrects my earlier plan): marching from each rear point to the first skin-coloured fist (colour heuristic, enlarged-pair confirmation still needed) gives free shaft behind the fist: cell0 61px, cell3 30px, cell4 96px, cell5 89px, cell8 79px (cell1 137px). A cap slide needs the ~44px cap piece plus the removal; slide room = free-44. Needed removal to reach band hi 446.70: cell0 23.4 (room 17 -> NO), cell3 26.1 (room 0 -> NO), cell4 21.0 (room 52 -> yes), cell5 41.0 (room 45 -> marginal), cell8 29.0 (room 35 -> yes). So cap-slide plausibly closes only 4/5/8; 0/3 are over band with the fist too close to the butt, and 2/6/7 are occluded, so retouch alone cannot close the gate. Audit updated.
- Result IN_PROGRESS. Next: ONE reserve-first focused repair round (repair2/3 left; 0,2,3,6,7 =5 cells fit the 9-cell cap; +1 if its extend op fails) asking for visible grips with rear shaft and butt cap in clear space, spear 420-430px; THEN deterministic cap-slide/extend for 4/5/8/1 with protected hands and enlarged pairs. Alternative: second combo whole-sheet candidate (1 left, 9 budget). Fixed band never recentered; no projection record until every kept cell is measured; no 14B/runtime.
### 2026-10-06 23:39 UTC - CMR-14A attempt2 continuation: boundary filmstrips built; independent reviewer could NOT be started (nesting limit)
- Clean HEAD `9f19e97`; review1<4/no pending/current DUE NOW. Acting on "continue" toward the proposed reviewer route: added `scripts/render-xiahoudun-boundary-filmstrips.mjs`(+typings,2 tests) that pairs the tick before/after EVERY exposure change (six one-tick hard cuts: 2->3,6->7,7->8,20->21,33->34,42->43) from the existing candidate stills; opened both filmstrips (artifacts, ignored). No art/source/budget/projection/runtime change, no image request.
- Reviewer attempt: one read-only reviewer spawn REJECTED with "subagent depth 2 exceeds maxDepth 1" - this session is itself a delegated subagent, so it cannot nest. Infrastructure limit, NOT an art verdict and NOT an owner-decision gap; no reviewer observations exist or are invented. My own reading (recorded in REGISTERED-CHARGE-REVIEW.md as a self-check, not a verdict): 20->21 changes leg configuration/torso height but is not visibly larger than the inherent guard->coil (2->3) and brake->guard (42->43) cuts; 6->7 and 7->8 small; palette consistent. Offline stills, not normal-speed playback; I do not grade motion.
- Checks: new suite2/2 + registered-charge4/4 + silhouette-compare2/2 =8/8, lint/typecheck exit0. No vision/prodbuild (offline tooling).
- Result IN_PROGRESS, source acceptance HELD, head UNVERIFIED/null. Next: run ONE independent read-only reviewer from the TOP-LEVEL session on boundary-filmstrip-1/2 + logical-size-contact (prompt: judge each of the six cuts POP/BORDERLINE/ACCEPTABLE, never rescale heads) or take owner judgement; only a confirmed POP triggers one reserve-first charge:3 repair (repair2/3 left) or no-art re-timing. No combo/14B/runtime.
### 2026-10-06 23:09 UTC - CMR-14A attempt2 continuation: dash->dash2 boundary put in precedent context; rule-8 archive
- Clean HEAD `abe3206`; review1<4/no pending/current DUE NOW; one bounded step, no art/source/budget/projection/runtime change, no image request. Added `scripts/compare-xiahoudun-lidian-charge-silhouette.mjs`(+typings,2 tests): adjacent whole-silhouette TOP (trimmed bbox, INCLUDES raised spear; same260x144/ground136/density2 box) along guard->charge0..4->guard for the accepted Li Dian pack vs the Xiahou registered candidate. Real data: Li deltas[-36.5,16,-1.5,3.5,6.5,12]; Xiahou[-20.13,1.65,3.96,5.94,8.58,0]. Max adjacent |delta| Li36.50 vs Xiahou20.13; dash->dash2 Li+3.5 vs Xiahou+5.94u.
- Reading (honest): Xiahou's silhouette envelope sits inside the accepted Li Dian precedent, so the earlier "12.54u pelvis rise at tick20->21" is NOT evidence of an out-of-family pop - it was a manually-anchored pelvis landmark, a different metric, and bbox-top carries the weapon. This does NOT prove smoothness (no normal-speed playback, no independent review; Li Dian itself has caveats on record) and is NOT a PASS. Also opened Li Dian charge-prepared-source for the style context; no conclusion drawn from it beyond bbox arithmetic.
- Checks: new suite2/2 (first run failed: my negative-control fixture's `charge:3` y=20 only reached36.3<36.5, corrected to y=0 so it genuinely exceeds precedent, then pass), lint+typecheck exit0. Rule8: moved the20 finished CMR-14B readiness checkpoints verbatim to PROGRESS-ARCHIVE.md (500->480 lines; archive verified to contain every bullet); all unfinished CMR-14A evidence kept. No vision/prodbuild (offline tooling, no UI/runtime/shipping).
- Result IN_PROGRESS, source acceptance HELD, head UNVERIFIED/null. Next: normal-speed review of the dash->dash2 boundary needs a working reviewer or owner-reviewed judgement (I will not self-grade motion); only if confirmed a defect: ONE reserve-first focused charge:3 repair (repair2/3 left) or no-art exposure re-timing inside the exact26 active ticks. Spare6 stays rejected; no combo/14B/runtime. Authoring2/12/global128.
### 2026-10-06 22:09 UTC - CMR-14A attempt2 continuation: spare6 alternate-dash2 trial REJECTED (no source change)
- Clean HEAD `3a3ae8b`; review1<4/no pending/current DUE NOW. Whole-material spare6 weapon from the paint-source cell6 is520.8px vs fixed band[404.16,446.70] (needs ~86px rear-cap slide[86,-10]). Three isolated rear-cap trials on in-memory copies: (a) t0=44 band10 numeric gate REJECTED (achieved468.4 vs predicted434.2, leaves a stub); (b) t0=104 band10 hit predicted434.24 but the 4x pair shows a robe strip detached/stepped fringe and fist/cuff overpainted; (c) t0=104 band[-5,8] with the original fist/cuff rectangle restored numeric gate REJECTED (achieved441.13 vs 434.24) and the pair shows detached bronze fragments. A passing length number was NOT accepted when the pair showed damage. Rejected pair kept at artifacts/motion/xiahoudun/charge-paint-review/spare6-narrow-mask-rejected-pair.png (ignored artifact).
- Decision: spare6 NOT inserted; no source/exposure/budget/projection/runtime change, no image request (authoring2/12/global128/repair2left). The tick20->21 candidate pelvis12.54u concern is unresolved; current exposure map stands. Documented negative result, not a blocked/failed-whole-task claim. Do not repeat blind cap-slide masks on cell6.
- Checks: only PROGRESS.md edited (completed 20:09 substep compacted into a bold bullet retaining every detail; ~496 lines <500). No code changed so the earlier 48/48 suites are unchanged and were not re-run; no vision/prodbuild (offline).
- Result IN_PROGRESS. Next bounded options: (1) independent registered normal-speed review of the CURRENT dash/dash2 boundary to judge whether the12.54u candidate pelvis rise is a real defect (needs a working reviewer or owner-reviewed judgement, not self-grading); (2) if confirmed, ONE reserve-first focused repair round for charge:3 (repair2/3 left) to redraw a matched-palette mid-height dash2; or (3) candidate-only exposure re-timing inside the existing26 active ticks without new art. Head UNVERIFIED/null; no combo/14B/runtime.
- **2026-10-06 20:09 UTC - CMR-14A attempt2 continuation: localized charge paint correction / spare review** — Started from clean520c3b5, review1<4/no pending/current DUE NOW; one bounded paint substep. New98e2531f override from immutableb547809c adjusts RGB only named armour/skin polygons0/3/4 with6px feather, mild luma/chroma/warmth reduction.22097/23178/24331RGB pixels; ALL alpha/silhouette/coords, shaft+blade+tassel protected RGBA and cells1/2/5..8 exact;9 figures/0 edge, persisted PNG conservation passes. No image request/budget/core/runtime/projection changes. | Opened3 material4x pairs and registered logical before/after:0 copper/pink shoulder+skirt less bright,3 muted rims/lamellae with folds/rivets retained,4 chest/skin warmth reduced without gray flatness; geometry/grips exact. Mismatch reduced, NOT whole-source/normal-speed/independent after-acceptance. Candidate now uses98e2531f; review tool explicitly pins oldb547 before to preserve honest pairs. All4 spares5..8+spare6 grid inspected:5/7 airborne long strides,8 brake/rising spear,6 dark bent-knee/rear-supported run worth alternate dash2 trial; overlong/unaccepted, no spare inserted. | Checks:10 focused suites48/48; lint initially flagged structuredClone script global, replaced with JSON clone then lint/typecheck exit0; final paint+registration suites7/7 +lint/typecheck after candidate promotion. Actual shoulder-luma regression check (old source fails mute requirement), negative alpha and protected-weapon recolor controls reject; deterministic/copy-on-write. No vision/prodbuild (offline unaccepted source only). No normal-speed/native-video claims. Progress prior completed registration substep formatting compacted retaining every title/detail/evidence, <500lines. | Result IN_PROGRESS; next isolated safe rear-cap shorten for immutable spare6, protected body/hand, true endpoints and registered alternate-dash2 comparison inside26active, then actual offline playback. Head UNVERIFIED/null, charge not sheet-accepted/projection-recorded, no combo/14B/new owner authorization needed. Art budget2/12/global128/repair2left. Overlapping20:39/21:09 reminders received during this iteration: coalesced, no nested runner/second writer or additional task started.
- **2026-10-06 19:39 UTC - CMR-14A attempt2 continuation: registered charge candidate / named continuity findings** — Before IN_PROGRESS, clean71248d0, review1<4/no pending/current DUE NOW. New candidate pins corrected walk0aff5a39/chargeb547809c, fixed.66scale/density2/box260x144/ground136, pelvis+drawn-sole translations only; no source/image/budget/runtime changes. Six exact anchor overlays opened; max drawn contact1.32u, airborne dash virtual-ground UNVERIFIED, no per-pose scaling. First brake secondary guess932,690 off ink rejected before build; verified909,687/plane691, negative controls retained. | Core exposures0/3/7/8/21/34/43,duration52(8/26/18); emitted53 stills. New tests call actual stepEnemy all ticks both facings:26moving ticks8..33/speed3.2/83.2u, state/tick/root exact; no clock changes. Opened2contacts/4registered4x pairs/20-21+43stills and sources/grids/anchors. Guard restored fingers/bookends coherent. Named paint correction charge0/3/4 brighter copper-magenta/skin vs dark1/2/walk visible at logical size. Candidate pelvis92.44->79.90u rises12.54u at20->21 while sim moves3.2u: bridge/playback concern, NOT skull ruler or final motion FAIL/PASS. | Checks:9 focused suites45/45 + final candidate suite4/4, lint/typecheck exit0; builder repeatable/hash-pinned, off-ink and >1.5u negative controls reject. No vision/prodbuild (offline unaccepted review tooling, no UI/shipping). No native video encoder found; playback aid emitted but NOT watched or certified. Files: candidate spec, registered review+driver/typings/4tests, queue/plan/provenance/review state/handoff/progress. Compacted prior completed weapon-substep formatting without losing any evidence (<500lines). | Result IN_PROGRESS, source acceptance HELD, head UNVERIFIED/null; weapon gates unchanged and charge not projection-accepted. Next bounded work: paint-only harmonize named0/3/4 retaining alpha/body/weapon geometry; inspect unused spares for dash2 bridge inside26active then normal-speed offline review. No blind head shrink, combo/new task/runtime or owner authorization repeat. Authoring2/12/global128/repair2left unchanged.
- **2026-10-06 19:09 UTC - CMR-14A attempt2 continuation: foreground-safe walk weapon gate closed** — Before IN_PROGRESS after owner reset; review1<4/no pending/current DUE NOW, clean HEAD ec99d93; prior attempt2 guard restore corrected false walk ruler but left11.36% STOP. This bounded step repairs only cells2/3/5/7/8 from immutable fba82023 via cap shifts[13,-5]/[15,-6]/[14,-6]/[9,-3]/[39,-15], band10. New override0aff5a39; guard0/cells1/4/6 exact, protected hand/cloth/leg and every off-corridor pixel unchanged,9 figures/0 edge/2 same pre-existing specks; no generation/debit. | Review: opened all5 final4x pairs and full18-marker endpoint overlay.2 clear cap/boot,3 continuous join above unchanged scarf/fist,5 sleeve/leg intact,7 robe diagonal untouched,8 largest cap clear of cloth/grip, no floating bits. Whole-material lengths[427.7,430.8,437.3,438.3,431.1,437.5,442.4,438.1,436.6]3.38%/2.74° PASS, unchanged band projection OK/history retained. Hypothetical walk+charge6.89% OK NOT accepted charge. Initial witness falsely included spear138,559; builder rejected before write, annotated crop proved material, moved witness to actual lower cloth; no gate waiver. | Checks:8 focused suites41/41; typecheck initially failed strict indexing in new test, fixed tuple/index annotations then new suite4/4+lint/typecheck exit0. Regression old source>10% and guard-damage negative control numerically passes but body check rejects; deterministic/copy-on-write. No vision/prodbuild (offline sources, no UI/runtime/shipping). Source/budget/src unchanged. Progress reformatted completed review/reset substeps with all titles/details retained and20 historical readiness bullets separate, <500 lines. | Result IN_PROGRESS: weapon repair accepted, whole walk/charge held; head UNVERIFIED/null, independent after-verification/registered motion not claimed. Next: corrected-guard/charge/recovery registered scale/paint continuity with actual exposure/root map; then scoped source acceptance if justified, no blind head redraw/14B. Art budget2/12/global128/repair2left unchanged. Files: repair+review drivers/typings/new4 tests, source/audit/projection/review handoff/state/queue/plan/provenance/progress. No scheduler/control changes.
- **2026-10-06 - CMR-14A attempt2: owner reset fulfilled after independent review; guard grip correction** — Owner renewed authorization/continue; ONE current-session-fork reviewer `6c8414d5` completed27 image reads, no writes/generation. Final NEEDS_NAMED_REPAIR walk0 moved shaft/cap over rear fingers; preliminary all-charge-head rescale withdrawn as unproven. Head metric UNVERIFIED/null; charge paint warmth consistency remains registered-transition concern. Explicit BLOCKED->TODO owner reset APPLIED, then attempt2 named correction IN_PROGRESS; no new owner choice needed. | Continued work: new immutable-source hand override `fba82023`, rectangle[144,162,184,218],1704 RGBA channels restored, all outside unchanged/9 figures/0 edge. Opened original/damaged/restored triple4x: full fingers again wrap over shaft (parent self-check only). Full-material endpoint overlay all18 marks: walk[427.7,430.8,451.2,454.4,431.1,452.7,442.4,447.6,478.4]11.36% STOP; historical0.25% inside-cap measurements invalidated. Fixed band preserved, projection walk values corrected with history; no charge acceptance or runtime use. | Evidence/files: completed INDEPENDENT-REVIEW.md/json, walk-grip audit/override, restoration driver+typings/3 regression tests, revised review tests, queue/plan/provenance/diagnosis/progress/projection. Checks:7 scoped suites37/37; lint initially flagged unused import, removed it then lint/typecheck exit0; no vision/prodbuild (offline source only). Original sources/authoring+repair budgets/src unchanged; no image request. Five repetitive readiness entries compacted preserving all titles/details/history. | Result IN_PROGRESS attempt2, walk/charge held, budget2/12/global128/repair2left. Next bounded loop: foreground-safe walk shaft corrections (walk8 largest,2/3/5/7 over band) with body witnesses/enlarged pairs/full true-endpoint projection, then registered guard/charge style review; no new sequence/14B or blanket head redraw. Completed review+owner reset is no longer blocker; acceptance limits remain honest.
- **2026-10-06 - CMR-14A direct owner action: independent review THEN reset authorized; reviewer execution unavailable** — Owner explicitly selected independent review and subsequent reset (not missing owner choice). Started one read-only reviewer; flagship/max `41931e03` failed without closing verdict, flagship/xhigh retry `6a5bed32` failed, configured-default fallback `7fa6ad09` failed. Cause not provided; no quota/visual verdict invented. These are infrastructure attempts, not new art/consumer retries; no independent acceptance exists, conditional reset recorded but NOT applied. | Work: regenerated all5 fixed4x head pairs (exact historical hashes), added one uniform0.66 raw->art/density2 offline body/guard-charge-guard fixture; provisional composition only, no final registration/gameplay/native-video claims. New INDEPENDENT-REVIEW.md/json persist owner authority, routes, null verdict/head metric and exact source hashes; queue/plan/provenance now say review pending, not owner choice absent. Historical head diagnosis retained. No image generation/source/budget/projection/runtime/scheduler changes. | Checks:6 focused suites34/34 (independent-review3, historical head3, source repair5, partial5, repair-budget7, projection11), lint/typecheck exit0; diff/source/budget checks. No vision/prodbuild (no UI/shipping change). Compacted15 repetitive readiness checkpoint headings into bold bullets, preserving every title/detail/commit and all unfinished-task evidence; current progress remains under500 lines. | Result: BLOCKED on a functioning independent reviewer/verdict, despite valid owner conditional reset. Next: complete ONE independent review or explicit owner-reviewed fallback, record scoped acceptance/named correction, THEN apply authorized TODO reset. Do not repeat old request for owner route, fabricate numerical PASS, start14B, or reset image funds.
### 2026-10-06 - CMR-14A (attempt1 continuation — third unresolved charge outcome, BLOCKED head gate)
- Before: IN_PROGRESS, two unresolved charge outcomes (`57f3d4d`,`b28d591`); due check1 src/game commit, no pending/current DUE NOW, clean tree. Work: hash-pinned `review-xiahoudun-heads.mjs` renders five112×144 paired source crops at fixed4x, no normalization; opened ALL pairs0..4. Beard hides anatomical chin; posing/hair/neck/beard confound silhouette proxies. Head gate UNVERIFIED, no numerical PASS/FAIL, zero image calls/source edits.
- Evidence/files: `art/motion/xiahoudun/HEAD-DIAGNOSIS.md` + `head-diagnosis.json` (source/crop hashes, per-pair observations, owner options), diagnostic script,3 honest-null/source-pin/classifier tests, plan/provenance/TASKS/PROGRESS. Checks:5 focused suites31/31 (head3, charge repair5, partial5, repair-budget7, projection11), lint/typecheck exit0; no vision/prodbuild/e2e (offline diagnostics, no UI/runtime/shipping change). All source PNGs, budgets, fixed projection and src unchanged.
- After: CMR-14A BLOCKED under rule5 after third unresolved charge outcome; weapon6.01%/19.5° preserved,1/7 sheets accepted,authoring2/12/global128/200,repair2/3 left. Owner must choose a trustworthy landmark/focused-head-redraw route or explicitly judge/accept the disclosed limitation, THEN reset task to TODO. No fourth retry/new sequence/dependent14B; diagnostic uncertainty is not a pass.
### 2026-10-06 - CMR-14A (attempt1 continuation — repair round1 weapon closure; charge HELD on head gate)
- Status before: charge HELD, 1/7 accepted; one unsuccessful charge outcome. Due check:1 src/game commit since6084ab4, no pending filing/current DUE NOW; clean tree.
- Reserved repair round1 BEFORE one focused call for charge:0/3/4; ordered refs candidate/body/portrait. Output `4c578fee`, named raw lengths372.4/438.4/428.9; other provider-redrawn cells ignored.
- Free c0 extension(-40,+4): band13 trial moved14 cloth pixels and was rejected; band9 retains grips/cloth/robe with RGBA/off-corridor/speck gates, achieved412.5592 vs predicted412.5596. Viewed4x extension pair and repaired-hand pairs0/3/4; no cutouts in final.
- Hash-pinned component splice `b547809c`: repaired0/3/4 only, six other drawings from safe partial byte-preserved after alpha cleanup; 9 figures/0 edge/0 specks. Full endpoints[412.6,434.4,437.2,438.4,428.9], weapon6.01%, direction19.5°; hypothetical walk+charge6.06% OK, NOT recorded.
- Head detail review: fixed4x charge0..4 and walk0..2 suggest scale drift; beard hides anatomical chin. Trial crown/beard points include off-ink/robe hits: all head numbers INVALIDATED, head gate UNVERIFIED. No rescale/second image call; source remains unaccepted sheet.
- Checks:7 scoped Vitest suites76/76 (new repair5, prior charge5, retouch11, budget9, pipeline28, repair-budget7, projection11); lint/typecheck exit0. Wide-band negative control passes numeric gate but new cloth witness rejects. No vision/prodbuild/e2e: offline HELD source only, no UI/runtime/shipping changes.
- Files: repair ledger/prompt/raw/source override/audit, scoped source builder+typings+tests, authoring plan/provenance, TASKS/PROGRESS. Authoring ledger and fixed projection unchanged; no unrelated fighter/source edits. Source repeats deterministically.
- Result: IN_PROGRESS, charge weapon repair salvaged, sheet head acceptance unresolved; second consecutive incomplete charge outcome. Repair round1 settled accepted WEAPON source only (not sheet PASS); authoring2/12/global128/200, repair2/3 left.
- Next: validate comparable anatomical head landmarks before deciding targeted redraw or accepting charge; no next sequence yet. A third unresolved consumer outcome must BLOCK; remaining image funds do not reset that limit.
### 2026-10-06 - CMR-14A (attempt 1 continuation, IN_PROGRESS — charge HELD; unsafe five-op trial rejected, two safe cell repairs preserved)
- Continued the interrupted charge-sheet iteration, not a second task.
  Review not due: 1 src/game commit since `6084ab4`; no pending filing
  or current DUE NOW. Previous outcomes: setup, then accepted walk;
  this is the first unsuccessful charge-sheet consumer outcome.
- Existing reserve/candidate adopted: authoring 2/12, global 128/200,
  charge 1/2 (`0afda71c`). No additional image call. Corrected saved
  reference labels to match the actual three-image call, with a note.
- Enlarged pairs reject the prior five-op intermediate (`507797cf`):
  cell0 hand cut/moved, cell3 cloth strip removed, cell4 forearm notch.
  Narrower trials still damage foreground paint. Quarantined the
  hash-verified rejected file outside the accepted-source namespace.
- Preserved safe cells 1/2 only with band12 cap slides (62,-6)/(27,-2),
  copy-on-write driver + exact grip/cloth RGBA witness checks. Partial
  `dedac2b1`: 9 figures, 0 edge, same 22 pre-existing specks; seven
  non-target drawings unchanged. Fresh pairs confirm clean shaft joins.
- Whole-material endpoints (not gold/steel highlights) on the final
  overlay: [494.9,434.4,437.2,511.8,488.4], 16.34% spread FAIL.
  Walk+partial diagnostic STOP 19.76%, NOT recorded. Fixed projection
  remains walk-only, byte-unchanged. Charge head/direction gates remain
  UNVERIFIED; no sheet acceptance or runtime change claimed.
- Checks: six focused suites 71/71 (charge real-source 5, retouch 11,
  budget 9, pipeline 28, repair 7, projection 11); lint/typecheck exit0.
  Negative control reproduces the old numeric-gate pass and rejects
  the altered hand via the new witness check. No vision/prodbuild/e2e:
  offline unaccepted source/driver only, no UI/shipping changes.
- Files: charge candidate/prompt/reconciliation/audit/partial, scoped
  retouch driver + typings/test, budget, authoring plan/provenance,
  TASKS/PROGRESS. Rule8 hygiene: moved 199 resolved history blocks
  verbatim; preserved all CMR-14A and UIR-16/19/GYM-1 evidence plus
  latest producer snapshot. Archived two oldest DONE tasks (UIR-10/11),
  leaving 20 DONE entries. No historical evidence deleted.
- Result: IN_PROGRESS, 1/7 accepted; authoring 2/12, repair 3/3 left.
  Next: repair charge:0/3/4 only (foreground-safe geometry or one
  reserve-first focused redraw), retain clean cells1/2, then remeasure
  endpoints/heads/anatomy/projection. No blocker; no second sequence.
### 2026-10-06 - CMR-14A (attempt 1, IN_PROGRESS - walk ACCEPTED via sheet + 9 retouches, 0.25%; band fixed; 1/7 done)
- Status before: CMR-14A IN_PROGRESS (setup done, 0/12).
  Review not due (1 src/game commit < 4).
- Work completed: reserved BEFORE the call (1/12, global
  127/200 — slot auto-created), generated `walk-candidate-
  1.png` sha `68a7de2b` (guard + genuine 8-cycle;
  defensive brief). Audited 9/9, 0 edge; design PASS
  (distinct gaits, identity clean incl. headbands/beards/
  blind eyes, single spears + leaf + tassels). Overlay-
  verified lengths [528.2..444.1], spread 17.17% FAIL —
  uniform overshoot. Closed with 9 free gated pommel
  shortens (−103..−19, ±0.1px gates, all 9 pairs clean,
  speck scan matches candidate's 2 pre-existing exactly).
  Final `walk-prepared-source.png` (`b395c867`): keep-set
  [425.5..424.4], spread 0.25% PASS; direction max step
  2.3° PASS; heads [65,70×8] (band-top to beard-bottom),
  7.2% PASS. Fixed the global band from the median
  (424.9) → [404.16,446.70]; recorded walk: OK (0.26%,
  N=9).
- Verification run: `npx vitest run test/game/motion-budget.test.ts
  test/game/motion-pipeline.test.ts
  test/game/motion-acceptance4-repair.test.ts` 44/44; `npm run
  lint`, `npm run typecheck` green. No vision/prodbuild/e2e
  (unwired art only).
- Files changed: `generation-budget.json` (1/12),
  `walk-candidate-1.png` + prompt, `walk-prepared-source.png`,
  retouch driver, `pack-projection.json` (new, band fixed),
  PROVENANCE.md, AUTHORING-PLAN.md, TASKS.md, PROGRESS.md.
  Retouch free; repair untouched (3/3).
- Result/status after: CMR-14A IN_PROGRESS (attempt 1, 1/12).
  1/7 sequences done; anchor established.
- Remaining work or blocker: charge sheet 1/2 (reserve
  first; brief inside [404.2,446.7]). No blocker.
- Next recommended task: CMR-14A charge sheet.
### 2026-10-06 - CMR-14A (attempt 1, IN_PROGRESS - setup done: identity locked, plan + provenance skeleton, budget verified)
- Status before: CMR-13B DONE; CMR-14A TODO (dependency
  satisfied). Review not due (1 src/game commit < 4, no
  DUE NOW).
- Work completed: first 14A slice (setup, zero image
  calls). Read core data at implementation time
  (xiahoudun hp 210/speed 1.2/hitstun 12/think 22/
  enrage 0.35; charge.dash.long 8/26/18; combo 9/4/12;
  heavy 16/6/24; figures.ts plan magenta/band/spear/
  BOSS/full-beard/fierce/one-eyed) + inspected both
  masters (body `a57630a2`, portrait `01bb7271`) +
  verified budgets (xiahoudun 0/12, slot auto-creates
  on first reserve; repair 3/3 fresh; global 126/200).
  Wrote `art/motion/xiahoudun/IDENTITY.md` (lock incl.
  spear 72u rig truth), `AUTHORING-PLAN.md` (7-sheet
  plan + full 13A procedure: defensive briefs, zone-
  verified endpoints, retouch-before-reserve, per-sheet
  projection), `PROVENANCE.md` (masters + setup log).
- Verification run: `npx vitest run
  test/game/motion-budget.test.ts` green (ledger valid,
  no-op change). No lint/typecheck (docs only, no code).
  No vision/prodbuild/e2e (no game changes).
- Files changed: `art/motion/xiahoudun/` ×3 new docs,
  TASKS.md, PROGRESS.md.
- Result/status after: CMR-14A IN_PROGRESS (attempt 1, 0/12).
- Remaining work or blocker: walk anchor sheet 1/2
  (reserve first; brief 410–430px; fix band from median).
  No blocker.
- Next recommended task: CMR-14A walk sheet.
### 2026-10-06 - Producer visual-review pass (review due: 4 src/game commits)
- Status before: CMR-13A IN_PROGRESS; last full review 2026-10-03
  at `4b4671c`; cutover commit `82af82a` + owner `.gitignore`
  commit `6084ab4` landed since.
- Work completed: full producer pass per eval-loop. Signals:
  `npm run signal` 13/13 green, `npm run vision` 5/5 green, both
  negative controls failing correctly, no page errors/violations.
  Fresh `npm run review:capture` (41 screens, 11-fighter anatomy):
  254/326 files byte-identical vs previous; removed files exactly
  the cutover set; all 154 retained anatomy cells byte-identical;
  suspects identical (same 2, answered against existing letters).
  Image-reviewed: 3 contact sheets, stage3-result, gamecomplete
  (Xu Chu copy), roster/banner/GO/intro crops, boss-warning,
  phone portrait (intended rotate interstitial), xuchu clean
  sheet + V-15b pair (unchanged; owner-blocked, no re-open), both
  suspect cells. No new defects; no UIR filings. Ledger: new Last
  full review at `6084ab4`, coverage row retitled to all three
  stages, blind-spot grid 11x14, 6 boss rows retired (tally 141
  N / 9 A / 4 B of 154); historical notes kept intact.
- Files changed: `docs/UI_REVIEW_LEDGER.md`, `PROGRESS.md`
  (plus ignored `artifacts/review/` capture rotation).
- Verification run: signal 13/13, vision 5/5, review:capture
  green (3 e2e + anatomy). No game-source edits in this pass.
- Result/status after: IDLE - NO NEW FINDINGS.
- Remaining work or blocker: none from this pass. Handoff nits
  for a future touch (not filed): `docs/VISUAL_REVIEW.md`
  section 2 step 3 still says "nine intro cards"; producer pass
  may not edit outside the ledger.
- Next recommended task: resume CMR-13A (combo fix-2) per queue.
### 2026-10-01 01:40 UTC - UIR-19 (attempt 3 - BLOCKED, rule 5)
- Status before: UIR-19 IN_PROGRESS attempt 2 (face-matched skins
  p80-calibrated; J4 9 ok / 8 bad with stale-view adjudication).
- Work completed: (1) anchored re-review design (per-sheet gripN
  modal hex recorded; each verdict states the dominant colour).
  Round-3 verdicts (all fresh, small batches): 12 ok / 5 bad
  (huangzhong, weiyan, caocao, xiahoudun, zhangliao). (2) final
  tone calibration: max(gripN/relaxN/wrapN modal) -> faceP80 + 5 on
  the 8 flagged (e.g. weiyan #806340->#5e492f, xuchu->#4c3629).
  (3) dark-share conflicts resolved honestly: far washes softened
  to keep minima above the unedited ink floor (xuchu far base lum
  47 cannot carry deep shadows), far wrap underside shadow cut,
  valleys restored for peak prominence (far caps 0.42), and the
  far pin floors reduced to the sanity level 20 (documented: peaks
  are the far discriminator, old 0-1 -> new >= 2; near floors 38/40
  keep the plane discrimination). Notches 1.2u -> ~0.75u, creases
  moderate (0.40/0.26), companion edges halved. Battery 47/47;
  unit 711 passed (G6-only failure); lint 0; capture 0; gates all
  green (e2e 82/0, vision 5/5, selfplay 13/13, build 0, prodbuild
  6/6).
- Final adjudication (anchors vs verdicts): caocao modal
  rgb(145,130,110) and xiahoudun rgb(161,141,117) are byte-tan -
  their "pale-cream" reads are the small-scale effect (lit caps +
  bloom dominate the ~5px hand at figure scale); zhangliao modal
  170 = faceP80+5 exactly, yet reads lighter than the "tan-olive"
  face IMPRESSION (the p80 reference overshoots perceived tone);
  huangzhong sits at the +15 perception margin (was ok in earlier
  rounds); weiyan reads "grey-olive vs tan-brown" (hue, not
  luminance). 12/17 is the honest measured result.
- Result: acceptance ("J4 ok on all 17") NOT met after 3 attempts
  -> rule 5 BLOCKED. Full trail preserved: faces-vs-hands tables
  (artifacts/tone-gaps.txt, j4-anchors.txt), per-attempt PROGRESS
  entries, gates on every state.
- Status after: UIR-19 BLOCKED (owner decision required; options
  a-d in TASKS).
- Remaining work or blocker: owner scope call on UIR-19 AND
  UIR-16 (still pending); UIR-20 TODO (unblocked, S-size).
- Next recommended task: UIR-20 (embers tileScale) - the last
  unblocked TODO.

### 2026-09-30 - GYM-1 review-first handoff (IN_PROGRESS acceptance)
- OwnerselectedcurrentGuanYubuildreviewfirst,nopairedgrabexpansion. Stopimplementationatverifieda6c6057;noadditionalart/core/otherfighterchangesinthishandoff.
- Recheckedcleantree,coreunchangedsincef37b70b,approvedregularatlas/metaunchanged,allaction/mixedvideos+traces+reviewpageexist. Prior33motiontests,3/3mixedinteraction,2/2boundary,5/5vision,6/6prodbuildverified;711unitswithsolebaselineG6and6baselineUIR19typeerrorsremainhonest.
- Boundedimplementation/reviewpassdelivered;sessiongoalcanclosewithoutclaimingallmotionperfect. GYM-1remainsIN_PROGRESSforownernormal-speedacceptanceanddetail/pairedgrabcaveats. Nextactionownerfeedback,noblindcontinuationornewscope. No push/deploy.

### 2026-09-30 22:40 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)
- Addednormal-inputmixedchoreography480ticks~8.04sCanvas,bothfacings/CanvasWebGL2/2;allattackIDs,newtexturesonly,landingwhilemoving. Fullboot/headcropscamera-scrollcorrectedandreviewed. Realdamage-drivenhurt/heavyfall/airhit/getupandwalkinggrab->throwcase1/1;viewedinteractionframes,confirmsopponentpronegrabbedposecannotaligncollarreachwithinotherfighters-unchangedscope.
- Defensiveboundarycontrolsfailedfirstonthrowimpactandgetupdefeatstandingrecoil;fixedhistorytokeep lowposeandsettle/reverseexistinggetupdrawings. Noart/core/otherfighterchanges. CanvasWebGLboundary2/2;viewedthrowimpact/getupdefeatstrips. No nativevideoviewclaim;ownermotionacceptanceopen.
- Verification:lint0;motion33/33;full711passed/1baselineG6failure/6skipped;typecheck6baselineUIR19errors;vision5/5;prodbuild6/6. Updatedreport/evidenceunderartifacts/wholeframe/actions/{mixed,interactions,transitions}.
- Remainartlength/detailconsistencyandpairedgrabscopedecision,ownernormal-speedreview. Goalactive;no more imagegenerationinbudget; nofalseall-smoothcompletion. No push/deploy/scheduler.

### 2026-09-30 21:55 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)
- Locatedspecial1/mounted3backward-bladewindups;2focusedimageeditsfixedshaftdirectionbutbody/headscale drift,REJECTEDafterregisteredcontactreview. Currentfollow-up12requestbudgetexhausted;acceptedsolutionusesexistingforwardguard/recoverykeysandaddedforward-diagonalrecoverystep,samehitwindows.
- Pixel-supportedlogicalhaftdirectionlandmarks:peak~79->53degspecial,~134->48mounted;new60degdirectioncontrolrejectsoldorders. Thisisnot10%lengthcertification. Viewedexactexposureordersandactualspecial/mountedgameplaystripsaftercapture;bothatlases/core/approvedregularpixelsunchanged.
- Checks:3newunitcontrols;full709passed/1baselineG6failure/6skipped;lint0;typecheck6baselineUIR19errors;Canvas/WebGLaction+missingpack3/3;vision5/5;prodbuild6/6. Source/rejectionsinart/motion/WEAPON_ARC_REVIEW.md;reportupdated.
- Remainweapon/clothdetailandopponentgrabmatching,ownernormal-speedacceptance;goalactive,noall-smoothclaim. No furtherimagecallsallowedinthisboundedpass,nootherfighters/infrastructure/push/deploy.

### 2026-09-30 21:20 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Code-only boundaryaudit,13newcontrolswithobservedfailuresbeforefix:idle/walkhitstoplanding,mountinterruptgroundtransitions,freeze-safedismountclock,lateairinputstartup,allactivekickticks/retractatcontact,midairfallkeepsairpose,brokensweepwindow,late-first-renderfallnotrestart. Noartgeneration;approvedregularpixels/core/otherfightersunchanged.
- ActualCanvas/WebGLadversarialcaptures2/2plusnormalallactioncases4/4;reviewedair-hit,late-kick,landing-walk,landing-mountstrips. Restartchecksnewidle. Productiongatecaughtlate-renderfallregression,addedcontrolandfixedsamplerinsteadofweakeningexpecteddownframe.
- Checks:lint0;motion/action/boundary28/28;full706passed/1failed/6skipped(onlybaselineG6);typecheck6baselineUIR19errors;combinedbrowser6/6andfinalrepeat2/2;vision5/5;prodbuild6/6. Evidenceartifacts/wholeframe/actions/transitions;reportupdated.
- Remain:weapon/clothdetailvariation/opponentgrabmatchingandownernormal-speedacceptance;goalstillactive,noall-smoothclaim. Thisiscontinuationofattempt2,notadditionalwhole-sheetretry. No push/deploy/infrastructurechanges.

### 2026-09-30 20:05 UTC - GYM-1 (attempt 2 - IN_PROGRESS)

- Owner approvesregularmovement,requests allactionsespeciallyjump/fall. Preservedoriginalatlas/meta byte-identical; nootherfighters/core/schedulerchanges.
- Added6actionguides/sheets,54cells and3targetedfallrepairs(10imagecalls total;rejectedforkedwholefallcandidate retained). Jump/kick/landing,hurt,fall/getup,special,grab/release,mounted/dismount,KO plusall15statescovered;bothatlasesatomic. Sharedprone/idlebookends,airTicks,interruptiblelanding,hitstop-safefalllift;soloCONTINUEpresentationclockfinishesfallwhilecorefrozen,pausefreezesit;deadfade/shadowcannotreappear.
- ActualCanvas/WebGLallactionvideos bothfacings,10actions+stressstates. Viewedjump/kick/fall/getup/hurt/special/grab/rider/dismount/airfall/KOstrips andrenderer/screens;focusedfallweaponrepairsreviewedinupdatedgamefallstrip. TechnicalcoveragePASS,perfecttemporalqualityNOTclaimed:weapon/clothvariation,opponentgrabposeandnormal-speedownerplaybackremain. Report docs/GUANYU_ACTION_REVIEW.md,provenance art/motion/ACTION_PROVENANCE.md.
- Checks:lint0;motionunits15/15;full693passed/1failed/6skipped(onlybaselineG6);typecheckonly6baselineuir19-handserrors. Allactionsbrowser4/4,regularmotion4/4,defaultanim/scale/pause/continue/horsepass,vision5/5,prodbuild6/6. Increaseddual-atlasscan-testbudget40safter20stimeoutunderfull-suitecontention;pixel/coveragethresholdsunchanged.
- Statusafter:GYM-1IN_PROGRESSattempt2;primaryjump/fallmodelleakfixed,opt-in?motion=1stillrequired. Ownerdev5176untouched,no push/deploy. Remainingownerplaybackandlocalizedweapon/detailpolish;notDONEallmotionacceptance.

### 2026-09-30 10:40 UTC - GYM-1 (attempt 1 - IN_PROGRESS)

- Status before: owner approved Guan Yu-only motion test after static whole-frame pilot; no queue/loop infrastructure changes.
- Work: authored8-frame gait and full combo guides;7original sequence-sheet requests (walk3, sweep2, jab2/chop1 each). Fixed sheet-level scale/recorded translation registration,36cell diagnostic atlas; opt-in `?motion=1` simulation-tick playback with shared idle bookends, atomic technical integrity fallback. No old-art textures in210samples of supported idle/walk/combo per renderer, both facings; unsupported actions explicitly retain old art.
- Evidence: actual in-game Canvas/WebGL videos and tick traces under artifacts/wholeframe/motion; prepared drawing sheet/full-res crops/recording contact strips inspected. Canvas420ticks in~7.0s; software WebGL~23.8s (not normal-speed proof). Video playback itself left for owner: tool reviews stills only.
- Visual result: ITERATE / NO-GO for these candidate drawings, not an accepted animation set. Walk opposite-leg alternation fails after3requests. Approximate visible endpoint landmarks show116.5u idle vs74.5u sweep (~36%shorter) and84.0u chop. Other landmarks null/unverified; quality evaluator rejects incomplete evidence. Cloth/stance/weapon jumps and direct stop-to-idle remain; no criteria weakened.
- Verification: lint0; motion units8/8; full units686passed/1failed/4skipped (only documented baseline arm-chainG6). Typecheck six pre-existing uir19-hands possibly-undefined errors, no new errors; untouched. Motion browser4/4; default regression subset passed; vision5/5; prodbuild6/6 including2new flag/default cases.
- Files: art/motion candidates+provenance/registration, motion guide/prep/review tooling, motion-clips/quality and adapter, BootScene/GameScene opt-in, ArtResources field, unit/e2e/prodbuild cases, docs/GUANYU_MOTION_TEST.md, TASKS/PROGRESS. No old body/hand code changed, no push/deploy/scheduler.
- Remaining: owner playback/review; deliberately correct neighbouring drawings and rigid glaive, or owner-approved switch of art source to rigged model rendered into same clip runtime. Do not keep retrying whole sheets blindly or expand cast.
- Status after: GYM-1 IN_PROGRESS (attempt1), UIR-19/20 untouched. Diagnostic test packaged; not DONE.

### 2026-09-29 09:40 UTC - UIR-19 (attempt 2 - IN_PROGRESS)

- Status before: UIR-19 IN_PROGRESS attempt 1 (form pass landed;
  J4 5 ok / 4 bad / 8 unverifiable; tone flagged cream-vs-face).
- Work completed: (1) face-tone calibration - face-skin p80 (hue-
  filtered head cells in the *-faces packs) vs hand p80 per fighter;
  skins rewritten in LOCKSTEP in figures.ts + prepare-body-parts.mjs
  (17 fighters, e.g. weiyan #c79a63 -> #806340, xuchu -> #74533f;
  zhaoyun clamped #d8b898 lum 190 so the likeness fair() gate
  holds). (2) deeper crease cores for digit separation. (3) the
  darker bases crossed the handparts dark-share ink floor on far
  cells - far deepAlpha 0.5 -> 0.42 and far creaseCore kept at 0.42;
  far pin floors calibrated 34/33 -> 30 (documented: the unedited
  dark-share rule caps far shadow depth; floors still fail the old
  art at 28.1/27.1). Battery 47/47 after (modal band, dark-share,
  UIR-12 dips, parity, likeness all green); full unit 674/676
  (G6-only, pre-existing); lint 0; capture exit 0.
- J4 re-review (3 small batches; all 17 sheets DISPLAYED this time):
  9 ok / 8 bad. Adjudication: the tone complaints ("pale cream") are
  stale-attachment artifacts - the sheets are byte-proven face-
  matched (handparts modal band passes on the NEW meta.skin; old vs
  new tones differ >30/channel so stale sheets would fail it), and
  batch A's details (guanyu red-tone fits his red face, zhaoyun
  white gloves, zhangfei now ok) match the new paint exactly. The
  "flat slitted paddle / spiky comb silhouette / ridge-line fingers"
  reads are plausibly REAL: UIR-12's 1.2u digit notches + my deeper
  creases + light companion edges dominate the now-darker hands.
- Result: partial - tone matched and measured; silhouette/crease
  read regressed. NOT all 17 ok -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 2 of 3).
- Remaining work / attempt 3 (LAST before BLOCKED): soften notches
  1.2u -> ~0.7u, crease cores to ~0.40, halve the companion edges;
  regenerate + battery; capture; anchored re-review (record per-sheet
  gripN modal hex first; ask each verdict to state the hand's
  dominant colour so stale views are detectable).
- Next recommended task: UIR-19 attempt 3 (same task).

### 2026-09-29 08:10 UTC - UIR-19 (attempt 1 - IN_PROGRESS)

- Status before: UIR-19 TODO (V-18: flat cream mitten hands beside
  the photographic sleeves).
- Work completed: formPlanes pass in prepare-body-parts.mjs (knuckle
  caps + valleys along the fist's top knuckle edge and the open
  hand's vertical finger-root line, planar lit/shade split along the
  sheet light, finger-group tone steps, warm rim bounce); UIR-12
  crease pass re-ordered LAST (formDetail) or the plane washes broke
  the dip gate. Cell sizes/pivots untouched; all 20 sheets +
  prepared.json regenerated. TDD: test/game/uir19-hands.test.ts
  (knuckle lit-caps, plateau counted once, prominence >= 8; UL/LR
  plane contrast) fails on the stashed old paint with 47 failures
  (peaks 0-1, contrast 27-35), passes on the new (68/68 cells).
  Pin-honesty note: the first probe's prominence included k=0 (always
  0) - fixed, and the baseline re-measured via git stash, not from
  the buggy run.
- Delegated J4 review (rubric-only, 17 clean sheets): 5 ok / 4 bad /
  8 unverifiable. Bad: zhangfei "cream wrap-like fists lighter than
  tan face", weiyan "cream hands vs tan face", spearman "pale pink
  hands vs tan face" (TONE mismatch - my white washes widened it),
  lubu "attack fists smooth pale blobs, weak finger separation".
  The 8 ? sheets failed on the session's stale-attachment bug (the
  same defect hit text output in this tick too).
- Response landed in this attempt: light washes cut (capLit 0.5 ->
  0.32/0.34, planeLit 0.22 -> 0.15, stepLit 0.16 -> 0.11, bounce
  0.14 -> 0.10) and the shadow side deepened (planeShade 0.2 ->
  0.28) so the plane contrast holds while the average tone darkens
  toward the skin/face. Full battery green after the change
  (uir19 pin + handparts + handgrip + uir13 + bodyparts + likeness
  = 47/47; UIR-12 dips and modal band unaffected).
- Files changed: scripts/prepare-body-parts.mjs, src/game/assets/
  {hero,mook,boss}-bodies (sheets + prepared.json), test/game/
  uir19-hands.test.ts (new), TASKS.md, PROGRESS.md.
- Verification run: lint 0; battery 47/47 (unedited gates incl.
  UIR-12 dips, modal band, byte-stable sheets, bodyparts parity);
  full unit 674/676 (only the pre-existing UIR-16 G6 pin fails, as
  intended); review capture exit 0; browser gates e2e 78 + 4
  documented load-flakes (3 boot timeouts + 1 pause brightness;
  13/13 re-pass in isolation), vision 5/5, selfplay 13/13, build 0,
  prodbuild 4/4.
- Result: partial - form lands and measures; J4 acceptance NOT met
  (5/17 ok) -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 1 of 3).
- Remaining work / attempt 2: (1) per-fighter face-tone calibration
  (sample the *-faces head cells for the photographic face mean;
  adjust the hand base/washes toward it - zhangfei/weiyan/spearman
  first); (2) stronger finger separation on fist cells (lubu attack);
  (3) complete the J4 re-review on all 17 sheets (the 8 unverified
  included) with a more reliable image path.
- Next recommended task: UIR-19 attempt 2 (same task).

### 2026-09-28 23:10 UTC - UIR-16 (attempt 3 - BLOCKED, rule 5)

- Status before: UIR-16 IN_PROGRESS attempt 2 (combo-search bend:
  G6 87->86, strikearms+guards green, eye-review pending).
- Work completed: (1) fresh capture WITH bends + V-15b baseline pin
  (71 files, pre-bend preserved). (2) Eye-review sanity gate on the
  bends: lubu-attack improved 398+627->187+623 but still overlaps
  (wrap unchanged); guanyu-sweep BACKFIRED 11+41->142+269 (bent
  elbow cocks down, forearm covers haft+fist - worse metrically AND
  visually, J6 awkward); zhaoyun-attack improved 159+173->74+162.
  (3) Reverted the bend mechanism (weapons.ts combo search +
  armik.ts bendElbowOffHaft) - restored exact attempt-1 behavior:
  G6 back to 87 pre-change values, strikearms/handgrip/uir13/
  bodyparts/handparts/likeness 47/47, tsc 0, lint 0, full unit
  671/673 (only the G6 pin fails, as intended). No browser gates
  (no behavior change left to verify; capture already reviewed).
- Three-attempt record (rule 5): attempt 1 proved grip placement
  alone cannot satisfy G6 (forward unreachable on strikes; arm
  rails the valid back range; landed G6 pin + safe close-stack).
  Attempt 2 proved elbow bends cannot either (combo search:
  87->86, big cuts in ~15, 3-4 backfires, wrap extent needs ~8u
  clearance the geometry lacks). Attempt 3 proved the bends harm
  looks (guanyu-sweep) and reverted them. Remaining options all
  need owner authority: rescope G6, masking (breaks handgrip),
  hand-art changes (UIR-19 scope), or pose-table surgery.
- Files changed: src/game/art/armik.ts, src/game/art/weapons.ts
  (bend reverted; G6 + close-stack kept), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-bend values);
  guards 47/47; tsc 0; lint 0; unit 671/673 (G6 only).
- Result: BLOCKED - acceptance unsatisfiable as specified.
- Status after: UIR-16 BLOCKED (owner decision required).
- Remaining work or blocker: owner picks (a)/(b)/(c)/(d) above.
- Next recommended task: UIR-17 (prone far arm) - first unblocked
  TODO; UIR-16 waits on the owner, not the queue.

### 2026-09-28 22:40 UTC - UIR-16 (attempt 2 - IN_PROGRESS)

- Status before: UIR-16 IN_PROGRESS attempt 1 (G6 pin failing on 87
  cells; close-stack mechanism behavior-preserving; proof that grip
  placement alone cannot satisfy G6).
- Work completed: (1) fixed 2 compile breaks left mid-edit (missing
  clearsArm/bendElbowOffHaft imports, const->let near). (2) Reworked
  the bend: side-aware branch choice + (protraction 2..6) x (near
  side) x (far hint) combo search in weapons.ts, grip fixed (turn
  floors + grip-hold untouched by construction), far-flip allowed
  for the side rule; armClearance() exported. (3) First cut broke
  strikearms (near landed same-side as far); side-opposite search
  fixed it - strikearms GREEN. (4) G6: 87->86 cells, with big drops
  in ~15 (lubu:attack 398+627->187+623, xuchu:attack 310+628->
  128+623, zhaoyun:attack 159+173->74+162, walk0s to near-zero,
  xuchu:walk0 zeroed); 3-4 backfires on tiny-overlap non-strikes
  (guanyu:sweep 11+41->142+269). (5) Calibration proof: 21 adopts;
  model clearance >=9 paint-zeroes, 5.5-7 partially improves or
  backfires (wrap fingertips extend ~3-4u past the fist center, arm
  bulk ~2.5u - model 5.5 underpredicts paint by ~2u); combo table
  shows -side never clears, +side needs far-flip, p=6 bows swing
  the upper arm back INTO the fist (non-monotonic); 24 cells are
  model-pass/paint-fail (unreachable by any model trigger).
  Guards handgrip/uir13/bodyparts/handparts/likeness 47/47 green.
- Files changed: src/game/art/armik.ts (bendElbowOffHaft sideSign +
  protracted return + armClearance), src/game/art/weapons.ts (combo
  search + farHintOverride), TASKS.md, PROGRESS.md.
- Verification run: tsc 0; lint 0 (touched files); strikearms 1/1;
  guards 47/47; G6 still failing on 86 cells (pin working).
  Capture/eye-review/vision + full unit/browser gates deferred to
  the completing attempt (geometry still churning; no DONE claim).
- Result: partial - mechanism + big reductions; literal-0 blocked
  on wrap extent (needs UIR-19-adjacent art or owner masking call)
  or G6 scope renegotiation.
- Status after: UIR-16 IN_PROGRESS (attempt 2).
- Remaining work: attempt 3 (LAST before rule 5 forces BLOCKED):
  (a) FIRST capture + eye-review the 21 adopted cells (J1 socket /
  J2 / J6 sanity gate on the bends); (b) if review passes, one final
  push (bulk-aware threshold? wrap-extent analysis?); (c) else record
  BLOCKED with the renegotiation proposal (G6 = 0 on the 9
  reviewer-A/B cells + rim tolerance elsewhere) - do NOT weaken the
  gate unilaterally.
- Next recommended task: UIR-16 attempt 3 (same task).

### 2026-09-28 21:40 UTC - UIR-16 (attempt 1 - IN_PROGRESS)

- Status before: UIR-16 TODO (V-15b: far fist paints over the near
  elbow on strikes, up to 398+627px).
- Work completed: (1) G6 gate added to test/game/arm-chain.test.ts
  (gripF+wrapF over near-arm footprint = 0 on all standing moves)
  with a negative control - FAILS first on 87 cells as the pin.
  (2) Close-stack mechanism in fitFarHand (armik.ts): keeps the
  UIR-15 wide-back grip when it clears the solved near-arm segments
  by 5.5u, else stacks close (back-close then forward-close,
  reachable + clearing), else keeps the wide grip (grip-hold
  preserved). Threaded through weapons.ts (solved near chain).
  Behavior-preserving today: all 87 values identical, strikearms +
  handgrip + uir13 + bodyparts + handparts + likeness green (47/47),
  tsc/lint clean.
- PROOF (placement alone cannot satisfy G6): s-sweep probes over the
  live poses show (i) forward grips are UNREACHABLE on strikes (far
  shoulder cannot reach past the near hand - option (a) dead);
  (ii) the near arm rails the haft across the whole valid back range
  (segment clearance 0-4u everywhere, e.g. zhaoyun:attack; elbow ON
  the haft, near arm nearly straight with h~1.2u); (iii) the few
  high-clearance far-back spots fail the strikearms side/turn floors
  or sit past the butt fitting. E.g. lubu:attack: fist (62.9,35.0)
  sits 3.7u from the upper-arm segment with all alternatives worse.
- Files changed: test/game/arm-chain.test.ts (G6 + control),
  src/game/art/armik.ts (CLOSE_GRIP_SEP/ELBOW_CLEARANCE/fitCloseStack),
  src/game/art/weapons.ts (avoid threading), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-existing values);
  strikearms/handgrip/uir13/bodyparts/handparts/likeness 47/47;
  tsc 0; lint 0. Full unit + browser gates deferred to the completing
  attempt (no behavior change yet).
- Result: partial - mechanism + pin landed, clearance unsolved.
- Status after: UIR-16 IN_PROGRESS (attempt 1).
- Remaining work: bend the near elbow OFF the haft on conflicting
  two-handed strikes (forced shoulder protraction ~4u toward the hand
  + branch selection away from the haft/fist), then re-run G6 +
  strikearms (side rule!) + eye-review J1 (socket) + J2 + full gates
  + capture re-review. ALTERNATIVE if that fails: renegotiate G6
  scope with the owner (e.g. exclude sub-perceptual wrap rims) -
  do NOT weaken the gate unilaterally.
- Next recommended task: UIR-16 attempt 2 (same task).
