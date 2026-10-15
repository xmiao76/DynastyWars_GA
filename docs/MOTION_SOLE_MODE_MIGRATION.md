# Motion sole-mode migration — authoritative plan

Status: owner-approved plan published 2026-10-14; practical-gate amendment
`owner-practical-motion-contract-amendment` supersedes the original strict
CMR-23 pre-flip prerequisite prospectively. Read with the
[shared contract](CAST_MOTION_ROLLOUT.md). Historical verdicts remain evidence,
not newly passing criteria. This amendment changes contracts/status only;
runtime remains opt-in until a separately verified default-flip slice lands.

## Goal and owner disposition

Normal play renders all 11 humanoids exclusively from their accepted motion
packs. First make the normal URL motion-default with temporary `?motion=0`
rollback; verify the practical Part A gates below and obtain independent review
before deleting anything legacy-only. After green, remove legacy-only paths
and repeat essential gates, proving built-bundle exclusivity. A missing valid
required pack produces a visible blocking error, never silent legacy art.

Exact owner direction for this amendment:

> Owner accepts CMR23 contact/occlusion flaws as known migration visual debt, defers their repair, no additional image generation, mechanics unchanged; removes strict paired art pass as migration prerequisite.

[CMR-23](motion-tasks/CMR-23.md) closes **DONE (DEFERRED_BY_OWNER / SUPERSEDED gate)**,
not original-criterion PASS. Original strict visual criteria remain FAIL/deferred:
**2/60 ≤3u passes, 58/60 failures**; 0/60 at the stricter diagnostic ≤2u;
60/60 control rows fail as designed. Attempts, diagnostic rejections, pilot
failure, provenance gaps, source hashes and generation ledgers remain untouched
(global **197/200**). Never reset it to TODO or describe the debt as repaired.
The old owner wait was correct when recorded; this is its explicit subsequent
disposition, not a correction of that historical verdict.

All practical mechanical, coverage, loading and resource work formerly attached
to CMR-23 remains required under [CMR-24](motion-tasks/CMR-24.md); none passes
by this closure. Known contact/occlusion debt is disclosed, not a migration
blocker. New unrelated defects, mechanics regressions and safety failures still
block. No additional image generation is authorized or required by migration.

## Locked decisions and boundaries

- Sole-motion is the end state: no permanent mode switch, dual renderer,
  whole-fighter legacy fallback or old poses inside a published pack.
- Part A at the exact default-flip commit, including independent pre-delete
  review, must be green before any legacy-only deletion. CMR-24 is DONE only
  after Part B on the post-delete tree. No deletion in this docs amendment.
- During default-on pre-deletion, `?motion=0` is a temporary diagnostic/rollback
  escape to the complete legacy renderer, not a permanent player feature.
- Hard budgets stay ≤12 MiB added motion download per spawn-wave boundary,
  ≤16 MiB decoded motion pixels/humanoid, ≤128 MiB retained motion-page cache,
  pages ≤2048×2048 at density 2. Report PNG/network and decode/GPU costs
  separately for every stage and hero/co-op combination. Never raise caps or
  silently omit a required kind to make a wave fit.
- Required packs (selected/default or actual 2P heroes, current wave/spawn/join
  kinds) load, validate, decode and publish before use. Future-wave prefetch is
  best-effort only until required; late joins wait before core join.
- Missing/corrupt/forged/timed-out/over-budget required packs get bounded retries
  then a visible error blocking entry, spawn or join. No per-render/unbounded
  retries. Atomic per-fighter publication and cancellation/restart safety must
  preserve already-published packs, core state and new loading episodes.
- Mechanics, deterministic core, timing, hitboxes, range, damage, speed, physics,
  grab pinning and accepted pack pixels remain unchanged. Existing exact-source
  waivers/limitations do not become measurement passes.
- GYM-1/BODY-7 remain DONE obsolete/superseded dispositions, not original passes.
  Archives, numerical history, attempts, provenance and spent budget rows stay.
  No ledger edits, generation, push/deploy, schedule/runner/lock changes or
  unrelated code scope. Deployment remains owner-manual.

## Actual implementation history versus gate order

Phase numbers below describe the remaining safety gates, **not a claim that
all earlier work happened in that order**. Wave/retry implementation and queue/
decode fixes pre-existed gated review: browser verification `2fb279a`, epoch fix
`77d6d3e`, stable runtime `523684c`, production correction through `4bc0cdd`.
Existing evidence includes targeted runtime/catalog/scope **140 passing**, stable
loader browser **8 passing**, vision **5 passing**, and final production **14/14**.
These are implemented-code/opt-in evidence, **not default-URL verification** or
CMR-24 acceptance. Earlier failed runs and exact limits remain in the
[durable checkpoint](motion-tasks/CMR-23-STATUS-20261014.md). Do not retroactively
phase-order fixes or reuse these totals as unrun practical gates.

## Phases 0–6 (bounded, separately committed slices)

### Phases 0–1 — Contract amendment and owner closure

Publish this practical gate, close CMR-23 by the explicit disposition only,
retain its strict FAIL/deferred history, reconcile live Requires and contracts.
CMR-24 becomes ready (TODO); closure itself implements or verifies nothing.

