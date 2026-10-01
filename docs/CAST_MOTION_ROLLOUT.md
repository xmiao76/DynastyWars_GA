# Whole-cast motion rollout — owner-approved loop handoff

## Purpose and authority

The owner accepts the Guan Yu enhancements and requests the same approach for every character, implemented by **loop threads, not this main planning thread**. The owner selected:

1. Prioritize the character rollout over older unfinished tracks.
2. Keep the cast opt-in behind `?motion=1` until separate owner approval of normal-play activation.

Planning baseline: `540501c`, following Guan Yu implementation/review commits `d7d44eb`, `c2cf3fa`, `33e207f`, and `a6c6057`. The accepted reference is the current visual result, not a claim that every historical metric passed. Existing limitations stay in the [Guan Yu action review](GUANYU_ACTION_REVIEW.md).

**This handoff creates tasks only.** No game source, tests, artwork, runner controls or scheduling are implemented or changed by publishing it. Later consumers implement the tasks. No automatic implementation goal, loop process, subagent writer or scheduler is started here.

## Discovery and queue operation

- Read [AGENTS.md](../AGENTS.md), [PROJECT.md](../PROJECT.md), [TASKS.md](../TASKS.md) and current [PROGRESS.md](../PROGRESS.md).
- Use existing [continuation selection](../.loop/continue.md) and [consumer procedure](../.loop/loop.md). Due producer visual reviews still precede a consumer; do not bypass cadence to accelerate rollout.
- Every CMR entry links its detailed specification. Load this shared contract and **only the selected specification** plus its listed local code. Avoid reading all 40 specifications in every iteration. Specification headers record initial status/attempts; the live queue and newest progress are authoritative after work begins.
- Each consumer works on exactly one task. Continue IN_PROGRESS before choosing the first TODO. Implement no dependent task until prerequisites are DONE with evidence.
- The CMR queue is sequential by design. A failed foundation/character prerequisite stops downstream CMR work; do not skip it just because downstream status says TODO. Record the prerequisite blocker and wait for the owner rather than start another character.
- GYM-1, BODY-7, ENH-12 and UIR-19 are explicitly owner-deferred as BLOCKED, preserving evidence and attempt counts. UIR-16 remains blocked as before. Unrelated TODOs follow the CMR queue. No loop policy or runner changes are required.
- A task is not DONE because artwork was generated or the loader boots. Task-specific acceptance and relevant checks must pass. Producers independently verify fresh visual evidence; consumers never grade their own ledger findings as verified.
- Existing three-unsuccessful-attempt rule applies **per task**, with attempt records preserved across threads/models. Generation limits are additional caps, not permission to retry indefinitely.
- Local commits only, scoped to the selected iteration. No push/deploy, other repository changes, secret access, permission escalation or scheduler/runner-control changes.

## Scope and non-goals

**Roster:** 17 humanoid fighters: Guan Yu plus four remaining heroes, three regular enemies, nine bosses. The shared horse gets a locomotion task because it is an animated character and must compose with all riders.

Guan Yu remains the locked accepted reference. Do not regenerate his displayed walk/combo art or change its exposure timing. Infrastructure repacking may move pixels into pages but must prove each displayed RGBA frame is unchanged.

No new gameplay states, weapons, shields, attacks, damage, timing, range, speed, AI/enrage rules, core grab pinning, physics or projectile behavior. Current figure definitions remain authoritative even when an attack ID uses a different weapon name. Portraits, menus, backgrounds, props, pickups and projectile artwork are outside scope. No 3D pipeline or new provider/plugin setup is authorized.

## Approved task order (40 tasks)

