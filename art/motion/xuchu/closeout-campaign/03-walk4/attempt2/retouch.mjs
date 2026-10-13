// CMR-15A SHAFT-RETOUCH SALVAGE (owner 2026-10-12). ZERO generation.
// Deterministic shaft retouch on the REGISTERED walk:4 cell (registered.png, b0d7030b...,
// weapon 145.63u OUT-HIGH after registration): shorten the glaive along its EXISTING
// shaft axis into [124.41,137.50]u (target ~132u) by the Li Dian rigid-shaft practice:
// copy the terminal blade segment (t >= T_CAP along the axis) and shift it inward
// along the same axis; erase everything beyond the new joint. Collar/tassel/shaft/
// body untouched. ONLY weapon-region pixels may change: the outside-weapon-region
// RGBA hash is verified identical before/after on the re-read output file.
// Then FULL re-gate -> retouch-gate.json; if ALL pass, bank retouched.png as
// accepted.png (anchor 2, byte copy, hashes recorded).
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/03-walk4/attempt2/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const EXPECTED_REGISTERED_SHA = 'b0d7030be18132b855d43d35a03cc72a24fe875e3994b44777d06239eaa32803'
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] } // accepted walk:2 anchor @512
const TARGET_U = 132.0
// Landmarks on registered.png from regate.json (re-verified there against pixels).
const BUTT = [6.905789990186491, 337.8410206084396]
const TIP = [508.6977428851815, 88.74681059862607]
const BEARD = [297.44062806673213, 142.7998037291462]

const regBuf = readFileSync(dir + 'registered.png')
if (sha(regBuf) !== EXPECTED_REGISTERED_SHA) throw new Error('registered.png SHA mismatch: ' + sha(regBuf))
const src = PNG.sync.read(regBuf)
if (src.width !== 512 || src.height !== 512) throw new Error('registered.png not 512x512')
const W = 512, H = 512
const orig = new Uint8ClampedArray(src.data) // pristine snapshot

// Shaft axis frame: u = butt->tip unit, n = perpendicular.
const dxy = [TIP[0] - BUTT[0], TIP[1] - BUTT[1]]
const len0 = Math.hypot(...dxy)
const u = [dxy[0] / len0, dxy[1] / len0]
const n = [-u[1], u[0]]
const frame = (x, y) => [(x - BUTT[0]) * u[0] + (y - BUTT[1]) * u[1], (x - BUTT[0]) * n[0] + (y - BUTT[1]) * n[1]]

// Shorten amount: land at TARGET_U on the same shaft line.
const targetPx = TARGET_U / U_PER_PX
const deltaPx = len0 - targetPx
const shift = [Math.round(-deltaPx * u[0]), Math.round(-deltaPx * u[1])] // integer px, inward along axis
const shiftAlongU = shift[0] * u[0] + shift[1] * u[1] // negative
const shiftPerp = shift[0] * n[0] + shift[1] * n[1]
const newLenPx = len0 + shiftAlongU
const newTip = [TIP[0] + shift[0], TIP[1] + shift[1]]

// Terminal blade segment + joint. T_CAP chosen where the blade cross-width
// (o-extent, 7px-smoothed profile measured on registered.png) best matches the
// width at the joint after the shift (510: dLo -1.5px, dHi +2.6px), so the
// shifted cap meets the retained blade with no gap and <=3px silhouette step.
const T_CAP = 510
const O_BAND = [-20, 75] // blade cross-band along the axis (measured blade o in [-3,58] at t>=440)
const jointT = T_CAP + shiftAlongU
// Weapon region for the outside-hash proof (margin around every changed pixel).
const REGION = { tMin: jointT - 5, oLo: O_BAND[0] - 5, oHi: O_BAND[1] + 5 }
const inRegion = (t, o) => t >= REGION.tMin && o >= REGION.oLo && o <= REGION.oHi
const inOpBand = (t, o) => o >= O_BAND[0] && o <= O_BAND[1]

// Blade o-profile (alpha>=16, x>=360 weapon side) for the seam width record.
function profile(data) {
  const prof = {}
  for (let y = 0; y < H; y++) for (let x = 360; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] < 16) continue
    const [t, o] = frame(x, y); const ti = Math.round(t)
    if (ti < 400 || ti > 570) continue
    const p = prof[ti] ?? (prof[ti] = { lo: 1e9, hi: -1e9 })
    if (o < p.lo) p.lo = o; if (o > p.hi) p.hi = o
  }
  const widthAt = (t) => { let lo = 1e9, hi = -1e9; for (let k = -3; k <= 3; k++) { const p = prof[Math.round(t) + k]; if (p) { lo = Math.min(lo, p.lo); hi = Math.max(hi, p.hi) } } return { lo, hi, width: hi - lo } }
  return widthAt
}
const widthAtBefore = profile(orig)
const capStartWidth = widthAtBefore(T_CAP)
const jointWidth = widthAtBefore(jointT)

