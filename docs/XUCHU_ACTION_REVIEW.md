# Xu Chu action review (CMR-15B, self-check — producer verifies fresh)

- Captures (all through the actual `?motion=1` runtime, stage3 ordinary
  solo start with the default GU+ZF preparation; Xu Chu published as the
  boss-first stage kind, `published: [soldier, xuchu, zhangfei]`):
  - `artifacts/motion-review/xuchu-canvas/` (960×540)
  - `artifacts/motion-review/xuchu-webgl/` (960×540)
  - `artifacts/motion-review/mobile/xuchu-canvas/`
    (`MOTION_VIEWPORT=844x390` mobile landscape)
- Provenance: commit `867f708`-dirty (dirty = this package's two harness
  files plus the pre-existing unrelated pack edits listed below). The
  runner verified the actual working-tree page and manifest bytes before
  capture: page SHA `6e49fd27…` 2,177,184 B 1979×1186, manifest
  `d0545e85…`, matching `xuchu-prepared.json`.
- Each run: 478 trace rows, 0 validation errors, 0 hard integrity
  issues, 0 blank crops, 3 standing open landmark items
  (groundErrorU/contactU/weaponTipU — same class as every boss).
  Frame coverage 36/36 packed frames observed **both facings, missing
  `[]`, all 3 runs**; every frame reached through real clip dispatch,
  not by forcing sprite frames. All rows motion art, zero legacy keys.
  Canvas and WebGL traces are identical row by row (key/state/tick/facing,
  0 mismatches). All three boss attack IDs (`charge.crush`,
  `sword.combo`, `sword.heavy`) sampled both facings.
- Resources: Xu Chu network/source 2,177,184 B, decoded/GPU 9,388,376 B,
  cloned canvas 0; within caps (decodedPerFighter 16 MiB, stage downloads
  12 MiB, page ≤2048). Stage3 runtime budget at capture: network
  7,488,328 B, retained 39,892,600 B ≤ 128 MiB.
- Footage: `xuchu-canvas.webm` 4,740,106 B, `xuchu-webgl.webm`
  10,372,338 B, mobile `xuchu-canvas.webm` 3,617,438 B (Playwright
  default recording). This review judged still frames and the
  per-facing 36-key sheets only; no native-speed playback in this
  environment. AI mixed run pacing: 180 ticks in ~18–20 s wall
  (manual bridge step, not normal speed).

## Reviewed with the image tool (this pass)

- `all-36-right.png` / `all-36-left.png` (canvas) and the same two
  sheets for webgl: every packed frame, both facings, at game scale.
- Enlarged crops: charge-right, heavy-left, walk-right (AI), knockdown-right,
  getup-left, dying-right (canvas); combo-left (mobile).
- Contact sheet (96 crops) glanced over for pops, blanks and legacy art.

## Per-action verdicts (all self-check, fixed-unverified)

- idle / walk: guard idle; walk:1–5 gait keys over the 32-tick loop
  with walk:5 stop-settle. Walk crop (AI, right): planted feet,
  glaive carried across the body, no skate in the stills. PASS both
  facings.
- charge (`charge.crush` 12/22/22): guard → crouch-coil → launch →
  crushing dash → brake. Charge crop (right, mid-active): deep lunge,
  levelled glaive, red tassel, shadow under the drive foot. PASS both
  facings.
- combo (`sword.combo` 9/4/12): windup → rising cut → sweep → follow →
  recover. Combo crop (mobile, left): extended two-hand thrust, glaive
  flipped correctly with the body, wide planted stance. PASS both
  facings.
- heavy (`sword.heavy` 16/6/24): raise → overhead hold → crushing chop
  → follow → recover. Heavy crop (left): braced low chop, blade forward,
  tassel clear. PASS both facings.
- hurt (hitstun 10, misc:0/1): recoil → fold. PASS both facings. Note:
  on WebGL the hurt keys render with the existing hitstun tint
  (`GameScene.ts:738` `setTint(0xff6666)`); Canvas ignores sprite tint,
  so the two renderers differ in colour only. Shared renderer behaviour,
  not this pack.
