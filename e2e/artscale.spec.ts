import { expect, test } from '@playwright/test'

/**
 * Character art must be sized to a DISPLAY size, never left at a raw scale
 * factor.
 *
 * A raw `setScale(n)` is a multiplier on whatever the texture happens to
 * measure, so it silently changes meaning the moment the art pipeline changes.
 * That is not hypothetical: when sprite textures started rasterizing at device
 * density, the result screen's flanking heroes - the one place still using
 * `setScale(1.9)` - doubled and filled the screen. Every gate stayed green,
 * because a frame full of hero is not dark, flat, empty or low on colour, and
 * nothing was occluded or outside its panel. It was visible only by looking.
 *
 * This checks the property rather than the call: every rendered piece of
 * character art has to occupy a sane share of the 270px-tall logical screen.
 * Anything that doubles or halves lands outside the band, whatever the cause -
 * which matters for the phases still to come, where the art pipeline changes
 * again.
 */

/*
 * These are BOX heights, not figure heights. An art box carries margin for a
 * thrust weapon and headroom for a crest, so a 124px boss ships in a 156px box
 * and a 92px hero in a 116px one. The absolute band therefore has to be looser
 * than the figures themselves, which on its own would blunt the check - so it
 * is paired with a ratio test below that does not care about absolute size at
 * all. Either one alone would miss something; together they still catch the
 * regression that prompted this file, a hero drawn at 258px instead of 129.
 */
const MIN_ART_H = 6
const MAX_ART_H = 210
/**
 * Tallest character art over shortest, on any one screen. Bosses are drawn
 * larger than heroes by design (156 against 116, a ratio of 1.35), and nothing
 * else should differ by more than that. Anything drawn at twice its intended
 * size breaks this whether or not it stays inside the absolute band.
 */
const MAX_CHARACTER_RATIO = 1.7
/**
 * Boss art over the smallest fighter on the boss screen.
 *
 * The bound above catches art drawn too BIG. Nothing caught art that lost its
 * size distinction: a boss drawn at the player's height scores 1.0 and passes,
 * while being the readability failure the size difference exists to prevent -
 * you should be able to tell the boss from the mob at a glance. The comment on
 * MAX_CHARACTER_RATIO has stated this intent all along without asserting it.
 *
 * On the legacy path `GameScene.fitSprite` gives a boss 124 on-screen units
 * against 92 for everyone else (measured 1.34), so the distinction is
 * HEIGHT. Motion packs instead share one fixed art-unit scale and draw
 * every kind at the same figure height (~114px: hero, mook and boss trims
 * are all 224-231 source px tall) - there the authored distinction is
 * MASS: the boss figure is roughly twice as wide as a mook's in upright
 * frames. Each path is therefore asserted in its own terms below; floors
 * sit where "visibly larger" stops being true rather than just under the
 * measured population, so shaving the difference down fails here before
 * anyone has to notice it in play.
 */
const MIN_BOSS_RATIO = 1.2
/** Boss upright-frame figure area over a mook kind's (motion path). */
const MIN_BOSS_AREA_RATIO = 1.35

interface ArtItem {
  scene: string
  key: string
  /** Full art-box height on screen (the wrong-size band measures this). */
  displayHeight: number
  /**
   * Drawn figure height on screen: the trimmed frame's cut height at the
   * sprite's scale. Motion boxes share a fixed art-unit scale (extra
   * margin never resizes the fighter), so size DISTINCTION between
   * characters - boss vs mook - lives in the figure inside the box, and
   * the ratio checks below measure this. Legacy frames are untrimmed, so
   * figure == box there.
   */
  figureHeight: number
  /** Drawn figure width on screen (trimmed frame cut width at scale). */
  figureWidth: number
}

