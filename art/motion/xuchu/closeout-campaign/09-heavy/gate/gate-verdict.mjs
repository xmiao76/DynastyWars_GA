// Derives gate.json from measure.json for the CMR-15A PHASE-3 heavy sheet 37b72517.
// Work cmr15a-phase3-heavy-gates (correction of timed-out worker
// call_01a133d3af8973d192ff7659bb00a954; partial build.mjs/measure.json reused only
// after rerun reproduced measure.json byte-identically, SHA-256
// 5a284768b7167bac55eb49e7f8c8c05818392184cb66559079081fc64ca79a45).
// The partial gate-verdict.mjs was a stale copy of the combo focused-fix verdict
// (pointed at 08-combo/focused-fix/gate/) and is replaced by this heavy verdict.
// Deterministic, zero generation. Bank only a coherent 5-cell set with every cell
// in band (keeps, or role-fit spare substitutions); otherwise do not bank.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/09-heavy/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
// Shaft-axis direction step: the glaive axis is undirected (butt<->tip), and in the
// overhead beat the blade end points back over the head, flipping the directed
// butt->tip vector ~180deg. Axis steps are modulo 180deg.
const axisStep = (a, b) => { let d = Math.abs(a - b) % 180; return r2(d > 90 ? 180 - d : d) }
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = k.finalMeasure.u
  const edge = k.finalMeasure.edge
  const seamBase = k.finalMeasure.greenPx === 0 && Object.values(edge).every(v => v === 0)
  const outside = k.retouch ? k.retouch.outsideProof.changedOutside : 0
  const seamPass = seamBase && outside === 0
  const lenPass = k.buttCapVisible && inBand(u)
  let verdict
  if (!k.buttCapVisible) verdict = `FAIL - butt cap not drawn (haft ends at the hands; visible stub ${u}u only, whole weapon OUT_LOW by at least ${r2(BAND[0] - u)}u vs band-lo); shortening retouch cannot lengthen, missing part may not be fabricated, no waiver`
  else if (u > BAND[1]) verdict = `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch`
  else if (u < BAND[0]) verdict = `FAIL - weapon length OUT_LOW (${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only`
  else verdict = seamPass ? 'PASS' : 'FAIL - seams'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent; sheet, keeps/spares contacts and marked cells 1/2/3/4/5 opened; butt/tip markers verified on cap/tip where drawn, on the rear grip where the haft ends at the hands)',
      anatomy: 'PASS (visual: two arms/hands on shaft, two legs/boots, no fused/extra limbs)',
      poseRole: 'PASS (visual vs prompt keep role: raise / overhead hold / crushing chop / follow-through / recover toward guard)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? 'PASS' : 'FAIL',
      seams: seamPass ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? ', retouch changedOutside=0' : ', no retouch applied'})` : `FAIL (greenPx=${k.finalMeasure.greenPx}, edge=${JSON.stringify(edge)}, retouch changedOutside=${outside})`,
      head: 'RAW (beard conceals chin/beard-base endpoint; not gated; batch-end ruling reserved)',
    },
    weapon: {
      buttCapVisible: k.buttCapVisible,
      registeredU: k.registeredMeasure.u, registeredPx: k.registeredMeasure.pxLen,
      finalU: u, finalPx: k.finalMeasure.pxLen, bandU: BAND,
      overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)),
      retouchFeasibility: f ? { buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, socketTReg: f.socketTReg, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx), reachesBand: f.reachesBand, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : (k.buttCapVisible ? 'none needed (registered length already in band)' : 'not applicable (butt cap not drawn; weapon too short, retouch shortens only)'),
    },
    groundErrU: k.finalMeasure.groundErrU,
    boots: k.finalMeasure.boots,
    verdict,
  }
})
const spares = m.spares.map((s) => ({
  cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash,
  buttCapVisible: s.buttCapVisible,
  registeredU: s.registeredMeasure.u, finalU: s.finalMeasure.u, finalPx: s.finalMeasure.pxLen,
  angleDeg: s.finalMeasure.angDeg, groundErrU: s.finalMeasure.groundErrU,
  greenPx: s.finalMeasure.greenPx, edge: s.finalMeasure.edge,
  overBandHiU: r2(Math.max(0, s.finalMeasure.u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - s.finalMeasure.u)),
  verdict: !s.buttCapVisible
    ? `FAIL - butt cap not drawn / haft ends at hands (stub ${s.finalMeasure.u}u, OUT_LOW by at least ${r2(BAND[0] - s.finalMeasure.u)}u); cannot lengthen`
    : inBand(s.finalMeasure.u) ? 'PASS (length; seams/identity/anatomy/scale-ground same visual pass as keeps)' : 'FAIL - weapon length out of band after max deterministic shaft retouch at the keeps sheet scale',
}))
const passCount = keeps.filter(k => k.verdict === 'PASS').length
const axisSteps = []
for (let i = 0; i + 1 < m.keeps.length; i++) {
  const a = m.keeps[i].finalMeasure.angDeg, b = m.keeps[i + 1].finalMeasure.angDeg
  axisSteps.push({ from: m.keeps[i].name, to: m.keeps[i + 1].name, directedFromDeg: a, directedToDeg: b, axisStepDeg: axisStep(a, b), passLe60: axisStep(a, b) <= 60 })
}
// Waiver eligibility per the work order / PHASE-3 CONTINUATION grant: only fully
// measurable cells whose ONLY failing gate is a SMALL residual length deviation.
// None here qualifies: cell2/cell3 are not fully measurable (no butt cap drawn,
// stubs 32.31u/37.73u under band-lo) and cell4 is +18.06u OUT_HIGH (~13% over
// band-hi, vs the +3.46/+5.98u held eligible on the combo focused-fix sheet).
const waiverEligible = []
const out = {
  work: 'cmr15a-phase3-heavy-gates (correction of timed-out call_01a133d3af8973d192ff7659bb00a954; partial gate state resumed)',
  candidateDescription: {
    sheet: { path: 'art/motion/xuchu/closeout-campaign/09-heavy/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
    sheetHashReverified: '37b725170f1dc838297d8228570917f582126602ba848ca40cb34f65b4daa954 (Get-FileHash this package; matches candidate.json)',
    reserveCommit: '6dc3b7e (Xu Chu 17->18, heavy 0->1, global 184->185)', candidateCommit: 'aa3e438 (UNREVIEWED)',
    provider: 'gpt-preferred single sheet generation, serving UNCONFIRMED (candidate.json)',
  },
  registration: { method: 'one uniform sheet scale from cell4-recover crown->sole 301 native px to frozen 459px (scale 1.5249); per-cell translate sole->groundY500 (canvas 1024x768, groundYCanvas 756, padTop 256)', sheetScale: m.sheetScale, scaleCell: m.scaleCell, scaleBodyNativePx: m.scaleBodyNativePx, determinism: 'partial build.mjs rerun reproduced measure.json byte-identically (SHA-256 5a284768b7167bac55eb49e7f8c8c05818392184cb66559079081fc64ca79a45 before/after rerun this package; candidate hash re-verified); gate-verdict.mjs rerun twice byte-identical (gate.json hash recorded in TASKS/PROGRESS)' },
  retouchPolicy: 'deterministic shaft shortening assessed before any length-failure verdict (pommel-side then blade-side clean runs). Only OUT_HIGH keep cell4-recover was a retouch candidate: probe-butt-run.py rerun this package shows perpendicular width 62-72px from t=8 (haft lies across the armoured skirt/leg silhouette, clean run ~4px) so buttAvail=0, and the blade clean run t=402-406 ends at socket 406.94 so bladeAvail=0 after safety; 70px needed to band-hi, deficit 70px, applied 0 (changedOutside=0, hash unchanged). cell2/cell3 and spares 6-8 are OUT_LOW stubs (haft ends at the hands, no butt cap drawn) - shortening retouch cannot lengthen and a missing pommel may not be fabricated.',
  anglePolicy: 'angles raw per pose; direction continuity judged on the undirected shaft axis (modulo 180deg) because the overhead beat points the blade back over the head, flipping the directed butt->tip vector. measure.json directed steps (188.30/140.57deg) are that flip artifact; axis steps below are the binding continuity check. Frozen length band remains the binding weapon gate.',
  ledgerVerified: m.ledgerVerified,
  ledgerNote: 'ledger file SHA-256 adbadcd5c985dbbbf114b2e815344815abe0facb9b7da7b43333c848c9b15a1f, Xu Chu 18 (heavy 1)/global 185, ceilings 25/192 - verified in build.mjs; zero generation this package',
  keeps,
  passCount: `${passCount}/5`,
  directionStepsDirected: m.directionSteps,
  directionStepsAxis: axisSteps,
  directionVerdict: 'PASS on shaft-axis steps (all <=60deg: 8.30/39.43/2.08/51.06); raise -> overhead -> chop -> follow-through -> recover reads as one coherent crushing-chop sequence on the keeps contact sheet',
  lengthSpreadKeeps: m.lengthSpreadKeeps,
  lengthSpreadNote: 'computed keep spread 57.99% on final lengths (includes the three FAIL lengths; a spread figure is reported, not a PASS, while any length gate fails)',
  spares,
  substitutionAssessment: {
    cell1OverheadHold: 'spare5 overhead-a (133.95u PASS, butt cap drawn) is a genuine alternate overhead hold, but cell1 already passes (130.47u); it rescues no failing beat',
    cell2ChopCell3Follow: 'NO passing role-fit spare: spare7 chop-a (82.43u) and spare8 chop-b (97.16u) repeat the same defect as keeps cell2/cell3 - the haft ends at the hands with no butt cap drawn (stubs 27-42u under band-lo) - and spare6 overhead-b is likewise a 97.14u stub. The down-forward chop/follow-through beats cannot be covered by the overhead spare5 without deleting the strike',
    cell4Recover: 'no spare reads as a settling recover/guard pose, and cell4 itself fails length +18.06u with zero retouch availability',
    conclusion: 'no coherent 5-cell set with every cell in band exists on this sheet; no substitution made, nothing banked',
  },
  verdict: `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created; 0 waiver-eligible cells: the two stub keeps are not fully measurable and cell4's +18.06u deviation is not small)`,
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name} [${k.finalHash}]: ${k.verdict}; final ${k.weapon.finalU}u/${k.weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u`),
  waiverEligibleExactCells: waiverEligible,
  postSalvageAccounting: 'Deterministic registration, shaft-retouch assessment (applied/available 0 on the only OUT_HIGH keep) and full spare substitution are exhausted without a complete in-band set. The combo focused-fix sheet was prospective post-salvage unusable #1 under the PHASE-3 CONTINUATION count (from 0, historical STOP preserved); this heavy sheet is therefore post-salvage unusable #2 consecutive = STOP. CMR-15A is set BLOCKED WAITING_FOR_OWNER per the grant; heavy focused-fix allowance, misc/fall/getup and the offline pack do NOT auto-continue past STOP - owner decision only. This package grants no waiver and banks nothing (cells cell0/cell1/spare5 pass individually but a heavy family is banked only as a coherent complete set).',
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
console.log('axisSteps:', axisSteps.map(s => s.axisStepDeg).join('/'))
console.log('waiverEligible:', waiverEligible.length)
