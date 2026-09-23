# ART-18 — approved painted hero-face redesign

Owner approved 2026-09-23. This file is the durable implementation plan for the
same-session goal. Full approved plan also remains in the session.

## Decisions and scope

- Original semi-realistic painted warriors, not more procedural facial marks.
- All five playable heroes: Guan Yu, Zhang Fei, Zhao Yun, Huang Zhong, Wei Yan.
- Both portraits and gameplay heads. Preserve bodies/rig/14 poses, simulation,
  weapons, controls, standing scale, scene layouts, and relative-base shipping.
- Wei Yan follows the novel's date-red complexion, superseding the tan exception.
- Explicit literary description outranks inherited art; distinguish interpretation
  from history. No authenticated exact facial likeness is claimed.
- Bosses/NPCs are regression-only. No full-body or environment rewrite.

## Artwork

1. Reference brief in HERO_FACE_REFERENCE.md with source quotes and interpretation.
2. Guan Yu and Zhao Yun pilots, reviewed in real UI/gameplay before other heroes.
3. Each hero: high-resolution bust portrait; matching right-facing 3/4 gameplay
   head in neutral/exertion/hurt-down; rear hair/cloth and front beard layers when
   needed. Consistent brushwork, natural age/anatomy, no actor/game-asset copies.
4. Tracked masters/provenance in art/hero-faces/, shipping derivatives in
   src/game/assets/hero-faces/. Do not use ignored art/raw or the old 42x54 bake.
5. Deterministic preparation with explicit crop/alpha/pivot metadata; shipping
   portrait 432x480, optimized head sheets, no colored fringes/background boxes.

## Integration

- Typed catalog: ID/revision/asset references/expression rects/pivot/canonical
  bounds/rear and front layer rects. Explicit Vite imports => hashed asset URLs.
- BootScene bounded preload supplies per-hero complete resource packs before
  texture generation. Explicit optional decoded render-resource argument through
  registry/drawing; no mutable singleton or browser globals in pure art modules.
- Keep portrait:<hero> and entity:<hero>:<pose>, poseForEntity and sim APIs.
- Ordered layers: rear hair/cloth, head/neck, near shoulder/arm, front beard,
  hands/weapons. Painted head not re-cel-shaded, no procedural eyes drawn over it.
- Expressions: neutral idle/walk/recover; exertion strikes/special; hurt for
  hurt/down. Head follows joint rotation/translation; sprite mirror gives left.
- Match neck/hands, especially Wei Yan. Do not distort body to fit new head.
- On missing/corrupt art use atomic per-hero complete procedural fallback, never
  new portrait + absent head. Normal shipping tests reject unexpected fallback.
- No legacy public/assets/manifest.json activation; keep stale-manifest protection.

## Verification and acceptance

- Node tests decode shipping assets and exercise same painted path as browser.
- Validate all five IDs/expressions, finite pivots, alpha bounds, preparation
  determinism. Negative controls: missing/blank/swapped heads, erased features,
  shifted pivots. Retain fallback tests and all unrelated gates.
- Inspect all 14 poses, both facings, mounted/co-op/restarts, texture reuse.
- Before/after sheets at native select/HUD/gameplay size, phone + desktop;
  short motion capture detects head sliding, beard intersection, pasted-on seams.
- Portrait/gameplay identity must agree; source traits and convincing natural
  anatomy required. Tests cannot establish beauty or exact likeness. Present
  pilot and final cast for owner review; unresolved objections mean IN_PROGRESS.
- Full serial browser gates: lint, typecheck, unit, e2e, logic signal, vision
  Canvas/WebGL parity, prodbuild, build. Record byte/decode memory and boot/perf.
- Commit verified task files locally only, never artifacts/secrets/push/deploy.

## Bookkeeping

Expired ENH-12 run closed IN_PROGRESS at 07:07 UTC using normal --finish-manual.
Unverified draft saved in artifacts/loop/enh12-attempt1-partial.patch; source
restored before ART-18. ENH-12 deferred. No schedules or runner policy changed.

Record each bounded attempt in PROGRESS.md and exact report path. Preserve latest
signal snapshot and unfinished evidence when archiving history. Owner-request
priority supersedes automatic selection of ENH-12.
