# Producer proposal scratch: gamepad pause parity (ENH-11)

Pass: run 2026-09-22T19-49-05Z-e88de4a6.
Signals green (signal 13/13 with marathons identical to the standing
post-arrow snapshot; vision 5/5, 9/9 frames, 256/256 sprites, 85/85
weapons, 170/170 retracts, parity clean, both negative controls correct,
HUD 1/1, findings.jsonl empty), no UX_REVIEW.md, queue holds only
DIFF-1 (BLOCKED) + 20 DONE. One-area opportunity review below.

## Area inspected (ONE): input-parity of the pause feature

The pause chain shipped keyboard (ENH-7, P key) and touch (ENH-8, HUD
button). The third first-class input class - GAMEPAD (PROJECT.md:
"Keyboard, gamepad and touch are all supported (ENH-1, ENH-2)") - has no
pause path at all. A pad player cannot stop a ~13-minute run (47,416-tick
zhaoyun marathon), while keyboard and touch players both can.

Evidence the slot is free: GameScene polls Start (button 9) through
`watchConfirmButton(confirmContinue)`, and `confirmContinue` no-ops
outside the game-over countdown (and returns early while paused). Start
does nothing else during gameplay - it is menu-confirm only. The touch
pause button already routes through the shared `togglePause()` (ENH-8),
so the mechanism exists; this is the binding, not a new feature.

No duplicate: ENH-8's non-goal "No desktop-visible change" and ENH-7's
"stated follow-up if the owner wants mobile parity" covered TOUCH only;
no gamepad-pause task or rejection exists in TASKS.md/PROGRESS.md.
Not a DIFF-1 matter; not owner-blocked (pause itself is already an
owner-accepted feature; this is input parity for it).

## Verdict: REAL DEFECT-CLASS GAP, WORTH FILING

Same evidential shape as ENH-8 (which shipped): a documented input class
missing a shipped feature. Small and objectively testable with the
existing gamepad emulation harness (gamepad.spec drives pads today).
Filed as ENH-11 TODO; a later consumer implements. One-area budget
spent; no second area inspected.

Not filed: touch-mute parity (M is keyboard-only - real but mitigated by
device hardware volume, weaker than the pause cases); anything in the
image-display tooling (harness-level, outside this repository).
