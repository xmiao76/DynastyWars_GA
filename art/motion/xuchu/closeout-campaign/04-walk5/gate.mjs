// CMR-15A walk:5 FIRST attempt salvage + full gates. Zero new generation.
// Candidate is opaque 1024x1024 JPEG (grok, like the walk:2 anchor). Salvage order:
// (1) ONE uniform scale+translate registration <=+-12% (native >512) to body 459px@512 + groundY 500,
//     figure bounds from landmarks (butt cap left .. blade right) centred horizontally;
// (2) shaft retouch AFTER registration only for in-frame length outliers;
// (3) weapon splice only if both grips demonstrably align and seams pass.
// Frozen band from 01-walk2 anchor: body 459px@512, weapon 130.79u [124.41,137.50]u, angle -26.31deg, groundY 500@512.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const EXPECTED_CAND_SHA = 'cc99a96b9b805d1e4c7fb36a65cd91f79b30eed1d74492adc3653b5e077fbd89'
const candBuf = readFileSync(dir + 'candidate-raw.jpg')
if (sha(candBuf) !== EXPECTED_CAND_SHA) throw new Error('candidate SHA mismatch ' + sha(candBuf))
const candImg = await loadImage(dir + 'candidate-raw.jpg')
const NATIVE = 1024, S = NATIVE / 512, U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // 01-walk2 anchor @512 ([70,636]->[972,190] @1024, butt recorded /2 in gate as 35,318)

// Landmarks @1024 read from probe-*-zoom.png grid crops.
const weaponNative = { butt: [68, 634], tip: [968, 186] } // butt = cap end on shaft axis; tip = blade apex (topmost blade point)
const beardTipNative = [545, 263]
const crownNative = 92
const frontSoleNative = 1001 // screen-right flat boot (x~455-650) sole bottom
const rearToeNative = 998 // screen-left toe-down boot (x~120-305) lowest toe point; heel raised
const figureBoundsNative = { xmin: 62, xmax: 974 } // butt cap left .. blade right edge

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

// raw pixel scans (opaque JPEG): green guide-line px + head RAW gap
const cv0 = createCanvas(NATIVE, NATIVE); const g0 = cv0.getContext('2d'); g0.drawImage(candImg, 0, 0)
const data = g0.getImageData(0, 0, NATIVE, NATIVE).data
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
let greenPxRaw = 0
for (let i = 0; i < data.length; i += 4) if (isGreen(data[i], data[i + 1], data[i + 2])) greenPxRaw++
const pxAt = (x, y) => Array.from(data.slice((y * NATIVE + x) * 4, (y * NATIVE + x) * 4 + 3))
const backdropRef = pxAt(950, 600)
const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
let beardGapPxNative = 0
for (let y = beardTipNative[1] + 1; y < beardTipNative[1] + 60; y++) { if (colorDist(pxAt(beardTipNative[0], y), backdropRef) < 40) beardGapPxNative++; else break }

// Raw measurements @512 (nominal /2)
const bodyPxAt512 = (frontSoleNative - crownNative) / S
const groundPxAt512 = frontSoleNative / S
const rawWeaponPx = len(weaponNative.butt, weaponNative.tip) / S
const rawWeapon = { pxAt512: rawWeaponPx, u: rawWeaponPx * U_PER_PX, angleDeg: ang(weaponNative.butt, weaponNative.tip), tipRightMarginPxNative: NATIVE - weaponNative.tip[0], bladeRightMarginPxNative: NATIVE - figureBoundsNative.xmax, buttLeftMarginPxNative: figureBoundsNative.xmin }

