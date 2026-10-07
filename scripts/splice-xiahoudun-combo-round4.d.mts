export declare const CAND_PATH: string
export declare const CAND_SHA: string
export declare const R4_PATH: string
export declare const R4_SHA: string
export declare const OUT_PATH: string
export declare const K4: number
export declare const MAP4: Array<[number, number]>
export declare const KEEP4: number[]
export declare function shaftDiameter(pts: Array<[number, number]>): { length: number; butt: [number, number] | null; tip: [number, number] | null; angleDeg: number }
export declare function spliceComboRound4(): Promise<{ image: { width: number; height: number; data: Uint8ClampedArray }; placements: Array<{ fig: number; cell: number; srcBox: number[]; dst: number[] }>; composition: { drawings: number }; measured: Array<{ cell: number; n: number; rawLength: number; length: number; angleDeg: number; butt: [number, number] | null; tip: [number, number] | null }> }>
