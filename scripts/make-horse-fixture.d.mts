export const FRAME_W: number
export const FRAME_H: number
export const DENSITY: number
export const FRAMES: Array<{ name: string; color: string }>
export function generateFixture(): {
  png: Buffer
  prepared: {
    fixture: {
      revision: string
      density: number
      sheet: { width: number; height: number }
      frames: Record<string, { x: number; y: number; w: number; h: number }>
      signatures: { sheet: string }
      sha256: { sheet: string }
    }
  }
}
