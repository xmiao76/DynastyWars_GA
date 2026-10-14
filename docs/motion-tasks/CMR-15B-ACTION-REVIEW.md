# CMR-15B — Xu Chu action review (integration captures, self-check)

Formal per-criterion review of the CMR-15B runtime on the
`artifacts/motion/xuchu/integration/captures/` set, mirroring the 12B
([Huang Zhong](../HUANGZHONG_ACTION_REVIEW.md)) / 14B
([Xiahou Dun](../XIAHOUDUN_ACTION_REVIEW.md)) practice. The earlier
[Xu Chu action review](../XUCHU_ACTION_REVIEW.md) (commit `bcffcee`)
covered the `artifacts/motion-review/` captures; this one judges the
integration captures only and does not re-claim its evidence. All
verdicts below are consumer self-check, fixed-unverified — spec step 6
(independent producer verification on fresh captures) is still open,
so CMR-15B stays **IN_PROGRESS**, not DONE.

## Runtime identity

- Runtime integration commit `1ec8478` (atomic opt-in `?motion=1` Xu Chu
  from the accepted CMR-15A offline pack); capture-harness commit
  `bcffcee` on top. No image generation in either.
- Pack revision `xuchu-1`: page `xuchu-motion-sheet.png` SHA-256
  `6e49fd2749fcde3813185d8520af36db5ec796baecb3285359215cf45fc49348`,
  2,177,184 B, 1979×1186 (≤2048), density 2, decoded 9,388,376 B;
  source manifest `d0545e8575a24704d9f923173af3de5656a213b907e8f35d57632f4197e27266`;
  `xuchu-prepared.json` `2621513f045fd163912cff0406a07bef90981424919da206429abe296973cbfe`.
  36 frames = walk 6 + charge/combo/heavy/misc/fall/getup 5 each, 36
  unique, no alias (`getup:0` is a distinct DOWN drawing).
- Fixture (all runs): stage3 ordinary solo start, default GU+ZF
  preparation, `published: [soldier, xuchu, zhangfei]`; attack bindings
  `charge.crush` (12/22/22 = 56t), `sword.combo` (9/4/12 = 25t),
  `sword.heavy` (16/6/24 = 46t), hitstun 10, clips derived from core
  data in `src/game/art/motion-clips-xuchu.ts`.

## Capture table

| Run | Dir | capturedAt | Commit / dirty | Rows | Frames | Coverage |
|---|---|---|---|---|---|---|
| Canvas | `integration/captures/canvas/` | 2026-10-14T07:33:00Z | `bcffcee`, dirty=true | 478 | 96 | 36/36 both facings, missing `[]` |
| WebGL | `integration/captures/webgl/` | 2026-10-14T07:36:12Z | `bcffcee`, dirty=true | 478 | 96 | 36/36 both facings, missing `[]` |
| Mobile (Canvas) | `integration/captures/canvas-mobile/` | 2026-10-14T07:37:22Z | `bcffcee`, dirty=true | 478 | 96 | 36/36 both facings, missing `[]` |

- Every run: 0 validation errors, 0 hard integrity issues, 0 blanks,
  478/478 motion rows, **0 legacy rows**; 3 standing OPEN landmarks
  (`groundErrorU`/`contactU`/`weaponTipU` unverified — metadata
  registration only). Coverage matrix 26 captured / 8 unseen per run
  (unseen-8 disposition below). All 3 boss attack IDs sampled both
  facings (canvas trace: `charge.crush` 16, `sword.combo` 77,
  `sword.heavy` 60 rows). Canvas≡WebGL and Canvas≡mobile traces are
  identical row by row (key/state/tick/facing/attackId, 0/478
  mismatches, re-derived in `integration/review-stats.json`).
  Crop box is a constant 520×288 on every row of every run.
- **Dirty-state caveat (binding):** `dirty=true` at capture. Each
  `index.json` records `dirtySourceHashes` for the five 15B harness /
  runtime files as captured. The working tree additionally carried
  pre-existing uncommitted pack edits for *other* fighters —
  `guanyu-motion-sheet.png` (working tree `6a71c30b…`, 1,827,406 B vs
  committed 1,782,790 B), `prepared.json`, huangzhong/weiyan/zhangfei/
  zhaoyun sheets + prepared JSON, `motion-art.ts` page pins, four
  `motion-*.test.ts` files, `scripts/tmp-strip-rider.mjs`. Captures
  use the default stage3 preparation, so the dirty Guan Yu pack is
  **not** the exercised Xu Chu art, but it does poison shared
  budget/signature checks (see Checks). Those files were left
  untouched and unstaged by this review.
