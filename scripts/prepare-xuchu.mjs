#!/usr/bin/env node
// CMR-15A Phase D preparation: OFFLINE pack from the 36 banked accepted
// cells (walk 6 + charge/combo/heavy/misc/fall/getup 5 each). No runtime
// catalog activation, no CMR-15B, zero image generation.
//
//   node scripts/prepare-xuchu.mjs
//
// Modelled on scripts/prepare-lidian.mjs / prepare-xiahoudun.mjs and the
// shared motion pipeline:
// - Every banked cell is SHA-256-pinned below; a changed source fails loud.
// - Each cell is already registered by its family gate to the ONE frozen
//   512-pack scale (body 459px, groundY 500 on 512-high canvases, 756 on
//   768-high canvases), so every per-sheet factor is 1 - documented, not
//   fitted here. No per-pose scale, warp or silhouette normalisation.
// - walk:2 is the sole opaque source (JPEG bytes in accepted.png /
//   candidate-raw.jpg, painted backdrop, gate SCALE=2: 1024px = 512x2).
//   It is finished deterministically: border flood keying following the
//   backdrop gradient (neighbour step <= 4 Euclidean RGB; the step-4/5
//   plateaus agree within 0.3% of foreground area, step 6 leaks), then ONE
//   uniform 0.5 resample to its gate's 512 registration (sole 1000->500).
//   Keyed/registered rasters are saved under 13-pack/ for provenance.
// - Each kept drawing is isolated IN MEMORY (largest alpha>=96 component,
//   byte-exact integer translation into its container cell - exactly the
//   pixels the pipeline cleanAlpha keeps) and composed into a 3x3
//   container sheet per sequence at natural size. Originals untouched.
// - Registration: one uniform scale per sheet (factor 1 relative) with a
//   PAGE-AWARE base (trims under cap/1.28, packed pages then verified
//   under the 16MiB contract, step-downs recorded). Hero box
//   260x144/groundY 136 (Li Dian precedent; the binding frame and the
//   resulting walk-guard height are reported, no taller box presumed).
// - getup:0 is a DISTINCT banked drawing (not byte-identical to fall:4),
//   so no alias is declared; duplicate content is reported by the pipeline.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import {
  DENSITY,
  DECODED_CAP,
  PAGE_LIMIT,
  TRIM_PAD,
  alphaComponents,
  preparePack,
  writePackOutputs,
} from './motion-pipeline.mjs'

const CC = 'art/motion/xuchu/closeout-campaign'
const SRC = 'art/motion/xuchu'
const OUT = 'artifacts/motion/xuchu'
const PACK_DIR = `${CC}/13-pack`
const REVIEW = `${OUT}/review`
const BOX = { width: 260, height: 144, groundY: 136 }
const U_PER_PX = 124 / 477
const KEY_STEP = 4

const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const fileSha = (path) => sha(readFileSync(path))

