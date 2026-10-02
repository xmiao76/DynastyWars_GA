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

## Budgets

- Authoring: 2/8 used (locomotion accepted; shoot candidate 1
  rejected on a clipped bow tip). 6 remaining for shoot candidate 2,
  hitstun-held, fall-thrown, getup-death + 2 held for repairs/seconds.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-08B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.

## Records

- Identity: [IDENTITY.md](IDENTITY.md) (locked 2026-10-02).
- Plan: [AUTHORING-PLAN.md](AUTHORING-PLAN.md).
- Registration/measurements/overlays land here as the pack prepares.
