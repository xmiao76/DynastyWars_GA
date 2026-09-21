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

export const STAGE_4: StageDef = {
  id: 'stage4',
  nameEn: 'Changban Bridge',
  nameZh: '長坂橋',
  length: 950,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'spearman', x: 640 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'archer', x: 580 },
        { kind: 'archer', x: 630 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 460 },
        { kind: 'spearman', x: 520 },
        { kind: 'spearman', x: 580 },
        { kind: 'soldier', x: 620 },
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
    {
      spawns: [
        { kind: 'soldier', x: 460 },
        { kind: 'soldier', x: 510 },
        { kind: 'soldier', x: 560 },
        { kind: 'spearman', x: 610 },
        { kind: 'archer', x: 650 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 330 },
    { kind: 'crate', x: 700 },
  ],
  bossKind: 'caoren',
  wallColor: 0x241a12,
  bgSkyTop: 0x8a6030,
  bgSkyBottom: 0x4a3318,
  bgHill: 0x6b451f,
  bgGround: 0x6b5a2e,
  floorColor: 0x5a4a2a,
}

export const STAGE_5: StageDef = {
  id: 'stage5',
  nameEn: 'Red Cliff Outskirts',
  nameZh: '赤壁·前哨',
  length: 1000,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'spearman', x: 630 },
        { kind: 'archer', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'spearman', x: 590 },
        { kind: 'spearman', x: 630 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'spearman', x: 560 },
        { kind: 'archer', x: 610 },
        { kind: 'archer', x: 650 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 460 },
        { kind: 'spearman', x: 520 },
        { kind: 'spearman', x: 580 },
        { kind: 'soldier', x: 620 },
        { kind: 'soldier', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'spearman', x: 600 },
        { kind: 'archer', x: 630 },
        { kind: 'archer', x: 670 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 340 },
    { kind: 'crate', x: 680 },
    { kind: 'crate', x: 900 },
  ],
  bossKind: 'zhangliao',
  wallColor: 0x2a1212,
  bgSkyTop: 0x9a3a2a,
  bgSkyBottom: 0x5a1a18,
  bgHill: 0x7a2a1a,
  bgGround: 0x8a4a2a,
  floorColor: 0x4a2a2a,
}

export const STAGE_6: StageDef = {
  id: 'stage6',
  nameEn: 'River Ambush',
  nameZh: '江上急襲',
  length: 1000,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'archer', x: 640 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 450 },
        { kind: 'spearman', x: 510 },
        { kind: 'soldier', x: 570 },
        { kind: 'soldier', x: 620 },
        { kind: 'archer', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'soldier', x: 540 },
        { kind: 'spearman', x: 580 },
        { kind: 'archer', x: 620 },
        { kind: 'archer', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 450 },
        { kind: 'spearman', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'soldier', x: 650 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'spearman', x: 590 },
        { kind: 'spearman', x: 630 },
        { kind: 'archer', x: 670 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 320 },
    { kind: 'crate', x: 660 },
    { kind: 'crate', x: 880 },
    { kind: 'horse', x: 220 },
  ],
  bossKind: 'xuhuang',
  wallColor: 0x0a1a2a,
  bgSkyTop: 0x2a4a7a,
  bgSkyBottom: 0x142a4a,
  bgHill: 0x203a5a,
  bgGround: 0x3a5a6a,
  floorColor: 0x1a3a5a,
}

export const STAGE_7: StageDef = {
  id: 'stage7',
  nameEn: 'Red Cliff Inferno',
  nameZh: '赤壁大火',
  length: 1050,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'spearman', x: 640 },
        { kind: 'archer', x: 670 },
      ],
    },
    {
      spawns: [
        { kind: 'archer', x: 480 },
        { kind: 'archer', x: 560 },
        { kind: 'soldier', x: 520 },
        { kind: 'soldier', x: 620 },
        { kind: 'spearman', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 450 },
        { kind: 'spearman', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'spearman', x: 600 },
        { kind: 'soldier', x: 650 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'soldier', x: 540 },
        { kind: 'soldier', x: 590 },
        { kind: 'spearman', x: 630 },
        { kind: 'archer', x: 670 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 460 },
        { kind: 'spearman', x: 520 },
        { kind: 'soldier', x: 580 },
        { kind: 'soldier', x: 620 },
        { kind: 'archer', x: 650 },
        { kind: 'archer', x: 690 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 350 },
    { kind: 'crate', x: 720 },
  ],
  bossKind: 'zhanghe',
  wallColor: 0x2a1a0a,
  bgSkyTop: 0xa06430,
  bgSkyBottom: 0x5a3318,
  bgHill: 0x7a4a1e,
  bgGround: 0x8a5a2e,
  floorColor: 0x5a2a1a,
}

