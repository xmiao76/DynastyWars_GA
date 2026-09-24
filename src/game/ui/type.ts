/**
 * Display typography (UI-1): the bundled-font loader and the baked display-text
 * painter.
 *
 * Two halves with different homes. Live `Text` objects just name the family
 * (see theme.ts `liveStyle`) and render through Phaser. Headings, banners and
 * the logo lockup are BAKED to canvas textures with an ink shell + gradient
 * faces + drop shadow - the technique `art/logo.ts` established - so both
 * renderers draw identical pixels and there is nothing for a WebGL-only
 * feature to disagree about.
 *
 * Node-safe: no Phaser imports, no asset imports (the font URL is injected by
 * the browser caller), no DOM access except inside the default loader deps.
 */
import { CHARACTER_ORDER, characterById } from '../../core/characters'
import { ENEMIES, enemyByKind } from '../../core/enemies'
import { STAGE_ORDER, STAGES } from '../../core/stage'
import { DISPLAY_FAMILY } from './theme'

export { DISPLAY_FAMILY }

/* ------------------------------------------------------------------ */
/* Font loading                                                        */
/* ------------------------------------------------------------------ */

/** Injectable seams so the timeout/fallback paths are unit-testable in Node. */
export interface FontLoaderDeps {
  /** Resolve once `url` is usable as DISPLAY_FAMILY (FontFace + fonts.add). */
  loadFace: (url: string) => Promise<void>
  /** Resolve after `ms` unless `cancel` runs first. */
  wait: (ms: number) => { done: Promise<void>; cancel: () => void }
}

function browserDeps(): FontLoaderDeps {
  return {
    loadFace: async (url: string): Promise<void> => {
      const face = new FontFace(DISPLAY_FAMILY, `url(${url})`)
      await face.load()
      document.fonts.add(face)
    },
    wait: (ms: number) => {
      let id: ReturnType<typeof setTimeout> | undefined
      return {
        done: new Promise<void>((resolve) => {
          id = setTimeout(resolve, ms)
        }),
        cancel: () => clearTimeout(id),
      }
    },
  }
}

/**
 * Make the display face available, or give up quietly. Never rejects: a
 * missing/slow/blocked font falls back to the system stack (every live style
 * already names the fallback, and the baker measures whatever resolved).
 * The timeout bounds boot: callers never wait longer than `timeoutMs`.
 */
export async function loadDisplayFont(
  url: string,
  timeoutMs: number,
  deps: FontLoaderDeps = browserDeps(),
): Promise<'loaded' | 'fallback'> {
  const timer = deps.wait(timeoutMs)
  try {
    await Promise.race([
      deps.loadFace(url).then(
        () => 'ok',
        () => 'fail',
      ),
      timer.done.then(() => 'timeout'),
    ]).then((outcome) => {
      if (outcome !== 'ok') throw new Error(`display font unavailable (${outcome})`)
    })
    return 'loaded'
  } catch {
    return 'fallback'
  } finally {
    timer.cancel()
  }
}

/* ------------------------------------------------------------------ */
/* Baked display text                                                  */
/* ------------------------------------------------------------------ */

export type DisplayVariant = 'gold' | 'bone' | 'crimson' | 'azure'

export interface BakeSpec {
  text: string
  /** Cap height in canonical units. */
  size: number
  variant: DisplayVariant
  /** Resolution-independent ink weight multiplier. */
  ink?: number
}

interface VariantPaint {
  top: string
  upperMid: string
  lowerMid: string
  bottom: string
  liner: string
  shadow: string
}

const VARIANTS: Record<DisplayVariant, VariantPaint> = {
  gold: {
    top: '#fff3b0',
    upperMid: '#ffd23c',
    lowerMid: '#c07a10',
    bottom: '#ffd23c',
    liner: '#6a4a12',
    shadow: 'rgba(12, 6, 14, 0.85)',
  },
  bone: {
    top: '#ffffff',
    upperMid: '#f5e6c8',
    lowerMid: '#b8a888',
    bottom: '#f5e6c8',
    liner: '#4a3a28',
    shadow: 'rgba(12, 6, 14, 0.85)',
  },
  crimson: {
    top: '#ffd0b0',
    upperMid: '#e85438',
    lowerMid: '#7a1414',
    bottom: '#e85438',
    liner: '#3a0a0a',
    shadow: 'rgba(8, 2, 4, 0.9)',
  },
  azure: {
    top: '#d8ecff',
    upperMid: '#6aa8e8',
    lowerMid: '#1a3a8f',
    bottom: '#6aa8e8',
    liner: '#0a1a3a',
    shadow: 'rgba(4, 6, 14, 0.9)',
  },
}

/** Latin display headings lean; CJK must not - slanted Han glyphs read as a
 * printing defect, not as arcade italics. Mixed strings stay upright. */
const CJK_RE = /[\u3400-\u9fff\uf900-\ufaff]/;
const LEAN = -0.12
const INK = '#140f14'

