#!/usr/bin/env node
// CMR-11A acceptance-4: normalize 14 out-of-band dao lengths to the pack
// band (deterministic rigid-axis retouch; jump/fall/rider method).
//
//   node scripts/retouch-weiyan-acceptance4.mjs
//
// 6 rear-shaft EXTENDS (cap slides back, median wood fill) + 8 cap-forward
// SHORTENS (overlap, no fill). The 15th cell (getup elbow) was fixed by
// repair round R1 instead: its deterministic paths all failed (c6 rear:
// sheet edge; c6 forward: hand/tassel tangle; c0 rear: boot adjacency
// proven by a safely-aborted flood run). Poses untouched. All inputs
// hash-pinned; per-op isolation/fill/achieved gates; per-file count/edge
// gates; NOTHING is written unless every gate passes (atomic).
// Index arithmetic is bounds-checked everywhere: an earlier version
// wrapped negative-x placements onto the prior row's end (caught by
// the component-count gate before any write). This is authored pixel
// repair, NOT an image-model edit and NOT a request-ledger event.
import {createCanvas, loadImage} from '@napi-rs/canvas'
import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {alphaComponents} from './motion-pipeline.mjs'

const SRC = 'art/motion/weiyan'
// OP: {cell, mode, cap, angle, t0, band, oShaft, slab, shift, predicted, flood?}
const JOBS = [
  { out: 'getup-v2-normalized-source.png', base: { file: 'getup-v2-repaired-source.png', sha: 'a34991fffee370abb94aef69c1b4604ce1bf0ef3dfd24c3942e18625a3ab054c' },
    expectCells: [1, 3, 4, 6, 8],
    ops: [
      { cell: 1, mode: 'extend', cap: [605.8, 185.9], angle: 8.15, t0: 24, band: 40, oShaft: [-5, 14], slab: [20, 40], shift: [-104, -15], predicted: 574 },
      { cell: 8, mode: 'extend', cap: [1054.1, 831.5], angle: 12.98, t0: 24, band: 40, oShaft: [-5, 14], slab: [20, 40], shift: [-72, -17], predicted: 574 },
      { cell: 3, mode: 'extend', cap: [73.5, 538.2], angle: 8.54, t0: 24, band: 40, oShaft: [-5, 14], slab: [20, 40], shift: [-49, -7], predicted: 565 },
      { cell: 4, mode: 'extend', cap: [613.9, 477.4], angle: 11.42, t0: 20, band: 40, oShaft: [-5, 14], slab: [18, 28], shift: [-87, -18], predicted: 574 },
    ] },
  { out: 'jab2-v2-normalized-source.png', base: { file: 'jab2-v2-prepared-source.png', sha: 'e61f9883ae5ed962c50e181f2888df9976fa7dfc325199a7dd6dc02ea537ed8d' }, expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    ops: [
      { cell: 3, mode: 'extend', cap: [133.5, 476.0], angle: 15.47, t0: 24, band: 40, oShaft: [-5, 12], slab: [20, 32], shift: [-27, -7], predicted: 481 },
      { cell: 4, mode: 'extend', cap: [585.3, 505.3], angle: 6.80, t0: 24, band: 40, oShaft: [-5, 12], slab: [20, 36], shift: [-30, -4], predicted: 481 },
    ] },
  { out: 'finisher-v2-normalized-source.png', base: { file: 'finisher-v2-prepared-source.png', sha: '6f622f91a920f6d594411a0a1e2d65fcba314301c4d84fae4b714666067f842b' }, expectCells: [0, 1, 3, 4, 6],
    ops: [
      { cell: 0, mode: 'shorten', cap: [33.1, 192.5], angle: 11.87, t0: 20, band: [-14, 24], shift: [19, 4], predicted: 503 },
      { cell: 1, mode: 'shorten', cap: [586.2, 187.3], angle: -12.61, t0: 20, band: [-14, 24], shift: [7, -2], predicted: 503 },
      { cell: 3, mode: 'shorten', cap: [68.0, 477.0], angle: 17.01, t0: 20, band: [-14, 24], shift: [38, 12], predicted: 503 },
      { cell: 6, mode: 'shorten', cap: [47.8, 796.6], angle: 13.53, t0: 20, band: [-14, 24], shift: [6, 1], predicted: 500 },
    ] },
  { out: 'jump-v2-normalized-source.png', base: { file: 'jump-v2-retouched-source.png', sha: '0f3dc6318e66622d615187ae5cf7e9551c928fbbbe4e870e52387a51576d4385' }, expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    ops: [
      { cell: 6, mode: 'shorten', cap: [39.2, 791.9], angle: 9.47, t0: 20, band: [-14, 24], shift: [6, 1], predicted: 500 },
    ] },
  { out: 'rider-v2-normalized-source.png', base: { file: 'rider-v2-retouched-source.png', sha: '5c5cba35cdaaa171cd24a745fff342703c0f33d6265ce31a5bcf2160d3c20975' }, expectCells: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    ops: [
      { cell: 0, mode: 'shorten', cap: [48.3, 178.9], angle: -1.26, t0: 20, band: [-14, 24], shift: [10, 0], predicted: 502 },
      { cell: 3, mode: 'shorten', cap: [29.5, 467.9], angle: -6.24, t0: 20, band: [-14, 24], shift: [14, -2], predicted: 502 },
    ] },
  { out: 'special-v2-normalized-source.png', base: { file: 'special-v2-prepared-source.png', sha: '5040f1ea5c4b7c37b2482b1d302f14a05bfc66b8f40de6f0bc46dcbc58a339ce' }, expectCells: [0, 1, 3, 4, 8],
    ops: [
      { cell: 4, mode: 'shorten', cap: [612.6, 483.1], angle: 15.98, t0: 20, band: [-14, 24], shift: [8, 2], predicted: 502 },
    ] },
]

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn
  let h = 0
  if (dd) {
    if (mx === r) h = ((g - b) / dd) % 6
    else if (mx === g) h = (b - r) / dd + 2
    else h = (r - g) / dd + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: mx ? dd / mx : 0, v: mx / 255 }
}
const isGold = (r, g, b) => { const { h, s, v } = hsv(r, g, b); return h >= 36 && h <= 56 && s > 0.5 && v > 0.55 }
const isSteel = (r, g, b) => Math.max(r, g, b) > 120 && Math.max(r, g, b) - Math.min(r, g, b) < 45
const isPurple = (r, g, b) => b > g + 15 && b > 60
const cellOf = (W, H, c) => Math.min(2, Math.floor((c.y0 + c.y1 + 1) / 2 / Math.floor(H / 3))) * 3 + Math.min(2, Math.floor((c.x0 + c.x1 + 1) / 2 / Math.floor(W / 3)))

