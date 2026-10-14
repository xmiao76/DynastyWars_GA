# Motion sole-mode migration — authoritative plan

Status: owner-approved plan, Phase 0 (contracts) published 2026-10-14. This
document is the single authority for making motion packs the **only**
character rendering mode. Where an older live document says motion stays
opt-in behind `?motion=1` until a separate owner activation decision, that
decision has now been made in the staged form below; older wording is
superseded prospectively by this plan, and historical records/evidence are
preserved unchanged. Read with the [cast motion rollout](CAST_MOTION_ROLLOUT.md),
whose quality, budget and evidence rules remain in force unless this plan
explicitly supersedes them.

## Goal

Normal play renders every one of the 11 humanoid fighters exclusively from
its accepted motion pack. The legacy paper-doll/rig renderer, the whole-fighter
legacy fallback for missing/corrupt/over-budget packs, and every URL mode
switch are removed in the final slice. A fighter without a valid published
pack is a loud loading error, never a silent legacy substitution.

## Locked decisions

1. **Sole mode is the end state.** No permanent opt-in/opt-out mode, no dual
   renderer, no silent fallback. Legacy deletion happens only in the final
   slice (Phase 5), after the CMR-24 gate passes.
2. **CMR-23 before the flip.** [CMR-23](motion-tasks/CMR-23.md) is the
   pre-flip validation gate (paired grabs/throws plus loading feasibility
   evidence). It must be DONE before any default flip. It remains validation
   work; its acceptance is not rewritten as migration implementation.
3. **CMR-24 is the sole-motion final gate.** [CMR-24](motion-tasks/CMR-24.md)
   now runs in two parts: Part A verifies the default flip at an exact commit
   and must pass **before** legacy deletion; Part B verifies the post-delete
   tree. CMR-24 is DONE only after Part B. No legacy code, test or fallback is
   deleted on the strength of Part A alone failing or being skipped.
4. **Wave-split 12 MiB entry budget.** The existing ≤12 MiB stage-entry
   download cap stays a hard cap, but it is applied **per spawn wave**, not to
   the whole stage roster at once (see Budget below). The cap is never raised
   to make a stage fit.
5. **Retry, then error.** A pack that is missing, corrupt, timed out, over
   budget for its wave, or fails signature/validation gets bounded retries and
   then a visible error that blocks stage entry (or the pending spawn/join).
   It never degrades to legacy art, a partial pack, or old poses inside a new
   pack (see Failure semantics).
6. **Temporary `?motion=0` only until the final slice.** During Phases 3–4
   (default-on, pre-deletion) `?motion=0` is the sole temporary escape hatch to
   the still-present legacy renderer, for diagnosis and rollback only. It is
   removed with the legacy renderer in Phase 5; after that the URL carries no
   rendering-mode switch.
7. **GYM-1 and BODY-7 are closed as obsolete.** The Guan Yu paper-doll pilot
   and the body-overhaul verification sweep targeted the legacy renderer that
   this migration deletes. They are marked DONE in `TASKS.md` explicitly as
   obsolete/superseded by this sole-motion decision; no implementation of
   their original criteria is claimed, and their records/history are preserved.
8. **History is never rewritten.** Archives, task records, action reviews,
   provenance and spent generation-budget rows stay as evidence of the opt-in
   era. Supersession is prospective and is recorded by new notes, not edits to
   old verdicts. Pre-existing unrelated dirty files (e.g. Guan Yu pack work)
   are never staged or reverted by migration slices.

## Current state and blockers

Baseline at Phase 0 publication: all 11 humanoids have accepted packs
integrated opt-in (CMR-06B…CMR-15B DONE); default play is still legacy.
Known blockers, in the order the phases must clear them:

- **Opt-in gate:** `motionEnabled` (`src/game/adapters/motion-art.ts`) returns
  true only for `?motion=1`. The flip inverts this to default-on with the
  temporary `?motion=0` escape (Phase 3), then removes the switch (Phase 5).
- **Silent over-budget legacy:** `stageMotionScope`
  (`src/game/adapters/motion-scope.ts`) currently drops any pack that would
  exceed the single 12 MiB stage-entry budget and renders that kind with
  legacy art. Under sole mode that path must become wave-split scheduling
  plus retry-then-error (Phase 2); a stage/hero combination whose **first
  wave alone** exceeds 12 MiB is a hard blocker to report, not a cap raise.
- **Silent whole-fighter fallback:** missing/corrupt/timed-out packs
  currently retain whole legacy rendering for that fighter (rollout loading
  contract). That behavior is correct for the opt-in era and is replaced by
  retry-then-error in Phase 2; the negative-control tests that prove today's
  fallback must be converted to prove the error path, not deleted early.
