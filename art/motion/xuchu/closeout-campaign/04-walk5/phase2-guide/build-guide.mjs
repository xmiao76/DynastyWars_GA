// CMR-15A Alternative Completion Phase 2 — grey-mannequin Brake guide for walk:5
// (work cmr15a-walk5-guide, ZERO generation, no reservation, ledger untouched).
//
// Deterministic: every output below is drawn from the fixed joint constants in
// this file (@512 pack space, rendered x2 onto a 1024x1024 generation canvas).
// Re-running reproduces byte-identical PNGs and guide-spec.json.
//
// Donor (lower-body joint trace): Li Dian charge cell 4 "brake" in
// art/motion/lidian/charge-prepared-source.png (3x3 sheet, row-major cell 4 =
// centre cell; layout label "brake" in art/motion/lidian/registration.json
// layout.charge position 4; authored order coil/launch/dash/dash2/brake in
// charge-prompt.txt). Its front leg is a near-straight diagonal strut
// (hip->ankle ~41deg from vertical, shin ~31deg, heel planted far ahead).
// Its torso leans forward and its rear leg trails — those are NOT copied:
// the Xu Chu guide keeps the upright torso/head/weapon of the banked walk:2
// anchor and places the rear leg as a bent support under the hips (weight
// settling back), per CAMPAIGN (a) walk:5 Brake.
//
// Anchor geometry (frozen brief band, banked walk:2, gate.json): body
// 459px@512, crownY 41@512, groundY 500@512, weapon butt[35,318] tip[486,95]
// @512 (503.12px = 130.79u, -26.31deg). At 1024: crown 82, ground 1000,
// butt [70,636], tip [972,190] — same padded generation geometry as
// padded-refs/ (1024 canvas, tip >=40px inside every edge).
//
// Method follows the repo whole-frame guide machinery
// (test/game/wholeframe-guides.test.ts + motion-guides.test.ts mannequin():
// tapered limb chains, far limbs darker, weapon flattened to one grey, plain
// grey mannequin on flat #FF00FF). The CLEAN guide carries NO text, ground
// line, grid or marker of any kind; all annotation lives only in the marked
// diagnostic overlay, which is never sent to a provider.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const DIR = 'art/motion/xuchu/closeout-campaign/04-walk5/phase2-guide/'
mkdirSync(DIR, { recursive: true })
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const hashFile = (p) => sha(readFileSync(p))

// ---------- joints @512 (x right = facing direction, y down) ----------
// Upper body: traced from banked walk:2 (candidate-raw.jpg @1024 landmarks in
// 01-walk2/gate.json: crown 82, sole 1000, butt [70,636], tip [972,190]),
// cross-checked on banked walk:4 (03-walk4/attempt2/accepted.png). Hips are
// set 10px lower and 15px further back than the walk:2 support hip so the
// mass sits back over the rear boot while crown/ground stay at the anchor.
const J = {
  crownY: 41, groundY: 500,
  head: [236, 89], headR: [36, 48], // oval centre + radii; top = 89-48 = crownY 41 exactly
  neck: [224, 146], chest: [206, 196],
  shoulderN: [150, 162], shoulderF: [254, 168],
  elbowN: [108, 228], elbowF: [268, 222],
  hip: [195, 320], hipA: [214, 324], hipB: [176, 324],
  // Leg A (front, braking): donor-traced diagonal strut, near-straight knee.
  kneeA: [270, 398], ankleA: [306, 472], heelA: [294, 500], toeA: [348, 500],
  // Leg B (rear, support): bent squat under the hips, ankle under hipB,
  // heel raised only 6px (partial contact catching weight, NOT toe-off).
  kneeB: [212, 408], ankleB: [172, 478], heelB: [160, 494], toeB: [210, 500],
  weaponButt: [35, 318], weaponTip: [486, 95],
}
// Hands lie exactly on the weapon axis by construction (guide grips).
const onWeapon = (t) => [
  J.weaponButt[0] + (J.weaponTip[0] - J.weaponButt[0]) * t,
  J.weaponButt[1] + (J.weaponTip[1] - J.weaponButt[1]) * t,
]
J.handN = onWeapon(0.30).map(Math.round) // rear (screen-left) grip
J.handF = onWeapon(0.54).map(Math.round) // front grip