### Phase 2 — Review existing loading work; fill proven gaps only

Review pre-existing wave-split/retry/error work against the locked semantics.
Record exact existing evidence and any remaining checks/defects honestly. No
repeat implementation or art repairs merely to make phase history look ordered.
Any necessary loader correction needs its own bounded scope and checks under
CMR-24; no required-kind silent fallback is acceptable on the motion path.

### Phase 3 — Default URL with temporary rollback

Make motion default for the normal URL, keeping `?motion=0` temporarily for
legacy diagnosis/rollback. Re-point default/escape expectations without weakening
negative controls; no legacy deletion. Record exact-commit unit/browser and
built-bundle evidence of default motion loading and working rollback. Then run
Part A; opt-in results alone cannot establish this exit.

### Phase 4 — CMR-24 Part A: practical pre-delete gate

At the exact default-flip commit, require:

- Default URL (no motion parameter) and temporary rollback verified in actual
  built production, as well as applicable development coverage.
- All 11 fighters, applicable actions/states/transitions/ticks and both facings:
  traces prove loaded/published textures and frames, no blanks/placeholders,
  missing clips, old rig frames or partial-pack mixing. Paired hold/release/
  throw/impact/getup, timeout, hit break, target death and multiple grabbers are
  mechanically covered; strict contact/occlusion art remains declared debt.
- Title/select/menus/overlays/results/game-over, all three stages, solo/co-op,
  late join, KO/revive, pause/hit-stop/restart/exit, mobile portrait/landscape
  usability and Canvas/WebGL exercised. Core timing/physics remain unchanged.
- Every stage/hero/co-op wave byte split meets the hard caps; loaded-frame,
  download/decode/GPU/cache, eviction/cancellation and frame-time/performance
  evidence meets existing thresholds. No all-cast title preload or per-frame
  canvas duplication; no new threshold waiver is implied.
- Missing/corrupt/forged/hung/over-budget controls prove bounded retry then
  visible blocking error, zero legacy frames and sibling/episode isolation.
- Full serial lint, typecheck, unit, e2e, signal, vision, build, prodbuild;
  exact documented baseline exceptions distinguished from new failures.
- Fresh independent pre-delete review of practical coverage, gameplay-size
  visuals, resources/errors/performance and deletion inventory. Indexed owner
  review includes normal-paced real-input/AI clips, captures, exact commits,
  provenance and all inspection limits/debt (stills are not native video review).

**Exit:** all Part A practical criteria green with independent review recorded;
known owner-deferred contact/occlusion debt is not relabeled PASS. Any other
failure retains IN_PROGRESS/BLOCKED and forbids deletion. Roll back via
`?motion=0` or revert the scoped flip commit if needed.

### Phase 5 — Remove legacy-only material, preserve shared assets

Only after Part A green and independent review: inventory and remove legacy-only
renderer/fallback code, art, configuration, tests, scripts, mode switches and
live requirements. Preserve assets/tools/config/tests shared with motion, menus,
backgrounds, projectiles or other supported behavior. Every retirement (e.g.
G6 arm-chain/UIR-19 legacy hand gate/rig grids) is explicitly retired-by-deletion,
not newly green. Do not rewrite archives/history/ledgers. Pack content and
mechanics are unchanged. Commit this removal separately for safe rollback.

### Phase 6 — CMR-24 Part B: repeat essential gates and prove exclusivity

On the exact post-delete tree repeat the full serial gates and essential Part A
coverage/resources/loaded-frame/error/menu/co-op/stage/mobile/Canvas-WebGL/
performance checks and fresh independent review. Prove via source/reference
search plus real built-bundle/network/runtime evidence: no legacy renderer,
fallback, legacy-only art/config/scripts or live requirement remains; old mode
parameters have no rendering effect; all required fighters use motion and the
error path still blocks safely. Update indexed owner review and
`docs/CAST_MOTION_REVIEW.md` with pre/post results, retirement list and deferred
debt. **Exit: CMR-24 DONE only on this evidence.**

## Verification, rollback and queue summary

Each implementation slice runs meaningful relevant checks; Phases 3–6 require
vision/prodbuild, Parts A/B the full serial set plus independent review. Baseline
G6/UIR-19 exceptions remain visible until their exclusive implementation is
removed; no false full-green report. This docs amendment uses dependency/live
contract searches and diff checks only, not runtime/art/test execution.

Pre-deletion rollback: temporary `?motion=0` or revert scoped flip commit.
Post-deletion rollback: revert the separate deletion commit, restoring legacy
whole without changing pack pixels/core. No push, deploy or history rewrite.

`CMR-23 DONE (DEFERRED_BY_OWNER / SUPERSEDED gate) → CMR-24 ready → existing
loading review → default flip + temporary rollback → Part A practical gates +
independent review → legacy-only deletion → Part B repeat/exclusivity → DONE`.
`Requires: CMR-23` is satisfied by terminal disposition, not a hidden strict-art
pass; every practical CMR-24 checkbox still requires its own evidence.
