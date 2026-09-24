/**
 * Stage-intro lore (UI-5): one parchment-card entry per stage, in the game
 * layer rather than core because it is PRESENTATION copy - the sim never
 * reads it. Each beat follows the Romance of the Three Kingdoms arc the
 * stage list already encodes (the two fires, the flood, Changban, Red Cliff),
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
    lines: ['Cao Ren camps smugly along the dry riverbed.', 'Upstream, someone has been busy all night.'],
    captionZh: '白河用水·水淹七军',
  },
  stage4: {
    number: 4,
    lines: ['One bridge. One shout. The pursuit halts.', 'Behind the thunder, the young lord sleeps.'],
    captionZh: '长坂桥头·一声断喝',
  },
  stage5: {
    number: 5,
    lines: ['The allied fleet drops anchor off Red Cliff.', "Cao Cao's patrols row out to greet the wind."],
    captionZh: '赤壁前哨·大军压境',
  },
  stage6: {
    number: 6,
    lines: ['Fire ships slip between the anchored fleets.', 'The north learns to fear the current tonight.'],
    captionZh: '江上急袭·铁索连舟',
  },
  stage7: {
    number: 7,
    lines: ['The east wind arrives, exactly as promised.', 'A single torch sets the whole river alight.'],
    captionZh: '借得东风·赤壁大火',
  },
  stage8: {
    number: 8,
    lines: ['Through the burning hulks, one banner stands.', 'Board it - the warlord himself is aboard.'],
    captionZh: '直捣黄龙·曹操旗舰',
  },
  stage9: {
    number: 9,
    lines: ['The fire dies. A shadow descends on the field.', 'The war god has come to collect the dead.'],
    captionZh: '战神再临·吕布降世',
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
