/** Type declarations for scripts/make-art.mjs (sprite generator). */

export interface Canvas {
  w: number
  h: number
  data: Uint8Array
}

export type RGB = [number, number, number]

export declare const STYLES: Record<
  string,
  { head: string; beard: boolean; weapon: string }
>
export declare const PALETTES: Record<string, { armor: RGB; cloth: RGB; hair?: RGB }>
export declare function figureCanvas(scale?: number): Canvas
export declare function drawWarrior(ctx: Canvas, pose: string, palette: unknown, kind: string): void