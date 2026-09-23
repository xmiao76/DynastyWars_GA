import Phaser from 'phaser'
import { TITLE_LOGO, drawLogo, logoBox, type LogoSpec } from '../art/logo'
import { RENDER_SCALE } from '../render'
import { THEME } from './theme'
import { bakeBox, bakeDisplayText, type BakeSpec } from './type'

/**
 * Shared HUD chrome: glassy gradient panels and gradient bar textures. All
 * presentation-only - the sim stays deterministic. Everything here uses
 * Phaser Graphics + canvas textures so it renders crisply under the smooth
 * (non-pixelated) canvas scaling.
 */

/**
 * An angled plate: the fighting-game shape, a parallelogram with a heavy accent
 * edge on its leading side.
 *
 * Solid fills only, for the same reason `drawPanel` uses them - a Graphics
 * gradient is WebGL-only and silently draws nothing under canvas, which is how
 * the two renderers came to disagree about whether panels covered their own
 * contents.
 *
 * `panelRect` records the plate's bounding BOX rather than the parallelogram.
 * That is deliberately the looser reading: the containment gate uses it to ask
 * whether a label fits inside the plate it sits on, and an over-tight rect
 * would fail labels that are genuinely inside.
 */
export function drawSlab(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: number,
  depth = 10_000,
  opts: { skew?: number; mirror?: boolean } = {},
): Phaser.GameObjects.Graphics {
  const skew = opts.skew ?? 10
  const mirror = opts.mirror === true
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth)
  // Leading edge slants forward; the trailing edge is square so the plate still
  // sits flush against the screen edge it is anchored to.
  const pts = mirror
    ? [
        { x: x + skew, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
      ]
    : [
        { x, y },
        { x: x + w - skew, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
      ]
  const path = (gr: Phaser.GameObjects.Graphics): void => {
    gr.beginPath()
    pts.forEach((p, i) => (i === 0 ? gr.moveTo(p.x, p.y) : gr.lineTo(p.x, p.y)))
    gr.closePath()
  }
  g.fillStyle(0x16121c, 0.94)
  path(g)
  g.fillPath()
  // Lower band, so the plate has weight rather than reading as a flat card.
  g.fillStyle(0x0b0910, 0.5)
  g.fillRect(x + 2, y + h * 0.56, w - skew - 2, h * 0.44 - 2)
  // The accent: a thick bar along the bottom and a thin line along the top.
  g.fillStyle(accent, 0.95)
  g.fillRect(x + 1, y + h - 3, w - (mirror ? 1 : skew) - 1, 3)
  g.fillStyle(Phaser.Display.Color.IntegerToColor(accent).lighten(40).color, 0.5)
  g.fillRect(x + (mirror ? skew + 1 : 1), y + 1, w - skew - 2, 1)
  g.lineStyle(1.2, accent, 0.85)
  path(g)
  g.strokePath()
  g.setData('panelRect', { x, y, w, h })
  return g
}

/**
 * A parchment card: the scene-intro / result / select-plate surface. Cream
 * fill, gold outer frame, bronze inner rule, corner rivets - all solid fills,
 * so canvas and WebGL agree. Records `panelRect` like `drawSlab` so the
 * containment gate keeps working.
 */
export function drawCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth = 10_000,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth)
  g.fillStyle(THEME.plate, 0.94)
  g.fillRect(x - 3, y - 3, w + 6, h + 6)
  g.fillStyle(THEME.parchment, 0.97)
  g.fillRect(x, y, w, h)
  g.fillStyle(THEME.parchmentDeep, 0.55)
  g.fillRect(x + 3, y + h * 0.62, w - 6, h * 0.38 - 3)
  g.lineStyle(2, THEME.gold, 1)
  g.strokeRect(x - 3, y - 3, w + 6, h + 6)
  g.lineStyle(1, THEME.bronze, 0.9)
  g.strokeRect(x + 4, y + 4, w - 8, h - 8)
  g.fillStyle(THEME.bronze, 1)
  const corners: Array<[number, number]> = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ]
  for (const [rx, ry] of corners) {
    g.fillCircle(rx, ry, 2.2)
  }
  g.setData('panelRect', { x, y, w, h })
  return g
}

