# CMR-15A alternative phase-1 diagnostic — REPORT (zero generation)

Work `cmr15a-alt-phase1-diagnostic` (correction/resume of partial state).
DIAGNOSTIC ONLY: CMR-15A remains **BLOCKED WAITING_FOR_OWNER**; nothing banked,
no `accepted.png` created/copied, no TASKS/status change, no generation.
Ledger verified unchanged: `art/motion/generation-budget.json` SHA-256
`371a8bcfc7c440de127c30037c29fa5215c4fe73c969fa59524c97fb64435a8c` (Xu Chu 11 / global 178).

Frozen brief band (walk:2 anchor): body 459px@512, weapon 503.12px@512,
band [124.41,137.50]u, angle −26.31°, groundY 500@512, corridor limit 14px.
Determinism: both scripts re-run by the correction worker; every output hash
below reproduced byte-identically.

## Experiment 1 — walk:3 distal-weapon micro-rotation

- Source: `closeout-campaign/02-walk3/attempt3/registered.png`
  SHA-256 `2d21f6cdb34deea98efae12d1fac396d7c1e26150cc82bc36de2ccb6242b14d4` (512×512).
  Its sole failing gate was weapon corridor tip perp **15.36px > 14px**.
- Method (`walk3-microrotate.mjs`): rigidly rotate only distal pixels
  (chord-frame t≥325, o∈[−8,98]; cut just distal to the front-grip fingers)
  by θ=−1.332° around the measured front-grip centroid (305.67,221.94),
  inverse-mapped premultiplied bilinear resample; skin-tone output pixels
  guarded byte-identical; θ chosen to align the weapon chord to the frozen
  direction (minimum |θ| for perp 14 would be −0.376°).
- Output: `walk3-rotated.png` SHA-256
  `dc3e699fabf115ea6ab3c064b51680862697a59a85c70cfa627252f41dff1ea7` (512×512).
- Outside-region evidence: outside-writable-region RGBA hash identical
  before/after (`330cd1dc…f695`); changedPxOutside=0, changedPx y≥300=0,
  legs y≥340=0; 7,752 changed px inside the region only. Seam offset at cut
  centre 0.56px.
- Full re-gate (`walk3-gate.json`; full, seam-4x, seam-gameplay, legs-2x,
  tip-4x, diff all opened): weapon 131.98u **in band**, angle Δ+0.79°,
  corridor butt 3.54 / **tip 10.55px ≤14 PASS**, tip inside (margin 31.5px);
  body 459px, ground 500@512 = 0.00u; greenPx=0, no edge clipping; identity/
  anatomy/gait-Contact-B pixels byte-identical to attempt3 registered (its
  gate: PASS) and visually re-confirmed (front flat, rear toe-off); seam at
  hand exit continuous at gameplay and 4×, no visible kink; head RAW 0px
  carried (not a reject).
- **Verdict: PASS (diagnostic).** The corridor failure is cured by a
  deterministic ≤1.34° distal micro-rotation without touching body/legs/hand.
  Not banked.

## Experiment 2 — walk:0/1 full-sheet component extraction + registration

- Source: `art/motion/xuchu/walk-candidate-2.png` SHA-256
  `bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c` (1536×1024).
  Prior zero-gen gate on nominal 512 cells failed both keys on tip clipped at
  the cell edge (whole length unmeasurable).
- Method (`walk01-extract.mjs`): 8-connected components at alpha≥8 → exactly
  6 figure components (stable at thresholds 4/8/16/128). walk:0 component
  bounds x52–520 (spill 9px past nominal cell), walk:1 x567–1044 (spill
  21px); min inter-figure pixel distance 146px (0↔1) — extraction takes each
  figure's own pixels only, so the blade tips previously "clipped" by the
  nominal cell cut are recovered whole from the sheet; no neighbouring
  fragment is included. Then the attempt3 registration rule (uniform scale
  to body 459px, ground→500@512, alpha-centred).
- Outputs: `walk0-extracted.png` `14ad2e1c…70e9`, `walk0-registered.png`
  `2a4a415dc2105f68911a7b08115bc7a14b0a213f68787990ae8726b51d66f450`;
  `walk1-extracted.png` `14f2d07f…97a`, `walk1-registered.png`
  `2de4d8490eff7f1751785c312dc1fac6518e6d6d40d03befefc8e9bee113367c`.
- Walk:0 gates (`walk01-extract.json`; registered/marked/head/legs/tip/
  boundary opened): registration factor 0.9808 (−1.92% ≤±12%), body 459px,
  ground 0.00u; weapon whole & measurable 130.37u in band, Δangle +1.20°,
  corridor butt 12.06/tip 1.57px ≤14 PASS, tip inside (margin 31.4px);
  identity/anatomy PASS; seams PASS (greenPx=0, edgeOpaque=0, complete tip);
  gait guard double-support PASS; head endpoint beard-over-collar RAW
  (prior 0px, not a reject).
- Walk:1 gates: factor 1.0000, body 459px, ground 0.00u; weapon 135.22u in
  band, Δangle +2.26°, corridor butt 13.14/tip 7.36px ≤14 PASS (butt close
  to limit), tip inside (margin 19.5px); identity/anatomy PASS; seams PASS
  (greenPx=0, edgeOpaque=0 — the neighbouring blade fragment that failed the
  nominal cell is excluded by component extraction); gait Contact-A
  (front flat / rear toe-off) PASS; head RAW as above.
- **Verdict: PASS (diagnostic) for both keys.** Full-sheet component
  extraction removes the only failing gates (tip clip / fragment seam) with
  zero generation; the original sheet pixels already satisfy every gate.
  Not banked.

## Conclusion / risks

Both zero-generation routes work on existing pixels: walk:3's corridor miss
is a 1.36px excess curable by distal micro-rotation, and walk:0/1 were only
ever failed by the nominal-cell slicing, not by the drawings. Caveats:
walk:1 corridor butt 13.14px is near the 14px limit; walk:3 rotation resamples
7,344 distal px (4× seam inspected PASS, but any banking decision should get
independent visual review); head endpoint remains RAW/unverified as before.
Any banking/status change is an owner/manager decision outside this package.
