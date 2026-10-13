// CMR-15A COMPLETION CAMPAIGN Phase A (work cmr15a-completion-phase-a). Zero generation.
// Fall waiver-bank re-verification: fresh SHA-256 + pngjs raster spot checks (canvas, greenPx,
// canvas-edge alpha, alpha bounds vs the source measure.json) on the SELECTED fall set from the
// focused-fix gate (fix cells0/1/2/4 + original cell3). Banks byte copies to accepted/ ONLY if
// every non-waived gate PASSes and every spot check reproduces.
// Pre-authorized small waiver (owner COMPLETION CAMPAIGN grant, exact hash only, FAIL retained
// NOT PASS, no blanket/transfer): cell0-topple 5c8bf0db... 138.19u OUT_HIGH +0.69u (<=9u, fully
// measurable, every other gate PASS) + resulting spread. Head stays RAW.
// Also fresh-verifies heavy focused-fix cell4 57190b6f... 145.22u +7.72u and records it as the
// SELECTED heavy cell4 under the same waiver PENDING cells2/3 — NOT a heavy family bank (no copy).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const BASE = 'art/motion/xuchu/closeout-campaign/'
const FG = BASE + '11-fall/focused-fix/gate/'
const OG = BASE + '11-fall/gate/'
const HG = BASE + '09-heavy/focused-fix/gate/'
const W = BASE + '11-fall/focused-fix/waiver-bank/'
mkdirSync(W + 'accepted', { recursive: true })
const sha = (b) => createHash('sha256').update(b).digest('hex')
const fallGate = JSON.parse(readFileSync(FG + 'gate.json', 'utf8'))
const fixMeasure = JSON.parse(readFileSync(FG + 'measure.json', 'utf8'))
const origMeasure = JSON.parse(readFileSync(OG + 'measure.json', 'utf8'))
const heavyGate = JSON.parse(readFileSync(HG + 'gate.json', 'utf8'))
const heavyMeasure = JSON.parse(readFileSync(HG + 'measure.json', 'utf8'))
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, globalUsed, matches: ledger.fighters.xuchu.used === 25 && globalUsed === 192 }
if (!ledgerState.matches) throw new Error('ledger mismatch ' + JSON.stringify(ledgerState))

function raster(buf) {
  const png = PNG.sync.read(buf)
  let greenPx = 0, xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1
  const edge = { l: 0, r: 0, t: 0, b: 0 }
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) << 2
    if (png.data[i + 3] >= 16) {
      if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
      if (x === 0) edge.l++; if (x === png.width - 1) edge.r++; if (y === 0) edge.t++; if (y === png.height - 1) edge.b++
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2]
      if (g > 150 && g > r + 40 && g > b + 40) greenPx++
    }
  }
  return { canvas: [png.width, png.height], bounds: { xmin, ymin, xmax, ymax }, greenPx, edge }
}
const finalMeasureOf = (m, cell) => { const k = m.keeps.find((c) => c.cell === cell); return k.retouch?.retouchedMeasure ?? k.registeredMeasure }
const boundsEq = (a, b) => a.xmin === b.xmin && a.ymin === b.ymin && a.xmax === b.xmax && a.ymax === b.ymax
const noEdge = (e) => e.l === 0 && e.r === 0 && e.t === 0 && e.b === 0

