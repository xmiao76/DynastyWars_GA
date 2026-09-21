import { test } from '@playwright/test'
import { decideBotScript } from '../selfplay/bot'

/**
 * Visual-evaluation probe (the "actually look at the render" tool the owner
 * asked for): self-plays with the bot, then snapshots the Phaser renderer and
 * classifies regions. Prints a region map + richness so a human or model can
 * judge whether the scene reads as a modern 2D game.
 */
test('probe game scene pixels', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 960, height: 560 })
  await page.goto('/?renderer=canvas&autopilot=1&v=' + Date.now(), { waitUntil: 'networkidle' })
  await page.evaluate(() => window.__DW__?.startGame('zhaoyun', 42))
  await page.waitForTimeout(400)
  for (let i = 0; i < 6; i += 1) {
    const sn = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!sn?.sim) break
    const script = decideBotScript(sn)
    const tb: number = sn.tick
    await page.evaluate((inputs) => window.__DW__?.run(inputs), script)
    await page.waitForFunction(
      (t) => t !== undefined && (window.__DW__?.getSnapshot()?.tick ?? -1) >= t,
      tb + script.length,
    )
  }
  await page.waitForTimeout(300)
  const probe = await page.evaluate(async () => {
    const game = (window as unknown as {
      __DW_GAME__?: { renderer?: { snapshot: (cb: (img: HTMLImageElement) => void) => void } }
    }).__DW_GAME__
    if (!game?.renderer?.snapshot) return null
    const img = await new Promise<HTMLImageElement>((resolve) => game.renderer?.snapshot?.(resolve))
    const cv = document.createElement('canvas')
    cv.width = img.width
    cv.height = img.height
    const ctx = cv.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    const w = img.width
    const h = img.height
    const d = ctx.getImageData(0, 0, w, h).data
    const regions: string[] = []
    for (let gy = 0; gy < 8; gy += 1) {
      let row = ''
      for (let gx = 0; gx < 12; gx += 1) {
        const x = Math.floor(((gx + 0.5) * w) / 12)
        const y = Math.floor(((gy + 0.5) * h) / 8)
        const i = (y * w + x) * 4
        const r: number = d[i] ?? 0
        const g: number = d[i + 1] ?? 0
        const b: number = d[i + 2] ?? 0
        if (r + g + b < 120) row += '.'
        else if (r > 200 && g > 200 && b > 200) row += 'W'
        else if (r + b < 1.5 * g) row += 'G'
        else if (r > g && r > b) row += 'R'
        else row += 'C'
      }
      regions.push(row)
    }
    let nonFlat = 0
    const total = Math.floor(d.length / 200)
    for (let i = 0; i < d.length; i += 200) {
      const r: number = d[i] ?? 0
      const g: number = d[i + 1] ?? 0
      const b: number = d[i + 2] ?? 0
      if (Math.abs(r - g) > 25 || Math.abs(g - b) > 25 || Math.abs(r - b) > 25) nonFlat += 1
    }
    return {
      w,
      h,
      regions,
      saturatedFraction: Number((nonFlat / total).toFixed(3)),
    }
  })
  console.log('GAME PROBE:', JSON.stringify(probe))
})
