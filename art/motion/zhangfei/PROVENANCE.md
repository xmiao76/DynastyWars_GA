# Zhang Fei — motion provenance (CMR-09A)

Attempt log for every generation call: ordered references (hashes),
prompt summary, verdict, remaining allowance. The generation ledger
(`art/motion/generation-budget.json`) is authoritative for budget; this
file carries the art reasoning.

## Attempts

| # | Request | Refs (ordered) | Output sha256 | Verdict |
|---|---------|----------------|---------------|---------|
| 3 | jab1 3x3 (guard, windup, drive, extension, follow, recover x2, bookend, guard; walk-c2 as identity ref) | body `546fc302...`, portrait `36b41443...`, walk-c2 `981477d7...` (pixel-attached) | `09c34b2a51cc3edc3d32d284ce8a12276ee134bfab3b7029426ba08be2e9051f` | REJECT - cell[1,2] pike tip touches the SHEET right edge (1px at (1535,515)); preparation throws `clipped figure` on any sheet-edge touch (pipeline line 180; same as 08A shoot-c1). All else verified GOOD: snappy windup/drive/extension/follow/recover choreography all distinct and on-line; identity preserved (uniform heads, costume, rigid serpent pike + tassel, no armor/cape); hands wrap with fingers/knuckles; 9/9 components correct centroids + 1x4px speck (230,418) cleanable; neighbor serpent-head slivers in zooms are nominal-crop artifacts of benign overhang (no merge - distinct components, centroid assignment lossless). No valid pixel repair exists (per-cell rescale/translate/mutilation all forbidden or impossible - the tip is real content at the sheet edge). Re-roll as candidate 2 (LAST for jab1) with explicit >=15px sheet-edge-margin language for extended pikes; file kept as `jab1-candidate-1-REJECTED.png`. Reviewed white full-sheet (158df20e) + gameplay strip (f3a7f66b) + extension zoom, all fingerprinted. |
| 2 | walk 3x3 candidate 2 (same cycle + per-cell leg choreography, c1 as identity ref) | body `546fc302...`, portrait `36b41443...`, walk-c1 `4f63c23b...` (pixel-attached) | `981477d7ffed0ad0290f69197b2f8f82411cbb512013758978aea787190be383` | ACCEPT - grid 9/9/0 (closest nominal margin 0-1px, non-touching overhang, benign per the 08A precedent; 0 sheet-edge-opaque px; 1x4px speck at (1296,214) cleanable). GENUINE alternating cycle: idle guard + contact/pass/push-off/double-stance/snap phases all distinct with wide readable silhouettes (cell4 wide stride, cell7 dipped double-stance, cell8 kick-back snap); strip reads as real walking. Identity preserved from c1 (heavy/short, vest+rope belt, headband+tails, bristle beard, serpent pike + tassel, no armor/cape; uniform heads); right hand wraps the shaft, left fists show knuckle definition; no extra limbs/forks/clipping. Zoom edge slivers are nominal-crop artifacts of the benign overhang (whole-component centroid assignment loses no data). Reviewed white full-sheet (d3ef73f8) + gameplay strip (f306ca4f) + 3 cell zooms, all fingerprinted. Walk (the scale anchor) DONE. |
| 1 | walk 3x3 (idle guard + 8-cycle) | body `546fc302...`, portrait `36b41443...` (text-grounded from the lock; this host cannot pixel-attach master refs - identity judged against masters at review) | `4f63c23bedd2ab4dd07254077f802d07ba43c97d1842894b89b154609d236068` | REJECT - static walk cycle: all 9 torsos/heads/arms/pikes near-identical, feet shuffle without genuine alternation (no passing/crossed pose, no wide stride, no push-off; cell0/4/8 zooms show legs together -> small step -> together). Identity/costume/pike GOOD (heavy/short, vest+rope belt, headband+tails, bristle beard, serpent pike + tassel, no armor/cape; uniform head size). Mechanics GOOD: 1536x1024, 74.82% transparent (preview's dark backdrop is the viewer matte, not file content), 0 sheet-edge-opaque px, 9/9 components with correct centroid cells + 1x4px dust speck at (192,888) in cell[2,0] (cleanable, not a reject ground), tight but non-touching nominal margins. No valid repair exists (legs must be redrawn, not rescaled). Re-roll as candidate 2 (LAST allowed for walk) with explicit per-cell leg choreography + finger definition; candidate 1 kept as `walk-candidate-1-REJECTED.png` and reused as the identity reference. Reviewed white full-sheet (c6796310) + gameplay strip (42608975) + 3 cell zooms, all fingerprinted. |
| - | (none yet - foundation turn) | body `546fc302...`, portrait `36b41443...` | - | Identity locked + 10-sequence plan written; 0/16 spent. |

## Budgets

- Authoring: 3/16 used (walk accepted at c2; jab1-c1 rejected on
  1px sheet-edge tip touch; jab1:1, one candidate left for jab1).
  Reserve in the ledger BEFORE each generation call.
- Repair reserve (Acceptance-4 recovery protocol): 3/3 untouched. Shared
  with CMR-09B. Only for diagnosed source-art defects after a failed
  acceptance 4; never for polish; never reopens BLOCKED tasks.
