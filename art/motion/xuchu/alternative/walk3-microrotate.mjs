// CMR-15A ALTERNATIVE diagnostic Phase 1, Experiment 1 (ZERO generation).
// Micro-rotate ONLY the distal weapon segment of walk:3 attempt3 registered.png
// around the measured front-grip (hand) centre, to bring the tip corridor perp
// (15.36px, FAIL vs 14px) inside the corridor. Body/gait/ground pixels are
// proven unchanged via an outside-region RGBA hash. No banking, no accepted.png.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../scripts/pack-projection.mjs'

const out = 'art/motion/xuchu/alternative/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const SRC = 'art/motion/xuchu/closeout-campaign/02-walk3/attempt3/registered.png'
const EXPECTED_SRC_SHA = '2d21f6cdb34deea98efae12d1fac396d7c1e26150cc82bc36de2ccb6242b14d4'
const srcBuf = readFileSync(SRC)
if (sha(srcBuf) !== EXPECTED_SRC_SHA) throw new Error('source SHA mismatch ' + sha(srcBuf))
const src = PNG.sync.read(srcBuf)
const W = 512, H = 512
if (src.width !== W || src.height !== H) throw new Error('source not 512x512')
const orig = new Uint8ClampedArray(src.data)
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500 }
const ANCHOR = { butt: [35, 318], tip: [486, 95] }
// Landmarks from attempt3 gate.json (landmarksRegisteredAt512)
const BUTT = [22.347142857142877, 328.2028571428571]
const TIP = [483.0957142857142, 113.56571428571431]
const BEARD = [267.14714285714285, 159.02857142857144]
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const angDeg = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)
// Shaft chord frame (butt->tip), same construction as retouch.mjs
const dxy = [TIP[0] - BUTT[0], TIP[1] - BUTT[1]], len0 = Math.hypot(...dxy)
const u = [dxy[0] / len0, dxy[1] / len0], n = [-u[1], u[0]]
const frame = (x, y) => [(x - BUTT[0]) * u[0] + (y - BUTT[1]) * u[1], (x - BUTT[0]) * n[0] + (y - BUTT[1]) * n[1]]

// --- Front grip: centroid of skin-tone pixels near the shaft (front hand) ---
const isSkin = (r, g, b) => r > 110 && g > 60 && b < 110 && r > b + 25
let sx = 0, sy = 0, sc = 0, stMin = 1e9, stMax = -1e9
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = (y * W + x) * 4
  if (orig[k + 3] < 16 || !isSkin(orig[k], orig[k + 1], orig[k + 2])) continue
  const [t, o] = frame(x, y)
  if (t >= 270 && t <= 345 && o >= -10 && o <= 55) { sx += x; sy += y; sc++; if (t < stMin) stMin = t; if (t > stMax) stMax = t }
}
if (sc < 300) throw new Error('front-hand skin cluster too small: ' + sc)
const PIVOT = [sx / sc, sy / sc]
const pivotFrame = frame(PIVOT[0], PIVOT[1])
// Distal shaft centre offset (probe: brown shaft pixels t[340,400) o-mean ~30):
// pivot is the hand-mass centre, inside the grip. Cut plane just distal to fingers.
const T_CUT = 325, O_BAND = [-8, 98]
const inRot = (t, o) => t >= T_CUT && o >= O_BAND[0] && o <= O_BAND[1]

