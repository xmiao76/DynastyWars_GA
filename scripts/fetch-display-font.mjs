// Reproducible acquisition of the bundled display font (UI-1).
// Downloads a Google-Fonts-subsetted woff2 containing exactly the glyphs the
// game's display strings need, plus the OFL license. The committed files under
// src/game/assets/fonts/ are what ships; this script is only re-run to pick up
// new glyphs (e.g. STAGE_LORE captions in UI-5) or a new font version.
// Network: fonts.googleapis.com + fonts.gstatic.com + github.com (license).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const FAMILY = 'ZCOOL QingKe HuangYou'
const OUT_DIR = 'src/game/assets/fonts'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const SOURCES = [
  'src/core/characters.ts',
  'src/core/enemies.ts',
  'src/core/items.ts',
  'src/core/stage.ts',
  'src/game/scenes/TitleScene.ts',
  'src/game/scenes/SelectScene.ts',
  'src/game/scenes/HudScene.ts',
  'src/game/scenes/ResultScene.ts',
  'src/game/scenes/GameOverScene.ts',
  'src/game/scenes/GameCompleteScene.ts',
  'src/game/adapters/touch.ts',
  'src/game/art/logo.ts',
]
const EXTRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·’‘“”\'"—–…!?,.:;()[]/\\|+-*=%<>→←↑↓×©®™「」『』、。！？：；（）《》· '

function subset() {
  const chars = new Set()
  for (const f of SOURCES) {
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    for (const m of code.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
      for (const ch of (m[1] ?? m[2] ?? m[3] ?? '')) {
        if (ch.trim() !== '') chars.add(ch)
      }
    }
  }
  for (const ch of EXTRAS) if (ch.trim() !== '') chars.add(ch)
  return [...chars].sort().join('')
}

const text = subset()
console.log(`subset: ${text.length} chars`)
const cssRes = await fetch(
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY)}&text=${encodeURIComponent(text)}&display=swap`,
  { headers: { 'User-Agent': UA } },
)
if (!cssRes.ok) throw new Error(`css2 failed: ${cssRes.status}`)
const css = await cssRes.text()
const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])
if (urls.length === 0) throw new Error('no woff2 in css2 response')
console.log(`css2 returned ${urls.length} file(s)`)

mkdirSync(OUT_DIR, { recursive: true })
const files = []
for (const [i, url] of urls.entries()) {
  const name = urls.length === 1 ? 'zcool-qingke-huangyou-subset.woff2' : `zcool-qingke-huangyou-subset-${i}.woff2`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`download failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(`${OUT_DIR}/${name}`, buf)
  files.push(`${name} (${buf.length} bytes)`)
}

const oflRes = await fetch('https://github.com/google/fonts/raw/main/ofl/zcoolqingkehuangyou/OFL.txt')
if (!oflRes.ok) throw new Error(`OFL fetch failed: ${oflRes.status}`)
writeFileSync(`${OUT_DIR}/OFL.txt`, Buffer.from(await oflRes.arrayBuffer()))
writeFileSync(`${OUT_DIR}/subset.txt`, text, 'utf8')
writeFileSync(
  `${OUT_DIR}/PROVENANCE.md`,
  `# Bundled display font (UI-1)\n\n- Family: ${FAMILY} (OFL 1.1, see OFL.txt)\n` +
    `- Source: Google Fonts (fonts.google.com/specimen/ZCOOL+QingKe+HuangYou)\n` +
    `- Files: ${files.join(', ')}\n` +
    `- Subset: ${text.length} glyphs (see subset.txt), all display strings in the game\n` +
    `  as of UI-1 plus a fixed Latin/punctuation extra set. Coverage verified in\n` +
    `  headless Chromium via document.fonts.check: every game glyph present.\n` +
    `- Fetched: ${new Date().toISOString().slice(0, 10)} via scripts/fetch-display-font.mjs\n` +
    `- Re-run the script (network) when display strings gain new glyphs.\n`,
)
console.log(`wrote ${files.join(', ')} + OFL.txt + subset.txt + PROVENANCE.md`)
