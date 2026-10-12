import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

// Native Chromium decoding only. No source-art sampling, resizing or animation.
const [videoPath, out, startArg = '0', stepArg = '0.066', countArg = '16', tracePath] = process.argv.slice(2)
if (!videoPath || !out) throw new Error('Usage: node scripts/review-xiahoudun-video.mjs VIDEO NEW_OUT START STEP COUNT [TRACE]')
if (existsSync(out)) throw new Error(`Refuse existing output: ${out}`)
const bytes = readFileSync(videoPath), sourceSha256 = createHash('sha256').update(bytes).digest('hex')
const start = Number(startArg), step = Number(stepArg), count = Number(countArg)
if (![start, step, count].every(Number.isFinite) || start < 0 || step <= 0 || count < 1 || count > 48) throw new Error('Invalid finite sampler bounds')
const trace = tracePath ? JSON.parse(readFileSync(tracePath, 'utf8')) : null
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  const result = await page.evaluate(async ({ url, start, step, count, rows }) => {
    const { document, setTimeout, clearTimeout } = globalThis
    const v = document.createElement('video'); v.muted = true; v.preload = 'auto'; document.body.append(v)
    const event = (name) => new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`Media event timeout: ${name}`)), 10000); v.addEventListener(name, () => { clearTimeout(timer); resolve() }, { once: true }) })
    const loaded = event('loadeddata'); v.src = url; await loaded
    if (!Number.isFinite(v.duration)) { const seek = event('seeked'); v.currentTime = 1e6; await seek }
    const metadata = { duration: v.duration, width: v.videoWidth, height: v.videoHeight, nativeDecoder: 'Playwright Chromium HTMLVideoElement / Canvas drawImage; no resizing' }
    if (!(metadata.width > 0 && metadata.height > 0 && Number.isFinite(metadata.duration))) throw new Error('Invalid browser media metadata')
    const frames = [], columns = 4, label = 30
    const sheet = document.createElement('canvas'); sheet.width = metadata.width * columns; sheet.height = (metadata.height + label) * Math.ceil(count / columns)
    const sc = sheet.getContext('2d'); sc.fillStyle = '#ddd'; sc.fillRect(0, 0, sheet.width, sheet.height)
    const bodies = document.createElement('canvas'); bodies.width = 520 * columns; bodies.height = (436 + label) * Math.ceil(count / columns)
    const bc = bodies.getContext('2d'); bc.fillStyle = '#ddd'; bc.fillRect(0, 0, bodies.width, bodies.height)
    let bodyCount = 0
    for (let i = 0; i < count; i++) {
      const requested = start + i * step
      if (requested >= v.duration) throw new Error(`Anchor ${requested} outside duration ${v.duration}`)
      if (Math.abs(v.currentTime - requested) > 0.0001) { const seek = event('seeked'); v.currentTime = requested; await seek }
      const canvas = document.createElement('canvas'); canvas.width = v.videoWidth; canvas.height = v.videoHeight
      const ctx = canvas.getContext('2d'); ctx.drawImage(v, 0, 0)
      const row = rows?.reduce((best, r) => !best || Math.abs(r.videoMs - requested * 1000) < Math.abs(best.videoMs - requested * 1000) ? r : best, null)
      const caption = `${requested.toFixed(3)}s ${row ? `${row.key} tick${row.tick} (~trace)` : 'original video; phase unaligned'}`
      const x = (i % columns) * metadata.width, y = Math.floor(i / columns) * (metadata.height + label)
      sc.drawImage(canvas, x, y + label); sc.fillStyle = '#111'; sc.font = '16px monospace'; sc.fillText(caption, x + 4, y + 21)
      if (row?.box && row.box.x >= 0 && row.box.y >= 0 && row.box.x + 520 <= canvas.width && row.box.y + 436 <= canvas.height) {
        const bx = (i % columns) * 520, by = Math.floor(i / columns) * (436 + label)
        bc.drawImage(canvas, Math.round(row.box.x), Math.round(row.box.y), 520, 436, bx, by + label, 520, 436)
        bc.fillStyle = '#111'; bc.font = '14px monospace'; bc.fillText(caption, bx + 4, by + 20); bodyCount++
      }
      frames.push({ requestedSeconds: requested, browserCurrentTime: v.currentTime, png: canvas.toDataURL('image/png'), nearestTrace: row ?? null })
    }
    return { metadata, frames, sheet: sheet.toDataURL('image/png'), bodySheet: bodyCount ? bodies.toDataURL('image/png') : null, bodyCount }
  }, { url: `data:video/webm;base64,${bytes.toString('base64')}`, start, step, count, rows: trace?.rows ?? null })
  mkdirSync(out, { recursive: true })
  const savePng = (name, url) => { const b = Buffer.from(url.split(',')[1], 'base64'); writeFileSync(`${out}/${name}`, b, { flag: 'wx' }); return createHash('sha256').update(b).digest('hex') }
  const frames = result.frames.map((f, i) => { const { png, ...rest } = f; const name = `frame-${String(i).padStart(2, '0')}.png`; return { ...rest, path: `${out}/${name}`, sha256: savePng(name, png) } })
  const sheetSha256 = savePng('chronological-full-native.png', result.sheet)
  if (result.bodySheet) savePng('chronological-body-native.png', result.bodySheet)
  writeFileSync(`${out}/index.json`, `${JSON.stringify({ source: videoPath, sourceSha256, sourceBytes: bytes.length, metadata: result.metadata, sampler: { start, step, count }, frames, sheetSha256, bodyCount: result.bodyCount, limitations: 'Decoded chronological stills, NOT watched native video stream. Seeking selects a codec frame near the requested timestamp; frame repeats possible. Nearest trace labels are approximate, not certified exact phase/frame alignment. Native full-frame pixels preserved; body sheet is an unscaled viewport crop where full bounds fit.' }, null, 2)}\n`, { flag: 'wx' })
  console.log(JSON.stringify({ out, sourceSha256, ...result.metadata, count, bodyCount: result.bodyCount }))
} finally { await browser.close() }
