// CMR-15A COMPLETION Phase C getup verdict. Work cmr15a-getup-phasec-gates. Zero generation.
// Candidate-wise across THREE sources: original sheet 9c2102e5 (12-getup/gate),
// overshortened focused-fix 9ab14bae (focused-fix/gate), Phase C sheet 8b498af9
// (phase-c/gate, extracted/registered by build.mjs this package, deterministic
// retouch assessed first - none applicable: no OUT_HIGH cell at true landmarks).
// Best source per role, role-fit spares allowed. Bank a coherent 5-cell set ONLY
// if every selected cell PASSes, or fails ONLY weapon length by <=9u while fully
// measurable with every other gate PASS (COMPLETION CAMPAIGN pre-authorized small
// waiver, exact hash only, FAIL retained NOT PASS, resulting spread included).
// Phase C is the Phase C sheet itself; its ONE briefed focused fix remains UNSPENT
// if this sheet does not bank - an initial/new-sheet failure never increments.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const D = 'art/motion/xuchu/closeout-campaign/12-getup/'
const OG = D + 'gate/', FG = D + 'focused-fix/gate/', G = D + 'phase-c/gate/', P = D + 'phase-c/'
const shaF = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const om = JSON.parse(readFileSync(OG + 'measure.json', 'utf8'))
const fm = JSON.parse(readFileSync(FG + 'measure.json', 'utf8'))
const cand = JSON.parse(readFileSync(P + 'candidate.json', 'utf8'))
const BAND = m.frozen.bandU, r2 = (v) => Math.round(v * 100) / 100
const inBand = (u) => u >= BAND[0] && u <= BAND[1]
const devOut = (u) => u < BAND[0] ? r2(u - BAND[0]) : u > BAND[1] ? r2(u - BAND[1]) : 0

const checks = [
  { what: 'phase-c candidate-raw.png', expect: cand.candidate.sha256, actual: shaF(P + 'candidate-raw.png') },
  { what: 'phase-c measure sheetSha256==candidate', expect: cand.candidate.sha256, actual: m.sheetSha256 },
  { what: 'original candidate-raw.png', expect: '9c2102e5f2402935daeb9dfb3ecbcc056d654973f0d76c4c52874193bc6cc1c9', actual: shaF(D + 'candidate-raw.png') },
  { what: 'focused-fix candidate-raw.png', expect: fm.sheetSha256, actual: shaF(D + 'focused-fix/candidate-raw.png') },
]
for (const c of m.all) checks.push({ what: 'phasec ' + c.name + ' final', expect: c.finalHash, actual: shaF(G + 'cells-registered/' + c.finalFile) })
for (const c of om.keeps) checks.push({ what: 'original ' + c.name + ' final', expect: c.finalHash, actual: shaF(OG + 'cells-registered/' + c.finalFile) })
for (const c of fm.keeps) checks.push({ what: 'fix ' + c.name + ' final', expect: c.finalHash, actual: shaF(FG + 'cells-registered/' + c.finalFile) })
for (const c of fm.spares) checks.push({ what: 'fix spare ' + c.name + ' final', expect: c.finalHash, actual: shaF(FG + 'cells-registered/' + c.finalFile) })
checks.push({ what: 'banked fall cell4 DOWN (continuity ref)', expect: 'cb0b12c149341e4b90f69e0674ca26f4f7574cd842135f718c5574214ce65e1d', actual: shaF('art/motion/xuchu/closeout-campaign/11-fall/focused-fix/waiver-bank/accepted/cell4-down.png') })
checks.push({ what: 'banked walk:0 guard (continuity ref)', expect: '2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450', actual: shaF('art/motion/xuchu/closeout-campaign/05-walk0/alternative/accepted.png') })
const hashVerification = checks.map((c) => ({ ...c, match: c.expect === c.actual }))
if (hashVerification.some((c) => !c.match)) throw new Error('hash mismatch: ' + JSON.stringify(hashVerification.filter((c) => !c.match)))

