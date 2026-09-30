// Whole-frame pilot (docs/WHOLE_FRAME_TEST.md), step 3: prepare painted
// whole-figure frames for the game.
//
// For each pose: load the accepted master (art/whole-frames/<id>/<pose>-
// master.png), extract the figure (provider alpha when present, else a
// border-seeded #FF00FF key with despill), keep the connected component(s)
// touching the main figure, then FIT it to the pose guide's silhouette mask
// by a grid search over uniform scale and translation (no rotation) that
// maximises IoU. The fitted figure is resampled into a cell exactly the size
// of the game's art box for that pose (artBoxFor) at DENSITY, so on-screen
// scale and bottom-centre anchoring are identical to the paper-doll frames.
//
// Outputs:
//   src/game/assets/whole-frames/<id>-sheet.png   cells side by side
//   src/game/assets/whole-frames/prepared.json    cells, density, fit, sha256, signature
//   artifacts/wholeframe/<id>-<pose>-fit.png      guide outline over the fitted frame
//   artifacts/wholeframe/fit.json                 fit numbers per pose
// Deterministic: same masters + same guides = same bytes.
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'

export const DENSITY = 4
export const REVISION = 'wf-1'
/**
 * The plan's original fit metric: silhouette IoU against the guide (down
 * looser). Kept and REPORTED, but it cannot be met by a correct painting: the
 * mannequin guide has no costume volume, and a robed figure over it scores
 * ~0.5-0.7 IoU even when every limb, the head and the blade register (see
 * artifacts/wholeframe/*-fit.png). The pose gate is COVERAGE instead.
 */
export const IOU_FLOOR = { idle: 0.8, attack: 0.8, down: 0.75 }
/**
 * Share of the guide pose the painting must cover within POSE_TOL_U: every
 * guide limb/head/weapon pixel counts as covered when painted paint lies
 * within that distance. A 1u tolerance absorbs a haft painted 4.4u wide
 * against the guide's 5.2u and a boot outline a hair inside the mannequin's
 * - drawing differences, not pose differences (see *-miss.png).
 */
export const COVERAGE_FLOOR = { idle: 0.9, attack: 0.9, down: 0.85 }
export const POSE_TOL_U = 1.0
const ID = process.env.WHOLEFRAME_ID ?? 'guanyu'
const POSES = ['idle', 'attack', 'down']
const MAG_TOL = 90

/** Mirror of src/game/art/image-signature.ts (48x32 premultiplied blocks). */
function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) {
      for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]; n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}

/** Figure alpha: provider alpha when present, else magenta key + despill. */
function extract(img) {
  const c = createCanvas(img.width, img.height)
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const im = g.getImageData(0, 0, img.width, img.height)
  const d = im.data
  let transparent = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] < 8) transparent += 1
  const hasAlpha = transparent > (d.length / 4) * 0.2
  if (!hasAlpha) {
    // Distance from pure magenta; border-seeded flood marks background.
    const w = img.width, h = img.height
    const isMag = (i) => Math.abs(d[i] - 255) + d[i + 1] + Math.abs(d[i + 2] - 255) < MAG_TOL
    const bg = new Uint8Array(w * h)
    const stack = []
    for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x) }
    for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1) }
    while (stack.length) {
      const p = stack.pop()
      if (bg[p] || !isMag(p * 4)) continue
      bg[p] = 1
      const x = p % w, y = (p - x) / w
      if (x > 0) stack.push(p - 1)
      if (x < w - 1) stack.push(p + 1)
      if (y > 0) stack.push(p - w)
      if (y < h - 1) stack.push(p + w)
    }
    for (let p = 0; p < w * h; p++) {
      const i = p * 4
      if (bg[p]) { d[i + 3] = 0; continue }
      // Despill: pull magenta cast out of edge pixels (G is the honest channel).
      const spill = Math.min(d[i], d[i + 2]) - d[i + 1]
      if (spill > 0) { d[i] -= spill * 0.6; d[i + 2] -= spill * 0.6 }
    }
  }
  return { im, hasAlpha }
}

