const { chromium } = require('@playwright/test')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  const t0 = Date.now()
  await p.goto('http://localhost:5199/?renderer=canvas&autopilot=1')
  await p.waitForFunction(() => window.__DW__?.getSnapshot()?.scene === 'title', null, { timeout: 30000 })
  const bootMs = Date.now() - t0
  await p.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await p.waitForFunction(() => window.__DW__?.getSnapshot()?.scene === 'game', null, { timeout: 15000 })
  await p.waitForTimeout(800)
  await p.evaluate(() => window.__DW__?.registerAllArt())
  await p.waitForTimeout(500)
  const mem = await p.evaluate(() => {
    const game = window.__DW_GAME__
    const keys = game.textures.getTextureKeys()
    let bytes = 0
    let n = 0
    const big = []
    for (const k of keys) {
      const t = game.textures.get(k)
      const src = t.getSourceImage()
      const w = src?.width ?? 0
      const h = src?.height ?? 0
      if (!w || !h) continue
      n += 1
      const b = w * h * 4
      bytes += b
      if (b > 500000) big.push([k, Math.round(b / 1024)])
    }
    return { textures: n, kb: Math.round(bytes / 1024), big }
  })
  console.log(JSON.stringify({ bootMs, ...mem }, null, 1))
  await b.close()
})()