const ROLE = { 0: 'DOWN flat prone bookend', 1: 'elbow-prop', 2: 'kneel', 3: 'crouch', 4: 'rise-stand to guard' }
const SPARE_ROLE = { 5: 'crouch/lean-forward alternate', 6: 'kneel alternate', 7: 'kneel-to-rise alternate', 8: 'rise/guard alternate' }
function gateCell(k, srcDir) {
  const u = k.finalMeasure.u, dev = devOut(u)
  const seamPass = k.finalMeasure.greenPx === 0 && Object.values(k.finalMeasure.edge).every((v) => v === 0) && (!k.retouch || k.retouch.outsideProof.changedOutside === 0)
  const groundPass = k.finalMeasure.groundErrU <= 1.5
  const lenPass = k.buttCapVisible && inBand(u)
  const pass = lenPass && seamPass && groundPass
  const waivable = !pass && k.buttCapVisible && seamPass && groundPass && dev !== 0 && Math.abs(dev) <= 9
  return { cell: k.cell, name: k.name, finalFile: k.finalFile, finalHash: k.finalHash, srcDir, finalU: u, dev, angleDeg: k.finalMeasure.angDeg, groundErrU: k.finalMeasure.groundErrU, seamPass, groundPass, lenPass, pass, waivable }
}
const pcKeeps = m.keeps.map((k) => gateCell(k, G)), pcSpares = m.spares.map((k) => gateCell(k, G))
const oKeeps = om.keeps.map((k) => gateCell(k, OG)), oSpares = om.spares.map((k) => gateCell(k, OG))
const fKeeps = fm.keeps.map((k) => gateCell(k, FG)), fSpares = fm.spares.map((k) => gateCell(k, FG))
const spareForBeat = { 2: [6, 7], 3: [5], 4: [8] }
const sources = [
  { src: 'phasec keep', list: pcKeeps }, { src: 'original keep', list: oKeeps }, { src: 'fix keep', list: fKeeps },
]
const selection = [0, 1, 2, 3, 4].map((beat) => {
  const cands = []
  for (const s of sources) { const c = s.list.find((x) => x.cell === beat); cands.push({ src: s.src, ...c }) }
  for (const sc of spareForBeat[beat] || []) {
    for (const [src, list] of [['phasec spare', pcSpares], ['original spare', oSpares], ['fix spare', fSpares]]) {
      const c = list.find((x) => x.cell === sc); cands.push({ src, role: SPARE_ROLE[sc], ...c })
    }
  }
  // Prefer a true PASS (keep before spare, phasec keep first as listed), else a <=9u waivable keep.
  const winner = cands.find((c) => c.pass) || cands.find((c) => c.waivable && c.src.endsWith('keep')) || cands.find((c) => c.waivable) || null
  return { beat, role: ROLE[beat], candidates: cands.map((c) => ({ src: c.src, name: c.name, hash: c.finalHash, u: c.finalU, dev: c.dev, pass: c.pass, waivable: c.waivable })), selected: winner ? { src: winner.src, name: winner.name, hash: winner.finalHash, u: winner.finalU, dev: winner.dev, status: winner.pass ? 'PASS' : 'FAIL retained - WAIVED exact hash only (pre-authorized <=9u), NOT PASS', srcDir: winner.srcDir, finalFile: winner.finalFile, angleDeg: winner.angleDeg } : null }
})
const allSelected = selection.every((s) => s.selected)
const selUs = selection.map((s) => s.selected?.u)
const spreadPct = allSelected ? r2(((Math.max(...selUs) - Math.min(...selUs)) / (selUs.reduce((a, b) => a + b, 0) / selUs.length)) * 100) : null
const selAngles = selection.map((s) => s.selected?.angleDeg)
const dirSteps = []
for (let i = 1; i < 5; i++) dirSteps.push({ from: ROLE[i - 1], to: ROLE[i], stepDeg: allSelected ? r2(Math.abs(selAngles[i] - selAngles[i - 1])) : null, passLe60: allSelected ? Math.abs(selAngles[i] - selAngles[i - 1]) <= 60 : false })
let accepted = []
if (allSelected) {
  mkdirSync(G + 'accepted', { recursive: true })
  accepted = selection.map((s) => { copyFileSync(s.selected.srcDir + 'cells-registered/' + s.selected.finalFile, G + 'accepted/' + s.selected.name + '.png'); return { beat: s.beat, name: s.selected.name, src: s.selected.src, u: s.selected.u, status: s.selected.status, acceptedHashVerified: shaF(G + 'accepted/' + s.selected.name + '.png') === s.selected.hash } })
}
const waived = selection.filter((s) => s.selected && s.selected.status !== 'PASS').map((s) => ({ beat: s.beat, name: s.selected.name, exactHash: s.selected.hash, finalU: s.selected.u, deviationU: s.selected.dev, rule: 'COMPLETION CAMPAIGN pre-authorized small waiver <=9u: fully measurable (complete cap ball + tip drawn, markers verified on true balls/tips), every other gate PASS; FAIL retained, NOT PASS, exact hash only, no blanket/transfer; deterministic retouch cannot lengthen OUT_LOW, nothing fabricated' }))
const pcVerdicts = pcKeeps.map((k) => ({
  ...k,
  gates: {
    identity: 'PASS (visual this package: phase-c sheet + all 9 native grids + keeps/spares contacts + marked cell0/cell1/cell4 opened; same helmet/beard/lamellar Xu Chu, glaive+red tassel consistent)',
    anatomy: 'PASS (visual: connected limbs/grips, no extra/fused limbs)',
    poseRole: `PASS (${ROLE[k.cell]}; DOWN->elbow->kneel->crouch->rise coherent on keeps contact)`,
    weaponGripCap: 'PASS (haft gripped; complete butt cap balls drawn on all 9 cells, verified on butt-grid10 zooms)',
    weaponLength: k.lenPass ? `PASS (${k.finalU}u in band)` : `FAIL (${k.finalU}u, ${k.dev}u outside band; retouch assessed first in build - OUT_LOW cannot be lengthened)`,
    scaleGround: k.groundPass ? `PASS (ONE scale ${r2(m.sheetScale)} cell4-rise 342->459px; groundErr ${k.groundErrU}u <=1.5u; prone cross-check cell0 ${m.proneCrossChecks[0].lenPx}px native)` : 'FAIL',
    seams: k.seamPass ? 'PASS (greenPx=0, no canvas-edge alpha, no retouch splice)' : 'FAIL',
    head: 'RAW (beard conceals endpoint; batch-end Phase D ruling reserved, not a reject)',
  },
}))
const out = {
  work: 'cmr15a-getup-phasec-gates',
  candidate: { path: P + 'candidate-raw.png', sha256: m.sheetSha256, size: m.sheetSize, components: m.components, reserveCommit: cand.reserveCommit },
  hashVerification: { allMatch: true, count: hashVerification.length, measureJsonSha256: shaF(G + 'measure.json') },
  registration: { method: m.scaleMethod, sheetScale: m.sheetScale, scaleBodyNativePx: m.scaleBodyNativePx },
  retouchPolicy: 'Deterministic retouch assessed FIRST by build.mjs at corrected true-cap landmarks: no OUT_HIGH cell exists on Phase C (keeps 121.35/120.29/127.56/125.11/126.64u), so no shortening retouch applies; cells0/1 OUT_LOW cannot be lengthened deterministically, nothing fabricated. First-pass prone butt boxes caught leg/boot (crosses on leg/boot in marked views, lengths overstated) and were re-tightened on the true cap balls from butt-grid10 zooms before verdicts - rerun markers sit on the true balls/tips (marked cell0/cell1 re-opened).',
  ledgerVerified: m.ledgerVerified,
  phasecKeeps: pcVerdicts,
  phasecSpares: pcSpares,
  originalKeepsSummary: oKeeps.map((k) => ({ name: k.name, hash: k.finalHash, u: k.finalU, dev: k.dev, pass: k.pass, waivable9u: k.waivable })),
  fixKeepsSummary: fKeeps.map((k) => ({ name: k.name, hash: k.finalHash, u: k.finalU, dev: k.dev, pass: k.pass, waivable9u: k.waivable })),
  selection, accepted, waivedCells: waived,
  directionStepsSelected: dirSteps,
  lengthSpreadSelected: { finalUs: selUs, spreadPct, note: 'Spread of the exact selected set; to the extent it is not a PASS it is the resulting spread of the two waived exact-hash cells and is covered only as such under the same pre-authorized waiver (FAIL retained if not PASS)' },
  continuity: {
    downVsBankedFallCell4: 'PASS pose/ground (banked fall cell4-down cb0b12c1 136.03u and phasec cell0-down both flat prone face-down on the same ground line, head right, one hand on haft - personally compared this package); weapon shorter (121.35u) is exactly the waived -3.06u-vs-band deviation of the selected cell0, FAIL retained under its waiver',
    sequence: 'PASS (keeps contact: flat DOWN -> elbow-prop head raised -> kneel hand to ground -> crouch -> standing rise, one coherent getup arc, no standing insertion, direction steps <=9.79deg)',
    riseVsBankedWalk0: 'PASS (cell4-rise 126.64u PASS standing two-handed guard family matching banked walk:0 guard; marked cell4 opened, soles flat at ground)',
  },
  verdict: allSelected
    ? `BANKED coherent 5-cell getup set in phase-c/gate/accepted/ (all Phase C keeps: 3 PASS + ${waived.length} waived exact-hash <=9u FAIL-retained); banked family resets prospective post-fix count to 0`
    : `FAIL - NOT BANKED (no accepted cells; ${existsSync(G + 'accepted') ? 'accepted/ EXISTS - ERROR' : 'no accepted/ dir'})`,
  failedCriteria: [
    ...pcKeeps.filter((k) => !k.pass).map((k) => `phasec ${k.name} [${k.finalHash}]: weapon length ${k.finalU}u dev ${k.dev}u vs band [${r2(BAND[0])},${r2(BAND[1])}]u - ${k.waivable ? 'waived exact hash (<=9u, FAIL retained)' : 'FAIL, not waivable'}`),
    ...oKeeps.filter((k) => !k.pass).map((k) => `original ${k.name} [${k.finalHash}]: ${k.finalU}u dev ${k.dev}u FAIL${k.waivable ? ' (<=9u-sized but not selected - Phase C source preferred)' : ''}`),
    ...fKeeps.filter((k) => !k.pass).map((k) => `fix ${k.name} [${k.finalHash}]: ${k.finalU}u dev ${k.dev}u FAIL${k.waivable ? ' (<=9u-sized but not selected)' : ''}`),
  ],
  postSalvageAccounting: allSelected
    ? 'Getup BANKED under COMPLETION Phase C (sheet + deterministic salvage; Phase C focused fix NOT needed/spent). Prospective post-fix unusable count resets/stays 0. Ledger unchanged Xu Chu 29 (getup 3)/global 196, ceilings 32/199; zero generation, no pack/15B in this package. Head RAW remains for Phase D batch-end ruling.'
    : 'Phase C sheet did not bank. Its ONE briefed focused fix (Phase C <=2 requests, 1 spent) remains ELIGIBLE/unspent; an initial/new-sheet failure alone does NOT increment the post-fix unusable count and does not STOP (count stays 0). Ledger unchanged 29/196; no generation/pack.',
  banked: allSelected,
  generation: 'zero in this package',
}
writeFileSync(G + 'gate.json', JSON.stringify(out, null, 2) + '\n')
console.log(out.verdict)
console.log('hashes', hashVerification.length, 'all match; spread', spreadPct)
for (const f of out.failedCriteria) console.log(' -', f)
console.log('selection:', selection.map((s) => s.role + '=' + (s.selected ? `${s.selected.src} ${s.selected.u}u ${s.selected.status}` : 'NONE')).join(' | '))
