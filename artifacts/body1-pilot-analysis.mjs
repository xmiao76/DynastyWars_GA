/**
 * BODY-1 pilot analysis: bounding box (flood fill from corners with
 * tolerance) + ink coverage for the three pilot images. Informs the
 * BODY-2 preparation metadata design (crop/alpha/pivot).
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'

async function analyze(path, label) {
  const img = await loadImage(path)
  const c = createCanvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, img.width, img.height)
  const W = img.width
  const H = img.height
  const lum = (x, y) => {
    const p = (y * W + x) * 4
    return (data[p] + data[p + 1] + data[p + 2]) / 3
  }
  // Background = near-black; flood from all four corners, tolerance 18.
  const seen = new Uint8Array(W * H)
  const stack = [
    [0, 0],
    [W - 1, 0],
    [0, H - 1],
    [W - 1, H - 1],
  ]
  let bg = 0
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= W || y >= H) continue
    const i = y * W + x
    if (seen[i]) continue
    if (lum(x, y) > 18) continue
    seen[i] = 1
    bg += 1
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  let minX = W
  let minY = H
  let maxX = -1
  let maxY = -1
  let ink = 0
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (seen[y * W + x]) continue
      ink += 1
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  const total = W * H
  console.log(
    `${label}: ${W}x${H} bg=${((bg / total) * 100).toFixed(1)}% ` +
      `ink=${((ink / total) * 100).toFixed(1)}% ` +
      `bbox=x${minX}..${maxX} y${minY}..${maxY} ` +
      `(${(((maxX - minX + 1) / W) * 100).toFixed(0)}%w x ${(((maxY - minY + 1) / H) * 100).toFixed(0)}%h)`,
  )
}

await analyze('artifacts/look/body1-zhaoyun-bodypilot.jpg', 'zhaoyun-body')
await analyze('artifacts/look/body1-caocao-portrait.jpg', 'caocao-portrait')
await analyze('artifacts/look/body1-caocao-head.jpg', 'caocao-head')
