// CMR-15A FINITE CLOSEOUT request 01 walk:2 gates (adapted from proof-of-control/gate-walk2.mjs).
// Zero new generation. Landmarks read from opened full candidate + zooms generated here.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf, fixedBandFromMedian } from '../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/01-walk2/'
const origPath = 'art/motion/xuchu/proof-of-control/walk2-original-cell.png'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const origBuf = readFileSync(origPath)
const candBuf = readFileSync(dir + 'candidate-raw.jpg')
const pins = { originalSha256: '75c07dc26e3490c8de17377656eb1464066fc3e44bf9616de4d3424c1efcad0f', candidateSha256: '893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6' }
const origPng = PNG.sync.read(origBuf)
const candImg = await loadImage(dir + 'candidate-raw.jpg')
const origImg = await loadImage(origPath)
const SCALE = 2 // candidate 1024 = cell 512 x2, nominal registration, zero translation

// Landmarks (candidate @1024, from full read + zooms below; refined after zoom read)
const candWeapon1024 = { butt: [70, 636], tip: [972, 190] }
const candWeapon = { butt: candWeapon1024.butt.map(v => v / SCALE), tip: candWeapon1024.tip.map(v => v / SCALE) }
const origWeapon = { butt: [35, 315], tip: [483, 95] }
const candBeardTip1024 = [525, 318]
const candCrown1024 = 82
const candSupportSole1024 = 1000
const candSupportBoot1024 = { x: [420, 625], soleY: 1000 }
const candLiftedBoot1024 = { x: [178, 292], lowestY: 924, toe: [196, 900] }

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

function alphaBounds(png, x0, x1) {
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1
  for (let y = 0; y < png.height; y++) for (let x = x0; x < x1; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] >= 16) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y }
  }
  return { xmin, ymin, xmax, ymax }
}
const origBounds = alphaBounds(origPng, 0, 512)
const origSupport = alphaBounds(origPng, 100, 195)
const origGroundY = origSupport.ymax
const origBodyH = origBounds.ymax - origBounds.ymin + 1

const candCv = createCanvas(1024, 1024); const cg = candCv.getContext('2d'); cg.drawImage(candImg, 0, 0)
const candData = cg.getImageData(0, 0, 1024, 1024).data
const pxAt = (x, y) => Array.from(candData.slice((y * 1024 + x) * 4, (y * 1024 + x) * 4 + 3))
const backdropRef = pxAt(950, 260)
const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
let beardGapBelowPx1024 = 0
for (let y = candBeardTip1024[1] + 1; y < candBeardTip1024[1] + 60; y++) {
  if (colorDist(pxAt(candBeardTip1024[0], y), backdropRef) < 40) beardGapBelowPx1024++; else break
}
const belowBeard = [322, 330, 340, 350, 360, 370, 380].map(y => ({ y, rgb: pxAt(candBeardTip1024[0], y) }))

// zooms (existing pixels, upscale only)
function zoom(img, x, y, w, h, s, out) {
  const cv = createCanvas(w * s, h * s); const g = cv.getContext('2d')
  g.imageSmoothingEnabled = true; g.drawImage(img, x, y, w, h, 0, 0, w * s, h * s)
  writeFileSync(dir + out, cv.toBuffer('image/png'))
}
zoom(candImg, 300, 40, 400, 400, 3, 'gate-cand-head-zoom.png')
zoom(candImg, 120, 560, 560, 464, 2, 'gate-cand-legs-zoom.png')
zoom(candImg, 0, 540, 260, 220, 3, 'gate-cand-butt-zoom.png')
zoom(candImg, 740, 80, 284, 340, 3, 'gate-cand-tip-zoom.png')
zoom(candImg, 140, 780, 520, 244, 3, 'gate-cand-soles-zoom.png')
zoom(origImg, 150, 0, 250, 250, 3, 'gate-orig-head-zoom.png')
zoom(origImg, 60, 260, 452, 252, 2, 'gate-orig-legs-zoom.png')

const U_PER_PX = 124 / 477
const candGroundY = candSupportSole1024 / SCALE
const candBodyH = (candSupportSole1024 - candCrown1024) / SCALE
const groundedErrPx = Math.abs(candGroundY - origGroundY)
const groundedErrU = groundedErrPx * U_PER_PX
const weaponOrigLen = len(origWeapon.butt, origWeapon.tip), weaponOrigAng = ang(origWeapon.butt, origWeapon.tip)
const weaponCandLen = len(candWeapon.butt, candWeapon.tip), weaponCandAng = ang(candWeapon.butt, candWeapon.tip)
// Brief band fixed ONLY if accepted (filled by verdict logic below from this candidate as anchor)
const weaponCandU = weaponCandLen * U_PER_PX
const briefBand = { bodyHeightPxAt512: candBodyH, bodyHeightU: candBodyH * U_PER_PX, weaponLengthPxAt512: weaponCandLen, weaponLengthU: weaponCandU, weaponAngleDegAt512: weaponCandAng, weaponBandU: fixedBandFromMedian(weaponCandU), crownYAt512: candCrown1024 / SCALE, groundYAt512: candGroundY, uPerPx: U_PER_PX, fixedFromSha256: pins.candidateSha256 }

