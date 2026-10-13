// CMR-15A COMPLETION Phase B — deterministic padded reference for ORIGINAL heavy
// cell3-follow-through (zero generation). Same geometry as cell2 (phase-b/):
// gate-registered cell (1024x768, sheet scale 1.5249169435215948, sha pinned)
// placed UNCHANGED 1:1 (padded scale 1.0) at (256,128) on 1536x1024 TRANSPARENT
// canvas; NO guide/ground line in the sent ref; marked preview never sent.
// Cell3 registered (09-heavy/gate/measure.json): bounds x112-913 y360-758,
// stub butt(rear-hand exit) [601.3,549.88], tip [907,683], stub 333.43px =
// 86.68u @23.53deg, soles 751/758, crown 360, crouched body 396.48px.
// Padded: soles/ground y=886, crown y=488, stub butt/grip [857,678], old tip [1163,811].
// CORRECTED BRIEF (cell2 measured overshoot): cell2 final axis 620.2px/161.23u
// (native raw 961.67px on a +43.36% enlarged figure; weapon/body ratio 1.68).
// Target cap = 82% x 620.2 = 508.6 -> HARD MAX 508 native px. Aiming registered
// ~500px in frozen band 479-529px ([124.41,137.50]u): target axis
// cap [545,585] (empty rear margin left of the back) -> tip [1020,725],
// length 495.2px @16.42deg, line passes through the grip [857,678]
// (t=0.657, y=677). Weapon/body = 495/396.5 = 1.25x crouched crown-sole.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const dir = 'art/motion/xuchu/closeout-campaign/09-heavy/phase-b-cell3/'
const src = 'art/motion/xuchu/closeout-campaign/09-heavy/gate/cells-registered/cell3-follow-through-registered.png'
const PIN = '9d7a0c0230a3c8b94a53a8d0650ec9a28bdf84448bece2cd961adabd961c6ee6'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const OX = 256, OY = 128, W = 1536, H = 1024, GROUND = 886, MARGIN = 40
const cap = [545, 585], tip = [1020, 725], grip = [857, 678]
const targetLen = Math.hypot(tip[0] - cap[0], tip[1] - cap[1])
const targetAng = Math.atan2(tip[1] - cap[1], tip[0] - cap[0]) * 180 / Math.PI

const srcBuf = readFileSync(src)
if (sha(srcBuf) !== PIN) throw new Error('source pin mismatch')
const img = await loadImage(src)
if (img.width !== 1024 || img.height !== 768) throw new Error('source size')

const cv = createCanvas(W, H); const g = cv.getContext('2d')
g.drawImage(img, OX, OY)
const refBuf = cv.toBuffer('image/png')
writeFileSync(dir + 'cell3-padded-ref.png', refBuf)

const mc = createCanvas(W, H); const m = mc.getContext('2d')
m.fillStyle = '#202020'; m.fillRect(0, 0, W, H)
m.drawImage(img, OX, OY)
m.strokeStyle = '#00ff80'; m.lineWidth = 3; m.beginPath(); m.moveTo(0, GROUND); m.lineTo(W, GROUND); m.stroke()
m.fillStyle = '#00ff80'; m.font = '22px sans-serif'; m.fillText('ground/soles y=886@1536x1024', 12, GROUND - 10)
m.strokeStyle = '#ffe040'; m.lineWidth = 3; m.strokeRect(MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN)
m.fillStyle = '#ffe040'; m.fillText('40px margin box: cap+tip inside', MARGIN + 8, MARGIN + 28)
m.strokeStyle = '#ff4040'; m.lineWidth = 4; m.beginPath(); m.moveTo(...cap); m.lineTo(...tip); m.stroke()
for (const [p, t] of [[cap, 'TARGET CAP [545,585] empty rear margin'], [tip, 'TARGET TIP [1020,725]']]) {
  m.fillStyle = '#ff4040'; m.beginPath(); m.arc(p[0], p[1], 10, 0, 7); m.fill(); m.fillText(t, p[0] + 14, p[1] - 12)
}
m.fillStyle = '#ffffff'; m.fillText(`target axis ${targetLen.toFixed(1)}px @${targetAng.toFixed(2)}deg (HARD MAX 508 = 82% of cell2 620.2px; band 479-529)`, 430, 540)
m.fillStyle = '#40c8ff'; m.beginPath(); m.arc(...grip, 8, 0, 7); m.fill(); m.fillText('stub butt/grip [857,678]', 871, 671)
m.beginPath(); m.arc(1163, 811, 8, 0, 7); m.fill(); m.fillText('OLD tip [1163,811] (move closer)', 950, 845)
const markedBuf = mc.toBuffer('image/png')
writeFileSync(dir + 'cell3-padded-marked.png', markedBuf)

