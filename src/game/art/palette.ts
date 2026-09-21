/**
 * Material colours for the cel-shaded cast.
 *
 * Cel shading is built from a small number of FLAT tones per material rather
 * than a gradient: a base, one hard shadow step, one light step, and a single
 * ink colour shared by every figure. Each kind is authored with three colours -
 * body, trim and headgear - and the rest are derived, so a new fighter is a
 * three-number entry rather than a palette to hand-balance.
 */

/** The one ink colour. Every figure is bordered in it, so the cast reads as a set. */
export const INK = '#140f14'

/** Darken a packed RGB toward black by `amount` (0..1). */
export function shade(rgb: number, amount: number): number {
  const r = Math.round(((rgb >> 16) & 0xff) * (1 - amount))
  const g = Math.round(((rgb >> 8) & 0xff) * (1 - amount))
  const b = Math.round((rgb & 0xff) * (1 - amount))
  return (r << 16) | (g << 8) | b
}

/** Lighten a packed RGB toward white by `amount` (0..1). */
export function tint(rgb: number, amount: number): number {
  const r = Math.round(((rgb >> 16) & 0xff) + (255 - ((rgb >> 16) & 0xff)) * amount)
  const g = Math.round(((rgb >> 8) & 0xff) + (255 - ((rgb >> 8) & 0xff)) * amount)
  const b = Math.round((rgb & 0xff) + (255 - (rgb & 0xff)) * amount)
  return (r << 16) | (g << 8) | b
}

/** Packed RGB to a CSS colour string. */
export function css(rgb: number): string {
  return `#${rgb.toString(16).padStart(6, '0')}`
}

/** Every flat tone one figure is drawn from. */
export interface Materials {
  skin: string
  skinShade: string
  /**
   * A deeper skin step, for facial FORM - the side of a nose, an ear, the
   * shadow under a jaw.
   *
   * Not the same as `skinShade`. That one is 22% down from the base tone, and
   * the cel pass already lays a 34% overlay (SHADOW in draw.ts) across the
   * unlit side - so on the shadowed half of a head `skinShade` came out
   * BRIGHTER than the surface it was drawn on and every form mark read as a
   * pale blob rather than a crease. This step is deeper than either band, so a
   * form mark stays a shadow wherever it lands.
   */
  skinForm: string
  cloth: string
  clothShade: string
  clothLight: string
  trim: string
  trimShade: string
  gear: string
  gearShade: string
  leather: string
  leatherShade: string
  steel: string
  steelShade: string
  haft: string
  /** 红缨 tassel red, for the tuft at a polearm socket. */
  tassel: string
  hair: string
  eye: string
}

const LEATHER = 0x4a3524
const STEEL = 0xc8d0dc
const HAFT = 0x7a5230
/**
 * 红缨, the red tassel behind every Chinese spearhead and polearm blade. A
 * FIXED red like STEEL and HAFT rather than per-character trim: the tassel is
 * red on every historical weapon regardless of the wielder's livery, and
 * per-character trim would give Zhang Fei a gray tuft on the 丈八蛇矛.
 */
export const TASSEL = 0xc43830

/**
 * Complexion. A FIGURE property, not a module property.
 *
 * This was a single constant for the whole cast, which meant every one of the
 * eighteen humanoids was the same shade - so Guan Yu's 面如重枣 ("face like a
 * dark red date") and Zhang Fei's 黑脸 were not merely missing, they were
 * inexpressible. The default is still the old tone, so a kind that says
 * nothing about its complexion draws exactly what it drew before.
 */
export const SKIN = 0xf0c8a0

/**
 * Build the full tone set from the three colours that define a kind.
 *
 * The shadow step is a fixed fraction rather than a hand-picked colour so that
 * every material darkens by the same amount: cel shading reads as one light
 * source, and it stops reading as one the moment each material picks its own.
 */
export function materials(
  body: number,
  trim: number,
  gear: number,
  hair = 0x3a2a18,
  skin = SKIN,
): Materials {
  return {
    skin: css(skin),
    skinShade: css(shade(skin, 0.22)),
    skinForm: css(shade(skin, 0.45)),
    cloth: css(body),
    clothShade: css(shade(body, 0.34)),
    clothLight: css(tint(body, 0.26)),
    trim: css(trim),
    trimShade: css(shade(trim, 0.34)),
    gear: css(gear),
    gearShade: css(shade(gear, 0.34)),
    leather: css(LEATHER),
    leatherShade: css(shade(LEATHER, 0.34)),
    steel: css(STEEL),
    steelShade: css(shade(STEEL, 0.3)),
    haft: css(HAFT),
    tassel: css(TASSEL),
    hair: css(hair),
    eye: '#201820',
  }
}
