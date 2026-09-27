const { chromium } = require('@playwright/test')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto('http://localhost:5199/?renderer=canvas&autopilot=1')
  await p.waitForTimeout(4000)
  const out = await p.evaluate(() => {
    window.__DW__?.startGame('zhaoyun', 42, 'stage1')
    return true
  })
  await p.waitForTimeout(1500)
  const probe = await p.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('game')
    const marks = scene?.children.getByName('bgMarks')
    return {
      exists: game?.textures.exists('bg-marks-stage1'),
      key: marks ? marks.texture.key : 'none',
      stageKeys: game?.textures.getTextureKeys?.()?.filter?.((k) => String(k).includes('bg-')),
    }
  })
  console.log(JSON.stringify({ probe, errs }, null, 1))
  await b.close()
})()
