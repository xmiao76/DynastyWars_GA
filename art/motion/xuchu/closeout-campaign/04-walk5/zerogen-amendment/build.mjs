// CMR-15A WALK:5 ZERO-GENERATION PHASE AMENDMENT (owner 2026-10-13). ZERO generation.
// (i) Component-extract the original walk-candidate-2 walk:5 figure (bad2aee5...,
//     alpha>=8 8-conn, same method as alternative/walk01-extract.mjs), register it
//     campaign-standard (uniform factor=459/bodyH, ground->500@512, alpha centred),
//     shaft-retouch ONLY if an in-frame length outlier after registration.
// (ii) Shaft-retouch the GPT registered candidate fcca9950... (139.49u OUT_HIGH)
//     to ~132u along its existing shaft axis (walk:4 retouch method:
//     03-walk4/attempt2/retouch.mjs), with outside-weapon-region hash proof.
// Fresh raster measurement = alternative-phase1/gate.mjs measure() convention.
// Comparative evidence: same raster boot/sole measurement on banked walk:0/1/3/4,
// silhouette XOR vs walk:0/1/3, walk:4->candidate->walk:0 sequence sheets.
// Writes measurements + evidence imagery + gate.json (visual verdicts PENDING here;
// banking is decided separately and recorded in gate.json by finalize step).
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { spreadOf } from '../../../../../../scripts/pack-projection.mjs'

const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/zerogen-amendment/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const U_PER_PX = 124 / 477
const FROZEN = { bodyHeightPxAt512: 459, weaponLengthPxAt512: 503.12026395286443, weaponLengthU: 130.79017343848048, weaponBandU: { lo: 124.40626991803302, hi: 137.50166675151021 }, weaponAngleDegAt512: -26.31040494480514, groundYAt512: 500, crownYAt512: 41 }
const ANCHOR_WEAPON = { butt: [35, 318], tip: [486, 95] }
const isGreen = (r, g, b) => g > 150 && r < 120 && b < 120
const isMagenta = (r, g, b) => r > 180 && b > 180 && g < 120
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI
const perp = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len(a, b)

// Ledger verify (no writes)
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { path: 'art/motion/generation-budget.json', sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, globalUsed, expected: 'Xu Chu 13 / global 180', matches: ledger.fighters.xuchu.used === 13 && globalUsed === 180 }
if (!ledgerState.matches) throw new Error('ledger mismatch ' + JSON.stringify(ledgerState))

