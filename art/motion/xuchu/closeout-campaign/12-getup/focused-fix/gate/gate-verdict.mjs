// CMR-15A Phase 3 GETUP FOCUSED-FIX gate verdict. Work cmr15a-getup-fix-gate-finish.
// The stale original-sheet copy previously here (pointed at 12-getup/gate/) is replaced
// with a candidate-wise verdict (misc/fall/heavy precedent): best passing source per beat
// across original sheet 9c2102e5 + focused-fix sheet 9ab14bae, role-fit spare substitution
// allowed. Deterministic, zero generation, NO extraction rebuild: every reused output is
// re-hashed against measure.json / original measure.json before use. Bank ONLY a coherent
// 5-cell set with every selected cell passing; otherwise bank nothing and hold only
// fully-measurable SMALL only-length cells waiver-eligible (FAIL retained).
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const D = 'art/motion/xuchu/closeout-campaign/12-getup/'
const F = D + 'focused-fix/', G = F + 'gate/', OG = D + 'gate/'
const shaF = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const om = JSON.parse(readFileSync(OG + 'measure.json', 'utf8'))
const cand = JSON.parse(readFileSync(F + 'candidate.json', 'utf8'))
const BAND = m.frozen.bandU, r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]

// --- hash verification (no rebuild trust) ---
const checks = [
  { what: 'focused-fix candidate-raw.png', expect: cand.candidate.sha256, actual: shaF(F + 'candidate-raw.png') },
  { what: 'focused-fix measure sheetSha256==candidate', expect: cand.candidate.sha256, actual: m.sheetSha256 },
  { what: 'original candidate-raw.png', expect: '9c2102e5f2402935daeb9dfb3ecbcc056d654973f0d76c4c52874193bc6cc1c9', actual: shaF(D + 'candidate-raw.png') },
]
for (const c of [...m.keeps, ...m.spares]) {
  checks.push({ what: 'fix ' + c.name + ' registered', expect: c.registeredHash, actual: shaF(G + 'cells-registered/' + c.name + '-registered.png') })
  if (c.retouch) checks.push({ what: 'fix ' + c.name + ' retouched', expect: c.retouch.retouchedHash, actual: shaF(G + 'cells-registered/' + c.name + '-retouched.png') })
  checks.push({ what: 'fix ' + c.name + ' final', expect: c.finalHash, actual: shaF(G + 'cells-registered/' + c.finalFile) })
}
for (const c of om.keeps) checks.push({ what: 'original ' + c.name + ' final', expect: c.finalHash, actual: shaF(OG + 'cells-registered/' + c.finalFile) })
checks.push({ what: 'selected fall-fix cell4 DOWN (continuity ref)', expect: 'cb0b12c149341e4b90f69e0674ca26f4f7574cd842135f718c5574214ce65e1d', actual: shaF('art/motion/xuchu/closeout-campaign/11-fall/focused-fix/gate/cells-registered/cell4-down-retouched.png') })
checks.push({ what: 'banked walk:0 guard (continuity ref)', expect: '2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450', actual: shaF('art/motion/xuchu/closeout-campaign/05-walk0/alternative/accepted.png') })
const hashVerification = checks.map((c) => ({ ...c, match: c.expect === c.actual }))
if (hashVerification.some((c) => !c.match)) throw new Error('hash mismatch: ' + JSON.stringify(hashVerification.filter((c) => !c.match)))

