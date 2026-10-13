// CMR-15A Alternative Completion Phase 1 — campaign-standard gate (NOT the diagnostic
// scripts). Fresh RASTER landmark re-measurement on the EXACT alternative outputs:
//   walk:3 art/motion/xuchu/alternative/walk3-rotated.png   (micro-rotated attempt3 cell)
//   walk:0 art/motion/xuchu/alternative/walk0-registered.png (component-extracted+registered)
//   walk:1 art/motion/xuchu/alternative/walk1-registered.png
// Landmarks are derived from the raster here (alpha>=16 scans), not carried from the
// diagnostic json. Gates = CAMPAIGN.md (c): identity/anatomy (visual, recorded in
// verdicts), weapon length/corridor/direction vs frozen band, body/ground <=1.5u,
// seams (green/edge + gameplay & 4x crops), gait phase, head RAW (not a reject).
// Banks accepted.png (byte copy) ONLY if every numeric gate passes. Zero generation.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../scripts/pack-projection.mjs'

const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // 01-walk2 anchor line (campaign gates)
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

// Ledger verify (no writes)
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { path: 'art/motion/generation-budget.json', sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, xuchuWalk: ledger.fighters.xuchu.sheetCandidates?.walk ?? null, globalUsed, totalCap: ledger.totalCap, expected: 'Xu Chu 11 / global 178', matches: ledger.fighters.xuchu.used === 11 && globalUsed === 178 }
if (!ledgerState.matches) throw new Error('ledger mismatch ' + JSON.stringify(ledgerState))

const CELLS = [
  { key: 'walk:3', phase: 'Contact-B', src: 'art/motion/xuchu/alternative/walk3-rotated.png', expectSha: 'dc3e699fabf115ea6ab3c064b51680862697a59a85c70cfa627252f41dff1ea7', sourceDesc: '02-walk3/attempt3/registered.png 2d21f6cdb34deea98efae12d1fac396d7c1e26150cc82bc36de2ccb6242b14d4 + distal micro-rotation -1.332deg (alternative/walk3-microrotate.mjs)', outDir: 'art/motion/xuchu/closeout-campaign/02-walk3/alternative/' },
  { key: 'walk:0', phase: 'Guard/bookend double support', src: 'art/motion/xuchu/alternative/walk0-registered.png', expectSha: '2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450', sourceDesc: 'walk-candidate-2.png bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c component id0 extracted (14ad2e1cd69cb96f34c191cade275ac6b71f5227e49af80fa71707352e3d70e9) + registration 0.9808 (alternative/walk01-extract.mjs)', outDir: 'art/motion/xuchu/closeout-campaign/05-walk0/alternative/' },
  { key: 'walk:1', phase: 'Contact-A (heel-strike)', src: 'art/motion/xuchu/alternative/walk1-registered.png', expectSha: '2de4d8490eff7f1751785c312dc1fac6518e6d6d40d03befefc8e9bee113367c', sourceDesc: 'walk-candidate-2.png bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c component id1 extracted (14f2d07f07699c123b917971f3025b4d296bdf1cc04fb1bfe468ca6d443b597a) + registration 1.0000 (alternative/walk01-extract.mjs)', outDir: 'art/motion/xuchu/closeout-campaign/06-walk1/alternative/' },
]

