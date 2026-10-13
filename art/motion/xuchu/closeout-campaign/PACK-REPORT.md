# CMR-15A Xu Chu — offline pack report (Phase D prep, 2026-10-13)

Offline pack preparation only. Not activated in runtime/catalog, no CMR-15B,
zero image generation. CMR-15A is **not DONE**: this pack is ready for
independent review only.

## Verified pack (finish verification, work cmr15a-phase-d-pack-finish, no rebuild)

Fresh re-hash with no rebuild (no hash mismatch found, so none was run):

- **Sources:** all 36 banked accepted cells re-hashed and match the pins in
  `scripts/prepare-xuchu.mjs` and `art/motion/xuchu/registration.json`
  (36/36, 0 bad). walk:2 `accepted.png` is byte-identical to
  `candidate-raw.jpg` (`893c90d7…`); its keyed (`48c0f327…`) and
  registered-512 (`abfa712b…`) rasters in `13-pack/` re-hash match.
- **Manifest:** file SHA-256 `d0545e8575a24704d9f923173af3de5656a213b907e8f35d57632f4197e27266`
  = the recorded `manifestSha256` in registration + `13-pack/pack-measurements.json`
  (deterministic: true at build).
- **Frames:** 36 frames / 36 unique (walk 6, charge/combo/heavy/misc/fall/getup
  5 each); no alias (getup:0 distinct from fall:4); 0 suspects; counts
  sourceCells 63, displayedUniqueDrawings 36, duplicateSourceCells 0,
  unusedSourceCells 27. Report identity restored hashes match manifest 36/36.
- **Page/density/decoded:** 1 page `xuchu-1` 1979×1186 (≤2048; PNG IHDR agrees),
  page file SHA-256 `6e49fd2749fcde3813185d8520af36db5ec796baecb3285359215cf45fc49348`;
  density 2, box 260×144/groundY 136; decoded/gpu 9,388,376 B of 16,777,216 B cap
  (56.0%), trim 7,539,512 B (recomputed from manifest trims, matches), no frame
  rect exceeds the page; base 0.483278, fit bound 0.488160 (heavy:1 height),
  0 budget step-downs, walk guard 221.82 density-2 px, max |content bottom vs
  nominal ground| 1.04u.
- **Contact sheet inspected:** `artifacts/motion/xuchu/review/contact-gameplay.png`
  (`f830473c…`; 2x `46c5e676…`) personally opened — all 36 frames present in play
  order, on the shared ground line, none visibly clipped; identity/armour/glaive
  consistent across all families.
- **Ledger unchanged:** `93c05899…`, Xu Chu 29 (walk13/charge2/combo2/heavy5/
  misc2/fall2/getup3) / global 196, ceilings 32/199.

Outputs: `artifacts/motion/xuchu/{manifest.json,report.json,pages/xuchu-1.png,
review/contact-gameplay.png,review/contact-2x.png}`,
`art/motion/xuchu/registration.json`, `13-pack/` (pack-sheets, walk2 finishing,
pack-measurements). Both trees are gitignored; they are force-added in the
Phase D pack commit.

## Consolidated deviations (once, batch end) — exact hashes, FAIL retained NOT PASS

Frozen band [124.41,137.50]u. Every cell below is fully measurable with every
other gate PASS; waivers are exact-hash only, no blanket/transfer. walk and
misc carry **0** weapon waivers.

| Family | Cell (exact SHA-256) | Deviation | Resulting spread |
|---|---|---|---|
| charge | cell3-crushing-dash `a0aec6aaacaa9f871c41d0ad0971d56aae9e28d20d440f2482fa3e6453874b69` | 146.04u OUT_HIGH +8.54u | 20.49% NOT PASS waived |
| charge | cell4-brake `3c864aa12b4de8d157013d7431b0aaeaceb51d377c4724f3c94812de8369a374` | 118.70u OUT_LOW −5.71u | (same set) |
| combo | cell1-rising-cut `df6196ff6cc638f6f8319ad18803a03ad7ab1ee82565545fc6d898d05e08a3e9` | 140.96u OUT_HIGH +3.46u | 9.54% NOT PASS waived |
| combo | cell3-sweep `18c68a0075163b7245a272413eca488be3a0ee6b2fc30dcfa0a7b2120bdbbda3` | 143.48u OUT_HIGH +5.98u | (same set) |
| heavy | cell3-follow-through `e5e234f917bcfdf4c31d8db0bb5c8515d7b52dad50e8adaba818b3220b939fc9` | 141.14u OUT_HIGH +3.64u | 11.84% NOT PASS waived |
| heavy | cell4-recover `57190b6f0d3e7b26b868ecb4e6d89a3ca6dad4b399e3db7104adcfb1861ae9a8` | 145.22u OUT_HIGH +7.72u | (same set) |
| fall | cell0-topple `5c8bf0db47605c728b6d82f151ed43c1245c6daa5f81e9a2289945f62ca447df` | 138.19u OUT_HIGH +0.69u | 4.68% NOT PASS waived |
| getup | cell0-down `23667b4bfee165093c892a99144e571b045e4414dc16fb410b9ed746a7767cf9` | 121.35u OUT_LOW −3.06u | 5.85% (resulting spread of waived cells) |
| getup | cell1-elbow `6420114d1a81072f35b2da0f35552d36b81e4674cb2f040b6395e927e814b56b` | 120.29u OUT_LOW −4.12u | (same set) |