// Donor joints traced by eye on the enlarged cell-4 crop (sheet coords in
// charge-prepared-source.png, cell origin (512,341), cell-local in parens).
const DONOR = {
  sheet: 'art/motion/lidian/charge-prepared-source.png',
  sheetSize: [1536, 1024], cellOrigin: [512, 341], cellSize: [512, 341],
  cellIndex: 4, layoutLabel: 'brake',
  jointsSheet: {
    crown: [780, 379], head: [782, 403], hip: [757, 516],
    frontKnee: [834, 586], frontAnkle: [870, 646], frontHeel: [860, 666], frontToe: [937, 663],
    rearKnee: [697, 579], rearAnkle: [630, 639], rearToe: [607, 663], rearHeelRaised: [640, 649],
    weaponButt: [647, 546],
  },
  groundSheetY: 666,
}

// ---------- derived metrics ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const fromVerticalDeg = (a, b) => Math.atan2(Math.abs(b[0] - a[0]), b[1] - a[1]) * 180 / Math.PI
const bendDeg = (a, k, b) => {
  const u = sub(a, k); const v = sub(b, k)
  return 180 - Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI
}
const r2 = (n) => Math.round(n * 100) / 100
const D = DONOR.jointsSheet
const metrics = {
  donorFrontStrutFromVerticalDeg: r2(fromVerticalDeg(D.hip, D.frontAnkle)),
  donorFrontShinFromVerticalDeg: r2(fromVerticalDeg(D.frontKnee, D.frontAnkle)),
  donorFrontKneeBendDeg: r2(bendDeg(D.hip, D.frontKnee, D.frontAnkle)),
  guideFrontStrutFromVerticalDeg: r2(fromVerticalDeg(J.hipA, J.ankleA)),
  guideFrontShinFromVerticalDeg: r2(fromVerticalDeg(J.kneeA, J.ankleA)),
  guideFrontThighFromVerticalDeg: r2(fromVerticalDeg(J.hipA, J.kneeA)),
  guideFrontKneeBendDeg: r2(bendDeg(J.hipA, J.kneeA, J.ankleA)),
  guideRearKneeBendDeg: r2(bendDeg(J.hipB, J.kneeB, J.ankleB)),
  guideFrontHeelAheadOfFrontHipPxAt512: J.heelA[0] - J.hipA[0],
  guideFrontAnkleAheadOfFrontKneePxAt512: J.ankleA[0] - J.kneeA[0],
  guideRearAnkleMinusRearHipPxAt512: J.ankleB[0] - J.hipB[0],
  guideHipCentreOverRearBoot: `${J.hip[0]} within rear boot x[${J.heelB[0]},${J.toeB[0]}]`,
  guideStanceToeToHeelPxAt512: J.toeA[0] - J.heelB[0],
  guideThighLengthsPxAt512: { A: r2(len(J.hipA, J.kneeA)), B: r2(len(J.hipB, J.kneeB)) },
  guideShinLengthsPxAt512: { A: r2(len(J.kneeA, J.ankleA)), B: r2(len(J.kneeB, J.ankleB)) },
  weaponPxAt512: r2(len(J.weaponButt, J.weaponTip)),
  weaponAngleDeg: r2(Math.atan2(-(J.weaponTip[1] - J.weaponButt[1]), J.weaponTip[0] - J.weaponButt[0]) * 180 / Math.PI),
  bodyPxAt512: J.groundY - J.crownY,
}

