// Derives gate.json for the CMR-15A heavy FOCUSED-FIX sheet 593ea8e4 from
// measure.json + candidate-wise comparison vs the ORIGINAL heavy gate
// (09-heavy/gate/gate.json, sheet 37b72517). Work cmr15a-heavy-focused-fix-gates.
// Li Dian splice method at cell-selection level: select the best PASSING source
// per beat across original+fix (spares of both sheets considered for role-fit
// substitution); bank a coherent 5-cell set ONLY if every selected cell passes.
// No waiver for stub cells or original cell4 155.56u (+18.06u). A small fully
// measurable residual length deviation on a fix cell may be held
// WAIVER_ELIGIBLE (FAIL retained, NOT PASS, not banked). Deterministic, zero gen.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/gate/'
const OG = 'art/motion/xuchu/closeout-campaign/09-heavy/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const og = JSON.parse(readFileSync(OG + 'gate.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
const axisStep = (a, b) => { let d = Math.abs(a - b) % 180; return r2(d > 90 ? 180 - d : d) }
const VISUAL = 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent; fix sheet, all 9 grid views, butt/grip/tip zooms, marked cells 0/1/2/3/4 and keeps/spares contacts opened; butt/tip markers verified on cap/tip where drawn, on the rear grip where the haft ends at the hands)'
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = k.finalMeasure.u
  const edge = k.finalMeasure.edge
  const seamBase = k.finalMeasure.greenPx === 0 && Object.values(edge).every(v => v === 0)
  const outside = k.retouch ? k.retouch.outsideProof.changedOutside : 0
  const seamPass = seamBase && outside === 0
  const lenPass = k.buttCapVisible && inBand(u)
  let verdict
  if (!k.buttCapVisible) verdict = `FAIL - butt cap STILL not drawn after the focused fix (haft ends at/behind the hand; visible stub ${u}u only, whole weapon OUT_LOW by at least ${r2(BAND[0] - u)}u vs band-lo); shortening retouch cannot lengthen, missing part may not be fabricated, no waiver for stub cells`
  else if (u > BAND[1]) verdict = `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch`
  else if (u < BAND[0]) verdict = `FAIL - weapon length OUT_LOW (${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only`
  else verdict = seamPass ? 'PASS' : 'FAIL - seams'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: VISUAL,
      anatomy: 'PASS (visual: two arms/hands on shaft, two legs/boots, no fused/extra limbs)',
      poseRole: 'PASS (visual vs prompt keep role: raise / overhead hold / crushing chop / follow-through / recover toward guard; poses preserved from the original sheet)',
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
const fixPassCount = keeps.filter(k => k.verdict === 'PASS').length
const axisSteps = []
for (let i = 0; i + 1 < m.keeps.length; i++) {
  const a = m.keeps[i].finalMeasure.angDeg, b = m.keeps[i + 1].finalMeasure.angDeg
  axisSteps.push({ from: m.keeps[i].name, to: m.keeps[i + 1].name, directedFromDeg: a, directedToDeg: b, axisStepDeg: axisStep(a, b), passLe60: axisStep(a, b) <= 60 })
}
// ---- candidate-wise original vs fix comparison + best-passing-source selection ----
// Originals from 09-heavy/gate/gate.json (deterministic gate, rerun-verified there).
const origKeep = (i) => og.keeps.find(k => k.cell === i)
const fixKeep = (i) => keeps.find(k => k.cell === i)
const ROLES = ['raise / heavy preparation', 'overhead hold', 'crushing chop', 'follow-through', 'recover toward guard']
const selection = ROLES.map((role, i) => {
  const o = origKeep(i), f = fixKeep(i)
  const entry = {
    cell: i, role,
    original: { source: 'original heavy sheet 37b72517', finalFile: '09-heavy/gate/cells-registered/' + o.finalFile, finalHash: o.finalHash, finalU: o.weapon.finalU, buttCapVisible: o.weapon.buttCapVisible, verdict: o.verdict },
    fix: { source: 'focused-fix sheet 593ea8e4', finalFile: '09-heavy/focused-fix/gate/cells-registered/' + f.finalFile, finalHash: f.finalHash, finalU: f.weapon.finalU, buttCapVisible: f.weapon.buttCapVisible, verdict: f.verdict },
  }
  return entry
})
// Selection rationale (identity/sequence coherence preserved: same poses/layout on
// both sheets; both registrations put body at 459px and soles at groundY500, so a
// mixed set stays scale/ground coherent; shaft-axis steps of the mixed candidate
// sequence are computed below from the best available source per beat).
selection[0].selected = 'original'
selection[0].rationale = 'BOTH pass (original 129.07u, fix 127.65u); original retained per work order (cells0/1 pass and may be retained; the fix was briefed to leave them unchanged)'
selection[1].selected = 'original'
selection[1].rationale = 'BOTH pass (original 130.47u, fix 129.41u); original retained per work order'
selection[2].selected = null
selection[2].rationale = 'NO passing source: original is a 92.10u stub (no cap, no waiver); the fix drew a complete cap but overshot to 167.02u -> 163.30u after max retouch (+25.80u over band-hi; buttAvail 14px vs 114px to band-hi because the haft lies across the back/skirt from t~44 to the rear grip at t~284, blade run none) - not small, NOT waiver-eligible. Chop spares on both sheets are stubs; overhead spares do not fit the chop beat'
selection[3].selected = null
selection[3].rationale = 'NO passing source: original 86.68u stub AND fix 97.74u stub - the focused fix again drew no butt cap on this cell (haft ends at/behind the hand, cell3-gripzoom); stubs are not fully measurable, no waiver. No role-fit passing spare on either sheet'
selection[4].selected = null
selection[4].rationale = 'NO passing source: original 155.56u (+18.06u, explicitly no waiver); fix shortened to 145.22u (+7.72u over band-hi, retouch avail 0 vs 30px to band-hi - haft across skirt 63-71px wide from t=24, no blade run) - FAIL retained; fully measurable with only-length failure, held WAIVER_ELIGIBLE for an owner ruling (exact hash below), NOT banked'
// mixed candidate sequence axis steps: original angles 0/1 + fix angles 2/3/4
const mixedAngles = [origKeep(0).gates.weaponAngleDegRaw, origKeep(1).gates.weaponAngleDegRaw, ...[2, 3, 4].map(i => m.keeps[i].finalMeasure.angDeg)]
const mixedSteps = []
for (let i = 0; i + 1 < mixedAngles.length; i++) mixedSteps.push({ fromCell: i, toCell: i + 1, fromAngDeg: mixedAngles[i], toAngDeg: mixedAngles[i + 1], axisStepDeg: axisStep(mixedAngles[i], mixedAngles[i + 1]), passLe60: axisStep(mixedAngles[i], mixedAngles[i + 1]) <= 60 })
const mixedUs = [selection[0].original.finalU, selection[1].original.finalU, selection[2].fix.finalU, selection[3].fix.finalU, selection[4].fix.finalU]
const allRolesPass = selection.every(s => s.selected !== null)
// Waiver eligibility: only fully measurable cells whose ONLY failing gate is a
// SMALL residual length deviation. Fix cell4 +7.72u qualifies as held-eligible
// (cap+tip fully drawn, all non-length gates PASS; cf. combo +3.46/+5.98 held
// eligible and charge +8.54 later waived by owner grant; the explicitly excluded
// original cell4 +18.06u and fix cell2 +25.80u do not). Eligibility is NOT a
// waiver and NOT a PASS; the cell is not banked.
const waiverEligible = [{
  cell: 4, name: 'cell4-recover', source: 'focused-fix sheet 593ea8e4',
  finalFile: '09-heavy/focused-fix/gate/cells-registered/cell4-recover-retouched.png',
  finalHash: fixKeep(4).finalHash, finalU: fixKeep(4).weapon.finalU, finalPx: fixKeep(4).weapon.finalPx,
  deviationU: fixKeep(4).weapon.overBandHiU, bandU: BAND,
  status: 'WAIVER_ELIGIBLE - FAIL retained, NOT PASS, NOT BANKED; exact hash only, held for owner ruling',
  note: 'fully measurable (complete butt cap + tip inside frame); only failing gate is weapon length +7.72u after max retouch (avail 0 vs 30px to band-hi); identity/anatomy/pose-role/seams/scale-ground PASS, head RAW',
}]
const out = {
  work: 'cmr15a-heavy-focused-fix-gates',
  candidateDescription: {
    sheet: { path: 'art/motion/xuchu/closeout-campaign/09-heavy/focused-fix/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
    sheetHashReverified: '593ea8e4a2d2fb44cd847715ac8e3be39ddf8a6278440597d77b61d338d476c3 (Get-FileHash this package; matches candidate.json)',
    reserveCommit: '819e4a2 (Xu Chu 18->19, heavy 1->2, global 185->186)', candidateCommit: 'b611b09 (UNREVIEWED)',
    provider: 'gpt-preferred single sheet EDIT of the original heavy sheet, serving UNCONFIRMED (candidate.json)',
    editTargetOriginal: { path: 'art/motion/xuchu/closeout-campaign/09-heavy/candidate-raw.png', sha256: og.candidateDescription.sheet.sha256, gate: '09-heavy/gate/gate.json (FAIL 2/5: cells0/1 PASS 129.07/130.47u; cell2/cell3 stubs 92.10/86.68u; cell4 155.56u +18.06u)' },
  },
  registration: { method: 'one uniform sheet scale from cell4-recover crown->sole 305 native px (fix sheet) to frozen 459px (scale 1.5049; original sheet used its own 301px/1.5249 - each sheet registered independently to the same frozen body/ground, so mixed-source selection stays scale/ground coherent); per-cell translate sole->groundY500 (canvas 1024x768, groundYCanvas 756, padTop 256)', sheetScale: m.sheetScale, scaleCell: m.scaleCell, scaleBodyNativePx: m.scaleBodyNativePx, determinism: 'build.mjs rerun reproduced measure.json byte-identically (SHA-256 recorded in TASKS/PROGRESS); gate-verdict.mjs rerun twice byte-identical' },
  retouchPolicy: 'deterministic shaft shortening assessed FIRST, before any length-failure verdict (pommel-side then blade-side clean runs; probe-butt-run.py rerun this package confirms the build scan). Fix cell2-crushing-chop (cap now drawn) registered 167.02u: clean shaft only t=28-40 (width jumps to 68-69px at t=44 where the haft enters the back/skirt silhouette and stays over the body to rearGrip t~284), blade run none before socket 462.04 -> buttAvail 14px applied (changedOutside=0) -> 163.30u, deficit 100px to band-hi. Fix cell4-recover 145.22u: width 63-71px from t=24 (haft across skirt), no clean cap-end in [8,64], blade run none (socket 399.24) -> avail 0 vs 30px, applied 0. Fix cell3 remains an OUT_LOW stub (no cap drawn) - shortening retouch cannot lengthen and a missing pommel may not be fabricated.',
  anglePolicy: 'angles raw per pose; direction continuity judged on the undirected shaft axis (modulo 180deg) because the overhead beat points the blade back over the head, flipping the directed butt->tip vector (same policy as the original heavy gate). Frozen length band remains the binding weapon gate.',
  ledgerVerified: m.ledgerVerified,
  ledgerNote: 'ledger file SHA-256 c52a6eaf925a974416d2bc2648269510fbaf2840070f09630368df0272fddab9, Xu Chu 19 (heavy 2)/global 186, ceilings 25/192 - verified in build.mjs; zero generation this package',
  keeps,
  passCountFixSheet: `${fixPassCount}/5`,
  directionStepsDirectedFix: m.directionSteps,
  directionStepsAxisFix: axisSteps,
  lengthSpreadKeepsFix: m.lengthSpreadKeeps,
  spares,
  candidateSelection: {
    method: 'best passing source per beat across original sheet 37b72517 + focused-fix sheet 593ea8e4 (Li Dian splice method at cell-selection level); spares 5-8 of both sheets gated for role-fit substitution; original cells0/1 retained where both pass',
    perRole: selection,
    spareSubstitution: 'no passing role-fit spare for any failing beat on either sheet: overhead spares pass length (original spare5 133.95u, fix spare5 132.74u) but duplicate the already-passing overhead-hold beat and cannot cover the down-forward crushing-chop/follow-through beats without deleting the strike; chop spares 7/8 and overhead-b spare6 are butt-cap stubs on BOTH sheets (original 82.43/97.16/97.14u, fix 93.20/96.19/95.88u); no spare reads as a settling recover',
    mixedSequenceAxisSteps: mixedSteps,
    mixedSequenceDirectionVerdict: 'PASS on shaft-axis steps for the best-available mixed sequence (original 0/1 + fix 2/3/4); raise -> overhead -> chop -> follow-through -> recover poses/identity are preserved across both sheets (same figures, costume, grips) and both registrations share frozen body 459px/groundY500, so sequence coherence itself passes - the set fails on weapon length only',
    mixedLengthSpread: { finalUs: mixedUs, spreadPct: r2((Math.max(...mixedUs) - Math.min(...mixedUs)) / (mixedUs.reduce((s, v) => s + v, 0) / mixedUs.length) * 100), note: 'reported, not PASS (includes FAIL lengths incl. the cell3 stub lower bound)' },
    coherentAllPassSetExists: allRolesPass,
  },
  verdict: 'FAIL - NOT BANKED (no accepted cells created). Fix sheet alone: 2/5 keeps pass (cells0/1). Candidate-wise across original+fix: roles 0/1 have passing sources (originals retained), role 4 has only a waiver-eligible fix cell (+7.72u, FAIL retained), roles 2/3 have NO passing source on either sheet - so no coherent all-pass 5-cell heavy set exists and nothing is banked',
  failedCriteria: [
    `cell2-crushing-chop fix [${fixKeep(2).finalHash}]: ${fixKeep(2).verdict}; final ${fixKeep(2).weapon.finalU}u/${fixKeep(2).weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u (original cell2 ${origKeep(2).weapon.finalU}u stub also FAIL, no waiver)`,
    `cell3-follow-through fix [${fixKeep(3).finalHash}]: ${fixKeep(3).verdict}; stub ${fixKeep(3).weapon.finalU}u/${fixKeep(3).weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u (original cell3 ${origKeep(3).weapon.finalU}u stub also FAIL, no waiver)`,
    `cell4-recover fix [${fixKeep(4).finalHash}]: ${fixKeep(4).verdict}; final ${fixKeep(4).weapon.finalU}u/${fixKeep(4).weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u - WAIVER_ELIGIBLE exact hash held, FAIL retained NOT PASS (original cell4 155.56u +18.06u FAIL, explicitly no waiver)`,
  ],
  waiverEligibleExactCells: waiverEligible,
  postFixAccounting: 'Deterministic salvage (registration + max shaft retouch + full spare substitution on BOTH sheets) AND heavy\'s one authorized focused fix are now both exhausted without a complete in-band set. Under the corrected process rules (PROCESS CORRECTION grant: a sheet counts post-salvage unusable only after salvage AND its focused fix are exhausted; banked sheet resets count to 0; STOP at 2 consecutive post-fix unusable), heavy is post-fix unusable #1 (prospective count 0 -> 1; the initial heavy-sheet FAIL correctly never counted). STOP is NOT reached; CMR-15A stays IN_PROGRESS - no further heavy generation is authorized in this package (misc/fall/getup proceed per grant in later packages). No waiver granted here; the one waiver-eligible hash above is held for an owner ruling only.',
  prospectivePostSalvageCount: 1,
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
console.log('fix axisSteps:', axisSteps.map(s => s.axisStepDeg).join('/'))
console.log('mixed axisSteps:', mixedSteps.map(s => s.axisStepDeg).join('/'))
console.log('waiverEligible:', waiverEligible.map(w => `${w.name} ${w.finalU}u ${w.finalHash.slice(0, 8)}`).join(', '))
console.log('coherentAllPassSetExists:', allRolesPass)
