// CMR-15A staged proof-of-control — walk:2 grant gates (ZERO new generation).
// Deterministic local splice + measurements. Visual landmarks below were read
// from opened full images and 2-4x endpoint zooms (gate-cand-*-zoom.png) in
// this package; all geometry arithmetic is computed here, nothing hand-waved.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf, fixedBandFromMedian, evaluateProjection } from '../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/proof-of-control/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')

// ---------- inputs / pins ----------
const origBuf = readFileSync(dir + 'walk2-original-cell.png')
const candBuf = readFileSync(dir + 'candidate-walk2-raw.jpg')
const pins = {
  originalSha256: '75c07dc26e3490c8de17377656eb1464066fc3e44bf9616de4d3424c1efcad0f',
  candidateSha256: '165d786b121151384e2d392f04c625b2fda6e9573f1f4fe39a977eebf1c2491a',
}
const origPng = PNG.sync.read(origBuf) // 512x512 RGBA, transparent backdrop
const candImg = await loadImage(dir + 'candidate-walk2-raw.jpg') // 1024x1024 JPEG, opaque painted backdrop
const origImg = await loadImage(dir + 'walk2-original-cell.png')

// ---------- §b regions, walk:2, cell-local 512 coords (half-open) ----------
// candidate-2 global: HEAD-BEARD (1215,35,105,135), BEARD-BASE band y110..145,
// GAIT-EDIT global (1054,260,452,242); cell origin (1024,0).
const GAIT = { x: 30, y: 260, w: 452, h: 242 }
const HEAD_BEARD = { x: 191, y: 35, w: 105, h: 135 }
const BEARD_BASE = { x: 191, y: 110, w: 105, h: 35 } // window-local y75..110
const SCALE = 2 // candidate 1024 = original cell 512 x2, nominal §b registration

// ---------- visual landmarks (px, from opened zooms; candidate in 1024) ----------
// Original weapon from FEASIBILITY-PLAN §a walk:2 global (1059,315)->(1507,95).
const origWeapon = { butt: [35, 315], tip: [483, 95] }
// Candidate weapon from gate-cand-butt-zoom.png / gate-cand-tip-zoom.png.
const candWeapon1024 = { butt: [49, 643], tip: [986, 177] }
const candWeapon = { butt: candWeapon1024.butt.map((v) => v / SCALE), tip: candWeapon1024.tip.map((v) => v / SCALE) }
// Candidate beard-base lowest tip, gate-cand-head-zoom.png (crop 350,50 @3x).
const candBeardTip1024 = [515, 257]
// Candidate body: helmet crown top / supporting (screen-right, flat) sole, 1024.
const candCrown1024 = 85
const candSupportSole1024 = 1006 // gate-cand-soles-zoom.png (crop 350,900 @x3/x4): sole bottom row
const candRearToe1024 = 975

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
// perpendicular distance from point to line a-b
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

// ---------- original alpha geometry (alpha>=16, as §a probes) ----------
function alphaBounds(png, x0, x1) {
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1
  for (let y = 0; y < png.height; y++) for (let x = x0; x < x1; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] >= 16) {
      if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
    }
  }
  return { xmin, ymin, xmax, ymax }
}
const origBounds = alphaBounds(origPng, 0, 512)
// original supporting boot = screen-left flat boot, cell x 100..195 (orig legs zoom)
const origSupport = alphaBounds(origPng, 100, 195)
const origGroundY = origSupport.ymax // grounded sole row of the supporting boot
const origBodyH = origBounds.ymax - origBounds.ymin + 1

