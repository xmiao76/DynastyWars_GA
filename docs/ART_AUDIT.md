# Art-materials completeness audit (BODY-18)

Owner round 3 (d): "review all art/image materials to ensure each part is
completed and no parts are missing." Generated and guarded by
`test/game/artaudit.test.ts`. That test also writes
`artifacts/look/audit/<id>-cells.png`, which lays every painted cell on a
grey ground for the visual pass, plus `inventory.json`. Every cell sheet
for all 17 fighters was looked at. The comments below are from that look,
not from the numbers alone.

## 1. What the renderer draws, per part, and where it comes from

| Part | Source today | All 17 fighters? | Visual verdict | Gap -> task |
|---|---|---|---|---|
| Portrait (select/HUD) | painted, `*-faces/<id>-portrait.png` | yes | fine | - |
| Head (in game) | painted, `<id>-head.png` (3 views) | yes | fine, ratio 1:5.0-6.2 | - |
| Head rear layer (hair/queue behind body) | painted `<id>-rear.png` | yes | fine | - |
| Head front layer (beard over chest) | painted `<id>-front.png` (bearded); intentionally empty 525 B image (8 beardless) | yes | fine; empty-by-design asserted | - |
| Torso | painted cell | yes | fine; see holes, G6 | G6 -> BODY-23 |
| Upper arms N/F | painted cells | yes | fine | - |
| Forearms N/F | painted cells, **cut from T-pose masters, ending in an OPEN PALM** | yes | the palm reads as a flesh paddle under the procedural fist: "two hands" | G2 -> BODY-19 |
| Thighs/shins N/F | painted cells | yes | fine; see holes, G6 | G6 -> BODY-23 |
| Cloth/cape | **procedural flat polygon** (no cloth cell is cut) for the 6 caped plans: guanyu, zhaoyun, lubu, caocao, zhangliao, zhanghe | no painted source | a flat single-tone sheet behind painted armour | G5 -> BODY-23 |
| Near grip fist | painted cell `gripN` on the body sheet, skin-matched | all 17 | soft-shaded fist, no ink | G1 resolved by BODY-20 |
| Far grip fist + fingertips | painted cells `gripF` + `wrapF` (far shaded) | all 17 | fist rides under the haft, fingertips cross over it | G1 resolved by BODY-20 |
| Relaxed far hand | painted cells `relaxN`/`relaxF` (open hands) | all 17 | - | G1 resolved by BODY-20 |
| Weapon (haft, head, tassel, ferrule, butt) | painted shared sheet `weapons-sheet.png`, 7 kinds + tassel | all 17 | wood/steel/brass/cloth, no ink; same length/grip/rotation | G4 resolved by BODY-21 |
| Boots | **procedural** overlay (`drawBoot`) over the painted shin cells | code for all | tan/brown pills; they hide the painted boot | G8 -> BODY-23 |
| Neck | **procedural** flat skin tube (`limbPath(neck, chest)`) | code for all | a flat skin wedge over the painted collar (Lu Bu, Xiahou Dun, Xu Chu, soldier) | G7 -> BODY-19 |
| Horse (mount) | painted `horse/horse-sheet.png` from `horse-master.jpg` | 1 shared | fine (ART-era review) | - |

## 2. Gaps (each traced to its fixing task)

- **G1 - RESOLVED by BODY-20.** Five painted hand cells per fighter now
  ride the body sheets (`gripN`/`gripF` fists, `relaxN`/`relaxF` open
  hands, `wrapF` far fingertips), skin-matched from the joints table,
  soft-shaded with no ink. The procedural capsules remain only as the
  no-art emergency path (drawn for no production fighter today).
- **G2 - forearm cells end in open palms.** The T-pose masters show
  splayed hands. The prep script cuts elbow->fingertip and puts the hand
  joint at 75%, so the palm and fingers stay in the forearm cell.
  -> BODY-19 (cut at the wrist; the hand becomes its own cell/state).
- **G3 - Wei Yan's forearm cells are nearly all hand** (19-21% fill). His
  wide sleeve ends above the elbow line in the master, so a wrist cut
  would leave an almost empty cuff. -> BODY-19 must re-cut Wei Yan with
  the sleeve end in the forearm cell (sleeve drape to the wrist).
- **G4 - RESOLVED by BODY-21.** One shared painted sheet carries all 7
  weapons + the tassel on the SAME procedural geometry (length, grip,
  rotation unchanged; silhouette IoU>0.8 vs the traces, drawn width
  within 3u, reach gates re-verified on painted renders). Boot
  signature-verifies the pack; a missing/corrupt pack falls back to the
  procedural weapons for the whole cast.
- **G5 - capes are procedural** on the 6 caped plans. -> BODY-23.
- **G6 - keyed holes in dark costumes.** The black-ground flood key
  (tolerance 10) eats near-black lacquer and cloth. Interior-hole share
  by row span: Cao Cao 16-36% on every cell, Xiahou Dun 12-22%, Zhang
  Liao 8-24%, Zhang He 11-21%, Lu Bu shinF 23%. In game this reads as
  moth-eaten, speckled edges on the boss bodies. -> BODY-23 (re-key with
  an interior fill / matte, not a looser tolerance). The audit test
  ratchets the ceiling at 40% today; BODY-23 lowers it to 8%.
- **G7 - flat neck tube** over the painted collar. -> BODY-19.
- **G8 - procedural boots** hide the painted boots in the shin cells.
  -> BODY-23 (let the painted boot show; keep only a ground-contact
  shadow).

## 3. Every master under `art/` and its consumer

| Directory | Files | Consumer | Disposition |
|---|---|---|---|
| `art/fighter-bodies/` | 17 `<id>-body-master.jpg` + `horse-master.jpg` + PROVENANCE | `scripts/prepare-body-parts.mjs` (17), `scripts/prepare-horse.mjs` (horse) | live |
| `art/hero-faces/` | 5 x heads + portrait masters (png), preparation.json, PROVENANCE | `scripts/prepare-hero-faces.mjs` (walks the directory) | live |
| `art/mook-faces/` | 3 x heads + portrait masters | `scripts/prepare-mook-faces.mjs` | live |
| `art/boss-faces/` | 9 x heads + portrait masters | `scripts/prepare-boss-faces.mjs` | live |
| `art/ui-title/` | `keyart-master.jpg` + PROVENANCE | `scripts/prepare-title-art.mjs` | live |
| `art/raw/` | 109 tiny (85-663 B) `<kind>-<pose>.png` | legacy `scripts/bake-art.mjs` / `make-sample.mjs` sample pipeline -> `public/assets/` | **placeholder, inert.** The shipping build carries no `public/assets/manifest.json` (vite `hasBakedArt` false). The audit asserts they stay placeholder-sized and that no manifest exists. |

No orphans: every master is named by, or walked by, a prep script, and
every fighter has its body, heads and portrait masters (all asserted).

## 4. Visual pass of the painted cells (all 17 sheets)

- Heroes/mooks (guanyu, zhangfei, huangzhong, zhaoyun, weiyan, soldier,
  spearman, archer): cells are clean and complete. Every forearm ends in
  a splayed palm (G2). Wei Yan's forearms are hand-only (G3).
- Bosses: Lu Bu, Xu Chu, Cao Ren, Xu Huang and Li Dian are clean. Cao Cao
  is the worst: speckled holes through the whole black robe. Xiahou Dun,
  Zhang Liao and Zhang He have ragged, holed hems and greaves (G6). Lu
  Bu's far upper arm is mostly purple drape (37% fill). It reads, but as
  a thin arm.