// --- Rotation angle: rigid rotation by (frozen direction - measured weapon chord
// direction). A rigid rotation turns every direction vector of the segment by theta
// regardless of pivot, so theta uses the butt->tip chord (gate angle), NOT pivot->tip
// (the hand centre sits o~+23 below the chord, which would bias the angle).
const chordAngleDeg = angDeg(BUTT, TIP)
const pivotTipAngle = angDeg(PIVOT, TIP)
const thetaDeg = FROZEN.weaponAngleDegAt512 - chordAngleDeg
const theta = thetaDeg * Math.PI / 180, cosT = Math.cos(theta), sinT = Math.sin(theta)
const rot = (p) => { const dx = p[0] - PIVOT[0], dy = p[1] - PIVOT[1]; return [PIVOT[0] + dx * cosT - dy * sinT, PIVOT[1] + dx * sinT + dy * cosT] }
const invRot = (p) => { const dx = p[0] - PIVOT[0], dy = p[1] - PIVOT[1]; return [PIVOT[0] + dx * cosT + dy * sinT, PIVOT[1] - dx * sinT + dy * cosT] }
const newTip = rot(TIP)
// Minimal |theta| that would just reach 14px (for the record): 1D scan -2..0 deg
let thetaMinDeg = null
for (let a = 0; a >= -2.001; a -= 0.001) {
  const r = a * Math.PI / 180, dx = TIP[0] - PIVOT[0], dy = TIP[1] - PIVOT[1]
  const tp = [PIVOT[0] + dx * Math.cos(r) - dy * Math.sin(r), PIVOT[1] + dx * Math.sin(r) + dy * Math.cos(r)]
  if (perp(tp, ANCHOR.butt, ANCHOR.tip) <= 14) { thetaMinDeg = a; break }
}
// Seam offset at the cut: shaft centreline ~o=+30 distal; displacement of cut/center point
const cutCentre = [BUTT[0] + T_CUT * u[0] + 30 * n[0], BUTT[1] + T_CUT * u[1] + 30 * n[1]]
const cutCentreRot = rot(cutCentre)
const seamOffsetPx = len(cutCentre, cutCentreRot)

// --- Writable region W (output coords): expanded band in source frame OR in inverse-rotated frame ---
const EXP = { tMin: T_CUT - 2, oLo: O_BAND[0] - 4, oHi: O_BAND[1] + 4 }
const inW = (x, y) => {
  const [t, o] = frame(x, y); if (t >= EXP.tMin && o >= EXP.oLo && o <= EXP.oHi) return true
  const q = invRot([x, y]); const [tq, oq] = frame(q[0], q[1]); return tq >= EXP.tMin && oq >= EXP.oLo && oq <= EXP.oHi
}
// Rotating-set audit: any skin pixels inside?
let rotPx = 0, rotSkinPx = 0
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = (y * W + x) * 4; if (orig[k + 3] === 0) continue
  const [t, o] = frame(x, y); if (inRot(t, o)) { rotPx++; if (isSkin(orig[k], orig[k + 1], orig[k + 2]) && orig[k + 3] >= 16) rotSkinPx++ }
}
// Premultiplied bilinear sample of source at continuous (qx,qy)
function sample(qx, qy) {
  const x0 = Math.floor(qx), y0 = Math.floor(qy), fx = qx - x0, fy = qy - y0
  let r = 0, g = 0, b = 0, a = 0
  for (const [xx, yy, w] of [[x0, y0, (1 - fx) * (1 - fy)], [x0 + 1, y0, fx * (1 - fy)], [x0, y0 + 1, (1 - fx) * fy], [x0 + 1, y0 + 1, fx * fy]]) {
    if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
    const k = (yy * W + xx) * 4, al = orig[k + 3] / 255
    r += orig[k] * al * w; g += orig[k + 1] * al * w; b += orig[k + 2] * al * w; a += al * w
  }
  if (a <= 0) return [0, 0, 0, 0]
  return [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round(a * 255)]
}
const outData = new Uint8ClampedArray(orig)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!inW(x, y)) continue
  const q = invRot([x, y]); const [tq, oq] = frame(q[0], q[1])
  const k = (y * W + x) * 4
  // Body guard: skin-tone (hand) pixels at the output location never move/erase.
  if (orig[k + 3] >= 16 && isSkin(orig[k], orig[k + 1], orig[k + 2])) continue
  if (inRot(tq, oq)) { const s = sample(q[0], q[1]); outData[k] = s[0]; outData[k + 1] = s[1]; outData[k + 2] = s[2]; outData[k + 3] = s[3] }
  else { const [t, o] = frame(x, y); if (inRot(t, o)) { outData[k] = outData[k + 1] = outData[k + 2] = outData[k + 3] = 0 } }
}
const outPng = new PNG({ width: W, height: H }); outPng.data = Buffer.from(outData)
const outBuf = PNG.sync.write(outPng)
writeFileSync(out + 'walk3-rotated.png', outBuf)

