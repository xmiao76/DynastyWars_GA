// Paired grab-contact CORE-PIN diagnostic (CMR-23 follow-up, diagnostic only).
//
// Question: can changing only the core grab pin (victim entity x =
// holder x +/- pin; traced value 16u) make the hold4 grip read correctly?
// Unlike paired-offset-diagnostic.mjs (presentation-only sprite offsets,
// entity/shadow unmoved), a pin change moves the victim ENTITY, so the
// victim sprite, its ground shadow and its soles all translate together
// and sole-vs-shadow displacement is zero by construction. The relative
// sprite geometry at pin P equals victim-only offset sep = P - 16.
//
// For Guan Yu and Zhang Fei hold4 vs all 6 victims, both facings, this
// sweeps pin = 8..56u in 1u steps (holder fixed) using the existing canvas
// traces, and per pin reports:
//   gapU / roiOverlapPx   hand-ROI <-> collar-ROI min distance / alpha
//                         overlap (0.5u world cells, as paired-contact-measure)
//   centroidDistU         hand vs collar ROI centroid distance (distinguishes
//                         a wrist-edge graze from a palm-on-collar grasp)
//   bodyOverlapPx         whole-body alpha overlap (interpenetration proxy;
//                         front actor occludes, so read vs pin16 baseline)
//   handSurvival          fraction of hand-ROI px not painted over by the
//                         front actor (victim is front in all hold4 combos)
//   footSpanU             outermost boot-to-boot span on the ground line
//   innerFootGapU         gap between the two actors' boot x-ranges
//                         (negative = boot ranges overlap in projection)
// Boots = alpha in the 6u band above each actor's sole row (bootGround),
// x-clustered; only wide clusters count so a polearm butt near the floor
// is not read as a boot (no entity-x radius: Zhang Fei boots sit 42-63u
// from his entity x in hold4).
//
// Candidate selection (pre-registered before inspection): score =
// gap*2 + |roiOverlap-40|*0.04 + max(0, bodyOverlapDelta)*0.002
// + centroidDist*0.3 + |pin-16|*0.03 (gap>Infinity never wins). Per combo
// the scoredBest pin and the nearestGapPass pin (smallest |pin-16| with
// gap<=2u) are rendered next to the pin16 baseline; per holder a global
// pin table ranks every pin by gap-pass count then summed score. Metric
// candidates are only RECOMMENDED after the sheet/zoom inspection recorded
// in VERDICTS below (hand visibly grasps collar/shoulder, bodies neither
// detached nor interpenetrating, feet/shadows coherent).
//
// Outputs: artifacts/motion/paired/pin-diagnostic/ (JSON + sheets + zooms
// + REPORT.md). No runtime/core code is touched.
// Restoration/transform helpers are reused from paired-contact-measure.mjs.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import {
  restoreCell, cellCanvas, frameNameOf, alphaPoints, toWorld,
  overlapCount, bootGround, centroid,
} from './paired-contact-measure.mjs'

const LANDMARKS_PATH = 'art/motion/paired-contact-landmarks.json'
const OUT_DIR = 'artifacts/motion/paired/pin-diagnostic'
const HEROES = ['guanyu', 'zhangfei']
const KINDS = ['soldier', 'spearman', 'archer', 'lidian', 'xiahoudun', 'xuchu']
const PIN_BASE = 16, PIN_MIN = 8, PIN_MAX = 56
const GAP_PASS_U = 2