function bakeFont(ctx: CanvasRenderingContext2D, spec: BakeSpec, family: string): void {
  ctx.font = `400 ${spec.size}px "${family}", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
}

/**
 * Measure the box baked text needs, in canonical units. Measured, not assumed:
 * the display face resolves per platform and CJK advances differ from Latin,
 * so a hard-coded box would clip whichever string draws widest.
 */
export function bakeBox(
  measureCtx: CanvasRenderingContext2D,
  spec: BakeSpec,
  family: string = DISPLAY_FAMILY,
): { width: number; height: number } {
  bakeFont(measureCtx, spec, family)
  const metrics = measureCtx.measureText(spec.text)
  const w = Math.ceil(metrics.width)
  const lean = CJK_RE.test(spec.text) ? 0 : Math.abs(LEAN) * spec.size
  const ink = (spec.ink ?? 1) * spec.size * 0.18
  // actualBoundingBox can be 0 for whitespace-only strings; cap height floor.
  const drawn = Math.ceil(
    Math.max(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent, spec.size),
  )
  return {
    width: Math.ceil(w + lean + ink * 4),
    height: Math.ceil(drawn + ink * 4),
  }
}

/** Paint baked display text into a context sized `bakeBox(spec) * scale`. */
export function bakeDisplayText(
  ctx: CanvasRenderingContext2D,
  spec: BakeSpec,
  scale: number,
  box: { width: number; height: number },
  family: string = DISPLAY_FAMILY,
): void {
  const paint = VARIANTS[spec.variant]
  const ink = (spec.ink ?? 1) * spec.size * 0.18
  ctx.save()
  ctx.scale(scale, scale)
  ctx.translate(box.width / 2, box.height / 2)
  if (!CJK_RE.test(spec.text)) ctx.transform(1, 0, LEAN, 1, 0, 0)
  bakeFont(ctx, spec, family)
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  // Hard drop shadow first, so the heading sits off the backdrop.
  ctx.save()
  ctx.translate(ink * 0.55, ink * 0.7)
  ctx.lineWidth = ink * 2
  ctx.strokeStyle = paint.shadow
  ctx.strokeText(spec.text, 0, 0)
  ctx.fillStyle = paint.shadow
  ctx.fillText(spec.text, 0, 0)
  ctx.restore()

  // Ink shell, then a thin bright liner inside it.
  ctx.lineWidth = ink * 2
  ctx.strokeStyle = INK
  ctx.strokeText(spec.text, 0, 0)
  ctx.lineWidth = Math.max(0.8, ink * 0.7)
  ctx.strokeStyle = paint.liner
  ctx.strokeText(spec.text, 0, 0)

  // Gradient faces.
  const grad = ctx.createLinearGradient(0, -spec.size * 0.62, 0, spec.size * 0.62)
  grad.addColorStop(0, paint.top)
  grad.addColorStop(0.46, paint.upperMid)
  grad.addColorStop(0.54, paint.lowerMid)
  grad.addColorStop(1, paint.bottom)
  ctx.fillStyle = grad
  ctx.fillText(spec.text, 0, 0)

  // Highlight band across the upper third, clipped to the glyphs.
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.fillRect(-box.width, -spec.size * 0.62, box.width * 2, spec.size * 0.3)
  ctx.restore()
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Display-string table                                                */
/* ------------------------------------------------------------------ */

/**
 * Every string the game may bake or set in the display face: hero/boss/stage
 * names from core data plus the fixed UI headings. The baker test renders each
 * one (in every variant) and asserts nothing clips; when UI-5 adds lore
 * captions, their new glyphs extend this table AND the committed font subset
 * (re-run scripts/fetch-display-font.mjs) together.
 */
export function displayStringTable(): string[] {
  const strings = new Set<string>([
    'DYNASTY WARS',
    'Battle of Red Cliffs · 赤壁之战',
    'CHOOSE YOUR WARRIOR',
    'TAP A WARRIOR TO FIGHT',
    'LEFT / RIGHT to choose - ENTER to fight',
    'TAP TO START',
    'PRESS ENTER',
    'PRESS START',
    'CONTINUE?',
    'TAP TO CONTINUE',
    'PAUSED',
    'PRESS P TO RESUME',
    'TAP TO RESUME',
    'TAP TO CONFIRM',
    'GAME OVER',
    'FINAL SCORE',
    'VICTORY',
    'STAGE CLEAR',
    'SCENE',
    'WAVE',
    'GO!',
    'GO →',
    'SCORE',
    'LIVES',
    'POWER',
    'LIFE',
    'SPEED',
    '1P',
    '2P',
    'HIT',
    'DOWN',
    'BOSS',
  ])
  for (const id of CHARACTER_ORDER) {
    const c = characterById(id)
    strings.add(c.nameEn)
    strings.add(c.nameEn.toUpperCase())
    strings.add(c.nameZh)
    strings.add(`${c.nameEn} ${c.nameZh}`)
  }
  for (const kind of Object.keys(ENEMIES)) {
    const e = enemyByKind(kind)
    strings.add(e.nameEn)
    strings.add(e.nameZh)
    strings.add(`${e.nameEn} ${e.nameZh}`)
  }
  for (const id of STAGE_ORDER) {
    const s = STAGES[id]
    if (!s) continue
    strings.add(s.nameEn)
    strings.add(s.nameZh)
    strings.add(`${s.nameEn} · ${s.nameZh}`)
  }
  return [...strings]
}
