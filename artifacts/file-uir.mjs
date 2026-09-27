import { readFileSync, writeFileSync } from 'node:fs'

// Producer filing: UIR batch 1 (UIR-1..6, within the six-task cap) + batch 2
// (UIR-7..11, owner-approved, exempt). All findings re-confirmed on the fresh
// capture this pass (V-3 by code arithmetic + previous capture: the fresh
// shot missed its ~200ms window; zero src/game changes since the review).
const RUN = '2026-09-27T03-49-44-795Z-e860f01f'

// --- 1. Proposals file (eval-loop step 5) ---
const proposals = `# Producer proposals ${RUN}

Signals: logic (selfplay) 13 passed, visual (vision) 5/5 - both green, match
the BODY-7 snapshot, no regressions. Fresh review capture: 59 screens
(artifacts/review/latest). UX_REVIEW.md absent (nothing to archive).

Re-confirmation on the fresh capture (VISUAL_REVIEW sections 2-3):
- V-1: REPRODUCES (crops/stage1-idle--centre.png: stage name over SCORE).
- V-2: REPRODUCES (crops/stage1-boss-warning--banner.png: title covered).
- V-3: REPRODUCES by code arithmetic (card at +1600ms vs banner visible to
  ~1680ms+; HudScene.ts:484 vs :175/:706); the fresh shot missed the ~200ms
  window. Previous capture shows the overlap; zero src/game changed since.
- V-4: REPRODUCES (screens/stage1-result.png: thin grey labels).
- V-5, V-6, V-7: REPRODUCE (result screen + continue dialog crop).
- V-9: REPRODUCES (phone-portrait-game: game band, no rotate hint).
- V-10: REPRODUCES (same shot: all four chevrons inward).
- V-11, V-13: REPRODUCE (flat landmark slabs + flat sky/clouds/ridge/ground
  on the fresh stage and phone screens).

Accepted: UIR-1..UIR-11 (batch 1 within cap; batch 2 owner-approved).
Rejected: none. New findings this pass: none (contact sheets show no new
defect beyond the ledger; characters are the BODY track's, swept clean).
`
writeFileSync(`artifacts/loop/proposals-${RUN}.md`, proposals)

// --- 2. TASKS.md entries (section 4 template) ---
const shared23 = `  2. After \`npm run review:capture\`, the affected screens are re-reviewed
     at gameplay size (and phone/WebGL where relevant) against \`previous/\`,
     citing the after-image detail; each listed finding is judged fixed.
  3. The contact sheets show no regression elsewhere; \`npm run vision\`
     and relevant specs are green; the ledger finding is set to
     \`fixed <commit> (self-check)\`.`
