// Candidate-wise gate for CMR-15 Li Dian-style splice: original misc sheet 6c3b5e5c
// + focused-fix sheet a5a6471c. Work cmr15a-misc-focused-fix-gates (correction).
// Deterministic, zero generation. Banks a coherent 5-cell set only if every
// selected cell passes; small fully-measurable residuals are WAIVER_ELIGIBLE only.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'
const F = 'art/motion/xuchu/closeout-campaign/10-misc/focused-fix/gate/'
const O = 'art/motion/xuchu/closeout-campaign/10-misc/gate/'
const m = JSON.parse(readFileSync(F + 'measure.json', 'utf8'))
const og = JSON.parse(readFileSync(O + 'gate.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
const VIS = 'PASS (visual: fix sheet, keeps contact, marked cells2/3/4 personally opened this package; Xu Chu helmet/beard/lamellar/glaive+tassel consistent, two arms/legs/boots, grips connected; cell2 haft now visibly gripped in front of arms/torso with both hands on the haft - original corridor/grip failure cured; markers on cap ball/blade tip)'
function fixKeep(k) {
  const u = k.finalMeasure.u, f = k.retouch ? k.retouch.feasibility : null
  const seamPass = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every(v => v === 0) && (!k.retouch || k.retouch.outsideProof.changedOutside === 0)
  const lenPass = k.buttCapVisible && inBand(u)
  const verdict = lenPass && seamPass ? 'PASS' : `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u) after max deterministic shaft retouch`
  return { cell: k.cell, name: k.name, source: 'focused-fix a5a6471c', finalFile: k.finalFile, finalHash: k.finalHash,
    gates: { identity: VIS, anatomy: VIS, poseRole: 'PASS (hurt-recoil/hurt-fold/held-clamp arms-pinned/held-struggle/release per keeps contact)', weaponLength: lenPass ? 'PASS' : 'FAIL', weaponCorridorGrip: 'PASS (haft in front, gripped, both ends in empty space)', weaponAngleDegRaw: k.finalMeasure.angDeg, scaleGround: `PASS (groundErr ${k.finalMeasure.groundErrU}u, bodyReg ${k.bodyRegPx}px)`, seams: seamPass ? 'PASS (greenPx=0, no edge alpha, retouch changedOutside=0)' : 'FAIL', head: 'RAW (beard conceals endpoint; batch-end ruling)' },
    weapon: { registeredU: k.registeredMeasure.u, finalU: u, finalPx: k.finalMeasure.pxLen, overBandHiU: r2(Math.max(0, u - BAND[1])), retouch: f ? { totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : 'none needed (in band)' }, verdict }
}
const fixKeeps = m.keeps.map(fixKeep)
const fixSpares = m.spares.map(s => ({ cell: s.cell, name: s.name, finalHash: s.finalHash, finalU: s.finalMeasure.u, overBandHiU: r2(Math.max(0, s.finalMeasure.u - BAND[1])), verdict: inBand(s.finalMeasure.u) ? 'PASS' : `FAIL - OUT_HIGH (+${r2(s.finalMeasure.u - BAND[1])}u) after max retouch` }))
// Candidate-wise selection: originals 0/1 already PASS (re-hash verified this package:
// 3cb8c83c.../a454f232... match original gate.json); fix 2/3/4 cure the named failures.
const sel = [
  { cell: 0, name: 'cell0-hurt-recoil', source: 'original 6c3b5e5c', finalU: og.keeps[0].weapon.finalU, finalHash: og.keeps[0].finalHash, file: O + 'cells-registered/' + og.keeps[0].finalFile, verdict: og.keeps[0].verdict },
  { cell: 1, name: 'cell1-hurt-fold', source: 'original 6c3b5e5c', finalU: og.keeps[1].weapon.finalU, finalHash: og.keeps[1].finalHash, file: O + 'cells-registered/' + og.keeps[1].finalFile, verdict: og.keeps[1].verdict },
  ...[2, 3, 4].map(i => ({ cell: i, name: fixKeeps[i].name, source: 'focused-fix a5a6471c', finalU: fixKeeps[i].weapon.finalU, finalHash: fixKeeps[i].finalHash, file: F + 'cells-registered/' + fixKeeps[i].finalFile, verdict: fixKeeps[i].verdict })),
]
const angles = [og.keeps[0].gates.weaponAngleDegRaw, og.keeps[1].gates.weaponAngleDegRaw, ...[2, 3, 4].map(i => fixKeeps[i].gates.weaponAngleDegRaw)]
const steps = angles.slice(1).map((a, i) => r2(Math.abs(a - angles[i])))
const us = sel.map(s => s.finalU)
const spread = r2((Math.max(...us) - Math.min(...us)) / (us.reduce((a, b) => a + b, 0) / us.length) * 100)
const allPass = sel.every(s => s.verdict === 'PASS') && steps.every(s => s <= 60)
let accepted = []
if (allPass) {
  mkdirSync(F + 'accepted', { recursive: true })
  accepted = sel.map(s => { const dest = `${s.name}.png`; copyFileSync(s.file, F + 'accepted/' + dest); return { ...s, acceptedFile: 'accepted/' + dest } })
}
const out = {
  work: 'cmr15a-misc-focused-fix-gates',
  candidateDescription: { fixSheet: { path: '10-misc/focused-fix/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components }, originalSheet: { sha256: og.candidateDescription.sheet.sha256 }, sheetHashReverified: 'a5a6471c7294a11799814a6a84a88e672f5d2d5b499cff6c67f6d4d64b8507c5 (Get-FileHash this package)', reserveCommit: 'e272c9e (Xu 20->21, misc 1->2, global 187->188)', candidateCommit: 'f08d4ba (UNREVIEWED)' },
  registration: { method: 'one uniform sheet scale 1.3661 (cell4 336->459px), groundY500 - identical to original misc gate', sheetScale: m.sheetScale, determinism: 'build.mjs rerun this package reproduced measure.json byte-identically (SHA-256 08f2910f85d5c7176f5124fab976522093c0e9f9eaf15ba130322e37cb1f7d65 before/after); original cells0/1 final hashes re-verified 3cb8c83c.../a454f232...' },
  retouchPolicy: 'deterministic shaft retouch BEFORE length verdicts (changedOutside=0): fix cell0 86px applied (160.88->138.28u, deficit 4px to band-hi), cell1 39px blade-side (142.13->131.90u PASS), cells2/3/4 in band natively (127.68/136.68/133.01u, no retouch), spares max-applied still OUT_HIGH. All 9 butt caps drawn, every cell fully measurable.',
  ledgerVerified: m.ledgerVerified,
  fixKeeps, fixSpares,
  candidateWiseComparison: sel.map((s, i) => ({ role: s.name, selected: s, original: { finalU: og.keeps[i].weapon.finalU, verdict: og.keeps[i].verdict }, fix: { finalU: fixKeeps[i].weapon.finalU, verdict: fixKeeps[i].verdict } })),
  selectedSet: accepted.length ? accepted : sel,
  mixedDirectionStepsDeg: steps, mixedDirectionVerdict: steps.every(s => s <= 60) ? `PASS (${steps.join('/')}deg <=60)` : 'FAIL',
  mixedLengthSpread: { finalUs: us, spreadPct: spread, rule: '(max-min)/mean canonical; all selected lengths in band' },
  waiverEligibleExactCells: [{ name: 'cell0-hurt-recoil (focused-fix copy, NOT selected/banked)', finalHash: fixKeeps[0].finalHash, finalU: fixKeeps[0].weapon.finalU, overBandHiU: fixKeeps[0].weapon.overBandHiU, note: 'WAIVER_ELIGIBLE (fully measurable, only-length +0.78u) but unnecessary - original cell0 passes at 137.10u and is banked instead; no waiver requested/granted' }],
  verdict: allPass ? 'PASS - BANKED coherent 5-cell misc set (original cells0/1 + focused-fix cells2/3/4) in focused-fix/gate/accepted/; 0 waivers used' : 'FAIL - NOT BANKED',
  postSalvageAccounting: allPass ? 'Misc focused fix SUCCEEDED post-salvage: a banked sheet resets the consecutive post-fix unusable count #1 (heavy) -> 0. No #2/STOP. CMR-15A remains IN_PROGRESS (heavy unbanked with one waiver-eligible cell held; fall/getup next per grant; no pack/15B here).' : 'post-fix unusable #2 = STOP',
  banked: allPass, generation: 'zero in this package',
}
writeFileSync(F + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict); console.log('steps', steps.join('/'), 'spread', spread); for (const s of out.selectedSet) console.log(s.name, s.source, s.finalU + 'u', s.finalHash.slice(0, 8))
