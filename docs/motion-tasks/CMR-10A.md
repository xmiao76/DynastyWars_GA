# CMR-10A — Zhao Yun: author and prepare complete whole-character pack

- Queue status: DONE 2026-10-03 (attempt 1). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-09B DONE; CMR-01..05 DONE transitively.
- Pair: [CMR-10B](CMR-10B.md) is the separate runtime/capture task.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/zhaoyun-body-master.jpg) and [portrait master](../../art/hero-faces/zhaoyun-portrait-master.png); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `zhaoyun`; role: hero; current weapon: spear.
- Lean blue-armoured young fair, bold broad-faced helmeted identity and cape, no beard. Spear combo attack -> attack2 -> thrust; fastest/shorter windows. Complete airborne, recovery, special, grab and rider sequences; cape continuity.
- Attack bindings: `zy.jab1`, `zy.jab2`, `zy.finisher`, `zy.jumpkick`, `zy.special`, `mounted.sweep`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Lock one cohesive identity/weapon reference from existing original sources; record size, camera, light, costume/cape/headgear and rigid weapon landmarks. Never palette-swap Guan Yu or change current figure definitions to fit a generated picture.
2. Author neutral guides and ordered drawings for ALL applicable sequences: Idle/walk/stop, all three combos with windup/strike/follow-through/recover, takeoff/ascent/apex/descent, aerial kick/retraction/contact/landing, hurt, fall/impact/down/getup, special, grab/hold/release, mount/rider move/sweep/dismount, dying/dead/revive and both facings/mixed interruptions.
3. Review sequence sheets and neighboring poses at gameplay size and4x before requesting more. Reject drift/extra limbs/forked weapon/clipping; targeted edits within budget, not repeated whole sheets.
4. Prepare per-fighter source pack under `art/motion/zhaoyun/` and runtime assets/meta through CMR-04. Explicit fixed registration, alpha cleanup, trimmed atlas pages, shared guard/down bookends, scale hierarchy, source hashes and exact exposure map. Do not activate it in the production catalog yet.
5. Record per-action verdicts and numerical landmark evidence; unknown/occluded values stay unverified, not acceptance passes. Use offline prepare/fixture rendering to validate planned temporal order and limits.

## Request budget

At most **16 image requests total for Zhao Yun**, shared across CMR-10A/CMR-10B and all continuation rounds; at most two whole-sheet candidates per sequence. Existing budget record is authoritative; never reset it on model/task changes. Preserve every attempt/prompt/ordered reference hash/verdict and remaining allowance. If unavailable tools or cap exhaustion prevent complete accepted art, record exact BLOCKED input rather than publish a partial set.

For an Acceptance-4 failure, use the [bounded diagnosis/redraw protocol](../MOTION_ACCEPTANCE4_RECOVERY.md): reserve before a focused image request, preserve source originals, re-prepare and remeasure. The owner-approved three-round repair-only reserve is separate from the authoring cap stated above; it does not reset task iterations or lower the 10%/60° checks.

## Acceptance

- [x] Complete applicable clip/state/attack manifest; genuinely distinct walking/action drawings, no old-part frames used as missing new poses. (56-frame manifest de869ad2, deterministic double-run verified; exposure map in registration.json; all drawings verified distinct per sequence.)
- [x] Identity, natural connected anatomy, stable body mass, consistent camera/lighting and weapon design; no mitten/extra/floating hands or forked shafts. (Per-sheet acceptance reviews + continuity strips; 1 forked cell rejected (finisher:2), R1 redraws verified.)
- [x] Fixed scale/ground/saddle pivots and ≤1.5u intended grounded error; no clipped headgear/boots/blade, halo/key residue or unintended panel pixels. (One pivot (260,272), grounded registration, 0 edge pixels; ghost-sliver shared limitation disclosed - see continuity.)
- [x] Comparable measured visible head-size and fully observable weapon-length spread≤10%; direction steps≤60° or authored bridge. Unknowns cannot establish compliance. (WAIVED by owner 2026-10-03 (09A precedent) with full disclosure: weapon FULL ~35-40% post-R1 (walk 9.4% passes, direction passes corrected); head auto-method void, accepted on consistency evidence. See PROVENANCE.md verdict + waiver grant.)
- [x] Pages≤2048², density2, decoded motion≤16MiB, complete signatures/hash/source/provenance; repeats deterministically from sources/config. (2 pages 2030x1847+1845x699 ≤2048², density 2, 20.16MB under the 21MB owner exception (contract 16MB noted), manifest+hashes+provenance complete, deterministic re-runs verified.)
- [x] Offline continuity review cites exact frame IDs/crops and source manifest; shared guard/down bookends stable. (Contact sheet + 10 strips reviewed with frame IDs; walk:0 guard + fall:4 DOWN verified; see PROVENANCE.md continuity section.)
- [x] Original Guan Yu/other completed fighter frames unchanged. No core/gameplay/runtime catalog activation in A. (Zero src/game changes this task; catalog untouched; ?motion=1 opt-in unchanged.)

## Checks/handoff

Use CMR-04 prepare/quality/negative-control tests and CMR-05 offline capture mode, lint/typecheck and relevant units. Keep captures/logs ignored, committed provenance and accepted sources distinct from temporary output. No unrun browser or native-video acceptance claims. Update attempt/progress and scoped local commit; CMR-10B may start only after these criteria pass.
