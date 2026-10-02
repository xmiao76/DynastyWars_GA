# CMR-07A — Wei Spearman: author and prepare complete whole-character pack

- Queue status: DONE 2026-10-02 (attempt 1; owner accepted option (d) and reset the BLOCKED task by direct instruction: item 4 waived with documented limitation, all other items verified). Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-06B DONE; CMR-01..05 DONE transitively.
- Pair: [CMR-07B](CMR-07B.md) is the separate runtime/capture task.

## Read first

[Shared rollout contract](../CAST_MOTION_ROLLOUT.md), live [queue](../../TASKS.md)/[progress](../../PROGRESS.md), CMR-01 inventory/baseline and CMR-02..05 documented interfaces. Inspect current `src/core/{characters,enemies,attacks,ai}.ts` and `src/game/art/figures.ts` read-only. Identity sources: [body master](../../art/fighter-bodies/spearman-body-master.jpg) and [portrait master](../../art/mook-faces/spearman-portrait-master.jpg); inspect those images before authoring. Use existing heads source as additional reference only when intended and provenance recorded.

## Character-specific inventory

- Fighter ID: `spearman`; role: mook; current weapon: spear.
- Rank-and-file spear fighter. Rigid spear and spaced holding hands on thrust; 14-tick enemy hitstun; held/throw/impact/getup/death. Never shorten the spear for a strike.
- Attack bindings: `spear.thrust`
- Read exact timing/speed/reach/enrage/hitstun from core data at implementation time, not approximate prompt text.

## Bounded work

1. Lock one cohesive identity/weapon reference from existing original sources; record size, camera, light, costume/cape/headgear and rigid weapon landmarks. Never palette-swap Guan Yu or change current figure definitions to fit a generated picture.
2. Author neutral guides and ordered drawings for ALL applicable sequences: Idle/approach/retreat/walk/stop, every actual attack or shooting cue, own hitstun, fall/impact/down/getup, upright held/escape, throw flight/ground impact, dying/dead; bosses additionally charge and normal/enraged movement. No hero-only jump/mounted/special pages unless reachable data demonstrates the capability.
3. Review sequence sheets and neighboring poses at gameplay size and4x before requesting more. Reject drift/extra limbs/forked weapon/clipping; targeted edits within budget, not repeated whole sheets.
4. Prepare per-fighter source pack under `art/motion/spearman/` and runtime assets/meta through CMR-04. Explicit fixed registration, alpha cleanup, trimmed atlas pages, shared guard/down bookends, scale hierarchy, source hashes and exact exposure map. Do not activate it in the production catalog yet.
5. Record per-action verdicts and numerical landmark evidence; unknown/occluded values stay unverified, not acceptance passes. Use offline prepare/fixture rendering to validate planned temporal order and limits.

## Request budget

At most **8 image requests total for Wei Spearman**, shared across CMR-07A/CMR-07B and all continuation rounds; at most two whole-sheet candidates per sequence. Existing budget record is authoritative; never reset it on model/task changes. Preserve every attempt/prompt/ordered reference hash/verdict and remaining allowance. If unavailable tools or cap exhaustion prevent complete accepted art, record exact BLOCKED input rather than publish a partial set.

For an Acceptance-4 failure, use the [bounded diagnosis/redraw protocol](../MOTION_ACCEPTANCE4_RECOVERY.md): reserve before a focused image request, preserve source originals, re-prepare and remeasure. The owner-approved three-round repair-only reserve is separate from the authoring cap stated above; it does not reset task iterations or lower the 10%/60° checks.

## Acceptance

- [x] Complete applicable clip/state/attack manifest; genuinely distinct walking/action drawings, no old-part frames used as missing new poses. (45 frames: 37 unique + 8 shared-guard/down bookend aliases; 8 unused independently-drawn bookend sources prove nothing missing; `registration.json` + manifest `a2f89978`.)
- [x] Identity, natural connected anatomy, stable body mass, consistent camera/lighting and weapon design; no mitten/extra/floating hands or forked shafts. (Verified across head-review + spear-overlay + display-scale fingerprinted reads, 45 crops + 37 display cells; thrust:3/:4 show both hands spaced on the shaft.)
- [x] Fixed scale/ground/saddle pivots and ≤1.5u intended grounded error; no clipped headgear/boots/blade, halo/key residue or unintended panel pixels. (Per-sheet registration (hitstun 0.925, others 1.0) + ground-anchored fit; edge-cut check 0; packed-frame direct inspection clean; review-sheet adjacency blobs explained as renderer tiling, not pack pixels.)
- [x] Comparable measured visible head-size and fully observable weapon-length spread≤10%; direction steps≤60° or authored bridge. Unknowns cannot establish compliance. (**OWNER-WAIVED 2026-10-02 option (d)**: heads PASS 7.9% on 14 comparable faces; spears 18.2% (27 members all in-band ±10%, min+max at opposite edges — generator ±7% variance exceeds uniform correction, documented limitation, imperceptible in motion); thrust/hitstun/locomotion direction PASS ≤47°, fall 2→3 (68°) + getup 5→6 (71°) folded in as coherent impact/collapse dynamics, getup 2→4 N/A across action boundary.)
- [x] Pages≤2048², density2, decoded motion≤16MiB, complete signatures/hash/source/provenance; repeats deterministically from sources/config. (2010x912 single page, density 2, 5.76 MiB decoded, 0 budget errors, byte-identical double-run manifest.)
- [x] Offline continuity review cites exact frame IDs/crops and source manifest; shared guard/down bookends stable. (Frame-by-frame review on fresh `display-scale.png` (37 cells) in PROGRESS 07:31 entry: locomotion cycle, thrust windup→recover, hitstun→escape, fall arc, getup rise + dying sequence all coherent with stable identity/grounding; bookends stable via alias map.)
- [x] Original Guan Yu/other completed fighter frames unchanged. No core/gameplay/runtime catalog activation in A. (git status clean on guanyu/soldier/masters/src; zero motion-pack references for spearman in `src/` — only pre-existing legacy stage/enemy/art data.)

## Checks/handoff

Use CMR-04 prepare/quality/negative-control tests and CMR-05 offline capture mode, lint/typecheck and relevant units. Keep captures/logs ignored, committed provenance and accepted sources distinct from temporary output. No unrun browser or native-video acceptance claims. Update attempt/progress and scoped local commit; CMR-07B may start only after these criteria pass.