const WAIVED_TOPPLE = '5c8bf0db47605c728b6d82f151ed43c1245c6daa5f81e9a2289945f62ca447df'
const cells = []
let allOk = true
for (const s of fallGate.selectedSet) {
  const buf = readFileSync(s.file)
  const hash = sha(buf)
  const r = raster(buf)
  const srcMeasure = s.source.startsWith('original') ? origMeasure : fixMeasure
  const fm = finalMeasureOf(srcMeasure, s.cell)
  const fixKeep = fallGate.fixKeeps.find((k) => k.cell === s.cell)
  const hashOk = hash === s.finalHash
  const boundsOk = boundsEq(r.bounds, fm.bounds)
  const seamsOk = r.greenPx === 0 && noEdge(r.edge)
  const groundOk = fm.groundErrU <= 1.5 && r.bounds.ymax === fm.bounds.ymax
  // Non-waived gates from the focused-fix gate (cell3: original verdict PASS in candidate-wise table;
  // its fixKeep entry is the fix copy, also all-PASS, so gate PASS strings hold for either source).
  const nonWaivedOk = ['identity', 'anatomy', 'poseRole', 'weaponGrip', 'scaleGround', 'seams']
    .every((g) => String(fixKeep.gates[g]).startsWith('PASS'))
    && (s.cell !== 4 || String(fixKeep.gates.downFlatGrounded).startsWith('PASS'))
  const lengthOk = s.verdict === 'PASS'
  const waivedOk = s.cell === 0
    ? (hash === WAIVED_TOPPLE && !lengthOk && fixKeep.weapon.buttCapVisible === true
       && fixKeep.weapon.overBandHiU === 0.69 && fixKeep.weapon.overBandHiU <= 9 && nonWaivedOk)
    : lengthOk
  const uOk = Math.abs(fm.u - s.finalU) < 0.005
  const ok = hashOk && boundsOk && seamsOk && groundOk && nonWaivedOk && waivedOk && uOk
    && r.canvas[0] === 1024 && r.canvas[1] === 768
  if (!ok) allOk = false
  cells.push({
    cell: s.cell, name: s.name, source: s.source, file: s.file, finalHash: hash, hashMatchesGate: hashOk,
    canvas: r.canvas, freshBounds: r.bounds, measureBounds: fm.bounds, boundsMatch: boundsOk,
    greenPx: r.greenPx, edge: r.edge, seamsSpotCheck: seamsOk ? 'PASS' : 'FAIL',
    groundSpotCheck: groundOk ? 'PASS' : 'FAIL', groundErrU: fm.groundErrU,
    weapon: { finalU: s.finalU, measureU: fm.u, angleDeg: s.angleDeg, buttCapVisible: fixKeep.weapon.buttCapVisible },
    gatesFromFallGate: fixKeep.gates,
    lengthStatus: lengthOk
      ? 'PASS'
      : 'FAIL NOT PASS — waived exact hash only (pre-authorized small waiver <=9u, COMPLETION CAMPAIGN): 138.19u OUT_HIGH +0.69u vs band [124.41,137.50]u',
    head: 'RAW (batch-end UNVERIFIED_OWNER_ACCEPTED ruling reserved, Phase D only)',
    bankEligible: ok,
  })
}
const dirOk = fallGate.mixedDirectionStepsDeg.every((d) => d <= 60)
if (!dirOk) allOk = false
const us = cells.map((c) => c.weapon.finalU)
const mean = us.reduce((a, b) => a + b, 0) / us.length
const spreadPct = Math.round(((Math.max(...us) - Math.min(...us)) / mean) * 10000) / 100
if (Math.abs(spreadPct - fallGate.mixedLengthSpread.spreadPct) > 0.01) allOk = false

let accepted = []
if (allOk) {
  for (const c of cells) {
    const dest = W + 'accepted/' + c.name + '.png'
    copyFileSync(c.file, dest)
    const h = sha(readFileSync(dest))
    if (h !== c.finalHash) throw new Error('accepted copy hash mismatch cell ' + c.cell)
    accepted.push({ cell: c.cell, file: 'accepted/' + c.name + '.png', sha256: h })
  }
}

// Heavy cell4: fresh verification + selection record only (NOT banked; cells2/3 pending Phase B).
const hk = heavyGate.keeps.find((k) => k.cell === 4)
const hBuf = readFileSync(HG + 'cells-registered/' + hk.finalFile)
const hHash = sha(hBuf)
const hr = raster(hBuf)
const hfm = finalMeasureOf(heavyMeasure, 4)
const heavyNonWaivedOk = ['identity', 'anatomy', 'poseRole', 'scaleGround', 'seams']
  .every((g) => String(hk.gates[g]).startsWith('PASS'))
