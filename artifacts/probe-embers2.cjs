const { chromium } = require('@playwright/test')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  await p.goto('http://localhost:5199/?renderer=canvas&autopilot=1')
  await p.waitForTimeout(4000)
  await p.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await p.waitForTimeout(1200)
  const probe = await p.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('game')
    const direct = scene?.children.list.find((c) => c.name === 'bgEmbers') ?? null
    const byName = scene?.children.getByName?.('bgEmbers') ?? null
    return {
      directFound: direct !== null,
      byNameFound: byName !== null && byName !== undefined,
      byNameType: byName ? byName.type : String(byName),
      listNames: scene?.children.list.filter((c) => c.name).map((c) => c.name),
    }
  })
  console.log(JSON.stringify(probe, null, 1))
  await b.close()
})()