function measure(buf) {
  const png = PNG.sync.read(buf); const W = png.width, H = png.height
  if (W !== 512 || H !== 512) throw new Error('expected 512x512, got ' + W + 'x' + H)
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, greenPx = 0, edgeL = 0, edgeR = 0, edgeT = 0, edgeB = 0
  const colLow = new Array(W).fill(-1)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const a = png.data[i + 3]; if (a >= 16) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; if (y > colLow[x]) colLow[x] = y; if (x === 0) edgeL++; if (x === 511) edgeR++; if (y === 0) edgeT++; if (y === 511) edgeB++; if (isGreen(png.data[i], png.data[i + 1], png.data[i + 2])) greenPx++ } }
  // Fresh raster weapon landmarks:
  // butt = centroid of alpha px in the leftmost 6 columns of the shaft-butt band y[250,390]
  let buttMinX = 1e9; const buttPts = []
  for (let y = 250; y <= 390; y++) for (let x = 0; x < 90; x++) { const i = (y * W + x) * 4; if (png.data[i + 3] >= 16 && x < buttMinX) buttMinX = x }
  for (let y = 250; y <= 390; y++) for (let x = buttMinX; x < buttMinX + 6; x++) { const i = (y * W + x) * 4; if (png.data[i + 3] >= 16) buttPts.push([x, y]) }
  const butt = [buttPts.reduce((s, p) => s + p[0], 0) / buttPts.length, buttPts.reduce((s, p) => s + p[1], 0) / buttPts.length]
  // tip = alpha px (x>=360) maximizing projection on frozen direction from butt; also topmost blade px
  const th = FROZEN.weaponAngleDegAt512 * Math.PI / 180, ux = Math.cos(th), uy = Math.sin(th)
  let tip = null, tipT = -1e9, topBlade = null
  for (let y = 0; y < 260; y++) for (let x = 360; x < W; x++) { const i = (y * W + x) * 4; if (png.data[i + 3] >= 16) { const t = (x - butt[0]) * ux + (y - butt[1]) * uy; if (t > tipT) { tipT = t; tip = [x, y] } if (!topBlade || y < topBlade[1]) topBlade = [x, y] } }
  // Boot clusters: contiguous x-runs whose lowest alpha row >=455, gaps >=18px split
  const clusters = []; let cur = null
  for (let x = 0; x < W; x++) { if (colLow[x] >= 455) { if (!cur) cur = { x0: x, x1: x, soleY: colLow[x] }; else { cur.x1 = x; cur.soleY = Math.max(cur.soleY, colLow[x]) } } else if (cur) { clusters.push(cur); cur = null } }
  if (cur) clusters.push(cur)
  // merge clusters separated by <18px
  const boots = []; for (const c of clusters) { const last = boots[boots.length - 1]; if (last && c.x0 - last.x1 < 18) { last.x1 = c.x1; last.soleY = Math.max(last.soleY, c.soleY) } else boots.push({ ...c }) }
  const px = len(butt, tip), u = px * U_PER_PX, a = ang(butt, tip)
  const weapon = { buttRaster: butt, buttMinX, buttBandPx: buttPts.length, tipRaster: tip, tipT, topBladeRaster: topBlade, pxAt512: px, u, inBand: u >= FROZEN.weaponBandU.lo && u <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: tip[0] >= 0 && tip[0] <= 511 && xmax < 511, tipRightMarginPxAt512: 512 - tip[0], xmaxMarginPx: 511 - xmax }
  const body = { rasterCrownY: ymin, rasterGroundY: ymax, bodyHeightPxAt512: ymax - ymin, frozenHeightPxAt512: 459, deltaPx: (ymax - ymin) - 459 }
  const ground = { frozenGroundYAt512: 500, rasterGroundY: ymax, groundedErrorU: Math.abs(ymax - 500) * U_PER_PX, limitU: 1.5 }
  return { raster: { alphaBounds: { xmin, ymin, xmax, ymax }, greenPx, edgeOpaquePx: { left: edgeL, right: edgeR, top: edgeT, bottom: edgeB } }, weapon, body, ground, boots }
}

