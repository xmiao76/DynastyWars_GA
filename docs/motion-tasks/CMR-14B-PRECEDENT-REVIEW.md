# CMR-14B precedent review — ruling 14B-PRECEDENT (2026-10-12)

Precedent capture package for the 14A-accepted Xiahou Dun pack. Captures were
produced by the prior attempt; this review verifies the existing artifacts,
personally inspects a sample of frames, and rules per-criterion. No commit,
no TASKS change. Default play remains legacy (opt-in `?motion=1` only).

## 1. Pack identity (from all three `index.json` — identical)

- Revision: `xiahoudun-1`; manifest
  `fe106479291229eb871ea68d01e3fb7f69c6a4e99fa52eadb0f49968bc4814f1`
- Sheet `xiahoudun-motion-sheet.png` sha
  `e1fdf7e8ea2b4128e6c0380e407e79ca8c985ceb63b09a056097da6dd85af34f`
  (2044×1589, 2,220,630 src bytes, 12,991,664 decoded bytes)
- Runtime source: `src/game/assets/motion/xiahoudun-prepared.json`
- Capture commit `44c620a`, clean (`dirty: false`)

## 2. Checks

- typecheck PASS; lint PASS (after `eslint.config.js` glob extension to
  `art/**/*.mjs` — confirmed present at `eslint.config.js:61`). No separate
  log files for these two in the precedent dir; recorded per work order.
