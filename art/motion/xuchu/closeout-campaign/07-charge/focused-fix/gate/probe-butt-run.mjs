// Diagnostic: perp alpha extent along butt->tip axis for cell0/cell3 registered cells.
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
const G = 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
for (const idx of [0, 3]) {
  const k = m.keeps[idx]
  const png = PNG.sync.read(readFileSync(G + 'cells-registered/' + k.finalFile.replace('-retouched', '-registered')))
  const W = png.width, H = png.height
  const butt = k.registeredMeasure.butt, tip = k.registeredMeasure.tip
  let ux = tip[0] - butt[0], uy = tip[1] - butt[1]; const L = Math.hypot(ux, uy); ux /= L; uy /= L
  const vx = -uy, vy = ux
  const rear0 = k.nativeLandmarks.rearGripTNative[0] * m.sheetScale
  const front1 = k.nativeLandmarks.frontGripTNative[1] * m.sheetScale
  console.log(`cell${idx} rearGripStartT~${rear0.toFixed(0)} frontGripEndT~${front1.toFixed(0)}`)
  for (let t = 4; t <= Math.ceil(rear0) + 10; t += 4) {
    let lo = null, hi = null, gaps = 0, prev = false
    for (let p = -56; p <= 56; p++) {
      const x = Math.round(butt[0] + ux * t + vx * p), y = Math.round(butt[1] + uy * t + vy * p)
      const on = x >= 0 && y >= 0 && x < W && y < H && png.data[((y * W + x) << 2) + 3] >= 16
      if (on) { if (lo === null) lo = p; hi = p; if (!prev && lo !== p) gaps++ }
      prev = on
    }
    console.log(`  t=${t} lo=${lo} hi=${hi} w=${lo === null ? 0 : hi - lo + 1} gaps=${gaps}`)
  }
}
