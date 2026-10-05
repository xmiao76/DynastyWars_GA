/** Typings for the deterministic rigid-axis shaft retouch toolkit. */

import type { Pixels } from './motion-pipeline.mjs'

export interface RetouchComponent {
  area: number
  x0: number
  y0: number
  x1: number
  y1: number
  pixels: number[]
}

export interface RetouchOp {
  cell: number
  mode: 'extend' | 'shorten'
  cap: [number, number]
  angleDeg: number
  t0: number
  band: number | [number, number]
  shift: [number, number]
  predicted: number
  oShaft?: [number, number]
  slab?: [number, number]
  tolerancePx?: number
  minPiecePx?: number
  maxShortenPx?: number
  isolationMargin?: number
}

export interface RetouchHooks {
  cellOf: (comp: RetouchComponent, W: number, H: number) => number
  measure: (im: Pixels, comp: RetouchComponent) => number
  rejectColor?: (r: number, g: number, b: number) => boolean
}

export interface RetouchResult {
  moved: number
  filled: number
  achieved: number
}

export declare const ALPHA: 96
export declare const SPECK_PX: 64
export declare const DEFAULT_TOLERANCE_PX: 1
export declare const DEFAULT_MIN_PIECE_PX: 500
export declare const DEFAULT_MAX_SHORTEN_PX: 3000
export declare const DEFAULT_ISOLATION_MARGIN: 12

export declare function gridCellOf(rows: number, cols: number): (comp: RetouchComponent, W: number, H: number) => number
export declare function applyRetouchOp(im: Pixels, op: RetouchOp, hooks: RetouchHooks): RetouchResult
export declare function verifySheetComposition(im: Pixels, input: {
  expectCells: number[]
  cellOf: (comp: RetouchComponent, W: number, H: number) => number
}): { count: number; cells: number[] }
