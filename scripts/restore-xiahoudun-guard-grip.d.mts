import type { Pixels } from './motion-pipeline.mjs'
export declare const GRIP_RECT: [number,number,number,number]
export declare function restoreGuardGrip(original: Pixels, prepared: Pixels): {
  image: Pixels
  rect: number[]
  changedChannels: number
  composition: { count: number; cells: number[] }
}