- **CMR-23 not yet DONE:** paired grab/throw validation for
  5 heroes × 6 enemy kinds × 2 facings has not run. Nothing flips before it.
- **Legacy-coupled verification:** the documented G6 arm-chain baseline
  failure and the old UIR-19 hand-test errors exercise the paper-doll rig;
  several e2e/prodbuild cases assert off-by-default opt-in behavior. Each is
  re-pointed or retired only in the slice that removes what it tests
  (Phases 3/5), with the baseline exceptions explicitly re-recorded by CMR-24.
  No gate is weakened merely to go green.
- **Evidence pace:** existing captures are stills/injected traces at recorded
  pace; CMR-24 still owes normal-paced real-input/AI clips and the indexed
  owner review. Sole mode does not lower that bar.

## Phases 0–6

Each phase is one or more separately scoped, locally committed consumer
slices under the existing sole-writer loop rules. A phase starts only when
the previous phase's exit evidence exists. No phase pushes, deploys or
changes schedules.

### Phase 0 — Contracts (this document)

Publish this plan; supersede the opt-in-only wording in the live contracts
(`docs/CAST_MOTION_ROLLOUT.md`, CMR-23/CMR-24 specifications and records,
`TASKS.md`, `PROJECT.md`, `.loop/continue.md`, `.loop/tick.md`,
`.loop/eval-loop.md`); restate CMR-23 as the pre-flip validation gate and
CMR-24 as the two-part sole-motion final gate; close GYM-1/BODY-7 as
obsolete; validate that every `Requires` resolves. **No code, art or test
edits. Exit:** live contracts consistently state this sequence; CMR-23 is the
next ready gate.

### Phase 1 — CMR-23 pre-flip validation gate

Execute [CMR-23](motion-tasks/CMR-23.md) as written: exhaustive paired
grab/throw matrix on the motion path, contact/depth/ground criteria,
negative controls, runtime/resource checks — still behind `?motion=1`, no
default change. Its resource evidence must additionally report, per stage
and hero/co-op combination, the per-wave download split at today's pack
sizes, proving (or refuting) that every first wave fits ≤12 MiB.
**Exit:** CMR-23 DONE with evidence, or a concrete BLOCKED naming the exact
pair/wave that fails. A refuted first-wave fit blocks Phase 3 until pack
sizes or wave composition change under a separate owner-visible decision.

### Phase 2 — Wave-split loading and retry-then-error (still opt-in)

Implement, behind the existing `?motion=1` default-off switch: per-wave
stage scope (heroes + first-wave kinds ready before entry; later-wave and
boss kinds load during earlier waves and must be published before their
first spawn; late co-op join waits for its hero pack before core join);
bounded retry with cancellation on scene restart; terminal visible error
instead of legacy fallback for any required pack; atomic per-fighter
publication unchanged. Convert fallback tests to error-path tests for the
opt-in path; keep the default (legacy) URL byte-identical in behavior.
**Exit:** targeted/unit/e2e evidence that under `?motion=1` no required kind
can silently render legacy, per-wave budgets hold, and the error path is
reachable and recoverable by reload; default URL unchanged.

### Phase 3 — Default flip with temporary `?motion=0`

Invert the switch: motion is on for the normal URL; `?motion=0` temporarily
selects the legacy renderer (diagnosis/rollback only, undocumented as a
player feature). Re-point off-by-default test expectations to the new
default and to the temporary escape. No legacy code is deleted in this
phase. **Exit:** exact-commit evidence (unit/e2e/vision/prodbuild on the
built bundle) that the normal URL downloads and publishes motion packs and
that `?motion=0` still reaches legacy; this evidence feeds CMR-24 Part A.

### Phase 4 — CMR-24 Part A: sole-motion gate before deletion

Run [CMR-24](motion-tasks/CMR-24.md) Part A at the Phase 3 commit: full
serial gates, whole-cast actual-game review (all actions/facings/stages,
co-op, Canvas/WebGL, mobile landscape), resource/download/decode report
against the wave-split budget, retry-then-error negative controls, fresh
independent producer review, indexed owner review page with normal-paced
clips. **Exit:** Part A acceptance all checked with no open new S1/S2 motion
defect. Any failure keeps CMR-24 IN_PROGRESS/BLOCKED and Phase 5 must not
start; rollback is `?motion=0` or reverting the Phase 3 commit.

### Phase 5 — Legacy deletion (final slice)