const ROLE = { 0: 'DOWN flat prone bookend', 1: 'elbow-prop', 2: 'kneel', 3: 'crouch', 4: 'rise-stand to guard' }
const cellGate = (k) => {
  const u = k.finalMeasure.u
  const seamPass = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every((v) => v === 0) && (!k.retouch || k.retouch.outsideProof.changedOutside === 0)
  const lenPass = k.buttCapVisible && inBand(u)
  const groundPass = k.finalMeasure.groundErrU <= 1.5
  return { u, seamPass, lenPass, groundPass, pass: lenPass && seamPass && groundPass }
}
const keeps = m.keeps.map((k) => {
  const g = cellGate(k)
  const dev = g.u < BAND[0] ? `OUT_LOW ${r2(g.u - BAND[0])}u under band-lo` : g.u > BAND[1] ? `OUT_HIGH +${r2(g.u - BAND[1])}u over band-hi` : 'in band'
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash, finalU: g.u, finalPx: r2(k.finalMeasure.pxLen), angleDeg: k.finalMeasure.angDeg, groundErrU: k.finalMeasure.groundErrU, deviation: dev,
    gates: {
      identity: 'PASS (visual this package: keeps/spares contacts + marked cell0/cell1 opened; same helmet/beard/lamellar Xu Chu, glaive+red tassel consistent)',
      anatomy: 'PASS (visual: connected limbs/grips, no extra/fused limbs on contacts)',
      poseRole: `PASS (${ROLE[k.cell]}; DOWN->elbow->kneel->crouch->rise sequence coherent on keeps contact)`,
      weaponGrip: 'PASS (haft gripped every keep; free hand props ground in elbow/kneel/crouch as briefed; butt caps drawn complete on all 9 cells)',
      weaponLength: g.lenPass ? 'PASS' : `FAIL (${dev}; deterministic retouch can only shorten, cannot lengthen an OUT_LOW cell; no fabrication)`,
      scaleGround: g.groundPass ? `PASS (one sheet scale ${r2(m.sheetScale)} from cell4-rise 344->459px; groundErr ${k.finalMeasure.groundErrU}u <=1.5u)` : 'FAIL',
      seams: g.seamPass ? 'PASS (greenPx=0, no canvas-edge alpha)' : 'FAIL',
      head: 'RAW (beard conceals endpoint; batch-end ruling reserved)',
    },
    verdict: g.pass ? 'PASS' : `FAIL - weapon length ${dev} (fix overshot the ~15% shortening; original was OUT_HIGH)`,
  }
})
const SPARE_ROLE = { 5: 'crouch/lean-forward alternate', 6: 'kneel alternate (both knees low, hand to ground)', 7: 'kneel-to-rise alternate (one knee up)', 8: 'rise/guard alternate (standing, leaning)' }
const spares = m.spares.map((s) => { const g = cellGate(s); return { cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash, finalU: g.u, angleDeg: s.finalMeasure.angDeg, groundErrU: s.finalMeasure.groundErrU, roleRead: SPARE_ROLE[s.cell], verdict: g.pass ? 'PASS (length/seams/ground)' : `FAIL - weapon length OUT_LOW ${r2(g.u - BAND[0])}u under band-lo` } })
const origKeeps = om.keeps.map((k) => ({ cell: k.cell, name: k.name, finalHash: k.finalHash, finalU: k.finalMeasure.u, verdict: 'FAIL (original gate.json d96ff4a9: OUT_HIGH after max retouch; cells3/4 waiver-eligible holds recorded there)' }))

// Candidate-wise selection per beat (original + fix keeps + role-fit fix spares).
const spareForBeat = { 2: [6, 7], 3: [5], 4: [8] }
const selection = keeps.map((k) => {
  const cands = [{ src: 'fix keep', name: k.name, hash: k.finalHash, u: k.finalU, pass: k.verdict === 'PASS' },
    { src: 'original keep', name: origKeeps[k.cell].name, hash: origKeeps[k.cell].finalHash, u: origKeeps[k.cell].finalU, pass: false },
    ...(spareForBeat[k.cell] || []).map((sc) => { const s = spares.find((x) => x.cell === sc); return { src: 'fix spare', name: s.name, hash: s.finalHash, u: s.finalU, pass: s.verdict.startsWith('PASS'), role: s.roleRead } })]
  const winner = cands.find((c) => c.pass) || null
  return { beat: k.cell, role: ROLE[k.cell], candidates: cands, selected: winner }
})
const allBeatsPass = selection.every((s) => s.selected)
let accepted = []
if (allBeatsPass) {
  mkdirSync(G + 'accepted', { recursive: true })
  accepted = selection.map((s) => { const src = (s.selected.src === 'original keep' ? OG : G) + 'cells-registered/' + [...m.keeps, ...m.spares, ...om.keeps].find((c) => c.finalHash === s.selected.hash).finalFile; copyFileSync(src, G + 'accepted/' + s.selected.name + '.png'); return { beat: s.beat, name: s.selected.name, acceptedHashVerified: shaF(G + 'accepted/' + s.selected.name + '.png') === s.selected.hash } })
}

// Waiver eligibility: fully measurable, ONLY-length-failing, SMALL deviation, beat has no
// passing source. Fix cell3-crouch -5.02u qualifies (cf. fall -4.65u, combo +5.98u held).
// Fix cell2-kneel -5.81u is waiver-sized but the kneel beat has passing spares 6/7, so it
// is noted, not listed (misc precedent). Cells0/1/4 (-18.57/-21.28/-12.43u) are not small.
const k3 = keeps[3]
const waiverEligible = [{ cell: 3, name: k3.name, finalHash: k3.finalHash, finalU: k3.finalU, deviation: k3.deviation, status: 'WAIVER_ELIGIBLE - FAIL retained, NOT PASS, NOT BANKED; exact hash only, held for a possible future owner ruling (no blanket/transfer)', basis: 'fully measurable (cap ball + tip drawn); identity/anatomy/pose-role/grip/scale-ground/seams PASS; length is the only failing gate; retouch cannot lengthen' }]