// ---------- fresh raster measure (alternative-phase1 convention + sole profiles) ----------
function measure(buf) {
  const png = PNG.sync.read(buf); const W = png.width, H = png.height
  if (W !== 512 || H !== 512) throw new Error('expected 512x512, got ' + W + 'x' + H)
  let xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1, greenPx = 0, magentaPx = 0, edgeL = 0, edgeR = 0, edgeT = 0, edgeB = 0
  const colLow = new Array(W).fill(-1)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const a = png.data[i + 3]; if (a >= 16) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; if (y > colLow[x]) colLow[x] = y; if (x === 0) edgeL++; if (x === 511) edgeR++; if (y === 0) edgeT++; if (y === 511) edgeB++; if (isGreen(png.data[i], png.data[i + 1], png.data[i + 2])) greenPx++; if (isMagenta(png.data[i], png.data[i + 1], png.data[i + 2])) magentaPx++ } }
  let buttMinX = 1e9; const buttPts = []
  for (let y = 250; y <= 390; y++) for (let x = 0; x < 90; x++) { const i = (y * W + x) * 4; if (png.data[i + 3] >= 16 && x < buttMinX) buttMinX = x }
  for (let y = 250; y <= 390; y++) for (let x = buttMinX; x < buttMinX + 6; x++) { const i = (y * W + x) * 4; if (png.data[i + 3] >= 16) buttPts.push([x, y]) }
  const butt = [buttPts.reduce((s, p) => s + p[0], 0) / buttPts.length, buttPts.reduce((s, p) => s + p[1], 0) / buttPts.length]
  const th = FROZEN.weaponAngleDegAt512 * Math.PI / 180, ux = Math.cos(th), uy = Math.sin(th)
  let tip = null, tipT = -1e9, topBlade = null
  for (let y = 0; y < 260; y++) for (let x = 360; x < W; x++) { const i = (y * W + x) * 4; if (png.data[i + 3] >= 16) { const t = (x - butt[0]) * ux + (y - butt[1]) * uy; if (t > tipT) { tipT = t; tip = [x, y] } if (!topBlade || y < topBlade[1]) topBlade = [x, y] } }
  const clusters = []; let cur = null
  for (let x = 0; x < W; x++) { if (colLow[x] >= 455) { if (!cur) cur = { x0: x, x1: x, soleY: colLow[x] }; else { cur.x1 = x; cur.soleY = Math.max(cur.soleY, colLow[x]) } } else if (cur) { clusters.push(cur); cur = null } }
  if (cur) clusters.push(cur)
  const merged = []; for (const c of clusters) { const last = merged[merged.length - 1]; if (last && c.x0 - last.x1 < 18) { last.x1 = c.x1; last.soleY = Math.max(last.soleY, c.soleY) } else merged.push({ ...c }) }
  // per-boot sole profile: heel (leftmost quarter max sole row), toe (rightmost quarter), flatness
  const boots = merged.map(c => {
    const wdt = c.x1 - c.x0 + 1
    const seg = (a, b) => { let m = -1; for (let x = a; x <= b; x++) m = Math.max(m, colLow[x]); return m }
    const heelY = seg(c.x0, c.x0 + Math.floor(wdt * 0.25))
    const toeY = seg(c.x1 - Math.floor(wdt * 0.25), c.x1)
    let flatCols = 0; for (let x = c.x0; x <= c.x1; x++) if (colLow[x] >= c.soleY - 2) flatCols++
    return { x0: c.x0, x1: c.x1, centreX: (c.x0 + c.x1) / 2, soleY: c.soleY, heelY, toeY, heelRaisedPx: c.soleY - heelY, toeRaisedPx: c.soleY - toeY, flatFrac: flatCols / wdt }
  })
  const px = len(butt, tip), u = px * U_PER_PX, a = ang(butt, tip)
  const weapon = { buttRaster: butt, tipRaster: tip, topBladeRaster: topBlade, pxAt512: px, u, inBand: u >= FROZEN.weaponBandU.lo && u <= FROZEN.weaponBandU.hi, deltaPctVsAnchor: (px - FROZEN.weaponLengthPxAt512) / FROZEN.weaponLengthPxAt512 * 100, spreadAnchorVsCandCanonical: spreadOf([FROZEN.weaponLengthPxAt512, px]), angleDeg: a, anchorAngleDeg: FROZEN.weaponAngleDegAt512, angleDeltaDegVsAnchor: a - FROZEN.weaponAngleDegAt512, corridorPerpPxVsAnchorLine: { butt: perp(butt, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), tip: perp(tip, ANCHOR_WEAPON.butt, ANCHOR_WEAPON.tip), corridorLimitPx: 14 }, tipInsideFrame: tip[0] >= 0 && tip[0] <= 511 && xmax < 511, tipRightMarginPxAt512: 512 - tip[0], xmaxMarginPx: 511 - xmax }
  const body = { rasterCrownY: ymin, rasterGroundY: ymax, bodyHeightPxAt512: ymax - ymin, frozenHeightPxAt512: 459, deltaPx: (ymax - ymin) - 459 }
  const ground = { frozenGroundYAt512: 500, rasterGroundY: ymax, groundedErrorU: Math.abs(ymax - 500) * U_PER_PX, limitU: 1.5 }
  const stance = boots.length >= 2 ? { boots: boots.length, rearCentreX: boots[0].centreX, frontCentreX: boots[boots.length - 1].centreX, stanceCentreSpanPx: boots[boots.length - 1].centreX - boots[0].centreX, frontToeX: boots[boots.length - 1].x1, rearHeelX: boots[0].x0 } : { boots: boots.length }
  return { raster: { alphaBounds: { xmin, ymin, xmax, ymax }, greenPx, magentaPx, edgeOpaquePx: { left: edgeL, right: edgeR, top: edgeT, bottom: edgeB } }, weapon, body, ground, boots, stance }
}
function gatesNumericOf(m) {
  return {
    weaponLengthPass: m.weapon.inBand,
    weaponCorridorPass: m.weapon.corridorPerpPxVsAnchorLine.butt <= 14 && m.weapon.corridorPerpPxVsAnchorLine.tip <= 14 && m.weapon.tipInsideFrame,
    weaponDirectionPass: Math.abs(m.weapon.angleDeltaDegVsAnchor) <= 5,
    bodyPass: Math.abs(m.body.bodyHeightPxAt512 - 459) <= 1.5,
    groundPass: m.ground.groundedErrorU <= 1.5,
    seamsNumericPass: m.raster.greenPx === 0 && m.raster.magentaPx === 0 && m.raster.edgeOpaquePx.left === 0 && m.raster.edgeOpaquePx.right === 0 && m.raster.edgeOpaquePx.top === 0,
  }
}
function alphaMask(buf) { const png = PNG.sync.read(buf); const m = new Uint8Array(512 * 512); for (let i = 0; i < 512 * 512; i++) m[i] = png.data[i * 4 + 3] >= 16 ? 1 : 0; return m }
function xorFrac(a, b, y0 = 0) { let xor = 0, uni = 0; for (let y = y0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = y * 512 + x; if (a[i] || b[i]) { uni++; if (a[i] !== b[i]) xor++ } } return { xorPx: xor, unionPx: uni, xorFracOfUnion: uni ? xor / uni : 0 } }

