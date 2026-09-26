export const DENSITY: number
export const BOW_REF_HALF: number
export const WEAPON_SPECS: Record<string, { length: number; haft: number; head: string; tassel?: boolean }>
export const WEAPON_BOUNDS: Record<string, [number, number, number, number]>
export function paintWeaponCell(kind: string): { cell: unknown; cw: number; ch: number }
export function paintTasselCell(): { cell: unknown; cw: number; ch: number }
export function paintWeaponSheet(): {
  png: Buffer
  prepared: {
    weapons: {
      revision: string
      density: number
      sheet: { width: number; height: number }
      parts: Record<string, { x: number; y: number; w: number; h: number; originX: number; originY: number }>
      signatures: { sheet: string }
      sha256: { sheet: string }
    }
  }
  width: number
  height: number
}
