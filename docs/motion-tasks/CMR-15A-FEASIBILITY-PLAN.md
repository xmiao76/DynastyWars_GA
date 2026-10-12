# CMR-15A — zero-generation feasibility + named-region/mask plan (2026-10-12)

Owner grant (owner, 2026-10-12), quoted verbatim in [TASKS.md](../../TASKS.md) CMR-15A:

> "UNBLOCK CMR-15A: Reset BLOCKED→TODO. First perform a zero-generation feasibility and named-region/mask plan. Proceed only if it demonstrates a complete path with ≤4 anchor requests and 6 retained downstream requests. No waiver, extra funding, or unconstrained generation is implied."

This package: **zero image generation, zero reservations, zero ledger writes, zero source edits.**
Attempt accounting unchanged: **2 failed consumers, 1 remaining**. No waiver, cap reset, or spend is implied.

## Verdict (summary; full §f)

**NOT DEMONSTRATED.** No complete path within ≤4 anchor + exactly 6 downstream requests is
demonstrated by existing evidence. The post-block CMR-14A isolated single-pose closeout does not
demonstrate a region-preserving pose/head workflow for Xu Chu (§c), and the minimum anchor
intervention count is 6, not 4 (§d). CMR-15A therefore re-blocks `WAITING_FOR_OWNER` with the
exact missing decision in §f. Next package: none until that decision.

## Ledger verification (recomputed 2026-10-12, no writes)

`art/motion/generation-budget.json` per-fighter `used` summed fresh:
17+8+8+7+12+15+25+20+14+39+2+2 = **169 / 200 global**. Xu Chu: **used 2 / cap 12**
(`sheetCandidates.walk: 2`, walk whole-sheet allowance 2/2 CLOSED), remaining 10.
Repair reserve untouched (no Xu Chu row, 0/3). Any future ≤10-request path would end at
Xu Chu 12/12, global 179/200 — arithmetic fits; sufficiency does not (§d).

## (a) Inventory of existing Xu Chu source cells/keys, with hashes

Identity masters (inspected before prior authoring; not generated in this package):

| Asset | Size | SHA-256 |
|---|---|---|
| `art/fighter-bodies/xuchu-body-master.jpg` | 832×1248 | `98c1847b17dca605e637954e0a9679c23d97f9fcd58d0a4ebb01c37665abb6cd` |
| `art/boss-faces/xuchu-portrait-master.jpg` | 1280×720 | `c663fd5428314ced899d98ce41b5fa2e55fecb9b12335b1f9de4803afefb3a0d` |

Generated walk sources (both HOLD_NOT_ACCEPTED_DO_NOT_PREPARE; zero accepted frames/pixels):

| Asset | Size / bytes | SHA-256 | Disposition |
|---|---|---|---|
| `art/motion/xuchu/walk-candidate-1.png` | 1536×1024 / 2,180,302 | `dfd7bd87e424c6a50621908eed5a0c950852ea61c033c932955b50e175eb92f7` | Failure 1. Repeated leading heel 1/2, trailing (not forward) passing 4, brake 5 unproven; blade crosses nominal x512. No accepted key. |
| `art/motion/xuchu/walk-candidate-2.png` | 1536×1024 / 2,227,606 | `bad2aee559b2835f38433e74e7a696696baa13d9d84d28b13afa740d25ca7e6c` | Failure 2. Better vehicle, still no opposite support (§b). Walk 2/2 CLOSED — a third whole-sheet walk is forbidden. |
| `walk-prompt-1.txt` / `walk-prompt-2.txt` | — | `6ae91c1852…f78bd37b7f43b` / `70fcd0b4a1…ad313e4c74cfbf768f09b494ecd0191cd616207d987a49e` | Exact submitted prompts (audit-pinned). |
| `walk-candidate-2-head-grid.png` | 1200×1800 / 344,819 | `de464e54b550b57c683d0e605a716a8e44472141a9b75973802e55e7842401a1` | Fixed-4x head windows; all six beard bases merge into neck/collar. |
| `walk-candidate-2-4x.png` / `-gameplay.png` / `-weapon-marked.png` | — | `f3d17c64…` / `2f7af4ea…` / `19c07ee0…` (full in `CANDIDATE2_FILE_HASHES.json`) | Review renders opened in this package. |
| Audits / measurements / contracts | — | in `FILE_HASHES.json`, `CANDIDATE2_FILE_HASHES.json`, `named-cell-feasibility.json` | `fixedBand=null` everywhere; no pack-projection band was ever fixed. |

Candidate-2 cell inventory (source 1536×1024, nominal 3×2 cells of 512×512; alpha≥16 bounds
clipped at nominal cells, from `walk-candidate-2-layout-probes.json` — diagnostic, not isolation proof):

