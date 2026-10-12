// CMR-15A FINITE CLOSEOUT request 02 walk:3 gates (adapted from 01-walk2/gate.mjs).
// Zero new generation. Landmarks read from opened full candidate + zooms generated here.
// Frozen brief band from 01-walk2 accepted anchor: body 459px@512, weapon 130.79u band [124.41,137.50]u, angle -26.31deg, groundY 500@512.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/02-walk3/'
const origPath = 'art/motion/xuchu/closeout-campaign/refs/walk3-original-cell.png'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const origBuf = readFileSync(origPath)
const candBuf = readFileSync(dir + 'candidate-raw.jpg')
const pins = { originalSha256: '947d6b77c73d0db2754cdbd59c13b71b4df2f7876b7823e2f032da4a5845883c', candidateSha256: 'ec73c75ab600ced5b4935cc29081824617dc3f5ed2c7ce1857f8d802602c48c7' }
const origPng = PNG.sync.read(origBuf)
const candImg = await loadImage(dir + 'candidate-raw.jpg')
const origImg = await loadImage(origPath)
const SCALE = 2 // candidate 1024 = cell 512 x2, nominal registration, zero translation

// Landmarks (candidate @1024) — refined after zoom reads (see gate-*-zoom.png)
const candWeapon1024 = { butt: [140, 600], tip: [1023, 250] } // tip = frame-exit point; true blade tip is CLIPPED beyond right edge (xmax=1023)
const candWeapon = { butt: candWeapon1024.butt.map(v => v / SCALE), tip: candWeapon1024.tip.map(v => v / SCALE) }
const anchorWeapon = { butt: [35, 318], tip: [486, 95] } // 01-walk2 accepted anchor @512
const origWeapon = { butt: [60, 318], tip: [510, 108] }
const candBeardTip1024 = [650, 328]
const candCrown1024 = 38
const candSupportSole1024 = 939
const candFrontBoot1024 = { x: [560, 815], soleY: 939 }
const candRearBoot1024 = { x: [185, 320], lowestY: 918, toe: [250, 916] }

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
const origGroundY = origBounds.ymax
const origBodyH = origBounds.ymax - origBounds.ymin + 1

const candCv = createCanvas(1024, 1024); const cg = candCv.getContext('2d'); cg.drawImage(candImg, 0, 0)
const candData = cg.getImageData(0, 0, 1024, 1024).data
const pxAt = (x, y) => Array.from(candData.slice((y * 1024 + x) * 4, (y * 1024 + x) * 4 + 3))
const backdropRef = pxAt(950, 600)
const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
let beardGapBelowPx1024 = 0
for (let y = candBeardTip1024[1] + 1; y < candBeardTip1024[1] + 60; y++) {
  if (colorDist(pxAt(candBeardTip1024[0], y), backdropRef) < 40) beardGapBelowPx1024++; else break
}
const belowBeard = [322, 330, 340, 350, 360, 370, 380].map(y => ({ y, rgb: pxAt(candBeardTip1024[0], Math.min(y, 1023)) }))

function zoom(img, x, y, w, h, s, out) {
  const cv = createCanvas(w * s, h * s); const g = cv.getContext('2d')
  g.imageSmoothingEnabled = true; g.drawImage(img, x, y, w, h, 0, 0, w * s, h * s)
  writeFileSync(dir + out, cv.toBuffer('image/png'))
}
zoom(candImg, 300, 40, 400, 400, 3, 'gate-cand-head-zoom.png')
zoom(candImg, 100, 560, 700, 464, 2, 'gate-cand-legs-zoom.png')
zoom(candImg, 0, 540, 300, 220, 3, 'gate-cand-butt-zoom.png')
zoom(candImg, 700, 80, 324, 340, 3, 'gate-cand-tip-zoom.png')
zoom(candImg, 100, 700, 750, 324, 3, 'gate-cand-soles-zoom.png')
zoom(origImg, 150, 0, 250, 250, 3, 'gate-orig-head-zoom.png')
zoom(origImg, 0, 260, 512, 252, 2, 'gate-orig-legs-zoom.png')

const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const candGroundY = candSupportSole1024 / SCALE
const candBodyH = (candSupportSole1024 - candCrown1024) / SCALE
const groundedErrPx = Math.abs(candGroundY - FROZEN.groundYAt512)
const groundedErrU = groundedErrPx * U_PER_PX
const weaponCandLen = len(candWeapon.butt, candWeapon.tip), weaponCandAng = ang(candWeapon.butt, candWeapon.tip)
const weaponCandU = weaponCandLen * U_PER_PX

