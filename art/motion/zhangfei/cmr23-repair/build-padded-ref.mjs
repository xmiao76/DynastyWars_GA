// CMR-23 Zhang Fei settled-grab pilot — deterministic padded reference (zero
// generation). Restores the settled misc:3 cell (hold4/hold8, shaft fist) from
// the prepared pack via scripts/paired-contact-measure.mjs restoreCell, places
// it UNCHANGED 1:1 centred on a 1536x1024 transparent canvas (prior
// isolated-edit pattern: xuchu phase-b placed its 1024x768 cell centred at
// (256,128); a 520x288 cell centres at ((1536-520)/2,(1024-288)/2)=(508,368)).
// Target hand centroid: world (248,140) inverted through the trace holder
// transform (artifacts/motion/paired/zhangfei/canvas/trace.json hold4,
// right-facing, identical for every victim kind: display x229.3 y220,
// scaleX/Y 0.5, displayOrigin 260,272, flipX false):
//   cellX = 260 + (248-229.3)/0.5 = 297.4 ; cellY = 272 + (140-220)/0.5 = 112.0
//   canvas = offset + cell = (805.4, 480.0) -> briefed as (805,480).
// Also writes the misc:2 donor cell and walk:0 guard cell (restored 520x288)
// as references 2/3, plus a marked preview (never sent).
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas } from '@napi-rs/canvas'
import { restoreCell, cellCanvas, alphaPoints, centroid, toWorld, bootGround } from '../../../../scripts/paired-contact-measure.mjs'

const dir = 'art/motion/zhangfei/cmr23-repair/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const fileSha = (p) => sha(readFileSync(p))
const W = 1536, H = 1024
const WORLD = [248, 140]
const landmarks = JSON.parse(readFileSync('art/motion/paired-contact-landmarks.json', 'utf8'))
const trace = JSON.parse(readFileSync('artifacts/motion/paired/zhangfei/canvas/trace.json', 'utf8'))
const holds = trace.core.filter((c) => c.phase === 'hold4' && c.facing === 'right')
if (!holds.length) throw new Error('no hold4 right samples')
const disp = holds[0].holder.sprite.display
for (const h of holds) {
  const d = h.holder.sprite.display
  if (h.holder.sprite.frame !== 'entity:zhangfei:motion:misc:3'
    || d.x !== disp.x || d.y !== disp.y || d.scaleX !== disp.scaleX || d.scaleY !== disp.scaleY
    || d.displayOriginX !== disp.displayOriginX || d.displayOriginY !== disp.displayOriginY || d.flipX !== disp.flipX) {
    throw new Error(`holder transform not uniform at ${h.kind}`)
  }
}
const cellTarget = [disp.displayOriginX + (WORLD[0] - disp.x) / disp.scaleX, disp.displayOriginY + (WORLD[1] - disp.y) / disp.scaleY]

const misc3 = restoreCell('zhangfei', 'misc:3')
const misc2 = restoreCell('zhangfei', 'misc:2')
const walk0 = restoreCell('zhangfei', 'walk:0')
for (const r of [misc3, misc2, walk0]) if (r.srcW !== 520 || r.srcH !== 288) throw new Error(`cell size ${r.frame}`)
const OX = (W - misc3.srcW) / 2, OY = (H - misc3.srcH) / 2
const canvasTarget = [OX + cellTarget[0], OY + cellTarget[1]]
const groundCanvasY = OY + disp.displayOriginY

function bbox(r) {
  const pts = alphaPoints(r)
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  return { alphaPx: pts.length, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] }
}
function roiInfo(r, key) {
  const roi = landmarks.frames[key].roi
  const pts = alphaPoints(r, roi)
  const cCell = centroid(pts)
  const cWorld = centroid(toWorld(pts, disp, r.srcW).map((p) => [p[0], p[1]]))
  return { roi, alphaPx: pts.length, centroidCellPx: cCell.map((v) => +v.toFixed(2)), centroidWorldU: cWorld.map((v) => +v.toFixed(2)), centroidCanvasPx: [+(OX + cCell[0]).toFixed(2), +(OY + cCell[1]).toFixed(2)] }
}

const save = (name, cv) => { const b = cv.toBuffer('image/png'); writeFileSync(dir + name, b); return { path: dir + name, sha256: sha(b), bytes: b.length } }
const donor = save('misc2-donor-cell.png', cellCanvas(misc2))
const guard = save('walk0-guard-cell.png', cellCanvas(walk0))
const restored = save('misc3-restored-cell.png', cellCanvas(misc3))

const cv = createCanvas(W, H); const g = cv.getContext('2d')
g.drawImage(cellCanvas(misc3), OX, OY)
const padded = save('misc3-padded-ref.png', cv)

