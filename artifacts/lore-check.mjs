import { STAGE_ORDER } from './src/core/stage'
import { stageLore } from './src/game/data/stagelore'
for (const id of STAGE_ORDER) {
  const l = stageLore(id)
  console.log(id, l.lines.map(s => s.length).join(','), JSON.stringify(l.lines))
}
