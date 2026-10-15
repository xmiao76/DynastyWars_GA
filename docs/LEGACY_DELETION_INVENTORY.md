# Legacy deletion inventory — exact file-level lists (CMR-24 Phase 5 prep)

Status: **partial portrait isolation + B12 select/result/ending migration + independent
Slice 3 whole-frame pilot and Slice 4 baked-art removal implemented; NOT Slice 1
or Slice 2 full DONE.**

**2026-10-15 independent Slice 4 (`cmr24-retire-baked-art-path`):** removed the
obsolete manifest delivery ingress, not the main legacy renderer. BootScene now
enters title directly after bounded display-font loading; its hero portrait/head,
body and weapon queues/publication, title keyart and local FX canvas `bake()`
helper remain unchanged. Vite loses only the filesystem probe and baked-art
`define`; relative base, server/watch and build settings remain unchanged.

Deleted literal paths (resolved absolute leaf paths verified before deletion):
- `src/build-flags.d.ts` (sole baked-art declaration);
- `scripts/bake-art.mjs`, `scripts/bake-core.mjs`, `scripts/bake-core.d.mts`;
- `test/game/bake.test.ts` (exclusive import of bake-core; 7 old unit cases);
- `e2e/art.spec.ts` (3 old baked-art fixture/fallback/cache cases).

Those chroma-key/despill/trim/compose/atomic-manifest and fixture-override gates
are **RETIRED-BY-DELETION, NOT PASS**. Shared facesheet, motion authoring, FX,
font/title assets and all canonical masters are untouched. The remaining old
script mentions in make-sample/artaudit comments are historical descriptions,
not imports or execution entrypoints; their separate renderer slice is deferred.
[Production guards](../prodbuild/prodbuild.spec.ts) replace the cached-manifest
case with source + actual built-JavaScript exclusivity and Canvas/WebGL ×
default/`motion=0` boot checks: even `bakedart=1` with an available stale manifest
must request none of the exclusive manifest/sprites/portraits paths. Shared
hashed portrait assets and ordinary Vite source module URLs are not forbidden.
Actual stable-source gates: lint/typecheck **PASS exit0**; retained motion-clips,
portrait, bodyparts, weaponparts, FX and display-type units **72/72 PASS exit0**;
exactly one full production run **18/18 PASS exit0 (1.6m)**, including all five
new retirement checks and unchanged reach/HUD/mobile/motion/Xiahou checks.
Whole `src/` plus actual `dist/assets/index-Mms_QXLB.js` searches have zero
exclusive path/flag/manifest-loader matches. No full units/general e2e/vision/
signal rerun here; production title/game checks serve as the focused boot gate.
Exact commands/exits are recorded in [PROGRESS](../PROGRESS.md) and local ignored
`artifacts/motion/bakedart-removal/`. Remaining renderer/switch removal, full
Part B and CMR-24 acceptance are still outstanding.

**2026-10-15 independent Slice 3 order revision:** after the pending Result vision
passed once on clean `0d298a3` (5/5, exit0), the optional whole-frame pilot is
removed before prop-only registry/sprites. This is dependency-safe: the B4
`MotionCellRect` extraction already landed in `2aaa2cc`; the pilot's only
runtime ingress was BootScene's `framesEnabled() && !motionEnabled()` branch.
Removing that ingress, `ArtResources.frames`, registry blit and blend bypass
leaves ordinary figure/body/weapon/head/procedural rendering and `?motion=0`
intact. It needs neither prop-only registry nor later head deletion. Slice 2
and joint renderer/switch Slice 6 remain outstanding, as does full Part B.

Deleted literal paths (all resolved before removal):
- `src/game/adapters/frame-art.ts`, `src/game/art/whole-frames.ts`;
- `src/game/assets/whole-frames/guanyu-sheet.png` (427540 B),
  `src/game/assets/whole-frames/prepared.json` (14402 B);
- `scripts/prepare-whole-frames.mjs`, `scripts/prepare-whole-frames.d.mts`;
- `test/game/wholeframe.test.ts`, `test/game/wholeframe-compare.test.ts`,
  `test/game/wholeframe-guides.test.ts`, `e2e/wholeframe-look.spec.ts`.

The pilot's byte/signature/cell/fit/blit gates and guide/comparison/browser
capture generators are **RETIRED-BY-DELETION, NOT PASS**. The former gated-skip
browser ledger is history, not a new pass. [WHOLE_FRAME_TEST](WHOLE_FRAME_TEST.md)
is now explicitly historical; source masters/provenance remain untouched.
[Retirement regression](../e2e/wholeframe-retired.spec.ts) passes Canvas/WebGL ×
default/rollback (4/4): `frames=1` makes zero pilot module/JSON/PNG requests,
no `frame-source:` keys or resource `frames` field, and actual visible default
motion/rollback legacy Guan Yu remains. Lint/typecheck exit0; retained focused
motion-clips/portrait/bodyparts/sprites/artquality units 85/85 exit0; production
build gate 14/14 exit0. Source import/symbol search is clean. Full units,
post-delete full vision and signal were NOT RUN in this bounded slice.
Evidence/exact commands/exits: local ignored
`artifacts/motion/wholeframe-removal/`; the original inventory below is a
historical deletion map, superseded by this disposition for these ten paths.
This document grants no deletion authority. Original inventory/review findings
below are historical at their cited commits; the current bounded work order
reports independent Part A pre-delete ACCEPT. Remaining renderer deletion still
requires its applicable gates/review under
[MOTION_SOLE_MODE_MIGRATION](MOTION_SOLE_MODE_MIGRATION.md).

**2026-10-15 dependency-order correction:** the original Slice 1 head deletion
contradicted the promise of functional `?motion=0` through Slice 5. Preserve
`HeroArt.head/front/rear/cell/bounds/skin`, `headPainter`, head loader imports,
33 rig-layer PNGs and all three full face metadata files until **Slice 6**,
jointly with the legacy renderer and switch. This is rollback preservation,
not a waived gate. Current partial slice removes only procedural portrait
production and separates shared portrait publication/consumption; no pixels
are regenerated and no rig/pose test is retired.

Method: import/call graph extracted from the tree at HEAD `943fc9d` on
2026-10-15 (`git ls-files` + per-file import scan over `src/`, `test/`,
`e2e/`, `prodbuild/`, `vision/`, `selfplay/`, `scripts/`; the two commits
after the first draft, `168963e`/`943fc9d`, touch only `e2e/gamepad.spec.ts`
and `test/game/motion-catalog.test.ts` and change no disposition below —
the new retained-eviction asserts in motion-catalog are E2-keep). "Legacy" = the paper-doll/rig
figure renderer, the whole-frame pilot, and the baked-art manifest pipeline.
"Shared" = used by motion rendering, props/projectiles/pickups, portraits,
menus/HUD/result, backdrops, or core/selfplay. Every B/C row cites the
importer/call site that forces the classification; line numbers are HEAD's and
must be re-verified at deletion time.

## Decision required before Slice 1 (D0 — procedural portrait fallback)

**D0 DECISION RECORDED (Slice 0, 2026-10-15): D0 = painted-only.** The 11
painted `*-portrait.png` files are preserved as shared assets (D-keep below);
a missing/failed portrait renders no portrait texture (existing
`ensurePortraitTextures` behaviour when `drawKindPortrait` returns false).
The procedural-fallback alternative mapped in the last paragraph of this
section is the rejected alternative and is retained only as the record of
what would change if the decision were reversed.