// ---------- candidate pixel sampling ----------
const candCv = createCanvas(1024, 1024); const cg = candCv.getContext('2d'); cg.drawImage(candImg, 0, 0)
const candData = cg.getImageData(0, 0, 1024, 1024).data
const pxAt = (x, y) => Array.from(candData.slice((y * 1024 + x) * 4, (y * 1024 + x) * 4 + 3))
// Backdrop reference: plain gradient backdrop away from figure/weapon.
const backdropRef = pxAt(950, 260)
const belowBeard = [258, 262, 266, 270, 275, 280, 285, 290].map((y) => ({ y, rgb: pxAt(candBeardTip1024[0], y) }))
const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
// Clear-background gap below beard base: contiguous backdrop-like rows
// (colour distance < 40 to backdrop reference) directly below the tip,
// stopping at the first non-backdrop row (collar/chest). Measured honestly.
let beardGapBelowPx1024 = 0
for (let y = candBeardTip1024[1] + 1; y < candBeardTip1024[1] + 60; y++) {
  if (colorDist(pxAt(candBeardTip1024[0], y), backdropRef) < 40) beardGapBelowPx1024++
  else break
}

// ---------- gate 3: deterministic local splice ----------
// Registration per §b only: candidate is the 1024 served edit of the 512
// cell, mapped by the exact nominal x0.5 downscale, zero translation. No
// landmark fitting, no hand alignment. Hard edge (0px feather, <=8 allowed,
// inside-mask only by construction).
const cand512 = createCanvas(512, 512); const c5 = cand512.getContext('2d')
c5.imageSmoothingEnabled = true; c5.drawImage(candImg, 0, 0, 1024, 1024, 0, 0, 512, 512)
const cand512Data = c5.getImageData(0, 0, 512, 512).data
// Pixel-exact splice on the original PNG bytes (no canvas round-trip of the
// original: canvas premultiplies alpha and would rewrite transparent RGB).
const splicedBuild = new PNG({ width: 512, height: 512 }); origPng.data.copy(splicedBuild.data)
for (const r of [GAIT, BEARD_BASE]) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
  const i = (y * 512 + x) * 4
  splicedBuild.data[i] = cand512Data[i]; splicedBuild.data[i + 1] = cand512Data[i + 1]; splicedBuild.data[i + 2] = cand512Data[i + 2]; splicedBuild.data[i + 3] = 255
}
writeFileSync(dir + 'proof-walk2-spliced.png', PNG.sync.write(splicedBuild))

const splicedPng = PNG.sync.read(readFileSync(dir + 'proof-walk2-spliced.png'))
const inMask = (x, y) => [GAIT, BEARD_BASE].some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)
const outsideOrig = [], outsideSpliced = []
let insideDiff = 0, outsideDiff = 0
for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
  const i = (y * 512 + x) * 4
  const same = origPng.data[i] === splicedPng.data[i] && origPng.data[i + 1] === splicedPng.data[i + 1] &&
    origPng.data[i + 2] === splicedPng.data[i + 2] && origPng.data[i + 3] === splicedPng.data[i + 3]
  if (inMask(x, y)) { if (!same) insideDiff++ } else {
    outsideOrig.push(origPng.data[i], origPng.data[i + 1], origPng.data[i + 2], origPng.data[i + 3])
    outsideSpliced.push(splicedPng.data[i], splicedPng.data[i + 1], splicedPng.data[i + 2], splicedPng.data[i + 3])
    if (!same) outsideDiff++
  }
}
const outsideHashOrig = sha(Buffer.from(outsideOrig))
const outsideHashSpliced = sha(Buffer.from(outsideSpliced))

// ---------- gates 4/5 numbers ----------
// Spliced weapon: butt endpoint lies inside GAIT (candidate segment takes
// over), tip outside mask (original). Spliced ground/body from candidate sole.
const splicedWeapon = { butt: candWeapon.butt, tip: origWeapon.tip }
const splicedGroundY = candSupportSole1024 / SCALE
const splicedBodyH = splicedGroundY - origBounds.ymin + 1 // crown preserved (outside masks)
const U_PER_PX = 124 / 477 // documented source-only review hypothesis (IDENTITY_ACTION_MANIFEST: 124u per 477px)
const groundedErrU = Math.abs(splicedGroundY - origGroundY) * U_PER_PX
const weaponOrigLen = len(origWeapon.butt, origWeapon.tip), weaponOrigAng = ang(origWeapon.butt, origWeapon.tip)
const weaponCandLen = len(candWeapon.butt, candWeapon.tip), weaponCandAng = ang(candWeapon.butt, candWeapon.tip)
const weaponSplicedLen = len(splicedWeapon.butt, splicedWeapon.tip), weaponSplicedAng = ang(splicedWeapon.butt, splicedWeapon.tip)
const candBodyH = (candSupportSole1024 - candCrown1024) / SCALE
// Diagnostic pack-projection (§e.3): band may only be FIXED from an ACCEPTED
// anchor; this anchor is not accepted, so this is labelled diagnostic only.
const diagBand = fixedBandFromMedian(weaponOrigLen * U_PER_PX)
const diagProj = evaluateProjection({ observed: [weaponSplicedLen * U_PER_PX], remaining: 11, band: diagBand })