| ID | Task | Dependencies |
|---|---|---|
| [CMR-01](motion-tasks/CMR-01.md) | Reference, roster/action inventory and budgets | None |
| [CMR-02](motion-tasks/CMR-02.md) | Generic per-kind motion profiles/playback | CMR-01 |
| [CMR-03](motion-tasks/CMR-03.md) | Stage-aware bounded atlas loading/cache | CMR-02 |
| [CMR-04](motion-tasks/CMR-04.md) | Generic guide/prepare/provenance tooling | CMR-03 |
| [CMR-05](motion-tasks/CMR-05.md) | Motion-aware capture/review/test harness | CMR-04 |
| [CMR-06A](motion-tasks/CMR-06A.md) / [06B](motion-tasks/CMR-06B.md) | Wei Soldier pack / integration | CMR-05 → 06A → 06B |
| [CMR-07A](motion-tasks/CMR-07A.md) / [07B](motion-tasks/CMR-07B.md) | Wei Spearman | 06B → 07A → 07B |
| [CMR-08A](motion-tasks/CMR-08A.md) / [08B](motion-tasks/CMR-08B.md) | Wei Archer | 07B → 08A → 08B |
| [CMR-09A](motion-tasks/CMR-09A.md) / [09B](motion-tasks/CMR-09B.md) | Zhang Fei | 08B → 09A → 09B |
| [CMR-10A](motion-tasks/CMR-10A.md) / [10B](motion-tasks/CMR-10B.md) | Zhao Yun | 09B → 10A → 10B |
| [CMR-11A](motion-tasks/CMR-11A.md) / [11B](motion-tasks/CMR-11B.md) | Wei Yan | 10B → 11A → 11B |
| [CMR-12A](motion-tasks/CMR-12A.md) / [12B](motion-tasks/CMR-12B.md) | Huang Zhong | 11B → 12A → 12B |
| [CMR-13A](motion-tasks/CMR-13A.md) / [13B](motion-tasks/CMR-13B.md) | Li Dian | 12B → 13A → 13B |
| [CMR-14A](motion-tasks/CMR-14A.md) / [14B](motion-tasks/CMR-14B.md) | Xiahou Dun | 13B → 14A → 14B |
| [CMR-15A](motion-tasks/CMR-15A.md) / [15B](motion-tasks/CMR-15B.md) | Xu Chu | 14B → 15A → 15B |
| [CMR-16A](motion-tasks/CMR-16A.md) / [16B](motion-tasks/CMR-16B.md) | Cao Ren | 15B → 16A → 16B |
| [CMR-17A](motion-tasks/CMR-17A.md) / [17B](motion-tasks/CMR-17B.md) | Zhang Liao | 16B → 17A → 17B |
| [CMR-18A](motion-tasks/CMR-18A.md) / [18B](motion-tasks/CMR-18B.md) | Xu Huang | 17B → 18A → 18B |
| [CMR-19A](motion-tasks/CMR-19A.md) / [19B](motion-tasks/CMR-19B.md) | Zhang He | 18B → 19A → 19B |
| [CMR-20A](motion-tasks/CMR-20A.md) / [20B](motion-tasks/CMR-20B.md) | Cao Cao | 19B → 20A → 20B |
| [CMR-21A](motion-tasks/CMR-21A.md) / [21B](motion-tasks/CMR-21B.md) | Lu Bu | 20B → 21A → 21B |
| [CMR-22](motion-tasks/CMR-22.md) | Horse locomotion/rider composition | CMR-21B |
| [CMR-23](motion-tasks/CMR-23.md) | Paired grab/throw and saddle integration | CMR-22 |
| [CMR-24](motion-tasks/CMR-24.md) | Full-cast verification/owner presentation | CMR-23 |

Each A task authors/prepares the complete applicable pack without runtime activation. Each B integrates/reviews it. A depends on the five foundations transitively and the previous character's B; B depends on its own A. Integration and final tasks follow every character. No parallel repository writers.

## Foundation design contract

### Profiles and pack data

Generalize the existing [motion sampler](../src/game/art/motion-clips.ts), [history player](../src/game/art/motion-player.ts) and [loader](../src/game/adapters/motion-art.ts), not a new renderer.

A pack has:
- Fighter ID, version, source/identity hashes, named pages with dimensions/signatures/SHA-256.
- Frames containing page ID, rectangle, untrimmed source size, trim offset and pivot.
- Semantic clips and explicit tick exposures; applicable states/capabilities; exact attack-ID bindings; ground/saddle/contact landmarks and scale reference.
- Fixed character scale preserving hero/mook/boss screen hierarchy. No pose-wise normalization to standing height.

Flow: existing rig/action guides → original coherent whole-character drawings → deterministic prepared pack → atomic per-fighter verification → sim-timed sampling → shared atlas-frame display.

