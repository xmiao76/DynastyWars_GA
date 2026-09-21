import { expect, test } from '@playwright/test'

/**
 * UI OCCLUSION.
 *
 * Nothing in the visual gate can tell whether a label is readable or buried:
 * the frame metrics are averages over the whole screen, the sprite metrics
 * look at textures, and the renderer-parity check only asks whether the two
 * renderers agree - which they happily do when both draw the same plate on
 * top of the same label.
 *
 * Two real bugs came from exactly that. The menu panels were given a high
 * depth while their own contents sat at depth 0, so in WebGL every panel
 * covered the text and sprites it was meant to frame. And the game-over score
 * plate was written for a top-left origin but `add.rectangle` centres by
 * default, so it rendered half a width to the left and cut the FINAL SCORE
 * label in half.
 *
 * The rule below is deliberately narrow, to stay free of false positives: a
 * text is only flagged when something opaque that was added AFTER it, at the
 * same depth or higher, covers most of it. Anything drawn before a label is
 * its background and is fine; a translucent overlay is fine; a label drawn on
 * top of its own plate is fine.
 */

/** A text may be this covered by a later opaque object before it counts.
 * Text is readable or it is not - the bar is low on purpose. */
const MAX_COVERED_FRACTION = 0.15
/** Below this alpha an overlay is treated as a tint, not as an occluder. */
const OPAQUE_ALPHA = 0.7

interface Item {
  index: number
  type: string
  name: string
  depth: number
  alpha: number
  visible: boolean
  text: string | null
  bounds: { x: number; y: number; width: number; height: number } | null
}

async function readDisplayList(
  page: import('@playwright/test').Page,
  sceneKey: string,
): Promise<Item[]> {
  return page.evaluate((key) => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene(key)
    if (!scene) return []
    return scene.children.list.map((child, index) => {
      const c = child as unknown as {
        type: string
        name: string
        depth: number
        alpha: number
        visible: boolean
        text?: string
        getBounds?: () => { x: number; y: number; width: number; height: number }
        getData?: (key: string) => unknown
      }
      let bounds: { x: number; y: number; width: number; height: number } | null = null
      try {
        const b = c.getBounds?.()
        if (b && b.width > 0 && b.height > 0) bounds = { x: b.x, y: b.y, width: b.width, height: b.height }
      } catch {
        bounds = null
      }
      // A Graphics reports NO bounds - it does not track what was drawn into
      // it - and every plate and every bar in this HUD is a Graphics. That made
      // this gate structurally blind to most of the HUD: it could only ever see
      // Text and Images. `drawSlab` and `makeBar` have recorded their geometry
      // as data all along, so read that instead of giving up.
      if (!bounds) {
        const rect = (c.getData?.('panelRect') ?? c.getData?.('bar')) as
          | { x: number; y: number; w: number; h: number }
          | undefined
        if (rect && rect.w > 0 && rect.h > 0) {
          bounds = { x: rect.x, y: rect.y, width: rect.w, height: rect.h }
        }
      }
      return {
        index,
        type: c.type,
        name: c.name ?? '',
        depth: c.depth,
        alpha: c.alpha,
        visible: c.visible !== false,
        text: typeof c.text === 'string' ? c.text : null,
        bounds,
      }
    })
  }, sceneKey)
}

/** Everything the HUD proper draws - plates, bars and labels - sits at 10_000+. */
const HUD_DEPTH_FLOOR = 10_000

/** Do two boxes share any area at all? */
function overlaps(a: NonNullable<Item['bounds']>, b: NonNullable<Item['bounds']>): boolean {
  return (
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
  )
}

/** Fraction of `a` that `b` covers. */
function coveredFraction(a: NonNullable<Item['bounds']>, b: NonNullable<Item['bounds']>): number {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  const area = a.width * a.height
  return area === 0 ? 0 : (x * y) / area
}

