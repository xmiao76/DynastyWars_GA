export interface SilhouetteDelta { from: string; to: string; topFrom: number; topTo: number; delta: number }
export declare function topDeltas(seq: string[], topOf: (name: string) => number): SilhouetteDelta[]
export declare function compareChargeSilhouetteTops(
  lidianPrepared: { box: { groundY: number }; density: number; frames: Record<string, { trimY: number }> },
  xiahouManifest: { box: { groundY: number }; density: number; frames: Record<string, { bounds: { y: number } }> },
): {
  sequence: string[]
  lidian: SilhouetteDelta[]
  xiahoudun: SilhouetteDelta[]
  maxAdjacentAbsDelta: { lidian: number; xiahoudun: number }
  dashToDash2: { lidian: number; xiahoudun: number }
  limits: string
}
