import type { Pixels } from './motion-pipeline.mjs'
import type { RetouchResult } from './motion-retouch.mjs'
export declare function assertRepairBodyUnchanged(before: Pixels, after: Pixels): void
export declare function extendRepairedChargeCoil(source: Pixels): {
  image: Pixels; report: RetouchResult & { preLen: number; predicted: number }
}
export declare function spliceChargeRepair(base: Pixels, repair: Pixels): {
  image: Pixels
  extension: RetouchResult & { preLen: number; predicted: number }
  frames: Array<{ cell: number; source: string; area: number; pixelSha256: string }>
  composition: { count: number; cells: number[] }
  cleanup: Array<{ removedGlowPx: number; removedSpeckPx: number }>
}
