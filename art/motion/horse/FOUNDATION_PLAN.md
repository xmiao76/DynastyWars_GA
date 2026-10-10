# CMR-22 zero-request horse foundation — 2026-10-10

Status: **source/integration plan only; no accepted new horse art or runtime fix**. Parent run `2026-10-10T06-39-22-819Z-83426a3c-a16c-47fc-889c-89d02fde8f3b`; baseline HEAD `af1de05bff0455b2048e7083dca7702d64c09262`. Exactly one foreground package, no nested workers/background jobs/commit/push. This package reserves/spends/generates ZERO images.

## Readiness and evidence authority

[Live queue](../../../TASKS.md#L204-L211) really marks CMR-05/09B/10B/11B/12B DONE. [Selected record](../../../docs/loop-task-records/CMR-22.md) contains no attempts or narrower owner exclusion. Its old ordering dependency on CMR-15B is superseded by live Requires and [shared autonomy contract](../../../docs/CAST_MOTION_ROLLOUT.md#L19-L20), not silently treated as a missing artifact. Read-only runtime state had no CMR-22 parked entry/recovery failure. Historical failed consumers **0**, runtime **0**; this successful foundation adds no failure.

Read-only runner preflight returned `safety-paused / unknown active run`; it does not independently recognize the delegated manual worker. Read-only state identifies the active run as the exact parent above; direct scoped owner delegation supplies this package's authority, NOT a global resume or lock override. No runner/state/lock writes or automatic continuation authorized here. Parent resolves its normal manual lifecycle after review.

[Manifest](FOUNDATION_MANIFEST.json) pins 32 actual source/budget payloads, all 15 accepted hero atlas/metadata payloads, and the five unrelated modified-file fingerprints. [Offline checker](check-foundation.mjs) executes actual current core modules and the exact extracted legacy horse helper without Phaser/browser/server. Default command: `node art/motion/horse/check-foundation.mjs`. `--record` writes only this package manifest and was used once to establish the baseline; do not use it to conceal changed hero pixels or ledger deltas. JSON does not grant execution or acceptance authority.

## Observed identity, geometry and current defects

Opened [original master](../../fighter-bodies/horse-master.jpg), JPEG 1280×720, 159326 bytes, SHA256 `79e823b0565aef42d9ef7bf780477fcbab26a0c701d7c9c94479f03a2156f3c2`. Three right-facing views on black: bay/brown barrel and neck, dark muzzle/lower legs, long near-black mane/tail, plain upright ears, brown saddle with ornate gold edging, red/gold blanket and visible gold stirrup. No rider in master. Middle/right views are strongly similar extended-leg pictures; this inspection does **not** certify an alternating complete gait or anatomical near/far leg correspondence. Black is keyed background, not source transparency; retain original.

[Legacy preparation](../../../scripts/prepare-horse.mjs#L15-L33) uses density4 and explicit registration (not ink-bbox centering): crops idle `[20,150,395,380]`, walk0 `[455,150,380,380]`, walk1 `[875,150,380,380]`; destination device rectangles `[15.9,-31.7,367.4,353.4]`, `[27.9,-31.7,353.4,353.4]`, `[37.2,-31.7,353.4,353.4]`. Existing intended saddle canonical `(50,27.4)`, ground76, ears−4.4, horse width112 and headroom8. These are legacy authoring registrations, **not newly measured source landmarks**.

[Legacy sheet](../../../src/game/assets/horse/horse-sheet.png) is 1344×304, 301383 network bytes, decoded RGBA 1,634,304 bytes (1.559 MiB); same page-only GPU estimate. This excludes generated legacy pose textures/other fallback art. [Metadata](../../../src/game/assets/horse/prepared.json) revision body-1 has just idle/walk0/walk1; SHA and dimensions verified by checker. Density4 is grandfathered fallback, NOT a conforming density2 CMR-22 pack.

[Scene placement](../../../src/game/scenes/GameScene.ts#L641-L664) fits legacy horse canonical height76 to world70. With [registry box](../../../src/game/art/registry.ts#L138-L142) 112×84, canonical saddle maps approximately to world offset `((50−56)*70/76, (27.4−76)*70/76) = (−5.526,−44.763)` before facing reflection. [Rider](../../../src/game/scenes/GameScene.ts#L740-L744) currently has fixed lift18, own facing, depth entity.y. Rider ground/pivot is not seat contact; cannot conclude a 26.763-unit gap without rider contact landmarks. Horse facing is not pinned to rider by core mount lifecycle; left-facing mismatch needs actual pair review rather than a gameplay change.

Executable current-code observations (NOT browser screenshots):

- [Scene association](../../../src/game/scenes/GameScene.ts#L690-L694) always passes player one to [horsePoseFor](../../../src/game/scenes/GameScene.ts#L937-L950). Real 2P association: p1 id1, p2 id8 mounted on horse95, p2 walk/stateTick10; current p1 selection **idle**, actual-rider selection **walk1**. Core already finds mountedOn owner correctly.
- [Core mounts](../../../src/core/sim.ts#L468-L499) moves a fleeing horse +4 x once per unfrozen step, without stateTick increment. After12 actual steps horse moved48 units, stateTick remained0, current helper selected **walk0 only**. [Combat](../../../src/core/combat.ts#L87-L99) sets fleeing stateTick0 on break. Horse side neutral is not in the player/enemy clock update.
- [Hit-stop](../../../src/core/sim.ts#L720-L727): two frozen steps moved0; first resumed step moved4. Raw sim.tick is therefore NOT a sufficient flee animation clock. Wall time/render callbacks also invalid. [Scene pause](../../../src/game/scenes/GameScene.ts#L486-L492) does not step; repeated sprite sync cannot advance gait.
- Mounted sweep remains startup8/active6/recovery14 (28 total), damage14/reach38. No retiming/rebalance permitted. Mid-sweep dismount continues the already-bound attack window in all five hero samplers.

## Exact new source plan (DRAFT, not requested)

Allocate authoring provisionally: **locomotion anchor first candidate1 + at most candidate2; run/flee first candidate1 + at most candidate2 = four total maximum**. A rejected request stays spent; focused authoring edits also consume this same four-request cap and reduce remaining candidate capacity. Do not assume four guarantees success. Future reservation must occur immediately before an explicitly authorized request; this package authorizes none. Current ledger horse row absent =0/4 used, global145/200 (55 left), max2 whole sheets/sequence. Repair row absent=0/3, untouched; Acceptance-4 reserve is not a gait repair/free retry budget.

### Proposed drawings and exposures

One locomotion anchor sheet, isolated right-facing full horse keys with 8% clear gutters including tail/ear/hoof, no rider/labels/grid/checker ink. Explicit anatomical near/far hoof labels are metadata, not painted guides. Preserve bay/tack identity above and fixed camera/scale. Draft key names:

| Key | Required articulation | Draft exposure |
|---|---|---|
| idle:0 | relaxed planted stable four-leg stance; lock coat/tack identity | idle loop1 |
| trot:0 | near fore + far hind diagonal contact | ticks0–2 |
| trot:1 | same diagonal compression/loading, other pair lifting | 3–5 |
| trot:2 | first pair toe-off, opposing pair passes under barrel | 6–8 |
| trot:3 | genuine suspension, all hooves clear | 9–11 |
| trot:4 | far fore + near hind opposite diagonal contact | 12–14 |
| trot:5 | opposite compression/loading | 15–17 |
| trot:6 | opposite toe-off/passing | 18–20 |
| trot:7 | second suspension, coherent return to0 | 21–23 |

Trot draft24-tick loop aligns existing hero mountedwalk24 cycle without changing accepted hero exposure timing. Each key must differ anatomically; reflections/copies/one extended-leg alternating picture do not suffice. Keep ground76 reference for planted keys; raised hooves must not be normalized back to ground. Validate planted-foot world displacement against observed mounted motion (including depth/diagonal movement), then adjust **horse** exposures/registration if justified; preserve hero clocks/pixels. Draft run/flee sheet: six keys rear push→gather→near fore reach→fore support→hind recovery→suspension, initial loop12 ticks (2/key); fleeing samples that complete run loop from observed movement. This is a reviewable starting hypothesis, not a claimed solved stride. No separate fleeing source required if same complete run family passes; barrel/saddle continuity and no sliding must be reviewed at actual +4/tick.

No mounted horse attack capability is invented: a stationary sweeping rider uses horse idle; observed movement determines trot/run rather than attack names. Mount/dismount belong to existing rider presentation/history; horse remains coherent underneath until actual ownership clears.

### Landmark and preparation record to author BEFORE acceptance

For each isolated key store source crop, fixed uniform source→world scale, untrimmed source size, trim/pivot, page rectangle, RGBA hash, exposure; saddle seat/contact `(x,y)`, barrel center/withers, ear crown, muzzle, near/far hoof points and contact boolean, ground baseline, tail extreme. Record landmark coordinate space/density explicitly; unknown or occluded anatomy stays unverified. First accepted idle/trot sheet fixes ONE horse scale/identity reference, never per-pose height normalization or bbox centering. Review head/barrel/tack consistency across comparable views; no invented weapon-length horse metric or reserve eligibility. Trim restore must round-trip exact accepted key RGBA and landmarks; ground error≤1.5 world units.

Target world-ground box initially matches legacy width `112*70/76 =103.158`, ground70, headroom `8*70/76 =7.368`, with saddle offset above as baseline only. Prepare density2 directly in world-aligned units, or explicitly encode canonical→world factor; **do not** use existing motion `1/density` fit with an unconverted112×84 canonical box (would silently enlarge horse). Maintain headroom/ear bounds; future measurements can justify a single coherent horse registration change, not hero repaint.

For each of five heroes, use existing rider key RGBA untouched and add verified seated contact landmarks per displayed key. From paired frame transform calculate `horse saddle world − rider seated-contact world`; reflect each actor's local x correctly for both facings, and apply presentation-only offset. Anchor contact, not rider feet. Pin all15 current hero payload hashes in manifest, then prove per-frame RGBA/exposures unchanged after integration. Guan Yu mountedwalk keys0/1/2/1 at0/6/12/18; other four keys0/1 at0/12. Zhang Fei sweep strike rider3 vs Zhao Yun/Wei Yan/Huang Zhong rider4; do not generalize the wrong index. Distinct seat tags must come from pair crops, not guessed texture centers. Sweep startup/active/end boundaries remain0/8/14/28; dismount presentation8 ticks does not alter core ownership or attack lock.

## Smallest future deterministic fix package (not implemented here)

1. Add a pure horse presentation selector/controller scoped to horse with actual rider lookup `playersOf(sim).find(p => p.mountedOn === horse.id)`; two horses must have independent IDs/history. No core schema mutation. First add tests reproducing current 2P idle mismatch and frozen flee pose; prove they fail old selection then pass replacement. This checker reproduces defects but is NOT red→green evidence.
2. Observe every actual stepSim immediately after stepping, in BOTH autopilot paths and real-input path; maintain scene/entity horse history outside core. For flee use movement delta, equivalent clock increment `max(0, x−previousX)/4` under current core invariant, and accrue per-step before later clamping/removal; unchanged position means no advancement even when sim.tick grows in hit-stop. Avoid render-only sampling (600-step batches can skip states/remove actors). Enter flee/restart initializes history; repeated render at same snapshot idempotent; forget removed horse/scene shutdown. Never subtract freezeTicks after step to guess whether a step ran (last frozen step decrements to0).
3. Initially bind existing legacy frames only if delivering a standalone fully checked logic correction; new clips remain inactive until complete source/pack acceptance. Tests: solo/2P, two mounts independent, unrelated p1 state changes, 12 flee ticks, two hit-stop ticks, pause/resume, duplicate observation/sync, skipped renders/batched steps, break during sweep, removal/scene restart, no core mutation. Validate facing separately in real pairs.

## Atomic integration and bounded-load seams

[Legacy horse adapter](../../../src/game/adapters/horse-art.ts#L69-L95) verifies dimensions/signature but copies just heroes/bodies/horse, dropping any asynchronously published motions. Existing tests preserve heads/bodies only, not motions; missing/empty frame tables are not a complete gait validator and blitter has per-frame procedural fallback. Do NOT route the CMR pack through this partially compatible path or publish arbitrary horse metadata as a Guan Yu pack.

[Motion profile](../../../src/game/art/motion-profiles.ts#L26-L62) has no horse role; [publisher](../../../src/game/adapters/motion-art.ts#L660-L679) unknown kind defaults to Guan Yu validation/clips. Future horse pack needs horse-specific complete clip validation/dispatch (idle/trot/run/flee) and bounded page manifest, not hero jump/hurt/weapon bindings. Reuse existing shared atlas/cache lifecycle; [stage-kind derivation](../../../src/game/adapters/motion-art.ts#L574-L598) already includes props, so stage2 horse need not cause cast-wide boot preload. Keep new horse strictly `?motion=1`, otherwise retain whole legacy horse. Complete verification before publication, remove only failed horse motion record, preserve every other ArtResources field with spread. Missing/empty/corrupt/out-of-bounds/unknown-frame/zero-exposure negative controls must reject whole horse for stage; no legacy cell mixed into a published new loop.

Measure actual page bytes/decoded/GPU separately. Page≤2048²/density2, cache≤128MiB, stage entry≤12MiB including horse + selected/default2P hero + actual enemy kinds. Conservative planned horse≤16MiB decoded (not an owner cap change); one2048² page alone reaches16MiB. Report horse fallback page1.559MiB AND generated legacy textures separately. Use stage2 two-hero worst-case accounting; if any whole pack is over budget, defer it/fall back atomically without changing limits. Late load/cancellation/restart/refcounts must protect active actors and reject stale publish. No per-render retry or per-frame canvas clones.

## Remaining verification and next action

This package changes no runtime/art/accepted pixels. No capture/vision/signal/build/prodbuild gate run or claimed. Offline observations are not normal-speed Canvas/WebGL/mobile acceptance and no producer verification exists yet. Current [horse unit tests](../../../test/game/horse.test.ts) cover three-frame fallback/signature/saddle-zone liveness, [core mount tests](../../../test/core/horse.test.ts) cover gameplay, [co-op tests](../../../test/core/coop.test.ts) cover single-owner/same flee speed, and [horse e2e](../../../e2e/horse.spec.ts) covers solo mount/speed only; none establishes corrected 2P presentation/complete gait.

Next package: choose the focused selector/history correction above, first pinned BEFORE capture and genuine failing regressions, then scoped implementation and same inputs AFTER capture. Required before claiming shipped acceptance: relevant horse/saddle/mount/cache/profile units; lint/typecheck; applicable e2e/default/co-op; signal; vision; prodbuild; actual Canvas/WebGL/mobile five heroes×two facings×idle/move/sweep/mount/dismount/flee, plus two mounts/hit-stop/pause/restart; gameplay-size and enlarged pair/cycle sheets, normal-speed owner-playable clips with hashes/source dirty state; independent producer review later. Any incomplete gate retains IN_PROGRESS and explicit next steps. Future authoring is separate, budget-reserved and complete-pack-only. No partial activation or accepted-hero repaint authorized by this plan.