// --- Salvage step (1): uniform registration <=+-12% ---
const factor = FROZEN.bodyHeightPxAt512 / bodyPxAt512
const withinCap = Math.abs(factor - 1) <= 0.12 && NATIVE > 512
const dy = FROZEN.groundYAt512 - groundPxAt512 * factor
const xminAfter = (figureBoundsNative.xmin / S) * factor, xmaxAfter = (figureBoundsNative.xmax / S) * factor
const dx = 256 - (xminAfter + xmaxAfter) / 2
const k = factor / S
let regBuf, registeredSha256 = null
if (withinCap) {
  const rcv = createCanvas(512, 512); const rg = rcv.getContext('2d'); rg.imageSmoothingEnabled = true; rg.translate(dx, dy); rg.scale(k, k); rg.drawImage(candImg, 0, 0)
  regBuf = rcv.toBuffer('image/png'); writeFileSync(dir + 'registered.png', regBuf); registeredSha256 = sha(regBuf)
}
const tf = (p) => [p[0] / S * factor + dx, p[1] / S * factor + dy]
const regWeapon = { butt: tf(weaponNative.butt), tip: tf(weaponNative.tip) }
const regBeard = tf(beardTipNative)
const regSole = tf([0, frontSoleNative])[1], regRearToe = tf([0, rearToeNative])[1], regCrown = tf([0, crownNative])[1]
function weaponReport(w) { const px = len(w.butt, w.tip), u = px * U_PER_PX, a = ang(w.butt, w.tip); return { pxAt512: px, u, inBand: u >= FROZEN.weaponBandU.lo && u <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(w.butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(w.tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: w.tip[0] >= 0 && w.tip[0] <= 511 && w.butt[0] >= 0, tipRightMarginPxAt512: 512 - w.tip[0] } }
const weaponAfterReg = weaponReport(regWeapon)

// --- Salvage step (2): shaft retouch only for in-frame length outliers after registration ---
const shaftRetouch = weaponAfterReg.inBand
  ? { applied: false, note: `registered weapon length ${weaponAfterReg.u.toFixed(2)}u in frozen band [124.41,137.50]u; no in-frame length outlier to retouch.` }
  : { applied: false, note: `registered weapon length ${weaponAfterReg.u.toFixed(2)}u OUT of band [124.41,137.50]u — shaft retouch would be the next salvage step; recorded for the verdict below (see gate.json disposition).` }
// --- Salvage step (3): weapon splice ---
const splice = { applied: false, note: 'not attempted: exact grip alignment between the registered candidate hands and the original-cell weapon grips is not demonstrated, and a weapon splice cannot cure the gait-phase defect below; splice precondition (both grips align + seams at gameplay and 4x) not met; no fabrication.' }

const bodyReg = { registeredHeightPxAt512: regSole - regCrown, frozenHeightPxAt512: 459 }
const groundReg = { frozenGroundYAt512: 500, registeredGroundYAt512: regSole, groundedErrorU: Math.abs(regSole - 500) * U_PER_PX, limitU: 1.5 }

// Zooms + marked from the registered cell (or raw if registration not applied)
const baseImg = withinCap ? await loadImage(dir + 'registered.png') : candImg
const BW = withinCap ? 512 : 1024
function zoom(x, y, w, h, s, out) { const c = createCanvas(w * s, h * s); const q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(baseImg, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(dir + out, c.toBuffer('image/png')) }
const zs = BW / 512
zoom(150 * zs, 0, 220 * zs, 220 * zs, 3, 'gate-head-zoom.png'); zoom(0, 280 * zs, BW, 232 * zs, 2, 'gate-legs-zoom.png'); zoom(330 * zs, 0, 182 * zs, 180 * zs, 4, 'gate-tip-zoom.png'); zoom(0, 380 * zs, BW, 132 * zs, 2, 'gate-soles-zoom.png'); zoom(0, 400 * zs, BW, 112 * zs, 3, 'gate-soles-4x.png')
const mc = createCanvas(BW, BW); const mg = mc.getContext('2d'); mg.drawImage(baseImg, 0, 0)
mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(regWeapon.butt[0] * zs, regWeapon.butt[1] * zs); mg.lineTo(regWeapon.tip[0] * zs, regWeapon.tip[1] * zs); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (registered)', regWeapon.butt[0] * zs, regWeapon.butt[1] * zs - 8)
mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, regSole * zs); mg.lineTo(BW, regSole * zs); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('registered ground 500@512', 8, regSole * zs - 6)
mg.fillStyle = '#40c0ff'; mg.beginPath(); mg.arc(regBeard[0] * zs, regBeard[1] * zs, 5, 0, 7); mg.fill(); mg.fillText('beard tip RAW', regBeard[0] * zs + 8, regBeard[1] * zs)
writeFileSync(dir + 'gate-marked-registered.png', mc.toBuffer('image/png'))

const gatesNumeric = {
  registrationWithinCap: withinCap,
  weaponLengthPass: weaponAfterReg.inBand,
  weaponCorridorPass: weaponAfterReg.corridorPerpPxVsAnchorLine.butt <= 14 && weaponAfterReg.corridorPerpPxVsAnchorLine.tip <= 14 && weaponAfterReg.tipInsideFrame,
  weaponDirectionPass: Math.abs(weaponAfterReg.angleDeltaDegVsAnchor) <= 5,
  bodyPass: withinCap && Math.abs(bodyReg.registeredHeightPxAt512 - 459) <= 1.5,
  groundPass: withinCap && groundReg.groundedErrorU <= 1.5,
  seamsNumericPass: greenPxRaw === 0 && rawWeapon.bladeRightMarginPxNative > 0 && rawWeapon.buttLeftMarginPxNative > 0,
}
const gaitPass = false // visual verdict, basis below (front-flat-under-hip + trailing toe-down = contact/toe-off pair; braced-ahead braking + settle-back not demonstrated)
const report = {
  work: 'cmr15a-walk5-attempt1', key: 'walk:5', attempt: 'attempt1 (FIRST attempt)', zeroNewGenerationInGate: true,
  frozenBriefBand: FROZEN,
  inputs: { candidate: { path: dir + 'candidate-raw.jpg', sha256: sha(candBuf), size: [1024, 1024], format: 'jpeg (opaque, grok)' }, references: ['padded-refs/walk5-padded-ref.png df0f13a1...', '01-walk2/accepted.png 893c90d7...', '03-walk4/attempt2/accepted.png 75488eb1...'] },
  landmarksNative1024: { weapon: weaponNative, beardTip: beardTipNative, crown: crownNative, frontSole: frontSoleNative, rearToe: rearToeNative, figureBoundsX: figureBoundsNative },
  rawMeasurements: { bodyHeightPxAt512: bodyPxAt512, deltaPctVsFrozen: (bodyPxAt512 - 459) / 459 * 100, groundYAt512: groundPxAt512, groundErrorU: Math.abs(groundPxAt512 - 500) * U_PER_PX, rearToeClearancePxNativeVsFrontSole: frontSoleNative - rearToeNative, greenPxRaw, weaponRaw: rawWeapon },
  salvage: {
    step1Registration: { applied: withinCap, rule: 'ONE uniform scale+translate, whole candidate: factor=459/bodyHeightPxAt512, translate ground->500@512, landmark figure bounds centred horizontally', factor, factorPct: (factor - 1) * 100, capPct: 12, withinCap, nativeExceeds512: NATIVE > 512, overallNativeToRegisteredScale: k, translatePxAt512: { dx, dy }, registeredPath: withinCap ? dir + 'registered.png' : null, registeredSha256 },
    step2ShaftRetouch: shaftRetouch,
    step3WeaponSplice: splice,
    finalCell: { path: withinCap ? dir + 'registered.png' : dir + 'candidate-raw.jpg', sha256: withinCap ? registeredSha256 : sha(candBuf) },
  },
  landmarksRegisteredAt512: { weapon: regWeapon, beardTip: regBeard, crownY: regCrown, frontSoleY: regSole, rearToeY: regRearToe },
  remeasuredAfterSalvage: { weapon: weaponAfterReg, weaponRatioToBody: weaponAfterReg.pxAt512 / 459, anchorWeaponRatioToBody: FROZEN.weaponLengthPxAt512 / 459, body: bodyReg, ground: groundReg, greenPxRaw, headEndpointRAW: { beardTipNative, beardTipRegistered: regBeard, measuredClearBackgroundGapPxNative: beardGapPxNative, note: 'RAW only (beard tip over collar/chest, as anchors). Batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass.' }, gaitMeasured: { frontBoot: `screen-right boot flat, sole row ${regSole.toFixed(2)}@512 registered (${frontSoleNative}@1024 native), shin vertical under the hip (boot x~455-650 native)`, rearBoot: `screen-left boot toe-down heel-raised trailing behind, lowest toe row ${regRearToe.toFixed(2)}@512 registered (${rearToeNative}@1024 native, ${frontSoleNative - rearToeNative}px native above the front sole = toe at/just leaving ground)`, feetSeparation: 'boots clearly separated front-to-back (rear x~120-305, front x~455-650 native)' } },
  gatesNumeric,
  verdicts: {
    identity: 'PASS (visual on candidate + head zoom: same blunt-faced helmeted dark/full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter, no other-fighter/costume drift; stray neighbouring blade fragment of the padded ref absent, exactly one glaive)',
    anatomy: 'PASS (visual full + zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs)',
    weaponCorridorLengthDirection: (gatesNumeric.weaponLengthPass && gatesNumeric.weaponCorridorPass && gatesNumeric.weaponDirectionPass) ? 'PASS (see weapon numbers; whole tip inside frame)' : 'FAIL (see weapon numbers)',
    scaleGround: (gatesNumeric.bodyPass && gatesNumeric.groundPass) ? 'PASS after authorized registration (factor recorded, within +-12%)' : 'FAIL (see body/ground numbers)',
    seams: gatesNumeric.seamsNumericPass ? 'PASS (greenPx=0: no retained guide/ground line; no edge clipping of blade/butt/boots/headgear; whole candidate, no splice/retouch seam; verified on gate-marked-registered.png gameplay size + gate-tip/gate-legs/gate-soles zooms and gate-soles-4x.png)' : 'FAIL (see green/margin counts)',
    gaitBrake: 'FAIL (visual on candidate + legs/soles zooms, registered reconfirmed: screen-right boot flat with shin VERTICAL under the hip = weight-bearing support, not a forward-planted braced braking leg ahead of the body; screen-left boot toe-down heel-raised trailing behind with toe essentially at the front-sole row = contact/toe-off pair, the same foot-state family as walk:1/walk:3 contacts. No braced-ahead front leg with braking heel pressure and no visible weight-settling-back toward guard is demonstrated, so the walk:5 BRAKE phase (CAMPAIGN (a)) is NOT proven; salvage steps (1)-(3) cannot cure gait. Distinct from the banked passing poses walk:2/walk:4 (no tucked leg), but distinctness alone does not prove Brake.)',
    headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (gap recorded in remeasuredAfterSalvage.headEndpointRAW; batch-end ruling only)',
  },
  overall: null, disposition: null,
  ledgerAfterReserve: 'Xu Chu 10 / global 177 (ceilings 22/189)',
}
const numericPass = Object.values(gatesNumeric).every(Boolean)
const allPass = numericPass && gaitPass
if (allPass) { copyFileSync(dir + 'registered.png', dir + 'accepted.png'); report.overall = 'PASS — banked (accepted.png = byte copy of registered.png)'; report.banked = { acceptedPath: dir + 'accepted.png', acceptedSha256: sha(readFileSync(dir + 'accepted.png')), registeredSha256, note: 'state: registered (salvage step 1); shaft retouch not required' }; report.disposition = 'ACCEPT — banked walk:5 Brake; consecutive post-correction unusable reset to 0'; report.consecutivePostCorrectionUnusableAfterThis = 0 }
else { report.overall = 'FAIL — not banked; exact failing gate(s) in gatesNumeric/verdicts'; report.disposition = 'REJECT attempt-1 after salvage — candidate UNACCEPTED, not banked (no accepted.png); FIRST-attempt failure: eligible for exactly one future briefed second attempt, NOT counted post-correction unusable yet; consecutive post-correction unusable stays 1'; report.consecutivePostCorrectionUnusableAfterThis = 1; report.eligibleForOneBriefedSecondAttempt = true }
writeFileSync(dir + 'gate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ factor, dx, dy, rawWeapon, weaponAfterReg, bodyReg, groundReg, greenPxRaw, beardGapPxNative, gatesNumeric, gaitPass, overall: report.overall, registeredSha256 }, null, 1))
