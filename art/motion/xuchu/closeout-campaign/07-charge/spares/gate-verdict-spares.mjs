// Derives spares-gate.json from spares-measure.json + keeps gate.json. Zero generation.
import { readFileSync, writeFileSync } from 'node:fs'
const DIR = 'art/motion/xuchu/closeout-campaign/07-charge/'
const m = JSON.parse(readFileSync(DIR + 'spares/spares-measure.json', 'utf8'))
const keepsGate = JSON.parse(readFileSync(DIR + 'gate/gate.json', 'utf8'))
const BAND = m.frozen.bandU, S = m.sheetScale
const r2 = (v) => Math.round(v * 100) / 100
const ROLE = {
  5: { reads: 'airborne tucked dash (rear toe soleY501 trailing, front boot tucked soleY482 = 19px clear of ground)', fits: ['launch', 'crushing dash'], notFits: 'not crouch-coil (airborne, not grounded/coiled), not brake (no grounded skid/weight-back)' },
  6: { reads: 'forward reaching stride, weight forward (rear toe-off 501, front reaching sole 498); prompt name brake-alt not borne out visually', fits: ['launch', 'crushing dash'], notFits: 'not brake (no skid, hips/weight forward not back), not crouch-coil (extended stride, not coiled)' },
  7: { reads: 'genuine grounded brake (both boots flat soleY500/496, wide stance, weight back, glaive raised)', fits: ['brake'], notFits: 'not coil/launch/dash (static grounded settle, no forward drive)' },
  8: { reads: 'upright standing guard (both flat 501/499), alternate drawing of cell0 role', fits: ['guard (cell0, already PASS)'], notFits: 'none of failed keeps 1-4 (no coil/launch/dash/brake action)' },
}
const spares = m.spares.map((s) => {
  const f = s.retouch.feasibility, proof = s.retouch.maxShortenedProofMeasure
  const lenPass = proof.u >= BAND[0] && proof.u <= BAND[1] && s.retouch.appliedAndSaved
  return {
    cell: s.cell, name: s.name, compId: s.compId, nativeBounds: s.nativeBounds,
    registeredHash: s.registeredHash, registeredFile: `cells/${s.name}-registered.png`,
    finalHash: s.finalHash, finalFile: `cells/${s.finalFile}`,
    gates: {
      identity: 'PASS (visual: same helmeted full-bearded ochre/dark lamellar Xu Chu, glaive+red tassel; sheet + registered + marked cells opened)',
      anatomy: 'PASS (visual: two arms/hands gripping shaft, two legs/boots, no extra/fused limbs)',
      poseRoleRead: ROLE[s.cell],
      weaponLength: lenPass ? 'PASS' : 'FAIL',
      weaponAngleDegRaw: s.registeredMeasure.angDeg,
      weaponDirection: `raw per keeps anglePolicy; delta vs cell0 final -23.61deg = ${r2(s.registeredMeasure.angDeg - (-23.61))}deg (within 30deg prompt family and <=60deg sequence step)`,
      scaleGround: s.registeredMeasure.groundErrU <= 1.5 ? `PASS (groundErr ${s.registeredMeasure.groundErrU}u; crown->sole ${s.bodyRegistered.crownToSolePx}px at sheet scale, boots ${JSON.stringify(s.registeredMeasure.boots)})` : 'FAIL',
      seams: (s.registeredMeasure.greenPx === 0 && Object.values(s.registeredMeasure.edge).every(v => v === 0)) ? 'PASS (greenPx=0, no canvas-edge alpha)' + (s.retouch.appliedAndSaved ? '; retouch changedOutside=0, joint not visible at cell size (retouched cell opened)' : '') : 'FAIL',
      head: `RAW (beard conceals chin/beard-base endpoint; helmet-width proxy ${s.bodyRegistered.helmetWPx}px registered vs keeps range 70.4-131.3px, not gated; batch-end ruling reserved)`,
    },
    weapon: {
      registeredU: s.registeredMeasure.u, registeredPx: s.registeredMeasure.pxLen,
      bandU: BAND, bandPx: m.bandPxAtRegisteredScale,
      retouch: { curable: s.retouch.curable, appliedAndSaved: s.retouch.appliedAndSaved, buttAvailPx: f.buttAvailPx, bladeRunT: f.bladeRunT, bladeAvailPx: f.bladeAvailPx, totalAvailPx: f.totalAvailPx, removeToBandHiPx: f.removeToBandHiPx, removeTo132Px: f.removeToTarget132Px, deficitToBandHiPx: Math.max(0, f.removeToBandHiPx - f.totalAvailPx), retouchedHash: s.retouch.retouchedHash, maxShortenedProofU: proof.u, maxShortenedProofPx: proof.pxLen, overBandHiUAfterMaxRetouch: r2(Math.max(0, proof.u - BAND[1])) },
    },
    verdict: lenPass ? 'PASS gates (guard-alt only; see substitution matrix)' : 'FAIL - weapon length OUT_HIGH, deterministic shaft retouch not measurably curable',
  }
})
const keepFails = keepsGate.keeps.filter(k => k.verdict !== 'PASS')
const matrix = [
  { failedKeep: 'cell1 crouch-coil', candidates: [], note: 'NO spare reads as a grounded crouch-coil (cell5 airborne, cell6 extended stride, cell7 grounded brake settle, cell8 upright guard). Role uncovered by spares at any weapon length.' },
  { failedKeep: 'cell2 launch', candidates: ['cell5 (role fit, length FAIL)', 'cell6 (role fit, length FAIL)'], note: 'Both role-plausible spares fail length after max retouch (159.77u / 179.35u proof).' },
  { failedKeep: 'cell3 crushing dash', candidates: ['cell5 (role fit, length FAIL)', 'cell6 (role fit, length FAIL)'], note: 'Same two spares as launch; one spare cannot cover both launch and dash beats, and both fail length.' },
  { failedKeep: 'cell4 brake', candidates: ['cell7 (role fit, length FAIL nearest miss)'], note: 'cell7 is a genuine brake but max-retouch proof 139.65u still +2.15u over band-hi (clean-shaft deficit 9px). cell6 named brake-alt reads forward stride, not brake.' },
  { failedKeep: 'cell0 guard (already PASS)', candidates: ['cell8 (role fit, length PASS after applied retouch 132.80u)'], note: 'Only length-passing spare duplicates the one keep that already passes; substituting it changes nothing for keeps 1-4.' },
]
const briefPx = (px) => `${px}px registered -> required 479-529px (shorten ${Math.round(px - 529)}-${Math.round(px - 479)}px; target ~508px = -${Math.round(px - 508)}px); sheet-native equivalent now ${r2(px / S)}px -> required 354-391px native (target ~375px at guard body 339px native)`
const out = {
  work: 'cmr15a-charge-spares-assessment',
  sheet: { path: DIR + 'candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components },
  registration: { method: 'identical to keeps gate: ONE uniform sheet scale from cell0 guard crown->sole 339 native px to frozen 459px; per-cell sole->groundY500; canvas 768x512', sheetScale: S, guardBodyNativePx: m.guardBodyNativePx, determinism: 'build-spares.mjs rerun reproduced every registered/marked/retouched PNG hash byte-identically (verified 2026-10-13, RERUN-IDENTICAL)' },
  retouchPolicy: 'deterministic shaft retouch applied+saved ONLY where measurably curable (total clean-shaft availability >= removal to band-hi): only cell8. Cells 5-7 measured with in-memory max-shortening proof only; no retouched cell saved for them.',
  ledgerVerified: m.ledgerVerified,
  spares,
  substitutionMatrix: matrix,
  sequenceContinuityWithCell0: 'Angles cell0 -23.61deg; spares -15.16/-14.04/-24.09/-23.44deg - all within the 30deg prompt family, no step >60deg; same sheet scale/ground (groundErr <=0.26u). Pose continuity guard->coil->launch->dash->brake CANNOT be formed: coil beat has no spare, launch+dash share the same two (length-failed) spares, brake spare fails length. Contact sheet spares/contact-cell0-then-spares5-8.png opened.',
  verdict: 'NO COHERENT 5-CELL SET - NOT BANKED (no accepted cells created; cell8 retouched cell is evidence only, cell0 keep remains the guard)',
  failedCriteria: [
    ...keepFails.map(k => `${k.name}: weapon ${k.weapon.finalU}u after max retouch vs band [${r2(BAND[0])},${r2(BAND[1])}]u (keeps gate, unchanged)`),
    ...spares.filter(s => s.gates.weaponLength === 'FAIL').map(s => `${s.name}: registered ${s.weapon.registeredU}u/${s.weapon.registeredPx}px; max-retouch proof ${s.weapon.retouch.maxShortenedProofU}u (+${s.weapon.retouch.overBandHiUAfterMaxRetouch}u over band-hi); clean-shaft ${s.weapon.retouch.totalAvailPx}px avail vs ${s.weapon.retouch.removeToBandHiPx}px needed to band-hi (deficit ${s.weapon.retouch.deficitToBandHiPx}px); retouch NOT applied as not curable`),
    'substitution: crouch-coil role uncovered by any spare; launch and crushing dash compete for the same two length-failed spares (5,6); genuine brake spare 7 fails length by 9px clean-shaft deficit; only passing spare 8 duplicates passing guard cell0',
  ],
  focusedFixBrief: {
    title: 'SINGLE focused fix for charge sheet 11080736 (later package only; NOT executed here; grant allows at most one focused fix per sheet after deterministic retouch)',
    cellsAndRoles: 'Edit keeps cell1 crouch-coil, cell2 launch, cell3 crushing dash, cell4 brake (poses/identity/layout/ground EXACTLY frozen - cell1 coil has no spare substitute so its pose must survive verbatim); cell0 guard already retouch-passes (132.31u) and should be left unchanged if the edit can be cell-scoped, otherwise re-gated; optionally also shorten spare cell7 (genuine brake alt, nearest miss) as insurance, spares 5/6 optional, spare 8 needs no edit',
    changeOnly: 'Shorten ONLY the glaive in each named cell by moving blade+socket toward the front grip and pommel cap toward the rear grip; grips, figure size, boots/ground, camera unchanged; both weapon ends remain in empty transparent space; no figure shrink, no pose drift',
    requiredWeaponPixelRangeAtScale: 'butt->tip 479-529px at the 459px-body registered scale (band [124.41,137.50]u; target ~508px = 132u) = 354-391px in the 1536x1024 sheet-native pixels where the guard body is 339px (target ~375px native)',
    perCellMeasured: [
      ...keepsGate.keeps.slice(1).map(k => `${k.name}: ${briefPx(k.weapon.registeredPx)}`),
      ...spares.slice(0, 3).map(s => `${s.name}: ${briefPx(s.weapon.registeredPx)}`),
    ],
    referenceOrder: [
      '1 (EDIT TARGET, pose/layout/identity source): art/motion/xuchu/closeout-campaign/07-charge/candidate-raw.png sha256 11080736380132eb798b6b0636f03ab385cf287725be748fc4bc9189f4c189e5',
      '2 (identity/weapon size): banked walk:0 guard art/motion/xuchu/closeout-campaign/05-walk0/alternative/accepted.png sha256 2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450',
      '3 (anchor identity/band): banked walk:2 via art/motion/xuchu/closeout-campaign/01-walk2/candidate-raw.jpg sha256 893c90d752464b4cc2329543046d9af6cf4daa84820a8e8a5c63ca402dabb1e6',
      '4 (body master): art/fighter-bodies/xuchu-body-master.jpg sha256 98c1847b17dca605e637954e0a9679c23d97f9fcd58d0a4ebb01c37665abb6cd',
      '5 (portrait master): art/boss-faces/xuchu-portrait-master.jpg sha256 c663fd5428314ced899d98ce41b5fa2e55fecb9b12335b1f9de4803afefb3a0d',
    ],
    reservation: 'reserve-before-call Xu Chu 14->15 / global 181->182 (ceilings 22/189); provider gpt-preferred as the original sheet; exactly one focused edit, no reroll; full re-gate of all keeps (and any edited spare) after; a failed fix makes this sheet post-salvage unusable 1/2 (STOP at 2 not reached)',
  },
  consecutivePostSalvageUnusable: '0 - the sheet one authorized focused fix remains unspent; this zero-gen assessment neither banks nor finally rejects the sheet',
  banked: false,
  acceptedCellsCreated: false,
  generation: 'zero in this package',
}
writeFileSync(DIR + 'spares/spares-gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
