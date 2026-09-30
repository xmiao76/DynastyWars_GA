# Guan Yu whole-character motion pilot

Owner request: try complete, art-directed whole-character sprite sequences for Guan Yu first. This is a motion experiment, not a cast rollout. Status: IN_PROGRESS (attempt 1).

## Bounded scope

- Idle, one 8-drawing walk loop, and complete gy.jab1 / gy.jab2 / gy.finisher clips (entry, anticipation, active strike, follow-through, recovery, return to idle).
- Runtime behind `?motion=1`, separate from the original `?frames=1` three-pose comparison.
- Simulation, movement speed, damage and attack windows unchanged. Frames selected from simulation ticks, not render callbacks or wall time.
- A complete verified pilot pack loads atomically. No old skeleton blends or paper-doll frames during supported clips. Missing/corrupt pilot pack uses the original renderer throughout; unsupported actions are explicitly outside this trial.
- No other fighters, no deployment, no loop/scheduler changes, no fixes to unrelated UIR-19 or baseline G6 failures.

## Authoring and generation budget

First author neutral rig guides for a whole sequence on a shared 224 x 144 unit canvas (bottom centre, ground at y=136 with8u bottom padding). Each action uses a 3 x 3 sheet; each cell is 512 x 341 px in a 1536 x 1024 reference. Walk includes identity/idle in cell 0 and eight gait drawings. Combat includes idle bookends and seven action drawings.

Generate sheets using the accepted Guan Yu whole-frame idle as the original identity reference. Subsequent sheets also use the walk sheet's idle. Lock head/body ratio, green robe and bronze armour, boots, brown guandao with engraved crescent blade/red tassel, lighting, camera and scale. No independent per-cell rescaling during preparation: one sheet-level scale, explicit registration corrections only (recorded).

Maximum 3 candidate sheets per action, 12 requests total. A candidate is retained, not declared successful solely because generated or because a static contact sheet looks attractive. Repeated holds are permitted; duplicating one pose cannot count as an 8-drawing walk or distinct attack sequence.

## Acceptance (set before generation)

1. **Coverage/runtime:** every tick of idle, walk and all three complete combo clips selects a new whole-character frame; no `blend:` or old pose textures. Negative controls must reject an incomplete pack. Default flag-off behaviour unchanged. Corrupt/missing sheet must reject the entire pilot pack.
2. **Timing:** anticipated motion before the exact startup boundary, strike at the first active tick, follow-through/recovery after active, final recovery settling to shared idle before idle or next combo. Pauses/repeated render calls do not advance frames; skipped render calls cannot delay the strike.
3. **Registration:** fixed units-per-pixel within a sheet; one consistent origin for all cells; no clipping or background/divider residue. Grounded soles <=1.5u from their intended ground line. Head-size spread <=10% across standing walk drawings (measured landmarks, not total silhouette height).
4. **Walk:** eight distinct authored gait drawings, correct opposite-leg cycle; gait period chosen against walk speed. Inspect planted-foot drift and the loop seam in normal-speed footage, not merely silhouettes. Do not claim no foot sliding without measuring/reviewing it.
5. **Temporal look:** face, costume, body mass and weapon keep their design; weapon length spread <=10% across the set (manual landmarks); no extra/missing limbs, double weapons, morphing armour, conspicuous size pops, or abrupt idle/action seams. Report actual deviations without loosening floors.
6. **Evidence:** gameplay-size and enlarged contact sheets plus a real in-game motion recording for idle -> walk -> stop -> three-hit combo -> walk, both facings. Canvas capture and WebGL sanity. Technical tests cannot replace eyes-on sequence review.
7. **Checks:** relevant unit tests, lint, typecheck (baseline unrelated errors reported separately), vision, prodbuild; local-only commit after verification. The earlier GO referred only to static anatomy, not motion acceptance, and is not inherited here.

## Findings and verdict

**Verdict: ITERATE for the motion experiment; NO-GO for accepting these generated drawings as Guan Yu's production animation.** The code path solves the old-renderer flashes within the supported actions. The images do not yet meet the motion-consistency criteria. No acceptance floor was loosened.

### What was implemented

- Four9-cell original candidate sheets,36 prepared cells at density2. Runtime exposes one shared idle, eight walk drawings and seven non-idle drawings for each of three attacks (30 used drawings). Shared idle bookends deliberately avoid redrawn-idle flicker.
- Pure clip sampler chooses drawing directly from `stateTick`. Walk period32ticks, drawing every4ticks. Combat exposures respect existing8/5/14 and12/6/22 startup/active/recover windows. First strike drawing is at exact active boundary; playback has no render-callback blend queue.
- `?motion=1` loads the atlas only when explicitly opted in; it takes precedence over `?frames=1`. Missing/corrupt pack rejects atomically and retains old art. Unknown/mounted/jump/hurt/special/etc deliberately use the old renderer: this is still NOT full Guan Yu action coverage.
- Registration is fixed scale per sheet, waist pivot translations and8u foot padding. Low-opacity generated glow outside the figure's alpha-support is removed. Figures crossing nominal source cells are extracted by connected component, not clipped at grid boundaries.

### Acceptance results

