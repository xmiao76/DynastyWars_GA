import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

// Mirror the boot publish checks in Node: dims + content signature + sha256.
function signature(im) {
  let hex = ''
  for (let by = 0; by < 32; by++) for (let bx = 0; bx < 48; bx++) {
    const sums = [0, 0, 0, 0]; let n = 0
    for (let y = Math.floor(by * im.height / 32); y < Math.floor((by + 1) * im.height / 32); y++) {
      for (let x = Math.floor(bx * im.width / 48); x < Math.floor((bx + 1) * im.width / 48); x++) {
        const k = (y * im.width + x) * 4, a = im.data[k + 3] / 255
        for (let j = 0; j < 3; j++) sums[j] += im.data[k + j] * a
        sums[3] += im.data[k + 3]; n++
      }
    }
    for (const sum of sums) hex += Math.round(sum / Math.max(1, n)).toString(16).padStart(2, '0')
  }
  return hex
}
const close = (a, b) => {
  // imageSignature comparison: signatureMatches allows small drift; compare exactly first.
  let diff = 0
  for (let i = 0; i < a.length; i += 2) diff += Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16))
  return diff
}
for (const pack of ['hero-bodies', 'mook-bodies', 'boss-bodies']) {
  const prep = JSON.parse(readFileSync(`src/game/assets/${pack}/prepared.json`, 'utf8'))
  for (const [id, m] of Object.entries(prep)) {
    const png = readFileSync(`src/game/assets/${pack}/${id}-sheet.png`)
    const sha = createHash('sha256').update(png).digest('hex')
    const img = await loadImage(`src/game/assets/${pack}/${id}-sheet.png`)
    const cv = createCanvas(img.width, img.height)
    const g = cv.getContext('2d')
    g.drawImage(img, 0, 0)
    const sig = signature(g.getImageData(0, 0, img.width, img.height))
    const ok = sha === m.sha256.sheet && img.width === m.sheet.width && sig === m.signatures.sheet
    console.log(`${id.padEnd(11)} dims ${img.width}x${img.height}/${m.sheet.width}x${m.sheet.height} sha ${sha === m.sha256.sheet ? 'OK' : 'MISMATCH'} sig ${sig === m.signatures.sheet ? 'OK' : 'DIFF' + close(sig, m.signatures.sheet)}`)
  }
}
