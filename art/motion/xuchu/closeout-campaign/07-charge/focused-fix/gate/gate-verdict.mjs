// Derives gate.json (verdict) from measure.json for the charge FOCUSED-FIX sheet.
// Deterministic, zero generation. Banking only if 5/5 keeps pass.
import { readFileSync, writeFileSync } from 'node:fs'
const G = 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const BAND = m.frozen.bandU
const r2 = (v) => Math.round(v * 100) / 100
const OUTSIDE_NOTE = {
  0: 'changedOutside=2 at |p|<=20: probe-outside.mjs identifies both as pasted pommel-cap AA edge pixels (alpha 5 and 8, shaft-brown RGB, previously transparent) landing at p=20.0/20.3 after integer axis shift; zero non-weapon pixels changed',
}
const keeps = m.keeps.map((k) => {
  const f = k.retouch ? k.retouch.feasibility : null
  const u = k.finalMeasure.u
  const lenPass = u >= BAND[0] && u <= BAND[1]
  const lenFail = u > BAND[1] ? `FAIL - weapon length OUT_HIGH (+${r2(u - BAND[1])}u over band-hi) after max deterministic shaft retouch` : `FAIL - weapon length OUT_LOW (${r2(BAND[0] - u)}u under band-lo); shaft retouch shortens only and cannot cure`
  const seamBase = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every(v => v === 0)
  const outside = k.retouch ? k.retouch.outsideProof.changedOutside : 0
  const seamPass = seamBase && (outside === 0 || OUTSIDE_NOTE[k.cell] !== undefined)
  return {
    cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash,
    gates: {
      identity: 'PASS (visual: Xu Chu helmet/beard/lamellar/glaive+tassel consistent; sheet, marked cells, contact + original-vs-focused compare opened)',
      anatomy: 'PASS (visual: two arms/hands on shaft, two legs/boots, no fused/extra limbs)',
      poseRole: 'PASS (visual vs prompt keep role; native continuity deltas vs original sheet in measure.json: crown/sole within 1px, pose/layout preserved)',
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponAngleDegRaw: k.finalMeasure.angDeg,
      scaleGround: k.finalMeasure.groundErrU <= 1.5 ? 'PASS' : 'FAIL',
      seams: seamPass ? `PASS (greenPx=0, no canvas-edge alpha${k.retouch ? `, retouch outside proof: ${OUTSIDE_NOTE[k.cell] ?? 'changedOutside=0'}` : ', no retouch applied'}; joints not visible at cell size)` : 'FAIL',
      head: 'RAW (beard conceals chin/beard-base endpoint; helmet-width proxy in measure.json, not gated; batch-end ruling reserved)',
    },
    weapon: {
      registeredU: k.registeredMeasure.u, registeredPx: k.registeredMeasure.pxLen,
      finalU: u, finalPx: k.finalMeasure.pxLen, bandU: BAND,
      overBandHiU: r2(Math.max(0, u - BAND[1])), underBandLoU: r2(Math.max(0, BAND[0] - u)),
      marginToBandHiU: r2(BAND[1] - u),
      retouchFeasibility: f ? { buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, removeTo132Px: f.removeToTarget132Px, reachesBand: f.reachesBand, appliedButtPx: k.retouch.buttRemovePx, appliedBladePx: k.retouch.bladeRemovePx, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx) } : 'none (in band at registration, or OUT_LOW which shortening cannot cure)',
    },
    groundErrU: k.finalMeasure.groundErrU,
    boots: k.finalMeasure.boots,
    verdict: lenPass && seamPass ? 'PASS' : (lenPass ? 'FAIL - seams' : lenFail),
  }
})
const passCount = keeps.filter(k => k.verdict === 'PASS').length
const allPass = passCount === 5
const out = {
  work: 'cmr15a-charge-focused-fix-gates (correction/resume of partial state)',
  sheet: { path: 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components, reserveCommit: 'a3da994 (Xu Chu 14->15, global 181->182)', candidateCommit: '6b2d373 (UNREVIEWED)' },
  registration: { method: 'one uniform sheet scale from cell0 guard crown->sole (339 native px) to frozen 459px; per-cell translate sole->groundY500; canvas 768x512', sheetScale: m.sheetScale, guardBodyNativePx: m.guardBodyNativePx, determinism: 'partial build.mjs first reran byte-identically (measure.json 919a957e..., all registered hashes reproduced); after the capEnd scan correction below, rerun twice byte-identical (measure.json and all cell hashes stable)' },
  scanCorrection: 'butt clean-run scan in build.mjs started at t=4 inside the pommel ball (>30px wide at t~14 on focused cell0), falsely reporting buttAvail=0; probe-butt-run.mjs showed a clean shaft run t=16..68 on cell0 and none on cell3 (shaft over body, perp width >=57 from t=4). Scan now starts at capEnd=16 (the movable cap segment). Only cell0 retouch changed; registered hashes unchanged.',
  retouchPolicy: 'deterministic shaft shortening BEFORE any length-failure verdict: pommel-side clean run first, blade-side clean run (front grip->socket) as supplement; shortening only (cannot cure OUT_LOW)',
  anglePolicy: 'angles recorded raw per pose (charge choreography levels/raises the glaive); length vs frozen band is the binding weapon gate',
  ledgerVerified: m.ledgerVerified,
  keeps,
  passCount: `${passCount}/5`,
  spares: m.spares,
  sparesNote: 'focused sheet spares 5-8 native-extracted only, lengths unmeasured; original-sheet spares already assessed (no coherent set)',
  verdict: allPass ? 'PASS - BANKED' : `FAIL - NOT BANKED (${passCount}/5 keeps pass; no accepted cells created)`,
  failedCriteria: keeps.filter(k => k.verdict !== 'PASS').map(k => `${k.name}: ${k.verdict}; final ${k.weapon.finalU}u/${k.weapon.finalPx}px vs band [${r2(BAND[0])},${r2(BAND[1])}]u; registered ${k.weapon.registeredU}u/${k.weapon.registeredPx}px`),
  postSalvageAccounting: 'The charge sheet has now consumed its single authorized focused fix and still fails after full deterministic salvage: post-salvage unusable source 1/2 consecutive (campaign STOP at 2 NOT reached). No further charge generation authorized (one sheet + one focused fix per grant). CMR-15A stays IN_PROGRESS; next Phase 3 sheet (combo) is a later package.',
  banked: false,
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
for (const f of out.failedCriteria) console.log(' -', f)
