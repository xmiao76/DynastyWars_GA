# CMR-14B-transition-review-01 — consumer transition/contact evidence

## Scope and disposition

Foreground sole writer, <=18-minute package. Parent owns manual run `2026-10-11T19-45-36-272Z-f3fad747-6f61-4447-bed2-114fc3089266` and all task/runner decisions. **Scoped regression fixed, consumer-only; whole CMR-14B remains IN_PROGRESS.** No native Host lease receipt available; none fabricated. No task/progress/control write, generation, source-art/metadata/emitter/clip/core/shared-player edit, commit, push, deployment, nested agent or intentional background work.

Net files: new [boundary spec](../../e2e/xiahoudun-transitions.spec.ts), new [pixel review script](../../scripts/review-xiahoudun-runtime.mjs), targeted [Xiahou unit regression](../../test/game/motion-xiahoudun.test.ts#L227), six-line Xiahou-only [adapter history bridge](../../src/game/adapters/motion-art.ts#L762-L768), this report. Existing unrelated dirty changes retained. The capture CLI was temporarily given a Xiahou-specific `--output` argument so its Playwright native output stayed in the fresh root, then restored byte-for-byte to its incoming version; no net capture-harness change. Fresh reports honestly hash that transient capture-only version, not the final source version. No moves/deletes or old interaction/motion-review/default-stage2 writes.

## New defect and actual red → green

Core victim state is `grabbed`; shared history release recognizes the holder's `grab`. Previously actual `grabbed → walk` selected `walk:1`, skipping `misc:4`. [Actual red evidence](../../artifacts/CMR-14B/transitions-01/unit-red.txt): **1 failed / 47 skipped**, expected `misc:4`, received `walk:1`.

Minimal adapter bridge synthesizes only the previous presentation state as `grab` when Xiahou is now free (`grabbedBy === null`), grounded (`z === 0`), unmounted and idle/walk. It does not alter core entity fields, delays, shared clocks, throws, attacks or death. Existing shared release logic then owns the six-tick lifetime, frozen entity-clock behavior and guard return. Unit regression also exercises thrown/dying/attack exclusions and `forgetMotionEntity` reuse. **Final 48/48 Xiahou tests PASS** (original 47 plus this regression); no new remaining local history defect demonstrated.

## Four actual production boundary cases

Final [browser output](../../artifacts/CMR-14B/transitions-01/browser-run6.txt): **4/4 PASS**, Canvas/WebGL × initial right/left, 34.9s. Each ordinary solo GU stage2 start prepares actual default ZF. Every sample invokes actual `GameScene.syncSprites → ensureMotionFrame`, reads real Sprite frame/texture/transform, never `setFrame`.

[Canvas-right trace](../../artifacts/CMR-14B/transitions-01/browser-run6/canvas-right/trace.json), [Canvas-left](../../artifacts/CMR-14B/transitions-01/browser-run6/canvas-left/trace.json), [WebGL-right](../../artifacts/CMR-14B/transitions-01/browser-run6/webgl-right/trace.json), [WebGL-left](../../artifacts/CMR-14B/transitions-01/browser-run6/webgl-left/trace.json) distinguish **INJECTED adversarial** starting poses from **CORE-derived** outcomes:

- shared DOWN → dying remains `fall:4` throughout, no standing insertion;
- injected getup kneel/crouch (ticks10/14) → knockdown/dying reverses low getup frames to DOWN. Real combat excludes hitting getup, so these are explicitly adversarial, not natural damage claims;
- `applyHitWithAttack` on an injected active heavy fixture immediately selects hurt; world ticks advance during eight freeze steps but entity stateTick/frame do not age;
- skipped attack renders sample latest `charge:4` at actual tick35, no queued strike; skipped hurt samples latest binding;
- actual thrown physics moves x at vx3.5 with AI stateTick stopped; 12 hit-stop world steps add zero x/flight age; impact settles low;
- actual movement input acquires grab, actual core hit interrupts holder, actual `stepGrab` frees victim into walk: `misc:4 → guard/walk`, frozen release retains `misc:4`;
- second grab/release repeats after actual entity deletion/sprite-removal pass calls `forgetMotionEntity`, no phantom seeded frame/whole-map reset;
- actual current facing is inverted (not assumed initial facing, since AI may turn): same key/x/y/origin/scale/clock, only flip changes.

Final native videos (retained, **NOT viewed**, manually stepped, not normal-paced certification): [Canvas right](../../artifacts/CMR-14B/transitions-01/native-run6/xiahoudun-transitions-Xiah-dfcdb-ion-boundaries-canvas-right-chromium/video.webm), [Canvas left](../../artifacts/CMR-14B/transitions-01/native-run6/xiahoudun-transitions-Xiah-35dc6-tion-boundaries-canvas-left-chromium/video.webm), [WebGL right](../../artifacts/CMR-14B/transitions-01/native-run6/xiahoudun-transitions-Xiah-3d0c6-tion-boundaries-webgl-right-chromium/video.webm), [WebGL left](../../artifacts/CMR-14B/transitions-01/native-run6/xiahoudun-transitions-Xiah-7ac38-ction-boundaries-webgl-left-chromium/video.webm). Trace `wallMs` supplies approximate anchors since in-page evaluation began; recorder start offset unknown.

Boundary full-scene views include [real freed victim release](../../artifacts/CMR-14B/transitions-01/browser-run6/webgl-right/victim-release-0.png), [kneel KO first beat](../../artifacts/CMR-14B/transitions-01/browser-run6/canvas-right/getup10-dying-0.png), [crouch low-tail](../../artifacts/CMR-14B/transitions-01/browser-run6/webgl-left/getup14-knockdown-10.png). Opened WebGL release: victim release drawing is visible but overlaps the hit holder; **paired body/contact clearance is NOT certified** and remains a CMR23/independent review criterion.

## Fresh default full39 captures and cost

Serial existing CLI commands: `node scripts/motion-capture.mjs --fighter xiahoudun --role boss --enemy xiahoudun --renderer canvas|webgl --out artifacts/CMR-14B/fresh-default-01`.

Canvas **1/1 PASS in1.0m**, WebGL **1/1 PASS in3.0m**; each484rows,39keys per facing,102 crops, zero trace/blank/key-drift hard defects. Open ground/contact/weapon-tip gates remain open. These captures precede the local release bridge; they are fresh-default fullframe inventory evidence, not final-bridge code provenance. Final post-fix boundaries separately retain fresh production output.

[Canvas all39 right](../../artifacts/CMR-14B/fresh-default-01/xiahoudun-canvas/all-39-right.png), [WebGL all39 left](../../artifacts/CMR-14B/fresh-default-01/xiahoudun-webgl/all-39-left.png) opened: full spear/head/boots present, shared DOWN matches, heavy notably larger and upright misc/getup smaller than guard (carried A limitations, not newly waived). All four facing sheets are retained. [Canvas runtime](../../artifacts/CMR-14B/fresh-default-01/xiahoudun-canvas/runtime.json) and [WebGL runtime](../../artifacts/CMR-14B/fresh-default-01/xiahoudun-webgl/runtime.json): registry GU/ZF/Xiahou/soldier; **12,372,346 source/network B <12,582,912 cap**, retained/GPU59,039,048B<134,217,728; Xiahou2,220,630download/12,991,664decodedB; zero cloned-cell bytes. Spear/archer remain legacy budget fallback. Ledger legacyFallbackCost0 is not whole-game memory.

Owner-playable fresh [Canvas WebM](../../artifacts/CMR-14B/fresh-default-01/xiahoudun-canvas/xiahoudun-canvas.webm) and [WebGL WebM](../../artifacts/CMR-14B/fresh-default-01/xiahoudun-webgl/xiahoudun-webgl.webm): retained, not viewed; slow capture is not normal-pace acceptance.

## Actual drawn-pixel ground and gait

[Final pixel report](../../artifacts/CMR-14B/transitions-01/pixel-run6/report.json), [manual boot ROIs](../../artifacts/CMR-14B/transitions-01/boot-landmarks.json), [native/enlarged foot support](../../artifacts/CMR-14B/transitions-01/pixel-run6/upright-feet-support.png). Native feet support opened before choosing ROIs: actual leather boot soles identified per pose, not a tassel/cloak/global alpha bounding box. Atlas extraction only supports landmark identity; numeric world coordinates use **actual live Sprite** scale0.5, displayOrigin260/420, source520×436, origin0.5/210÷218, x/y/flip read from production. Scale1 art-unit intent is represented by density2 texture at0.5, no pose-wise fit.

64 actual upright/contact samples over4cases, all walk0..8, misc0..4 and RISE: selected visible sole bottom edges **−0.5 to+0.5u relative entity.y**, inside±1.5u. All nonzero-alpha AA pixels counted; no255-only/component-count false fragmentation. This is **visible image-plane registration only**, not hidden3D/perspective or both-foot contact PASS; unchosen/occluded foot remains UNVERIFIED. fall1/2 airborne sources never get lowest-tassel ground assertions.

All39 packed records reconstructed untrimmed with exact RGBA. **0 nontransparent pixels on full-cell perimeter**, **0 nontransparent pixels among unused atlas pixels**. Actual scene crops show complete body; trimmed rectangle edges are intentionally tight and are not themselves clipping failures. No broad baked background/divider/neighbor leakage found; no count-based claim of certified connectivity.

[Canvas-right gameplay strip](../../artifacts/CMR-14B/transitions-01/pixel-run6/walk-live-canvas-right.png), [WebGL-left enlarged strip](../../artifacts/CMR-14B/transitions-01/pixel-run6/walk-live-webgl-left-2x.png) opened. Each shows real `stepBoss` sim x advancing **1.2u/tick**,4.8u per exposed phase,38.4u over32ticks. Cyan line is entity.y; yellow is manually identified sole contour transformed from actual Sprite. Fixed camera, fullscene snapshots (not source generation). Boots change extension/lift through distinct drawings; no planting PASS claimed. The selected supporting boot changes across phases, and a lowest sole-contour midpoint is **not the same material point**. Precise stance duration/stride/slide and natural alternating gait remain **UNVERIFIED**, requiring reviewer/native footage; e.g. right-front sole contour moves6.3u from walk1→walk2 despite4.8u entity travel, so stable registration alone cannot prove planting. No new source-art failure filed from that non-corresponding contour proxy.

Head remains owner-accepted UNVERIFIED; no detector/chin fabrication. Uniform runtime0.5 preserves exact A weapon exceptions and failed values, not fresh global length PASS. Heavy big-boss/source-specific waivers retained; normal-paced size-pop impact needs independent review.

## Checks, retained diagnostics, preservation

- Final units **97/97 PASS**: Xiahou48 + shared transitions15 + GuanYu actions7 + clips/player8 + LiDian19. [Output](../../artifacts/CMR-14B/transitions-01/unit-final.txt).
- Final full lint/typecheck/diff-check PASS (existing CRLF notices only).
- Final browser4/4PASS. Earlier successful runs2/3/4 preserved separately.
- Initial browser CLI failed before any server (`--project chromium` consumed the filename); corrected equal-form flag. Run5 **0PASS/4FAIL** from test-method assumption: core AI already turned boss, assigning opposite INITIAL facing sometimes didn't change current facing. Fixed test to invert ACTUAL current facing; run6 all4PASS. Failure videos/screens remain under native-run5, not deleted/renamed/reset.
- Full vision/signal/prodbuild and independent producer/native normal-paced review **UNRUN in this package**, not waived or claimed green. Prior Pixel7 normal-clock evidence retained, not duplicated/claimed newly viewed.
- Promoted serial jobs184/185/189/190/191/193/194/195/196/197 all collected, settled; no foreign PID termination/no outstanding worker job.

[Final hashes](../../artifacts/CMR-14B/transitions-01/final-hashes.json): A manifest `fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1`; runtimePNG `e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f`; prepared `63181b648abd54d31b41a5ce8fc854bb6dcf406b482b7736c319093c4ea7343b`; adapter `d35aa62f46ef658d1d60a0d7f83a38d99c3e6ac3a35e93fdd184a92d8b45cce5`. Budget Xiahou31/cap12/global161/200 unchanged.

Writer permission ends on return. Parent manager review then independent READ-ONLY review must decide remaining gait/contact/size-pop/full-check criteria; no follow-up taken, no whole DONE claim.
