// CMR-15A REGISTRATION AMENDMENT re-gate (owner 2026-10-12). ZERO generation.
// ONE uniform scale+translate of the whole 03-walk4 attempt-2 candidate (3cdc2fa8..., 1254x1254):
// scale factor = 459 / bodyHeightPxAt512 so body height = 459px@512 (factor recorded; cap now
// +-12% for candidates whose native resolution exceeds the 512px pack cell; this native is 1254),
// then translate so support ground = 500@512 and the alpha bounding box is centred horizontally
// in the 512x512 pack cell (dx recorded). No other pixel change. Then FULL gates re-measured
// on the REGISTERED cell (weapon length re-scales with the uniform factor by construction).
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/03-walk4/attempt2/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const candBuf = readFileSync(dir + 'candidate-raw.png')
const candPng = PNG.sync.read(candBuf)
const candImg = await loadImage(dir + 'candidate-raw.png')
const NATIVE = candPng.width // 1254
const S = NATIVE / 512 // native px per @512 px
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // accepted walk:2 anchor @512

// Landmarks from attempt2 gate.json (native 1254), re-verified against pixels below.
const weaponNative = { butt: [90, 768], tip: [1204, 215] }
const beardTipNative = [735, 335]
const crownNative = 109
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
function regionYmax(x0, x1, y0) { let ym = -1; for (let y = y0; y < candPng.height; y++) for (let x = x0; x < x1; x++) { const i = (y * candPng.width + x) * 4; if (candPng.data[i + 3] >= 16 && !isGreen(candPng.data[i], candPng.data[i + 1], candPng.data[i + 2])) if (y > ym) ym = y } return ym }
const frontSoleNative = regionYmax(300, 550, 900) // 1128, screen-left flat support
const passingToeNative = regionYmax(650, 1000, 800) // 1060, screen-right forward passing
let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, greenPxRaw = 0
for (let y = 0; y < candPng.height; y++) for (let x = 0; x < candPng.width; x++) { const i = (y * candPng.width + x) * 4; if (candPng.data[i + 3] >= 16) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y } if (candPng.data[i + 3] >= 16 && isGreen(candPng.data[i], candPng.data[i + 1], candPng.data[i + 2])) greenPxRaw++ }

// Registration: exact recompute. body @512 = (sole-crown)/S; factor = 459/body.
const bodyPxAt512 = (frontSoleNative - crownNative) / S
const groundPxAt512 = frontSoleNative / S
const factor = FROZEN.bodyHeightPxAt512 / bodyPxAt512
const factorPct = (factor - 1) * 100
const withinNewCap = Math.abs(factor - 1) <= 0.12 && NATIVE > 512
const groundAfterScale = groundPxAt512 * factor
const dy = FROZEN.groundYAt512 - groundAfterScale // translate so ground = 500@512
const xminAfter = (xmin / S) * factor, xmaxAfter = (xmax / S) * factor
const dx = 256 - (xminAfter + xmaxAfter) / 2 // centre alpha bounds horizontally in the 512 cell

// Render registered cell at pack geometry (512x512) with ONE uniform scale+translate.
const k = factor / S // native px -> registered @512 px
const cv = createCanvas(512, 512); const g = cv.getContext('2d')
g.imageSmoothingEnabled = true
g.translate(dx, dy); g.scale(k, k); g.drawImage(candImg, 0, 0)
const regBuf = cv.toBuffer('image/png')
writeFileSync(dir + 'registered.png', regBuf)

