import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 412, height: 839 }, hasTouch: true, isMobile: true })
await page.goto('http://localhost:5176/?renderer=canvas&autopilot=1')
await page.waitForFunction(() => window.__DW__?.getSnapshot().scene === 'title', null, { timeout: 20000 })
await page.screenshot({ path: 'artifacts/look/art18-mobile-title.png' })
await page.keyboard.press('Enter')
await page.waitForFunction(() => window.__DW__?.getSnapshot().scene === 'select', null, { timeout: 15000 })
await page.screenshot({ path: 'artifacts/look/art18-mobile-select.png' })
for (const hero of ['weiyan', 'huangzhong']) {
  await page.evaluate((h) => window.__DW__?.startGame(h, 42), hero)
  await page.waitForFunction(() => window.__DW__?.getSnapshot().scene === 'game', null, { timeout: 15000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `artifacts/look/art18-mobile-${hero}.png` })
  await page.evaluate(() => window.__DW__?.toTitle?.() ?? window.__DW__?.startGame('zhaoyun', 42))
  await page.waitForTimeout(300)
}
await browser.close()
console.log('mobile shots done')
