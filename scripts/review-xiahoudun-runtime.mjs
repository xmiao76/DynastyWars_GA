#!/usr/bin/env node
// Consumer evidence only. Read actual packed RGBA and actual live Sprite data;
// never modify source pixels/metadata or certify occluded anatomy/native pace.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { PNG } from 'pngjs'
const args = process.argv.slice(2)
const arg = (k, d) => args.includes(k) ? args[args.indexOf(k) + 1] : d
const out = arg('--out', 'artifacts/CMR-14B/transitions-01/pixel-review')
const traceRoot = arg('--traces', 'artifacts/CMR-14B/transitions-01/browser-run3')
const abs = resolve(out), rel = relative(resolve('.'), abs)
if (!rel || rel.startsWith('..')) throw new Error(`out outside repo ${abs}`)
if (existsSync(out)) throw new Error(`preserve evidence: output already exists ${abs}`)
mkdirSync(out, { recursive: true })
const bytes = readFileSync('src/game/assets/motion/xiahoudun-motion-sheet.png')
const atlas = PNG.sync.read(bytes)
const metaBytes = readFileSync('src/game/assets/motion/xiahoudun-prepared.json')
const meta = JSON.parse(metaBytes)
const hash = (b) => createHash('sha256').update(b).digest('hex')
const occupied = new Uint8Array(atlas.width * atlas.height)
const restored = new Map(), frameAudit = []
for (const [key, c] of Object.entries(meta.frames)) {
  const full = new PNG({ width: c.srcW, height: c.srcH })
  let drawn = 0, minAlpha = 255, maxAlpha = 0, edge = 0
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const src = ((c.y + y) * atlas.width + c.x + x) * 4, dest = ((c.trimY + y) * full.width + c.trimX + x) * 4
    occupied[(c.y + y) * atlas.width + c.x + x] = 1
    atlas.data.copy(full.data, dest, src, src + 4)
    const a = atlas.data[src + 3]
    if (a) { drawn++; minAlpha = Math.min(minAlpha, a); maxAlpha = Math.max(maxAlpha, a); if (c.trimX + x === 0 || c.trimY + y === 0 || c.trimX + x === full.width - 1 || c.trimY + y === full.height - 1) edge++ }
  }
  restored.set(key, full)
  frameAudit.push({ key, drawnAlphaPositivePixels: drawn, minPositiveAlpha: minAlpha, maxAlpha, fullCellPerimeterAlphaPositive: edge, sourceSize: [full.width, full.height], trim: [c.trimX, c.trimY], note: 'all alpha>0 preserved; no 255-only/component-count fragmentation gate' })
}
let outsideAlpha = 0, outsideSamples = 0
for (let i = 0; i < occupied.length; i++) if (!occupied[i]) { outsideSamples++; if (atlas.data[i * 4 + 3]) outsideAlpha++ }
const upright = [...Array.from({ length: 9 }, (_, i) => `walk:${i}`), ...Array.from({ length: 5 }, (_, i) => `misc:${i}`), 'getup:4']
const feet = createCanvas(1080, 15 * 130), fg = feet.getContext('2d')
fg.fillStyle = '#eeeeea'; fg.fillRect(0, 0, feet.width, feet.height)
for (const [i, key] of upright.entries()) {
  const full = restored.get(key), img = await loadImage(PNG.sync.write(full)), y = i * 130
  fg.fillStyle = '#202020'; fg.font = '16px sans-serif'; fg.fillText(`${key}: native density2 feet ROI x80..440 y330..436; SUPPORT only`, 5, y + 18)
  fg.drawImage(img, 80, 330, 360, 106, 0, y + 24, 360, 106)
  fg.strokeStyle = '#808080'
  for (let x = 80; x <= 440; x += 20) { fg.beginPath(); fg.moveTo(x - 80, y + 24); fg.lineTo(x - 80, y + 130); fg.stroke(); fg.fillText(`${x}`, 370 + (x - 80) * 1.7, y + 40) }
  // Enlarged same pixels, no silhouette fitting or new source generation.
  fg.imageSmoothingEnabled = false; fg.drawImage(img, 80, 380, 360, 56, 360, y + 18, 720, 112)
}
writeFileSync(`${out}/upright-feet-support.png`, feet.toBuffer('image/png'))
// Hand-located visible near-boot sole ROIs from the native support image.
// Optional landmarks are review data only, not production registration metadata.
const landmarksPath = arg('--landmarks', '')
const landmarks = landmarksPath ? JSON.parse(readFileSync(landmarksPath)) : {}
const contacts = [], gait = []
for (const renderer of ['canvas', 'webgl']) for (const facing of ['right', 'left']) {
  const trace = JSON.parse(readFileSync(`${traceRoot}/${renderer}-${facing}/trace.json`))
  const strip = createCanvas(3 * 360, 3 * 300), g = strip.getContext('2d'); g.fillStyle = '#171020'; g.fillRect(0, 0, strip.width, strip.height)
  for (const row of trace.rows.filter((r) => r.phase.startsWith('ground ') || r.phase.startsWith('freed release'))) {
    const mark = landmarks[row.key], full = restored.get(row.key), s = row.sprite
    if (!mark) { contacts.push({ renderer, facing, key: row.key, status: 'UNVERIFIED', reason: 'visible sole not yet manually located' }); continue }
    // Chosen material boot ROI; lowest row restricted to that boot, never global
    // lowest cloak/tassel. Any positive alpha is evidence including AA edges.
    let soleY = -1, soleXs = []
    for (let y = mark.roi[1]; y <= mark.roi[3]; y++) for (let x = mark.roi[0]; x <= mark.roi[2]; x++) if (full.data[(y * full.width + x) * 4 + 3] > 0) {
      if (y > soleY) { soleY = y; soleXs = [x] } else if (y === soleY) soleXs.push(x)
    }
    const px = (Math.min(...soleXs) + Math.max(...soleXs)) / 2, py = soleY + 1
    const worldX = s.x + ((s.flipX ? full.width - px : px) - s.displayOriginX) * Math.abs(s.scaleX)
    const worldY = s.y + (py - s.displayOriginY) * Math.abs(s.scaleY)
    contacts.push({ renderer, facing, key: row.key, label: mark.label, roi: mark.roi, nativePixelContact: [px, py], worldContact: [worldX, worldY], entity: [row.entity.x, row.entity.y], visiblePlaneRegistrationErrorU: worldY - row.entity.y, status: Math.abs(worldY - row.entity.y) <= 1.5 ? 'VISIBLE_PLANE_WITHIN_1.5U' : 'VISIBLE_PLANE_OUTSIDE_1.5U', hidden3D: 'UNVERIFIED', method: 'actual Sprite transform of manually identified drawn boot; front/rear perspective not inferred' })
  }
  for (const [i, t] of Array.from({ length: 9 }, (_, i) => i * 4).entries()) {
    const row = trace.walk[t], s = row.sprite, cam = trace.camera, full = restored.get(row.key), mark = landmarks[row.key]
    const scene = await loadImage(`${traceRoot}/${renderer}-${facing}/walk-${t}.png`)
    const x = (i % 3) * 360, y = Math.floor(i / 3) * 300
    const bx = (s.x - s.displayOriginX * s.scaleX - cam.scrollX) * cam.zoom, by = (s.y - s.displayOriginY * s.scaleY - cam.scrollY) * cam.zoom
    g.drawImage(scene, bx, by, full.width * s.scaleX * cam.zoom, full.height * s.scaleY * cam.zoom, x, y + 25, 260, 218)
    g.fillStyle = '#ffe2a0'; g.font = '13px sans-serif'; g.fillText(`${row.key} tick ${row.tick} x=${row.entity.x.toFixed(1)} (+${(t * 1.2).toFixed(1)}u)`, x + 4, y + 17)
    g.strokeStyle = '#3fe0ff'; g.beginPath(); g.moveTo(x, y + 235); g.lineTo(x + 260, y + 235); g.stroke()
    if (mark) {
      const c = contacts.find((c) => c.renderer === renderer && c.facing === facing && c.key === row.key && c.nativePixelContact)
      if (c) { const cx = (s.flipX ? full.width - c.nativePixelContact[0] : c.nativePixelContact[0]) * s.scaleX, cy = c.nativePixelContact[1] * s.scaleY
        g.strokeStyle = '#ffca32'; g.beginPath(); g.arc(x + cx, y + 25 + cy, 3, 0, Math.PI * 2); g.stroke()
        gait.push({ renderer, facing, tick: row.tick, key: row.key, entityX: row.entity.x, selectedVisibleBootWorldX: row.entity.x + (cx - s.displayOriginX * s.scaleX), selectedVisibleBootWorldY: row.entity.y + (cy - s.displayOriginY * s.scaleY), materialCorrespondence: 'UNVERIFIED: ROI identifies boot contour but is not a tracked same material point/stance interval' })
      }
    }
    g.fillText('cyan=entity.y; yellow=visible boot contour', x + 3, y + 265)
  }
  writeFileSync(`${out}/walk-live-${renderer}-${facing}.png`, strip.toBuffer('image/png'))
  const large = createCanvas(strip.width * 2, strip.height * 2), lg = large.getContext('2d')
  lg.imageSmoothingEnabled = false; lg.drawImage(strip, 0, 0, large.width, large.height)
  writeFileSync(`${out}/walk-live-${renderer}-${facing}-2x.png`, large.toBuffer('image/png'))
}
const report = { consumerOnly: true, manifestSha256: hash(readFileSync('artifacts/motion/xiahoudun/manifest.json')), pngSha256: hash(bytes), metaSha256: hash(metaBytes), sourceBytes: bytes.length, decodedBytes: atlas.width * atlas.height * 4, page: [atlas.width, atlas.height], frameAudit, unusedAtlasPixels: { samples: outsideSamples, nontransparent: outsideAlpha }, contacts, gait, limits: { airborne: 'fall1/2 airborne, no global-lowest-pixel ground gate', gait: 'actual AI displacement checked separately; planting/stride naturalness UNVERIFIED until material-point/native review', head: 'owner-accepted UNVERIFIED, no beard proxy detector', body: 'heavy big-boss exception retained; misc/getup smaller, size-pop review pending', weapon: 'uniform density .5 preserves A source-specific waivers; no fresh all-length PASS' } }
writeFileSync(`${out}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ out, frames: frameAudit.length, outsideAlpha, perimeterAlpha: frameAudit.reduce((n, f) => n + f.fullCellPerimeterAlphaPositive, 0), contacts: contacts.length, measured: contacts.filter((c) => c.nativePixelContact).length }))