const entries = [
`### UIR-1 - Separate the stage name from the SCORE readout

- Status: TODO
- Source: UI review 2026-09-26, findings V-1 (S2)
- Evidence: artifacts/review/latest/crops/stage1-idle--centre.png - the
  stage name "博望坡" shares pixels with "SCORE 0" (re-confirmed fresh).
- Root cause: LAYOUT - src/game/ui/hudlayout.ts:44-45: STAGE_LABEL y1
  (spans y1-11) and SCORE y12 (spans y7-17) overlap by ~4px.
- Affected screens: every in-game screen (45 captures), all stages, phone
  and WebGL.
- Requirement: re-space the HUD centre column (stage label, score, WAVE
  chip) so the three lines never share pixels, keeping them inside the
  40px band.
- Acceptance criteria:
  1. A unit test on hudlayout asserts that the STAGE_LABEL, SCORE and CHIP
     vertical extents (font size and origin) are disjoint with a gap of at
     least 1px. The kit suspect "overlapping text" is gone from every
     manifest entry.
${shared23}
- Non-goals: moving the plates, or changing font sizes except as needed.`,
`### UIR-2 - Boss WARNING banner must read above the boss rail

- Status: TODO
- Source: UI review 2026-09-26, findings V-2 (S1)
- Evidence: artifacts/review/latest/crops/stage1-boss-warning--banner.png -
  only the "Li Dian 李典" subtitle shows; the red rail covers the WARNING
  title completely (re-confirmed fresh).
- Root cause: DEPTH - src/game/scenes/HudScene.ts:670-679 (banner) against
  :325-326 (rail depth wins while both visible).
- Affected screens: stage1-boss-warning (every boss entry).
- Requirement: while the rail is visible, the banner title must be fully
  visible. Either raise it above the rail or offset it below the rail.
  Stage banners keep their current look.
- Acceptance criteria:
  1. A spec or unit check shows that the WARNING title's bounds do not
     intersect the rail's bounds, or that the title's depth is greater
     than the rail's while both are visible. After the recapture,
     \`stage1-boss-warning--banner\` shows the word WARNING.
${shared23}
- Non-goals: the banner's art, or its hold duration.`,
`### UIR-3 - One stage announcement, not two at once

- Status: TODO
- Source: UI review 2026-09-26, findings V-3 (S2)
- Evidence: artifacts/review/previous/crops/stage1-intro--intro.png - the
  banner's "Bowang Slope" still shows above the intro card, which repeats
  it; code-certain overlap (card at +1600ms vs banner visible to ~1680ms+;
  HudScene.ts:484 vs :175/:706). The fresh capture missed the ~200ms
  window; zero src/game changed since, so it still reproduces.
- Root cause: TIMING - src/game/scenes/HudScene.ts:484 raises the card
  1_600 ms after build, while the banner (:175, BANNER_HOLD_MS plus 180
  ms in and out) is still up. Both carry stage number and name.
- Affected screens: stage1-9 banner and intro.
- Requirement: the intro card must not be raised while the stage banner
  is visible. Sequence them, or drop the duplicate stage name from one
  of them.
- Acceptance criteria:
  1. A spec shows that no frame has the introCard at alpha > 0 while
     stageBanner is at alpha > 0.05. Autopilot still dismisses the card
     by tick count, so \`run()\` never stalls.
${shared23}
- Non-goals: the lore text, or the card art.`,
`### UIR-4 - No 7px body-font labels

- Status: TODO
- Source: UI review 2026-09-26, findings V-4 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png - LIVES /
  SCORE / TIME are thin grey Arial-style caps, unlike every other word
  on the panel (re-confirmed fresh); same sans on the roster LIFE /
  SPEED rows and the HORSE row.
- Root cause: TYPE - \`liveStyle()\` (src/game/ui/type.ts) selects
  BODY_STACK below DISPLAY_MIN_SIZE. Callers: ResultScene.ts:186,
  SelectScene.ts:127-128, hudlayout.ts:21 (META_ROW).
- Affected screens: select-*, stage*-result, webgl-result, stage2/6-play
  (HORSE row), and the phone screens.
- Requirement: these labels use the display family at a size legible on
  a Pixel 7 (at least 7 CSS px there). Any new glyphs are added to the
  display string table and font subset.
- Acceptance criteria:
  1. The kit suspect "small text <8px" is gone from the manifest, and a
     unit test asserts that no \`liveStyle\` caller in the scenes passes
     a size below the display minimum. The after-review of the result
     crop, the roster crop and the phone select describes the labels as
     legible and matching.
${shared23}
- Non-goals: re-laying out the roster cards.`,
`### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast

- Status: TODO
- Source: UI review 2026-09-26, findings V-5, V-6, V-7 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png (LIVES
  chip on the parchment border; row spans x70-390, centre 230 not 240;
  STAGE CLEAR! touches the top bar) and
  crops/stage1-continue--dialog.png (CONTINUE? crosses the gold top
  rule; flat #ffd700 title + white "9" on cream) - all re-confirmed
  fresh. PAUSED on the same card sits properly inside with a dark
  stroke.
- Root cause: LAYOUT and COLOUR - HudScene.ts:440-448 (title at y92 on
  a card centred at y123 = its top edge; un-stroked liveStyle 22/30)
  and ResultScene.ts:98 and 114-116 (hard-coded chip offsets).
- Affected screens: stage1-continue, stage1-result, stage9-result,
  webgl-result.
- Requirement: the titles sit inside their card with the same inset as
  PAUSED. The chip row is centred on the panel and stays inside its
  frame. The CONTINUE? title and countdown get the dark stroke PAUSED
  uses.
- Acceptance criteria:
  1. A unit or spec check shows that the title bounds lie within the
     card's panelRect inset by at least 4px, that the chip row's centre
     is within 1px of the panel's centre, and that no chip crosses the
     panel's frame.
${shared23}
- Non-goals: the panel textures, or the countdown logic.`,
`### UIR-6 - Point the touch d-pad chevrons outward

- Status: TODO
- Source: UI review 2026-09-26, findings V-10 (S2)
- Evidence: artifacts/review/latest/screens/phone-portrait-game.png -
  the up arm shows a down-chevron, left ">", right "<", down "^"
  (re-confirmed fresh; same in landscape).
- Root cause: ASSET - src/game/art/hudart.ts:487-492: the chevron
  path's apex is at +y, so at angle 0 it points DOWN, but
  hudart.ts:498-501 assumes angle 0 points up.
- Affected screens: phone-landscape-game, phone-portrait-game.
- Requirement: each arm's chevron points in the direction the arm moves.
- Acceptance criteria:
  1. A unit test on the painted sheet shows that the up arm's chevron
     apex pixel is above its centre, and likewise for the other three
     arms. After the recapture, the phone crop shows outward arrows.
${shared23}
- Non-goals: the button layout, or the hit areas.`,
`### UIR-7 - Ask portrait phone players to rotate

- Status: TODO
- Source: UI review 2026-09-26, findings V-9 (S2) plus owner decision 1
  (rotate overlay, not a portrait layout)
- Evidence: artifacts/review/latest/screens/phone-portrait-game.png -
  the game fills ~28% of the height; touch buttons ~20 CSS px; no hint
  to rotate (re-confirmed fresh).
- Root cause: PLATFORM - src/game/main.ts:31-32 (Scale.FIT,
  CENTER_BOTH) has no orientation handling in index.html or
  src/style.css.
- Affected screens: phone-portrait-title, -select, -game.
- Requirement: on a touch device in portrait (height greater than
  width), show a full-screen themed "rotate your phone" overlay (a
  phone icon plus the text, in the display font, on the letterbox
  gradient) over the game. Gameplay is paused while the overlay shows
  and resumes when the phone is rotated back. Desktop and landscape
  are unchanged.
- Acceptance criteria:
  1. An e2e spec on a Pixel 7 portrait context shows the overlay
     visible and the sim tick not advancing. A landscape context shows
     no overlay, with ticks advancing. A desktop 960x540 context shows
     no overlay. The review capture's phone-portrait shots show the
     overlay, and the landscape shots do not.
${shared23}
- Non-goals: a portrait gameplay layout, or forcing orientation through
  the Screen Orientation API.`,
`### UIR-8 - Paint the landmark strip

- Status: TODO
- Source: UI review 2026-09-26, findings V-11 (S2)
- Evidence: fresh stage screens - flat grey slab with green lid (gorge
  wall), blank beige rectangles on posts (warship sails, hulls sunk),
  solid red slabs (cliffs); next to the painted heroes they read as
  placeholder art (re-confirmed fresh).
- Root cause: ASSET - src/game/art/backdrop.ts:318-512 \`paintMarks\`
  fillRect blocks, and the hull sink against MARKS_ROOT_DEPTH
  (GameScene.ts:67).
- Affected screens: all \`stage*-play\` screens, especially stage1
  (gorge), stage6 (warships) and stage7 (inferno).
- Requirement: repaint all nine landmark kinds with painted masses,
  tonal bands, lit and shadow sides and soft edges, so they
  recognisably stay the same place. The warship hulls must be visible
  above the waterline. Shared backdrop constraints apply (frozen tile
  geometry; bake-time paint, no per-frame cost rise; backdrop lower
  contrast/saturation than the cast with upper-left light; original
  art only).
- Acceptance criteria:
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one: the share of 16x16 opaque blocks whose
     luminance std-dev clears a stated threshold (record both values).
     The stage6 after-image shows hulls, masts and sails that read as
     ships. R5 (art consistency) scores at least 4 on the affected
     \`stage*-play\` screens against \`screens/title.png\`.
${shared23}
- Non-goals: new landmark kinds, or parallax factors.`,
`### UIR-9 - Paint the sky and clouds

- Status: TODO
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh \`stage*-play\`: smooth two-colour gradient sky
  and hard-edged flat-filled cloud lobes (re-confirmed fresh); against
  the painted heroes and title key art the game looks like two
  different products.
- Root cause: ASSET - \`paintSky\` :63 and \`paintCloud\` :199 in
  src/game/art/backdrop.ts (a flat gradient and hard flat lobes).
- Affected screens: all \`stage*-play\` and \`stage*-banner\` screens.
- Requirement: a painted sky (atmospheric gradient, subtle broken
  colour, soft light toward the sun side) and painted clouds (soft
  edges, a lit top and a shaded belly). The ember sky stays distinct.
  Shared backdrop constraints apply (see UIR-8).
- Acceptance criteria:
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one (16x16-block luminance std-dev share;
     record both values). R5 scores at least 4 on the affected screens
     against \`screens/title.png\`.
${shared23}
- Non-goals: weather, time of day, or animated sky.`,
`### UIR-10 - Paint the hill ridges with atmospheric depth

- Status: TODO
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh \`stage*-play\`: the ridge is a single-colour
  hill with an ink line (re-confirmed fresh).
- Root cause: ASSET - \`paintRidge\` :110 in
  src/game/art/backdrop.ts (single-colour hills with an ink line).
- Affected screens: all \`stage*-play\` screens.
- Requirement: painted far and near ridges (value falloff with
  distance, a lit crest and shaded flank, a soft haze join) instead
  of flat colour plus outline. Shared backdrop constraints apply
  (see UIR-8).
- Acceptance criteria:
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one (16x16-block luminance std-dev share;
     record both values). R5 scores at least 4 on the affected screens
     against \`screens/title.png\`.
${shared23}
- Non-goals: new ridge silhouettes per stage, beyond the existing
  colour table.`,
`### UIR-11 - Paint the ground per stage

- Status: TODO
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh \`stage*-play\`: the ground is one tint with a
  dot pattern (re-confirmed fresh).
- Root cause: ASSET - \`paintGround\` :155 in
  src/game/art/backdrop.ts (one tint with a dot pattern).
- Affected screens: all \`stage*-play\` screens, plus the phone and
  WebGL shots.
- Requirement: a painted walkable ground (varied grass, earth or stone
  strokes, horizon-lit to foreground falloff) that stays calm enough
  for the actors' shadows and hit effects to read. Shared backdrop
  constraints apply (see UIR-8).
- Acceptance criteria:
  1. A texture test on the layer FAILS on the current flat painter and
     passes on the new one (16x16-block luminance std-dev share;
     record both values). R5 scores at least 4 on the affected screens
     against \`screens/title.png\`; the actor ground shadows are still
     visible in the after-crops.
${shared23}
- Non-goals: collision, or the lane depth.`,
]
let tasks = readFileSync('TASKS.md', 'utf8').replaceAll('\r\n', '\n')
if (/^### UIR-/m.test(tasks)) throw new Error('UIR tasks already present')
tasks = tasks.replace(/\n*$/, '\n\n') + entries.join('\n\n') + '\n'
writeFileSync('TASKS.md', tasks)

// --- 3. Mark batches FILED ---
let batches = readFileSync('docs/UI_REVIEW_BATCHES.md', 'utf8')
if (!batches.includes('## UIR batch 1 (PENDING)')) throw new Error('batch1 marker')
if (!batches.includes('## UIR batch 2 (PENDING)')) throw new Error('batch2 marker')
batches = batches
  .replace('## UIR batch 1 (PENDING)', '## UIR batch 1 (FILED 2026-09-27)')
  .replace('## UIR batch 2 (PENDING)', '## UIR batch 2 (FILED 2026-09-27)')
writeFileSync('docs/UI_REVIEW_BATCHES.md', batches)

let ledger = readFileSync('docs/UI_REVIEW_LEDGER.md', 'utf8')
const h1 = '## UIR batch 1 - PENDING FILING (reviewed 2026-09-26 at 3fd3b32)'
const h2 = '## UIR batch 2 - PENDING FILING (owner-approved 2026-09-26)'
if (!ledger.includes(h1) || !ledger.includes(h2)) throw new Error('ledger headings')
ledger = ledger
  .replace(h1, '## UIR batch 1 - FILED (reviewed 2026-09-26 at 3fd3b32; filed 2026-09-27)')
  .replace(h2, '## UIR batch 2 - FILED (owner-approved 2026-09-26; filed 2026-09-27)')
const filed = [
  ['V-1 ', 'batched UIR-1', 'filed UIR-1'],
  ['V-2 ', 'batched UIR-2', 'filed UIR-2'],
  ['V-3 ', 'batched UIR-3', 'filed UIR-3'],
  ['V-4 ', 'batched UIR-4', 'filed UIR-4'],
  ['V-5 ', 'batched UIR-5', 'filed UIR-5'],
  ['V-6 ', 'batched UIR-5', 'filed UIR-5'],
  ['V-7 ', 'batched UIR-5', 'filed UIR-5'],
  ['V-9 ', 'batched UIR-7', 'filed UIR-7'],
  ['V-10 ', 'batched UIR-6', 'filed UIR-6'],
  ['V-11 ', 'batched UIR-8', 'filed UIR-8'],
]
for (const [v, from, to] of filed) {
  const i = ledger.indexOf('### ' + v)
  if (i < 0) throw new Error('finding ' + v + ' missing')
  const j = ledger.indexOf(from, i)
  const k = ledger.indexOf('\n', i)
  if (j < 0 || j > k) throw new Error('status for ' + v + ' missing')
  ledger = ledger.slice(0, j) + to + ledger.slice(j + from.length)
}
// V-13 feeds three tasks; handle its status line specially.
{
  const i = ledger.indexOf('### V-13 ')
  if (i < 0) throw new Error('V-13 missing')
  const k = ledger.indexOf('\n', i)
  const line = ledger.slice(i, k)
  if (!/batched UIR-9/.test(line)) throw new Error('V-13 status: ' + line)
  ledger = ledger.slice(0, i) + line.replace(/batched UIR-9[^)]*\)/, 'filed UIR-9/UIR-10/UIR-11)') + ledger.slice(k)
}
writeFileSync('docs/UI_REVIEW_LEDGER.md', ledger)

