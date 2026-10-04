# CMR-11A — Wei Yan: author and prepare complete whole-character pack

- Queue status: IN_PROGRESS (attempt 1). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-10B DONE; CMR-01..05 DONE transitively.
- Pair: [CMR-11B](CMR-11B.md) is the separate runtime/capture task.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/weiyan-body-master.jpg) and [portrait master](../../art/hero-faces/weiyan-portrait-master.png); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `weiyan`; role: hero; current weapon: dao.
- Solid purple-clad severe turbaned identity, no beard/cape. Dao attack -> sweep -> chop; heavy cuts/long recovery. Keep blade shape and hand contact consistent across full hero and mounted sequences.
- Attack bindings: `wy.jab1`, `wy.jab2`, `wy.finisher`, `wy.jumpkick`, `wy.special`, `mounted.sweep`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Lock one cohesive identity/weapon reference from existing original sources; record size, camera, light, costume/cape/headgear and rigid weapon landmarks. Never palette-swap Guan Yu or change current figure definitions to fit a generated picture.
2. Author neutral guides and ordered drawings for ALL applicable sequences: Idle/walk/stop, all three combos with windup/strike/follow-through/recover, takeoff/ascent/apex/descent, aerial kick/retraction/contact/landing, hurt, fall/impact/down/getup, special, grab/hold/release, mount/rider move/sweep/dismount, dying/dead/revive and both facings/mixed interruptions.
3. Review sequence sheets and neighboring poses at gameplay size and4x before requesting more. Reject drift/extra limbs/forked weapon/clipping; targeted edits within budget, not repeated whole sheets.
4. Prepare per-fighter source pack under `art/motion/weiyan/` and runtime assets/meta through CMR-04. Explicit fixed registration, alpha cleanup, trimmed atlas pages, shared guard/down bookends, scale hierarchy, source hashes and exact exposure map. Do not activate it in the production catalog yet.
5. Record per-action verdicts and numerical landmark evidence; unknown/occluded values stay unverified, not acceptance passes. Use offline prepare/fixture rendering to validate planned temporal order and limits.

## Request budget

Originally **16 image requests total for Wei Yan**, shared across CMR-11A/CMR-11B and all continuation rounds. **Owner exception, 2026-10-04, “Do A”: +10 Wei Yan authoring requests, cap 26; the ten v1 requests are still spent.** The durable [budget ledger](../../art/motion/generation-budget.json) is authoritative. The original two-whole-sheet-candidates-per-sequence and 200-global-request limits are unchanged. Preserve every attempt/prompt/ordered reference hash/verdict and remaining allowance. If unavailable tools or cap exhaustion prevent complete accepted art, record exact BLOCKED input rather than publish a partial set. This extension does NOT authorize a page/decode-cap exception.

For an Acceptance-4 failure, use the [bounded diagnosis/redraw protocol](../MOTION_ACCEPTANCE4_RECOVERY.md): reserve before a focused image request, preserve source originals, re-prepare and remeasure. The owner-approved three-round repair-only reserve is separate from the authoring cap stated above; it does not reset task iterations or lower the 10%/60° checks.

## Acceptance

- [ ] Complete applicable clip/state/attack manifest; genuinely distinct walking/action drawings, no old-part frames used as missing new poses.
- [ ] Identity, natural connected anatomy, stable body mass, consistent camera/lighting and weapon design; no mitten/extra/floating hands or forked shafts.
- [ ] Fixed scale/ground/saddle pivots and ≤1.5u intended grounded error; no clipped headgear/boots/blade, halo/key residue or unintended panel pixels.
- [ ] Comparable measured visible head-size and fully observable weapon-length spread≤10%; direction steps≤60° or authored bridge. Unknowns cannot establish compliance.
- [ ] Pages≤2048², density2, decoded motion≤16MiB, complete signatures/hash/source/provenance; repeats deterministically from sources/config.
- [ ] Offline continuity review cites exact frame IDs/crops and source manifest; shared guard/down bookends stable.
- [ ] Original Guan Yu/other completed fighter frames unchanged. No core/gameplay/runtime catalog activation in A.

## Checks/handoff

Use CMR-04 prepare/quality/negative-control tests and CMR-05 offline capture mode, lint/typecheck and relevant units. Keep captures/logs ignored, committed provenance and accepted sources distinct from temporary output. No unrun browser or native-video acceptance claims. Update attempt/progress and scoped local commit; CMR-11B may start only after these criteria pass.