// Per-hero verdicts from personally inspecting the rendered before/best
// sheets + tinted zooms (filled after the first run; PENDING until then).
// Shape: { verdict, note, candidatePins: { kind: pin|null } }.
const VERDICTS = {
  guanyu: {
    verdict: 'REJECT pin-only (no global or per-victim pin)',
    note: 'Inspected all 6 sheets + zooms. At pin16 the victim overlaps Guan Yu so his reaching hand (red ROI) pokes out BEYOND the victim far side (xiahoudun/archer zooms). Raising the pin slides the victim onto the hand, but the victim is the FRONT actor, so at every scored-best pin the hand ends up behind the victim body: handSurvival 0 (archer/lidian/xuchu), 0.002 (soldier), 0.141 (xiahoudun, only a finger sliver at the neck edge). No pin shows a palm visibly grasping collar/shoulder; the green arm just disappears behind the victim neck/torso. Scored-best pins scatter 24/33/41/51/56 by victim, spearman never gap-passes (best gap 2.5u at pin55), and the mechanical global pin40 passes only 6/12 combos. Shadows move with the entity (coherent by construction) but footSpan grows to 112-123u and the pair reads as a detached facing duel, not a held grab. Pin-only cannot fix a front/back hand-plane problem.',
    candidatePins: { soldier: null, spearman: null, archer: null, lidian: null, xiahoudun: null, xuchu: null },
  },
  zhangfei: {
    verdict: 'REJECT pin-only (no pin in 8-56u passes)',
    note: 'Inspected all 6 sheets + zooms. Zero of 12 combos gap-pass (<=2u) at ANY pin 8-56u. The least-bad pins sit at the pin8 boundary (soldier pin10) with gap still 2.55-35.556u, centroidDist 18.5-51.3u and bodyOverlapDelta +995..+1489 (more interpenetration than pin16). Zooms show why: Zhang Fei hand ROI is his low spear-grip fist at his own waist/chest (red block, lidian/soldier zooms), offset from every victim collar in both axes (centroidDx +14.5..+50.2u, Dy -14.4..+6u at best pins), so a horizontal entity pin cannot align it. Sheets at pin8 still read as two fighters wrestling over weapons with no collar grasp; feet/shadows stay coherent (entity moves together) but that does not create contact. Needs pose/arm-plane work, not a pin change.',
    candidatePins: { soldier: null, spearman: null, archer: null, lidian: null, xiahoudun: null, xuchu: null },
  },
}

const r3 = (v) => (v === null || v === undefined ? null : Number(v.toFixed(3)))
const key2 = (rx, ry) => (rx + 4096) * 16384 + (ry + 4096)

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
function overlapShifted(moving, staticSet, sx2) {
  let n = 0
  for (let i = 0; i < moving.rx.length; i++) if (staticSet.has(key2(moving.rx[i] + sx2, moving.ry[i]))) n++
  return n
}

/** Exact min distance hand<->collar shifted by dx (pruned brute force on
 * squared distances; the imported minDistance hash search degenerates when
 * the sets are tens of units apart, which most swept pins are). */
function exactGapShifted(handWorld, collarWorld, dx) {
  let bestSq = Infinity
  for (const [hx, hy] of handWorld) {
    for (const [cx0, cy] of collarWorld) {
      const ddx = hx - (cx0 + dx)
      if (ddx * ddx >= bestSq) continue
      const ddy = hy - cy
      const sq = ddx * ddx + ddy * ddy
      if (sq < bestSq) bestSq = sq
    }
  }
  return Math.sqrt(bestSq)
}

/** Boot x-range (world u) of one actor at its traced placement. Boot-band
 * points are clustered in x (gap >2.5u splits); only wide clusters count,
 * so a narrow polearm butt near the floor is excluded without assuming
 * boots sit near the entity x (Zhang Fei's hold4 boots sit 42-63u away). */
function footRange(restored, display, entityX) {
  const boot = bootGround(restored, display)
  if (!boot) return null
  const pts = alphaPoints(restored).filter(([, y]) => y >= boot.soleRowPx - 11 && y <= boot.soleRowPx)
  const sorted = toWorld(pts, display, restored.srcW).sort((a, b) => a[0] - b[0])
  const clusters = []
  for (const p of sorted) {
    const last = clusters[clusters.length - 1]
    if (last && p[0] - last.max <= 2.5) { last.max = p[0]; last.pts.push(p) }
    else clusters.push({ min: p[0], max: p[0], pts: [p] })
  }
  const bootClusters = clusters.filter((c) => c.max - c.min >= 2.5 && c.pts.length >= 15)
  const world = (bootClusters.length ? bootClusters : clusters).flatMap((c) => c.pts)
  if (!world.length) return null
  void entityX
  const xs = world.map(([wx]) => wx)
  return { min: Math.min(...xs), max: Math.max(...xs), soleRowPx: boot.soleRowPx, groundErrU: boot.groundErrU, px: world.length }
}

