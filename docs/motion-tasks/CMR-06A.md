# CMR-06A — Wei Soldier: author and prepare complete whole-character pack

- Queue status: BLOCKED (attempt 2, 2026-10-01 - the pack is complete and verified with 6/7 acceptance items passing; the ONE blocker is the numeric head-size / fully-observable weapon-length spread confirmation (item 4), which four automated pixel methods and a ruler-composite review could not establish on this art. The documented manual landmark review of the 45 labeled crops in `artifacts/motion/soldier/landmarks/` is the missing input). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-05 DONE; CMR-01..05 DONE transitively.
- Pair: [CMR-06B](CMR-06B.md) is the separate runtime/capture task.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/soldier-body-master.jpg) and [portrait master](../../art/mook-faces/soldier-portrait-master.jpg); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `soldier`; role: mook; current weapon: sword.
- Light rank-and-file helmeted build. Sword swing, approach/walk/stop, 18-tick enemy hitstun, fall/getup, upright held reaction, throw flight/impact and death.
- Attack bindings: `soldier.swing`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Lock one cohesive identity/weapon reference from existing original sources; record size, camera, light, costume/cape/headgear and rigid weapon landmarks. Never palette-swap Guan Yu or change current figure definitions to fit a generated picture.
2. Author neutral guides and ordered drawings for ALL applicable sequences: Idle/approach/retreat/walk/stop, every actual attack or shooting cue, own hitstun, fall/impact/down/getup, upright held/escape, throw flight/ground impact, dying/dead; bosses additionally charge and normal/enraged movement. No hero-only jump/mounted/special pages unless reachable data demonstrates the capability.
3. Review sequence sheets and neighboring poses at gameplay size and4x before requesting more. Reject drift/extra limbs/forked weapon/clipping; targeted edits within budget, not repeated whole sheets.
4. Prepare per-fighter source pack under `art/motion/soldier/` and runtime assets/meta through CMR-04. Explicit fixed registration, alpha cleanup, trimmed atlas pages, shared guard/down bookends, scale hierarchy, source hashes and exact exposure map. Do not activate it in the production catalog yet.
5. Record per-action verdicts and numerical landmark evidence; unknown/occluded values stay unverified, not acceptance passes. Use offline prepare/fixture rendering to validate planned temporal order and limits.

## Request budget

At most **8 image requests total for Wei Soldier**, shared across CMR-06A/CMR-06B and all continuation rounds; at most two whole-sheet candidates per sequence. Existing budget record is authoritative; never reset it on model/task changes. Preserve every attempt/prompt/ordered reference hash/verdict and remaining allowance. If unavailable tools or cap exhaustion prevent complete accepted art, record exact BLOCKED input rather than publish a partial set.

## Acceptance

- [x] Complete applicable clip/state/attack manifest; genuinely distinct walking/action drawings, no old-part frames used as missing new poses. (5 sequences x 9 = 45 displayed frames covering idle/approach/retreat/walk/stop, `soldier.swing` 14/4/20, 18-tick hitstun, held/escape, fall/impact/down, thrown flight/impact, getup, dying/dead; 37 unique drawings + 8 shared-bookend aliases; no legacy parts anywhere.)
- [x] Identity, natural connected anatomy, stable body mass, consistent camera/lighting and weapon design; no mitten/extra/floating hands or forked shafts. (Identity locked from the two originals in IDENTITY.md; every sheet passed a fingerprint-verified review: one rigid straight sword, wrapped fingers, no extra limbs/forks; stable 3/4 front-right camera and upper-left key light.)
- [x] Fixed scale/ground/saddle pivots and ≤1.5u intended grounded error; no clipped headgear/boots/blade, halo/key residue or unintended panel pixels. (One uniform pack scale 0.662952 with cell-centre/ground anchors; ground error 0 by construction - every content bottom is placed on the ground line; mechanical edge-cut check 0/45; alpha-only glow/speck cleanup with the near-black costume preserved by unit test.)
- [ ] Comparable measured visible head-size and fully observable weapon-length spread≤10%; direction steps≤60° or authored bridge. Unknowns cannot establish compliance. (PARTIAL: the 7 visually fully-observable blade frames measure 283..305px = 7.5% spread, within 10%; occluded/foreshortened/contaminated frames and ALL head-size proxies are recorded `unverified` (CONTINUITY.md, measurements.json, 45 manual-review crops in artifacts/motion/soldier/landmarks/). Direction steps ≤60° with intervening drawings reviewed. Needs producer/owner landmark confirmation before compliance.)
- [x] Pages≤2048², density2, decoded motion≤16MiB, complete signatures/hash/source/provenance; repeats deterministically from sources/config. (page `soldier-1` 2003x1369; decoded 7,809,280 B = 7.45 MiB; manifest sha256 `7f40bf2f...` identical across re-runs; per-frame restored/content hashes, pivots, registration.json, PROVENANCE.md with prompts/references/verdicts.)
- [x] Offline continuity review cites exact frame IDs/crops and source manifest; shared guard/down bookends stable. (CONTINUITY.md cites every sequence's frame IDs and transitions; bookends byte-identical by alias: guard = locomotion:0, down = fall-thrown:3.)
- [x] Original Guan Yu/other completed fighter frames unchanged. No core/gameplay/runtime catalog activation in A. (No `src/game` change; the guanyu RGBA round-trip pin stays green; no MOTION_PACKS registration - CMR-06B.)

## Checks/handoff

Use CMR-04 prepare/quality/negative-control tests and CMR-05 offline capture mode, lint/typecheck and relevant units. Keep captures/logs ignored, committed provenance and accepted sources distinct from temporary output. No unrun browser or native-video acceptance claims. Update attempt/progress and scoped local commit; CMR-06B may start only after these criteria pass.
