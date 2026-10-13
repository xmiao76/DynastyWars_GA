// Derives gate.json from measure.json for the CMR-15A Phase 3 GETUP initial
// sheet 9c2102e5. Work cmr15a-phase3-getup-gates (correction of timed-out
// worker: partial build.mjs/measure.json/outputs reused hash-verified, build
// rerun byte-identical FCCBC3D3...; this stale fall-copy verdict replaced).
// Deterministic, zero generation. Bank ONLY a coherent 5-cell set with every
// cell passing (keeps, or role-fit spare substitutions); otherwise bank
// nothing and hold only fully-measurable SMALL only-length cells waiver-
// eligible (FAIL retained). Initial-sheet failure with the one focused fix
// unspent does NOT increment the consecutive post-fix unusable count.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const D = 'art/motion/xuchu/closeout-campaign/12-getup/'
const G = D + 'gate/'
const shaF = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU, r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]

// --- hash verification of reused partial outputs (no rebuild trust) ---
const checks = [{ what: 'candidate-raw.png', expect: '9c2102e5f2402935daeb9dfb3ecbcc056d654973f0d76c4c52874193bc6cc1c9', actual: shaF(D + 'candidate-raw.png') }]
for (const c of [...m.keeps, ...m.spares]) {
  checks.push({ what: c.name + ' registered', expect: c.registeredHash, actual: shaF(G + 'cells-registered/' + c.name + '-registered.png') })
  if (c.retouch) checks.push({ what: c.name + ' retouched', expect: c.retouch.retouchedHash, actual: shaF(G + 'cells-registered/' + c.name + '-retouched.png') })
  checks.push({ what: c.name + ' final', expect: c.finalHash, actual: shaF(G + 'cells-registered/' + c.finalFile) })
}
// continuity references re-hashed
checks.push({ what: 'selected fall-fix cell4 DOWN (continuity ref)', expect: 'cb0b12c149341e4b90f69e0674ca26f4f7574cd842135f718c5574214ce65e1d', actual: shaF('art/motion/xuchu/closeout-campaign/11-fall/focused-fix/gate/cells-registered/cell4-down-retouched.png') })
checks.push({ what: 'banked walk:0 guard (continuity ref)', expect: '2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450', actual: shaF('art/motion/xuchu/closeout-campaign/05-walk0/alternative/accepted.png') })
const hashVerification = checks.map((c) => ({ ...c, match: c.expect === c.actual }))
if (hashVerification.some((c) => !c.match)) throw new Error('hash mismatch: ' + JSON.stringify(hashVerification.filter((c) => !c.match)))

