// Candidate-wise gate verdict for CMR-15A fall: original sheet aa207ce6
// (11-fall/gate/gate.json, corrected prone values govern) + focused-fix sheet
// 44eb667d (this dir measure.json). Work cmr15a-fall-fix-gate-finish.
// Deterministic, zero generation, no extraction rebuild: verifies candidate +
// every registered/retouched/final hash against measure.json, then selects the
// best source per role. Banks byte copies ONLY if the coherent selected 5 all
// pass; otherwise records exact waiver-eligible cells and banks nothing.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
const F = 'art/motion/xuchu/closeout-campaign/11-fall/focused-fix/'
const G = F + 'gate/'
const O = 'art/motion/xuchu/closeout-campaign/11-fall/'
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const og = JSON.parse(readFileSync(O + 'gate/gate.json', 'utf8'))
const probe = JSON.parse(readFileSync(G + 'probe-prone-butt.json', 'utf8'))
const BAND = m.frozen.bandU, r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]

// --- hash verification (no rebuild) ---
const checks = [{ what: 'focused-fix candidate-raw.png', expect: '44eb667de76a123393c9a7286c819ebc6c3ef263ab697eb7503108cf6e0aaf2a', actual: sha(F + 'candidate-raw.png') }]
for (const c of [...m.keeps, ...m.spares]) {
  checks.push({ what: c.name + ' registered', expect: c.registeredHash, actual: sha(G + 'cells-registered/' + c.name + '-registered.png') })
  if (c.retouch) checks.push({ what: c.name + ' retouched', expect: c.retouch.retouchedHash, actual: sha(G + 'cells-registered/' + c.name + '-retouched.png') })
  checks.push({ what: c.name + ' final', expect: c.finalHash, actual: sha(G + 'cells-registered/' + c.finalFile) })
}
for (const k of og.keeps) checks.push({ what: 'original ' + k.name + ' final', expect: k.finalHash, actual: sha(O + 'gate/cells-registered/' + k.finalFile) })
const hashVerification = checks.map((c) => ({ ...c, match: c.expect === c.actual }))
if (hashVerification.some((c) => !c.match)) throw new Error('hash mismatch: ' + JSON.stringify(hashVerification.filter((c) => !c.match)))

const VIS = 'PASS (visual this package: fix sheet, keeps-sequence + spares contacts, marked cells0-4 opened; Xu Chu helmet/beard/lamellar/glaive+tassel consistent, connected anatomy, butt/tip markers on the true cap balls/blade tips)'
const GRIP = {
  0: 'PASS - BOTH hands visibly wrapped on the haft in front of the torso (original floating-glaive grip FAIL cured)',
  1: 'PASS - BOTH hands visibly wrapped on the haft (original floating-glaive grip FAIL cured)',
  2: 'PASS - haft visibly gripped one-handed while inverted, complete round butt cap now drawn in empty space left of the boots (original blunt stub cured)',
  3: 'PASS - haft visibly gripped two-handed, legs-up impact (fix copy; original also PASS)',
  4: 'PASS - folded arm grips the haft alongside the flat prone body; cap ball drawn clear at the ground line, marker on the ball (prone probe agrees, see proneCrossCheck)',
}
function fixKeep(k) {
  const u = k.finalMeasure.u, f = k.retouch ? k.retouch.feasibility : null
  const seamPass = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every((v) => v === 0) && (!k.retouch || k.retouch.outsideProof.changedOutside === 0)
  const lenPass = k.buttCapVisible && inBand(u)
  const groundPass = k.finalMeasure.groundErrU <= 1.5
  const verdict = lenPass && seamPass && groundPass ? 'PASS' : `FAIL - weapon length ${u > BAND[1] ? 'OUT_HIGH (+' + r2(u - BAND[1]) + 'u)' : 'OUT_LOW (-' + r2(BAND[0] - u) + 'u)'} after max deterministic shaft retouch (avail ${f ? f.totalAvailPx : 0}px vs ${f ? f.removeToBandHiPx : 0}px to band-hi)`
  return {
    cell: k.cell, name: k.name, source: 'focused-fix 44eb667d', finalFile: k.finalFile, finalHash: k.finalHash,
    gates: { identity: VIS, anatomy: VIS, poseRole: 'PASS (topple tipping back / airborne twisting / inverted tumble / legs-up impact / DOWN flat prone - one coherent fall arc on the keeps contact)', downFlatGrounded: k.cell === 4 ? 'PASS (genuinely flat prone face-down bookend, legs extended, aspectWH ' + k.finalMeasure.aspectWH + ', no kneeling/propping)' : 'n/a', weaponLength: lenPass ? 'PASS' : 'FAIL', weaponGrip: GRIP[k.cell], weaponAngleDegRaw: k.finalMeasure.angDeg, scaleGround: groundPass ? `PASS (one sheet scale ${r2(m.sheetScale)} from cell4 prone 394px=459px; groundErr ${k.finalMeasure.groundErrU}u <=1.5u)` : 'FAIL', seams: seamPass ? 'PASS (greenPx=0, no edge alpha, changedOutside=0)' : 'FAIL', head: 'RAW (beard conceals endpoint; batch-end ruling)' },
    weapon: { buttCapVisible: k.buttCapVisible, registeredU: k.registeredMeasure.u, finalU: u, finalPx: k.finalMeasure.pxLen, overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)), retouch: f ? { totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : 'none' },
    verdict,
  }
}
const fixKeeps = m.keeps.map(fixKeep)
const SPARE_ROLE = { 5: 'prone dive propped on arms, head raised - not topple/airborne/tumble, not flat DOWN', 6: 'grounded recline on back/side, gripped - impact-family, duplicates cell3 beat', 7: 'prone DOWN alternate (legs bent)', 8: 'flat prone DOWN alternate' }
const fixSpares = m.spares.map((s) => ({ cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash, finalU: s.finalMeasure.u, overBandHiU: r2(Math.max(0, s.finalMeasure.u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - s.finalMeasure.u)), angleDeg: s.finalMeasure.angDeg, groundErrU: s.finalMeasure.groundErrU, roleRead: SPARE_ROLE[s.cell], verdict: inBand(s.finalMeasure.u) ? 'PASS length' : `FAIL - weapon length ${s.finalMeasure.u > BAND[1] ? 'OUT_HIGH +' + r2(s.finalMeasure.u - BAND[1]) : 'OUT_LOW -' + r2(BAND[0] - s.finalMeasure.u)}u after max retouch` }))

