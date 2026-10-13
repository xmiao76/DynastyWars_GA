// CMR-15A combo waiver-bank re-verification (work cmr15a-combo-waiver-bank). Zero generation.
// Fresh hash + raster spot checks on the focused-fix gate FINAL cells0-4 vs gate.json/measure.json:
// file hash, canvas size, greenPx, canvas-edge alpha, alpha bounds (ymax=ground), changedOutside
// carried from gate. Banks byte copies to accepted/ ONLY if every non-waived gate in gate.json
// is PASS and every spot check reproduces. Waived (owner PROCESS CORRECTION + COMBO WAIVER-BANK
// grant, exact hashes only, FAIL retained NOT PASS): cell1 df6196ff... 140.96u +3.46u,
// cell3 18c68a00... 143.48u +5.98u, resulting spread 9.54%. Head stays RAW. Deterministic.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PNG } from 'pngjs'

const G = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/'
const W = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/waiver-bank/'
mkdirSync(W + 'accepted', { recursive: true })
const sha = (b) => createHash('sha256').update(b).digest('hex')
const gate = JSON.parse(readFileSync(G + 'gate.json', 'utf8'))
const measure = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledger = JSON.parse(ledgerBuf.toString('utf8'))
let globalUsed = 0; for (const k in ledger.fighters) globalUsed += ledger.fighters[k].used
const ledgerState = { sha256: sha(ledgerBuf), xuchuUsed: ledger.fighters.xuchu.used, globalUsed, matches: ledger.fighters.xuchu.used === 18 && globalUsed === 185 }
if (!ledgerState.matches) throw new Error('ledger mismatch ' + JSON.stringify(ledgerState))

const WAIVED = { 1: 'df6196ff6cc638f6f8319ad18803a03ad7ab1ee82565545fc6d898d05e08a3e9', 3: '18c68a0075163b7245a272413eca488be3a0ee6b2fc30dcfa0a7b2120bdbbda3' }
const cells = []
let allOk = true
for (const k of gate.keeps) {
  const buf = readFileSync(G + 'cells-registered/' + k.finalFile)
  const hash = sha(buf)
  const png = PNG.sync.read(buf)
  let greenPx = 0, xmin = 1e9, ymin = 1e9, xmax = -1, ymax = -1
  const edge = { l: 0, r: 0, t: 0, b: 0 }
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) << 2
    const a = png.data[i + 3]
    if (a >= 16) {
      if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y
      if (x === 0) edge.l++; if (x === png.width - 1) edge.r++; if (y === 0) edge.t++; if (y === png.height - 1) edge.b++
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2]
      if (g > 150 && g > r + 40 && g > b + 40) greenPx++
    }
  }
  const m = measure.keeps.find((c) => c.cell === k.cell)
  const mb = m.finalMeasure?.bounds ?? m.registeredMeasure.bounds
  const hashOk = hash === k.finalHash
  const boundsOk = mb.xmin === xmin && mb.ymin === ymin && mb.xmax === xmax && mb.ymax === ymax
  const seamsOk = greenPx === 0 && edge.l === 0 && edge.r === 0 && edge.t === 0 && edge.b === 0
  const groundOk = ymax >= 499 && ymax <= 503 && k.groundErrU <= 1.5 // sole->groundY500, boot raster in gate.json
  const nonWaivedOk = ['identity', 'anatomy', 'poseRole', 'scaleGround', 'seams'].every((g) => String(k.gates[g]).startsWith('PASS'))
  const lengthOk = k.gates.weaponLength === 'PASS'
  const waivedOk = WAIVED[k.cell] ? (hash === WAIVED[k.cell] && !lengthOk) : lengthOk
  const ok = hashOk && boundsOk && seamsOk && groundOk && nonWaivedOk && waivedOk && png.width === 1024 && png.height === 512
  if (!ok) allOk = false
  cells.push({
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: hash, hashMatchesGate: hashOk,
    canvas: [png.width, png.height], freshBounds: { xmin, ymin, xmax, ymax }, measureBounds: mb, boundsMatch: boundsOk,
    greenPx, edge, seamsSpotCheck: seamsOk ? 'PASS' : 'FAIL', groundSpotCheck: groundOk ? 'PASS' : 'FAIL',
    groundErrU: k.groundErrU, boots: k.boots,
    weapon: { finalU: k.weapon.finalU, finalPx: k.weapon.finalPx, angleDegRaw: k.gates.weaponAngleDegRaw, buttCapVisible: k.weapon.buttCapVisible },
    gatesFromGateJson: k.gates,
    lengthStatus: lengthOk ? 'PASS' : ('FAIL NOT PASS — waived exact hash only (owner COMBO WAIVER-BANK grant): ' + k.weapon.finalU + 'u OUT_HIGH +' + k.weapon.overBandHiU + 'u'),
    head: 'RAW (batch-end ruling reserved)',
    bankEligible: ok,
  })
}
const dirOk = gate.directionSteps.every((s) => s.passLe60)
if (!dirOk) allOk = false
let accepted = []
if (allOk) {
  for (const c of cells) {
    const dest = W + 'accepted/' + c.name + '.png'
    copyFileSync(G + 'cells-registered/' + c.finalFile, dest)
    const h = sha(readFileSync(dest))
    if (h !== c.finalHash) throw new Error('accepted copy hash mismatch cell ' + c.cell)
    accepted.push({ cell: c.cell, file: 'accepted/' + c.name + '.png', sha256: h })
  }
}
const out = {
  work: 'cmr15a-combo-waiver-bank',
  grant: 'CMR-15A PROCESS CORRECTION + COMBO WAIVER-BANK + HEAVY FIX (owner, 2026-10-13; verbatim in TASKS.md CMR-15A): combo part only in this package — ART WAIVER (early, exact hashes only, FAIL retained, superseding batch-end timing as for charge): cell1 df6196ff... 140.96u +3.46 and cell3 18c68a00... 143.48u +5.98, plus resulting 9.54% spread; bank combo cells0-4 zero-generation on re-verification (count -> 0). No heavy work in this package.',
  method: 'waiver-bank/reverify.mjs: fresh SHA-256 + pngjs raster spot checks (canvas, greenPx, edge alpha, alpha bounds vs measure.json) on focused-fix gate final cells0-4; non-waived gates taken from gate.json (identity/anatomy/poseRole/scaleGround/seams PASS, direction steps <=38.41deg, head RAW) and sequence contact re-opened visually this package; accepted/ byte copies written only if all checks reproduce. Deterministic rerun.',
  sheet: gate.candidateDescription.sheet,
  ledgerVerified: { ...ledgerState, expected: 'Xu Chu 18 / global 185 (zero generation)', ceilings: '25/192' },
  cells, directionSteps: gate.directionSteps, directionPass: dirOk,
  lengthSpreadKeeps: gate.lengthSpreadKeeps,
  spreadStatus: '9.54% NOT PASS — waived as resulting spread for the exact banked set (same grant), failed figure retained',
  verdict: allOk ? 'BANKED cells0-4 (cells0/2/4 PASS; cell1/cell3 weapon length FAIL NOT PASS waived exact hashes only; spread 9.54% NOT PASS waived; head RAW)' : 'NOT BANKED — a non-waived spot check failed (see cells)',
  banked: allOk, accepted,
  prospectivePostSalvageCount: allOk ? 0 : 1,
  countNote: 'Under the grant process rules the retroactive prospective count was 1 (combo focused-fix; heavy not counted — its focused fix unspent); banking combo resets it to 0.',
  generation: 'zero in this package',
}
writeFileSync(W + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
console.log('gate.json sha256 ' + sha(readFileSync(W + 'gate.json')))
