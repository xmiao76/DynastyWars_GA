// CMR-15A walk:5 Phase 2 (guide-guided) salvage + full gates. Zero generation.
// Candidate is opaque 1024x1024 JPEG. Salvage order (authorized):
// (1) ONE uniform scale+translate registration <=+-12% (native >512) to body 459px@512 + groundY 500;
// (2) shaft retouch AFTER registration only for in-frame length outliers;
// (3) weapon splice only if both grips demonstrably align and seams pass.
// Frozen band from 01-walk2 anchor: body 459px@512, weapon 130.79u [124.41,137.50]u, angle -26.31deg, groundY 500@512.
// Brake judged vs phase2-guide metrics: front strut 31.87deg/shin 25.94deg from vertical, knee bend 11.17deg,
// heel 80px@512 ahead of front hip; rear ankle -4px@512 vs rear hip, heel +6px (partial support under body).
import { readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/phase2/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const EXPECTED_CAND_SHA = '4d9a730885c978bd114387fe45bab69350c37f116903f35ff7e0ab9a5d2c7bf6'
const EXPECTED_LEDGER_SHA = '088825cd3d95f22e2a4be35fdf0026e17983c18b1a124f4bb30df582f73a0cb4'
const candBuf = readFileSync(dir + 'candidate-raw.jpg')
if (sha(candBuf) !== EXPECTED_CAND_SHA) throw new Error('candidate SHA mismatch ' + sha(candBuf))
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledgerSha = sha(ledgerBuf)
if (ledgerSha !== EXPECTED_LEDGER_SHA) throw new Error('ledger SHA changed ' + ledgerSha)
const candImg = await loadImage(dir + 'candidate-raw.jpg')
const NATIVE = 1024, S = NATIVE / 512, U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // 01-walk2 anchor @512

// Landmarks @1024 read from probe-*-zoom.png grid crops (this package).
const weaponNative = { butt: [70, 618], tip: [955, 188] } // butt = cap end on shaft axis; tip = blade apex
const beardTipNative = [535, 260]
const crownNative = 93
const frontHeelNative = 965 // screen-right boot: heel bottom (lowest point); toe raised (see gait joints)
const rearToeNative = 952 // screen-left toe-down boot lowest toe point (13px ABOVE the front-heel row)
const figureBoundsNative = { xmin: 68, xmax: 962 } // butt cap left .. blade right edge
// Visible gait centres estimated on probe-legs/soles zooms (hips skirt-occluded; ranges in gate.json text).
const gaitNative = {
  frontHip: [490, 645], frontKnee: [625, 745], frontAnkle: [625, 885], frontHeel: [600, 965], frontToe: [785, 918],
  rearHip: [375, 650], rearKnee: [395, 805], rearAnkle: [215, 815], rearHeelTop: [180, 800], rearToe: [240, 952],
  headCentre: [505, 185],
}
const GUIDE = { frontStrutFromVerticalDeg: 31.87, frontShinFromVerticalDeg: 25.94, frontKneeBendDeg: 11.17, frontHeelAheadOfFrontHipPxAt512: 80, rearAnkleMinusRearHipPxAt512: -4, rearHeelRaisedPxAt512: 6 }

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)
const fromVertical = (a, b) => (Math.atan2(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 180) / Math.PI
const bend = (hip, knee, ankle) => { const v1 = [knee[0] - hip[0], knee[1] - hip[1]], v2 = [ankle[0] - knee[0], ankle[1] - knee[1]]; return (Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180) / Math.PI }

// raw pixel scans (opaque JPEG): green/magenta guide residue + head RAW gap
const cv0 = createCanvas(NATIVE, NATIVE); const g0 = cv0.getContext('2d'); g0.drawImage(candImg, 0, 0)
const data = g0.getImageData(0, 0, NATIVE, NATIVE).data
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
const isMagenta = (r, g, b) => r > 180 && b > 180 && g < 120
let greenPxRaw = 0, magentaPxRaw = 0
for (let i = 0; i < data.length; i += 4) { if (isGreen(data[i], data[i + 1], data[i + 2])) greenPxRaw++; if (isMagenta(data[i], data[i + 1], data[i + 2])) magentaPxRaw++ }
const pxAt = (x, y) => Array.from(data.slice((y * NATIVE + x) * 4, (y * NATIVE + x) * 4 + 3))
const backdropRef = pxAt(950, 600)
const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
let beardGapPxNative = 0
for (let y = beardTipNative[1] + 1; y < beardTipNative[1] + 60; y++) { if (colorDist(pxAt(beardTipNative[0], y), backdropRef) < 40) beardGapPxNative++; else break }

// Raw measurements @512 (nominal /2)
const bodyPxAt512 = (frontHeelNative - crownNative) / S
const groundPxAt512 = frontHeelNative / S
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
const regHeel = tf([0, frontHeelNative])[1], regRearToe = tf([0, rearToeNative])[1], regCrown = tf([0, crownNative])[1]
const regGait = Object.fromEntries(Object.entries(gaitNative).map(([kk, v]) => [kk, tf(v)]))
function weaponReport(w) { const px = len(w.butt, w.tip), u = px * U_PER_PX, a = ang(w.butt, w.tip); return { pxAt512: px, u, inBand: u >= FROZEN.weaponBandU.lo && u <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(w.butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(w.tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: w.tip[0] >= 0 && w.tip[0] <= 511 && w.butt[0] >= 0, tipRightMarginPxAt512: 512 - w.tip[0] } }
const weaponAfterReg = weaponReport(regWeapon)

// --- Salvage step (2): shaft retouch only for in-frame length outliers after registration ---
const shaftRetouch = weaponAfterReg.inBand
  ? { applied: false, note: `registered weapon length ${weaponAfterReg.u.toFixed(2)}u in frozen band [124.41,137.50]u; no in-frame length outlier to retouch.` }
  : { applied: false, note: `registered weapon length ${weaponAfterReg.u.toFixed(2)}u OUT of band [124.41,137.50]u — length outlier recorded; shaft retouch cannot cure the Brake gait failure below, so no retouch is banked (see disposition).` }
// --- Salvage step (3): weapon splice ---
const splice = { applied: false, note: 'not attempted: exact grip alignment between the registered candidate hands and the original-cell weapon grips is not demonstrated (no overlay proof that both grips coincide), and a weapon splice cannot cure the gait-phase defect below; splice precondition (both grips align + seams pass at gameplay and 4x) not met; no fabrication.' }

const bodyReg = { registeredHeightPxAt512: regHeel - regCrown, frozenHeightPxAt512: 459 }
const groundReg = { frozenGroundYAt512: 500, registeredGroundYAt512: regHeel, groundedErrorU: Math.abs(regHeel - 500) * U_PER_PX, limitU: 1.5 }

const gaitMetrics = {
  frontStrutFromVerticalDeg: fromVertical(gaitNative.frontHip, gaitNative.frontHeel),
  frontShinFromVerticalDeg: fromVertical(gaitNative.frontKnee, gaitNative.frontAnkle),
  frontKneeBendDeg: bend(gaitNative.frontHip, gaitNative.frontKnee, gaitNative.frontAnkle),
  frontHeelAheadOfFrontHipPxAt512: (gaitNative.frontHeel[0] - gaitNative.frontHip[0]) / S * factor,
  frontAnkleAheadOfFrontKneePxAt512: (gaitNative.frontAnkle[0] - gaitNative.frontKnee[0]) / S * factor,
  frontToeRiseAboveHeelPxNative: gaitNative.frontHeel[1] - gaitNative.frontToe[1],
  rearAnkleMinusRearHipPxAt512: (gaitNative.rearAnkle[0] - gaitNative.rearHip[0]) / S * factor,
  rearToeClearancePxNativeVsFrontHeel: frontHeelNative - rearToeNative,
  rearToeYRegisteredAt512: regRearToe,
  headCentreXNative: gaitNative.headCentre[0],
  guide: GUIDE,
  jointUncertaintyNote: 'hips skirt-occluded, centres +-20px native; the verdict does not hinge on hip error: the visible front shin/boot shaft (knee->ankle x 625->625) is vertical within any plausible centre error, and the rear boot is visibly toe-down with its ankle far behind the rear pant leg.',
}

// Zooms + marked from the registered cell (or raw if registration not applied)
const baseImg = withinCap ? await loadImage(dir + 'registered.png') : candImg
const BW = withinCap ? 512 : 1024
function zoom(x, y, w, h, s, out) { const c = createCanvas(w * s, h * s); const q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(baseImg, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(dir + out, c.toBuffer('image/png')) }
const zs = BW / 512
zoom(150 * zs, 0, 220 * zs, 220 * zs, 3, 'gate-head-zoom.png'); zoom(0, 280 * zs, BW, 232 * zs, 2, 'gate-legs-zoom.png'); zoom(330 * zs, 0, 182 * zs, 180 * zs, 4, 'gate-tip-zoom.png'); zoom(0, 380 * zs, BW, 132 * zs, 2, 'gate-soles-zoom.png'); zoom(0, 400 * zs, BW, 112 * zs, 3, 'gate-soles-4x.png')
const mc = createCanvas(BW, BW); const mg = mc.getContext('2d'); mg.drawImage(baseImg, 0, 0)
mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(regWeapon.butt[0] * zs, regWeapon.butt[1] * zs); mg.lineTo(regWeapon.tip[0] * zs, regWeapon.tip[1] * zs); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (registered)', regWeapon.butt[0] * zs, regWeapon.butt[1] * zs - 8)
mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, regHeel * zs); mg.lineTo(BW, regHeel * zs); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('registered ground 500@512 (front heel)', 8, regHeel * zs - 6)
mg.fillStyle = '#40c0ff'; mg.beginPath(); mg.arc(regBeard[0] * zs, regBeard[1] * zs, 5, 0, 7); mg.fill(); mg.fillText('beard tip RAW', regBeard[0] * zs + 8, regBeard[1] * zs)
mg.strokeStyle = '#00c0ff'; mg.beginPath(); mg.moveTo(regGait.frontHip[0] * zs, regGait.frontHip[1] * zs); mg.lineTo(regGait.frontKnee[0] * zs, regGait.frontKnee[1] * zs); mg.lineTo(regGait.frontAnkle[0] * zs, regGait.frontAnkle[1] * zs); mg.stroke(); mg.fillStyle = '#00c0ff'; mg.fillText('front hip-knee-ankle', regGait.frontKnee[0] * zs + 6, regGait.frontKnee[1] * zs)
mg.strokeStyle = '#ff9030'; mg.beginPath(); mg.moveTo(regGait.rearHip[0] * zs, regGait.rearHip[1] * zs); mg.lineTo(regGait.rearKnee[0] * zs, regGait.rearKnee[1] * zs); mg.lineTo(regGait.rearAnkle[0] * zs, regGait.rearAnkle[1] * zs); mg.lineTo(regGait.rearToe[0] * zs, regGait.rearToe[1] * zs); mg.stroke(); mg.fillStyle = '#ff9030'; mg.fillText('rear hip-knee-ankle-toe', regGait.rearAnkle[0] * zs + 6, regGait.rearAnkle[1] * zs - 6)
writeFileSync(dir + 'gate-marked-registered.png', mc.toBuffer('image/png'))

const gatesNumeric = {
  registrationWithinCap: withinCap,
  weaponLengthPass: weaponAfterReg.inBand,
  weaponCorridorPass: weaponAfterReg.corridorPerpPxVsAnchorLine.butt <= 14 && weaponAfterReg.corridorPerpPxVsAnchorLine.tip <= 14 && weaponAfterReg.tipInsideFrame,
  weaponDirectionPass: Math.abs(weaponAfterReg.angleDeltaDegVsAnchor) <= 5,
  bodyPass: withinCap && Math.abs(bodyReg.registeredHeightPxAt512 - 459) <= 1.5,
  groundPass: withinCap && groundReg.groundedErrorU <= 1.5,
  seamsNumericPass: greenPxRaw === 0 && magentaPxRaw === 0 && rawWeapon.bladeRightMarginPxNative > 0 && rawWeapon.buttLeftMarginPxNative > 0,
}
const gaitPass = false // visual+measured verdict, basis in verdicts.gaitBrake (vertical front shin + bent knee, toe-up heel-strike front foot; rear toe-down trailing boot above the ground row; weight forward over the stride, not back over a rear support)
const report = {
  work: 'cmr15a-walk5-phase2-gates', key: 'walk:5', attempt: 'Phase 2 guide-guided single edit (sole Phase 2 attempt; candidate 4d9a7308)', zeroGeneration: true,
  frozenBriefBand: FROZEN,
  inputs: { candidate: { path: dir + 'candidate-raw.jpg', sha256: sha(candBuf), size: [1024, 1024], format: 'jpeg (opaque)' }, guide: '04-walk5/phase2-guide/guide-walk5-brake.png 6e7819c3... (metrics in guide-spec.json)', referencesSent: ['guide 6e7819c3...', '01-walk2/candidate-raw.jpg 893c90d7...', '03-walk4/attempt2/accepted.png 75488eb1...'], ledgerVerified: { path: 'art/motion/generation-budget.json', sha256: ledgerSha, note: 'unchanged Xu Chu 12 / global 179 (ceilings 22/189); no ledger write in this package' } },
  landmarksNative1024: { weapon: weaponNative, beardTip: beardTipNative, crown: crownNative, frontHeel: frontHeelNative, rearToe: rearToeNative, figureBoundsX: figureBoundsNative, gait: gaitNative },
  rawMeasurements: { bodyHeightPxAt512: bodyPxAt512, deltaPctVsFrozen: (bodyPxAt512 - 459) / 459 * 100, groundYAt512: groundPxAt512, groundErrorU: Math.abs(groundPxAt512 - 500) * U_PER_PX, rearToeClearancePxNativeVsFrontHeel: frontHeelNative - rearToeNative, greenPxRaw, magentaPxRaw, weaponRaw: rawWeapon },
  salvage: {
    step1Registration: { applied: withinCap, rule: 'ONE uniform scale+translate, whole candidate: factor=459/bodyHeightPxAt512, translate front-heel ground->500@512, landmark figure bounds centred horizontally', factor, factorPct: (factor - 1) * 100, capPct: 12, withinCap, nativeExceeds512: NATIVE > 512, overallNativeToRegisteredScale: k, translatePxAt512: { dx, dy }, registeredPath: withinCap ? dir + 'registered.png' : null, registeredSha256 },
    step2ShaftRetouch: shaftRetouch,
    step3WeaponSplice: splice,
    finalCell: { path: withinCap ? dir + 'registered.png' : dir + 'candidate-raw.jpg', sha256: withinCap ? registeredSha256 : sha(candBuf) },
  },
  landmarksRegisteredAt512: { weapon: regWeapon, beardTip: regBeard, crownY: regCrown, frontHeelY: regHeel, rearToeY: regRearToe, gait: regGait },
  remeasuredAfterSalvage: { weapon: weaponAfterReg, weaponRatioToBody: weaponAfterReg.pxAt512 / 459, anchorWeaponRatioToBody: FROZEN.weaponLengthPxAt512 / 459, body: bodyReg, ground: groundReg, greenPxRaw, magentaPxRaw, headEndpointRAW: { beardTipNative, beardTipRegistered: regBeard, measuredClearBackgroundGapPxNative: beardGapPxNative, note: 'RAW only (beard tip over collar/chest, as anchors). Batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass — they do not here.' }, gaitMeasured: gaitMetrics },
  gatesNumeric,
  verdicts: {
    identity: 'PASS (visual on candidate + head zoom vs banked walk:2/walk:4 anchors, all opened: same blunt-faced helmeted dark/full-bearded ochre-shouldered dark-armoured massive Xu Chu, right-facing three-quarter, same glaive+tassel, exactly one weapon, no other-fighter/costume drift)',
    anatomy: 'PASS (visual full + zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs, no pasted-on legs)',
    weaponCorridorLengthDirection: (gatesNumeric.weaponLengthPass && gatesNumeric.weaponCorridorPass && gatesNumeric.weaponDirectionPass) ? 'PASS (see weapon numbers; whole tip inside frame)' : 'FAIL (see weapon numbers)',
    scaleGround: (gatesNumeric.bodyPass && gatesNumeric.groundPass) ? 'PASS after authorized registration (factor recorded, within +-12%; front heel is the ground contact)' : 'FAIL (see body/ground numbers)',
    seams: gatesNumeric.seamsNumericPass ? 'PASS (greenPx=0 and magentaPx=0: no retained guide/ground line or magenta guide surface; no edge clipping of blade/butt/boots/headgear; whole candidate, no splice/retouch seam; verified on gate-marked-registered.png gameplay size + gate-tip/gate-legs/gate-soles zooms and gate-soles-4x.png)' : 'FAIL (see green/magenta/margin counts)',
    gaitBrake: null,
    headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (gap recorded in remeasuredAfterSalvage.headEndpointRAW; batch-end ruling only, and unavailable here because another gate fails)',
  },
  overall: null, disposition: null,
  ledgerAfterReserve: 'Xu Chu 12 / global 179 (ceilings 22/189), unchanged by this zero-generation gate',
}
report.verdicts.gaitBrake = `FAIL (visual on candidate + probe/gate legs+soles zooms, registered reconfirmed; guide metrics in brackets — front leg is NOT a near-straight diagonal braced strut: visible shin/boot-shaft knee[625,745]->ankle[625,885] is VERTICAL (${gaitMetrics.frontShinFromVerticalDeg.toFixed(1)}deg from vertical [guide 25.94deg], ankle ${gaitMetrics.frontAnkleAheadOfFrontKneePxAt512.toFixed(1)}px@512 ahead of knee [guide 36px]), knee bend ${gaitMetrics.frontKneeBendDeg.toFixed(1)}deg [guide 11.17deg], whole-leg strut hip->heel ${gaitMetrics.frontStrutFromVerticalDeg.toFixed(1)}deg [guide 31.87deg] with heel ${gaitMetrics.frontHeelAheadOfFrontHipPxAt512.toFixed(1)}px@512 ahead of the front hip [guide 80px]; the front foot is a forward-stride heel-strike with toe raised ${gaitMetrics.frontToeRiseAboveHeelPxNative}px native above the heel, not a flat boot planted with braking pressure. Rear leg is the rejected TRAILING TOE-OFF pattern: boot hangs toe-down behind the body, ankle ${gaitMetrics.rearAnkleMinusRearHipPxAt512.toFixed(1)}px@512 vs the rear hip [guide -4px = under the hip], toe lowest row ${rearToeNative} native = ${gaitMetrics.rearToeClearancePxNativeVsFrontHeel}px native ABOVE the front-heel ground row ${frontHeelNative} (registered ${regRearToe.toFixed(1)}@512 vs ground 500) so it is not a grounded rear support catching settling weight. Head/torso lean forward over the stride (head centre x~505 native, ahead of both hips) — no hips-low/back weight-settling toward guard is demonstrated. This is materially the contact/toe-off stride rejected in walk:5 attempts 1-2 (vertical shin + trailing toe-down boot), not the Phase-2 guide Brake (diagonal braced front strut, heel ahead, weight back over a bent rear support under the hips). Salvage steps (1)-(3) cannot cure gait.)`
const numericPass = Object.values(gatesNumeric).every(Boolean)
const allPass = numericPass && gaitPass
if (allPass) { copyFileSync(dir + 'registered.png', dir + 'accepted.png'); report.overall = 'PASS — banked (accepted.png = byte copy of final cell)'; report.banked = { acceptedPath: dir + 'accepted.png', acceptedSha256: sha(readFileSync(dir + 'accepted.png')), registeredSha256, candidateSha256: sha(candBuf) }; report.disposition = 'ACCEPT — banked walk:5 Brake; walk set walk:5 complete' }
else {
  if (existsSync(dir + 'accepted.png')) rmSync(dir + 'accepted.png')
  report.overall = 'FAIL — not banked; exact failing gate(s) in gatesNumeric/verdicts'
  report.disposition = 'REJECT Phase 2 candidate after salvage — candidate UNACCEPTED, not banked (no accepted.png); sole Phase 2 attempt spent. Brake gait FAIL triggers the Alternative Completion grant STOP ("if Brake gait fails, STOP for my decision"): CMR-15A BLOCKED WAITING_FOR_OWNER, no further requests, no Phase 3. Walk set remains banked except walk:5.'
  report.grantStopReached = true
  report.walk5Complete = false
}
writeFileSync(dir + 'gate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ factor, dx, dy, rawWeapon, weaponAfterReg, bodyReg, groundReg, greenPxRaw, magentaPxRaw, beardGapPxNative, gaitMetrics, gatesNumeric, gaitPass, overall: report.overall, registeredSha256 }, null, 1))
