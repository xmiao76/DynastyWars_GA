/** Typings for the CMR-04 generic motion preparation toolkit. */

export interface Pixels {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface CellRect {
  x: number
  y: number
  w: number
  h: number
}

export interface FrameHit {
  name: string
  position: number
  cellIndex: number
  cell: CellRect
  content: CellRect
}

export interface Trim {
  srcW: number
  srcH: number
  trimX: number
  trimY: number
  w: number
  h: number
}

export interface Pivot {
  x: number
  y: number
}

export interface CleanupSpec {
  alphaThreshold?: number
  speckMaxPx?: number
  residueTolerancePx?: number
}

export interface SequenceSpec {
  name: string
  count: number
  rows: number
  cols: number
  order?: number[]
  identities?: Record<number, string>
}

export interface FighterSpec {
  id: string
  role: 'hero' | 'mook' | 'boss' | 'shooter' | 'horse'
  density: number
  box: { width: number; height: number; groundY: number }
  saddleY?: number
  revision?: string
  cleanup?: CleanupSpec
  sequences?: SequenceSpec[]
}

export interface PreparedFrame extends FrameHit {
  trim: Trim
  pivot: Pivot
  restoredSha256: string
  contentSha256: string
  source: Pixels
  identityPinned?: boolean
}

export interface PackedPage {
  name: string
  width: number
  height: number
  pixels: Pixels
}

export interface PackReport {
  fighter: string
  role: string
  density: number
  box: { width: number; height: number; groundY: number }
  camera: unknown
  ground: unknown
  saddle: unknown
  pivot: unknown
  identity: Array<{ name: string; restoredSha256: string; pinned: boolean }>
  landmarks: unknown
  counts: {
    sourceCells: number
    displayedUniqueDrawings: number
    duplicateSourceCells: number
    unusedSourceCells: number
  }
  budgets: Record<string, unknown>
  pages: Array<{ name: string; width: number; height: number }>
}

export interface BudgetReport {
  errors: string[]
  decodedBytes: number
  gpuBytes: number
  clonedCanvasBytes: number
  networkBytes: number
}

export interface PackResult {
  frames: PreparedFrame[]
  pages: PackedPage[]
  manifest: Record<string, unknown>
  manifestJson: string
  manifestSha256: string
  report: PackReport
  budget: BudgetReport
}

export declare const PAGE_LIMIT: number
export declare const DECODED_CAP: number
export declare const RETAINED_CAP: number
export declare const STAGE_DOWNLOAD_CAP: number
export declare const DENSITY: number
export declare const TRIM_PAD: number

export declare function fighterPaths(id: string, opts?: { sourceRoot?: string; outputRoot?: string }): {
  id: string
  source: string
  output: string
  pages: string
  report: string
}
export declare function assertOwnOutput(id: string, path: string, opts?: { sourceRoot?: string; outputRoot?: string }): string
export declare function alphaComponents(im: Pixels, alphaThreshold?: number): Array<{ area: number; x0: number; y0: number; x1: number; y1: number; pixels: number[] }>
export declare function cleanAlpha(im: Pixels, cleanup?: CleanupSpec): { components: Array<{ area: number; x0: number; y0: number; x1: number; y1: number; pixels: number[] }>; removedGlowPx: number; removedSpeckPx: number }
export declare function extractSequence(im: Pixels, fighter: FighterSpec, sequence: SequenceSpec): { frames: FrameHit[]; cleaned: ReturnType<typeof cleanAlpha> }
export declare function trimCell(frame: FrameHit): Trim
export declare function pivotOf(trim: Trim, fighter: FighterSpec): Pivot
export declare function restoreCellPixels(im: Pixels, frame: FrameHit, trim: Trim): Uint8ClampedArray
export declare function restoredHash(im: Pixels, frame: FrameHit, trim: Trim): string
export declare function contentHash(im: Pixels, frame: FrameHit, trim: Trim): string
export declare function packFrames(items: Array<{ frame: FrameHit; trim: Trim; source: Pixels }>, opts?: { pageLimit?: number; pagePrefix?: string }): PackedPage[]
export declare function validateBudget(fighter: FighterSpec, frames: Array<{ trim: Trim }>, pages: Array<{ width: number; height: number; name: string }>): BudgetReport
export declare function buildReport(fighter: FighterSpec, frames: PreparedFrame[], pages: PackedPage[], extra?: Record<string, unknown>): PackReport
export declare function validateProvenance(
  record: { candidates?: Record<string, Record<string, unknown>> } | undefined,
  usedCandidates: string[],
): { errors: string[]; entries: Array<Record<string, unknown>> }
export declare function preparePack(fighter: FighterSpec, sheets: Record<string, Pixels>): PackResult
export declare function writePackOutputs(fighter: FighterSpec, pack: PackResult, opts?: { sourceRoot?: string; outputRoot?: string }): ReturnType<typeof fighterPaths>
export declare function listFighterOutputs(id: string, opts?: { sourceRoot?: string; outputRoot?: string }): string[]
