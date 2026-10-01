# Wei Soldier motion pack — generation provenance (CMR-06A)

Every request: `image_generate`, preferred GPT / quality high / 1536x1024
(3x3 cells of 512x341), actual serving backend not disclosed. Ordered
references per request: `[body master, portrait master]` (hashes in
IDENTITY.md). Original art only; no third-party references. Shared prompt
requirements in every request: exact 3x3 grid at fixed cell size, same
scale/camera/ground line, rigid straight sword identical in every cell,
transparent background, no glow/shadow/text/panels/effects, full helmet
finial + boots + blade inside every cell.

Budget ledger (`art/motion/generation-budget.json`, authoritative): mook cap
8, two whole-sheet candidates per sequence. Used 2 (see slips below), 6
remaining.

| seq | candidate | sha256 | verdict |
| --- | --- | --- | --- |
| locomotion | locomotion-candidate-1.png | `cf731091cd4ed6cdea58e0bb0fd655345db109109085100bf3979eb56a7aee4c` | ACCEPT - 9/9 figures in 9 cells (idle, walk contact/pass/far-leg/pass2, stop, retreat x2, guard bookend); identity/sword/scale consistent; full boots/blade/finial in frame; mechanical grid check + fingerprint-verified visual review both pass |
| swing | swing-candidate-1.png | `7c9c01a75adc8537c33ccacc4dd89d2f85b3a95a93c08bb638394e0bf90a1661` | ACCEPT - 9/9 cells (guard, windup, startup, strike x2, recover x3, guard bookend = cell 1); sword length constant, no forks; direction steps <= 60 deg with intervening drawings; 3 bbox-overlap suspects = wide sweep crossing nominal territory (reviewed, not merges: component count is 9/9) |

## Process slips recorded (not hidden)

- The swing request was made BEFORE its ledger reserve (the contract says
  reserve before calling tools). Reserve was applied retroactively in the
  same hour; the ledger's used-count is correct (2). No further requests
  will be made before their reserve.

## Session tooling note

The review of every sheet used the mandatory fingerprint protocol
(AUTHORING-PLAN.md) because of the DSH image-association bug: preview
pixels were cross-checked against a mechanical fingerprint of the file
(dims/aspect/alpha share) before any verdict. One locomotion preview was
mispaired and discarded; the accepted verdicts rest on verified reads.

## Remaining budget plan (6 left)

3 whole-sheet candidates (hitstun-held, fall-thrown, getup-death) at one
request each = 3, leaving 3 for targeted repairs/second candidates.