// ---- pinned banked inventory (play order) -----------------------------------
const CELLS = {
  walk: [
    { label: 'guard', path: `${CC}/05-walk0/alternative/accepted.png`, sha256: '2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450' },
    { label: 'contact-a-heel-strike', path: `${CC}/06-walk1/alternative/accepted.png`, sha256: '2de4d8490eff7f1751785c312dc1fac6518e6d6d40d03befefc8e9bee113367c' },
    { label: 'passing-b', path: `${CC}/01-walk2/candidate-raw.jpg`, sha256: '893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6', walk2Jpeg: true },
    { label: 'contact-b', path: `${CC}/02-walk3/alternative/accepted.png`, sha256: 'dc3e699fabf115ea6ab3c064b51680862697a59a85c70cfa627252f41dff1ea7' },
    { label: 'passing-a', path: `${CC}/03-walk4/attempt2/accepted.png`, sha256: '75488eb18b330aef398faede00f59a000f20d7a3659d6c2ec24e031f29c0a6ad' },
    { label: 'stop-settle', path: `${CC}/04-walk5/zerogen-amendment/accepted.png`, sha256: '89afcca7c4af1c757cd2500c240ce5a276ad29964925ee566e5f6500f75c4b07' },
  ],
  charge: [
    { label: 'guard', file: 'cell0-guard.png', sha256: '3f33dc31f464b8c7776333e69cf0e1769a227f20240fc68314623a74a77ae3ae' },
    { label: 'crouch-coil-windup', file: 'cell1-crouch-coil-windup.png', sha256: '452dc8e993e73e18b2a4142584867ab7bb2251cb50cbf39ecbdb533eebb32a71' },
    { label: 'launch', file: 'cell2-launch.png', sha256: 'e11525d4e43bc5f32ffdad915d1c5a983f8082d10c6ccbb7c02b787a6d877fa7' },
    { label: 'crushing-dash', file: 'cell3-crushing-dash.png', sha256: 'a0aec6aaacaa9f871c41d0ad0971d56aae9e28d20d440f2482fa3e6453874b69', waived: '146.04u OUT_HIGH +8.54u' },
    { label: 'brake', file: 'cell4-brake.png', sha256: '3c864aa12b4de8d157013d7431b0aaeaceb51d377c4724f3c94812de8369a374', waived: '118.70u OUT_LOW -5.71u' },
  ],
  combo: [
    { label: 'windup', file: 'cell0-windup.png', sha256: '38e987905398b2c380492dcc887e421d055797d6869c01f3a43ebdcbd5d354b8' },
    { label: 'rising-cut', file: 'cell1-rising-cut.png', sha256: 'df6196ff6cc638f6f8319ad18803a03ad7ab1ee82565545fc6d898d05e08a3e9', waived: '140.96u OUT_HIGH +3.46u' },
    { label: 'follow-through', file: 'cell2-follow-through.png', sha256: '8aa01ca269c5420f1499c4fb8cb6d0135f7e591902f37102bfac4069aef022e5' },
    { label: 'sweep', file: 'cell3-sweep.png', sha256: '18c68a0075163b7245a272413eca488be3a0ee6b2fc30dcfa0a7b2120bdbbda3', waived: '143.48u OUT_HIGH +5.98u' },
    { label: 'recover', file: 'cell4-recover.png', sha256: '3f6a773dd72d714c91faeb985c4bbacf0f8b4b6e6966031cd7b70627576d4c90' },
  ],
  heavy: [
    { label: 'raise', file: 'cell0-raise.png', sha256: '7b416cd6a49055226390690ce4a6acb24cc30e4f92b0db56ac3e954c0d9bcfb7' },
    { label: 'overhead-hold', file: 'cell1-overhead-hold.png', sha256: '26270b4c7837522a82587a124aaab8e5be7ccd681b5587be3f6cb7d47d6113b5' },
    { label: 'crushing-chop', file: 'cell2-crushing-chop.png', sha256: '0bb2ebf82af81b79c6f208ab8af582b85a639c51cfe4fc00bcc0fb7b27f4d55a' },
    { label: 'follow-through', file: 'cell3-follow-through.png', sha256: 'e5e234f917bcfdf4c31d8db0bb5c8515d7b52dad50e8adaba818b3220b939fc9', waived: '141.14u OUT_HIGH +3.64u' },
    { label: 'recover', file: 'cell4-recover.png', sha256: '57190b6f0d3e7b26b868ecb4e6d89a3ca6dad4b399e3db7104adcfb1861ae9a8', waived: '145.22u OUT_HIGH +7.72u' },
  ],
  misc: [
    { label: 'hurt-recoil', file: 'cell0-hurt-recoil.png', sha256: '3cb8c83c475d6c9ec31113933b98a73639b2286e8ececd928a5fa00ec04aac8d' },
    { label: 'hurt-fold', file: 'cell1-hurt-fold.png', sha256: 'a454f232f41c59ba55f45b805d7b0898d8d19616feda5cb311f9ee20aa4255b5' },
    { label: 'held-clamp', file: 'cell2-held-clamp.png', sha256: '19e1496b95d2f4ce4eca37b26aab026adecd78e975fd4b54003cc9a29c67e89a' },
    { label: 'held-struggle', file: 'cell3-held-struggle.png', sha256: 'e6348490f397a40614668695e2a2a9a617cfd1710416fd093d4255b247f9faa3' },
    { label: 'release', file: 'cell4-release.png', sha256: '40400f922355e6e9050b5f7c0205460faf75090c0dd3efbbf84b20f319e145d2' },
  ],
  fall: [
    { label: 'topple', file: 'cell0-topple.png', sha256: '5c8bf0db47605c728b6d82f151ed43c1245c6daa5f81e9a2289945f62ca447df', waived: '138.19u OUT_HIGH +0.69u' },
    { label: 'airborne', file: 'cell1-airborne.png', sha256: '2d3b97c42c1b18885c5e3c4f930270bea5916a5212a705bf9f1e8ca0065507e7' },
    { label: 'tumble', file: 'cell2-tumble.png', sha256: '3662d3b49c15aad547cf4968c46c889f169880dd47d9dad8381492f024658e5e' },
    { label: 'impact', file: 'cell3-impact.png', sha256: '8094caa06cb513f1cad713a8ca276f9ae5cb799661c9545dd6e3d8b575822d46' },
    { label: 'DOWN', file: 'cell4-down.png', sha256: 'cb0b12c149341e4b90f69e0674ca26f4f7574cd842135f718c5574214ce65e1d' },
  ],
  getup: [
    { label: 'DOWN', file: 'cell0-down.png', sha256: '23667b4bfee165093c892a99144e571b045e4414dc16fb410b9ed746a7767cf9', waived: '121.35u OUT_LOW -3.06u' },
    { label: 'elbow', file: 'cell1-elbow.png', sha256: '6420114d1a81072f35b2da0f35552d36b81e4674cb2f040b6395e927e814b56b', waived: '120.29u OUT_LOW -4.12u' },
    { label: 'kneel', file: 'cell2-kneel.png', sha256: '63e21d8369a023b82fc28f468d067bc202d1e7ba9e591c9edb40a35f624a77a1' },
    { label: 'crouch', file: 'cell3-crouch.png', sha256: '567a1f04f87079cc9112cbf5da4a661ebeb1693fed05716380e1a09aed2b944e' },
    { label: 'rise', file: 'cell4-rise.png', sha256: 'd7cd3a45edabd630b4de68dc7a837a35ad5146815590d376a285b4928da37bf7' },
  ],
}
const ACCEPTED_DIR = {
  charge: `${CC}/07-charge/focused-fix/waiver-bank/accepted`,
  combo: `${CC}/08-combo/focused-fix/waiver-bank/accepted`,
  heavy: `${CC}/09-heavy/phase-b-shared-fix/accepted`,
  misc: `${CC}/10-misc/focused-fix/gate/accepted`,
  fall: `${CC}/11-fall/focused-fix/waiver-bank/accepted`,
  getup: `${CC}/12-getup/phase-c/gate/accepted`,
}
const ORDER = ['walk', 'charge', 'combo', 'heavy', 'misc', 'fall', 'getup']
for (const seq of ORDER) {
  for (const c of CELLS[seq]) {
    c.path = c.path ?? `${ACCEPTED_DIR[seq]}/${c.file}`
    const got = fileSha(c.path)
    if (got !== c.sha256) throw new Error(`${seq} ${c.label}: ${c.path} sha ${got} != pinned ${c.sha256}`)
  }
}
// walk:2 accepted.png must stay byte-identical to candidate-raw.jpg.
if (fileSha(`${CC}/01-walk2/accepted.png`) !== CELLS.walk[2].sha256) {
  throw new Error('walk:2 accepted.png bytes differ from candidate-raw.jpg')
}

