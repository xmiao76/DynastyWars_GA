// Derives gate.json (verdict) from measure.json. Deterministic, zero generation.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/07-charge/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const keeps = m.keeps.map((k) => {
  const f = k.retouch.feasibility
  const lenPass = k.finalMeasure.u >= BAND[0] && k.finalMeasure.u <= BAND[1]
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent, sheet + registered cell opened)',
      anatomy: 'PASS (visual: two arms/hands on shaft, two legs/boots, no fused/extra limbs)',
      poseRole: 'PASS (visual vs prompt keep role)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? 'PASS' : 'FAIL',
      seams: (k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every(v => v === 0) && k.retouch.outsideProof.changedOutside === 0) ? 'PASS (greenPx=0, no canvas-edge alpha, retouch changedOutside=0, joints not visible at cell size)' : 'FAIL',
      head: 'RAW (beard conceals chin/beard-base endpoint; helmet-width proxy recorded in measure.json, not gated; batch-end ruling reserved)',
    },
    weapon: {
      registeredU: k.registeredMeasure.u, registeredPx: k.registeredMeasure.pxLen,
      finalU: k.finalMeasure.u, finalPx: k.finalMeasure.pxLen,
      bandU: BAND, overBandHiU: r2(Math.max(0, k.finalMeasure.u - BAND[1])),
      retouchFeasibility: { buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, removeTo132Px: f.removeToTarget132Px, reachesBand: f.reachesBand, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx) },
    },
    groundErrU: k.finalMeasure.groundErrU,
    boots: k.finalMeasure.boots,
    verdict: lenPass ? 'PASS' : 'FAIL - weapon length OUT_HIGH after max deterministic shaft retouch',
  }
})
const allPass = keeps.every((k) => k.verdict === 'PASS')
const out = {
  work: 'cmr15a-phase3-charge-gates',
  sheet: { path: 'art/motion/xuchu/closeout-campaign/07-charge/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
  registration: { method: 'one uniform sheet scale from cell0 guard crown->sole (339 native px) to frozen 459px; per-cell translate sole->groundY500; canvas 768x512', sheetScale: m.sheetScale, guardBodyNativePx: m.guardBodyNativePx, determinism: 'build.mjs rerun reproduced all registered/retouched PNG hashes byte-identically (verified 2026-10-13); pre-existing partial registered hashes also reproduced; partial retouched hashes superseded by blade-run scan fix in this correction' },
  retouchPolicy: 'deterministic shaft shortening BEFORE any length-failure verdict: pommel-side clean run first, blade-side clean run (front grip->socket) as supplement; outside-weapon-region changedPx=0 per keep (measure.json)',
  anglePolicy: 'angles recorded raw per pose (charge choreography levels/raises the glaive; walk anchor -26.31deg corridor is not applied across charge poses); length vs frozen band is the binding weapon gate',
  ledgerVerified: m.ledgerVerified,
  keeps,
  spares: m.spares,
  sparesNote: 'spares 5-8 component-extracted at native size only; weapon lengths NOT measured in this package - zero-gen spare measurement should precede spending the sheet focused fix',
  verdict: allPass ? 'PASS - BANKED' : 'FAIL - NOT BANKED (no accepted cells created)',
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name}: weapon ${k.weapon.finalU}u vs band [${r2(BAND[0])},${r2(BAND[1])}]u (+${k.weapon.overBandHiU}u over band-hi) after retouch; registered ${k.weapon.registeredU}u/${k.weapon.registeredPx}px, clean-shaft availability ${k.weapon.retouchFeasibility.totalAvailPx}px vs ${k.weapon.retouchFeasibility.removeToBandHiPx}px needed to reach band-hi (deficit ${k.weapon.retouchFeasibility.deficitToBandHiPx}px)`),
  focusedFixAssessment: {
    grantBasis: 'CMR-15A ALTERNATIVE COMPLETION Phase 3: deterministic retouch before at most one focused fix per sheet (retouch now exhausted - see feasibility deficits)',
    recommendation: 'ONE focused sheet EDIT in a later package (reserve-before-call Xu Chu 14->15 / global 181->182, ceilings 22/189): keep all nine poses/identity/layout/ground identical; shorten ONLY the glaive in every cell so butt->tip measures 479-529px at the 459px-body registered scale (target ~508px=132u) by moving blade+socket toward the front grip and pommel toward the rear grip; do not shrink figures',
    measuredBrief: keeps.map(k => `${k.name}: registered ${k.weapon.registeredPx}px -> target ~508px (shorten ~${Math.round(k.weapon.registeredPx - 508)}px, ${r2((k.weapon.registeredPx - 508) / k.weapon.registeredPx * 100)}%)`),
    risks: 'sheet-wide edit may drift poses/scale/identity; full re-gate of all keeps required; if the focused fix also fails length, this sheet counts as a post-salvage unusable source (1 of 2 consecutive STOP)',
    zeroGenFirst: 'measure spares 5-8 weapon lengths deterministically before the fix; a spare may substitute a keep role only if it reaches band after retouch (visually all sheet glaives are long, so substitution is unlikely)',
  },
  consecutivePostSalvageUnusable: '0 - sheet not finally unusable while its one authorized focused fix remains unspent; STOP (2 consecutive) not reached',
  banked: false,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const k of keeps) console.log(k.name, k.finalMeasure?.u ?? k.weapon.finalU + 'u', k.verdict)