| Key | Nominal cell (x,y,w,h) | Alpha bounds (xmin,ymin,xmax,ymax) | Weapon butt→tip (source px) | Length / dir |
|---|---|---|---|---|
| walk:0 | (0,0,512,512) | (53,31,511,498) | (56,303)→(516,90) | 506.92 / −24.85° |
| walk:1 | (512,0,512,512) | (512,40,1023,498) | (572,309)→(1040,96) | 514.19 / −24.47° |
| walk:2 | (1024,0,512,512) | (1024,45,1512,501) | (1059,315)→(1507,95) | 499.10 / −26.15° |
| walk:3 | (0,512,512,512) | (65,531,511,976) | (68,801)→(528,580) | 510.33 / −25.66° |
| walk:4 | (512,512,512,512) | (512,534,1023,978) | (575,787)→(1047,577) | 516.61 / −23.99° |
| walk:5 | (1024,512,512,512) | (1024,542,1514,984) | (1060,808)→(1508,595) | 496.06 / −25.43° |

Diagnostic weapon spread 4.0518%, max direction step 1.6827° (tip:4 alpha 21, uncertain) — not
pack acceptance. Whole glaive ≈496–517 px vs ≈465 px body (ratio ≈1.07–1.11, brief asked 0.81);
uniform scaling cannot change that ratio. Downstream families **charge/combo/heavy/misc/fall/getup
have zero source cells** — all absent. Overlay evidence created in this package from existing
pixels only: `art/motion/xuchu/feasibility-plan/candidate2-named-regions-overlay.png`
(SHA-256 `73267f4850b0534c3e1a1eda73ade96267b158cd2b4e93fac7d280f3c91e5f1d`, script beside it).

## (b) Named regions/masks per problem key (candidate-2 source coordinates)

Region definitions (rectangles are mask *definitions* in source px, half-open; a future splice
must prove outside-mask RGBA hash equality, preserve originals, and use a ≤8 px feather only
inside the edit region — no provider mask/pose-control parameter exists, see §c):

- **HEAD-BEARD[k]**: helmet crown → beard base window, per key below. Preserve crown/face above
  the band; the only permitted head change is inside BEARD-BASE.
- **BEARD-BASE[k]**: window-local y 75..110 (beard lower third → collar junction). Required
  outcome: an externally readable beard-base endpoint with ≥8 px background beside/below the
  base, so the locked visible-envelope head measure (crown→beard base, spread ≤10%) has endpoints.
- **GAIT-EDIT[k]** (keys 2/3/4/5 only): cell-local (30,260,452,242) — hips/skirt through both
  knees/shins/boots. Must author hip/skirt overlap, not pasted boots.
- **TORSO-PRESERVE[k]**: cell area above GAIT-EDIT, excluding HEAD-BEARD — torso, connected
  arms/grips; no change permitted.
- **WEAPON-PRESERVE[k]**: 14 px corridor along the measured butt→tip line in §(a); rigid glaive
  geometry/length must not change (no outlier justifies shaft retouch).
- **GROUND**: lowest alpha row per key (bounds ymax in §a); registration ≤1.5u stays unproven
  until an accepted pivot exists.

| Key | HEAD-BEARD (x,y,w,h) → BEARD-BASE band (y range) | GAIT-EDIT (global rect) | Problem / required named outcome |
|---|---|---|---|
| walk:0 | (190,25,105,135) → y 100..135 | — (retain conditionally) | Head only: beard-base endpoint legibility. Guard pose retained only if head resolves. |
| walk:1 | (730,35,105,135) → y 110..145 | — (retain conditionally) | Head only; plus validate (not assume) contact/support correspondence. |
| walk:2 | (1215,35,105,135) → y 110..145 | (1054,260,452,242) | **Opposite support**: bent forward passing with planted under-hip opposite support (current: kick-like same-family extension) + head band. |
| walk:3 | (230,525,105,135) → y 600..635 | (30,772,452,242) | **Opposite support**: genuinely opposite anatomical contact to walk:1, unambiguous occlusion/support reversal + head band. |
| walk:4 | (750,525,105,135) → y 600..635 | (542,772,452,242) | **Opposite passing** to walk:2 (current: same raised-leg family) + head band. |
| walk:5 | (1210,535,105,135) → y 610..645 | (1054,772,452,242) | **Brake**: controlled brake/bookend transition (current: guard-like, braking unproven) + head band. Torso pitch may change only inside GAIT-EDIT + skirt; head/weapon/grips preserved. |

Candidate-1 contributes no accepted key and no region is banked from it (different hierarchy;
mixing candidates is not evidenced). All six heads need BEARD-BASE resolution: a one-key head
fix cannot establish the comparable six-key set the ≤10% spread is computed over.

## (c) Post-block evidence re-evaluation: CMR-14A isolated single-pose closeout

