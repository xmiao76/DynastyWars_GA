import type { Pixels } from './motion-pipeline.mjs'
export declare const CELL4: { cell: number; cap: number[]; tip: number[]; band: number; t0: number; shift: number[] }
export declare const COMBO_CELL4_WITNESSES: Array<[string, number[]]>
export declare function measureComboCell4Weapon(image: Pixels, corridor?: number): { length: number; butt: number[] | null; tip: number[] | null }
export declare function assertComboCell4Protected(before: Pixels, after: Pixels): void
export declare function slideComboCell4(source: Pixels): {
  image: Pixels
  shift: number[]
  slide: number
  pre: { length: number; butt: number[] | null; tip: number[] | null }
  post: { length: number; butt: number[] | null; tip: number[] | null }
  report: { moved: number; filled: number; achieved: number }
  composition: { count: number; cells: number[] }
  alphaRestored: number
}