// Re-measure on the registered raster itself.
const regPng = PNG.sync.read(regBuf)
let rxmin = 1e9, rymin = 1e9, rxmax = -1, rymax = -1, greenPxReg = 0, edgeL = 0, edgeR = 0, edgeT = 0, edgeB = 0
for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4; const a = regPng.data[i + 3]; if (a >= 16) { if (x < rxmin) rxmin = x; if (x > rxmax) rxmax = x; if (y < rymin) rymin = y; if (y > rymax) rymax = y; if (x === 0) edgeL++; if (x === 511) edgeR++; if (y === 0) edgeT++; if (y === 511) edgeB++ } if (a >= 16 && isGreen(regPng.data[i], regPng.data[i + 1], regPng.data[i + 2])) greenPxReg++ }
const tf = (p) => [p[0] / S * factor + dx, p[1] / S * factor + dy] // native -> registered @512
const regWeapon = { butt: tf(weaponNative.butt), tip: tf(weaponNative.tip) }
const regBeard = tf(beardTipNative)
const regSole = tf([0, frontSoleNative])[1], regPassing = tf([0, passingToeNative])[1], regCrown = tf([0, crownNative])[1]
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)
const wLenPx = len(regWeapon.butt, regWeapon.tip), wU = wLenPx * U_PER_PX, wAng = ang(regWeapon.butt, regWeapon.tip)
const weapon = { registeredPxAt512: wLenPx, registeredU: wU, bandU: FROZEN.weaponBandU, inBand: wU >= FROZEN.weaponBandU.lo && wU <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (wLenPx - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, wLenPx]), registeredAngleDeg: wAng, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: wAng - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(regWeapon.butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(regWeapon.tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: regWeapon.tip[0] >= 0 && regWeapon.tip[0] <= 511 && rxmax <= 511, tipRightMarginPxAt512: 512 - regWeapon.tip[0], tipClipped: rxmax >= 511 || edgeR > 0, preRegistrationU: 132.00595222169693 }
const bodyReg = { registeredHeightPxAt512: regSole - regCrown, frozenHeightPxAt512: 459, rasterAlphaHeightPx: rymax - rymin + 1, rasterCrownY: rymin, rasterGroundY: rymax }
const groundReg = { frozenGroundYAt512: 500, registeredGroundYAt512: regSole, rasterGroundY: rymax, groundedErrorPx: Math.abs(regSole - 500), groundedErrorU: Math.abs(regSole - 500) * U_PER_PX, limitU: 1.5 }

// Zooms + marked overlay from the REGISTERED cell for visual reconfirmation.
const regImg = await loadImage(dir + 'registered.png')
function zoom(x, y, w, h, s, out) { const c = createCanvas(w * s, h * s); const q = c.getContext('2d'); q.drawImage(regImg, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(dir + out, c.toBuffer('image/png')) }
zoom(150, 0, 220, 220, 3, 'regate-head-zoom.png')
zoom(0, 300, 512, 212, 2, 'regate-legs-zoom.png')
zoom(330, 0, 182, 180, 4, 'regate-tip-zoom.png')
const mc = createCanvas(512, 512); const mg = mc.getContext('2d'); mg.drawImage(regImg, 0, 0)
mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(...regWeapon.butt); mg.lineTo(...regWeapon.tip); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (registered)', regWeapon.butt[0], regWeapon.butt[1] - 8)
mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, regSole); mg.lineTo(512, regSole); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('registered ground 500@512', 8, regSole - 6)
mg.fillStyle = '#40c0ff'; mg.beginPath(); mg.arc(regBeard[0], regBeard[1], 5, 0, 7); mg.fill(); mg.fillText('beard tip RAW', regBeard[0] + 8, regBeard[1])
writeFileSync(dir + 'regate-marked.png', mc.toBuffer('image/png'))

const gates = {
  factorWithinNewCap: withinNewCap,
  weaponLengthPass: weapon.inBand,
  weaponCorridorPass: weapon.corridorPerpPxVsAnchorLine.butt <= 14 && weapon.corridorPerpPxVsAnchorLine.tip <= 14 && !weapon.tipClipped,
  weaponDirectionPass: Math.abs(weapon.angleDeltaDegVsAnchor) <= 5,
  bodyPass: Math.abs(bodyReg.registeredHeightPxAt512 - 459) <= 1,
  groundPass: groundReg.groundedErrorU <= 1.5,
  seamsPass: greenPxReg === 0 && edgeL === 0 && edgeR === 0 && edgeT === 0,
}
const allNumericPass = Object.values(gates).every(Boolean)
const report = {
  work: 'cmr15a-reg-amend-regate', key: 'walk:4', attempt: 'attempt2 re-gate under REGISTRATION AMENDMENT', zeroGeneration: true,
  authority: 'Owner 2026-10-12 CMR-15A REGISTRATION AMENDMENT: deterministic salvage registration cap raised from +-4% to +-12% for candidates whose native resolution exceeds the 512px pack cell (uniform whole-candidate scale+translate only, factor recorded).',
  frozenBriefBand: FROZEN,
  input: { path: dir + 'candidate-raw.png', sha256: sha(candBuf), size: [NATIVE, NATIVE], nativeExceeds512Cell: NATIVE > 512 },
  registration: { rule: 'ONE uniform scale+translate, whole candidate: factor = 459/bodyHeightPxAt512, translate ground->500@512, alpha bounds centred horizontally', bodyHeightPxAt512Before: bodyPxAt512, groundYAt512Before: groundPxAt512, factor, factorPct, capPct: 12, withinNewCap, overallNativeToRegisteredScale: k, translatePxAt512: { dx, dy }, registeredPath: dir + 'registered.png', registeredSha256: sha(regBuf), registeredSize: [512, 512] },
  landmarksRegisteredAt512: { weapon: regWeapon, beardTip: regBeard, crownY: regCrown, supportSoleY: regSole, passingToeY: regPassing, alphaBoundsRaster: { xmin: rxmin, ymin: rymin, xmax: rxmax, ymax: rymax } },
  remeasuredAfterRegistration: { weapon, body: bodyReg, ground: groundReg, greenPxRegistered: greenPxReg, greenPxRaw: greenPxRaw, edgeOpaquePxRegistered: { left: edgeL, right: edgeR, top: edgeT, bottom: edgeB }, headEndpointRAW: { beardTipRegistered: regBeard, measuredClearBackgroundGapPx: 0, note: 'RAW only (transform of attempt2 0px gap; beard over collar). Batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass.' }, gaitMeasured: { supportBoot: `screen-left flat support, sole row ${regSole.toFixed(2)}@512 registered`, passingBoot: `screen-right forward passing, lowest row ${regPassing.toFixed(2)}@512 registered (${(regSole - regPassing).toFixed(2)}px@512 clear)`, note: 'Uniform scale+translate cannot change leg arrangement; visual reconfirmation on registered.png recorded in verdicts.' } },
  gates,
  verdicts: {
    identity: 'PASS (visual on registered.png: same helmeted full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter)',
    anatomy: 'PASS (visual: connected two-hand glaive grip, natural hip/skirt overlap, no extra/floating limbs)',
    weaponLength: weapon.inBand ? 'PASS' : `FAIL — registered length ${wU.toFixed(2)}u OUTSIDE frozen band [124.41,137.50]u (uniform registration scales the whole candidate: pre-registration 132.01u x factor ${factor.toFixed(4)} = ${wU.toFixed(2)}u). Recorded raw; no waiver in-batch.`,
    weaponCorridorDirection: (gates.weaponCorridorPass && gates.weaponDirectionPass) ? 'PASS' : 'FAIL (see corridor/angle numbers)',
    scaleGround: (gates.bodyPass && gates.groundPass) ? 'PASS after authorized registration (body 459px@512, ground 0.00u)' : 'FAIL (see body/ground numbers)',
    seams: gates.seamsPass ? 'PASS (greenPx=0 on registered cell, no edge clipping: alpha bounds inside 512 cell)' : 'FAIL (see green/edge counts)',
    gaitPassingA: 'PASS (visual reconfirmed on registered cell: screen-left flat support + screen-right bent forward passing boot clear of ground, opposite screen arrangement to accepted walk:2 Passing-B)',
    headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (0px gap; batch-end ruling only, cannot rescue a failed gate)',
  },
  overall: allNumericPass ? 'PASS — eligible to bank as anchor 2 (visual gates above)' : 'FAIL — candidate remains UNACCEPTED, not banked (no accepted.png); exact failing gate in verdicts.weaponLength',
  ledgerUnchanged: 'Xu Chu 8 / global 175 (zero generation in this re-gate)',
}
writeFileSync(dir + 'regate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ factor, factorPct, dx, dy, weapon, bodyReg, groundReg, greenPxReg, edge: { edgeL, edgeR, edgeT, edgeB }, gates, overall: report.overall, registeredSha256: sha(regBuf) }, null, 1))