// ---- ledger (verify only, no writes) ----------------------------------------
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0
for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = {
  sha256: sha(ledgerBuf),
  xuchu: ledger.fighters.xuchu,
  globalUsed,
  campaignCeilings: 'Xu Chu 32 / global 199 (nominal cap 12 unchanged, global hard cap 200)',
}
if (ledger.fighters.xuchu.used !== 29 || globalUsed !== 196) {
  throw new Error(`ledger mismatch: expected Xu Chu 29/global 196, got ${ledger.fighters.xuchu.used}/${globalUsed}`)
}

async function pixelsOf(path) {
  const img = await loadImage(path)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}
function largestComp(im) {
  const comps = alphaComponents(im, 96).filter((c) => c.area > 64)
  if (!comps.length) throw new Error('no alpha>=96 component')
  return comps.sort((a, b) => b.area - a.area)[0]
}
function boundsOf(c) { return [c.x0, c.y0, c.x1, c.y1] }

// ---- walk:2 deterministic finishing (key + 0.5 registration) -----------------
mkdirSync(PACK_DIR, { recursive: true })
let walk2Record = null
async function finishWalk2(cell) {
  const img = await loadImage(cell.path)
  const W = img.width, H = img.height
  if (W !== 1024 || H !== 1024) throw new Error(`walk:2 expected 1024x1024, got ${W}x${H}`)
  const cv = createCanvas(W, H)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const id = g.getImageData(0, 0, W, H)
  const d = id.data
  // Border flood following the painted backdrop gradient.
  const bg = new Uint8Array(W * H)
  const stack = []
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x)
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1)
  while (stack.length) {
    const p = stack.pop()
    if (bg[p]) continue
    bg[p] = 1
    const x = p % W, y = Math.floor(p / W), k = p * 4
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
      if (q < 0 || bg[q]) continue
      const j = q * 4
      const dist = Math.hypot(d[k] - d[j], d[k + 1] - d[j + 1], d[k + 2] - d[j + 2])
      if (dist <= KEY_STEP) stack.push(q)
    }
  }
  let fgPx = 0
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) d[i * 4 + 3] = 0
    else fgPx++
  }
  g.putImageData(id, 0, 0)
  const keyedPath = `${PACK_DIR}/walk2-keyed-1024.png`
  writeFileSync(keyedPath, cv.toBuffer('image/png'))
  const keyedComp = largestComp({ width: W, height: H, data: d })
  // ONE uniform 0.5 resample to the gate's 512 registration.
  const small = createCanvas(512, 512)
  const sg = small.getContext('2d')
  sg.drawImage(cv, 0, 0, 512, 512)
  const regPath = `${PACK_DIR}/walk2-registered-512.png`
  writeFileSync(regPath, small.toBuffer('image/png'))
  const sd = sg.getImageData(0, 0, 512, 512)
  walk2Record = {
    source: cell.path,
    sourceSha256: cell.sha256,
    acceptedAlias: `${CC}/01-walk2/accepted.png (identical JPEG bytes)`,
    keying: `border flood, neighbour Euclidean RGB step <= ${KEY_STEP}; alpha=0 on flood-reached backdrop only, RGBA of foreground untouched`,
    foregroundPxAt1024: fgPx,
    keyedBoundsAt1024: boundsOf(keyedComp),
    keyedPath,
    keyedSha256: fileSha(keyedPath),
    registration: 'one uniform 0.5 resample (gate SCALE=2 nominal registration; support sole 1000@1024 -> 500@512)',
    registeredPath: regPath,
    registeredSha256: fileSha(regPath),
  }
  return { width: 512, height: 512, data: sd.data }
}

