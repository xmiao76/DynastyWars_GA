#!/usr/bin/env node
// CMR-10A: acceptance-4 landmark record on the FINAL prepared layout.
//
//   node scripts/landmarks-final-zhaoyun.mjs
//
// Head: face-cluster sqrt-area x registered sheet scale (displayed px) for
// every kept cell (all sheets 3x3).
// Reported under several VALUE-INDEPENDENT subset definitions so the
// sensitivity of the verdict to the definition is on the record:
//   D0 all kept cells (full disclosure)
//   D1 shape rule: cluster aspect w/h in [0.85,1.35] (arm/neck merges are
//      wide or tall; no area/size value is used)
//   D2 pose family: the upright combat stances (walk + jab1 + jab2)
// Weapon: displayed tip-to-butt from spear-lines.json restricted to the
// adjudicator's FULL set (fittings at both ends), plus the walk family.
// Writes art/motion/zhaoyun/landmarks-final.json.

import { readFileSync, writeFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { alphaComponents } from './motion-pipeline.mjs'

const SRC = 'art/motion/zhaoyun'
const reg = JSON.parse(readFileSync(`${SRC}/registration.json`, 'utf8'))
const files = {
  walk: 'walk-candidate-1.png', jab1: 'jab1-candidate-1.png', jab2: 'jab2-candidate-1.png',
  finisher: 'finisher-candidate-1.png', jump: 'jump-candidate-1b.png', fall: 'fall-candidate-1b.png',
  getup: 'getup-candidate-2-r1.png', misc: 'misc-candidate-2-r1.png', special: 'special-candidate-1-r1.png',
}
const isSkin = (d, k) => { const r = d[k], g = d[k + 1], b = d[k + 2], a = d[k + 3]; return a >= 200 && r > 105 && r > g + 12 && g > b && b < 170 }
function faceOf(im, box) {
  const { width, data } = im
  const seen = new Set()
  let best = null
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const key = y * width + x
      if (seen.has(key) || !isSkin(data, key * 4)) continue
      seen.add(key)
      const stack = [[x, y]]
      let x0 = x, x1 = x, y0 = y, y1 = y, area = 0
      while (stack.length) {
        const [qx, qy] = stack.pop()
        area++
        if (qx < x0) x0 = qx
        if (qx > x1) x1 = qx
        if (qy < y0) y0 = qy
        if (qy > y1) y1 = qy
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = qx + dx, ny = qy + dy, nk = ny * width + nx
          if (nx < box.x0 || nx > box.x1 || ny < box.y0 || ny > box.y1) continue
          if (seen.has(nk) || !isSkin(data, nk * 4)) continue
          seen.add(nk)
          stack.push([nx, ny])
        }
      }
      if (area > 300 && (best === null || y0 < best.y0)) best = { x0, x1, y0, y1, area }
    }
  }
  return best
}
async function load(f) {
  const img = await loadImage(`${SRC}/${f}`)
  const cv = createCanvas(img.width, img.height)
  const g = cv.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height)
  return { width: d.width, height: d.height, data: d.data }
}

const cells = []
for (const [seq, file] of Object.entries(files)) {
  const im = await load(file)
  const rows = 3, cols = 3
  const cw = Math.floor(im.width / cols), ch = Math.floor(im.height / rows)
  const byCell = new Map()
  for (const c of alphaComponents(im, 96)) {
    const cx = Math.min(cols - 1, Math.floor((c.x0 + c.x1 + 1) / 2 / cw))
    const cy = Math.min(rows - 1, Math.floor((c.y0 + c.y1 + 1) / 2 / ch))
    const k = cy * cols + cx
    if (!byCell.has(k) || c.area > byCell.get(k).area) byCell.set(k, c)
  }
  const { positions } = reg.layout[seq]
  for (const p of positions) {
    const comp = byCell.get(p.cell)
    const f = comp ? faceOf(im, comp) : null
    const scale = reg.sheets[seq].scale
    cells.push({
      id: `${seq}:${p.position}`, seq, label: p.label, scale,
      face: f ? { w: f.x1 - f.x0 + 1, h: f.y1 - f.y0 + 1, area: f.area } : null,
      displayed: f ? Math.round(Math.sqrt(f.area) * scale * 100) / 100 : null,
    })
  }
}
const spread = (vals) => {
  if (!vals.length) return null
  const mn = Math.min(...vals), mx = Math.max(...vals), mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return { n: vals.length, min: Math.round(mn * 10) / 10, max: Math.round(mx * 10) / 10, spreadPct: Math.round((1000 * (mx - mn)) / mean) / 10 }
}
const withFace = cells.filter((c) => c.face)
const D0 = withFace
const D1 = withFace.filter((c) => { const a = c.face.w / c.face.h; return a >= 0.85 && a <= 1.35 })
const D2 = withFace.filter((c) => ['walk', 'jab1', 'jab2'].includes(c.seq))
const head = {
  D0_all: spread(D0.map((c) => c.displayed)),
  D1_shape_rule: { ...spread(D1.map((c) => c.displayed)), ids: D1.map((c) => c.id) },
  D2_upright_pose_family: spread(D2.map((c) => c.displayed)),
  D2_walk_cycle_only: spread(withFace.filter((c) => c.seq === 'walk').map((c) => c.displayed)),
}

// Weapon: spear-lines.json (displayed tip-to-butt) over the adjudicator FULL set.
const lines = JSON.parse(readFileSync(`${SRC}/spear-lines.json`, 'utf8')).filter((r) => r.seq in files)
const byId = new Map(lines.map((r) => [r.id, r]))
const { execSync } = await import('node:child_process')
const out = execSync('node scripts/spear-adjudicate-zhaoyun.mjs', { encoding: 'utf8' })
const full = []
let inFull = false
for (const ln of out.split('\n')) {
  if (ln.startsWith('=== FULL set')) { inFull = true; continue }
  if (inFull && /^\s+\S+:\d+\s+[\d.]+/.test(ln)) full.push(ln.trim().split(/\s+/)[0])
  else if (inFull && ln.startsWith('===')) break
}
const fullVals = full.map((id) => byId.get(id)?.displayed).filter((v) => v !== null && v !== undefined)
const weapon = {
  FULL_set: { ...spread(fullVals), ids: full },
  FULL_set_excl_min_max: (() => {
    const s = [...fullVals].sort((a, b) => a - b).slice(1, -1)
    return spread(s)
  })(),
  walk_family: spread(full.filter((id) => id.startsWith('walk:')).map((id) => byId.get(id).displayed)),
  measured_cells: `${lines.filter((r) => r.length !== null).length}/${lines.length}`,
}
const result = { generatedFrom: 'registration.json scales + kept-cell source drawings', head, weapon, cells }
writeFileSync(`${SRC}/landmarks-final.json`, `${JSON.stringify(result, null, 2)}\n`)
console.log('HEAD (displayed px = sqrt(face-cluster area) x sheet scale):')
for (const [k, v] of Object.entries(head)) console.log(' ', k.padEnd(24), JSON.stringify({ n: v.n, min: v.min, max: v.max, spreadPct: v.spreadPct }))
console.log('WEAPON (displayed tip-to-butt px):')
for (const [k, v] of Object.entries(weapon)) console.log(' ', k.padEnd(24), typeof v === 'string' ? v : JSON.stringify({ n: v.n, min: v.min, max: v.max, spreadPct: v.spreadPct }))
