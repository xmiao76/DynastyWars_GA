// CMR-15A COMPLETION Phase B — deterministic padded reference for ORIGINAL heavy
// cell2-crushing-chop (zero generation). Source = the gate-registered cell2
// (1024x768, one uniform sheet scale 1.5249169435215948, sole->groundY canvas,
// sha256 pinned below). It is placed UNCHANGED (1:1, padded scale s=1.0) at
// offset (256,128) on a 1536x1024 TRANSPARENT canvas (alpha 0), so the empty
// left/rear margin can hold the missing butt cap and cap/tip both stay in frame.
// Sent ref carries NO drawn guide/ground line (walk3-attempt2 retained-line seam
// lesson); geometry is briefed numerically. Marked preview (never sent) draws
// ground line, 40px margin box, and the target cap->tip axis.
// Geometry (registered px from 09-heavy/gate/measure.json cell2):
//   bounds x152-873 y359-758; stub butt(rear-hand exit) [536.24,539.44],
//   tip [866,669], stub 354.3px = 92.10u @21.45deg, soles 757/758, crown 359.
// Padded (offset +256,+128, s=1): soles/ground y=886, crown y=487,
//   stub butt [792,667], old tip [1122,797].
// Frozen band 479-529 registered px target ~504; at padded scale 1.0 the
// NATIVE (output 1536x1024) target is therefore 479-529px target ~504px.
// A straight extension of the 21.45deg stub at 504px puts the cap ON the torso,
// and keeping the old tip while extending to empty space overshot to 163.30u in
// the focused fix. Target axis (shallower ~14.5deg, through both grips):
//   cap [515,603] (empty left of the skirt/back silhouette) -> tip [1000,728],
//   length sqrt(485^2+125^2)=500.9px, angle atan2(125,485)=14.46deg.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const dir = 'art/motion/xuchu/closeout-campaign/09-heavy/phase-b/'
const src = 'art/motion/xuchu/closeout-campaign/09-heavy/gate/cells-registered/cell2-crushing-chop-registered.png'
const PIN = '6c59ba43f7fc04511f11be1bf202c252da3d49cc4bff49503f3ceee0a31d8ca1'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const OX = 256, OY = 128, W = 1536, H = 1024, GROUND = 886, MARGIN = 40
const cap = [515, 603], tip = [1000, 728]
const targetLen = Math.hypot(tip[0] - cap[0], tip[1] - cap[1])
const targetAng = Math.atan2(tip[1] - cap[1], tip[0] - cap[0]) * 180 / Math.PI

const srcBuf = readFileSync(src)
if (sha(srcBuf) !== PIN) throw new Error('source pin mismatch')
const img = await loadImage(src)
if (img.width !== 1024 || img.height !== 768) throw new Error('source size')

const cv = createCanvas(W, H); const g = cv.getContext('2d')
g.drawImage(img, OX, OY)
const refBuf = cv.toBuffer('image/png')
writeFileSync(dir + 'cell2-padded-ref.png', refBuf)

const mc = createCanvas(W, H); const m = mc.getContext('2d')
m.fillStyle = '#202020'; m.fillRect(0, 0, W, H)
m.drawImage(img, OX, OY)
m.strokeStyle = '#00ff80'; m.lineWidth = 3; m.beginPath(); m.moveTo(0, GROUND); m.lineTo(W, GROUND); m.stroke()
m.fillStyle = '#00ff80'; m.font = '22px sans-serif'; m.fillText('ground/soles y=886@1536x1024', 12, GROUND - 10)
m.strokeStyle = '#ffe040'; m.lineWidth = 3; m.strokeRect(MARGIN, MARGIN, W - 2 * MARGIN, H - 2 * MARGIN)
m.fillStyle = '#ffe040'; m.fillText('40px margin box: cap+tip inside', MARGIN + 8, MARGIN + 28)
m.strokeStyle = '#ff4040'; m.lineWidth = 4; m.beginPath(); m.moveTo(...cap); m.lineTo(...tip); m.stroke()
for (const [p, t] of [[cap, 'TARGET CAP [515,603] empty rear margin'], [tip, 'TARGET TIP [1000,728]']]) {
  m.fillStyle = '#ff4040'; m.beginPath(); m.arc(p[0], p[1], 10, 0, 7); m.fill(); m.fillText(t, p[0] + 14, p[1] - 12)
}
m.fillStyle = '#ffffff'; m.fillText(`target axis ${targetLen.toFixed(1)}px @${targetAng.toFixed(2)}deg (band 479-529 target ~504, padded scale 1.0)`, 430, 560)
m.fillStyle = '#40c8ff'; m.beginPath(); m.arc(792, 667, 8, 0, 7); m.fill(); m.fillText('stub butt/rear hand [792,667]', 806, 660)
m.beginPath(); m.arc(1122, 797, 8, 0, 7); m.fill(); m.fillText('OLD tip [1122,797] (move closer)', 900, 830)
const markedBuf = mc.toBuffer('image/png')
writeFileSync(dir + 'cell2-padded-marked.png', markedBuf)

const manifest = {
  work: 'cmr15a-heavy-cell2-generate (COMPLETION CAMPAIGN Phase B)', zeroGeneration: true,
  source: { path: src, sha256: PIN, size: [1024, 768], role: 'original heavy cell2-crushing-chop after gate registration (scale 1.5249169435215948); identity/pose/camera/scale/ground truth' },
  canvas: { size: [W, H], fill: 'transparent (alpha 0)', placement: { offset: [OX, OY], scale: 1.0, note: 'registered cell pixels unchanged 1:1; NO guide/ground line in sent ref' } },
  geometryRegisteredPx: { bounds: [152, 359, 873, 758], crownY: 359, soleY: [757, 758], stubButtRearHand: [536.24, 539.44], stubTip: [866, 669], stubPx: 354.3, stubU: 92.1, stubAngleDeg: 21.45, bodyCrouchedCrownSolePx: 398 },
  geometryPaddedPx: { crownY: 487, groundSoleY: GROUND, stubButtRearHand: [792, 667], oldTip: [1122, 797] },
  weaponTarget: {
    frozenBandRegisteredPx: [479, 529], frozenTargetRegisteredPx: 504, bandU: [124.41, 137.50],
    paddedScale: 1.0, nativeOutputBandPx: [479, 529], nativeOutputTargetPx: 504,
    derivation: '479-529 registered px x padded scale 1.0 = 479-529 native px on the 1536x1024 output canvas (target 504); ratio 504/459 = 1.10x standing crown-sole (this crouched pose measures 398px crown-sole, so do NOT scale the weapon to the crouch height)',
    targetCapPadded: cap, targetTipPadded: tip, targetAxisPx: +targetLen.toFixed(1), targetAxisDeg: +targetAng.toFixed(2),
    whyShallower: 'straight 21.45deg stub extension at 504px lands the cap on the torso; keeping the old tip and extending into empty space overshot to 163.30u in the focused fix. Redraw the whole glaive on the shallower ~14.5deg axis through both hands: cap in empty space left of the skirt/back, tip closer than the old tip.'
  },
  paddedReference: { path: dir + 'cell2-padded-ref.png', sha256: sha(refBuf), bytes: refBuf.length, sent: true },
  markedPreview: { path: dir + 'cell2-padded-marked.png', sha256: sha(markedBuf), bytes: markedBuf.length, sent: false },
}
writeFileSync(dir + 'padded-ref.json', JSON.stringify(manifest, null, 2) + '\n')
console.log('ref', sha(refBuf), refBuf.length, 'marked', sha(markedBuf), 'axis', targetLen.toFixed(1), targetAng.toFixed(2))
