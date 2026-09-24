export const CELL_W: number
export const CELL_H: number
export const DENSITY: number
export const PIVOT: { x: number; y: number }
export const PARTS: Array<{ name: string; len: number; wA: number; wB: number; color: string }>
export function generateFixtures(): {
  png: Buffer
  prepared: {
    fixture: {
      revision: string
      skin: string
      sheet: { width: number; height: number }
      parts: Record<string, { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number }>
      signatures: { sheet: string }
      sha256: { sheet: string }
    }
  }
}
