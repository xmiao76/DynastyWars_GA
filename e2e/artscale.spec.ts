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
 * `GameScene.fitSprite` gives a boss 124 on-screen units against 92 for
 * everyone else, and the measured ratio is 1.34 on every one of the nine
 * stages. The floor sits where "visibly larger" stops being true rather than
 * just under that population, so shaving the difference down fails here before
 * anyone has to notice it in play.
 */
const MIN_BOSS_RATIO = 1.2

interface ArtItem {
  scene: string
  key: string
  displayHeight: number
}

test('no character art is drawn at the wrong size', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  const collect = (sceneKey: string): Promise<ArtItem[]> =>
    page.evaluate((key) => {
      const scene = window.__DW_GAME__?.scene.getScene(key)
      if (!scene) return []
      return scene.children.list
        .filter((c) => c.type === 'Sprite' || c.type === 'Image')
        .map((c) => c as unknown as { texture?: { key: string }; displayHeight: number })
        .filter((c) => (c.texture?.key ?? '').startsWith('entity:'))
        .map((c) => ({ scene: key, key: c.texture?.key ?? '', displayHeight: Math.round(c.displayHeight) }))
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
  await page.waitForTimeout(400)
  const bossItems = await collect('game')
  expect(bossItems.length, 'no art on the boss screen').toBeGreaterThan(2)
  items.push(...bossItems)

  // The boss has to READ as a boss. Posed characters only - props carry their
  // own sizes and would make this ratio meaningless.
  const bossChars = bossItems.filter((i) => i.key.split(':').length === 3)
  expect(bossChars.length, 'no posed character art on the boss screen').toBeGreaterThan(2)
  const bossHeights = bossChars.map((i) => i.displayHeight)
  const bossRatio = Math.max(...bossHeights) / Math.max(1, Math.min(...bossHeights))
  expect(
    Math.round(bossRatio * 100) / 100,
    `the boss is no bigger than the fighters around it (${bossChars
      .map((i) => `${i.key} ${i.displayHeight}px`)
      .join(', ')})`,
  ).toBeGreaterThanOrEqual(MIN_BOSS_RATIO)

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
  // at posed characters: keys with a pose segment.
  const characters = items.filter((i) => i.key.split(':').length === 3)
  expect(characters.length, 'no posed character art found').toBeGreaterThan(4)
  const offenders: string[] = []
  for (const scene of [...new Set(characters.map((i) => i.scene))]) {
    const onScreen = characters.filter((i) => i.scene === scene)
    const heights = onScreen.map((i) => i.displayHeight)
    const ratio = Math.max(...heights) / Math.max(1, Math.min(...heights))
    if (ratio > MAX_CHARACTER_RATIO) {
      offenders.push(
        `${scene}: tallest art is ${Math.round(ratio * 100) / 100}x the shortest (${onScreen
          .map((i) => `${i.key} ${i.displayHeight}`)
          .join(', ')})`,
      )
    }
  }
  expect(offenders, `character art on one screen differs by more than ${MAX_CHARACTER_RATIO}x`).toEqual([])
  expect(pageErrors).toEqual([])
})
