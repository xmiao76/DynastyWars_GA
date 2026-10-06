import type { Pixels } from './motion-pipeline.mjs'
export interface ChargeCandidateSpec {
 fighter: string
 density: number
 rawToArtScale: number
 box: {width:number;height:number;groundY:number}
 sources: Record<string,{file:string;sha256:string}>
 anchors: Record<string,{pelvis:[number,number];groundY:number;contact:[number,number]|null;secondarySole:[number,number]|null;support:string}>
 exposures: Array<{tick:number;frame:string}>
 limits: string
}
export declare const REGISTERED_CHARGE_SPEC: string
export declare function chargeExposureForTick(spec: ChargeCandidateSpec, tick:number):string
export declare function registeredTransform(spec:ChargeCandidateSpec,id:string):{scale:number;tx:number;ty:number}
export declare function chargeMotionTrace():{
 attackId:string;startup:number;active:number;recover:number;total:number;speed:number
 coreHashes:{attacks:string;ai:string}
 trace:Array<{tick:number;x:number;moving:boolean;state:string;stateTick:number}>
}
export declare function validateCandidateAnchors(spec:ChargeCandidateSpec,imageBy:Record<string,Pixels>):Array<{
 id:string;fit:{scale:number;tx:number;ty:number};pelvisArt:number[];contactErrorsU:number[];groundEvidence:string;support:string
}>
export declare function buildRegisteredChargeFixture(spec:ChargeCandidateSpec,out:string):Promise<unknown>