What CMR-14A actually demonstrated after the Xu Chu block (2026-10-11, read from
`closeout-campaign/AUTHORITY.md`, `FINAL-ACCEPTANCE.md`, `PACK-REPORT.md`, PROGRESS closeout):

1. **Isolated single-pose generation works for single static poses**: six requests (misc:3/4,
   fall:0/1/2/3), one isolated pose each, durable reservation before each call, at one fixed
   whole-source visual q (0.27655409211353954); finishing = 96 px transparent padding + ONE
   uniform density-2 resample, no painting/per-pose fit. Batch: 0 genuinely unusable;
   five PASS_FOR_ISOLATED_SOURCE, fall:3 HOLD on pose semantics, owner-accepted.
2. **But it was not region-preserving**: each pose is a wholly regenerated figure. No masks,
   no named edit region, no outside-mask pixel-equality proof, no pose-control parameter.
   Nothing in the method preserves Xu Chu's retained torso/weapon/head pixels while changing
   only hips/legs or only the beard base.
3. **It did not solve the head problem — it waived past it**: the head gate ended
   **UNVERIFIED, owner-accepted** (chin concealed by the full beard in every frame; beard-tip
   proxy spread 24.8%). Xu Chu has the identical beard/collar concealment. Transferring that
   outcome to Xu Chu is exactly a waiver, which this grant expressly does not imply.
4. **It does not demonstrate gait**: misc/fall poses are acyclic singles. Alternation is a
   *comparative* property across keys 1–4 (opposite support/passing relative to neighbours);
   a single pose that reads well alone cannot establish it. Post-block CMR-14B walk EDIT
   attempts (walk1 REJECT; walk2 HOLD, opposite-leg exchange NOT provable) corroborate that
   pose generation still does not deliver provable alternation.
5. **First-try reliability is insufficient for a zero-contingency plan**: of the six closeout
   poses, fall:2 (380.91 OUT-LOW) and fall:3 (497.85 OUT-HIGH) fell outside the frozen weapon
   band and stand only under source-specific owner waivers. Unwaived, that is 4/6 in band.
   Xu Chu's plan (§d) has zero correction contingency and no waiver.

**Conclusion for (c): NO** — CMR-14A demonstrates isolated single-pose *generation + fixed-q
registration + uniform finishing* for acyclic poses, with owner waivers absorbing its head and
weapon failures. It does not demonstrate a region-preserving pose/head workflow, a gait
workflow, or waiver-free first-try compliance applicable to Xu Chu.

## (d) Complete allocation table — required vs. grant ceiling

Hypothetical complete path under the grant ceiling (riskiest-key-first; gates in §e):

| # | Request | Target | Xu Chu after | Global after |
|---|---|---|---|---|
| — | Spent (walk candidates 1+2, both rejected) | — | 2/12 | 169/200 |
| A1 | Anchor 1: isolated single-pose walk:2 (GAIT-EDIT + BEARD-BASE) | opposite passing/support + head | 3 | 170 |
| A2 | Anchor 2: isolated single-pose walk:3 (GAIT-EDIT + BEARD-BASE) | opposite contact to walk:1 + head | 4 | 171 |
| A3 | Anchor 3: isolated single-pose walk:4 (GAIT-EDIT + BEARD-BASE) | opposite passing to A1 + head | 5 | 172 |
| A4 | Anchor 4: isolated single-pose walk:5 (GAIT-EDIT + BEARD-BASE) | brake/bookend + head | 6 | 173 |
| D1 | Downstream: charge (1 request) | charge.crush family | 7 | 174 |
| D2 | Downstream: combo (1 request) | sword.combo family | 8 | 175 |
| D3 | Downstream: heavy (1 request) | sword.heavy family | 9 | 176 |
| D4 | Downstream: misc (1 request) | hurt/held family | 10 | 177 |
| D5 | Downstream: fall (1 request) | fall/down family | 11 | 178 |
| D6 | Downstream: getup (1 request) | getup family | 12 | 179 |

Ceiling respected arithmetically (≤4 + exactly 6 = ≤10 future; total 12/12, global 179/200).
**It is nevertheless not a demonstrated complete path**, because the anchor set is incomplete:

- walk:0 and walk:1 also require BEARD-BASE resolution (§b). Combining gait+head in one
  request per key covers keys 2–5, but keys 0/1 head-only interventions are a 5th and 6th
  anchor intervention. Minimum anchor count = **6**, future total = **12**, Xu Chu = **14/12**
  (short 2) — identical to the pre-block feasibility arithmetic, unchanged by CMR-14A.
- Retaining walk:0/1 heads unresolved leaves the head spread uncomputable (unknowns cannot
  establish compliance); excluding the guard from the head set is not permitted — it is the
  most comparable upright pose.
- Shrinking the cycle (e.g. 4 new keys + retained guard) still leaves the guard head
  unresolved and additionally requires re-proving cycle order/bookends; no evidence backs it.