// ---- compose container sheets (isolated largest components, natural size) ---
const sheets = {}
const measured = {}
const rawDims = {}
mkdirSync(`${PACK_DIR}/pack-sheets`, { recursive: true })
for (const seq of ORDER) {
  const cells = []
  for (const c of CELLS[seq]) {
    const im = c.walk2Jpeg ? await finishWalk2(c) : await pixelsOf(c.path)
    const comp = largestComp(im)
    cells.push({ ...c, im, comp, size: [im.width, im.height] })
  }
  const cellW = Math.max(...cells.map((c) => c.im.width))
  const cellH = Math.max(...cells.map((c) => c.im.height))
  const out = { width: cellW * 3, height: cellH * 3, data: new Uint8ClampedArray(cellW * 3 * cellH * 3 * 4) }
  cells.forEach((c, i) => {
    const ox = (i % 3) * cellW - 0
    const oy = Math.floor(i / 3) * cellH - 0
    for (const p of c.comp.pixels) {
      const x = p % c.im.width, y = Math.floor(p / c.im.width)
      const s = p * 4, dd = ((y + oy) * out.width + (x + ox)) * 4
      out.data[dd] = c.im.data[s]; out.data[dd + 1] = c.im.data[s + 1]; out.data[dd + 2] = c.im.data[s + 2]; out.data[dd + 3] = c.im.data[s + 3]
    }
    rawDims[`${seq}:${i}`] = { w: c.comp.x1 - c.comp.x0 + 1, h: c.comp.y1 - c.comp.y0 + 1, seq }
    delete c.im
    c.comp = { bounds: boundsOf(c.comp), area: c.comp.area }
  })
  sheets[seq] = out
  const cv = createCanvas(out.width, out.height)
  const g = cv.getContext('2d')
  const id = g.createImageData(out.width, out.height)
  id.data.set(out.data)
  g.putImageData(id, 0, 0)
  const sheetPath = `${PACK_DIR}/pack-sheets/${seq}-pack-sheet.png`
  writeFileSync(sheetPath, cv.toBuffer('image/png'))
  measured[seq] = {
    composedSheet: sheetPath,
    composedPixelsSha256: sha(Buffer.from(out.data)),
    cell: [cellW, cellH],
    groundRowNominal: cellH === 512 ? 500 : 756,
    cells: cells.map((c) => ({
      label: c.label, path: c.path, sha256: c.sha256, size: c.size,
      contentBounds: c.comp.bounds, contentAreaPx: c.comp.area,
      contentBottomRow: c.comp.bounds[3],
      bottomVsNominalGroundPx: c.comp.bounds[3] - (cellH === 512 ? 500 : 756),
      bottomVsNominalGroundU: Math.round((c.comp.bounds[3] - (cellH === 512 ? 500 : 756)) * U_PER_PX * 100) / 100,
      ...(c.waived ? { waivedWeaponLength: c.waived } : {}),
    })),
  }
}

