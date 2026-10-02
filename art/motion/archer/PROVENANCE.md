# Wei Archer — motion provenance (CMR-08A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| 1 | locomotion 3x3 (idle, walk x4, stop, retreat x2, bookend) | body `4b169347...`, portrait `bace27af...` | `ffa42e681657aff045d8e3e441b8f8c4e1bf9c0e8d71f4466e96875b3454f60f` | ACCEPT - grid 9/9/0, identity holds (wrap/robe/bow), distinct walk/stop/retreat poses, uniform scale, bookend matches; 4.7% sub-threshold bg micro-tint (cleaned at prepare; explains preview banding, not file content). Reviewed full-sheet + gameplay strip, both fingerprinted. |
| 2 | shoot 3x3 (guard, draw x2, full draw, release, follow-through, reload x2, bookend) | body `4b169347...`, portrait `bace27af...` | `e3012ea1235867c44ad04d461d536071903981285f2b653d75df241cfc83174e` | REJECT - cell 3 (draw 2) raised bow tip touches the sheet top edge (y0=0, edge-touch 1; preparation throws on any touch). All else verified GOOD: identity, braced firing poses, full draw anchored with nocked arrow, release/follow-through correctly arrowless (zoom-verified open string hand + slack string, quiver arrows separate), uniform scale, bookend matches. No valid pixel repair exists (per-cell rescale/translate/mutilation all forbidden or impossible - figure spans full cell height). Re-roll as candidate 2 with explicit >=15px top-margin language for raised bows. File kept as `shoot-candidate-1-REJECTED.png` per precedent. |
| 3 | shoot 3x3 candidate 2 (same cycle + margin language) | body `4b169347...`, portrait `bace27af...` | `c0d63dc0678d396d7bff8de23b4aa5dc2d5f48dad885fafac0f5adde95fbf34e` | ACCEPT - grid 9/9/0 (closest margin 5px, margins held). Full draw anchored with nocked arrow; release/follow-through zoom-verified arrowless (open hands, slack strings); braced stances read distinctly from walking at gameplay size; identity/scale/bookend all hold; no mittens/forks/clipping. Reviewed full-sheet + release zoom + gameplay strip, all fingerprinted. |
| 4 | hitstun-held 3x3 (guard, recoil, fold, stagger, held x2, escape shove/reset, bookend) | body `4b169347...`, portrait `bace27af...` | `dc2b7e383ae86702335ef121a759bf92f0e5ab37cccd0c5eb60ce76cbfd076c7` | ACCEPT - grid 9/9/0 (closest margin 7px). Bow gripped in ALL 9 incl. both held poses (grapple rule held); distinct recoil/fold/stagger/held/escape reads; identity/scale/bookend hold; no mittens/forks/clipping. Reviewed full-sheet + gameplay strip, both fingerprinted. |
| 5 | fall-thrown 3x3 (topple, airborne, impact, DOWN, tumble x2, side-impact x2, DOWN bookend) | body `4b169347...`, portrait `bace27af...` | `dcfbc1f7d1a5a55c45903dce55de230576fb81b8616e502db310cd78f54bced6` | ACCEPT - grid 9/9/0 (closest margin 13px). Bow gripped in ALL 9 incl. both tumbles (grapple rule held mid-air); clean topple/airborne/impact/DOWN arc + distinct tumble orientations + side impacts; headwraps stay on; DOWN bookends match; uniform scale (tumbles stay compact, no scale-to-fill); no mittens/limbs/forks/clipping. Reviewed full-sheet + gameplay strip, both fingerprinted. |

## Budgets

- Authoring: 5/8 used (locomotion + shoot-c2 + hitstun + fall
  accepted; shoot-c1 rejected). 3 remaining for getup-death
  + 2 held for repairs/seconds.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-08B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.

## Records

- Identity: [IDENTITY.md](IDENTITY.md) (locked 2026-10-02).
- Plan: [AUTHORING-PLAN.md](AUTHORING-PLAN.md).
- Registration/measurements/overlays land here as the pack prepares.
