/** Typings for the running FULL-pack Acceptance-4 projection gate. */

export interface BriefBand {
  lo: number
  hi: number
}

export interface ProjectionSheet {
  name: string
  scale: number
  n: number
  min: number
  max: number
  mean: number
  band: BriefBand
  approvedDeviation?: string
  history: Array<Omit<ProjectionSheet, 'history'>>
}

export interface ProjectionState {
  version: 1
  fighter: string
  totalSheets: number
  band: BriefBand | null
  bandAnchor: string | null
  sheets: ProjectionSheet[]
}

export interface ProjectionEvaluation {
  status: 'PASS' | 'FAIL' | 'OK' | 'WARN' | 'STOP'
  observedSpread: number
  n: number
  min?: number
  max?: number
  mean?: number
  window: BriefBand
  reasons: string[]
  sheetMeans?: number[]
  driftSuspected?: boolean
}

export declare const SPREAD_LIMIT: 0.10
export declare const WARN_SPREAD: 0.08
export declare const DRIFT_SHEETS: 3

export declare function spreadOf(values: number[]): number
export declare function meanOf(values: number[]): number
export declare function fixedBandFromMedian(median: number): BriefBand
export declare function evaluateProjection(input: { observed: number[]; remaining: number; band: BriefBand }): ProjectionEvaluation
export declare function driftSuspected(sheetMeans: number[]): boolean
export declare function defaultProjectionPath(fighterId: string): string
export declare function emptyProjection(fighterId: string, totalSheets: number): ProjectionState
export declare function fixBand(state: ProjectionState, median: number, anchorSheet: string): ProjectionState
export declare function recordSheet(state: ProjectionState, input: {
  name: string
  rawValues: number[]
  scale: number
  band: BriefBand
  approvedDeviation?: string
}): { state: ProjectionState; evaluation: ProjectionEvaluation }
export declare function loadProjection(path: string): ProjectionState
export declare function saveProjection(state: ProjectionState, path: string): void
