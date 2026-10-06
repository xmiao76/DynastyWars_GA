import type { Pixels } from './motion-pipeline.mjs'
import type { RetouchResult } from './motion-retouch.mjs'
export declare function assertChargeProtectedPixels(before: Pixels, after: Pixels): void
export declare function retouchXiahoudunCharge(source: Pixels): {
  image: Pixels
  report: Array<RetouchResult & { cell: number; shift: [number, number]; preLen: number; predicted: number }>
  composition: { count: number; cells: number[] }
  heldCells: number[]
}
