# Weapon silhouette correction — ART-15

The owner selected legend-faithful silhouettes within the existing cel-shaded
character style. The reference identities come from
[Romance, Chapter 1](https://anthony.sogang.ac.kr/ThreeKingdoms/bc001.htm),
with the familiar [guandao profile](https://en.wikipedia.org/wiki/Guandao).
These are novel/folk visual identities, not claims about surviving weapons
owned by the historical generals. Wei Yan retains this game's long-handled dao.

## What changed

- Guan Yu: elongated cutting belly, rising sharp point, restrained rear spur.
- Zhang Fei: a narrow ribbon around an S-shaped centreline, instead of a curled leaf.
- Zhao Yun: symmetrical sharp spearhead with an unoutlined ridge and edge facet.
- Huang Zhong: slimmer recurve, hand-centred riser, continuous outlined bowstring.
- Wei Yan: near-straight spine, angled point, and a controlled single cutting edge.

Weapon geometry is shared in `src/game/art/weapons.ts`. Material facets are
clipped to the blades and omit their own black outlines. The existing figure
ink/fill/shadow/light pipeline remains shared by the cast. Jian and ji blade
paths were transferred unchanged.

The art-only grip correction moves the bow-holding arm forward, and lifts
weapons clear of prone faces. It applies to enemies using the same renderer too.
All 17 humanoids and 11 poses are checked in both facings: 374 combinations.
No combat data, hitboxes, attack timing, character dimensions or weapon
assignments changed. Huang Zhong still uses melee attacks and an arrow special.

An oversized render measured the raised guandao reaching 24 units above the
body. Shared headroom is now 27 instead of 24 to leave antialiasing padding.
`standH` and the game's displayed character height are unchanged; scale tests
remain in force. Existing horizontal margins cover the measured weapon reach.

## Why the tests changed

The old gates proved that sprites were visible, distinct and unclipped, but
could not distinguish a plausible blade from a paddle. Weapon-only tests now
measure head aspect, tip taper and serpent undulation, without the character
or background contributing. Exact pre-fix paths are retained as negative
controls: all three malformed heads are rejected, and the old bow misses its
grip. A straight spear substituted for the serpent is rejected as well.

A topology check requires the bow's string and limbs to enclose visible air.
It caught a real disconnected string: the generic capsule's crossed fill
left a gap when rendered without ink. The weapon string now uses a closed
strip with the normal dark outline. No global limb geometry or verification
threshold was changed to accommodate it.

## Reproduce the visual review

```powershell
node scripts/weapon-review.mjs after --quick
node scripts/weapon-review.mjs after
```

The script owns local port 5177 and closes its server/browser on completion.
`--quick` captures the comparison sheet, all-pose sheets in both directions,
and uncropped bounds/face measurements. The full run also captures each
hero's idle, windup, strike and recovery on desktop and phone, in both
directions, plus compact attack-sequence sheets.

The before images were rendered from CX baseline commit `1e5e3f4`. GA preserves
those PNGs as local evidence but has an independent Git repository, so that
historical commit is not available via `git archive` in GA. The generated
baseline source directory/archive was deliberately not copied. Compare the
preserved before/after images directly; the `after` commands above still work.
Reconstructing the old baseline is an owner-only historical operation using a
separate export from CX into GA's ignored `artifacts/weapon-review/baseline`;
do not assume the commit exists in GA or let an ordinary loop modify CX.

Compare these local artifacts:

- `artifacts/weapon-review/weapon-shapes-before.png` and `weapon-shapes-after.png`.
- `pose-sweep-right-after.png` and `pose-sweep-left-after.png`.
- `sequence-desktop-right-before.png` and `sequence-desktop-right-after.png`.
- `sequence-phone-right-before.png` and `sequence-phone-right-after.png`.
- Matching left-facing sequences and full-size individual screenshots alongside them.

Review the images at gameplay size as well as enlarged; metrics alone cannot
establish visual authenticity. Before/after screenshots are generated evidence
and remain local under the repository's existing artifact ignore rule.

## Validation

| Check | Result |
| --- | --- |
| Lint and TypeScript | Passed |
| Unit suite | 178 passed |
| Weapon/art focused gates | 33 passed, including all 374 face-clearance cases |
| Browser end-to-end suite | 44 passed |
| Self-play signal | 13 passed, including the nine-stage campaign |
| Visual signal | 5 passed, including Canvas/WebGL parity and negative controls |
| Production build and browser gate | Build succeeded; 4 passed |
| Visual review | Before/after sheets, all hero poses in both facings, desktop and phone sequences reviewed |

The pre-fix geometry failed four new regressions before the redraw. A further
bow continuity test failed on the disconnected string and passed after its
closed-strip correction. The final browser results were collected with the
renderer unchanged throughout the run.

No verification thresholds were relaxed. Logs, geometry measurements and
screenshots are in `artifacts/weapon-review/`.

Deployment remains owner-only through deploy.bat. This change makes no cloud
changes and does not publish the game.