async function loadPinned(file, sha) {
  const bytes = readFileSync(`${SRC}/${file}`)
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw new Error(`${file}: hash changed`)
  const image = await loadImage(bytes)
  const cv = createCanvas(image.width, image.height)
  const g = cv.getContext('2d')
  g.drawImage(image, 0, 0)
  const im = g.getImageData(0, 0, image.width, image.height)
  return { image, W: image.width, H: image.height, data: im.data, im, canvas: cv, ctx: g }
}

function measureEndpoints(S, comp) {
  const { W, H, data: d } = S
  const mask = new Set(comp.pixels), seen = new Set()
  let best = []
  for (const p of comp.pixels) {
    if (seen.has(p)) continue
    const k = p * 4
    if (!isSteel(d[k], d[k + 1], d[k + 2])) continue
    const stack = [p], pts = []
    seen.add(p)
    while (stack.length) {
      const q = stack.pop()
      pts.push(q)
      const x = q % W, y = (q / W) | 0
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy, n = ny * W + nx
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !mask.has(n) || seen.has(n)) continue
        const a = n * 4
        if (!isSteel(d[a], d[a + 1], d[a + 2])) continue
        seen.add(n)
        stack.push(n)
      }
    }
    if (pts.length > best.length) best = pts
  }
  let tip = null, pom = null
  for (const p of best) { const x = p % W; if (!tip || x > tip[0]) tip = [x, (p / W) | 0] }
  for (const p of comp.pixels) { const k = p * 4; if (!isGold(d[k], d[k + 1], d[k + 2])) continue; const x = p % W; if (!pom || x < pom[0]) pom = [x, (p / W) | 0] }
  if (!tip || !pom) throw new Error('endpoint detector failed')
  return Math.round(Math.hypot(tip[0] - pom[0], tip[1] - pom[1]))
}

