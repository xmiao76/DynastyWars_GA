export const DENSITY: number
export const KEY_TOLERANCE: number
export const FAR_SHADE: number
export const WRIST_FRACTION: number
export const PALM_FRACTION: number
export const HAND_CELL_W: number
export const HAND_CELL_H: number
export const HAND_CELLS: string[]
export function prepareHero(id: string): Promise<{
  sheet: { toBuffer(fmt: 'image/png'): Buffer }
  parts: Record<string, { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number }>
  width: number
  height: number
}>