// ---------- drawing helpers (@512 space, ctx pre-scaled x2) ----------
const S = 2
function chain(g, pts, widths, col) {
  // Tapered polygon through pts with per-joint half-widths (rig chainPath style).
  const left = []; const right = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[Math.min(i + 1, pts.length - 1)]; const o = pts[Math.max(i - 1, 0)]
    let dx = q[0] - o[0]; let dy = q[1] - o[1]; const m = Math.hypot(dx, dy) || 1
    dx /= m; dy /= m
    left.push([p[0] - dy * widths[i], p[1] + dx * widths[i]])
    right.push([p[0] + dy * widths[i], p[1] - dx * widths[i]])
  }
  g.beginPath()
  g.moveTo(left[0][0], left[0][1])
  for (const p of left.slice(1)) g.lineTo(p[0], p[1])
  for (const p of right.reverse()) g.lineTo(p[0], p[1])
  g.closePath(); g.fillStyle = col; g.fill()
  g.lineWidth = 1.2; g.strokeStyle = '#2e2e32'; g.stroke()
  // Round joint caps (fill only, no outline) so bends read as smooth masses.
  for (let i = 0; i < pts.length; i++) {
    g.beginPath(); g.arc(pts[i][0], pts[i][1], widths[i], 0, Math.PI * 2)
    g.fillStyle = col; g.fill()
  }
}
function oval(g, c, rx, ry, col) {
  g.beginPath(); g.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI * 2)
  g.fillStyle = col; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#2e2e32'; g.stroke()
}
function poly(g, pts, col) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) g.lineTo(p[0], p[1])
  g.closePath(); g.fillStyle = col; g.fill()
  g.lineWidth = 1.2; g.strokeStyle = '#2e2e32'; g.stroke()
}
function boot(g, ankle, heel, toe, col) {
  // Boot mass: shin-bottom block + foot from heel to toe along the sole.
  const topY = ankle[1] - 6
  poly(g, [
    [ankle[0] - 15, topY], [ankle[0] + 15, topY],
    [toe[0] + 4, toe[1] - 14], [toe[0] + 4, toe[1]],
    [heel[0] - 4, heel[1]], [heel[0] - 4, heel[1] - 16],
  ], col)
}
const FAR = '#5a5a5e'; const MID = '#7c7c80'; const NEAR = '#a4a4a8'; const WEAPON = '#c8c8cc'

function drawMannequin(g) {
  // Far (rear, Leg-B) leg + boot, far arm — behind torso.
  chain(g, [J.hipB, J.kneeB, J.ankleB], [20, 16, 12], FAR)
  boot(g, J.ankleB, J.heelB, J.toeB, FAR)
  chain(g, [J.shoulderF, J.elbowF, J.handF], [14, 11, 8], FAR)
  // Neck behind torso, then torso + skirt masses (skirt hem above both knees).
  chain(g, [J.neck, J.chest], [12, 15], MID)
  poly(g, [[J.shoulderN[0] - 22, J.shoulderN[1] - 8], [J.shoulderF[0] + 20, J.shoulderF[1] - 6],
    [J.hipA[0] + 40, J.hipA[1] + 6], [J.hipB[0] - 40, J.hipB[1] + 6]], MID)
  poly(g, [[138, 318], [256, 318], [268, 368], [128, 368]], '#6d6d72')
  // Near (front, Leg-A) braced leg + boot.
  chain(g, [J.hipA, J.kneeA, J.ankleA], [21, 17, 13], NEAR)
  boot(g, J.ankleA, J.heelA, J.toeA, NEAR)
  // Head (helmet/beard mass as one oval; identity comes from the anchors).
  oval(g, J.head, J.headR[0], J.headR[1], MID)
  // Weapon: one rigid glaive silhouette on the frozen axis.
  const [bx, by] = J.weaponButt; const [tx, ty] = J.weaponTip
  const s0 = onWeapon(0.78) // blade socket; shaft drawn only to here
  g.beginPath(); g.moveTo(bx, by); g.lineTo(s0[0], s0[1])
  g.lineWidth = 7; g.strokeStyle = WEAPON; g.stroke()
  g.lineWidth = 1; g.strokeStyle = '#2e2e32'
  g.beginPath(); g.moveTo(bx, by - 3.5); g.lineTo(s0[0], s0[1] - 3.5); g.stroke()
  oval(g, J.weaponButt, 7, 7, WEAPON) // butt cap
  const dx = tx - bx; const dy = ty - by; const m = Math.hypot(dx, dy)
  const px = -dy / m; const py = dx / m // unit perp (blade rises screen-up side)
  const off = (t, o) => { const p = onWeapon(t); return [p[0] + px * o, p[1] + py * o] }
  poly(g, [off(0.78, 3), off(0.84, 20), off(0.93, 15), [tx, ty], off(0.88, -9), off(0.78, -4)], WEAPON)
  // Near arm over torso+shaft, both hands on the shaft.
  chain(g, [J.shoulderN, J.elbowN, J.handN], [15, 12, 8.5], NEAR)
  oval(g, J.handN, 9, 7.5, NEAR)
  oval(g, J.handF, 8.5, 7, FAR)
}

