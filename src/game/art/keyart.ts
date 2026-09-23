/**
 * Procedural title key art (UI-1 style frame, reused by UI-2): a Red-Cliffs
 * dusk battle - ember sky, cliff silhouettes, burning warships on the river,
 * dark stone terrace - baked once to a texture.
 *
 * Fully procedural: no generated assets, no quota dependency. Deterministic:
 * all scatter uses a fixed-seed LCG, so every boot and every screenshot sees
 * the same painting.
 */

type Ctx = CanvasRenderingContext2D

function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const css = (hex: number, alpha = 1): string =>
  `rgba(${(hex >> 16) & 0xff},${(hex >> 8) & 0xff},${hex & 0xff},${alpha})`

/** One burning warship silhouette: hull, cabin, sail mast, flames, smoke. */
function warship(ctx: Ctx, x: number, y: number, s: number, rand: () => number): void {
  ctx.fillStyle = '#0d080c'
  ctx.beginPath()
  ctx.moveTo(x - 46 * s, y)
  ctx.lineTo(x + 46 * s, y)
  ctx.lineTo(x + 30 * s, y + 14 * s)
  ctx.lineTo(x - 30 * s, y + 14 * s)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(x - 18 * s, y - 16 * s, 36 * s, 16 * s)
  ctx.fillRect(x - 3 * s, y - 44 * s, 6 * s, 30 * s)
  ctx.beginPath()
  ctx.moveTo(x + 3 * s, y - 44 * s)
  ctx.lineTo(x + 34 * s, y - 30 * s)
  ctx.lineTo(x + 3 * s, y - 14 * s)
  ctx.closePath()
  ctx.fill()
  // Flames along the deck and mast.
  for (let i = 0; i < 9; i += 1) {
    const fx = x + (rand() - 0.5) * 76 * s
    const fy = y - rand() * 40 * s
    const r = (5 + rand() * 9) * s
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r)
    g.addColorStop(0, 'rgba(255, 236, 170, 0.95)')
    g.addColorStop(0.45, 'rgba(255, 140, 40, 0.75)')
    g.addColorStop(1, 'rgba(180, 40, 10, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(fx, fy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // Smoke column, fading as it rises.
  for (let i = 0; i < 6; i += 1) {
    const sy = y - 46 * s - i * 13 * s
    const sx = x + Math.sin(i * 1.3) * 9 * s + i * 3 * s
    ctx.fillStyle = `rgba(20, 12, 16, ${0.5 - i * 0.07})`
    ctx.beginPath()
    ctx.arc(sx, sy, (10 + i * 4) * s, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Paint the dusk battle into `ctx`, sized w x h device pixels. The top-center
 * sky stays calm and dark (logo space); the bottom strip is dark stone
 * (prompt space); the battle burns across the middle band.
 */
export function paintDuskBattle(ctx: Ctx, w: number, h: number): void {
  // Sky: indigo zenith falling to ember crimson at the horizon (62% down).
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, css(0x120a24))
  sky.addColorStop(0.34, css(0x2a1230))
  sky.addColorStop(0.52, css(0x7a1e1e))
  sky.addColorStop(0.62, css(0xd85428))
  sky.addColorStop(0.66, css(0x3a1418))
  sky.addColorStop(1, css(0x0c0708))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Fire glow low on the river line.
  const horizon = h * 0.62
  const glow = ctx.createRadialGradient(w * 0.56, horizon, 4, w * 0.56, horizon, w * 0.4)
  glow.addColorStop(0, 'rgba(255, 200, 110, 0.8)')
  glow.addColorStop(0.4, 'rgba(230, 110, 40, 0.35)')
  glow.addColorStop(1, 'rgba(200, 80, 30, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Cliff silhouettes left and right, red rock catching the fire.
  const cliff = (x0: number, dir: 1 | -1, base: number, peak: number, seed: number): void => {
    const r = lcg(seed)
    // Both edges jagged: a straight outer edge reads as a flagpole.
    const steps = 12
    const outer: Array<[number, number]> = []
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps
      outer.push([
        x0 + dir * (r() * w * 0.028 + Math.sin(t * 2.4 + seed) * w * 0.012),
        h - (h - peak) * t + (r() - 0.5) * 10,
      ])
    }
    ctx.beginPath()
    const first = outer[0]
    if (!first) return
    ctx.moveTo(first[0], first[1])
    for (const [px, py] of outer.slice(1)) ctx.lineTo(px, py)
    for (let i = steps; i >= 0; i -= 1) {
      const t = i / steps
      ctx.lineTo(
        x0 + dir * (w * 0.1 + r() * w * 0.05 * (1 - t * 0.6)),
        h - (h - base) * t + (r() - 0.5) * 8,
      )
    }
    ctx.closePath()
    const g = ctx.createLinearGradient(0, peak, 0, h)
    g.addColorStop(0, css(0x5a1620))
    g.addColorStop(1, css(0x140608))
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 140, 60, 0.35)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  cliff(0, 1, horizon + 6, h * 0.18, 11)
  cliff(w, -1, horizon + 6, h * 0.1, 77)

  // River band with fire reflections.
  const river = ctx.createLinearGradient(0, horizon, 0, horizon + h * 0.16)
  river.addColorStop(0, css(0xe07830))
  river.addColorStop(0.35, css(0x7a2a1a))
  river.addColorStop(1, css(0x1a0a10))
  ctx.fillStyle = river
  ctx.fillRect(0, horizon, w, h * 0.16)
  const rr = lcg(913)
  ctx.fillStyle = 'rgba(255, 220, 150, 0.5)'
  for (let i = 0; i < 46; i += 1) {
    const rw = 6 + rr() * 30
    ctx.fillRect(rr() * w, horizon + 2 + rr() * h * 0.13, rw, 1.6)
  }

  // Burning fleet across the river.
  const sr = lcg(5150)
  warship(ctx, w * 0.56, horizon + h * 0.045, (h / 270) * 1.15, sr)
  warship(ctx, w * 0.3, horizon + h * 0.03, (h / 270) * 0.7, sr)
  warship(ctx, w * 0.8, horizon + h * 0.06, (h / 270) * 0.85, sr)

  // Far bank: banner poles and torch dots.
  ctx.fillStyle = '#0d080c'
  const br = lcg(31)
  for (let i = 0; i < 8; i += 1) {
    const bx = br() * w
    ctx.fillRect(bx, horizon - 22 * (h / 270), 2, 24 * (h / 270))
    ctx.fillRect(bx, horizon - 26 * (h / 270), 9 * (h / 270), 5 * (h / 270))
  }
  for (let i = 0; i < 22; i += 1) {
    const tx = br() * w
    const ty = horizon - 4 - br() * 20 * (h / 270)
    ctx.fillStyle = 'rgba(255, 190, 100, 0.9)'
    ctx.fillRect(tx, ty, 2, 2)
  }

  // Foreground stone terrace.
  const terrace = h * 0.8
  const tg = ctx.createLinearGradient(0, terrace, 0, h)
  tg.addColorStop(0, css(0x241a20))
  tg.addColorStop(1, css(0x0b080c))
  ctx.fillStyle = tg
  ctx.fillRect(0, terrace, w, h - terrace)
  ctx.strokeStyle = 'rgba(232, 184, 32, 0.28)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, terrace)
  ctx.lineTo(w, terrace)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.lineWidth = 1
  const tr = lcg(7)
  for (let i = 0; i < 9; i += 1) {
    const sx = tr() * w
    ctx.beginPath()
    ctx.moveTo(sx, terrace + 2)
    ctx.lineTo(sx + (tr() - 0.5) * 30, h)
    ctx.stroke()
  }
}
