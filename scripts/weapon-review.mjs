/**
 * Live weapon evidence, including deterministic attacks and phone screenshots.
 * node scripts/weapon-review.mjs after --quick
 * node scripts/weapon-review.mjs before --baseline
 * The baseline is a git archive exported to artifacts/weapon-review/baseline.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'
import { createCanvas, loadImage } from '@napi-rs/canvas'
/* global window, document */

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const tag = process.argv[2] ?? 'after'
if (!/^[a-z0-9-]+$/.test(tag)) throw new Error('Use a simple evidence tag')
const out = join(root, 'artifacts/weapon-review')
mkdirSync(out, { recursive: true })
const reviewRoot = process.argv.includes('--baseline') ? join(out, 'baseline') : root
const heroes = [
  ['guanyu', 'Guan Yu / 关羽'], ['zhangfei', 'Zhang Fei / 张飞'],
  ['zhaoyun', 'Zhao Yun / 赵云'], ['huangzhong', 'Huang Zhong / 黄忠'],
  ['weiyan', 'Wei Yan / 魏延'],
]
const phases = ['windup', 'strike', 'recover']
const server = await createServer({ root: reviewRoot, server: { port: 5177, strictPort: true } })
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1500, height: 1080 } })
  page.on('pageerror', err => errors.push(err.message))
  await page.goto('http://localhost:5177/?autopilot=1', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__DW__?.getSnapshot().scene === 'title')

  // Measure uncropped figures, rather than trusting already allocated textures.
  const geometry = await page.evaluate(async () => {
    const { drawFigure, headRadius, paintCel } = await import('/src/game/art/draw.ts')
    const { VECTOR_ART } = await import('/src/game/art/registry.ts')
    const { POSE_TABLE } = await import('/src/game/art/poses.ts')
    const { FIG_W, FIG_H, applyBuild } = await import('/src/game/art/rig.ts')
    const { materials } = await import('/src/game/art/palette.ts')
    let addWeapon, weaponPose
    try { ({ addWeapon, weaponPose } = await import('/src/game/art/weapons.ts')) } catch { /* pre-extraction baseline */ }
    const canvas = document.createElement('canvas')
    canvas.width = 800; canvas.height = 680
    const c = canvas.getContext('2d')
    const reaches = {}, faces = []
    let headroom = 0, highest = ''
    for (const [kind, entry] of Object.entries(VECTOR_ART)) {
      if (entry.type !== 'figure') continue
      for (const [poseName, pose] of Object.entries(POSE_TABLE)) {
        c.resetTransform(); c.clearRect(0, 0, 800, 680)
        c.scale(2, 2); c.translate(100, 100)
        drawFigure(c, entry.plan, pose)
        const pixels = c.getImageData(0, 0, 800, 680).data
        let x0 = 800, x1 = -1, y0 = 680
        for (let y = 0; y < 680; y++) for (let x = 0; x < 800; x++) {
          if (pixels[(y * 800 + x) * 4 + 3] < 128) continue
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y)
        }
        const extra = Math.ceil(Math.max(0, -(x0 / 2 - 100), x1 / 2 - 100 - FIG_W))
        reaches[poseName] = Math.max(reaches[poseName] ?? 0, extra)
        const top = Math.ceil(Math.max(0, 100 - y0 / 2))
        if (top > headroom) { headroom = top; highest = kind + ':' + poseName }
        if (addWeapon) {
          c.resetTransform(); c.clearRect(0, 0, 800, 680)
          c.scale(2, 2); c.translate(100, 100)
          const posed = weaponPose(entry.plan, applyBuild(pose, entry.plan.build))
          const shapes = []
          const m = materials(entry.plan.body, entry.plan.trim, entry.plan.gear)
          addWeapon((trace, fill, outline) => shapes.push({ trace, fill, outline }), entry.plan, posed, m)
          paintCel(c, shapes, FIG_W, FIG_H)
          const weapon = c.getImageData(0, 0, 800, 680).data
          const r = headRadius(entry.plan)
          let hits = 0
          for (let y = Math.floor(posed.head.y - r); y <= posed.head.y + r; y += 0.5) {
            for (let x = Math.floor(posed.head.x - r); x <= posed.head.x + r; x += 0.5) {
              // The visible face, inside the head silhouette/helmet rim.
              if (((x - posed.head.x) / (r * 0.8)) ** 2 + ((y - posed.head.y) / (r * 0.85)) ** 2 > 1) continue
              const i = (Math.round((y + 100) * 2) * 800 + Math.round((x + 100) * 2)) * 4
              if (weapon[i + 3] > 127) hits++
            }
          }
          if (hits) faces.push({ kind, pose: poseName, pixels: hits })
        }
      }
    }
    return { reaches, headroom, highest, faceClearanceMeasured: Boolean(addWeapon), faceOverlaps: faces }
  })
  writeFileSync(join(out, 'geometry-' + tag + '.json'), JSON.stringify(geometry, null, 2))
  console.log('Geometry:', JSON.stringify(geometry))

  const textures = await page.evaluate(({ heroes }) => {
    const manager = window.__DW_GAME__.textures
    return heroes.map(([kind, label]) => ({
      kind, label,
      images: Object.fromEntries(manager.getTextureKeys()
        .filter(k => k.startsWith('entity:' + kind + ':'))
        .map(k => [k.split(':')[2], manager.get(k).getSourceImage().toDataURL('image/png')])),
    }))
  }, { heroes })

  async function sheet(poses, facing, filename, sweep = false) {
    await page.evaluate(({ textures, poses, facing, tag, sweep }) => {
      document.body.replaceChildren()
      document.body.style.cssText = 'margin:0;background:#eceff3;color:#152435;overflow:auto;font-family:Arial,sans-serif;display:block;width:' + (sweep ? 2640 : 1500) + 'px;height:auto'
      const title = document.createElement('h1')
      title.textContent = 'Live weapon textures — ' + tag + ' — ' + facing
      title.style.cssText = 'font-size:26px;margin:20px 24px 12px'
      document.body.append(title)
      const grid = document.createElement('div')
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + (sweep ? poses.length : 5) + ',1fr);gap:8px;padding:0 16px 16px'
      const cards = sweep
        ? textures.flatMap(t => poses.map(pose => ({ ...t, pose })))
        : poses.flatMap(pose => textures.map(t => ({ ...t, pose })))
      for (const card of cards) {
        const cell = document.createElement('div')
        cell.style.cssText = 'height:' + (sweep ? 170 : 318) + 'px;background:#fff;border:1px solid #c4cbd2;border-radius:6px;text-align:center;overflow:hidden'
        const label = document.createElement('div')
        label.style.cssText = 'padding:8px;font-size:' + (sweep ? 12 : 17) + 'px;font-weight:bold'
        label.textContent = card.label + ' — ' + card.pose
        cell.append(label)
        const img = document.createElement('img')
        img.src = card.images[card.pose]
        // Sweep height is constant across every pose, just as in the game.
        img.style.cssText = 'display:block;margin:auto;' + (sweep
          ? 'height:124px;max-width:100%;object-fit:contain'
          : 'width:280px;height:272px;object-fit:contain') + (facing === 'left' ? ';transform:scaleX(-1)' : '')
        cell.append(img); grid.append(cell)
      }
      document.body.append(grid)
    }, { textures, poses, facing, tag, sweep })
    await page.setViewportSize({ width: sweep ? 2640 : 1500, height: sweep ? 980 : 1080 })
    await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())))
    await page.screenshot({ path: join(out, filename), fullPage: true })
  }
  await sheet(['idle', 'attack', 'attack2'], 'right', 'weapon-shapes-' + tag + '.png')
  for (const facing of ['right', 'left']) {
    await sheet(['idle', 'walk0', 'walk1', 'windup', 'attack', 'attack2', 'thrust', 'chop', 'sweep', 'recover', 'jump', 'hurt', 'down', 'special'], facing, 'pose-sweep-' + facing + '-' + tag + '.png', true)
  }
  await page.close()

  if (!process.argv.includes('--quick')) {
    for (const device of [
      { name: 'desktop', viewport: { width: 1280, height: 720 } },
      { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    ]) {
      const game = await browser.newPage({ viewport: device.viewport, isMobile: device.isMobile, hasTouch: device.hasTouch })
      game.on('pageerror', err => errors.push(err.message))
      await game.goto('http://localhost:5177/?autopilot=1', { waitUntil: 'networkidle' })
      await game.waitForFunction(() => window.__DW__?.getSnapshot().scene === 'title')
      await game.screenshot({ path: join(out, device.name + '-title-' + tag + '.png') })
      async function advance(n, action = {}) {
        const target = await game.evaluate(({ n, action }) => {
          const bridge = window.__DW__
          const neutral = { up:false, down:false, left:false, right:false, attackPressed:false, jumpPressed:false, specialPressed:false }
          const target = bridge.getSnapshot().tick + n
          bridge.run(Array.from({ length:n }, () => ({ ...neutral, ...action })))
          return target
        }, { n, action })
        await game.waitForFunction(target => window.__DW__.getSnapshot().tick >= target, target)
      }
      for (const [kind] of heroes) for (const facing of ['right', 'left']) {
        await game.evaluate(kind => window.__DW__.startGame(kind, 42), kind)
        await game.waitForFunction(kind => {
          const sim = window.__DW__?.getSnapshot().sim
          return sim?.charId === kind && sim.tick === 0 && window.__DW__.getSnapshot().scene === 'game'
        }, kind)
        await advance(1, { [facing]: true })
        await advance(1)
        await game.screenshot({ path: join(out, device.name + '-' + kind + '-' + facing + '-idle-' + tag + '.png') })
        await advance(1, { attackPressed: true })
        await game.screenshot({ path: join(out, device.name + '-' + kind + '-' + facing + '-windup-' + tag + '.png') })
        const frame = await game.evaluate(async () => {
          const { attackById } = await import('/src/core/attacks.ts')
          const scene = window.__DW_GAME__.scene.getScene('game')
          const player = scene.sim.entities.find(e => e.id === scene.sim.playerId)
          return attackById(player.attackId)
        })
        await advance(frame.startup)
        await game.screenshot({ path: join(out, device.name + '-' + kind + '-' + facing + '-strike-' + tag + '.png') })
        await advance(frame.active)
        await game.screenshot({ path: join(out, device.name + '-' + kind + '-' + facing + '-recover-' + tag + '.png') })
        console.log(device.name, kind, facing, 'captured')
      }
      await game.close()
      // A compact sequence sheet links to the full-size frames beside it.
      for (const facing of ['right', 'left']) {
        const w = device.name === 'desktop' ? 400 : 180
        const h = Math.round(w * device.viewport.height / device.viewport.width)
        const canvas = createCanvas(w * 3, heroes.length * (h + 26))
        const c = canvas.getContext('2d')
        c.fillStyle = '#18202a'; c.fillRect(0, 0, canvas.width, canvas.height)
        c.fillStyle = '#fff'; c.font = '16px sans-serif'
        for (let row = 0; row < heroes.length; row++) for (let col = 0; col < phases.length; col++) {
          const [kind] = heroes[row], phase = phases[col]
          const img = await loadImage(join(out, device.name + '-' + kind + '-' + facing + '-' + phase + '-' + tag + '.png'))
          c.fillText(kind + ' / ' + phase, col * w + 8, row * (h + 26) + 18)
          c.drawImage(img, col * w, row * (h + 26) + 26, w, h)
        }
        writeFileSync(join(out, 'sequence-' + device.name + '-' + facing + '-' + tag + '.png'), canvas.toBuffer('image/png'))
      }
    }
  }
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))
  console.log('Evidence written to', out)
} finally {
  if (browser) await browser.close()
  await server.close()
}
