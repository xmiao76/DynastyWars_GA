// Derives gate.json from measure.json for the CMR-15A combo FOCUSED-FIX sheet e3161283.
// Work cmr15a-combo-fix-gate-resume2 (correction of timed-out gate worker; partial
// build.mjs/measure.json reused only after rerun reproduced measure.json byte-identically,
// SHA-256 83ade30e429f45ac46831dbaff12f5dfd9b0a8836135f0f897681a2b191d38da).
// The partial gate-verdict.mjs was a stale copy of the ORIGINAL combo verdict
// (pointed at 08-combo/gate/) and is replaced by this focused-fix verdict.
// Deterministic, zero generation. Bank only a coherent 5-cell set with every cell
// in band (keeps, or role-fit spare substitutions); otherwise record waiver-eligible
// exact cells for the batch-end ruling and do not bank.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = k.finalMeasure.u
  const edge = k.finalMeasure.edge
  const seamBase = k.finalMeasure.greenPx === 0 && Object.values(edge).every(v => v === 0)
  const outside = k.retouch ? k.retouch.outsideProof.changedOutside : 0
  const seamPass = seamBase && outside === 0
  const lenPass = k.buttCapVisible && inBand(u)
  let verdict
  if (!k.buttCapVisible) verdict = `FAIL - butt cap not visible / weapon unmeasurable (stub ${u}u lower bound only); not fabricable, no waiver`
  else if (u > BAND[1]) verdict = `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch`
  else if (u < BAND[0]) verdict = `FAIL - weapon length OUT_LOW (${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only`
  else verdict = seamPass ? 'PASS' : 'FAIL - seams'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent; sheet, all 9 marked cells, keeps/spares contacts and cell2 cap/tip zooms opened; butt/tip markers verified on caps/on tip in every marked cell)',
      anatomy: 'PASS (visual: two arms/hands on shaft, two legs/boots, no fused/extra limbs)',
      poseRole: 'PASS (visual vs prompt keep role: windup / rising-cut strike / follow-through / horizontal sweep strike / recover)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? 'PASS' : 'FAIL',
      seams: seamPass ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? ', retouch changedOutside=0' : ', no retouch applied'})` : `FAIL (greenPx=${k.finalMeasure.greenPx}, edge=${JSON.stringify(edge)}, retouch changedOutside=${outside})`,
      head: 'RAW (beard conceals chin/beard-base endpoint; helmet proxy in measure.json, not gated; batch-end ruling reserved)',
    },
    weapon: {
      buttCapVisible: k.buttCapVisible,
      registeredU: k.registeredMeasure.u, registeredPx: k.registeredMeasure.pxLen,
      finalU: u, finalPx: k.finalMeasure.pxLen, bandU: BAND,
      overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)),
      retouchFeasibility: f ? { capStartT: f.capStartT, buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, socketTReg: f.socketTReg, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx), reachesBand: f.reachesBand, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : 'none needed (registered length already in band)',
    },
    groundErrU: k.finalMeasure.groundErrU,
    boots: k.finalMeasure.boots,
    verdict,
  }
})
const spares = m.spares.map((s) => ({
  cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash,
  registeredU: s.registeredMeasure.u, finalU: s.finalMeasure.u, finalPx: s.finalMeasure.pxLen,
  angleDeg: s.finalMeasure.angDeg, groundErrU: s.finalMeasure.groundErrU,
  greenPx: s.finalMeasure.greenPx, edge: s.finalMeasure.edge,
  overBandHiU: r2(Math.max(0, s.finalMeasure.u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - s.finalMeasure.u)),
  retouchFeasibility: s.retouch ? { totalAvailPx: s.retouch.feasibility.totalAvailPx, removeToBandHiPx: s.retouch.feasibility.removeToBandHiPx, deficitToBandHiPx: Math.max(0, s.retouch.feasibility.removeToBandHiPx - s.retouch.feasibility.totalAvailPx), appliedButtPx: s.retouch.buttRemovePx, appliedBladePx: s.retouch.bladeRemovePx, changedOutside: s.retouch.outsideProof.changedOutside } : 'none needed (registered length already in band)',
  verdict: inBand(s.finalMeasure.u) ? 'PASS (length; seams/identity/anatomy/scale-ground same visual pass as keeps)' : 'FAIL - weapon length OUT_HIGH after max deterministic shaft retouch at the keeps sheet scale',
}))
const passCount = keeps.filter(k => k.verdict === 'PASS').length
// Waiver eligibility per the PHASE-3 CONTINUATION grant: only fully measurable
// (cap visible, tip inside, no edge alpha) cells whose ONLY failing gate is a
// residual length deviation, all other gates PASS, retouch exhausted.
const waiverEligible = keeps.filter(k => k.verdict.startsWith('FAIL - weapon length')).map(k => ({
  cell: k.cell, name: k.name, finalFile: k.finalFile, finalHashSha256: k.finalHash,
  finalU: k.weapon.finalU, finalPx: k.weapon.finalPx,
  deviation: k.weapon.overBandHiU > 0 ? `OUT_HIGH +${k.weapon.overBandHiU}u over band-hi ${r2(BAND[1])}u` : `OUT_LOW -${k.weapon.underBandLoU}u under band-lo ${r2(BAND[0])}u`,
  status: 'FAIL retained, NOT PASS - held for batch-end exact-hash waiver ruling for this hash only; NOT banked by this package',
}))
const out = {
  work: 'cmr15a-combo-fix-gate-resume2 (correction of call_01a133b7fb2676f7b6390209d5521ed3; partial gate state resumed)',
  candidateDescription: {
    sheet: { path: 'art/motion/xuchu/closeout-campaign/08-combo/focused-fix/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
    sheetHashReverified: 'e316128362dca38e128cdfed08d8ba2e7a2f61807e94c596893dab5fcfd621ef (Get-FileHash this package; matches candidate.json)',
    reserveCommit: '41782f5 (Xu Chu 16->17, combo 1->2, global 183->184)', candidateCommit: '6ea11aa (UNREVIEWED)',
    provider: 'gpt-preferred sheet EDIT of original combo sheet 79601415, serving UNCONFIRMED (candidate.json)',
  },
  registration: { method: 'one uniform sheet scale from cell4 recover crown->sole 309 native px to frozen 459px (scale 1.4854); per-cell translate sole->groundY500; canvas 1024x512', sheetScale: m.sheetScale, scaleCell: m.scaleCell, scaleBodyNativePx: m.scaleBodyNativePx, determinism: 'partial build.mjs rerun reproduced measure.json byte-identically (SHA-256 83ade30e429f45ac46831dbaff12f5dfd9b0a8836135f0f897681a2b191d38da before/after rerun; candidate hash re-verified); gate-verdict.mjs rerun twice byte-identical (gate.json hash recorded in TASKS/PROGRESS)' },
  retouchPolicy: 'deterministic shaft shortening before any length-failure verdict: pommel-side clean run (cap-end searched t=[8,64]) then blade-side clean run (front grip->socket, -8px safety). OUT_HIGH keeps cell1/cell3 re-probed this package (probe-butt-run.py/probe-blade-run.py rerun): cell1 butt perp width 64-72px from t=4 (shaft lies over the armoured skirt - no isolated clean shaft) and blade clean run only t=364-372 (front grip t_end=365, socket 374.43) = 0 usable after safety, < 14px needed to band-hi; cell3 butt width 71-113px (shaft across torso) and front grip end 426 >= socket 425.5 = no blade run, < 24px needed. Spare6 max retouch applied 36px butt (changedOutside=0), still 5px short of band-hi.',
  anglePolicy: 'angles raw per pose (combo swings/levels the glaive); consecutive keep direction steps <=60deg (directionSteps); frozen length band is the binding weapon gate',
  ledgerVerified: m.ledgerVerified,
  ledgerNote: 'ledger file SHA-256 97d178e5da7c43b1e3a0a350f047ee14e459a032498f6158eaedcfaea237ca57, Xu Chu 17 (combo 2)/global 184, ceilings 25/192 - verified in build.mjs; zero generation this package',
  cell2Ruling: 'cell2 follow-through IS fully measurable on this focused-fix sheet: butt cap ball fully visible in empty space behind the back (cells-native/cell2-capzoom.png opened) and blade tip complete inside frame (cell2-tipzoom.png; registered edge all 0, bounds ymin=29) at 130.49u in band = PASS. The no-waiver-for-clipped/unmeasurable-cell2 clause is therefore not triggered.',
  keeps,
  passCount: `${passCount}/5`,
  directionSteps: m.directionSteps,
  lengthSpreadKeeps: m.lengthSpreadKeeps,
  lengthSpreadNote: 'computed keep spread 9.54% on final lengths (includes the two FAIL lengths; a spread figure is reported, not a PASS, while any length gate fails)',
  spares,
  substitutionAssessment: {
    cell1RisingCut: 'spare5 slash-a (134.35u PASS, -24.44deg) is a dynamic forward slash and spare7 rising (129.40u PASS, -24.05deg) reads upright/guard-like similar to spare8 and cell4 recover; either could at best contest cell1 alone - moot, because cell3 cannot be covered (below), so no coherent set forms either way',
    cell3Sweep: 'NO passing role-fit spare: the sweep beat requires the glaive levelled horizontal in a lunge (cell3 -7.24deg). spare6 low-sweep is the only near-horizontal spare (+6.49deg, low crouch) but FAILS length 138.73u (+1.23u) after max retouch; spares 5/7/8 are diagonal guard-family poses (-24.05..-26.50deg) that would delete the second-slash horizontal beat and duplicate the recover diagonal. One spare also cannot cover both cell1 and cell3.',
    conclusion: 'no coherent 5-cell set with every cell in band exists on this sheet; no substitution made, nothing banked',
  },
  verdict: `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created; ${waiverEligible.length} fully-measurable keep(s) held waiver-eligible for the batch-end exact-hash ruling, FAIL retained NOT PASS)`,
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name} [${k.finalHash}]: ${k.verdict}; final ${k.weapon.finalU}u/${k.weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u; retouch avail ${k.weapon.retouchFeasibility.totalAvailPx}px vs ${k.weapon.retouchFeasibility.removeToBandHiPx}px to band-hi (deficit ${k.weapon.retouchFeasibility.deficitToBandHiPx}px)`),
  waiverEligibleExactCells: waiverEligible,
  postSalvageAccounting: 'This sheet already consumed combo\'s one authorized focused fix; deterministic registration+retouch and spare substitution are now exhausted without a complete in-band set. Per the PHASE-3 CONTINUATION prospective count (from 0; historical STOP preserved) this is post-salvage unusable #1 of 2 consecutive - STOP NOT reached. CMR-15A stays IN_PROGRESS. Waiver-eligible exact cells above may only be resolved by the batch-end/owner exact-hash ruling (as charge was); this package grants no waiver and banks nothing. No further combo generation is authorized in this package; next Phase-3 sheet per grant order (heavy) is a later package - a second consecutive post-salvage unusable source there would STOP.',
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
console.log('waiverEligible:', waiverEligible.map(w => `${w.name} ${w.finalHashSha256.slice(0, 8)} ${w.finalU}u`).join('; '))
