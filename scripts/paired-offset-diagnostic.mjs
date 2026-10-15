// Paired grab-contact OFFSET diagnostic (CMR-23 follow-up, diagnostic only).
//
// The traced hold4 placement leaves Guan Yu's gripping hand 3.8-30.6u PAST
// the victim's collar along the pin (x) axis (see
// artifacts/motion/paired/measure/guanyu-12combo-matrix.json: the hand
// overshoots, the closest hand alpha is its wrist edge). Closing that gap
// therefore means INCREASING the holder<->victim sprite separation along the
// pin axis, not pulling the sprites together. This script searches
// presentation-only sprite offsets (entity positions/shadows unchanged) for
// Guan Yu vs soldier, spearman, archer, xiahoudun, xuchu at hold4, both
// facings (lidian already reads 2.5u, inside the 3u spec gate, and is out of
// scope here), and reports for three ways of distributing a relative
// separation `sepU` (plus a small relative lane shift `dyRelU` in -2..2):
//
//   holder-only  holder sprite moves -pinSign*sep, victim sprite stays
//   victim-only  victim sprite moves +pinSign*sep, holder sprite stays
//   split        each sprite moves sep/2 (dy shares follow the same split)
//
// Gap, ROI overlap and whole-body alpha overlap depend only on the RELATIVE
// shift (sepU, dyRelU), so they are searched once per combo; the strategies
// differ only in sole displacement from the (unmoved) entity ground point,
// which is where the shadow stays. Outputs (JSON + before/after sheets) go
// to artifacts/motion/paired/offset-diagnostic/. No runtime code is touched.
//
// Foreground grapple-arm PATCH prototype (same diagnostic, second mode):
// the victim renders in FRONT at hold4, so offsets alone can never show the
// gripping hand on the collar. Patch mode draws holder, then victim, then
// redraws ONLY the holder's grapple sleeve+cuff+hand alpha (source-cell mask
// refined from the forensic box x>=248, y100-176; see patchMaskHas) at the
// same holder transform. Before / offset-only / patch-at-recommended-sep /
// patch-at-min-gap-pass-sep are rendered and measured per victim below.
//
// Articulated forearm prototype (third mode, `--arm-transform` only): for the
// two victims where offsets+patch were REJECTED (soldier, archer), split the
// refined grapple mask at an elbow pivot, erase the distal forearm+hand
// segment from the holder, and search small rotations about the pivot plus
// minor dx/dy for that segment ALONE at the traced core pin (NO whole-sprite
// holder/victim offset, soles stay 0). Composite order is holder(minus
// segment) -> victim -> transformed segment. Outputs go to
// artifacts/motion/paired/arm-transform-diagnostic/. Diagnostic only.
//
// Arm-WARP prototype (fourth mode, `--arm-warp` only): piecewise warp of the
// misc:6 grapple segment (3 sub-segments, shoulder/elbow/mid/wrist seeds) so
// the hand centroid lands on per-cluster forensic targets for all 6 victims,
// victim shifted by a +-3u cluster micro-dx, proximal sub-segment masked
// behind the victim silhouette. See the WARP section below. Outputs go to
// artifacts/motion/paired/arm-warp-diagnostic/. Diagnostic only.
//
// Zhang Fei arm-WARP prototype (fifth mode, `--zhangfei-arm-warp` only):
// forensic rank1 says Zhang Fei's settled hold is misc:2 (extended bare claw
// hand), NOT the misc:3 retracted fist the trace/dispatch currently shows at
// hold4 (the dispatch change itself is a later runtime task, out of scope).
// This mode restores misc:2 at the traced zhangfei hold4 pin, splits the bare
// forearm+hand around elbow (285,128) via a skin/segment mask, erases the
// segment from the base, piecewise-warps upper/forearm/hand to the same 3
// cluster hand targets (NH 238,133 / ML 242,151 / FH 264,135, victim micro-dx
// +-3u) with fingers retaining claw direction, and composites base ->
// proximal -> victim(micro-dx) -> distal. Victim soles move only the 3u
// micro-dx; holder soles 0. Outputs go to
// artifacts/motion/paired/zhangfei-arm-warp-diagnostic/. Diagnostic only.
//
// Restoration/transform helpers are reused from paired-contact-measure.mjs.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import {
  restoreCell, cellCanvas, frameNameOf, alphaPoints, toWorld,
  minDistance, bootGround, centroid,
} from './paired-contact-measure.mjs'

const TRACE_PATH = 'artifacts/motion/paired/guanyu/canvas/trace.json'
const LANDMARKS_PATH = 'art/motion/paired-contact-landmarks.json'
const OUT_DIR = 'artifacts/motion/paired/offset-diagnostic'
const HERO = 'guanyu'
const KINDS = ['soldier', 'spearman', 'archer', 'xiahoudun', 'xuchu']
const GAP_PASS_U = 2
const SPEC_GAP_PASS_U = 3
const GAP_CAP_U = 3 // search-time cap; exact gap recomputed for chosen offsets
const DY_RANGE_U = 2
const SEP_MAX_U = 40

const STRATEGIES = [
  { name: 'holder-only', holderShare: 1, victimShare: 0 },
  { name: 'victim-only', holderShare: 0, victimShare: 1 },
  { name: 'split', holderShare: 0.5, victimShare: 0.5 },
]

// Per-victim visual overrides from personally inspecting the rendered sheets
// (filled after the first run; empty = scored candidate + default rule).
// Shape: { strategy?, sepU?, dyRelU?, note }.
// Inspection verdicts (hold4 sheets/zooms, both facings): the victim renders
// in FRONT, so the gripping hand is occluded behind the victim torso except
// where it emerges at the far shoulder/waist. The raw score chases
// roiOverlap~40 and overshoots separation (soldier sep=41, past SEP_MAX_U via
// refinement; xuchu sep=16.5 although gap<=2 already at sep=2), buying ROI
// overlap with unjustifiable sole/shadow displacement. Overrides below take
// near-minimal gap-passing separations instead.
const VISUAL_OVERRIDES = {
  soldier: {
    strategy: 'split', sepU: 31, dyRelU: 1,
    note: 'NOT a visible collar grip: hand stays occluded behind the torso (victim front), fist reads at the waist from behind. ROI overlap>0 only at sep>=40 where the figures detach (split sole 20.5u) - scored sep=41 rejected. Minimal gap-pass sep chosen to un-merge bodies with least sole pop; a visible grip needs a depth/hand-layer or pose change, not offsets alone.',
  },
  spearman: {
    strategy: 'split', sepU: 25.5, dyRelU: -2,
    note: 'Coherent as a far-shoulder grab from behind: the tinted hand lands beside the far shoulder at this sep. The collar ROI itself is never overlapped at any sep (roiOv=0 throughout); contact is proximity/shoulder, not collar alpha.',
  },
  archer: {
    strategy: 'split', sepU: 32, dyRelU: 1,
    note: 'NOT coherent as a collar grab at any sep: fist lands at the waist/bow hand, neck visibly untouched, figures nearly detach. Least-bad minimal gap-pass sep only un-merges the bodies; do not ship as a grip fix - needs pose/depth work.',
  },
  xiahoudun: {
    strategy: 'split', sepU: 16, dyRelU: -1,
    note: 'Coherent arm-length hold: sleeve/arm reaches the victim shoulder, first sep with real ROI grip (roiOv=12, gap=0). Scored sep=21 adds sole pop for no visual gain.',
  },
  xuchu: {
    strategy: 'victim-only', sepU: 6, dyRelU: 2,
    note: 'Coherent and cheap: baseline gap 3.808u nearly passes; sep=6 dy=2 gives gap=0/roiOv=12 with the hero planted and victim sole 6.3u (inside its wide shadow). Scored sep=16.5 rejected as pure score-chasing.',
  },
}

// --- Grapple-arm patch mask (holder source-cell px, guanyu misc:6 @hold4) ---
// Forensic box x>=248, y100-176 also catches the beard (x248-277), robe front
// (to x~271 below y157), polearm gold ornament (x272-292, y96-115) and shaft
// (x~248-260). Refined per-row left cuts, eye-checked against the restored
// misc:6 cell alpha runs (measure-input/full/guanyu-misc-6.png) and the
// patch-mask.png render this script writes:
//   y96-115  x>=295  wrist+hand only (top extended 100->96 for the finger
//                    sliver of the landmark hand ROI y101-123; ornament out)
//   y116-159 x>=272  sleeve+cuff east of the beard core
//   y160-172 x>=280  hanging cuff tip (alpha run separates from torso here)
// A <=5px beard/robe sliver can remain at x272-277, y140-159; it borders the
// sleeve and only ever overdraws where the sleeve already reaches.
const PATCH_BOX = { xMin: 248, yMin: 100, yMax: 176 }
function patchMaskHas(x, y) {
  if (y >= 96 && y <= 115) return x >= 295
  if (y >= 116 && y <= 159) return x >= 272
  if (y >= 160 && y <= 172) return x >= 280
  return false
}
// Per-victim patch verdicts from personally inspecting the patch sheets/zooms
// (filled after the first patch run). Shape: { verdict, sepU?, note }.
const PATCH_VERDICTS = {
  soldier: {
    verdict: 'REJECT patch', sepU: null,
    note: 'Zoom inspected both facings at split sep=31/30.5: survival 0.066->1 but the hand lands PAST the neck on the far shoulder with fingers in air beyond the silhouette and the cuff panel pastes across the chest (patchOverCollar=0). Patch only makes the wrong contact visible; keep offset-only un-merge, grip needs pose work.',
  },
  spearman: {
    verdict: 'ACCEPT patch+split sep=24 dy=-2', sepU: 24,
    note: 'Zoom/sheet inspected: hand sits on the far shoulder and the sleeve covers the collar ROI (patchOverCollar=329 cells, hand survival 0.40->1, gap=0.5u). minSep=24 is visually indistinguishable from sep=25.5 and saves sole pop (12.0u vs 12.8u). Reads as a far-shoulder/collar grab from the front side.',
  },
  archer: {
    verdict: 'REJECT patch', sepU: null,
    note: 'Zoom inspected at split sep=32 (=minSep): hand lands at chest/bow-arm height well below the neck ROI (patchOverCollar=0), sleeve panel across the torso. Survival 0->1 only exposes a non-grip; same geometry flaw as offset-only. Needs pose/depth work, not patch.',
  },
  xiahoudun: {
    verdict: 'REJECT patch (keep offset-only split sep=16)', sepU: null,
    note: 'Zoom inspected at sep=13/16: patch paints the sleeve across the hunched victim face and the hand hangs in open air past the head - the gap=0/roiOv=12 contact is only the wrist edge. Offset-only reads better because occlusion sells the reach. A patch here would need a dy/sep re-search aiming the hand centroid (not wrist) at the collar; untested.',
  },
  xuchu: {
    verdict: 'ACCEPT patch+victim-only sep=6 dy=2', sepU: 6,
    note: 'Zoom/sheet inspected: hand now visible on the upper chest at the collar (roiOv=12, patchOverCollar=23, survival 0->1, gap=0), hero planted, victim sole 6.3u inside its wide shadow. minSep=1.5 looks the same at the hand but merges the bodies (bodyOvD -331 vs -1553 at sep=6); keep sep=6.',
  },
}

// --- Articulated forearm prototype (--arm-transform) -----------------------
// Elbow pivot, identified by eye from the gridded misc:5/misc:6 inspection
// renders (measure-input/zoom 6x crop x270-370/y70-150 + 3x upper-body):
// the extended arm's bone axis runs from the shoulder pauldron centre
// (~(235,120) cell px) through the wrist skin where it leaves the white cuff
// (~(303,117) misc:6, ~(303,112) misc:5). At x=280 that axis sits at y~118,
// inside the green sleeve (alpha spans roughly y108-140 there before the
// hanging cuff panel drapes down-west). Pivot (280,122) puts the joint on
// that axis inside the sleeve bulk, 8px east of the refined patch mask's
// proximal cut (x>=272) so a proximal sleeve stub stays with the body.
// Segment = refined patch-mask alpha with cell x >= pivot.x (forearm sleeve
// + hanging cuff + wrist + hand distal to the elbow). Sensitivity pivots
// bracket the plausible joint along/around the axis.
const ARM_OUT_DIR = 'artifacts/motion/paired/arm-transform-diagnostic'
const ARM_KINDS = ['soldier', 'archer']
const ELBOW_PIVOT_PX = { x: 280, y: 122 }
const ARM_PIVOT_SENSITIVITY = [{ x: 272, y: 122 }, { x: 290, y: 130 }]
const ARM_SEARCH = { angleMaxDeg: 30, angleStepDeg: 5, dxMaxU: 8, dxStepU: 2, dyMaxU: 6, dyStepU: 2 }
const FINGER_MIN_CELL_X = 325 // distal fingertips of the misc:6 hand ROI (x300-338)
// Pre-registered metric gate for ACCEPT (visual inspection must also pass):
// fingerGap<=2u, seamGap<=1.5u, seamMaxDisplacement<=4u, handSurvival>=0.95.
const ARM_GATE = { fingerGapU: 2, seamGapU: 1.5, seamMaxDispU: 4, handSurvival: 0.95 }
// Per-victim verdicts from personally inspecting the arm sheets/zooms
// (filled after the first arm run). Shape: { verdict, note }.
const ARM_VERDICTS = {
  soldier: {
    verdict: 'REJECT articulated forearm',
    note: 'Sheets/zooms inspected both facings at the core pin: the scored best sits at the search boundary (-30deg, dx=-8u right-facing; mirrored left) and only raises the hand beside the far shoulder - fingers stay in open air EAST of the silhouette, neck untouched, cuff panel across the chest (fingerGap 27.654u vs 43u identity, roiOv=0, seam cut-edge max displacement 9.723u). Geometrically unreachable: the hand centroid must move 44.6u toward the holder and 7.8u up, but it rides a ~19u circle about the elbow whose closest approach to the collar centroid is 8.925u, and even that point needs a ~146deg fold. Sensitivity pivots (272,122)/(290,130) reach only fingerGap 27.142/26.339u. Needs a pose/redraw or pin change, not elbow articulation.',
  },
  archer: {
    verdict: 'REJECT articulated forearm',
    note: 'Sheets/zooms inspected both facings at the core pin: scored best (-30deg, dx=-8u right-facing; mirrored left) lifts the hand to far-shoulder height but the fingers remain in air beyond the chest/shoulder silhouette with the cuff pasted across the torso (fingerGap 18.55u vs 34.033u identity, roiOv=0, seam cut-edge max displacement 9.707u). The hand centroid must move 35.8u toward the holder and 10.4u up; its ~19u pivot circle passes 2.764u from the collar centroid only after a ~130deg fold, far outside a plausible elbow bend. Sensitivity pivots reach only fingerGap 18.134/17.34u. Needs a pose/redraw or pin change, not elbow articulation.',
  },
}

// --- Arm-warp prototype (--arm-warp) ---------------------------------------
// Forensic clusters: hand-centroid targets are WORLD coords for the RIGHT
// facing (holder (229.4,220) victim (245.4,220)); left facings mirror about
// world x=240 (holder/victim swap to 250.6/234.6). The +-3 per victim is a
// presentation micro-dx applied to the VICTIM sprite along the pin axis
// (victimOff.dxU = pinSign*microDxU, so it mirrors with facing; holder sole
// stays 0, victim sole 3u). Segment = misc:6 alpha with x>=272, y108-135
// (cuff + skin forearm + hand; the hanging drape below y140 stays with the
// base), UNION the landmark hand ROI (x300-338,y101-123) so the fingertip
// sliver at y102-107 (47px) is not orphaned in the base - same refinement
// precedent as the patch mask's y96 top extension. Sub-segments by cell x:
// proximal cuff x<290 (pivot elbow), mid forearm 290<=x<303 (pivot mid),
// hand x>=303 (pivot wrist); the shoulder seed is the fixed anchor the
// proximal base angle aligns shoulder->elbow against. Seeds (cell px, from
// the misc:6 inspection renders): shoulder pauldron centre (235,120), elbow
// on the bone axis inside the sleeve (280,122 - same point as ELBOW_PIVOT_PX),
// mid forearm (292,120), wrist skin at the cuff exit (303,117).
const WARP_OUT_DIR = 'artifacts/motion/paired/arm-warp-diagnostic'
const WARP_CLUSTERS = [
  { name: 'NH', targetRight: [238, 133], microDxU: { soldier: 3, archer: -3 } },
  { name: 'ML', targetRight: [242, 151], microDxU: { spearman: 3, xiahoudun: -3 } },
  { name: 'FH', targetRight: [264, 135], microDxU: { xuchu: 3, lidian: -3 } },
]
const WARP_KINDS = WARP_CLUSTERS.flatMap((c) => Object.keys(c.microDxU))
const WARP_SEEDS_PX = { shoulder: { x: 235, y: 120 }, elbow: { x: 280, y: 122 }, mid: { x: 292, y: 120 }, wrist: { x: 303, y: 117 } }
const WARP_SUBSEG_X = [290, 303] // proximal | mid | hand cut columns (cell px)
// Pre-registered metric gate for ACCEPT (visual inspection must also pass):
const WARP_GATE = { fingerGapU: 2, palmCentroidDistU: 6, distalCentroidToTargetU: 3.5, seamGapMeanU: 2, interSeamMaxU: 4, handSurvival: 0.95, fingerDirDeltaDeg: 15 }
// Per-cluster verdicts from personally inspecting the warp sheets/zooms
// (filled after the first warp run). Shape: { verdict, note }.
const WARP_VERDICTS = {
  NH: {
    verdict: 'REJECT arm-warp (soldier+archer)',
    note: 'Sheets/zooms inspected both facings: the solved hand does land on the neck (soldier fingerGap 0.819/0.339u palmC 0.118/0.389u, archer 0.016u/3.767-4.143u, survival 1, distal centroid exactly on (238,133)) and soldier in isolation reads as a throat grab, but the ~39u warp tears the chain: seam gapMean/gapMax to stub 10.914/16.869u (11.033/16.858 left), inter-subsegment sepMax 15.432u vs 4u gate, and on the clean sheets the cuff/forearm survives only as disjoint white/green shards across the victim chest with no forearm running back to the holder (archer hand lies flat pasted across the mouth/neck). Candidate sits at search boundaries (da0=da1=-10, f0=0.6), so the gap-vs-tear tradeoff is unresolved within this warp family. Metric contact without a readable arm: reject.',
  },
  ML: {
    verdict: 'REJECT arm-warp (spearman+xiahoudun)',
    note: 'Sheets/zooms inspected both facings at target (242,151): contact metrics are strong (fingerGap 0.117u everywhere, spearman palmC 0.723/1.006u roiOv 253-254, xiahoudun palmC 5.459/5.924u roiOv 274-279, survival 1) but visually only fingertips and a vertical cuff shard show at the spearman collar west edge, and the xiahoudun hand is buried in the beard/collar with a red wrist sliver + white cuff chunk floating west of the shoulder - no readable grip or forearm on either. Seam 7.142/12.174u (7.33/12.426 left) and inter-subsegment sepMax 13.553-13.635u fail the gate; the ~36u displacement is simply too large for 3 rigid sub-segments. Reject.',
  },
  FH: {
    verdict: 'ACCEPT arm-warp as prototype candidate (xuchu+lidian)',
    note: 'Sheets/zooms inspected both facings at target (264,135): the small (~14u) warp keeps the chain near-continuous - metric gate PASSES for both victims/facings (fingerGap 0.117u, survival 1, distal centroid on target, fingerDirDelta 0.7deg, seam gapMean 0.649-0.784u, inter-subsegment sepMax 3.793-3.981u). Xuchu hand sits visible on the collar/upper chest (palmC 0.304/0.633u, roiOv 258-269) with fingers along the facing and the cuff running back behind the victim; lidian hand lands at the throat between the two heads and reads as a grab (palmC 5.382/5.862u, near the 6u gate - weakest member). Caveats: xuchu palm rides slightly high over the beard/collar notch, and this is a still-frame diagnostic only - accept as the prototype direction for FH, not as ship-ready runtime layering.',
  },
}

