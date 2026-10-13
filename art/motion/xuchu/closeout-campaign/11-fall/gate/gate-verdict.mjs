// Derives gate.json from measure.json + probe-prone-butt.json for CMR-15A PHASE-3
// fall sheet aa207ce6. Work cmr15a-phase3-fall-gates (correction package finishing
// the timed-out partial: build.mjs/measure.json hash-verified and rerun
// byte-identical this package). Deterministic, zero generation. Bank only a
// coherent 5-cell all-pass set (keeps or role-fit spares); otherwise do not bank.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/11-fall/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const probe = JSON.parse(readFileSync(G + 'probe-prone-butt.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
const corrU = (name) => probe.cells[name] ? probe.cells[name].u : null
// Visual grip failures (personally inspected this package on the sheet, keeps
// contact, marked cells and cell0-grip-zoom): prompt.txt requires the glaive
// gripped in hand(s) in EVERY cell. Cells 0/1: BOTH hands open and clear of the
// haft - the glaive floats across the torso ungripped.
const GRIP_FAIL = {
  0: 'FAIL - weapon grip: both hands open/flailing, no hand on the haft; glaive floats across the torso',
  1: 'FAIL - weapon grip: both hands open, no hand on the haft; glaive floats across the torso',
}
const effU = (k) => corrU(k.name) ?? k.finalMeasure.u
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = effU(k)
  const seamPass = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every(v => v === 0) && (k.retouch ? k.retouch.outsideProof.changedOutside === 0 : true)
  const lenPass = k.buttCapVisible && inBand(u)
  const gripPass = !GRIP_FAIL[k.cell]
  let verdict
  if (!k.buttCapVisible) verdict = `FAIL - butt cap not drawn: haft ends blunt behind the skirt plate (cell2-butt-zoom); whole weapon unmeasurable, shortening retouch cannot lengthen, nothing fabricated (build length ${k.finalMeasure.u}u is boot-sole-contaminated - red cross on the boot in the marked view - and is NOT a valid weapon length)`
  else if (u > BAND[1]) verdict = `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u) after max deterministic shaft retouch${gripPass ? '' : '; ALSO ' + GRIP_FAIL[k.cell]}`
  else if (u < BAND[0]) verdict = `FAIL - weapon length OUT_LOW (-${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only`
  else if (!gripPass) verdict = GRIP_FAIL[k.cell]
  else verdict = seamPass ? 'PASS' : 'FAIL - seams'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/heavy lamellar/glaive+tassel consistent; sheet, keeps/spares contacts, marked cells 0/1/2/3/4/6/7, grip/butt zooms and cap grids opened this package; butt/tip markers on cap ball/blade tip for cells 0/1/3/6 - prone cells 4/7/8 corrected by probe, see methodCorrection)',
      anatomy: 'PASS (visual: two arms/legs/boots, heads/hands connected, no fused/extra limbs across the 9 cells)',
      poseRole: 'PASS (visual vs prompt roles: topple tipping back / airborne feet off ground twisting / tumble inverted knees tucked / impact on back legs kicking up / DOWN flat prone face-down legs extended)',
      downFlatGrounded: k.cell === 4 ? `PASS (genuinely flat prone bookend: horizontal face-down body, legs extended straight, arm folded gripping haft alongside; aspectWH ${k.finalMeasure.aspectWH}, groundErr ${k.finalMeasure.groundErrU}u at ground line, no kneeling/propping; usable as getup first frame in pose terms)` : 'n/a (only cell4 is the DOWN bookend)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponGrip: gripPass ? 'PASS (haft visibly gripped)' : GRIP_FAIL[k.cell],
      weaponAngleDegRaw: k.cell === 4 ? -13.26 : k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? `PASS (one sheet scale 1.1739 from cell4 prone head-to-boots 391px=459px, cross-checks 397/382px on cells 7/8; groundErr ${k.finalMeasure.groundErrU}u)` : 'FAIL',
      seams: seamPass ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? ', retouch changedOutside=0' : ''})` : 'FAIL',
      head: 'RAW (not gated; batch-end ruling reserved)',
    },
    weapon: {
      buttCapVisible: k.buttCapVisible,
      buildU: k.finalMeasure.u, correctedU: corrU(k.name), finalU: u, bandU: BAND,
      overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)),
      retouchFeasibility: f ? { totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx), appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : null,
    },
    groundErrU: k.finalMeasure.groundErrU, verdict,
  }
})
const spares = m.spares.map((s) => {
  const u = effU(s)
  return {
    cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash, buttCapVisible: s.buttCapVisible,
    buildU: s.finalMeasure.u, correctedU: corrU(s.name), finalU: u, angleDeg: s.finalMeasure.angDeg, groundErrU: s.finalMeasure.groundErrU,
    roleRead: { 5: 'prone dive/crawl propped on arms, head raised - NOT flat DOWN, not airborne/tumble', 6: 'grounded recline on back/side, gripped - impact-phase read, already ground-contacting', 7: 'prone face-down DOWN alternate (legs bent)', 8: 'flat prone DOWN alternate' }[s.cell],
    verdict: !s.buttCapVisible ? `FAIL - butt cap not drawn (haft ends blunt at the skirt behind the hand, cell5-butt-zoom; unmeasurable stub)` : inBand(u) ? 'PASS length (identity/anatomy/seams/scale-ground same visual pass as keeps; role fit assessed below)' : `FAIL - weapon length ${u > BAND[1] ? 'OUT_HIGH +' + r2(u - BAND[1]) : 'OUT_LOW -' + r2(BAND[0] - u)}u`,
  }
})
const passCount = keeps.filter(k => k.verdict === 'PASS').length
const measUs = keeps.filter(k => k.weapon.buttCapVisible).map(k => k.weapon.finalU)
const out = {
  work: 'cmr15a-phase3-fall-gates',
  candidateDescription: {
    sheet: { path: 'art/motion/xuchu/closeout-campaign/11-fall/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
    sheetHashReverified: 'aa207ce6c2ac9aca9d6b01ee013e0e6df8957ab2bd39747bdf0af2ec3bc9bafd (Get-FileHash this package; matches candidate.json)',
    reserveCommit: 'a6a2df5 (Xu Chu 21->22, fall 0->1, global 188->189)', candidateCommit: '5099569 (UNREVIEWED)',
    provider: 'gpt-preferred single sheet generation, serving UNCONFIRMED (candidate.json)',
  },
  registration: { method: m.scaleMethod, sheetScale: m.sheetScale, scaleCell: m.scaleCell, scaleBodyNativePx: m.scaleBodyNativePx, proneCrossChecks: m.proneCrossChecks, canvas: m.canvas, groundYCanvas: m.groundYCanvas, determinism: 'build.mjs rerun this package reproduced measure.json byte-identically (SHA-256 c43c34439ff0739e1db8f19ef3b93175b9e506ac52447aed151d3569bd05bbd5 before/after); probe-prone-butt.mjs rerun twice identical (probe-prone-butt.json SHA-256 ae829cc32961c3ce6b37a96fe2ffcd4f5e04a83166abd77a93c0432b8e1b040c); this verdict is a pure function of those two files' },
  methodCorrection: 'The partial build placed prone-cell butt BOXes ~60px left of the actual cap balls (on the legs lying above the haft), so build lengths for cells 4/7/8 (139.63/128.23/101.09u) measured shin/boot-to-tip - the red crosses sit on legs in the marked views, personally opened this package. probe-capgrid.py (10px grids cell{4,7,8}-capgrid10.png, opened) locates the true balls at native ~(641,700)/(658,962)/(1229,975); probe-prone-butt.mjs re-measures cap-to-tip at the same scale: cell4 119.76u, cell7 107.70u, cell8 88.86u (all OUT_LOW). Corrected values govern below. The build retouch on those cells applied 0px, so no final raster is affected. Cell2/cell5 stub lengths in measure.json are likewise contaminated and are used only as stub evidence, not lengths.',
  retouchPolicy: 'deterministic shaft shortening assessed BEFORE length verdicts (changedOutside=0): cell0 145.65->131.87u (53px, in band), cell1 150.17->138.32u (46px applied, deficit 3px to band-hi), cell3 147.64->132.06u (60px, in band), cell6 139.78->136.25u (14px, in band). No lengthening possible for OUT_LOW/stub cells; no parts fabricated.',
  ledgerVerified: m.ledgerVerified,
  ledgerNote: 'Xu Chu 22 (fall 1)/global 189, ceilings 25/192 - verified in build.mjs; zero generation this package',
  keeps, passCount: `${passCount}/5`,
  directionVerdict: 'PASS (directed steps 3.31/20.13/17.04deg and, with the corrected cell4 butt, 12.51deg into DOWN at -13.26deg; all <=60deg). Sequence continuity on the keeps contact: topple -> airborne -> inverted tumble -> legs-up impact -> flat DOWN reads as one coherent fall arc in pose/facing/identity; the continuity break is weapon grip (cells 0/1 ungripped) and cell2 missing cap, not direction. No standing frame is inserted anywhere - cell4 is the genuine terminal DOWN.',
  lengthSpreadCorrectedMeasurableKeeps: { finalUs: measUs, spreadPct: r2((Math.max(...measUs) - Math.min(...measUs)) / (measUs.reduce((s, v) => s + v, 0) / measUs.length) * 100), note: 'reported, not a PASS, while length gates fail; excludes stub cell2 (unmeasurable)' },
  spares,
  substitutionAssessment: {
    cell0Topple: 'NO valid substitution: spare6 passes length (136.25u) but is already ground-contacting recline - inserting it as topple puts ground contact BEFORE the airborne beat and duplicates impact; spare5 is a stub, spares 7/8 are prone DOWN alternates failing length. Cell0 also fails grip in its own right.',
    cell1Airborne: 'NO spare is airborne (all four spares are grounded/prone); no substitution exists.',
    cell2Tumble: 'NO spare reads as mid-air inverted tumble; no substitution exists.',
    cell4Down: 'spare7/spare8 fit the DOWN role family but fail length after correction (107.70/88.86u OUT_LOW, not small); spare5 is propped, not flat, and a stub. No substitution.',
    conclusion: 'only cell3 and spare6 pass length at all, and no coherent all-pass 5-cell topple/airborne/tumble/impact/DOWN set exists on this sheet; nothing banked, no accepted cells',
  },
  verdict: `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created)`,
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name} [${k.finalHash}]: ${k.verdict}; final ${k.weapon.finalU}u vs band [${r2(BAND[0])},${r2(BAND[1])}]u`),
  waiverEligibleExactCells: [
    { cell: 4, name: 'cell4-down', finalHash: '21d08a4fdcb07c733c2f3aa5b55a46d4c31ccc9ab9c285fae3efca617cc9ea3f', finalU: 119.76, deviation: 'OUT_LOW -4.65u', basis: 'fully measurable (cap ball + tip both drawn, corrected probe), ONLY failing gate is this small length deviation; identity/anatomy/DOWN-flat/grip/scale-ground/seams/direction all PASS. FAIL retained, NOT PASS, NOT banked; held for a possible future exact-hash owner waiver only' },
  ],
  notWaiverEligible: 'cell1 (+0.82u, small) is NOT waiver-eligible because it also fails grip (not only-length); cell0 fails grip (length passes, nothing to waive); cell2 stub and spare5 stub are unmeasurable; spares 7/8 deviations (-16.71/-35.55u) are not small',
  postSalvageAccounting: 'INITIAL fall sheet verdict: deterministic salvage exhausted (registration, retouch before verdicts, corrected prone measurement, all 4 spares assessed for substitution) but the one fall FOCUSED FIX is UNSPENT, so per the corrected campaign process this failure does NOT increment the consecutive post-fix unusable count - it stays 0 (reset by the misc bank). A post-fix unusable fall would become #1. No STOP. CMR-15A stays IN_PROGRESS; no getup in this package.',
  focusedFixBrief: {
    eligibility: 'ELIGIBLE (initial sheet failed post-salvage with fix unspent; one reserved focused edit remains under the PHASE-3 grant, ceilings Xu 25/global 192, currently 22/189)',
    namedCells: 'redraw cells 0/1/2/4; PRESERVE cell3-impact exactly (PASS 132.06u, gripped) as the reference keep',
    gripSteer: 'cells 0/1: ONE hand must visibly grip the haft (the other may flail); no floating glaive across the torso',
    capSteer: 'cell2: draw the complete metal butt cap in EMPTY space beyond the grip (this sheet ends the haft blunt at the skirt); on prone cells keep the cap ball clear of the legs so both ends stay measurable (this sheet hid the balls under the shins, corrupting first-pass measurement)',
    lengthSteer: 'cell1 shorten ~2% (it missed band-hi by 3px of retouch availability); cell4 DOWN lengthen the drawn glaive ~+5-8% (native 392px -> ~412-430px at this sheet scale; keep the exact flat prone pose); all cells keep native target ~1.10x prone head-to-boots',
  },
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
console.log('waiverEligible:', out.waiverEligibleExactCells.map(w => w.name + ' ' + w.finalU + 'u').join(', '))
