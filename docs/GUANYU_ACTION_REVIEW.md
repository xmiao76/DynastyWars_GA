# Guan Yu all-action review and completion

Owner follow-up, 2026-09-30: regular movement looks good; jumping and falling remain wrong. This is **GYM-1 attempt 2**. Preserve the existing regular drawings, review the remaining actions and their boundaries, and keep other fighters and gameplay unchanged.

**Result:** all-state whole-character coverage is implemented. Jump, landing, falling and getting up no longer switch to the old paper-doll renderer. The reviewed sequences are substantially more coherent, but this is **not a claim that every drawing or transition is perfected**. Owner normal-speed review and some weapon/detail polish remain open.

## Root causes

- The original motion sampler deliberately returned no new frame for jump, aerial attack, special, hurt, knockdown, getup, grab, death and every mounted state. These fell back to old parts and could enter the old skeleton blend queue.
- The core's 36-tick jump returns directly to idle. There was no visual landing sequence.
- Knockdown/KO sets collision height to zero immediately, even when hit in midair. That made the rendered fighter teleport to the ground.
- The old getup path displayed standing idle throughout its 24 ticks rather than a floor-to-standing sequence.
- Solo defeat freezes the simulation when CONTINUE appears. A state-timed fall would freeze upright unless presentation can finish independently.

## Inventory and implementation

| Action | Clock and implementation |
|---|---|
| Idle, walk, three-hit combo | Original state-timed drawings and exposures preserved. Original atlas and preparation metadata are byte-identical to owner-reviewed baseline `f37b70b`. |
| Jump | Uses `airTicks`, not attack state resets: launch crouch, knee tuck/apex, descent extension. Existing 36-tick jump arc unchanged. |
| Aerial kick | Four-tick startup and 20-tick active window retained; one leg extends, retracts before landing and enters landing compression. |
| Landing | Eight-tick presentation-only compression/settle. Can be interrupted immediately by an attack or another jump; no input lock or damage delay. |
| Hurt | Twenty-tick recoil, recovery and shared idle. |
| Knockdown | Recoil, tipping, near-horizontal fall, impact and prone hold within the existing 36 ticks. |
| Getting up | Same prone frame as knockdown, then sit-up, seated, kneeling, crouch, rise and shared idle within the existing 24 ticks. |
| Midair hit | Previous visual height eases to ground over ten unfrozen state ticks. Core collision height remains zero as before. |
| Dying/dead | Fall and fade; already-grounded characters do not restart standing. Completed fade stays invisible on dead, including the ground shadow. |
| Solo continue | Presentation-only defeat clock finishes the fall while core ticks stay frozen. Pause freezes this clock too. |
| Special | Existing 6/12/12 startup/active/recovery timing, new anticipation/sweep/follow-through/recovery drawings. |
| Grab/throw release | Reach/hold pose, release drawing and settle. The opponent still uses its existing renderer. |
| Mounted idle/walk/sweep | Seated rider, small bob and existing 8/6/14 mounted attack timing. Horse is drawn separately. |
| Dismount | Partial leg straightening, landing compression and standing idle; interruptible. |
| Grabbed, thrown, fleeing | Defensive mappings remain entirely new art. These are not normally assigned to the player in this core; full unique animation for each is not claimed. |

Every one of the 15 `EntityState` values has a Guan Yu whole-character frame, on foot and mounted. Defensive unknown attack IDs use new idle rather than leaking old parts. Once a valid pack is present, Guan Yu never visits the old rig's in-between rendering path.

## Assets and registration

- Existing regular atlas: 36 cells, unchanged.
- Additional actions atlas: 54 cells at density 2, **2688 × 2592**, approximately **2.62 MB PNG**. Its longest dimension stays below 4096 rather than the initially tall 5184-pixel layout.
- Both atlases and all cells must verify before publishing. Missing or corrupted action art rejects the whole pack; it cannot silently mix models per action.
- One fixed scale per source sheet and explicit translation pivots. No runtime per-pose rescaling to standing height.
- Generated getup drawings arrived in the wrong order. The recorded order `6,7,8,5,4,3,2,1,0` turns them into prone → sit → kneel → rise.
- Shared `fall:6` prone and `walk:0` idle bookends avoid independently repainted boundary flashes.
- Three focused fall-image overrides have explicit source density/registration because their returned source canvases differ from the sheets. They are not dynamically resized each frame.
- Low-alpha glow outside the foreground component is removed; all prepared cells have clear padded edges.

Source hashes, prompts, rejection and focused repair history are in [ACTION_PROVENANCE.md](../art/motion/ACTION_PROVENANCE.md). Preparation is reproducible from [action-registration.json](../art/motion/guanyu/action-registration.json).

## Visual review: actual in-game frame sequences

Reviewed the prepared sheets and actual Canvas action strips, with mirrored/WebGL captures for renderer checks. These are observations of the pixels, not conclusions from texture names alone.