function findOcclusions(items: Item[]): string[] {
  const problems: string[] = []
  // Hidden objects are not part of the picture: the continue overlay lives in
  // the scene from the start with visible=false, and "buried" is meaningless
  // for something nobody can see.
  const visible = items.filter((i) => i.visible && i.alpha > 0)
  const texts = visible.filter((i) => i.type === 'Text' && i.bounds !== null && (i.text ?? '') !== '')
  for (const t of texts) {
    if (!t.bounds) continue
    for (const other of visible) {
      if (other.index <= t.index) continue // drawn before the text: it is a background
      if (other.type === 'Text' || !other.bounds) continue
      if (other.alpha < OPAQUE_ALPHA) continue // a tint, not an occluder
      if (other.depth < t.depth) continue // genuinely behind it
      const covered = coveredFraction(t.bounds, other.bounds)
      if (covered > MAX_COVERED_FRACTION) {
        problems.push(
          `"${t.text}" is ${Math.round(covered * 100)}% covered by a ${other.type} added after it ` +
            `(text depth ${t.depth} index ${t.index}, ${other.type} depth ${other.depth} index ${other.index})`,
        )
        break
      }
    }
  }
  return problems
}

test('no label is buried behind something drawn over it', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')

  const problems: string[] = []
  /**
   * `minLabels` is what stops this gate going quiet. It only ever inspects
   * Text, so pointing it at a scene that holds none - which is exactly what
   * happened to `game` when the HUD moved out into its own scene - makes it
   * iterate nothing and pass. Every caller states how many labels it expects
   * to find, so looking in the wrong place fails loudly instead.
   */
  const check = async (sceneKey: string, minLabels: number): Promise<void> => {
    // Let the scene finish building before reading its display list. A scene
    // that is still adding children reports a partial list, and under parallel
    // workers that showed up as an occasional spurious failure.
    await page.waitForTimeout(250)
    const items = await readDisplayList(page, sceneKey)
    expect(items.length, `${sceneKey} has no display list`).toBeGreaterThan(0)
    const labels = items.filter((i) => i.type === 'Text' && (i.text ?? '').trim() !== '').length
    expect(labels, `${sceneKey} has ${labels} labels, expected at least ${minLabels}`).toBeGreaterThanOrEqual(
      minLabels,
    )
    for (const p of findOcclusions(items)) problems.push(`${sceneKey}: ${p}`)
  }

  await check('title', 4)

  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('select')
  await check('select', 4)

  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  // `game` is world only now - sprites and backgrounds, no labels at all.
  await check('game', 0)
  await check('hud', 5)

  await page.evaluate(() => window.__DW__?.forceResult())
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('result')
  await check('result', 4)

  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.evaluate(() => window.__DW__?.forceGameOver())
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('gameover')
  await check('gameover', 3)

  expect(problems, 'UI elements are hidden behind other UI').toEqual([])
  expect(pageErrors).toEqual([])
})

/**
 * A label placed inside a panel has to fit inside it. The mounted-play HUD had
 * "Horse: 20/20" running from x=120 to x=166 inside a panel that ends at 156,
 * so the horse's health spilled out over the battlefield. The occlusion check
 * above cannot see this - nothing covers the text, it simply overflows its
 * frame - and no pixel metric can either.
 */