export const STAGE_8: StageDef = {
  id: 'stage8',
  nameEn: "Cao Cao's Flagship",
  nameZh: '曹操旗艦',
  length: 1050,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'spearman', x: 450 },
        { kind: 'spearman', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'archer', x: 650 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'soldier', x: 540 },
        { kind: 'spearman', x: 580 },
        { kind: 'spearman', x: 620 },
        { kind: 'archer', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'archer', x: 500 },
        { kind: 'archer', x: 560 },
        { kind: 'archer', x: 620 },
        { kind: 'spearman', x: 500 },
        { kind: 'soldier', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'spearman', x: 640 },
        { kind: 'spearman', x: 680 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 460 },
        { kind: 'spearman', x: 510 },
        { kind: 'spearman', x: 560 },
        { kind: 'soldier', x: 610 },
        { kind: 'soldier', x: 650 },
        { kind: 'archer', x: 690 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 330 },
    { kind: 'crate', x: 690 },
    { kind: 'crate', x: 920 },
  ],
  bossKind: 'caocao',
  wallColor: 0x1a1a2a,
  bgSkyTop: 0x4a3a6a,
  bgSkyBottom: 0x221f3a,
  bgHill: 0x332a4a,
  bgGround: 0x5a4a6a,
  floorColor: 0x3a3a5a,
}

export const STAGE_9: StageDef = {
  id: 'stage9',
  nameEn: 'The Fallen God',
  nameZh: '呂布降臨',
  length: 1100,
  walkBandTop: 181,
  walkBandBottom: 236,
  waves: [
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'spearman', x: 640 },
        { kind: 'archer', x: 680 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 450 },
        { kind: 'spearman', x: 510 },
        { kind: 'spearman', x: 570 },
        { kind: 'soldier', x: 620 },
        { kind: 'soldier', x: 660 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 440 },
        { kind: 'soldier', x: 490 },
        { kind: 'archer', x: 540 },
        { kind: 'archer', x: 590 },
        { kind: 'spearman', x: 630 },
        { kind: 'spearman', x: 670 },
      ],
    },
    {
      spawns: [
        { kind: 'soldier', x: 450 },
        { kind: 'soldier', x: 500 },
        { kind: 'soldier', x: 550 },
        { kind: 'spearman', x: 590 },
        { kind: 'spearman', x: 630 },
        { kind: 'archer', x: 670 },
      ],
    },
    {
      spawns: [
        { kind: 'spearman', x: 450 },
        { kind: 'spearman', x: 500 },
        { kind: 'spearman', x: 550 },
        { kind: 'soldier', x: 600 },
        { kind: 'archer', x: 640 },
        { kind: 'archer', x: 680 },
      ],
    },
  ],
  props: [
    { kind: 'crate', x: 340 },
    { kind: 'crate', x: 700 },
    { kind: 'crate', x: 980 },
  ],
  bossKind: 'lubu',
  wallColor: 0x0f0a1a,
  bgSkyTop: 0x3a203a,
  bgSkyBottom: 0x1a0f1a,
  bgHill: 0x2b1c2b,
  bgGround: 0x4a2a3a,
  floorColor: 0x2a1a3a,
}

export const STAGES: Record<string, StageDef> = {
  stage1: STAGE_1,
  stage2: STAGE_2,
  stage3: STAGE_3,
  stage4: STAGE_4,
  stage5: STAGE_5,
  stage6: STAGE_6,
  stage7: STAGE_7,
  stage8: STAGE_8,
  stage9: STAGE_9,
}

/** Stage progression order. */
export const STAGE_ORDER = [
  'stage1',
  'stage2',
  'stage3',
  'stage4',
  'stage5',
  'stage6',
  'stage7',
  'stage8',
  'stage9',
] as const

export function nextStageId(stageId: string): string | undefined {
  const index = STAGE_ORDER.indexOf(stageId as (typeof STAGE_ORDER)[number])
  if (index < 0) return undefined
  return STAGE_ORDER[index + 1]
}
