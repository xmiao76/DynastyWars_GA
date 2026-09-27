import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { paintTouchControls, type TouchGeometry } from '../../src/game/art/hudart'

/**
 * UIR-6 measurable acceptance (V-10): each d-pad arm's chevron points in
 * the direction the arm moves. The chevron is a thin ink-outlined band
 * with a gold core; the shape's TIP sits at the arm centre with its wings
 * behind it, so the combined chevron pixels' centroid must sit INWARD of
 * the arm centre by >= 1px and the outward extreme must be at the centre
 * plane. The pre-fix path had its apex at +y: the wings fell outward and
 * every arrow pointed inward (up arm showed a down-chevron, left showed
 * ">", etc.).
 */
type Ctx = Parameters<typeof paintTouchControls>[0]

const GEO: TouchGeometry = {
  padCx: 60,
  padCy: 60,
  padArm: 14,
  btnR: 11,
  buttons: [
    { x: 160, y: 70 },
    { x: 185, y: 55 },
    { x: 185, y: 85 },
  ],
  pauseCx: 120,
  pauseCy: 30,
  pauseR: 8,
}

function chevronPts(scale: number): Array<[number, number]> {
  const cv = createCanvas(240 * scale, 120 * scale)
  const ctx = cv.getContext('2d')
  // No ctx.scale: paintTouchControls applies the device scale itself.
  paintTouchControls(ctx as unknown as Ctx, scale, GEO)
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data
  const pts: Array<[number, number]> = []
  for (let y = 0; y < cv.height; y += 1) {
    for (let x = 0; x < cv.width; x += 1) {
      const p = (y * cv.width + x) * 4
      if ((d[p + 3] ?? 0) < 128) continue
      const r = d[p] ?? 0
      const g = d[p + 1] ?? 0
      const b = d[p + 2] ?? 0
      // The chevron's own pixels: its gold core (THEME.gold) and its ink
      // outline (20,15,20 - matched tightly: the lacquer gradient's dark
      // stop is 22,16,32 and would otherwise skew the centroid).
      const gold = r > 150 && g > 110 && b < 130 && r - b > 40
      const ink = Math.abs(r - 20) <= 8 && Math.abs(g - 15) <= 8 && Math.abs(b - 20) <= 8
      if (gold || ink) pts.push([x / scale, y / scale])
    }
  }
  return pts
}

describe('UIR-6 d-pad chevrons point outward (V-10)', () => {
  const scale = 4
  const arms = [
    { name: 'up', x: GEO.padCx, y: GEO.padCy - GEO.padArm, out: [0, -1] as const },
    { name: 'down', x: GEO.padCx, y: GEO.padCy + GEO.padArm, out: [0, 1] as const },
    { name: 'left', x: GEO.padCx - GEO.padArm, y: GEO.padCy, out: [-1, 0] as const },
    { name: 'right', x: GEO.padCx + GEO.padArm, y: GEO.padCy, out: [1, 0] as const },
  ]
  it('each arm keeps its tip at the centre and its wings behind it', () => {
    const pts = chevronPts(scale)
    const failures: string[] = []
    for (const arm of arms) {
      // The pixels belonging to this arm's chevron: within 6u of its
      // centre (the arms are padArm=14 apart, so boxes do not overlap).
      const local = pts.filter(([x, y]) => Math.abs(x - arm.x) <= 6 && Math.abs(y - arm.y) <= 6)
      if (local.length < 30) {
        failures.push(`${arm.name}: chevron missing (${local.length} px)`)
        continue
      }
      const cx = local.reduce((a, q) => a + q[0], 0) / local.length
      const cy = local.reduce((a, q) => a + q[1], 0) / local.length
      // Wings behind: the centroid sits INWARD of the arm centre.
      const inward = (cx - arm.x) * -arm.out[0] + (cy - arm.y) * -arm.out[1]
      if (inward < 1) {
        failures.push(`${arm.name}: wings not behind (inward ${inward.toFixed(1)}px)`)
      }
      // Tip at the centre: the outward extreme reaches the centre plane.
      const outward = Math.max(...local.map(([x, y]) => (x - arm.x) * arm.out[0] + (y - arm.y) * arm.out[1]))
      if (outward < -1) {
        failures.push(`${arm.name}: no tip at the centre plane (outward ${outward.toFixed(1)}px)`)
      }
    }
    expect(failures).toEqual([])
  })
})