test('labels fit inside the panel they sit in', async ({ page }) => {
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  // Stage 2 so the horse chip is present; mount to populate it.
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.evaluate(() => {
    const neutral = {
      up: false, down: false, left: false, right: false,
      attackPressed: false, jumpPressed: false, specialPressed: false,
    }
    window.__DW__?.run(Array.from({ length: 140 }, () => ({ ...neutral, right: true })))
  })
  await expect
    .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.player.mounted), { timeout: 10_000 })
    .toBe(true)
  await page.waitForTimeout(250)

  const overflows = await page.evaluate(() => {
    const scene = window.__DW_GAME__?.scene.getScene('hud')
    if (!scene) return ['no scene']
    const panels = scene.children.list
      .map((c) => (c as unknown as { getData: (k: string) => unknown }).getData?.('panelRect'))
      .filter((r): r is { x: number; y: number; w: number; h: number } => !!r)
    const bad: string[] = []
    for (const child of scene.children.list) {
      const c = child as unknown as {
        type: string
        text?: string
        visible: boolean
        getBounds?: () => { x: number; y: number; width: number; height: number }
      }
      if (c.type !== 'Text' || !c.visible || !(c.text ?? '')) continue
      const b = c.getBounds?.()
      if (!b) continue
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      for (const p of panels) {
        // Only panels this label actually sits in.
        if (cx < p.x || cx > p.x + p.w || cy < p.y || cy > p.y + p.h) continue
        // Both axes: the shipped bug overflowed horizontally, but a label
        // pushed past a panel's top or bottom edge is the same defect.
        if (b.x < p.x - 1 || b.x + b.width > p.x + p.w + 1) {
          bad.push(
            `"${c.text}" spans x ${Math.round(b.x)}..${Math.round(b.x + b.width)} ` +
              `but its panel is x ${p.x}..${p.x + p.w}`,
          )
        } else if (b.y < p.y - 1 || b.y + b.height > p.y + p.h + 1) {
          bad.push(
            `"${c.text}" spans y ${Math.round(b.y)}..${Math.round(b.y + b.height)} ` +
              `but its panel is y ${p.y}..${p.y + p.h}`,
          )
        }
      }
    }
    return bad
  })
  expect(overflows, 'a label overflows the panel it sits in').toEqual([])
})

/**
 * The stage banner is drawn BEHIND the HUD.
 *
 * It used to sit at depth 11_000, the only object in the game above the HUD's
 * 10_000..10_002 band, and for the ~1.9s it holds it covered 29% of player
 * two's HP bar at the start of every co-op stage and 64% of the CONTINUE?
 * label whenever a death landed inside that window. In `artifacts/look/coop.png`
 * P2's plate reads as truncated rather than as something with a banner in
 * front of it.
 *
 * Deliberately NOT written as "the banner must not overlap the HUD". It
 * legitimately overlaps the P1 plate's bottom edge by about 7px, and a gate
 * demanding zero overlap would fail correct art. The property that matters is
 * layering, so that is what this asserts - with a guard that the overlap is
 * still REAL, because a depth assertion about two rectangles that no longer
 * meet would be true and worthless.
 *
 * Sampled in CO-OP, inside the banner's window: the case nothing ever looked at.
 */
test('the stage banner is drawn behind the HUD, not over it', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage2'))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.evaluate(() => window.__DW__?.joinP2())
  // The banner holds for roughly 1.9s from stage entry; read well inside that.
  await page.waitForTimeout(600)

  const items = await readDisplayList(page, 'hud')
  const banner = items.find((i) => i.name === 'stageBanner')
  expect(banner, 'no stage banner was up to inspect - this gate saw nothing').toBeTruthy()
  expect(banner?.bounds, 'the stage banner reports no bounds').toBeTruthy()

  // The HUD proper: plates, bars and labels, all of which sit at 10_000+.
  const hud = items.filter((i) => i.depth >= HUD_DEPTH_FLOOR && i.bounds !== null)
  expect(hud.length, 'no HUD objects found, so there is nothing to sit behind').toBeGreaterThan(5)

  // Non-vacuity: the banner must still actually MEET the HUD, or the depth
  // assertion below is about two rectangles that never touch.
  const overlapping = hud.filter((i) => i.bounds && banner?.bounds && overlaps(i.bounds, banner.bounds))
  expect(
    overlapping.length,
    'the banner no longer overlaps the HUD at all - this gate has stopped testing anything',
  ).toBeGreaterThan(0)

  const inFront = overlapping.filter((i) => (banner?.depth ?? 0) >= i.depth)
  expect(
    inFront.map((i) => `${i.type}${i.text ? ` "${i.text}"` : ''} at depth ${i.depth}`),
    `the stage banner (depth ${banner?.depth}) is drawn over part of the HUD`,
  ).toEqual([])
  expect(pageErrors).toEqual([])
})
