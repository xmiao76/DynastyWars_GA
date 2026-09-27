// ENH-6 one-off evidence: capture each hero's full combo (three strikes)
// in-situ at gameplay size, desktop + phone. The e2e per-hero test is the
// committed gate; this script only produces review PNGs.
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const out = join(root, 'artifacts', 'weapon-review')
mkdirSync(out, { recursive: true })
const tag = 'enh6combo'
const EXPECTED = {
  guanyu: ['sweep', 'attack', 'chop'],
  zhangfei: ['thrust', 'attack2', 'sweep'],
  zhaoyun: ['attack', 'attack2', 'thrust'],
  huangzhong: ['thrust', 'chop', 'sweep'],
  weiyan: ['attack', 'sweep', 'chop'],
}
const server = await createServer({ root, server: { port: 5177, strictPort: true } })
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch()
  for (const device of [
    { name: 'desktop', viewport: { width: 1280, height: 720 } },
    { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  ]) {
    const page = await browser.newPage({ viewport: device.viewport, isMobile: device.isMobile, hasTouch: device.hasTouch })
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('http://localhost:5177/?renderer=canvas&autopilot=1', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.__DW__?.getSnapshot().scene === 'title')
    for (const [hero, triple] of Object.entries(EXPECTED)) {
      await page.evaluate((id) => window.__DW__?.startGame(id, 42), hero)
      await page.waitForFunction((id) => { const s = window.__DW__?.getSnapshot(); return s?.scene === 'game' && s?.sim?.charId === id && s?.sim?.tick === 0 }, hero)
      const press = { up: false, down: false, left: false, right: false, attackPressed: true, jumpPressed: false, specialPressed: false }
      const captured = new Set()
      for (let i = 0; i < 400 && captured.size < 3; i += 1) {
        const before = await page.evaluate(() => window.__DW__?.getSnapshot()?.tick ?? -1)
        await page.evaluate((input) => window.__DW__?.run([input]), press)
        await page.waitForFunction((t) => (window.__DW__?.getSnapshot()?.tick ?? -1) > t, before)
        const snap = await page.evaluate(() => window.__DW__?.getSnapshot())
        if (!snap?.sim || snap.sim.player.hp <= 0) break
        const keys = await page.evaluate((h) => {
          const game = window.__DW_GAME__
          const scene = game?.scene.getScene('game')
          if (!scene) return []
          return scene.children.list.filter((c) => c.type === 'Sprite').map((c) => c.texture.key).filter((k) => k.startsWith('entity:' + h + ':'))
        }, hero)
        for (const pose of triple) {
          const key = 'entity:' + hero + ':' + pose
          if (!captured.has(pose) && keys.includes(key)) {
            await page.screenshot({ path: join(out, device.name + '-' + hero + '-combo-' + pose + '-' + tag + '.png') })
            captured.add(pose)
            console.log(device.name, hero, pose, 'captured at tick', snap.tick)
          }
        }
      }
      if (captured.size < 3) console.log('WARN', device.name, hero, 'only', [...captured].join(','))
    }
    await page.close()
  }
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))
  console.log('ENH-6 combo evidence written to', out)
} finally {
  if (browser) await browser.close()
  await server.close()
}
