// Probe: clean shaft-only runs between front grip and socket on registered cells.
// Reads measure.json landmarks; no writes except stdout. Zero generation.
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
const G = 'art/motion/xuchu/closeout-campaign/07-charge/gate/'
const m = JSON.parse(readFileSync(G + 'measure.json', 'utf8'))
const S = m.sheetScale
for (const k of m.keeps) {
  const png = PNG.sync.read(readFileSync(G + 'cells-registered/' + k.name + '-registered.png'))
  const W = png.width, H = png.height
  const butt = k.registeredMeasure.butt, tip = k.registeredMeasure.tip
  let ux = tip[0] - butt[0], uy = tip[1] - butt[1]; const L = Math.hypot(ux, uy); ux /= L; uy /= L
  const vx = -uy, vy = ux
  const extentAt = (t) => {
    let lo = null, hi = null, gaps = 0, prev = false
    for (let p = -40; p <= 40; p++) {
      const x = Math.round(butt[0] + ux * t + vx * p), y = Math.round(butt[1] + uy * t + vy * p)
      const on = x >= 0 && y >= 0 && x < W && y < H && png.data[((y * W + x) << 2) + 3] >= 16
      if (on) { if (lo === null) lo = p; hi = p; if (!prev && lo !== p) gaps++ }
      prev = on
    }
    return lo === null ? null : { lo, hi, w: hi - lo + 1, gaps }
  }
  const clean = (t) => { const e = extentAt(t); return e && e.w <= 30 && e.gaps === 0 && e.lo <= 0 && e.hi >= 0 }
  const f1 = Math.round(k.nativeLandmarks.frontGripTNative[1] * S)
  const sock = Math.round(k.retouch.feasibility.socketTReg)
  const runs = []; let cur = null
  const profile = []
  for (let t = f1; t <= sock + 40; t += 4) {
    const e = extentAt(t); const c = clean(t)
    profile.push(`${t}:${e ? e.w + (e.gaps ? 'g' + e.gaps : '') : '-'}${c ? '*' : ''}`)
    if (c) { if (!cur) cur = [t, t]; else cur[1] = t } else if (cur) { runs.push(cur); cur = null }
  }
  if (cur) runs.push(cur)
  const needExtra = Math.max(0, k.retouch.feasibility.removeToBandHiPx - k.retouch.feasibility.buttAvailPx)
  console.log(k.name, 'frontGripEndT=' + f1, 'socketT=' + sock, 'L=' + Math.round(L), 'cleanRuns(frontGrip->socket+40)=', JSON.stringify(runs), 'needExtraBeyondButtToBandHi=' + needExtra)
  console.log('  profile t:width(*=clean):', profile.join(' '))
}
