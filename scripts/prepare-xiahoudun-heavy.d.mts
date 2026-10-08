export declare const SRC_PATH: string
export declare const SRC_SHA: string
export declare const OUT_PATH: string
export declare const SPLIT_X: number
export declare const CELLS: number[]
export declare function prepareHeavySource(): Promise<{ placements: Array<{ fig: number; cell: number; srcBox: number[]; dst: number[] }>; composition: { drawings: number }; image: { width: number; height: number; data: Uint8ClampedArray } }>