test('no character art is drawn at the wrong size', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  // Display identity is the shared-atlas FRAME name for motion art
  // (`entity:<kind>:motion:<clip>:<idx>`; the texture key is just the sheet
  // page), the texture key for legacy art (frame `__BASE`). Motion textures
  // ARE posed character art and must be counted.
  const collect = (sceneKey: string): Promise<ArtItem[]> =>
    page.evaluate((key) => {
      const scene = window.__DW_GAME__?.scene.getScene(key)
      if (!scene) return []
      return scene.children.list
        .filter((c) => c.type === 'Sprite' || c.type === 'Image')
        .map((c) => c as unknown as { texture?: { key: string }; frame?: { name: string; cutHeight?: number; cutWidth?: number }; displayHeight: number; displayWidth: number; scaleX: number; scaleY: number })
        .map((c) => ({ c, id: c.frame && c.frame.name !== '__BASE' ? c.frame.name : (c.texture?.key ?? '') }))
        .filter(({ id }) => id.startsWith('entity:'))
        .map(({ c, id }) => ({
          scene: key,
          key: id,
          displayHeight: Math.round(c.displayHeight),
          figureHeight: Math.round((c.frame?.cutHeight ?? 0) * Math.abs(c.scaleY)) || Math.round(c.displayHeight),
          figureWidth: Math.round((c.frame?.cutWidth ?? 0) * Math.abs(c.scaleX)) || Math.round(c.displayWidth),
        }))
    }, sceneKey)

  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  const items: ArtItem[] = [...(await collect('title'))]

  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  items.push(...(await collect('select')))

  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.waitForTimeout(250)
  items.push(...(await collect('game')))

  await page.evaluate(() => window.__DW__?.forceResult())
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('result')
  await page.waitForTimeout(250)
  items.push(...(await collect('result')))

  // A boss too. Without this the biggest art in the game was never measured -
  // stage 1 has no boss on screen, so the whole check ran on heroes and grunts.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage3'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.evaluate(() => window.__DW__?.forceBoss())
  // The boss kind (stage3: xuchu) is a deferred motion pack: its spawn gate
  // holds until the pack publishes, so wait for boss art to actually render
  // instead of sampling an empty stage.
  await expect
    .poll(async () => (await collect('game')).some((i) => i.key.startsWith('entity:xuchu:')), { timeout: 20_000 })
    .toBe(true)
  // Sample repeatedly: size is per-kind, and one frozen instant can catch a
  // kind only in an attack/down pose whose trim says nothing about it.
  const bossItems: ArtItem[] = []
  for (let s = 0; s < 6; s += 1) {
    bossItems.push(...(await collect('game')))
    if (s < 5) await page.waitForTimeout(250)
  }
  expect(bossItems.length, 'no art on the boss screen').toBeGreaterThan(2)
  items.push(...bossItems)

  // The boss has to READ as a boss. Posed characters only - props carry their
  // own sizes and would make this ratio meaningless. Posed means a legacy
  // `entity:<kind>:<pose>` key or a motion frame id
  // (`entity:<kind>:motion:<clip>:<idx>`, five segments).
  const posed = (i: ArtItem): boolean => i.key.split(':').length === 3 || i.key.includes(':motion:')
  const bossChars = bossItems.filter(posed)
  expect(bossChars.length, 'no posed character art on the boss screen').toBeGreaterThan(2)
  // Character SIZE is a per-kind property, not a per-pose one: a lying-down
  // figure is legitimately short. Take each kind's tallest sampled figure
  // (its standing height) before comparing kinds.
  const kindHeights = (list: ArtItem[]): number[] => {
    const byKind = new Map<string, number>()
    for (const i of list) {
      const kind = i.key.split(':')[1] ?? i.key
      byKind.set(kind, Math.max(byKind.get(kind) ?? 0, i.figureHeight))
    }
    return [...byKind.values()]
  }
  const kindOf = (i: ArtItem): string => i.key.split(':')[1] ?? i.key
  const describe = bossChars.map((i) => `${i.key} figure ${i.figureWidth}x${i.figureHeight}px/box ${i.displayHeight}px`).join(', ')
  if (bossChars.some((i) => kindOf(i) === 'xuchu' && i.key.includes(':motion:'))) {
    // Motion path: every kind shares the figure height, so the boss (stage3:
    // xuchu, polled for above) must out-MASS the mooks around it. Compare
    // upright (walk/locomotion) frames only - attack trims measure weapon
    // reach, not bodies - by median figure area per kind, so a few wide
    // swing frames cannot fake or hide bulk. Heroes are excluded from the
    // mass comparison for the same weapon-reach reason (a hero spear trim
    // is wider than the boss), but the boss may not be drawn SHORT either:
    // its standing height must stay level with every fighter present.
    const HERO_KINDS = new Set(['guanyu', 'zhaoyun', 'zhangfei', 'weiyan', 'huangzhong'])
    const upright = bossChars.filter((i) => /:motion:(walk|locomotion):/.test(i.key))
    const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0
    const medianAreaByKind = new Map<string, number>()
    for (const kind of new Set(upright.map(kindOf))) {
      medianAreaByKind.set(kind, median(upright.filter((i) => kindOf(i) === kind).map((i) => i.figureWidth * i.figureHeight)))
    }
    const bossArea = medianAreaByKind.get('xuchu') ?? 0
    const mookAreas = [...medianAreaByKind].filter(([k]) => k !== 'xuchu' && !HERO_KINDS.has(k)).map(([, a]) => a)
    expect(bossArea, `no upright boss frame sampled (${describe})`).toBeGreaterThan(0)
    expect(mookAreas.length, `no upright mook frame sampled (${describe})`).toBeGreaterThan(0)
    const areaRatio = bossArea / Math.max(1, Math.max(...mookAreas))
    expect(
      Math.round(areaRatio * 100) / 100,
      `the motion boss is no bulkier than the mooks around it (${describe})`,
    ).toBeGreaterThanOrEqual(MIN_BOSS_AREA_RATIO)
    const bossHeight = Math.max(...bossChars.filter((i) => kindOf(i) === 'xuchu').map((i) => i.figureHeight))
    const tallestOther = Math.max(...kindHeights(bossChars.filter((i) => kindOf(i) !== 'xuchu')))
    expect(
      Math.round((bossHeight / Math.max(1, tallestOther)) * 100) / 100,
      `the motion boss is drawn short (${describe})`,
    ).toBeGreaterThanOrEqual(0.9)
  } else {
    // Legacy path: distinction is drawn height (boss 124 vs 92 units).
    const bossHeights = kindHeights(bossChars)
    const bossRatio = Math.max(...bossHeights) / Math.max(1, Math.min(...bossHeights))
    expect(
      Math.round(bossRatio * 100) / 100,
      `the boss is no bigger than the fighters around it (${describe})`,
    ).toBeGreaterThanOrEqual(MIN_BOSS_RATIO)
  }

  // A gate that found nothing to measure would pass in silence, which is the
  // failure this repo keeps rediscovering. Every screen above draws figures.
  expect(items.length, 'no character art found on any screen').toBeGreaterThan(8)

  const wrong = items.filter((i) => i.displayHeight < MIN_ART_H || i.displayHeight > MAX_ART_H)
  expect(
    wrong.map((i) => `${i.scene}/${i.key}: ${i.displayHeight}px`),
    `art outside ${MIN_ART_H}-${MAX_ART_H}px`,
  ).toEqual([])

  // Per SCREEN, not across all of them. Menus deliberately draw the cast
  // smaller than play does - the title line-up is 58px against 116 in a stage -
  // so a global comparison measures that intent rather than a defect.
  //
  // Props are legitimately much smaller than fighters too, so this looks only
  // at posed characters: legacy pose keys and motion frame ids alike.
  const characters = items.filter(posed)
  expect(characters.length, 'no posed character art found').toBeGreaterThan(4)
  const offenders: string[] = []
  for (const scene of [...new Set(characters.map((i) => i.scene))]) {
    const onScreen = characters.filter((i) => i.scene === scene)
    const heights = kindHeights(onScreen)
    const ratio = Math.max(...heights) / Math.max(1, Math.min(...heights))
    if (ratio > MAX_CHARACTER_RATIO) {
      offenders.push(
        `${scene}: tallest art is ${Math.round(ratio * 100) / 100}x the shortest (${onScreen
          .map((i) => `${i.key} ${i.figureHeight}`)
          .join(', ')})`,
      )
    }
  }
  expect(offenders, `character art on one screen differs by more than ${MAX_CHARACTER_RATIO}x`).toEqual([])
  expect(pageErrors).toEqual([])
})