// --- Zhang Fei arm-warp prototype (--zhangfei-arm-warp) --------------------
// Holder = zhangfei misc:2 restored at the traced zhangfei hold4 sample
// (holder (229.3,220) victim (245.3,220) right-facing; left mirrors about
// world x=240). The trace shows misc:3 there; substituting misc:2's cell at
// the identical display record is the forensic "restore misc:2" step (same
// 520x288 pack geometry). Segment mask (cell px, eye-checked on
// measure-input/zhangfei zoom/grid renders): alpha with x>=270, y100-158.
// East of x270 the only alpha in that band is the extended bare arm (top edge
// y~116 at x270, hand to x354/y103-142; the spear shaft stays at y>=163, the
// head/beard west of ~x267); 89.7% of those px pass the lit-skin predicate
// below, the rest are the arm's own dark outline/shadow, so the box IS the
// skin segment. Sub-segments by cell x: upper x<292 (pivot elbow (285,128),
// forensic), forearm 292<=x<312 (pivot mid (301,129)), hand x>=312 (pivot
// wrist (313,128); 312 is the landmark hand-ROI west edge, so the distal
// sub-segment is exactly the claw hand). Shoulder seed (255,130) = fixed
// anchor where the upper arm exits the vest/beard, for the proximal base
// angle. Clusters/targets/micro-dx are shared with the guanyu warp
// (WARP_CLUSTERS). Fingers = hand-ROI px cell x>=336 (distal claw fingertips;
// palm = the rest), claw direction = palm->finger centroid vector.
const ZF_OUT_DIR = 'artifacts/motion/paired/zhangfei-arm-warp-diagnostic'
const ZF_TRACE_PATH = 'artifacts/motion/paired/zhangfei/canvas/trace.json'
const ZF_HERO = 'zhangfei'
const ZF_FRAME = 'misc:2'
const ZF_ELBOW_PX = { x: 285, y: 128 }
const ZF_SEEDS_PX = { shoulder: { x: 255, y: 130 }, elbow: ZF_ELBOW_PX, mid: { x: 301, y: 129 }, wrist: { x: 313, y: 128 } }
const ZF_SEG_BOX = { xMin: 270, yMin: 100, yMax: 158 }
const ZF_SUBSEG_X = [292, 312] // upper | forearm | hand cut columns (cell px)
const ZF_FINGER_MIN_CELL_X = 336
// Pre-registered metric gate for ACCEPT (visual inspection must also pass):
// same thresholds as the guanyu warp, plus a seam skin-match floor.
const ZF_GATE = { ...WARP_GATE, seamSkinMatchFrac: 0.8 }
// Per-cluster verdicts from personally inspecting the ZF warp sheets/zooms
// (filled after the first ZF warp run). Shape: { verdict, note }.
const ZF_VERDICTS = {
  NH: {
    verdict: 'REJECT ZF arm-warp (soldier+archer)',
    note: 'Sheets/zooms personally inspected both facings: the ~31u warp (needed distal shift -27.2,-14.1u right-facing) lands the claw exactly on target (fingerGap 0.023-0.245u, palmGap 0.013-0.015u, palmC 0.193-4.093u, roiOv 327-343, survival 1, soleV 3u) but the arm does not survive it: inter-subsegment sepMax 16.372-16.572u vs 4u gate, seam skinMatch 0.399, and on the clean sheets the forearm is swallowed behind the victim (proximalMasked 623-747 cells, cut-edge occluded 0.695-1.0) so the claw hand simply sprouts from the soldier chest / archer face with no readable arm running back to Zhang Fei - on archer it reads as the victim\'s own raised hand. Metric contact without a readable arm: reject (same failure family as guanyu NH).',
  },
  ML: {
    verdict: 'REJECT ZF arm-warp (spearman+xiahoudun)',
    note: 'Sheets/zooms personally inspected both facings at target (242,151): contact metrics again land (fingerGap 0.013-0.161u, survival 1, spearman palmC 0.962-1.462u roiOv 323-325) but the ~24u warp drags the west seam off skin onto beard/vest (seam gapMean 6.2-6.265u, skinMatch 0.14-0.161, colorDelta ~110 vs 29 for FH, interMax 5.546-5.864u; xiahoudun palmC 5.949-6.437u). Visually the spearman claw is an open palm plastered across the victim face/chest with the forearm crossing Zhang Fei\'s own beard, and the xiahoudun hand floats in front of Zhang Fei\'s face while the hunched victim head sits untouched behind it. No readable grip on either member: reject.',
  },
  FH: {
    verdict: 'CONDITIONAL ACCEPT ZF arm-warp as prototype candidate (xuchu+lidian) - visual pass, metric gate near-miss',
    note: 'Sheets/zooms personally inspected both facings at target (264,135): the warp is almost pure vertical (needed shift only -1.2,-12.1u) and both members read as real grabs - xuchu claw closes over the chin/collar notch (palmC 0.398-0.889u, roiOv 320-322) and lidian gets a face/throat claw (palmC 5.651-6.144u, roiOv 254-256) - with a continuous raised bare forearm back to the shoulder, fingers keeping claw direction (fingerDirDelta 10deg), finger/palm gaps 0.013-0.026u, survival 1, distal centroid on target, bodyOvD negative, soleV 3u/soleH 0. HONEST GATE STATUS: metricGatePass=false - seam gapMeanToStub 3.165-3.319u vs the 2u gate (identity already 1.257u on this sloped cut) and lidian-left palmC 6.144u vs 6u by 0.144u; every other gate term passes, the seam stays on skin (skinMatch 0.916-0.923, colorDelta ~29) and no seam break is visible on the clean sheets at game scale. Accept the FH direction as the prototype candidate with those two near-misses recorded for manager weigh-in; still a still-frame diagnostic, not ship-ready runtime layering, and the misc:2 dispatch change remains a separate later task.',
  },
}

const r3 = (v) => (v === null || v === undefined ? null : Number(v.toFixed(3)))
const key2 = (rx, ry) => (rx + 4096) * 16384 + (ry + 4096) // 0.5u-cell numeric key

/** World points -> parallel int arrays on the 0.5u grid (overlapCount grid). */
function intPts(worldPts) {
  const rx = new Int32Array(worldPts.length), ry = new Int32Array(worldPts.length)
  worldPts.forEach(([x, y], i) => { rx[i] = Math.round(x * 2); ry[i] = Math.round(y * 2) })
  return { rx, ry }
}
function intSet(pts) {
  const s = new Set()
  for (let i = 0; i < pts.rx.length; i++) s.add(key2(pts.rx[i], pts.ry[i]))
  return s
}
/** Overlap of `moving` (shifted by half-units sx2, sy2) against a static set. */
function overlapShifted(moving, staticSet, sx2, sy2) {
  let n = 0
  for (let i = 0; i < moving.rx.length; i++) {
    if (staticSet.has(key2(moving.rx[i] + sx2, moving.ry[i] + sy2))) n++
  }
  return n
}

/** 3u-bucketed hand points for an exact-when-<=cap min distance search. */
function handBuckets(handWorld) {
  const m = new Map()
  for (const p of handWorld) {
    const k = key2(Math.floor(p[0] / GAP_CAP_U), Math.floor(p[1] / GAP_CAP_U))
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(p)
  }
  return m
}
function cappedGap(buckets, collarWorld, dx, dy) {
  // Any pair within GAP_CAP_U lies in same/adjacent buckets, so a found
  // minimum <= cap is exact; no such pair => gap > cap (reported null).
  let best = Infinity
  for (const [cx, cy] of collarWorld) {
    const x = cx + dx, y = cy + dy
    const bx = Math.floor(x / GAP_CAP_U), by = Math.floor(y / GAP_CAP_U)
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (const [hx, hy] of buckets.get(key2(bx + i, by + j)) ?? []) {
        const d = Math.hypot(x - hx, y - hy)
        if (d < best) best = d
      }
    }
  }
  return best <= GAP_CAP_U ? best : null
}

function buildContext(sample, landmarks) {
  const holderFrame = frameNameOf(sample.holder.sprite.frame)
  const victimFrame = frameNameOf(sample.victim.sprite.frame)
  const handLm = landmarks.frames[`${HERO}:${holderFrame}`]
  const collarLm = landmarks.frames[`${sample.kind}:${victimFrame}`]
  if (!handLm || !collarLm) throw new Error(`missing landmark for ${sample.kind} hold4`)
  const holderCell = restoreCell(HERO, holderFrame)
  const victimCell = restoreCell(sample.kind, victimFrame)
  const hDisp = sample.holder.sprite.display
  const vDisp = sample.victim.sprite.display
  const handWorld = toWorld(alphaPoints(holderCell, handLm.roi), hDisp, holderCell.srcW)
  const collarWorld = toWorld(alphaPoints(victimCell, collarLm.roi), vDisp, victimCell.srcW)
  const holderBody = toWorld(alphaPoints(holderCell), hDisp, holderCell.srcW)
  const victimBody = toWorld(alphaPoints(victimCell), vDisp, victimCell.srcW)
  const front = sample.holder.sprite.depth !== sample.victim.sprite.depth
    ? (sample.holder.sprite.depth > sample.victim.sprite.depth ? 'holder' : 'victim')
    : (sample.holder.sprite.index > sample.victim.sprite.index ? 'holder' : 'victim')
  const ctx = {
    sample, kind: sample.kind, facing: sample.facing, holderFrame, victimFrame,
    handLm, collarLm, holderCell, victimCell, hDisp, vDisp,
    handWorld, collarWorld, holderBody, victimBody, front,
    pinSign: Math.sign(sample.pin.dx || 1),
    holderBoot: bootGround(holderCell, hDisp), victimBoot: bootGround(victimCell, vDisp),
    buckets: handBuckets(handWorld),
    handSet: intSet(intPts(handWorld)), collarInt: intPts(collarWorld),
    holderBodySet: intSet(intPts(holderBody)), victimBodyInt: intPts(victimBody),
  }
  ctx.baselineGap = minDistance(handWorld, collarWorld)
  ctx.baselineBodyOverlap = overlapShifted(ctx.victimBodyInt, ctx.holderBodySet, 0, 0)
  // Patch geometry: holder grapple-arm alpha under the refined mask.
  ctx.patchPx = alphaPoints(holderCell).filter(([x, y]) => patchMaskHas(x, y))
  ctx.patchWorld = toWorld(ctx.patchPx, hDisp, holderCell.srcW)
  ctx.patchInt = intPts(ctx.patchWorld)
  ctx.patchBoxPx = alphaPoints(holderCell)
    .filter(([x, y]) => x >= PATCH_BOX.xMin && y >= PATCH_BOX.yMin && y <= PATCH_BOX.yMax).length
  ctx.handInPatchPx = alphaPoints(holderCell, handLm.roi).filter(([x, y]) => patchMaskHas(x, y)).length
  return ctx
}

/** Holder cell canvas with only grapple-arm patch alpha kept. */
const patchCanvasCache = new Map()
function patchCanvas(restored) {
  const key = `${restored.kind}:${restored.frame}`
  if (!patchCanvasCache.has(key)) {
    const cv = createCanvas(restored.srcW, restored.srcH)
    const g = cv.getContext('2d')
    const im = g.createImageData(restored.srcW, restored.srcH)
    for (let y = 0; y < restored.srcH; y++) for (let x = 0; x < restored.srcW; x++) {
      if (!patchMaskHas(x, y)) continue
      const i = (y * restored.srcW + x) * 4
      im.data.set(restored.data.subarray(i, i + 4), i)
    }
    g.putImageData(im, 0, 0)
    patchCanvasCache.set(key, cv)
  }
  return patchCanvasCache.get(key)
}

/** Absolute 0.5u-cell key set of int points shifted by a world-unit offset. */
function absSet(ints, off) {
  const sx2 = Math.round(off.dxU * 2), sy2 = Math.round(off.dyU * 2)
  const s = new Set()
  for (let i = 0; i < ints.rx.length; i++) s.add(key2(ints.rx[i] + sx2, ints.ry[i] + sy2))
  return s
}

/**
 * Composite metrics for one rendering mode. Hand-pixel survival = fraction of
 * hand-ROI source px whose world 0.5u cell is not painted over by victim
 * alpha drawn after the holder; in patch mode a masked px is redrawn last and
 * always survives. Gap/ROI/body overlap are geometry-only (patch-invariant)
 * and are reported per mode to prove the patch changes layering, not contact.
 */
function modeMetrics(ctx, holderOff, victimOff, patchOn) {
  const handW = shifted(ctx.handWorld, holderOff), collarW = shifted(ctx.collarWorld, victimOff)
  const vBodySet = absSet(ctx.victimBodyInt, victimOff)
  const victimAfterHolder = patchOn ? true : ctx.front === 'victim'
  let occluded = 0, rescued = 0
  for (const [wx, wy, cx, cy] of ctx.handWorld) {
    const k = key2(Math.round((wx + holderOff.dxU) * 2), Math.round((wy + holderOff.dyU) * 2))
    if (victimAfterHolder && vBodySet.has(k)) { occluded++; if (patchOn && patchMaskHas(cx, cy)) rescued++ }
  }
  const total = ctx.handWorld.length
  const rel = evaluate(ctx, Math.abs((victimOff.dxU - holderOff.dxU) / ctx.pinSign) || 0, victimOff.dyU - holderOff.dyU)
  const out = {
    holderOffsetU: holderOff, victimOffsetU: victimOff, patch: patchOn,
    exactGapU: r3(minDistance(handW, collarW).distU),
    roiOverlapPx: rel.roiOverlapPx, bodyOverlapPx: rel.bodyOverlapPx,
    bodyOverlapDeltaPx: rel.bodyOverlapDeltaPx,
    handPx: total, handOccludedPx: occluded, handRescuedByPatchPx: rescued,
    handSurvival: total ? r3((total - occluded + rescued) / total) : null,
  }
  if (patchOn) {
    const pSet = absSet(ctx.patchInt, holderOff)
    const collarSet = absSet(ctx.collarInt, victimOff)
    let overVictim = 0, overCollar = 0
    for (const k of pSet) { if (vBodySet.has(k)) overVictim++; if (collarSet.has(k)) overCollar++ }
    out.patchPx = ctx.patchPx.length
    out.patchCellsOverVictim = overVictim
    out.patchCellsOverCollarRoi = overCollar
  }
  return out
}

/** Relative-shift metrics: victim shifted by (pinSign*sepU, dyRelU) vs holder. */
function evaluate(ctx, sepU, dyRelU) {
  const dx = ctx.pinSign * sepU, dy = dyRelU
  const sx2 = Math.round(dx * 2), sy2 = Math.round(dy * 2)
  const gapU = cappedGap(ctx.buckets, ctx.collarWorld, dx, dy)
  const roiOverlapPx = overlapShifted(ctx.collarInt, ctx.handSet, sx2, sy2)
  const bodyOverlapPx = overlapShifted(ctx.victimBodyInt, ctx.holderBodySet, sx2, sy2)
  return {
    sepU, dyRelU, gapU: r3(gapU), gapOverCap: gapU === null,
    roiOverlapPx, bodyOverlapPx, bodyOverlapDeltaPx: bodyOverlapPx - ctx.baselineBodyOverlap,
  }
}

function score(c) {
  if (c.gapU === null) return Infinity
  // Prefer a touching grip (gap ~0 with modest ROI interpenetration ~40
  // half-unit cells), no INCREASE in whole-body overlap, small dy and sep.
  return c.gapU * 2 + Math.abs(c.roiOverlapPx - 40) * 0.04
    + Math.max(0, c.bodyOverlapDeltaPx) * 0.002 + Math.abs(c.dyRelU) * 0.4 + c.sepU * 0.03
}

function search(ctx) {
  const coarse = []
  for (let sep = 0; sep <= SEP_MAX_U; sep += 1) {
    for (let dy = -DY_RANGE_U; dy <= DY_RANGE_U; dy += 1) coarse.push(evaluate(ctx, sep, dy))
  }
  const ranked = [...coarse].sort((a, b) => score(a) - score(b))
  const seed = ranked[0] && ranked[0].gapU !== null ? ranked[0] : null
  const refined = []
  if (seed) {
    for (let sep = Math.max(0, seed.sepU - 1); sep <= seed.sepU + 1.001; sep += 0.25) {
      for (let dy = Math.max(-DY_RANGE_U, seed.dyRelU - 1); dy <= Math.min(DY_RANGE_U, seed.dyRelU + 1) + 0.001; dy += 0.25) {
        refined.push(evaluate(ctx, r3(sep), r3(dy)))
      }
    }
  }
  const all = [...coarse, ...refined]
  const best = all.reduce((a, c) => (score(c) < score(a) ? c : a), all[0])
  return { coarse, refined, scoredBest: { ...best, score: r3(score(best)) } }
}

function strategyOffsets(strategy, sepU, dyRelU, pinSign) {
  return {
    holder: { dxU: r3(-pinSign * strategy.holderShare * sepU), dyU: r3(-strategy.holderShare * dyRelU) },
    victim: { dxU: r3(pinSign * strategy.victimShare * sepU), dyU: r3(strategy.victimShare * dyRelU) },
  }
}
function soleInfo(boot, off) {
  // Presentation offset translates the sprite rigidly; the entity ground
  // point (shadow anchor) does not move. Sole displacement = the offset.
  return {
    offsetDxU: off.dxU, offsetDyU: off.dyU,
    displacementU: r3(Math.hypot(off.dxU, off.dyU)),
    groundErrU: boot ? r3(boot.groundErrU + off.dyU) : null,
  }
}
const shifted = (pts, off) => pts.map(([x, y, cx, cy]) => [x + off.dxU, y + off.dyU, cx, cy])

function strategyReport(ctx, chosen, strategy) {
  const offs = strategyOffsets(strategy, chosen.sepU, chosen.dyRelU, ctx.pinSign)
  // Exact verification with the offsets applied per-actor (not the capped
  // search): guards the relative-shift equivalence claim.
  const exact = minDistance(shifted(ctx.handWorld, offs.holder), shifted(ctx.collarWorld, offs.victim))
  const holderSole = soleInfo(ctx.holderBoot, offs.holder)
  const victimSole = soleInfo(ctx.victimBoot, offs.victim)
  return {
    strategy: strategy.name,
    holderOffsetU: offs.holder, victimOffsetU: offs.victim,
    gapU: chosen.gapU, exactGapU: r3(exact.distU),
    gapPass: exact.distU !== null && exact.distU <= GAP_PASS_U,
    gapPassSpec: exact.distU !== null && exact.distU <= SPEC_GAP_PASS_U,
    roiOverlapPx: chosen.roiOverlapPx,
    bodyOverlapPx: chosen.bodyOverlapPx, bodyOverlapDeltaPx: chosen.bodyOverlapDeltaPx,
    holderSole, victimSole,
    maxSoleDisplacementU: Math.max(holderSole.displacementU, victimSole.displacementU),
  }
}

// ---------------------------------------------------------------------------
// Rendering: before/after sheets (clean full-body) + tinted contact zooms.
// ---------------------------------------------------------------------------