// --- Outside-region proof on the re-read file ---
const back = PNG.sync.read(readFileSync(out + 'walk3-rotated.png'))
const regionHash = (data) => { const parts = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!inW(x, y)) { const k = (y * W + x) * 4; parts.push(data[k], data[k + 1], data[k + 2], data[k + 3]) } } return sha(Buffer.from(parts)) }
const outsideBefore = regionHash(orig), outsideAfter = regionHash(back.data)
let changedIn = 0, changedOut = 0, changedY300 = 0, changedLegs = 0
for (let p = 0; p < W * H; p++) {
  const k = p * 4, x = p % W, y = (p / W) | 0
  if (orig[k] !== back.data[k] || orig[k + 1] !== back.data[k + 1] || orig[k + 2] !== back.data[k + 2] || orig[k + 3] !== back.data[k + 3]) {
    if (inW(x, y)) changedIn++; else changedOut++
    if (y >= 300) changedY300++
    if (y >= 340) changedLegs++
  }
}
if (outsideBefore !== outsideAfter || changedOut !== 0) throw new Error(`outside-region changed! ${outsideBefore} vs ${outsideAfter} changedOut=${changedOut}`)

// --- Full re-gate on walk3-rotated.png (same numeric gates as attempt3 gate.mjs) ---
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, greenPx = 0, edgeL = 0, edgeR = 0, edgeT = 0, edgeB = 0
// raster tip: max projection among alpha>=16 pixels x>=380 along butt->newTip axis
const nd = [newTip[0] - BUTT[0], newTip[1] - BUTT[1]], nl = Math.hypot(...nd), nu = [nd[0] / nl, nd[1] / nl]
let maxT = -1e9, maxTPx = null, topBlade = null
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = (y * W + x) * 4, a = back.data[k + 3]
  if (a >= 16) {
    if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
    if (x === 0) edgeL++; if (x === 511) edgeR++; if (y === 0) edgeT++; if (y === 511) edgeB++
    if (isGreen(back.data[k], back.data[k + 1], back.data[k + 2])) greenPx++
    if (x >= 380) { const t = (x - BUTT[0]) * nu[0] + (y - BUTT[1]) * nu[1]; if (t > maxT) { maxT = t; maxTPx = [x, y] } if (!topBlade || y < topBlade[1]) topBlade = [x, y] }
  }
}
function weaponReport(butt, tip) {
  const px = len(butt, tip), uu = px * U_PER_PX, a = angDeg(butt, tip)
  return { pxAt512: px, u: uu, inBand: uu >= FROZEN.weaponBandU.lo && uu <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(butt, ANCHOR.butt, ANCHOR.tip), tip: perp(tip, ANCHOR.butt, ANCHOR.tip), corridorLimitPx: 14 }, tipInsideFrame: tip[0] >= 0 && tip[0] <= 511, tipRightMarginPxAt512: 512 - tip[0] }
}
const weaponBefore = weaponReport(BUTT, TIP)
const weaponAfter = weaponReport(BUTT, newTip)
const gates = {
  weaponLengthPass: weaponAfter.inBand,
  weaponCorridorPass: weaponAfter.corridorPerpPxVsAnchorLine.butt <= 14 && weaponAfter.corridorPerpPxVsAnchorLine.tip <= 14 && weaponAfter.tipInsideFrame && xmax < 511,
  weaponDirectionPass: Math.abs(weaponAfter.angleDeltaDegVsAnchor) <= 5,
  bodyPass: ymin === 41 && ymax === 500, // raster crown/ground as source (459px by gate landmarks; unchanged pixels)
  groundPass: ymax === FROZEN.groundYAt512,
  seamsNumericPass: greenPx === 0 && edgeL === 0 && edgeR === 0 && edgeT === 0,
  outsideWeaponRegionUnchanged: outsideBefore === outsideAfter && changedOut === 0,
  gaitGroundPixelsUnchanged: changedY300 === 0,
}
const allNumericPass = Object.values(gates).every(Boolean)