/**
 * A lacquer bar: the HUD top-band / title command-strip surface. Deep blue
 * fill with gold rails top and bottom and a faint upper sheen. Solid fills
 * only; records `panelRect`.
 */
export function drawLacquerBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth = 10_000,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth)
  g.fillStyle(THEME.lacquerDeep, 0.95)
  g.fillRect(x, y, w, h)
  g.fillStyle(THEME.lacquer, 0.6)
  g.fillRect(x, y, w, Math.max(1, Math.round(h * 0.34)))
  g.fillStyle(THEME.gold, 0.95)
  g.fillRect(x, y, w, 2)
  g.fillRect(x, y + h - 2, w, 2)
  g.lineStyle(1, THEME.ink, 0.8)
  g.strokeRect(x, y, w, h)
  g.setData('panelRect', { x, y, w, h })
  return g
}

/**
 * A slanted health bar: a dark trough with a coloured fill that shortens from
 * the leading edge, plus a bright tip so the current value has an edge you can
 * see moving. `set(ratio)` is the whole interface.
 */
export function makeBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
): { set: (ratio: number, danger: boolean) => void; graphics: Phaser.GameObjects.Graphics } {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth)
  const skew = Math.round(h * 0.7)
  const set = (ratio: number, danger: boolean): void => {
    const clamped = Math.max(0, Math.min(1, ratio))
    // Record what was drawn, for the same reason `drawPanel` records its rect:
    // a Graphics does not expose its own geometry, so without this nothing can
    // check that the bar on screen agrees with the health in the sim. The old
    // bars were Images, and the gates asserted their TEXTURE existed - which it
    // did, while being completely transparent.
    g.setData('bar', { x, y, w, h, ratio: clamped, danger })
    g.clear()
    g.fillStyle(0x08070c, 0.85)
    g.fillRect(x - 1, y - 1, w + 2, h + 2)
    const fillW = Math.round(w * clamped)
    if (fillW <= 0) return
    const top = danger ? 0xd33a3a : 0x3ad33a
    const bottom = danger ? 0x7a1a1a : 0x177a3a
    g.fillStyle(top, 1)
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + fillW, y)
    g.lineTo(x + fillW - skew, y + h)
    g.lineTo(x - skew, y + h)
    g.closePath()
    g.fillPath()
    g.fillStyle(bottom, 1)
    g.fillRect(x - skew + 1, y + h * 0.55, Math.max(0, fillW - 2), h * 0.45)
    // Leading tip.
    g.fillStyle(0xffffff, 0.75)
    g.fillRect(Math.max(x, x + fillW - 2), y, 2, h)
  }
  set(1, false)
  return { set, graphics: g }
}

/**
 * The arcade HP bar: `makeBar` plus segment ticks and a white "recent damage"
 * ghost. The ghost is presentation-only - the caller passes the last-seen
 * ratio and decays it toward the live one; the sim never sees it. `set` keeps
 * the `(ratio, danger)` prefix so existing call sites migrate by adding one
 * argument. The recorded `bar` tag gains the ghost for the HUD-colour gate.
 */