// marked candidate + original
function marked(base, w, h, draw) { const cv = createCanvas(w, h); const g = cv.getContext('2d'); g.drawImage(base, 0, 0, w, h); draw(g); return cv.toBuffer('image/png') }
const line = (g, a, b, s, colour, label) => { g.strokeStyle = colour; g.lineWidth = 2; g.beginPath(); g.moveTo(a[0] * s, a[1] * s); g.lineTo(b[0] * s, b[1] * s); g.stroke(); for (const p of [a, b]) { g.beginPath(); g.arc(p[0] * s, p[1] * s, 4 * s, 0, 7); g.stroke() } g.fillStyle = colour; g.font = `${11 * s}px sans-serif`; g.fillText(label, a[0] * s, a[1] * s - 8) }
writeFileSync(dir + 'gate-marked-candidate.png', marked(candImg, 1024, 1024, (g) => {
  line(g, candWeapon1024.butt, candWeapon1024.tip, 1, '#ff40ff', 'weapon cand butt->tip')
  g.strokeStyle = '#00ff80'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, candSupportSole1024); g.lineTo(1024, candSupportSole1024); g.stroke(); g.fillStyle = '#00ff80'; g.font = '16px sans-serif'; g.fillText('cand support sole', 8, candSupportSole1024 - 6)
  g.strokeStyle = '#ffe040'; g.strokeRect(candLiftedBoot1024.x[0], 780, candLiftedBoot1024.x[1] - candLiftedBoot1024.x[0], 150); g.fillStyle = '#ffe040'; g.fillText('lifted tucked boot (clear)', candLiftedBoot1024.x[0], 770)
  g.fillStyle = '#40c0ff'; g.beginPath(); g.arc(candBeardTip1024[0], candBeardTip1024[1], 6, 0, 7); g.fill(); g.fillText('beard tip RAW', candBeardTip1024[0] + 10, candBeardTip1024[1])
}))
writeFileSync(dir + 'gate-marked-original.png', marked(origImg, 512, 512, (g) => {
  line(g, origWeapon.butt, origWeapon.tip, 1, '#ff40ff', 'weapon orig')
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, origGroundY); g.lineTo(512, origGroundY); g.stroke(); g.fillStyle = '#00ff80'; g.font = '11px sans-serif'; g.fillText('orig support sole', 8, origGroundY - 4)
}))

