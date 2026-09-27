import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
// Fresh, deliberately distinct diagnostic image: 5 hand cells + huge
// "HANDS-DIAG" lettering, to test whether read_image displays right bytes.
const img = await loadImage('artifacts/look/hands-guanyu.png')
const out = createCanvas(img.width, img.height + 40)
const g = out.getContext('2d')
g.fillStyle = '#111111'
g.fillRect(0, 0, out.width, out.height)
g.drawImage(img, 0, 40)
g.font = 'bold 30px sans-serif'
g.fillStyle = '#00ff00'
g.fillText('HANDS-DIAG-GUANYU 960x234', 10, 32)
writeFileSync('artifacts/look/diag-hands-a.png', out.toBuffer('image/png'))
console.log('wrote artifacts/look/diag-hands-a.png', out.width + 'x' + out.height)
