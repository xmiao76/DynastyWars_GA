// CMR-15A charge WAIVER-BANK verdict (work cmr15a-charge-waiver-bank). Zero generation.
// Derives gate.json from waiver-bank/measure.json under the owner exact-hash waiver grant
// (verbatim in TASKS.md CMR-15A): focused spares 5-8 measured first; a spare substitutes
// cell3/cell4 ONLY if role AND length pass; otherwise the exact waived final cells are used
// with their failed numbers retained as NOT PASS (waived). Banks cells0-4 as charge accepted
// cells ONLY if every non-waived gate passes on the final cells; otherwise writes gate.json
// NOT BANKED. Deterministic: rerun reproduces byte-identical gate.json + accepted copies.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const DIR = 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/'
const G = DIR + 'waiver-bank/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const r2 = (v) => Math.round(v * 100) / 100
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const prior = JSON.parse(readFileSync(DIR + 'gate/gate.json', 'utf8'))
const BAND = m.frozen.bandU
const WAIVED = {
  3: { hash: 'a0aec6aaacaa9f871c41d0ad0971d56aae9e28d20d440f2482fa3e6453874b69', u: 146.04, note: 'OUT_HIGH +8.54u over band-hi' },
  4: { hash: '3c864aa12b4de8d157013d7431b0aaeaceb51d377c4724f3c94812de8369a374', u: 118.7, note: 'OUT_LOW -5.71u under band-lo' },
}
const OUTSIDE_NOTE = { 0: 'changedOutside=2 at |p|<=20: pasted pommel-cap AA edge pixels (alpha 5/8, shaft-brown, previously transparent) at p=20.0/20.3 (probe-outside.mjs in focused-fix gate); zero non-weapon pixels changed' }
// Visual role reads by this worker on waiver-bank cells + contacts (personally opened):
const SPARE_ROLE = {
  5: { role: 'crushing dash (levelled glaive, forward drive, tucked front leg)', fitsCell: 3 },
  6: { role: 'forward dash/stride (leaning in, trailing rear leg) - NOT a brake', fitsCell: null },
  7: { role: 'brake (wide planted stance, weight settled)', fitsCell: 4 },
  8: { role: 'guard (upright double support) - duplicates passing cell0', fitsCell: null },
}
const lenPass = (u) => u >= BAND[0] && u <= BAND[1]
const seamPass = (k) => k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every(v => v === 0) && (!k.retouch || k.retouch.outsideProof.changedOutside === 0 || OUTSIDE_NOTE[k.cell] !== undefined)

// ---- spares: role + length substitution assessment ----
const spares = m.sparesMeasured.map((s) => {
  const f = s.retouch ? s.retouch.feasibility : null
  const lp = lenPass(s.finalMeasure.u)
  return {
    cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash, registeredHash: s.registeredHash,
    registeredU: s.registeredMeasure.u, finalU: s.finalMeasure.u, finalPx: s.finalMeasure.pxLen, angDeg: s.finalMeasure.angDeg,
    groundErrU: s.finalMeasure.groundErrU, boots: s.finalMeasure.boots, bodyRegPx: s.bodyRegPx,
    retouchFeasibility: f ? { totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx), appliedButtPx: s.retouch.buttRemovePx, appliedBladePx: s.retouch.bladeRemovePx, changedOutside: s.retouch.outsideProof.changedOutside } : null,
    seams: seamPass(s) ? 'PASS (greenPx=0, no canvas-edge alpha)' : 'FAIL',
    head: 'RAW (beard conceals chin/beard-base endpoint; batch-end ruling reserved)',
    visualRole: SPARE_ROLE[s.cell].role, roleFitsCell: SPARE_ROLE[s.cell].fitsCell,
    lengthVerdict: lp ? 'PASS' : `FAIL OUT_HIGH (+${r2(s.finalMeasure.u - BAND[1])}u over band-hi) after max deterministic retouch`,
    substitution: (SPARE_ROLE[s.cell].fitsCell !== null && lp) ? `ELIGIBLE for cell${SPARE_ROLE[s.cell].fitsCell}` : 'NOT ELIGIBLE (role and/or length fails)',
  }
})
const substitution = {}
for (const target of [3, 4]) {
  const cand = spares.filter(s => s.roleFitsCell === target)
  const ok = cand.find(s => lenPass(s.finalU))
  substitution['cell' + target] = { roleFittingSpares: cand.map(s => `${s.name} ${s.finalU}u ${s.lengthVerdict}`), selected: ok ? ok.name : null, decision: ok ? `spare ${ok.name} selected (role+length PASS)` : 'no spare passes role+length -> exact waived final cell used per grant' }
}

