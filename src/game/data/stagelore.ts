/**
 * Stage-intro lore (UI-5): one parchment-card entry per stage, in the game
 * layer rather than core because it is PRESENTATION copy - the sim never
 * reads it. Each beat follows the Romance of the Three Kingdoms arc the
 * stage list already encodes (the first fire, the second fire, the flood),
 * written as the arcade original's scene-setting captions: two short lines,
 * readable in the ~3s the card holds.
 */
import { STAGE_ORDER } from '../../core/stage'

export interface StageLore {
  /** The stage's ordinal, shown in the corner seal chip. */
  number: number
  /** Two short lines of scene-setting copy. */
  lines: [string, string]
  /** A single classical-style Chinese caption line. */
  captionZh: string
}

const LORE: Record<string, StageLore> = {
  stage1: {
    number: 1,
    lines: ['Ten thousand men march into the narrow gorge.', 'The sleeping dragon has prepared a welcome.'],
    captionZh: '初出茅庐·第一把火',
  },
  stage2: {
    number: 2,
    lines: ['Xinye burns behind you - the second fire.', 'The people follow the banner out of the smoke.'],
    captionZh: '火烧新野·携民渡江',
  },
  stage3: {
    number: 3,
    lines: ['The Wei camp sprawls along the dry riverbed.', 'Upstream, someone has been busy all night.'],
    captionZh: '白河用水·水淹七军',
  },
}

/** Lore for a stage id; stage1's entry for unknown ids, never undefined. */
export function stageLore(stageId: string): StageLore {
  return LORE[stageId] ?? LORE.stage1 ?? { number: 1, lines: ['', ''], captionZh: '' }
}

/** Every stage id in order has an entry - the card must never fall back. */
export function loreStageIds(): string[] {
  return STAGE_ORDER.filter((id) => LORE[id] !== undefined)
}
