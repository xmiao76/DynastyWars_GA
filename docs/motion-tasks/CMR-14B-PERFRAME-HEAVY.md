# CMR-14B per-frame heavy probe — PREPARATION ONLY (14B-PERFRAME-STRATEGY)

Work `cmr14b-perframe-prep`. Zero image generation, zero ledger change in this package.

## 1. Owner grant (quoted verbatim)

"14B-PERFRAME-STRATEGY: Fund at most 4 single-pose EDIT requests (Xiahou 37→41 as an explicit over-ceiling exception, global ≤171/200), heavy family only. Edit one key at a time using the original heavy cell as the ONLY pose reference (preserve the CHOP/FOLLOW down-right low drive) and change only the spear length. Reserve before each call; stop at the first choreography change; no new waivers. Gate each candidate; record the result and re-block if it fails."

## 2. Scope limits stated explicitly

- Walk and misc remain residual (see [autonomous final](CMR-14B-AUTONOMOUS-FINAL.md)), so **14B cannot reach DONE in this grant** — at best one heavy-family probe step.
- 4 funded requests < 5 heavy keys, so **at most 4 keys can be repaired**. The heavy family can only fully pass if a key already in band exists.
- Truth from the metrics doc ([heavy metrics](CMR-14B-CORRECTION-HEAVY-METRICS.md)): **no key is already in band** — all five normalized lengths (309.725 / 337.426 / 371.022 / 357.932 / 387.592, ±6.4) lie wholly below [404.1605167916991, 446.70372908556226]. So a full heavy-family pass is **not achievable** within 4 requests alone; this probe can at most shorten the residual list.

## 3. Original heavy source

- Path: `art/motion/xiahoudun/correction-campaign/heavy/heavy-edit-source.png`
- SHA-256: `e5a7c00ff3b7144dc8db2e918f019323e0452f458553594fd20391181fae68af` (verified live this package; 1536×1024)
- Decoded RGBA SHA per metrics doc: `9ee5629fd13d0b2aea5e61d04f7105a4574aa033a15a44ea871be71a383e10cf`

## 4. Heavy key cell geometry (justified, not assumed)

Rectangles from `art/motion/xiahoudun/correction-campaign/heavy/source-audit.json` `crops[0..4]` (L269–L329), quoted in metrics doc § "Actual original full crop rectangles":

| key | name | source rect (x,y,w,h) | cell size |
|---|---|---|---|
| heavy:0 | RAISE | (0, 0, 512, 550) | 512×550 |
| heavy:1 | HOLD | (512, 0, 512, 550) | 512×550 |
| heavy:2 | CHOP | (1024, 0, 512, 550) | 512×550 |
| heavy:3 | FOLLOW | (0, 550, 570, 474) | 570×474 |
| heavy:4 | RECOVER | (570, 550, 550, 474) | 550×474 |

Layout: top row c0/c1/c2 (3× 512 wide, 550 high = full 1536 width); bottom row c3 (570 wide) + c4 (550 wide) starting at y=550, height 474 (550+474=1024). Bottom-row widths sum to 1120, not 1536 — these are real audit offsets, NOT an assumed 518×512 or uniform panel grid (metrics doc says so explicitly). Mapping heavy:0..4 → c0..c4 in order per metrics table.

## 5. Cell crops (1:1 pixel copies, no resize)

Method: Node `@napi-rs/canvas`, `drawImage(img, x, y, w, h, 0, 0, w, h)` — integer 1:1 copy, no scaling/resampling; output PNG re-encoded (file bytes differ from audit PNGs by encoder only). Pixel-verified: 0 differing bytes vs existing `c0..c4-full-native.png` decoded RGBA for all five (1126400 / 1126400 / 1126400 / 1080720 / 1042800 bytes compared).

| file | rect | bytes | SHA-256 |
|---|---|---:|---|
| `art/motion/xiahoudun/perframe-heavy/heavy-k0-original-cell.png` | (0,0,512,550) | 197882 | `9c4234e9dec22da909dc32bb26e673a74daf6112602eec91b46394c3f4a8fdd5` |
| `art/motion/xiahoudun/perframe-heavy/heavy-k1-original-cell.png` | (512,0,512,550) | 211977 | `a8890213bf5a191dda2de5e4cd3591f1625e24741222caaa828cd1c974d9b4b9` |
| `art/motion/xiahoudun/perframe-heavy/heavy-k2-original-cell.png` | (1024,0,512,550) | 184471 | `ccbca3e2346c6810a7653fee767c5ee229133a89803e9371cd7c5d15d4e98521` |
| `art/motion/xiahoudun/perframe-heavy/heavy-k3-original-cell.png` | (0,550,570,474) | 178983 | `49b5de417e6a4172916111c713df5158e2627de869dc3dcb5d99518064fdd355` |
| `art/motion/xiahoudun/perframe-heavy/heavy-k4-original-cell.png` | (570,550,550,474) | 196919 | `f68c18249862df41d4c520eb4cb5b977ae5939db3e1925e37b03aa08ad35c4cd` |

## 6. Lengths, band, factor, target formula

