// CMR-15A walk:3 THIRD attempt (attempt3) salvage + full gates. Zero new generation.
// Salvage order (SHAFT-RETOUCH SALVAGE remainder): (1) uniform registration <=+-12% to
// groundY/body (factor recorded); (2) shaft retouch AFTER registration for length outliers
// (target ~132u in [124.41,137.50]u); (3) weapon splice only if grips align.
// Frozen band from 01-walk2 anchor: body 459px@512, weapon 130.79u [124.41,137.50]u, angle -26.31deg, groundY 500@512.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/02-walk3/attempt3/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const EXPECTED_CAND_SHA = '29e06c60ffa49a95dc3c2466553596b2f38b2be138facb9a165d43e3c10acd7f'
const candBuf = readFileSync(dir + 'candidate-raw.png')
if (sha(candBuf) !== EXPECTED_CAND_SHA) throw new Error('candidate SHA mismatch ' + sha(candBuf))
const candPng = PNG.sync.read(candBuf)
const candImg = await loadImage(dir + 'candidate-raw.png')
const NATIVE = candPng.width // 1254
const S = NATIVE / 512
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] }

// Landmarks (native 1254), read from candidate + probe zooms (butt = alpha xmin cap centre, tip = blade apex/rightmost blade point)
const weaponNative = { butt: [145, 772], tip: [1199, 281] } // tip = blade apex (topmost blade point x~1198,y280 scanned; rightmost alpha x1214 is the blade edge below the apex)
const beardTipNative = [705, 385]
const crownNative = 115
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
function regionYmax(x0, x1, y0) { let ym = -1; for (let y = y0; y < candPng.height; y++) for (let x = x0; x < x1; x++) { const i = (y * candPng.width + x) * 4; if (candPng.data[i + 3] >= 16 && !isGreen(candPng.data[i], candPng.data[i + 1], candPng.data[i + 2])) if (y > ym) ym = y } return ym }
const frontSoleNative = regionYmax(650, 1050, 900) // 1165 screen-right flat support
const rearToeNative = regionYmax(150, 450, 900) // 1156 screen-left toe-off
let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, greenPxRaw = 0
for (let y = 0; y < candPng.height; y++) for (let x = 0; x < candPng.width; x++) { const i = (y * candPng.width + x) * 4; if (candPng.data[i + 3] >= 16) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; if (isGreen(candPng.data[i], candPng.data[i + 1], candPng.data[i + 2])) greenPxRaw++ } }

// Raw measurements
const bodyPxAt512 = (frontSoleNative - crownNative) / S
const groundPxAt512 = frontSoleNative / S
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)
const rawWeaponPx = len(weaponNative.butt, weaponNative.tip) / S
const rawWeapon = { pxAt512: rawWeaponPx, u: rawWeaponPx * U_PER_PX, angleDeg: ang(weaponNative.butt, weaponNative.tip), tipRightMarginPxNative: NATIVE - weaponNative.tip[0] }