function marked(base, w, h, draw) { const cv = createCanvas(w, h); const g = cv.getContext('2d'); g.drawImage(base, 0, 0, w, h); draw(g); return cv.toBuffer('image/png') }
const line = (g, a, b, s, colour, label) => { g.strokeStyle = colour; g.lineWidth = 2; g.beginPath(); g.moveTo(a[0] * s, a[1] * s); g.lineTo(b[0] * s, b[1] * s); g.stroke(); for (const p of [a, b]) { g.beginPath(); g.arc(p[0] * s, p[1] * s, 4 * s, 0, 7); g.stroke() } g.fillStyle = colour; g.font = `${11 * s}px sans-serif`; g.fillText(label, a[0] * s, a[1] * s - 8) }
writeFileSync(dir + 'gate-marked-candidate.png', marked(candImg, 1024, 1024, (g) => {
  line(g, candWeapon1024.butt, candWeapon1024.tip, 1, '#ff40ff', 'weapon cand butt->tip')
  g.strokeStyle = '#00ff80'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, candSupportSole1024); g.lineTo(1024, candSupportSole1024); g.stroke(); g.fillStyle = '#00ff80'; g.font = '16px sans-serif'; g.fillText('cand front support sole', 8, candSupportSole1024 - 6)
  g.strokeStyle = '#ffe040'; g.strokeRect(candRearBoot1024.x[0], 780, candRearBoot1024.x[1] - candRearBoot1024.x[0], 150); g.fillStyle = '#ffe040'; g.fillText('rear toe-off boot', candRearBoot1024.x[0], 770)
  g.fillStyle = '#40c0ff'; g.beginPath(); g.arc(candBeardTip1024[0], candBeardTip1024[1], 6, 0, 7); g.fill(); g.fillText('beard tip RAW', candBeardTip1024[0] + 10, candBeardTip1024[1])
}))
writeFileSync(dir + 'gate-marked-original.png', marked(origImg, 512, 512, (g) => {
  line(g, origWeapon.butt, origWeapon.tip, 1, '#ff40ff', 'weapon orig walk3')
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, origGroundY); g.lineTo(512, origGroundY); g.stroke(); g.fillStyle = '#00ff80'; g.font = '11px sans-serif'; g.fillText('orig ground (alpha ymax)', 8, origGroundY - 4)
}))

