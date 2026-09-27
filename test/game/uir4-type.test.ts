import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { META_ROW } from '../../src/game/ui/hudlayout'

/**
 * UIR-4 measurable acceptance (V-4): no liveStyle caller in the scenes
 * passes a size below the display minimum (DISPLAY_MIN_SIZE 8) - at 7 the
 * style falls back to the generic sans and reads at ~6 CSS px on a Pixel 7.
 * Scans the scene/ui sources for liveStyle(<number>) arguments and checks
 * every layout constant that carries a `size` field.
 */
describe('UIR-4 no sub-display-minimum text sizes (V-4)', () => {
  const roots = ['src/game/scenes', 'src/game/ui']
  const files: string[] = []
  const walk = (d: string): void => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) walk(p)
      else if (p.endsWith('.ts')) files.push(p)
    }
  }
  for (const r of roots) walk(r)

  it('no liveStyle call passes a numeric size below the display minimum', () => {
    const offenders: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/liveStyle\((\d+)/g)) {
        const size = Number(m[1])
        if (size < 8) offenders.push(`${f}: liveStyle(${size})`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the HUD layout text constants are at least the display minimum', () => {
    expect(META_ROW.size).toBeGreaterThanOrEqual(8)
  })
})