No fixed requirement to use two pages, nine cells/action or 90 frames/fighter. Page packing and action counts follow actual capabilities and budgets. No hero-only `gy.` names, uniform enemy hitstun or mandatory mounted/jump pages for enemies.

Use existing [hero data](../src/core/characters.ts), [enemy data](../src/core/enemies.ts), [attack windows](../src/core/attacks.ts), [AI](../src/core/ai.ts) and [event types](../src/core/events.ts) read-only. Keep core schemas unchanged.

Special cases:
- Huang Zhong's `hz.special` has zero melee active ticks; release tracks actual projectile creation at its existing tick. Do not invent an active melee frame or delay the arrow.
- Enemy archers fire in their walk/idle AI path. Observe cadence reset/owned projectile creation at individual sim steps from the presentation adapter; never drive it from guessed attack timing or change core AI.
- Boss attack IDs can say sword/axe/shield while current figure art uses another weapon. Preserve current figure identity and bind actual timing; no unauthorized weapon redesign.
- Ground-state clocks, airTicks, paused/hit-stop ticks, render skips, multiple simultaneous actors, interrupted falling/getup, mounted attack break and solo/co-op defeat/revive must retain the Guan Yu boundary fixes.

### Loading and memory

Baseline measurement: Guan Yu regular atlas 1,827,406 bytes, actions 2,616,482 bytes, combined decoded RGBA 46,448,640 bytes (~44.3 MiB), before cell clones. Do not preload this across all fighters.

Initial hard limits:
- Density 2, atlas pages ≤2048×2048; trim/deduplicate frame pixels with exact pivot restoration.
- ≤16 MiB decoded motion pixels/humanoid; ≤128 MiB retained motion-page cache.
- ≤12 MiB added motion download to enter a stage, including immediate co-op needs. Report source PNG/network bytes and decode/GPU estimates separately.
- Skip cloning each drawing into a separate canvas; share native atlas frames. Release pages/textures safely when unused, including late-load cancellation and scene restarts.
- Load stage/selected fighters and immediate default 2P hero, not all cast at title. Prefetch future kinds before needed; later joins with an uncached optional hero wait for bounded preparation before core join. If unavailable, settle on the whole legacy pack before joining.
- Publication is atomic per fighter: missing/corrupt/timed-out/unsupported pack retains whole legacy rendering for that fighter for the stage, never old poses inserted into a valid new pack. Unmigrated fighters remain fully legacy.
- Bounded loading, cancellation, no per-render retry, no new clock dependency in core. Preserve all already-published ArtResources fields during asynchronous publication.

If limits are not achievable, report measurements and block the selected task for owner review. Never quietly raise limits or solve it by lowering visual thresholds. Report fallback-art memory separately; do not claim optional motion totals cover whole-game memory.

## Applicable actions

### Heroes (all five, Guan Yu retained)

Idle; complete walk; all three existing combo attacks; takeoff/ascent/apex/descent; aerial kick and retraction/contact/landing; hurt; backward fall/impact/down; seated/kneeling/getup; character-specific special; grab/hold/release/throw boundaries; mounted idle/move/sweep/mount/dismount; defeat/dead/revive; facing changes and mixed action interruptions. Use the existing input/gameplay clock rather than wall-clock action timers.

### Enemies and bosses

Idle/approach/retreat/walk/stop; their actual melee/shoot/charge/flurry/heavy actions; normal/enraged movement where applicable; own hitstun duration; fall/impact/down/getup; upright held reaction/escape; thrown flight/impact; defeat/dead. Do not generate player-only capabilities they cannot use. Defensive impossible states stay inside a pack's artwork family without being represented as a genuinely complete applicable clip.

Enemy states may reset `stateTick` differently and thrown AI clocks can stop. Derive presentation progress from observed unfrozen physics/event progression where necessary; do not assume a hero clock works for enemies.

### Horse and paired actions

Horse idle/trot/run/fleeing and saddle contact across phases. Correct rider association in co-op. Paired review: 5 heroes×12 enemies×2 facings, contact/depth/ground plus release/throw/impact. Presentation-only contact offsets and semantic poses, no core range/position/physics changes.