Historical baseline [drawKindPortrait](../src/game/art/registry.ts) had two branches (procedural branch now removed):
painted (`resources.heroes[kind].portrait` blit, :266–270) and procedural
(`drawPortraitFigure`, :271–289). All 11 kinds ship a painted `*-portrait.png`
(see D-keep), so the procedural branch is only a load-failure fallback. This
inventory assumes **D0 = painted-only** (a missing portrait renders no portrait
texture, exactly as `ensurePortraitTextures` already behaves when
`drawKindPortrait` returns false,
[sprites.ts:192](../src/game/adapters/sprites.ts#L192)). If the decision were
instead to keep the procedural fallback, then `portrait.ts`, `faces.ts`, and from
`draw.ts` the symbols `figureShapes/headRadius/plumePolygon/PLUME/HeadParts`
move from A to C-keep, and `poses.ts`/`figures.ts` stay B. Everything else is
unchanged.

## A. Legacy-only modules — delete whole file (no extraction needed)

Evidence column = all non-test importers at HEAD; each importer is itself in A
or loses the import in B surgery.

| File | Only importers (evidence) |
|---|---|
| [adapters/body-art.ts](../src/game/adapters/body-art.ts) | [BootScene:5,52,65](../src/game/scenes/BootScene.ts#L52) queue/publish only |
| [adapters/weapon-art.ts](../src/game/adapters/weapon-art.ts) | [BootScene:6,53,66](../src/game/scenes/BootScene.ts#L53) only |
| [adapters/frame-art.ts](../src/game/adapters/frame-art.ts) | [BootScene:7,57,67](../src/game/scenes/BootScene.ts#L57) only, behind `framesEnabled()&&!motionEnabled()` |
| [art/armik.ts](../src/game/art/armik.ts) | [weapons.ts:1](../src/game/art/weapons.ts#L1) only |
| [art/weapons.ts](../src/game/art/weapons.ts) | [draw.ts:9](../src/game/art/draw.ts#L9) (`addWeapon,weaponPose`) only |
| [art/body-parts.ts](../src/game/art/body-parts.ts) | [draw.ts:3](../src/game/art/draw.ts#L3), type-only [hero-resources:3](../src/game/art/hero-resources.ts#L3), [body-art:2](../src/game/adapters/body-art.ts#L2), [registry:3](../src/game/art/registry.ts#L3) |
| [art/hand-parts.ts](../src/game/art/hand-parts.ts) | [draw.ts:4](../src/game/art/draw.ts#L4) only |
| [art/weapon-parts.ts](../src/game/art/weapon-parts.ts) | [draw.ts:5](../src/game/art/draw.ts#L5), type-only [hero-resources:4](../src/game/art/hero-resources.ts#L4), [weapon-art:2](../src/game/adapters/weapon-art.ts#L2), [registry:4](../src/game/art/registry.ts#L4) |
| [art/interpolate.ts](../src/game/art/interpolate.ts) | [sprites.ts:15](../src/game/adapters/sprites.ts#L15) blend path only |
| [art/poses.ts](../src/game/art/poses.ts) | legacy only: [registry:7](../src/game/art/registry.ts#L7), [sprites:13-14](../src/game/adapters/sprites.ts#L13), [frame-art:4](../src/game/adapters/frame-art.ts#L4), [hero-resources:1](../src/game/art/hero-resources.ts#L1), [whole-frames:11](../src/game/art/whole-frames.ts#L11), [armik:23](../src/game/art/armik.ts#L23), [weapons:6](../src/game/art/weapons.ts#L6), [draw:6](../src/game/art/draw.ts#L6) (motion clips never import `PoseName`) |
| [art/figures.ts](../src/game/art/figures.ts) | after B-sprites tint decision: [registry:6](../src/game/art/registry.ts#L6), [draw:7-8](../src/game/art/draw.ts#L7), [portrait:12](../src/game/art/portrait.ts#L12), [weapons:3](../src/game/art/weapons.ts#L3), [faces:1](../src/game/art/faces.ts#L1) — all A/B-figure paths |
| [art/faces.ts](../src/game/art/faces.ts) | Retain through Slice 5: imported by draw.ts for rollback fighter faces; procedural portrait importer removed. Delete only with draw.ts in Slice 6. |
| `art/portrait.ts` (deleted in partial Slice 1) | D0 procedural-only portrait generator retired; no remaining importer. `faces.ts` remains live for fighter drawing. |
| [src/build-flags.d.ts](../src/build-flags.d.ts) | declares only `__HAS_BAKED_ART__` (:9); sole consumer [BootScene:87](../src/game/scenes/BootScene.ts#L87) |

## B. Mixed files — surgery: extract first, then delete the legacy remainder

### B1. [art/draw.ts](../src/game/art/draw.ts) — extract the cel pipeline

Extract to a new small module (suggested `art/cel.ts`): `Shape`
([:62](../src/game/art/draw.ts#L62)), `CelBand` ([:137](../src/game/art/draw.ts#L137)),
`DEFAULT_BANDS` ([:146](../src/game/art/draw.ts#L146)), `paintCel`
([:151](../src/game/art/draw.ts#L151)), plus `INK_W`
([:58](../src/game/art/draw.ts#L58); used inside `paintCel` at :165).
Evidence (shared consumers): [props.ts:3](../src/game/art/props.ts#L3) imports
`paintCel, type Shape`; called at [props.ts:204-206](../src/game/art/props.ts#L204).
Under D0-keep-fallback only, also extract `figureShapes` (:729), `headRadius`
(:680), `plumePolygon` (:1108), `PLUME` (:1104), `HeadParts` (:695) for
[portrait.ts:1-10,915](../src/game/art/portrait.ts#L915).
Delete remainder, incl. `drawFigure` ([:197](../src/game/art/draw.ts#L197); sole
importer [registry:1](../src/game/art/registry.ts#L1), calls :320/:358/:360).

### B2. [art/rig.ts](../src/game/art/rig.ts) — extract canvas path helpers

Extract to `art/cel.ts` (or `art/paths.ts`): `Pt` ([:19](../src/game/art/rig.ts#L19)),
`limbPath` ([:131](../src/game/art/rig.ts#L131)), `ovalPath`
([:207](../src/game/art/rig.ts#L207)), `polyPath` ([:220](../src/game/art/rig.ts#L220)).
Evidence: [props.ts:2](../src/game/art/props.ts#L2) imports all four; uses at
props :32 (limbPath band), :43/:122/:163/:172 (polyPath), :91–96 (ovalPath).
Delete remainder: `FIG_W/FIG_H/BODY_X/GROUND` (:25–28), `Skeleton` (:35),
`Build/STANDARD_BUILD` (:73/:84), `applyBuild` (:102), `chainPath` (:166),
`lerpPt` (:227) — consumers are only poses/armik/interpolate/draw/weapons/
registry-figure/portrait paths (import scan in A/poses row).

### B3. [adapters/sprites.ts](../src/game/adapters/sprites.ts) — keep prop + portrait keys only

Keep/extract (evidence): `textureKeyFor` ([:46](../src/game/adapters/sprites.ts#L46);
prop key, [GameScene:729,766](../src/game/scenes/GameScene.ts#L729)),
`isPropKind` ([:148](../src/game/adapters/sprites.ts#L148); GameScene :743/:774/:855 —
rebase from `isVectorProp(VECTOR_ART)` onto `PROPS`), `portraitKeyFor`
([:176](../src/game/adapters/sprites.ts#L176); [HudScene:231](../src/game/scenes/HudScene.ts#L231),
[SelectScene:138](../src/game/scenes/SelectScene.ts#L138)),
`ensurePortraitTextures` ([:181](../src/game/adapters/sprites.ts#L181);
[HudScene:268,646](../src/game/scenes/HudScene.ts#L268),
[SelectScene:83](../src/game/scenes/SelectScene.ts#L83)), and the prop branch of
`ensureEntityTextures` ([:167-169](../src/game/adapters/sprites.ts#L167)) renamed
prop-only.
**Portrait/select tint**: `paletteColorFor` ([:157](../src/game/adapters/sprites.ts#L157))
reads `FigurePlan.body` via `vectorArtFor`, but repo-wide search finds **no live
caller** (definition + PROGRESS-ARCHIVE mention only). Delete it outright; do
not keep `figures.ts` for it. If a future select tint is wanted, extract the 11
`body` colour constants into the portrait module — do not resurrect the plan.
Delete: `POSES/Pose` (:28–44), `textureKeyForPose` (:50), `STRIKE_POSE` (:66),
`poseForEntity` (:110; sole caller GameScene legacy branch :775), figure branch
of `ensureEntityTextures` (:171), `ensureVectorKey` figure use (:198–209),
`blendKeyFor/ensureBlendKey` (:216/:222; sole caller
[GameScene:800-801](../src/game/scenes/GameScene.ts#L800)).

### B4. [art/whole-frames.ts](../src/game/art/whole-frames.ts) — extract the cell-rect type

Extract `WholeFrameCell` ([:13-19](../src/game/art/whole-frames.ts#L13)) into
[motion-clips.ts](../src/game/art/motion-clips.ts) (rename e.g. `MotionCellRect`).
Evidence: [motion-clips:4](../src/game/art/motion-clips.ts#L4) imports it;
`MotionFrameCell extends WholeFrameCell` ([motion-clips:16](../src/game/art/motion-clips.ts#L16)),
local use [:102](../src/game/art/motion-clips.ts#L102). All 10 per-kind clip files
reach it only through `motion-clips.ts` types.
Delete remainder: `WholeFrameArt` (:21), `paintWholeFrame` (:35; sole caller
[registry:347](../src/game/art/registry.ts#L347)), `hasWholeFrame` (:49; sole
caller [sprites:233](../src/game/adapters/sprites.ts#L233)).

### B5. [art/registry.ts](../src/game/art/registry.ts) — keep prop + painted-portrait paths

Keep/extract prop path (evidence): the `PROPS` half of `VECTOR_ART`
([:144-146](../src/game/art/registry.ts#L144)) becomes a prop-only registry;
`isVectorProp` ([:159](../src/game/art/registry.ts#L159); sprites :149/:167);
`artBoxFor` prop branch ([:166-173](../src/game/art/registry.ts#L166), `PROP_PAD`
:131); `artDisplayHeight` prop branch ([:189](../src/game/art/registry.ts#L189);
sole scene caller [GameScene:728](../src/game/scenes/GameScene.ts#L728) in
`fitSprite`, whose motion branch :714–720 does not use it — props do);
`drawKindPose` prop case ([:364-367](../src/game/art/registry.ts#L364), calls
`drawProp`).
**Partial slice implemented:** shared `PORTRAIT_BOX/PORTRAIT_SCALE/PORTRAIT_TEXTURE`
and `drawKindPortrait` now live in [painted-portraits.ts](../src/game/art/painted-portraits.ts),
with registry re-exports for compatibility. Its input is `PortraitResources`
(`portraits` only), never `VECTOR_ART`, body plans or head layers. Procedural
`portrait.ts` and portrait zoom/head-Y constants are retired; `faces.ts` and
`draw.ts` remain for rollback. Historical extraction mapping follows.

Keep/extract portrait path: `PORTRAIT_BOX` (:201), `PORTRAIT_SCALE` (:219),
`PORTRAIT_TEXTURE` (:222) — imported by [sprites:5-6,187-189](../src/game/adapters/sprites.ts#L187);
`drawKindPortrait` painted branch only ([:266-270](../src/game/art/registry.ts#L266),
`ctx.drawImage(painted.portrait,…)`; caller sprites :192).
Delete: figure half of `VECTOR_ART` (:137–143), `vectorArtFor` figure use
(:149), `vectorKinds` (:154; sole caller [bridge:150](../src/game/debug/bridge.ts#L150)),
`ArtBox/figureBoxFor/POSE_REACH/marginFor/HEADROOM` (:70–109), `blendBoxFor/
blendMarginFor` (:116/:122), `FIGURE_BOX/FIGURE_STAND_H` (:134–135),
`drawKindSkeleton` (:298; sole caller sprites :249), `drawKindPose` figure case
(:342–363, incl. `paintWholeFrame` :347), and under D0 `PORTRAIT_ZOOM/
PORTRAIT_HEAD_Y` (:254–255) + procedural portrait branch (:271–289).

### B6. [art/hero-resources.ts](../src/game/art/hero-resources.ts) — slim to portrait + motions

Keep fields (evidence): `HeroArt.portrait` ([:12](../src/game/art/hero-resources.ts#L12);
consumer registry :268), `HeroArt.id/revision` (:10–11; identity in
[hero-art:123](../src/game/adapters/hero-art.ts#L123)), `ArtResources.heroes`
([:22](../src/game/art/hero-resources.ts#L22); sprites :187, registry :266),
`ArtResources.motions` ([:33](../src/game/art/hero-resources.ts#L33);
[motion-art:1025,1047,1058](../src/game/adapters/motion-art.ts#L1025),
[GameScene:601,711,832,854](../src/game/scenes/GameScene.ts#L601)).
**Do NOT delete in Slice 1.** `PortraitArt` + `PortraitResources` now expose
only portrait identity/image; `HeroArt` extends that shape and retains the
rollback fields. Exact live chain: `GameScene` legacy branch → sprites
`ensureEntityTextures/ensureBlendKey` → registry `drawKindPose/drawKindSkeleton`
→ `drawFigure` → `headPainter` → `art[layer]`, `cell`, `bounds`.
`drawFigure` also directly reads `painted?.art?.skin` (current draw.ts:83) and
uses `HEAD_PAINTED_SCALE` (draw.ts:106); weapons.ts imports `HEAD_CHIN_DROP`.
Thus `headPainter`, expressions/scale constants and the following fields can
only disappear jointly with renderer/switch removal in **Slice 6**. Existing
hero/boss/mook face tests retain head clipping/expression/fallback gates.

Delete fields in Slice 6: `head/front/rear` (:13–15), `cell` (:16), `bounds` (:17),
`skin` (:18) — sole runtime consumers are `headPainter` in the same file
([:57-75](../src/game/art/hero-resources.ts#L57), uses `art[layer]/cell/bounds`)
and painted-skin at [draw:204](../src/game/art/draw.ts#L204); `bodies` (:25),
`weapons` (:28), `frames` (:31). Delete `HeadLayer/HeadPainter` (:36–37),
`HEAD_PAINTED_SCALE` (:43), `HEAD_CHIN_DROP` (:47; sole importer
[weapons:4](../src/game/art/weapons.ts#L4)), `expressionFor` (:49),
`headPainter` (:57; sole importer [draw:2](../src/game/art/draw.ts#L2)).

### B7. [adapters/hero-art.ts](../src/game/adapters/hero-art.ts) — independent portraits now, queue portraits only in Slice 6

**Partial slice implemented:** validate/publish `portraits[id]` independently
of rig-head success, preserving every signature/dimension check. Continue
queueing all four parts and publishing atomic `heroes[id]` for rollback.
`sprite.ensurePortraitTextures` reads only `portraits` and keeps `portrait:<id>`
432×480 textures; a missing/rejected portrait creates no substitute.
`publishBodyArtRecords` must spread the prior shared resource record rather
than reconstruct only `heroes/bodies`; its portrait-preservation regression
is in bodyparts.test.ts. This live shared-record dependency is fixed here. A missing
rig layer no longer suppresses an otherwise valid portrait. All 33 head imports
and full `prepared.json` fields below stay live until Slice 6.

Keep: the 11 `*-portrait.png` imports ([:7,11,15,19,23,27,31,35,39,43,47](../src/game/adapters/hero-art.ts#L7)),
`ART_RESOURCE_KEY` ([:80](../src/game/adapters/hero-art.ts#L80); imported by
[motion-art:18](../src/game/adapters/motion-art.ts#L18), body/frame/weapon
adapters being deleted), `queueHeroArt/publishHeroArt/heroArtResources`
(:83/:107/:132; BootScene :51/:64; motion-art :1025+ via `heroArtResources`),
portrait size check `[432,480]` (:117) and signature check (:119–120, shared
[image-signature](../src/game/art/image-signature.ts)). Publish condition
:122 slims from all-4-parts to portrait-only; `PARTS` (:77) slims to
`['portrait']`.
Delete: the 33 `*-head/-front/-rear.png` imports (:8–10,12–14,…,48–50) and the
`cell/bounds/skin` publish fields (:124–125).

### B8. [adapters/motion-art.ts](../src/game/adapters/motion-art.ts) — remove fallback semantics, keep loader

Delete: `motionEnabled` `motion=0` branch ([:98-99](../src/game/adapters/motion-art.ts#L98);
callers [BootScene:57,67](../src/game/scenes/BootScene.ts#L57),
[GameScene:220](../src/game/scenes/GameScene.ts#L220)),
`canRenderLegacyFrame` ([:481](../src/game/adapters/motion-art.ts#L481); sole
caller [GameScene:747](../src/game/scenes/GameScene.ts#L747)),
`MotionStageReport.legacy` ([:426-427](../src/game/adapters/motion-art.ts#L426),
pushes :649/:661–664 → rename to failure reporting), deadline-continues-on-legacy
comment/behaviour ([:360](../src/game/adapters/motion-art.ts#L360)),
`ensureMotionFrame` caller-falls-back contract ([:1055-1057](../src/game/adapters/motion-art.ts#L1055);
published-pack missing frame must render nothing/error, never legacy).
Keep everything else (packs :232, runtime :487, scope/request :885–952, publish
:952–1024, playback :1032–1055) — this is the sole renderer.

### B9. [adapters/motion-catalog.ts](../src/game/adapters/motion-catalog.ts) — drop legacy cost accounting

Delete: `legacyFallbackBytes` ([:166](../src/game/adapters/motion-catalog.ts#L166)),
`noteLegacyFallback` ([:191](../src/game/adapters/motion-catalog.ts#L191)),
`BudgetReport.legacyFallbackCost` ([:155](../src/game/adapters/motion-catalog.ts#L155),
assigned :390). Keep `validateManifest` (:102), `MotionAtlasCache` (:162),
caps (:94) — consumed by motion-art/runtime tests.

### B10. [scenes/GameScene.ts](../src/game/scenes/GameScene.ts) — delete the legacy render branch

Delete: `motionOn` latch ([:200,220](../src/game/scenes/GameScene.ts#L200)),
`hasArtFor` legacy keys ([:117-121](../src/game/scenes/GameScene.ts#L117)),
stage-build `ensureEntityTextures` (:424 → prop-only), legacy sprite creation
([:760-767](../src/game/scenes/GameScene.ts#L760)), published-pack legacy pose
fallback incl. blend queue ([:785-822](../src/game/scenes/GameScene.ts#L785)),
`fitSprite` legacy branch ([:721-733](../src/game/scenes/GameScene.ts#L721))
except prop sizing via B5's `artDisplayHeight`, `canRenderLegacyFrame` gate
(:747 → unpublished/missing renders nothing, gate already halts on load error
:1039/:1096). Keep motion path (:714–720 fit, :758–759 create, :776–784 bind),
props via `isPropKind/textureKeyFor` (:729/:743/:855), shadows/FX/HUD wiring.

### B11. [scenes/BootScene.ts](../src/game/scenes/BootScene.ts) — drop body/weapon/frame queues + baked manifest

**Slice 4 disposition:** manifest interface/fetch/preload/forced-parameter/build-flag
branch and `enterTitle` wrapper are removed. Font completion starts title directly.
Keep all current hero/head/body/weapon queues and publication for normal rollback
until Slice 6; FX, font and title keyart are shared. The historical map follows.

Delete: imports/calls :5–7, `queueBodyArt/queueWeaponArt` (:52–53),
`framesEnabled` queue (:57), publishes (:65–67), `ArtManifest` (:13–16),
`enterTitle` baked branch (:75–95, incl. `bakedart=1` :86 and
`__HAS_BAKED_ART__` :87), `loadManifest` (:97), `startPreload` (:108,
`assets/sprites/…` + `assets/portraits/…` :112–114).
Keep: `queueHeroArt/publishHeroArt` (:51/:64, portrait-slimmed B7), title keyart
load (:60, [keyart-backdrop.jpg](../src/game/assets/title/keyart-backdrop.jpg)),
font (:72), FX `generateFxTextures` (:130–134; the local `bake()` helper :27 is
canvas texture baking for FX, **not** the baked-art pipeline — keep, maybe
rename to avoid confusion).

### B12. Menu/result dependencies — select/ending sub-slice implemented

**Result shared-portrait follow-up also implemented (2026-10-15); details below.**

**2026-10-15, `cmr24-menu-legacy-dependency-removal`, bounded attempt 1:**
- [SelectScene.ts](../src/game/scenes/SelectScene.ts): removed ONLY the unused
  `ensureEntityTextures(this,[...CHARACTER_ORDER])` call/import. Retained
  `ensurePortraitTextures` and the existing painted roster cards, labels,
  sizing/cursors and confirmation path.
- [GameCompleteScene.ts](../src/game/scenes/GameCompleteScene.ts): replaced
  legacy figure generation + `entity:<char>:idle` sprites with shared
  `ensurePortraitTextures`/`portraitKeyFor` images. The five portraits stay on
  the original lower-band centres (54px spacing, bottom y254) with small
  lacquer/gold frames; the 432×480 aspect fits each slot at 46×51.11 logical px
  (within the old 62px height). Existing victory panel, text and navigation
  unchanged. Missing portraits are omitted, never procedurally substituted;
  no motion-frame/all-cast network preload was added.
- **Historical inventory correction:** Result conditionally consumed a cached
  `entity:<char>:idle` texture or emblem rectangles; the original claim that it
  used flowart only was inaccurate. That residual is now removed by the separate
  `cmr24-result-shared-portrait` bounded attempt 1:
  [ResultScene](../src/game/scenes/ResultScene.ts) ensures the actual `charId`'s
  shared painted portrait, with no idle-cache read, figure generation or emblem/
  procedural fallback. Both 116.1×129 logical-px images retain centres x84/x396
  and bottom y240, lacquer/gold frames and the mirrored translucent right image.
  The existing dialog stays in front; payload/labels/navigation are unchanged.
  [GameOverScene.ts](../src/game/scenes/GameOverScene.ts) and
  [TitleScene.ts](../src/game/scenes/TitleScene.ts) remain untouched.
- This is **B12 only, not full Slice 2**: registry/sprites prop surgery and the
  rollback fighter/head resources remain live and unchanged. Head/metadata/
  script deletion is still deferred to joint renderer + switch **Slice 6**.
- Focused [shared-screen spec](../e2e/motion-shared-screens.spec.ts) covers
  Canvas/WebGL × default/`motion=0`, selected Wei Yan portrait/key/nonblank
  rendered interiors/bounds, empty entity texture cache before stage, no
  menu motion PNG requests and real select confirm. Result coverage adds fresh
  title → direct result with an empty fighter cache (both portrait images,
  exposed rendered regions, exact centres/height/baseline/mirror/alpha and no
  `entity:`-key scene images), nonzero score/time/lives, and Enter → stage2
  carrying hero/co-op/score/lives/seed/totalTicks. Stage3 `forceResult()` → Enter
  → gamecomplete → title remains a transition fixture, not a combat-clear claim;
  [stageclear](../e2e/stageclear.spec.ts) separately verifies natural stage1 clear
  with the cleared Zhao Yun portraits and score label. Actual checks/screenshots
  are recorded in [PROGRESS](../PROGRESS.md).

### B13. [debug/bridge.ts](../src/game/debug/bridge.ts) — replace `registerAllArt`

`registerAllArt` ([:66,147-150](../src/game/debug/bridge.ts#L147)) =
`ensureEntityTextures(scene, vectorKinds())`. Replace with prop+portrait
registration (or removal) in the same slice as the vision sprite-gate rewrite
(E), whose only consumer is [vision.spec:356](../vision/vision.spec.ts#L356).
Keep the rest of the bridge unchanged — selfplay/e2e drive it
(`GameSnapshot` imported by [selfplay/invariants.ts:3](../selfplay/invariants.ts#L3)).

### B14. Trivial repoint-only files

- [art/props.ts](../src/game/art/props.ts): keep whole; repoint imports :2–3 to
  B1/B2 extractions. Shared because stage props/pickups/projectiles render
  through it in motion mode ([GameScene:743](../src/game/scenes/GameScene.ts#L743)
  skips motion for prop kinds; registry prop case B5).
- [art/motion-clips.ts](../src/game/art/motion-clips.ts): keep whole; replace
  import :4 with B4's local type.
- [vite.config.ts](../vite.config.ts): keep; delete `hasBakedArt` probe +
  `__HAS_BAKED_ART__` define (see F).

## C. Shared — keep (with caller evidence)

Runtime `src/game` (every file not in A/B):

| File | Shared consumer evidence |
|---|---|
| [art/backdrop.ts](../src/game/art/backdrop.ts) | [GameScene:59](../src/game/scenes/GameScene.ts#L59) stage layers; imports only [palette:1](../src/game/art/palette.ts) |
| [art/palette.ts](../src/game/art/palette.ts) | [backdrop:1](../src/game/art/backdrop.ts#L1), [props:1](../src/game/art/props.ts#L1) (`INK/css/shade/tint` :12–32) |
| [art/props.ts](../src/game/art/props.ts) | B14; `PROPS` :35, `drawProp` :201 via registry prop case |
| [art/fx.ts](../src/game/art/fx.ts) | [BootScene:3,131-133](../src/game/scenes/BootScene.ts#L131) impact textures |
| [art/flowart.ts](../src/game/art/flowart.ts) | [ResultScene:9](../src/game/scenes/ResultScene.ts#L9), [GameOverScene:6](../src/game/scenes/GameOverScene.ts#L6), [GameCompleteScene:12](../src/game/scenes/GameCompleteScene.ts#L12), [HudScene:22](../src/game/scenes/HudScene.ts#L22) |
| [art/hudart.ts](../src/game/art/hudart.ts) | [HudScene:40](../src/game/scenes/HudScene.ts#L40); `paintMedallion(ctx,s,portrait)` [:129](../src/game/art/hudart.ts#L129) called [HudScene:235](../src/game/scenes/HudScene.ts#L235); [touch:6](../src/game/adapters/touch.ts#L6) |
| [art/selectart.ts](../src/game/art/selectart.ts) | [SelectScene:19,122](../src/game/scenes/SelectScene.ts#L122) roster cards/backdrop |
| [art/keyart.ts](../src/game/art/keyart.ts) | [TitleScene:7](../src/game/scenes/TitleScene.ts#L7) `paintDuskBattle` fallback for `ui:keyart-photo` (TitleScene :47) |
| [art/logo.ts](../src/game/art/logo.ts) | [ui/panels:2](../src/game/ui/panels.ts#L2) title logo |
| [art/image-signature.ts](../src/game/art/image-signature.ts) | [hero-art:3](../src/game/adapters/hero-art.ts#L3) (portrait verify), [motion-art:5](../src/game/adapters/motion-art.ts#L5) (pack verify) |
| [art/motion-clips.ts](../src/game/art/motion-clips.ts), [motion-clips-archer.ts](../src/game/art/motion-clips-archer.ts), [motion-clips-huangzhong.ts](../src/game/art/motion-clips-huangzhong.ts), [motion-clips-lidian.ts](../src/game/art/motion-clips-lidian.ts), [motion-clips-soldier.ts](../src/game/art/motion-clips-soldier.ts), [motion-clips-spearman.ts](../src/game/art/motion-clips-spearman.ts), [motion-clips-weiyan.ts](../src/game/art/motion-clips-weiyan.ts), [motion-clips-xiahoudun.ts](../src/game/art/motion-clips-xiahoudun.ts), [motion-clips-xuchu.ts](../src/game/art/motion-clips-xuchu.ts), [motion-clips-zhangfei.ts](../src/game/art/motion-clips-zhangfei.ts), [motion-clips-zhaoyun.ts](../src/game/art/motion-clips-zhaoyun.ts) | all imported by [motion-art:6-16](../src/game/adapters/motion-art.ts#L6) pack definitions |
| [art/motion-player.ts](../src/game/art/motion-player.ts) | [motion-art:17](../src/game/adapters/motion-art.ts#L17) `advanceMotion` |
| [art/motion-profiles.ts](../src/game/art/motion-profiles.ts), [art/motion-quality.ts](../src/game/art/motion-quality.ts) | motion profile/quality gates; imported by per-kind motion unit tests (§E keep) |
| [adapters/motion-scope.ts](../src/game/adapters/motion-scope.ts) | [motion-art:29](../src/game/adapters/motion-art.ts#L29) `stageMotionScope/kindsDueByTick` |
| [adapters/keyboard.ts](../src/game/adapters/keyboard.ts), [adapters/gamepad.ts](../src/game/adapters/gamepad.ts), [adapters/touch.ts](../src/game/adapters/touch.ts) | GameScene/HudScene input (GameScene imports :25–27 area; touch uses hudart) |
| [scenes/TitleScene.ts](../src/game/scenes/TitleScene.ts), [scenes/GameOverScene.ts](../src/game/scenes/GameOverScene.ts) | no legacy figure imports (flowart/keyart/panels only) |
| [scenes/ResultScene.ts](../src/game/scenes/ResultScene.ts) | keep shared flowart/chips/navigation; residual conditional cached legacy idle-key consumer at :67–83 (B12 correction), resolve with renderer/switch slice |
| [scenes/HudScene.ts](../src/game/scenes/HudScene.ts) | portrait dependency only: imports sprites portrait helpers [:10](../src/game/scenes/HudScene.ts#L10), calls :268/:646 — preserved by B3/B7 |
| [data/stagebackdrop.ts](../src/game/data/stagebackdrop.ts), [data/stagelore.ts](../src/game/data/stagelore.ts), [audio/music.ts](../src/game/audio/music.ts), [audio/sfx.ts](../src/game/audio/sfx.ts), [ui/display.ts](../src/game/ui/display.ts), [ui/hiscore.ts](../src/game/ui/hiscore.ts), [ui/hudlayout.ts](../src/game/ui/hudlayout.ts), [ui/orientation.ts](../src/game/ui/orientation.ts), [ui/panels.ts](../src/game/ui/panels.ts), [ui/roster.ts](../src/game/ui/roster.ts), [ui/theme.ts](../src/game/ui/theme.ts), [ui/type.ts](../src/game/ui/type.ts), [ui/viewport.ts](../src/game/ui/viewport.ts), [main.ts](../src/game/main.ts), [players.ts](../src/game/players.ts), [render.ts](../src/game/render.ts) | no legacy-art imports (scan: core/ui/audio only) |
| `src/core/*` (16 files: ai, attacks, characters, combat, constants, enemies, entities, events, items, players, rng, sim, simtypes, snapshot, stage, types — each `src/core/<stem>.ts`) | simulation; untouched by definition of legacy |
| [src/style.css](../src/style.css), [index.html](../index.html) | page shell; no legacy-art reference |

Selfplay (all keep; only bridge-type dependency, B13):
[selfplay/bot.ts](../selfplay/bot.ts), [selfplay/harness.ts](../selfplay/harness.ts),
[selfplay/invariants.ts](../selfplay/invariants.ts),
[selfplay/coop.spec.ts](../selfplay/coop.spec.ts),
[selfplay/idlebot.spec.ts](../selfplay/idlebot.spec.ts),
[selfplay/marathon.spec.ts](../selfplay/marathon.spec.ts),
[selfplay/perf.spec.ts](../selfplay/perf.spec.ts),
[selfplay/seeds.spec.ts](../selfplay/seeds.spec.ts),
[selfplay/selfplay.spec.ts](../selfplay/selfplay.spec.ts),
[selfplay/weapon.spec.ts](../selfplay/weapon.spec.ts) — zero legacy-art imports;
`invariants.ts:3` imports only the `GameSnapshot` type from bridge.

## D. Shipping asset files (`src/game/assets/`, imported into the bundle)

### D-delete (legacy-only; bytes at HEAD)

- `hero-bodies/` (imported only by body-art.ts): `guanyu-sheet.png` 115432,
  `huangzhong-sheet.png` 112217, `weiyan-sheet.png` 95679, `zhangfei-sheet.png`
  102229, `zhaoyun-sheet.png` 155538, `prepared.json` 73897.
- `mook-bodies/`: `archer-sheet.png` 92535, `soldier-sheet.png` 106808,
  `spearman-sheet.png` 107411, `prepared.json` 44183.
- `boss-bodies/`: `lidian-sheet.png` 123400, `xiahoudun-sheet.png` 113799,
  `xuchu-sheet.png` 115673, `prepared.json` 44180.
- `weapons/` (weapon-art.ts only): `weapons-sheet.png` 47831, `prepared.json` 13717.
- `whole-frames/` (frame-art.ts only): `guanyu-sheet.png` 427540, `prepared.json` 14402.
- Face rig layers, 33 files (hero-art B7 deletes imports) —
  `hero-faces/`: guanyu/huangzhong/weiyan/zhangfei/zhaoyun × `-head.png`,
  `-front.png`, `-rear.png` (15 files);
  `boss-faces/`: lidian/xiahoudun/xuchu × same 3 suffixes (9 files);
  `mook-faces/`: archer/soldier/spearman × same 3 suffixes (9 files).
- `body-fixtures/fixture-sheet.png` 16377 + `prepared.json` 14020 — **not
  shipped** (no `src` importer; only
  [bodyparts.test:25,71](../test/game/bodyparts.test.ts#L25) and
  make-body-fixtures script); delete with E.

### D-keep (shared, must survive)

- Portraits, 11 files: `hero-faces/{guanyu,huangzhong,weiyan,zhangfei,zhaoyun}-portrait.png`,
  `boss-faces/{lidian,xiahoudun,xuchu}-portrait.png`,
  `mook-faces/{archer,soldier,spearman}-portrait.png` (evidence B7/B5).
- Mixed, **slim only in Slice 6** (rollback needs all fields until then): `hero-faces/prepared.json` 249830,
  `boss-faces/prepared.json` 149879, `mook-faces/prepared.json` 149883 — after
  B6/B7 the runtime needs only `revision` + portrait `signatures.portrait`
  ([hero-art:110-125](../src/game/adapters/hero-art.ts#L110)); head
  signatures/cell/bounds/skin entries become dead data to regenerate out.
- Motion packs, 27 files in `motion/`: `prepared.json`, `actions-prepared.json`,
  `guanyu-motion-sheet.png`, `guanyu-actions-sheet.png`,
  `zhangfei-motion-sheet.png`, `zhangfei-actions-sheet.png`,
  `zhangfei-prepared.json`, `zhaoyun-motion-sheet.png`,
  `zhaoyun-actions-sheet.png`, `zhaoyun-prepared.json`,
  `weiyan-motion-sheet.png`, `weiyan-actions-sheet.png`, `weiyan-prepared.json`,
  `huangzhong-motion-sheet.png`, `huangzhong-prepared.json`,
  `soldier-motion-sheet.png`, `soldier-prepared.json`,
  `spearman-motion-sheet.png`, `spearman-prepared.json`,
  `archer-motion-sheet.png`, `archer-prepared.json`,
  `lidian-motion-sheet.png`, `lidian-prepared.json`,
  `xiahoudun-motion-sheet.png`, `xiahoudun-prepared.json`,
  `xuchu-motion-sheet.png`, `xuchu-prepared.json` (all imported by motion-art).
- `title/keyart-backdrop.jpg` 119012 (BootScene :60 → TitleScene :47);
  `fonts/zcool-qingke-huangyou-subset.woff2` + `OFL.txt` + `PROVENANCE.md` +
  `subset.txt` (BootScene :10/:72).
- `public/_headers`, `public/favicon.svg` — no `public/assets/` exists; the
  baked manifest path ships nothing today (F).

### D-non-shipping masters under `art/` (source only; delete or leave to git history — manager call, not bundle)

Legacy-only: `art/fighter-bodies/` (12: `PROVENANCE.md` +
archer/guanyu/huangzhong/lidian/soldier/spearman/weiyan/xiahoudun/xuchu/
zhangfei/zhaoyun `-body-master.jpg`), `art/whole-frames/` (13: `PROVENANCE.md`,
`guanyu/{attack,down,idle}-master.png`, `guanyu/guide-{attack,down,idle}.png`,
`…-mask.png`, `….json`), face **heads** masters (keep the 11
`*-portrait-master.*`): `art/hero-faces/{guanyu,huangzhong,weiyan,zhangfei,zhaoyun}-heads-master.png`,
`art/boss-faces/{lidian,xiahoudun,xuchu}-heads-master.jpg`,
`art/mook-faces/{archer,soldier,spearman}-heads-master.jpg`.
Keep: `art/ui-title/keyart-master.jpg` + `PROVENANCE.md` (feeds
prepare-title-art), all of `art/motion/**` (2049 files, motion provenance —
outside legacy scope by definition).

## E. Tests / e2e / vision / scripts — delete vs rewrite

### E1. Unit tests (`test/game/`) — DELETE (legacy-renderer-only; retire as retired-by-deletion, never "newly green")

`action-guides.test.ts`, `anatomy-review.test.ts`, `arm-chain.test.ts` +
`arm-chain-lib.ts` (incl. the known G6 failure — retired-by-deletion),
`armik.test.ts`, `artaudit.test.ts`, `bake.test.ts`, `body24-frames.test.ts`,
`bodyboard.test.ts`, `bodyparts.test.ts`, `bossboard.test.ts`,
`castboard.test.ts`, `footcheck.test.ts`, `handgrip.test.ts`,
`handparts.test.ts`, `interpolate.test.ts`, `lookreview.test.ts`,
`motion-guides.test.ts` (rig-drawn Guan Yu authoring guides),
`movesheets.test.ts`, `proportions.test.ts`, `reviewharness.test.ts`,
`uir13-gripwrap.test.ts`, `uir14-joins.test.ts`, `uir15-strikearms.test.ts`,
`uir19-hands.test.ts`, `waistclean.test.ts`, `weaponmat.test.ts`,
`weaponparts.test.ts`, `weapons.test.ts`, `wholeframe.test.ts`,
`wholeframe-compare.test.ts`, `wholeframe-guides.test.ts`, `zz-blade.test.ts`,
`zz-crescent.test.ts`; helpers `cast-art.ts`,
`fixtures/weapon-heads-before.ts`. (Each imports only A/B-figure modules per
the import scan; e.g. arm-chain-lib imports body-parts/draw/figures/poses/
registry/rig/weapons.)

### E2. Unit tests — REWRITE (mixed)

| File | Keep | Remove/replace |
|---|---|---|
| `artquality.test.ts` | sprite-metric gates over props/portraits (imports vision metrics :12 area) | figure/pose/draw gates (imports registry/draw/figures/poses/rig, mook-bodies prepared.json) → motion-frame + prop + portrait inventory |
| `hero-faces.test.ts`, `boss-faces.test.ts`, `mook-faces.test.ts` | painted-portrait pixel asserts (e.g. [boss-faces:123](../test/game/boss-faces.test.ts#L123) `drawImage(…portrait)`) | `headPainter/expressionFor` rig-head asserts (:7 imports, e.g. hero-faces :46) |
| `likeness.test.ts` | three rig/plan likeness tests preserved | RETIRED only procedural portrait beard/lip/jaw comparisons; no fake-green replacement |
| `portrait.test.ts` | new all-11 painted PNG hash/signature/dimension/exact-blit/bounds and absent-no-fallback gates | former 11 procedural portrait geometry/detail tests RETIRED with portrait.ts, not reported newly green |
| `rig.test.ts` | `limbPath` asserts → repoint to B2 extraction | `chainPath` asserts (deleted helper) |
| `sprites.test.ts` | prop single-texture + key convention ([ :19-22](../test/game/sprites.test.ts#L19) `entity:arrow`) | `STRIKE_POSE/poseForEntity/textureKeyForPose/vectorKinds` asserts |
| `motion-clips.test.ts` | pack/clip asserts | `motionEnabled` cases ([ :18-38](../test/game/motion-clips.test.ts#L18)) → `motion=0` has no rendering effect |
| `motion-catalog.test.ts`, `motion-runtime.test.ts`, `motion-scope.test.ts` | loader/cache/scope asserts | legacy-report fields (`legacy[]`, `legacyFallbackCost`, B8/B9) |
| `motion-xiahoudun.test.ts`, `motion-xuchu.test.ts` | pack asserts | hero-art 4-part publish expectations (import adapters/hero-art) → portrait-only |

Unit KEEP unchanged: all `test/core/*.test.ts` (16 incl. `helpers.ts`),
`audio`, `backdrop`, `flowart`, `fx`, `hudart`, `hudlayout`, `roster`,
`uihiscore`, `uir4-type`, `uir6-chevrons`, `uir8-marks`, `uir9-sky`,
`uir10-ridge`, `uir11-ground`, `uitheme`, `uitype` tests; all other
`motion-*.test.ts` (acceptance4-repair, actions, archer, budget, huangzhong,
lidian, pipeline, profiles, repack, retouch, review-core, soldier, spearman,
transitions, weapon-arc, weiyan, zhangfei, zhaoyun, all motion-xiahoudun-*
authoring gates), `pack-projection.test.ts`;
`test/selfplay/{invariants-coop,sprite-metrics,vision-metrics}.test.ts`.

### E3. Browser specs (`e2e/`, `prodbuild/`, `vision/`)

DELETE: [e2e/art.spec.ts](../e2e/art.spec.ts) (entire baked-art pipeline,
`bakedart=1` :65, `entity:zhaoyun:idle` :72/:95/:133),
[e2e/body-look.spec.ts](../e2e/body-look.spec.ts) (painted bodies, `entity:<char>:idle` :73),
[e2e/wholeframe-look.spec.ts](../e2e/wholeframe-look.spec.ts) (`frames=1` :47,
env-gated generator :13).

REWRITE (exact legacy hook → replacement):
- [e2e/hero-faces.spec.ts](../e2e/hero-faces.spec.ts): keep `portrait:<id>`
  load asserts (:23); "missing head layer falls back atomically" (:38) →
  portrait-only failure semantics.
- [e2e/motion-look.spec.ts](../e2e/motion-look.spec.ts): missing-sheet case
  expects legacy `entity:guanyu:idle` (:110–120) → blocking error / no frame.
- [e2e/artscale.spec.ts](../e2e/artscale.spec.ts): drop legacy branch
  (:199–223, "Legacy path: distinction is drawn height"); motion ratios stay.
- [e2e/motion-default-coverage.spec.ts](../e2e/motion-default-coverage.spec.ts):
  remove `motion=0` legacy sample → assert no-effect; coverage matrix stays.
- [e2e/motion-loader.spec.ts](../e2e/motion-loader.spec.ts),
  [e2e/motion-loading-errors.spec.ts](../e2e/motion-loading-errors.spec.ts):
  legacy-fallback expectations → retry-then-blocking-error (B8).
- [prodbuild/motion.spec.ts](../prodbuild/motion.spec.ts),
  [prodbuild/xiahoudun.spec.ts](../prodbuild/xiahoudun.spec.ts): `motion=0`
  rollback variants ([motion:80,107](../prodbuild/motion.spec.ts#L80),
  [xiahoudun:81,144](../prodbuild/xiahoudun.spec.ts#L81)) → same URLs assert
  motion still renders / zero legacy downloads (Part B exclusivity).
- [prodbuild/prodbuild.spec.ts](../prodbuild/prodbuild.spec.ts): delete only
  the baked-manifest test (:155–175) or convert to bundle-string exclusivity;
  keep motion reach/HUD/mobile cases (already motion-keyed, :124).
- [vision/vision.spec.ts](../vision/vision.spec.ts): **sprite gate rewrite
  (blocking)** — `registerAllArt()` (:356) + 158-texture legacy inventory
  (:343–422, `EXPECTED_SPRITES`, `entity:<kind>:attack/idle`) → published
  motion-frame inventory (`entity:<kind>:motion:*`, machinery already at
  :59–66/:530). Frame/HUD gates and both negative controls keep.
- [e2e/anim.spec.ts](../e2e/anim.spec.ts): keep — already asserts motion-only
  keys and "no legacy pose renders" (:46/:164/:269); becomes a Part B proof.

KEEP unchanged: `e2e/{arrows,artfx,audio,backdrop-look,background,boot,
continue,coop,finalstage,game,gamepad,guanyu-actions,guanyu-interactions,
guanyu-mixed-motion,guanyu-solo-ko,guanyu-transitions,hud,hud-look,hudpanels,
introcard,juice,layout,motion-capture,motion-review,orientation,
paired-grab-capture,pause,probe,scenerestart,select,select-look,stage3,
stageclear,title,touch,touchpause,ui-review,uifont,xiahoudun-lifecycle,
xiahoudun-motion,xiahoudun-paced-review,xiahoudun-transitions}.spec.ts`,
[e2e/review/kit.ts](../e2e/review/kit.ts) (capture geometry only, no legacy
hooks), [vision/renderer-parity.spec.ts](../vision/renderer-parity.spec.ts)
(already motion-frame keyed :59–60), [vision/metrics.ts](../vision/metrics.ts),
[vision/sprite-metrics.ts](../vision/sprite-metrics.ts),
[vision/thresholds.ts](../vision/thresholds.ts) (pure metric code).

### E4. Scripts (`scripts/`)

DELETE (legacy pipelines): `bake-art.mjs`, `bake-core.mjs`, `bake-core.d.mts`
(baked-art; sole test `bake.test.ts`), `make-art.d.mts` (orphan declarations —
no `make-art.mjs` exists), `make-body-fixtures.mjs` +
`make-body-fixtures.d.mts` (writes
body-fixtures, [ :102](../scripts/make-body-fixtures.mjs#L102)),
`make-sample.mjs` (own procedural figure generator),
`prepare-body-parts.mjs` + `prepare-body-parts.d.mts` (writes hero/mook/boss-bodies,
[ :484-546,873](../scripts/prepare-body-parts.mjs#L484)),
`prepare-weapon-cells.mjs` + `prepare-weapon-cells.d.mts` (writes `assets/weapons`, :613),
`prepare-whole-frames.mjs` + `prepare-whole-frames.d.mts` (writes `assets/whole-frames`, :225),
`weapon-review.mjs` (imports draw/registry/poses/rig in-page,
[ :40-43](../scripts/weapon-review.mjs#L40) — the only script importing legacy
src modules).
REWRITE (portrait-only outputs, **Slice 6**, not the partial portrait slice): `prepare-hero-faces.mjs`
(out `assets/hero-faces` :8), `prepare-boss-faces.mjs` (:226),
`prepare-mook-faces.mjs` (:226) — emit portrait PNG + slimmed prepared.json
only; or freeze as-is and hand-slim the JSONs (manager call; they must not
regenerate deleted head layers into a post-delete tree).
KEEP: `facesheet.mjs` (reads live `portrait:<kind>` textures),
`fetch-display-font.mjs`, `prepare-title-art.mjs`, `review-capture.mjs`, all
loop/schedule/deploy scripts, and the entire motion authoring pipeline —
exact remaining tracked files under `scripts/` (incl. `scripts/loop/`,
`scripts/loop-schedule/`, `scripts/adapters/` prefixes):
example-wrapper.mjs, bow-chord-archer.mjs, bow-grid-archer.mjs, build-xiahoudun-contact-sheets.mjs, compare-xiahoudun-lidian-charge-silhouette.d.mts, compare-xiahoudun-lidian-charge-silhouette.mjs, dao-comparable-weiyan.mjs, dao-true-weiyan.mjs, dao-v2-walk-measure.mjs, display-sheet-archer.mjs, display-sheet-huangzhong.mjs, display-sheet-spearman.mjs, display-sheet-weiyan.mjs, display-sheet-zhangfei.mjs, display-sheet-zhaoyun.mjs, emit-archer-runtime.mjs, emit-huangzhong-runtime.mjs, emit-lidian-runtime.mjs, emit-soldier-runtime.mjs, emit-spearman-runtime.mjs, emit-weiyan-runtime.mjs, emit-xiahoudun-runtime.mjs, emit-xuchu-runtime.mjs, emit-zhangfei-runtime.mjs, emit-zhaoyun-runtime.mjs, facesheet.mjs, fall-detail.mjs, fetch-display-font.mjs, harmonize-xiahoudun-charge-paint-2.d.mts, harmonize-xiahoudun-charge-paint-2.mjs, harmonize-xiahoudun-charge-paint.d.mts, harmonize-xiahoudun-charge-paint.mjs, head-review-sheet.mjs, landmark-review-sheet.mjs, landmarks-final-weiyan-v2.mjs, landmarks-final-zhangfei.mjs, landmarks-final-zhaoyun.mjs, loop-schedule/core.mjs, loop-schedule/service.mjs, loop-schedule/windows.mjs, loop/adapters.mjs, loop/autonomy.mjs, loop/config.mjs, loop/process.mjs, loop/runner.mjs, loop/storage.mjs, loop/test-autonomy.mjs, loop/test-work-package.mjs, loop/transient.mjs, loop/work-package.mjs, measure-archer.mjs, measure-huangzhong.mjs, measure-soldier.mjs, measure-spearman.mjs, measure-weiyan-v2.mjs, measure-weiyan.mjs, measure-xiahoudun-registration.mjs, measure-zhangfei.mjs, measure-zhaoyun.mjs, motion-acceptance4-repair.d.mts, motion-acceptance4-repair.mjs, motion-budget.d.mts, motion-budget.mjs, motion-capture.mjs, motion-landmarks.mjs, motion-pipeline.d.mts, motion-pipeline.mjs, motion-retouch.d.mts, motion-retouch.mjs, motion-review-core.d.mts, motion-review-core.mjs, motion-review.mjs, offending-strip-spearman.mjs, pack-projection.d.mts, pack-projection.mjs, paired-contact-measure.mjs, paired-offset-diagnostic.mjs, paired-pin-diagnostic.mjs, pike-adjudicate-zhangfei.mjs, pike-line-zhangfei.mjs, prepare-actions.mjs, prepare-archer.mjs, prepare-huangzhong.mjs, prepare-lidian.mjs, prepare-motion.d.mts, prepare-motion.mjs, prepare-soldier.mjs, prepare-spearman.mjs, prepare-title-art.mjs, prepare-weiyan-finisher-v2-source.mjs, prepare-weiyan-getup-v2-source.mjs, prepare-weiyan-misc-v2-source.mjs, prepare-weiyan-special-v2-source.mjs, prepare-weiyan-v2.mjs, prepare-weiyan.mjs, prepare-xiahoudun-charge-repair.d.mts, prepare-xiahoudun-charge-repair.mjs, prepare-xiahoudun-heavy.d.mts, prepare-xiahoudun-heavy.mjs, prepare-xiahoudun.mjs, prepare-xuchu.mjs, prepare-zhangfei.mjs, prepare-zhaoyun.mjs, render-xiahoudun-boundary-filmstrips.d.mts, render-xiahoudun-boundary-filmstrips.mjs, repair-verify-spearman.mjs, restore-xiahoudun-guard-grip.d.mts, restore-xiahoudun-guard-grip.mjs, retouch-lidian-charge.mjs, retouch-lidian-combo.mjs, retouch-lidian-fall.mjs, retouch-lidian-getup.mjs, retouch-lidian-heavy-topup.mjs, retouch-lidian-heavy.mjs, retouch-lidian-misc-topup.mjs, retouch-lidian-misc.mjs, retouch-weiyan-acceptance4.mjs, retouch-weiyan-fall-v2.mjs, retouch-weiyan-jump-landing-v2.mjs, retouch-xiahoudun-charge.d.mts, retouch-xiahoudun-charge.mjs, retouch-xiahoudun-combo-cell4.d.mts, retouch-xiahoudun-combo-cell4.mjs, retouch-xiahoudun-heavy-fig1.d.mts, retouch-xiahoudun-heavy-fig1.mjs, retouch-xiahoudun-walk-projection.d.mts, retouch-xiahoudun-walk-projection.mjs, retouch-xiahoudun-walk.mjs, review-actions.mjs, review-capture.mjs, review-mixed-motion.mjs, review-sheets-spearman.mjs, review-transitions.mjs, review-weapon-arc.mjs, review-xiahoudun-charge-fixture.mjs, review-xiahoudun-charge-paint.mjs, review-xiahoudun-heads.mjs, review-xiahoudun-registered-charge.d.mts, review-xiahoudun-registered-charge.mjs, review-xiahoudun-runtime.mjs, review-xiahoudun-video.mjs, review-xiahoudun-walk-projection.mjs, run-loop.mjs, run-loop.ps1, run-session-loop.ps1, scale-compare-archer.mjs, scale-compare-spearman.mjs, schedule-loop.mjs, short-strip-spearman.mjs, spear-adjudicate-zhaoyun.mjs, spear-line-spearman.mjs, spear-line-zhaoyun.mjs, special-detail.mjs, splice-huangzhong-getup.mjs, splice-huangzhong-jab1.mjs, splice-huangzhong-jab2.mjs, splice-lidian-combo.mjs, splice-lidian-getup.mjs, splice-lidian-heavy.mjs, splice-lidian-walk.mjs, splice-repairs-spearman.mjs, splice-repairs.mjs, splice-weiyan-getup-r1.mjs, splice-weiyan-jab1-v2.mjs, splice-weiyan-jab2-v2.mjs, splice-weiyan-jump-v2.mjs, splice-xiahoudun-combo-round2.d.mts, splice-xiahoudun-combo-round2.mjs, splice-xiahoudun-combo-round3.d.mts, splice-xiahoudun-combo-round3.mjs, splice-xiahoudun-combo-round4.d.mts, splice-xiahoudun-combo-round4.mjs, sword-review-sheet.mjs, sword-stack.mjs, test-deploy.mjs, test-deploy.ps1, test-loop.mjs, test-loop.ps1, test-schedule.mjs, validate-sheet.mjs, verify-repair-witness.mjs.

## F. Config / flags

| Flag | Sites | Disposition |
|---|---|---|
| `?motion=0` rollback (+ `motion=1` compat) | [motion-art:98-99](../src/game/adapters/motion-art.ts#L98); prodbuild motion/xiahoudun rollback loops; coverage `motion=0` sample; [motion-clips.test:18-38](../test/game/motion-clips.test.ts#L18) | delete in final slice; params must have **no rendering effect** after (Part B proof) |
| `?frames=1` whole-frame pilot | [frame-art:37](../src/game/adapters/frame-art.ts#L37), BootScene :57/:67, [hero-resources:29](../src/game/art/hero-resources.ts#L29), wholeframe-look :47 | delete Slice 3 |
| `?bakedart=1` + `__HAS_BAKED_ART__` | [BootScene:86-87](../src/game/scenes/BootScene.ts#L86), [build-flags.d.ts:9](../src/build-flags.d.ts#L9), `vite.config.ts` `hasBakedArt` probe of `public/assets/manifest.json` + `define` | delete all three sites Slice 4; no `public/assets/` ships today |
| `WHOLEFRAME_LOOK=1` env | wholeframe-look :13 | delete with spec |
| `?renderer=`, `?autopilot=1` | bridge/scenes, all suites | keep — not legacy |
| npm scripts / `index.html` | `package.json` grep for `bake-art\|make-body\|prepare-body\|prepare-weapon\|prepare-whole\|bakedart` = 0 matches; `index.html` carries no flag | nothing to delete — no config entry points at a deleted script (verified at `943fc9d`; re-grep in Slice 4/6) |

## Ordered deletion slices (each independently green; separate scoped commits)

Prerequisite for every slice after 0: CMR-24 Part A green + independent
pre-delete review (not established by this inventory). Rollback per slice =
revert that slice's commit; `?motion=0` stays functional through Slice 5.

| # | Slice (files from § above) | Per-slice verification (all must pass before next) |
|---|---|---|
| 0 | **Extractions only, zero behaviour change**: B1 cel, B2 paths, B4 cell type; repoint props/portrait/motion-clips imports. Record D0 decision. | `npm run lint`, `npm run typecheck`, full `npm run test` (rig/artquality/portrait/weapons tests repointed only), `git diff` shows moves only |
| 1 | **Partial portrait isolation, NOT full slim DONE**: B5 painted-only module/procedural portrait deletion; B6 narrow portrait types, B7 independent portrait publication; preserve all rollback head resources/assets/metadata. Retire only procedural portrait tests; retain pose/head/rig tests. | all-11 portrait bytes/dimensions/identity/bounds units + existing face/rig units; e2e `hero-faces`, `select`, `hud`, `hud-look`, default + rollback; lint/typecheck. Head requests remain intentional until Slice 6; zero-head-network is NOT a criterion here. Vision remains a separate required gate, not implied by focused smoke. |
| 2 | **Prop-only registry/sprites (NOT DONE)**: B3, B5 prop path, B10 prop sizing remain deferred while rollback is live. B12 select pre-warm removal + GameComplete portrait rewrite implemented as a separate small sub-slice; no registry/sprites deletion here. Result cached-idle consumer corrected in B12 and deferred to Slice 6. | `sprites.test` rewrite; e2e `artscale` (motion branch), `game`, `select`, `stageclear`-path result/complete screens screenshot-checked; props render in `arrows`/`game` specs |
| 3 | **Independent whole-frame pilot out — implemented before Slice 2**, per dependency-order revision above: frame-art.ts, whole-frames.ts, `frames=1` handling, D whole-frames assets, prepare-whole-frames scripts, sole-purpose wholeframe tests/capture spec. Rollback renderer untouched. | Actual: lint/typecheck + focused retained units 85/85; retirement browser title/game boot × Canvas/WebGL/default/rollback 4/4; prodbuild14/14; src pilot symbol/import search clean. Full units/post-delete full vision/signal not run, not implied. |
| 4 | **Baked-art out — implemented**, per disposition above: B11 manifest path only (keep rollback queues), vite define/probe, sole build-flags declaration, e2e/art.spec, bake scripts + exclusive bake.test. | Single full `npm run prodbuild` includes source/actual bundle absence and 4 stale-manifest + forced-parameter default/rollback boots; lint/typecheck + retained motion/portrait/body/weapon/FX/font units. Actual results in PROGRESS, no retired gate counted green. |
| 5 | **Fallback hardening (motion=0 still alive)**: B8, B9, B10 published-missing-frame branch, E motion-loader/loading-errors/motion-look rewrites | `motion-runtime/catalog/scope/clips` units; e2e `motion-loading-errors`, `motion-loader`, `motion-default-coverage`; missing/corrupt pack → visible blocking error, zero legacy frames |
| 6 | **Renderer + switch deletion (the Phase 5 commit)**: jointly remove B6 head fields/helpers, B7 head imports/loader parts, 33 head/front/rear PNGs; slim all 3 face metadata files + prepare-*-faces scripts ONLY now; all A files, draw/rig/registry/sprites remainders, B10/B11/B13 remainders + B12 Result cached-idle branch, `motionEnabled`, D-delete assets, E1 test deletions, E vision sprite-gate rewrite + bridge replacement, E4 script deletions | full serial: lint, typecheck, `npm run test`, `npm run e2e`, `npm run vision`, `npm run signal` — retired gates recorded retired-by-deletion, incl. arm-chain G6 |
| 7 | **Part B proof**: prodbuild/coverage `motion=0`-no-effect rewrites, source + built-bundle + network exclusivity search (no legacy texture keys, no head/body/weapon-sheet requests), docs/live-wording sweep | `npm run prodbuild`; repeat essential Part A coverage/resources/errors/menus/co-op/stages/mobile/Canvas-WebGL on the exact post-delete tree; fresh independent review (CMR-24 Part B) |

## G. Appendix — exact literals behind every brace/glob shorthand above

So no row rests on a pattern, the sets abbreviated in C/D/E expand to:

- **Face PNGs, D-delete 33** (`src/game/assets/<dir>/`):
  `hero-faces/`: guanyu-head.png, guanyu-front.png, guanyu-rear.png,
  huangzhong-head.png, huangzhong-front.png, huangzhong-rear.png,
  weiyan-head.png, weiyan-front.png, weiyan-rear.png, zhangfei-head.png,
  zhangfei-front.png, zhangfei-rear.png, zhaoyun-head.png, zhaoyun-front.png,
  zhaoyun-rear.png. `boss-faces/`: lidian-head.png, lidian-front.png,
  lidian-rear.png, xiahoudun-head.png, xiahoudun-front.png,
  xiahoudun-rear.png, xuchu-head.png, xuchu-front.png, xuchu-rear.png.
  `mook-faces/`: archer-head.png, archer-front.png, archer-rear.png,
  soldier-head.png, soldier-front.png, soldier-rear.png, spearman-head.png,
  spearman-front.png, spearman-rear.png.
- **Face PNGs, D-keep 11**: hero-faces/{guanyu,huangzhong,weiyan,zhangfei,
  zhaoyun}-portrait.png expanded: guanyu-portrait.png,
  huangzhong-portrait.png, weiyan-portrait.png, zhangfei-portrait.png,
  zhaoyun-portrait.png; boss-faces/: lidian-portrait.png,
  xiahoudun-portrait.png, xuchu-portrait.png; mook-faces/:
  archer-portrait.png, soldier-portrait.png, spearman-portrait.png.
- **`test/core/` keep, 16**: arrows.test.ts, boss.test.ts,
  bot-spacing.test.ts, characters.test.ts, continue.test.ts, coop.test.ts,
  enemies.test.ts, freeze.test.ts, grab.test.ts, helpers.ts, items.test.ts,
  mobility.test.ts, movesets.test.ts, rng.test.ts, sim.test.ts,
  stages.test.ts.
- **`test/game/motion-*.test.ts` keep-unchanged, 35** (the other 7 motion
  tests are E1 `motion-guides` + E2 `motion-catalog`, `motion-clips`,
  `motion-runtime`, `motion-scope`, `motion-xiahoudun`, `motion-xuchu`):
  motion-acceptance4-repair.test.ts, motion-actions.test.ts,
  motion-archer.test.ts, motion-budget.test.ts, motion-huangzhong.test.ts,
  motion-lidian.test.ts, motion-pipeline.test.ts, motion-profiles.test.ts,
  motion-repack.test.ts, motion-retouch.test.ts, motion-review-core.test.ts,
  motion-soldier.test.ts, motion-spearman.test.ts,
  motion-transitions.test.ts, motion-weapon-arc.test.ts,
  motion-weiyan.test.ts, motion-xiahoudun-boundary-filmstrips.test.ts,
  motion-xiahoudun-charge-paint-2.test.ts,
  motion-xiahoudun-charge-paint.test.ts,
  motion-xiahoudun-charge-repair.test.ts,
  motion-xiahoudun-charge-retouch.test.ts,
  motion-xiahoudun-charge-silhouette-compare.test.ts,
  motion-xiahoudun-combo-cell4.test.ts,
  motion-xiahoudun-combo-round3-splice.test.ts,
  motion-xiahoudun-combo-round4-splice.test.ts,
  motion-xiahoudun-combo-splice.test.ts,
  motion-xiahoudun-guard-grip.test.ts,
  motion-xiahoudun-head-diagnosis.test.ts,
  motion-xiahoudun-heavy-fig1.test.ts,
  motion-xiahoudun-heavy-prepare.test.ts,
  motion-xiahoudun-independent-review.test.ts,
  motion-xiahoudun-registered-charge.test.ts,
  motion-xiahoudun-walk-projection.test.ts, motion-zhangfei.test.ts,
  motion-zhaoyun.test.ts. (Count check: 42 `motion-*` files at `943fc9d` =
  35 keep + 6 E2 + 1 E1.)
- **E3 e2e keep brace list** = `e2e/<stem>.spec.ts` for each of the 41 stems
  printed there; **C `src/core` stems** = `src/core/<stem>.ts`; **E2-keep
  unit stems** = `test/game/<stem>.test.ts`. Coverage audit at `943fc9d`:
  every tracked file under `src/`, `selfplay/`, `test/`, `e2e/`, `vision/`,
  `prodbuild/`, `scripts/` appears above by literal name or by one of these
  expanded shorthands (script-verified stem scan, 0 unaccounted outside
  `art/motion/**` source masters, which are motion provenance, D-keep).

Known residual risks for the deletion worker: (1) `GameScene.fitSprite` prop
sizing silently depends on registry `artBoxFor` prop branch — Slice 2 must
screenshot-verify crate/arrow sizes; (2) vision `EXPECTED_SPRITES` count is a
legacy constant — the Slice 6 rewrite must derive its inventory from published
motion packs, not a new magic number; (3) test helpers `cast-art.ts` /
`arm-chain-lib.ts` are imported by several E1 files — delete them last within
Slice 6 to keep intermediate states compiling; (4) `prepare-*-faces` scripts
can regenerate deleted layers if run post-Slice-6 — their rewrite/freeze is
part of Slice 6, not optional cleanup; scripts remain unchanged while rollback heads are live.