// --- 4. PROGRESS entry ---
const prog = readFileSync('PROGRESS.md', 'utf8')
const anchor = '## Entries\n\n'
const at = prog.indexOf(anchor)
if (at < 0) throw new Error('no Entries anchor')
const entry = `### 2026-09-27 04:10 UTC - Producer pass (UIR batch 1+2 filing)

- Status before: two ledger batches PENDING FILING (batch 1: UIR-1..6
  from the 2026-09-26 UI review; batch 2: UIR-7..11 owner-approved);
  signals last snapshotted green at the BODY-7 sweep.
- Work completed: producer pass per eval-loop. Logic signal (selfplay)
  13 passed; visual signal (vision) 5/5 - both green, no regressions.
  Fresh review capture: 59 screens. Re-confirmed every batched finding
  on the fresh capture (V-1, V-2, V-4..V-11, V-13 visually; V-3 by code
  arithmetic - card at +1600ms vs banner visible to ~1680ms+, the
  fresh shot missed its ~200ms window; zero src/game changed since
  the review). No new findings (contact sheets clean beyond the
  ledger). Filed UIR-1..UIR-11 into TASKS.md Enhancements (batch 1
  within the six-task cap; batch 2 owner-approved, exempt); marked
  both batches FILED in UI_REVIEW_BATCHES.md and the ledger; finding
  statuses set to filed.
- Files changed: TASKS.md (UIR-1..UIR-11 TODO),
  docs/UI_REVIEW_LEDGER.md (batches FILED, statuses),
  docs/UI_REVIEW_BATCHES.md (batches FILED), PROGRESS.md,
  artifacts/loop/proposals-${RUN}.md.
- Verification run: signal 13 passed; vision 5/5; review:capture 3
  passed (59 screens); no game code touched (producer pass).
- Result: 11 UIR tasks filed; queue ready for consumers.
- Status after: producer work done; no IN_PROGRESS started here.
- Remaining work or blocker: consumers implement UIR-1.. first
  (BODY-7 and ENH-12 stay IN_PROGRESS: owner acceptance / deferred).
- Next recommended task: UIR-1 (consumer).

`
writeFileSync('PROGRESS.md', prog.slice(0, at + anchor.length) + entry + prog.slice(at + anchor.length))
console.log('filed 11')