const staged = []
const report = []
for (const job of JOBS) {
  const S = await loadPinned(job.base.file, job.base.sha)
  const { W, H, data: d } = S
  if (job.graft || job.drop) throw new Error(`${job.out}: graft/drop retired (R1 resolved the elbow instead)`)
  // Phase 1: retouch ops.
  for (const op of job.ops) {
    const u = [Math.cos((op.angle * Math.PI) / 180), Math.sin((op.angle * Math.PI) / 180)]
    const n = [-u[1], u[0]]
    const coord = (x, y) => [(x - op.cap[0]) * u[0] + (y - op.cap[1]) * u[1], (x - op.cap[0]) * n[0] + (y - op.cap[1]) * n[1]]
    const comps = alphaComponents({ width: W, height: H, data: d }, 96).filter((c) => c.area > 64)
    const comp = comps.find((c) => cellOf(W, H, c) === op.cell)
    if (!comp) throw new Error(`${job.out} cell${op.cell}: component missing`)
    const own = new Set(comp.pixels)
    const inBand = Array.isArray(op.band)
      ? (t, o) => t < op.t0 && o >= op.band[0] && o <= op.band[1]
      : (t, o) => t < op.t0 && Math.abs(o) <= op.band
    // Isolation gate (extend ops): the ring just outside cap extents must
    // be empty (far body with |o|>40, e.g. knees, is outside the selection
    // band and always safe - an early version tripped on exactly that).
    if (!op.flood && op.mode === 'extend') {
      for (const p of comp.pixels) {
        const x = p % W, y = (p / W) | 0
        const [t, o] = coord(x, y)
        if (t < op.t0 && ((o >= -40 && o < -16) || (o > 26 && o <= 40))) {
          throw new Error(`${job.out} cell${op.cell}: unexpected pixel in moving zone (${x},${y}) o=${o.toFixed(1)}`)
        }
      }
    }
    // Pristine snapshot BEFORE any mutation (slabs may overlap the moved
    // zone; sampling post-clear reads zeros - the fall-script bug class).
    const frozen = new Uint8ClampedArray(d)
    // Lift.
    const moved = []
    for (const p of comp.pixels) {
      const x = p % W, y = (p / W) | 0
      const [t, o] = coord(x, y)
      if (!inBand(t, o)) continue
      const k = p * 4
      moved.push({ x, y, px: [d[k], d[k + 1], d[k + 2], d[k + 3]] })
    }
    // 500 floor (not 800: compact caps like jab2:4 run ~755px complete;
    // the achieved-measure gate below is the real correctness check).
    if (moved.length < 500) throw new Error(`${job.out} cell${op.cell}: moving piece too small: ${moved.length}`)
    if (op.mode === 'shorten' && moved.length > 3000) throw new Error(`${job.out} cell${op.cell}: moving piece too big (${moved.length}), body included?`)
    for (const m of moved) d[(m.y * W + m.x) * 4 + 3] = 0
    for (let y = comp.y0 - 6; y <= comp.y1 + 6; y++) {
      for (let x = comp.x0 - 6; x <= comp.x1 + 6; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue
        const [t, o] = coord(x, y)
        if (inBand(t, o) && !own.has(y * W + x) && d[(y * W + x) * 4 + 3] < 96) d[(y * W + x) * 4 + 3] = 0
      }
    }
    let filled = 0
    if (op.mode === 'extend') {
      const at = (x, y) => {
        const k = (Math.round(y) * W + Math.round(x)) * 4
        return [frozen[k], frozen[k + 1], frozen[k + 2], frozen[k + 3]]
      }
      const median = (arr) => [...arr].sort((a, b) => a - b)[arr.length >> 1]
      const profile = new Map()
      for (let oi = Math.ceil(op.oShaft[0]) - 1; oi <= Math.floor(op.oShaft[1]) + 1; oi++) {
        const ch4 = [[], [], [], []]
        for (let ts = op.slab[0]; ts <= op.slab[1]; ts += 0.5) {
          const sx = Math.round(op.cap[0] + ts * u[0] + oi * n[0]), sy = Math.round(op.cap[1] + ts * u[1] + oi * n[1])
          if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue
          const s = at(sx, sy)
          if (isPurple(s[0], s[1], s[2])) continue // robe-edge rejection (slabs abut body)
          for (let c = 0; c < 4; c++) ch4[c].push(s[c])
        }
        if (!ch4[3].length) throw new Error(`${job.out} cell${op.cell}: empty slab row o=${oi}`)
        profile.set(oi, ch4.map(median))
      }
      const lenShift = Math.hypot(op.shift[0], op.shift[1])
      for (let y = comp.y0 - 140; y <= comp.y1 + 140; y++) {
        for (let x = comp.x0 - 140; x <= comp.x1 + 140; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H) continue // never wrap (see header)
          const [t, o] = coord(x, y)
          if (t < op.t0 - lenShift || t >= op.t0 || o < op.oShaft[0] || o > op.oShaft[1]) continue
          const p = y * W + x
          if (!own.has(p) && frozen[p * 4 + 3] >= 96) throw new Error(`${job.out} cell${op.cell}: fill target hits foreign pixel at (${x},${y})`)
          const lo = Math.floor(o), hi = lo + 1, f = o - lo
          const a = profile.get(lo), b = profile.get(hi)
          if (!a || !b) continue
          const s = a.map((v, c) => v * (1 - f) + b[c] * f)
          if (s[3] < 64) continue
          const k = p * 4
          d[k] = s[0]; d[k + 1] = s[1]; d[k + 2] = s[2]; d[k + 3] = Math.min(255, s[3])
          filled++
        }
      }
    }
    for (const m of moved) {
      const nx = m.x + op.shift[0], ny = m.y + op.shift[1]
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) throw new Error(`${job.out} cell${op.cell}: move target out of bounds (${nx},${ny})`)
      const k = (ny * W + nx) * 4
      d[k] = m.px[0]; d[k + 1] = m.px[1]; d[k + 2] = m.px[2]; d[k + 3] = m.px[3]
    }
    // Achieved-vs-predicted gate.
    const after = alphaComponents({ width: W, height: H, data: d }, 96).filter((c) => c.area > 64)
    const compAfter = after.find((c) => cellOf(W, H, c) === op.cell)
    if (!compAfter) throw new Error(`${job.out} cell${op.cell}: component lost after op`)
    const achieved = measureEndpoints({ W, H, data: d }, compAfter)
    if (Math.abs(achieved - op.predicted) > 1) throw new Error(`${job.out} cell${op.cell}: achieved ${achieved}px vs predicted ${op.predicted}px`)
    report.push({ file: job.out, cell: op.cell, mode: op.mode, moved: moved.length, filled, predicted: op.predicted, achieved })
  }
  // Phase 3: per-file gates (BEFORE any write: atomic).
  const check = alphaComponents({ width: W, height: H, data: d }, 96).filter((c) => c.area > 64)
  const gotCells = check.map((c) => cellOf(W, H, c)).sort((a, b) => a - b)
  const wantCells = [...job.expectCells].sort((a, b) => a - b)
  if (check.length !== wantCells.length || gotCells.join(',') !== wantCells.join(',')) {
    S.ctx.putImageData(S.im, 0, 0)
    writeFileSync('artifacts/tmpcheck/debug-a4-fail.png', S.canvas.toBuffer('image/png'))
    throw new Error(`${job.out}: figures [${gotCells}] vs expected [${wantCells}] :: ${JSON.stringify(check.map((c) => [c.area, c.x0, c.y0, c.x1, c.y1]))}`)
  }
  for (const c of check) {
    if (c.x0 === 0 || c.y0 === 0 || c.x1 >= W - 1 || c.y1 >= H - 1) throw new Error(`${job.out}: figure touches outer edge`)
  }
  staged.push({ job, S })
}
// Phase 4: every gate passed on every file — write all outputs (atomic:
// a throw anywhere above leaves every source untouched).
const outputs = []
for (const { job, S } of staged) {
  S.ctx.putImageData(S.im, 0, 0)
  const png = S.canvas.toBuffer('image/png')
  writeFileSync(`${SRC}/${job.out}`, png)
  outputs.push({ file: job.out, sha256: createHash('sha256').update(png).digest('hex') })
}
console.log(JSON.stringify({ report, outputs }, null, 2))