// ---------- deterministic shaft retouch (walk:4 method, joint auto-selected) ----------
function shaftRetouch(srcBuf, butt, tip, targetU) {
  const src = PNG.sync.read(srcBuf); const W = 512, H = 512
  const orig = new Uint8ClampedArray(src.data)
  const dxy = [tip[0] - butt[0], tip[1] - butt[1]]; const len0 = Math.hypot(...dxy)
  const u = [dxy[0] / len0, dxy[1] / len0], n = [-u[1], u[0]]
  const frame = (x, y) => [(x - butt[0]) * u[0] + (y - butt[1]) * u[1], (x - butt[0]) * n[0] + (y - butt[1]) * n[1]]
  const targetPx = targetU / U_PER_PX, deltaPx = len0 - targetPx
  const shift = [Math.round(-deltaPx * u[0]), Math.round(-deltaPx * u[1])]
  const shiftAlongU = shift[0] * u[0] + shift[1] * u[1], shiftPerp = shift[0] * n[0] + shift[1] * n[1]
  const newTip = [tip[0] + shift[0], tip[1] + shift[1]]
  const O_BAND = [-20, 75]
  // blade o-profile width per t (alpha>=16, x>=340)
  const prof = {}
  for (let y = 0; y < H; y++) for (let x = 340; x < W; x++) { if (orig[(y * W + x) * 4 + 3] < 16) continue; const [t, o] = frame(x, y); const ti = Math.round(t); if (ti < 380 || ti > 580) continue; const p = prof[ti] ?? (prof[ti] = { lo: 1e9, hi: -1e9 }); if (o < p.lo) p.lo = o; if (o > p.hi) p.hi = o }
  const widthAt = (t) => { let lo = 1e9, hi = -1e9; for (let k = -3; k <= 3; k++) { const p = prof[Math.round(t) + k]; if (p) { lo = Math.min(lo, p.lo); hi = Math.max(hi, p.hi) } } return { lo, hi, width: hi - lo } }
  // choose T_CAP (cap length >=25px so the tip shape survives; joint inside blade)
  let best = null
  for (let tCap = Math.ceil(len0 - 90); tCap <= Math.floor(len0 - 25); tCap++) {
    const jointT = tCap + shiftAlongU; if (jointT < 400) continue
    const cw = widthAt(tCap), jw = widthAt(jointT); if (cw.width <= 0 || jw.width <= 0) continue
    const score = Math.abs(cw.lo - jw.lo) + Math.abs(cw.hi - jw.hi)
    if (!best || score < best.score) best = { tCap, jointT, score, capStartWidth: cw, retainedWidthAtJoint: jw, dLoPx: cw.lo - jw.lo, dHiPx: cw.hi - jw.hi }
  }
  if (!best) throw new Error('no retouch joint found')
  const { tCap: T_CAP, jointT } = best
  const REGION = { tMin: jointT - 5, oLo: O_BAND[0] - 5, oHi: O_BAND[1] + 5 }
  const inRegion = (t, o) => t >= REGION.tMin && o >= REGION.oLo && o <= REGION.oHi
  const inOpBand = (t, o) => o >= O_BAND[0] && o <= O_BAND[1]
  const out = new Uint8ClampedArray(orig); const moving = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [t, o] = frame(x, y); if (t >= T_CAP && inOpBand(t, o)) { const k = (y * W + x) * 4; if (orig[k + 3] > 0) moving.push({ x, y, px: [orig[k], orig[k + 1], orig[k + 2], orig[k + 3]] }) } }
  if (moving.length < 300) throw new Error('terminal segment too small ' + moving.length)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [t, o] = frame(x, y); if (t >= jointT && inOpBand(t, o)) { const k = (y * W + x) * 4; out[k] = out[k + 1] = out[k + 2] = out[k + 3] = 0 } }
  for (const m of moving) { const nx = m.x + shift[0], ny = m.y + shift[1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) throw new Error('shifted px OOB'); const k = (ny * W + nx) * 4; out[k] = m.px[0]; out[k + 1] = m.px[1]; out[k + 2] = m.px[2]; out[k + 3] = m.px[3] }
  const outPng = new PNG({ width: W, height: H }); outPng.data = Buffer.from(out)
  const outBuf = PNG.sync.write(outPng)
  const back = PNG.sync.read(outBuf)
  const regionHash = (data) => { const parts = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [t, o] = frame(x, y); if (!inRegion(t, o)) { const k = (y * W + x) * 4; parts.push(data[k], data[k + 1], data[k + 2], data[k + 3]) } } return sha(Buffer.from(parts)) }
  const hB = regionHash(orig), hA = regionHash(back.data)
  let chIn = 0, chOut = 0
  for (let p = 0; p < W * H; p++) { const k = p * 4; if (orig[k] !== back.data[k] || orig[k + 1] !== back.data[k + 1] || orig[k + 2] !== back.data[k + 2] || orig[k + 3] !== back.data[k + 3]) { const [t, o] = frame(p % W, (p / W) | 0); if (inRegion(t, o)) chIn++; else chOut++ } }
  if (hB !== hA || chOut !== 0) throw new Error(`outside-weapon changed ${chOut}`)
  return { outBuf, meta: { method: 'rigid terminal-blade-segment shift along measured shaft axis (walk:4 retouch practice); joint auto-selected by min blade cross-width mismatch |dLo|+|dHi| over cap lengths 25..90px, deterministic', butt, tipBefore: tip, tipAfter: newTip, lenBeforePx: len0, lenBeforeU: len0 * U_PER_PX, targetU, targetPx, deltaPx, shiftPx: shift, shiftAlongUPx: shiftAlongU, shiftPerpPx: shiftPerp, tCapPx: T_CAP, jointTPx: jointT, jointPoint: [butt[0] + jointT * u[0], butt[1] + jointT * u[1]], seamWidthMatch: best, oBand: O_BAND, movingPx: moving.length, outsideWeaponRegionProof: { hashBefore: hB, hashAfter: hA, identical: hB === hA, changedPxInsideRegion: chIn, changedPxOutsideRegion: chOut, region: REGION } } }
}

