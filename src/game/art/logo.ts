/**
 * The DYNASTY WARS wordmark.
 *
 * Built programmatically out of canvas-2D text rather than shipped as an image
 * or drawn as a plain Phaser label. A plain label is what the title screen had:
 * one `Text` with a stroke, which is legible but is not a logo. This gives it
 * the treatment an arcade wordmark needs - an italic lean, a heavy ink shell, a
 * metal gradient down the faces and a hard drop shadow - and bakes the result
 * into a texture, so both renderers draw identical pixels and there is nothing
 * for a WebGL-only feature to disagree about.
 *
 * The letterforms themselves come from the system font stack, which is the
 * deliberate choice made for this project: no bundled font files, and the same
 * stack everywhere so the Chinese names on every other screen keep falling back
 * to a face the browser actually has.
 */

const LEAN = -0.16
const INK = '#140f14'

export interface LogoSpec {
  text: string
  /** Cap height in canonical units. */
  size: number
  /** Face gradient, top to bottom. */
  top: string
  mid: string
  bottom: string
  /** Ink shell thickness. */
  ink: number
}

export const TITLE_LOGO: LogoSpec = {
  text: 'DYNASTY WARS',
  size: 40,
  top: '#fff3b0',
  mid: '#ffd23c',
  bottom: '#c07a10',
  ink: 7,
}

const FONT_STACK = '"Arial Black", "Arial Bold", "Helvetica Neue", Impact, sans-serif'

function applyFont(ctx: CanvasRenderingContext2D, spec: LogoSpec): void {
  ctx.font = `900 ${spec.size}px ${FONT_STACK}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
}

/**
 * Measure the box the wordmark needs, in canonical units.
 *
 * Measured rather than assumed, because the stack above resolves to a different
 * face on every platform and a hard-coded box would clip the wordmark on
 * whichever machine drew it widest.
 */
export function logoBox(
  measureCtx: CanvasRenderingContext2D,
  spec: LogoSpec = TITLE_LOGO,
): { width: number; height: number } {
  applyFont(measureCtx, spec)
  const w = measureCtx.measureText(spec.text).width
  const lean = Math.abs(LEAN) * spec.size
  return {
    width: Math.ceil(w + lean + spec.ink * 4),
    height: Math.ceil(spec.size * 1.7 + spec.ink * 2),
  }
}

/** Draw the wordmark into a context sized `logoBox(spec) * scale`. */
export function drawLogo(
  ctx: CanvasRenderingContext2D,
  spec: LogoSpec,
  scale: number,
  box: { width: number; height: number },
): void {
  ctx.save()
  ctx.scale(scale, scale)
  const cx = box.width / 2
  const cy = box.height / 2
  ctx.translate(cx, cy)
  ctx.transform(1, 0, LEAN, 1, 0, 0)
  applyFont(ctx, spec)
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  // Hard drop shadow first, offset down-right, so the wordmark sits off the
  // backdrop instead of lying flat on it.
  ctx.save()
  ctx.translate(spec.ink * 0.55, spec.ink * 0.7)
  ctx.lineWidth = spec.ink * 2
  ctx.strokeStyle = 'rgba(12, 6, 14, 0.85)'
  ctx.strokeText(spec.text, 0, 0)
  ctx.fillStyle = 'rgba(12, 6, 14, 0.85)'
  ctx.fillText(spec.text, 0, 0)
  ctx.restore()

  // Ink shell, then a thin bright liner inside it.
  ctx.lineWidth = spec.ink * 2
  ctx.strokeStyle = INK
  ctx.strokeText(spec.text, 0, 0)
  ctx.lineWidth = spec.ink * 0.7
  ctx.strokeStyle = '#6a4a12'
  ctx.strokeText(spec.text, 0, 0)

  // Metal faces.
  const grad = ctx.createLinearGradient(0, -spec.size * 0.62, 0, spec.size * 0.62)
  grad.addColorStop(0, spec.top)
  grad.addColorStop(0.46, spec.mid)
  grad.addColorStop(0.54, spec.bottom)
  grad.addColorStop(1, spec.mid)
  ctx.fillStyle = grad
  ctx.fillText(spec.text, 0, 0)

  // A highlight band across the upper third, clipped to the glyphs.
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.fillRect(-box.width, -spec.size * 0.62, box.width * 2, spec.size * 0.3)
  ctx.restore()
  ctx.restore()
}