// --- Zooms: seam gameplay (full marked), seam 4x (cut), tip 4x, diff 4x at seam ---
const img = await loadImage(out + 'walk3-rotated.png')
const srcImg = await loadImage(SRC)
function markedFull(im, name, butt, tip, label) {
  const c = createCanvas(512, 512), g = c.getContext('2d'); g.drawImage(im, 0, 0)
  g.strokeStyle = '#ff40ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(...butt); g.lineTo(...tip); g.stroke()
  g.strokeStyle = '#ffe040'; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(...ANCHOR.butt); g.lineTo(...ANCHOR.tip); g.stroke(); g.setLineDash([])
  const ca = [BUTT[0] + T_CUT * u[0] + (O_BAND[0] - 6) * n[0], BUTT[1] + T_CUT * u[1] + (O_BAND[0] - 6) * n[1]]
  const cb = [BUTT[0] + T_CUT * u[0] + (O_BAND[1] + 6) * n[0], BUTT[1] + T_CUT * u[1] + (O_BAND[1] + 6) * n[1]]
  g.strokeStyle = '#00ff80'; g.beginPath(); g.moveTo(...ca); g.lineTo(...cb); g.stroke()
  g.fillStyle = '#ffe040'; g.beginPath(); g.arc(...PIVOT, 5, 0, 7); g.fill()
  g.font = '12px sans-serif'; g.fillStyle = '#ff40ff'; g.fillText(label, butt[0], butt[1] - 8)
  g.fillStyle = '#ffe040'; g.fillText('anchor corridor axis (dashed)', 300, 70)
  g.fillStyle = '#00ff80'; g.fillText('cut t=325', cb[0] - 20, cb[1] + 16)
  g.fillStyle = '#40c0ff'; g.beginPath(); g.arc(...BEARD, 5, 0, 7); g.fill(); g.fillText('beard tip RAW', BEARD[0] + 8, BEARD[1])
  writeFileSync(out + name, c.toBuffer('image/png'))
}
markedFull(img, 'walk3-seam-gameplay.png', BUTT, newTip, 'weapon butt->tip (micro-rotated)')
function zoom(im, x, y, w, h, s, name, annotate) {
  const c = createCanvas(w * s, h * s), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, x, y, w, h, 0, 0, w * s, h * s)
  if (annotate) annotate(g, (p) => [(p[0] - x) * s, (p[1] - y) * s])
  writeFileSync(out + name, c.toBuffer('image/png'))
}
zoom(img, 250, 150, 170, 130, 4, 'walk3-seam-4x.png', (g, M) => {
  const ca = [BUTT[0] + T_CUT * u[0] - 10 * n[0], BUTT[1] + T_CUT * u[1] - 10 * n[1]], cb = [BUTT[0] + T_CUT * u[0] + 80 * n[0], BUTT[1] + T_CUT * u[1] + 80 * n[1]]
  g.strokeStyle = '#00ff80'; g.lineWidth = 3; g.beginPath(); g.moveTo(...M(ca)); g.lineTo(...M(cb)); g.stroke()
  g.fillStyle = '#ffe040'; g.beginPath(); g.arc(...M(PIVOT), 8, 0, 7); g.fill()
  g.font = 'bold 20px sans-serif'; g.fillText('pivot (hand centroid)', M(PIVOT)[0] - 150, M(PIVOT)[1] - 14); g.fillStyle = '#00ff80'; g.fillText('cut t325', M(cb)[0] - 30, M(cb)[1] + 26)
})
zoom(srcImg, 250, 150, 170, 130, 4, 'walk3-seam-before-4x.png')
zoom(img, 360, 40, 152, 140, 4, 'walk3-tip-4x.png')
zoom(img, 0, 340, 512, 172, 2, 'walk3-legs-2x.png')
// diff map (red = changed)
{
  const c = createCanvas(512, 512), g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const id = g.getImageData(0, 0, 512, 512)
  for (let p = 0; p < W * H; p++) { const k = p * 4; if (orig[k] !== back.data[k] || orig[k + 1] !== back.data[k + 1] || orig[k + 2] !== back.data[k + 2] || orig[k + 3] !== back.data[k + 3]) { id.data[k] = 255; id.data[k + 1] = 0; id.data[k + 2] = 255; id.data[k + 3] = 255 } }
  g.putImageData(id, 0, 0); writeFileSync(out + 'walk3-diff.png', c.toBuffer('image/png'))
}

