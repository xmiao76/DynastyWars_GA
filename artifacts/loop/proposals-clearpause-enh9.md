# Producer proposal scratch: pause must freeze the stage-clear transition (ENH-9)

Pass: run 2026-09-22T07-49-14Z-d00c5eb7.
Signals green (signal 13/13 with ENH-6-identical marathons; vision 5/5, all
9 frames pass, both negative controls correct, findings.jsonl empty), all 9
frames swept by eye with no defect, no UX_REVIEW.md, queue holds only
DIFF-1 (BLOCKED) + 20 DONE. One-area opportunity review below.

## Area inspected (ONE): pause-feature completeness

ENH-7's pause gate comment promises "no stage transitions until resume".
Auditing every gameplay `scene.start` against that promise:

- Pending-start restart (GameScene, bridge startGame): below the pause
  gate, frozen while paused. OK.
- Game-over expiry (`continueMsLeft` countdown): decremented inside the
  gated gameover branch, frozen while paused. OK.
- Stage clear: `stageclear` event drains only while unpaused, BUT once
  drained it arms a wall-clock `this.time.delayedCall(2000)` to the result
  scene (GameScene ~line 461). Pause inside that 2s window: the overlay
  shows PAUSED, then the scene changes underneath it on wall-clock time.
  The fight is over so nothing sim-side breaks, but the documented
  guarantee is violated and the overlay's promise ("nothing changes until
  resume") visibly fails. NOT OK - the sole transition escaping the gate.

No duplicate: no task covers pause-vs-clear (only ENH-8's generic "resume
semantics" phrase mentions both words). Not a DIFF-1 matter (no tuning),
not owner-blocked, not a detector issue.

## Verdict: REAL DEFECT, WORTH FILING

Small, bounded, testable: freeze the clear countdown while paused (the
continue countdown is the in-repo template), pin with e2e both directions
(holds while paused, completes on resume), keep the unpaused 2s beat.
Filed as ENH-9 TODO; a later consumer implements. One-area budget spent;
no second area inspected.
