# Producer proposals - 2026-09-21 20:38 pass

Signals: `npm run signal` 13/13 ok, `npm run vision` 5/5 ok, findings 0 bytes.
No UX_REVIEW.md. All 9 frames eye-reviewed, no defect. No IN_PROGRESS/TODO.
One-area opportunity review: in-game pause (usability).

## Candidate 1: gameplay pause (ACCEPTED -> ENH-7)

- Verdict: real and worth fixing.
- Evidence: `pause` has zero matches in src/selfplay/test/e2e; the title
  screen's key list (arrows, Z, X, C, Enter, M, F-join) names no pause key;
  the only blur/suspend/hidden hits in src are touch-control naming,
  portrait shading alpha, and AudioContext resume - no gameplay handling.
  A full run is ~13 minutes of uninterrupted real-time action (ENH-6
  zhaoyun marathon: 47,416 ticks), so an unpausable session is a concrete
  usability gap, not polish.
- Duplicate check: no `paus*` task or rejection in TASKS.md or PROGRESS.md
  (only unrelated scheduler "error pause" mention). Next free id ENH-7.
- Scope: P toggles pause in stage gameplay incl. co-op; sim advances zero
  ticks while paused; legible overlay; resume is tick-neutral; title keys
  updated; full gates green. Non-goals: no pause menu/settings, no
  auto-pause on tab blur (owner behavior decision), no touch pause button
  (follow-up if the owner wants mobile parity), no DIFF-1 impact.
- DIFF-1 untouched: pause changes no frame data, spawns, or tuning, and
  the BLOCKED difficulty decision is not reopened.

## Nothing else filed

- No defect proposals: both signals green at snapshot levels, frames clean.
- One-area budget spent on pause; no second area inspected.
