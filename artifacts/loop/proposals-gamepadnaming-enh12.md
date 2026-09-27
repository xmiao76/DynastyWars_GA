# Producer proposal scratch: name the gamepad in the UI (ENH-12)

Pass: run 2026-09-22T21-49-44Z-2650b0df.
Signals green (signal 13/13 with marathons identical to the standing
post-arrow snapshot; vision 5/5, 9/9 frames, 256/256 sprites, 85/85
weapons, 170/170 retracts, parity clean, both negative controls correct,
HUD 1/1, findings.jsonl empty), frame signatures identical to the
standing profiles (eye review still limited by the recorded image-display
defect; programmatic coverage stands), no UX_REVIEW.md, queue holds only
DIFF-1 (BLOCKED) + 20 DONE. One-area opportunity review below.

## Area inspected (ONE): control naming per input class

The title plate names controls for two of the three first-class input
classes: keyboard ("ARROWS MOVE / Z ATTACK / X JUMP / C SPECIAL / ENTER
CONFIRM / M MUTE / P PAUSE") and touch ("D-PAD MOVE / A ATTACK / B JUMP
/ C SPECIAL / TAP CONFIRM"). GAMEPAD - equally first-class per
PROJECT.md ("Keyboard, gamepad and touch are all supported (ENH-1,
ENH-2)") - is named NOWHERE in any UI surface. A pad-only player is
told ARROWS/Z/X/C/ENTER/M/P, none of which their device has.

This is exactly the defect shape TitleScene's own comment fixed for
phones: "A phone was told ARROWS MOVE / Z ATTACK / X JUMP ... none of
which it has ... naming the controls THIS device has." The plate just
never learned about the third class. ENH-11 compounded it: Start gained
a second role (pause) that no text mentions (its entry left this as a
cosmetic gap "consciously out of scope" - an intended follow-up, not a
rejection).

Precedent for the fix AND its gate: e2e/touch.spec.ts "the title names
the controls the device actually has" (KEYBOARD_ONLY tokens banned on
touch, touch tokens required) - a third-class extension of the same
family. The pause resume hint ("PRESS P TO RESUME") has the same gap for
pad players (ENH-11 noted it).

No duplicate in TASKS.md/PROGRESS.md. Not DIFF-1; not owner-blocked.

## Verdict: REAL USABILITY GAP, WORTH FILING

Filed as ENH-12 TODO (one coherent "gamepad naming" surface: title plate
line + pause hint, with the title-labels test family extended). Design
note recorded: browsers may not expose a pad until first input, so the
line is best-effort on visibility (the synthetic-pad harness proves the
mechanic). One-area budget spent; no second area inspected.
