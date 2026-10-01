# CMR-22 — Shared horse locomotion and rider composition

- Initial queue status: TODO; attempts start at zero. Live status is authoritative in [TASKS.md](../../TASKS.md).
- Dependencies: CMR-21B DONE, all humanoid packs and foundations transitively.
- Request cap: four total horse image requests; at most two whole-sheet candidates per sequence. Counters survive continuation.

## Read first

[Shared contract](../CAST_MOTION_ROLLOUT.md), rider profiles/captures, `src/game/art/horse-frames.ts`, horse adapter, horsePoseFor/GameScene, original [horse master](../../art/fighter-bodies/horse-master.jpg), preparation and mount tests. Existing saddle registration is explicit; do not automatically center horse ink bounds.

## Bounded work

- Author a complete original trot/run cycle, not two alternating leg pictures. Idle/fleeing preserve barrel/head/hoof proportions and camera.
- Register hooves and saddle landmarks with stable scale/trim/pivots. No horse speed/state/mount-life changes.
- Align all five heroes' rider poses with the saddle through each phase. Preserve approved hero drawings; adjust presentation registration only with evidence.
- Associate the actual mountedOn rider in co-op, not always player one. Advance fleeing presentation from observed unfrozen movement where core stateTick stops. No core schema/timing/physics changes.
- Publish the complete horse pack atomically through bounded loading. No per-frame legacy horse insertion or cast-wide boot preload; remain opt-in.

## Acceptance

- [ ] Distinct complete gait cycle; stable body/mane/tack, alternating hoof contacts and no conspicuous sliding. Saddle moves coherently with the barrel.
- [ ] Pages ≤2048×2048/density 2; horse cost explicitly included in measured cache/stage limits.
- [ ] Five heroes × both facings × idle/move/sweep/mount/dismount/fleeing reviewed with actual horse. Correct 2P rider and two mounts tested.
- [ ] Saddle/ground/scale landmarks and clip hashes recorded; accepted hero pixels unchanged.
- [ ] Missing/corrupt/empty pack fallback atomic; co-op/restart/pause/hit-stop preserved without gameplay changes.
- [ ] Provenance/four-request counter durable. Cap exhaustion is a blocker, not permission to bypass it.

## Checks

Horse/saddle/mount/cache units, actual Canvas/WebGL/mobile mounted/fleeing captures, co-op/default regressions, lint/typecheck, signal, vision/prodbuild. Independent producer review follows self-check. Local commit; CMR-23 requires DONE evidence.
