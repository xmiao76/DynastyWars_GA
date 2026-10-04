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
  edits before corrections. Walk/jab1/jab2/finisher/special v2
  whole sheets used requests 11/12/14/16/17; focused corrections
  13/26 (jab1:1/2) and 15/26 (jab2:2/3) produced source-
  preserving prepared sheets. Finisher culls [2,5,7,8] and plays
  [0,1,3,6,4] (source-length spread 9.5146%); special culls
  [2,5,6,7] and plays [0,1,8,3,4] (5.6611%). Jab2 9.9534%
  remains marginal; cross-sequence acceptance unverified.
  Five whole-sheet sequences remain; nine authoring requests
  available (5 planned + 4 spare maximum). Walk/jab1/jab2/
  finisher/special whole-sheet slots consumed; separate acceptance-
  4 repair reserve 3/3 untouched.
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
