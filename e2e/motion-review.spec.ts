import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { expect, test, type Page } from '@playwright/test'

/**
 * BODY-17 motion review capture (permanent generator). Drives the REAL game
 * tick by tick in autopilot and records each hero through one scripted
 * sequence - walk, full three-hit combo (windup -> strike -> recover), jump
 * and the special - so the human-style review in docs/CHARACTER_REVIEW.md
 * judges MOTION, not just stills:
 *   artifacts/look/motion/<hero>.webm         the clip (30 fps, 2 ticks/frame)
 *   artifacts/look/motion/<hero>-sheet.png    contact sheet of every 3rd frame
 * Enemies caught by the combo supply the hurt/down reactions in frame.
 * The assertions only guarantee the capture happened; judging it is the
 * review's job.
 */
const OUT = 'artifacts/look/motion'
const HEROES = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong', 'weiyan']
const CROP = { w: 440, h: 260 }

interface In {
  up: boolean; down: boolean; left: boolean; right: boolean
  attackPressed: boolean; jumpPressed: boolean; specialPressed: boolean
}
const idle = (): In => ({
  up: false, down: false, left: false, right: false,
  attackPressed: false, jumpPressed: false, specialPressed: false,
})

/** The scripted sequence, one input per tick. */
function script(): In[] {
  const s: In[] = []
  const push = (n: number, f: (i: number) => Partial<In>): void => {
    for (let i = 0; i < n; i += 1) s.push({ ...idle(), ...f(i) })
  }
  push(20, () => ({}))                                   // idle breath
  push(48, () => ({ right: true }))                      // walk
  push(8, () => ({}))
  push(96, (i) => ({ attackPressed: i % 16 === 0 }))      // three-hit combo
  push(20, () => ({}))
  push(44, (i) => ({ jumpPressed: i === 0 }))           // jump
  push(12, () => ({}))
  push(60, (i) => ({ specialPressed: i === 0 }))        // special
  push(16, () => ({}))
  return s
}

function ffmpegPath(): string | undefined {
  const root = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
  if (!existsSync(root)) return undefined
  for (const dir of readdirSync(root)) {
    if (!dir.startsWith('ffmpeg')) continue
    for (const f of readdirSync(join(root, dir))) if (f.startsWith('ffmpeg') && f.endsWith('.exe')) return join(root, dir, f)
  }
  return undefined
}

async function frameRendered(page: Page, tick: number): Promise<void> {
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().tick ?? -1)).toBeGreaterThanOrEqual(tick)
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}

// A review GENERATOR, not a gate: ~4 minutes of capture, so it runs only on
// request (MOTION_REVIEW=1) and never slows the ordinary e2e suite.
test('motion review: every hero walks, combos, jumps and specials on video', async ({ page }) => {
  test.skip(process.env.MOTION_REVIEW !== '1', 'set MOTION_REVIEW=1 to capture motion review clips')
  test.setTimeout(600_000)
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/?renderer=canvas&autopilot=1')
  await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('title')
  mkdirSync(OUT, { recursive: true })
  const ff = ffmpegPath()
  const frameCounts: Record<string, number> = {}

  for (const hero of HEROES) {
    await page.evaluate(([id]) => window.__DW__?.startGame(id as string, 42, 'stage1'), [hero])
    await expect.poll(() => page.evaluate(() => window.__DW__?.getSnapshot().scene)).toBe('game')
    // The stage intro card rises ~1.6 s (wall time) after entry; wait for it,
    // dismiss it (Enter), and confirm it is gone so no frame is covered.
    const cardUp = (): Promise<boolean | undefined> =>
      page.evaluate(() => {
        const hud = window.__DW_GAME__?.scene.getScene('hud')
        return hud?.children.list.some((c) => c.name === 'introCard')
      })
    await expect.poll(cardUp).toBe(true)
    await page.keyboard.press('Enter')
    await expect.poll(cardUp).toBe(false)
    const t0 = await page.evaluate(() => window.__DW__?.getSnapshot().tick ?? 0)
    const dir = join(OUT, hero)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    const inputs = script()
    let frame = 0
    for (let i = 0; i < inputs.length; i += 2) {
      await page.evaluate((batch) => window.__DW__?.run(batch), inputs.slice(i, i + 2))
      await frameRendered(page, t0 + Math.min(i + 2, inputs.length))
      const sn = await page.evaluate(() => {
        const s = window.__DW__?.getSnapshot().sim
        return s ? { x: s.player.x, y: s.player.y, z: s.player.z, sx: s.scrollX } : null
      })
      if (!sn) break
      const px = (sn.x - sn.sx) * 2
      const py = (sn.y - sn.z) * 2
      const x = Math.max(0, Math.min(960 - CROP.w, Math.round(px - 150)))
      const y = Math.max(0, Math.min(540 - CROP.h, Math.round(py - 220)))
      await page.screenshot({
        path: join(dir, `f${String(frame).padStart(3, '0')}.jpg`),
        type: 'jpeg',
        quality: 92,
        clip: { x, y, width: CROP.w, height: CROP.h },
      })
      frame += 1
    }
    frameCounts[hero] = frame

    // Contact sheet: every 3rd frame (every 6 ticks), 8 per row, half size.
    const picks = Array.from({ length: Math.ceil(frame / 3) }, (_, k) => k * 3).filter((k) => k < frame)
    const tw = CROP.w / 2
    const th = CROP.h / 2
    const cols = 8
    const sheet = createCanvas(cols * tw, Math.ceil(picks.length / cols) * (th + 14))
    const g = sheet.getContext('2d')
    g.fillStyle = '#16131c'
    g.fillRect(0, 0, sheet.width, sheet.height)
    g.font = '11px sans-serif'
    for (const [n, k] of picks.entries()) {
      const img = await loadImage(join(dir, `f${String(k).padStart(3, '0')}.jpg`))
      const cx = (n % cols) * tw
      const cy = Math.floor(n / cols) * (th + 14)
      g.drawImage(img, cx, cy + 14, tw, th)
      g.fillStyle = '#f5e6c8'
      g.fillText(`${hero} t+${k * 2}`, cx + 3, cy + 11)
    }
    writeFileSync(join(OUT, `${hero}-sheet.png`), sheet.toBuffer('image/png'))

    // Video: VP8 WebM through Playwright's own ffmpeg build, which (like
    // Playwright's recorder) only decodes MJPEG from a pipe - so the JPEG
    // frames are concatenated onto stdin. Skipped if ffmpeg is absent.
    if (ff) {
      const stream = Buffer.concat(
        Array.from({ length: frame }, (_, k) => readFileSync(join(dir, `f${String(k).padStart(3, '0')}.jpg`))),
      )
      const r = spawnSync(ff, [
        '-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', 'pipe:0',
        '-an', '-c:v', 'libvpx', '-b:v', '3M', '-pix_fmt', 'yuv420p', join(OUT, `${hero}.webm`),
      ], { input: stream, stdio: ['pipe', 'ignore', 'pipe'] })
      expect(r.status, `${hero} video encode: ${String(r.stderr ?? '')}`).toBe(0)
    }
  }
  for (const hero of HEROES) expect(frameCounts[hero], `${hero} frames`).toBeGreaterThanOrEqual(150)
  expect(pageErrors).toEqual([])
})