## Quality and evidence requirements

- All required states/attacks/ticks select new frames after pack publication; no paper-doll/old rig blend leakage. Fixture and corrupted-pack negative controls prove rejection, not a recorded metadata-only assertion.
- Exact startup/active/recovery and projectile spawn; zero windows, hit-stop, pause, skipped renders, scene restart, 2P and defeat all covered. No cosmetic smoothing delays a hit or unlock.
- Fixed scale, ground error ≤1.5 logical units, no clipped boots/blades/headgear, no key residue/halo/dividers. Same prone/getup and guard bookends; trim/pivot restoration must round-trip.
- Comparable visible head-size and fully observable weapon-length spread ≤10%. Mark occluded/foreshortened/unknown evidence as unverified. Guan Yu accepted pixels are a grandfathered reference with documented limitations, not a global threshold waiver.
- Genuine alternating walk drawings and planted-foot review against displacement; no identical pose copies passed as motion. Stable body mass, face, clothing, hands and weapon.
- Weapon direction steps >60° need a coherent intervening drawing. No crossfade ghosts, double limbs, forked shafts, floating hands or standing recoil inserted into a low fall. Direction is not a substitute for length/identity consistency.
- Review gameplay-size and enlarged frame sheets plus real input/AI clips at normal pace, both facings, Canvas/WebGL and mobile landscape; inspect transition sequences, not selected stills alone.
- Capture pace and source commit/dirty state/hashes. Record inspection limits: slow headless WebGL is not normal-speed evidence; still-only tools do not constitute native video viewing. Supply owner-playable clips.
- Consumers self-check; producers independently verify. Preserve before-images rather than rotating them away. Extend actual motion capture/review, not merely rerun the legacy 17×14 rig grid and call new art verified.

## Checks and known baseline findings

Every implementation: meaningful targeted tests, lint/typecheck and recorded results. Source/UI integration: applicable e2e plus vision/prodbuild. Shared timing/loading/paired interactions: signal. Final CMR-24: full serial lint, typecheck, unit, e2e, signal, vision, build, prodbuild and fresh full visual review.

Known starting blockers: arm-chain G6 unit failure on old paper-doll rendering and six possibly-undefined errors in the old UIR-19 hand test. CMR-01 reproduces them; future tasks must cause **no new failures** and document baseline exceptions instead of declaring full green. Do not weaken those gates or fix unrelated hand implementation as a side effect. Final report distinguishes accepted owner baseline exceptions from any remaining new defect.

Existing `review:capture`, ledger and producer cadence remain authoritative. Foundations extend mode/capture coverage and artifacts, not relax review rules or suppress unrelated findings.

## Generation budget and durable provenance

Caps before generation: 16 requests/remaining hero (4×16), 12/boss (9×12), 8/mook (3×8), 4/horse: **200 maximum**. No new Guan Yu generation authorized. At most two whole-sheet candidates per sequence. Focused edits count against the same character cap across A/B tasks and continuation rounds; task boundary/model switch does not reset the allowance.

Per fighter keep attempted images, exact prompts, ordered reference hashes, original outputs, provider preference versus actual known provider, scale/pivot overrides, exposure decisions and remaining allowance. Preserve existing original portrait/body sources. Reject a technically convenient but inconsistent image; targeted repair beats blind full-sheet retries. Quota recovery follows existing policy; unavailable image tools/authentication/access are explicit blockers, not silent substitutions, new plugins, credential access or unsafe permission changes.

No monetary cost or wall-time estimate is asserted: request cap is a ceiling, not a promised success count. A budget-exhausted character stays unaccepted with evidence and an owner decision; do not pad missing sequences with old parts.

## Final handoff

CMR-24 delivers an indexed whole-cast review page, actual action videos, applicable coverage matrix, performance/download/decode report, latest gate results and explicit unresolved issues. It remains opt-in; owner must explicitly approve default activation later. Do not retire legacy fallback, delete old tests or deploy during this rollout.

The main thread completes by publishing this contract, 40 specifications, ordered queue/progress changes and a local planning commit. The next consumer task is CMR-01 **after any due producer review**. Implementation starts only in later loop threads.