- **Mobile viewport caveat:** the mobile run was requested as
  844×390 landscape (`MOTION_VIEWPORT=844x390`), but `index.json`
  carries **no `capture.viewport` field** (verified: capture keys are
  commit/dirty/capturedAt/rows/facings/renderers/runtime only), and
  the frames are box-relative 1040×576 crops — the mobile
  `all-36-right.png` is byte-identical to canvas' (`584871ce…`).
  Mobile therefore proves a complete third run (trace/coverage/video
  `xuchu-canvas.webm` 3,577,894 B), not independently viewport-distinct
  rendering. Recorded as requested-not-proven, same honesty rule as 14B.
- Footage present per run (`xuchu-canvas.webm` 4,484,888 B canvas /
  3,577,894 B mobile; `xuchu-webgl.webm` 10,250,396 B). This review
  judged stills only; pace files state "manual bridge step + renderer;
  not normal speed" (180 mixed ticks in 16.8–62.6 s wall). No
  native-speed playback was reviewed — a stated limitation, not a pass.

## Personally inspected this pass (image tool)

- `all-36-{right,left}.png` for **canvas, webgl and canvas-mobile**
  (6 sheets): every family (walk/charge/combo/heavy/misc/fall/getup),
  every renderer, both facings, at game scale.
- Enlarged native frames (1040×576): canvas `key-walk-2-right`,
  `key-combo-3-right`, `key-heavy-2-right`, `dead-right`; webgl
  `key-charge-3-left`, `key-misc-0-right`, `key-walk-4-left`; mobile
  `key-fall-3-left`, `key-getup-2-left`.
- Contact sheets: the harness `contact-sheet.png` in each run dir
  (1280×7680, 96 crops) was geometry-verified against a rebuild from
  the existing frames (`integration/build-review-crops.mjs`, 14B layout;
  rebuilt size matches, originals not overwritten). Enlarged crops
  built into each run's `crops/` (9 per run:
  walk/charge/combo/heavy/misc/fall/getup + idle + dead, verbatim
  native frames; hashes in `integration/review-stats.json`).
  `artifacts/` is git-ignored, so these are on-disk evidence, not
  committed files — same as 12B/14B.

## Per-action verdicts (self-check)

- **idle/walk** — guard `walk:0`; gait keys `walk:1–5` over the 32-tick
  loop incl. `walk:5` stop-settle. Enlarged `walk:2` (canvas, right):
  passing leg tucked, support foot flat under the mass, glaive carried
  two-handed across the body; `walk:4` (webgl, left) mirrors cleanly.
  No skate visible in stills; hidden contact stays unverified (crit 4).
  PASS both facings/renderers.
- **charge** (`charge.crush`) — guard → coil → launch → crushing dash →
  brake. Enlarged `charge:3` (webgl, left): deep forward lunge,
  levelled glaive with red tassel, rear drive leg extended, shadow
  under the planted foot. PASS both facings.
- **combo** (`sword.combo`) — windup → rising cut → sweep → follow →
  recover. Enlarged `combo:3` (canvas, right): extended two-hand sweep,
  butt cap behind the rear hand, wide planted stance. PASS both facings.
- **heavy** (`sword.heavy`) — raise → overhead hold → chop → follow →
  recover. Enlarged `heavy:2` (canvas, right): braced low chop, both
  grips on the haft, blade + tassel clear of the body. PASS both facings.
- **misc / hurt** (hitstun 10, `misc:0/1` recoil→fold; `misc:2` held
  clamp; `misc:3/4` struggle/release) — enlarged `misc:0` (webgl,
  right) confirms the existing hitstun tint `setTint(0xff6666)`
  (`src/game/scenes/GameScene.ts:738`) renders over the motion art on
  WebGL while Canvas ignores tint — the `misc:0/1` rows are fully red
  on both webgl all-36 sheets, untinted on canvas/mobile. Shared
  renderer behaviour, not a pack defect. PASS both facings.
- **fall** — topple → airborne → tumble → impact → flat DOWN (`fall:4`).
  Enlarged `fall:3` (mobile, left): inverted tumble, boots up, glaive
  still gripped one-handed, identity consistent. PASS both facings.
