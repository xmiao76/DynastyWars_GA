# CMR-02 — Generic per-kind motion profiles and playback

- Queue status: DONE (attempt 1, 2026-10-01; verified same day) (live queue TASKS.md is authoritative).
- Dependencies: CMR-01 DONE; no dependent task starts after a failed prerequisite.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), live queue/progress, CMR-01 inventory/reference reports, `src/game/art/motion-clips.ts`, `motion-player.ts`, `src/core/{characters,enemies,attacks,ai,events}.ts`, existing motion/action/transition tests. Core definitions are read-only.

## Bounded work

- Move Guan Yu-only ID checks, gy prefixes, uniform action-page requirements and hurt/attack timing into a per-fighter profile contract.
- Support heroes, melee enemies, bosses and projectile shooters, with named clips/pages/state/attack bindings and explicit capability matrix. Preserve normal-stage fallback for wholly absent packs.
- Keep shared presentation histories perentity/scene: hitstop-safe idle/walk, airTicks/startup, all active ticks, landing interruption, mounts, fall lift, low collapse/getup, KO/dead/revive and restart.
- Do not require enemies to carry jump/special/mounted pages. Use each enemy's hitstun and actual charge/combo/heavy timings and normal/enraged movement. Unknown bindings should fail validation, not look like a supposedly complete idle animation.
- Generalize projectile cues using existing per-step firing cadence reset/owned projectile appearance. Huang Zhong's release follows projectile spawn; do not invent melee active windows. For enemy archers core AI has no attack state: capture presentation firing progress from observed unfrozen updates without core changes. Preserve simultaneous actors/IDs and skipped render behavior.
- Keep public bridge/core schema unchanged. State any necessary presentation-only adapter data and pass it explicitly rather than a global mutable animation clock.

## Acceptance

- [x] Generic fixture profiles for non-Guan hero, melee enemy, boss and archer validate/sample their actual capabilities.
- [x] Every bound attack tick matches existing startup/active/recovery; zero-active and shooter cues tested.
- [x] Two simultaneous shooters/actors cannot steal each other's cues/history. Render batching/pause/hitstop cannot delay or multiply release.
- [x] Guan Yu reference hash/exposure comparison and all existing boundary controls unchanged, including accepted regular walk/combo timing.
- [x] Negative controls reject missing required clips, unknown IDs, malformed exposure ordering and wrong role bindings.
- [x] No new production character artwork, gameplay or core schema changes.

## Verification

Meaningful units with failing-before controls for defects; current Guan Yu live action/mixed/boundary regressions. Lint/typecheck, applicable e2e, signal for timing adapter changes, vision/prodbuild. Baseline-only errors remain explicitly reported. Frame names/refactoring can change internally only if displayedRGBA/pivot/timing equivalence is proved. Local scoped commit and next-task handoff to CMR-03.
