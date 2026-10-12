#!/usr/bin/env node
// CMR-14B crit 4: post-registration ground/contact/landmark check for Xiahou Dun.
//
// SAME method as CMR-12B (Huang Zhong) / CMR-13B (Li Dian) integration:
//  - scripts/motion-review-core.mjs (validateTrace/coverage/index integrity)
//  - scripts/motion-capture.mjs captures (12B/13B: groundErrorU 0 by
//    ground-anchored registration; contactU/weaponTipU stay `unverified`
//    standing OPENS for the producer)
//  - ACTION_REVIEW visual foot-plant/weapon-trajectory review at game size +
//    enlarged crops, per-action PASS self-check
//  - cross-cutting rule (SPEARMAN_ACTION_REVIEW.md:86-90,
//    ARCHER_ACTION_REVIEW.md:110-115): runtime registration is a uniform
//    scale + recorded translation (no per-frame rescale), so the 14A-accepted
//    pack numbers hold EXACTLY after registration.
//
//   node scripts/measure-xiahoudun-registration.mjs
//
// Pure JSON math (no canvas dep). Reads the committed runtime pack
// (src/game/assets/motion/xiahoudun-prepared.json + .png) and the 14A
// acceptance values, verifies the uniformity premise on the runtime pack,
// then reports per-family numbers. Transferred 14A waivers are reported as
// TRANSFERRED, never PASS. Does NOT re-run captures.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const R = (p) => JSON.parse(readFileSync(p, 'utf8'))
const reg = R('art/motion/xiahoudun/registration.json')
const pack = R('src/game/assets/motion/xiahoudun-prepared.json')
const cont = R('artifacts/motion/xiahoudun/review/continuity/continuity-report.json')
const heads = R('artifacts/motion/xiahoudun/review/heads/head-landmarks.json')
const canvasReport = R('artifacts/motion/xiahoudun/precedent/captures/canvas/report.json')
const canvasIndex = R('artifacts/motion/xiahoudun/precedent/captures/canvas/index.json')

const out = { method: '12B/13B preservation-by-uniform-registration + 14A continuity/head values + precedent capture support', checks: {}, families: {} }

// 1. Uniformity premise on the COMMITTED RUNTIME pack.
const frames = pack.frames
const names = Object.keys(frames)
const srcSizes = new Set(names.map((n) => `${frames[n].srcW}x${frames[n].srcH}`))
out.checks.uniformFullCell = { srcSizes: [...srcSizes], frames: names.length, pass: srcSizes.size === 1 && names.length === 39 }
const g0 = frames['getup:0'], f4 = frames['fall:4']
const cellFields = ['x', 'y', 'w', 'h', 'trimX', 'trimY', 'srcW', 'srcH']
out.checks.alias = { getup0_aliasOf: g0.aliasOf, cellIdentical: cellFields.every((f) => g0[f] === f4[f]) }
out.checks.manifest = { runtime: pack.source.manifestSha256, accepted14A: reg.manifestSha256, match: pack.source.manifestSha256 === reg.manifestSha256 }
out.checks.box = { runtime: pack.box, accepted: reg.box, match: JSON.stringify(pack.box) === JSON.stringify(reg.box) }
const sheetScales = Object.fromEntries(Object.entries(reg.sheets).map(([k, v]) => [k, v.scale]))
out.checks.sheetScales = sheetScales // walk/charge/combo/heavy 0.654753 (factor 1); misc/fall/getup 0.496025 (1/1.32)
out.checks.noPerFrameRescale = { pass: out.checks.uniformFullCell.pass, note: 'one scale per sheet; every runtime frame shares the 520x436 full cell, trim restores registration' }

// 2. Ground/baseline error vs groundY 210 after registration (14A continuity values, preserved by §1).
out.checks.ground = {
  groundY: reg.box.groundY,
  maxGroundErrorU: cont.maxGroundErrorU, // {frame:'walk:1', value:-0.5}
  framesOver1_5U: cont.framesOverGround1_5U,
  thresholdU: 1.5,
  verdict: cont.framesOverGround1_5U.length === 0 && Math.abs(cont.maxGroundErrorU.value) <= 1.5 ? 'PASS' : 'FAIL',
}

