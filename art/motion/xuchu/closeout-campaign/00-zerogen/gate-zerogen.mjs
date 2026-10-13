// CMR-15A CLOSEOUT AMENDMENT — zero-generation gates for existing walk:0 / walk:1
// original candidate-2 cells, plus salvage-for-the-record on rejected 02/03 raws.
// NO generation, NO ledger writes. Frozen brief band from accepted walk:2 anchor
// (893c90d7…): weapon 130.79u, band [124.41,137.50]u, angle -26.31°, groundY 500@512,
// body 459px@512. uPerPx = 130.79…/503.12… = 124/477 (campaign convention).
// Authorized registration (amendment salvage step 1): ONE deterministic uniform
// scale+translate of the WHOLE cell/candidate — scale factor = 459 / bodyHeightPx
// (body to frozen 459px), then translate so ground lands on 500@512. Factor must be
// within ±4%; after it, ground error is 0u by construction and is recorded, not hidden.
// Landmarks were read from the full cells + the grid/zoom evidence this script emits.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const dir = 'art/motion/xuchu/closeout-campaign/00-zerogen/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // accepted walk:2 @512
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

function alphaStats(png) {
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, leftEdge = 0, rightEdge = 0
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] >= 16) {
      if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
      if (x === 0) leftEdge++; if (x === png.width - 1) rightEdge++
    }
  }
  return { xmin, ymin, xmax, ymax, leftEdgePx: leftEdge, rightEdgePx: rightEdge }
}
function beardGap(png, tip) { // clear transparent run directly below beard-tip column
  let gap = 0
  for (let y = tip[1] + 1; y < Math.min(png.height, tip[1] + 80); y++) {
    if (png.data[(y * png.width + tip[0]) * 4 + 3] < 16) gap++; else break
  }
  return gap
}
function zoom(img, x, y, w, h, s, out) {
  const cv = createCanvas(w * s, h * s); const g = cv.getContext('2d')
  g.drawImage(img, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(dir + out, cv.toBuffer('image/png'))
}

// ---------------- walk:0 / walk:1 zero-gen cells ----------------
const CELLS = {
  walk0: {
    key: 'walk:0', phase: 'Guard / bookend (double support)',
    path: 'art/motion/xuchu/closeout-campaign/refs/walk0-original-cell.png',
    pin: '6bfff0f6aa45105fd34c758e5900dd321f7c2079369faaf42dafdcad24c53eca',
    weapon: { butt: [58, 318], frameExit: [511, 120] }, beardTip: [285, 128],
    gaitBasis: 'Both boots flat on the same sole row (ymax 498), clearly separated, knees soft, torso upright — matches the walk:0 Guard/bookend double-support role in CAMPAIGN (a).',
  },
  walk1: {
    key: 'walk:1', phase: 'Contact-A',
    path: 'art/motion/xuchu/closeout-campaign/refs/walk1-original-cell.png',
    pin: '98c283b5283c1f87252a35f1a41c1b4aedf7844bd9fb0c191beb592c684e429d',
    weapon: { butt: [52, 325], frameExit: [511, 140] }, beardTip: [292, 138],
    gaitBasis: 'Screen-right boot flat forward (front contact), screen-left boot extended rear with toe down / heel raised at the same ground row (trailing toe-off) — matches the walk:1 Contact-A role; screen support arrangement differs from accepted walk:2 Passing-B (sole centre support + tucked passing leg), so it does not duplicate walk:2. Full-cycle alternation still requires walk:3/4/5, which are not banked; this cell alone neither proves nor breaks it.',
  },
}
const cellsOut = {}
for (const [name, c] of Object.entries(CELLS)) {
  const buf = readFileSync(c.path); const png = PNG.sync.read(buf); const img = await loadImage(c.path)
  const b = alphaStats(png); const bodyH = b.ymax - b.ymin + 1
  const factor = FROZEN.bodyHeightPxAt512 / bodyH
  const within4 = Math.abs(factor - 1) <= 0.04
  const rawGroundErrU = Math.abs(b.ymax - FROZEN.groundYAt512) * U_PER_PX
  const lbPxRaw = len(c.weapon.butt, c.weapon.frameExit) // frame-exit lower bound only; true tip is off-cell
  const lbPxReg = lbPxRaw * factor; const lbU = lbPxReg * U_PER_PX
  const weaponAngle = ang(c.weapon.butt, c.weapon.frameExit)
  const gap = beardGap(png, c.beardTip)
  zoom(img, 160, 0, 220, 220, 3, `gate-${name}-head-zoom.png`)
  zoom(img, 0, 340, 512, 172, 2, `gate-${name}-legs-zoom.png`)
  zoom(img, 380, 40, 132, 180, 4, `gate-${name}-tip-zoom.png`)
  const cv = createCanvas(512, 512); const g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  g.strokeStyle = '#ff40ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(...c.weapon.butt); g.lineTo(...c.weapon.frameExit); g.stroke()
  g.fillStyle = '#ff40ff'; g.font = '12px sans-serif'; g.fillText('weapon butt->FRAME EXIT (tip clipped)', c.weapon.butt[0], c.weapon.butt[1] - 8)
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, b.ymax); g.lineTo(512, b.ymax); g.stroke(); g.fillStyle = '#00ff80'; g.fillText(`cell ground ymax=${b.ymax} (frozen 500)`, 8, b.ymax - 6)
  g.strokeStyle = '#ffe040'; g.strokeRect(b.xmin, b.ymin, b.xmax - b.xmin + 1, b.ymax - b.ymin + 1)
  g.fillStyle = '#40c0ff'; g.beginPath(); g.arc(c.beardTip[0], c.beardTip[1], 5, 0, 7); g.fill(); g.fillText('beard tip RAW', c.beardTip[0] + 8, c.beardTip[1])
  writeFileSync(dir + `gate-${name}-marked.png`, cv.toBuffer('image/png'))
  cellsOut[name] = {
    key: c.key, phaseRole: c.phase,
    input: { path: c.path, sha256: sha(buf), pinned: sha(buf) === c.pin, size: [512, 512] },
    landmarks: { weapon: c.weapon, beardTip: c.beardTip, bounds: b, crownY: b.ymin, groundY: b.ymax },
    measurements: {
      body: { heightPx: bodyH, frozenPx: 459, deltaPctVsFrozen: (bodyH - 459) / 459 * 100 },
      registration: { rule: 'uniform scale factor=459/bodyHeightPx then translate ground->500@512 (whole cell)', factor, factorPct: (factor - 1) * 100, withinPlusMinus4Pct: within4, groundErrorU_before: rawGroundErrU, groundErrorU_after: within4 ? 0 : null, bodyHeightPxAfter: within4 ? 459 : null },
      weaponFrameExitLowerBound: { rawPx: lbPxRaw, registeredPxAt512: lbPxReg, registeredU: lbU, bandU: FROZEN.weaponBandU, lowerBoundInBand: lbU >= FROZEN.weaponBandU.lo && lbU <= FROZEN.weaponBandU.hi, angleDegFrameExit: weaponAngle, angleDeltaDegVsFrozen: weaponAngle - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(c.weapon.butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), frameExit: perp(c.weapon.frameExit, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideCell: false, wholeLengthMeasurable: false },
      headEndpointRAW: { beardTip: c.beardTip, measuredClearBackgroundGapPx: gap },
    },
    verdicts: {
      identity: { verdict: 'PASS', basis: 'Full cell + head zoom: same blunt-faced helmeted dark/full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter, no other-fighter/costume drift.' },
      anatomy: { verdict: 'PASS', basis: 'Full cell + legs/head zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs.' },
      weaponCorridorLengthDirection: { verdict: 'FAIL', basis: `Blade tip CLIPPED at the cell right edge (${b.rightEdgePx} opaque px on x=511; tip zoom shows blade exiting the cell), so whole butt->tip length is UNMEASURABLE from this cell — frame-exit lower bound ${lbU.toFixed(2)}u (registered) is recorded raw and is NOT a pass. A clipped tip may not be fabricated (amendment); deterministic shaft retouch cannot restore off-cell pixels. No waiver in-batch.` },
      scaleGround: { verdict: within4 ? 'PASS (after authorized registration)' : 'FAIL', basis: `Raw ground ${b.ymax} vs frozen 500 = ${rawGroundErrU.toFixed(2)}u; body ${bodyH} vs 459px (${((bodyH - 459) / 459 * 100).toFixed(2)}%). Authorized uniform registration factor ${factor.toFixed(4)} (${((factor - 1) * 100).toFixed(2)}%, within ±4%) places ground at 500 (0u ≤1.5u) at frozen body height.` },
      seams: { verdict: 'FAIL', basis: name === 'walk1' ? `Clipped blade at right edge (${b.rightEdgePx} opaque px on x=511) plus a neighbouring cell's blade fragment intruding at the left edge (${b.leftEdgePx} opaque px on x=0) — unintended panel pixels / clipping per CAMPAIGN (c).` : `Clipped blade at right edge (${b.rightEdgePx} opaque px on x=511) — unintended panel clipping per CAMPAIGN (c).` },
      gaitPhaseMatch: { verdict: 'PASS (phase role)', basis: c.gaitBasis },
      headEndpointRAW: { verdict: 'RECORDED_RAW_NOT_A_REJECT', measuredClearBackgroundGapPx: gap, basis: 'Beard tip lies over collar/chest; clear background gap recorded raw. Reserved for batch-end UNVERIFIED_OWNER_ACCEPTED ruling only if all other gates pass + independent visual review; not a reject ground here, and it cannot rescue the failed gates above.' },
    },
    overall: 'FAIL — NOT BANKED',
    disposition: 'Does not pass ALL gates on existing pixels, so it is NOT banked zero-generation and its slot does NOT return to the second-attempt pool. It will be generated later in amendment order, briefed on the failed gates recorded here.',
  }
}

// ---------------- salvage-for-the-record: rejected 02-walk3 / 03-walk4 raws ----------------
// Amendment salvage step (1) applied honestly: whole-candidate uniform scale+translate
// (factor = 459 / bodyHeightPxAt512 from the recorded gate.json, translate ground->500@512,
// rendered at the candidates' native 1024 scale: body target 918px, ground target 1000px).
// Steps (2)/(3) are NOT applicable to a clipped tip (amendment: a clipped weapon tip may
// not be fabricated and goes directly to the second attempt), so they are not attempted.
const SALVAGE = [
  { key: 'walk:3', req: '02-walk3', bodyPxAt512: 450.5, groundPxAt512: 469.5, tipPerpPx: 38.19464525046506, angleDeltaDeg: 4.688219208645844, gaitFail: 'Front-flat/rear-toe-off is the same screen arrangement as the walk:1 original; Contact-B opposite support/occlusion vs walk:1 not proven (02-walk3/gate.json).' },
  { key: 'walk:4', req: '03-walk4', bodyPxAt512: 445, groundPxAt512: 472.5, tipPerpPx: 46.26229883314857, angleDeltaDeg: 3.525922302028242, gaitFail: 'Screen-right flat support + screen-left toe-down trailing leg — not bent forward Passing-A; opposite passing vs accepted walk:2 not proven (03-walk4/gate.json).' },
]
const salvageOut = []
for (const s of SALVAGE) {
  const path = `art/motion/xuchu/closeout-campaign/${s.req}/candidate-raw.jpg`
  const buf = readFileSync(path)
  const gate = JSON.parse(readFileSync(`art/motion/xuchu/closeout-campaign/${s.req}/gate.json`, 'utf8'))
  const factor = FROZEN.bodyHeightPxAt512 / s.bodyPxAt512
  const img = await loadImage(path)
  const cv = createCanvas(1024, 1024); const g = cv.getContext('2d')
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024)
  const groundBefore1024 = s.groundPxAt512 * 2
  const dy = 1000 - groundBefore1024 * factor // translate so scaled ground lands on 1000@1024
  g.translate(0, dy); g.scale(factor, factor); g.drawImage(img, 0, 0)
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.strokeStyle = '#00ff80'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 1000); g.lineTo(1024, 1000); g.stroke()
  g.fillStyle = '#00ff80'; g.font = '16px sans-serif'; g.fillText('registered ground 1000@1024 (=500@512)', 8, 992)
  const outName = `salvage-${s.req}-registered.png`
  writeFileSync(dir + outName, cv.toBuffer('image/png'))
  salvageOut.push({
    key: s.key, candidate: { path, sha256: sha(buf), gateShaRecorded: gate.inputs.candidate.sha256, hashMatchesGateRecord: sha(buf) === gate.inputs.candidate.sha256 },
    salvageStep1Registration: { rule: 'uniform scale factor=459/bodyHeightPxAt512 (whole candidate) then translate ground->500@512', factor, factorPct: (factor - 1) * 100, withinPlusMinus4Pct: Math.abs(factor - 1) <= 0.04, groundErrorU_before: gate.measurements.groundVsFrozen.groundedErrorU, groundErrorU_after: 0, bodyHeightPxAt512_after: 459, registeredPreview: dir + outName },
    reGateAfterRegistration: {
      scaleGround: 'PASS after registration (ground 0u, body at frozen 459px) — registration alone would have cured the recorded scale/ground FAIL',
      weapon: `STILL FAIL — blade tip clipped at frame edge; whole length remains UNMEASURABLE (frame-exit lower bound only), angle delta ${s.angleDeltaDeg.toFixed(2)}° unchanged by uniform scale, corridor tip perp ${(s.tipPerpPx * factor).toFixed(2)}px (scaled) vs 14px limit. Steps (2) shaft retouch / (3) splice cannot restore an off-frame tip; per amendment a clipped tip may not be fabricated.`,
      gait: `STILL FAIL — ${s.gaitFail} Uniform scale+translate does not change leg arrangement.`,
      seams: 'STILL FAIL — clipped blade at frame edge is unchanged by registration.',
    },
    verdict: 'REJECT status UNCHANGED (salvage-for-the-record only; not banked, not counted again, no new genuinely-unusable count)',
  })
}

