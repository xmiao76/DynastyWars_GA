/** Typings for the CMR-05 motion capture/review core. */

export interface TraceRow {
  action?: string
  facing?: string
  renderer?: string
  state?: string
  stateTick?: number
  tick?: number
  attackId?: string | null
  key?: string
  elapsedMs?: number
  frozen?: boolean
  paused?: boolean
  commit?: string
  actor?: string | number
  kind?: string
  source?: 'player' | 'ai' | 'projectile' | 'injected'
  origin?: 'gameplay' | 'injected'
}

export interface CoverageCell {
  action: string
  facing: string
  renderer: string
  status: 'captured' | 'unseen'
  source: 'gameplay' | 'injected'
  grade?: string
}

export interface CaptureIndex {
  fighter: string
  role: string
  capture: {
    commit: string
    dirty: boolean
    capturedAt: string
    rows: number
    facings: string[]
    renderers: string[]
  }
  pack: { revision: string; sourceHashes: Record<string, string> }
  landmarks: Record<string, unknown>
  capabilities: string[]
  coverage: CoverageCell[]
  evidence: { tracePath: string; videoPath: string; contactSheet: string }
}

export declare const ROLE_CAPABILITIES: Record<string, string[]>
export declare const HERO_ACTIONS: string[]
export declare const ENEMY_ACTIONS: string[]
export declare const HORSE_ACTIONS: string[]
export declare function actionsForRole(role: string): string[]

export declare function validateTrace(
  rows: TraceRow[],
  opts?: {
    pack?: { frames: Record<string, unknown> }
    bindings?: Record<string, string>
    claimsMotion?: boolean
    subjectKind?: string
    expectedCommit?: string
    removedResiduePx?: number
    residueTolerancePx?: number
  },
): { errors: string[]; checked: { rows: number; motionRows: number; legacyRows: number } }

export declare function coverageMatrix(
  rows: TraceRow[],
  opts?: { actions?: string[]; facings?: string[]; renderers?: string[]; injected?: string[] },
): CoverageCell[]

export declare function assertIndexIntegrity(index: CaptureIndex | { coverage?: CoverageCell[]; landmarks?: Record<string, unknown> }): string[]

export declare function pacingReport(
  rows: TraceRow[],
  opts?: { limitation?: string },
): {
  actions: Record<string, { samples: number; msPerTickMedian: number; msPerTickMax: number }>
  playbackPace: string
  limitations: string[]
}

export declare function resourceReport(budget?: {
  networkBytes?: number
  sourceBytes?: number
  decodedBytes?: number
  gpuBytes?: number
  clonedCanvasBytes?: number
  caps?: Record<string, number>
}): {
  networkBytes: number
  sourceBytes: number
  decodedBytes: number
  gpuBytes: number
  clonedCanvasBytes: number
  caps: Record<string, number>
  withinCaps: boolean
}

export declare function buildIndex(input: {
  fighter: string
  role: string
  commit: string
  dirty?: boolean
  packRevision?: string
  sourceHashes?: Record<string, string>
  landmarks?: Record<string, unknown>
  coverage?: CoverageCell[]
  rows?: number
  facings?: string[]
  renderers?: string[]
  tracePath?: string
  videoPath?: string
  contactSheet?: string
}): CaptureIndex
