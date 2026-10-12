// CMR-15A CLOSEOUT AMENDMENT — padded provider references (zero generation).
// Practice followed: the 96px-transparent-padding finishing practice noted for
// CMR-14A (docs/motion-tasks/CMR-15A-FEASIBILITY-PLAN.md) generalised to a full
// centred pad — the original 512x512 cell is placed UNCHANGED (1:1, no resize,
// no repaint) at offset (256,256) on a 1024x1024 TRANSPARENT canvas (fill stated:
// transparent, alpha 0; the cell's own transparent background is preserved).
// Two files per key:
//  - walkN-padded-ref.png      : the reference to send to the provider — padded
//                                cell plus a SUBTLE ground line (alpha-blended
//                                green, 2px) at the scaled frozen groundY.
//  - walkN-padded-marked.png   : SEPARATE marked preview (never sent) — same pad
//                                plus ground line (full strength), the tip-margin
//                                box inset 40px from every edge (tip must stay
//                                inside it: >=40px margin), the centred-cell
//                                placement box, and labels.
// Scaled groundY: frozen groundY 500@512 x2 = 1000@1024 canvas. The provider is
// briefed (future prompt, not in this package) to author the full 1024 canvas
// with soles on that line and the whole glaive tip inside the 40px margin box.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const dir = 'art/motion/xuchu/closeout-campaign/padded-refs/'
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const KEYS = [
  { name: 'walk3', src: 'art/motion/xuchu/closeout-campaign/refs/walk3-original-cell.png', pin: '947d6b77c73d0db2754cdbd59c13b71b4df2f7876b7823e2f032da4a5845883c' },
  { name: 'walk4', src: 'art/motion/xuchu/closeout-campaign/refs/walk4-original-cell.png', pin: 'b96d7d5295488b78b042c13507d92a4e194d93c6635fa99606e7924360db4d4a' },
  { name: 'walk5', src: 'art/motion/xuchu/closeout-campaign/refs/walk5-original-cell.png', pin: '3baccee1ca374ec693e298b2647d786af7fe578429660218dde8f5124c1e1937' },
]
const GROUND_Y_1024 = 1000 // frozen 500@512 scaled x2
const MARGIN = 40
const manifest = {
  work: 'cmr15a-amend-setup-padded-refs', zeroGeneration: true,
  canvas: { size: [1024, 1024], fill: 'transparent (alpha 0)', cellPlacement: { offset: [256, 256], size: [512, 512], scale: 1, note: 'original cell centred 1:1, pixels unchanged' } },
  groundLine: { yAt1024: GROUND_Y_1024, basis: 'frozen groundY 500@512 x2', inSentReference: 'subtle (rgba(0,255,128,0.45), 2px)', inMarkedPreview: 'full strength with label' },
  tipMarginBox: { insetPx: MARGIN, rect: [MARGIN, MARGIN, 1024 - 2 * MARGIN, 1024 - 2 * MARGIN], rule: 'whole glaive tip must stay inside this box (>=40px from every canvas edge)', drawnIn: 'marked preview only' },
  refs: [],
}
for (const k of KEYS) {
  const srcBuf = readFileSync(k.src)
  const img = await loadImage(k.src)
  // Sent reference: transparent pad + centred cell + subtle ground line.
  const cv = createCanvas(1024, 1024); const g = cv.getContext('2d')
  g.drawImage(img, 256, 256)
  g.strokeStyle = 'rgba(0,255,128,0.45)'; g.lineWidth = 2
  g.beginPath(); g.moveTo(0, GROUND_Y_1024); g.lineTo(1024, GROUND_Y_1024); g.stroke()
  const refBuf = cv.toBuffer('image/png')
  writeFileSync(dir + `${k.name}-padded-ref.png`, refBuf)
  // Marked preview (separate, never sent).
  const mc = createCanvas(1024, 1024); const m = mc.getContext('2d')
  m.drawImage(img, 256, 256)
  m.strokeStyle = '#00ff80'; m.lineWidth = 3; m.beginPath(); m.moveTo(0, GROUND_Y_1024); m.lineTo(1024, GROUND_Y_1024); m.stroke()
  m.fillStyle = '#00ff80'; m.font = '20px sans-serif'; m.fillText('groundY 1000@1024 (frozen 500@512)', 12, GROUND_Y_1024 - 10)
  m.strokeStyle = '#ffe040'; m.lineWidth = 3; m.strokeRect(MARGIN, MARGIN, 1024 - 2 * MARGIN, 1024 - 2 * MARGIN)
  m.fillStyle = '#ffe040'; m.fillText('tip-margin box: tip inside, >=40px from edges', MARGIN + 8, MARGIN + 26)
  m.strokeStyle = '#ff40ff'; m.lineWidth = 2; m.strokeRect(256, 256, 512, 512)
  m.fillStyle = '#ff40ff'; m.fillText('original cell centred 1:1 at (256,256)', 264, 282)
  const markedBuf = mc.toBuffer('image/png')
  writeFileSync(dir + `${k.name}-padded-marked.png`, markedBuf)
  manifest.refs.push({
    key: k.name, source: { path: k.src, sha256: sha(srcBuf), pinned: sha(srcBuf) === k.pin },
    paddedReference: { path: dir + `${k.name}-padded-ref.png`, sha256: sha(refBuf), bytes: refBuf.length },
    markedPreview: { path: dir + `${k.name}-padded-marked.png`, sha256: sha(markedBuf), bytes: markedBuf.length },
  })
  console.log(k.name, 'srcPin', sha(srcBuf) === k.pin, 'ref', sha(refBuf), 'marked', sha(markedBuf))
}
writeFileSync(dir + 'padded-refs.json', JSON.stringify(manifest, null, 2) + '\n')