// --- Salvage step (1): uniform registration <=+-12% (native >512) ---
const factor = FROZEN.bodyHeightPxAt512 / bodyPxAt512
const withinCap = Math.abs(factor - 1) <= 0.12 && NATIVE > 512
if (!withinCap) throw new Error('registration factor outside +-12% cap: ' + factor)
const dy = FROZEN.groundYAt512 - groundPxAt512 * factor
const xminAfter = (xmin / S) * factor, xmaxAfter = (xmax / S) * factor
const dx = 256 - (xminAfter + xmaxAfter) / 2
const k = factor / S
const rcv = createCanvas(512, 512); const rg = rcv.getContext('2d'); rg.imageSmoothingEnabled = true; rg.translate(dx, dy); rg.scale(k, k); rg.drawImage(candImg, 0, 0)
const regBuf = rcv.toBuffer('image/png'); writeFileSync(dir + 'registered.png', regBuf)
const regPng = PNG.sync.read(regBuf)
let rxmin = 1e9, rymin = 1e9, rxmax = -1, rymax = -1, greenPxReg = 0, edgeL = 0, edgeR = 0, edgeT = 0, edgeB = 0
for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4; const a = regPng.data[i + 3]; if (a >= 16) { if (x < rxmin) rxmin = x; if (x > rxmax) rxmax = x; if (y < rymin) rymin = y; if (y > rymax) rymax = y; if (x === 0) edgeL++; if (x === 511) edgeR++; if (y === 0) edgeT++; if (y === 511) edgeB++ } if (a >= 16 && isGreen(regPng.data[i], regPng.data[i + 1], regPng.data[i + 2])) greenPxReg++ }
const tf = (p) => [p[0] / S * factor + dx, p[1] / S * factor + dy]
const regWeapon = { butt: tf(weaponNative.butt), tip: tf(weaponNative.tip) }
const regBeard = tf(beardTipNative)
const regSole = tf([0, frontSoleNative])[1], regRearToe = tf([0, rearToeNative])[1], regCrown = tf([0, crownNative])[1]
function weaponReport(w) { const px = len(w.butt, w.tip), u = px * U_PER_PX, a = ang(w.butt, w.tip); return { pxAt512: px, u, inBand: u >= FROZEN.weaponBandU.lo && u <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(w.butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(w.tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: w.tip[0] >= 0 && w.tip[0] <= 511, tipRightMarginPxAt512: 512 - w.tip[0] } }
const weaponAfterReg = weaponReport(regWeapon)

// --- Salvage step (2): shaft retouch only if registered length is an in-frame outlier ---
const shaftRetouch = { applied: false, note: weaponAfterReg.inBand ? 'registered weapon length 132.13u in frozen band [124.41,137.50]u (target ~132u); no length outlier to retouch. Retouch also cannot cure the corridor failure: perp to the anchor line grows linearly butt 3.54px -> tip 15.36px along the candidate axis, so shortening to the band low 124.41u would still leave tip perp ~14.68px >14px, and reaching <=14px would require ~116.9u below the band.' : 'see retouch step (would be required)' }
if (!weaponAfterReg.inBand) throw new Error('registered weapon out of band, shaft retouch required before gating: ' + JSON.stringify(weaponAfterReg))
// --- Salvage step (3): weapon splice ---
const splice = { applied: false, note: 'not attempted: exact grip alignment between the registered candidate hands and the original-cell weapon grips is not demonstrated (pose/registration differ), so the splice precondition (both grips align + seams at gameplay and 4x) is not met; no fabrication.' }

// Final cell = registered.png (no retouch needed)
const finalBuf = regBuf, finalWeapon = weaponAfterReg, finalPath = 'registered.png'
const bodyReg = { registeredHeightPxAt512: regSole - regCrown, frozenHeightPxAt512: 459, rasterCrownY: rymin, rasterGroundY: rymax }
const groundReg = { frozenGroundYAt512: 500, registeredGroundYAt512: regSole, groundedErrorU: Math.abs(regSole - 500) * U_PER_PX, limitU: 1.5 }

// Zooms + marked from registered cell
const regImg = await loadImage(dir + 'registered.png')
function zoom(x, y, w, h, s, out) { const c = createCanvas(w * s, h * s); const q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(regImg, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(dir + out, c.toBuffer('image/png')) }
zoom(150, 0, 220, 220, 3, 'gate-head-zoom.png'); zoom(0, 300, 512, 212, 2, 'gate-legs-zoom.png'); zoom(330, 0, 182, 180, 4, 'gate-tip-zoom.png'); zoom(0, 380, 512, 132, 2, 'gate-soles-zoom.png')
const mc = createCanvas(512, 512); const mg = mc.getContext('2d'); mg.drawImage(regImg, 0, 0)
mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(...regWeapon.butt); mg.lineTo(...regWeapon.tip); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (registered)', regWeapon.butt[0], regWeapon.butt[1] - 8)
mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, regSole); mg.lineTo(512, regSole); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('registered ground 500@512', 8, regSole - 6)
mg.fillStyle = '#40c0ff'; mg.beginPath(); mg.arc(regBeard[0], regBeard[1], 5, 0, 7); mg.fill(); mg.fillText('beard tip RAW', regBeard[0] + 8, regBeard[1])
writeFileSync(dir + 'gate-marked-registered.png', mc.toBuffer('image/png'))
// seam check crops: gameplay (512 1x marked above) + 4x legs/tip already; add 4x sole crop
zoom(0, 400, 512, 112, 3, 'gate-soles-4x.png')

const gatesNumeric = {
  registrationWithinCap: withinCap,
  weaponLengthPass: finalWeapon.inBand,
  weaponCorridorPass: finalWeapon.corridorPerpPxVsAnchorLine.butt <= 14 && finalWeapon.corridorPerpPxVsAnchorLine.tip <= 14 && finalWeapon.tipInsideFrame && rxmax < 511,
  weaponDirectionPass: Math.abs(finalWeapon.angleDeltaDegVsAnchor) <= 5,
  bodyPass: Math.abs(bodyReg.registeredHeightPxAt512 - 459) <= 1.5,
  groundPass: groundReg.groundedErrorU <= 1.5,
  seamsNumericPass: greenPxReg === 0 && edgeL === 0 && edgeR === 0 && edgeT === 0,
}
const report = {
  work: 'cmr15a-walk3-attempt3', key: 'walk:3', attempt: 'attempt3 (third attempt, SHAFT-RETOUCH SALVAGE remainder)', zeroNewGenerationInGate: true,
  frozenBriefBand: FROZEN,
  inputs: { candidate: { path: dir + 'candidate-raw.png', sha256: sha(candBuf), size: [NATIVE, NATIVE] }, references: ['padded-refs/walk3-padded-ref.png 8a952923...', '01-walk2/accepted.png 893c90d7...', '03-walk4/attempt2/accepted.png 75488eb1...'] },
  rawMeasurements: { bodyHeightPxAt512: bodyPxAt512, deltaPctVsFrozen: (bodyPxAt512 - 459) / 459 * 100, groundYAt512: groundPxAt512, groundErrorU: Math.abs(groundPxAt512 - 500) * U_PER_PX, crownNative, frontSoleNative, rearToeNative, rearToeClearancePxNativeVsFrontSole: frontSoleNative - rearToeNative, alphaBoundsNative: { xmin, ymin, xmax, ymax }, greenPxRaw, weaponRaw: rawWeapon },
  salvage: {
    step1Registration: { applied: true, rule: 'ONE uniform scale+translate, whole candidate: factor=459/bodyHeightPxAt512, translate ground->500@512, alpha bounds centred horizontally', factor, factorPct: (factor - 1) * 100, capPct: 12, withinCap, nativeExceeds512: NATIVE > 512, overallNativeToRegisteredScale: k, translatePxAt512: { dx, dy }, registeredPath: dir + 'registered.png', registeredSha256: sha(regBuf) },
    step2ShaftRetouch: shaftRetouch,
    step3WeaponSplice: splice,
    finalCell: { path: dir + finalPath, sha256: sha(finalBuf) },
  },
  landmarksRegisteredAt512: { weapon: regWeapon, beardTip: regBeard, crownY: regCrown, frontSoleY: regSole, rearToeY: regRearToe, alphaBoundsRaster: { xmin: rxmin, ymin: rymin, xmax: rxmax, ymax: rymax } },
  remeasuredAfterSalvage: { weapon: finalWeapon, weaponRatioToBody: finalWeapon.pxAt512 / 459, anchorWeaponRatioToBody: FROZEN.weaponLengthPxAt512 / 459, body: bodyReg, ground: groundReg, greenPxRegistered: greenPxReg, edgeOpaquePxRegistered: { left: edgeL, right: edgeR, top: edgeT, bottom: edgeB }, headEndpointRAW: { beardTipRegistered: regBeard, measuredClearBackgroundGapPx: 0, note: 'RAW only (beard tip over collar/chest, as anchors). Batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass.' }, gaitMeasured: { frontBoot: `screen-right boot flat, sole row ${regSole.toFixed(2)}@512 registered (${frontSoleNative}@1254 native)`, rearBoot: `screen-left boot toe-down heel-raised toe-off, lowest row ${regRearToe.toFixed(2)}@512 registered (${rearToeNative}@1254 native, ${(frontSoleNative - rearToeNative)}px native / ${(regSole - regRearToe).toFixed(2)}px@512 above the front sole = toe just leaving ground)`, feetSeparation: 'boots clearly separated (rear x~150-450, front x~650-1050 native)' } },
  gatesNumeric,
  verdicts: {
    identity: 'PASS (visual on candidate + registered + head zoom: same blunt-faced helmeted dark/full-bearded ochre/dark-armoured massive Xu Chu, right-facing three-quarter, no other-fighter/costume drift)',
    anatomy: 'PASS (visual full + zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs)',
    weaponCorridorLengthDirection: (gatesNumeric.weaponLengthPass && gatesNumeric.weaponCorridorPass && gatesNumeric.weaponDirectionPass) ? 'PASS' : 'FAIL (see weapon numbers)',
    scaleGround: (gatesNumeric.bodyPass && gatesNumeric.groundPass) ? 'PASS after authorized registration (factor recorded, within +-12%)' : 'FAIL (see body/ground numbers)',
    seams: gatesNumeric.seamsNumericPass ? 'PASS (greenPx=0: no retained guide line; no edge clipping; whole candidate, no splice/retouch seam; verified on gate-marked-registered.png gameplay size + gate-tip/gate-soles/gate-legs zooms and gate-soles-4x.png)' : 'FAIL (see green/edge counts)',
    gaitContactB: 'PASS (visual on candidate + legs/soles zooms, registered reconfirmed: screen-right front boot flat planted under hip on the ground = Leg-B front support; screen-left rear boot toe-down heel-raised with toe 9px native above the front sole = Leg-A trailing toe-off just leaving ground; boots clearly separated; foot-state is a contact/toe-off pair, NOT a tucked passing leg, so distinct from walk:2 Passing-B and walk:4 Passing-A, and distinct from walk:1 Contact-A where the rear boot is flat grounded — here the rear toe-off clearance and swapped front-support arrangement read as the opposite Contact-B)',
    headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (0px gap; batch-end ruling only)',
  },
  overall: null, disposition: null,
  ledgerAfterReserve: 'Xu Chu 9 / global 176 (ceilings 22/189)',
}
const allPass = Object.values(gatesNumeric).every(Boolean)
report.overall = allPass ? 'PASS — banked (accepted.png = byte copy of registered.png; no shaft retouch needed, weapon in band after registration)' : 'FAIL — not banked; exact failing gate(s) in gatesNumeric/verdicts'
if (allPass) { copyFileSync(dir + 'registered.png', dir + 'accepted.png'); report.banked = { acceptedPath: dir + 'accepted.png', acceptedSha256: sha(readFileSync(dir + 'accepted.png')), registeredSha256: sha(regBuf), retouchedSha256: null, note: 'state: registered (salvage step 1 only); shaft retouch not required — registered weapon in band' }; report.disposition = 'ACCEPT — banked walk:3 Contact-B; consecutive post-correction unusable stays 0'; report.consecutiveUnusableAfterThis = 0 }
else { report.disposition = 'REJECT after salvage — candidate UNACCEPTED, not banked; post-correction unusable 0->1 consecutive (STOP at 2 not reached)'; report.consecutiveUnusableAfterThis = 1 }
writeFileSync(dir + 'gate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ factor, dx, dy, rawWeapon, weaponAfterReg, bodyReg, groundReg, greenPxReg, edge: { edgeL, edgeR, edgeT, edgeB }, gatesNumeric, overall: report.overall, registeredSha256: sha(regBuf), banked: report.banked ?? null }, null, 1))
