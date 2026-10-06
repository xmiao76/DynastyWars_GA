/**
 * Per-stage backdrop direction (ART-19): which landmark mid-layer. Lives in
 * the game layer with STAGE_LORE rather than in core: it is PRESENTATION
 * selection, and the sim never reads it. The core bg* tints stay the
 * authoritative per-stage palette; this table only picks silhouettes within it.
 */
import { STAGE_ORDER } from '../../core/stage'

export type MarksKind =
  | 'gorge'
  | 'village'
  | 'riverbank'

export interface StageBackdrop {
  marks: MarksKind
}

const TABLE: Record<string, StageBackdrop> = {
  stage1: { marks: 'gorge' },
  stage2: { marks: 'village' },
  stage3: { marks: 'riverbank' },
}

/** Backdrop direction for a stage id; stage1's entry for unknown ids. */
export function stageBackdrop(stageId: string): StageBackdrop {
  return TABLE[stageId] ?? TABLE.stage1 ?? { marks: 'gorge' }
}

/** Every stage id in order has an entry - the layer never falls back. */
export function backdropStageIds(): string[] {
  return STAGE_ORDER.filter((id) => TABLE[id] !== undefined)
}