// ---------- (i) original walk:5 component extraction + registration ----------
const SRC = 'art/motion/xuchu/walk-candidate-2.png'
const srcBuf = readFileSync(SRC)
if (sha(srcBuf) !== 'bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c') throw new Error('sheet SHA mismatch')
const sh = PNG.sync.read(srcBuf); const SW = sh.width, SH = sh.height
const THR = 8
const label = new Int32Array(SW * SH).fill(-1); const comps = []
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
  const idx = y * SW + x
  if (label[idx] !== -1 || sh.data[idx * 4 + 3] < THR) continue
  const id = comps.length; let cnt = 0, x0 = x, x1 = x, y0 = y, y1 = y
  const stack = [[x, y]]; label[idx] = id
  while (stack.length) { const [cx, cy] = stack.pop(); cnt++; if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= SW || ny >= SH) continue; const ni = ny * SW + nx; if (label[ni] === -1 && sh.data[ni * 4 + 3] >= THR) { label[ni] = id; stack.push([nx, ny]) } } }
  comps.push({ id, cnt, bounds: [x0, y0, x1, y1] })
}
const big = comps.filter(c => c.cnt > 10000)
const bottomRow = big.filter(c => c.bounds[1] >= 512).sort((a, b) => a.bounds[0] - b.bounds[0])
if (big.length !== 6 || bottomRow.length !== 3) throw new Error(`expected 6 figures/3 bottom, got ${big.length}/${bottomRow.length}`)
const comp5 = bottomRow[2] // bottom row left->right = walk:3, walk:4, walk:5 (nominal cell 1024,512)
const [cx0, cy0, cx1, cy1] = comp5.bounds
const exPng = new PNG({ width: cx1 - cx0 + 1, height: cy1 - cy0 + 1 })
for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) { const si = y * SW + x; if (label[si] !== comp5.id) continue; const k = si * 4, dk = ((y - cy0) * exPng.width + (x - cx0)) * 4; exPng.data[dk] = sh.data[k]; exPng.data[dk + 1] = sh.data[k + 1]; exPng.data[dk + 2] = sh.data[k + 2]; exPng.data[dk + 3] = sh.data[k + 3] }
const exBuf = PNG.sync.write(exPng); writeFileSync(dir + 'orig-extracted.png', exBuf)
const bodyH = cy1 - cy0 + 1
const factor = FROZEN.bodyHeightPxAt512 / bodyH
const dy = FROZEN.groundYAt512 - cy1 * factor
const dx = 256 - ((cx0 + cx1) / 2) * factor
const exImg = await loadImage(dir + 'orig-extracted.png')
const rcv = createCanvas(512, 512); const rg = rcv.getContext('2d')
rg.imageSmoothingEnabled = true; rg.translate(dx, dy); rg.scale(factor, factor); rg.drawImage(exImg, cx0, cy0)
const origRegBuf = rcv.toBuffer('image/png'); writeFileSync(dir + 'orig-registered.png', origRegBuf)
const origRegM = measure(origRegBuf)
const origOutlier = !origRegM.weapon.inBand && origRegM.weapon.tipInsideFrame
let origFinalBuf = origRegBuf, origRetouch = { applied: false, reason: origRegM.weapon.inBand ? 'registered length in frozen band — no outlier' : 'length outside band but tip not inside frame (clipped tips may not be fabricated)' }
if (origOutlier) {
  const r = shaftRetouch(origRegBuf, origRegM.weapon.buttRaster, origRegM.weapon.tipRaster, 132.0)
  writeFileSync(dir + 'orig-retouched.png', r.outBuf); origFinalBuf = r.outBuf
  origRetouch = { applied: true, ...r.meta, outputSha256: sha(r.outBuf) }
}
// ---------- (ii) GPT registered shaft retouch ----------
const GPT_REG = 'art/motion/xuchu/closeout-campaign/04-walk5/gpt-attempt/registered.png'
const gptRegBuf = readFileSync(GPT_REG)
if (sha(gptRegBuf) !== 'fcca99509bd8578bdd12bf91136787bb5ec649b6fb1c0850a81f411c3b0ac4c6') throw new Error('gpt registered SHA mismatch')
const gptRegM = measure(gptRegBuf)
const gr = shaftRetouch(gptRegBuf, gptRegM.weapon.buttRaster, gptRegM.weapon.tipRaster, 132.0)
writeFileSync(dir + 'gpt-retouched.png', gr.outBuf)
const gptFinalBuf = gr.outBuf