| Check | Result | Evidence / limitation |
|---|---|---|
| No old textures in idle/walk/3-hit combo | PASS |210 samples/renderer, all `entity:guanyu:motion:*`, both facings; browser test. |
| Exact startup/active/recovery sampling | PASS | Every sim tick tested; repeated render calls don't advance; strike cannot lag after skipped renders. |
| Complete/missing/corrupt pack gates | PASS | Missing cell, overlapping cells, out-of-bounds/density/NaN controls; wrong signature and blocked-image browser check. |
| Default appearance and image requests | PASS | Flag-off source/built browser checks; no motion atlas image request. |
| Prepared cell clipping/pad | PASS |36cells all edge-clear, fixed sheet scales; foot line registered by translation. This does not prove planted-foot stability. |
| Correct opposite-leg walk cycle | FAIL | Three walk requests did not reliably preserve guide leg alternation. Runtime uses candidate1 only as diagnostic. |
| Weapon length <=10% spread | FAIL | Manually observed visible endpoint measurements: idle116.5u, sweep74.5u (~36%shorter), chop84.0u (~28%shorter). +/-3source-pixel uncertainty cannot explain the gap. These are visible haft endpoints, not an invented hidden extension through the sleeve. |
| Head-size <=10% and all weapon landmarks | UNVERIFIED | Most landmarks intentionally null; the quality evaluator rejects incomplete evidence. |
| Smooth action boundaries/foot planting | NOT ACCEPTED | Contact strips from actual recordings show size/cloth/stance changes and large weapon-angle jumps. Stop still changes to shared idle directly. Not enough coherent intermediate drawings; no "no foot sliding" claim. |
| Canvas/WebGL | TECHNICAL PASS | Both show the same authored-key selection. Canvas420ticks recorded in~7.0seconds; software headless WebGL takes~23.8seconds, so WebGL footage is a sanity check, NOT evidence of normal-speed smoothness. |

### Visual review honesty

Reviewed prepared drawing sheet, full-resolution source crops and sampled frames extracted from the actual gameplay videos. The face/robe identity generally reads as Guan Yu, and the old segmented-arm appearance is absent during supported clips. But the walk is not a reliable alternating gait; shoulders/costume and visible pole/blade proportions change through attacks. The low sweep is often painted like a shortened thrust and the chop changes blade curvature. The static quality remains better than old parts, while temporal production acceptance is not met.

The tools provide still-image inspection, not a native video viewer. The normal-speed Canvas recording is supplied for owner playback. Frame-strip review must not be represented as a completed human normal-speed viewing. No independent aesthetic reviewer was used; one repository writer was maintained.

### Checks

- Full lint: PASS.
- Motion technical unit tests:8/8PASS, with image-signature tests given a measured20s budget (full suite contention exceeded default5s; thresholds unchanged).
- Default animation/scale/gameplay browser regression subset:5/5PASS.
- Full units:686passed,1failed,4skipped. Sole failure is existing UIR-16 arm-chain G6, already documented and reproduced at baseline before this task. No old-body implementation edited.
- Typecheck: only six existing possibly-undefined errors in `test/game/uir19-hands.test.ts`; no new task errors. That unrelated in-progress task was left untouched.
- In-game motion capture/fallback:4/4PASS (Canvas default, Canvas motion, WebGL motion, missing sheet).
- Vision:5/5PASS.
- Production-build gate:6/6PASS, including two new built motion opt-in/default-off cases.
- No push, deployment, new server outside test-managed GA ports, scheduler or loop-control changes.

### How to inspect

Run `npm run dev`, open `http://localhost:5176/?motion=1`, choose Guan Yu. Walk and all three combo attacks use the diagnostic clips. Without that flag the original renderer remains unchanged. Jump/special/hurt/down/mounted actions are NOT replaced. Press Z repeatedly to buffer the combo.

Source guide regeneration: set `MOTION_GUIDES=1`, run `npx vitest run test/game/motion-guides.test.ts`. Atlas regeneration: `node scripts/prepare-motion.mjs`. Browser recording: set `MOTION_LOOK=1`, run `npx playwright test --project=chromium e2e/motion-look.spec.ts --workers=1`.

Evidence (gitignored): `artifacts/wholeframe/motion/{motion,current,motion-webgl}-ingame.webm`, temporal JSON traces, `drawings-contact.png`, `{motion,current}-recording-contact.png`. Original candidates and rejected revisions retained with hashes in `art/motion/PROVENANCE.md`.

### Recommendation after this attempt

Do NOT expand generation to the other characters or keep retrying whole sheets blindly. Seven requests were used (of12); walk reached its3-request cap without passing. The rendering/clip pipeline is useful, but prompt-only sheet generation is not supplying dependable kinematics.

To continue this sprite route, correct a small set of neighbouring walk/weapon drawings with deliberate paint/edit work and enforce the rigid glaive from locked landmarks. If that correction burden remains high, switch the ART production source to a properly modelled/rigged Guan Yu rendered offline into the SAME sprite-clip runtime. That would make face/body/armour and weapon dimensions structurally consistent; it is a separate owner-approved production choice, not something silently introduced in this trial.
