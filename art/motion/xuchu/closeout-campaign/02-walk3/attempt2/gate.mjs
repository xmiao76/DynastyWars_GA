// CMR-15A AMENDMENT walk:3 second attempt (attempt2) gates. Zero new generation.
// Salvage FIRST (in order): (1) uniform registration factor = 459/bodyHeightPxAt512, only if <=+-4%;
// (2) shaft retouch only for in-frame length outliers; (3) splice only if grips align. No tip fabrication.
// Frozen band from 01-walk2 anchor: body 459px@512, weapon 130.79u [124.41,137.50]u, angle -26.31deg, groundY 500@512.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/02-walk3/attempt2/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const candBuf = readFileSync(dir + 'candidate-raw.png')
const candPng = PNG.sync.read(candBuf)
const candImg = await loadImage(dir + 'candidate-raw.png')
const NATIVE = candPng.width // 1254
const SCALE = NATIVE / 512 // native -> @512
const to512 = (p) => p.map(v => v / SCALE)

// Landmarks (native 1254), read from full candidate + zooms below
const candWeaponNative = { butt: [160, 775], tip: [1217, 242] } // tip inside frame, right margin 37px native
const candWeapon = { butt: to512(candWeaponNative.butt), tip: to512(candWeaponNative.tip) }
const anchorWeapon = { butt: [35, 318], tip: [486, 95] } // 01-walk2 accepted anchor @512
const candBeardTipNative = [760, 380]
const candCrownNative = 148

const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
function regionYmax(x0, x1, y0) {
  let ym = -1
  for (let y = y0; y < candPng.height; y++) for (let x = x0; x < x1; x++) {
    const i = (y * candPng.width + x) * 4
    if (candPng.data[i + 3] >= 16 && !isGreen(candPng.data[i], candPng.data[i + 1], candPng.data[i + 2])) if (y > ym) ym = y
  }
  return ym
}
const frontSoleNative = regionYmax(700, 1010, 900) // screen-right flat boot
const rearToeNative = regionYmax(140, 330, 900) // screen-left toe-off boot
let greenPx = 0
for (let i = 0; i < candPng.data.length; i += 4) if (candPng.data[i + 3] >= 16 && isGreen(candPng.data[i], candPng.data[i + 1], candPng.data[i + 2])) greenPx++

function zoom(x, y, w, h, s, out) {
  const cv = createCanvas(w * s, h * s); const g = cv.getContext('2d')
  g.drawImage(candImg, x, y, w, h, 0, 0, w * s, h * s)
  writeFileSync(dir + out, cv.toBuffer('image/png'))
}
zoom(450, 80, 500, 450, 2, 'gate-cand-head-zoom.png')
zoom(100, 650, 1050, 604, 1, 'gate-cand-legs-zoom.png')
zoom(850, 200, 404, 400, 2, 'gate-cand-tip-zoom.png')
zoom(80, 650, 350, 350, 2, 'gate-cand-butt-zoom.png')
zoom(100, 850, 1050, 404, 2, 'gate-cand-soles-zoom.png')

const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

const candGroundY = frontSoleNative / SCALE
const candBodyH = (frontSoleNative - candCrownNative) / SCALE
const groundedErrPx = Math.abs(candGroundY - FROZEN.groundYAt512)
const groundedErrU = groundedErrPx * U_PER_PX
const weaponCandLen = len(candWeapon.butt, candWeapon.tip), weaponCandAng = ang(candWeapon.butt, candWeapon.tip)
const weaponCandU = weaponCandLen * U_PER_PX

// Salvage step (1): registration factor, applied only if within +-4%
const salvageFactor = 459 / candBodyH
const salvageWithinCap = Math.abs(salvageFactor - 1) <= 0.04
const registeredGroundY = salvageWithinCap ? 500 : null
const registeredBodyH = salvageWithinCap ? 459 : null

// Head RAW: samples below beard tip on the composited (black) backdrop
const cv = createCanvas(NATIVE, NATIVE); const cg = cv.getContext('2d'); cg.drawImage(candImg, 0, 0)
const candData = cg.getImageData(0, 0, NATIVE, NATIVE).data
const pxAt = (x, y) => Array.from(candData.slice((y * NATIVE + x) * 4, (y * NATIVE + x) * 4 + 3))
const belowBeard = [385, 395, 405, 415, 425, 435, 445].map(y => ({ y, rgb: pxAt(candBeardTipNative[0], y) }))