const mc = createCanvas(W, H); const m = mc.getContext('2d')
m.fillStyle = '#28222e'; m.fillRect(0, 0, W, H)
m.drawImage(cellCanvas(misc3), OX, OY)
m.strokeStyle = '#00ff80'; m.lineWidth = 2; m.beginPath(); m.moveTo(0, groundCanvasY); m.lineTo(W, groundCanvasY); m.stroke()
m.fillStyle = '#00ff80'; m.font = '20px sans-serif'; m.fillText(`ground (cell originY 272) y=${groundCanvasY}`, 12, groundCanvasY - 8)
m.strokeStyle = '#ff4040'; m.lineWidth = 3
m.beginPath(); m.moveTo(canvasTarget[0] - 18, canvasTarget[1]); m.lineTo(canvasTarget[0] + 18, canvasTarget[1]); m.moveTo(canvasTarget[0], canvasTarget[1] - 18); m.lineTo(canvasTarget[0], canvasTarget[1] + 18); m.stroke()
m.fillStyle = '#ff4040'; m.fillText(`TARGET hand centroid canvas (${canvasTarget[0].toFixed(1)},${canvasTarget[1].toFixed(1)}) = cell (${cellTarget[0].toFixed(1)},${cellTarget[1].toFixed(1)}) = world (248,140)`, canvasTarget[0] + 24, canvasTarget[1] - 10)
const marked = save('misc3-padded-marked.png', mc)

const frameRec = (r) => ({ frame: r.frame, srcW: r.srcW, srcH: r.srcH, cell: r.cell, bbox: bbox(r), boot: bootGround(r, disp) })
const manifest = {
  work: 'cmr23-zhangfei-pilot-generate', zeroGeneration: true,
  sources: {
    prepared: { path: 'src/game/assets/motion/zhangfei-prepared.json', sha256: fileSha('src/game/assets/motion/zhangfei-prepared.json') },
    sheets: {
      sheet: { path: 'src/game/assets/motion/zhangfei-motion-sheet.png', sha256: fileSha('src/game/assets/motion/zhangfei-motion-sheet.png') },
      actions: { path: 'src/game/assets/motion/zhangfei-actions-sheet.png', sha256: fileSha('src/game/assets/motion/zhangfei-actions-sheet.png') },
    },
    trace: { path: 'artifacts/motion/paired/zhangfei/canvas/trace.json', sha256: fileSha('artifacts/motion/paired/zhangfei/canvas/trace.json') },
    landmarks: { path: 'art/motion/paired-contact-landmarks.json', sha256: fileSha('art/motion/paired-contact-landmarks.json') },
    walkSourceSheet: { path: 'art/motion/zhangfei/walk-candidate-2.png', sha256: fileSha('art/motion/zhangfei/walk-candidate-2.png'), note: 'accepted/banked walk sheet; walk:0 guard is its pack cell restored above' },
    restoreMethod: 'scripts/paired-contact-measure.mjs restoreCell (trim undone, density-2 full source cell)',
  },
  cells: { 'misc:3-settled': frameRec(misc3), 'misc:2-donor': frameRec(misc2), 'walk:0-guard': frameRec(walk0) },
  traceHolderTransform: { sample: 'hold4 right-facing (also hold8; frame entity:zhangfei:motion:misc:3), uniform across all 6 victim kinds (asserted in this script)', display: disp, holderEntity: [holds[0].holder.x, holds[0].holder.y] },
  targetMath: {
    worldTargetU: WORLD,
    formula: 'cell = displayOrigin + (world - display.xy)/scale (flipX false); canvas = paddedOffset + cell (scale 1:1)',
    cellPx: cellTarget.map((v) => +v.toFixed(2)),
    canvasPx: canvasTarget.map((v) => +v.toFixed(2)),
    canvasPxBriefed: canvasTarget.map((v) => Math.round(v)),
    checkWorldFromCell: [+(disp.x + (cellTarget[0] - disp.displayOriginX) * disp.scaleX).toFixed(3), +(disp.y + (cellTarget[1] - disp.displayOriginY) * disp.scaleY).toFixed(3)],
  },
  existingHands: { 'misc:3-shaftFist': roiInfo(misc3, 'zhangfei:misc:3'), 'misc:2-donorClaw': roiInfo(misc2, 'zhangfei:misc:2') },
  canvas: { size: [W, H], fill: 'transparent (alpha 0)', placement: { offset: [OX, OY], scale: 1, note: 'restored 520x288 cell centred 1:1, pixels unchanged; NO guide/ground/target marks in sent ref' }, groundCanvasY, originCanvasPx: [OX + disp.displayOriginX, OY + disp.displayOriginY] },
  references: {
    order1PaddedSettledMisc3: { ...padded, sent: true },
    order2DonorMisc2Cell: { ...donor, size: [520, 288], sent: true },
    order3WalkGuardCell: { ...guard, size: [520, 288], sent: true },
    restoredMisc3Cell: { ...restored, size: [520, 288], sent: false },
    markedPreview: { ...marked, sent: false },
  },
}
writeFileSync(dir + 'padded-ref.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ offset: [OX, OY], cellTarget, canvasTarget, groundCanvasY, padded, donor, guard, existingHands: manifest.existingHands }, null, 2))