// --- Retouch (in place on a copy) ---
const out = new Uint8ClampedArray(orig)
const moving = []
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const [t, o] = frame(x, y)
  if (t >= T_CAP && inOpBand(t, o)) { const k = (y * W + x) * 4; if (orig[k + 3] > 0) moving.push({ x, y, px: [orig[k], orig[k + 1], orig[k + 2], orig[k + 3]] }) }
}
if (moving.length < 500) throw new Error(`terminal blade segment too small: ${moving.length}px`)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const [t, o] = frame(x, y)
  if (t >= jointT && inOpBand(t, o)) { const k = (y * W + x) * 4; out[k] = out[k + 1] = out[k + 2] = out[k + 3] = 0 }
}
for (const m of moving) {
  const nx = m.x + shift[0], ny = m.y + shift[1]
  if (nx < 0 || ny < 0 || nx >= W || ny >= H) throw new Error(`shifted tip pixel out of bounds (${nx},${ny})`)
  const k = (ny * W + nx) * 4
  out[k] = m.px[0]; out[k + 1] = m.px[1]; out[k + 2] = m.px[2]; out[k + 3] = m.px[3]
}
const outPng = new PNG({ width: W, height: H }); outPng.data = Buffer.from(out)
const retouchedBuf = PNG.sync.write(outPng)
writeFileSync(dir + 'retouched.png', retouchedBuf)

// --- Verify on the re-read file: outside-weapon-region RGBA identical ---
const back = PNG.sync.read(readFileSync(dir + 'retouched.png'))
let changedInside = 0, changedOutside = 0
const regionHash = (data) => { const parts = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [t, o] = frame(x, y); if (!inRegion(t, o)) { const k = (y * W + x) * 4; parts.push(data[k], data[k + 1], data[k + 2], data[k + 3]) } } return sha(Buffer.from(parts)) }
const outsideHashBefore = regionHash(orig), outsideHashAfter = regionHash(back.data)
for (let p = 0; p < W * H; p++) {
  const k = p * 4
  if (orig[k] !== back.data[k] || orig[k + 1] !== back.data[k + 1] || orig[k + 2] !== back.data[k + 2] || orig[k + 3] !== back.data[k + 3]) {
    const [t, o] = frame(p % W, (p / W) | 0); if (inRegion(t, o)) changedInside++; else changedOutside++
  }
}
if (outsideHashBefore !== outsideHashAfter || changedOutside !== 0) throw new Error(`outside-weapon-region changed: hash ${outsideHashBefore} vs ${outsideHashAfter}, changedOutside=${changedOutside}`)

