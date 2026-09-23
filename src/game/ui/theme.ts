/**
 * The arcade-homage design system (UI-1): one palette, one type scale, one set
 * of live-text presets shared by every scene.
 *
 * Pure data + pure functions: no Phaser imports, no DOM, no assets - so unit
 * tests can exercise the styles and the baked-text string table in Node.
 * WoF's layout language (gold frames, lacquer blues, parchment cards) rendered
 * in this project's own ink-and-light house style; nothing here copies Capcom
 * art, it only names colours and type.
 */

/** Display face bundled under src/game/assets/fonts (OFL, see PROVENANCE.md). */
export const DISPLAY_FAMILY = 'DynastyDisplay'

/** Live-text stack: the display face with a silent system fallback, so text
 * renders (in a plainer face) even when the font file is blocked. */
export const LIVE_STACK = `"${DISPLAY_FAMILY}", sans-serif`

/** Plain system stack, for 7px micro-labels where a heavy display face would
 * hurt legibility more than it helps identity (weapon/lives/horse/stat lines). */
export const BODY_STACK = 'sans-serif'

/** Sizes at or above this use the display face; below it, the body stack. */
export const DISPLAY_MIN_SIZE = 8

export const THEME = {
  /** Imperial gold: frames, rails, score, prompts. */
  gold: 0xe8b820,
  goldBright: 0xffd700,
  goldDeep: 0x8a5a1a,
  /** Lacquer blues: select frame, P2 plate, bar shells. */
  lacquer: 0x1a3a8f,
  lacquerDeep: 0x0e1f4d,
  lacquerLine: 0x2a4a7a,
  /** Lacquer reds: boss rails, danger, seals. */
  crimson: 0xa01818,
  danger: 0xd33a3a,
  dangerDeep: 0x7a1a1a,
  /** Parchment: cards, captions, light text. */
  parchment: 0xf0dcae,
  parchmentDeep: 0xd8c090,
  parchmentInk: 0x2a1a0a,
  /** Bronze: plaque trim, pips, touch-button rings. */
  bronze: 0x8a6a2a,
  bronzeLight: 0xd8a868,
  /** Life greens (unchanged semantics: danger flag still decides the pair). */
  life: 0x3ad33a,
  lifeDeep: 0x177a3a,
  /** Shared darks. */
  ink: 0x140f14,
  plate: 0x16121c,
  plateDeep: 0x0b0910,
  /** Muted label greys. */
  mist: 0x9ab0c0,
  frost: 0xcfe8ff,
  bone: 0xf5e6c8,
} as const

/** Plain structural style for a Phaser Text object. Returned as data (not a
 * Phaser type) so this module stays runtime-Phaser-free; call sites spread it
 * into `add.text`, which accepts it structurally. */
export interface LiveStyle {
  fontFamily: string
  fontSize: string
  color: string
  fontStyle?: string
  stroke?: string
  strokeThickness?: number
}

/**
 * One constructor for every live label in the game. Preserves the caller's
 * size/colour/style exactly - the UI-1 migration changes only the family, so
 * screenshots stay layout-identical apart from the letterforms.
 */
export function liveStyle(
  size: number,
  opts: { color?: string; bold?: boolean; italic?: boolean; stroke?: string; strokeThickness?: number } = {},
): LiveStyle {
  const style: LiveStyle = {
    fontFamily: size >= DISPLAY_MIN_SIZE ? LIVE_STACK : BODY_STACK,
    fontSize: `${size}px`,
    color: opts.color ?? '#ffffff',
  }
  const bits = `${opts.bold === true ? 'bold' : ''}${opts.bold === true && opts.italic === true ? ' ' : ''}${opts.italic === true ? 'italic' : ''}`
  if (bits !== '') style.fontStyle = bits
  if (opts.stroke !== undefined) style.stroke = opts.stroke
  if (opts.strokeThickness !== undefined) style.strokeThickness = opts.strokeThickness
  return style
}

/** `0xrrggbb` number to `#rrggbb` string, for text colours drawn from THEME. */
export function css(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`
}
