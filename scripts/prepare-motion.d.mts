export const BOX: { width: number; height: number; groundY: number }
export const DENSITY: number
export const CLIPS: string[]
export function audit(): Promise<unknown>
export function prepare(): Promise<unknown>
export function components(im: { width: number; height: number; data: Uint8ClampedArray }, threshold?: number): Array<{ area: number; x0: number; y0: number; x1: number; y1: number; pixels: number[] }>
