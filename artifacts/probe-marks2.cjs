const { chromium } = require('@playwright/test')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto('http://localhost:5199/?renderer=canvas&autopilot=1')
  await p.waitForTimeout(4000)
  await p.evaluate(() => window.__DW__?.startGame('zhaoyun', 42, 'stage1'))
  await p.waitForTimeout(1500)
  const probe = await p.evaluate(() => {
    const game = window.__DW_GAME__
    const scene = game?.scene.getScene('game')
    const layerKeys = {}
    for (const n of ['bgSky', 'bgHills', 'bgGround', 'bgMarks']) {
      const o = scene?.children.getByName(n)
      layerKeys[n] = o?.texture?.key
    }
    const marks = scene?.children.getByName('bgMarks')
    const uuidTex = marks?.texture
    return {
      layerKeys,
      uuidInfo: uuidTex
        ? { key: uuidTex.key, w: uuidTex.getSourceImage()?.width, h: uuidTex.getSourceImage()?.height }
        : null,
    }
  })
  console.log(JSON.stringify({ probe, errs }, null, 1))
  await b.close()
})()
