// One-shot: check candidate display fonts cover every required glyph (UI-1).
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const chars = [...readFileSync('artifacts/look/font-subset.txt', 'utf8')]
const families = ['ZCOOL QingKe HuangYou', 'Noto Serif TC']
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent('<html><head></head><body></body></html>')
for (const fam of families) {
  const weights = fam === 'Noto Serif TC' ? 'wght@900' : ''
  await page.evaluate(
    ({ fam, weights }) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}${weights ? ':' + weights : ''}&display=swap`
      document.head.appendChild(link)
    },
    { fam, weights },
  )
}
await page.evaluate((chars) => {
  const d = document.createElement('div')
  d.id = 'probe'
  d.style.cssText = 'position:absolute;left:-9999px;font-size:32px;'
  d.textContent = chars.join('')
  document.body.appendChild(d)
}, chars)
for (const fam of families) {
  await page.evaluate((fam) => {
    document.getElementById('probe').style.fontFamily = `"${fam}"`
  }, fam)
  await page.waitForTimeout(2500)
}
const report = await page.evaluate(
  ({ fams, chars }) => {
    const out = {}
    for (const fam of fams) {
      const missing = chars.filter((ch) => {
        try {
          return !document.fonts.check(`32px "${fam}"`, ch)
        } catch {
          return true
        }
      })
      out[fam] = { loaded: document.fonts.status, missing }
    }
    return out
  },
  { fams: families, chars },
)
for (const [fam, r] of Object.entries(report)) {
  console.log(`${fam}: status=${r.loaded} missing=${r.missing.length} :: ${r.missing.join('')}`)
}
await browser.close()
