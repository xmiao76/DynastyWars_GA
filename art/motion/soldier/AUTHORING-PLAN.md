# Wei Soldier motion pack — authoring plan (CMR-06A groundwork)

Status: CMR-06A attempt 1 is **BLOCKED before any generation request**
(image-viewing capability unreliable this session; see the blocker below).
This file is the prepared groundwork so the next attempt starts at the
first image request. **No art has been generated: the request budget is
untouched (soldier 0/8).**

## Identity lock (sources inventoried; visual inspection PENDING)

| source | bytes | sha256 |
| --- | --- | --- |
| `art/fighter-bodies/soldier-body-master.jpg` | 187,637 | `73d66d7dda005cd0135dd33bdb6c05fa19a3dcdccb3a05ef6317144671c88a5d` |
| `art/mook-faces/soldier-portrait-master.jpg` | 243,493 | `b511f6e1e7a536321089dbdfee23b40569d71cc68bc56c4929417b96ec81b828` |

Mechanical pixel fingerprint (computed without viewing): both masters are
opaque, 832x1248, mostly near-black background (body 72.5%, portrait 59.0%)
with warm dark red-brown armour tones - i.e. figure masters on black. The
required human-style inspection of these images (costume/cape/headgear,
rigid weapon landmarks, size/camera/light) is the FIRST action of the next
attempt, before any request.

## Exact core data (read at implementation time, not prompt guesswork)

- `src/core/enemies.ts` `soldier`: maxHp 24, speed 0.9, attackId
  `soldier.swing`, hitstunTicks 18, thinkInterval 45, fireInterval 0 (melee).
- `src/core/attacks.ts` `soldier.swing`: damage 6, reach 24, arc 10,
  **startup 14 / active 4 / recover 20**, knockback 2, knockdown false.
- Build: light rank-and-file helmeted, sword. Weapon: rigid straight sword.

## Applicable sequence/clip manifest (mook; no hero-only capabilities)

| sequence | planned drawings | binding |
| --- | --- | --- |
| idle | 1 | state `idle` |
| walk (approach) | 4 | state `walk`, speed 0.9 |
| retreat | 2 | enemy retreat path |
| stop | 1 | shared guard bookend with idle |
| swing | windup + startup + 2 active + 3 recover + guard bookends | `soldier.swing` 14/4/20 |
| hitstun | 3 | hitstunTicks 18 |
| fall/impact/down | 4 (incl. shared `down` bookend) | knockdown path |
| getup | 2 | getup path |
| held/escape | 2 + 1 | upright held reaction / escape |
| thrown flight/impact | 2 + 2 | thrown path |
| dying/dead | 2 | death path |

No jump/mounted/special pages (unreachable for this role - contract).

## Sheet plan and request budget (5 of 8; 3 reserved for targeted repairs)

Whole-sheet candidates, one image request each, 3x3 grid at the fixed
registration (cell 512x341, sheet 1536x1024, ground at the cell's recorded
y, same camera/lighting as the identity masters, rigid sword with recorded
butt/tip landmarks, transparent background, no glow/shadow/text):

1. `locomotion`: idle, walk1-4, retreat1-2, stop
2. `swing`: guard, windup, startup, active1, active2, recover1-3, guard
3. `hitstun-held`: hitstun1-3, held1-2, escape1-2, guard bookend
4. `fall-thrown`: fall1-2, impact, down, thrown-flight1-2, thrown-impact1-2
5. `getup-death`: getup1-2, down bookend, dying1-2, dead, guard bookend

Budget enforcement: `scripts/motion-budget.mjs` `reserve('soldier', { role:
'mook', kind: 'sheet', sequence })` is called BEFORE every request, and a
focused repair uses `kind: 'focused'` against the same cap (mook cap 8,
two whole-sheet candidates per sequence max). After each sheet: review at
gameplay size and 4x (CMR-06A step 3), verdict recorded in
`art/motion/soldier/PROVENANCE.md` (prompt, ordered reference hashes,
provider preference vs actual, verdict), targeted edits only.

## Preparation path (CMR-04 toolkit, no runtime activation)

`scripts/motion-pipeline.mjs` `preparePack` with a soldier `FighterSpec`
(role `mook`, density 2, fixed box/ground) extracts the ordered cells,
cleans alpha, trims/dedups/packs to <=2048 pages, hashes restored RGBA and
pivots, and writes `artifacts/motion/soldier/` (manifest, pages, report)
while accepted sources live in `art/motion/soldier/`. `validMotionPack` /
the production catalog are NOT touched (that is CMR-06B).

## BLOCKER (attempt 1, 2026-10-01)

The image-viewing tool served wrong pixels for 4 consecutive reads of the
two identity masters (across 2 file shas, original and cache-busted copies,
fresh paths), provably: the requested files are opaque 832x1248 images with
59-72% near-black backgrounds, while the previews showed unrelated bright
game captures; one unrelated read in the same session was correct, so the
pipeline is flaky rather than dead. CMR-06A acceptance is explicitly visual
("inspect those images before authoring"; reject drift/extra limbs/forked
weapon/clipping; "Unknowns cannot establish compliance"), and per
loop policy a review is never invented. Per the contract ("If unavailable
tools ... prevent complete accepted art, record exact BLOCKED input rather
than publish a partial set"), no image was requested.

Needed to proceed: a session where the image tool serves the requested
file's pixels (verify against the fingerprint table above), or the owner
visually inspects/reviews the identity masters and generated sheets and
records the verdicts.
