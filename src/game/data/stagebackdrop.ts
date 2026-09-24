/**
 * Per-stage backdrop direction (ART-19): which landmark mid-layer, which sky
 * variant, and whether the fire strip burns. Lives in the game layer with
 * STAGE_LORE rather than in core: it is PRESENTATION selection, and the sim
 * never reads it. The core bg* tints stay the authoritative per-stage
 * palette; this table only picks silhouettes and weather within it.
 */
import { STAGE_ORDER } from '../../core/stage'

export type MarksKind =
  | 'gorge'
  | 'village'
  | 'riverbank'
  | 'bridge'
  | 'outskirts'
  | 'warships'
  | 'inferno'
  | 'flagship'
  | 'arena'

export type SkyVariant = 'day' | 'ember'

export interface StageBackdrop {
  marks: MarksKind
  sky: SkyVariant
  embers: boolean
}

const TABLE: Record<string, StageBackdrop> = {
  stage1: { marks: 'gorge', sky: 'day', embers: false },
  stage2: { marks: 'village', sky: 'day', embers: false },
  stage3: { marks: 'riverbank', sky: 'day', embers: false },
  stage4: { marks: 'bridge', sky: 'day', embers: false },
  stage5: { marks: 'outskirts', sky: 'day', embers: false },
  stage6: { marks: 'warships', sky: 'day', embers: false },
  stage7: { marks: 'inferno', sky: 'ember', embers: true },
  stage8: { marks: 'flagship', sky: 'day', embers: true },
  stage9: { marks: 'arena', sky: 'day', embers: false },
}

/** Backdrop direction for a stage id; stage1's entry for unknown ids. */
export function stageBackdrop(stageId: string): StageBackdrop {
  return TABLE[stageId] ?? TABLE.stage1 ?? { marks: 'gorge', sky: 'day', embers: false }
}

/** Every stage id in order has an entry - the layer never falls back. */
export function backdropStageIds(): string[] {
  return STAGE_ORDER.filter((id) => TABLE[id] !== undefined)
}
