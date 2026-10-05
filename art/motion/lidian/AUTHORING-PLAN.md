# Li Dian authoring plan (CMR-13A, attempt 1)

Status: 2/7 ACCEPTED; combo fix-1 REJECTED (516 overshoot, unsalvageable); fix-2 + retouch prescribed; 5/12 spent, 7 left.

## Budget (authoritative ledger: `art/motion/generation-budget.json`)

- lidian cap 12 (role: boss), used 5 (+combo fix-1, REJECTED).
  Global 117/200. Two whole-sheet candidates per sequence,
  unchanged (combo 1/2 left).
- Repair reserve 3/3 untouched (shared with CMR-13B,
  acceptance-4 only). Deterministic shaft retouch is attempted
  BEFORE any reserve image round (spec item 4).

## Sequence plan (7 sheets; no hero-only jump/mounted/special)

Boss data (read at plan time, not prompt text): hp 180, speed 1.1,
hitstun 10; charge.dash 10/18/20, sword.combo 9/4/12, sword.heavy
16/6/24; enrage at 30% hp (faster think, same art — no separate
enraged sheet; movement speed is clock, not drawings).

1. walk 9 (guard + 8-cycle; also covers idle/approach/retreat/stop
   + normal/enraged movement) — ANCHOR sheet: fixes the ONE global
   brief band from its accepted median (pack-projection gate).
2. charge 5 (crouch-coil → launch → dash ×2 → brake; charge.dash).
3. combo 5 (windup/strike/follow-through/recover ×2 + guard link;
   sword.combo with the GLAIVE, never a sword).
4. heavy 5 (raise → overhead hold → crushing chop → follow →
   recover; sword.heavy).
5. misc 5 (hurt-recoil/hurt-fold/held-clamp/held-struggle/release).
6. fall 5 (topple/airborne/tumble/impact/DOWN; flat DOWN bookend).
7. getup 5 (DOWN/elbow/kneel/crouch/rise-stand; shares DOWN).

Dying/dead reuse the fall clip (no dedicated sheet); thrown uses
fall poses. All glaives share ONE design (straight haft, crescent
head, tassel) and ONE brief band (fixed at walk, never re-centered
without owner approval — the 12A ratchet lesson).

## Process (per updated spec item 4 + recovery doc)

- After EACH sheet acceptance: run the pack-projection gate
  (`scripts/pack-projection.mjs`) against the fixed band; record
  in `art/motion/lidian/pack-projection.json`. STOP/WARN verdicts
  steer the next brief (re-brief/re-shoot/repair while cheap).
- Weapon measurement: tip-to-butt on the straight haft axis;
  foreshortened/occluded blades excluded, never passes.
- Heads: overlay-landmark protocol FIRST (crown/chin on enlarged
  fixed-scale crops of comparable upright poses, ≤10% gate);
  auto-detectors supporting evidence only.
- Deterministic shaft retouch (`scripts/motion-retouch.mjs`)
  before any reserve image round; single-cell focused edits only
  (multi-cell proven unreliable on huangzhong).