function marked() {
  const c = createCanvas(NATIVE, NATIVE); const g = c.getContext('2d'); g.drawImage(candImg, 0, 0)
  g.strokeStyle = '#ff40ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(...candWeaponNative.butt); g.lineTo(...candWeaponNative.tip); g.stroke()
  g.fillStyle = '#ff40ff'; g.font = '20px sans-serif'; g.fillText('weapon butt->tip', candWeaponNative.butt[0], candWeaponNative.butt[1] - 12)
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, frontSoleNative); g.lineTo(NATIVE, frontSoleNative); g.stroke(); g.fillStyle = '#00ff80'; g.fillText('front support sole', 8, frontSoleNative - 8)
  g.strokeStyle = '#ffe040'; g.strokeRect(140, 850, 190, 320); g.fillStyle = '#ffe040'; g.fillText('rear toe-off boot', 140, 840)
  g.fillStyle = '#40c0ff'; g.beginPath(); g.arc(...candBeardTipNative, 8, 0, 7); g.fill(); g.fillText('beard tip RAW', candBeardTipNative[0] + 14, candBeardTipNative[1])
  return c.toBuffer('image/png')
}
writeFileSync(dir + 'gate-marked-candidate.png', marked())

const measurements = {
  weaponVsFrozenBand: { candidatePxAt512: weaponCandLen, candidateU: weaponCandU, bandU: FROZEN.weaponBandU, inBand: weaponCandU >= FROZEN.weaponBandU.lo && weaponCandU <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (weaponCandLen - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, weaponCandLen]), candidateAngleDeg: weaponCandAng, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: weaponCandAng - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(candWeapon.butt, anchorWeapon.butt, anchorWeapon.tip), tip: perp(candWeapon.tip, anchorWeapon.butt, anchorWeapon.tip), corridorLimitPx: 14 }, tipInsideFrame: true, tipRightMarginPxNative: NATIVE - candWeaponNative.tip[0], tipClipped: false },
  bodyVsFrozen: { candidateHeightPxAt512: candBodyH, frozenHeightPxAt512: 459, deltaPctVsFrozen: (candBodyH - 459) / 459 * 100 },
  groundVsFrozen: { frozenGroundYAt512: 500, candidateGroundYAt512: candGroundY, groundedErrorPx: groundedErrPx, uPerPx: U_PER_PX, groundedErrorU: groundedErrU, limitU: 1.5 },
  salvageStep1Registration: { factor: salvageFactor, withinPlusMinus4Pct: salvageWithinCap, applied: salvageWithinCap, registeredGroundYAt512: registeredGroundY, registeredBodyHeightPxAt512: registeredBodyH, note: salvageWithinCap ? 'registered then re-gated' : 'factor exceeds +-4% cap: registration NOT authorized/applied; scale/ground failure stands (no larger rescale permitted)' },
  salvageStep2ShaftRetouch: { applied: false, note: 'weapon length is in-frame and in band; no in-frame length outlier to retouch' },
  salvageStep3Splice: { applied: false, note: 'not attempted: would not cure scale/ground or the retained painted ground line; no fabrication' },
  greenGroundLineRetained: { greenPx, note: 'candidate retained the padded reference painted green ground line (bright green streak across/below both soles, soles + tip zooms): unintended reference-panel pixels in the served art' },
  headEndpointRAW: { beardTipNative: candBeardTipNative, samplesBelowTip: belowBeard, measuredClearBackgroundGapPxNative: 0, note: 'RAW only: beard tip over collar/chest; reserved for batch-end UNVERIFIED_OWNER_ACCEPTED ruling only if all other gates pass.' },
  gait: { frontBoot: `screen-right boot flat, sole row ${frontSoleNative}@${NATIVE}`, rearBoot: `screen-left boot toe-down trailing, lowest row ${rearToeNative}@${NATIVE} (heel raised, toe-off)`, feetSeparation: 'front boot x~750-1010 vs rear x~140-330 native, clearly separated', note: 'Screen arrangement (front flat + rear toe-off) is the SAME as walk:1 original and attempt-1; leg-occlusion order at the skirt is not visibly reversed vs walk:1, so Contact-B opposite-contact (Leg-B front vs walk:1 Leg-A front) is not proven by occlusion/boot order.' },
}
writeFileSync(dir + 'gate-measurements.json', JSON.stringify({ work: 'cmr15a-amend-walk3', attempt: 'attempt2', measurements }, null, 2) + '\n')