// ---------- comparative banked frames ----------
const BANKED = {
  'walk:0': 'art/motion/xuchu/closeout-campaign/05-walk0/alternative/accepted.png',
  'walk:1': 'art/motion/xuchu/closeout-campaign/06-walk1/alternative/accepted.png',
  'walk:3': 'art/motion/xuchu/closeout-campaign/02-walk3/alternative/accepted.png',
  'walk:4': 'art/motion/xuchu/closeout-campaign/03-walk4/attempt2/accepted.png',
}
const bankedInfo = {}
for (const [k, p] of Object.entries(BANKED)) { const b = readFileSync(p); bankedInfo[k] = { path: p, sha256: sha(b), measure: measure(b), mask: alphaMask(b) } }

const CANDS = [
  { id: 'orig', label: 'original candidate-2 walk:5 (component-extracted+registered' + (origRetouch.applied ? '+shaft-retouched' : '') + ')', finalBuf: origFinalBuf, finalName: origRetouch.applied ? 'orig-retouched.png' : 'orig-registered.png' },
  { id: 'gpt', label: 'GPT guide candidate registered fcca9950 + shaft retouch to ~132u', finalBuf: gptFinalBuf, finalName: 'gpt-retouched.png' },
]
const candReports = []
for (const c of CANDS) {
  const m = measure(c.finalBuf); const g = gatesNumericOf(m)
  const mask = alphaMask(c.finalBuf)
  const distinct = {}
  for (const k of ['walk:0', 'walk:1', 'walk:3']) distinct[k] = { fullSilhouette: xorFrac(mask, bankedInfo[k].mask, 0), legRegionY340plus: xorFrac(mask, bankedInfo[k].mask, 340), bankedBoots: bankedInfo[k].measure.boots, bankedStance: bankedInfo[k].measure.stance }
  // evidence imagery from the FINAL cell
  writeFileSync(dir + `${c.id}-final.png`, c.finalBuf)
  const img = await loadImage(dir + `${c.id}-final.png`)
  const zoom = (x, y, w, hh, s, out) => { const cv = createCanvas(w * s, hh * s); const q = cv.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(img, x, y, w, hh, 0, 0, w * s, hh * s); writeFileSync(dir + out, cv.toBuffer('image/png')) }
  zoom(150, 0, 220, 220, 3, `${c.id}-head-3x.png`); zoom(0, 300, 512, 212, 2, `${c.id}-legs-2x.png`); zoom(330, 0, 182, 180, 4, `${c.id}-tip-4x.png`); zoom(0, 430, 512, 82, 4, `${c.id}-soles-4x.png`)
  const mc = createCanvas(512, 512); const mg = mc.getContext('2d'); mg.drawImage(img, 0, 0)
  mg.strokeStyle = '#ff40ff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(...m.weapon.buttRaster); mg.lineTo(...m.weapon.tipRaster); mg.stroke(); mg.fillStyle = '#ff40ff'; mg.font = '12px sans-serif'; mg.fillText('weapon butt->tip (fresh raster)', m.weapon.buttRaster[0], m.weapon.buttRaster[1] - 8)
  mg.strokeStyle = '#00ff80'; mg.beginPath(); mg.moveTo(0, 500); mg.lineTo(512, 500); mg.stroke(); mg.fillStyle = '#00ff80'; mg.fillText('frozen ground 500@512', 8, 494)
  mg.strokeStyle = '#40c0ff'; mg.setLineDash([6, 4]); mg.beginPath(); mg.moveTo(...ANCHOR_WEAPON.butt); mg.lineTo(...ANCHOR_WEAPON.tip); mg.stroke(); mg.setLineDash([])
  for (const b of m.boots) { mg.strokeStyle = '#ffe040'; mg.strokeRect(b.x0, 455, b.x1 - b.x0, 50) }
  writeFileSync(dir + `${c.id}-marked.png`, mc.toBuffer('image/png'))
  // sequence sheets walk:4 -> candidate -> walk:0 (gameplay 256px cells + legs 2x strip)
  const w4 = await loadImage(BANKED['walk:4']), w0 = await loadImage(BANKED['walk:0'])
  const seq = createCanvas(256 * 3, 256 + 24); const sg = seq.getContext('2d'); sg.fillStyle = '#181818'; sg.fillRect(0, 0, 768, 280)
  sg.drawImage(w4, 0, 24, 256, 256); sg.drawImage(img, 256, 24, 256, 256); sg.drawImage(w0, 512, 24, 256, 256)
  sg.fillStyle = '#fff'; sg.font = 'bold 14px sans-serif'; sg.fillText('walk:4 Passing-A (banked)', 6, 16); sg.fillText(`walk:5 candidate ${c.id}`, 262, 16); sg.fillText('walk:0 Guard (banked)', 518, 16)
  writeFileSync(dir + `sequence-${c.id}-gameplay.png`, seq.toBuffer('image/png'))
  const legs = createCanvas(512 * 2, (364 + 22) * 3); const lg = legs.getContext('2d'); lg.fillStyle = '#181818'; lg.fillRect(0, 0, legs.width, legs.height); lg.imageSmoothingEnabled = false
  const strip = (im, row, t) => { lg.drawImage(im, 0, 330, 512, 182, 0, row * 386 + 22, 1024, 364); lg.fillStyle = '#fff'; lg.font = 'bold 15px sans-serif'; lg.fillText(t, 6, row * 386 + 16) }
  strip(w4, 0, 'walk:4 Passing-A (banked) legs 2x'); strip(img, 1, `walk:5 candidate ${c.id} legs 2x`); strip(w0, 2, 'walk:0 Guard (banked) legs 2x')
  writeFileSync(dir + `sequence-${c.id}-legs-2x.png`, legs.toBuffer('image/png'))
  // comparative contact sheet vs walk:0/1/3 at gameplay size
  const w1 = await loadImage(BANKED['walk:1']), w3 = await loadImage(BANKED['walk:3'])
  const comp = createCanvas(256 * 4, 280); const cg = comp.getContext('2d'); cg.fillStyle = '#181818'; cg.fillRect(0, 0, 1024, 280)
  cg.drawImage(img, 0, 24, 256, 256); cg.drawImage(w0, 256, 24, 256, 256); cg.drawImage(w1, 512, 24, 256, 256); cg.drawImage(w3, 768, 24, 256, 256)
  cg.fillStyle = '#fff'; cg.font = 'bold 14px sans-serif'; cg.fillText(`walk:5 cand ${c.id}`, 6, 16); cg.fillText('walk:0 Guard', 262, 16); cg.fillText('walk:1 Contact-A', 518, 16); cg.fillText('walk:3 Contact-B', 774, 16)
  writeFileSync(dir + `compare-${c.id}-gameplay.png`, comp.toBuffer('image/png'))
  candReports.push({ id: c.id, label: c.label, finalCell: { path: dir + c.finalName, copiedAs: dir + `${c.id}-final.png`, sha256: sha(c.finalBuf), size: [512, 512] }, freshRasterMeasurement: m, gatesNumeric: g, allNumericPass: Object.values(g).every(Boolean), distinctnessVsBanked: distinct, evidenceImages: [`${c.id}-marked.png`, `${c.id}-head-3x.png`, `${c.id}-legs-2x.png`, `${c.id}-tip-4x.png`, `${c.id}-soles-4x.png`, `sequence-${c.id}-gameplay.png`, `sequence-${c.id}-legs-2x.png`, `compare-${c.id}-gameplay.png`] })
  console.log(c.id, JSON.stringify({ u: m.weapon.u, dAng: m.weapon.angleDeltaDegVsAnchor, corridor: m.weapon.corridorPerpPxVsAnchorLine, body: m.body, ground: m.ground, boots: m.boots, stance: m.stance, gates: g, xor0: distinct['walk:0'], xor1full: distinct['walk:1'].fullSilhouette, xor3full: distinct['walk:3'].fullSilhouette }))
}
const report = {
  work: 'cmr15a-walk5-zerogen-amendment', key: 'walk:5', zeroGeneration: true,
  authority: 'Owner 2026-10-13 CMR-15A WALK:5 ZERO-GENERATION PHASE AMENDMENT (verbatim in TASKS.md CMR-15A): CAMPAIGN (a) walk:5 ONLY amended to Stop/Settle closing key; (i) component-extract original candidate-2 walk:5, register, retouch only if in-frame length outlier; (ii) shaft-retouch GPT registered fcca9950 to ~132u; gate both campaign-standard incl distinctness vs walk:0/1/3 and walk:4->5->0 continuity at gameplay + 4x; bank at most one only if every gate passes, else STOP WAITING_FOR_OWNER; no Phase 3 in this package.',
  amendedWalk5Definition: 'Stop/Settle closing key — a genuinely distinct grounded drawing after walk:4 Passing-A that reads as the final step settling toward walk:0 guard: front foot planted ahead, rear foot grounded/closing, no passing leg, not a guard duplicate, not a repeat of the walk:1/walk:3 contact arrangement.',
  frozenBriefBand: FROZEN, anchorWeaponLineAt512: ANCHOR_WEAPON,
  ledgerVerified: ledgerState,
  origBuild: {
    source: { path: SRC, sha256: sha(srcBuf), size: [SW, SH] },
    components: big.map(c => ({ id: c.id, cnt: c.cnt, bounds: c.bounds })),
    walk5Component: { id: comp5.id, cntAlphaGE8: comp5.cnt, boundsSheet: comp5.bounds, nominalCellOrigin: [1024, 512], touchesSheetRightEdge: cx1 >= SW - 1, touchesSheetEdgeAny: { left: cx0 <= 0, right: cx1 >= SW - 1, top: cy0 <= 0, bottom: cy1 >= SH - 1 } },
    extracted: { path: dir + 'orig-extracted.png', sha256: sha(exBuf), size: [exPng.width, exPng.height] },
    registration: { rule: 'factor=459/bodyH, ground(cy1)->500@512, alpha bounds centred (campaign rule)', bodyHeightSheetPx: bodyH, factor, factorPct: (factor - 1) * 100, withinPlusMinus12Pct: Math.abs(factor - 1) <= 0.12, dx, dy, registeredPath: dir + 'orig-registered.png', registeredSha256: sha(origRegBuf) },
    registeredMeasure: origRegM, registeredGatesNumeric: gatesNumericOf(origRegM),
    inFrameLengthOutlier: origOutlier,
    shaftRetouch: origRetouch,
  },
  gptBuild: {
    source: { path: GPT_REG, sha256: sha(gptRegBuf) },
    registeredMeasureBefore: gptRegM, registeredGatesNumericBefore: gatesNumericOf(gptRegM),
    shaftRetouch: { applied: true, ...gr.meta, outputPath: dir + 'gpt-retouched.png', outputSha256: sha(gr.outBuf) },
  },
  bankedComparators: Object.fromEntries(Object.entries(bankedInfo).map(([k, v]) => [k, { path: v.path, sha256: v.sha256, boots: v.measure.boots, stance: v.measure.stance, weaponU: v.measure.weapon.u, body: v.measure.body, ground: v.measure.ground }])),
  candidates: candReports,
  visualVerdicts: 'PENDING — filled after personal read of final cells + evidence imagery',
  disposition: 'PENDING',
}
writeFileSync(dir + 'gate.json', JSON.stringify(report, null, 2) + '\n')
console.log('orig comp', JSON.stringify({ bounds: comp5.bounds, factor, regSha: sha(origRegBuf), regU: origRegM.weapon.u, outlier: origOutlier, retouchApplied: origRetouch.applied }))
console.log('gpt retouch', JSON.stringify({ beforeU: gptRegM.weapon.u, outSha: sha(gr.outBuf), joint: gr.meta.jointPoint, seam: gr.meta.seamWidthMatch, outside: gr.meta.outsideWeaponRegionProof.identical }))
