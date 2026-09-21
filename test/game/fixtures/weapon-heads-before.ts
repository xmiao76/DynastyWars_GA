// ART-15 negative controls: exact paths from the photographed pre-fix build.
export type BladeHead = 'crescent' | 'serpent' | 'leaf' | 'dao'
export type WeaponTrace = (c: CanvasRenderingContext2D) => void

/** Unposed head geometry: local X follows the shaft, and fore is its end. */
export function traceLegacyBlade(c: CanvasRenderingContext2D, head: BladeHead, fore = 0): void {
  switch (head) {
    case 'crescent':
      c.beginPath()
      c.moveTo(fore - 8, 0)
      c.quadraticCurveTo(fore + 4, -11, fore + 15, -12)
      c.quadraticCurveTo(fore + 21, -10, fore + 22, -4)
      // Forward hook on the cutting edge, then back down it.
      c.lineTo(fore + 17, -1)
      c.lineTo(fore + 13, 2)
      c.quadraticCurveTo(fore + 15, 5, fore + 6, 6)
      c.quadraticCurveTo(fore - 2, 4, fore - 8, 0)
      c.closePath()
      break
    case 'serpent':
      c.beginPath()
      c.moveTo(fore - 6, 0)
      c.quadraticCurveTo(fore + 2, -10, fore + 9, -6)
      c.quadraticCurveTo(fore + 16, -3, fore + 20, -10)
      c.lineTo(fore + 22, -6)
      c.quadraticCurveTo(fore + 17, 1, fore + 11, 6)
      c.quadraticCurveTo(fore + 5, 9, fore - 3, 5)
      c.closePath()
      break
    case 'leaf':
      c.beginPath()
      c.moveTo(fore - 4, 0)
      c.quadraticCurveTo(fore + 2, -4, fore + 10, -3)
      c.quadraticCurveTo(fore + 18, -2, fore + 22, 0)
      c.quadraticCurveTo(fore + 18, 2, fore + 10, 3)
      c.quadraticCurveTo(fore + 2, 4, fore - 4, 0)
      c.closePath()
      break
    case 'dao':
      c.beginPath()
      c.moveTo(fore - 8, -8)
      c.quadraticCurveTo(fore + 8, -13, fore + 14, -12)
      c.lineTo(fore + 20, -9)
      c.quadraticCurveTo(fore + 24, -6, fore + 24, -1)
      c.quadraticCurveTo(fore + 18, 6, fore + 9, 13)
      c.quadraticCurveTo(fore + 1, 14, fore - 8, 3)
      c.closePath()
      break
  }
}

/** Bow limb geometry in the same local frame as the held weapon. */
export function traceLegacyBow(c: CanvasRenderingContext2D, halfLength: number): void {
  c.beginPath()
  c.moveTo(-halfLength, -6.5)
  c.quadraticCurveTo(-halfLength + 2, 2, -halfLength * 0.62, 7)
  c.quadraticCurveTo(-halfLength * 0.3, 10.5, 0, 11.5)
  c.quadraticCurveTo(halfLength * 0.3, 10.5, halfLength * 0.62, 7)
  c.quadraticCurveTo(halfLength - 2, 2, halfLength, -6.5)
  // Inner edge, walking back with the flip near each tip.
  c.quadraticCurveTo(halfLength - 4.5, -2, halfLength * 0.6, 3.5)
  c.quadraticCurveTo(halfLength * 0.28, 6.5, 0, 7.5)
  c.quadraticCurveTo(-halfLength * 0.28, 6.5, -halfLength * 0.6, 3.5)
  c.quadraticCurveTo(-halfLength + 4.5, -2, -halfLength, -6.5)
  c.closePath()
}