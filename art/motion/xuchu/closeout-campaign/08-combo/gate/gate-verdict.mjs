// Derives gate.json (verdict) from measure.json for the CMR-15A Phase 3 combo sheet.
// Work cmr15a-phase3-combo-gates (correction/resume of partial state). Deterministic,
// zero generation. Banking only if 5/5 keeps pass after retouch; the partial state's
// gate-verdict.mjs was an unadapted copy of the charge focused-fix verdict (pointed at
// 07-charge/focused-fix) and is replaced by this combo verdict.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/08-combo/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = k.finalMeasure.u
  const lenPass = k.buttCapVisible && u >= BAND[0] && u <= BAND[1]
  const edge = k.finalMeasure.edge
  const seamBase = k.finalMeasure.greenPx === 0 && Object.values(edge).every(v => v === 0)
  const outside = k.retouch ? k.retouch.outsideProof.changedOutside : 0
  const seamPass = seamBase && outside === 0
  let verdict
  if (!k.buttCapVisible) verdict = `FAIL - butt cap not visible (haft ends in/behind the extended arm; visible stub length ${u}u is a lower bound only, whole weapon unmeasurable) and blade tip clipped at registered-canvas top edge (edge.t=${edge.t} alpha px, bounds.ymin=${k.finalMeasure.bounds.ymin}); a missing butt / clipped tip may not be fabricated and shaft retouch cannot cure`
  else if (u > BAND[1]) verdict = `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch`
  else if (u < BAND[0]) verdict = `FAIL - weapon length OUT_LOW (${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only and cannot cure`
  else verdict = seamPass ? 'PASS' : 'FAIL - seams'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent; sheet, all marked/final cells and contact sequence opened)',
      anatomy: 'PASS (visual: two arms/hands on shaft, two legs/boots, no fused/extra limbs)',
      poseRole: 'PASS (visual vs prompt keep role: windup / rising-cut strike / follow-through / horizontal sweep strike / recover to guard)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? 'PASS' : 'FAIL',
      seams: seamPass ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? ', retouch changedOutside=0' : ', no retouch applied'}; joints not visible at cell size)` : `FAIL (greenPx=${k.finalMeasure.greenPx}, edge=${JSON.stringify(edge)}, retouch changedOutside=${outside})`,
      head: 'RAW (beard conceals chin/beard-base endpoint; helmet-width proxy in measure.json, not gated; batch-end ruling reserved)',
    },
    weapon: {
      buttCapVisible: k.buttCapVisible,
      registeredU: k.registeredMeasure.u, registeredPx: k.registeredMeasure.pxLen,
      finalU: u, finalPx: k.finalMeasure.pxLen, bandU: BAND,
      overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)),
      retouchFeasibility: f ? { buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, removeTo132Px: f.removeToTarget132Px, reachesBand: f.reachesBand, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx) } : 'none (butt cap not visible - retouch skipped, missing butt may not be fabricated)',
    },
    groundErrU: k.finalMeasure.groundErrU,
    boots: k.finalMeasure.boots,
    verdict,
  }
})
const spares = m.spares.map((s) => ({
  cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash,
  registeredU: s.registeredMeasure.u, finalU: s.finalMeasure.u, finalPx: s.finalMeasure.pxLen,
  overBandHiU: r2(Math.max(0, s.finalMeasure.u - BAND[1])),
  retouchFeasibility: s.retouch ? { totalAvailPx: s.retouch.feasibility.totalAvailPx, removeToBandHiPx: s.retouch.feasibility.removeToBandHiPx, deficitToBandHiPx: Math.max(0, s.retouch.feasibility.removeToBandHiPx - s.retouch.feasibility.totalAvailPx), changedOutside: s.retouch.outsideProof.changedOutside } : null,
  verdict: s.finalMeasure.u >= BAND[0] && s.finalMeasure.u <= BAND[1] ? 'PASS (length)' : 'FAIL - weapon length OUT_HIGH after max deterministic shaft retouch (registered at the keeps sheet scale in build.mjs, so spare substitution is already measured here - no separate spare package needed)',
}))
const passCount = keeps.filter(k => k.verdict === 'PASS').length
const allPass = passCount === 5
const out = {
  work: 'cmr15a-phase3-combo-gates (correction/resume of partial state)',
  sheet: { path: 'art/motion/xuchu/closeout-campaign/08-combo/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components, reserveCommit: '717bff3 (Xu Chu 15->16, combo 0->1, global 182->183)', candidateCommit: 'b73ed34 (UNREVIEWED)' },
  registration: { method: 'one uniform sheet scale from cell4 recover (near-upright guard-link bookend; combo has no guard cell) crown->sole 308 native px to frozen 459px; per-cell translate sole->groundY500; canvas 1024x512 (widened from charge 768 so combo spans do not clip horizontally)', sheetScale: m.sheetScale, scaleCell: m.scaleCell, scaleBodyNativePx: m.scaleBodyNativePx, determinism: 'partial build.mjs rerun by the correction worker reproduced measure.json byte-identically (SHA-256 b970e479bb9f5ab0550850287d90da1a890612d9acfa664fc9efb6e0b41f1e0e before and after rerun; all registered/retouched cell hashes reproduced)' },
  retouchPolicy: 'deterministic shaft shortening BEFORE any length-failure verdict: pommel-side clean run first (cap-end searched in t=[8,64] per probe-butt-run.py, combo-scale pommel ball correction), blade-side clean run (front grip->socket) as supplement; shortening only; cell2 skipped (butt cap not visible)',
  anglePolicy: 'angles recorded raw per pose (combo choreography swings/levels the glaive); consecutive keep direction steps all <=60deg (directionSteps in measure.json); length vs frozen band is the binding weapon gate',
  ledgerVerified: m.ledgerVerified,
  keeps,
  passCount: `${passCount}/5`,
  directionSteps: m.directionSteps,
  lengthSpreadKeeps: m.lengthSpreadKeeps,
  spares,
  sparesNote: 'spares 5-8 were component-extracted, registered at the ONE sheet scale and retouched/gated in build.mjs (not native-only): every spare also FAILs length OUT_HIGH after max retouch, so no spare can substitute any failed keep role; no coherent 5-cell set exists on this sheet',
  verdict: allPass ? 'PASS - BANKED' : `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created)`,
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name}: ${k.verdict}; final ${k.weapon.finalU}u/${k.weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u; registered ${k.weapon.registeredU}u/${k.weapon.registeredPx}px`),
  postSalvageAccounting: 'Deterministic salvage is exhausted on all keeps AND spares (clean-shaft deficits 130-207px merely to reach band-hi; cell2 missing butt cap + top-clipped tip is not salvage-curable). Per this work order the combo sheet is counted post-salvage unusable #2 consecutive (charge focused-fix sheet was #1) = campaign STOP: CMR-15A BLOCKED WAITING_FOR_OWNER. No focused fix, heavy/misc/fall/getup generation or pack preparation is started; any focused fix for this sheet now requires an explicit owner decision (the grant allowance of at most one focused fix per sheet is unspent but does not auto-continue past the STOP).',
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