// ---- page-aware base (factors all 1: one frozen 512-pack scale) -------------
const PAGE_CAP = DECODED_CAP
const PACK_SLACK = 1.28
const CONTENT_CAP = BOX.groundY * DENSITY - TRIM_PAD - 2
const WIDTH_CAP = BOX.width * DENSITY - 2 * TRIM_PAD - 2
const frameList = Object.entries(rawDims)
let fitBound = Infinity, fitBinding = null
for (const [name, d] of frameList) {
  if (CONTENT_CAP / d.h < fitBound) { fitBound = CONTENT_CAP / d.h; fitBinding = `${name} height` }
  if (WIDTH_CAP / d.w < fitBound) { fitBound = WIDTH_CAP / d.w; fitBinding = `${name} width` }
}
const trimBytesAt = (b) => {
  let sum = 0
  for (const [, d] of frameList) sum += (Math.round(b * d.w) + 2 * TRIM_PAD) * (Math.round(b * d.h) + 2 * TRIM_PAD) * 4
  return sum
}
let lo = 0.05, hi = 2
for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2
  if (trimBytesAt(mid) <= PAGE_CAP / PACK_SLACK) lo = mid
  else hi = mid
}
const budgetBound = lo
let base = Math.floor(Math.min(fitBound, budgetBound) * 0.99 * 1e6) / 1e6
const scalesAt = (b) => Object.fromEntries(ORDER.map((n) => [n, Math.floor(b * 1e6) / 1e6]))
let sheetScale = scalesAt(base)
const buildFighter = () => ({
  id: 'xuchu',
  role: 'boss',
  density: DENSITY,
  box: BOX,
  revision: 'xuchu-1',
  cleanup: { alphaThreshold: 96, speckMaxPx: 64, residueTolerancePx: 150000 },
  sequences: ORDER.map((name) => ({
    name,
    count: CELLS[name].length,
    rows: 3,
    cols: 3,
    order: CELLS[name].map((_, i) => i),
    registration: { scale: sheetScale[name] },
  })),
})
const pristine = Object.fromEntries(ORDER.map((n) => [n, { width: sheets[n].width, height: sheets[n].height, data: new Uint8ClampedArray(sheets[n].data) }]))
const freshSheets = () => Object.fromEntries(ORDER.map((n) => [n, { width: pristine[n].width, height: pristine[n].height, data: new Uint8ClampedArray(pristine[n].data) }]))

let fighter = buildFighter()
let pack
let budgetRetries = 0
for (;;) {
  try {
    pack = preparePack(fighter, freshSheets())
  } catch (e) {
    if (!String(e?.message ?? '').includes('budget:') || budgetRetries >= 4) throw e
    budgetRetries++
    base = Math.floor((base - 0.002) * 1e6) / 1e6
    sheetScale = scalesAt(base)
    fighter = buildFighter()
    continue
  }
  const pagePx = pack.pages.reduce((a, p) => a + p.width * p.height * 4, 0)
  if (pagePx <= PAGE_CAP) break
  if (budgetRetries >= 4) throw new Error(`budget: page pixels ${pagePx} exceed ${PAGE_CAP} after ${budgetRetries} step-downs`)
  budgetRetries++
  base = Math.floor((base - 0.002) * 1e6) / 1e6
  sheetScale = scalesAt(base)
  fighter = buildFighter()
}
for (const n of ORDER) {
  measured[n].scale = sheetScale[n]
  measured[n].scaleFactor = 1
  measured[n].scaleEvidence = 'factor 1 DOCUMENTED: family gate registered every accepted cell to the one frozen brief band (body 459px at 512-pack scale, ground 500@512-high / 756@768-high canvases); walk:2 pre-registered x0.5 per its gate SCALE=2'
}
const walkGuardRaw = rawDims['walk:0'].h
const walkGuardPx = walkGuardRaw * sheetScale.walk
const paths = writePackOutputs(fighter, pack, { outputRoot: 'artifacts/motion' })
const again = preparePack(fighter, freshSheets())
const deterministic = again.manifestSha256 === pack.manifestSha256
const uniqueFrames = pack.frames.filter((f) => !f.aliasOf)
const pagePixels = pack.pages.reduce((x, p) => x + p.width * p.height * 4, 0)
const pagesOk = pack.pages.every((p) => p.width <= PAGE_LIMIT && p.height <= PAGE_LIMIT)

