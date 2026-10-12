# CMR-14B-default-stage2-01 — bounded default-entry fix and evidence

## Scope / disposition

One foreground writer; parent owns active manual run `2026-10-11T19-17-19-841Z-e7fac45e-9635-44d2-9879-abfc92a19206` and all queue/progress/control decisions. No runner begin/finish, generation, dependencies/install, cap change, core/art/emitter/clip edit, commit/push/deploy, policy/lock/scheduler or nested agent operation. **Scoped fix verified; CMR-14B remains IN_PROGRESS, not complete or independently verified.**

Production change is only seven added lines inside [motionStageRequest](../../src/game/adapters/motion-art.ts#L609-L626): when the current `STAGES[stageId].bossKind` is Xiahou, move that boss to the front of `stageKinds`; retain all mooks. Shared pure policy still orders selected hero then default/carried 2P first. Non-Xiahou stage1/3 and future-kind orders unchanged. No broader scope/cache refactor or budget raise.

## Regression red → green

[Actual pre-fix output](../../artifacts/CMR-14B/default-stage2/before-output.txt#L64-L85) shows the new real-catalog/default-GU+ZF test FAILED with actual policy output `[guanyu, zhangfei, soldier, spearman]` instead of `[guanyu, zhangfei, xiahoudun, soldier]`. This ran before changing the request function, not a source-text fixture.

[Strengthened Xiahou tests](../../test/game/motion-xiahoudun.test.ts#L307) retain original null-partner/stage1/cap controls and add:

- Actual `secondPlayerCharacter('guanyu') === 'zhangfei'` catalog scope: immediate GU/ZF/Xiahou/soldier; spear/archer deferred; **12,372,346 < 12,582,912 B**, no prefetch/all-cast.
- Actual pure-policy negative control on the previous encounter-order roster defers Xiahou. Full GU+ZF+stage2 pack cost **15,555,957 B**.
- Hero/2P retain priority; a lower-cap expensive hero pair cannot force the boss to fit.
- Stage1/3 request and future-kind order equal their actual unchanged spawn data.

[Runtime tests](../../test/game/motion-runtime.test.ts#L230) now distinguish same-stage restart (zero requests) from stage1→2 (one new Xiahou PNG); warm spear remains published. Add fresh default GU/ZF actual PNG fetch/hash/decode/publication regression, exact six pages and 39 shared boss frames. Existing eviction uses a genuinely separate scene/cache and preserves prior-runtime boss ownership; original legacy/fallback assertions remain.

## Browser entry / cache / fallback

[New lifecycle spec](../../e2e/xiahoudun-lifecycle.spec.ts) uses actual `window.__DW__.startGame('guanyu',42,'stage2')`: ordinary solo start, no carried second player, actual default ZF prepared before immediate join. Canvas and WebGL publish Xiahou before intro dismissal at tick0. Actual sprite IDs `walk:0`, `heavy:2`, `fall:4` use `motion-source:xiahoudun`; no source-image crop or setFrame substitution.

[Canvas entry record](../../artifacts/CMR-14B/default-stage2/canvas-entry.json), [WebGL entry record](../../artifacts/CMR-14B/default-stage2/webgl-entry.json):

| Actual metric | Both fresh renderers |
|---|---:|
| Published source/network bytes (actual runtime budget) | 12,372,346 |
| Sum observed six fetch response bodies | 12,372,346 |
| Stage-entry cap | 12,582,912 |
| Boss source/download bytes | 2,220,630 |
| Boss decoded/GPU page bytes | 12,991,664 |
| Total retained/GPU motion page bytes | 59,039,048 |
| Cloned cell canvas bytes | 0 |
| Retained cap | 134,217,728 |

ZF's already existing pack-specific decoded allowance is untouched (actual 21,441,312 B); no new exception. `legacyFallbackCost:0` is the runtime ledger value, **not a measurement of total legacy/game memory**.

Warm restart seed43 requests no new page and retains exact boss `sheet` reference. [Late-cancel evidence](../../artifacts/CMR-14B/default-stage2/late-cancel.json): test owns one held real boss fetch, exits game into title, releases only its route, ordinary seed72 stage1 restart; no stale Xiahou texture/publication. [Missing](../../artifacts/CMR-14B/default-stage2/fallback-missing.json)/[corrupt](../../artifacts/CMR-14B/default-stage2/fallback-corrupt.json): eight representative applicable states all whole legacy; valid GU/ZF/soldier remain published; no boss source texture. Strict 39-record/full-inventory coverage remains in unit tests, not falsely represented as 40 records.

[Existing loader spec](../../e2e/motion-loader.spec.ts#L84-L86) changed only stage2 expected publication by legitimate Xiahou addition; stage1/default/negative controls unchanged. [Capture harness](../../e2e/motion-capture.spec.ts#L86-L90) and [interaction harness](../../e2e/xiahoudun-motion.spec.ts#L24) now use actual default solo start, not GU/GU workaround. Full39 capture was **not rerun**; prior GU/GU full39 captures remain historical/stale-code provenance, not new default evidence.

## Pixel7 landscape — actual real clock and touchscreen

[Recorded evidence](../../artifacts/CMR-14B/default-stage2/mobile-real-clock.json): Pixel7 landscape hasTouch/isMobile device settings; WebGL AUTO path explicitly selected; no autopilot query, bridge run/step/bench, keyboard input or manual AI tokens during continuous segment.

- Actual HUD `touchPause` pointer tap freezes sim tick and complete Xiahou entity/frame across at least15 real rAF paints and250ms; resume advances ticks.
- Touch A coordinate from the actual exported layout produces genuine boss damage/hitstun; fixture changes only nearby idle position before the contact. Earlier pause inspection used a genuine moving boss.
- Fresh boss combatant's default AI think/cadence untouched in the continuous segment; GU alone invulnerable to prevent continue overlay. Initial idle position/HP fixtures are disclosed.
- **5,015.8ms observed wall, 304 sim ticks, ratio1.01014,126 real paint samples,23 distinct boss frame keys**. Actual charge, walk, combo and heavy keys; every row remains motion texture and unpaused. This is measured near-real-time sim advancement, **not a guarantee of60 rendered fps** (about25.1 sampled paints/s), nor independent aesthetic pace acceptance.
- Canvas960×540, CSS640×360, actual viewport863×360, DPR2.625, maxTouchPoints1, WebGL type2. No scaled-root substitution.
- Approximate native-video anchors (elapsed since test start, recorder offset unmeasured): pause4.795s; actual touch hit7.199s; continuous AI7.241–12.333s. Per-paint wall/tick/position/vx/state/frame rows retained.

### Owner-playable native files

Playwright `video:'on'` retains these native WebM files. File presence checked; tools did **not** view native video.

- [Pixel7 real AI/touch recording](../../artifacts/CMR-14B/default-stage2/browser-final/xiahoudun-lifecycle-real-c-7eb9c-s-five-seconds-of-actual-AI-chromium/video.webm)
- [Canvas default-entry recording](../../artifacts/CMR-14B/default-stage2/browser-final/xiahoudun-lifecycle-fresh--8f57b-diate-join-and-warm-restart-chromium/video.webm)
- [WebGL default-entry recording](../../artifacts/CMR-14B/default-stage2/browser-final/xiahoudun-lifecycle-fresh--c7178-diate-join-and-warm-restart-chromium/video.webm)

Representative Phaser-postrender full-cell crops, one right facing each: [Canvas guard](../../artifacts/CMR-14B/default-stage2/canvas-guard.png), [heavy](../../artifacts/CMR-14B/default-stage2/canvas-heavy.png), [prone](../../artifacts/CMR-14B/default-stage2/canvas-prone.png); [WebGL guard](../../artifacts/CMR-14B/default-stage2/webgl-guard.png), [heavy](../../artifacts/CMR-14B/default-stage2/webgl-heavy.png), [prone](../../artifacts/CMR-14B/default-stage2/webgl-prone.png). Crops520×436 renderer pixels enlarged2×, full box in bounds, HUD hidden for snapshot, key==snapshotKey. Pose setups explicitly injected, not natural contact. Opened Canvas guard/heavy/prone and WebGL heavy/prone plus mobile whole scene: distal spear/boots remain inside images, no HUD obstruction. GU/ZF silhouettes remain at left edge; not an entirely empty background. Stable placement math is not hidden3D/anatomical-foot certification; heavy/guard body-size contrast persists unchanged from A and needs independent review.

## Checks / retained failures

- Final units: **100/100 PASS** in Xiahou47 + runtime14 + scope6 + LiDian19 + catalog14 (including negative controls),46.05s.
- Browser run1: **10/10 PASS** (lifecycle6 + existing loader4),1.1min. Hung-download control deliberately excluded, not weakened/deleted or claimed run.
- Browser run2: **10/10 PASS** (lifecycle6 + actual-default interactions4 both facings/renderers),2.6min. Interactions genuine damage/grab/throw/landing/AI charge/enrage/mixed outcomes; still bridge-paced, not normal-speed footage.
- Final full lint/typecheck/git diff --check PASS. Existing CRLF Git notices only.
- Earlier diagnostic failures retained: old runtime stage2 expectation/fake PNG map corrected to new real boss; cross-runtime eviction fixture corrected to separate scene; initial new test seed snapshot type errors and unsupported nested video/defaultBrowserType options corrected. A temporary unused attempt to compare Side with `player` produced one type error; that entire optional position adjustment was removed, preserving tested capture behavior. No art failure or new consumer recovery count asserted.

## Preservation caveat / remaining manager decisions

**Important artifact preservation error:** first interaction rerun still wrote four trace/screenshot pairs into the pre-existing historical [interaction artifact location](../../artifacts/CMR-14B/motion-review/interactions/canvas-right/trace.json) before its output path was changed to the allowed default-stage2 subtree. New pairs were copied into scoped [default interaction evidence](../../artifacts/CMR-14B/default-stage2/interactions/canvas-right/trace.json). The previous GU/GU interaction pairs were overwritten; no baseline bytes were saved, so this worker cannot honestly claim their preservation or reconstruct them. The old full39 GU/GU capture directories were not overwritten. Parent must retain this disclosure and decide archival recovery from any independently held copies. One initial regression output also exists outside the subtree as [initial output](../../artifacts/CMR-14B/default-stage2-before.txt); canonical UTF8 evidence is linked above. No destructive cleanup attempted.

Runtime PNG hash remains `e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f`; A manifest remains `fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1`. Actual generation ledger Xiahou31/global161 and caps unchanged. No TASKS/PROGRESS write by worker, unrelated dirty source/policy/art unchanged.

Full vision/signal/prodbuild, fresh default all39/both-facing recapture, precise planted-foot/displacement/contact/size-pop review and genuinely independent/native-video review remain **pending**. No B DONE. All promoted jobs collected; writer returns permission immediately and takes no follow-up activity.
