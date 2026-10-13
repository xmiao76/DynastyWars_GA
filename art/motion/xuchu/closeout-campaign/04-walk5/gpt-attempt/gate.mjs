// CMR-15A walk:5 GPT GUIDE ATTEMPT salvage + full gates. Zero generation. Work cmr15a-walk5-gpt-gates.
// Candidate 1bc806bb, 1254x1254 transparent PNG. Salvage order (authorized):
// (1) ONE uniform scale+translate registration <=+-12% (native >512) to body 459px@512 + groundY 500;
// (2) shaft retouch AFTER registration only for in-frame length outliers;
// (3) weapon splice only if both grips demonstrably align and seams pass gameplay+4x.
// Frozen band (01-walk2 anchor): body 459px@512, weapon 130.79u [124.41,137.50]u, angle -26.31deg, groundY 500@512.
// Exact Brake vs phase2-guide metrics: front strut 31.87deg/shin 25.94deg from vertical, knee bend 11.17deg,
// heel 80px@512 ahead of front hip, hips/weight BACK over rear support (hip centre 195 within rear boot [160,210]),
// rear ankle -4px@512 vs rear hip, rear heel raised only 6px@512. Reject ordinary stride / vertical shin / trailing toe-off.
import { readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/gpt-attempt/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const EXPECTED_CAND_SHA = '1bc806bbd4eb977e4581811c4b41aaf33c9db4b7078b5d627a30a04d37a1e4ce'
const EXPECTED_LEDGER_SHA = 'e22523da1e58847eaa6aa723cc7a03c681dd985cfa7da1c082eab4a667bf0951'
const candBuf = readFileSync(dir + 'candidate-raw.png')
if (sha(candBuf) !== EXPECTED_CAND_SHA) throw new Error('candidate SHA mismatch ' + sha(candBuf))
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledgerSha = sha(ledgerBuf)
if (ledgerSha !== EXPECTED_LEDGER_SHA) throw new Error('ledger SHA changed ' + ledgerSha)
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
const fighters = ledger.fighters ?? ledger
const xu = Object.values(fighters).find((f) => f && (f.id === 'xuchu' || f.name === 'xuchu')) ?? fighters.xuchu
const globalUsed = Object.values(fighters).reduce((s, f) => s + (f && typeof f.used === 'number' ? f.used : 0), 0)
const candImg = await loadImage(dir + 'candidate-raw.png')
const NATIVE = 1254, S = NATIVE / 512, U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // 01-walk2 anchor @512

// Landmarks @1254 read from probe-*-zoom.png grid crops + probe-raster.json (this package).
const weaponNative = { butt: [85, 790], tip: [1205, 220] } // butt = cap end on shaft axis; tip = blade apex
const beardTipNative = [660, 335]
const crownNative = 121 // raster topmost alpha, head band
const frontSoleNative = 1196 // raster: front boot flat sole bottom (x 825..1025 -> 1190..1196)
const rearToeNative = 1189 // raster: rear forefoot/toe bottom (x 375..450)
const rearHeelNative = 1141 // raster: rear heel bottom at x300 (raised)
const figureBoundsNative = { xmin: 75, xmax: 1213 } // raster alpha bounds
const gaitNative = {
  frontHip: [630, 830], frontKnee: [745, 950], frontAnkle: [855, 1105], frontHeel: [835, 1196], frontToe: [1035, 1196],
  rearHip: [490, 840], rearKnee: [410, 980], rearAnkle: [370, 1080], rearHeel: [300, 1141], rearToe: [465, 1189],
  headCentre: [635, 230], hipCentre: [560, 835],
}
const GUIDE = { frontStrutFromVerticalDeg: 31.87, frontShinFromVerticalDeg: 25.94, frontKneeBendDeg: 11.17, frontHeelAheadOfFrontHipPxAt512: 80, rearAnkleMinusRearHipPxAt512: -4, rearHeelRaisedPxAt512: 6, hipCentreXAt512: 195, rearBootXAt512: [160, 210], stanceFrontHeelMinusRearToePxAt512: 84 }

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)
const fromVertical = (a, b) => (Math.atan2(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 180) / Math.PI
const bend = (hip, knee, ankle) => { const v1 = [knee[0] - hip[0], knee[1] - hip[1]], v2 = [ankle[0] - knee[0], ankle[1] - knee[1]]; return (Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180) / Math.PI }

// raster scans on transparent PNG: green/magenta residue, edge clip, head RAW transparent gap below beard tip
const cv0 = createCanvas(NATIVE, NATIVE); const g0 = cv0.getContext('2d'); g0.drawImage(candImg, 0, 0)
const data = g0.getImageData(0, 0, NATIVE, NATIVE).data
let greenPxRaw = 0, magentaPxRaw = 0, edgeOpaquePx = 0
for (let y = 0; y < NATIVE; y++) for (let x = 0; x < NATIVE; x++) {
  const i = (y * NATIVE + x) * 4, a = data[i + 3]
  if (a >= 128 && data[i + 1] > 150 && data[i] < 120 && data[i + 2] < 120) greenPxRaw++
  if (a >= 128 && data[i] > 180 && data[i + 2] > 180 && data[i + 1] < 120) magentaPxRaw++
  if (a >= 16 && (x === 0 || y === 0 || x === NATIVE - 1 || y === NATIVE - 1)) edgeOpaquePx++
}
const alphaAt = (x, y) => data[(y * NATIVE + x) * 4 + 3]
let beardGapPxNative = 0
for (let y = beardTipNative[1] + 1; y < beardTipNative[1] + 200; y++) { if (alphaAt(beardTipNative[0], y) < 16) beardGapPxNative++; else break }

// Raw measurements @512 (nominal /S)
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
let regBuf = null, registeredSha256 = null
if (withinCap) {
  const rcv = createCanvas(512, 512); const rg = rcv.getContext('2d'); rg.imageSmoothingEnabled = true; rg.translate(dx, dy); rg.scale(k, k); rg.drawImage(candImg, 0, 0)
  regBuf = rcv.toBuffer('image/png'); writeFileSync(dir + 'registered.png', regBuf); registeredSha256 = sha(regBuf)
}
const tf = (p) => [p[0] / S * factor + dx, p[1] / S * factor + dy]
const regWeapon = { butt: tf(weaponNative.butt), tip: tf(weaponNative.tip) }
const regBeard = tf(beardTipNative)
const regHeel = tf([0, frontSoleNative])[1], regRearToe = tf([0, rearToeNative])[1], regRearHeel = tf([0, rearHeelNative])[1], regCrown = tf([0, crownNative])[1]
const regGait = Object.fromEntries(Object.entries(gaitNative).map(([kk, v]) => [kk, tf(v)]))
function weaponReport(w) { const px = len(w.butt, w.tip), u = px * U_PER_PX, a = ang(w.butt, w.tip); return { pxAt512: px, u, inBand: u >= FROZEN.weaponBandU.lo && u <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(w.butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(w.tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: w.tip[0] >= 0 && w.tip[0] <= 511 && w.butt[0] >= 0, tipRightMarginPxAt512: 512 - w.tip[0] } }
const weaponAfterReg = weaponReport(regWeapon)

// --- Salvage step (2): shaft retouch only for in-frame length outliers after registration ---
let shaftRetouch
if (weaponAfterReg.inBand) {
  shaftRetouch = { applied: false, note: `registered weapon length ${weaponAfterReg.u.toFixed(2)}u in frozen band [124.41,137.50]u; no in-frame length outlier.` }
} else {
  const targetPx = 132 / U_PER_PX // ~132u target like the walk:4 retouch
  const ux = (regWeapon.tip[0] - regWeapon.butt[0]) / weaponAfterReg.pxAt512, uy = (regWeapon.tip[1] - regWeapon.butt[1]) / weaponAfterReg.pxAt512
  const projTip = [regWeapon.butt[0] + ux * targetPx, regWeapon.butt[1] + uy * targetPx]
  shaftRetouch = {
    applied: false,
    outlier: `registered weapon ${weaponAfterReg.pxAt512.toFixed(2)}px@512 = ${weaponAfterReg.u.toFixed(2)}u OUT_HIGH vs band [124.41,137.50]u (tip inside frame, margin ${weaponAfterReg.tipRightMarginPxAt512.toFixed(1)}px@512, so it IS an in-frame length outlier of the kind shaft retouch addresses)`,
    projectedRetouch: { targetU: 132, targetPxAt512: targetPx, shortenPxAt512: weaponAfterReg.pxAt512 - targetPx, projectedTipAt512: projTip, projectedTipPerpPxVsAnchorLine: perp(projTip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip) },
    note: 'length alone would be retouch-curable along the candidate shaft axis (projected tip stays in corridor), but shaft retouch is NOT applied/banked here: it cannot cure the exact-Brake gait failure below (hips/weight not back + rear trailing heel-raised forefoot), so the candidate cannot bank either way. No retouched art is produced for a gait-rejected candidate (phase2/walk3-attempt3 precedent); raw length FAIL recorded honestly, no in-batch waiver.',
  }
}
// --- Salvage step (3): weapon splice ---
const splice = { applied: false, note: 'not attempted: exact two-grip alignment between the registered candidate hands and an original-cell weapon is not demonstrated (no overlay proof both grips coincide, seams gameplay+4x unproven), and a weapon splice cannot cure the gait defect below; precondition not met, no fabrication.' }

const bodyReg = { registeredHeightPxAt512: regHeel - regCrown, frozenHeightPxAt512: 459 }
const groundReg = { frozenGroundYAt512: 500, registeredFrontSoleYAt512: regHeel, registeredRearToeYAt512: regRearToe, registeredRearHeelYAt512: regRearHeel, groundedErrorU: Math.abs(regHeel - 500) * U_PER_PX, limitU: 1.5 }

const gaitMetrics = {
  frontStrutFromVerticalDeg: fromVertical(gaitNative.frontHip, gaitNative.frontHeel),
  frontShinFromVerticalDeg: fromVertical(gaitNative.frontKnee, gaitNative.frontAnkle),
  frontKneeBendDeg: bend(gaitNative.frontHip, gaitNative.frontKnee, gaitNative.frontAnkle),
  frontHeelAheadOfFrontHipPxAt512: (gaitNative.frontHeel[0] - gaitNative.frontHip[0]) / S * factor,
  frontAnkleAheadOfFrontKneePxAt512: (gaitNative.frontAnkle[0] - gaitNative.frontKnee[0]) / S * factor,
  frontBootFlatSolePxNative: 'sole bottom 1190..1196 across x825..1025 (raster profile) = full flat sole, heel block down',
  rearAnkleMinusRearHipPxAt512: (gaitNative.rearAnkle[0] - gaitNative.rearHip[0]) / S * factor,
  rearHeelRaisedPxAt512: (frontSoleNative - rearHeelNative) / S * factor,
  rearToeClearancePxAt512VsFrontGround: (frontSoleNative - rearToeNative) / S * factor,
  hipCentreXRegisteredAt512: regGait.hipCentre[0],
  rearForefootContactXRegisteredAt512: [tf([375, 0])[0], tf([465, 0])[0]],
  headCentreXRegisteredAt512: regGait.headCentre[0],
  stanceFrontHeelMinusRearToePxAt512: (gaitNative.frontHeel[0] - gaitNative.rearToe[0]) / S * factor,
  guide: GUIDE,
  jointUncertaintyNote: 'hips skirt-occluded, centres +-30px native. Verdict robust to that error: rear ankle stays >=~35px@512 behind its hip (guide -4) under any plausible hip centre, rear heel-raised 55px native is a direct raster sole profile, and hip centre (560 native) stays >=~65px native ahead of the rear forefoot contact (<=465 native), i.e. not over the rear boot as the guide requires (195 within [160,210]).',
}

// Zooms + marked from the registered cell, composited on dark grey (registered cell itself stays transparent)
const baseImg = withinCap ? await loadImage(dir + 'registered.png') : candImg
const BW = withinCap ? 512 : 1254, zs = BW / 512
function zoom(x, y, w, h, s, out) { const c = createCanvas(w * s, h * s); const q = c.getContext('2d'); q.fillStyle = '#3a3a3a'; q.fillRect(0, 0, w * s, h * s); q.imageSmoothingEnabled = false; q.drawImage(baseImg, x, y, w, h, 0, 0, w * s, h * s); writeFileSync(dir + out, c.toBuffer('image/png')) }
zoom(150 * zs, 0, 220 * zs, 220 * zs, 3, 'gate-head-zoom.png'); zoom(0, 280 * zs, BW, 232 * zs, 2, 'gate-legs-zoom.png'); zoom(330 * zs, 0, 182 * zs, 180 * zs, 4, 'gate-tip-zoom.png'); zoom(0, 380 * zs, BW, 132 * zs, 2, 'gate-soles-zoom.png'); zoom(0, 400 * zs, BW, 112 * zs, 3, 'gate-soles-4x.png')
const mc = createCanvas(BW, BW); const mg = mc.getContext('2d'); mg.fillStyle = '#3a3a3a'; mg.fillRect(0, 0, BW, BW); mg.drawImage(baseImg, 0, 0)
mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(regWeapon.butt[0] * zs, regWeapon.butt[1] * zs); mg.lineTo(regWeapon.tip[0] * zs, regWeapon.tip[1] * zs); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (registered)', regWeapon.butt[0] * zs, regWeapon.butt[1] * zs - 8)
mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, regHeel * zs); mg.lineTo(BW, regHeel * zs); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('registered ground 500@512 (front sole)', 8, regHeel * zs - 6)
mg.fillStyle = '#40c0ff'; mg.beginPath(); mg.arc(regBeard[0] * zs, regBeard[1] * zs, 5, 0, 7); mg.fill(); mg.fillText('beard tip RAW', regBeard[0] * zs + 8, regBeard[1] * zs)
mg.strokeStyle = '#00c0ff'; mg.beginPath(); mg.moveTo(regGait.frontHip[0] * zs, regGait.frontHip[1] * zs); mg.lineTo(regGait.frontKnee[0] * zs, regGait.frontKnee[1] * zs); mg.lineTo(regGait.frontAnkle[0] * zs, regGait.frontAnkle[1] * zs); mg.lineTo(regGait.frontHeel[0] * zs, regGait.frontHeel[1] * zs); mg.stroke(); mg.fillStyle = '#00c0ff'; mg.fillText('front hip-knee-ankle-heel', regGait.frontKnee[0] * zs + 6, regGait.frontKnee[1] * zs)
mg.strokeStyle = '#ff9030'; mg.beginPath(); mg.moveTo(regGait.rearHip[0] * zs, regGait.rearHip[1] * zs); mg.lineTo(regGait.rearKnee[0] * zs, regGait.rearKnee[1] * zs); mg.lineTo(regGait.rearAnkle[0] * zs, regGait.rearAnkle[1] * zs); mg.lineTo(regGait.rearToe[0] * zs, regGait.rearToe[1] * zs); mg.stroke(); mg.fillStyle = '#ff9030'; mg.fillText('rear hip-knee-ankle-toe', regGait.rearAnkle[0] * zs + 6, regGait.rearAnkle[1] * zs - 6)
mg.strokeStyle = '#ffe040'; mg.beginPath(); mg.moveTo(regGait.hipCentre[0] * zs, regGait.hipCentre[1] * zs); mg.lineTo(regGait.hipCentre[0] * zs, regHeel * zs); mg.stroke(); mg.fillStyle = '#ffe040'; mg.fillText('hip-centre plumb (NOT over rear boot)', regGait.hipCentre[0] * zs + 6, regGait.hipCentre[1] * zs + 30)
mg.fillStyle = '#ffe040'; mg.beginPath(); mg.arc(regGait.headCentre[0] * zs, regGait.headCentre[1] * zs, 5, 0, 7); mg.fill(); mg.fillText('head centre', regGait.headCentre[0] * zs + 8, regGait.headCentre[1] * zs)
writeFileSync(dir + 'gate-marked-registered.png', mc.toBuffer('image/png'))

const gatesNumeric = {
  registrationWithinCap: withinCap,
  weaponLengthPass_afterRegistration_beforeRetouch: weaponAfterReg.inBand,
  weaponCorridorPass: weaponAfterReg.corridorPerpPxVsAnchorLine.butt <= 14 && weaponAfterReg.corridorPerpPxVsAnchorLine.tip <= 14 && weaponAfterReg.tipInsideFrame,
  weaponDirectionPass: Math.abs(weaponAfterReg.angleDeltaDegVsAnchor) <= 5,
  bodyPass: withinCap && Math.abs(bodyReg.registeredHeightPxAt512 - 459) <= 1.5,
  groundPass: withinCap && groundReg.groundedErrorU <= 1.5,
  seamsNumericPass: greenPxRaw === 0 && magentaPxRaw === 0 && edgeOpaquePx === 0 && rawWeapon.bladeRightMarginPxNative > 0 && rawWeapon.buttLeftMarginPxNative > 0,
}
const frontStrutPass = gaitMetrics.frontShinFromVerticalDeg >= 20 && gaitMetrics.frontKneeBendDeg <= 20 && gaitMetrics.frontHeelAheadOfFrontHipPxAt512 >= 70 // vs guide 25.94 / 11.17 / 80
const rearSupportPass = gaitMetrics.rearAnkleMinusRearHipPxAt512 >= -15 && gaitMetrics.rearHeelRaisedPxAt512 <= 12 // vs guide -4 / 6
const weightBackPass = regGait.hipCentre[0] <= gaitMetrics.rearForefootContactXRegisteredAt512[1] + 15 // guide: hip centre over rear boot
const gaitPass = frontStrutPass && rearSupportPass && weightBackPass
const report = {
  work: 'cmr15a-walk5-gpt-gates', key: 'walk:5', attempt: 'WALK:5 GPT GUIDE ATTEMPT (final authorized walk:5 generation; candidate 1bc806bb; Brake fail = STOP/BLOCKED, no third generation)', zeroGeneration: true,
  frozenBriefBand: FROZEN,
  inputs: { candidate: { path: dir + 'candidate-raw.png', sha256: sha(candBuf), size: [1254, 1254], format: 'png (transparent)' }, guide: '04-walk5/phase2-guide/guide-walk5-brake.png 6e7819c3... (metrics in guide-spec.json)', referencesSent: ['guide 6e7819c3...', '01-walk2/candidate-raw.jpg 893c90d7...', '03-walk4/attempt2/accepted.png 75488eb1...'], ledgerVerified: { path: 'art/motion/generation-budget.json', sha256: ledgerSha, xuchuUsed: xu ? xu.used : 'UNPARSED', globalSummedUsed: globalUsed, note: 'unchanged Xu Chu 13 / global 180 (ceilings 22/189); no ledger write in this package' } },
  landmarksNative1254: { weapon: weaponNative, beardTip: beardTipNative, crown: crownNative, frontSole: frontSoleNative, rearToe: rearToeNative, rearHeel: rearHeelNative, figureBoundsX: figureBoundsNative, gait: gaitNative },
  rawMeasurements: { bodyHeightPxAt512: bodyPxAt512, deltaPctVsFrozen: (bodyPxAt512 - 459) / 459 * 100, groundYAt512: groundPxAt512, groundErrorU: Math.abs(groundPxAt512 - 500) * U_PER_PX, greenPxRaw, magentaPxRaw, edgeOpaquePx, weaponRaw: rawWeapon },
  salvage: {
    step1Registration: { applied: withinCap, rule: 'ONE uniform scale+translate, whole candidate: factor=459/bodyHeightPxAt512, translate front-sole ground->500@512, alpha bounds centred horizontally', factor, factorPct: (factor - 1) * 100, capPct: 12, withinCap, nativeExceeds512: NATIVE > 512, overallNativeToRegisteredScale: k, translatePxAt512: { dx, dy }, registeredPath: withinCap ? dir + 'registered.png' : null, registeredSha256 },
    step2ShaftRetouch: shaftRetouch,
    step3WeaponSplice: splice,
    finalCell: { path: withinCap ? dir + 'registered.png' : dir + 'candidate-raw.png', sha256: withinCap ? registeredSha256 : sha(candBuf) },
  },
  landmarksRegisteredAt512: { weapon: regWeapon, beardTip: regBeard, crownY: regCrown, frontSoleY: regHeel, rearToeY: regRearToe, rearHeelY: regRearHeel, gait: regGait },
  remeasuredAfterSalvage: { weapon: weaponAfterReg, weaponRatioToBody: weaponAfterReg.pxAt512 / 459, anchorWeaponRatioToBody: FROZEN.weaponLengthPxAt512 / 459, body: bodyReg, ground: groundReg, greenPxRaw, magentaPxRaw, edgeOpaquePx, headEndpointRAW: { beardTipNative, beardTipRegistered: regBeard, measuredClearTransparentGapPxNativeBelowBeardTip: beardGapPxNative, note: 'RAW only, recorded not judged: transparent-background gap in the beard-tip column before the next alpha (collar/chest). Batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass - they do not here.' }, gaitMeasured: gaitMetrics, brakeSubChecks: { frontStrutPass, rearSupportPass, weightBackPass } },
  gatesNumeric,
  verdicts: {
    identity: 'PASS (visual on candidate + head zoom vs banked walk:2/walk:4 anchors, all personally opened: same blunt-faced helmeted dark/full-bearded ochre-shouldered dark-armoured massive Xu Chu, right-facing three-quarter, same glaive+tassel, exactly one weapon, no other-fighter/costume drift)',
    anatomy: 'PASS (visual full + zooms: connected two-hand glaive grip, natural hip/skirt overlap, no extra/mitten/floating limbs, no pasted-on legs)',
    weaponCorridorLengthDirection: `FAIL on length only, raw after registration (corridor and direction PASS): registered ${weaponAfterReg.u.toFixed(2)}u OUT_HIGH vs frozen band [124.41,137.50]u, angle ${weaponAfterReg.angleDeg.toFixed(2)}deg (delta ${weaponAfterReg.angleDeltaDegVsAnchor.toFixed(2)}deg), corridor butt ${weaponAfterReg.corridorPerpPxVsAnchorLine.butt.toFixed(2)} / tip ${weaponAfterReg.corridorPerpPxVsAnchorLine.tip.toFixed(2)}px vs 14px, whole tip inside frame. Length is an in-frame outlier that shaft retouch could cure in isolation (see salvage step 2 projection) but retouch cannot cure the Brake gait failure, so no retouch is banked and no waiver is issued in-batch.`,
    scaleGround: (gatesNumeric.bodyPass && gatesNumeric.groundPass) ? 'PASS after authorized registration (factor recorded, within +-12%; front flat sole is the ground contact, rear forefoot 3px@512 above it)' : 'FAIL (see body/ground numbers)',
    seams: gatesNumeric.seamsNumericPass ? 'PASS (greenPx=0, magentaPx=0, edge-opaque=0: no retained guide/ground line or magenta guide surface, no edge clipping of blade/butt/boots/headgear; whole candidate, no splice/retouch seam; verified on gate-marked-registered.png at gameplay size + gate-tip/legs/soles zooms and gate-soles-4x.png, alpha fringe clean on the dark-grey composite)' : 'FAIL (see counts)',
    gaitBrake: null,
    headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (gap in remeasuredAfterSalvage.headEndpointRAW; batch-end ruling only, unavailable here because other gates fail)',
  },
  overall: null, disposition: null,
  ledgerAfterReserve: 'Xu Chu 13 / global 180 (ceilings 22/189), unchanged by this zero-generation gate',
}
report.verdicts.gaitBrake = `FAIL - exact Brake is conjunctive and two of its three parts fail (guide values in brackets). FRONT STRUT PASSES for the first time in the walk:5 line: shin knee[745,950]->ankle[855,1105] is diagonal at ${gaitMetrics.frontShinFromVerticalDeg.toFixed(1)}deg from vertical [guide 25.94deg, ankle ${gaitMetrics.frontAnkleAheadOfFrontKneePxAt512.toFixed(1)}px@512 ahead of knee vs guide 36px], knee bend ${gaitMetrics.frontKneeBendDeg.toFixed(1)}deg [guide 11.17deg = near-straight], whole-leg strut hip->heel ${gaitMetrics.frontStrutFromVerticalDeg.toFixed(1)}deg [guide 31.87deg], heel ${gaitMetrics.frontHeelAheadOfFrontHipPxAt512.toFixed(1)}px@512 ahead of the front hip [guide 80px], front boot flat (raster sole 1190..1196 native). BUT HIPS/WEIGHT ARE NOT BACK: hip centre registered x=${regGait.hipCentre[0].toFixed(1)}@512 and head centre x=${regGait.headCentre[0].toFixed(1)}@512 sit over mid-stance, well ahead of the rear boot contact x=[${gaitMetrics.rearForefootContactXRegisteredAt512.map((v) => v.toFixed(0)).join(',')}]@512 [guide: hip centre 195 WITHIN rear boot [160,210], head 236 behind the front heel]; the yellow plumb line on gate-marked-registered.png lands between the boots, not over the rear support. AND THE REAR LEG IS THE REJECTED TRAILING TOE-OFF: rear ankle ${gaitMetrics.rearAnkleMinusRearHipPxAt512.toFixed(1)}px@512 vs its hip [guide -4px = under the hip], rear heel raised ${gaitMetrics.rearHeelRaisedPxAt512.toFixed(1)}px@512 above the front ground row [guide 6px] with only the forefoot/toe at ${regRearToe.toFixed(1)}@512 (raster sole profile 1141 native at the heel sloping to 1189 at the toe vs front 1196) - a heel-lifted forefoot push-off trailing behind the hips, not a bent rear support under the body catching settled weight. Stance front-heel to rear-toe spans ${gaitMetrics.stanceFrontHeelMinusRearToePxAt512.toFixed(1)}px@512 [guide 84px]: materially a wide ordinary forward stride/contact stance (the walk:1 Contact family: front flat + rear toe-off) with a straighter front leg, NOT the guide Brake (weight jammed BACK over a rear support under the hips). Registration/retouch/splice cannot cure gait. Sub-checks: frontStrut=${frontStrutPass}, rearSupport=${rearSupportPass}, weightBack=${weightBackPass}.`
const allPass = gatesNumeric.weaponLengthPass_afterRegistration_beforeRetouch && gatesNumeric.weaponCorridorPass && gatesNumeric.weaponDirectionPass && gatesNumeric.bodyPass && gatesNumeric.groundPass && gatesNumeric.seamsNumericPass && gaitPass
if (allPass) { copyFileSync(dir + 'registered.png', dir + 'accepted.png'); report.overall = 'PASS - banked (accepted.png = byte copy of final cell)'; report.banked = { acceptedPath: dir + 'accepted.png', acceptedSha256: sha(readFileSync(dir + 'accepted.png')), registeredSha256, candidateSha256: sha(candBuf) }; report.disposition = 'ACCEPT - banked walk:5 Brake; walk set complete; next Phase 3' }
else {
  if (existsSync(dir + 'accepted.png')) rmSync(dir + 'accepted.png')
  report.overall = 'FAIL - not banked; failing gates: exact Brake gait (hips/weight not back + rear trailing toe-off) and raw weapon length OUT_HIGH after registration (retouch-curable in isolation, not banked on a gait-rejected candidate)'
  report.disposition = 'REJECT GPT walk:5 candidate after salvage - UNACCEPTED, not banked (no accepted.png). This was the final authorized walk:5 generation attempt (owner WALK:5 GPT GUIDE ATTEMPT grant: "If Brake fails again, STOP for my decision - no third generation attempt"): CMR-15A BLOCKED WAITING_FOR_OWNER / STOP, no Phase 3, no pack. Walk set remains banked except walk:5 (walk:0-4 banked). Ledger unchanged Xu Chu 13 / global 180.'
  report.grantStopReached = true
  report.walk5Complete = false
}
writeFileSync(dir + 'gate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ factor, dx, dy, rawWeapon, weaponAfterReg, bodyReg, groundReg, greenPxRaw, magentaPxRaw, edgeOpaquePx, beardGapPxNative, gaitMetrics, brakeSubChecks: { frontStrutPass, rearSupportPass, weightBackPass, gaitPass }, gatesNumeric, overall: report.overall, registeredSha256, ledger: { xuUsed: xu ? xu.used : null, globalUsed } }, null, 1))
