// Probe (cmr15a-phase3-getup-gates): verify the build.mjs clean-run scan on the
// getup REGISTERED (pre-retouch) cells 1/2/7, whose reported butt availability is
// 0 despite apparently clean shafts. Prints the perp-extent profile along the butt->tip axis exactly as
// build.mjs extentAt computes it (perp +-56, alpha>=16): a t is shaft-only iff the
// extent is a single run of width<=30 with no gaps. Deterministic, read-only.
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
const G = 'art/motion/xuchu/closeout-campaign/12-getup/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
for (const name of ['cell1-elbow', 'cell2-kneel', 'cell7-spare-getup-c', 'cell0-down']) {
  const r = m.all.find(x => x.name === name)
  const png = PNG.sync.read(readFileSync(G + `cells-registered/${name}-registered.png`))
  const W = png.width, H = png.height
  const butt = r.registeredMeasure.butt, tip = r.registeredMeasure.tip
  let ux = tip[0] - butt[0], uy = tip[1] - butt[1]; const L = Math.hypot(ux, uy); ux /= L; uy /= L
  const vx = -uy, vy = ux
  const rows = []
  for (let t = 0; t <= 160; t += 4) {
    let lo = null, hi = null, gaps = 0, prev = false
    for (let p = -56; p <= 56; p++) {
      const x = Math.round(butt[0] + ux * t + vx * p), y = Math.round(butt[1] + uy * t + vy * p)
      const on = x >= 0 && y >= 0 && x < W && y < H && png.data[((y * W + x) << 2) + 3] >= 16
      if (on) { if (lo === null) lo = p; hi = p; if (!prev && lo !== p) gaps++ }
      prev = on
    }
    const w = lo === null ? 0 : hi - lo + 1
    rows.push(`t${t}:w${w}${gaps ? '/g' + gaps : ''}[${lo},${hi}]`)
  }
  console.log(name, 'rearGripTReg~', Math.round(r.nativeLandmarks.rearGripTNative[0] * m.sheetScale), rows.join(' '))
}
