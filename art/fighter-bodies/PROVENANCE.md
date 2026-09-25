# Fighter body masters — provenance

Original semi-realistic painted full-body masters generated 2026-09-24/25
via the project's image-generation provider (grok), one per fighter, each
keyed to its ART-18 head sheet (heroes) or to the Guan Yu body master
(mooks, for brushwork consistency). Neutral spread-limb cutting poses on
plain black backgrounds, no weapons.

- `guanyu-body-master.jpg`, `zhangfei-body-master.jpg`,
  `huangzhong-body-master.jpg`, `weiyan-body-master.jpg`,
  `zhaoyun-body-master.jpg` (BODY-3)
- `soldier-body-master.jpg`, `spearman-body-master.jpg`,
  `archer-body-master.jpg` (BODY-4)

Preparation (`scripts/prepare-body-parts.mjs`) cuts oriented part quads
from eyeballed joint tables (visible landmarks: fingertips, boot soles;
rig joints derived: palms at 75% elbow->tip, ankles 8% above soles),
derotates to vertical cells, keys black by border-seeded flood
(tolerance 10), and shades far-side parts 0.82. Shipping derivatives live
under `src/game/assets/{hero,mook}-bodies/` with sha256 + content
signatures in `prepared.json`.

No copied Capcom sprites, TV actors, or modern costumes. Earlier
relaxed-pose pilots are preserved under `artifacts/look/body1-*-pilot.jpg`.