function drawPanel(g, ctx, { x: px, y: py, w, h, S, centerY, holderOff, victimOff, tint, patch = false }) {
  const groundY = ctx.hDisp.y // entity ground line (both entities share it)
  const mapX = (wx) => px + w / 2 + (wx - 240) * S
  const mapY = (wy) => py + (centerY === 'ground' ? h - 26 + (wy - groundY) * S : h / 2 + (wy - centerY) * S)
  g.save()
  g.beginPath(); g.rect(px, py, w, h); g.clip()
  // Shadows stay at the ENTITY ground points (unmoved by sprite offsets).
  for (const [disp] of [[ctx.hDisp], [ctx.vDisp]]) {
    g.fillStyle = 'rgba(0,0,0,0.38)'
    g.beginPath(); g.ellipse(mapX(disp.x), mapY(groundY), 22 * S * 0.5, 5 * S * 0.5, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(255,233,138,0.8)'; g.lineWidth = 1
    g.beginPath(); g.moveTo(mapX(disp.x), mapY(groundY) - 6); g.lineTo(mapX(disp.x), mapY(groundY) + 6); g.stroke()
  }
  const drawActor = (restored, disp, off, roi, color, canvasOverride = null) => {
    const body = canvasOverride ?? cellCanvas(restored)
    const dw = restored.srcW * disp.scaleX * S, dh = restored.srcH * disp.scaleY * S
    const left = mapX(disp.x + off.dxU) - disp.displayOriginX * disp.scaleX * S
    const top = mapY(disp.y + off.dyU) - disp.displayOriginY * disp.scaleY * S
    g.save()
    if (disp.flipX) { g.translate(left + dw, top); g.scale(-1, 1); g.drawImage(body, 0, 0, dw, dh) }
    else g.drawImage(body, left, top, dw, dh)
    g.restore()
    if (tint && roi) {
      g.fillStyle = color
      for (const [cx, cy] of alphaPoints(restored, roi)) {
        const mx = disp.flipX ? restored.srcW - 1 - cx : cx
        g.fillRect(mapX(disp.x + off.dxU) + (mx - disp.displayOriginX) * disp.scaleX * S,
          mapY(disp.y + off.dyU) + (cy - disp.displayOriginY) * disp.scaleY * S, Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
      }
    }
  }
  const actors = [
    { restored: ctx.holderCell, disp: ctx.hDisp, off: holderOff, roi: ctx.handLm.roi, color: 'rgba(255,60,60,0.85)', key: 'holder' },
    { restored: ctx.victimCell, disp: ctx.vDisp, off: victimOff, roi: ctx.collarLm.roi, color: 'rgba(60,220,255,0.85)', key: 'victim' },
  ]
  // Patch mode fixes the layer order holder -> victim -> grapple-arm patch;
  // other modes keep the traced front order.
  if (!patch && ctx.front === 'holder') actors.reverse()
  for (const a of actors) drawActor(a.restored, a.disp, a.off, a.roi, a.color)
  if (patch) drawActor(ctx.holderCell, ctx.hDisp, holderOff, null, null, patchCanvas(ctx.holderCell))
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1
  g.beginPath(); g.moveTo(px, mapY(groundY)); g.lineTo(px + w, mapY(groundY)); g.stroke()
  g.restore()
}

function kindSheets(kind, comboResults) {
  // Panels: [baseline, holder-only, victim-only, split] x [right, left].
  const ZERO = { dxU: 0, dyU: 0 }
  const panelsOf = (res) => {
    const panels = [{ name: 'baseline (no offset)', holderOff: ZERO, victimOff: ZERO, strat: null }]
    for (const st of STRATEGIES) {
      const rep = res.strategies.find((s) => s.strategy === st.name)
      panels.push({
        name: st.name + (res.recommendation.strategy === st.name ? ' *RECOMMENDED*' : ''),
        holderOff: rep.holderOffsetU, victimOff: rep.victimOffsetU, strat: rep,
      })
    }
    return panels
  }
  const label = (g, x, y, res, panel) => {
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`${kind} ${res.facing} hold4 - ${panel.name}`, x + 6, y + 14)
    g.font = '11px sans-serif'
    const s = panel.strat
    g.fillText(s
      ? `offH(${s.holderOffsetU.dxU},${s.holderOffsetU.dyU}) offV(${s.victimOffsetU.dxU},${s.victimOffsetU.dyU}) gap=${s.exactGapU}u roiOv=${s.roiOverlapPx} bodyOvD=${s.bodyOverlapDeltaPx} soleH=${s.holderSole.displacementU}u soleV=${s.victimSole.displacementU}u`
      : `gap=${res.baseline.gapU}u bodyOv=${res.baseline.bodyOverlapPx} (yellow ticks/shadows = unmoved entity ground points)`, x + 6, y + 28)
  }
  { // Clean full-body sheet, 2px per unit.
    const W = 560, H = 300, LH = 34, cols = 4
    const cv = createCanvas(cols * W, 2 * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    comboResults.forEach((res, row) => {
      panelsOf(res).forEach((panel, col) => {
        const x = col * W, y = row * (H + LH)
        label(g, x, y, res, panel)
        drawPanel(g, res.ctx, { x, y: y + LH, w: W, h: H, S: 2, centerY: 'ground', holderOff: panel.holderOff, victimOff: panel.victimOff, tint: false })
      })
    })
    writeFileSync(`${OUT_DIR}/${kind}-sheet.png`, cv.toBuffer('image/png'))
  }
  { // Tinted contact zoom, 4px per unit, centered on the shifted hand/collar.
    const W = 460, H = 320, LH = 34, cols = 4
    const cv = createCanvas(cols * W, 2 * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    comboResults.forEach((res, row) => {
      panelsOf(res).forEach((panel, col) => {
        const x = col * W, y = row * (H + LH)
        label(g, x, y, res, panel)
        const hc = centroid(shifted(res.ctx.handWorld, panel.holderOff))
        const cc = centroid(shifted(res.ctx.collarWorld, panel.victimOff))
        // Zoom centers on the contact midpoint via centerY; x keeps the
        // fixed world anchor (240) so horizontal travel stays visible.
        drawPanel(g, res.ctx, { x, y: y + LH, w: W, h: H, S: 4, centerY: (hc[1] + cc[1]) / 2, holderOff: panel.holderOff, victimOff: panel.victimOff, tint: true })
      })
    })
    writeFileSync(`${OUT_DIR}/${kind}-zoom.png`, cv.toBuffer('image/png'))
  }
}

/** Smallest sep (0.5u steps, at the chosen dy) whose exact-capped gap <=2u. */
function minGapPassSep(ctx, dyRelU) {
  for (let sep = 0; sep <= SEP_MAX_U + 0.001; sep += 0.5) {
    const e = evaluate(ctx, r3(sep), dyRelU)
    if (e.gapU !== null && e.gapU <= GAP_PASS_U) return r3(sep)
  }
  return null
}

function patchSheets(kind, comboResults) {
  // Panels: [before, offset-only, patch@recommended, patch@minSep] x facings.
  const label = (g, x, y, res, panel) => {
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`${kind} ${res.facing} hold4 - ${panel.name}`, x + 6, y + 14)
    g.font = '10px sans-serif'
    const m = panel.metrics
    g.fillText(`gap=${m.exactGapU}u roiOv=${m.roiOverlapPx} bodyOvD=${m.bodyOverlapDeltaPx} surv=${m.handSurvival}`
      + (m.patch ? ` pVictim=${m.patchCellsOverVictim} pCollar=${m.patchCellsOverCollarRoi}` : '')
      + ` soleH=${panel.sole.holderSole.displacementU}u soleV=${panel.sole.victimSole.displacementU}u`, x + 6, y + 28)
  }
  const render = (file, W, H, S, tint) => {
    const LH = 34, cols = 4
    const cv = createCanvas(cols * W, 2 * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    comboResults.forEach((res, row) => {
      res.patchPanels.forEach((panel, col) => {
        const x = col * W, y = row * (H + LH)
        label(g, x, y, res, panel)
        const hc = centroid(shifted(res.ctx.handWorld, panel.metrics.holderOffsetU))
        const cc = centroid(shifted(res.ctx.collarWorld, panel.metrics.victimOffsetU))
        drawPanel(g, res.ctx, {
          x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground',
          holderOff: panel.metrics.holderOffsetU, victimOff: panel.metrics.victimOffsetU,
          tint, patch: panel.metrics.patch,
        })
      })
    })
    writeFileSync(`${OUT_DIR}/${file}`, cv.toBuffer('image/png'))
  }
  render(`${kind}-patch-sheet.png`, 560, 300, 2, false)
  render(`${kind}-patch-zoom.png`, 460, 320, 4, true)
}

function patchMaskSheet(ctx) {
  // Restored holder cell | refined patch only | raw forensic box only (1.5x).
  const r = ctx.holderCell, S = 1.5, LH = 20
  const boxCv = createCanvas(r.srcW, r.srcH), bg = boxCv.getContext('2d')
  const im = bg.createImageData(r.srcW, r.srcH)
  for (let y = PATCH_BOX.yMin; y <= PATCH_BOX.yMax; y++) for (let x = PATCH_BOX.xMin; x < r.srcW; x++) {
    const i = (y * r.srcW + x) * 4
    im.data.set(r.data.subarray(i, i + 4), i)
  }
  bg.putImageData(im, 0, 0)
  const panels = [
    [`${r.kind}:${r.frame} restored cell`, cellCanvas(r)],
    [`refined patch mask (${ctx.patchPx.length} alpha px)`, patchCanvas(r)],
    [`raw forensic box x>=${PATCH_BOX.xMin},y${PATCH_BOX.yMin}-${PATCH_BOX.yMax} (${ctx.patchBoxPx} alpha px)`, boxCv],
  ]
  const cv = createCanvas(Math.ceil(r.srcW * S) * 3 + 12, Math.ceil(r.srcH * S) + LH), g = cv.getContext('2d')
  g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
  panels.forEach(([name, c], i) => {
    const x = i * (Math.ceil(r.srcW * S) + 6)
    g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(name, x + 4, 14)
    g.drawImage(c, x, LH, r.srcW * S, r.srcH * S)
  })
  writeFileSync(`${OUT_DIR}/patch-mask.png`, cv.toBuffer('image/png'))
}

// ---------------------------------------------------------------------------
// Articulated forearm mode (--arm-transform). All transforms are applied to
// the forearm segment in WORLD space: rotate about the elbow pivot's world
// position by angleDeg (positive = clockwise on screen, y-down), then
// translate by (dxU, dyU). Holder and victim sprites never move, so sole
// displacement is exactly 0 by construction.
// ---------------------------------------------------------------------------

const inSegment = (x, y, pivot) => patchMaskHas(x, y) && x >= pivot.x

const segmentCanvasCache = new Map()
function segmentCanvasOf(restored, pivot, keepSegment) {
  const key = `${restored.kind}:${restored.frame}:${pivot.x},${pivot.y}:${keepSegment ? 'seg' : 'minus'}`
  if (!segmentCanvasCache.has(key)) {
    const cv = createCanvas(restored.srcW, restored.srcH)
    const g = cv.getContext('2d')
    const im = g.createImageData(restored.srcW, restored.srcH)
    for (let y = 0; y < restored.srcH; y++) for (let x = 0; x < restored.srcW; x++) {
      if (inSegment(x, y, pivot) !== keepSegment) continue
      const i = (y * restored.srcW + x) * 4
      im.data.set(restored.data.subarray(i, i + 4), i)
    }
    g.putImageData(im, 0, 0)
    segmentCanvasCache.set(key, cv)
  }
  return segmentCanvasCache.get(key)
}

function buildArmContext(ctx, pivot) {
  const r = ctx.holderCell
  const segPx = alphaPoints(r).filter(([x, y]) => inSegment(x, y, pivot))
  // Stub = holder alpha just west of the cut across the segment's row band
  // (any retained sleeve/robe the cut edge must stay sewn to, mask or not).
  const stubPx = alphaPoints(r).filter(([x, y]) => !inSegment(x, y, pivot) && x >= pivot.x - 12 && x < pivot.x && y >= 96 && y <= 176)
  const segWorld = toWorld(segPx, ctx.hDisp, r.srcW)
  const pivotWorld = toWorld([[pivot.x, pivot.y]], ctx.hDisp, r.srcW)[0]
  const handSeg = ctx.handWorld.map((p) => inSegment(p[2], p[3], pivot))
  const cutEdgeWorld = segWorld.filter((p) => p[2] < pivot.x + 4)
  const minusWorld = toWorld(alphaPoints(r).filter(([x, y]) => !inSegment(x, y, pivot)), ctx.hDisp, r.srcW)
  return {
    pivot, pivotWorld: [pivotWorld[0], pivotWorld[1]],
    segPx, segWorld, stubWorld: toWorld(stubPx, ctx.hDisp, r.srcW),
    stubPxCount: stubPx.length,
    handSeg, handInSegmentPx: handSeg.filter(Boolean).length,
    fingerWorld: ctx.handWorld.filter((p) => p[2] >= FINGER_MIN_CELL_X),
    cutEdgeWorld,
    meanCutEdgeDistU: cutEdgeWorld.length
      ? cutEdgeWorld.reduce((a, p) => a + Math.hypot(p[0] - pivotWorld[0], p[1] - pivotWorld[1]), 0) / cutEdgeWorld.length : 0,
    minusSet: intSet(intPts(minusWorld)),
    collarSet: intSet(ctx.collarInt),
    handCentroid: centroid(ctx.handWorld), collarCentroid: centroid(ctx.collarWorld),
    fingerCentroid: centroid(ctx.handWorld.filter((p) => p[2] >= FINGER_MIN_CELL_X)),
  }
}

function rotPt(wx, wy, arm, cos, sin, dxU, dyU) {
  const [px, py] = arm.pivotWorld
  const ox = wx - px, oy = wy - py
  return [px + ox * cos - oy * sin + dxU, py + ox * sin + oy * cos + dyU]
}
const transformHand = (ctx, arm, cos, sin, dxU, dyU) => ctx.handWorld.map((p, i) => {
  if (!arm.handSeg[i]) return p
  const [x, y] = rotPt(p[0], p[1], arm, cos, sin, dxU, dyU)
  return [x, y, p[2], p[3]]
})

function bruteGap(a, b) {
  let bestSq = Infinity
  for (const p of a) for (const q of b) {
    const dSq = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
    if (dSq < bestSq) bestSq = dSq
  }
  return Math.sqrt(bestSq)
}

function armScore(c) {
  // Fingers (not the wrist edge) must reach the collar; penalize seam travel
  // past 2u, angle and translation so "best" stays a plausible elbow bend.
  return c.fingerGapU * 2 + c.handGapU + c.centroidDistU * 0.4
    + Math.max(0, c.seamDispApproxU - 2) * 2 + Math.abs(c.angleDeg) * 0.04 + Math.hypot(c.dxU, c.dyU) * 0.25
}

function armEvaluate(ctx, arm, angleDeg, dxU, dyU) {
  const rad = angleDeg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad)
  // Stride-sampled hand for the search; exact metrics are recomputed later.
  const handT = transformHand(ctx, arm, cos, sin, dxU, dyU).filter((_, i) => i % 2 === 0)
  const fingerT = handT.filter((p) => p[2] >= FINGER_MIN_CELL_X)
  const [hcx, hcy] = rotPt(arm.handCentroid[0], arm.handCentroid[1], arm, cos, sin, dxU, dyU)
  const c = {
    angleDeg: r3(angleDeg), dxU: r3(dxU), dyU: r3(dyU),
    handGapU: r3(bruteGap(handT, ctx.collarWorld)),
    fingerGapU: r3(bruteGap(fingerT, ctx.collarWorld)),
    centroidDistU: r3(Math.hypot(hcx - arm.collarCentroid[0], hcy - arm.collarCentroid[1])),
    seamDispApproxU: r3(Math.hypot(dxU, dyU) + Math.abs(rad) * arm.meanCutEdgeDistU),
  }
  c.score = r3(armScore(c))
  return c
}

function armSearch(ctx, arm) {
  const { angleMaxDeg, angleStepDeg, dxMaxU, dxStepU, dyMaxU, dyStepU } = ARM_SEARCH
  let scoredBest = null, minGapBest = null, count = 0
  const consider = (c) => {
    count++
    if (!scoredBest || c.score < scoredBest.score) scoredBest = c
    if (!minGapBest || c.fingerGapU < minGapBest.fingerGapU
      || (c.fingerGapU === minGapBest.fingerGapU && c.handGapU < minGapBest.handGapU)) minGapBest = c
  }
  for (let a = -angleMaxDeg; a <= angleMaxDeg; a += angleStepDeg)
    for (let dx = -dxMaxU; dx <= dxMaxU; dx += dxStepU)
      for (let dy = -dyMaxU; dy <= dyMaxU; dy += dyStepU) consider(armEvaluate(ctx, arm, a, dx, dy))
  for (const seed of [scoredBest, minGapBest]) {
    for (let a = Math.max(-angleMaxDeg, seed.angleDeg - 5); a <= Math.min(angleMaxDeg, seed.angleDeg + 5) + 1e-9; a += 1)
      for (let dx = Math.max(-dxMaxU, seed.dxU - 2); dx <= Math.min(dxMaxU, seed.dxU + 2) + 1e-9; dx += 0.5)
        for (let dy = Math.max(-dyMaxU, seed.dyU - 2); dy <= Math.min(dyMaxU, seed.dyU + 2) + 1e-9; dy += 0.5)
          consider(armEvaluate(ctx, arm, r3(a), r3(dx), r3(dy)))
  }
  return { scoredBest, minGapBest, candidateCount: count }
}

/** Exact metrics for one candidate, composite holder(-seg) -> victim -> seg. */
function armExactMetrics(ctx, arm, cand) {
  const rad = cand.angleDeg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad)
  const tf = (pts) => pts.map((p) => { const [x, y] = rotPt(p[0], p[1], arm, cos, sin, cand.dxU, cand.dyU); return [x, y, p[2], p[3]] })
  const handT = transformHand(ctx, arm, cos, sin, cand.dxU, cand.dyU)
  const fingerT = handT.filter((p) => p[2] >= FINGER_MIN_CELL_X)
  const segT = tf(arm.segWorld)
  const segInt = intPts(segT)
  const handIntSet = intSet(intPts(handT))
  let roiOverlapPx = 0
  for (let i = 0; i < ctx.collarInt.rx.length; i++) if (handIntSet.has(key2(ctx.collarInt.rx[i], ctx.collarInt.ry[i]))) roiOverlapPx++
  const vBodySet = intSet(ctx.victimBodyInt)
  let occluded = 0
  handT.forEach((p, i) => {
    if (arm.handSeg[i]) return // segment draws last: always survives
    if (vBodySet.has(key2(Math.round(p[0] * 2), Math.round(p[1] * 2)))) occluded++
  })
  const holderUnion = new Set(arm.minusSet)
  let segOverVictim = 0, segOverCollar = 0
  for (let i = 0; i < segInt.rx.length; i++) {
    const k = key2(segInt.rx[i], segInt.ry[i])
    holderUnion.add(k)
    if (vBodySet.has(k)) segOverVictim++
    if (arm.collarSet.has(k)) segOverCollar++
  }
  let bodyOverlapPx = 0
  for (let i = 0; i < ctx.victimBodyInt.rx.length; i++) if (holderUnion.has(key2(ctx.victimBodyInt.rx[i], ctx.victimBodyInt.ry[i]))) bodyOverlapPx++
  const cutT = tf(arm.cutEdgeWorld)
  const seamDisps = cutT.map((p, i) => Math.hypot(p[0] - arm.cutEdgeWorld[i][0], p[1] - arm.cutEdgeWorld[i][1]))
  // Per-point nearest-stub distance: a set-to-set minimum stays ~0 near the
  // pivot however wide the seam opens at the cuff end, so it cannot gate.
  const stubDists = cutT.map((p) => arm.stubWorld.length ? Math.sqrt(Math.min(...arm.stubWorld.map((q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2))) : null)
  const m = {
    transform: { angleDeg: cand.angleDeg, dxU: cand.dxU, dyU: cand.dyU },
    handGapU: r3(minDistance(handT, ctx.collarWorld).distU),
    fingerGapU: r3(minDistance(fingerT, ctx.collarWorld).distU),
    roiOverlapPx,
    handPx: handT.length, handInSegmentPx: arm.handInSegmentPx, fingerPx: fingerT.length,
    handSurvival: handT.length ? r3((handT.length - occluded) / handT.length) : null,
    segmentPx: arm.segPx.length, segmentCellsOverVictim: segOverVictim, segmentCellsOverCollarRoi: segOverCollar,
    bodyOverlapPx, bodyOverlapDeltaPx: bodyOverlapPx - ctx.baselineBodyOverlap,
    seam: {
      pivotDisplacementU: r3(Math.hypot(cand.dxU, cand.dyU)),
      cutEdgePx: cutT.length,
      cutEdgeMeanDisplacementU: seamDisps.length ? r3(seamDisps.reduce((a, v) => a + v, 0) / seamDisps.length) : null,
      cutEdgeMaxDisplacementU: seamDisps.length ? r3(Math.max(...seamDisps)) : null,
      gapMeanToStubU: stubDists[0] === null || !stubDists.length ? null : r3(stubDists.reduce((a, v) => a + v, 0) / stubDists.length),
      gapMaxToStubU: stubDists[0] === null || !stubDists.length ? null : r3(Math.max(...stubDists)),
    },
    holderSoleDisplacementU: 0, victimSoleDisplacementU: 0,
    holderBootErrU: ctx.holderBoot?.groundErrU, victimBootErrU: ctx.victimBoot?.groundErrU,
  }
  m.metricGatePass = m.fingerGapU <= ARM_GATE.fingerGapU && m.seam.gapMeanToStubU <= ARM_GATE.seamGapU
    && m.seam.cutEdgeMaxDisplacementU <= ARM_GATE.seamMaxDispU && m.handSurvival >= ARM_GATE.handSurvival
  return m
}

function drawArmPanel(g, ctx, arm, { x: px, y: py, w, h, S, centerY, cand, tint }) {
  const groundY = ctx.hDisp.y
  const mapX = (wx) => px + w / 2 + (wx - 240) * S
  const mapY = (wy) => py + (centerY === 'ground' ? h - 26 + (wy - groundY) * S : h / 2 + (wy - centerY) * S)
  g.save()
  g.beginPath(); g.rect(px, py, w, h); g.clip()
  for (const disp of [ctx.hDisp, ctx.vDisp]) {
    g.fillStyle = 'rgba(0,0,0,0.38)'
    g.beginPath(); g.ellipse(mapX(disp.x), mapY(groundY), 11 * S, 2.5 * S, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(255,233,138,0.8)'; g.lineWidth = 1
    g.beginPath(); g.moveTo(mapX(disp.x), mapY(groundY) - 6); g.lineTo(mapX(disp.x), mapY(groundY) + 6); g.stroke()
  }
  const drawActor = (restored, disp, canvasOverride = null) => {
    const body = canvasOverride ?? cellCanvas(restored)
    const dw = restored.srcW * disp.scaleX * S, dh = restored.srcH * disp.scaleY * S
    const left = mapX(disp.x) - disp.displayOriginX * disp.scaleX * S
    const top = mapY(disp.y) - disp.displayOriginY * disp.scaleY * S
    g.save()
    if (disp.flipX) { g.translate(left + dw, top); g.scale(-1, 1); g.drawImage(body, 0, 0, dw, dh) }
    else g.drawImage(body, left, top, dw, dh)
    g.restore()
  }
  // Fixed composite order: holder without segment -> victim -> forearm segment.
  drawActor(ctx.holderCell, ctx.hDisp, segmentCanvasOf(ctx.holderCell, arm.pivot, false))
  drawActor(ctx.victimCell, ctx.vDisp)
  const rad = cand.angleDeg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad)
  const [pwx, pwy] = arm.pivotWorld
  g.save()
  g.translate(mapX(pwx + cand.dxU), mapY(pwy + cand.dyU)); g.rotate(rad); g.translate(-mapX(pwx), -mapY(pwy))
  drawActor(ctx.holderCell, ctx.hDisp, segmentCanvasOf(ctx.holderCell, arm.pivot, true))
  g.restore()
  if (tint) {
    g.fillStyle = 'rgba(255,60,60,0.85)'
    for (const p of transformHand(ctx, arm, cos, sin, cand.dxU, cand.dyU)) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
    g.fillStyle = 'rgba(60,220,255,0.85)'
    for (const p of ctx.collarWorld) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
    g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
    const ex = mapX(pwx + cand.dxU), ey = mapY(pwy + cand.dyU)
    g.beginPath(); g.moveTo(ex - 7, ey); g.lineTo(ex + 7, ey); g.moveTo(ex, ey - 7); g.lineTo(ex, ey + 7); g.stroke()
  }
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1
  g.beginPath(); g.moveTo(px, mapY(groundY)); g.lineTo(px + w, mapY(groundY)); g.stroke()
  g.restore()
}

function armSheets(kind, perKind) {
  // Panels: [before(core pin, traced order), seg-front identity, scoredBest,
  // minGapBest] x [right, left].
  const label = (g, x, y, res, panel) => {
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`${kind} ${res.facing} hold4 - ${panel.name}`, x + 6, y + 14)
    g.font = '10px sans-serif'
    const m = panel.metrics
    g.fillText(m
      ? `a=${m.transform.angleDeg} dx=${m.transform.dxU} dy=${m.transform.dyU} fGap=${m.fingerGapU}u gap=${m.handGapU}u roiOv=${m.roiOverlapPx} seam=${m.seam.gapMeanToStubU}/${m.seam.cutEdgeMaxDisplacementU}u surv=${m.handSurvival} sole=0`
      : `gap=${res.baselineGapU}u (yellow ticks/shadows = unmoved entity ground points)`, x + 6, y + 28)
  }
  const render = (file, W, H, S, tint) => {
    const LH = 34, cols = 4
    const cv = createCanvas(cols * W, 2 * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    perKind.forEach((res, row) => {
      res.panels.forEach((panel, col) => {
        const x = col * W, y = row * (H + LH)
        label(g, x, y, res, panel)
        if (!panel.metrics) {
          const ZERO = { dxU: 0, dyU: 0 }
          const hc = centroid(res.ctx.handWorld), cc = centroid(res.ctx.collarWorld)
          drawPanel(g, res.ctx, { x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground', holderOff: ZERO, victimOff: ZERO, tint })
        } else {
          const t = panel.metrics.transform
          const rad = t.angleDeg * Math.PI / 180
          const hc = centroid(transformHand(res.ctx, res.arm, Math.cos(rad), Math.sin(rad), t.dxU, t.dyU))
          const cc = centroid(res.ctx.collarWorld)
          drawArmPanel(g, res.ctx, res.arm, { x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground', cand: t, tint })
        }
      })
    })
    writeFileSync(`${ARM_OUT_DIR}/${file}`, cv.toBuffer('image/png'))
  }
  render(`${kind}-arm-sheet.png`, 560, 300, 2, false)
  render(`${kind}-arm-zoom.png`, 460, 320, 4, true)
}

/** Gridded pivot/segment inspection for misc:5 + misc:6 (cell px, 4x). */
function elbowInspectionSheet() {
  const crop = { x: 230, y: 80, w: 130, h: 110 }, S = 4, LH = 34, L = 30
  const frames = ['misc:5', 'misc:6'].map((f) => restoreCell(HERO, f))
  const cv = createCanvas(frames.length * (L + crop.w * S + 10), LH + crop.h * S + 8), g = cv.getContext('2d')
  g.fillStyle = '#28222e'; g.fillRect(0, 0, cv.width, cv.height)
  frames.forEach((r, i) => {
    const px0 = i * (L + crop.w * S + 10)
    const segN = alphaPoints(r).filter(([x, y]) => inSegment(x, y, ELBOW_PIVOT_PX)).length
    g.fillStyle = '#fff'; g.font = '12px sans-serif'
    g.fillText(`${r.kind}:${r.frame} seg=${segN}px yellow=cut red=pivot(${ELBOW_PIVOT_PX.x},${ELBOW_PIVOT_PX.y}) green=segment`, px0 + 4, 16)
    g.font = '10px sans-serif'
    g.drawImage(cellCanvas(r), crop.x, crop.y, crop.w, crop.h, px0 + L, LH, crop.w * S, crop.h * S)
    g.fillStyle = 'rgba(0,255,120,0.38)'
    for (const [x, y] of alphaPoints(r)) {
      if (!inSegment(x, y, ELBOW_PIVOT_PX) || x < crop.x || y < crop.y || x >= crop.x + crop.w || y >= crop.y + crop.h) continue
      g.fillRect(px0 + L + (x - crop.x) * S, LH + (y - crop.y) * S, S, S)
    }
    for (let gx = Math.ceil(crop.x / 10) * 10; gx <= crop.x + crop.w; gx += 10) {
      g.strokeStyle = 'rgba(255,255,120,0.35)'
      g.beginPath(); g.moveTo(px0 + L + (gx - crop.x) * S, LH); g.lineTo(px0 + L + (gx - crop.x) * S, LH + crop.h * S); g.stroke()
      if (gx % 20 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(gx), px0 + L + (gx - crop.x) * S - 8, LH - 4) }
    }
    for (let gy = Math.ceil(crop.y / 10) * 10; gy <= crop.y + crop.h; gy += 10) {
      g.strokeStyle = 'rgba(255,255,120,0.35)'
      g.beginPath(); g.moveTo(px0 + L, LH + (gy - crop.y) * S); g.lineTo(px0 + L + crop.w * S, LH + (gy - crop.y) * S); g.stroke()
      if (gy % 20 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(gy), px0 + 2, LH + (gy - crop.y) * S + 3) }
    }
    const cutX = px0 + L + (ELBOW_PIVOT_PX.x - crop.x) * S
    g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
    g.beginPath(); g.moveTo(cutX, LH); g.lineTo(cutX, LH + crop.h * S); g.stroke()
    const ex = cutX, ey = LH + (ELBOW_PIVOT_PX.y - crop.y) * S
    g.strokeStyle = '#ff4040'; g.lineWidth = 2
    g.beginPath(); g.moveTo(ex - 9, ey); g.lineTo(ex + 9, ey); g.moveTo(ex, ey - 9); g.lineTo(ex, ey + 9); g.stroke()
    g.lineWidth = 1
  })
  writeFileSync(`${ARM_OUT_DIR}/elbow-pivot-inspection.png`, cv.toBuffer('image/png'))
}

// ---------------------------------------------------------------------------
// Arm-warp mode (--arm-warp). Piecewise warp in WORLD space: each of the 3
// sub-segments rotates about its seed pivot and translates by t_i. The hand
// sub-segment translation is SOLVED so the distal-hand centroid (hand-ROI px
// with cell x>=303) lands on the cluster target (+ searched tweak); proximal
// /mid translations are fractions f0/f1 of it, and their base angles align
// the displaced seed chain (shoulder->elbow', elbow'->mid') against the
// original, so the chain bends toward the target instead of shearing rigidly.
// Hand base angle is 0 = original orientation (fingers keep pointing along
// the holder's facing). Angles/tx are stored right-facing-equivalent and
// mirrored by pinSign for left facings. Composite order: holder base (segment
// erased) -> proximal sub-segment -> victim (micro-dx) -> mid+hand
// sub-segments, which is exactly "warped segment on top, proximal portion
// masked behind the victim silhouette" (the elbow seam hides under the
// victim where they overlap).
// ---------------------------------------------------------------------------

const warpSegHas = (x, y) => (x >= 272 && y >= 108 && y <= 135) || (x >= 300 && x < 339 && y >= 101 && y < 124)
const warpSubsegOf = (x) => (x < WARP_SUBSEG_X[0] ? 0 : x < WARP_SUBSEG_X[1] ? 1 : 2)
const warpClusterOf = (kind) => WARP_CLUSTERS.find((c) => kind in c.microDxU)

const warpCanvasCache = new Map()
function warpCanvasOf(restored, part) { // part: 'base' | subseg index 0/1/2
  const key = `${restored.kind}:${restored.frame}:warp:${part}`
  if (!warpCanvasCache.has(key)) {
    const cv = createCanvas(restored.srcW, restored.srcH)
    const g = cv.getContext('2d')
    const im = g.createImageData(restored.srcW, restored.srcH)
    for (let y = 0; y < restored.srcH; y++) for (let x = 0; x < restored.srcW; x++) {
      const keep = part === 'base' ? !warpSegHas(x, y) : warpSegHas(x, y) && warpSubsegOf(x) === part
      if (!keep) continue
      const i = (y * restored.srcW + x) * 4
      im.data.set(restored.data.subarray(i, i + 4), i)
    }
    g.putImageData(im, 0, 0)
    warpCanvasCache.set(key, cv)
  }
  return warpCanvasCache.get(key)
}

function buildWarpContext(ctx) {
  const r = ctx.holderCell
  const cluster = warpClusterOf(ctx.kind)
  const microDxU = cluster.microDxU[ctx.kind]
  const victimOff = { dxU: ctx.pinSign * microDxU, dyU: 0 }
  const targetWorld = ctx.pinSign > 0 ? [...cluster.targetRight] : [480 - cluster.targetRight[0], cluster.targetRight[1]]
  const segPx = alphaPoints(r).filter(([x, y]) => warpSegHas(x, y))
  const segWorld = toWorld(segPx, ctx.hDisp, r.srcW)
  const segSub = segPx.map(([x]) => warpSubsegOf(x))
  const byCell = new Map(segWorld.map((p, i) => [`${p[2]},${p[3]}`, i]))
  const boundaryPairs = []
  for (const cutX of WARP_SUBSEG_X) for (let y = 96; y <= 140; y++) {
    const a = byCell.get(`${cutX - 1},${y}`), b = byCell.get(`${cutX},${y}`)
    if (a !== undefined && b !== undefined) boundaryPairs.push([a, b])
  }
  const seedWorld = {}
  for (const [name, s] of Object.entries(WARP_SEEDS_PX)) {
    const wpt = toWorld([[s.x, s.y]], ctx.hDisp, r.srcW)[0]
    seedWorld[name] = [wpt[0], wpt[1]]
  }
  const handSub = ctx.handWorld.map((p) => warpSubsegOf(p[2]))
  const distalHand = ctx.handWorld.filter((p) => p[2] >= WARP_SUBSEG_X[1])
  const stubPx = alphaPoints(r).filter(([x, y]) => !warpSegHas(x, y) && x >= 258 && x < 272 && y >= 100 && y <= 140)
  const baseMinusWorld = toWorld(alphaPoints(r).filter(([x, y]) => !warpSegHas(x, y)), ctx.hDisp, r.srcW)
  return {
    cluster: cluster.name, microDxU, victimOff, targetWorld,
    segPx, segWorld, segSub, boundaryPairs, seedWorld, handSub,
    segBoxOnlyPx: alphaPoints(r).filter(([x, y]) => x >= 272 && y >= 108 && y <= 135).length,
    subsegPx: [0, 1, 2].map((i) => segSub.filter((s) => s === i).length),
    distalHandCentroid: centroid(distalHand),
    palmOrig: ctx.handWorld.filter((p) => p[2] < FINGER_MIN_CELL_X),
    fingerOrig: ctx.handWorld.filter((p) => p[2] >= FINGER_MIN_CELL_X),
    stubWorld: toWorld(stubPx, ctx.hDisp, r.srcW), stubPxCount: stubPx.length,
    cutEdgeIdx: segWorld.map((p, i) => (p[2] < 276 ? i : -1)).filter((i) => i >= 0),
    baseMinusSet: intSet(intPts(baseMinusWorld)),
    // Victim-side geometry with the cluster micro-dx applied.
    collarW: shifted(ctx.collarWorld, victimOff),
    collarCentroidW: centroid(shifted(ctx.collarWorld, victimOff)),
    victimBodySetW: absSet(ctx.victimBodyInt, victimOff),
    collarSetW: absSet(ctx.collarInt, victimOff),
    handInSegPx: ctx.handWorld.filter((p) => warpSegHas(p[2], p[3])).length,
  }
}

function warpTransforms(ctx, w, cand) {
  const pivots = [w.seedWorld.elbow, w.seedWorld.mid, w.seedWorld.wrist]
  if (cand.identity) return pivots.map((p) => ({ pivot: p, cos: 1, sin: 0, tx: 0, ty: 0, angleWorldDeg: 0 }))
  const ps = ctx.pinSign
  const handRad = ps * cand.handAngleDeg * Math.PI / 180
  const hc = Math.cos(handRad), hs = Math.sin(handRad)
  const [wx, wy] = w.seedWorld.wrist
  const [cx, cy] = w.distalHandCentroid
  const desired = [w.targetWorld[0] + ps * cand.txU, w.targetWorld[1] + cand.tyU]
  const tHand = [desired[0] - (wx + (cx - wx) * hc - (cy - wy) * hs), desired[1] - (wy + (cx - wx) * hs + (cy - wy) * hc)]
  const ts = [[cand.f0 * tHand[0], cand.f0 * tHand[1]], [cand.f1 * tHand[0], cand.f1 * tHand[1]], tHand]
  const moved = pivots.map((p, i) => [p[0] + ts[i][0], p[1] + ts[i][1]])
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
  const ang = (v, u) => Math.atan2(v[0] * u[1] - v[1] * u[0], v[0] * u[0] + v[1] * u[1]) * 180 / Math.PI
  const base0 = ang(sub(w.seedWorld.elbow, w.seedWorld.shoulder), sub(moved[0], w.seedWorld.shoulder))
  const base1 = ang(sub(w.seedWorld.mid, w.seedWorld.elbow), sub(moved[1], moved[0]))
  const anglesWorld = [base0 + ps * cand.da0Deg, base1 + ps * cand.da1Deg, ps * cand.handAngleDeg]
  return pivots.map((p, i) => {
    const rad = anglesWorld[i] * Math.PI / 180
    return { pivot: p, cos: Math.cos(rad), sin: Math.sin(rad), tx: ts[i][0], ty: ts[i][1], angleWorldDeg: r3(anglesWorld[i]) }
  })
}
const warpApply = (p, tr) => {
  const ox = p[0] - tr.pivot[0], oy = p[1] - tr.pivot[1]
  return [tr.pivot[0] + ox * tr.cos - oy * tr.sin + tr.tx, tr.pivot[1] + ox * tr.sin + oy * tr.cos + tr.ty, p[2], p[3]]
}
const warpHandPts = (ctx, w, trs) => ctx.handWorld.map((p, i) => warpApply(p, trs[w.handSub[i]]))
const warpSegPts = (w, trs) => w.segWorld.map((p, i) => warpApply(p, trs[w.segSub[i]]))

/** Sampled search metrics (stride samples; exact metrics recomputed later). */
function warpSample(ctx, w, cand) {
  const trs = warpTransforms(ctx, w, cand)
  const handT = warpHandPts(ctx, w, trs)
  const handS = handT.filter((_, i) => i % 2 === 0)
  const fingerS = handS.filter((p) => p[2] >= FINGER_MIN_CELL_X)
  const palmT = handT.filter((p) => p[2] < FINGER_MIN_CELL_X)
  const palmC = centroid(palmT)
  const distalC = centroid(handT.filter((p) => p[2] >= WARP_SUBSEG_X[1]))
  const segT = warpSegPts(w, trs)
  const cutDisp = w.cutEdgeIdx.map((i) => Math.hypot(segT[i][0] - w.segWorld[i][0], segT[i][1] - w.segWorld[i][1]))
  const interSep = w.boundaryPairs.map(([a, b]) => Math.hypot(segT[a][0] - segT[b][0], segT[a][1] - segT[b][1]))
  let segOverVictim = 0, segOverCollar = 0
  segT.forEach((p, i) => {
    if (i % 2) return
    const k = key2(Math.round(p[0] * 2), Math.round(p[1] * 2))
    if (w.victimBodySetW.has(k)) segOverVictim++
    if (w.collarSetW.has(k)) segOverCollar++
  })
  const m = {
    fingerGapU: bruteGap(fingerS, w.collarW), handGapU: bruteGap(handS, w.collarW),
    palmCentroidDistU: Math.hypot(palmC[0] - w.collarCentroidW[0], palmC[1] - w.collarCentroidW[1]),
    distalToTargetU: Math.hypot(distalC[0] - w.targetWorld[0], distalC[1] - w.targetWorld[1]),
    cutDispMeanU: cutDisp.length ? cutDisp.reduce((a, v) => a + v, 0) / cutDisp.length : 0,
    interSepMeanU: interSep.length ? interSep.reduce((a, v) => a + v, 0) / interSep.length : 0,
    segOverVictimS: segOverVictim, segOverCollarS: segOverCollar,
  }
  // Finger-to-collar gap first, then palm-centroid proximity to the collar,
  // fidelity to the forensic target, and seam travel (cut-edge displacement
  // + boundary separation beyond the ~0.5u original column spacing).
  m.score = m.fingerGapU * 2 + m.handGapU + m.palmCentroidDistU * 0.6 + m.distalToTargetU * 0.8
    + m.cutDispMeanU * 0.5 + Math.max(0, m.interSepMeanU - 0.5) * 1.5 - m.segOverCollarS * 0.01
    + Math.abs(cand.handAngleDeg ?? 0) * 0.08 // keep fingers pointing along the facing
  return m
}

/** Per-cluster staged search on the 2 right-facing members (left mirrors). */
function warpSearchCluster(members) {
  // members: [{ctx, w}] right-facing only.
  const sumScore = (cand) => members.reduce((a, m) => a + warpSample(m.ctx, m.w, cand).score, 0)
  let count = 0, best = null
  const consider = (cand) => { count++; const s = sumScore(cand); if (!best || s < best.score) best = { cand, score: s } }
  for (const handAngleDeg of [-10, -5, 0, 5, 10])
    for (const txU of [-4, -2, 0, 2, 4]) for (const tyU of [-3, -2, -1, 0, 1, 2, 3])
      consider({ handAngleDeg, txU, tyU, da0Deg: 0, da1Deg: 0, f0: 0.3, f1: 0.65 })
  const stageA = { ...best }
  for (const f0 of [0, 0.15, 0.3, 0.45, 0.6]) for (const f1 of [0.5, 0.65, 0.8, 0.9]) {
    if (f1 <= f0 + 0.15) continue
    for (const da0Deg of [-10, -5, 0, 5, 10]) for (const da1Deg of [-10, -5, 0, 5, 10])
      consider({ ...stageA.cand, f0, f1, da0Deg, da1Deg })
  }
  return { best: best.cand, clusterScore: r3(best.score), stageABest: stageA.cand, candidateCount: count }
}

/** Exact metrics for one warp candidate (full alpha, victim micro-dx on). */
function warpExactMetrics(ctx, w, cand) {
  const trs = warpTransforms(ctx, w, cand)
  const handT = warpHandPts(ctx, w, trs)
  const segT = warpSegPts(w, trs)
  const fingerT = handT.filter((p) => p[2] >= FINGER_MIN_CELL_X)
  const palmT = handT.filter((p) => p[2] < FINGER_MIN_CELL_X)
  const palmC = centroid(palmT), fingerC = centroid(fingerT)
  const distalC = centroid(handT.filter((p) => p[2] >= WARP_SUBSEG_X[1]))
  const handC = centroid(handT)
  const palmOrigC = centroid(w.palmOrig), fingerOrigC = centroid(w.fingerOrig)
  const dirDelta = (() => {
    const v = [fingerOrigC[0] - palmOrigC[0], fingerOrigC[1] - palmOrigC[1]]
    const u = [fingerC[0] - palmC[0], fingerC[1] - palmC[1]]
    return Math.abs(Math.atan2(v[0] * u[1] - v[1] * u[0], v[0] * u[0] + v[1] * u[1]) * 180 / Math.PI)
  })()
  const handSet = intSet(intPts(handT))
  let roiOverlapPx = 0
  for (const k of w.collarSetW) if (handSet.has(k)) roiOverlapPx++
  // Survival: mid+hand sub-segments draw last; proximal (no hand px) would be
  // occluded by the victim. Segment visibility likewise nets out proximal
  // cells covered by the victim silhouette.
  let handOccluded = 0
  handT.forEach((p, i) => {
    if (w.handSub[i] === 0 && w.victimBodySetW.has(key2(Math.round(p[0] * 2), Math.round(p[1] * 2)))) handOccluded++
  })
  const holderUnion = new Set(w.baseMinusSet)
  let segOverVictim = 0, segOverCollar = 0, segVisibleCells = 0, proxMaskedCells = 0
  const segKeys = new Set()
  segT.forEach((p, i) => {
    const k = key2(Math.round(p[0] * 2), Math.round(p[1] * 2))
    holderUnion.add(k)
    if (segKeys.has(k)) return
    segKeys.add(k)
    const overV = w.victimBodySetW.has(k)
    if (overV) segOverVictim++
    if (w.collarSetW.has(k)) segOverCollar++
    if (w.segSub[i] === 0 && overV) proxMaskedCells++; else segVisibleCells++
  })
  let bodyOverlapPx = 0
  for (const k of w.victimBodySetW) if (holderUnion.has(k)) bodyOverlapPx++
  const cutT = w.cutEdgeIdx.map((i) => segT[i])
  const stubDists = cutT.map((p) => Math.sqrt(Math.min(...w.stubWorld.map((q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2))))
  let cutOccluded = 0
  cutT.forEach((p) => { if (w.victimBodySetW.has(key2(Math.round(p[0] * 2), Math.round(p[1] * 2)))) cutOccluded++ })
  const interSep = w.boundaryPairs.map(([a, b]) => Math.hypot(segT[a][0] - segT[b][0], segT[a][1] - segT[b][1]))
  const m = {
    candidate: cand.identity ? { identity: true } : { handAngleDeg: cand.handAngleDeg, txU: cand.txU, tyU: cand.tyU, da0Deg: cand.da0Deg, da1Deg: cand.da1Deg, f0: cand.f0, f1: cand.f1 },
    subsegAnglesWorldDeg: trs.map((t) => t.angleWorldDeg),
    subsegTranslationsU: trs.map((t) => [r3(t.tx), r3(t.ty)]),
    fingerGapU: r3(minDistance(fingerT, w.collarW).distU),
    handGapU: r3(minDistance(handT, w.collarW).distU),
    palmGapU: r3(minDistance(palmT, w.collarW).distU),
    palmCentroidWorld: palmC.map(r3),
    palmCentroidToCollarCentroidU: r3(Math.hypot(palmC[0] - w.collarCentroidW[0], palmC[1] - w.collarCentroidW[1])),
    handCentroidWorld: handC.map(r3),
    distalHandCentroidWorld: distalC.map(r3),
    distalCentroidToTargetU: r3(Math.hypot(distalC[0] - w.targetWorld[0], distalC[1] - w.targetWorld[1])),
    handCentroidToTargetU: r3(Math.hypot(handC[0] - w.targetWorld[0], handC[1] - w.targetWorld[1])),
    fingerDirDeltaDeg: r3(dirDelta),
    roiOverlapPx, handPx: handT.length, handInSegmentPx: w.handInSegPx, fingerPx: fingerT.length,
    handSurvival: handT.length ? r3((handT.length - handOccluded) / handT.length) : null,
    segmentPx: w.segPx.length, segmentCellsOverVictim: segOverVictim, segmentCellsOverCollarRoi: segOverCollar,
    segmentVisibleCells: segVisibleCells, proximalMaskedCells: proxMaskedCells,
    bodyOverlapPx, bodyOverlapDeltaPx: bodyOverlapPx - ctx.baselineBodyOverlap,
    seam: {
      cutEdgePx: cutT.length,
      gapMeanToStubU: stubDists.length ? r3(stubDists.reduce((a, v) => a + v, 0) / stubDists.length) : null,
      gapMaxToStubU: stubDists.length ? r3(Math.max(...stubDists)) : null,
      cutEdgeOccludedByVictimFrac: cutT.length ? r3(cutOccluded / cutT.length) : null,
      interSubsegPairs: interSep.length,
      interSubsegSepMeanU: interSep.length ? r3(interSep.reduce((a, v) => a + v, 0) / interSep.length) : null,
      interSubsegSepMaxU: interSep.length ? r3(Math.max(...interSep)) : null,
    },
    holderSoleDisplacementU: 0, victimSoleDisplacementU: Math.abs(w.microDxU),
  }
  m.metricGatePass = m.fingerGapU <= WARP_GATE.fingerGapU && m.palmCentroidToCollarCentroidU <= WARP_GATE.palmCentroidDistU
    && m.distalCentroidToTargetU <= WARP_GATE.distalCentroidToTargetU && m.seam.gapMeanToStubU <= WARP_GATE.seamGapMeanU
    && m.seam.interSubsegSepMaxU <= WARP_GATE.interSeamMaxU && m.handSurvival >= WARP_GATE.handSurvival
    && m.fingerDirDeltaDeg <= WARP_GATE.fingerDirDeltaDeg
  return m
}

function drawWarpPanel(g, ctx, w, { x: px, y: py, w: pw, h, S, centerY, cand, tint }) {
  const groundY = ctx.hDisp.y
  const mapX = (wx) => px + pw / 2 + (wx - 240) * S
  const mapY = (wy) => py + (centerY === 'ground' ? h - 26 + (wy - groundY) * S : h / 2 + (wy - centerY) * S)
  g.save()
  g.beginPath(); g.rect(px, py, pw, h); g.clip()
  for (const disp of [ctx.hDisp, ctx.vDisp]) {
    g.fillStyle = 'rgba(0,0,0,0.38)'
    g.beginPath(); g.ellipse(mapX(disp.x), mapY(groundY), 11 * S, 2.5 * S, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(255,233,138,0.8)'; g.lineWidth = 1
    g.beginPath(); g.moveTo(mapX(disp.x), mapY(groundY) - 6); g.lineTo(mapX(disp.x), mapY(groundY) + 6); g.stroke()
  }
  const drawActor = (restored, disp, off, canvasOverride = null) => {
    const body = canvasOverride ?? cellCanvas(restored)
    const dw = restored.srcW * disp.scaleX * S, dh = restored.srcH * disp.scaleY * S
    const left = mapX(disp.x + off.dxU) - disp.displayOriginX * disp.scaleX * S
    const top = mapY(disp.y + off.dyU) - disp.displayOriginY * disp.scaleY * S
    g.save()
    if (disp.flipX) { g.translate(left + dw, top); g.scale(-1, 1); g.drawImage(body, 0, 0, dw, dh) }
    else g.drawImage(body, left, top, dw, dh)
    g.restore()
  }
  const ZERO = { dxU: 0, dyU: 0 }
  const trs = warpTransforms(ctx, w, cand)
  const drawSub = (i) => {
    const tr = trs[i]
    g.save()
    g.translate(mapX(tr.pivot[0] + tr.tx), mapY(tr.pivot[1] + tr.ty))
    g.rotate(Math.atan2(tr.sin, tr.cos))
    g.translate(-mapX(tr.pivot[0]), -mapY(tr.pivot[1]))
    drawActor(ctx.holderCell, ctx.hDisp, ZERO, warpCanvasOf(ctx.holderCell, i))
    g.restore()
  }
  // Base (segment erased) -> proximal -> victim (micro-dx) -> mid+hand.
  drawActor(ctx.holderCell, ctx.hDisp, ZERO, warpCanvasOf(ctx.holderCell, 'base'))
  drawSub(0)
  drawActor(ctx.victimCell, ctx.vDisp, w.victimOff)
  drawSub(1); drawSub(2)
  if (tint) {
    g.fillStyle = 'rgba(255,60,60,0.85)'
    for (const p of warpHandPts(ctx, w, trs)) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
    g.fillStyle = 'rgba(60,220,255,0.85)'
    for (const p of w.collarW) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
    g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
    const txp = mapX(w.targetWorld[0]), typ = mapY(w.targetWorld[1])
    g.beginPath(); g.moveTo(txp - 8, typ); g.lineTo(txp + 8, typ); g.moveTo(txp, typ - 8); g.lineTo(txp, typ + 8); g.stroke()
    g.strokeStyle = 'rgba(120,255,160,0.9)'; g.lineWidth = 1
    for (const tr of trs) {
      const ex = mapX(tr.pivot[0] + tr.tx), ey = mapY(tr.pivot[1] + tr.ty)
      g.beginPath(); g.arc(ex, ey, 4, 0, Math.PI * 2); g.stroke()
    }
  }
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1
  g.beginPath(); g.moveTo(px, mapY(groundY)); g.lineTo(px + pw, mapY(groundY)); g.stroke()
  g.restore()
}

function warpSheets(kind, perKind) {
  // Panels: [before (traced), seg-front identity + micro-dx, BEST warp] x facings.
  const label = (g, x, y, res, panel) => {
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`${kind} ${res.facing} hold4 ${res.w.cluster} - ${panel.name}`, x + 6, y + 14)
    g.font = '10px sans-serif'
    const m = panel.metrics
    g.fillText(m
      ? `fGap=${m.fingerGapU}u gap=${m.handGapU}u palmC=${m.palmCentroidToCollarCentroidU}u roiOv=${m.roiOverlapPx} seam=${m.seam.gapMeanToStubU}/${m.seam.interSubsegSepMaxU}u surv=${m.handSurvival} tgt=${m.distalCentroidToTargetU}u`
      : `gap=${res.baselineGapU}u (yellow ticks/shadows = unmoved entity ground points)`, x + 6, y + 28)
  }
  const render = (file, W, H, S, tint) => {
    const LH = 34, cols = 3
    const cv = createCanvas(cols * W, 2 * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    perKind.forEach((res, row) => {
      res.panels.forEach((panel, col) => {
        const x = col * W, y = row * (H + LH)
        label(g, x, y, res, panel)
        if (!panel.metrics) {
          const ZERO = { dxU: 0, dyU: 0 }
          const hc = centroid(res.ctx.handWorld), cc = centroid(res.ctx.collarWorld)
          drawPanel(g, res.ctx, { x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground', holderOff: ZERO, victimOff: ZERO, tint })
        } else {
          const hc = centroid(warpHandPts(res.ctx, res.w, warpTransforms(res.ctx, res.w, panel.cand)))
          const cc = res.w.collarCentroidW
          drawWarpPanel(g, res.ctx, res.w, { x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground', cand: panel.cand, tint })
        }
      })
    })
    writeFileSync(`${WARP_OUT_DIR}/${file}`, cv.toBuffer('image/png'))
  }
  render(`${kind}-warp-sheet.png`, 560, 300, 2, false)
  render(`${kind}-warp-zoom.png`, 460, 320, 4, true)
}

/** Gridded seed/sub-segment inspection for misc:6 (cell px, 4x crop). */
function warpSegmentInspectionSheet() {
  const r = restoreCell(HERO, 'misc:6')
  const crop = { x: 220, y: 80, w: 140, h: 80 }, S = 4, LH = 34, L = 30
  const colors = ['rgba(255,90,90,0.45)', 'rgba(255,200,60,0.45)', 'rgba(0,255,120,0.45)']
  const cv = createCanvas(L + crop.w * S + 8, LH + crop.h * S + 8), g = cv.getContext('2d')
  g.fillStyle = '#28222e'; g.fillRect(0, 0, cv.width, cv.height)
  const segN = [0, 1, 2].map((i) => alphaPoints(r).filter(([x, y]) => warpSegHas(x, y) && warpSubsegOf(x) === i).length)
  g.fillStyle = '#fff'; g.font = '12px sans-serif'
  g.fillText(`guanyu:misc:6 warp segment red=prox(${segN[0]}) amber=mid(${segN[1]}) green=hand(${segN[2]}) white+=seeds S/E/M/W`, 4, 16)
  g.drawImage(cellCanvas(r), crop.x, crop.y, crop.w, crop.h, L, LH, crop.w * S, crop.h * S)
  for (const [x, y] of alphaPoints(r)) {
    if (!warpSegHas(x, y) || x < crop.x || y < crop.y || x >= crop.x + crop.w || y >= crop.y + crop.h) continue
    g.fillStyle = colors[warpSubsegOf(x)]
    g.fillRect(L + (x - crop.x) * S, LH + (y - crop.y) * S, S, S)
  }
  g.font = '10px sans-serif'
  for (let gx = Math.ceil(crop.x / 10) * 10; gx <= crop.x + crop.w; gx += 10) {
    g.strokeStyle = 'rgba(255,255,120,0.3)'
    g.beginPath(); g.moveTo(L + (gx - crop.x) * S, LH); g.lineTo(L + (gx - crop.x) * S, LH + crop.h * S); g.stroke()
    if (gx % 20 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(gx), L + (gx - crop.x) * S - 8, LH - 4) }
  }
  for (let gy = Math.ceil(crop.y / 10) * 10; gy <= crop.y + crop.h; gy += 10) {
    g.strokeStyle = 'rgba(255,255,120,0.3)'
    g.beginPath(); g.moveTo(L, LH + (gy - crop.y) * S); g.lineTo(L + crop.w * S, LH + (gy - crop.y) * S); g.stroke()
    if (gy % 20 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(gy), 2, LH + (gy - crop.y) * S + 3) }
  }
  for (const cutX of [272, ...WARP_SUBSEG_X]) {
    g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
    g.beginPath(); g.moveTo(L + (cutX - crop.x) * S, LH); g.lineTo(L + (cutX - crop.x) * S, LH + crop.h * S); g.stroke()
  }
  g.lineWidth = 2; g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.font = '12px sans-serif'
  for (const [name, s] of Object.entries(WARP_SEEDS_PX)) {
    const ex = L + (s.x - crop.x) * S, ey = LH + (s.y - crop.y) * S
    g.beginPath(); g.moveTo(ex - 7, ey); g.lineTo(ex + 7, ey); g.moveTo(ex, ey - 7); g.lineTo(ex, ey + 7); g.stroke()
    g.fillText(name[0].toUpperCase(), ex + 8, ey - 6)
  }
  g.lineWidth = 1
  writeFileSync(`${WARP_OUT_DIR}/warp-segment-inspection.png`, cv.toBuffer('image/png'))
}

function warpMain() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  const trace = JSON.parse(readFileSync(TRACE_PATH, 'utf8'))
  mkdirSync(WARP_OUT_DIR, { recursive: true })
  const comboOf = (kind, facing) => {
    const sample = trace.core.find((c) => c.kind === kind && c.facing === facing && c.phase === 'hold4')
    if (!sample) throw new Error(`no hold4 sample for ${kind} ${facing}`)
    const ctx = buildContext(sample, landmarks)
    return { kind, facing, ctx, w: buildWarpContext(ctx), baselineGapU: r3(ctx.baselineGap.distU) }
  }
  const searches = {}
  for (const cluster of WARP_CLUSTERS) {
    const members = Object.keys(cluster.microDxU).map((kind) => comboOf(kind, 'right'))
    searches[cluster.name] = warpSearchCluster(members)
  }
  const IDENTITY = { identity: true }
  const comboOut = []
  for (const kind of WARP_KINDS) {
    const perKind = []
    for (const facing of ['right', 'left']) {
      const res = comboOf(kind, facing)
      const best = searches[res.w.cluster].best
      res.panels = [
        { name: 'before (core pin, no offset)', cand: null, metrics: null },
        { name: `seg-front identity + victim micro-dx ${res.w.microDxU}u`, cand: IDENTITY, metrics: warpExactMetrics(res.ctx, res.w, IDENTITY) },
        { name: `BEST warp (${res.w.cluster} cluster candidate)`, cand: best, metrics: warpExactMetrics(res.ctx, res.w, best) },
      ]
      perKind.push(res)
      comboOut.push({
        kind, facing, cluster: res.w.cluster, holderFrame: res.ctx.holderFrame, victimFrame: res.ctx.victimFrame,
        front: res.ctx.front, microDxU: res.w.microDxU, victimOffsetU: res.w.victimOff, targetWorld: res.w.targetWorld,
        baseline: {
          handGapU: r3(res.ctx.baselineGap.distU), bodyOverlapPx: res.ctx.baselineBodyOverlap,
          handCentroidWorld: centroid(res.ctx.handWorld).map(r3),
          distalHandCentroidWorld: res.w.distalHandCentroid.map(r3),
          collarCentroidWorldMicro: res.w.collarCentroidW.map(r3),
          neededDistalShiftU: [r3(res.w.targetWorld[0] - res.w.distalHandCentroid[0]), r3(res.w.targetWorld[1] - res.w.distalHandCentroid[1])],
          seedWorld: Object.fromEntries(Object.entries(res.w.seedWorld).map(([k, v]) => [k, v.map(r3)])),
        },
        segment: {
          px: res.w.segPx.length, boxOnlyPx: res.w.segBoxOnlyPx, subsegPx: res.w.subsegPx,
          handRoiPx: res.ctx.handWorld.length, handRoiInSegmentPx: res.w.handInSegPx, stubPx: res.w.stubPxCount,
        },
        modes: Object.fromEntries(res.panels.filter((p) => p.metrics).map((p) => [p.name, p.metrics])),
      })
    }
    warpSheets(kind, perKind)
  }
  warpSegmentInspectionSheet()
  const out = {
    hero: HERO, phase: 'hold4', kinds: WARP_KINDS, trace: TRACE_PATH, landmarks: LANDMARKS_PATH,
    clusters: WARP_CLUSTERS.map((c) => ({ name: c.name, targetRightWorld: c.targetRight, targetLeftWorld: [480 - c.targetRight[0], c.targetRight[1]], microDxU: c.microDxU, search: searches[c.name] })),
    seedsPx: WARP_SEEDS_PX, subsegCutXPx: WARP_SUBSEG_X,
    segment: 'misc:6 alpha with x>=272,y108-135 (cuff+skin forearm+hand, drape y>140 excluded) UNION landmark hand ROI x300-338,y101-123 (recovers the 47px fingertip sliver at y102-107 that the box alone would orphan in the erased base). Sub-segments: proximal x<290 pivot elbow (280,122), mid 290<=x<303 pivot mid (292,120), hand x>=303 pivot wrist (303,117); shoulder (235,120) is the fixed anchor for the proximal base angle. See warp-segment-inspection.png.',
    method: 'Holder base = restored misc:6 with segment alpha erased; victim sprite shifted by victimOff.dxU=pinSign*microDxU (holder sole 0, victim sole 3u, shadows/entity points unmoved). Warp: hand sub-segment translation solved so the distal-hand centroid (hand-ROI px cell x>=303) lands on target+(pinSign*txU,tyU) under handAngleDeg about the wrist (base angle 0 keeps fingers pointing along the holder facing); proximal/mid translations are f0/f1 fractions of it about elbow/mid, with base angles aligning shoulder->elbow\' and elbow\'->mid\' seed-chain vectors to the originals plus da0/da1 variations. Angles/tx stored right-facing-equivalent, mirrored by pinSign. Search per cluster on the 2 right-facing members, summed score: stage A handAngle -10..10x5, tx -4..4x2, ty -3..3x1 at f0=.3/f1=.65/da=0; stage B f0 {0,.15,.3,.45,.6} x f1 {.5,.65,.8,.9} (f1>f0+.15) x da0/da1 -10..10x5 around stage A. Sample score = fingerGap*2+handGap+palmCentroidDist*.6+distalToTarget*.8+cutDispMean*.5+max(0,interSepMean-.5)*1.5-segOverCollarS*.01+|handAngle|*.08 on stride-2 samples; reported modes recomputed exactly (minDistance full alpha vs micro-shifted collar). Composite: base -> proximal -> victim -> mid+hand, i.e. proximal masked behind the victim silhouette (proximalMaskedCells, cutEdgeOccludedByVictimFrac). Seam gap = per-cut-edge-point (segment cell x<276) nearest distance to the retained stub (non-segment alpha x258-271,y100-140); inter-subsegment separation = distance between originally adjacent column pairs across the x=290/303 cuts after warp (identity ~0.5u). Survival: hand px in mid/hand draw last and survive; proximal hand px (none in practice) occluded by victim cells would count lost. palm = hand-ROI px cell x<325, fingers x>=325; fingerDirDeltaDeg = angle between original and warped palm->finger centroid vectors.',
    metricGate: WARP_GATE,
    combos: comboOut,
    verdicts: WARP_VERDICTS,
  }
  writeFileSync(`${WARP_OUT_DIR}/arm-warp.json`, `${JSON.stringify(out, null, 2)}\n`)
  console.log(JSON.stringify({
    outDir: WARP_OUT_DIR,
    searches: Object.fromEntries(Object.entries(searches).map(([k, s]) => [k, { cand: s.best, score: s.clusterScore, n: s.candidateCount }])),
    rows: comboOut.map((c) => {
      const b = c.modes[Object.keys(c.modes)[1]]
      return `${c.kind}-${c.facing}(${c.cluster},micro${c.microDxU}): baseGap=${c.baseline.handGapU}u BEST fGap=${b.fingerGapU}u gap=${b.handGapU}u palmC=${b.palmCentroidToCollarCentroidU}u roiOv=${b.roiOverlapPx} seam=${b.seam.gapMeanToStubU}/${b.seam.gapMaxToStubU}u interMax=${b.seam.interSubsegSepMaxU}u surv=${b.handSurvival} tgt=${b.distalCentroidToTargetU}u fDir=${b.fingerDirDeltaDeg}deg gate=${b.metricGatePass}`
    }),
  }, null, 2))
}

// ---------------------------------------------------------------------------
// Zhang Fei arm-warp mode (--zhangfei-arm-warp). Same warp family/mechanics
// as the guanyu --arm-warp mode (warpTransforms/warpApply/warpHandPts/
// warpSegPts are hero-agnostic and reused): hand sub-segment translation is
// solved so the hand-ROI centroid lands on the cluster target (+ searched
// tweak) under a small hand angle about the wrist (base 0 = claw direction
// preserved); upper/forearm translations are f0/f1 fractions with seed-chain
// base angles. Composite: holder base (segment erased) -> upper -> victim
// (micro-dx) -> forearm+hand, so the proximal seam hides behind the victim
// where they overlap and the claw hand always draws last.
// ---------------------------------------------------------------------------

/** Lit-skin predicate on a restored cell (warm, R>G>B, reasonably bright). */
function zfSkinAt(restored, x, y) {
  const i = (y * restored.srcW + x) * 4
  const R = restored.data[i], G = restored.data[i + 1], B = restored.data[i + 2], A = restored.data[i + 3]
  return A >= 128 && R > 120 && R > G + 15 && G > B + 5
}
const zfSegHas = (x, y) => x >= ZF_SEG_BOX.xMin && y >= ZF_SEG_BOX.yMin && y <= ZF_SEG_BOX.yMax
const zfSubsegOf = (x) => (x < ZF_SUBSEG_X[0] ? 0 : x < ZF_SUBSEG_X[1] ? 1 : 2)

const zfCanvasCache = new Map()
function zfCanvasOf(restored, part) { // part: 'base' | subseg index 0/1/2
  const key = `${restored.kind}:${restored.frame}:zfwarp:${part}`
  if (!zfCanvasCache.has(key)) {
    const cv = createCanvas(restored.srcW, restored.srcH)
    const g = cv.getContext('2d')
    const im = g.createImageData(restored.srcW, restored.srcH)
    for (let y = 0; y < restored.srcH; y++) for (let x = 0; x < restored.srcW; x++) {
      const keep = part === 'base' ? !zfSegHas(x, y) : zfSegHas(x, y) && zfSubsegOf(x) === part
      if (!keep) continue
      const i = (y * restored.srcW + x) * 4
      im.data.set(restored.data.subarray(i, i + 4), i)
    }
    g.putImageData(im, 0, 0)
    zfCanvasCache.set(key, cv)
  }
  return zfCanvasCache.get(key)
}

function buildZfContext(sample, landmarks) {
  const tracedFrame = frameNameOf(sample.holder.sprite.frame) // misc:3 at hold4
  const victimFrame = frameNameOf(sample.victim.sprite.frame)
  const handLm = landmarks.frames[`${ZF_HERO}:${ZF_FRAME}`]
  const tracedHandLm = landmarks.frames[`${ZF_HERO}:${tracedFrame}`]
  const collarLm = landmarks.frames[`${sample.kind}:${victimFrame}`]
  if (!handLm || !collarLm) throw new Error(`missing landmark for ZF ${sample.kind} hold4`)
  const holderCell = restoreCell(ZF_HERO, ZF_FRAME) // misc:2 restored (forensic settled hold)
  const tracedCell = restoreCell(ZF_HERO, tracedFrame) // misc:3, status quo for the "before" panel
  const victimCell = restoreCell(sample.kind, victimFrame)
  const hDisp = sample.holder.sprite.display
  const vDisp = sample.victim.sprite.display
  const handWorld = toWorld(alphaPoints(holderCell, handLm.roi), hDisp, holderCell.srcW)
  const tracedHandWorld = tracedHandLm ? toWorld(alphaPoints(tracedCell, tracedHandLm.roi), hDisp, tracedCell.srcW) : []
  const collarWorld = toWorld(alphaPoints(victimCell, collarLm.roi), vDisp, victimCell.srcW)
  const holderBody = toWorld(alphaPoints(holderCell), hDisp, holderCell.srcW)
  const victimBody = toWorld(alphaPoints(victimCell), vDisp, victimCell.srcW)
  const front = sample.holder.sprite.depth !== sample.victim.sprite.depth
    ? (sample.holder.sprite.depth > sample.victim.sprite.depth ? 'holder' : 'victim')
    : (sample.holder.sprite.index > sample.victim.sprite.index ? 'holder' : 'victim')
  const ctx = {
    sample, kind: sample.kind, facing: sample.facing, holderFrame: ZF_FRAME, tracedFrame, victimFrame,
    handLm, tracedHandLm, collarLm, holderCell, tracedCell, victimCell, hDisp, vDisp,
    handWorld, tracedHandWorld, collarWorld, holderBody, victimBody, front,
    pinSign: Math.sign(sample.pin.dx || 1),
    holderBoot: bootGround(holderCell, hDisp), victimBoot: bootGround(victimCell, vDisp),
    collarInt: intPts(collarWorld), victimBodyInt: intPts(victimBody),
  }
  ctx.baselineGap = minDistance(handWorld, collarWorld)
  ctx.baselineTracedGap = tracedHandWorld.length ? minDistance(tracedHandWorld, collarWorld) : { distU: null }
  ctx.baselineBodyOverlap = overlapShifted(ctx.victimBodyInt, intSet(intPts(holderBody)), 0, 0)
  return ctx
}

function buildZfWarpContext(ctx) {
  const r = ctx.holderCell
  const cluster = warpClusterOf(ctx.kind)
  const microDxU = cluster.microDxU[ctx.kind]
  const victimOff = { dxU: ctx.pinSign * microDxU, dyU: 0 }
  const targetWorld = ctx.pinSign > 0 ? [...cluster.targetRight] : [480 - cluster.targetRight[0], cluster.targetRight[1]]
  const segPx = alphaPoints(r).filter(([x, y]) => zfSegHas(x, y))
  const segWorld = toWorld(segPx, ctx.hDisp, r.srcW)
  const segSub = segPx.map(([x]) => zfSubsegOf(x))
  const segSkin = segPx.map(([x, y]) => zfSkinAt(r, x, y))
  const byCell = new Map(segWorld.map((p, i) => [`${p[2]},${p[3]}`, i]))
  const boundaryPairs = []
  for (const cutX of ZF_SUBSEG_X) for (let y = ZF_SEG_BOX.yMin; y <= ZF_SEG_BOX.yMax; y++) {
    const a = byCell.get(`${cutX - 1},${y}`), b = byCell.get(`${cutX},${y}`)
    if (a !== undefined && b !== undefined) boundaryPairs.push([a, b])
  }
  const seedWorld = {}
  for (const [name, s] of Object.entries(ZF_SEEDS_PX)) {
    const wpt = toWorld([[s.x, s.y]], ctx.hDisp, r.srcW)[0]
    seedWorld[name] = [wpt[0], wpt[1]]
  }
  const handSub = ctx.handWorld.map((p) => zfSubsegOf(p[2]))
  const distalHand = ctx.handWorld.filter((p) => p[2] >= ZF_SUBSEG_X[1])
  // Stub = retained (non-segment) alpha just west of the cut in the arm band:
  // upper-arm skin + vest/beard the west seam must stay sewn to.
  const stubPx = alphaPoints(r).filter(([x, y]) => !zfSegHas(x, y) && x >= ZF_SEG_BOX.xMin - 14 && x < ZF_SEG_BOX.xMin && y >= ZF_SEG_BOX.yMin && y <= ZF_SEG_BOX.yMax)
  const baseMinusWorld = toWorld(alphaPoints(r).filter(([x, y]) => !zfSegHas(x, y)), ctx.hDisp, r.srcW)
  return {
    cluster: cluster.name, microDxU, victimOff, targetWorld,
    segPx, segWorld, segSub, segSkin, boundaryPairs, seedWorld, handSub,
    segSkinPx: segSkin.filter(Boolean).length,
    subsegPx: [0, 1, 2].map((i) => segSub.filter((s) => s === i).length),
    distalHandCentroid: centroid(distalHand),
    palmOrig: ctx.handWorld.filter((p) => p[2] < ZF_FINGER_MIN_CELL_X),
    fingerOrig: ctx.handWorld.filter((p) => p[2] >= ZF_FINGER_MIN_CELL_X),
    stubPx, stubWorld: toWorld(stubPx, ctx.hDisp, r.srcW), stubPxCount: stubPx.length,
    stubSkin: stubPx.map(([x, y]) => zfSkinAt(r, x, y)),
    cutEdgeIdx: segWorld.map((p, i) => (p[2] < ZF_SEG_BOX.xMin + 4 ? i : -1)).filter((i) => i >= 0),
    baseMinusSet: intSet(intPts(baseMinusWorld)),
    collarW: shifted(ctx.collarWorld, victimOff),
    collarCentroidW: centroid(shifted(ctx.collarWorld, victimOff)),
    victimBodySetW: absSet(ctx.victimBodyInt, victimOff),
    collarSetW: absSet(ctx.collarInt, victimOff),
    handInSegPx: ctx.handWorld.filter((p) => zfSegHas(p[2], p[3])).length,
  }
}

/** Sampled ZF search metrics (stride samples; exact metrics recomputed later). */
function zfWarpSample(ctx, w, cand) {
  const trs = warpTransforms(ctx, w, cand)
  const handT = warpHandPts(ctx, w, trs)
  const handS = handT.filter((_, i) => i % 2 === 0)
  const fingerS = handS.filter((p) => p[2] >= ZF_FINGER_MIN_CELL_X)
  const palmT = handT.filter((p) => p[2] < ZF_FINGER_MIN_CELL_X)
  const palmC = centroid(palmT)
  const distalC = centroid(handT.filter((p) => p[2] >= ZF_SUBSEG_X[1]))
  const segT = warpSegPts(w, trs)
  const cutDisp = w.cutEdgeIdx.map((i) => Math.hypot(segT[i][0] - w.segWorld[i][0], segT[i][1] - w.segWorld[i][1]))
  const interSep = w.boundaryPairs.map(([a, b]) => Math.hypot(segT[a][0] - segT[b][0], segT[a][1] - segT[b][1]))
  let segOverVictim = 0, segOverCollar = 0
  segT.forEach((p, i) => {
    if (i % 2) return
    const k = key2(Math.round(p[0] * 2), Math.round(p[1] * 2))
    if (w.victimBodySetW.has(k)) segOverVictim++
    if (w.collarSetW.has(k)) segOverCollar++
  })
  const m = {
    fingerGapU: bruteGap(fingerS, w.collarW), handGapU: bruteGap(handS, w.collarW),
    palmCentroidDistU: Math.hypot(palmC[0] - w.collarCentroidW[0], palmC[1] - w.collarCentroidW[1]),
    distalToTargetU: Math.hypot(distalC[0] - w.targetWorld[0], distalC[1] - w.targetWorld[1]),
    cutDispMeanU: cutDisp.length ? cutDisp.reduce((a, v) => a + v, 0) / cutDisp.length : 0,
    interSepMeanU: interSep.length ? interSep.reduce((a, v) => a + v, 0) / interSep.length : 0,
    segOverVictimS: segOverVictim, segOverCollarS: segOverCollar,
  }
  // Same score shape as the guanyu warp: finger/palm contact first, forensic
  // target fidelity, seam travel, and a claw-direction (small hand angle) bias.
  m.score = m.fingerGapU * 2 + m.handGapU + m.palmCentroidDistU * 0.6 + m.distalToTargetU * 0.8
    + m.cutDispMeanU * 0.5 + Math.max(0, m.interSepMeanU - 0.5) * 1.5 - m.segOverCollarS * 0.01
    + Math.abs(cand.handAngleDeg ?? 0) * 0.08
  return m
}

/** Per-cluster staged search on the 2 right-facing members (left mirrors). */
function zfWarpSearchCluster(members) {
  const sumScore = (cand) => members.reduce((a, m) => a + zfWarpSample(m.ctx, m.w, cand).score, 0)
  let count = 0, best = null
  const consider = (cand) => { count++; const s = sumScore(cand); if (!best || s < best.score) best = { cand, score: s } }
  for (const handAngleDeg of [-10, -5, 0, 5, 10])
    for (const txU of [-4, -2, 0, 2, 4]) for (const tyU of [-3, -2, -1, 0, 1, 2, 3])
      consider({ handAngleDeg, txU, tyU, da0Deg: 0, da1Deg: 0, f0: 0.3, f1: 0.65 })
  const stageA = { ...best }
  for (const f0 of [0, 0.15, 0.3, 0.45, 0.6]) for (const f1 of [0.5, 0.65, 0.8, 0.9]) {
    if (f1 <= f0 + 0.15) continue
    for (const da0Deg of [-10, -5, 0, 5, 10]) for (const da1Deg of [-10, -5, 0, 5, 10])
      consider({ ...stageA.cand, f0, f1, da0Deg, da1Deg })
  }
  return { best: best.cand, clusterScore: r3(best.score), stageABest: stageA.cand, candidateCount: count }
}

/** Exact metrics for one ZF warp candidate (full alpha, victim micro-dx on). */
function zfWarpExactMetrics(ctx, w, cand) {
  const r = ctx.holderCell
  const trs = warpTransforms(ctx, w, cand)
  const handT = warpHandPts(ctx, w, trs)
  const segT = warpSegPts(w, trs)
  const fingerT = handT.filter((p) => p[2] >= ZF_FINGER_MIN_CELL_X)
  const palmT = handT.filter((p) => p[2] < ZF_FINGER_MIN_CELL_X)
  const palmC = centroid(palmT), fingerC = centroid(fingerT)
  const distalC = centroid(handT.filter((p) => p[2] >= ZF_SUBSEG_X[1]))
  const handC = centroid(handT)
  const palmOrigC = centroid(w.palmOrig), fingerOrigC = centroid(w.fingerOrig)
  const dirDelta = (() => {
    const v = [fingerOrigC[0] - palmOrigC[0], fingerOrigC[1] - palmOrigC[1]]
    const u = [fingerC[0] - palmC[0], fingerC[1] - palmC[1]]
    return Math.abs(Math.atan2(v[0] * u[1] - v[1] * u[0], v[0] * u[0] + v[1] * u[1]) * 180 / Math.PI)
  })()
  const handSet = intSet(intPts(handT))
  let roiOverlapPx = 0
  for (const k of w.collarSetW) if (handSet.has(k)) roiOverlapPx++
  // Survival: forearm+hand sub-segments draw last; upper (no hand px in
  // practice) would be occluded by the victim. Segment visibility likewise.
  let handOccluded = 0
  handT.forEach((p, i) => {
    if (w.handSub[i] === 0 && w.victimBodySetW.has(key2(Math.round(p[0] * 2), Math.round(p[1] * 2)))) handOccluded++
  })
  const holderUnion = new Set(w.baseMinusSet)
  let segOverVictim = 0, segOverCollar = 0, segVisibleCells = 0, proxMaskedCells = 0
  const segKeys = new Set()
  segT.forEach((p, i) => {
    const k = key2(Math.round(p[0] * 2), Math.round(p[1] * 2))
    holderUnion.add(k)
    if (segKeys.has(k)) return
    segKeys.add(k)
    const overV = w.victimBodySetW.has(k)
    if (overV) segOverVictim++
    if (w.collarSetW.has(k)) segOverCollar++
    if (w.segSub[i] === 0 && overV) proxMaskedCells++; else segVisibleCells++
  })
  let bodyOverlapPx = 0
  for (const k of w.victimBodySetW) if (holderUnion.has(k)) bodyOverlapPx++
  // Seam + skin continuity: per cut-edge point (segment x<xMin+4), nearest
  // retained-stub point by world distance; skin match = both px pass the
  // lit-skin predicate; color delta = mean |dRGB| to that stub px.
  const cutT = w.cutEdgeIdx.map((i) => segT[i])
  const rgbOf = (x, y) => { const i = (y * r.srcW + x) * 4; return [r.data[i], r.data[i + 1], r.data[i + 2]] }
  const stubDists = [], stubNearIdx = []
  cutT.forEach((p) => {
    let bi = -1, bd = Infinity
    w.stubWorld.forEach((q, j) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < bd) { bd = d; bi = j } })
    stubDists.push(Math.sqrt(bd)); stubNearIdx.push(bi)
  })
  let skinCut = 0, skinMatch = 0, colorDeltaSum = 0, cutOccluded = 0
  cutT.forEach((p, ci) => {
    const si = stubNearIdx[ci]
    const segIdx = w.cutEdgeIdx[ci]
    if (w.segSkin[segIdx]) { skinCut++; if (si >= 0 && w.stubSkin[si]) skinMatch++ }
    if (si >= 0) {
      const a = rgbOf(w.segPx[segIdx][0], w.segPx[segIdx][1]), b = rgbOf(w.stubPx[si][0], w.stubPx[si][1])
      colorDeltaSum += (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3
    }
    if (w.victimBodySetW.has(key2(Math.round(p[0] * 2), Math.round(p[1] * 2)))) cutOccluded++
  })
  const interSep = w.boundaryPairs.map(([a, b]) => Math.hypot(segT[a][0] - segT[b][0], segT[a][1] - segT[b][1]))
  const m = {
    candidate: cand.identity ? { identity: true } : { handAngleDeg: cand.handAngleDeg, txU: cand.txU, tyU: cand.tyU, da0Deg: cand.da0Deg, da1Deg: cand.da1Deg, f0: cand.f0, f1: cand.f1 },
    subsegAnglesWorldDeg: trs.map((t) => t.angleWorldDeg),
    subsegTranslationsU: trs.map((t) => [r3(t.tx), r3(t.ty)]),
    fingerGapU: r3(minDistance(fingerT, w.collarW).distU),
    handGapU: r3(minDistance(handT, w.collarW).distU),
    palmGapU: r3(minDistance(palmT, w.collarW).distU),
    palmCentroidWorld: palmC.map(r3),
    palmCentroidToCollarCentroidU: r3(Math.hypot(palmC[0] - w.collarCentroidW[0], palmC[1] - w.collarCentroidW[1])),
    handCentroidWorld: handC.map(r3),
    distalHandCentroidWorld: distalC.map(r3),
    distalCentroidToTargetU: r3(Math.hypot(distalC[0] - w.targetWorld[0], distalC[1] - w.targetWorld[1])),
    handCentroidToTargetU: r3(Math.hypot(handC[0] - w.targetWorld[0], handC[1] - w.targetWorld[1])),
    fingerDirDeltaDeg: r3(dirDelta),
    roiOverlapPx, handPx: handT.length, handInSegmentPx: w.handInSegPx, fingerPx: fingerT.length, palmPx: palmT.length,
    handSurvival: handT.length ? r3((handT.length - handOccluded) / handT.length) : null,
    segmentPx: w.segPx.length, segmentSkinPx: w.segSkinPx,
    segmentSkinFrac: w.segPx.length ? r3(w.segSkinPx / w.segPx.length) : null,
    segmentCellsOverVictim: segOverVictim, segmentCellsOverCollarRoi: segOverCollar,
    segmentVisibleCells: segVisibleCells, proximalMaskedCells: proxMaskedCells,
    bodyOverlapPx, bodyOverlapDeltaPx: bodyOverlapPx - ctx.baselineBodyOverlap,
    seam: {
      cutEdgePx: cutT.length,
      gapMeanToStubU: stubDists.length ? r3(stubDists.reduce((a, v) => a + v, 0) / stubDists.length) : null,
      gapMaxToStubU: stubDists.length ? r3(Math.max(...stubDists)) : null,
      skinMatchFrac: skinCut ? r3(skinMatch / skinCut) : null,
      skinCutEdgePx: skinCut,
      colorDeltaMeanToStub: cutT.length ? r3(colorDeltaSum / cutT.length) : null,
      cutEdgeOccludedByVictimFrac: cutT.length ? r3(cutOccluded / cutT.length) : null,
      interSubsegPairs: interSep.length,
      interSubsegSepMeanU: interSep.length ? r3(interSep.reduce((a, v) => a + v, 0) / interSep.length) : null,
      interSubsegSepMaxU: interSep.length ? r3(Math.max(...interSep)) : null,
    },
    holderSoleDisplacementU: 0, victimSoleDisplacementU: Math.abs(w.microDxU),
    holderBootErrU: ctx.holderBoot?.groundErrU, victimBootErrU: ctx.victimBoot?.groundErrU,
  }
  m.metricGatePass = m.fingerGapU <= ZF_GATE.fingerGapU && m.palmCentroidToCollarCentroidU <= ZF_GATE.palmCentroidDistU
    && m.distalCentroidToTargetU <= ZF_GATE.distalCentroidToTargetU && m.seam.gapMeanToStubU <= ZF_GATE.seamGapMeanU
    && m.seam.interSubsegSepMaxU <= ZF_GATE.interSeamMaxU && m.handSurvival >= ZF_GATE.handSurvival
    && m.fingerDirDeltaDeg <= ZF_GATE.fingerDirDeltaDeg && m.seam.skinMatchFrac >= ZF_GATE.seamSkinMatchFrac
  return m
}

function drawZfPanel(g, ctx, w, { x: px, y: py, w: pw, h, S, centerY, cand, tint, before = false }) {
  const groundY = ctx.hDisp.y
  const mapX = (wx) => px + pw / 2 + (wx - 240) * S
  const mapY = (wy) => py + (centerY === 'ground' ? h - 26 + (wy - groundY) * S : h / 2 + (wy - centerY) * S)
  g.save()
  g.beginPath(); g.rect(px, py, pw, h); g.clip()
  for (const disp of [ctx.hDisp, ctx.vDisp]) {
    g.fillStyle = 'rgba(0,0,0,0.38)'
    g.beginPath(); g.ellipse(mapX(disp.x), mapY(groundY), 11 * S, 2.5 * S, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(255,233,138,0.8)'; g.lineWidth = 1
    g.beginPath(); g.moveTo(mapX(disp.x), mapY(groundY) - 6); g.lineTo(mapX(disp.x), mapY(groundY) + 6); g.stroke()
  }
  const drawActor = (restored, disp, off, canvasOverride = null) => {
    const body = canvasOverride ?? cellCanvas(restored)
    const dw = restored.srcW * disp.scaleX * S, dh = restored.srcH * disp.scaleY * S
    const left = mapX(disp.x + off.dxU) - disp.displayOriginX * disp.scaleX * S
    const top = mapY(disp.y + off.dyU) - disp.displayOriginY * disp.scaleY * S
    g.save()
    if (disp.flipX) { g.translate(left + dw, top); g.scale(-1, 1); g.drawImage(body, 0, 0, dw, dh) }
    else g.drawImage(body, left, top, dw, dh)
    g.restore()
  }
  const ZERO = { dxU: 0, dyU: 0 }
  if (before) {
    // Status quo: traced misc:3 holder + victim at the traced pin/front order.
    const actors = [
      { restored: ctx.tracedCell, disp: ctx.hDisp },
      { restored: ctx.victimCell, disp: ctx.vDisp },
    ]
    if (ctx.front === 'holder') actors.reverse()
    for (const a of actors) drawActor(a.restored, a.disp, ZERO)
    if (tint) {
      g.fillStyle = 'rgba(255,60,60,0.85)'
      for (const p of ctx.tracedHandWorld) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
      g.fillStyle = 'rgba(60,220,255,0.85)'
      for (const p of ctx.collarWorld) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
    }
  } else {
    const trs = warpTransforms(ctx, w, cand)
    const drawSub = (i) => {
      const tr = trs[i]
      g.save()
      g.translate(mapX(tr.pivot[0] + tr.tx), mapY(tr.pivot[1] + tr.ty))
      g.rotate(Math.atan2(tr.sin, tr.cos))
      g.translate(-mapX(tr.pivot[0]), -mapY(tr.pivot[1]))
      drawActor(ctx.holderCell, ctx.hDisp, ZERO, zfCanvasOf(ctx.holderCell, i))
      g.restore()
    }
    // Base (segment erased) -> proximal/upper -> victim (micro-dx) -> distal.
    drawActor(ctx.holderCell, ctx.hDisp, ZERO, zfCanvasOf(ctx.holderCell, 'base'))
    drawSub(0)
    drawActor(ctx.victimCell, ctx.vDisp, w.victimOff)
    drawSub(1); drawSub(2)
    if (tint) {
      g.fillStyle = 'rgba(255,60,60,0.85)'
      for (const p of warpHandPts(ctx, w, trs)) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
      g.fillStyle = 'rgba(60,220,255,0.85)'
      for (const p of w.collarW) g.fillRect(mapX(p[0]), mapY(p[1]), Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
      g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
      const txp = mapX(w.targetWorld[0]), typ = mapY(w.targetWorld[1])
      g.beginPath(); g.moveTo(txp - 8, typ); g.lineTo(txp + 8, typ); g.moveTo(txp, typ - 8); g.lineTo(txp, typ + 8); g.stroke()
      g.strokeStyle = 'rgba(120,255,160,0.9)'; g.lineWidth = 1
      for (const tr of trs) {
        const ex = mapX(tr.pivot[0] + tr.tx), ey = mapY(tr.pivot[1] + tr.ty)
        g.beginPath(); g.arc(ex, ey, 4, 0, Math.PI * 2); g.stroke()
      }
    }
  }
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1
  g.beginPath(); g.moveTo(px, mapY(groundY)); g.lineTo(px + pw, mapY(groundY)); g.stroke()
  g.restore()
}

function zfSheets(kind, perKind) {
  // Panels: [before (traced misc:3), misc:2 identity + micro-dx, BEST warp] x facings.
  const label = (g, x, y, res, panel) => {
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`zhangfei vs ${kind} ${res.facing} hold4 ${res.w.cluster} - ${panel.name}`, x + 6, y + 14)
    g.font = '10px sans-serif'
    const m = panel.metrics
    g.fillText(m
      ? `fGap=${m.fingerGapU}u pGap=${m.palmGapU}u palmC=${m.palmCentroidToCollarCentroidU}u roiOv=${m.roiOverlapPx} seam=${m.seam.gapMeanToStubU}/${m.seam.interSubsegSepMaxU}u skin=${m.seam.skinMatchFrac} surv=${m.handSurvival} tgt=${m.distalCentroidToTargetU}u soleV=${m.victimSoleDisplacementU}u`
      : `traced misc:3 fist gap=${res.baselineTracedGapU}u | misc:2 rest gap=${res.baselineGapU}u (yellow ticks = unmoved ground points)`, x + 6, y + 28)
  }
  const render = (file, W, H, S, tint) => {
    const LH = 34, cols = 3
    const cv = createCanvas(cols * W, 2 * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    perKind.forEach((res, row) => {
      res.panels.forEach((panel, col) => {
        const x = col * W, y = row * (H + LH)
        label(g, x, y, res, panel)
        if (panel.before) {
          const hc = res.ctx.tracedHandWorld.length ? centroid(res.ctx.tracedHandWorld) : centroid(res.ctx.handWorld)
          const cc = centroid(res.ctx.collarWorld)
          drawZfPanel(g, res.ctx, res.w, { x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground', cand: null, tint, before: true })
        } else {
          const hc = centroid(warpHandPts(res.ctx, res.w, warpTransforms(res.ctx, res.w, panel.cand)))
          const cc = res.w.collarCentroidW
          drawZfPanel(g, res.ctx, res.w, { x, y: y + LH, w: W, h: H, S, centerY: tint ? (hc[1] + cc[1]) / 2 : 'ground', cand: panel.cand, tint })
        }
      })
    })
    writeFileSync(`${ZF_OUT_DIR}/${file}`, cv.toBuffer('image/png'))
  }
  render(`${kind}-zfwarp-sheet.png`, 560, 300, 2, false)
  render(`${kind}-zfwarp-zoom.png`, 460, 320, 4, true)
}

/** Gridded seed/sub-segment/skin inspection for zhangfei misc:2 (cell px, 4x). */
function zfSegmentInspectionSheet() {
  const r = restoreCell(ZF_HERO, ZF_FRAME)
  const crop = { x: 230, y: 80, w: 150, h: 95 }, S = 4, LH = 34, L = 30
  const colors = ['rgba(255,90,90,0.45)', 'rgba(255,200,60,0.45)', 'rgba(0,255,120,0.45)']
  const cv = createCanvas(L + crop.w * S + 8, LH + crop.h * S + 8), g = cv.getContext('2d')
  g.fillStyle = '#28222e'; g.fillRect(0, 0, cv.width, cv.height)
  const segN = [0, 1, 2].map((i) => alphaPoints(r).filter(([x, y]) => zfSegHas(x, y) && zfSubsegOf(x) === i).length)
  const skinN = alphaPoints(r).filter(([x, y]) => zfSegHas(x, y) && zfSkinAt(r, x, y)).length
  g.fillStyle = '#fff'; g.font = '12px sans-serif'
  g.fillText(`zhangfei:misc:2 segment red=upper(${segN[0]}) amber=forearm(${segN[1]}) green=hand(${segN[2]}) skin=${skinN} cross=elbow(285,128) +=seeds S/E/M/W`, 4, 16)
  g.drawImage(cellCanvas(r), crop.x, crop.y, crop.w, crop.h, L, LH, crop.w * S, crop.h * S)
  for (const [x, y] of alphaPoints(r)) {
    if (!zfSegHas(x, y) || x < crop.x || y < crop.y || x >= crop.x + crop.w || y >= crop.y + crop.h) continue
    g.fillStyle = colors[zfSubsegOf(x)]
    g.fillRect(L + (x - crop.x) * S, LH + (y - crop.y) * S, S, S)
  }
  g.font = '10px sans-serif'
  for (let gx = Math.ceil(crop.x / 10) * 10; gx <= crop.x + crop.w; gx += 10) {
    g.strokeStyle = 'rgba(255,255,120,0.3)'
    g.beginPath(); g.moveTo(L + (gx - crop.x) * S, LH); g.lineTo(L + (gx - crop.x) * S, LH + crop.h * S); g.stroke()
    if (gx % 20 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(gx), L + (gx - crop.x) * S - 8, LH - 4) }
  }
  for (let gy = Math.ceil(crop.y / 10) * 10; gy <= crop.y + crop.h; gy += 10) {
    g.strokeStyle = 'rgba(255,255,120,0.3)'
    g.beginPath(); g.moveTo(L, LH + (gy - crop.y) * S); g.lineTo(L + crop.w * S, LH + (gy - crop.y) * S); g.stroke()
    if (gy % 20 === 0) { g.fillStyle = '#ffe98a'; g.fillText(String(gy), 2, LH + (gy - crop.y) * S + 3) }
  }
  for (const cutX of [ZF_SEG_BOX.xMin, ...ZF_SUBSEG_X]) {
    g.strokeStyle = '#ffe98a'; g.lineWidth = 1.5
    g.beginPath(); g.moveTo(L + (cutX - crop.x) * S, LH); g.lineTo(L + (cutX - crop.x) * S, LH + crop.h * S); g.stroke()
  }
  g.lineWidth = 2; g.strokeStyle = '#ff4040'; g.fillStyle = '#fff'; g.font = '12px sans-serif'
  const ex = L + (ZF_ELBOW_PX.x - crop.x) * S, ey = LH + (ZF_ELBOW_PX.y - crop.y) * S
  g.beginPath(); g.moveTo(ex - 9, ey); g.lineTo(ex + 9, ey); g.moveTo(ex, ey - 9); g.lineTo(ex, ey + 9); g.stroke()
  g.strokeStyle = '#fff'
  for (const [name, s] of Object.entries(ZF_SEEDS_PX)) {
    const sx = L + (s.x - crop.x) * S, sy = LH + (s.y - crop.y) * S
    g.beginPath(); g.moveTo(sx - 6, sy); g.lineTo(sx + 6, sy); g.moveTo(sx, sy - 6); g.lineTo(sx, sy + 6); g.stroke()
    g.fillText(name[0].toUpperCase(), sx + 8, sy - 6)
  }
  g.lineWidth = 1
  writeFileSync(`${ZF_OUT_DIR}/zf-segment-inspection.png`, cv.toBuffer('image/png'))
}

function zfMain() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  const trace = JSON.parse(readFileSync(ZF_TRACE_PATH, 'utf8'))
  mkdirSync(ZF_OUT_DIR, { recursive: true })
  const comboOf = (kind, facing) => {
    const sample = trace.core.find((c) => c.kind === kind && c.facing === facing && c.phase === 'hold4')
    if (!sample) throw new Error(`no zhangfei hold4 sample for ${kind} ${facing}`)
    const ctx = buildZfContext(sample, landmarks)
    return { kind, facing, ctx, w: buildZfWarpContext(ctx), baselineGapU: r3(ctx.baselineGap.distU), baselineTracedGapU: r3(ctx.baselineTracedGap.distU) }
  }
  const searches = {}
  for (const cluster of WARP_CLUSTERS) {
    const members = Object.keys(cluster.microDxU).map((kind) => comboOf(kind, 'right'))
    searches[cluster.name] = zfWarpSearchCluster(members)
  }
  const IDENTITY = { identity: true }
  const comboOut = []
  for (const kind of WARP_KINDS) {
    const perKind = []
    for (const facing of ['right', 'left']) {
      const res = comboOf(kind, facing)
      const best = searches[res.w.cluster].best
      res.panels = [
        { name: `before (traced ${res.ctx.tracedFrame}, core pin)`, cand: null, metrics: null, before: true },
        { name: `misc:2 seg-front identity + victim micro-dx ${res.w.microDxU}u`, cand: IDENTITY, metrics: zfWarpExactMetrics(res.ctx, res.w, IDENTITY) },
        { name: `BEST warp (${res.w.cluster} cluster candidate)`, cand: best, metrics: zfWarpExactMetrics(res.ctx, res.w, best) },
      ]
      perKind.push(res)
      comboOut.push({
        kind, facing, cluster: res.w.cluster, holderFrame: ZF_FRAME, tracedHolderFrame: res.ctx.tracedFrame, victimFrame: res.ctx.victimFrame,
        front: res.ctx.front, microDxU: res.w.microDxU, victimOffsetU: res.w.victimOff, targetWorld: res.w.targetWorld,
        baseline: {
          tracedMisc3HandGapU: r3(res.ctx.baselineTracedGap.distU),
          misc2RestHandGapU: r3(res.ctx.baselineGap.distU), bodyOverlapPx: res.ctx.baselineBodyOverlap,
          handCentroidWorld: centroid(res.ctx.handWorld).map(r3),
          distalHandCentroidWorld: res.w.distalHandCentroid.map(r3),
          collarCentroidWorldMicro: res.w.collarCentroidW.map(r3),
          neededDistalShiftU: [r3(res.w.targetWorld[0] - res.w.distalHandCentroid[0]), r3(res.w.targetWorld[1] - res.w.distalHandCentroid[1])],
          seedWorld: Object.fromEntries(Object.entries(res.w.seedWorld).map(([k, v]) => [k, v.map(r3)])),
          holderSoleDisplacementU: 0, victimSoleDisplacementU: 0,
          holderBootErrU: res.ctx.holderBoot?.groundErrU, victimBootErrU: res.ctx.victimBoot?.groundErrU,
        },
        segment: {
          px: res.w.segPx.length, skinPx: res.w.segSkinPx,
          skinFrac: res.w.segPx.length ? r3(res.w.segSkinPx / res.w.segPx.length) : null,
          subsegPx: res.w.subsegPx, handRoiPx: res.ctx.handWorld.length,
          handRoiInSegmentPx: res.w.handInSegPx, stubPx: res.w.stubPxCount,
        },
        modes: Object.fromEntries(res.panels.filter((p) => p.metrics).map((p) => [p.name, p.metrics])),
      })
    }
    zfSheets(kind, perKind)
  }
  zfSegmentInspectionSheet()
  const out = {
    hero: ZF_HERO, holderFrame: ZF_FRAME, tracedHolderFrameAtHold4: 'misc:3', phase: 'hold4', kinds: WARP_KINDS,
    trace: ZF_TRACE_PATH, landmarks: LANDMARKS_PATH,
    clusters: WARP_CLUSTERS.map((c) => ({ name: c.name, targetRightWorld: c.targetRight, targetLeftWorld: [480 - c.targetRight[0], c.targetRight[1]], microDxU: c.microDxU, search: searches[c.name] })),
    elbowPx: ZF_ELBOW_PX, seedsPx: ZF_SEEDS_PX, subsegCutXPx: ZF_SUBSEG_X, segmentBoxPx: ZF_SEG_BOX,
    segment: 'zhangfei misc:2 alpha with x>=270,y100-158 (bare upper-arm exit + forearm + claw hand; east of the head/beard, north of the spear shaft at y>=163). 89.7% of segment px pass the lit-skin predicate (A>=128, R>120, R>G+15, G>B+5); the rest are the arm outline/shadow, so the box is the skin segment - see zf-segment-inspection.png. Sub-segments: upper x<292 pivot elbow (285,128), forearm 292<=x<312 pivot mid (301,129), hand x>=312 pivot wrist (313,128) (= the landmark claw-hand ROI x312-355,y102-142); shoulder (255,130) anchors the proximal base angle.',
    method: 'Forensic premise: the traced zhangfei hold4 shows misc:3 (retracted fist on the shaft - the "before" panels), but the settled hold should be misc:2 (extended bare claw hand). This diagnostic restores misc:2 at the identical traced hold4 display/pin (holder (229.3,220), victim (245.3,220) right-facing; left mirrors about world x=240) WITHOUT touching runtime dispatch. Holder base = restored misc:2 with segment alpha erased; victim sprite shifted by victimOff.dxU=pinSign*microDxU (holder sole 0, victim sole |microDxU|=3u, shadows/entity points unmoved). Warp: hand sub-segment translation solved so the hand-ROI centroid lands on target+(pinSign*txU,tyU) under handAngleDeg about the wrist (base angle 0 keeps the claw palm->finger direction along the facing); upper/forearm translations are f0/f1 fractions about elbow/mid with base angles aligning shoulder->elbow\' and elbow\'->mid\' seed-chain vectors plus da0/da1. Angles/tx stored right-facing-equivalent, mirrored by pinSign. Search per cluster on the 2 right-facing members, summed score: stage A handAngle -10..10x5, tx -4..4x2, ty -3..3x1 at f0=.3/f1=.65/da=0; stage B f0 {0,.15,.3,.45,.6} x f1 {.5,.65,.8,.9} (f1>f0+.15) x da0/da1 -10..10x5. Sample score = fingerGap*2+handGap+palmCentroidDist*.6+distalToTarget*.8+cutDispMean*.5+max(0,interSepMean-.5)*1.5-segOverCollarS*.01+|handAngle|*.08 on stride-2 samples; reported modes recomputed exactly (minDistance full alpha vs micro-shifted collar). Composite: base -> upper -> victim -> forearm+hand (proximal masked behind victim: proximalMaskedCells, cutEdgeOccludedByVictimFrac). Metrics: fingerGap/palmGap = min distance from finger (hand-ROI cell x>=336) / palm (x<336) alpha to the micro-shifted collar ROI; handSurvival = hand px not painted over under that composite order; seam gap = per-cut-edge-point (segment cell x<274) nearest distance to the retained stub (non-segment alpha x256-269,y100-158), with skinMatchFrac = fraction of skin cut-edge px whose nearest stub px is also lit-skin and colorDeltaMeanToStub = mean |dRGB| to it (skin continuity across the west seam); inter-subsegment separation = distance between originally adjacent column pairs across x=292/312 after warp (identity ~0.5u); bodyOverlap = victim alpha cells coincident with (base-minus-segment union warped segment) on the 0.5u grid, delta vs the misc:2-rest no-micro baseline; sole displacement = sprite offset from the unmoved entity ground point (holder 0, victim |microDxU|<=3u). fingerDirDeltaDeg = angle between original and warped palm->finger centroid vectors (claw direction retention).',
    metricGate: ZF_GATE,
    combos: comboOut,
    verdicts: ZF_VERDICTS,
  }
  writeFileSync(`${ZF_OUT_DIR}/zhangfei-arm-warp.json`, `${JSON.stringify(out, null, 2)}\n`)
  console.log(JSON.stringify({
    outDir: ZF_OUT_DIR,
    searches: Object.fromEntries(Object.entries(searches).map(([k, s]) => [k, { cand: s.best, score: s.clusterScore, n: s.candidateCount }])),
    rows: comboOut.map((c) => {
      const b = c.modes[Object.keys(c.modes)[1]]
      return `${c.kind}-${c.facing}(${c.cluster},micro${c.microDxU}): tracedMisc3Gap=${c.baseline.tracedMisc3HandGapU}u misc2RestGap=${c.baseline.misc2RestHandGapU}u BEST fGap=${b.fingerGapU}u pGap=${b.palmGapU}u palmC=${b.palmCentroidToCollarCentroidU}u roiOv=${b.roiOverlapPx} seam=${b.seam.gapMeanToStubU}/${b.seam.gapMaxToStubU}u skin=${b.seam.skinMatchFrac} interMax=${b.seam.interSubsegSepMaxU}u surv=${b.handSurvival} tgt=${b.distalCentroidToTargetU}u fDir=${b.fingerDirDeltaDeg}deg bodyOvD=${b.bodyOverlapDeltaPx} soleV=${b.victimSoleDisplacementU}u gate=${b.metricGatePass}`
    }),
  }, null, 2))
}

function armMain() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  const trace = JSON.parse(readFileSync(TRACE_PATH, 'utf8'))
  mkdirSync(ARM_OUT_DIR, { recursive: true })
  const comboOut = []
  for (const kind of ARM_KINDS) {
    const perKind = []
    for (const facing of ['right', 'left']) {
      const sample = trace.core.find((c) => c.kind === kind && c.facing === facing && c.phase === 'hold4')
      if (!sample) throw new Error(`no hold4 sample for ${kind} ${facing}`)
      const ctx = buildContext(sample, landmarks)
      const arm = buildArmContext(ctx, ELBOW_PIVOT_PX)
      const { scoredBest, minGapBest, candidateCount } = armSearch(ctx, arm)
      const panels = [
        { name: 'before (core pin, no offset)', metrics: null },
        { name: 'seg-front identity (ang=0)', metrics: armExactMetrics(ctx, arm, { angleDeg: 0, dxU: 0, dyU: 0 }) },
        { name: 'BEST scored', metrics: armExactMetrics(ctx, arm, scoredBest) },
        { name: 'min-finger-gap (range extreme)', metrics: armExactMetrics(ctx, arm, minGapBest) },
      ]
      const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
      const res = { kind, facing, ctx, arm, panels, baselineGapU: r3(ctx.baselineGap.distU) }
      perKind.push(res)
      comboOut.push({
        kind, facing, holderFrame: ctx.holderFrame, victimFrame: ctx.victimFrame, front: ctx.front,
        baseline: {
          handGapU: r3(ctx.baselineGap.distU), bodyOverlapPx: ctx.baselineBodyOverlap,
          handCentroidWorld: arm.handCentroid.map(r3), collarCentroidWorld: arm.collarCentroid.map(r3),
          fingerCentroidWorld: arm.fingerCentroid.map(r3), pivotWorld: arm.pivotWorld.map(r3),
          neededHandCentroidShiftU: [r3(arm.collarCentroid[0] - arm.handCentroid[0]), r3(arm.collarCentroid[1] - arm.handCentroid[1])],
          neededFingerCentroidShiftU: [r3(arm.collarCentroid[0] - arm.fingerCentroid[0]), r3(arm.collarCentroid[1] - arm.fingerCentroid[1])],
          // Pure rotation moves the hand centroid on a circle around the pivot;
          // this is its closest possible approach to the collar centroid.
          rotationCircleMissU: r3(Math.abs(dist(arm.pivotWorld, arm.collarCentroid) - dist(arm.pivotWorld, arm.handCentroid))),
          // Fold angle that would swing the hand centroid onto the collar
          // centroid direction (vs the +-30deg plausible-elbow budget).
          rotationFoldToCollarDeg: (() => {
            const a = [arm.handCentroid[0] - arm.pivotWorld[0], arm.handCentroid[1] - arm.pivotWorld[1]]
            const b = [arm.collarCentroid[0] - arm.pivotWorld[0], arm.collarCentroid[1] - arm.pivotWorld[1]]
            const cosA = Math.min(1, Math.max(-1, (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))))
            return r3(Math.acos(cosA) * 180 / Math.PI)
          })(),
        },
        search: { candidateCount, scoredBest, minGapBest },
        modes: Object.fromEntries(panels.filter((p) => p.metrics).map((p) => [p.name, p.metrics])),
        sensitivityPivots: ARM_PIVOT_SENSITIVITY.map((p) => {
          const a2 = buildArmContext(ctx, p)
          const s2 = armSearch(ctx, a2)
          return { pivotPx: p, segmentPx: a2.segPx.length, minGapBest: s2.minGapBest, scoredBest: s2.scoredBest }
        }),
      })
    }
    armSheets(kind, perKind)
  }
  elbowInspectionSheet()
  const out = {
    hero: HERO, phase: 'hold4', kinds: ARM_KINDS, trace: TRACE_PATH, landmarks: LANDMARKS_PATH,
    elbowPivotPx: ELBOW_PIVOT_PX, sensitivityPivotsPx: ARM_PIVOT_SENSITIVITY,
    pivotIdentification: 'Eye-identified on the gridded misc:5/misc:6 inspection renders (measure-input/zoom 6x crop x270-370/y70-150 and 3x upper-body; see elbow-pivot-inspection.png): bone axis from shoulder pauldron centre ~(235,120) cell px to wrist skin at the cuff ~(303,117) misc:6 / ~(303,112) misc:5; at x=280 the axis is y~118 inside the green sleeve (alpha ~y108-140). Pivot (280,122) sits on that axis inside the sleeve bulk, 8px east of the refined patch mask proximal cut x>=272 so a sleeve stub remains. Segment = refined patch-mask alpha with cell x>=pivot.x (forearm sleeve + hanging cuff + wrist + hand).',
    method: `At the traced core pin with NO whole-sprite offset (sole displacement 0 for both actors), the holder is drawn with segment alpha erased, then the victim, then the segment rotated about the pivot world point by angleDeg (positive=clockwise screen, y-down) and translated (dxU,dyU). Search: angle -${ARM_SEARCH.angleMaxDeg}..${ARM_SEARCH.angleMaxDeg} step ${ARM_SEARCH.angleStepDeg}, dx -${ARM_SEARCH.dxMaxU}..${ARM_SEARCH.dxMaxU} step ${ARM_SEARCH.dxStepU}, dy -${ARM_SEARCH.dyMaxU}..${ARM_SEARCH.dyMaxU} step ${ARM_SEARCH.dyStepU}, refined +-5deg/+-2u at 1deg/0.5u around the scored-best and min-finger-gap seeds. Search gaps use stride-2 hand samples (brute force vs collar alpha); every reported mode is recomputed exactly with minDistance on full alpha. fingerGap uses distal fingertips only (hand-ROI cell x>=${FINGER_MIN_CELL_X}). Score = fingerGap*2 + handGap + centroidDist*0.4 + max(0,seamDispApprox-2)*2 + |angle|*0.04 + |dx,dy|*0.25. Seam: cut edge = segment px with cell x<pivot.x+4; displacement = |T(p)-p| per cut-edge px; gapMean/gapMaxToStub = per-cut-edge-point nearest distance to the retained stub (non-segment holder alpha with pivot.x-12<=x<pivot.x, y96-176), averaged/maxed (a set-to-set minimum would stay ~0 near the pivot and hide the opening at the cuff end). Hand survival: segment px draw last and always survive; non-segment hand px occluded by victim body cells count as lost. Body overlap = victim alpha cells coincident with (holder-minus-segment union transformed segment) on the 0.5u grid, delta vs the traced baseline. Far-shoulder landing has no landmark ROI and is judged visually on the zooms; collar-ROI metrics are the numeric gate.`,
    metricGate: ARM_GATE,
    combos: comboOut,
    verdicts: ARM_VERDICTS,
  }
  writeFileSync(`${ARM_OUT_DIR}/arm-transform.json`, `${JSON.stringify(out, null, 2)}\n`)
  console.log(JSON.stringify({
    outDir: ARM_OUT_DIR,
    rows: comboOut.map((c) => {
      const b = c.modes['BEST scored'], mg = c.modes['min-finger-gap (range extreme)']
      return `${c.kind}-${c.facing}: baseGap=${c.baseline.handGapU}u needShift=${c.baseline.neededHandCentroidShiftU} circleMiss=${c.baseline.rotationCircleMissU}u BEST ang=${b.transform.angleDeg} dx=${b.transform.dxU} dy=${b.transform.dyU} fingerGap=${b.fingerGapU}u gap=${b.handGapU}u roiOv=${b.roiOverlapPx} seamGapMean/Max=${b.seam.gapMeanToStubU}/${b.seam.gapMaxToStubU}u seamMax=${b.seam.cutEdgeMaxDisplacementU}u surv=${b.handSurvival} bodyOvD=${b.bodyOverlapDeltaPx} gate=${b.metricGatePass} | minGap ang=${mg.transform.angleDeg} dx=${mg.transform.dxU} dy=${mg.transform.dyU} fingerGap=${mg.fingerGapU}u seamMax=${mg.seam.cutEdgeMaxDisplacementU}u | sensMinFinger=${c.sensitivityPivots.map((s) => s.minGapBest.fingerGapU).join('/')}`
    }),
  }, null, 2))
}

function main() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  const trace = JSON.parse(readFileSync(TRACE_PATH, 'utf8'))
  mkdirSync(OUT_DIR, { recursive: true })
  const combos = []
  for (const kind of KINDS) {
    const perKind = []
    for (const facing of ['right', 'left']) {
      const sample = trace.core.find((c) => c.kind === kind && c.facing === facing && c.phase === 'hold4')
      if (!sample) throw new Error(`no hold4 sample for ${kind} ${facing}`)
      const ctx = buildContext(sample, landmarks)
      const { coarse, refined, scoredBest } = search(ctx)
      const override = VISUAL_OVERRIDES[kind] ?? {}
      const chosen = (override.sepU !== undefined || override.dyRelU !== undefined)
        ? { ...evaluate(ctx, override.sepU ?? scoredBest.sepU, override.dyRelU ?? scoredBest.dyRelU), source: 'visual-override' }
        : { ...scoredBest, source: 'score' }
      const strategies = STRATEGIES.map((st) => strategyReport(ctx, chosen, st))
      // Default rule: a small separation (<=6u) rides on the victim only and
      // keeps the player hero's feet planted; a large one is split so no
      // single sprite pops more than sep/2 from its shadow/entity point.
      const defaultStrategy = chosen.sepU <= 6 ? 'victim-only' : 'split'
      const recommendation = {
        strategy: override.strategy ?? defaultStrategy,
        sepU: chosen.sepU, dyRelU: chosen.dyRelU, source: chosen.source,
        note: override.note ?? (defaultStrategy === 'victim-only'
          ? 'sep<=6u: victim-only keeps the hero planted; victim sole shift is within its shadow width.'
          : 'sep>6u: split halves the per-sprite pop from the unmoved shadows/entity points.'),
      }
      const res = {
        kind, facing, ctx, recommendation, strategies,
        baseline: {
          gapU: r3(ctx.baselineGap.distU), gapPairWorld: ctx.baselineGap.pair,
          bodyOverlapPx: ctx.baselineBodyOverlap, front: ctx.front,
          holderBootErrU: ctx.holderBoot?.groundErrU, victimBootErrU: ctx.victimBoot?.groundErrU,
          pin: sample.pin,
        },
        chosen,
        candidates: { coarse, refined },
      }
      // Patch prototype: before / offset-only / patch at the recommended sep
      // and at the minimal gap-passing sep (same strategy shares + dy).
      const ZERO = { dxU: 0, dyU: 0 }
      const recRep = strategies.find((s) => s.strategy === recommendation.strategy)
      const stratObj = STRATEGIES.find((s) => s.name === recommendation.strategy)
      const minSep = minGapPassSep(ctx, chosen.dyRelU)
      const minRep = minSep === null ? recRep
        : strategyReport(ctx, evaluate(ctx, minSep, chosen.dyRelU), stratObj)
      const mkPanel = (name, rep, hOff, vOff, patchOn) => ({
        name, sole: rep, metrics: modeMetrics(ctx, hOff, vOff, patchOn),
      })
      const baseRep = strategyReport(ctx, evaluate(ctx, 0, 0), stratObj)
      res.patchPanels = [
        mkPanel('before (no offset)', baseRep, ZERO, ZERO, false),
        mkPanel(`offset-only ${recommendation.strategy} sep=${chosen.sepU}`, recRep, recRep.holderOffsetU, recRep.victimOffsetU, false),
        mkPanel(`PATCH ${recommendation.strategy} sep=${chosen.sepU}`, recRep, recRep.holderOffsetU, recRep.victimOffsetU, true),
        mkPanel(`PATCH ${recommendation.strategy} minSep=${minSep}`, minRep, minRep.holderOffsetU, minRep.victimOffsetU, true),
      ]
      res.patch = {
        strategy: recommendation.strategy, recommendedSepU: chosen.sepU, minGapPassSepU: minSep,
        maskAlphaPx: ctx.patchPx.length, forensicBoxAlphaPx: ctx.patchBoxPx,
        handRoiPx: ctx.handWorld.length, handRoiInMaskPx: ctx.handInPatchPx,
        modes: Object.fromEntries(res.patchPanels.map((p) => [p.name, {
          ...p.metrics,
          holderSoleDisplacementU: p.sole.holderSole.displacementU,
          victimSoleDisplacementU: p.sole.victimSole.displacementU,
        }])),
        verdict: PATCH_VERDICTS[kind] ?? null,
      }
      combos.push(res)
      perKind.push(res)
    }
    kindSheets(kind, perKind)
    patchSheets(kind, perKind)
  }
  patchMaskSheet(combos[0].ctx)
  const out = {
    hero: HERO, phase: 'hold4', trace: TRACE_PATH, landmarks: LANDMARKS_PATH,
    gapPassU: GAP_PASS_U, specGapPassU: SPEC_GAP_PASS_U,
    method: 'Offsets are presentation-only sprite translations in world units (entity x/y, depth and shadows stay at the traced values). sepU increases holder<->victim separation along the pin axis (the traced hand overshoots the collar, so closing the gap separates the sprites); dyRelU in [-2,2] is the relative lane shift distributed with the same shares as sepU (victim +share*dy, holder -share*dy). Gap/ROI-overlap/body-overlap depend only on the relative shift and were searched once per combo (coarse sep 0..40x1u, dy -2..2x1u; refine +-1u x0.25u around the scored best). Search gap is exact when <=3u (3u-bucket search) and null/gapOverCap above 3u; every reported strategy gap was recomputed exactly with per-actor offsets via minDistance from paired-contact-measure.mjs. ROI/body overlap count coincident 0.5u world cells (same grid as overlapCount). Body overlap is an interpenetration PROXY: the front actor occludes in projection, so only its CHANGE vs baseline is meaningful. Sole displacement is the sprite offset itself (rigid translation) measured from the unmoved entity ground point where the shadow renders; groundErrU adds the dy share to the baseline boot error. Score = gap*2 + |roiOverlap-40|*0.04 + max(0,bodyOverlapDelta)*0.002 + |dy|*0.4 + sep*0.03. lidian excluded: baseline gap 2.5u already passes the 3u spec gate.',
    tradeoffs: 'foot/shadow: the shadow and depth (y-sort) stay at the entity point, so any strategy reads as feet sliding away from the shadow by up to maxSoleDisplacementU, and a dy share also floats/sinks the sole vs the ground line (groundErrU) while depth ordering still sorts by unmoved entity y - keep |dy|<=2 so a lane-shifted sprite never crosses a neighbour lane\'s sort band. holder-only preserves the victim (and its pin) exactly but pops the PLAYER hero sepU from its input position; victim-only preserves the hero but the grabbed victim visibly slides from where the grab connected; split halves both pops and is the least noticeable per sprite at large sep, at the cost of BOTH sprites leaving their shadows.',
    combos: combos.map(({ ctx, ...res }) => res),
    recommendations: Object.fromEntries(KINDS.map((kind) => {
      const r = combos.find((c) => c.kind === kind && c.facing === 'right')
      const rep = r.strategies.find((s) => s.strategy === r.recommendation.strategy)
      return [kind, {
        ...r.recommendation,
        right: { holderOffsetU: rep.holderOffsetU, victimOffsetU: rep.victimOffsetU },
        left: (() => { const l = combos.find((c) => c.kind === kind && c.facing === 'left'); const lr = l.strategies.find((s) => s.strategy === l.recommendation.strategy); return { holderOffsetU: lr.holderOffsetU, victimOffsetU: lr.victimOffsetU } })(),
        exactGapU: rep.exactGapU, roiOverlapPx: rep.roiOverlapPx,
        bodyOverlapDeltaPx: rep.bodyOverlapDeltaPx, maxSoleDisplacementU: rep.maxSoleDisplacementU,
      }]
    })),
  }
  writeFileSync(`${OUT_DIR}/offset-search.json`, `${JSON.stringify(out, null, 2)}\n`)
  const patchOut = {
    hero: HERO, phase: 'hold4', holderFrame: combos[0].holderFrame ?? combos[0].ctx.holderFrame,
    mask: 'Refined from forensic box x>=248,y100-176 on the restored guanyu misc:6 cell (448x288): y96-115 x>=295 (wrist+hand; top extended to y96 so the landmark hand ROI finger sliver survives; polearm gold ornament x272-292 excluded), y116-159 x>=272 (sleeve+cuff east of beard), y160-172 x>=280 (hanging cuff tip). Raw box also contains beard, robe front and polearm shaft - see patch-mask.png. Layer order in patch mode: holder, victim, patch at the identical holder transform (flipX included), so left facings mirror exactly like the base sprite.',
    method: 'Modes per combo: before (traced placement/front order), offset-only (per-victim recommended strategy+sep from the offset search), PATCH at that sep, PATCH at minGapPassSepU (smallest 0.5u-step sep at the chosen dy with capped-exact gap<=2u, same strategy shares). exactGapU recomputed with per-actor offsets via minDistance. handSurvival = hand-ROI source px not painted over by victim alpha on the shared 0.5u world grid (victim is front in all hold4 combos); masked px redrawn by the patch count as survived (handRescuedByPatchPx). patchCellsOverVictim/Collar count distinct 0.5u patch cells landing on victim body / collar ROI. Sole displacement = sprite offset from the unmoved entity ground point (patch adds none).',
    combos: combos.map((c) => ({ kind: c.kind, facing: c.facing, front: c.ctx.front, patch: c.patch })),
    verdicts: PATCH_VERDICTS,
  }
  writeFileSync(`${OUT_DIR}/patch-search.json`, `${JSON.stringify(patchOut, null, 2)}\n`)
  console.log(JSON.stringify({
    patchRows: combos.map((c) => {
      const m = c.patch.modes
      const keys = Object.keys(m)
      return `${c.kind}-${c.facing}: surv before=${m[keys[0]].handSurvival} offset=${m[keys[1]].handSurvival} patch@rec=${m[keys[2]].handSurvival} patch@minSep(${c.patch.minGapPassSepU})=${m[keys[3]].handSurvival} gapRec=${m[keys[2]].exactGapU} overCollar=${m[keys[2]].patchCellsOverCollarRoi}/${m[keys[3]].patchCellsOverCollarRoi} handInMask=${c.patch.handRoiInMaskPx}/${c.patch.handRoiPx}`
    }),
  }, null, 2))
  console.log(JSON.stringify({
    outDir: OUT_DIR,
    rows: combos.map((c) => {
      const rec = c.strategies.find((s) => s.strategy === c.recommendation.strategy)
      return `${c.kind}-${c.facing}: baseGap=${c.baseline.gapU}u sep=${c.chosen.sepU} dy=${c.chosen.dyRelU} (${c.chosen.source}) gap=${rec.exactGapU}u roiOv=${rec.roiOverlapPx} bodyOvD=${rec.bodyOverlapDeltaPx} rec=${c.recommendation.strategy} maxSole=${rec.maxSoleDisplacementU}u`
    }),
  }, null, 2))
}

if (process.argv.includes('--zhangfei-arm-warp')) zfMain()
else if (process.argv.includes('--arm-warp')) warpMain()
else if (process.argv.includes('--arm-transform')) armMain()
else main()
