import { readFileSync, writeFileSync } from 'node:fs'

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 12:15 UTC - BODY-24 (attempt 1, IN_PROGRESS, motion engine core)

- Status before: BODY-24 TODO (queue pick: V-14 closed; BODY-7 and
  ENH-12 are owner-gated; BODY-24 is the first TODO by file order).
- Work completed (uncommitted - not verified end to end): the motion
  engine CORE - src/game/art/interpolate.ts: lerpSkeleton (exact
  endpoints, short-path angles, nearer-key flags, anchor blend),
  blendEase (smoothstep - walk keys ease, not snap), torsoLean
  (upper body rotates about the pinned hip; hands stay put so the
  IK refills the arms) and leanEnvelope (sine arch peaking
  mid-transition, signed by strike direction). Tests:
  test/game/interpolate.test.ts 6/6 (endpoints exact, monotone
  easing, angle wrap, flags, lean determinism, envelope shape) and
  test/game/body24-frames.test.ts green - the reach/legibility
  acceptance pillar: face-clear + figure-ink on INTERPOLATED frames
  (heroes x windup->attack + attack->recover x t=0.25/0.5/0.75).
  Finding recorded: the raw blend sweeps huangzhong's bow through
  the face mid-transition (63px at t=0.25), but the RENDERER derives
  the weapon through weaponPose on every frame and its fits re-clear
  it - measured on the engine's actual path the interpolated frames
  pass. Draw-side is interpolation-ready.
- Remaining: the sprite wiring (adapters/sprites.ts blend textures +
  GameScene's pose-swap queue inserting 2 in-between frames per
  transition), the motion-review re-capture (acceptance 1) and full
  gates + commit. Design: blend frames = lerpSkeleton(from, to, t) +
  leanEnvelope, t in {1/3, 2/3} inserted at the pose swap (2 render
  frames; sim timing untouched).
- Verification run: interpolate 6/6, body24-frames green; lint
  pending on the new files (not yet run - entry honest).
- Files changed (working tree, uncommitted): src/game/art/
  interpolate.ts (new), test/game/{interpolate,body24-frames}.test.ts
  (new), TASKS.md (IN_PROGRESS mark).
- Result: core landed + gated; wiring pending.
- Status after: BODY-24 IN_PROGRESS (attempt 1 of 3).
- Remaining work or blocker: the wiring/review/gates above.
- Next recommended task: continue BODY-24 (attempt 2).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok')
