/**
 * Impact textures (ART-20): the hit spark, the KO burst and the landing
 * dust, painted in the same ink-and-light idiom as the cast. BootScene bakes
 * these to the `fx:` keys once per page; GameScene's emitters only ever read
 * them. Pure painters in logical units (the bake scales the context), so the
 * unit suite renders them directly with @napi-rs/canvas.
 */

type Ctx = CanvasRenderingContext2D

export const FX_SPARK = { width: 16, height: 16 } as const
export const FX_BURST = { width: 28, height: 28 } as const
export const FX_DUST = { width: 12, height: 12 } as const

/** An n-point star path centred on (cx, cy). */
function star(ctx: Ctx, cx: number, cy: number, points: number, outer: number, inner: number): void {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

/**
 * The hit spark: a layered starburst - amber outer star, gold mid star,
 * white-hot core - with ink flecks so it reads against bright skies too.
 */
export function paintSpark(ctx: Ctx): void {
  const cx = FX_SPARK.width / 2
  const cy = FX_SPARK.height / 2
  ctx.fillStyle = '#e85418'
  star(ctx, cx, cy, 8, 7.6, 2.6)
  ctx.fill()
  ctx.fillStyle = '#ffd23c'
  star(ctx, cx, cy, 8, 5.6, 2.0)
  ctx.fill()
  ctx.fillStyle = '#fff6d8'
  star(ctx, cx, cy, 4, 4.4, 1.4)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(20, 15, 20, 0.85)'
  for (const [dx, dy] of [
    [-5.4, -2.8],
    [5.2, -3.4],
    [-3.2, 5.6],
    [4.6, 4.8],
  ] as const) {
    ctx.fillRect(cx + dx, cy + dy, 1.4, 1.4)
  }
}

/**
 * The KO burst: a bigger send-off - shockwave ring, gold star and scattered
 * ember dots. Same palette as the spark so a knockout reads as a hit grown
 * large, not a different effect.
 */
export function paintBurst(ctx: Ctx): void {
  const cx = FX_BURST.width / 2
  const cy = FX_BURST.height / 2
  ctx.strokeStyle = 'rgba(255, 210, 106, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, 11.5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#e85418'
  star(ctx, cx, cy, 8, 9.5, 3.2)
  ctx.fill()
  ctx.fillStyle = '#ffd23c'
  star(ctx, cx, cy, 8, 7, 2.4)
  ctx.fill()
  ctx.fillStyle = '#fff6d8'
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffd76a'
  for (const [dx, dy] of [
    [-9, -6],
    [8, -8],
    [-7, 8],
    [9, 6],
    [0, -11],
    [-11, 1],
  ] as const) {
    ctx.fillRect(cx + dx, cy + dy, 1.6, 1.6)
  }
}

/** Landing dust: a soft warm puff, brightest at the centre. */
export function paintDust(ctx: Ctx): void {
  const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6)
  g.addColorStop(0, 'rgba(226, 214, 186, 0.85)')
  g.addColorStop(0.6, 'rgba(198, 184, 152, 0.4)')
  g.addColorStop(1, 'rgba(198, 184, 152, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, FX_DUST.width, FX_DUST.height)
}