const heavyCell4 = {
  cell: 4, name: hk.name, file: HG + 'cells-registered/' + hk.finalFile,
  finalHash: hHash, hashMatchesGate: hHash === hk.finalHash,
  canvas: hr.canvas, freshBounds: hr.bounds, measureBounds: hfm.bounds, boundsMatch: boundsEq(hr.bounds, hfm.bounds),
  greenPx: hr.greenPx, edge: hr.edge, seamsSpotCheck: (hr.greenPx === 0 && noEdge(hr.edge)) ? 'PASS' : 'FAIL',
  groundErrU: hk.groundErrU,
  weapon: { finalU: hk.weapon.finalU, measureU: hfm.u, overBandHiU: hk.weapon.overBandHiU, buttCapVisible: hk.weapon.buttCapVisible },
  gatesFromHeavyGate: hk.gates,
  nonWaivedGatesPass: heavyNonWaivedOk,
  lengthStatus: 'FAIL NOT PASS — 145.22u OUT_HIGH +7.72u vs band [124.41,137.50]u',
  disposition: 'SELECTED as the heavy cell4 under the pre-authorized small waiver (exact hash 57190b6f0d3e7b26b868ecb4e6d89a3ca6dad4b399e3db7104adcfb1861ae9a8 only, +7.72u <=9u, fully measurable, every other gate PASS) PENDING heavy cells2/3 — heavy family NOT banked, no accepted copy made',
  head: 'RAW (batch-end ruling reserved)',
}
const heavyOk = heavyCell4.hashMatchesGate && heavyCell4.boundsMatch && heavyCell4.seamsSpotCheck === 'PASS'
  && heavyNonWaivedOk && hk.weapon.buttCapVisible === true && hk.weapon.overBandHiU <= 9 && hk.groundErrU <= 1.5

const out = {
  work: 'cmr15a-completion-phase-a',
  phase: 'COMPLETION CAMPAIGN Phase A (zero generation): fall waiver-bank + heavy cell4 selection record',
  method: 'reverify.mjs: fresh SHA-256 + pngjs raster spot checks (canvas 1024x768, greenPx=0, no canvas-edge alpha, alpha bounds + finalU vs source measure.json) on the fall gate selectedSet; non-waived gates from 11-fall/focused-fix/gate/gate.json; sequence continuity re-opened this package on contact-keeps-sequence.png + marked cell0 + original cell3 final (topple->airborne->tumble->impact->flat DOWN, one coherent arc). Deterministic rerun.',
  frozenBandU: [124.41, 137.5],
  ledgerVerified: { ...ledgerState, expected: 'Xu Chu 25 / global 192 (zero generation)', ceilings: '32/199 under COMPLETION CAMPAIGN (global hard cap 200 preserved)' },
  cells,
  directionStepsDeg: fallGate.mixedDirectionStepsDeg, directionPass: dirOk,
  lengthSpread: { finalUs: us, spreadPct, gateSpreadPct: fallGate.mixedLengthSpread.spreadPct },
  spreadStatus: spreadPct + '% NOT PASS — waived as the resulting spread of the exact-hash topple length waiver, failed figure retained',
  verdict: allOk
    ? 'FALL BANKED cells0-4 (fix cells1/2/4 PASS, original cell3 PASS, cell0-topple weapon length FAIL NOT PASS waived exact hash only + resulting spread waived; head RAW)'
    : 'FALL NOT BANKED — a non-waived spot check failed (see cells)',
  banked: allOk, accepted,
  heavyCell4SelectedPending: heavyCell4,
  heavyCell4VerificationPass: heavyOk,
  prospectivePostFixUnusableCount: 0,
  countNote: 'Under the COMPLETION CAMPAIGN the prospective count starts at 0; banking fall keeps/resets it at 0. Historical fall#getup STOP preserved, not erased.',
  generation: 'zero in this package',
}
writeFileSync(W + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
console.log('heavy cell4 selected-pending verified: ' + heavyOk)
console.log('gate.json sha256 ' + sha(readFileSync(W + 'gate.json')))