const ROLE = { 0: 'DOWN flat prone bookend (legs extended, face down, glaive along ground)', 1: 'elbow-prop (chest lifting on forearms)', 2: 'kneel (one knee down, free hand on ground, rising)', 3: 'crouch (both feet planted, low, one hand ground)', 4: 'rise-stand to two-handed guard' }
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null, u = k.finalMeasure.u
  const seamPass = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every((v) => v === 0) && (!k.retouch || k.retouch.outsideProof.changedOutside === 0)
  const lenPass = k.buttCapVisible && inBand(u)
  const groundPass = k.finalMeasure.groundErrU <= 1.5
  const verdict = lenPass && seamPass && groundPass ? 'PASS'
    : `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch (avail ${f ? f.totalAvailPx : 0}px vs ${f ? f.removeToBandHiPx : 0}px to band-hi)`
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual this package: raw sheet, keeps/spares contacts, marked cell0/cell4 opened; Xu Chu helmet/beard/lamellar/glaive+red tassel consistent; butt/tip markers on true cap balls/blade tips)',
      anatomy: 'PASS (visual: connected head/arms/legs/boots, no fused or extra limbs across keeps contact + raw sheet)',
      poseRole: `PASS (${ROLE[k.cell]})`, weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponGrip: 'PASS (haft visibly gripped in every keep; the free hand props on the ground in elbow/kneel/crouch as briefed; butt caps drawn complete behind the rear grip on all 9 cells)',
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: groundPass ? `PASS (one sheet scale ${r2(m.sheetScale)} from cell4-rise crown->sole=459px; groundErr ${k.finalMeasure.groundErrU}u <=1.5u)` : 'FAIL',
      seams: seamPass ? 'PASS (greenPx=0, no canvas-edge alpha, retouch changedOutside=0)' : 'FAIL',
      head: 'RAW (beard conceals endpoint; batch-end ruling reserved)',
    },
    weapon: { buttCapVisible: k.buttCapVisible, registeredU: k.registeredMeasure.u, finalU: u, finalPx: k.finalMeasure.pxLen, overBandHiU: r2(Math.max(0, u - BAND[1])), retouch: f ? { totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, changedOutside: k.retouch.outsideProof.changedOutside } : 'none' },
    verdict,
  }
})
const SPARE_ROLE = { 5: 'crouch/lean-forward alternate (near crouch beat)', 6: 'kneel alternate (both knees low, hand to ground)', 7: 'kneel-to-rise alternate (one knee up)', 8: 'rise/guard alternate (standing, leaning)' }
const spares = m.spares.map((s) => ({
  cell: s.cell, name: s.name, finalFile: s.finalFile, finalHash: s.finalHash, finalU: s.finalMeasure.u,
  overBandHiU: r2(Math.max(0, s.finalMeasure.u - BAND[1])), angleDeg: s.finalMeasure.angDeg, groundErrU: s.finalMeasure.groundErrU,
  roleRead: SPARE_ROLE[s.cell],
  verdict: inBand(s.finalMeasure.u) ? 'PASS length' : `FAIL - weapon length OUT_HIGH +${r2(s.finalMeasure.u - BAND[1])}u after max deterministic shaft retouch (avail ${s.retouch ? s.retouch.feasibility.totalAvailPx : 0}px vs ${s.retouch ? s.retouch.feasibility.removeToBandHiPx : 0}px to band-hi)`,
}))
const passCount = keeps.filter((k) => k.verdict === 'PASS').length
const allPass = passCount === 5
let accepted = []
if (allPass) { mkdirSync(G + 'accepted', { recursive: true }); accepted = keeps.map((k) => { copyFileSync(G + 'cells-registered/' + k.finalFile, G + 'accepted/' + k.name + '.png'); return { name: k.name, acceptedHashVerified: shaF(G + 'accepted/' + k.name + '.png') === k.finalHash } }) }

// Waiver eligibility (campaign rule): fully measurable (cap+tip drawn) cells
// whose ONLY failing gate is a SMALL residual length deviation. Precedents
// held eligible: +7.72u heavy fix, +5.98/+3.46u combo fix, -4.65u fall orig.
// Here: cell3-crouch +7.00u and cell4-rise +1.43u qualify; cells0/1/2
// (+23.98/+20.19/+17.63u) are not small. Spare8 (+4.76u) is waiver-SIZED but
// only alternates the rise beat, so it is noted, not listed (misc precedent).
const waiverEligible = keeps.filter((k) => [3, 4].includes(k.cell)).map((k) => ({ cell: k.cell, name: k.name, finalHash: k.finalHash, finalU: k.weapon.finalU, deviation: `OUT_HIGH +${k.weapon.overBandHiU}u`, status: 'WAIVER_ELIGIBLE - FAIL retained, NOT PASS, NOT BANKED; exact hash only, held for a possible future owner ruling (no blanket/transfer)', basis: 'fully measurable (cap ball + tip drawn, markers verified); identity/anatomy/pose-role/grip/scale-ground/seams/direction all PASS - length is the only failing gate after max retouch' }))