// Clean guide: mannequin only on flat magenta. No text/lines/markers.
const cv = createCanvas(1024, 1024); const g = cv.getContext('2d')
g.fillStyle = '#ff00ff'; g.fillRect(0, 0, 1024, 1024)
g.scale(S, S); drawMannequin(g)
const cleanBuf = cv.toBuffer('image/png')
writeFileSync(DIR + 'guide-walk5-brake.png', cleanBuf)

// Marked diagnostic overlay (never sent): same pixels + landmarks.
const mc = createCanvas(1024, 1024); const mg = mc.getContext('2d')
mg.fillStyle = '#1c1c20'; mg.fillRect(0, 0, 1024, 1024)
mg.drawImage(cv, 0, 0)
mg.scale(S, S)
const dot = (p, col, label, lx = 8, ly = -8) => {
  mg.beginPath(); mg.arc(p[0], p[1], 4, 0, Math.PI * 2); mg.fillStyle = col; mg.fill()
  mg.fillStyle = col; mg.font = '11px sans-serif'; mg.fillText(label, p[0] + lx, p[1] + ly)
}
mg.strokeStyle = '#00ff80'; mg.lineWidth = 1.5
mg.beginPath(); mg.moveTo(0, J.groundY); mg.lineTo(512, J.groundY); mg.stroke()
mg.fillStyle = '#00ff80'; mg.font = '11px sans-serif'
mg.fillText('groundY 500@512 / 1000@1024', 8, J.groundY - 6)
mg.fillText(`crownY ${J.crownY}@512`, 8, J.crownY + 4)
mg.strokeStyle = '#ffe040'; mg.setLineDash([6, 4])
mg.beginPath(); mg.moveTo(...J.weaponButt); mg.lineTo(...J.weaponTip); mg.stroke()
mg.beginPath(); mg.moveTo(J.hipA[0], J.hipA[1]); mg.lineTo(J.hipA[0], J.groundY); mg.stroke()
mg.setLineDash([])
mg.fillStyle = '#ffe040'; mg.fillText('heel 80px ahead of hip vertical', 96, 448)
mg.strokeStyle = '#40c8ff'; mg.lineWidth = 2
mg.beginPath(); mg.moveTo(...J.hipA); mg.lineTo(...J.kneeA); mg.lineTo(...J.ankleA); mg.stroke()
mg.strokeStyle = '#ff9040'
mg.beginPath(); mg.moveTo(...J.hipB); mg.lineTo(...J.kneeB); mg.lineTo(...J.ankleB); mg.stroke()
mg.strokeStyle = '#ffffff'; mg.lineWidth = 2.5
mg.beginPath(); mg.moveTo(...J.heelA); mg.lineTo(...J.toeA); mg.stroke()
mg.beginPath(); mg.moveTo(...J.heelB); mg.lineTo(...J.toeB); mg.stroke()
dot(J.hipA, '#40c8ff', 'hipA'); dot(J.kneeA, '#40c8ff', 'kneeA'); dot(J.ankleA, '#40c8ff', 'ankleA', 10, -14)
dot(J.hipB, '#ff9040', 'hipB', -36); dot(J.kneeB, '#ff9040', 'kneeB', -40, 14); dot(J.ankleB, '#ff9040', 'ankleB', -52, -16)
dot(J.heelA, '#ffffff', 'heelA(planted)', -10, -10); dot(J.toeA, '#ffffff', 'toeA', 4, -8)
dot(J.heelB, '#ffffff', 'heelB +6 raised', -92, -20); dot(J.toeB, '#ffffff', 'toeB')
dot(J.weaponButt, '#ffe040', 'butt[35,318]', 4, 16); dot(J.weaponTip, '#ffe040', 'tip[486,95]', -64, -8)
dot(J.head, '#ff80ff', 'head'); dot(J.handN, '#ff80ff', 'handN', -44, 4); dot(J.handF, '#ff80ff', 'handF', 6, 14)
mg.fillStyle = '#ffffff'; mg.font = '12px sans-serif'
mg.fillText(`front strut ${metrics.guideFrontStrutFromVerticalDeg}deg / shin ${metrics.guideFrontShinFromVerticalDeg}deg from vertical; knee bend ${metrics.guideFrontKneeBendDeg}deg`, 8, 18)
mg.fillText(`rear knee bend ${metrics.guideRearKneeBendDeg}deg, ankle under hip (${metrics.guideRearAnkleMinusRearHipPxAt512}px) — weight back, not toe-off`, 8, 34)
const markedBuf = mc.toBuffer('image/png')
writeFileSync(DIR + 'guide-walk5-brake-marked.png', markedBuf)