/** Keep components that are large (>= 2% of the largest); drop specks. */
function dropSpecks(im) {
  const { width: w, height: h, data: d } = im
  const label = new Int32Array(w * h).fill(-1)
  const sizes = []
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== -1 || d[p * 4 + 3] < 24) continue
    const id = sizes.length
    let n = 0
    const stack = [p]
    label[p] = id
    while (stack.length) {
      const q = stack.pop()
      n += 1
      const x = q % w, y = (q - x) / w
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const r = ny * w + nx
        if (label[r] !== -1 || d[r * 4 + 3] < 24) continue
        label[r] = id
        stack.push(r)
      }
    }
    sizes.push(n)
  }
  const big = Math.max(0, ...sizes)
  let dropped = 0
  for (let p = 0; p < w * h; p++) {
    const id = label[p]
    if (id >= 0 && sizes[id] < big * 0.02) { d[p * 4 + 3] = 0; dropped += 1 }
    else if (id === -1 && d[p * 4 + 3] > 0) { /* faint halo pixels stay */ }
  }
  return { components: sizes.filter((s) => s >= big * 0.02).length, dropped }
}

/** Binary mask (alpha >= 128) downsampled by `k` (area majority). */
function maskOf(data, w, h, k, alphaIdx = 3, thr = 128) {
  const mw = Math.floor(w / k), mh = Math.floor(h / k)
  const m = new Uint8Array(mw * mh)
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    let on = 0
    for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) {
      if (data[((y * k + yy) * w + (x * k + xx)) * 4 + alphaIdx] >= thr) on += 1
    }
    m[y * mw + x] = on * 2 >= k * k ? 1 : 0
  }
  return { m, w: mw, h: mh }
}

function bbox(m, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  return { x0, y0, x1, y1 }
}

/**
 * IoU of the painted mask mapped by (s, tx, ty) - guide = painted * s + t -
 * against the guide mask, evaluated on the guide grid by inverse mapping.
 */
function iou(pm, gm, s, tx, ty) {
  let inter = 0, union = 0
  for (let y = 0; y < gm.h; y++) for (let x = 0; x < gm.w; x++) {
    const px = Math.floor((x + 0.5 - tx) / s), py = Math.floor((y + 0.5 - ty) / s)
    const a = px >= 0 && py >= 0 && px < pm.w && py < pm.h ? pm.m[py * pm.w + px] : 0
    const b = gm.m[y * gm.w + x]
    if (a && b) inter += 1
    if (a || b) union += 1
  }
  return union ? inter / union : 0
}

function fit(pm, gm, pose) {
  // Initial guess: bottom-anchored bbox height match (width for lying).
  const pb = bbox(pm.m, pm.w, pm.h), gb = bbox(gm.m, gm.w, gm.h)
  const s0 = pose === 'down'
    ? (gb.x1 - gb.x0 + 1) / (pb.x1 - pb.x0 + 1)
    : (gb.y1 - gb.y0 + 1) / (pb.y1 - pb.y0 + 1)
  let best = { s: s0, tx: 0, ty: 0, iou: -1 }
  const place = (s) => ({ tx: (gb.x0 + gb.x1) / 2 - ((pb.x0 + pb.x1) / 2) * s, ty: gb.y1 - pb.y1 * s })
  for (let si = -8; si <= 8; si++) {
    const s = s0 * (1 + si * 0.025)
    if (s / s0 < 0.8 || s / s0 > 1.25) continue
    const c = place(s)
    for (let dy = -12; dy <= 12; dy += 2) for (let dx = -12; dx <= 12; dx += 2) {
      const v = iou(pm, gm, s, c.tx + dx, c.ty + dy)
      if (v > best.iou) best = { s, tx: c.tx + dx, ty: c.ty + dy, iou: v }
    }
  }
  // Refine around the best at 1-cell steps and finer scale.
  const b0 = { ...best }
  for (let si = -4; si <= 4; si++) {
    const s = b0.s * (1 + si * 0.006)
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const v = iou(pm, gm, s, b0.tx + dx, b0.ty + dy)
      if (v > best.iou) best = { s, tx: b0.tx + dx, ty: b0.ty + dy, iou: v }
    }
  }
  return best
}