| Action | Concrete observation and verdict |
|---|---|
| Jump | Knees bend for launch, both boots tuck at the apex, then extend for descent; knees compress on landing before he stands. Red face/green robe remain consistent rather than switching to the older head/arms. Improved. |
| Jump kick | One boot extends forward while the other knee remains bent; a tucked drawing now appears before contact and the landing crouch. No old generic attack pose intervenes. |
| Hurt | Head and shoulders recoil backward, then settle. Translucency after recovery is the existing mercy-invulnerability effect, not a crossfade. |
| Knockdown/getup | Body tips backward, reaches near-horizontal and holds on the floor. Recovery raises the shoulders, sits, brings a knee under the body and rises. Lying art does not inflate to a standing-height box. |
| Midair fall | Airborne body descends while tipping; shadow remains on the ground. Core height is unchanged; hit-stop does not advance the visual drop. |
| KO | Figure finishes prone and fades. Solo CONTINUE no longer traps him standing, and dead does not reappear at full opacity. |
| Special | Anticipation, sweep, follow-through and guard are all whole-character drawings. Blade/pole dimensions still vary and are not certified within 10%. |
| Grab/release | Guan Yu's open hand reaches and curls back on release. **Remaining:** the opponent's existing prone grabbed pose does not meet that collar reach, so the two-character interaction remains visually mismatched. |
| Mounted | Bent knees/boots read as a seated rider against the horse. Part of the near leg is occluded by the saddle/horse's existing layer order. Weapon thinness and a large windup change remain polish areas. |
| Dismount | Seated → partly straightened leg → landing crouch → idle, instead of an instant change to the old standing character. |
| Rare defensive states | Frame coverage tested; not separately artist-certified complete held/thrown dynamics. |

### Located fall defect and correction

The first fall sheet rotated the glaive left with the body and then right on impact. A whole-sheet correction produced a forked/two-shaft weapon and was **rejected**. Instead, three focused edits repaired only the affected fall drawings, placing both hands on one straight haft.

The updated actual knockdown strip shows **upright → forward diagonal → near-horizontal → prone** without the left/right blade flip or forked shaft. Minor decorative differences remain visible; this is not evidence of perfectly identical blade proportions.

### Limits of acceptance

- Owner accepted regular movement; those pixels were not regenerated. Earlier objective weapon-length findings remain recorded rather than erased.
- All-state coverage and old-renderer removal are verified. Complete head/weapon landmark consistency across every drawing is **not** certified.
- Some cloth and weapon detail changes remain, especially special/mounted and the edited fall drawings.
- The still-image tools support contact-strip inspection, not native video playback. Actual videos are supplied for owner normal-speed review. Frame-strip review is not misrepresented as human video inspection.
- Software headless WebGL recordings run slower than the normal-speed Canvas capture; they are renderer sanity evidence, not a smoothness proof.

## Verification

- Lint: passed.
- Motion/action unit tests: **15/15 passed**. Every state/tick, atomic dual-pack negative controls, airborne clock, active-window timing, landing interruption, hit-stop, shared bookends and atlas integrity covered.
- Full unit suite: **693 passed, 1 failed, 6 skipped**. Sole remaining failure is the documented baseline arm-chain G6.
- Typecheck: only the six existing possibly-undefined errors in `test/game/uir19-hands.test.ts`; no new task errors. Unrelated task left untouched.
- All-action browser cases: **4/4 passed** (Canvas/WebGL, both facings; missing action atlas; solo KO/pause).
- Regular motion browser regression: **4/4 passed**.
- Default animation/scale/pause/continue/horse regression subset: passed.
- Vision: **5/5 passed**.
- Production gate: **6/6 passed**, including both opt-in atlas requests, built jump/down/getup sampling and no optional atlas requests by default.
- Dual-atlas corruption test budget increased from 20 to 40 seconds after a full-suite contention timeout; image/signature thresholds were unchanged.

No other fighters or core gameplay changed. No push, deployment, scheduler change, or replacement dev server. Owner's existing port-5176 server left alone.

## Try it

Refresh **http://localhost:5176/?motion=1**, then select Guan Yu. Jump with X, press Z in the air to kick, C for special, Z for combos. The motion pack remains opt-in; a URL without `motion=1` still selects the original renderer.

Evidence is under `artifacts/wholeframe/actions/`:

- `canvas-all-actions.webm`: all normal actions and transitions in both facings.
- `webgl-all-actions.webm`: renderer sanity recording.
- Action-specific `*-ingame-strip.png`: actual game frames.
- JSON tick traces and `solo-ko-continue.png`.

Capture: set `GUANYU_ACTIONS=1`, then run:

```text
npx playwright test --project=chromium e2e/guanyu-actions.spec.ts e2e/guanyu-solo-ko.spec.ts --workers=1
```

Regenerate added art with `node scripts/prepare-actions.mjs`; it does not modify the regular atlas.

**Status: all-state coverage implemented and verified; final smoothness acceptance remains IN_PROGRESS pending owner playback and localized detail/interaction polish.**
