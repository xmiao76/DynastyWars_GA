import { expect, test } from '@playwright/test'

/**
 * Every parallax layer must actually be SEEN.
 *
 * Written after `bgHills` spent an unknown number of releases drawing nothing:
 * it sat at y=224 with a 100px texture whose silhouette starts at row 66, so on
 * a 270px screen only the texture's empty top rows were ever in frame. No
 * visual metric catches that - a missing background layer does not make a frame
 * dark, flat or empty, so coverage, colour richness and region fill all stay
 * green, and renderer parity is happy because both renderers omit it equally.
 *
 * It has since been wrong twice more, in ways the first version could not see:
 *
 *  - It compared a DEVICE-pixel row count against a LOGICAL one. Textures are
 *    rasterized at RENDER_SCALE, so `min(src.height, lastRow)` scanned only the
 *    top half of every texture. A ridge occupying the lower half was invisible
 *    to the check whether or not it was invisible to the player.
 *  - It asked only whether pixels were inside the CAMERA, never whether
 *    anything was drawn in front of them. A ridge sitting almost entirely
 *    behind the ground strip is inside the camera and passes - which is exactly
 *    what happened when the ridge was first redrawn, leaving a 30px sliver on
 *    screen while this gate stayed green.
 *
 * So it now works in texture space and clips each layer against the nearest
 * layer drawn in front of it. What it does NOT do is judge how prominent a
 * layer is. A first attempt asked for a fraction of each layer's own content to
 * survive, which sounds stricter and is simply wrong: the sky is deliberately
 * mostly hidden behind the hills and the ground, and measured 16% - it would
 * have failed for working exactly as intended. "Barely visible" is an
 * aesthetic judgement that belongs to looking at the screen, which is how the
 * one real instance of it was actually found. "Not visible at all" is what a
 * gate can answer.
 */

const LAYERS = ['bgSky', 'bgHills', 'bgGround']

/**
 * Opaque texture pixels a layer must put on screen, after the camera and after
 * anything drawn in front of it.
 *
 * MEASURED on the shipping backdrop: sky 35040, hills 7227, ground 55200. A
 * layer that is entirely off camera or entirely behind another scores 0, so the
 * floor only has to sit clear of zero; at 1000 the thinnest of the three still
 * has seven times the margin. Raised from 50 only because 50 was low enough to
 * be cleared by a stray anti-aliased edge.
 */
const MIN_VISIBLE_PIXELS = 1000

interface LayerReport {
  name: string
  missing: boolean
  visible: number
  total: number
  fraction: number
  y: number
  depth: number
  clippedAt: number
}

test('every background layer puts visible pixels on screen', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
  await page.waitForTimeout(300)

  const report = await page.evaluate((layerNames): LayerReport[] | null => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('game')
    if (!game || !scene) return null
    // Layers are positioned in WORLD units while the canvas is RENDER_SCALE
    // times larger and the camera is zoomed to match, so the viewport in world
    // units is the canvas divided by the zoom.
    const zoom = scene.cameras.main.zoom
    const screenH = Number(game.config.height) / zoom
    const screenW = Number(game.config.width) / zoom

    interface Layer {
      name: string
      x: number
      y: number
      width: number
      height: number
      depth: number
      texture?: { key: string }
    }
    const found = layerNames.map(
      (name) => [name, scene.children.getByName(name) as unknown as Layer | null] as const,
    )

    return found.map(([name, obj]) => {
      const empty = { name, missing: true, visible: 0, total: 0, fraction: 0, y: 0, depth: 0, clippedAt: 0 }
      if (!obj) return empty
      const key = obj.texture?.key
      if (!key || !game.textures.exists(key)) return empty

      // Clip against the TOP of the nearest layer drawn in front of this one.
      // Background layers stack downward and are full width, so everything
      // below that line is covered. No `other.y > obj.y` guard: a nearer layer
      // whose top is ABOVE this one covers it completely, and that case - the
      // whole point of clipping at all - is the one such a guard would skip.
      let clippedAt = screenH
      for (const [, other] of found) {
        if (!other || other === obj) continue
        if (other.depth > obj.depth && other.y < clippedAt) clippedAt = other.y
      }
      const topWorld = Math.max(obj.y, 0)
      const bottomWorld = Math.min(obj.y + obj.height, clippedAt, screenH)

      const src = game.textures.get(key).getSourceImage() as CanvasImageSource & {
        width: number
        height: number
      }
      const cv = document.createElement('canvas')
      cv.width = src.width
      cv.height = src.height
      const ctx = cv.getContext('2d')
      if (!ctx) return empty
      ctx.drawImage(src, 0, 0)
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data

      // Texture rows per world unit. Without this the check scans device rows
      // using logical indices and silently reads the wrong part of the texture.
      const rowsPerUnit = src.height / Math.max(1, obj.height)
      const firstRow = Math.max(0, Math.round((topWorld - obj.y) * rowsPerUnit))
      const lastRow = Math.min(src.height, Math.round((bottomWorld - obj.y) * rowsPerUnit))
      const colEnd = Math.min(src.width, Math.round(screenW * rowsPerUnit))

      let visible = 0
      let total = 0
      for (let y = 0; y < src.height; y += 1) {
        for (let x = 0; x < src.width; x += 1) {
          if ((d[(y * src.width + x) * 4 + 3] ?? 0) <= 128) continue
          total += 1
          if (y >= firstRow && y < lastRow && x < colEnd) visible += 1
        }
      }
      return {
        name,
        missing: false,
        visible,
        total,
        fraction: total === 0 ? 0 : visible / total,
        y: obj.y,
        depth: obj.depth,
        clippedAt,
      }
    })
  }, LAYERS)

  expect(report, 'could not read the game scene').not.toBeNull()
  const rows = report ?? []
  expect(rows.length, 'no layers inspected').toBe(LAYERS.length)
  console.log(
    'BACKGROUND:',
    rows.map((r) => `${r.name} ${Math.round(r.fraction * 100)}% (${r.visible}/${r.total})`).join(', '),
  )

  const problems = rows
    .filter((r) => r.missing || r.visible < MIN_VISIBLE_PIXELS)
    .map((r) =>
      r.missing
        ? `${r.name}: layer is missing from the scene`
        : `${r.name}: only ${r.visible} of its ${r.total} drawn pixels survive the camera and ` +
          `whatever is in front of it (y=${r.y}, depth=${r.depth}, clipped at ${r.clippedAt})`,
    )
  expect(problems, 'a background layer is drawing where nobody can see it').toEqual([])
  expect(pageErrors).toEqual([])
})
