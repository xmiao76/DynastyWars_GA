# CMR-15A Xu Chu — FINAL ACCEPTANCE (2026-10-13; work cmr15a-done-closeout-final)

**CMR-15A acceptance met 2026-10-13 — DONE.** Offline pack only; no runtime/catalog
activation, no CMR-15B started, never pushed.

- **Independent review:** receipt `call_01a137572247737c90df4c2a1bb7e6b4` = **ACCEPT,
  DONE eligible** (visual consistency incl. head, paced continuity, both facings).
- **Head gate:** closed **UNVERIFIED_OWNER_ACCEPTED** under the pre-authorized grant
  limitation (beard conceals chin/beard-base endpoint; RAW/unreadable on every banked
  cell) — every other gate passes and visual consistency was independently reviewed.
  This is owner-accepted unverified, NOT a measurement pass. Hidden 3D ground/contact
  likewise remain unverified (raster content-bottom evidence only).
- **Weapon waivers (exact hashes only, FAIL retained NOT PASS, no blanket/transfer):**
  charge cell3 `a0aec6aa…` +8.54u / cell4 `3c864aa1…` −5.71u (spread 20.49%);
  combo cell1 `df6196ff…` +3.46u / cell3 `18c68a00…` +5.98u (9.54%);
  heavy cell3 `e5e234f9…` +3.64u / cell4 `57190b6f…` +7.72u (11.84%);
  fall cell0 `5c8bf0db…` +0.69u (4.68%);
  getup cell0 `23667b4b…` −3.06u / cell1 `6420114d…` −4.12u (5.85%).
  Walk/misc carry 0 weapon waivers. Full hashes: [PACK-REPORT](PACK-REPORT.md).
- **Pack:** 36 frames/36 unique, manifest `d0545e85…`, 1 page 1979×1186 ≤2048,
  density 2, decoded 9,388,376/16,777,216 B; ledger Xu Chu 29/global 196 (ceilings 32/199).
- **Final verification (2026-10-13, this work):** `npm run lint` PASS (exit 0, clean
  after lint cleanup `b62ed43`); `npm run typecheck` PASS (exit 0); targeted motion
  units `npx vitest run` on pack-projection + motion-{catalog,scope,profiles,budget,
  retouch,review-core,actions,transitions,guides} = **103 pass / 1 skip, 0 fail**;
  `test/game/arm-chain.test.ts` = 14 pass / **1 fail = documented G6 baseline only**
  (`G6 the far fist never paints over the near arm`). Suites that read the Guan Yu
  sheet/`prepared.json` (motion-pipeline/repack/runtime/clips/weapon-arc) were
  deliberately NOT rerun against the pre-existing unstaged dirty Guan Yu edits;
  prior closeout (`977be88`) stash-verified the committed tree on those suites as
  baseline-only G6 (59 pass/1 G6, dirty files restored untouched). No Xu Chu test fails.
- **Carried to CMR-15B (unchanged):** head UNVERIFIED_OWNER_ACCEPTED limitation,
  exact-hash weapon waivers above, hidden 3D ground/contact unverified, pack not
  activated in production catalog — runtime/capture integration is CMR-15B only.
