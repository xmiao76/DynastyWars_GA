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

if (process.argv.includes('--arm-transform')) armMain()
else main()