const gateReport = {
  work: 'cmr15a-amend-setup-00-zerogen', zeroGeneration: true, ledgerUnchanged: 'Xu Chu 6 / global 173 (verified from art/motion/generation-budget.json; no writes)',
  frozenBriefBand: FROZEN, anchor: 'accepted walk:2 893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6',
  cells: cellsOut,
  summary: {
    'walk:0': cellsOut.walk0.overall + ' (failed: weapon clipped/unmeasurable, seams clipped blade)',
    'walk:1': cellsOut.walk1.overall + ' (failed: weapon clipped/unmeasurable, seams clipped blade + neighbouring blade fragment at left edge)',
    banked: [], slotsReturnedToSecondAttemptPool: 0,
    nextAction: 'walk:0 and walk:1 will be generated later in amendment order (after walk:5), each briefed on the failed gates above. Identity/anatomy/scale-ground(registered)/gait-phase-role pass on existing pixels and are carried into those briefs.',
  },
}
writeFileSync(dir + 'gate.json', JSON.stringify(gateReport, null, 2) + '\n')
writeFileSync(dir + 'salvage-record.json', JSON.stringify({ work: 'cmr15a-amend-setup-salvage-record', zeroGeneration: true, note: 'Salvage step (1) only, applied for the record to already-rejected candidates. REJECT status unchanged; candidates not banked and not recounted.', results: salvageOut }, null, 2) + '\n')
console.log(JSON.stringify({ walk0: { body: cellsOut.walk0.measurements.body, reg: cellsOut.walk0.measurements.registration, weaponLB: cellsOut.walk0.measurements.weaponFrameExitLowerBound, gap: cellsOut.walk0.measurements.headEndpointRAW }, walk1: { body: cellsOut.walk1.measurements.body, reg: cellsOut.walk1.measurements.registration, weaponLB: cellsOut.walk1.measurements.weaponFrameExitLowerBound, gap: cellsOut.walk1.measurements.headEndpointRAW }, salvage: salvageOut.map(s => ({ key: s.key, factor: s.salvageStep1Registration.factor })) }, null, 1))