const verdicts = {
  identity: { verdict: 'PASS', basis: 'read_image candidate-raw.png + head zoom: same blunt-faced helmeted dark/full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter, no other-fighter/costume drift.' },
  anatomy: { verdict: 'PASS', basis: 'Full + legs/head zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs.' },
  weaponCorridorLengthDirection: { verdict: 'PASS (measured, tip not clipped)', basis: 'Whole glaive in frame (tip right margin 37px native / ~15px@512, less than the briefed 40px native margin but not clipped); length in frozen band, angle and corridor within limits (see measured). No shaft retouch needed; deviation (tip margin) recorded raw, no waiver in-batch.', measured: measurements.weaponVsFrozenBand },
  scaleGround: { verdict: 'FAIL', basis: 'Body height far below frozen 459px@512 and ground far above frozen 500@512 (see measured); salvage step (1) factor exceeds the authorized +-4% cap, so registration may not cure it. No shrinking/growing beyond cap permitted.', measured: { body: measurements.bodyVsFrozen, ground: measurements.groundVsFrozen, salvage: measurements.salvageStep1Registration } },
  seams: { verdict: 'FAIL', basis: 'Candidate retained the padded reference painted green ground line as a bright green streak across/below both soles (greenPx counted, soles/tip zooms) - unintended reference-panel pixels; otherwise whole-candidate, blade/headgear/boots not clipped.' },
  gaitPhaseMatch: { verdict: 'FAIL (not proven opposite)', basis: measurements.gait.note, measured: measurements.gait },
  headEndpointRAW: { verdict: 'RECORDED_RAW_NOT_A_REJECT', measuredClearBackgroundGapPxNative: 0, basis: 'Beard tip over collar/chest; 0px clear gap. Batch-end ruling reserved only; not a reject ground here.' },
  weaponDeviationsRAW: { verdict: 'RECORDED_RAW', basis: 'Tip margin 37px native (< briefed 40px) recorded with exact candidate hash d92a24af...; length/angle/corridor in band; no per-candidate waiver.' },
}
const gateReport = {
  work: 'cmr15a-amend-walk3', key: 'walk:3', attempt: 'attempt2 (second attempt, amendment)', zeroNewGenerationInGate: true,
  frozenBriefBand: FROZEN,
  inputs: { candidate: { path: dir + 'candidate-raw.png', sha256: sha(candBuf), size: [NATIVE, NATIVE] }, references: ['padded-refs/walk3-padded-ref.png 8a952923...', '01-walk2/accepted.png 893c90d7...'] },
  landmarks: { candWeaponNative, candWeaponAt512: candWeapon, candBeardTipNative, candCrownNative, frontSoleNative, rearToeNative },
  measurements, verdicts, overall: 'REJECT',
  disposition: 'REJECT after salvage - candidate UNACCEPTED, not banked (no accepted.png). Salvage step (1) factor exceeds +-4% cap (not applied); steps (2)-(3) do not cure scale/ground, seams (retained green line) or unproven opposite gait. Post-amendment post-correction unusable count 0->1 (consecutive 1/2; STOP at 2 consecutive, not reached). walk:3 second attempt spent - no third attempt. CMR-15A stays IN_PROGRESS; next amendment key walk:4 only under manager/owner direction.',
  postAmendmentUnusableCountAfterThis: 1,
  consecutiveUnusableAfterThis: 1,
}
writeFileSync(dir + 'gate.json', JSON.stringify(gateReport, null, 2) + '\n')
console.log(JSON.stringify({ weapon: measurements.weaponVsFrozenBand, body: measurements.bodyVsFrozen, ground: measurements.groundVsFrozen, salvage: measurements.salvageStep1Registration, greenPx, frontSoleNative, rearToeNative, overall: 'REJECT' }, null, 1))