function buildContext(hero, sample, landmarks) {
  const holderFrame = frameNameOf(sample.holder.sprite.frame)
  const victimFrame = frameNameOf(sample.victim.sprite.frame)
  const handLm = landmarks.frames[`${hero}:${holderFrame}`]
  const collarLm = landmarks.frames[`${sample.kind}:${victimFrame}`]
  if (!handLm || !collarLm) throw new Error(`missing landmark for ${hero}:${holderFrame} / ${sample.kind}:${victimFrame}`)
  const holderCell = restoreCell(hero, holderFrame)
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
    hero, sample, kind: sample.kind, facing: sample.facing, holderFrame, victimFrame,
    handLm, collarLm, holderCell, victimCell, hDisp, vDisp, handWorld, collarWorld, front,
    pinSign: Math.sign(sample.pin.dx || 1),
    holderX: sample.holder.x, groundY: sample.holder.y,
    holderBodySet: intSet(intPts(holderBody)), victimBodyInt: intPts(victimBody),
    victimBodySet: intSet(intPts(victimBody)),
    handInt: intPts(handWorld),
    handCentroid: centroid(handWorld), collarCentroid: centroid(collarWorld),
    holderFoot: footRange(holderCell, hDisp, sample.holder.x),
    victimFoot: footRange(victimCell, vDisp, sample.victim.x),
  }
  ctx.baselineBodyOverlap = overlapShifted(ctx.victimBodyInt, ctx.holderBodySet, 0)
  return ctx
}

/** All metrics for one pin: victim entity+sprite+shadow shift by (pin-16). */
function evaluatePin(ctx, pin) {
  const dx = ctx.pinSign * (pin - PIN_BASE)
  const collarShifted = ctx.collarWorld.map(([x, y, cx, cy]) => [x + dx, y, cx, cy])
  const gapDist = exactGapShifted(ctx.handWorld, ctx.collarWorld, dx)
  const roiOverlapPx = overlapCount(ctx.handWorld, collarShifted)
  const sx2 = Math.round(dx * 2)
  const bodyOverlapPx = overlapShifted(ctx.victimBodyInt, ctx.holderBodySet, sx2)
  // Hand survival against the front actor's body at this pin (check hand
  // cells against the UNSHIFTED victim set offset by -sx2: same test).
  let handSurvival = 1
  if (ctx.front === 'victim') {
    let occluded = 0
    for (let i = 0; i < ctx.handInt.rx.length; i++) if (ctx.victimBodySet.has(key2(ctx.handInt.rx[i] - sx2, ctx.handInt.ry[i]))) occluded++
    handSurvival = ctx.handInt.rx.length ? (ctx.handInt.rx.length - occluded) / ctx.handInt.rx.length : null
  }
  const cc = [ctx.collarCentroid[0] + dx, ctx.collarCentroid[1]]
  const centroidDistU = Math.hypot(ctx.handCentroid[0] - cc[0], ctx.handCentroid[1] - cc[1])
  const hf = ctx.holderFoot, vf = ctx.victimFoot
  const vFoot = vf ? { min: vf.min + dx, max: vf.max + dx } : null
  const footSpanU = hf && vFoot ? Math.max(hf.max, vFoot.max) - Math.min(hf.min, vFoot.min) : null
  const innerFootGapU = hf && vFoot
    ? (ctx.pinSign > 0 ? vFoot.min - hf.max : hf.min - vFoot.max) : null
  return {
    pinU: pin, victimEntityX: r3(ctx.holderX + ctx.pinSign * pin),
    gapU: r3(gapDist), gapPass: gapDist !== null && gapDist <= GAP_PASS_U,
    roiOverlapPx, centroidDistU: r3(centroidDistU),
    centroidDxU: r3(cc[0] - ctx.handCentroid[0]), centroidDyU: r3(cc[1] - ctx.handCentroid[1]),
    bodyOverlapPx, bodyOverlapDeltaPx: bodyOverlapPx - ctx.baselineBodyOverlap,
    handSurvival: r3(handSurvival),
    footSpanU: r3(footSpanU), innerFootGapU: r3(innerFootGapU),
    holderFootRangeU: hf ? [r3(hf.min), r3(hf.max)] : null,
    victimFootRangeU: vFoot ? [r3(vFoot.min), r3(vFoot.max)] : null,
  }
}

function score(row) {
  if (row.gapU === null) return Infinity
  return row.gapU * 2 + Math.abs(row.roiOverlapPx - 40) * 0.04
    + Math.max(0, row.bodyOverlapDeltaPx) * 0.002 + row.centroidDistU * 0.3
    + Math.abs(row.pinU - PIN_BASE) * 0.03
}

// ---------------------------------------------------------------------------
// Rendering: shadows + sprites at the SHIFTED entity positions (core pin
// semantics). Holder entity fixed; victim entity at holderX + sign*pin.
// ---------------------------------------------------------------------------