- Body factor (frozen per [body review](CMR-14B-CORRECTION-HEAVY-BODY-REVIEW.md), from guard 315 / recover 396 ≈ 0.795 → 0.80): **0.80** for all five keys. Guard stays 1.00.
- Target band (normalized units): **[404.1605167916991, 446.70372908556226]**, center 425.43212293863064.
- Relation: `normalized = native × 0.80`.
- Formula into the cell's own pixel units (crop is 1:1, so cell px = native source px): **`target_cell_px = target_normalized / 0.80 = target_normalized × 1.25`**.
- Converted band: **[505.2006459896238, 558.3796613569527] cell px**, center **531.7901536732883 cell px**.
- Current lengths:

| key | native L (cell px) | normalized (×0.80) | ±6.4 interval | verdict |
|---|---|---:|---|---|
| heavy:0 | 387.156299187 | 309.725039350 | 303.33–316.13 | OUT-LOW (−94.44 to center) |
| heavy:1 | 421.783119624 | 337.426495699 | 331.03–343.83 | OUT-LOW (−66.73) |
| heavy:3 | 447.414796358 | 357.931837086 | 351.53–364.33 | OUT-LOW (−46.23) |
| heavy:2 | 463.777964116 | 371.022371293 | 364.62–377.42 | OUT-LOW (−33.14) |
| heavy:4 | 484.489421969 | 387.591537575 | 381.19–393.99 | OUT-LOW (−16.57) |

- Extension needed to band-low / band-center (cell px): k0 +118.04/+144.63; k1 +83.42/+110.01; k3 +57.79/+84.38; k2 +41.42/+68.01; k4 +20.71/+47.30.
- Request order (shortest spear first): **[0, 1, 3, 2, 4]**. First: **heavy:0**.

## 7. First-key prompt and plan

- `art/motion/xiahoudun/perframe-heavy/prompt-k0.txt` — single-pose edit of the k0 cell only (target center 531.79 cell px, acceptable 505.20–558.38).
- `art/motion/xiahoudun/perframe-heavy/plan.json` — keys, crops+SHA, current/target lengths, order, ledger-before, caps. Parses as JSON.
- Ledger before (read live, NOT modified): Xiahou `used` 37, summed global **167** (= 17+8+8+7+12+15+25+20+14+37+2+2). Caps for this grant: **Xiahou ≤ 41, global ≤ 171** (totalCap 200; nominal role cap 12 explicitly exceeded by this grant's over-ceiling exception).

## 8. Uncertainties / handoff notes

- Bottom-row empty area (1536 − 1120 = 416 px at right of y 550..1024) is unused per audit rects; not probed.
- Endpoint localization tolerance ±4 native px per end (±6.4 normalized) retained from metrics doc; prompt targets band center so even ±6.4 stays in band (center 425.43 ± 6.4 = 419.03–431.83, inside 404.16–446.70).
- Direction/static-spread gates for edited candidates are UNRUN (future gate step, not this prep).
- No ledger, source-art, runtime, AGENTS.md, or .loop edits in this package; no commit; no `image_generate`.

## 9. Result — request 1/4 (heavy:2 CHOP, k2) GATED FAIL, strategy STOPPED (2026-10-12, work cmr14b-perframe-record, zero generation in this record package)

- Reservation (before the call, `perframe-heavy/reservation-k2.json`): request 1/4 = heavy:2 CHOP. Ledger Xiahou 37→38, heavy 5→6, global 167→168 (168/200). Grant ceilings (Xiahou ≤41, global ≤171) unchanged.
- Attempts under the same reservation: (1) first `image_generate` REJECTED at the harness — malformed reference missing the `"sha256:"` prefix, zero output, no image; (2) retry served: candidate SHA-256 `4e314e2119d063d08ef1976c32e22a24a132109f229a811fcd50d3c4c0c3a638`, 1024×1024 JPEG, grok requested, serving provider UNCONFIRMED (`candidate-k2-evidence.json`; raw at `perframe-heavy/candidate-k2-raw.jpg`).
- Manager gate (`perframe-heavy/candidate-k2-gate.json`; manager opened `compare-k2.png` and `candidate-k2-marked.png`): choreography PRESERVED — down-right low drive, both hands low on the shaft, same crouch. Angle 29.76° vs 30.16° (Δ −0.40°). Body scale s1 = 377/755 = 0.49934 (topknot→boot). Spear 979.13 px → L = 488.92 cell px (normalized 391.1). Original was 463.78 (371.0). Band 505.20–558.38 cell (404.16–446.70). LENGTH OUT_LOW by 16.3 cell px. Candidate NOT accepted; no new waiver.
- Disposition: per the grant ("record the result and re-block if it fails"), the strategy is STOPPED after request 1. Remaining 3 requests NOT spent: unused, not carried forward. Reason: length gate failed. Even 4 successful edits could not pass the heavy family (5 keys, all OUT_LOW); walk/misc remain residual, so 14B cannot complete under this grant.
- Finding: per-frame editing preserved the choreography, unlike the whole-sheet heavy1 edit, but undershot the requested extension (asked +68 px, delivered +25 px in original-normalized cell px).
- Exact residuals: walk 1–8 alternating gait unproven; heavy 0–4 spears all short (k2 candidate at 391.1 still short); misc 2/4 short. Legacy runtime default unchanged; no runtime/source changes. See `perframe-heavy/disposition.json`.
