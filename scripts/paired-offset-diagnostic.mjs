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

main()