// ---------- marked images ----------
function marked(base, w, h, draw) {
  const cv = createCanvas(w, h); const g = cv.getContext('2d'); g.drawImage(base, 0, 0, w, h); draw(g); return cv.toBuffer('image/png')
}
const rect = (g, r, s, colour, label) => { g.strokeStyle = colour; g.lineWidth = 2; g.strokeRect(r.x * s, r.y * s, r.w * s, r.h * s); g.fillStyle = colour; g.font = `${11 * s}px sans-serif`; g.fillText(label, r.x * s + 2, r.y * s - 4) }
const line = (g, a, b, s, colour, label) => { g.strokeStyle = colour; g.lineWidth = 2; g.beginPath(); g.moveTo(a[0] * s, a[1] * s); g.lineTo(b[0] * s, b[1] * s); g.stroke(); for (const p of [a, b]) { g.beginPath(); g.arc(p[0] * s, p[1] * s, 4 * s, 0, 7); g.stroke() } g.fillStyle = colour; g.font = `${11 * s}px sans-serif`; g.fillText(label, a[0] * s, a[1] * s - 8) }
writeFileSync(dir + 'gate-walk2-marked-candidate.png', marked(candImg, 1024, 1024, (g) => {
  rect(g, GAIT, SCALE, '#ff4040', 'GAIT-EDIT'); rect(g, HEAD_BEARD, SCALE, '#40c0ff', 'HEAD-BEARD'); rect(g, BEARD_BASE, SCALE, '#ffe040', 'BEARD-BASE')
  line(g, candWeapon1024.butt, candWeapon1024.tip, 1, '#ff40ff', 'weapon cand')
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, candSupportSole1024); g.lineTo(1024, candSupportSole1024); g.stroke()
  g.fillStyle = '#00ff80'; g.font = '16px sans-serif'; g.fillText('cand support sole', 8, candSupportSole1024 - 6)
  g.fillStyle = '#ffe040'; g.beginPath(); g.arc(candBeardTip1024[0], candBeardTip1024[1], 6, 0, 7); g.fill(); g.fillText('beard tip', candBeardTip1024[0] + 10, candBeardTip1024[1])
}))
writeFileSync(dir + 'gate-walk2-marked-original.png', marked(origImg, 512, 512, (g) => {
  rect(g, GAIT, 1, '#ff4040', 'GAIT-EDIT'); rect(g, HEAD_BEARD, 1, '#40c0ff', 'HEAD-BEARD'); rect(g, BEARD_BASE, 1, '#ffe040', 'BEARD-BASE')
  line(g, origWeapon.butt, origWeapon.tip, 1, '#ff40ff', 'weapon orig')
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, origGroundY); g.lineTo(512, origGroundY); g.stroke(); g.fillStyle = '#00ff80'; g.font = '11px sans-serif'; g.fillText('orig support sole', 8, origGroundY - 4)
}))
writeFileSync(dir + 'gate-walk2-marked-spliced.png', marked(await loadImage(dir + 'proof-walk2-spliced.png'), 512, 512, (g) => {
  rect(g, GAIT, 1, '#ff4040', 'GAIT-EDIT (from cand)'); rect(g, BEARD_BASE, 1, '#ffe040', 'BEARD-BASE (from cand)')
  line(g, splicedWeapon.butt, splicedWeapon.tip, 1, '#ff40ff', 'weapon spliced')
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, origGroundY); g.lineTo(512, origGroundY); g.stroke()
  g.strokeStyle = '#ffe040'; g.beginPath(); g.moveTo(0, splicedGroundY); g.lineTo(512, splicedGroundY); g.stroke()
  g.fillStyle = '#00ff80'; g.font = '11px sans-serif'; g.fillText(`orig ground ${origGroundY} / spliced sole ${splicedGroundY}`, 8, 14)
}))

