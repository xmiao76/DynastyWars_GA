import { readFileSync, writeFileSync } from 'node:fs'

const prog = readFileSync('PROGRESS.md', 'utf8')
const at = prog.indexOf('## Entries\n')
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 10:35 UTC - UIR-15 (attempt 1, IN_PROGRESS, timeboxed)

- Status before: UIR-15 TODO (owner V-14 J6: both arms run parallel
  under the haft like rails in two-handed strikes).
- Work completed (uncommitted - not verified): strike-flagged poses
  (attack/attack2/thrust/chop) spread the far grip wider along the
  haft (STRIKE_MIN_SEP=18 vs 12) with a back-only rule (the far hand
  rides BEHIND the near hand) and a permissive fallback so the far
  hand never loses its hold. Baseline -> now (elbow turn at the far
  elbow; chain delta): guanyu attack 84->116 / 2->9deg, chop
  123->135 / 30->81deg; chop improved everywhere (deltas 23-33 ->
  42-84, turns +10-20). Test: test/game/uir15-strikearms.test.ts
  (grip-hold guard + turn floor + chain-divergence floors where the
  geometry allows).
- Remaining: lubu/xiahoudun/xuchu:thrust fall back to the old grip
  (turns 36/39/17 unchanged - the heavy ji/glaive thrust geometry
  finds no wide back grip within reach) and zhangliao:attack sits at
  2deg chain delta. The four pins in uir15-strikearms fail on those.
  Next: tune those fits (per-weapon grip range or a lower comfort
  target on the fallback path), then the anatomy J6 re-review + full
  gates + commit.
- Verification run: armik 17/17, handgrip 17/17 (walk grips pinned
  and held), uir13-gripwrap + proportions green (29/29 total); lint
  0 on the touched files. NOT verified: full unit, browser gates,
  J6 eye review - acceptance not claimed.
- Files changed (working tree, uncommitted): src/game/art/{armik,
  poses,rig,weapons}.ts, test/game/uir15-strikearms.test.ts (new),
  TASKS.md (IN_PROGRESS mark).
- Result: partial (chop/attack materially improved; 3 boss thrusts
  at baseline).
- Status after: UIR-15 IN_PROGRESS (attempt 1 of 3).
- Remaining work or blocker: the fallback-fit tuning above.
- Next recommended task: continue UIR-15 (attempt 2).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + 12) + '\n' + entry + prog.slice(at + 12))
console.log('ok')
