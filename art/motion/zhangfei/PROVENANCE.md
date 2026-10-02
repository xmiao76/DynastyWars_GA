# Zhang Fei — motion provenance (CMR-09A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| - | (none yet - foundation turn) | body `546fc302...`, portrait `36b41443...` | - | Identity locked + 10-sequence plan written; 0/16 spent. |

## Budgets

- Authoring: 0/16 used (all 10 sequences pending: walk, jab1, jab2,
  finisher, jump, misc, fall, getup, special, rider). Reserve in the
  ledger BEFORE each generation call.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-09B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.