// Donor evidence crop: cell 4 only, pixels unchanged except placed on dark grey.
const donorImg = await loadImage(DONOR.sheet)
const dc = createCanvas(512, 341); const dg = dc.getContext('2d')
dg.fillStyle = '#222226'; dg.fillRect(0, 0, 512, 341)
dg.drawImage(donorImg, DONOR.cellOrigin[0], DONOR.cellOrigin[1], 512, 341, 0, 0, 512, 341)
const donorBuf = dc.toBuffer('image/png')
writeFileSync(DIR + 'lidian-charge-cell4-donor.png', donorBuf)

// ---------- Phase 2 prompt (exact intended text; NOT executed here) ----------
const PHASE2_PROMPT = 'Single isolated single-pose EDIT. Reference order is binding: FIRST reference is a flat grey-mannequin pose guide on magenta — copy its EXACT pose, silhouette, proportions, limb placement and weapon placement limb-for-limb, but do NOT copy the grey mannequin surface or the magenta background. SECOND reference (banked Xu Chu walk:2 anchor) and THIRD reference (banked Xu Chu walk:4 anchor) fix the identity, costume, glaive design, body scale and ground: huge blunt-faced helmeted dark/full-bearded ochre/dark-armoured boss Xu Chu, orthographic right-facing three-quarter gameplay camera, same lighting, plain dark background like the anchors. Paint the fully rendered Xu Chu of references 2-3 in exactly the guide pose: walk:5 BRAKE / bookend transition — a heavy warrior jamming to a stop and sitting his weight BACK. FRONT BRAKING LEG exactly as guided: front heel planted far ahead of the hip line, the whole front leg one near-straight DIAGONAL STRUT leaning down-forward from hip to heel (shin clearly diagonal, absolutely not vertical), knee nearly straight and braced, heel digging in with braking pressure, boot flat toe forward, front boot the forward-most point of the lower body. HIPS LOW AND BACK behind that strut, torso upright, head above the rear leg, mass settling back toward guard. REAR SUPPORT LEG exactly as guided: close under the hips with the ankle almost directly below the rear hip, knee bent absorbing the settling weight, rear boot in partial contact with heel only slightly raised — catching the weight beside/under the body, NOT stretched far behind in a trailing toe-off push. Both boots on the same ground level as the guide feet (double support, decelerating); no lifted passing leg, no forward walking contact stride, no square side-by-side guard stance. BODY SCALE MANDATORY: crown-to-sole height matches the guide and anchors exactly, 918px on the 1024 canvas (459px at 512 scale), no shrinking to fit, soles at the guide foot level near the canvas bottom. WEAPON: the whole single rigid glaive completely inside the frame, blade tip at least 40px inside every edge, never clipped; length matches the anchor ratio exactly (weapon 503px against a 459px body at 512 scale); shaft rising to the right at about 26 degrees, butt cap behind the rear hand, red tassel under the blade socket, both hands firmly gripping the shaft where the guide hands sit. Exactly ONE glaive and one full-body figure. Do NOT draw the magenta background, any grey mannequin shading, or any green line, ground line, guide line, grid, marker or text in the output. No scenery, no other characters, no extra limbs; natural connected anatomy with authored hip/skirt overlap.'

const refs = [
  { order: 1, role: 'pose guide (this package, clean — the only guide image sent)', path: DIR + 'guide-walk5-brake.png', sha256: sha(cleanBuf) },
  { order: 2, role: 'banked walk:2 anchor — identity/weapon/scale. SEND VIA candidate-raw.jpg (accepted.png holds identical JPEG bytes under a .png name; extension-mismatch refusal recorded in campaign history)', path: 'art/motion/xuchu/closeout-campaign/01-walk2/candidate-raw.jpg', acceptedCopy: 'art/motion/xuchu/closeout-campaign/01-walk2/accepted.png', sha256: hashFile('art/motion/xuchu/closeout-campaign/01-walk2/candidate-raw.jpg') },
  { order: 3, role: 'banked walk:4 anchor — identity, opposite-passing gait context', path: 'art/motion/xuchu/closeout-campaign/03-walk4/attempt2/accepted.png', sha256: hashFile('art/motion/xuchu/closeout-campaign/03-walk4/attempt2/accepted.png') },
]
writeFileSync(DIR + 'prompt.txt', PHASE2_PROMPT + '\n')