// ---- final selection (keeps, with waived cells where no spare selected) ----
const keeps = m.keeps.map((k) => {
  const priorK = prior.keeps[k.cell]
  const hashReproduced = k.finalHash === priorK.finalHash
  const waived = WAIVED[k.cell] && !substitution['cell' + k.cell]?.selected ? WAIVED[k.cell] : null
  const waiverHashMatch = waived ? (k.finalHash === waived.hash && k.finalMeasure.u === waived.u) : null
  const nonWaived = {
    identity: 'PASS (visual, personally opened final+marked cell and sequence: same helmeted full-bearded ochre/dark lamellar Xu Chu, glaive+tassel consistent)',
    anatomy: 'PASS (visual: two arms/hands connected on shaft, two legs/boots, no fused/extra/floating limbs)',
    poseRoleSequence: `PASS (visual: ${k.name} reads its charge beat; guard->crouch-coil->launch->crushing-dash->brake sequence coherent on contact-keeps-sequence.png)`,
    seams: seamPass(k) ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? `, retouch outside proof: ${OUTSIDE_NOTE[k.cell] ?? 'changedOutside=0'}` : ', no retouch applied'}; tip 4x clean)` : 'FAIL',
    scaleGround: k.finalMeasure.groundErrU <= 1.5 ? `PASS (groundErr ${k.finalMeasure.groundErrU}u <=1.5u at ONE sheet scale 1.3540; body crown->sole ${k.bodyRegPx}px registered, guard cell0 = frozen 459px)` : 'FAIL',
    head: 'RAW (beard conceals chin/beard-base endpoint; helmet-width proxy in measure.json; stays RAW for batch-end ruling per grant - not a reject)',
  }
  const nonWaivedPass = Object.entries(nonWaived).every(([k2, v]) => k2 === 'head' ? v.startsWith('RAW') : v.startsWith('PASS')) && hashReproduced && waiverHashMatch !== false
  return {
    cell: k.cell, name: k.name, sourceFile: 'cells/' + k.finalFile, sourceHash: k.finalHash, registeredHash: k.registeredHash,
    priorGateHashReproduced: hashReproduced,
    weapon: { registeredU: k.registeredMeasure.u, finalU: k.finalMeasure.u, finalPx: k.finalMeasure.pxLen, bandU: BAND, angDegRaw: k.finalMeasure.angDeg, lengthVerdict: waived ? `FAIL NOT PASS - WAIVED for this exact hash only (${waived.note}; failed numbers retained)` : (lenPass(k.finalMeasure.u) ? 'PASS' : 'FAIL'), waiverHashMatch },
    groundErrU: k.finalMeasure.groundErrU, boots: k.finalMeasure.boots, bodyRegPx: k.bodyRegPx,
    nonWaivedGates: nonWaived, nonWaivedPass,
    selection: waived ? 'exact waived focused-fix final cell (no spare passed role+length)' : 'focused-fix final cell (length PASS, no waiver needed)',
  }
})
// corridor/direction (sheet policy: angles raw per pose; consecutive direction steps <=60deg; rigid straight shaft butt->tip on marked cells)
const angs = m.keeps.map(k => k.finalMeasure.angDeg)
const directionSteps = angs.slice(1).map((a, i) => ({ from: i, to: i + 1, stepDeg: r2(Math.abs(a - angs[i])) }))
const directionPass = directionSteps.every(s => s.stepDeg <= 60)
const us = keeps.map(k => k.weapon.finalU)
const spreadPct = r2((Math.max(...us) - Math.min(...us)) / (us.reduce((a, b) => a + b, 0) / us.length) * 100)
const allNonWaivedPass = keeps.every(k => k.nonWaivedPass) && directionPass
const ledgerBuf = readFileSync('art/motion/generation-budget.json')
const ledgerNow = { sha256: sha(ledgerBuf), ...m.ledgerVerified }

let accepted = null
if (allNonWaivedPass) {
  mkdirSync(G + 'accepted', { recursive: true })
  accepted = keeps.map((k) => {
    const dest = `accepted/${k.name}.png`
    copyFileSync(G + k.sourceFile, G + dest)
    const h = sha(readFileSync(G + dest))
    if (h !== k.sourceHash) throw new Error('accepted copy hash mismatch ' + k.name)
    return { cell: k.cell, name: k.name, acceptedFile: dest, acceptedHash: h, selectionHash: k.sourceHash, sourceSheetSha256: m.sheetSha256 }
  })
}
const out = {
  work: 'cmr15a-charge-waiver-bank',
  grant: 'CMR-15A CHARGE EXACT-HASH WAIVER (owner, 2026-10-13; verbatim in TASKS.md CMR-15A): reset BLOCKED->IN_PROGRESS prospectively (ledger Xu16/global183, ceilings 22/189 preserved); zero generation; measure focused-fix spares 5-8 first, spare only if role+length pass; otherwise waive for exact final hashes a0aec6aa... (cell3, 146.04u OUT_HIGH +8.54u) and 3c864aa1... (cell4, 118.70u OUT_LOW -5.71u), sheet 4791a19e..., weapon-length/fixed-band/resulting-spread only, failed numbers retained NOT PASS, no blanket/transfer; bank cells0-4 if all other gates PASS on re-verification; head RAW for batch-end ruling; no combo/heavy/misc/fall/getup generation, no pack, no 15B.',
  sheet: { path: DIR + 'candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
  method: 'waiver-bank/build.mjs (focused-fix gate build copied + spare landmark boxes 5-8 from focused grid views): ONE sheet scale 1.3540, deterministic registration + max shaft retouch for OUT_HIGH; rerun byte-identical (measure.json a88db16c...); keeps 0-4 final hashes reproduced exactly vs focused-fix gate.json',
  ledgerVerified: ledgerNow,
  spares, substitution,
  finalCells: keeps,
  direction: { policy: 'angles recorded raw per pose (charge choreography levels/raises the glaive); corridor = rigid straight butt->tip shaft verified on marked cells (crosses on pommel cap + blade tip); consecutive direction steps <=60deg', anglesDeg: angs, directionSteps, verdict: directionPass ? 'PASS' : 'FAIL' },
  weaponSpread: { finalU: us, spreadPct, verdict: 'NOT PASS - WAIVED as resulting spread of the two exact-hash waived cells only (grant); cells0-2 individually in frozen band [124.41,137.50]u' },
  waiverRecord: ['cell3-crushing-dash a0aec6aaacaa9f871c41d0ad0971d56aae9e28d20d440f2482fa3e6453874b69: 146.04u OUT_HIGH +8.54u vs band-hi 137.50u - FAIL retained, NOT PASS, waived for this exact hash only', 'cell4-brake 3c864aa12b4de8d157013d7431b0aaeaceb51d377c4724f3c94812de8369a374: 118.70u OUT_LOW -5.71u vs band-lo 124.41u - FAIL retained, NOT PASS, waived for this exact hash only'],
  sequenceInspection: 'personally opened: all final+marked keeps 0-4, cell0 tip-4x, spare marked cells/grids, contact-keeps-sequence.png (guard->coil->launch->dash->brake coherent, grounded boots at ground line, identity constant) and contact-spares.png',
  verdict: allNonWaivedPass ? 'PASS - CHARGE BANKED (cells0-4 accepted; cell3/cell4 weapon length NOT PASS under exact-hash waiver; head RAW)' : 'FAIL - NOT BANKED (a non-waived gate failed)',
  banked: allNonWaivedPass,
  accepted,
  failedCriteria: allNonWaivedPass ? ['cell3 weapon length 146.04u OUT_HIGH (NOT PASS, waived exact hash a0aec6aa...)', 'cell4 weapon length 118.70u OUT_LOW (NOT PASS, waived exact hash 3c864aa1...)', `resulting weapon spread ${spreadPct}% (NOT PASS, waived as resulting spread)`] : keeps.filter(k => !k.nonWaivedPass).map(k => k.name),
  postSalvageAccounting: 'charge sheet banked under the exact-hash waiver; combo remains unbanked post-salvage FAIL and CMR-15A is NOT DONE; no combo/heavy/misc/fall/getup generation, no pack, no 15B in this grant',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict, '| spread', spreadPct + '%', '| directionMax', Math.max(...directionSteps.map(s => s.stepDeg)))
for (const f of out.failedCriteria) console.log(' -', f)