## Head / unverified status

Head endpoint is RAW/unreadable on every banked cell (beard conceals the
chin/beard-base endpoint); `report.json` records camera/ground/saddle/landmarks
`unverified` and identity entries unpinned by the pipeline. The head-size gate
therefore remains **UNVERIFIED** in this pack. It may close as
UNVERIFIED_OWNER_ACCEPTED only at batch end if every other gate passes **and**
visual consistency is independently reviewed (pre-authorized limitation) — that
independent review has **not yet happened**, so no owner-accepted closure is
claimed here. Hidden 3D ground/contact also remain unverified (raster
content-bottom evidence only).

## Status for independent review

Pack is complete and hash-verified offline. Remaining before any DONE:
independent review (visual consistency incl. the head ruling, paced continuity,
both facings) and its ACCEPT; no runtime/15B work in this grant.

## DONE closeout attempt (2026-10-13; work cmr15a-done-closeout-rerun) — NOT DONE, lint FAIL

- **Independent review receipt `call_01a137572247737c90df4c2a1bb7e6b4` = ACCEPT,
  DONE eligible** (recorded as fact). Head closure UNVERIFIED_OWNER_ACCEPTED is
  **NOT applied** in this attempt because the PROJECT checks below do not all
  pass; head remains **UNVERIFIED** until the lint failure is fixed and the
  closeout reruns.
- **Checks (exact):** `npm run typecheck` PASS (exit 0). `npm run test` (full
  units incl. CMR-04 prepare/quality/negative-control + CMR-05/motion suites):
  working tree 997 pass / 10 fail / 6 skip (1013) — 1 documented historical G6
  baseline (`arm-chain.test.ts > G6 the far fist never paints`) + 9 Guan Yu pack
  failures (motion-pipeline 1, motion-repack 1, motion-runtime 7) proven caused
  solely by the pre-existing unstaged edits to
  `src/game/assets/motion/guanyu-motion-sheet.png` + `prepared.json` (with only
  those two files stashed, the four suites rerun 59 pass / 1 fail = G6 only;
  stash popped, dirty files restored untouched). So committed-tree units =
  baseline-only G6; no Xu Chu test fails.
- **`npm run lint` FAIL — the blocker:** 53 errors, 0 warnings, all
  `@typescript-eslint/no-unused-vars` (49) / `no-useless-assignment` (4) in 22
  committed campaign measurement scripts: 52 in 21 files under
  `art/motion/xuchu/closeout-campaign/**` (e.g. unused `regionHashBefore`,
  `copyFileSync`, `existsSync` ×15 each; `regBuf` ×4) + 1 in
  `art/motion/xuchu/proof-of-control/gate-walk2.mjs:44` (`candRearToe1024`).
  This is pre-existing at HEAD `4f5bfd5`, is **not** the documented G6 baseline,
  and 1 file sits outside this package's write scope, so lint cannot go green
  here. Per closeout rules CMR-15A is therefore **NOT marked DONE**.
- **Next action (one scoped package):** remove the 53 unused vars/assignments
  in those 22 `.mjs` files (no behavior change; do not alter gate outputs),
  rerun typecheck/lint/test, then apply head UNVERIFIED_OWNER_ACCEPTED, mark
  DONE, and commit. All waivers/head limitation/carried limitations above are
  preserved verbatim for CMR-15B; no runtime activation, no 15B start.

## FINAL acceptance (2026-10-13; work cmr15a-done-closeout-final) — CMR-15A DONE

Supersedes the NOT-DONE attempt above. Lint cleanup `b62ed43` removed the 53
errors. Final checks: `npm run lint` PASS (exit 0); `npm run typecheck` PASS
(exit 0); targeted motion units (pack-projection + motion-{catalog,scope,
profiles,budget,retouch,review-core,actions,transitions,guides}) **103 pass /
1 skip / 0 fail**; `arm-chain.test.ts` 14 pass / 1 fail = documented G6
baseline only. Guan-Yu-sheet-reading suites (motion-pipeline/repack/runtime/
clips/weapon-arc) were not rerun against the pre-existing unstaged dirty
Guan Yu edits; the prior closeout stash-verified the committed tree on them
as baseline-only G6 (59 pass/1 G6). No Xu Chu failure.

Independent review receipt `call_01a137572247737c90df4c2a1bb7e6b4` ACCEPT stands.
With every other gate passing and visual consistency independently reviewed,
the head-size gate is now closed **UNVERIFIED_OWNER_ACCEPTED** under the
pre-authorized grant limitation (beard conceals the chin/beard-base endpoint;
RAW on every banked cell — owner-accepted unverified, not a measurement pass).
Hidden 3D ground/contact remain unverified. All exact-hash weapon waivers in
the table above are preserved verbatim (FAIL retained, no blanket/transfer)
and carried to CMR-15B. **CMR-15A acceptance met 2026-10-13 = DONE**; pack
remains offline/not activated; no 15B started. See
[FINAL-ACCEPTANCE](FINAL-ACCEPTANCE.md).