// Candidate-wise selection (best passing source per role; original gate verdicts
// are the corrected ones from 11-fall/gate/gate.json):
// cell0: original length PASS but grip FAIL; fix grip PASS but length +0.69u -> no passing source, fix selected as best (waiver-eligible)
// cell1/cell2/cell4: fix cures the named original failures -> fix
// cell3: BOTH pass; original retained (brief: preserve cell3 exactly as reference keep)
const selSpec = [
  { i: 0, src: 'fix', why: 'no passing source: original 131.87u grip FAIL, fix grip PASS but 138.19u +0.69u only-length FAIL' },
  { i: 1, src: 'fix', why: 'fix cures original grip FAIL + 138.32u length FAIL (131.91u PASS)' },
  { i: 2, src: 'fix', why: 'fix draws the complete butt cap (original unmeasurable stub) at 132.24u PASS' },
  { i: 3, src: 'orig', why: 'both PASS (original 132.06u / fix 132.17u); original retained per brief preserve-cell3 rule' },
  { i: 4, src: 'fix', why: 'fix lengthens DOWN into band 136.03u PASS (prone probe ~134.1u after the same 21px blade cut, agreeing in-band); original 119.76u only-length FAIL superseded, not selected' },
]
const selected = selSpec.map(({ i, src, why }) => src === 'fix'
  ? { cell: i, name: fixKeeps[i].name, source: fixKeeps[i].source, finalFile: fixKeeps[i].finalFile, finalHash: fixKeeps[i].finalHash, finalU: fixKeeps[i].weapon.finalU, angleDeg: fixKeeps[i].gates.weaponAngleDegRaw, verdict: fixKeeps[i].verdict, file: G + 'cells-registered/' + fixKeeps[i].finalFile, selectionBasis: why }
  : { cell: i, name: og.keeps[i].name, source: 'original aa207ce6', finalFile: og.keeps[i].finalFile, finalHash: og.keeps[i].finalHash, finalU: og.keeps[i].weapon.finalU, angleDeg: og.keeps[i].gates.weaponAngleDegRaw, verdict: og.keeps[i].verdict, file: O + 'gate/cells-registered/' + og.keeps[i].finalFile, selectionBasis: why })
const steps = selected.slice(1).map((s, i) => r2(Math.abs(s.angleDeg - selected[i].angleDeg)))
const us = selected.map((s) => s.finalU)
const spread = r2(((Math.max(...us) - Math.min(...us)) / (us.reduce((a, b) => a + b, 0) / us.length)) * 100)
const allPass = selected.every((s) => s.verdict === 'PASS') && steps.every((s) => s <= 60)
let accepted = []
if (allPass) { mkdirSync(G + 'accepted', { recursive: true }); accepted = selected.map((s) => { copyFileSync(s.file, G + 'accepted/' + s.name + '.png'); return { ...s, acceptedFile: 'accepted/' + s.name + '.png', acceptedHashVerified: sha(G + 'accepted/' + s.name + '.png') === s.finalHash } }) }