- knockdown (fall): topple → airborne → tumble → impact → DOWN
  (fall:4). Knockdown crop (right): airborne tuck with boots up, glaive
  still gripped, identity consistent. PASS both facings.
- getup: fall:4 DOWN bookend → getup:0 (distinct drawing, no alias) →
  elbow → kneel → crouch → rise. Getup crop (left): kneel with planted
  hand and glaive across the thigh. PASS both facings.
- grabbed: held-clamp misc:2. thrown: fall:2 → fall:3 from observed
  displacement. PASS both facings.
- dying / dead: dying samples fall:3 (dying crop shows the tumble
  frame at the intended fade); dead routes to fall:4 at alpha 0 by
  design (`GameScene.ts:743-745`), so the dead crop is an empty stage —
  the same harness-wide behaviour recorded for Li Dian and Xiahou Dun,
  not an art defect. PASS with note, both facings.
- mixed: 180-tick real-AI run per facing, no pose injection. Right:
  walk → combo → walk → combo; left: walk → heavy → walk → combo.
  Box 520×288 constant on every row (no size pops), 0 legacy keys.
  PASS both facings.
- Both facings mirror correctly (glaive and tassel flip with the body);
  no legacy blends, no blanks, identity stable across all 36 keys.

## Unseen-8 disposition (per 12B/13B/14B precedent)

- `enrage` × 2 — UNSEEN, no drawing gap: normal and enraged AI share the
  same poses (`src/game/art/motion-clips-xuchu.ts:35`); enrage is AI
  cadence plus the orange tint, not art.
- `approach` / `retreat` / `stop` × 2 — UNSEEN matrix labels with no
  distinct injected state; their rendered frames are the walk keys and
  idle guard already observed (36/36 coverage). Cells stay UNSEEN in
  `index.json`, never relabelled.

## Checks this package

- `npm run typecheck` PASS; `npm run lint` PASS (repo-wide).
- `npm run vision` 5/5 PASS, both negative controls failing correctly.
- Targeted motion units (xuchu/xiahoudun/catalog/scope/budget): 116
  pass, 2 fail — both are the stage budget pins (`plannedBytes`), off by
  exactly 512,073 B = the uncommitted Zhang Fei actions-sheet shrink
  (1,028,932 → 516,859 B) in the working tree, not this package. On a
  clean HEAD worktree those two pass and a different pair fails instead
  (manifest provenance tests read the git-ignored
  `artifacts/motion/xuchu/manifest.json`, absent from a fresh checkout).
- `npm run prodbuild`: **14/14 PASS** on a clean HEAD worktree
  (`867f708`) plus only this package's two harness files. The
  working-tree run fails 6 Guan Yu pilot/Xiahou build specs (expected
  6 motion page requests, got 5; `guanyu` missing from published) because
  the uncommitted Guan Yu sheet (1,827,406 B, `6a71c30b…`) no longer
  matches its pinned page record (1,782,790 B, `f15e3ac7…`), so the
  Guan Yu pack correctly falls back to legacy. Not this package.

## Not this package (pre-existing uncommitted work, left untouched)

`src/game/assets/motion/{guanyu,huangzhong,weiyan,zhangfei,zhaoyun}-*`
sheets/prepared JSON, `src/game/adapters/motion-art.ts` page pins,
four `test/game/motion-*.test.ts` files and `scripts/tmp-strip-rider.mjs`
(the rider-frame strip that followed the horse removal). They change
other fighters' packs and are outside CMR-15B's scope.

## Remaining for DONE

- Independent producer verification on fresh captures (spec step 6).
  Consumer evidence is self-check only.

## Artifacts

- `artifacts/motion-review/{xuchu-canvas,xuchu-webgl}/` and
  `artifacts/motion-review/mobile/xuchu-canvas/`:
  `{runtime,report,index,trace,page-errors,pace-left,pace-right}.json`,
  `contact-sheet.png`, `all-36-{right,left}.png`, `frames/*.png` (96),
  one `.webm` per run.
- Harness: `scripts/motion-capture.mjs` + `e2e/motion-capture.spec.ts`
  (Xu Chu now shares the Xiahou single-page boss path:
  stage, charge id, frame count and boss kind parameterized; Xiahou
  behaviour unchanged).