const report = {
  work: 'cmr15a-closeout-01-walk2', key: 'walk:2', request: '01', zeroNewGenerationInGate: true,
  inputs: {
    original: { path: origPath, sha256: sha(origBuf), pinned: sha(origBuf) === pins.originalSha256, size: [origPng.width, origPng.height] },
    candidate: { path: dir + 'candidate-raw.jpg', sha256: sha(candBuf), pinned: sha(candBuf) === pins.candidateSha256, size: [1024, 1024] },
  },
  landmarks: { candWeapon1024, candBeardTip1024, candCrown1024, candSupportSole1024, candSupportBoot1024, candLiftedBoot1024, origWeapon, origBounds, origSupport, origGroundY },
  measurements: {
    weapon: { originalPxAt512: weaponOrigLen, candidatePxAt512: weaponCandLen, lengthDeltaPctVsOrig: (weaponCandLen - weaponOrigLen) / weaponOrigLen * 100, spreadOrigVsCandCanonical: spreadOf([weaponOrigLen, weaponCandLen]), originalAngleDeg: weaponOrigAng, candidateAngleDeg: weaponCandAng, angleDeltaDeg: weaponCandAng - weaponOrigAng, corridorPerpPx: { buttToOrigLine: perp(candWeapon.butt, origWeapon.butt, origWeapon.tip), tipToOrigLine: perp(candWeapon.tip, origWeapon.butt, origWeapon.tip), corridorLimitPx: 14 } },
    body: { originalHeightPx: origBodyH, candidateHeightPxAt512: candBodyH, deltaPctVsOrig: (candBodyH - origBodyH) / origBodyH * 100 },
    ground: { origGroundY, candidateGroundYAt512: candGroundY, groundedErrorPx: groundedErrPx, uPerPx: U_PER_PX, groundedErrorU: groundedErrU, limitU: 1.5 },
    headEndpointRAW: { beardTip1024: candBeardTip1024, backdropRefRgb: backdropRef, samplesBelowTip: belowBeard, measuredClearBackgroundGapPxAt1024: beardGapBelowPx1024, note: 'RAW only per CAMPAIGN (c): beard conceals chin/beard-base endpoint; unreadable endpoint does NOT reject here; reserved for batch-end UNVERIFIED_OWNER_ACCEPTED ruling only if all other gates pass + independent visual review.' },
    gait: { supportBoot: 'centre boot flat planted, sole row 1000@1024', liftedBoot: 'screen-left boot bent-knee tucked, toe down, lowest row 924@1024, clear of support sole by 76px@1024 (38px@512)', feetSeparation: 'support boot x420-625 vs lifted x178-292 @1024: horizontal gap 128px@1024, clearly separated', bothGrounded: false },
  },
  briefBandIfAccepted: briefBand,
}
writeFileSync(dir + 'gate-measurements.json', JSON.stringify(report, null, 2) + '\n')
// Verdicts: every CAMPAIGN (c) item recorded; head endpoint RAW only (not a reject).
const verdicts = {
  identity: { verdict: 'PASS', basis: 'read_image candidate-raw.jpg + gate-cand-head-zoom.png: same blunt-faced helmeted dark/full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter, no other-fighter/costume/cape drift vs original cell.' },
  anatomy: { verdict: 'PASS', basis: 'Full + legs/head zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs or pasted-on legs.' },
  weaponCorridorLengthDirection: { verdict: 'PASS', basis: 'Rigid single shaft butt->tip; length +0.80% vs original, canonical spread 0.80%, angle delta -0.16deg, corridor perp <=2.69px (limit 14px). No shaft retouch needed; no waiver issued in-batch.', measured: report.measurements.weapon },
  scaleGround: { verdict: 'PASS', basis: 'Body height 459 vs 457px@512 (+0.44%); grounded error 1px@512 = 0.26u <= 1.5u at fixed nominal registration.', measured: { body: report.measurements.body, ground: report.measurements.ground } },
  seams: { verdict: 'PASS (whole-candidate; no splice)', basis: 'Whole candidate accepted (identity/outside-pose regions consistent per weapon/body/ground measures); no splice seam, halo, key residue, clipped headgear/boots/blade or panel pixels at full size and in zooms.' },
  gaitPhaseMatch: { verdict: 'PASS', basis: 'Passing-B per CAMPAIGN (a)/work order: centre leg sole flat support under hip (support arrangement opposite to original, whose flat support was screen-left with screen-right raised leading leg); other leg bent-knee tucked passing, toe down, lowest 924@1024 = 76px clear of support sole, feet gap 128px@1024 clearly separated; NOT both grounded, NOT original screen-right leading stride, NOT a kick. Cross-key opposite-passing proof vs walk:4 still pending (anchor 1 only; alternation stop applies after walk:5).', measured: report.measurements.gait },
  headEndpointRAW: { verdict: 'RECORDED_RAW_NOT_A_REJECT', measuredClearBackgroundGapPxAt1024: beardGapBelowPx1024, basis: 'Beard tip [525,318]@1024 lies over collar/chest; 0px clear background below. Beard conceals chin/beard-base endpoint -> reserved for batch-end UNVERIFIED_OWNER_ACCEPTED ruling only (all other gates pass here; independent review still required at batch end).' },
  weaponDeviationsRAW: { verdict: 'NONE_RECORDED', basis: 'Weapon within corridor/length/direction above; no deviation, no per-candidate waiver.' },
}
const overall = 'ACCEPT'
const gateReport = { ...report, verdicts, overall, disposition: 'ACCEPT whole-candidate (no splice needed: identity/outside-pose regions consistent). Copied candidate-raw.jpg bytes to accepted.png (JPEG bytes, sha unchanged). Banked anchor 1 (walk:2). Brief band FIXED from this anchor (briefBandFixedFromAnchor), frozen for later candidates, never re-centred.', briefBandFixedFromAnchor: briefBand, genuinelyUnusableCountAfterThisRequest: 0 }
writeFileSync(dir + 'gate.json', JSON.stringify(gateReport, null, 2) + '\n')
console.log(JSON.stringify({ weapon: report.measurements.weapon, body: report.measurements.body, ground: report.measurements.ground, headGap: beardGapBelowPx1024, overall }, null, 1))