const out = {
  work: 'cmr15a-fall-fix-gate-finish',
  candidateDescription: { fixSheet: { path: F + 'candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components, hashReverifiedThisPackage: true }, originalSheet: { sha256: og.candidateDescription.sheet.sha256 }, reserveCommit: '01e3f6f (Xu 22->23, fall 1->2, global 189->190)', candidateCommit: '2ac243e (UNREVIEWED)' },
  hashVerification: { allMatch: true, count: hashVerification.length, note: 'candidate + all 9 fix registered/retouched/final + original 5 keep finals re-hashed this package against measure.json / original gate.json; no extraction rebuild was needed or run', measureJsonSha256: 'f61148999326430f714dda488b8f3a7ed2861efe72871c6797e9af4002163b22' },
  registration: { method: m.scaleMethod, sheetScale: m.sheetScale, scaleBodyNativePx: m.scaleBodyNativePx, proneCrossChecks: m.proneCrossChecks },
  proneCrossCheck: `probe-prone-butt.json (tight cap boxes): cell4 probe 139.56u vs build 141.58u pre-retouch - after the same 21px blade cut the probe value is ~134.1u, agreeing with the build final 136.03u that the DOWN weapon is IN band; spares7/8 probe ${probe.cells['cell7-spare-fall-c'].u}/${probe.cells['cell8-spare-fall-d'].u}u agree OUT_LOW with build finals 114.41/89.78u. Markers verified on the true cap balls this package (original-sheet shin-contamination does not recur).`,
  retouchPolicy: 'deterministic shaft shortening BEFORE verdicts (changedOutside=0 all cells): cell0 149.25->138.19u (42px applied = max avail, 4px short of band-hi), cell1 137.98->131.91u, cell2 138.86->132.24u, cell3 146.58->132.17u, cell4 141.58->136.03u, spare6 141.37->139.23u (8px = max avail); spares5/7/8 OUT_LOW, shortening cannot lengthen. No parts fabricated.',
  ledgerVerified: m.ledgerVerified,
  fixKeeps, fixSpares,
  candidateWiseComparison: selected.map((s, i) => ({ role: s.name, selectedSource: s.source, selectionBasis: s.selectionBasis, original: { finalU: og.keeps[i].weapon.finalU, finalHash: og.keeps[i].finalHash, verdict: og.keeps[i].verdict }, fix: { finalU: fixKeeps[i].weapon.finalU, finalHash: fixKeeps[i].finalHash, verdict: fixKeeps[i].verdict } })),
  selectedSet: allPass ? accepted : selected,
  mixedDirectionStepsDeg: steps,
  mixedDirectionVerdict: steps.every((s) => s <= 60) ? `PASS (${steps.join('/')}deg <=60; topple->airborne->tumble->impact->flat DOWN reads as one coherent fall arc, DOWN terminal)` : 'FAIL',
  mixedLengthSpread: { finalUs: us, spreadPct: spread, rule: '(max-min)/mean canonical; reported, not a PASS, while a length gate fails' },
  substitutionAssessment: 'No spare from either sheet fits the uncovered topple beat: fix spares all fail length (121.14 -3.27u propped prone / 139.23 +1.73u grounded recline duplicating impact / 114.41u / 89.78u DOWN alternates) and original spares are stub/recline/DOWN-family (original gate). No coherent all-pass 5-cell set exists.',
  waiverEligibleExactCells: [{ cell: 0, name: 'cell0-topple', source: 'focused-fix 44eb667d', finalHash: fixKeeps[0].finalHash, finalU: fixKeeps[0].weapon.finalU, deviation: 'OUT_HIGH +0.69u', basis: 'fully measurable (cap+tip drawn, markers verified), ONLY failing gate is this small length deviation after max retouch (42px avail vs 46px to band-hi); identity/anatomy/pose-role/grip/scale-ground 0.26u/seams/direction all PASS. FAIL retained, NOT PASS, NOT banked; held for a possible future exact-hash owner waiver only, no blanket/transfer' }],
  notWaiverEligible: 'fix spare6 (+1.73u, small) is a grounded recline duplicating the impact beat, not the topple role; fix spare5 (-3.27u) is propped prone, not flat DOWN/topple; spares7/8 deviations are not small. The original cell4-DOWN waiver-eligible hold (21d08a4f..., 119.76u) is superseded - the fix DOWN passes in band and is selected, so no waiver is needed or requested for it; it remains unbanked as an unselected candidate.',
  failedCriteria: selected.filter((s) => s.verdict !== 'PASS').map((s) => `${s.name} [${s.finalHash}] (${s.source}): ${s.verdict}; final ${s.finalU}u vs band [124.41,137.50]u`),
  verdict: allPass ? 'PASS - BANKED coherent 5-cell fall set in focused-fix/gate/accepted/ (byte copies); 0 waivers used' : 'FAIL - NOT BANKED (4/5 selected roles pass; cell0-topple has no passing source; no accepted cells created)',
  postFixAccounting: allPass ? 'banked sheet resets consecutive post-fix unusable count to 0' : 'Fall deterministic salvage AND its ONE authorized focused fix are now both exhausted, so under the corrected campaign process fall counts as consecutive post-fix unusable #1 (prospective count 0->1, reset by the misc bank; heavy remains an earlier unresolved #1-era source superseded by that reset). STOP at 2 NOT reached. CMR-15A stays IN_PROGRESS; next per grant = getup in a later package; no pack/15B here.',
  banked: allPass,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict); console.log('hashes', hashVerification.length, 'all match; steps', steps.join('/'), 'spread', spread)
for (const s of selected) console.log(s.name, s.source, s.finalU + 'u', s.finalHash.slice(0, 8), s.verdict === 'PASS' ? 'PASS' : 'FAIL')