const spec = {
  work: 'cmr15a-walk5-guide',
  purpose: 'Phase 2 grey-mannequin Brake guide for the ONE authorized guide-guided walk:5 edit (Alternative Completion grant). This package makes NO reservation and NO generation; ledger Xu Chu 11/global 178 unchanged.',
  zeroGeneration: true, reservationMade: false,
  canvas: { size: [1024, 1024], background: '#FF00FF flat (whole-frame guide convention)', scaleFrom512: S, crownYAt1024: J.crownY * S, groundYAt1024: J.groundY * S, bodyPxAt1024: metrics.bodyPxAt512 * S, tipMarginRule: 'whole glaive >=40px inside every edge at 1024 (tip at [972,190]: 52px right / 190px top)' },
  frozenBand: { bodyPxAt512: 459, weaponU: 130.79, bandU: [124.41, 137.5], angleDeg: -26.31, groundYAt512: 500 },
  sources: [
    { role: 'donor sheet (prepared)', path: DONOR.sheet, sha256: hashFile(DONOR.sheet) },
    { role: 'donor candidate (same cells, unprepared)', path: 'art/motion/lidian/charge-candidate-1.png', sha256: hashFile('art/motion/lidian/charge-candidate-1.png') },
    { role: 'donor prompt (cells 0-4 = coil/launch/dash/dash2/brake)', path: 'art/motion/lidian/charge-prompt.txt', sha256: hashFile('art/motion/lidian/charge-prompt.txt') },
    { role: 'donor registration (layout.charge position 4 label brake)', path: 'art/motion/lidian/registration.json', sha256: hashFile('art/motion/lidian/registration.json') },
    { role: 'anchor walk:2 (identity/weapon/crown/ground)', path: 'art/motion/xuchu/closeout-campaign/01-walk2/candidate-raw.jpg', sha256: hashFile('art/motion/xuchu/closeout-campaign/01-walk2/candidate-raw.jpg') },
    { role: 'anchor walk:4 (identity/torso cross-check)', path: 'art/motion/xuchu/closeout-campaign/03-walk4/attempt2/accepted.png', sha256: hashFile('art/motion/xuchu/closeout-campaign/03-walk4/attempt2/accepted.png') },
    { role: 'walk5 padded reference used by failed attempts 1-2 (NOT a Phase-2 reference: its guard legs conflict with the Brake pose; identity now comes from the banked anchors)', path: 'art/motion/xuchu/closeout-campaign/padded-refs/walk5-padded-ref.png', sha256: hashFile('art/motion/xuchu/closeout-campaign/padded-refs/walk5-padded-ref.png') },
    { role: 'generation ledger (read-only proof, unchanged)', path: 'art/motion/generation-budget.json', sha256: hashFile('art/motion/generation-budget.json') },
  ],
  donorCell: {
    ...DONOR,
    identification: 'charge-prompt.txt authors cells 0-4 as crouch-coil, launch, dash, dash alternate, brake (skidding stop); registration.json layout.charge maps position 4 -> cell 4 label "brake", keptCells [0..4]. Row-major 3x3 on 1536x1024 => centre cell, origin (512,341), 512x341.',
    tracedJointsSheetPx: DONOR.jointsSheet,
    traceNote: 'Joints read by eye on the 2x enlarged cell-4 crop (probe grid), robe-occluded rear knee estimated; front-leg angles are the transferred quantity, absolute positions are re-derived for Xu Chu below.',
    crop: { path: DIR + 'lidian-charge-cell4-donor.png', sha256: sha(donorBuf) },
  },
  guideJointsAt512: J,
  guideJointsAt1024: Object.fromEntries(Object.entries(J).map(([k, v]) => [k, Array.isArray(v) ? v.map((n) => n * S) : v * S])),
  metrics,
  adaptation: [
    'Front strut angles transferred from donor (41deg/31deg) and reduced to 32deg/26deg: Xu Chu legs are shorter/heavier and his torso stays upright (donor leans into the dash), so the same hip height cannot reach the donor stance; segment lengths kept consistent (thigh ~93/91px, shin ~82/81px @512 both legs).',
    'Hips lowered/back-shifted vs walk:2 support hip so hip centre [195] sits over the rear boot [160..210] while the front heel [294] is 80px@512 ahead of the front hip — weight settling back, crown/ground unchanged at the frozen anchor values.',
    'Rear leg deliberately NOT donor-copied: donor rear trails behind (dash skid), which is exactly the toe-off read rejected in walk:5 attempts 1-2. Guide rear ankle is 4px behind its hip, knee bent 52deg squat, heel raised only 6px (CAMPAIGN (a) toe/partial support) under the body.',
    'Torso/head/arms/weapon are the walk:2 anchor skeleton; hands are placed on the frozen weapon axis by construction; blade silhouette is schematic (design detail comes from the anchor references).',
  ],
  rejectCriteriaChecks: {
    'front shin vertical (attempts 1-2 fail)': `guide shin ${metrics.guideFrontShinFromVerticalDeg}deg from vertical, ankle ${metrics.guideFrontAnkleAheadOfFrontKneePxAt512}px@512 ahead of knee — FAIL pattern absent`,
    'trailing toe-off rear (attempts 1-2 fail)': `rear ankle ${metrics.guideRearAnkleMinusRearHipPxAt512}px@512 vs rear hip, toe${'[210,500]'} not stretched behind — FAIL pattern absent`,
    'weight over front foot': 'hip centre and head both behind the front heel and over/near the rear boot',
    'guard duplicate': 'stance is staggered front-strut + squat rear, boots 84px@512 apart front-to-back (rear toe 210 -> front heel 294), not side-by-side',
  },
  outputs: {
    cleanGuide: { path: DIR + 'guide-walk5-brake.png', sha256: sha(cleanBuf), bytes: cleanBuf.length, contains: 'grey mannequin + weapon on #FF00FF only; no text, no ground/guide lines, no markers' },
    markedDiagnostic: { path: DIR + 'guide-walk5-brake-marked.png', sha256: sha(markedBuf), bytes: markedBuf.length, contains: 'same mannequin + hip/knee/ankle/sole/ground/weapon landmarks and angles — NEVER sent to a provider' },
    donorCrop: { path: DIR + 'lidian-charge-cell4-donor.png', sha256: sha(donorBuf), bytes: donorBuf.length },
    promptFile: { path: DIR + 'prompt.txt', sha256: sha(Buffer.from(PHASE2_PROMPT + '\n')) },
    buildScript: { path: DIR + 'build-guide.mjs' },
  },
  phase2: {
    status: 'NOT reserved, NOT generated in this package. Executes only as a later, separate reserve-before-call package under the Alternative Completion grant (Phase 2: exactly ONE guide-guided walk:5 edit; if Brake gait fails, STOP for owner decision).',
    kind: 'isolated single-pose image EDIT (image_generate with referenceImages, never text-to-image)',
    provider: 'grok (amendment provider rule: gpt-preferred only for walk:3/4 second attempts, grok otherwise); record serving provider honestly (prior serving was UNCONFIRMED)',
    referenceOrder: refs,
    excludedReference: 'padded walk5 original cell intentionally omitted (its guard-stance legs pull against the Brake pose; attempts 1-2 with it as primary failed Brake twice). Original walk:5 identity detail is redundant with the two banked anchors.',
    size: '1024x1024',
    promptExact: PHASE2_PROMPT,
    afterCountsIfReserved: 'Xu Chu 12 / global 179 (ceilings 22/189) — only when the later package reserves',
    gateAfter: 'Campaign (c) full gate with salvage order (registration <=±12%, shaft retouch, splice) before any unusable verdict; Brake gait judged against this guide (front shin/heel-ahead/rear-support geometry in metrics above).',
  },
}
writeFileSync(DIR + 'guide-spec.json', JSON.stringify(spec, null, 2) + '\n')
console.log('clean', sha(cleanBuf), cleanBuf.length)
console.log('marked', sha(markedBuf), markedBuf.length)
console.log('donor', sha(donorBuf), donorBuf.length)
console.log('metrics', JSON.stringify(metrics))
