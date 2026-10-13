// Diagnostic: locate changedOutside pixels in cell0 retouch.
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
const G = 'art/motion/xuchu/closeout-campaign/07-charge/focused-fix/gate/cells-registered/'
const a = PNG.sync.read(readFileSync(G + 'cell0-guard-registered.png'))
const b = PNG.sync.read(readFileSync(G + 'cell0-guard-retouched.png'))
const butt = [119.45, 331.2], tip = [651, 106]
let ux = tip[0] - butt[0], uy = tip[1] - butt[1]; const L = Math.hypot(ux, uy); ux /= L; uy /= L
const vx = -uy, vy = ux
const rear0 = 56.85 * 1.3539823008849559, front1 = 306.2 * 1.3539823008849559
for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
  const i = (y * a.width + x) << 2
  const same = a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2] && a.data[i + 3] === b.data[i + 3]
  if (same) continue
  const t = (x - butt[0]) * ux + (y - butt[1]) * uy, p = Math.abs((x - butt[0]) * vx + (y - butt[1]) * vy)
  const inRegion = (p <= 20 && t < rear0) || t >= front1
  if (!inRegion) console.log(`outside changed (${x},${y}) t=${t.toFixed(1)} p=${p.toFixed(1)} before=[${a.data[i]},${a.data[i+1]},${a.data[i+2]},${a.data[i+3]}] after=[${b.data[i]},${b.data[i+1]},${b.data[i+2]},${b.data[i+3]}]`)
}
