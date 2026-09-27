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
    const embers = scene?.children.getByName('bgEmbers')
    const marks = scene?.children.getByName('bgMarks')
    return {
      embers: embers !== undefined,
      embersDepth: embers?.depth,
      marks: marks !== undefined,
      stageId: window.__DW__?.getSnapshot().sim?.stageId,
      sceneChildren: scene?.children.list.map((c) => c.name || c.type).join(','),
    }
  })
  console.log(JSON.stringify(probe, null, 1))
  await b.close()
})()