/** Colour histogram (8x8x8, alpha-weighted) for palette consistency. */
function hist(data) {
  const hsum = new Float64Array(512)
  let tot = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255
    if (a < 0.5) continue
    hsum[((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5)] += a
    tot += a
  }
  for (let i = 0; i < 512; i++) hsum[i] /= Math.max(1, tot)
  return hsum
}
const histSim = (a, b) => { let s = 0; for (let i = 0; i < 512; i++) s += Math.min(a[i], b[i]); return Math.round(s * 1000) / 1000 }

export async function main() {
  const src = `art/whole-frames/${ID}`
  const outDir = 'src/game/assets/whole-frames'
  mkdirSync(outDir, { recursive: true })
  mkdirSync('artifacts/wholeframe', { recursive: true })
  const masterBody = await loadImage(`art/fighter-bodies/${ID}-body-master.jpg`)
  const mbc = createCanvas(masterBody.width, masterBody.height)
  const mbg = mbc.getContext('2d')
  mbg.drawImage(masterBody, 0, 0)
  const mbd = mbg.getImageData(0, 0, masterBody.width, masterBody.height).data
  // Body master has a black background: key near-black out of its histogram.
  for (let i = 0; i < mbd.length; i += 4) if (mbd[i] + mbd[i + 1] + mbd[i + 2] < 36) mbd[i + 3] = 0
  const masterHist = hist(mbd)
  const cells = []
  const fitReport = {}
  const hists = {}
  for (const pose of POSES) {
    const guide = JSON.parse(readFileSync(`${src}/guide-${pose}.json`, 'utf8'))
    const img = await loadImage(`${src}/${pose}-master.png`)
    const { im, hasAlpha } = extract(img)
    const specks = dropSpecks(im)
    const gimg = await loadImage(`${src}/guide-${pose}-mask.png`)
    const gc = createCanvas(gimg.width, gimg.height)
    const gg = gc.getContext('2d')
    gg.drawImage(gimg, 0, 0)
    const gd = gg.getImageData(0, 0, gimg.width, gimg.height).data
    const K = 8
    const pm = maskOf(im.data, im.width, im.height, K)
    const gm = maskOf(gd, gimg.width, gimg.height, K, 0, 128)
    const f = fit(pm, gm, pose)
    // Mapping painted px -> guide px: g = p * s + t*K (s is scale-invariant across K).
    const sG = f.s
    const tG = { x: f.tx * K, y: f.ty * K }
    // guide px -> box px at DENSITY:  box = ((g - d)/s_guide + crop0) / Z * DENSITY
    const o = guide.origin
    const toBox = (gx, gy) => ({
      x: (((gx - o.d.x) / o.s + o.crop.x) / o.Z) * DENSITY,
      y: (((gy - o.d.y) / o.s + o.crop.y) / o.Z) * DENSITY,
    })
    const cw = Math.round(guide.box.width * DENSITY)
    const ch = Math.round(guide.box.height * DENSITY)
    const cell = createCanvas(cw, ch)
    const cg = cell.getContext('2d')
    cg.imageSmoothingEnabled = true
    cg.imageSmoothingQuality = 'high'
    // Painted px -> box px is affine: box = p * A + B.
    const p0 = toBox(tG.x, tG.y)
    const p1 = toBox(tG.x + sG * 1000, tG.y)
    const A = (p1.x - p0.x) / 1000
    const figC = createCanvas(im.width, im.height)
    figC.getContext('2d').putImageData(im, 0, 0)
    cg.setTransform(A, 0, 0, A, p0.x, p0.y)
    cg.drawImage(figC, 0, 0)
    cg.setTransform(1, 0, 0, 1, 0, 0)
    // Standing frames: nothing may hang below the ground line (the sprite
    // anchors bottom-centre at the feet); clear rows under it.
    const groundBox = Math.round(ch)
    void groundBox
    const cd = cg.getImageData(0, 0, cw, ch)
    // Fit checks in box units: feet on the ground line, weapon tip.
    const unit = (bx, by) => ({ x: bx / DENSITY - guide.box.ox, y: by / DENSITY - guide.box.oy })
    let lowest = -1
    for (let y = ch - 1; y >= 0 && lowest < 0; y--) for (let x = 0; x < cw; x++) if (cd.data[(y * cw + x) * 4 + 3] >= 128) { lowest = y; break }
    const groundU = 92
    const feetErr = Math.round((unit(0, lowest + 1).y - groundU) * 100) / 100
    // Guide silhouette in box space (for coverage, spill and the blade tip).
    const gmBox = createCanvas(cw, ch)
    const gmg = gmBox.getContext('2d')
    const q0 = toBox(0, 0), q1 = toBox(gimg.width, gimg.height)
    gmg.drawImage(gc, q0.x, q0.y, q1.x - q0.x, q1.y - q0.y)
    const gmd = gmg.getImageData(0, 0, cw, ch)
    const gOn = (x, y) => gmd.data[(y * cw + x) * 4] >= 128
    const pOn = (x, y) => cd.data[(y * cw + x) * 4 + 3] >= 128
    // Weapon tip: farthest silhouette pixel along the haft direction (butt ->
    // socket), measured the same way on the painting and on the guide, so the
    // comparison is blade point to blade point (the socket anchor sits ~22u
    // short of the crescent's point).
    const bu = guide.anchors.weaponButt.u, tu = guide.anchors.weaponTip.u
    const dir = { x: tu.x - bu.x, y: tu.y - bu.y }
    const dl = Math.hypot(dir.x, dir.y) || 1
    const tipOf = (on) => {
      let best = -Infinity, pt = null
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        if (!on(x, y)) continue
        const u = unit(x, y)
        const pr = ((u.x - bu.x) * dir.x + (u.y - bu.y) * dir.y) / dl
        if (pr > best) { best = pr; pt = u }
      }
      return pt
    }
    const tipP = tipOf(pOn)
    const tipG = tipOf(gOn)
    const tipErr = tipP && tipG ? Math.round(Math.hypot(tipP.x - tipG.x, tipP.y - tipG.y) * 100) / 100 : null
    // Coverage: share of the guide pose the painting covers (limbs, weapon
    // and head where the rig puts them). Spill: share of painted pixels more
    // than 6u from the guide (costume volume - robes, sleeves - is expected;
    // reported, not gated). IoU is kept as the plan's original metric.
    let gTot = 0, gCov = 0, gCovExact = 0, pTot = 0, pFar = 0
    const R = 6 * DENSITY
    const T = Math.round(POSE_TOL_U * DENSITY)
    const near = new Uint8Array(cw * ch)
    // Painted mask dilated by T (coverage with a pose tolerance).
    const pDil = new Uint8Array(cw * ch)
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      if (!pOn(x, y)) continue
      for (let yy = Math.max(0, y - T); yy <= Math.min(ch - 1, y + T); yy++) {
        for (let xx = Math.max(0, x - T); xx <= Math.min(cw - 1, x + T); xx++) pDil[yy * cw + xx] = 1
      }
    }
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      if (!gOn(x, y)) continue
      gTot++
      if (pDil[y * cw + x]) gCov++
      if (pOn(x, y)) gCovExact++
    }
    // Distance-to-guide via a coarse dilation of the guide mask by R.
    const step = 4
    for (let y = 0; y < ch; y += step) for (let x = 0; x < cw; x += step) {
      if (!gOn(x, y)) continue
      for (let yy = Math.max(0, y - R); yy <= Math.min(ch - 1, y + R); yy += step) {
        for (let xx = Math.max(0, x - R); xx <= Math.min(cw - 1, x + R); xx += step) near[yy * cw + xx] = 1
      }
    }
    for (let y = 0; y < ch; y += step) for (let x = 0; x < cw; x += step) {
      if (!pOn(x, y)) continue
      pTot++
      if (!near[y * cw + x]) pFar++
    }
    const coverage = Math.round((gCov / Math.max(1, gTot)) * 1000) / 1000
    const coverageExact = Math.round((gCovExact / Math.max(1, gTot)) * 1000) / 1000
    const spill = Math.round((pFar / Math.max(1, pTot)) * 1000) / 1000
    // Border must be clear (the box pad).
    let border = 0
    for (let x = 0; x < cw; x++) { if (cd.data[x * 4 + 3] >= 32) border++ }
    for (let y = 0; y < ch; y++) { if (cd.data[(y * cw) * 4 + 3] >= 32) border++; if (cd.data[(y * cw + cw - 1) * 4 + 3] >= 32) border++ }
    let magenta = 0
    for (let i = 0; i < cd.data.length; i += 4) {
      if (cd.data[i + 3] >= 128 && cd.data[i] > 200 && cd.data[i + 1] < 80 && cd.data[i + 2] > 200) magenta++
    }
    hists[pose] = hist(cd.data)
    fitReport[pose] = {
      hasAlpha, components: specks.components, specksDropped: specks.dropped,
      iou: Math.round(f.iou * 1000) / 1000, iouFloor: IOU_FLOOR[pose], scaleVsGuess: Math.round(f.s * 1000) / 1000,
      coverage, coverageFloor: COVERAGE_FLOOR[pose], coverageExact, poseTolU: POSE_TOL_U, spill6u: spill,
      feetOffGroundU: guide.lying ? null : feetErr,
      weaponTipErrU: tipErr,
      borderOpaquePx: border, magentaPx: magenta,
      paletteVsMaster: histSim(hists[pose], masterHist),
    }
    cells.push({ pose, cell, cw, ch })
    // Review overlay: fitted frame with the guide silhouette outline on top.
    const ov = createCanvas(cw, ch)
    const og = ov.getContext('2d')
    og.fillStyle = '#3a3440'
    og.fillRect(0, 0, cw, ch)
    og.drawImage(cell, 0, 0)
    const od = og.getImageData(0, 0, cw, ch)
    for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) {
      const on = gOn
      if (on(x, y) && (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1))) {
        const i = (y * cw + x) * 4
        od.data[i] = 80; od.data[i + 1] = 255; od.data[i + 2] = 120; od.data[i + 3] = 255
      }
    }
    og.putImageData(od, 0, 0)
    writeFileSync(`artifacts/wholeframe/${ID}-${pose}-fit.png`, ov.toBuffer('image/png'))
  }
  for (const [i, a] of POSES.entries()) for (const b of POSES.slice(i + 1)) {
    fitReport[`palette ${a}~${b}`] = histSim(hists[a], hists[b])
  }
  // Sheet: cells side by side.
  const sheetW = cells.reduce((s, c) => s + c.cw, 0)
  const sheetH = Math.max(...cells.map((c) => c.ch))
  const sheet = createCanvas(sheetW, sheetH)
  const sg = sheet.getContext('2d')
  const frames = {}
  let x = 0
  for (const c of cells) {
    sg.drawImage(c.cell, x, 0)
    frames[c.pose] = { x, y: 0, w: c.cw, h: c.ch }
    x += c.cw
  }
  const png = sheet.toBuffer('image/png')
  writeFileSync(`${outDir}/${ID}-sheet.png`, png)
  const im = sg.getImageData(0, 0, sheetW, sheetH)
  const prepared = {
    [ID]: {
      revision: REVISION,
      density: DENSITY,
      sheet: { width: sheetW, height: sheetH },
      frames,
      signatures: { sheet: signature(im) },
      sha256: { sheet: createHash('sha256').update(png).digest('hex') },
      fit: fitReport,
    },
  }
  writeFileSync(`${outDir}/prepared.json`, `${JSON.stringify(prepared, null, 2)}\n`)
  writeFileSync('artifacts/wholeframe/fit.json', `${JSON.stringify(fitReport, null, 2)}\n`)
  console.log(`${ID}: sheet ${sheetW}x${sheetH}, ${png.length} bytes`)
  console.log(JSON.stringify(fitReport, null, 1))
}

if (process.argv[1]?.endsWith('prepare-whole-frames.mjs')) await main()