// ---- contact sheets (play order, shared ground line) -------------------------
const mf = (n) => pack.manifest.frames.find((f) => f.name === n)
function contactSheet(zoom) {
  const cw = BOX.width * zoom, ch = BOX.height * zoom
  const labelH = 14 * zoom, gutterL = 70 * zoom
  const cols = Math.max(...ORDER.map((n) => CELLS[n].length))
  const cv = createCanvas(gutterL + cols * cw, ORDER.length * (ch + labelH))
  const g = cv.getContext('2d')
  g.fillStyle = '#c9c4b8'
  g.fillRect(0, 0, cv.width, cv.height)
  const pageCanvas = new Map()
  for (const p of pack.pages) {
    const pc = createCanvas(p.width, p.height)
    pc.getContext('2d').putImageData(p.pixels, 0, 0)
    pageCanvas.set(p.name, pc)
  }
  g.font = `${10 * zoom}px sans-serif`
  ORDER.forEach((seq, row) => {
    const y0 = row * (ch + labelH)
    g.fillStyle = '#000'
    g.fillText(seq, 4 * zoom, y0 + labelH + ch / 2)
    for (let i = 0; i < CELLS[seq].length; i++) {
      const x0 = gutterL + i * cw
      const f = mf(`${seq}:${i}`)
      g.strokeStyle = '#8a857a'
      g.lineWidth = 1
      g.strokeRect(x0 + 0.5, y0 + labelH + 0.5, cw - 1, ch - 1)
      g.fillStyle = '#000'
      g.fillText(`${i} ${CELLS[seq][i].label}`, x0 + 3 * zoom, y0 + 11 * zoom)
      const s = zoom / DENSITY
      g.drawImage(pageCanvas.get(f.page), f.x, f.y, f.trim.w, f.trim.h,
        x0 + f.trim.trimX * s, y0 + labelH + f.trim.trimY * s, f.trim.w * s, f.trim.h * s)
      g.strokeStyle = '#c03020'
      g.beginPath()
      g.moveTo(x0, y0 + labelH + BOX.groundY * zoom + 0.5)
      g.lineTo(x0 + cw, y0 + labelH + BOX.groundY * zoom + 0.5)
      g.stroke()
    }
  })
  return cv.toBuffer('image/png')
}
mkdirSync(REVIEW, { recursive: true })
writeFileSync(`${REVIEW}/contact-gameplay.png`, contactSheet(1))
writeFileSync(`${REVIEW}/contact-2x.png`, contactSheet(2))

