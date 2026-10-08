export declare const SRC_PATH: string
export declare const SRC_SHA: string
export declare const OUT_PATH: string
export declare const SEAM_BOX: number[]
export declare const SEAM_SEED_3: number[]
export declare const SEAM_SEED_4: number[]
export declare const CELLS: number[]
export declare function separateHeavyMerge(image: { width: number; height: number; data: Uint8ClampedArray }): {
  figs: Array<{ area: number; x0: number; x1: number; y0: number; y1: number; pixels: number[] }>
  seam: { box: number[]; fig3Area: number; fig4Area: number; reattached: number; twilight: number }
}
export declare function prepareHeavySource(): Promise<{ placements: Array<{ fig: number; cell: number; srcBox: number[]; dst: number[] }>; composition: { drawings: number }; seam: { box: number[]; fig3Area: number; fig4Area: number; reattached: number; twilight: number }; image: { width: number; height: number; data: Uint8ClampedArray } }>