- **getup** — DOWN bookend → `getup:0` (distinct drawing) → elbow →
  kneel → crouch → rise. Enlarged `getup:2` (mobile, left): kneel with
  planted palm, glaive across the thigh. PASS both facings.
- **grabbed/thrown** — `misc:2` held-clamp; thrown `fall:2→fall:3` from
  observed displacement (shared boss bridges). PASS both facings.
- **dying/dead** — dying samples `fall:3`; dead routes to `fall:4` at
  alpha 0 by design, so enlarged `dead-right` (canvas) is an empty
  stage — harness-wide behaviour recorded identically for 12B/13B/14B,
  not an art defect. PASS with note.
- **mixed** — 180-tick real-AI run per facing per run (360 mixed rows,
  16 distinct Xu Chu keys: full walk cycle + combo + heavy), 0 legacy
  keys, constant 520×288 box (no size pops in trace geometry). PASS.
- Both facings mirror correctly throughout (glaive/tassel flip with
  the body); no blanks, no legacy blends observed on any sheet.

## Unseen-8 disposition (per 12B/13B/14B precedent)

`enrage`/`approach`/`retreat`/`stop` × 2 facings stay **UNSEEN** in
every `index.json`, never relabelled: enrage is AI cadence + tint with
no drawings (normal/enraged share poses); approach/retreat render the
walk keys and stop renders the idle guard, all already inside the
36/36 observed coverage. No drawing gap, no grade claimed.

## Carried CMR-15A limitations (transferred, not re-judged)

From [CMR-15A FINAL-ACCEPTANCE](../../art/motion/xuchu/closeout-campaign/FINAL-ACCEPTANCE.md),
carried verbatim — FAIL retained, NOT PASS, exact hashes only, no
blanket/transfer beyond these exact images integrated as-is:

- Head-size gate **UNVERIFIED_OWNER_ACCEPTED** (beard conceals the
  chin/beard-base endpoint; RAW on every cell). Not a measurement pass.
- Weapon-length waivers: charge `a0aec6aa…` +8.54u / `3c864aa1…`
  −5.71u; combo `df6196ff…` +3.46u / `18c68a00…` +5.98u; heavy
  `e5e234f9…` +3.64u / `57190b6f…` +7.72u; fall `5c8bf0db…` +0.69u;
  getup `23667b4b…` −3.06u / `6420114d…` −4.12u (resulting spreads
  waived with them). Walk/misc carry 0 waivers.
- Hidden 3D ground/contact unverified; the integration indexes keep
  `groundErrorU`/`contactU`/`weaponTipU` = `unverified` (standing
  OPENs for the producer, exactly as 14B crit 4).

## Per-criterion results vs CMR-15B spec Acceptance

| # | Criterion (spec) | Result | Evidence |
|---|---|---|---|
| 1 | All frames/bindings live; no legacy inside published fighter; bad-pack controls keep whole legacy fighter | **PASS** | 478/478 motion rows, 0 legacy, 36/36 both facings ×3 runs; forged/missing-pack negative controls in `motion-xuchu.test.ts` (40/41 pass on rerun, sole fail = crit-8 budget pin) |
| 2 | Exact hit/projectile windows + movement/AI unchanged; strike matches sim | **PASS** (recorded) | Clips derived from core `attackById` windows; `1ec8478` touches no `src/core`; profiles/actions/transitions suites recorded green at integration; rerun: actions 7/7, transitions 11/11, profiles 13/14 (sole fail = dirty Guan Yu clips hash, not Xu Chu) |
| 3 | Stable scale/pivots/identity; smooth boundaries; shared guard/down; no standing insertion into low collapse | **PASS with note** | Constant 520×288 box, pivot (260,272), registrationErrorU 0 (metadata); identity stable on all 6 sheets; `getup:0` distinct; stills only — boundary smoothness at native speed NOT reviewed |
| 4 | Gait/ground contacts + head/weapon landmarks from A still pass after registration | **PARTIAL — transferred waivers** | Gait reads genuine in stills; ground/contact/weapon-tip landmarks remain **unverified OPENs** in every index; head UNVERIFIED_OWNER_ACCEPTED and exact-hash weapon FAILs carried from 15A (above). Honestly not a landmark PASS |
| 5 | Actual footage + before/after contact/crop evidence every action/facing; capture commit/hash/dirty known | **PASS with caveats** | Contact sheets + enlarged crops + webm per run; commit `bcffcee` + dirty state + dirty hashes recorded; caveats: no legacy pair sheets (0 legacy rows — 12B/14B practice), mobile viewport requested-not-proven, footage not played at native speed |
| 6 | Load/decode/cache within CMR-03; restart/cancel/evict as relevant | **PASS** | Decoded 9,388,376 ≤ 16 MiB; stage network 7,488,328 B, retained 39,892,600 ≤ 128 MiB, cloned canvas 0 (runtime.json); catalog/scope/budget suites recorded green, rerun catalog 14/14, scope 6/6, budget 9/9 |
| 7 | Earlier fighters / Guan Yu reference unchanged; opt-in, default legacy | **PASS for 15B commits** | `1ec8478`+`bcffcee` touch no other fighter's pack; `?motion=1` only. Caveat: unrelated dirty packs sit in the working tree (not in these commits), left unstaged |
| 8 | All applicable checks pass with documented baseline-only exceptions | **NOT YET** | See Checks: prodbuild on the integration tree is red for a documented dirty-Guan-Yu root cause; a clean rerun after that work is reconciled is still owed. Keeps the task IN_PROGRESS |