export function makeArcadeBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  segments = 5,
): {
  set: (ratio: number, danger: boolean, ghost?: number) => void
  graphics: Phaser.GameObjects.Graphics
} {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth)
  const skew = Math.round(h * 0.7)
  const set = (ratio: number, danger: boolean, ghost: number = ratio): void => {
    const clamped = Math.max(0, Math.min(1, ratio))
    const ghostClamped = Math.max(clamped, Math.min(1, ghost))
    g.setData('bar', { x, y, w, h, ratio: clamped, danger, ghost: ghostClamped })
    g.clear()
    g.fillStyle(0x08070c, 0.85)
    g.fillRect(x - 1, y - 1, w + 2, h + 2)
    const ghostW = Math.round(w * ghostClamped)
    if (ghostW > 0) {
      g.fillStyle(0xffffff, 0.55)
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + ghostW, y)
      g.lineTo(x + ghostW - skew, y + h)
      g.lineTo(x - skew, y + h)
      g.closePath()
      g.fillPath()
    }
    const fillW = Math.round(w * clamped)
    if (fillW > 0) {
      const top = danger ? THEME.danger : THEME.life
      const bottom = danger ? THEME.dangerDeep : THEME.lifeDeep
      g.fillStyle(top, 1)
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + fillW, y)
      g.lineTo(x + fillW - skew, y + h)
      g.lineTo(x - skew, y + h)
      g.closePath()
      g.fillPath()
      g.fillStyle(bottom, 1)
      g.fillRect(x - skew + 1, y + h * 0.55, Math.max(0, fillW - 2), h * 0.45)
      g.fillStyle(0xffffff, 0.75)
      g.fillRect(Math.max(x, x + fillW - 2), y, 2, h)
    }
    // Segment ticks over the trough, so partial bars read in chunks.
    g.fillStyle(0x08070c, 0.9)
    for (let i = 1; i < segments; i += 1) {
      const tx = Math.round(x + (w * i) / segments)
      g.fillRect(tx, y, 1, h)
    }
  }
  set(1, false)
  return { set, graphics: g }
}

/**
 * Bake a display heading to a cached canvas texture and return its key.
 * Idempotent per (variant, size, text). Falls back to whatever font resolved
 * if the display face failed to load - headings render plainer, never absent.
 */
export function ensureDisplayTextTexture(
  scene: Phaser.Scene,
  text: string,
  opts: { variant: BakeSpec['variant']; size: number },
): string {
  const key = `dtype:${opts.variant}:${opts.size}:${text}`
  if (scene.textures.exists(key)) return key
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) return key
  const spec: BakeSpec = { text, size: opts.size, variant: opts.variant }
  const box = bakeBox(measure, spec)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(box.width * RENDER_SCALE))
  canvas.height = Math.max(1, Math.round(box.height * RENDER_SCALE))
  const ctx = canvas.getContext('2d')
  if (!ctx) return key
  bakeDisplayText(ctx, spec, RENDER_SCALE, box)
  scene.textures.addCanvas(key, canvas)
  return key
}

/**
 * Register the wordmark texture and return its key. Idempotent.
 *
 * Measured before it is drawn, because the font stack resolves differently on
 * every platform and a hard-coded box would clip the logo on whichever machine
 * draws it widest.
 */
export function ensureLogoTexture(scene: Phaser.Scene, spec: LogoSpec = TITLE_LOGO): string {
  const key = `logo:${spec.text}`
  if (scene.textures.exists(key)) return key
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) return key
  const box = logoBox(measure, spec)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(box.width * RENDER_SCALE))
  canvas.height = Math.max(1, Math.round(box.height * RENDER_SCALE))
  const ctx = canvas.getContext('2d')
  if (!ctx) return key
  drawLogo(ctx, spec, RENDER_SCALE, box)
  scene.textures.addCanvas(key, canvas)
  return key
}

/**
 * Create a cinematic vignette texture (w x h) - dark edges fading to fully
 * transparent in the center. Overlay it scrollFactor-0 at screen size.
 */
export function createVignette(scene: Phaser.Scene, w: number, h: number, strength = 0.55): string {
  // Include strength in the key and ALWAYS regenerate (never reuse a stale
  // texture of the same name - that produced a stretched 32x32 black frame).
  const key = `hud:vignette-${w}x${h}s${String(strength).replace('.', '_')}`
  if (scene.textures.exists(key)) return key
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.62)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${strength})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
  scene.textures.addCanvas(key, canvas)
  return key
}

/** Add a vignette overlay to a scene at the given depth. Returns the image. */
export function addVignette(
  scene: Phaser.Scene,
  w: number,
  h: number,
  depth: number,
  strength?: number,
): Phaser.GameObjects.Image {
  const key = createVignette(scene, w, h, strength)
  return scene.add.image(w / 2, h / 2, key).setDepth(depth).setScrollFactor(0)
}