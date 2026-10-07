import type { Pixels } from './motion-pipeline.mjs'
export declare const PASS2_CELLS: number[]
export declare const PASS2_STRENGTH: Record<number, Record<string, {gain:number;chroma:number}>>
export declare function assertPass2Conservation(before:Pixels,after:Pixels):void
export declare function harmonizeChargePaint2(source:Pixels):{
 image:Pixels
 changedRgbPixels:Record<number,number>
 composition:{count:number;cells:number[]}
}