## Checks

- `npm run typecheck` — **PASS** (rerun in this review, exit 0).
- `npm run lint` — **PASS** (rerun in this review, exit 0, repo-wide).
- Targeted motion units — recorded **154 pass / 0 fail** at runtime
  commit `1ec8478` (xuchu/xiahoudun/catalog/scope/profiles/budget/
  actions/transitions; PROGRESS 2026-10-13). **Rerun in this review**
  on the current dirty tree: **147 pass / 3 fail (150)** — all three
  are dirty-pack pins, none is Xu Chu clip/pack logic: xuchu +
  xiahoudun stage `plannedBytes` each off by exactly 512,073 B
  (uncommitted Zhang Fei actions-sheet shrink 1,028,932 → 516,859 B)
  and profiles `guanyuClips` frozen-hash (dirty Guan Yu sheet).
- `npm run vision` — **5/5 PASS** per `integration/vision.log`
  (renderer parity, visual health, sprite gate 158/158, both negative
  controls failing correctly, HUD gate; 2.7 m). Not rerun in this
  review; the log is the integration run's own record.
- `npm run prodbuild` — **8 pass / 6 fail** per
  `integration/prodbuild.log`. Root cause (documented, not 15B): the
  uncommitted Guan Yu sheet (`6a71c30b…`, 1,827,406 B) no longer
  matches its pinned page record (committed 1,782,790 B), so the Guan
  Yu pack correctly falls back to whole-fighter legacy — `guanyu`
  missing from published sets and 5 instead of 6 motion page requests
  in the GU-pilot/Xiahou build specs. A clean-HEAD prodbuild 14/14
  was recorded for the earlier `bcffcee` capture package, but **for
  the integration state a prodbuild rerun after the dirty Guan Yu
  work is reconciled (committed or reverted by its owner) is still
  owed** and is a DONE gate, together with step 6 below.
- No `signal` rerun claimed here (no timing/AI/observer change in
  15B); G6/UIR-19 baselines untouched by this review.

## Remaining for DONE

1. **Independent producer verification on fresh captures** (spec
   step 6) — this document is consumer self-check only.
2. **`npm run prodbuild` rerun** once the dirty Guan Yu (and sibling)
   pack work is reconciled, to close criterion 8 on a clean tree.
3. Standing OPEN landmarks (`groundErrorU`/`contactU`/`weaponTipU`)
   and the carried 15A head/weapon limitations pass to the producer
   exactly as recorded — they are not closed by this review.

## Artifacts

- `artifacts/motion/xuchu/integration/captures/{canvas,webgl,canvas-mobile}/`:
  `{runtime,report,index,trace,page-errors,pace-left,pace-right}.json`,
  `contact-sheet.png` (96 crops, 1280×7680), `all-36-{right,left}.png`,
  `frames/*.png` (96), `crops/enlarged-*.png` (9, built this review),
  one `.webm` per run.
- `artifacts/motion/xuchu/integration/{vision.log,prodbuild.log,
  review-stats.json,build-review-crops.mjs}`.
- Harness: `scripts/motion-capture.mjs` + `e2e/motion-capture.spec.ts`
  (Xu Chu on the shared single-page boss path); review core
  `scripts/motion-review-core.mjs`, same as 09B–14B.
