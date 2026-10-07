export interface ExposureBoundary { before: number; after: number; from: string; to: string }
export declare function exposureBoundaries(exposures: Array<{ tick: number; frame: string }>): ExposureBoundary[]