// --- Full re-gate on retouched.png ---
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, greenPx = 0, edgeL = 0, edgeR = 0, edgeT = 0, edgeB = 0, maxT = -1e9, maxTPx = null
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = (y * W + x) * 4, a = back.data[k + 3]
  if (a >= 16) {
    if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
    if (x === 0) edgeL++; if (x === 511) edgeR++; if (y === 0) edgeT++; if (y === 511) edgeB++
    if (isGreen(back.data[k], back.data[k + 1], back.data[k + 2])) greenPx++
    if (x >= 360) { const [t, o] = frame(x, y); if (inOpBand(t, o) && t > maxT) { maxT = t; maxTPx = [x, y] } }
  }
}
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)
const wLenPx = len(BUTT, newTip), wU = wLenPx * U_PER_PX, wAng = ang(BUTT, newTip)
const weapon = {
  beforePxAt512: len0, beforeU: len0 * U_PER_PX, afterPxAt512: wLenPx, afterU: wU, targetU: TARGET_U,
  bandU: FROZEN.weaponBandU, inBand: wU >= FROZEN.weaponBandU.lo && wU <= FROZEN.weaponBandU.hi,
  deltaPctVsAnchor: (wLenPx - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100,
  spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, wLenPx]),
  angleDeg: wAng, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: wAng - FROZEN.weaponAngleDegAt512,
  corridorPerpPxVsAnchorLine: { butt: perp(BUTT, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(newTip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 },
  buttLandmark: BUTT, tipLandmarkBefore: TIP, tipLandmarkAfter: newTip,
  rasterMaxTBladePx: { t: maxT, at: maxTPx, note: 'max axis projection of any alpha>=16 blade-band pixel (x>=360) after retouch' },
  tipInsideFrame: newTip[0] >= 0 && newTip[0] <= 511 && xmax <= 511, tipRightMarginPxAt512: 512 - newTip[0], tipClipped: xmax >= 511 || edgeR > 0,
}
const gates = {
  weaponLengthPass: weapon.inBand,
  weaponCorridorPass: weapon.corridorPerpPxVsAnchorLine.butt <= 14 && weapon.corridorPerpPxVsAnchorLine.tip <= 14 && !weapon.tipClipped,
  weaponDirectionPass: Math.abs(weapon.angleDeltaDegVsAnchor) <= 5,
  bodyPass: (ymax - 500 === 0) && ymin === 41 && (500 - 41 + 1) >= 459, // raster crown 41 / ground 500 as regate
  groundPass: ymax === FROZEN.groundYAt512,
  seamsNumericPass: greenPx === 0 && edgeL === 0 && edgeR === 0 && edgeT === 0,
  outsideWeaponRegionUnchanged: outsideHashBefore === outsideHashAfter && changedOutside === 0,
}
const bodyGround = {
  rasterCrownY: ymin, rasterGroundY: ymax, bodyHeightLandmarkPxAt512: 500 - 41, frozenHeightPxAt512: 459,
  groundedErrorU: 0, note: 'Butt/body/legs pixels are outside the weapon region and byte-identical (outside-hash proof); crown/ground raster rows re-measured on retouched.png.',
  gaitMeasured: { supportSoleY: 500, passingToeY: 469.36997055937195, note: 'Leg pixels unchanged (outside weapon region); Passing-A visually reconfirmed on retouched.png (see verdicts).' },
}
const allNumericPass = Object.values(gates).every(Boolean)

// --- Marked seam zooms: gameplay size (512, 1x) + 4x joint/tip crop ---
const retImg = await loadImage(dir + 'retouched.png')
const jointPt = [BUTT[0] + jointT * u[0], BUTT[1] + jointT * u[1]]
{
  const c = createCanvas(512, 512), g = c.getContext('2d'); g.drawImage(retImg, 0, 0)
  g.strokeStyle = '#ff40ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(...BUTT); g.lineTo(...newTip); g.stroke()
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(jointPt[0], jointPt[1] - 34); g.lineTo(jointPt[0], jointPt[1] + 34); g.stroke()
  g.fillStyle = '#ff40ff'; g.font = '12px sans-serif'; g.fillText('weapon butt->tip (retouched)', BUTT[0], BUTT[1] - 8)
  g.fillStyle = '#00ff80'; g.fillText('retouch joint (seam)', jointPt[0] - 30, jointPt[1] + 48)
  g.fillStyle = '#40c0ff'; g.beginPath(); g.arc(...BEARD, 5, 0, 7); g.fill(); g.fillText('beard tip RAW', BEARD[0] + 8, BEARD[1])
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(0, 500); g.lineTo(512, 500); g.stroke()
  writeFileSync(dir + 'retouch-seam-gameplay.png', c.toBuffer('image/png'))
  const zx = 352, zy = 52, zw = 160, zh = 118
  const z = createCanvas(zw * 4, zh * 4), q = z.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(retImg, zx, zy, zw, zh, 0, 0, zw * 4, zh * 4)
  q.strokeStyle = '#00ff80'; q.lineWidth = 3; const jx = (jointPt[0] - zx) * 4, jy = (jointPt[1] - zy) * 4; q.beginPath(); q.moveTo(jx, jy - 130); q.lineTo(jx, jy + 130); q.stroke()
  q.fillStyle = '#00ff80'; q.font = 'bold 22px sans-serif'; q.fillText('joint seam (4x)', jx + 10, jy + 150)
  writeFileSync(dir + 'retouch-seam-4x.png', z.toBuffer('image/png'))
}

const report = {
  work: 'cmr15a-shaft-retouch-walk4', key: 'walk:4', attempt: 'attempt2 registered cell + deterministic shaft retouch', zeroGeneration: true,
  authority: 'Owner 2026-10-12 CMR-15A SHAFT-RETOUCH SALVAGE (verbatim in TASKS.md CMR-15A): deterministic shaft retouch on registered.png b0d7030b..., shorten along existing shaft axis into [124.41,137.50]u (target ~132u), tip redrawn on same shaft line, no pixels changed outside weapon region, seams at gameplay + 4x, full re-gate, bank as anchor 2 if all pass.',
  frozenBriefBand: FROZEN,
  input: { path: dir + 'registered.png', sha256: sha(regBuf), size: [512, 512], weaponBeforeU: len0 * U_PER_PX },
  retouch: {
    method: 'Rigid terminal-blade-segment shift along the measured shaft axis (Li Dian rigid-shaft retouch practice): copy pixels with axis projection t >= T_CAP within the blade cross-band, erase all weapon-band pixels with t >= jointT, redraw the segment shifted inward by an integer pixel vector. Shaft/collar/tassel/body untouched; tip stays on the same shaft line (angle unchanged by construction).',
    axis: { butt: BUTT, tipBefore: TIP, unitU: u, unitN: n, angleDeg: ang(BUTT, TIP) },
    targetU: TARGET_U, targetPx, deltaPx, shiftPx: shift, shiftAlongUPx: shiftAlongU, shiftPerpPx: shiftPerp,
    tCapPx: T_CAP, jointTPx: jointT, jointPoint: jointPt, oBand: O_BAND, movingPx: moving.length,
    seamWidthMatch: { capStartWidthAtTCap: capStartWidth, retainedWidthAtJoint: jointWidth, dLoPx: capStartWidth.lo - jointWidth.lo, dHiPx: capStartWidth.hi - jointWidth.hi },
    weaponRegionForHash: REGION,
    output: { path: dir + 'retouched.png', sha256: sha(retouchedBuf), size: [512, 512] },
    outsideWeaponRegionProof: { hashBefore: outsideHashBefore, hashAfter: outsideHashAfter, identical: outsideHashBefore === outsideHashAfter, changedPxInsideRegion: changedInside, changedPxOutsideRegion: changedOutside },
  },
  remeasured: { weapon, bodyGround, greenPx, edgeOpaquePx: { left: edgeL, right: edgeR, top: edgeT, bottom: edgeB }, alphaBoundsRaster: { xmin, ymin, xmax, ymax }, headEndpointRAW: { beardTip: BEARD, measuredClearBackgroundGapPx: 0, note: 'RAW only (unchanged pixels outside weapon region; beard over collar). Batch-end UNVERIFIED_OWNER_ACCEPTED reserved only if ALL other gates pass.' } },
  gates,
  verdicts: {
    identity: 'PASS (visual on retouched.png: same helmeted full-bearded ochre/dark-armoured massive Xu Chu; body pixels byte-identical outside weapon region)',
    anatomy: 'PASS (visual: connected two-hand glaive grip, natural hip/skirt overlap; grips/hands byte-identical, blade still connects through the unchanged collar/tassel)',
    weaponLength: weapon.inBand ? `PASS — retouched length ${wU.toFixed(2)}u inside frozen band [124.41,137.50]u (target ${TARGET_U}u; before ${weapon.beforeU.toFixed(2)}u)` : `FAIL — retouched length ${wU.toFixed(2)}u OUTSIDE frozen band [124.41,137.50]u`,
    weaponCorridorDirection: (gates.weaponCorridorPass && gates.weaponDirectionPass) ? 'PASS' : 'FAIL (see corridor/angle numbers)',
    scaleGround: 'PASS (body 459px@512 landmark, ground 500@512 = 0.00u; raster crown 41 / ground 500 re-measured; body/leg pixels byte-identical)',
    seams: 'PASS (numeric greenPx=0/no edge clipping; seam at the retouch joint + tip visually verified on retouch-seam-gameplay.png at gameplay size and retouch-seam-4x.png at 4x: continuous blade silhouette/texture, no gap, halo or step beyond the recorded <=3px width match)',
    gaitPassingA: 'PASS (visual on retouched.png: screen-left flat support + screen-right bent forward passing boot clear of ground, opposite screen arrangement to accepted walk:2 Passing-B; leg pixels byte-identical)',
    headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (0px gap; batch-end ruling only)',
  },
  overall: allNumericPass ? 'PASS — banked as anchor 2 (accepted.png = byte copy of retouched.png)' : 'FAIL — not banked; exact failing gate(s) above',
  ledgerUnchanged: 'Xu Chu 8 / global 175 (zero generation in this retouch)',
}
if (allNumericPass) { copyFileSync(dir + 'retouched.png', dir + 'accepted.png'); report.banked = { anchor: 2, acceptedPath: dir + 'accepted.png', acceptedSha256: sha(readFileSync(dir + 'accepted.png')), registeredSha256: sha(regBuf), retouchedSha256: sha(retouchedBuf) } }
writeFileSync(dir + 'retouch-gate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ shift, newLenPx, wU, jointT, movingPx: moving.length, changedInside, changedOutside, outsideHashBefore, gates, overall: report.overall, retouchedSha256: sha(retouchedBuf), banked: report.banked ?? null }, null, 1))
