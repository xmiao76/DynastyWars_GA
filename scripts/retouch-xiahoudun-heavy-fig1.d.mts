import type { Pixels } from './motion-pipeline.mjs'
export declare const FIG1: { cell: number; cap: number[]; tip: number[]; band: number; t0: number; shift: number[] }
export declare const FIST_T: number
export declare const HEAVY_FIG1_WITNESSES: Array<[string, number[]]>
export declare function measureHeavyFig1Weapon(image: Pixels, corridor?: number): { length: number; butt: number[] | null; tip: number[] | null }
export declare function assertHeavyFig1Protected(before: Pixels, after: Pixels): void
export declare function slideHeavyFig1(source: Pixels): {
  image: Pixels
  shift: number[]
  slide: number
  pre: { length: number; butt: number[] | null; tip: number[] | null }
  post: { length: number; butt: number[] | null; tip: number[] | null }
  report: { moved: number; filled: number; achieved: number }
  composition: { count: number; cells: number[] }
  alphaRestored: number
}
