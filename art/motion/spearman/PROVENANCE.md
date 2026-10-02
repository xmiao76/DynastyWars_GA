# Wei Spearman motion pack — generation provenance (CMR-07A)

Every request: `image_generate`, preferred GPT / quality high / 1536x1024
(3x3 cells of 512x341), actual serving backend not disclosed. Ordered
references per request: `[body master, portrait master]` (hashes in
IDENTITY.md). Original art only; no third-party references. Shared prompt
requirements in every request: exact 3x3 grid at fixed cell size, same
scale/camera/ground line, one rigid spear identical in every cell,
transparent background, no glow/shadow/text/panels/effects, full helmet
finial + boots + spearhead inside every cell.

Budget ledger (`art/motion/generation-budget.json`, authoritative): the
spearman allowance is 8, shared across CMR-07A/CMR-07B; two whole-sheet
candidates per sequence. Used 2, 6 remaining.

| seq | candidate | sha256 | verdict |
| --- | --- | --- | --- |
| locomotion | locomotion-candidate-1.png | `a1eede91f7bfefddedd62785987fb52cdd2e92d8cdb2c5f2c8b73bcf845b7fdf` | ACCEPT - 9/9 figures in 9 cells (idle, walk contact/pass/far-leg/pass2, stop, retreat x2, guard bookend); identity/spear/scale consistent; full boots/spearhead/finial in frame; mechanical grid check + fingerprint-verified visual review both pass |
| thrust | thrust-candidate-1.png | `dd123d6a565ac2e93d5e4d9e3e610b73dfee43d40e729a660b0693390017b1d9` | ACCEPT - 9/9 cells (guard, windup, startup, strike x2 at full extension with both hands spaced on the shaft, recover x3, guard bookend = cell 1); spear length constant, no forks; direction steps <= 60 deg with intervening drawings; 1 bbox-overlap suspect = wide thrust crossing nominal territory (reviewed, not a merge: component count is 9/9) |

## Session tooling note

The review of every sheet used the mandatory fingerprint protocol
(soldier AUTHORING-PLAN.md): preview pixels were cross-checked against a
mechanical fingerprint of the file (dims/aspect/alpha share) before any
verdict. Both reads this round matched on first attempt; the accepted
verdicts rest on verified reads.

## Remaining budget plan (6 left)

3 whole-sheet candidates (hitstun-held, fall-thrown, getup-death) at one
request each = 3, leaving 3 for targeted repairs/second candidates.