const report = {
  work: 'cmr15a-closeout-02-walk3', key: 'walk:3', request: '02', zeroNewGenerationInGate: true,
  frozenBriefBand: FROZEN,
  inputs: {
    original: { path: origPath, sha256: sha(origBuf), pinned: sha(origBuf) === pins.originalSha256, size: [origPng.width, origPng.height] },
    candidate: { path: dir + 'candidate-raw.jpg', sha256: sha(candBuf), pinned: sha(candBuf) === pins.candidateSha256, size: [1024, 1024] },
  },
  landmarks: { candWeapon1024, candBeardTip1024, candCrown1024, candSupportSole1024, candFrontBoot1024, candRearBoot1024, origWeapon, anchorWeapon, origBounds, origGroundY },
  measurements: {
    weaponVsFrozenBand: { candidatePxAt512: weaponCandLen, candidateU: weaponCandU, bandU: FROZEN.weaponBandU, inBand: weaponCandU >= FROZEN.weaponBandU.lo && weaponCandU <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (weaponCandLen - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, weaponCandLen]), candidateAngleDeg: weaponCandAng, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: weaponCandAng - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(candWeapon.butt, anchorWeapon.butt, anchorWeapon.tip), tip: perp(candWeapon.tip, anchorWeapon.butt, anchorWeapon.tip), corridorLimitPx: 14 } },
    bodyVsFrozen: { candidateHeightPxAt512: candBodyH, frozenHeightPxAt512: 459, deltaPctVsFrozen: (candBodyH - 459) / 459 * 100, originalHeightPx: origBodyH },
    groundVsFrozen: { frozenGroundYAt512: 500, candidateGroundYAt512: candGroundY, groundedErrorPx: groundedErrPx, uPerPx: U_PER_PX, groundedErrorU: groundedErrU, limitU: 1.5 },
    headEndpointRAW: { beardTip1024: candBeardTip1024, backdropRefRgb: backdropRef, samplesBelowTip: belowBeard, measuredClearBackgroundGapPxAt1024: beardGapBelowPx1024, note: 'RAW only per CAMPAIGN (c): beard conceals chin/beard-base endpoint; unreadable endpoint does NOT reject here; reserved for batch-end UNVERIFIED_OWNER_ACCEPTED ruling only if all other gates pass + independent visual review.' },
    gait: { frontBoot: 'screen-right boot flat, sole row 939@1024 (bbox/boot-region scan ymax 939)', rearBoot: 'screen-left boot toe-down trailing, lowest row 918@1024, 21px@1024 above front sole (toe-off/leaving ground, not flat)', feetSeparation: 'front x560-815 vs rear x185-320 @1024, clearly separated', note: 'Arrangement reads as a front-contact + rear toe-off stride, but screen arrangement is the SAME as walk1-original-cell (front flat / rear toe-off); no visibly reversed support/occlusion vs walk:1 is demonstrated, so Contact-B opposite-contact is not proven.' },
    weaponTipClipped: { candidateXmax: 1023, tipInsideFrame: false, measuredLengthIsLowerBoundOnly: true },
  },
}
writeFileSync(dir + 'gate-measurements.json', JSON.stringify(report, null, 2) + '\n')
const verdicts = {
  identity: { verdict: 'PASS', basis: 'read_image candidate-raw.jpg + gate-cand-head-zoom.png: same blunt-faced helmeted dark/full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter, no other-fighter/costume/cape drift vs reference.' },
  anatomy: { verdict: 'PASS', basis: 'Full + legs/head zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs or pasted-on legs.' },
  weaponCorridorLengthDirection: { verdict: 'FAIL', basis: 'Blade tip CLIPPED at right frame edge (xmax 1023@1024; tip zoom shows blade exiting frame) so whole butt->tip length is UNMEASURABLE (frame-exit lower bound only, recorded raw). Shaft/frame-exit angle -21.7deg vs frozen -26.31deg (delta ~+4.6deg) and corridor perp vs anchor line >14px limit. Deterministic shaft retouch cannot restore missing off-frame blade pixels; no waiver issued in-batch; deviation recorded raw for batch end but candidate is rejected on other gates regardless.', measured: report.measurements.weaponVsFrozenBand },
  scaleGround: { verdict: 'FAIL', basis: 'At fixed nominal registration: candidate groundY 469.5@512 vs frozen 500@512 = 30.5px = 7.93u >> 1.5u limit; body height 450.5 vs frozen 459px (-1.85%). Figure floats/shrinks vs frozen band; no re-registration permitted.', measured: { body: report.measurements.bodyVsFrozen, ground: report.measurements.groundVsFrozen } },
  seams: { verdict: 'FAIL', basis: 'Clipped blade at right frame edge (unintended panel clipping per CAMPAIGN (c)); otherwise no splice (whole candidate), no halo/key residue observed in zooms.' },
  gaitPhaseMatch: { verdict: 'FAIL (not proven opposite)', basis: 'Front flat + rear toe-off reads as a generic contact stride, identical in screen arrangement to walk1-original-cell; CAMPAIGN (a) requires walk:3 Contact-B support/occlusion visibly reversed vs walk:1 Contact-A, which is not demonstrated. Leg-A/B identity cannot be proven reversed from occlusion.', measured: report.measurements.gait },
  headEndpointRAW: { verdict: 'RECORDED_RAW_NOT_A_REJECT', measuredClearBackgroundGapPxAt1024: beardGapBelowPx1024, basis: 'Beard tip lies over collar/chest; clear background gap 0px. Reserved for batch-end UNVERIFIED_OWNER_ACCEPTED ruling only; not a reject ground here.' },
  weaponDeviationsRAW: { verdict: 'RECORDED_RAW', basis: 'Tip clipped / length unmeasurable + angle delta recorded above with exact candidate hash ec73c75a...; no per-candidate waiver.' },
}
const overall = 'REJECT'
const gateReport = { ...report, verdicts, overall, disposition: 'REJECT — candidate UNACCEPTED, not banked (no accepted.png). Genuinely unusable count 0->1 (campaign total 1/2; STOP threshold is 2, not reached). No reroll/correction (not authorized). Next campaign request remains 03 walk:4 only under manager/owner direction; CMR-15A stays IN_PROGRESS.', genuinelyUnusableCountAfterThisRequest: 1 }
writeFileSync(dir + 'gate.json', JSON.stringify(gateReport, null, 2) + '\n')
console.log(JSON.stringify({ weapon: report.measurements.weaponVsFrozenBand, body: report.measurements.bodyVsFrozen, ground: report.measurements.groundVsFrozen, headGap: beardGapBelowPx1024, origBounds, overall }, null, 1))
