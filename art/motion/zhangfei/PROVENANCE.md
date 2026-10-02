# Zhang Fei — motion provenance (CMR-09A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| 1 | walk 3x3 (idle guard + 8-cycle) | body `546fc302...`, portrait `36b41443...` (text-grounded from the lock; this host cannot pixel-attach master refs - identity judged against masters at review) | `4f63c23bedd2ab4dd07254077f802d07ba43c97d1842894b89b154609d236068` | REJECT - static walk cycle: all 9 torsos/heads/arms/pikes near-identical, feet shuffle without genuine alternation (no passing/crossed pose, no wide stride, no push-off; cell0/4/8 zooms show legs together -> small step -> together). Identity/costume/pike GOOD (heavy/short, vest+rope belt, headband+tails, bristle beard, serpent pike + tassel, no armor/cape; uniform head size). Mechanics GOOD: 1536x1024, 74.82% transparent (preview's dark backdrop is the viewer matte, not file content), 0 sheet-edge-opaque px, 9/9 components with correct centroid cells + 1x4px dust speck at (192,888) in cell[2,0] (cleanable, not a reject ground), tight but non-touching nominal margins. No valid repair exists (legs must be redrawn, not rescaled). Re-roll as candidate 2 (LAST allowed for walk) with explicit per-cell leg choreography + finger definition; candidate 1 kept as `walk-candidate-1-REJECTED.png` and reused as the identity reference. Reviewed white full-sheet (c6796310) + gameplay strip (42608975) + 3 cell zooms, all fingerprinted. |
| - | (none yet - foundation turn) | body `546fc302...`, portrait `36b41443...` | - | Identity locked + 10-sequence plan written; 0/16 spent. |

## Budgets

- Authoring: 1/16 used (walk-c1 rejected on static cycle; 10
  sequences pending, walk-c2 is the last allowed walk candidate).
  Reserve in the ledger BEFORE each generation call.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-09B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.