function drawPanel(g, ctx, { x: px, y: py, w, h, S, centerY, pin, tint }) {
  const dx = ctx.pinSign * (pin - PIN_BASE)
  const victimEntityX = ctx.holderX + ctx.pinSign * pin
  const vDisp = { ...ctx.vDisp, x: ctx.vDisp.x + dx }
  const mapX = (wx) => px + w / 2 + (wx - 240) * S
  const mapY = (wy) => py + (centerY === 'ground' ? h - 26 + (wy - ctx.groundY) * S : h / 2 + (wy - centerY) * S)
  g.save()
  g.beginPath(); g.rect(px, py, w, h); g.clip()
  // Ground shadows at the entity ground points (victim shadow moves WITH
  // the victim entity under a core pin change).
  for (const ex of [ctx.holderX, victimEntityX]) {
    g.fillStyle = 'rgba(0,0,0,0.38)'
    g.beginPath(); g.ellipse(mapX(ex), mapY(ctx.groundY), 11 * S, 2.5 * S, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(255,233,138,0.8)'; g.lineWidth = 1
    g.beginPath(); g.moveTo(mapX(ex), mapY(ctx.groundY) - 6); g.lineTo(mapX(ex), mapY(ctx.groundY) + 6); g.stroke()
  }
  const drawActor = (restored, disp, roi, color) => {
    const body = cellCanvas(restored)
    const dw = restored.srcW * disp.scaleX * S, dh = restored.srcH * disp.scaleY * S
    const left = mapX(disp.x) - disp.displayOriginX * disp.scaleX * S
    const top = mapY(disp.y) - disp.displayOriginY * disp.scaleY * S
    g.save()
    if (disp.flipX) { g.translate(left + dw, top); g.scale(-1, 1); g.drawImage(body, 0, 0, dw, dh) }
    else g.drawImage(body, left, top, dw, dh)
    g.restore()
    if (tint && roi) {
      g.fillStyle = color
      for (const [cx, cy] of alphaPoints(restored, roi)) {
        const mx = disp.flipX ? restored.srcW - 1 - cx : cx
        g.fillRect(mapX(disp.x) + (mx - disp.displayOriginX) * disp.scaleX * S,
          mapY(disp.y) + (cy - disp.displayOriginY) * disp.scaleY * S, Math.max(1.4, S * 0.45), Math.max(1.4, S * 0.45))
      }
    }
  }
  const actors = [
    { restored: ctx.holderCell, disp: ctx.hDisp, roi: ctx.handLm.roi, color: 'rgba(255,60,60,0.85)' },
    { restored: ctx.victimCell, disp: vDisp, roi: ctx.collarLm.roi, color: 'rgba(60,220,255,0.85)' },
  ]
  if (ctx.front === 'holder') actors.reverse()
  for (const a of actors) drawActor(a.restored, a.disp, a.roi, a.color)
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1
  g.beginPath(); g.moveTo(px, mapY(ctx.groundY)); g.lineTo(px + w, mapY(ctx.groundY)); g.stroke()
  g.restore()
}

function comboSheets(res) {
  // Panels per facing row: [before pin16, BEST scored, nearest gap-pass].
  const panelsOf = (c) => {
    const panels = [{ name: `before pin=${PIN_BASE}`, row: c.sweep.find((r) => r.pinU === PIN_BASE) }]
    panels.push({ name: `BEST scored pin=${c.scoredBest.pinU}`, row: c.scoredBest })
    if (c.nearestGapPass && c.nearestGapPass.pinU !== c.scoredBest.pinU && c.nearestGapPass.pinU !== PIN_BASE) {
      panels.push({ name: `nearest gap-pass pin=${c.nearestGapPass.pinU}`, row: c.nearestGapPass })
    }
    return panels
  }
  const label = (g, x, y, c, panel) => {
    const m = panel.row
    g.fillStyle = '#fff'; g.font = '13px sans-serif'
    g.fillText(`${c.ctx.hero} vs ${c.kind} ${c.facing} hold4 - ${panel.name}`, x + 6, y + 14)
    g.font = '11px sans-serif'
    g.fillText(`gap=${m.gapU}u roiOv=${m.roiOverlapPx} bodyOvD=${m.bodyOverlapDeltaPx} centD=${m.centroidDistU}u surv=${m.handSurvival} footSpan=${m.footSpanU}u inFootGap=${m.innerFootGapU}u`, x + 6, y + 28)
  }
  const render = (file, W, H, S, tint) => {
    const LH = 34, cols = 3
    const cv = createCanvas(cols * W, res.length * (H + LH)), g = cv.getContext('2d')
    g.fillStyle = '#1d1924'; g.fillRect(0, 0, cv.width, cv.height)
    res.forEach((c, rowIdx) => {
      panelsOf(c).forEach((panel, col) => {
        const x = col * W, y = rowIdx * (H + LH)
        label(g, x, y, c, panel)
        const dx = c.ctx.pinSign * (panel.row.pinU - PIN_BASE)
        const cy = (c.ctx.handCentroid[1] + c.ctx.collarCentroid[1]) / 2
        drawPanel(g, c.ctx, { x, y: y + LH, w: W, h: H, S, centerY: tint ? cy : 'ground', pin: panel.row.pinU, tint })
        void dx
      })
    })
    writeFileSync(`${OUT_DIR}/${file}`, cv.toBuffer('image/png'))
  }
  render(`${res[0].ctx.hero}-${res[0].kind}-sheet.png`, 560, 300, 2, false)
  render(`${res[0].ctx.hero}-${res[0].kind}-zoom.png`, 460, 320, 4, true)
}

// ---------------------------------------------------------------------------

function main() {
  const landmarks = JSON.parse(readFileSync(LANDMARKS_PATH, 'utf8'))
  mkdirSync(OUT_DIR, { recursive: true })
  const heroesOut = []
  const consoleLines = []
  for (const hero of HEROES) {
    const trace = JSON.parse(readFileSync(`artifacts/motion/paired/${hero}/canvas/trace.json`, 'utf8'))
    const combos = []
    for (const kind of KINDS) {
      const perKind = []
      for (const facing of ['right', 'left']) {
        const sample = trace.core.find((c) => c.kind === kind && c.facing === facing && c.phase === 'hold4')
        if (!sample) throw new Error(`no hold4 sample for ${hero} ${kind} ${facing}`)
        const ctx = buildContext(hero, sample, landmarks)
        const sweep = []
        for (let pin = PIN_MIN; pin <= PIN_MAX; pin++) sweep.push(evaluatePin(ctx, pin))
        const scored = sweep.map((row) => ({ ...row, score: r3(score(row)) }))
        const scoredBest = scored.reduce((a, c) => (c.score < a.score ? c : a), scored[0])
        const pass = sweep.filter((r) => r.gapPass)
        const nearestGapPass = pass.length
          ? pass.reduce((a, c) => (Math.abs(c.pinU - PIN_BASE) < Math.abs(a.pinU - PIN_BASE) ? c : a), pass[0]) : null
        const gapPassPins = pass.map((r) => r.pinU)
        const out = {
          hero, kind, facing, holderFrame: ctx.holderFrame, victimFrame: ctx.victimFrame, front: ctx.front,
          baselinePin16: sweep.find((r) => r.pinU === PIN_BASE),
          baselineBodyOverlapPx: ctx.baselineBodyOverlap,
          holderFootAtTrace: ctx.holderFoot, victimFootAtTrace: ctx.victimFoot,
          scoredBest, nearestGapPass,
          gapPassPinRange: gapPassPins.length ? [Math.min(...gapPassPins), Math.max(...gapPassPins)] : null,
          sweep,
        }
        combos.push(out)
        perKind.push({ ctx, kind, facing, sweep, scoredBest, nearestGapPass })
        consoleLines.push(`${hero}/${kind}-${facing}: pin16 gap=${out.baselinePin16.gapU} | best pin=${scoredBest.pinU} gap=${scoredBest.gapU} roiOv=${scoredBest.roiOverlapPx} centD=${scoredBest.centroidDistU} bodyOvD=${scoredBest.bodyOverlapDeltaPx} surv=${scoredBest.handSurvival} | nearestPass=${nearestGapPass?.pinU ?? 'none'} passRange=${JSON.stringify(out.gapPassPinRange)}`)
      }
      comboSheets(perKind)
    }
    // Per-holder global pin table: every pin ranked across the 12 combos.
    const globalTable = []
    for (let pin = PIN_MIN; pin <= PIN_MAX; pin++) {
      const rows = combos.map((c) => c.sweep.find((r) => r.pinU === pin))
      globalTable.push({
        pinU: pin,
        gapPassCount: rows.filter((r) => r.gapPass).length,
        worstGapU: r3(Math.max(...rows.map((r) => r.gapU ?? Infinity))),
        meanGapU: r3(rows.reduce((a, r) => a + (r.gapU ?? 0), 0) / rows.length),
        totalBodyOverlapDeltaPx: rows.reduce((a, r) => a + r.bodyOverlapDeltaPx, 0),
        scoreSum: r3(rows.reduce((a, r) => a + score(r), 0)),
      })
    }
    const globalRanked = [...globalTable].sort((a, b) => b.gapPassCount - a.gapPassCount || a.scoreSum - b.scoreSum)
    heroesOut.push({ hero, combos, globalTable, globalBest: globalRanked[0], verdict: VERDICTS[hero] })
    consoleLines.push(`${hero} GLOBAL best: pin=${globalRanked[0].pinU} pass=${globalRanked[0].gapPassCount}/12 worstGap=${globalRanked[0].worstGapU}u scoreSum=${globalRanked[0].scoreSum}; top5=${globalRanked.slice(0, 5).map((r) => `${r.pinU}:${r.gapPassCount}`).join(',')}`)
  }
  const doc = {
    diagnostic: 'core pin sweep (victim entity+sprite+shadow move together, holder fixed)',
    phase: 'hold4', pinBaseU: PIN_BASE, pinRangeU: [PIN_MIN, PIN_MAX], pinStepU: 1, gapPassU: GAP_PASS_U,
    landmarks: LANDMARKS_PATH,
    method: 'Victim display/entity x shifted by pinSign*(pin-16) from the traced hold4 sample; holder untouched. gapU = exact min hand-ROI/collar-ROI alpha distance (minDistance, paired-contact-measure); roi/body overlap count coincident 0.5u world cells; body overlap delta vs the pin16 baseline of the same combo. handSurvival = hand-ROI source px not covered by victim body alpha on the 0.5u grid (victim front in all combos). Boots = alpha in the 6u band above the bootGround sole row, x-clustered with narrow clusters (polearm butts) dropped; footSpan = outermost boot span, innerFootGap = signed gap between boot ranges along the pin direction. Score = gap*2 + |roiOv-40|*0.04 + max(0,bodyOvDelta)*0.002 + centroidDist*0.3 + |pin-16|*0.03. Sheets draw ground shadows at the shifted ENTITY positions (pin semantics), traced front order, no sprite-only offsets: sole/shadow displacement is 0 by construction at every pin.',
    heroes: heroesOut,
  }
  writeFileSync(`${OUT_DIR}/pin-diagnostic.json`, `${JSON.stringify(doc, null, 2)}\n`)
  // Human-readable report (verdicts come from VERDICTS after inspection).
  const md = ['# Core-pin diagnostic (hold4, pin 8-56u, holder fixed)', '']
  for (const h of heroesOut) {
    md.push(`## ${h.hero} — ${VERDICTS[h.hero].verdict}`, '', VERDICTS[h.hero].note, '')
    md.push(`Global-pin best (mechanical): pin=${h.globalBest.pinU} pass=${h.globalBest.gapPassCount}/12 worstGap=${h.globalBest.worstGapU}u`, '')
    md.push('| victim | candidate pin | pin16 gap | best pin (gap/roiOv/centD/bodyOvD/surv) | nearest gap-pass | gap-pass range |')
    md.push('|---|---|---|---|---|---|')
    for (const kind of KINDS) {
      const c = h.combos.find((x) => x.kind === kind && x.facing === 'right')
      const b = c.scoredBest
      md.push(`| ${kind} | ${VERDICTS[h.hero].candidatePins[kind] ?? '-'} | ${c.baselinePin16.gapU}u | ${b.pinU} (${b.gapU}u/${b.roiOverlapPx}/${b.centroidDistU}u/${b.bodyOverlapDeltaPx}/${b.handSurvival}) | ${c.nearestGapPass?.pinU ?? 'none'} | ${c.gapPassPinRange ? c.gapPassPinRange.join('-') : 'none'} |`)
    }
    md.push('', 'Facings are metric-mirror images; right-facing rows shown, both facings in JSON/sheets.', '')
  }
  writeFileSync(`${OUT_DIR}/REPORT.md`, `${md.join('\n')}\n`)
  console.log(consoleLines.join('\n'))
}

main()
