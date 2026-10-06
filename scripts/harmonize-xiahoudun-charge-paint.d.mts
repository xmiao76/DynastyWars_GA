import type { Pixels } from './motion-pipeline.mjs'
export declare const CHARGE_PAINT_REGIONS: Array<{cell:number;kind:string;polygon:number[][]}>
export declare function pointInPolygon(x:number,y:number,points:number[][]): boolean
export declare function isProtectedChargeWeapon(cell:number,x:number,y:number): boolean
export declare function assertChargePaintConservation(before:Pixels,after:Pixels):void
export declare function harmonizeChargePaint(source:Pixels):{
 image:Pixels
 changedRgbPixels:Record<number,number>
 composition:{count:number;cells:number[]}
}