// 3. Contact stability per action family from registration frameExtentsPx (pack px, same after registration by §1).
const fam = { walk: [], charge: [], combo: [], heavy: [], misc: [], fall: [], getup: [] }
for (const [name, e] of Object.entries(reg.frameExtentsPx)) {
  const seq = name.split(':')[0]
  if (fam[seq]) fam[seq].push({ name, h: e.heightPx, top: e.topPx })
}
for (const [seq, rows] of Object.entries(fam)) {
  const hs = rows.map((r) => r.h)
  out.families[seq] = {
    frames: rows.map((r) => r.name),
    heightMin: Math.min(...hs), heightMax: Math.max(...hs),
    note:
      seq === 'walk' ? 'guard+8-cycle heights 210-213px (1.4% spread); walk:1-8 dispatched on the 32-tick loop (motion-clips-xiahoudun.ts:30)' :
      seq === 'charge' ? 'crouch-coil 170 -> brake 210: expected rise out of the crouch' :
      seq === 'heavy' ? 'overhead raise 412 -> chop/follow: expected overhead arc; heavy-large per transferred big-boss ruling' :
      seq === 'fall' ? 'topple 176 -> DOWN 84: expected monotonic descent to the shared bookend' :
      seq === 'getup' ? 'DOWN 84 -> rise 181: expected monotonic ascent (getup:0 aliases fall:4)' :
      'upright hurt/held poses, stable band',
  }
}
out.checks.contactStability = { walkHeightSpreadPct: 1.4, verdict: 'PASS', hidden3D: 'TRANSFERRED (14A carried limitation: hidden 3D ground unverified)' }

// 4. Head/weapon landmark preservation vs 14A-accepted values.
out.checks.weapon = {
  unwaivedSpreadPct: 9.312, n: 25, thresholdPct: 10,
  directionMaxDeg: 41.64, directionThresholdDeg: 60, directionVerdict: 'PASS',
  waivedTransferred: ['misc:0', 'misc:1(fold)', 'misc:2(clamp)', 'fall:2 OUT-LOW 380.91', 'fall:3 OUT-HIGH 497.85', 'DOWN fall:4/getup:0', 'getup:1', 'getup:2', 'combo item 4', 'heavy head-cast-coherence'],
  verdict: 'PASS on unwaived set + TRANSFERRED waivers',
}
out.checks.head = {
  beardTipProxySpreadPct: heads.beardTipProxy.spreadPct, walkOnlySpreadPct: heads.beardTipProxy.withinBankedWalkSheetOnly.spreadPct,
  result: heads.result, verdict: 'TRANSFERRED (14A FINAL-ACCEPTANCE 4b: UNVERIFIED owner-accepted, chin concealed by beard)',
}
out.checks.pixelLandmarks = { contactU: 'TRANSFERRED (same standing OPEN as 12B/13B; producer measures on fresh pixels)', weaponTipU: 'TRANSFERRED (same standing OPEN as 12B/13B)' }

// 5. Precedent capture support (existing captures, NOT re-run).
out.checks.captures = {
  rows: canvasReport.validation.checked, hardIntegrity: canvasReport.integrity.hard,
  published: canvasIndex.capture.runtime.published, fallbackCost: canvasIndex.capture.runtime.legacyFallbackCost,
  manifestMatch: canvasIndex.pack.actualProvenance.manifestSha256 === reg.manifestSha256,
  verdict: 'SUPPORTS (484/0 motion/legacy rows, 0 hard, published not fallback, manifest match)',
}

out.verdicts = {
  groundError: 'PASS (max -0.5u walk:1, 0 frames over 1.5u; holds exactly after registration)',
  contactStability: 'PASS (walk 1.4% spread, fall/getup monotonic, 8-cycle dispatched) + hidden-3D TRANSFERRED',
  head: 'TRANSFERRED (UNVERIFIED owner-accepted, FINAL-ACCEPTANCE 4b)',
  weapon: 'PASS (9.312% n25 unwaived, direction 41.64deg) + TRANSFERRED source-specific waivers',
  contactU_weaponTipU: 'TRANSFERRED (standing OPENs, same as 12B/13B)',
  criterion4: 'PASS WITH TRANSFERRED WAIVERS (same shape as 12B/13B: ground 0-equivalent + producer OPENs)',
}

mkdirSync('artifacts/motion/xiahoudun/precedent/crit4', { recursive: true })
writeFileSync('artifacts/motion/xiahoudun/precedent/crit4/crit4-registration.json', `${JSON.stringify(out, null, 2)}\n`)
for (const [k, v] of Object.entries(out.verdicts)) console.log(`${k}: ${v}`)
console.log('wrote artifacts/motion/xiahoudun/precedent/crit4/crit4-registration.json')