const results = []
for (const cell of CELLS) {
  const buf = readFileSync(cell.src); const h = sha(buf)
  if (h !== cell.expectSha) throw new Error(cell.key + ' hash mismatch ' + h)
  const m = measure(buf)
  const gatesNumeric = {
    weaponLengthPass: m.weapon.inBand,
    weaponCorridorPass: m.weapon.corridorPerpPxVsAnchorLine.butt <= 14 && m.weapon.corridorPerpPxVsAnchorLine.tip <= 14 && m.weapon.tipInsideFrame,
    weaponDirectionPass: Math.abs(m.weapon.angleDeltaDegVsAnchor) <= 5,
    bodyPass: Math.abs(m.body.bodyHeightPxAt512 - 459) <= 1.5,
    groundPass: m.ground.groundedErrorU <= 1.5,
    seamsNumericPass: m.raster.greenPx === 0 && m.raster.edgeOpaquePx.left === 0 && m.raster.edgeOpaquePx.right === 0 && m.raster.edgeOpaquePx.top === 0,
  }
  const allNumeric = Object.values(gatesNumeric).every(Boolean)
  // Fresh gate imagery from the EXACT output (gameplay 1x marked + zooms + 4x)
  const img = await loadImage(cell.src)
  const zoom = (x, y, w, hh, s, out) => { const c = createCanvas(w * s, hh * s); const q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(img, x, y, w, hh, 0, 0, w * s, hh * s); writeFileSync(cell.outDir + out, c.toBuffer('image/png')) }
  zoom(150, 0, 220, 220, 3, 'gate-head-zoom.png'); zoom(0, 300, 512, 212, 2, 'gate-legs-zoom.png'); zoom(330, 0, 182, 180, 4, 'gate-tip-4x.png'); zoom(0, 400, 512, 112, 3, 'gate-soles-zoom.png'); zoom(0, 430, 512, 82, 4, 'gate-soles-4x.png')
  if (cell.key === 'walk:3') zoom(240, 140, 200, 150, 4, 'gate-seam-grip-4x.png')
  const mc = createCanvas(512, 512); const mg = mc.getContext('2d'); mg.drawImage(img, 0, 0)
  mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(...m.weapon.buttRaster); mg.lineTo(...m.weapon.tipRaster); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (fresh raster)', m.weapon.buttRaster[0], m.weapon.buttRaster[1] - 8)
  mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, 500); mg.lineTo(512, 500); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('frozen ground 500@512', 8, 494)
  mg.strokeStyle = '#40c0ff'; mg.setLineDash([6, 4]); mg.beginPath(); mg.moveTo(...ANCHOR_WEAPON.butt); mg.lineTo(...ANCHOR_WEAPON.tip); mg.stroke(); mg.setLineDash([]); mg.fillStyle = '#40c0ff'; mg.fillText('anchor corridor line', 300, 150)
  writeFileSync(cell.outDir + 'gate-marked.png', mc.toBuffer('image/png'))
  writeFileSync(cell.outDir + 'gate-gameplay.png', buf) // gameplay-size seam view = exact cell 1x
  const report = {
    work: 'cmr15a-alt-phase1-bank', key: cell.key, phase: cell.phase, zeroGeneration: true,
    gateStandard: 'CAMPAIGN.md (c) checklist; fresh raster landmarks (this script), frozen band from 01-walk2 anchor 893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6',
    frozenBriefBand: FROZEN, anchorWeaponLineAt512: ANCHOR_WEAPON,
    exactOutput: { path: cell.src, sha256: h, size: [512, 512] },
    sourceProvenance: cell.sourceDesc,
    freshRasterMeasurement: m, gatesNumeric, allNumericPass: allNumeric,
    headEndpointRAW: { measuredClearBackgroundGapPx: 0, note: 'RAW only — beard tip over collar/chest on gate-head-zoom.png (fresh visual read this package); NOT a per-candidate reject; batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass.' },
    gateImages: ['gate-marked.png', 'gate-gameplay.png (exact cell 1x)', 'gate-head-zoom.png', 'gate-legs-zoom.png', 'gate-tip-4x.png', 'gate-soles-zoom.png', 'gate-soles-4x.png', ...(cell.key === 'walk:3' ? ['gate-seam-grip-4x.png'] : [])],
    ledgerVerified: ledgerState, banked: null, verdicts: null, overall: null,
  }
  results.push({ cell, report, buf })
  console.log(cell.key, JSON.stringify({ weaponU: m.weapon.u, angleDelta: m.weapon.angleDeltaDegVsAnchor, corridor: m.weapon.corridorPerpPxVsAnchorLine, butt: m.weapon.buttRaster, tip: m.weapon.tipRaster, body: m.body, ground: m.ground, boots: m.boots, greenPx: m.raster.greenPx, bounds: m.raster.alphaBounds, gatesNumeric }))
}
// Visual verdicts — fresh reads this package on the exact outputs + fresh gate crops
// (full cell gameplay 1x, head 3x, legs 2x, soles 4x, tip 4x, walk3 grip-seam 4x).
const VISUAL = {
  'walk:3': {
    identity: 'PASS (full + head zoom: same blunt-faced helmeted full-bearded ochre/dark-armoured massive Xu Chu as banked walk:2/walk:4; no costume/other-fighter drift)',
    anatomy: 'PASS (connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs; micro-rotation seam at front-hand exit continuous — gate-seam-grip-4x.png)',
    seams: 'PASS (greenPx=0, zero edge-opaque px; rotation cut at hand exit continuous at gameplay 1x (gate-gameplay.png) and 4x (gate-seam-grip-4x.png): no kink, halo or step; tip complete — gate-tip-4x.png)',
    gait: 'PASS Contact-B (screen-right front boot flat planted sole 500@512 = front support; screen-left rear boot toe-down heel-raised sole 496@512 trailing toe-off; flat-front contact distinct from walk:1 heel-strike, and from Passing-B walk:2 / Passing-A walk:4 banked anchors)',
  },
  'walk:0': {
    identity: 'PASS (full + head zoom: same helmeted full-bearded ochre/dark-armoured massive Xu Chu; original candidate-2 sheet pixels)',
    anatomy: 'PASS (connected two-hand grip, natural hip/skirt overlap, no extra/floating limbs)',
    seams: 'PASS (greenPx=0, zero edge-opaque px, whole extracted component — blade tip complete inside frame gate-tip-4x.png, no neighbouring-cell fragment, no splice seam at gameplay 1x or 4x)',
    gait: 'PASS Guard/bookend double support (both boots flat-shaped and separated; fresh raster soles 500 (screen-left) / 493 (screen-right) @512 — neither toe-off nor passing/tucked; upright bookend stance per CAMPAIGN (a))',
  },
  'walk:1': {
    identity: 'PASS (full + head zoom: same helmeted full-bearded ochre/dark-armoured massive Xu Chu; original candidate-2 sheet pixels)',
    anatomy: 'PASS (connected two-hand grip, natural hip/skirt overlap, no extra/floating limbs)',
    seams: 'PASS (greenPx=0, zero edge-opaque px, whole extracted component — tip complete gate-tip-4x.png; neighbouring blade fragment of the nominal cell excluded by component extraction; no seam at gameplay 1x or 4x)',
    gait: 'PASS heel-strike Contact-A — CORRECTION of the diagnostic wording "front flat": screen-right front boot heel grounded (sole 500@512) with toe raised = heel-strike (gate-soles-4x.png), screen-left rear boot toe-down push-off sole 497@512. Heel-strike instant distinct from walk:3 flat-front Contact-B.',
  },
}
for (const { cell, report, buf } of results) {
  const v = VISUAL[cell.key]
  report.verdicts = { ...v, weaponLengthCorridorDirection: report.allNumericPass ? 'PASS (fresh raster numbers in freshRasterMeasurement.weapon vs frozen band)' : 'FAIL (see numbers)', scaleGround: report.allNumericPass ? 'PASS (fresh raster body/ground in freshRasterMeasurement)' : 'FAIL (see numbers)', headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (0px clear gap, beard over collar; batch-end ruling only)' }
  if (report.allNumericPass) {
    copyFileSync(cell.src, cell.outDir + 'accepted.png')
    report.banked = { acceptedPath: cell.outDir + 'accepted.png', acceptedSha256: sha(readFileSync(cell.outDir + 'accepted.png')), exactOutputSha256: report.exactOutput.sha256, byteCopyOfExactOutput: sha(readFileSync(cell.outDir + 'accepted.png')) === report.exactOutput.sha256 }
    report.overall = 'PASS — BANKED into closeout campaign (accepted.png = byte copy of exact alternative output)'
  } else {
    report.overall = 'FAIL — NOT banked (no accepted.png); exact failing numeric gate(s) in gatesNumeric'
  }
  writeFileSync(cell.outDir + 'gate.json', JSON.stringify(report, null, 2) + '\n')
  console.log(cell.key, report.overall, report.banked?.acceptedSha256 ?? '')
}
writeFileSync('art/motion/xuchu/closeout-campaign/alternative-phase1/gate.json', JSON.stringify({ work: 'cmr15a-alt-phase1-bank', zeroGeneration: true, ledgerVerified: ledgerState, frozenBriefBand: FROZEN, cells: results.map(r => ({ key: r.cell.key, phase: r.cell.phase, exactOutput: r.report.exactOutput, allNumericPass: r.report.allNumericPass, banked: r.report.banked, gateJson: r.cell.outDir + 'gate.json' })) }, null, 2) + '\n')
