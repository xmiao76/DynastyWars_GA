/**
 * Stage definitions: geometry, walkable band, wave spawn tables, props, and
 * the arena boss. Stage names are bilingual; the bosses are the historical
 * Wei generals in arcade order.
 */
export interface SpawnDef {
  kind: string
  /** Base along-stage position; a small seeded jitter is applied at spawn. */
  x: number
}

export interface WaveDef {
  spawns: SpawnDef[]
}

export interface StageDef {
  id: string
  nameEn: string
  nameZh: string
  /** Total along-stage extent in px. */
  length: number
  /** Walkable depth band (screen-y range entities' feet stay within). */
  walkBandTop: number
  walkBandBottom: number
  waves: WaveDef[]
  /** Breakable props (crates/barrels) placed along the stage. */
  props: SpawnDef[]
  /** Boss spawned at the arena trigger past the final wave. */
  bossKind: string
  /** Ground palette: backdrop wall and floor colors. */
  wallColor: number
  floorColor: number
  /** Painted-background palette (bright, readable): sky top, sky bottom,
   * hill, ground. */
  bgSkyTop: number
  bgSkyBottom: number
  bgHill: number
  bgGround: number
}

export const STAGE_1: StageDef = {
  id: 'stage1',
  nameEn: 'Bowang Slope',
  nameZh: '博望坡',
  length: 768,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'soldier', x: 540 },
        { kind: 'soldier', x: 590 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 430 },
        { kind: 'soldier', x: 480 },
        { kind: 'soldier', x: 530 },
        { kind: 'spearman', x: 560 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'spearman', x: 540 },
        { kind: 'archer', x: 590 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 300 },
    { kind: 'crate', x: 620 },
  ],
  bossKind: 'lidian',
  wallColor: 0x241612,
  bgSkyTop: 0x3a6fd8,
  bgSkyBottom: 0x8a9ab0,
  bgHill: 0x5a7a4a,
  bgGround: 0x7a9a5a,
  floorColor: 0x4a3520,
}

export const STAGE_2: StageDef = {
  id: 'stage2',
  nameEn: 'Xinye Fields',
  nameZh: '新野',
  length: 900,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 460 },
        { kind: 'soldier', x: 510 },
        { kind: 'soldier', x: 560 },
        { kind: 'soldier', x: 610 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'spearman', x: 590 },
        { kind: 'archer', x: 620 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'spearman', x: 530 },
        { kind: 'spearman', x: 570 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'soldier', x: 590 },
        { kind: 'archer', x: 620 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 350 },
    { kind: 'crate', x: 700 },
    { kind: 'horse', x: 200 },
  ],
  bossKind: 'xiahoudun',
  wallColor: 0x12241a,
  bgSkyTop: 0x3a7a4a,
  bgSkyBottom: 0x1d4a2a,
  bgHill: 0x2f5b39,
  bgGround: 0x4a7a3a,
  floorColor: 0x2f4a2a,
}

export const STAGE_3: StageDef = {
  id: 'stage3',
  nameEn: 'White River Bank',
  nameZh: '白河',
  length: 900,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 460 },
        { kind: 'soldier', x: 510 },
        { kind: 'soldier', x: 560 },
        { kind: 'soldier', x: 610 },
        { kind: 'archer', x: 640 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'spearman', x: 600 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'soldier', x: 540 },
        { kind: 'spearman', x: 580 },
        { kind: 'archer', x: 620 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'spearman', x: 600 },
        { kind: 'archer', x: 640 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 320 },
    { kind: 'crate', x: 640 },
    { kind: 'crate', x: 800 },
  ],
  bossKind: 'xuchu',
  wallColor: 0x12202a,
  bgSkyTop: 0x3a5a7a,
  bgSkyBottom: 0x1d2f4a,
  bgHill: 0x2f4560,
  bgGround: 0x4a6a7a,
  floorColor: 0x2a4a5a,
}

export const STAGES: Record<string, StageDef> = {
  stage1: STAGE_1,
  stage2: STAGE_2,
  stage3: STAGE_3,
}

/** Stage progression order. */
export const STAGE_ORDER = [
  'stage1',
  'stage2',
  'stage3',
] as const

export function nextStageId(stageId: string): string | undefined {
  const index = STAGE_ORDER.indexOf(stageId as (typeof STAGE_ORDER)[number])
  if (index < 0) return undefined
  return STAGE_ORDER[index + 1]
}
