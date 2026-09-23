import { describe, expect, it } from 'vitest'
import { BODY_STACK, DISPLAY_MIN_SIZE, LIVE_STACK, css, liveStyle, THEME } from '../../src/game/ui/theme'
import { DISPLAY_FAMILY, displayStringTable, loadDisplayFont, type FontLoaderDeps } from '../../src/game/ui/type'

describe('theme live-text presets', () => {
  it('uses the display stack at and above the threshold, body below', () => {
    expect(liveStyle(DISPLAY_MIN_SIZE).fontFamily).toBe(LIVE_STACK)
    expect(liveStyle(DISPLAY_MIN_SIZE + 20).fontFamily).toBe(LIVE_STACK)
    expect(liveStyle(DISPLAY_MIN_SIZE - 1).fontFamily).toBe(BODY_STACK)
  })

  it('preserves size, colour and style exactly', () => {
    expect(liveStyle(17, { color: '#ffd700', bold: true, italic: true })).toEqual({
      fontFamily: LIVE_STACK,
      fontSize: '17px',
      color: '#ffd700',
      fontStyle: 'bold italic',
    })
    expect(liveStyle(30, { color: '#fff', stroke: '#000', strokeThickness: 4 })).toMatchObject({
      stroke: '#000',
      strokeThickness: 4,
    })
    expect(liveStyle(10)).toMatchObject({ fontSize: '10px', color: '#ffffff' })
    expect(liveStyle(10).fontStyle).toBeUndefined()
  })

  it('theme palette entries are distinct usable colours', () => {
    const values = Object.values(THEME)
    expect(new Set(values).size).toBe(values.length)
    for (const v of values) {
      expect(Number.isInteger(v) && v >= 0 && v <= 0xffffff).toBe(true)
    }
    expect(css(THEME.gold)).toBe('#e8b820')
  })

  it('display family matches the committed font subset name', () => {
    expect(DISPLAY_FAMILY).toBe('DynastyDisplay')
    expect(LIVE_STACK).toContain(DISPLAY_FAMILY)
  })
})

describe('display-string table', () => {
  it('covers every hero, enemy and stage name in both languages', async () => {
    const { CHARACTER_ORDER, characterById } = await import('../../src/core/characters')
    const { ENEMIES, enemyByKind } = await import('../../src/core/enemies')
    const { STAGE_ORDER, STAGES } = await import('../../src/core/stage')
    const table = new Set(displayStringTable())
    for (const id of CHARACTER_ORDER) {
      expect(table.has(characterById(id).nameEn)).toBe(true)
      expect(table.has(characterById(id).nameZh)).toBe(true)
    }
    for (const kind of Object.keys(ENEMIES)) {
      expect(table.has(enemyByKind(kind).nameEn)).toBe(true)
      expect(table.has(enemyByKind(kind).nameZh)).toBe(true)
    }
    for (const id of STAGE_ORDER) {
      const s = STAGES[id]
      if (!s) continue
      expect(table.has(s.nameEn)).toBe(true)
      expect(table.has(s.nameZh)).toBe(true)
    }
  })
})

describe('loadDisplayFont', () => {
  const manual = (): { deps: FontLoaderDeps; fire: () => void; cancels: () => number } => {
    let fire: () => void = () => {}
    let cancels = 0
    const deps: FontLoaderDeps = {
      loadFace: () => new Promise<void>(() => {}),
      wait: () => ({ done: new Promise<void>((r) => { fire = r }), cancel: () => { cancels += 1 } }),
    }
    return { deps, fire: () => fire(), cancels: () => cancels }
  }

  it('reports loaded when the face resolves', async () => {
    const m = manual()
    m.deps.loadFace = () => Promise.resolve()
    await expect(loadDisplayFont('x.woff2', 100, m.deps)).resolves.toBe('loaded')
    expect(m.cancels()).toBe(1)
  })

  it('falls back when loading rejects, without throwing', async () => {
    const m = manual()
    m.deps.loadFace = () => Promise.reject(new Error('blocked'))
    await expect(loadDisplayFont('x.woff2', 100, m.deps)).resolves.toBe('fallback')
    expect(m.cancels()).toBe(1)
  })

  it('falls back on timeout and still cancels the timer', async () => {
    const m = manual()
    const pending = loadDisplayFont('x.woff2', 100, m.deps)
    m.fire()
    await expect(pending).resolves.toBe('fallback')
    expect(m.cancels()).toBe(1)
  })
})