- vitest: 1006 pass / 1 fail / 6 skip (`vitest.log`: "Test Files 1 failed |
  113 passed | 5 skipped", "Tests 1 failed | 1006 passed | 6 skipped"). The
  single failure is the pre-existing owner-blocked G6 baseline
  (`test/game/arm-chain.test.ts` > "G6 the far fist never paints over the
  near arm (V-15b)"); no new failures.
- vision 5/5 PASS (`vision.log`: parity, visual-health, sprite, negative
  control, HUD gates all `ok`).
- prodbuild 14/14 PASS (`prodbuild.log`), incl. Xiahou stage2
  default-legacy/opt-in/budget/fallback cases on canvas + WebGL.
- Logs: `artifacts/motion/xiahoudun/precedent/{vitest,vision,prodbuild}.log`.

## 3. Capture table (all pre-existing, NOT re-run)

| Run dir | Renderer | Viewport | Facings | Rows | Published / fallback | Page errors |
|---|---|---|---|---|---|---|
| `artifacts/motion/xiahoudun/precedent/captures/canvas/` | canvas | 960×540 (spec default) | right, left (39+39 frames, none missing) | 484 motion / 0 legacy | `published: [guanyu, soldier, xiahoudun, zhangfei]`, `legacyFallbackCost: 0` — pack published, NOT fallback | `[]` |
| `artifacts/motion/xiahoudun/precedent/captures/webgl/` | webgl | 960×540 (spec default) | right, left (39+39, none missing) | 484 / 0 | same published list, fallback cost 0 — published, NOT fallback | `[]` |
| `artifacts/motion/xiahoudun/precedent/captures/canvas-mobile/` | canvas | mobile-landscape `MOTION_VIEWPORT` override; exact W×H not recorded in trace/index — UNVERIFIED | right, left (39+39, none missing) | 484 / 0 | same published list, fallback cost 0 — published, NOT fallback | `[]` |

Each run holds `runtime.json`, `report.json`, `index.json`,
`page-errors.json`, `pace-left/right.json`, `trace.json`, `frames/`.
Coverage per run: 26 captured (13 actions × 2 facings + mixed × 2), 8 unseen
(`enrage`, `approach`, `retreat`, `stop` × 2 facings). `withinCaps: true`
(12,991,664 / 16,777,216 per-fighter; 12,372,346 network < 12,582,912 stage
cap). Known artifact defect: `index.json` `evidence.tracePath/videoPath/
contactSheet` point at `captures/xiahoudun-canvas/` (and `-webgl`) prefixes
that do not exist — actual dirs are `captures/canvas|webgl|canvas-mobile`.
Pacing is sim-timed; headless wall pace is NOT normal-speed evidence
(`report.json` limitations, pace mode "manual bridge step + renderer; not
normal speed").

## 4. Transferred 14A waivers and carried limitations

Quoted from `art/motion/xiahoudun/closeout-campaign/FINAL-ACCEPTANCE.md`
(14A DONE 2026-10-11; applies to these exact images):

- "Heavy drawn larger (owner-2026-10-08 big-boss ruling); heavy head-cast
  coherence waiver. Independent review: identity consistent, no
  extra/floating hands or forked shafts."
- "Source-specific weapon waivers keep their failed measurements; spear
  length visibly jumps between some keys (largest fall:3 → DOWN)."
- "Head anatomical metrics UNVERIFIED (beard conceals chin)."
- "Hidden 3D ground, camera and saddle unverified (boss on foot; saddle not
  applicable)."
- "fall:3 impact reads weakly and close to fall:2 (owner-accepted)."
- "Heavy noticeably larger than walk (big-boss ruling); upright misc/getup
  look about 15% shorter than the walk guard (not measured)."
- "Presentation frame 260×218/groundY 210 (owner decision); gameplay data
  unchanged."
- "Exposure map is an offline draft mirroring Li Dian's boss clips; the
  runtime clip table belongs to CMR-14B."
- "No normal-speed native playback reviewed (still-frame tick strips
  only)." — still true for this package (no native-speed video reviewed).

## 5. Personally inspected sample (this attempt)

Canvas both facings were already inspected clean by the previous attempt. I
personally opened (read_image):

- `captures/webgl/frames/heavy-right.png` — clean: scarred one-eye identity,
  headband, full dark beard, dark/magenta armour, spear with red tassel,
  both feet planted, no blank/crop/legacy blend.
- `captures/webgl/frames/idle-left.png` — clean; mirrored guard correct,
  spear tip + tassel intact at frame edge.
- `captures/webgl/frames/key-heavy-2-left.png` — clean heavy chop pose,
  two-hand grip, no floating hands or forked shaft.
- `captures/canvas-mobile/frames/heavy-left.png` — clean; matches WebGL
  heavy left choreography.
- `captures/canvas-mobile/frames/walk-right.png` — Xiahou gait frame clean;
  Guan Yu (hero) appears semi-transparent at the right edge — mixed-gameplay
  spawn fade, not a pack defect.

Minor notes (not pack defects): faint stage-backdrop tile seams visible in
backgrounds; spear length differences between keys per the transferred 14A
waiver above.

## 6. Per-criterion results vs `docs/motion-tasks/CMR-14B.md` acceptance

1. All required frames/bindings live; no legacy texture/old-rig blend inside
   the published fighter; bad/missing-pack negative controls keep whole old
   fighter — **PASS** (published list incl. xiahoudun, 484/0 rows, fallback
   cost 0 on 3/3 runs; prodbuild missing/corrupt fallback cases pass).
2. Exact hit/projectile windows and movement/AI unchanged; strike/release
   matches sim, no added input lock — **PASS with limitation** (prodbuild
   Xiahou stage2 + window/budget cases 14/14; no new per-tick timing
   measurement in this capture package beyond sim-timed pacing).
3. Stable scale/pivots/body identity; smooth boundaries; shared guard/down;
   no standing insertion into low collapse — **PASS with carried
   limitations** (stills consistent; heavy-large + misc/getup-shorter per
   §4 waivers; boundary smoothness at native speed UNVERIFIED — no
   normal-speed playback reviewed).
4. Genuine gait/ground contacts and head/weapon landmark criteria from A
   still pass after runtime registration — **UNVERIFIED** (`report.json`
   `integrity.open`: "unseen landmark cannot pass: groundErrorU/contactU/
   weaponTipU"; `index.json` landmarks all "unverified … metadata
   registration only; actual foot contact unverified"). Not dismissed by
   green vision — recorded as open.
5. Actual motion footage + before/after contact/crop evidence for every
   applicable action/facing incl. role list — **PARTIAL** (13 actions × 2
   facings + mixed captured on 3/3 runs; enrage/approach/retreat/stop unseen
   ×8; no before/after contact-crop pairs in this package; native webm paths
   in index.json point at non-existent dirs per §3).
6. Load/decode/cache within CMR-03 limits; unused kinds not all at boot;
   restart/cancel/evict — **PASS** (`withinCaps: true`, §3 figures;
   prodbuild default-legacy zero-resource + fallback cases pass).
7. Earlier fighters / Guan Yu reference unchanged; normal play opt-in,
   defaults legacy until owner activates — **PASS** (prodbuild "default
   legacy, zero roster motion resources" passes; default play remains
   legacy — no activation in this package).
8. All applicable checks pass with documented baseline-only exceptions —
   **PASS with one documented exception** (sole failure = pre-existing
   owner-blocked G6 baseline; everything else green per §2).

## 7. Ruling

Precedent capture package is complete and honest: 3/3 runs published (not
fallback), zero page errors, both facings, 484/0 rows, checks green except
the known G6 baseline. Criterion 4 stays UNVERIFIED and criterion 5 PARTIAL
by the artifacts' own admission — CMR-14B stays IN_PROGRESS (or per-owner
call), not DONE, on those grounds plus the carried 14A limitations. No
commit, no TASKS change, no image generation, no push, no servers started.