// ---------- verdicts ----------
const report = {
  work: 'cmr15a-proof-gates', key: 'walk:2', zeroNewGeneration: true,
  inputs: {
    original: { path: dir + 'walk2-original-cell.png', sha256: sha(origBuf), pinned: sha(origBuf) === pins.originalSha256, size: [origPng.width, origPng.height] },
    candidate: { path: dir + 'candidate-walk2-raw.jpg', sha256: sha(candBuf), pinned: sha(candBuf) === pins.candidateSha256, size: [1024, 1024] },
  },
  regions512: { GAIT_EDIT: GAIT, HEAD_BEARD, BEARD_BASE },
  gate1_visual: {
    verdict: 'FAIL',
    basis: 'read_image of walk2-original-cell.png, candidate-walk2-raw.jpg, gate-cand-legs-zoom.png, gate-orig-legs-zoom.png, gate-cand-head-zoom.png in this package',
    candidatePose: 'grounded stride stance: screen-right leg near-straight with boot FLAT on the ground (supporting), screen-left leg trailing near-straight with heel raised and toe on the ground. Feet separated horizontally (~135px at 1024 between boot inner edges).',
    required: 'one leg passing/tucked (off ground, tucked beside/under the supporting leg) with the opposite leg supporting',
    finding: 'NO passing/tucked leg: both feet contact the ground plane (one flat, one toe). It is a static stride stance, not a passing pose. The forward/leading leg is again the screen-right leg, the same leading-leg arrangement as the original walk:2 (whose screen-right leg was the raised forward leg); no opposite passing exchange is shown.',
    identitySubcheck: 'PASS in isolation: helmet/head/beard, massive torso/armour, two-hand glaive grip and camera are recognisably preserved in the candidate; the gate still fails on gait.',
  },
  gate2_beardBase: {
    verdict: 'FAIL', requiredPxAt1024: 8,
    beardTip1024: candBeardTip1024, beardTipInBeardBaseBandScaled: { x: [382, 592], y: [220, 290], inside: candBeardTip1024[0] >= 382 && candBeardTip1024[0] < 592 && candBeardTip1024[1] >= 220 && candBeardTip1024[1] < 290 },
    backdropRefRgb: backdropRef, samplesBelowTip: belowBeard,
    measuredClearBackgroundGapPxAt1024: beardGapBelowPx1024,
    finding: 'Beard lowest tip lies over the dark collar/chest (see gate-cand-head-zoom.png): 0 contiguous backdrop-coloured px directly below the base before collar/chest pixels; no >=8px clear background beside/below the beard-base endpoint. Endpoint remains merged into neck/collar, as in the original.',
  },
  gate3_splice: {
    verdict: 'PASS (mechanical criterion only)',
    method: 'nominal x0.5 downscale of the 1024 candidate to the 512 cell (§b registration, zero translation, no landmark fitting); ONLY GAIT-EDIT + BEARD-BASE rects copied; 0px feather (<=8px, inside-mask only)',
    splicedPath: dir + 'proof-walk2-spliced.png', splicedSha256: sha(readFileSync(dir + 'proof-walk2-spliced.png')),
    outsideMaskHashOrig: outsideHashOrig, outsideMaskHashSpliced: outsideHashSpliced,
    outsideMaskIdentical: outsideHashOrig === outsideHashSpliced, outsideDiffPx: outsideDiff, insideDiffPx: insideDiff,
    caveat: 'Hash equality is exact, but the pasted candidate regions carry the candidate JPEG painted backdrop and its shifted figure, so the spliced cell is visually incoherent at the seams (see gate-walk2-marked-spliced.png). This gate passing does not make the cell acceptable; gates 1/2 already fail.',
  },
  gate4_weaponIdentityScale: {
    verdict: 'PASS',
    original512: { butt: origWeapon.butt, tip: origWeapon.tip, lengthPx: weaponOrigLen, angleDeg: weaponOrigAng },
    candidate512: { butt: candWeapon.butt, tip: candWeapon.tip, lengthPx: weaponCandLen, angleDeg: weaponCandAng },
    lengthDeltaPctVsOrig: (weaponCandLen - weaponOrigLen) / weaponOrigLen * 100,
    weaponSpreadOrigVsCandCanonical: spreadOf([weaponOrigLen, weaponCandLen]),
    angleDeltaDeg: weaponCandAng - weaponOrigAng,
    corridorPerpPx: { buttToOrigLine: perp(candWeapon.butt, origWeapon.butt, origWeapon.tip), tipToOrigLine: perp(candWeapon.tip, origWeapon.butt, origWeapon.tip), corridorLimitPx: 14 },
    bodyHeight: { originalPx: origBodyH, candidatePxAt512: candBodyH, deltaPct: (candBodyH - origBodyH) / origBodyH * 100 },
    bands: '§e: weapon spread <=10% (canonical (max-min)/mean), direction steps <=60deg; §b weapon corridor 14px',
  },
  gate5_packProjection: {
    verdict: groundedErrU <= 1.5 ? 'PASS (numeric, diagnostic only)' : 'FAIL',
    registration: 'fixed §b cell geometry, ground = original supporting-boot sole row; NO band fixed (fixedBand stays null: §e.3 fixes a band only from an ACCEPTED anchor and this anchor is not accepted)',
    origGroundY, splicedGroundY, groundedErrorPx: Math.abs(splicedGroundY - origGroundY), uPerPx: U_PER_PX, groundedErrorU: groundedErrU, groundedLimitU: 1.5,
    splicedWeapon: { butt: splicedWeapon.butt, tip: splicedWeapon.tip, lengthPx: weaponSplicedLen, angleDeg: weaponSplicedAng, lengthDeltaPctVsOrig: (weaponSplicedLen - weaponOrigLen) / weaponOrigLen * 100, angleDeltaDeg: weaponSplicedAng - weaponOrigAng },
    splicedBodyHeightPx: splicedBodyH, bodyHeightDeltaPctVsOrig: (splicedBodyH - origBodyH) / origBodyH * 100,
    soleNote: 'candidate support sole row 503 (512-scale) sits 1px below the GAIT-EDIT bottom edge (y502), so the spliced boot is truncated at the mask edge; grounded error above uses the projected candidate sole vs the original ground row.',
    diagnosticProjection: { bandFromOriginalMedianU: diagBand, evaluateProjection: diagProj, status: 'DIAGNOSTIC ONLY — not fixed, not recorded (no recordSheet), anchor not accepted' },
  },
  overall: 'FAIL',
  failedGates: ['gate1_visual', 'gate2_beardBase', ...(groundedErrU <= 1.5 ? [] : ['gate5_packProjection (grounded error >1.5u)']), ...(outsideHashOrig === outsideHashSpliced ? [] : ['gate3_splice'])],
  disposition: 'Candidate UNACCEPTED. No banking (no banked-walk2-anchor.png). STOP per grant: no downstream spend, no reroll. CMR-15A re-blocks WAITING_FOR_OWNER; this failure consumes the last recovery consumer (2 prior failed + this = 3). Xu Chu 3/12, global 170/200 unchanged by this gates package (zero generation).',
}
writeFileSync(dir + 'gate-walk2.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ gate2: report.gate2_beardBase.measuredClearBackgroundGapPxAt1024, gate3: [outsideHashOrig === outsideHashSpliced, outsideDiff, insideDiff], weapon: [weaponOrigLen, weaponCandLen, weaponCandAng - weaponOrigAng], ground: [origGroundY, splicedGroundY, groundedErrU], origBounds, overall: report.overall }, null, 1))
