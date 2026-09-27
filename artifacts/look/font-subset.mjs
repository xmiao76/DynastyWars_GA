// One-shot: collect every character the display font must render (UI-1).
// Scans display-string sources with comments stripped, so comment-only CJK
// (art citations) does not inflate the required set.
import { readFileSync, writeFileSync } from 'node:fs'

const files = [
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
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const chars = new Set()
for (const f of files) {
  const code = strip(readFileSync(f, 'utf8'))
  // String literals only: display text lives in quotes, not identifiers.
  for (const m of code.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    for (const ch of (m[1] ?? m[2] ?? m[3] ?? '')) {
      if (ch.trim() === '') continue
      chars.add(ch)
    }
  }
}
// Deliberate extras: full Latin display set + punctuation the baked baker and
// future lore captions will need (cheap in woff2, avoids re-subsetting).
for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·’‘“”\'"—–…!?,.:;()[]/\\|+-*=%<>→←↑↓×÷©®™「」『』、。！？：；（）《》· ') {
  if (ch.trim() !== '') chars.add(ch)
}
const sorted = [...chars].sort()
const cjk = sorted.filter((c) => /[\u3400-\u9fff\uf900-\ufaff]/.test(c))
console.log(`total=${sorted.length} cjk=${cjk.length}`)
console.log('CJK:', cjk.join(''))
writeFileSync('artifacts/look/font-subset.txt', sorted.join(''), 'utf8')