Only after Phase 4 passes: delete the legacy paper-doll/rig renderer and its
exclusive assets/tests, the whole-fighter fallback paths, the `?motion=0`
escape and the mode switch itself. Retire or re-point legacy-only gates
(G6 arm-chain, UIR-19 hand test, rig anatomy grids) with each retirement
recorded as a consequence of deletion, never as a silent green. Core
simulation, gameplay timing and pack content do not change in this slice.
**Exit:** no live code path can render a fighter without its motion pack;
grep/test evidence that the legacy renderer and mode switch are gone.

### Phase 6 — CMR-24 Part B: post-delete verification and closeout

Re-run the full serial gate set and a fresh whole-cast review on the
post-delete tree; prove the built bundle ships sole-motion only (no legacy
download, no mode parameter effect, error path intact); update the indexed
owner review and `docs/CAST_MOTION_REVIEW.md` with pre/post-delete results,
retired-gate list and remaining limitations. **Exit:** CMR-24 DONE. The
migration is complete; deployment remains the owner's manual action.

## Failure semantics (Phases 2+)

- **Required pack** = selected hero, actual/default 2P hero, and every kind
  the current stage can spawn (by wave) or that a pending join needs.
- On download/validation failure: bounded retries (existing loader bounds —
  no per-render retry, no unbounded loop), preserving already-published
  fighters and core state. Cancellation on scene restart/exit stays safe.
- On terminal failure: a visible, player-comprehensible error blocks stage
  entry, the pending spawn wave or the pending join. The simulation never
  runs with a required fighter unrenderable, half-packed, or silently
  substituted. Prefetch of future kinds is best-effort only until that kind
  becomes required, at which point these semantics apply.
- Atomicity is unchanged: a pack publishes whole or not at all; old poses are
  never inserted into a valid new pack; one fighter's failure never corrupts
  another fighter's published pack.
- Every terminal-error path needs a negative control (missing, corrupt,
  forged-signature, hung/timeout, over-budget wave) proving the error fires
  and legacy rendering does not appear.

## Budget: wave-split 12 MiB entry

- Hard caps unchanged: ≤12 MiB added motion download **per wave boundary**,
  ≤16 MiB decoded motion pixels/humanoid, ≤128 MiB retained motion-page
  cache, pages ≤2048×2048 at density 2.
- Wave 0 (stage entry) = selected hero + default/actual 2P hero + first-wave
  spawn kinds; it must be fully downloaded, validated and published before
  the stage runs. Each later wave's newly required kinds (including the
  boss) download during earlier play under the same 12 MiB per-wave cap and
  must publish before that wave's first spawn.
- Report source PNG/network bytes, planned per-wave bytes and decode/GPU
  estimates separately, per stage and hero combination (existing
  `plannedBytes`/scope reporting extended per wave, not replaced by a
  stage-total average).
- If any single wave cannot fit, the selected task blocks for owner review
  with measurements. Never raise the cap, drop a kind to legacy, or lower
  visual thresholds to fit.

## Verification and rollback

- Per phase: meaningful targeted tests, lint/typecheck, and the phase's
  recorded browser gates; Phases 3–6 additionally require `npm run vision`
  and `npm run prodbuild` (the shipped bundle is what flips), and Phase 4/6
  require the full serial set (lint, typecheck, unit, e2e, signal, vision,
  build, prodbuild) plus fresh independent producer visual review.
- Baseline honesty: the G6/UIR-19 legacy baselines are carried as documented
  exceptions until the slice that deletes what they test; CMR-24 Part B
  lists every retired gate. No slice reports full green by hiding a baseline.
- Rollback, in order: before Phase 3, nothing to roll back (default never
  changed). Phases 3–4: `?motion=0` for immediate diagnosis, or revert the
  scoped flip commit to restore opt-in. After Phase 5: revert the scoped
  deletion commit (legacy returns whole; pack content and core were
  untouched by that slice). Every phase is a separate local commit precisely
  so one phase reverts without entangling another. No rollback path involves
  pushing, deploying or rewriting history.
- Guan Yu's accepted pixels/timing, deterministic core simulation, gameplay
  windows and per-fighter recorded waivers/limitations are preserved by
  every phase; a slice that needs to change them is out of plan scope and
  stops for the owner.

## Gate ordering (queue summary)

`CMR-23 (Phase 1, pre-flip validation) → Phases 2–3 slices → CMR-24 Part A
(Phase 4) → Phase 5 deletion → CMR-24 Part B (Phase 6) → CMR-24 DONE`.
CMR-24 keeps `Requires: CMR-23` in `TASKS.md`; Phases 2, 3 and 5 are executed
as bounded slices under CMR-24 once it is the selected ready task, in phase
order, and CMR-24 cannot be marked DONE before Phase 6 evidence exists.
