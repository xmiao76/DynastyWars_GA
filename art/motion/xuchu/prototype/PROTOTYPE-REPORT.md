# CMR-15A zero-generation local prototype — diagnostic ONLY

**Not acceptance evidence. No status change: CMR-15A stays BLOCKED / WAITING_FOR_OWNER.
Zero image generation, zero reservations, zero ledger writes.** Built deterministically by
[build-prototype.mjs](build-prototype.mjs) from existing Xu Chu pixels only (rerun:
`node art/motion/xuchu/prototype/build-prototype.mjs`, node --check + eslint PASS).
All outputs, the donor cell and the original cell were opened and inspected in this package.

## Donor choice

**Candidate-1 walk:4** (sheet cell origin 512,512 in `walk-candidate-1.png`). It is the only
existing key whose support side is opposite to walk:2 — screen-right boot planted, screen-left
leg genuinely lifted/bent off the ground behind the hip. Alternatives inspected and rejected:
candidate-2 walk:4 repeats walk:2's own raised screen-right leg; candidate-2 walk:1 and walk:3
are both-feet-grounded strides (opposite contact at best, no lifted/passing leg); candidate-1
walk:1/2 repeat the forward heel extension already diagnosed as not passing.

## Files and hashes (SHA-256)

| File | SHA-256 |
|---|---|
| Original `proof-of-control/walk2-original-cell.png` (pin re-verified) | `75c07dc26e3490c8de17377656eb1464066fc3e44bf9616de4d3424c1efcad0f` |
| Donor sheet `walk-candidate-1.png` (pin re-verified) | `dfd7bd87e424c6a50621908eed5a0c950852ea61c033c932955b50e175eb92f7` |
| [prototype-donor-c1-walk4-cell.png](prototype-donor-c1-walk4-cell.png) (512×512 crop) | `8805ec5e36cf4a1bbca1d211899253a7c059f64225288a3eaf64d59ec95fd6bb` |
| [prototype-walk2-composite.png](prototype-walk2-composite.png) | `71e8bd89b2223707238a00a9d706affc323e896e8eacdd7d706ef1ad2fb97237` |
| [prototype-walk2-composite-marked.png](prototype-walk2-composite-marked.png) | `119b5337c18cb238439e45c7659778ddea5d6508e21462c1fbea563431c4f8c2` |
| [prototype-beard.png](prototype-beard.png) | `1996ed12c8a1d0e93e4014bf5d3b880e38562358d8ed93c1e2cf41be10bc6294` |
| [prototype-beard-marked-zoom.png](prototype-beard-marked-zoom.png) | `f1e2f322fcc08481ca703a11382cff3094a7aac3503032c6a9f7ad780d5baf24` |

## 1) Walk:2 composite — §b GAIT-EDIT (30,260,452,242), cell-local, 1:1 nominal splice

Donor GAIT-EDIT pixels copied pixel-exact (RGBA) into the original cell; nothing else touched.

- **Outside-mask equality VERIFIED**: outside GAIT-EDIT ∪ BEARD-BASE, RGBA byte-stream hash
  original = composite = `f41a2ccd82cc92d1b04a26eabf43f263bb7c6f9633218365452f27050af8d2a6`,
  **0 differing pixels** (inside-mask differing pixels: 109,340).
- Registration measured, not fitted: donor cell alpha bounds (α≥16) ymin/ymax = 8/478 vs original
  45/501 — the donor figure stands **23 px higher**; the composite support sole sits at y478
  against the original ground row y501.

**Visual verdict — pasted, not natural.** (i) A hard horizontal seam at y=260 cuts the skirt:
candidate-1's rust-mottled skirt plates and baggy trousers meet candidate-2's dark grey torso
armour with an abrupt tone/pattern break and plate misalignment — the hip/skirt overlap is a
guillotine line, not authored anatomy. (ii) The planted donor boot floats 23 px above the
original ground line, so the figure hovers; ground registration is broken. (iii) Even read
charitably, the lifted leg is a trailing heel-lift behind the hip (recovery), not the bent
forward passing leg beside/under an opposite support that walk:2 requires — the donor pose
itself does not supply the required phase. The unmarked composite also shows a faint rectangular
backdrop edge at the region boundary (donor low-alpha backdrop mismatch).

## 2) Beard test — BEARD-BASE (191,110,105,35) only, on the composite

Deterministic repaint: per beard column (contiguous dark cluster x209–276), endpoint = last dark
row capped at y136, next 8 rows cleared to transparent inside the band only.

- **Outside-mask equality VERIFIED** vs composite: `d76917716063e506c70494122420da35cc3638321c2a1fbe4faed31b14e937bc`
  both sides, **0 differing pixels** (inside: 544 px = 68 columns × 8 rows).
- **Measured clear background gap: 8 px (min = median = max = 8; at x255 endpoint y136, gap 8).**
  The ≥8 px target is met numerically — by construction, i.e. by deleting pixels.

**Visual verdict — invented notch, not a real endpoint.** The capped flat endpoint (y136 across
the cluster) truncates the beard with a straight edge; the cleared slot renders as a black
horizontal bar cutting across the neck/collar rather than following any beard contour, and the
beard's natural lower-right tip still hangs below the line outside the cluster (see marked zoom).
The gap exists because pixels were removed across the collar, not because an endpoint was found.

## Verdict: NOT VIABLE as a repair technique (diagnostic only)

Both halves fail visually while passing their mechanical checks exactly — outside-mask hash
equality and an 8 px measured gap are achievable by construction and prove nothing about the
art. No existing donor key supplies a seamless opposite passing/support for walk:2 (the only
lifted-leg donor is cross-candidate, misregistered by 23 px, tone-mismatched at the skirt seam,
and is a trailing lift rather than a forward pass), and no local repaint can manufacture a
beard-base endpoint that the source pixels do not contain.

**Implication for a CMR-14A-style closeout grant:** this does not supply the demonstrated
region-preserving pose/head workflow that the feasibility plan §f missing-decision (i) requires,
and it cannot bank walk:2 or justify anchor/downstream spend. If anything it hardens the
NOT DEMONSTRATED verdict with a concrete local-repair attempt. The owner decision recorded in
TASKS.md CMR-15A stands unchanged (artist-corrected keys / demonstrated workflow, cap-and-waiver
revision, or descope). Ledger verified unchanged in this package: **Xu Chu 3/12, global 170/200**.
