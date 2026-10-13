// Derives gate.json from measure.json for the CMR-15A PHASE-3 misc sheet 6c3b5e5c.
// Work cmr15a-phase3-misc-gates. Method identical to 09-heavy/gate/gate-verdict.mjs.
// Deterministic, zero generation. Bank only a coherent 5-cell set with every cell
// in band (keeps, or role-fit spare substitutions); otherwise do not bank.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/10-misc/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
const axisStep = (a, b) => { let d = Math.abs(a - b) % 180; return r2(d > 90 ? 180 - d : d) }
// Cell2 held-clamp extra visual failure (personally inspected on the native grid +
// marked cell): the haft middle passes BEHIND the crossed arms/torso and the clasped
// hands grip each other, not the haft; the shaft re-emerges only at the socket. The
// prompt requires the glaive held in hand(s), never hidden behind the body or a hand.
const CORRIDOR_FAIL = { 2: 'FAIL - weapon corridor/grip: haft hidden behind crossed arms/torso, clasped hands do not grip the haft (shaft re-emerges at socket only)' }
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = k.finalMeasure.u
  const edge = k.finalMeasure.edge
  const seamBase = k.finalMeasure.greenPx === 0 && Object.values(edge).every(v => v === 0)
  const outside = k.retouch ? k.retouch.outsideProof.changedOutside : 0
  const seamPass = seamBase && outside === 0
  const lenPass = k.buttCapVisible && inBand(u)
  const corridorPass = !CORRIDOR_FAIL[k.cell]
  let verdict
  if (!k.buttCapVisible) verdict = `FAIL - butt cap not drawn (stub ${u}u)`
  else if (u > BAND[1]) verdict = `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch${corridorPass ? '' : '; ALSO ' + CORRIDOR_FAIL[k.cell]}`
  else if (u < BAND[0]) verdict = `FAIL - weapon length OUT_LOW (${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only`
  else if (!corridorPass) verdict = CORRIDOR_FAIL[k.cell]
  else verdict = seamPass ? 'PASS' : 'FAIL - seams'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent; sheet, all 9 native grids, keeps/spares contacts and marked cells 0/2/3/4/5 opened; butt/tip markers verified on cap ball / blade tip in every inspected cell)',
      anatomy: 'PASS (visual: two arms/legs/boots, heads/hands connected, no fused/extra limbs; cell1 head-zoom opened)',
      poseRole: 'PASS (visual vs prompt keep role: hurt-recoil rock-back / hurt-fold doubled / held-clamp arms pinned / held-struggle twisting lever / release back to guard)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponCorridorGrip: corridorPass ? 'PASS (haft in front, gripped, both ends in empty space)' : CORRIDOR_FAIL[k.cell],
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? `PASS (groundErr ${k.finalMeasure.groundErrU}u, 2 boot clusters, bodyReg ${k.bodyRegPx}px)` : 'FAIL',
      seams: seamPass ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? ', retouch changedOutside=0' : ', no retouch applied'})` : `FAIL (greenPx=${k.finalMeasure.greenPx}, edge=${JSON.stringify(edge)}, retouch changedOutside=${outside})`,
      head: 'RAW (beard conceals chin/beard-base endpoint; not gated; batch-end ruling reserved)',
    },
    weapon: {
      buttCapVisible: k.buttCapVisible,
      registeredU: k.registeredMeasure.u, registeredPx: k.registeredMeasure.pxLen,
      finalU: u, finalPx: k.finalMeasure.pxLen, bandU: BAND,
      overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)),
      retouchFeasibility: f ? { buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, socketTReg: f.socketTReg, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx), reachesBand: f.reachesBand, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : 'none needed (registered length already in band)',
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
  retouchFeasibility: s.retouch ? { buttAvailPx: s.retouch.feasibility.buttAvailPx, bladeAvailPx: s.retouch.feasibility.bladeAvailPx, totalAvailPx: s.retouch.feasibility.totalAvailPx, removeToBandHiPx: s.retouch.feasibility.removeToBandHiPx, reachesBand: s.retouch.feasibility.reachesBand, appliedButtPx: s.retouch.buttRemovePx, appliedBladePx: s.retouch.bladeRemovePx, changedOutside: s.retouch.outsideProof.changedOutside } : null,
  verdict: inBand(s.finalMeasure.u) ? 'PASS (length; seams/identity/anatomy/scale-ground same visual pass as keeps)' : `FAIL - weapon length OUT_HIGH (+${r2(s.finalMeasure.u - BAND[1])}u) after max deterministic shaft retouch at the keeps sheet scale`,
}))
const passCount = keeps.filter(k => k.verdict === 'PASS').length
const axisSteps = []
for (let i = 0; i + 1 < m.keeps.length; i++) {
  const a = m.keeps[i].finalMeasure.angDeg, b = m.keeps[i + 1].finalMeasure.angDeg
  axisSteps.push({ from: m.keeps[i].name, to: m.keeps[i + 1].name, directedFromDeg: a, directedToDeg: b, axisStepDeg: axisStep(a, b), passLe60: axisStep(a, b) <= 60 })
}
// Waiver eligibility: only fully measurable cells whose ONLY failing gate is a SMALL
// residual length deviation. No KEEP qualifies: cell2 (+4.13u) also fails corridor/grip,
// cell3 (+15.72u) and cell4 (+21.77u) are not small. Spare5 (+0.02u, 0.07px integer-shift
// residual after retouch that nominally reaches band) is fully measurable and tiny, but
// it is a one-hand recoil alternate for the already-passing cell0 beat - no failing
// keep role fits it - so it is recorded here, not in the waiver-eligible keep list.
const waiverEligible = []
const out = {
  work: 'cmr15a-phase3-misc-gates',
  candidateDescription: {
    sheet: { path: 'art/motion/xuchu/closeout-campaign/10-misc/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
    sheetHashReverified: '6c3b5e5c4f46c7ed03171a7d391f3a97095eb1b09f93c0081028960f189e3471 (Get-FileHash this package; matches candidate.json)',
    reserveCommit: '9e16e8b (Xu Chu 19->20, misc 0->1, global 186->187)', candidateCommit: '889f794 (UNREVIEWED)',
    provider: 'gpt-preferred single sheet generation, serving UNCONFIRMED (candidate.json)',
  },
  registration: { method: 'one uniform sheet scale from cell4-release crown->sole 336 native px to frozen 459px (scale 1.3661); per-cell translate sole->groundY500 (canvas 1024x768, groundYCanvas 756, padTop 256)', sheetScale: m.sheetScale, scaleCell: m.scaleCell, scaleBodyNativePx: m.scaleBodyNativePx, determinism: 'build.mjs rerun reproduced measure.json byte-identically (SHA-256 27c78514b9bc6acff46ba1dbe3e6daee793373f4beabc2b5d1965894ea0b2154 before/after rerun this package; candidate hash re-verified); gate-verdict.mjs is a pure function of measure.json' },
  retouchPolicy: 'deterministic shaft shortening assessed BEFORE any length-failure verdict on every OUT_HIGH cell (pommel-side then blade-side clean runs, changedOutside=0 everywhere). Applied: cell0 60+31=91px (160.76->137.10u PASS), cell1 0+78=78px (152.53->132.34u PASS), cell2 8px (deficit 17px to band-hi), cell3 40px blade-side only (haft over skirt silhouette at the butt end, capStartT=null; deficit 61px), cell4 0px (buttCleanEnd=capStart=8 and blade run ends at socket: shaft lies across skirt/arm silhouette, no method-clean run; 84px needed), spares: cell5 40px (=need, residual +0.02u from integer axis shift), cell6 0px (no clean run either side), cell7 10px, cell8 2px. No lengthening, no fabricated parts: all 9 butt caps ARE drawn, so every cell is fully measurable.',
  anglePolicy: 'angles raw per pose; direction continuity on directed (=axis here, no flip) steps, all <=60deg. Frozen length band remains the binding weapon gate.',
  ledgerVerified: m.ledgerVerified,
  ledgerNote: 'Xu Chu 20 (misc 1)/global 187, ceilings 25/192 - verified in build.mjs; zero generation this package',
  keeps,
  passCount: `${passCount}/5`,
  directionStepsDirected: m.directionSteps,
  directionStepsAxis: axisSteps,
  directionVerdict: 'PASS (steps 30.22/21.05/2.38/5.12deg, all <=60); hurt-recoil -> hurt-fold -> held-clamp -> held-struggle -> release reads as one coherent reaction/grapple sequence on the keeps contact sheet',
  lengthSpreadKeeps: m.lengthSpreadKeeps,
  lengthSpreadNote: 'computed keep spread 18.61% on final lengths (includes the three FAIL lengths; reported, not a PASS, while any length gate fails)',
  spares,
  substitutionAssessment: {
    cell2HeldClamp: 'NO role-fit passing spare: spare5 (137.52u, +0.02) is a one-hand recoil, spare6/7/8 are +21.74/+26.30/+17.11u OUT_HIGH guard/brace poses - none reads as arms-pinned clamp',
    cell3HeldStruggle: 'NO passing spare (all spares fail length; none reads as twisting against a hold)',
    cell4Release: 'NO passing spare (spare8 guard is closest in role but +17.11u OUT_HIGH with 2px retouch availability)',
    conclusion: 'no coherent 5-cell set with every cell in band exists on this sheet; no substitution made, nothing banked (cells 0/1 pass individually but a misc family banks only as a coherent complete set)',
  },
  verdict: `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created; 0 waiver-eligible keeps)`,
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name} [${k.finalHash}]: ${k.verdict}; final ${k.weapon.finalU}u/${k.weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u`),
  waiverEligibleExactCells: waiverEligible,
  spareTinyDeviationNote: 'cell5-spare-reaction-a final 137.52u = +0.02u (0.07px) over band-hi after retouch whose totalAvail exactly equalled removeToBandHi (40px); fully measurable, deviation is waiver-SIZED, but the pose only alternates the passing cell0 hurt-recoil beat, so it rescues no failing keep and no waiver is requested for it',
  postSalvageAccounting: 'This is the INITIAL misc sheet verdict. Deterministic registration, shaft retouch (applied before any length verdict) and full spare substitution are exhausted without a complete in-band set, so the misc FOCUSED FIX (one reserved generation, next package under the PHASE-3 CONTINUATION grant) remains UNSPENT and is the next step. Per the work order/grant accounting, an initial-sheet failure does NOT increment the consecutive post-fix unusable count: the count stays at #1 (heavy focused fix). Only if the misc focused fix also ends unusable post-salvage would it become #2 = STOP - not decided here. This package grants no waiver and banks nothing.',
  focusedFixBrief: {
    namedCells: 'redraw ONLY misc keeps cell2-held-clamp, cell3-held-struggle, cell4-release (cells 0/1 pass via retouch at 137.10/132.34u and must be carried as references, not redrawn into the fix sheet keep slots unless the fix method requires a full sheet)',
    lengthSteer: 'this sheet drew 393-451 native px weapons (143.78-166.41u registered at scale 1.3661) vs prompt.txt native target 321-347px at expected scale ~1.49-1.52; steer the fix ~15% shorter than this sheet and keep the explicit native-px window (recompute the intersection if the fix sheet body scale differs)',
    corridorSteer: 'cell2 remake must grip the haft visibly in front of the body (no haft hidden behind arms/torso, no clasped empty hands) while arms read pinned',
    retouchNote: 'cells whose haft lies across the skirt silhouette gave ZERO butt-side clean run (cell3/cell4/cell6) - the fix cannot rely on post retouch; native length must land in band',
  },
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
console.log('axisSteps:', axisSteps.map(s => s.axisStepDeg).join('/'))
console.log('waiverEligible:', waiverEligible.length)