const out = {
  work: 'cmr15a-getup-fix-gate-finish (focused-fix gate cmr15a-getup-focused-fix-gates)',
  candidateDescription: { sheet: { path: F + 'candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components }, reserveCommit: cand.reserveCommit, editTargetOriginal: cand.editTargetOriginal.sha256 },
  hashVerification: { allMatch: true, count: hashVerification.length, note: 'fix candidate + measure sheet hash + all 9 fix registered/final cells + original candidate + original 5 keep finals + both continuity references re-hashed this package; NO extraction rebuild (no missing hash/file found)', measureJsonSha256: shaF(G + 'measure.json') },
  registration: { method: m.scaleMethod, sheetScale: m.sheetScale, scaleBodyNativePx: m.scaleBodyNativePx },
  retouchPolicy: 'deterministic shaft retouch assessed before verdicts: ALL 9 fix cells drew complete caps+tips but the fix overshot short - keeps registered 105.84/103.13/118.60/119.39/111.98u are OUT_LOW, and shortening retouch cannot lengthen; no retouch applied (finals = registered cells), nothing fabricated',
  landmarkNote: 'marked cell0-down/cell1-elbow opened this package: tip crosses sit on the true blade tips; the butt crosses sit slightly LEFT of the visible cap balls (haft runs under the prone body), so the recorded lengths OVERSTATE the true butt->tip length - the true values are shorter still and every OUT_LOW verdict is unchanged (conservative direction; no rebuild can cure it)',
  ledgerVerified: m.ledgerVerified,
  keeps, passCount: `${keeps.filter((k) => k.verdict === 'PASS').length}/5`, spares, origKeeps, selection,
  directionSteps: m.directionSteps,
  directionVerdict: 'PASS on fix keeps (shaft-axis steps 5.94/0.77/2.93/8.85deg <=60; sequence reads coherently) - recorded, but the set is not bankable while length fails',
  lengthSpreadKeeps: m.lengthSpreadKeeps, lengthSpreadNote: '14.55% on fix final keep lengths (includes FAIL lengths; reported, not a PASS)',
  continuity: {
    startDownVsSelectedFallCell4: 'pose PASS / weapon FAIL: fix cell0-down reproduces the selected fall-fix cell4 (cb0b12c1...) flat prone pose and ground registration, but its weapon is 105.84u (overstated, see landmarkNote) vs fall cell4 136.03u - frame-to-frame weapon length does NOT match; part of the cell0 FAIL',
    endRiseVsBankedWalk0Guard: 'pose PASS / weapon FAIL: fix cell4-rise ends in the banked walk:0 guard family, but at 111.98u vs guard-band lengths it is not bankable; fix spare8 (126.45u, standing leaning) passes length as a rise alternate yet cannot rescue the set (beats 0/1 have no passing source)',
  },
  substitutionAssessment: 'Candidate-wise across original+fix: DOWN beat - original +23.98u OUT_HIGH, fix -18.57u OUT_LOW, no DOWN spare on either sheet => NO passing source. Elbow beat - original +20.19u, fix -21.28u, no elbow spare => NO passing source. Kneel beat could be served by fix spare6 (135.06u) or spare7 (126.13u), rise by fix spare8 (126.45u), crouch only by waiver-eligible fix cell3 (-5.02u, FAIL retained) - but with beats 0/1 unfilled there is NO coherent all-pass 5-cell set, so nothing is banked',
  verdict: allBeatsPass ? 'PASS - BANKED coherent 5-cell getup set in focused-fix/gate/accepted/; 0 waivers used' : `FAIL - NOT BANKED (0/5 fix keeps pass; beats 0/1 have no passing source on either sheet; no accepted cells created; ${existsSync(G + 'accepted') ? 'accepted/ EXISTS - ERROR' : 'no accepted/ dir'})`,
  failedCriteria: [...keeps.filter((k) => k.verdict !== 'PASS').map((k) => `fix ${k.name} [${k.finalHash}]: ${k.verdict}; final ${k.finalU}u/${k.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u`), ...origKeeps.map((k) => `original ${k.name} [${k.finalHash}]: FAIL OUT_HIGH ${k.finalU}u (original gate)`)],
  waiverEligibleExactCells: waiverEligible,
  notWaiverEligible: 'fix cells0/1/4 deviations -18.57/-21.28/-12.43u are not small; fix cell2 -5.81u and spare5 -5.91u are waiver-sized but their beats already have passing spares / the listed cell3, so no waiver is requested for them; original cells3/4 (+7.00/+1.43u) holds remain as recorded in the original gate.json. No waiver is granted or requested in this package',
  postSalvageAccounting: 'Getup deterministic salvage AND its ONE focused fix are both exhausted without a coherent bankable set => getup counts consecutive post-fix unusable #2 after fall #1 => CAMPAIGN STOP (grant rule: STOP at 2). Ledger unchanged, already at ceilings Xu 25 (getup 2)/global 192 (25/192 fully spent - no further request could be reserved in any case); zero generation; no pack/15B. CMR-15A BLOCKED WAITING_FOR_OWNER; any getup banking now needs an owner decision (e.g. exact-hash waivers and/or new funding) - none is taken here.',
  banked: allBeatsPass, accepted,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict); console.log('hashes', hashVerification.length, 'all match')
for (const f of out.failedCriteria) console.log(' -', f)
console.log('waiverEligible:', waiverEligible.map((w) => w.name + ' ' + w.deviation).join('; '))
console.log('selection:', selection.map((s) => s.role + '=' + (s.selected ? s.selected.name + ' ' + s.selected.u + 'u PASS' : 'NONE')).join(' | '))
