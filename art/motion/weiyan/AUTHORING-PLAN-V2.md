# Wei Yan v2 re-brief plan (owner "Do A", 2026-10-04)

Supersedes the weapon content of AUTHORING-PLAN.md (v1: ten sheets,
wrong weapon - see IDENTITY.md CORRECTION + v2 SPEC). Everything else in
that plan (3x3 1536x1024, play-order keep maps, page-aware solving,
reserve-before-call, carried learnings) still applies.

## Budget (durable ledger, owner-extended)

- weiyan cap 16 -> 26 (+10), used 10 at the extension, NOT reset.
  Global 200 and the two-whole-sheets-per-sequence rule unchanged:
  each sequence holds exactly one v1 candidate, so each gets exactly
  ONE v2 whole-sheet candidate; any further fix is a focused edit.
- v2 plan: 10 sheets = 10 requests -> 20/26, 6 spares for focused
  edits before corrections. Walk/jab1/jab2/finisher/special/jump
  whole sheets used requests 11/12/14/16/17/18; focused edits
  13/26 (jab1:1/2), 15/26 (jab2:2/3) produced accepted source-
  preserving prepared sheets. Focused jump edit 19/26 fixed takeoff0 only (kick3 533px,
  landing5 437px still out); a deterministic authored retouch
  (NO image request, NO ledger event) then extended landing5's
  rear shaft 439→483px (`retouch-weiyan-jump-landing-v2.mjs`:
  axis translation + median wood fill; 5x seam reviewed; the
  other 8 components hash-identical). Jump play order [0,1,2,
  6,4,5], cull [3,7,8]: [477,491,475,506,485,483]px, spread
  6.376% ≤10% source-level PASS (kick = spare6, landing =
  retouched5). Never use still-airborne spare7 as a fake landing.
  Fall whole sheet request 20/26 (poses correct; tumble 438px
  short + DOWN 558px long, no spare fix since DOWN is
  irreplaceable). Focused edit 21/26 under-corrected both cells
  (+22/−9px); preserved unused. Deterministic retouch instead
  (`retouch-weiyan-fall-v2.mjs`, geometric selection + gap gates,
  seams reviewed): tumble 438→485px, DOWN 558→490px; final
  [502,470,485,500,490]px, spread 6.54% ≤10% source-level PASS.
  Lesson: generator ignores explicit pixel-length targets
  (jump 1/3, fall 0/2 full fixes) — prefer retouch when poses
  are right. Getup whole sheet request 22/26, first try; raw
  core 19.8% FAIL (elbow 537 long, crouch 440 short), accepted
  via spare remap [6,1,8,3,4] at 9.32% (cull [0,2,5,7]).
  Misc whole sheet request 23/26, first try; raw core 13.2%
  FAIL (hold 526 long), accepted via spare remap [0,1,2,7,4]
  at 8.29% (cull [3,5,6,8]). Rider whole sheet request 24/26,
  first try; core six ~30% FAIL (sweep 554 long, dismount 406
  short + blade cut at sheet edge, verified). No spare/retouch
  fix: focused edit 25/26 fixed sweep (554→481) and completed
  dismount's blade (450, clear of edge); spliced both, then
  deterministic retouch extended dismount 450→480px. Final
  [512,491,485,516,481,480]px, spread 7.29% ≤10% source-level
  PASS. ALL TEN v2 sequences source-accepted; next is pack
  assembly (prepare script update), measurement, acceptance-4
  and continuity review. One authoring request remains (focused
  ONLY). All whole-sheet slots consumed, repair 3/3 remains
  acceptance-4-only. Cross-sequence acceptance UNVERIFIED.
- Reserve BEFORE every call; record prompt + ordered reference hashes
  + verdict in PROVENANCE.md (v2 attempts are labelled `-v2-`; v1
  files and records are kept untouched as the before).

## Reference order on every v2 call (bracketing)

1. weapon-spec-reference.png (`71c288d1`) - the ONLY weapon authority
2. weiyan-body-master.jpg (`ee0a0200`) - build, robe, turban
3. weiyan-portrait-master.png (`0fc579c1`) - face, beard
4. (after walk-v2 is accepted) the walk-v2 guard cell as the length
   anchor for every later sheet (`artifacts/tmpcheck/weiyan-v2-guard-anchor.png`,
   sha `46546eca…` after standard alpha cleanup; ignored diagnostics,
   regenerate from the committed v2 sheet). It held the 10A rider sheet.
5. (optional, per sequence) the v1 sheet of the SAME sequence as a
   POSE reference only, with the prompt stating its weapon is wrong.
   Used only if the sequence's poses are hard to describe; walk
   does not use it (first sheet, avoid contamination).

## Sequence order (play-critical first)

walk (foundation + ruler) -> jab1 -> jab2 -> finisher -> special ->
jump -> fall -> getup -> misc -> rider. Each: grid-constrained,
9 cells, keep map chosen at review, culls in memory.

## Fit expectations (do NOT presume 16MB)

A spear-length weapon on a stocky figure is exactly the Zhao Yun
situation: v1 (short saber) fit 15.47MB; a ~450px weapon grows the
trims. Plan: solve against the 16MB contract first; if (and only if)
measured bounds prove the contradiction (fit bound and/or page
bytes), raise it as an owner option with numbers like the 10A BLOCKED
turn - never assume an exception.

## Acceptance-4 (v2)

Weapon length: the proven toolchain (dao-true-weiyan.mjs, adapted to
steel blade + haft + ferrule + pommel, tip-to-pommel; dao-comparable
with occlusion-only exclusions - width is NOT an exclusion). Head:
auto cluster stays void (turban/beard); consistency evidence only.
