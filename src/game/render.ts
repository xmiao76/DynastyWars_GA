import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/constants'

/**
 * How many device pixels the game draws per logical pixel.
 *
 * `SCREEN_WIDTH`/`SCREEN_HEIGHT` stay 480x270 and remain WORLD units: the sim's
 * geometry is expressed in them (the walk band, edge margins, grab range, the
 * boss trigger distance, every stage length), so moving them would change how
 * the game plays and invalidate every seeded run the logic signal rests on.
 * This constant is a rendering concern only and lives outside `src/core` for
 * that reason.
 *
 * The canvas is created at VIEW_W x VIEW_H and every camera is zoomed by
 * RENDER_SCALE, so all existing coordinates keep working while the backing
 * store carries four times the pixels - which is what cel-shaded art needs and
 * a 480x270 buffer cannot give it.
 */
export const RENDER_SCALE = 2

export const VIEW_W = SCREEN_WIDTH * RENDER_SCALE
export const VIEW_H = SCREEN_HEIGHT * RENDER_SCALE
