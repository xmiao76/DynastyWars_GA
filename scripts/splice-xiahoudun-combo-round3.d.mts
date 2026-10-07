export declare const CAND_PATH: string
export declare const CAND_SHA: string
export declare const R3_PATH: string
export declare const R3_SHA: string
export declare const OUT_PATH: string
export declare const K3: number
export declare const MAP3: Array<[number, number]>
export declare const KEEP3: number[]
export declare const ACTIVE3: Array<[number, number]>
export declare const KEEP3A: number[]
export declare function spearLength(pts: Array<[number, number]>, band?: number): { length: number; butt: [number, number] | null; tip: [number, number] | null; angleDeg: number }
export declare function spliceComboRound3(): Promise<{ image: unknown; placements: unknown; composition: unknown; measured: unknown }>
