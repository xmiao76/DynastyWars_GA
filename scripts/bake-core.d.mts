/** Type declarations for scripts/bake-core.mjs. */

export interface RawImage {
  width: number
  height: number
  data: Uint8Array
}

export interface KeyColor {
  name: string
  r: number
  g: number
  b: number
}

export interface TrimBox {
  x: number
  y: number
  w: number
  h: number
}

export interface FrameBox {
  w: number
  h: number
  poses: string[]
}

export declare const KEY_COLORS: KeyColor[]
export declare function sniffKeyColor(image: RawImage): KeyColor
export declare function applyAlphaKey(
  image: RawImage,
  key: KeyColor,
  tolerance?: number,
  softness?: number,
): RawImage
export declare function despill(image: RawImage, key: KeyColor): RawImage
export declare function trimBox(image: RawImage, threshold?: number): TrimBox | null
export declare function composeIntoBox(
  image: RawImage,
  box: TrimBox,
  boxW: number,
  boxH: number,
): RawImage
export declare const FRAME_BOXES: Record<string, FrameBox>
export declare function buildManifest(bakedNames: string[]): {
  sprites: Record<string, string[]>
  portraits: string[]
}