// ---- registration + measurements records --------------------------------------
const frameExtents = Object.fromEntries(pack.manifest.frames.map((f) => [f.name, {
  heightPx: f.trim.h - 2 * TRIM_PAD, widthPx: f.trim.w - 2 * TRIM_PAD, topPx: f.trim.trimY + TRIM_PAD,
}]))
const maxBottomU = Math.max(...ORDER.flatMap((n) => measured[n].cells.map((c) => Math.abs(c.bottomVsNominalGroundU))))
writeFileSync(`${SRC}/registration.json`, `${JSON.stringify({
  fighter: 'xuchu',
  status: 'OFFLINE PACK PREPARATION ONLY (Phase D prep) - not runtime/catalog activated, no CMR-15B, not DONE: independent review pending',
  model: 'one uniform scale PER SHEET at factor 1 relative (every banked cell already registered by its family gate to the one frozen 512-pack scale) + cell-centre/ground anchors; page-aware base (trims under cap/1.28, packed pages verified under 16MiB)',
  box: BOX,
  boxDecision: `hero 260x144/groundY 136 (Li Dian precedent). Fit bound ${fitBound.toFixed(6)} binding ${fitBinding}; walk guard ${walkGuardPx.toFixed(2)} density-2 px (Li Dian 217.68, Guan Yu 240, Xiahou Dun tall-box 210.18). No taller presentation box presumed; 15B may revisit with owner direction.`,
  density: DENSITY,
  contentCapPx: CONTENT_CAP,
  widthCapPx: WIDTH_CAP,
  packSlack: PACK_SLACK,
  fitBound, fitBinding, budgetBound, base, budgetStepDowns: budgetRetries,
  walkGuardFittedPx: walkGuardPx,
  frozenBriefBand: { weaponU: 130.79, bandU: [124.41, 137.50], angleDeg: -26.31, bodyPxAt512: 459, groundYAt512: 500, uPerPx: U_PER_PX, fixedFrom: 'walk:2 anchor 893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6' },
  walk2Finishing: walk2Record,
  maxAbsContentBottomVsNominalGroundU: maxBottomU,
  groundMethod: 'source content-bottom row vs the family canvas nominal ground (500 on 512-high, 756 on 768-high canvases); raster placement evidence only - hidden 3D ground unverified, per-family gate ground errors carried in PACK-REPORT',
  ledgerVerified: ledgerState,
  sheets: measured,
  layout: Object.fromEntries(ORDER.map((n) => [n, {
    positions: CELLS[n].map((c, i) => ({ position: i, cell: i, label: c.label, sha256: c.sha256, ...(c.waived ? { waivedWeaponLength: c.waived } : {}) })),
  }])),
  alias: 'none declared: getup:0 is a distinct banked drawing (23667b4b...), not byte-identical to fall:4 (cb0b12c1...); both packed as unique frames',
  frameExtentsPx: frameExtents,
  manifestSha256: pack.manifestSha256,
}, null, 2)}\n`)
writeFileSync(`${PACK_DIR}/pack-measurements.json`, `${JSON.stringify({
  manifestSha256: pack.manifestSha256,
  deterministic,
  frames: pack.frames.length,
  uniqueFrames: uniqueFrames.length,
  counts: pack.report.counts,
  pages: pack.pages.map((p) => ({ name: p.name, width: p.width, height: p.height })),
  decodedBytes: pagePixels,
  decodedCapBytes: PAGE_CAP,
  budget: pack.budget,
  suspects: pack.report.suspects,
  base, fitBound, fitBinding, budgetBound, budgetStepDowns: budgetRetries,
  walkGuardPx,
  maxAbsContentBottomVsNominalGroundU: maxBottomU,
  ledgerVerified: ledgerState,
}, null, 2)}\n`)

console.log('--- xuchu pack report ---')
console.log(`FINAL base ${base.toFixed(6)} after ${budgetRetries} step-down(s) | fit ${fitBound.toFixed(6)} (${fitBinding}) | budget ${budgetBound.toFixed(6)} | walk guard ${walkGuardPx.toFixed(2)}px`)
for (const n of ORDER) console.log(`  ${n.padEnd(7)} scale ${sheetScale[n]} cells ${CELLS[n].length} sheet ${measured[n].cell.join('x')}`)
console.log('manifest sha256:', pack.manifestSha256, deterministic ? '(deterministic)' : '(NOT DETERMINISTIC)')
console.log('frames:', pack.frames.length, `(${uniqueFrames.length} unique)`, '| pages:', pack.pages.map((p) => `${p.name} ${p.width}x${p.height}`).join(', '), pagesOk ? '(<=2048)' : '(OVER 2048)')
console.log(`decoded page pixels ${pagePixels} B / cap ${PAGE_CAP} B ${pagePixels <= PAGE_CAP ? 'OK' : 'OVER'}`)
console.log('counts:', JSON.stringify(pack.report.counts))
console.log('budget:', JSON.stringify(pack.budget))
console.log('suspects:', pack.report.suspects.length, JSON.stringify(pack.report.suspects))
console.log('max |content bottom vs nominal ground|:', maxBottomU, 'u')
console.log('walk2:', JSON.stringify({ keyedBounds: walk2Record.keyedBoundsAt1024, fg: walk2Record.foregroundPxAt1024, registeredSha: walk2Record.registeredSha256 }))
console.log('outputs:', paths.output, '| review:', REVIEW)
if (!deterministic || !pagesOk || pagePixels > PAGE_CAP) {
  console.log('DEFECT: determinism/budget check failed')
  process.exit(1)
}