const report = {
  work: 'cmr15a-alt-phase1-diagnostic', experiment: 1, key: 'walk:3', method: 'distal-segment micro-rotation around front grip', zeroGeneration: true,
  statusNote: 'DIAGNOSTIC ONLY — CMR-15A remains BLOCKED; nothing banked/copied to accepted paths.',
  source: { path: SRC, sha256: sha(srcBuf), size: [512, 512] },
  frozenBriefBand: FROZEN, anchorWeaponAt512: ANCHOR,
  frontGrip: { method: 'centroid of skin-tone pixels (r>110,g>60,b<110,r>b+25, alpha>=16) with chord-frame t in [270,345], o in [-10,55] (front hand cluster; probe histogram peak t 280-320)', skinPx: sc, skinTRange: [stMin, stMax], pivotPxAt512: PIVOT, pivotChordFrame: { t: pivotFrame[0], o: pivotFrame[1] } },
  rotation: {
    rule: 'Rotate source pixels with chord-frame t>=T_CUT and o in O_BAND around PIVOT by theta = frozenAngle - angle(butt->tip) (rigid rotation turns all segment directions by theta; aligning the measured weapon chord direction to the frozen direction). Inverse-mapped premultiplied bilinear resample (deterministic). Cut plane t=325 sits just distal to the fingers so the kink is at the hand exit; skin-tone (hand) output pixels are guarded byte-identical; skin-classified px inside the geometric rotating set are counted below (includes warm steel highlights meeting the skin colour test).',
    chordAngleDeg, pivotTipAngleDeg: pivotTipAngle, frozenAngleDeg: FROZEN.weaponAngleDegAt512, thetaDeg, thetaMinDegForPerp14: thetaMinDeg,
    tCut: T_CUT, oBand: O_BAND, rotatingSourcePx: rotPx, skinPxInRotatingSet: rotSkinPx,
    tipBefore: TIP, tipAfter: newTip, tipDisplacementPx: len(TIP, newTip),
    seamOffsetAtCutCentrePx: seamOffsetPx, cutCentreShaftPoint: cutCentre, cutCentreAfterRot: cutCentreRot,
    rasterTipCheck: { maxProjectionPx: maxTPx, tAlongNewAxis: maxT, topmostBladePxXGE380: topBlade },
  },
  writableRegion: { definition: 'output px whose chord-frame (t,o) has t>=323 and o in [-12,102], OR whose inverse-rotated source coords satisfy the same; all other pixels copied byte-identical', outsideHashBefore: outsideBefore, outsideHashAfter: outsideAfter, identical: outsideBefore === outsideAfter, changedPxInside: changedIn, changedPxOutside: changedOut, changedPxYAtLeast300: changedY300, changedPxLegsYAtLeast340: changedLegs },
  output: { path: out + 'walk3-rotated.png', sha256: sha(outBuf), size: [512, 512] },
  weaponBefore, weaponAfter,
  raster: { alphaBounds: { xmin, ymin, xmax, ymax }, greenPx, edgeOpaquePx: { left: edgeL, right: edgeR, top: edgeT, bottom: edgeB } },
  gatesNumeric: gates, allNumericPass,
  carriedVerdictsUnchangedPixels: 'Identity/anatomy/gait/scale-ground/head-RAW pixels outside W are byte-identical to attempt3 registered.png, whose gate.json recorded PASS for identity/anatomy/gait Contact-B/scale-ground and head RAW 0px; visual re-check of full/legs/seam/tip zooms recorded in REPORT.md.',
}
writeFileSync(out + 'walk3-gate.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ pivot: PIVOT, pivotFrame, thetaDeg, thetaMinDeg, newTip, seamOffsetPx, rotPx, rotSkinPx, changedIn, changedOut, changedY300, outsideBefore, weaponBefore: weaponBefore.corridorPerpPxVsAnchorLine, weaponAfter, gates, shaOut: sha(outBuf) }, null, 1))
