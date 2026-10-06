import type { Pixels } from './motion-pipeline.mjs'
export type WalkWeaponEndpoint = { cell: number; tip: number[]; butt: number[]; length: number }
export declare const WALK_PROJECTION_OPS: Array<{cell:number;cap:number[];tip:number[];shift:number[];t0:number;band:number}>
export declare const WALK_ENDPOINT_ZONES: Array<{tip:number[];cap:number[];capBox:number[];tipBox:number[]}>
export declare function assertWalkProjectionBodyUnchanged(before: Pixels, after: Pixels): void
export declare function measureWalkMaterialEndpoints(image: Pixels): WalkWeaponEndpoint[]
export declare function repairWalkProjection(source: Pixels): {
 image: Pixels
 reports: Array<{ cell: number; shift: number[]; t0: number; band: number; preLen: number; predicted: number; moved: number; filled: number; achieved: number }>
 composition: { count: number; cells: number[] }
 endpoints: WalkWeaponEndpoint[]
 weaponSpread: number
}