- Grouping downstream families into fewer requests has no evidenced accepted precedent and
  cannot be credited; D1–D6 at one first-try request each also assumes 6/6 waiver-free
  passes, against the CMR-14A 4/6 unwaived in-band rate (§c.5), with zero contingency.
- Only 1 failed consumer remains: any one failed anchor/downstream consumer iteration
  exhausts CMR-15A (3 total). A 10-request all-first-try path across gait + head + six
  families is an assumption, not a demonstration.

## (e) Per-request gates (binding on any future owner-authorized path)

1. **Reserve-before-call**: durably increment `generation-budget.json` (fighter + sequence)
   before any image call; no refunds; walk sequence stays closed to whole sheets (isolated
   single-pose only); provider/reference failure = correct the reference, never substitute
   text-to-image or another key's pixels.
2. **Riskiest-key-first sequencing**: walk:2 → walk:3 → walk:4 → walk:5 → walk:0/1 heads →
   charge → combo → heavy → misc → fall → getup. No downstream request while any anchor
   gate is open; no parallel requests.
3. **Scale/projection gates after EACH request**: fix ONE brief band from the first accepted
   anchor (never re-center); comparable weapon spread ≤10% ((max−min)/mean,
   `scripts/pack-projection.mjs`), direction steps ≤60° or authored bridge; attempt
   deterministic shaft retouch before any further image spend on a length outlier.
4. **Head gate after EACH anchor**: overlay-landmark visible-envelope (crown→beard base) on
   comparable upright poses; BEARD-BASE endpoint must be readable (≥8 px background
   beside/below); unknown = UNVERIFIED = not a pass; no helmet-only or forehead-only fallback.
5. **Region-preservation gate**: outside-mask RGBA hash equality vs. the preserved candidate-2
   original; identity/scale/grip unchanged; natural hip/skirt overlap inside GAIT-EDIT;
   mirroring/recoloring legs to fake alternation is forbidden.
6. **Stop conditions**: STOP the campaign on (i) any safety/authority failure, (ii) the first
   anchor request that fails gait/head/preservation gates (it consumes the last failed
   consumer → re-block), (iii) any request that would exceed Xu Chu 12 or global 200, or
   (iv) a second genuinely unusable source in any future finite batch. No rerolls, no
   blind re-briefs: a second attempt anywhere requires a measured-failure brief and owner
   authority this grant does not contain.

These gates discipline spend; they do not create the missing mask/pose control or reduce the
6-intervention anchor minimum, so they cannot convert §(d) into a demonstrated path.

## (f) Verdict

**NOT DEMONSTRATED**, for four independent reasons (any one suffices):

1. **Count**: minimum 6 anchor interventions (3 gait + 1 brake + 2 head-only, gait/head
   combined per key) + 6 downstream = 12 future requests > the grant's ≤10 (Xu Chu 14/12).
2. **Control**: no demonstrated region-preserving pose/head workflow exists — the image
   interface takes references+prompt only (no mask/pose parameter), and CMR-14A regenerated
   whole figures; no outside-mask preservation result exists for any fighter's gait/head.
3. **Head**: the only post-block head precedent (CMR-14A) closed as UNVERIFIED by owner
   acceptance over a beard-concealed chin — a waiver-equivalent this grant excludes; all six
   Xu Chu beard bases remain endpoint-less.
4. **Reliability**: zero correction contingency vs. CMR-14A's 4/6 unwaived in-band rate and
   CMR-14B's unprovable walk alternation; and only 1 failed consumer remains for 10 requests.

**Exact missing owner decision** (recorded in TASKS.md CMR-15A Status): the owner must
explicitly choose ONE of — (i) supply or fund a demonstrated region-preserving pose/head
workflow or artist-corrected source keys (explicit masks, opposite support/passing, readable
beard-base endpoints) that fits ≤4 anchor + 6 downstream; (ii) revise scope/funding, e.g.
raise the Xu Chu anchor allowance to ≥6 (cap above 12) and/or grant a CMR-14A-style
head-UNVERIFIED acceptance or weapon waivers for Xu Chu; or (iii) descope/pause CMR-15A
(e.g. reduced walk cycle) with the limitation documented. Until one is chosen, CMR-15A is
`BLOCKED WAITING_FOR_OWNER`; CMR-15B stays TODO/unready; no anchor request is authorized.

## Checks run in this package

Ledger recomputation (Xu Chu 2/12, global 169/200) — PASS; source hashes re-verified against
`FILE_HASHES.json` / `CANDIDATE2_FILE_HASHES.json` — PASS; candidate-1/2, head-grid and
gameplay images opened and inspected; overlay rendered from existing pixels and opened.
`git diff --check` at commit time. No tests/browser/vision/build run: no code, runtime, UI or
shipping change. Zero `image_generate` calls.
