# Wei Archer — motion provenance (CMR-08A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| 1 | locomotion 3x3 (idle, walk x4, stop, retreat x2, bookend) | body `4b169347...`, portrait `bace27af...` | `ffa42e681657aff045d8e3e441b8f8c4e1bf9c0e8d71f4466e96875b3454f60f` | ACCEPT - grid 9/9/0, identity holds (wrap/robe/bow), distinct walk/stop/retreat poses, uniform scale, bookend matches; 4.7% sub-threshold bg micro-tint (cleaned at prepare; explains preview banding, not file content). Reviewed full-sheet + gameplay strip, both fingerprinted. |

## Budgets

- Authoring: 1/8 used (locomotion accepted). 7 remaining for shoot,
  hitstun-held, fall-thrown, getup-death + 3 held for repairs/seconds.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-08B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.

## Records

- Identity: [IDENTITY.md](IDENTITY.md) (locked 2026-10-02).
- Plan: [AUTHORING-PLAN.md](AUTHORING-PLAN.md).
- Registration/measurements/overlays land here as the pack prepares.