const manifest = {
  work: 'cmr15a-heavy-cell3-generate (COMPLETION CAMPAIGN Phase B)', zeroGeneration: true,
  source: { path: src, sha256: PIN, size: [1024, 768], role: 'original heavy cell3-follow-through after gate registration (scale 1.5249169435215948); identity/pose/camera/scale/ground truth' },
  canvas: { size: [W, H], fill: 'transparent (alpha 0)', placement: { offset: [OX, OY], scale: 1.0, note: 'same geometry as cell2 phase-b; registered pixels unchanged 1:1; NO guide/ground line in sent ref' } },
  geometryRegisteredPx: { bounds: [112, 360, 913, 758], crownY: 360, soleY: [751, 758], stubButtRearHand: [601.3, 549.88], stubTip: [907, 683], stubPx: 333.43, stubU: 86.68, stubAngleDeg: 23.53, bodyCrouchedCrownSolePx: 396.48 },
  geometryPaddedPx: { crownY: 488, groundSoleY: GROUND, stubButtGrip: grip, oldTip: [1163, 811] },
  weaponTarget: {
    frozenBandRegisteredPx: [479, 529], bandU: [124.41, 137.50], paddedScale: 1.0,
    correctedFromCell2: { cell2FinalAxisPx: 620.2, cell2FinalU: 161.23, cell2NativeRawPx: 961.67, cell2EnlargementPct: 43.36, cell2WeaponBodyRatio: 1.68, capFactor: 0.82, capPx: 508.6 },
    nativeOutputRangePx: [479, 508], nativeHardMaxPx: 508, nativeOutputTargetPx: +targetLen.toFixed(1),
    derivation: 'HARD MAX = 0.82 x cell2 final axis 620.2px = 508.6 -> 508px; aiming registered ~500px (frozen band 479-529) at padded scale 1.0, so briefed native range 479-508px with target axis 495.2px; weapon/body = 495.2/396.48 = 1.25x crouched crown-sole (cell2 produced 1.68x and FAILED +23.73u); figure must NOT be enlarged (crown y488, soles y886)',
    targetCapPadded: cap, targetTipPadded: tip, targetAxisPx: +targetLen.toFixed(1), targetAxisDeg: +targetAng.toFixed(2),
    axisNote: 'shallower than the 23.53deg stub, through the grip [857,678]: straight stub extension lands the cap on the torso and keeping the old tip overshoots; cap sits in empty space left of the back, tip much closer than old tip [1163,811]'
  },
  paddedReference: { path: dir + 'cell3-padded-ref.png', sha256: sha(refBuf), bytes: refBuf.length, sent: true },
  markedPreview: { path: dir + 'cell3-padded-marked.png', sha256: sha(markedBuf), bytes: markedBuf.length, sent: false },
}
writeFileSync(dir + 'padded-ref.json', JSON.stringify(manifest, null, 2) + '\n')
console.log('ref', sha(refBuf), refBuf.length, 'marked', sha(markedBuf), 'axis', targetLen.toFixed(1), targetAng.toFixed(2))