const out = {
  work: 'cmr15a-phase3-getup-gates',
  candidateDescription: { sheet: { path: D + 'candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components }, reserveCommit: '3513439 (Xu 23->24, getup 0->1, global 190->191)', candidateCommit: '735c22d (UNREVIEWED)' },
  hashVerification: { allMatch: true, count: hashVerification.length, note: 'candidate + all 9 registered/retouched/final cells + both continuity references re-hashed this package against measure.json/candidate.json', measureJsonSha256: 'fccbc3d3af20a93e89002c0645a9ae1be79decae517ce04eb3312292ac64bb12', buildRerun: 'build.mjs rerun this package reproduced measure.json byte-identically (same SHA-256 before/after)' },
  registration: { method: m.scaleMethod, sheetScale: m.sheetScale, scaleBodyNativePx: m.scaleBodyNativePx },
  retouchPolicy: 'deterministic shaft shortening attempted BEFORE every length verdict (changedOutside=0 all cells): cell0 163.58->161.48u (8px), cell3 151.94->144.50u (29px), cell4 149.46->138.93u (40px), cell5 14px, cell6 44px, cell8 28px; cells1/2/7 have 0px method-clean avail (haft across body/grip to socket). No lengthening, no fabricated parts; all 9 butt caps drawn so every cell is fully measurable.',
  ledgerVerified: m.ledgerVerified,
  keeps, passCount: `${passCount}/5`, spares,
  directionSteps: m.directionSteps,
  directionVerdict: 'PASS (shaft-axis steps 5.28/1.97/4.49/8.68deg <=60; DOWN->elbow->kneel->crouch->rise reads as one coherent getting-up sequence on the keeps contact)',
  lengthSpreadKeeps: m.lengthSpreadKeeps, lengthSpreadNote: '14.88% on final keep lengths (includes FAIL lengths; reported, not a PASS, while length gates fail)',
  continuity: {
    startDownVsSelectedFallCell4: 'PASS pose/identity/ground (visual, both opened this package): getup cell0-down reproduces the selected fall-fix cell4 (cb0b12c1...) flat prone face-down pose, same facing, legs extended, glaive gripped along the ground line, same ground registration (same 1024x768 canvas method). NOT bankable joint continuity: cell0 weapon is 161.48u vs fall cell4 136.03u, so the exact frame-to-frame weapon length does NOT match - recorded as part of the cell0 length FAIL, curable only by the focused fix redraw at in-band length.',
    endRiseVsBankedWalk0Guard: 'PASS pose family (visual, both opened this package): getup cell4-rise ends upright in the banked walk:0 two-handed diagonal guard family (wide stance, front hand at socket, butt behind rear hand); terminal guard continuity is coherent. Cell4 itself is +1.43u OUT_HIGH (waiver-eligible below), so it is not banked here.',
  },
  substitutionAssessment: 'No spare passes length (148.65/145.26/147.61/142.26u after max retouch), so no spare can substitute any keep regardless of role fit (roles read: crouch/kneel/kneel-rise/rise alternates). No coherent all-pass 5-cell set exists on this sheet; nothing banked.',
  verdict: allPass ? 'PASS - BANKED coherent 5-cell getup set in gate/accepted/; 0 waivers used' : `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created; ${existsSync(G + 'accepted') ? 'accepted/ EXISTS - ERROR' : 'no accepted/ dir'})`,
  failedCriteria: keeps.filter((k) => k.verdict !== 'PASS').map((k) => `${k.name} [${k.finalHash}]: ${k.verdict}; final ${k.weapon.finalU}u/${k.weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u`),
  waiverEligibleExactCells: waiverEligible,
  notWaiverEligible: 'cells0/1/2 deviations +23.98/+20.19/+17.63u are not small; spares5/6/7 +11.15/+7.76/+10.11u are not small and spare8 +4.76u (a143e13c...) is waiver-sized but only alternates the rise beat already covered by waiver-eligible cell4 - no waiver requested for any spare. No waiver is granted or requested in this package; the focused fix is the next step and waivers are a batch-end owner ruling only.',
  postSalvageAccounting: 'INITIAL getup sheet: deterministic registration + max shaft retouch + full spare substitution exhausted without any in-band cell, but getup\'s ONE focused fix is UNSPENT, so under the corrected campaign process this does NOT increment the consecutive post-fix unusable count - it REMAINS at fall #1 (STOP at 2 not reached). Only a post-fix unusable getup would become #2 = STOP. CMR-15A stays IN_PROGRESS; ledger unchanged Xu 24 (getup 1)/global 191, ceilings 25/192; zero generation; no pack/15B.',
  focusedFixBrief: {
    namedCells: 'redraw ALL FIVE keeps shorter (no keep passes to preserve; carry this sheet as pose/identity reference): this sheet drew registered 147.61-163.58u weapons because its actual scale is 1.3540 (cell4 crown->sole 339 native px), not the ~1.17 the prompt\'s 408-451px native window assumed',
    lengthSteer: 'target registered 479-529px (~504px, band 124.41-137.50u) = NATIVE 354-391px target ~372px at THIS sheet scale 1.3540, i.e. draw every glaive ~15% shorter relative to the body (1.10x crown->sole ratio is the scale-invariant steer); do not rely on post retouch (cells1/2 gave 0px clean avail where the haft crosses the body)',
    preserveSteer: 'poses are GOOD - keep the exact DOWN flat prone start (matches selected fall cell4), elbow/kneel/crouch progression and standing-guard rise; keep complete butt caps visible behind rear hands and full tips in frame (no stub regression); same identity/body size/common ground',
  },
  banked: allPass, accepted,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict); console.log('hashes', hashVerification.length, 'all match')
for (const f of out.failedCriteria) console.log(' -', f)
console.log('waiverEligible:', waiverEligible.map((w) => w.name + ' ' + w.deviation).join('; '))
