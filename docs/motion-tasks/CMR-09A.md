# CMR-09A — Zhang Fei: author and prepare complete whole-character pack

- Queue status: DONE 2026-10-03 (attempt 1; item 4 owner-waived). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-08B DONE; CMR-01..05 DONE transitively.
- Pair: [CMR-09B](CMR-09B.md) is the separate runtime/capture task.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/zhangfei-body-master.jpg) and [portrait master](../../art/hero-faces/zhangfei-portrait-master.png); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `zhangfei`; role: hero; current weapon: pike.
- Heavy build, bristled dark beard, ruddy complexion, headband, serpent pike. Combo uses thrust -> attack2 -> sweep, not Guan Yu glaive cuts. Faster early jabs, heavy sweep finisher; all aerial/special/grab/rider actions.
- Attack bindings: `zf.jab1`, `zf.jab2`, `zf.finisher`, `zf.jumpkick`, `zf.special`, `mounted.sweep`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Lock one cohesive identity/weapon reference from existing original sources; record size, camera, light, costume/cape/headgear and rigid weapon landmarks. Never palette-swap Guan Yu or change current figure definitions to fit a generated picture.
2. Author neutral guides and ordered drawings for ALL applicable sequences: Idle/walk/stop, all three combos with windup/strike/follow-through/recover, takeoff/ascent/apex/descent, aerial kick/retraction/contact/landing, hurt, fall/impact/down/getup, special, grab/hold/release, mount/rider move/sweep/dismount, dying/dead/revive and both facings/mixed interruptions.
3. Review sequence sheets and neighboring poses at gameplay size and4x before requesting more. Reject drift/extra limbs/forked weapon/clipping; targeted edits within budget, not repeated whole sheets.
4. Prepare per-fighter source pack under `art/motion/zhangfei/` and runtime assets/meta through CMR-04. Explicit fixed registration, alpha cleanup, trimmed atlas pages, shared guard/down bookends, scale hierarchy, source hashes and exact exposure map. Do not activate it in the production catalog yet.
5. Record per-action verdicts and numerical landmark evidence; unknown/occluded values stay unverified, not acceptance passes. Use offline prepare/fixture rendering to validate planned temporal order and limits.

## Request budget

At most **16 image requests total for Zhang Fei**, shared across CMR-09A/CMR-09B and all continuation rounds; at most two whole-sheet candidates per sequence. Existing budget record is authoritative; never reset it on model/task changes. Preserve every attempt/prompt/ordered reference hash/verdict and remaining allowance. If unavailable tools or cap exhaustion prevent complete accepted art, record exact BLOCKED input rather than publish a partial set.

For an Acceptance-4 failure, use the [bounded diagnosis/redraw protocol](../MOTION_ACCEPTANCE4_RECOVERY.md): reserve before a focused image request, preserve source originals, re-prepare and remeasure. The owner-approved three-round repair-only reserve is separate from the authoring cap stated above; it does not reset task iterations or lower the 10%/60° checks.

## Acceptance

- [x] Complete applicable clip/state/attack manifest; genuinely distinct walking/action drawings, no old-part frames used as missing new poses. (56 frames: walk 9, jab1/jab2/finisher 5 each, jump 6, fall/getup/misc/special 5 each, rider 6 - manifest `55e09318...`; every frame is new zhangfei art, nothing references legacy textures.)
- [x] Identity, natural connected anatomy, stable body mass, consistent camera/lighting and weapon design; no mitten/extra/floating hands or forked shafts. (Per-sheet acceptance reviews + the display-scale continuity review of all 56 frames: HEAVY build, bristle beard, headband, vest+rope belt, one serpent pike + tassel throughout; fingers wrap; no armor/cape/helmet.)
- [x] Fixed scale/ground/saddle pivots and ≤1.5u intended grounded error; no clipped headgear/boots/blade, halo/key residue or unintended panel pixels. (One pivot (260,272) on all 56 frames; trim bottoms land exactly on the ground line, max deviation 0px = 0.0u; trim+pad cell fit enforced by the pipeline (it throws otherwise); alpha cleanup within residue tolerance; sheets verified transparent with no panels/text.)
- [x] Comparable measured visible head-size and fully observable weapon-length spread≤10%; direction steps≤60° or authored bridge. Unknowns cannot establish compliance. (**WAIVED by the owner 2026-10-03 ("waive now") under the CMR-07A option-(d) precedent, with full disclosure in PROVENANCE.md**: head 6.4% on the thrust-pose subset / 11.2% incl. finisher uprights (the earlier 6.4% pass claim corrected - the method is pose-confounded); weapon FULL set 88.3% (33 cells, 153.6-442.2 displayed), 41.9% excl extremes, walk 12.9%; direction ≤36° on play order with the authored finisher bridge + special pre-spin - PASS, no waiver needed. Repair rounds 1-2 spent narrowing it; the reserve arithmetic cannot reach 10% pack-wide.)
- [x] Pages≤2048², density2, decoded motion≤16MiB, complete signatures/hash/source/provenance; repeats deterministically from sources/config. (Pages 2004x2026 + 1693x768; density 2; 16,730,172 B = 15.95 MiB <= 16 MiB; manifest sha + per-frame restored/content hashes + sheet shas + registration; byte-identical double-run re-verified at close-out.)
- [x] Offline continuity review cites exact frame IDs/crops and source manifest; shared guard/down bookends stable. (PROVENANCE.md "Acceptance-4 waiver + continuity review": all 56 frames reviewed frame-by-frame on the fresh display-scale contact sheet + 10 full-scale strips; guards ARE walk:0 and the down IS fall:4 by clip convention - the same pattern as Guan Yu's clips - both drawings verified in those roles.)
- [x] Original Guan Yu/other completed fighter frames unchanged. No core/gameplay/runtime catalog activation in A. (`git diff ef2738c..HEAD`: zero changes under `src/`, zero in other packs, zero in motion-art/clips; the task touched only zhangfei art+scripts, the two budget ledgers, and docs/queue files; no runtime emission.)

## Checks/handoff

Use CMR-04 prepare/quality/negative-control tests and CMR-05 offline capture mode, lint/typecheck and relevant units. Keep captures/logs ignored, committed provenance and accepted sources distinct from temporary output. No unrun browser or native-video acceptance claims. Update attempt/progress and scoped local commit; CMR-09B may start only after these criteria pass.
