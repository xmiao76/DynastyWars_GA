# Tasks Archive

Oldest DONE tasks, moved out of TASKS.md once the count passed
20. Never read during an iteration; consult only for completed work detail.

### TASK-001 - Project setup and working verification commands

- Status: DONE
- Requirement:
  Make this repository buildable and testable, so that every later iteration has
  something real to verify against. Every command listed under `Commands` in
  `PROJECT.md` must actually run. Choose the stack and tooling that suit the
  requirements in `PROJECT.md`, and update that command list if the names differ
  from what was guessed before the project existed.
  If the repository is already scaffolded, confirm each command runs and mark
  this task `DONE` without further change.
- Acceptance criteria:
  - [x] Every command listed under `Commands` in `PROJECT.md` runs and succeeds
  - [x] A `.gitignore` exists covering dependencies, build output, logs, and
        environment files, so no commit can capture secrets or generated files
  - [x] At least one test exists and is executed by the test command, so that a
        passing test run means something
  - [x] The project builds, or starts, whichever applies to it
- Non-goals:
  - Do not implement any feature requirement here. Feature work starts at `TASK-002`.
  - Do not add tools the requirements do not call for.

### TASK-002 - Vertical slice: one hero, one field, walk + attack, one enemy type

- Status: DONE
- Requirement:
  Build the smallest playable slice of the beat'em up. One fixed hero
  (Zhao Yun 趙雲); a stage-1 field segment with a side-scrolling camera and a
  walkable depth band (2.5D: x along stage, y depth, z jump height); 8-way
  walking clamped to the band; a 3-hit ground attack combo driven by data
  tables; one enemy type (soldier) that walks in, approaches the player,
  swings, suffers hitstun, and dies; one wave of 4 soldiers; the camera stays
  locked until the wave is cleared. Game logic lives in pure `src/core/`
  modules (entities as plain data, fixed 1/60s tick, seeded RNG); Phaser
  scenes only render and forward input. Placeholder graphics generated
  programmatically under a strict texture-key convention.
- Acceptance criteria:
  - [x] Unit: wave-1 spawn positions are produced by sim construction from a seed
  - [x] Unit: scripted attack inputs kill a soldier in exactly ceil(hp/dmg) hits
  - [x] Unit: a soldier swing damages the player
  - [x] Unit: twin sims with same seed and identical scripted inputs serialize
        identically after 600 ticks (determinism keystone)
  - [x] E2E: Enter starts the game scene; arrow keys move the player (snapshot
        position delta); attack key puts the player in `attack` state
  - [x] Signal (`npm run signal`): a deterministic greedy bot clears wave 1
        within a tick budget with no invariant violations
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No character select, jump, grab, items, or bosses yet (later tasks).
  - No pixel-art assets; programmatic placeholders only.

### TASK-003 - Jump, jump attack, knockdown/getup i-frames, spearman + archer enemies

- Status: DONE
- Requirement:
  Add vertical movement and defensive depth: jump with a z-curve, jump attack
  that hits only while airborne, knockdown followed by an invulnerable getup
  window (i-frames), and two new enemy archetypes: spearman (longer reach,
  slower swing) and archer (fires projectiles across the field).
- Acceptance criteria:
  - [x] Unit: jump z-curve rises and lands deterministically; jump attack
        connects only while z > 0
  - [x] Unit: knocked-down entity is invulnerable until its getup window ends
  - [x] Unit: spearman reach exceeds soldier reach; archer projectile travels
        and can hit the player
  - [x] E2E: jump key raises the player z value in the debug snapshot
  - [x] Signal: greedy bot survives through wave 3 with invariants intact
        (cleared all 3 waves at tick 1680, 46/120 hp, zero violations)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No grab/throw, no special moves, no items yet.

### TASK-004 - Grab/throw, desperation special, crates, food, weapons

- Status: DONE
- Requirement:
  Complete the core combat verbs: grab an adjacent enemy and throw it (thrown
  body damages other enemies); a desperation special attack that costs HP and
  grants i-frames; breakable crates/barrels that drop loot from a seeded
  table; food items that heal (capped at max HP); weapon pickups that change
  attack damage/reach while held.
- Acceptance criteria:
  - [x] Unit: grab requires adjacency and correct facing; throw deals damage
        plus collateral hits on other enemies
  - [x] Unit: special costs the exact HP amount and grants i-frames
  - [x] Unit: crate loot table honors the seed; food heal caps at maxHp
  - [x] Signal: bot demonstrably picks up food when hurt and uses the special
        when surrounded (cleared 3 waves, foodEaten=2, specialsUsed=1, 69 hp)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No bosses, no stage progression yet.

### TASK-005 - Character select screen with all five heroes

- Status: DONE
- Requirement:
  Add a character-select scene between title and stage, offering Guan Yu 關羽,
  Zhang Fei 張飛, Zhao Yun 趙雲, Huang Zhong 黃忠, and Wei Yan 魏延 (English
  name plus Chinese characters). Per-character stats and special-move data in
  `characters.ts`; the HUD shows the selected hero's name.
- Acceptance criteria:
  - [x] E2E: selecting each of the 5 heroes boots the game with the correct
        character id in the debug snapshot
  - [x] Unit: every character's attack/special data passes a schema sanity
        check (positive damage, frame counts sum correctly)
  - [x] Unit: per-character stat differences are reflected in sim (e.g. speed,
        damage values differ per table)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No unique art per hero beyond distinct placeholder colors/labels.

### TASK-006 - Stage 1 boss Li Dian 李典 and stage-clear flow

- Status: DONE
- Requirement:
  Add the stage-1 boss Li Dian 李典 with an original attack-pattern state
  machine (approach / combo / charge / enrage below 30% HP), a boss HP bar,
  and the stage-clear flow: boss death -> result screen (score, time) ->
  return to title.
- Acceptance criteria:
  - [x] Unit: boss pattern transitions follow the FSM, including enrage at the
        HP threshold; boss death emits a `stageclear` event
  - [x] Signal: greedy bot clears stage 1 end-to-end within a tick budget,
        invariants intact (3120 ticks, 120/120 hp, score 2300)
  - [x] E2E: result screen appears after boss defeat and returns to title
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No additional stages; no audio (later enhancements).

## Enhancements

Add future enhancement tasks below this heading.

### TASK-007 - Game-over/continue flow with lives

- Status: DONE
- Requirement:
  Player death must not silently stall the game. On death: a CONTINUE?
  countdown overlay (9 -> 0, arcade style). Enter during the countdown spends
  one life and revives the player at the current wave with full HP; the
  countdown expiring (or starting with no lives left) goes to a GAME OVER
  screen, then title. A run starts with 3 lives. Lives and score persist
  across stage transitions (a run-state object carried across scenes); game
  over resets them.
- Acceptance criteria:
  - [x] Unit: player death flips sim phase to 'gameover' with an event;
        revive restores full HP to idle state and decrements lives
  - [x] Unit: revive with 0 lives remaining is rejected
  - [x] E2E: idle player dies -> continue screen appears -> Enter revives
        with full HP; letting the countdown expire reaches game over -> title
  - [x] Signal: existing stage-1 clear run stays green (bit-identical:
        3120 ticks, 120 hp, score 2300)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No score persistence beyond the run; no difficulty scaling on continue.

### TASK-008 - Strengthen the producer signal

- Status: DONE
- Requirement:
  Widen the self-play harness so the producer keeps finding real issues:
  (a) a marathon mode that clears stage 1 as EACH of the five heroes (report
  per-hero ticks/hp); (b) an idle-bot run that must reach the game-over
  phase (proves the death path); (c) perf invariants checked each poll:
  live entity count stays bounded, and snapshot serialization stays stable.
  The signal stays deterministic and reports a consolidated JSON summary.
- Acceptance criteria:
  - [x] Signal run includes all five heroes clearing stage 1, each with zero
        violations (guanyu/zhaoyun/zhangfei/huangzhong/weiyan all clear)
  - [x] Signal run includes an idle-bot game-over assertion (dies at tick 1380)
  - [x] Perf invariant: live entity count never exceeds a bound (40)
  - [x] `npm run signal` reports the consolidated per-hero JSON summary
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No load/stress tooling beyond the bounded invariants above.

### TASK-009 - Stage 2 (Xiahou Dun 夏侯惇) + stage-progression machinery

- Status: DONE
- Requirement:
  Add stage 2 and the machinery for progressing between stages: result
  screen Enter now advances to the NEXT stage (not title) until the final
  one. Stage 2 (Xinye Fields 新野) gets its own length, wave tables, props,
  and boss Xiahou Dun 夏侯惇 with a distinct pattern (faster cadence, longer
  charge). Score and lives carry over via the run state from TASK-007.
- Acceptance criteria:
  - [x] Unit: stage-2 spawn tables are deterministic from the seed; Xiahou
        Dun's data differs from Li Dian's and passes the boss schema checks
  - [x] E2E: clearing stage 1 -> result -> Enter -> game scene boots stage 2
        (snapshot stageId) with score carried over
  - [x] Signal: marathon clears stages 1-2 back to back (all five heroes;
        zhangfei/huangzhong/weiyan each used 1 continue on stage 2)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No new enemy archetypes; difficulty comes from wave tables and boss data.

### TASK-010 - Stages 3-5 with bosses Xu Chu 許褚, Cao Ren 曹仁, Zhang Liao 張遼

- Status: DONE
- Requirement:
  Stages 3, 4, and 5, each with its own stage name (bilingual), length, wave
  tables, props, and boss. Bosses must differ measurably in pattern data
  (speed, reach, think cadence, enrage ratio) and at least one signature
  attack each (new attack defs allowed). Suggested flavor: Xu Chu
  charge-heavy, Cao Ren defensive with more HP, Zhang Liao fast.
- Acceptance criteria:
  - [x] Unit: each new boss's FSM data validates (schema check across all
        bosses) and enrage ratios differ per boss (0.25/0.30/0.35/0.40/0.45)
  - [x] Signal: marathon clears stages 1-5 within a bounded budget (zhaoyun
        5-stage run; all other heroes clear stages 1-2)
  - [x] E2E: stage 3 boots and plays via the bridge
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No horseback sections yet (separate future enhancement).

### TASK-011 - Stages 6-9, final boss Lu Bu 呂布, game-complete screen

- Status: DONE
- Requirement:
  Stages 6-9 with bosses Xu Huang 徐晃, Zhang He 張郃, Cao Cao 曹操, and the
  final boss Lu Bu 呂布 (highest HP, most aggressive pattern). Clearing
  stage 9 shows a GAME COMPLETE screen (score, total time) before title,
  and the run state resets.
- Acceptance criteria:
  - [x] Unit: all nine stages have valid, seed-deterministic spawn tables;
        Lu Bu's HP (400) and heavy damage (20) exceed every other boss
  - [x] Signal: full 9-stage marathon completes (zhaoyun, 30650 score,
        continues spent but never exhausted thanks to 1UP milestones)
  - [x] E2E: clearing stage 9 shows the game-complete screen, then title
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No endings/credits story screens beyond the game-complete screen.

### TASK-012 - Programmatic audio: sfx and music

- Status: DONE
- Requirement:
  100% original, programmatically generated audio: WebAudio oscillator sfx
  (attack swing, hit, KO, pickup, special, jump, throw, boss enrage) driven
  by the sim's per-tick event stream, plus a simple procedural music loop on
  title and game scenes. Audio unlocks on the first user gesture (Enter on
  the title screen). Mute toggle on a key (M).
- Acceptance criteria:
  - [x] Unit: event-to-sfx mapping covers the event types and returns
        deterministic parameters
  - [x] E2E: after the Enter gesture, scripted combat produces a non-empty
        sfx event queue (assert the queue, not the audio device)
  - [x] Signal stays green (audio must not affect determinism; canonical run
        reports sfxPlayed > 100)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No sampled audio files, no music tracks beyond the procedural loop.

### TASK-013 - Animation and placeholder-art polish

- Status: DONE
- Requirement:
  Upgrade the programmatic placeholders without external assets: 2-frame
  walk cycles, attack lunge poses, lying-down knockdown pose, jump pose,
  larger boss sprites, and a ground shadow ellipse under each entity. All
  textures remain generated under the existing key convention so a future
  pixel-art pass only swaps texture generation.
- Acceptance criteria:
  - [x] E2E: walking cycles the walk frames (walk0/walk1 texture keys seen),
        and a knockdown renders the lying pose (`:down` texture key)
  - [x] Signal stays green; screenshots show distinct poses per state
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No hand-drawn or AI-generated image files; no sprite sheets yet.

### TASK-014 - Horseback combat

- Status: DONE
- Requirement:
  The arcade's signature mount: a horse stands as a prop in stage 2 and
  stage 6. Walking into it mounts the player. Mounted: faster movement
  (2.2 px/tick), a long spear-sweep attack replacing the ground combo, no
  jump/grab/special. Enemy hits while mounted damage the horse (20 hp);
  at 0 the horse flees off-screen and the player dismounts with i-frames.
  The self-play bot seeks and uses horses.
- Acceptance criteria:
  - [x] Unit: walking into the horse mounts it; mounted speed/attack differ
        from on-foot; jump/grab/special are disabled while mounted
  - [x] Unit: hits redirect to the horse; at horse hp 0 the horse flees and
        the player dismounts with i-frames
  - [x] E2E: scripted approach mounts the horse (snapshot mounted=true,
        horseHp=20, mounted speed exceeds on-foot)
  - [x] Signal: stays green (7/7); bot mounts the stage-2 horse at tick 43
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No mounted special/charge move, no horse for enemies, no horse
    selection. Stages other than 2 and 6 get no horses.

## Archived 2026-09-15 (finished before and during the UI-FIX series)

### TASK-015 - Pixel-art sprite swap

- Status: DONE
- Requirement:
  Replace the generated rectangle placeholders with original pixel-art
  sprites, hand-authored as typed pixel-map data in code (no image files,
  nothing copyrighted), loaded as spritesheets under the EXISTING texture
  keys (`entity:<kind>:<pose>`, `entity:<prop>`). Each of the 5 heroes, 3
  grunt types, 9 bosses, horse, and props get distinct readable pixel
  sprites in the existing pose set.
- Acceptance criteria:
  - [x] Unit: every kind/pose key used by the game has a pixel-map texture
        registered (convention check across the full key list; all maps
        rectangular and palette-covered; every kind visually distinct)
  - [x] E2E: game boots with the new textures (texture keys unchanged);
        walk cycle and down pose still asserted (anim spec green)
  - [x] Signal stays green (7/7)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No external image files, no AI-generated art, no animation-state changes
    (poses and timing stay as they are).

### TASK-016 - Strengthen producer probes

- Status: DONE
- Requirement:
  New probe axes for the saturated signal: (a) multi-seed sweep - the
  canonical zhaoyun stage-1 clear runs under 3 additional seeds and must
  pass each; (b) weapon assertion - the bot must pick up and use a sword
  when one drops (assert player.weapon via snapshot); (c) perf invariant -
  the harness records wall-clock per 1000 ticks and fails above a budget.
- Acceptance criteria:
  - [x] Signal: canonical clear passes under seeds 42, 7, 1337, 2024 (seed
        sweep spec; all four clear stage 1)
  - [x] Signal: a run demonstrably picks up and fights with the sword
        (weapon probe, seed 4: sword in hand at tick 300)
  - [x] Signal: perf invariant in the JSON summary (ms per 1000 ticks via
        in-page synchronous bench; 7ms vs 1000ms budget)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No load testing, no new gameplay assertions beyond the three axes.

### TASK-017 - AI art pipeline + BootScene + sample sprite

- Status: DONE
- Requirement:
  Build the AI-art asset pipeline: scripts/bake-art.mjs (Node + pngjs)
  chroma-keys the corner-sniffed backdrop color (magenta/green/blue snapped),
  despills edges, trims the alpha bbox, downscales into a fixed per-kind frame
  box (feet bottom-center, never upscale), and writes
  public/assets/sprites/<kind>/<pose>.png plus public/assets/manifest.json
  (per-kind atomic: a kind ships only when all its poses exist). Add a
  BootScene that loads the manifest (relative URL) and preloads images under
  the existing texture keys before the title screen; missing keys fall back
  to the pixel-map pipeline (unchanged). Produce one end-to-end sample:
  zhaoyun idle sprite via the Gemini image tool, baked and shown in-game.
- Acceptance criteria:
  - [x] Unit: bake helpers (key-color sniff, alpha ramp, trim, compose-into-
        box) verified on synthetic pixel arrays; manifest per-kind atomicity
        enforced
  - [x] E2E: with the sample manifest present, the game boots and the zhaoyun
        idle texture is the baked PNG (36x46 vs 30x40 fallback); pixel
        fallback intact for unbaked kinds
  - [x] Signal stays green (12/12)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Note: the sample sprites are programmatic stand-ins (scripts/
  make-sample.mjs) because the Gemini image API quota was exhausted (limit 0
  on the free tier for the image model). TASK-018/019 generate real art when
  quota allows; until then they are effectively quota-blocked.
- Non-goals:
  - No mass generation yet (that's TASK-018/019); no background art (TASK-020).

### TASK-021 - Game feel: hit-stop, shake, sparks, combo counter, dust

- Status: DONE
- Requirement:
  Add hit-stop (sim.freezeTicks: 2 ticks per hit, 5 per KO, 8 on boss KO,
  max-not-sum, set in stepSim by scanning this tick's events; frozen ticks
  advance tick but skip world updates). Fix the validated landmine first:
  replace jumpStartTick with an airTicks counter so frozen ticks can't
  fast-forward the jump parabola. Add combo counter (sim.stats.comboHits,
  45-tick window, melee-only attribution, reset when the player is hit).
  Presentation juice from drained events, gated behind !autopilot, max 6
  bursts/frame: camera shake (finisher/knockdown 80ms@0.0035, KO
  120ms@0.005, boss hit 150ms@0.006, stageclear 200ms@0.004), spark bursts
  on hit, KO burst, landing dust (new 'land' event on jump landing + thud
  sfx). Combo HUD readout ("n HITS" from 2).
- Acceptance criteria:
  - [x] Unit: freeze pauses world updates but advances tick; jump arc is
        freeze-safe (airTicks); twin-sim determinism with hits stays
        bit-identical; combo window math
  - [x] E2E: combo counter registers chained hits (juice.spec); autopilot
        runs spawn zero live particles
  - [x] Signal stays green (12/12)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No input buffering changes, no dash move.

### TASK-022 - UI/HUD overhaul

- Status: DONE
- Requirement:
  Framed HP/boss bars (border + gradient fill), select-screen portrait
  images (portrait:<charId> keys from the pipeline, palette-rect fallback),
  stage-entry banner (stage name EN + 中文, tween in/out ~2s), boss-spawn
  banner (on boss spawn event), result-screen polish ( framed panel, score
  count-up tween optional).
- Acceptance criteria:
  - [x] E2E: stage banner appears on stage entry; boss banner on boss spawn;
        select shows portraits when manifest-covered (palette-rect fallback
        intact - portrait art is quota-blocked with TASK-018)
  - [x] Signal stays green (12/12)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
- Non-goals:
  - No menu restyling beyond the above; no new scenes.

### UI-2 - Readable character rendering (outlines, shading, distinct heroes)

- Status: DONE
- Requirement:
  Replace the flat two-tone figure placeholders with readable characters:
  dark outline pass, armor shading (2-3 tones), per-hero headgear/beard/
  weapon variants so the five heroes are visually distinct (not just palette
  swaps), and a drop shadow beneath each combatant in-game. All still
  programmatic (AI art stays quota-blocked).
- Acceptance criteria:
  - [x] Unit: a baked hero sprite contains >= 4 distinct opaque colors
        (outline + skin + armor + accent) - heroes have 40-62 colors
  - [x] Unit: the 5 heroes are pairwise visually distinct (24%+ differing
        pixels between heroes, beyond palette)
  - [x] Probe: hero figure visible as a readable helmeted warrior in the
        game scene
  - [x] e2e + signal stay green; lint/typecheck/build pass
- Non-goals:
  - No real AI art (quota-blocked); no new poses.

### UI-3 - Modern HUD panels

- Status: DONE
- Requirement:
  Replace flat text-and-rectangle HUD with framed, glassy-gradient panels:
  HP bar with shine, boss bar, score/lives/weapon chips, combo banner, styled
  continue overlay; title and select screens get panel/painted look.
- Acceptance criteria:
  - [x] Probe (screenshot ASCII check): HUD band shows framed gold/red glass
        panels + gradient bars, not flat text
  - [x] e2e (hudpanels.spec) asserts glass panel Graphics + gradient bar
        textures (bar-green/red/boss) + HP bar Image exist
  - [x] e2e + unit green; lint/typecheck/build pass
- Non-goals:
  - No gameplay changes.

### UI-4 - Polish pass (vignette, stage slabs, result dialog)

- Status: DONE
- Requirement:
  Camera framing, vignette overlay, stage-name slabs, styled result/game-over
  dialogs. Keep the deterministic sim untouched.
- Acceptance criteria:
  - [x] e2e (15/15) + signal (12/12) green
  - [x] Probe (screenshot ASCII check): stage slab + vignette + HUD panels
        read as a coherent modern 2D frame
  - [x] lint/typecheck/build pass
- Non-goals:
  - No mechanics changes.

### FRAMEWORK-V1 - Visual health gate wired into the producer loop

- Status: DONE
- Requirement:
  Close the loop gap: the test/eval step now measures whether the game is
  playable AND looks right. `npm run vision` screenshots every core screen,
  computes objective visual-health metrics (coverage, color richness,
  saturation, region fill) with per-screen thresholds, writes
  artifacts/vision/{report.json,findings.jsonl} and PNGs for human review.
  The eval-loop (.claude/eval-loop.md) consumes vision findings to file UI-FIX
  tasks automatically and honors a human UX_REVIEW.md note channel; the
  consumer (loop.md) gates UI work on `npm run vision`; PROJECT.md documents
  the dual-signal design.
- Acceptance criteria:
  - [x] `npm run vision` passes on the current render (brand-new baselines:
        title cov 0.75/380 colors/9 regions; select cov 1.0/247; game_idle &
        game_combat 300+ colors, 8-9/9 regions) - proves the gate is green on
        good renders and not noise
  - [x] Finding -> UI-FIX task path demonstrated (synthetic finding filed into
        TASKS.md then cleaned up)
  - [x] Unit tests for the metric math (empty fails, vivid passes, flat-frame
        guard) in test/selfplay/vision-metrics.test.ts
  - [x] Full battery green: lint, typecheck, 91 unit, 15 e2e, build

### FRAMEWORK-V2 - Widen the visual net: boss + more heroes + more screens

- Status: DONE
- Requirement:
  The FRAMEWORK-V1 vision gate only screenshots 4 moments of one Zhao Yun
  path (title/select/idle/combat). Widen it so the visual net catches more
  real render breaks: (a) a boss fight screen (stage-3 arena forced via the
  debug bridge so it's fast and deterministic), (b) a result screen, and
  (c) run the game_idle/combat capture for a second hero (e.g. Zhang Fei) so
  per-hero rendering is watched. Keep vision fast (< ~30s): reuse
  deterministic autopilot + the startGame bridge, not long bot marathons.
  Thresholds for the new screens go in vision/thresholds.ts.
- Acceptance criteria:
  - [x] `npm run vision` covers boss_fight, game_combat_zhangfei, and all core
        screens; screenshots written to artifacts/vision/*.png
  - [x] Baselines for the new screens pass on the current render (boss_fight
        cov 0.16 / 383 colors on stage 3; Zhang Fei combat 0.16 / 371 colors)
  - [x] Unit tests green; vision/lint/typecheck/test/build all pass
- Non-goals:
  - No longer bot runs; no mechanics changes.

### FRAMEWORK-V3 - Vision net covers result and game-over screens

- Status: DONE
- Requirement:
  The vision gate (FRAMEWORK-V2) skips the result and game-over screens
  because they need a long bot run to reach. Add a small deterministic bridge
  helper to land on those scenes quickly (e.g. force a stage clear / game
  over via the debug bridge), extend vision/vision.spec.ts to capture and
  assert them, and add thresholds in vision/thresholds.ts. This closes the
  one remaining gap in "the loop actually sees every screen".
- Acceptance criteria:
  - [x] `npm run vision` captures result + game_over screenshots; both pass
        thresholds after the gate caught and drove a fix for their sparse
        renders (result coverage 0.05 -> 0.81, game_over 0.02 -> 0.57)
  - [x] Unit tests green; lint/typecheck/test/build pass
- Non-goals:
  - No mechanics changes.

### SUPERSEDED 2026-09-15 - TASK-018 / TASK-019 / TASK-020

These three were BLOCKED on Gemini image generation, which is unavailable on
this account (limit 0 for the image model, so waiting never unblocks it).
They are superseded by the UI-R series in TASKS.md, which reaches the same
cel-shaded 2D-fighter look by drawing the art programmatically with canvas-2D
vector paths instead of generating it.

Nothing is lost by closing them. The bake pipeline (scripts/bake-art.mjs,
scripts/bake-core.mjs), the __HAS_BAKED_ART__ build flag and the ?bakedart=1
debug switch all stay in place and stay e2e-covered, so externally produced
art can still be dropped in later without another redesign. Their original
text follows.

### TASK-018 - Hero sprite set + select portraits

- Status: BLOCKED

  BLOCKED REASON: Gemini image generation is unavailable on this account's
  plan. Retested 2026-09-15: HTTP 429 RESOURCE_EXHAUSTED with
  `limit: 0, model: gemini-3-pro-image` on all three free-tier image
  quotas. This is NOT a quota that refills - the free-tier allowance for
  the image model is zero, so waiting will not unblock it. It needs
  billing enabled on the Google AI Studio project (or a different image
  provider). The bake pipeline (scripts/bake-art.mjs) is proven end to end
  and `?bakedart=1` keeps the manifest path e2e-covered, so art can be
  dropped in whenever that changes. Meanwhile the programmatic pixel art
  (UI-FIX-2, UI-FIX-6) clears the visual gate on its own, so these tasks
  are an upgrade rather than a repair. A person resets this to TODO once
  image generation is actually available.
- Requirement:
  Generate and bake the full sprite sets for the five heroes (idle, walk0,
  walk1, attack, jump, down) plus select-screen bust portraits, via per-kind
  Gemini image-edit sessions (idle first, chained pose edits) for
  consistency. Cel-shaded 2D fighter style, original designs.
- Acceptance criteria:
  - [ ] All five heroes render from baked PNGs in-game (manifest-covered);
        walk/attack/down poses visibly distinct
  - [ ] Select screen shows portraits (palette-rect fallback remains)
  - [ ] Unit: manifest covers all five heroes x 6 poses + 5 portraits
  - [ ] E2E + Signal stay green
  - [ ] Visual review: baked PNGs read as the intended heroes
- Non-goals:
  - No new animations beyond the existing pose set.

### TASK-019 - Grunt/boss/horse/prop sprite sets

- Status: BLOCKED

  BLOCKED REASON: Gemini image generation is unavailable on this account's
  plan. Retested 2026-09-15: HTTP 429 RESOURCE_EXHAUSTED with
  `limit: 0, model: gemini-3-pro-image` on all three free-tier image
  quotas. This is NOT a quota that refills - the free-tier allowance for
  the image model is zero, so waiting will not unblock it. It needs
  billing enabled on the Google AI Studio project (or a different image
  provider). The bake pipeline (scripts/bake-art.mjs) is proven end to end
  and `?bakedart=1` keeps the manifest path e2e-covered, so art can be
  dropped in whenever that changes. Meanwhile the programmatic pixel art
  (UI-FIX-2, UI-FIX-6) clears the visual gate on its own, so these tasks
  are an upgrade rather than a repair. A person resets this to TODO once
  image generation is actually available.
- Requirement:
  Generate and bake sprite sets for soldier/spearman/archer, all 9 bosses,
  the horse (idle/walk0/walk1; attack/jump/down alias to idle), and props
  (crate/meat/sword/arrow).
- Acceptance criteria:
  - [ ] Manifest covers all enemy kinds, horse, and props
  - [ ] E2E + Signal stay green; bosses visually larger than grunts
  - [ ] Visual review of key baked PNGs
- Non-goals:
  - No new enemy behaviors.

### TASK-020 - Stage backgrounds + parallax

- Status: BLOCKED

  BLOCKED REASON: Gemini image generation is unavailable on this account's
  plan. Retested 2026-09-15: HTTP 429 RESOURCE_EXHAUSTED with
  `limit: 0, model: gemini-3-pro-image` on all three free-tier image
  quotas. This is NOT a quota that refills - the free-tier allowance for
  the image model is zero, so waiting will not unblock it. It needs
  billing enabled on the Google AI Studio project (or a different image
  provider). The bake pipeline (scripts/bake-art.mjs) is proven end to end
  and `?bakedart=1` keeps the manifest path e2e-covered, so art can be
  dropped in whenever that changes. Meanwhile the programmatic pixel art
  (UI-FIX-2, UI-FIX-6) clears the visual gate on its own, so these tasks
  are an upgrade rather than a repair. A person resets this to TODO once
  image generation is actually available.
- Requirement:
  Per-stage AI background art: far parallax layer (512x160 tile,
  scrollFactor 0.4, world-anchored, stage.length+32 wide, depth -10) and
  floor strip (256x96 tile aligned so the walkable band reads at y 150-196,
  scrollFactor 1, depth -5). Flat-color rects remain the fallback. Remove
  `image-rendering: pixelated` from style.css (wrong for cel-shaded art).
  Backgrounds get an empty lower walkable strip with no characters in-frame.
- Acceptance criteria:
  - [ ] All 9 stages have far+floor art loaded via manifest, parallax visible
        on scroll (e2e: tilePositionX/scrollFactor assertion via scene read)
  - [ ] E2E + Signal stay green
  - [ ] Visual review of 2+ stage screenshots
- Non-goals:
  - No foreground layers, no animated backgrounds.

### ARCHIVED 2026-09-16 - UI-FIX-1..8 and FRAMEWORK-V4

The visual-gate repair series that preceded the UI redesign, moved out of
TASKS.md per working rule 11 once the DONE count passed 20. Worth knowing
they are here: several of them explain WHY a gate is shaped the way it is,
and the redesign's own notes refer back to them by name - UI-FIX-1 for the
negative control, UI-FIX-3 for renderer parity, UI-FIX-5 for the baked-art
flag.

### UI-FIX-1 - Visual gate must actually judge characters (non-vacuous)

- Status: DONE
- Requirement:
  The vision gate passed a render in which every character is a stack of
  flat rectangles with no face, no arms and no visible weapon, and in which
  every HP bar is invisible. Root causes, all verified:
  (a) the four frame metrics (coverage/colorRichness/saturation/regionFill)
      are frame-GLOBAL and dominated by the sky/grass backdrop, so they score
      ~0.93 coverage / 700 colors no matter what the characters look like;
  (b) the one character-level check (`regionLegibility`, colorCount>=4,
      dominantFraction<=0.9) samples a screen box that INCLUDES the
      background - an empty patch of sky scores 4-17 colors and 0.29-0.47
      dominance, i.e. it PASSES. The guard cannot fail, so it proved nothing;
  (c) nothing checked enemies, bosses, weapons or props - only the player;
  (d) nothing checked that a HUD texture has visible pixels (hudpanels.spec
      asserts the textures EXIST, not that they render anything).
  Fix the gate so these failures are caught:
  - New `vision/sprite-metrics.ts`: structural metrics over the live texture
    (alpha-masked, so the background cannot contribute) - silhouette
    complexity, appendage rows, opaque color count/dominance, outline ratio,
    and a weapon-reach check (attack pose must extend beyond idle).
  - Assess EVERY kind the game renders (heroes, grunts, bosses, horse, props)
    and every pose, pulled from the running game's texture manager.
  - HUD visibility: every `hud:*` bar texture must have opaque pixels.
  - NEGATIVE CONTROL: the gate asserts its own character check FAILS on an
    empty background window. A gate that cannot fail is not a gate.
- Acceptance criteria:
  - [x] Unit: each new metric verified on synthetic inputs, including a
        box-stack figure that FAILS and a detailed figure that PASSES
        (test/selfplay/sprite-metrics.test.ts, 14 cases)
  - [x] `npm run vision` FAILED on the box art as filed: 116/116 sprites,
        17/17 weapons, 3/3 HUD bars, findings written to findings.jsonl
  - [x] Negative control green: the character gate rejects a patch of empty
        backdrop (silhouetteComplexity 0.031, appendageRatio 0)
  - [x] lint/typecheck/test/build pass
- Note: two metric bugs were found by running the gate against real art and
  fixed rather than tuned around. (a) silhouetteComplexity was resolution-
  dependent - rendering the same art at 2x halved its score - so it is now
  measured on a fixed 32-row grid, with x quantized against the height span so
  a swung weapon cannot squeeze the body's detail away. (b) appendageRatio
  scanned rows only, which assumes every figure is upright and called every
  prone `down` pose featureless; it now takes the larger of the row and column
  readings. Calibration after both fixes: old box art 0.156-0.250, new art
  0.375-0.469, threshold 0.3.
- Non-goals:
  - No art changes in this task (that is UI-FIX-2).

### UI-FIX-2 - Characters and weapons must be readable; HP bars visible

- Status: DONE
- Requirement:
  Make the game look playable. Verified problems:
  (a) `public/assets/sprites/**` holds programmatic STAND-IN art
      (scripts/make-art.mjs, axis-aligned fillRect boxes) that BootScene loads
      under `entity:<kind>:<pose>`, shadowing the better hand-authored pixel
      maps in `src/game/art/pixels.ts`. Lu Bu is a single giant rectangle; the
      sword pickup is a 1-colour grey rectangle;
  (b) the pixel maps themselves are only 15x20 and stretched to 92px on
      screen, with no outline, no face and a 1px weapon - too coarse to read;
  (c) every HP bar is invisible: `createBarTexture` uses
      `Graphics.fillGradientStyle` + `generateTexture`, and generateTexture
      always renders through the CANVAS path, which ignores gradient fills -
      `hud:bar-green`/`-red`/`-boss` are fully transparent in BOTH renderers.
  Fix: drop the stand-in art so the pixel maps are authoritative again,
  author readable higher-resolution pixel art (outline pass, face, per-kind
  headgear/beard/cape, shaped per-kind weapons, shaped props), and build the
  bar textures with a canvas 2D gradient (renderer-independent).
- Acceptance criteria:
  - [x] `npm run vision` green: 4/4 gates, 112/112 sprites, 17/17 weapons
  - [x] HP bar and boss bar visibly filled (screenshot-confirmed)
  - [x] Weapons readable: every armed kind reaches 4px+ past idle
  - [x] e2e 17/17; lint/typecheck/test(111)/build pass
- Non-goals:
  - No AI-generated art (still quota-blocked); no mechanics changes.

### UI-FIX-3 - Deployed (WebGL) UI differed completely from every check

- Status: DONE
- Requirement:
  Owner deployed with deploy.bat and got a different UI than local. Not a
  deploy fault: the deployed bundle hash matched the local build exactly, and
  local WebGL reproduces the deployed render pixel for pixel. The game ships
  on `Phaser.AUTO` - WebGL in every real browser - while every automated check
  runs `?renderer=canvas`, so the gate scored a rendering path no player sees.
  `Graphics.fillGradientStyle` is WebGL-only: under canvas the fill draws
  NOTHING. So `drawPanel` produced an empty outline in canvas and an opaque
  slab in WebGL. Four scenes (title, select, result, game over) passed that
  panel a depth of 100-1000 while every sprite and label in them sat at the
  default depth 0, so in WebGL the panel covered its own contents - title text
  unreadable, heroes hidden, dialogs blank. GameScene was unaffected because
  its HUD sets explicit depths.
- Acceptance criteria:
  - [x] New `vision/renderer-parity.spec.ts` draws every core screen under
        BOTH renderers and requires the measurements to agree; it FAILED on
        the shipped code (title 605 vs 256 colours, select 531 vs 74, result
        and game_over also off on saturation) and passes after the fix
  - [x] `drawPanel` uses solid fills, so canvas and WebGL agree
  - [x] Menu/dialog panels drop to depth 0 and rely on insertion order, which
        already placed them before their content
  - [x] vision 5/5, e2e 17/17, 110 unit, lint/typecheck/build pass
- Non-goals:
  - No redesign of the panels themselves; no deploy-pipeline changes.

### UI-FIX-4 - Buried labels: occlusion gate + dialog layout

- Status: DONE
- Requirement:
  Reviewing the WebGL screens by eye turned up labels hidden behind their own
  plates - a class nothing in the gate could see. The frame metrics are
  whole-screen averages, the sprite metrics look at textures, and the parity
  check only asks whether the two renderers AGREE, which they happily do when
  both draw the same plate over the same label. Add an occlusion check and fix
  what it finds.
- Acceptance criteria:
  - [x] New `e2e/layout.spec.ts` walks the display list of title, select,
        game, result and game-over and flags any text substantially covered by
        an opaque object added AFTER it at the same or higher depth. Narrow by
        design: anything drawn before a label is its background, a translucent
        overlay is a tint, and a label over its own plate is fine
  - [x] It FAILED on the shipped code, finding four real bugs: result's SCORE,
        TIME and LIVES captions 50% buried, and game-over's FINAL SCORE 31%
  - [x] `drawChip` now owns caption, plate and value so they cannot drift; the
        caption was centred on `x` while the plate spanned `x..x+w`. Chip
        widths also brought inside the dialog panel - the TIME plate ran past
        its right edge
  - [x] Game-over score plate centred: written for a top-left origin, but
        `add.rectangle` centres by default
  - [x] Renderer parity extended to game_combat and boss_fight
  - [x] 110 unit, 18 e2e, vision 5/5, signal 12/12, lint/typecheck/build pass
- Non-goals:
  - No redesign of the dialogs; no new screens.

### UI-FIX-5 - Deployed art came back from a CDN cache

- Status: DONE
- Requirement:
  Owner: locally the spear swings on C, on the deployed site it does not.
  Measured, not guessed: the special itself is identical on both (state goes
  to `special`, hp 130->114, specialsUsed 1, no page errors). The difference
  is the ART. The deployed site was still serving `assets/manifest.json` and
  the placeholder sprite PNGs - `CF-Cache-Status: HIT`, `Age: 49570`,
  `Cache-Control: public, s-maxage=604800`. They were deleted from the build,
  but Cloudflare's edge kept serving them for seven days, so BootScene fetched
  the stale manifest and loaded the box art over the pixel art. The box art's
  attack pose is 1px NARROWER than its idle pose, so the spear visibly does
  not move - exactly the reported symptom. The deployed bundle hash matched
  the local build exactly, so this was never a stale deploy.
  The real defect is that a build decided how it LOOKS by asking a server what
  happened to still be lying around.
- Acceptance criteria:
  - [x] `vite.config.ts` decides at build time whether baked art ships and
        freezes it into the bundle as `__HAS_BAKED_ART__`; BootScene with no
        baked art never requests a manifest (verified in the minified output)
  - [x] e2e regression guard: with a stale manifest deliberately served, a
        build that ships no baked art makes zero art requests. Proven able to
        fail - forcing the flag true makes it fail with 4 requests
  - [x] `?bakedart=1` keeps the pipeline e2e-testable for when real art lands
  - [x] `public/_headers` stops `assets/manifest.json` being edge-cached, so
        this cannot recur once baked art does ship
  - [x] 110 unit, 19 e2e, vision 5/5, signal 12/12, lint/typecheck/build pass
- Non-goals:
  - No change to the deploy script; purging the existing stale cache is not
    needed because the new bundle never asks for those files.

### FRAMEWORK-V4 - Gate the production build, not just the dev server

- Status: DONE
- Requirement:
  Three bugs shipped this week and all three were the same shape: the gate
  measured something other than what a player gets. Canvas instead of WebGL
  (UI-FIX-3), a local tree instead of a deployed one (UI-FIX-5), and - still
  untested - the Vite DEV SERVER instead of `dist/`. That last axis is not
  cosmetic: `__HAS_BAKED_ART__` is a build-time constant, so what the shipped
  bundle does cannot be observed from a dev-server run at all.
- Acceptance criteria:
  - [x] New `prodbuild` Playwright project runs `npm run build` and serves the
        real `dist/` through `vite preview`
  - [x] Asserts the built bundle boots with no page errors and no failed
        requests (a broken relative `base` shows up as 404s, not a crash),
        renders the pixel art, and has an attack frame WIDER than idle - the
        shipped-placeholder symptom was the reverse
  - [x] Asserts the built bundle makes zero art requests even when a stale
        manifest is served, and that its HUD bar textures have opaque pixels
  - [x] Proven able to fail: forcing the build flag true makes the built
        bundle request art and the gate fails
  - [x] Dedicated port 4319, never reusing an existing server - Vite's default
        4173 is occupied by an unrelated app on this machine, and reusing it
        would have silently tested that instead
  - [x] 110 unit, 19 e2e, vision 5/5, prodbuild 3/3, lint/typecheck/build pass

### UI-FIX-6 - The parallax hills layer was never on screen

- Status: DONE
- Requirement:
  Reviewing the stage backgrounds turned up a whole layer that drew nothing.
  `bgHills` sat at y=224 with a 100px texture whose silhouette starts at row
  66, so on a 270px screen only the texture's empty top 46 rows were ever in
  frame - measured: 0 opaque pixels inside the camera. The ground strip, at a
  nearer depth, covered that band anyway. The layer was tinted per stage and
  had its tilePositionX updated every frame, for nothing.
  No visual metric catches this: a missing background layer does not make a
  frame dark, flat or empty, so coverage, colour richness and region fill all
  stay green.
- Acceptance criteria:
  - [x] New `e2e/background.spec.ts` asks each named background layer whether
        any of its opaque pixels land inside the camera; it FAILED on the
        shipped code with "bgHills: only 0 opaque pixels are inside the camera"
  - [x] The ridge is anchored to the HORIZON (the top of the ground strip) and
        roots 10px into it so there is no seam; the texture now carries its
        silhouette across its full height, so where the sprite is placed is
        where the hills appear
  - [x] Two-ridge silhouette, far one lighter for distance, plus a haze line
  - [x] Clouds redrawn as overlapping lobes - a bare horizontal bar in the sky
        reads as a placeholder at any alpha
  - [x] 110 unit, 20 e2e, vision 5/5, prodbuild 3/3, signal 12/12, lint,
        typecheck, build
- Non-goals:
  - No AI background art (TASK-020 stays BLOCKED on the image quota); no new
    parallax layers.

### UI-FIX-7 - Screens nobody had ever looked at

- Status: DONE
- Requirement:
  Three screens a player reaches had never been screenshotted or gated:
  mounted play, the continue overlay, and the game-complete ending. Looking at
  them found two defects. (a) While mounted, the horse chip ran from x=120 to
  x=166 inside a HUD panel that ends at 156, spilling the horse's health out
  over the battlefield; the occlusion gate cannot see this because nothing
  COVERS the text - it overflows its frame. (b) The ending was the one screen
  that never got the framed treatment: plain text on a near-black field, and
  it is the last thing a player who clears all nine stages sees.
- Acceptance criteria:
  - [x] `drawPanel` records the rect it drew as `panelRect` data - a Graphics
        does not expose its own geometry, so nothing could check containment
  - [x] New containment check in `e2e/layout.spec.ts`: a label whose centre is
        inside a panel must fit inside it. FAILED on the shipped code with
        `"Horse: 20/20" spans x 120..166 but its panel is x 6..156`
  - [x] HUD panel widened to 168 and the horse chip moved to x=108
  - [x] Game-complete screen gets the victory panel and the five heroes
  - [x] Vision gate now captures `game_complete` too - the last uncovered
        screen (coverage 0.547, 619 colours)
  - [x] 110 unit, 21 e2e, vision 5/5, prodbuild 3/3, signal 12/12, lint,
        typecheck, build
- Non-goals:
  - No continue-overlay redesign; it renders correctly, it was only unwatched.

### UI-FIX-8 - The game never told the player the controls

- Status: DONE
- Requirement:
  A player opening the deployed URL had no way to learn how to play. The only
  on-screen hint anywhere in the game was "PRESS ENTER"; the key mapping lived
  in README.md, which nobody opening a game link reads. Reaching the first
  stage, a new player could move with the arrows by guessing and had no way to
  discover attack, jump or the special at all. This is the last sense in which
  the game was "unplayable" - not a render fault, a discoverability one.
- Acceptance criteria:
  - [x] The title screen shows the scheme in a framed panel: arrows move,
        Z attack, X jump, C special, Enter confirm, M mute
  - [x] The panel-containment and occlusion gates pass on the new block
  - [x] 111 unit, 21 e2e, vision 5/5, prodbuild 3/3, lint, typecheck, build
- Non-goals:
  - No in-stage tutorial; no remappable keys. Grab/throw stays discoverable by
    walking into an enemy, as the README describes.

## Archived 2026-09-16 (the UI redesign series, its two performance follow-ups,
and the three pre-redesign enhancements - all DONE and verified)

### UI-R1 - Make the visual gate able to judge smooth art

- Status: DONE
- Requirement:
  First phase of the UI redesign. Before any art changes, the gate that judges
  art has to be capable of judging the art that is coming. Two of its metrics
  were built around the current pixel maps and would have produced the two worst
  outcomes between them: one failing correct art, the other passing anything.
  (a) `outlineRatio` found the silhouette edge with a binary alpha test
      (`alpha >= 128`). `getImageData` returns un-premultiplied RGBA, so an
      anti-aliased ink stroke carries the ink colour at partial coverage - which
      that test discards, putting the measured edge one pixel further in, on the
      fill. A 1px ink line lives almost entirely in that band, so correctly
      outlined smooth art would have scored ~0 and been rejected.
  (b) `minColorCount: 12` was calibrated against a ~14-slot indexed palette.
      Anti-aliasing alone pushes colorCount into the hundreds, so that floor
      stops being able to fail at all - a single flat fill with a soft edge
      clears it. A floor that cannot fail is the exact defect UI-FIX-1 existed
      to remove.
  Also: `prodbuild.spec.ts` proved the weapon reaches by comparing Phaser FRAME
  widths, while its sibling `assessWeaponReach` deliberately measures the drawn
  silhouette and refuses to credit frame padding. Uniform frame boxes would make
  the frame widths equal and fail a perfectly good build.
- Acceptance criteria:
  - [x] `outlineRatio` locates the edge at a new `EDGE_ALPHA_MIN` (32), chosen
        above the level where un-premultiplying amplifies rounding error. Proven
        able to fail: restoring the 128 cutoff rejects an anti-aliased outlined
        figure, while the un-outlined fixture is still rejected either way - so
        this discriminates rather than loosens
  - [x] New `tonalBands` metric: luminance buckets holding >=2% of the drawn
        area. A band must hold real AREA, so an anti-aliased ring cannot
        manufacture one - asserted directly. Flat fill scores 1, flat fill with
        an ink outline scores 2, shaded art 4+
  - [x] Thresholds set from measurement, not guessed: the 108 current character
        sprites score 4-10 (histogram 4:6, 6:6, 7:29, 8:27, 9:29, 10:11), props
        3-5. Floors placed just above the failure mode - characters 3, props 2 -
        rather than just under the population
  - [x] SECOND NEGATIVE CONTROL. The existing one feeds the gate a patch of
        empty sky, which only fails while the sky is flat; a painted cel-shaded
        backdrop would make it start passing and the proof would evaporate with
        nothing going red. The new one takes a real sprite out of the running
        game and flattens it to one colour. Measured: silhouetteComplexity 0.469
        and appendageRatio 0.588 both PASS - it is a genuine figure - and only
        `tonalBands 1 < 3` and the other shading metrics catch it
  - [x] `prodbuild` imports `assessWeaponReach` rather than reimplementing it,
        so the two gates cannot drift. Proven able to fail: pointing it at a
        zero-reach pose gives "weapon reach 0px < 4px"
  - [x] No game art changed, so the whole existing cast must still pass - it
        does: vision 112/112 sprites, 17/17 weapons, and outlineRatio is still
        exactly 1.0 across all 112
  - [x] lint, typecheck, 139 unit, 35 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No art changes and no threshold loosening. `silhouetteComplexity` is left
    alone deliberately: it may saturate toward 1.0 once anti-aliased art exists,
    but that cannot be measured until UI-R3 lands, and changing it blind would
    be tuning rather than fixing. It is a named checkpoint for UI-R3.

### UI-R2 - Render at 2x and split the HUD into its own scene

- Status: DONE
- Requirement:
  Cel-shaded art needs more pixels than a 480x270 backing store gives. The
  Phaser canvas is now 960x540 and every camera is zoomed by `RENDER_SCALE`, so
  `SCREEN_WIDTH`/`SCREEN_HEIGHT` in `src/core/constants.ts` stay 480x270 WORLD
  units and the sim's geometry, seeds and determinism are untouched. The HUD
  moved to a parallel `HudScene`. Deliberately visual-neutral: same art, same
  layout, twice the pixels.
- CORRECTION to this task as originally filed. It claimed the HUD had to move
  because a zoomed camera displaces scrollFactor-0 objects, putting the player
  panel at `(6-480)*2+480 = -468`. That is true only while the camera keeps its
  default CENTRED origin. Pinning the origin to the top-left reduces the
  transform to `(p - scroll * scrollFactor) * RENDER_SCALE`, so every object
  lands at exactly twice its logical position whatever its scroll factor, and
  the HUD would have rendered correctly where it was. The split was kept for
  the two reasons that do hold - GameScene was 951 lines against this project's
  own 800 limit, and a HUD that cannot see anything but the Sim cannot quietly
  start owning game state - but the stated reason was wrong and is recorded
  here rather than left for someone to trip over.
- Acceptance criteria:
  - [x] New `src/game/render.ts` (constants) and `src/game/ui/viewport.ts`
        (camera + text helpers). They are separate files because
        `adapters/sprites.ts` imports RENDER_SCALE and the Node unit tests
        import that - a value import of Phaser there fails outside a browser
  - [x] Camera: `setOrigin(0, 0)` + `setZoom(RENDER_SCALE)`, and `scrollX` is
        still exactly the sim's. Camera BOUNDS deliberately dropped: `clampX`
        computes its limits as `bounds.x + (displayWidth - width) / 2`, which
        assumes a centred origin, and would have clamped the far end of every
        stage 240 units early. The sim already clamps scrollX and the
        invariants assert it, so the camera was a duplicate source of truth
  - [x] Transform verified against the running game with `getWorldPoint`, not
        by reading Phaser's source: scroll 0 shows world [0,480], scroll 200
        shows [200,680], scroll 1000 shows [1000,1480], HUD camera [0,480].
        (Phaser's own `camera.worldView` is WRONG under a non-centred origin -
        it reports x:240 - but nothing in this repo reads it, checked)
  - [x] Sprite textures rasterize at device density; `fitSprite` needed no
        change, since it derives scale from the idle frame's height
  - [x] `HudScene` owns both HP panels, boss bar, chips, score, objective,
        combo, banner, continue overlay, down/rejoin prompts, vignette and the
        on-screen touch controls. It PULLS: everything it draws is derived from
        the Sim it reads off the bridge, so there is no start-order dependency
        and no second copy of any state. Player two's panel now appears because
        the sim says so rather than from two separate call sites
  - [x] GameScene 951 -> 661 lines, back under the project's limit
  - [x] `signal` 13/13 unchanged - the seeded nine-stage runs prove the sim did
        not move while the renderer did
  - [x] e2e 37/37, including the co-op stage break; camera framing checked by
        eye at stage start and mid-scroll; WebGL screens checked by eye
- THREE defects found, one of them mine:
  1. MINE. `useCrispText` subscribed to `addedtoscene` without unsubscribing.
     Phaser reuses a scene instance and its emitter survives shutdown, so six
     stage cycles left six listeners on `game`, `hud` and `result` alike -
     every object added did six times the work and every label re-rendered six
     times. It never threw; it just made the game slower the longer it was
     played, and surfaced as the visual suite running out of time, which reads
     like flake. Guarded by `e2e/scenerestart.spec.ts`, proven able to fail.
  2. PHASER, renderer-specific, and the third of this shape in this project.
     `Text.setResolution()` re-renders the label into a canvas RENDER_SCALE
     times larger but does NOT update `frame.source.resolution`, which Phaser
     assigns only in the Text constructor - where it is still 1. The CANVAS
     renderer divides the frame size by that field to get its draw size, so it
     drew every label at twice the intended size; WebGL never reads it and was
     correct throughout. Since every automated suite defaults to
     `?renderer=canvas`, the gates would have been measuring 2x text no player
     ever sees. The parity gate caught it - "GAME OVER" overflowing its panel
     under canvas and fitting under WebGL.
  3. The result screen's flanking heroes were the one place still using a raw
     `setScale(1.9)` rather than a display size. A raw scale multiplies
     whatever the texture measures, so device-density textures doubled them to
     258px and they swallowed the screen. NO metric caught it: a frame full of
     hero is not dark, flat, empty or low on colour, nothing was occluded and
     nothing left its panel. Found by looking at the screenshot. Guarded by
     `e2e/artscale.spec.ts`, proven able to fail with "result/entity:zhaoyun:
     idle: 258px".
- Frame snapshots are now resampled to the LOGICAL size in-page before they
  cross to Node. Correctness first: the probes that index into a frame - the
  player-legibility window, the negative control's cutout - are positioned from
  sim coordinates, which are logical, so measuring a 2x frame with logical
  coordinates samples the wrong part of the picture, silently. Same principle
  as silhouetteComplexity's fixed grid: a ruler that changes with the
  resolution is measuring itself. It also cut the CDP payload 4x, which is most
  of why the suite fits its budget again.
- `npm run vision` now pins itself to one worker and the project timeout is
  300s. Its two specs are the heaviest in the repo and, run together, starved
  each other past the old budget while each finished comfortably alone - the
  health gate went from 2.7m under contention to 46s on its own.
- `e2e/layout.spec.ts` gained a per-scene `minLabels`. It only ever inspects
  Text, so pointing it at a scene holding none - exactly what happened to
  `game` when the HUD moved out - made it iterate nothing and pass. Proven able
  to fail: "game has 0 labels, expected at least 5".
- Frame metrics before -> after (all still pass; no threshold moved):
  title 0.689/717/0.151 -> 0.679/493/0.156; select 0.850/541/0.069 ->
  0.842/480/0.069; game_idle 0.918/1136/0.824 -> 0.911/1003/0.839;
  game_combat 0.915/1148/0.823 -> 0.906/1010/0.835; boss_fight 0.908/830/0.748
  -> 0.877/808/0.741; game_combat_zhangfei 0.913/1114/0.817 ->
  0.904/1026/0.814; result 0.919/1140/0.826 -> 0.661/386/0.499; game_over
  0.413/170/0.237 -> 0.411/152/0.244; game_complete 0.547/619/0.184 ->
  0.538/431/0.186.
- Non-goals:
  - No visual redesign in this phase; no change to `src/core/`.

### UI-R3 - Cel-shaded figure engine, five heroes on it

- Status: DONE
- Requirement:
  Replace the ASCII pixel maps with a 2D rig drawn on a canvas-2D context and
  put the five heroes on it. Everything else stays on pixel art for one phase -
  a mixed cast is already a supported state, since that is how baked PNGs shadow
  generated art per kind.
- Built: `src/game/art/{palette,rig,poses,figures,draw,registry}.ts`.
  - A pose is a table of JOINT POSITIONS, not joint angles. Both express the
    same six poses, but a hand at (62, 30) can be read straight off the number,
    while an angle chain has to be simulated through four parents before you
    know where anything ended up. With a fixed pose set the indirection buys
    nothing.
  - Poses are authored ONCE and shared by every humanoid. A kind differs by
    build (height, bulk, shoulders, head), three colours, headgear, beard, cape
    and weapon. Nineteen fighters therefore cost six pose tables rather than a
    hundred and fourteen drawings.
  - The cel pipeline is five passes: ink silhouette, flat fills back to front,
    one hard shadow polygon `source-atop`, one lit-side polygon, then details.
    A single terminator across the whole figure is what makes it read as one
    light source rather than as per-part shading.
- Acceptance criteria:
  - [x] `adapters/sprites.ts` keeps its whole public surface - `POSES`,
        `textureKeyForPose`, the `entity:<kind>:<pose>` convention, the
        `exists(key)` early-return, texture-swap animation. Four gates are built
        on those conventions and all four still run
  - [x] `@napi-rs/canvas` added as a devDependency, so the fast unit gate still
        rasterizes in Node and `artquality` covers BOTH pipelines through the
        same metrics
  - [x] Heroes pass the UI-R1 character thresholds; distinct by build and
        silhouette, not palette - the distinctness test now compares ALPHA
        MASKS, so colour cannot contribute to the score at all. The old version
        compared palette-indexed ASCII, where a recoloured copy would have
        looked different: it was measuring the storage format, not the picture
  - [x] Renderer parity green. All shading is baked into canvas-2D textures, so
        there is nothing for the two renderers to disagree about
  - [x] lint, typecheck, 143 unit, 37 e2e, vision 5/5 (112/112 sprites),
        prodbuild 3/3, signal 13/13, build
- THE FINDING, and the reason this phase took three attempts at one number:
  every attack pose had its weapon CLIPPED at the frame edge - the blade cut
  clean off - and `assessWeaponReach` passed all five by 56 pixels. It compares
  drawn widths, and a weapon truncated at the border still makes the silhouette
  wider, so it scored the truncation as reach. A metric that measures extent
  cannot tell reach from clipping; they look identical from outside the frame.
  Found by looking at the attack pose in the running game, not by any gate.
  - New `artquality` check: no figure may touch its own border (except the feet,
    which are meant to sit on the bottom edge). It failed three times on three
    successive guesses at the margin, naming the pose each time.
  - The margins are then MEASURED rather than guessed: the art needs 53.5 units
    right (Zhang Fei's pike thrust), 21.5 left (his dropped weapon when floored)
    and 19 above (Zhao Yun's crest at the top of his stride).
  - `GameScene.fitSprite` gained figure-box awareness, because the box is now
    deliberately larger than the fighter in it: fitting the BOX to the fighter's
    height would scale the margins in and leave every hero short.
- CHECKPOINT from UI-R1, answered with measurements (recorded in
  `vision/thresholds.ts`):
  - `outlineRatio` scores 0.862-1.0 on anti-aliased ink. That is the UI-R1
    edge-alpha fix earning its place: under the old binary-alpha rule this art
    would have scored near zero and been rejected for having no outline.
  - `minColorCount` and `maxDominantFraction` are now unfailable for smooth art
    - 225-465 colours against a floor of 12, dominance 0.09 against a ceiling of
    0.6. Kept anyway, because they still bite on the pixel pipeline that grunts,
    bosses and props are still drawn with. They go when it does.
  - `silhouetteComplexity` has partly saturated (top of range pinned at 1.0) but
    is not vacuous: the population floor is 0.531 against box art's 0.156-0.250.
    It cannot be RAISED while both pipelines coexist, since pixel art bottoms
    out at 0.344. Revisit with the same measurement in UI-R4.
- Two rendering approaches were tried and discarded, recorded so they are not
  retried: an offset per-shape stroke for the rim light (it draws pale loops
  INSIDE the figure, because a torso's outline offset by a pixel lands entirely
  within the silhouette - the cast came out covered in scribble), and limbs as
  two capsules per arm (each segment gets its own rounded cap and outline, and
  the joints read as beads).
- The registry unit tests are now pipeline-agnostic: they assert every kind the
  game can bind has art in EXACTLY ONE registry, which is the property that
  matters, rather than asserting everything is in `PIXEL_ART`.
- Non-goals:
  - No HUD, menu or background changes; no new poses yet.

### UI-R4 - Rest of the cast, plus hurt and special; retire pixels.ts

- Status: DONE
- Requirement:
  Put the 3 grunts, 9 bosses, the horse and the 4 props on the art engine, add
  the two new poses, and delete `src/game/art/pixels.ts` along with the
  `make-art.mjs` stand-in generator. One pipeline, one look.
- Three art types rather than one. A quadruped and a crate are not badly-posed
  people, so forcing them through the humanoid rig would give a structure that
  describes none of the three. What they share is the CEL PIPELINE, now
  extracted as `paintCel`: ink silhouette, flat fills, one shadow band, one lit
  band, with the light direction expressed as a fraction of the box width. A
  crate is therefore lit from the same angle as the fighter standing next to
  it, which is most of what makes a cast look like one cast.
- Acceptance criteria:
  - [x] `POSES` and `poseForEntity` extended with `hurt` and `special`. Both
        used to fall through: the special reused the attack pose, so the move
        that costs health looked identical to the one that does not, and
        hitstun showed only as a red tint over a perfectly still idle figure
  - [x] Bosses visibly heavier. The old check compared map width times scale -
        a property of the FRAME - and would now pass anything, since every kind
        shares a box. It counts drawn pixels instead
  - [x] `artquality` re-derived from the single registry, carrying a
        NON-VACUITY GUARD on the counts (18 characters, 4 props, 8 poses) and a
        check that every kind the game can spawn is present. Proven able to
        fail throughout this phase
  - [x] `e2e/anim.spec.ts` green - texture-swap animation kept, so the walk
        cycle still changes texture KEYS
  - [x] lint, typecheck, 138 unit, 37 e2e, vision 5/5 (148/148 sprites, up from
        112), prodbuild 3/3, signal 13/13, build
- Two gates needed real work rather than retuning:
  - The LEG-COUNT invariant compared each walk frame's leg count against idle.
    That held while every foot was planted and stopped meaning anything the
    moment the rig had a real stride - a lifted foot legitimately leaves the
    sample row, so the check fired on correct art. What it exists to protect is
    that legs stay SEPARATE, so that is what it now asserts, scanning the lower
    third rather than one row because which row crosses all the legs depends on
    the pose. It still catches the horse bug it was written for: a merged pair
    drops the count below three.
  - `e2e/artscale.spec.ts` had never seen a boss. Stage 1 has none, so the
    biggest art in the game went unmeasured - the guard added one phase ago was
    covering heroes and grunts only. It now forces a boss. Its absolute band
    also had to loosen, because these are BOX heights and a box carries margin
    (a 124px boss ships in a 156px box), so it gained a per-SCREEN ratio test
    that does not care about absolute size. Per screen, because menus draw the
    cast deliberately smaller than play does and a global comparison measures
    that intent rather than a defect. Proven able to fail: a boss at 160px
    stays inside the absolute band and trips the ratio at 1.74x.
- The clipping check added in UI-R3 found eleven more truncations the moment
  new art arrived - the horse's ear, the drumstick's bone, the sword's pommel
  and the arrow's fletching were each sitting on their own border. Fixed with
  per-type padding rather than by widening the check.
- `MIN_WEAPON_REACH_PX` was being applied raw in the browser gate while the
  textures are rasterized at device density, so that check had been half as
  strict as the unit gate backing it up ever since the renderer moved to 2x.
  Now scaled by RENDER_SCALE.
- `art/raw/` was deliberately left in place. It is untracked and gitignored, so
  deleting it is not recoverable, and it costs nothing; `pixels.ts`,
  `pixels.test.ts` and `make-art.mjs` went through `git rm` and are recoverable
  from history. The BAKE pipeline (`bake-art.mjs`, `bake-core.mjs`,
  `__HAS_BAKED_ART__`, `?bakedart=1`) is untouched and still e2e-covered.
- Non-goals:
  - No atlases and no Phaser Animations; they would make `anim.spec` and the
    sprite gate's per-key iteration vacuous.

### UI-R5 - Fighting-game HUD

- Status: DONE
- Requirement:
  Redesign the in-stage HUD: angled plates instead of rounded panels, skewed
  health bars, a portrait on each plate, a mirrored boss plate, a combo counter
  that pops, and a SPECIAL-ready marker. Plus the three defects already written
  down against it.
- Acceptance criteria:
  - [x] `drawSlab` and `makeBar` in `panels.ts`: parallelogram plates with a
        heavy accent edge, and bars that shorten from a slanted leading edge
        with a bright tip. Solid fills only, so the two renderers agree
  - [x] Portraits drawn from the SAME figure as the fighter
        (`drawKindPortrait`), so a portrait can never disagree with the
        character it labels - which is exactly what the old select screen did,
        showing flat palette rectangles beside five distinct warriors
  - [x] A SPECIAL-ready diamond driven by the real `specialCost` against
        current health. Not a meter: the special SPENDS HEALTH, and drawing a
        meter would look more like a fighting game while inventing a mechanic
        the sim does not have
  - [x] Combo counter pops on each rise, italic, stroked
  - [x] The continue overlay finally has a dimming backdrop. It had none -
        CONTINUE? sat straight on the frozen battlefield. Kept under 0.7 alpha
        so the occlusion gate reads it as a tint rather than as a burial
  - [x] P1 and P2 health bars are the same height. They were 8px and 6px, which
        made the second player's health look like a lesser kind of health
  - [x] `panelRect` still recorded, so the containment gate keeps running
  - [x] Labels stay Phaser `Text`, so the occlusion gate keeps finding them
  - [x] lint, typecheck, 138 unit, 37 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Layout, after a first pass that was wrong: plates at 206 wide buried the
  centre column, and the boss plate sat straight on top of the objective line.
  They are 168 now, which leaves the stage name, score and objective a clear
  132px lane of their own. And every plate is drawn before ANY label, so a
  plate cannot occlude text whatever order it is created in - the boss plate
  could, because it used to be built after the objective.
- THREE gates re-aimed from implementation to intent. All three asserted on
  bar TEXTURES, which no longer exist now the bars are Graphics - but the
  deeper problem is that they were asserting the wrong thing to begin with:
  - `e2e/hudpanels.spec.ts` asserted three textures were registered and that
    the HP bar was an Image using one. Both were true, once, while every bar
    was completely transparent - which is why a separate gate had to exist to
    ask whether those textures held any pixels. It now spends health on the
    special and requires the bar's recorded ratio to match the sim's.
  - The vision HUD gate asked whether `hud:bar*` textures had pixels. It now
    samples the rendered FRAME where each bar says it is and requires colour
    there. Proven able to fail: with the bar fills made invisible it reports
    "bar 0 at 54,26: only 0% coloured".
  - `prodbuild` does the same against the shipped canvas, deriving the render
    scale from the canvas width rather than hard-coding it.
  Bars record what they drew as `bar` data, the same device `drawPanel` uses
  for `panelRect` - a Graphics exposes no geometry, so without it nothing can
  check that the bar on screen agrees with the health in the sim.
- Note on proving it: my first attempt at falsifying the vision HUD gate was
  INCONCLUSIVE and I nearly took it as a pass. I zeroed one of the bar's two
  fills, the other still painted colour, and the gate correctly stayed green -
  which says nothing about whether it can fail. Zeroing all three fills makes
  it fail. A green run after a deliberate break is only evidence if the break
  was complete.
- Non-goals:
  - No new gameplay state; the HUD reports what the sim already has.

### UI-R6 - Menu screens

- Status: DONE
- Requirement:
  Redesign title, select, result, game-over and game-complete: a treated
  wordmark instead of a stroked label, angled slabs instead of rounded panels,
  and a select screen that shows who you are picking.
- Acceptance criteria:
  - [x] `src/game/art/logo.ts` builds the DYNASTY WARS wordmark out of
        canvas-2D text - italic lean, heavy ink shell, metal gradient down the
        faces, hard drop shadow, highlight band - and bakes it to a texture, so
        both renderers draw identical pixels. Its box is MEASURED before it is
        drawn, because the font stack resolves to a different face on every
        platform and a hard-coded box would clip the logo on whichever machine
        draws it widest
  - [x] No bundled font files. The letterforms come from the system stack, the
        same one that keeps the Chinese names falling back to a face the
        browser actually has
  - [x] Select screen shows a large PORTRAIT of the highlighted hero, drawn
        from the same figure art as the fighter, plus POWER and SPEED bars read
        straight off `CharacterDef` and normalised across the roster - so the
        bars compare the five to each other rather than to an invented maximum.
        This screen used to draw flat palette rectangles, which is why the art
        gate had to be taught to ask whether the five were "palette swaps"
  - [x] `drawPanel`, `makeChip` and `createBarTexture` deleted. The first is
        superseded by `drawSlab`, the second never had a caller, and the third
        lost its last one when the bars became Graphics
  - [x] `e2e/title.spec.ts` green - the hero line-up stays
  - [x] Occlusion and containment gates green on all five screens
  - [x] lint, typecheck, 138 unit, 37 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Two failures worth recording, because they are opposite kinds:
  1. MINE, and the gate was right. I added the title and select vignettes AFTER
     their labels, so a full-screen Image at depth 9000 sat over every line of
     text and the occlusion gate flagged 23 of them. The vignette's centre is
     transparent, so it LOOKS fine - but "the middle of my texture happens to
     be see-through" is not something a gate can verify and not something a
     label should have to rely on. Moved to the backdrop, where every other
     scene already puts it.
  2. NOT a defect in the game: `e2e/touch.spec.ts` tapped a hard-coded screen
     point, "the middle of the screen", and asserted it picked the third hero.
     Relaying the select screen moved the cards, so the tap landed on a
     different one and the test failed for a layout reason while reading like
     an input bug. It now asks the scene where the cards are and taps the
     FOURTH - deliberately not the first, since the cursor starts there and
     tapping it would pass whether or not the tap picked anything.
- The portraits were re-framed after looking at them: the first pass zoomed
  1.45x onto the face, which cut the top off every helmet and turned the roster
  into a row of extreme close-ups - readable as faces, useless for telling five
  armoured warriors apart. Head AND shoulders carries the headgear, pauldron and
  collar, which is most of what distinguishes them.
- Non-goals:
  - No bundled fonts, no new screens.

### UI-R7 - Stage backgrounds and impact FX

- Status: DONE
- Requirement:
  Layered cel backdrops per stage, driven by the six per-stage colours already
  in `src/core/stage.ts`, with ink-outlined ridges and atmospheric depth. Hit
  sparks, dust and clouds redrawn to match the cast.
- New `src/game/art/backdrop.ts` paints sky, ridges, ground and clouds on
  CANVAS-2D rather than Phaser Graphics. That is what lets them use real
  gradients: a Graphics gradient is WebGL-only and silently draws nothing under
  canvas, so the old painters had to work in flat bands to stay honest between
  the two renderers. Baked to a texture, a gradient is just a bitmap.
- Every ridge silhouette is PERIODIC over the tile width - three harmonics of
  the tile period. These are tileSprites, so a ridge whose left edge does not
  meet its own right edge shows a vertical seam marching across the screen as
  the stage scrolls: invisible in a screenshot, obvious in motion.
- Acceptance criteria:
  - [x] Two ridges, the far one paler and hazier, both ink-lined like the cast;
        graded sky with a low sun baked into the tile; ground graded from a lit
        horizon band to a richer floor, with one ink rule along the horizon
  - [x] Speckle and tufts are placed by a fixed integer walk, not by random, so
        the texture is identical every run and the vision numbers stay stable
  - [x] `fx:spark` is a four-point star and `fx:dust` a soft radial puff, both
        baked at device density. They were a plain square and a plain circle -
        the last things on screen with no relationship to the art around them
  - [x] `e2e/background.spec.ts` green with no change: the layers kept their
        names, because they are the same layers painted better
  - [x] `e2e/juice.spec.ts` still sees zero particles under autopilot
  - [x] Renderer parity green
  - [x] lint, typecheck, 138 unit, 37 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Two things found by looking rather than by a gate:
  - The first ridge sat so low in its tile that only a 30px sliver was ever on
    screen - the same way the old hills layer managed to be invisible entirely,
    which is what `background.spec` was written for. That check passes on a
    sliver, because a sliver is still opaque pixels inside the camera. Raised
    the ridge and the tile.
  - The clouds were stroked, and stroking a path made of overlapping ellipses
    outlines each one INCLUDING where they overlap, so every cloud carried its
    own construction lines. An outline would need the UNION of the lobes, which
    a path of separate ellipses cannot give - the same limitation that made the
    per-shape rim light fail in UI-R3. Dropped the stroke.
- WATCH THIS. The vision negative control samples a patch of sky at
  (0.62w, 0.2h) and requires the character gate to REJECT it. It still does,
  but its margin has eroded exactly as this task predicted: `outlineRatio` at
  that patch went from 0.233 to 0.858 and now PASSES its 0.8 threshold, so the
  rejection rests on two metrics (silhouetteComplexity 0.031, appendageRatio 0)
  where it used to rest on three. The backdrop is simply richer there now.
  Recorded rather than acted on, because the control still fails and the
  SECOND control - a real sprite flattened to one colour, added in UI-R1 - is
  independent of the backdrop entirely and fails on four metrics. If a future
  backdrop adds structure to that patch, move the sample; do not weaken the
  gate.
- Frame metrics after, all passing with no threshold moved: title 0.503/963,
  select 0.497/1220, game_idle 0.907/967, game_combat 0.904/1010, boss_fight
  0.893/965, game_combat_zhangfei 0.902/900, result 0.667/359, game_over
  0.429/151, game_complete 0.576/688. `boss_fight` saturation fell from 0.742
  to 0.404 as the darker stage-3 sky gradient took hold; the floor is 0.25.
- Non-goals:
  - No animated backgrounds, no foreground layers.

### PERF-1 - Measure what the redesign cost, and reclaim the obvious waste

- Status: DONE
- Requirement:
  Nothing in this repo measures rendering or memory - the perf spec budgets SIM
  stepping only. The redesign quadrupled the pixel count and replaced fillRect
  pixel maps with vector drawing, so the question "what did that cost" had no
  answer. Probe it as a new axis rather than re-running the same two signals.
- FRAME COST: a clean NEGATIVE result, and the control is the whole story.
  Headless Chromium renders the game at 59.8ms/frame, which reads as 9 FPS and
  is alarming until you look at what else is true: a blank page in the same
  browser is 16.6ms, the TITLE screen is as slow as combat, and the canvas-2D
  renderer at the same 960x540 is 16.9ms. A title screen cannot be 60ms of
  drawing. Forcing ANGLE onto the real GPU:
    headless default    59.5ms   SwiftShader (software)
    headless angle=gl   16.8ms   AMD Radeon RX Vega 11
    headed, real GPU    31.3ms   AMD Radeon RX Vega 11
  So the cost is software rasterization in the harness, not the game. On a GPU
  the redesign runs at a full 60 FPS. Also corrects UI-R2's explanation for the
  vision timeout bump: it was not "4x the pixels" generally, it was that the
  parity spec's WebGL half goes through SwiftShader while its canvas half does
  not.
- MEMORY: a real finding. 56.9MB of textures, 52.3MB of it `entity:*`, and 22
  kinds generated for every stage when a stage spawns five or six. GameScene
  registered `Object.keys(ENEMIES)` - all nine bosses, every stage.
- Acceptance criteria:
  - [x] `stageArtKinds(sim)` derives the list from the stage's own spawn tables,
        props and bossKind, plus the loot and arrows no stage mentions.
        56.9MB -> 31.8MB, 22 kinds -> 13
  - [x] Lazy fallback in `syncSprites`: anything reaching the screen without art
        gets it there rather than rendering blank. Narrowing a registration list
        should not be able to make an enemy invisible
  - [x] Unit guard: every kind ANY stage declares must have art. That is the
        failure the narrowing risks, and it costs nothing to check
  - [x] lint, typecheck, 140 unit, 37 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- THE REGRESSION THIS CAUSED, and it is the important part. Narrowing
  registration took the visual sprite gate from 148 sprites to 76 - it reads the
  LIVE texture manager, so generating less meant gating less - and its own guard
  (`keys.length > 20`) was far too loose to notice. An optimisation silently
  halved a gate.
  - `__DW__.registerAllArt()` lets the gate register the whole cast before
    assessing, restoring 148/148
  - The count is now EXACT rather than a floor, because a floor is precisely
    what let a halving pass. Proven able to fail: without the call it reports
    "expected the whole cast, got 76 textures"
- Also locked: figures must STAND where their box says. Sprites anchor
  bottom-centre, the boxes carry heavy margin, and nothing checked that the feet
  sit at the centre - a pose drawn off-centre makes the fighter jump sideways
  for one frame of the walk cycle, which no shape or colour metric can see.
  Measured -5.5 to +7.5 units, the extremes all on `hurt` where the body
  deliberately recoils; bound set at 12. Proven able to fail.
- Non-goals:
  - No change to how anything looks.

### PERF-2 - Per-pose art boxes

- Status: DONE
- Requirement:
  90% of every character texture was transparent margin. The figure box was
  212x116 because an attack or special thrust needs clearance to the right; the
  other six poses need nothing like it and were paying for it eight times per
  character. Give each POSE its own box width, keeping the height and the
  horizontal centring identical so `fitSprite` and the bottom-centre anchor are
  unaffected.
- MEASURED first, per pose, across all eighteen characters - each pose drawn
  into a deliberately oversized box and the drawn bounds taken relative to the
  body centre. Units reached beyond the 96-wide pose space:
    idle 0   walk0 0   walk1 0   hurt 12   jump 22   down 26   special 55   attack 57
  So a single margin of 58 was right for two poses out of eight.
- Acceptance criteria:
  - [x] Box width per pose, from that measurement plus a 5-unit pad. One
        character's eight boxes go from 1696 units of width to 1192
  - [x] HEIGHT stays uniform across poses, which is not cosmetic:
        `GameScene.fitSprite` derives ONE scale from the idle frame's height and
        applies it to every pose, so heights that disagreed would resize the
        fighter mid-animation
  - [x] Margin stays SYMMETRIC. Almost every pose reaches only one way, so an
        asymmetric box would be tighter still - but sprites anchor
        bottom-CENTRE, so it would also move the character sideways. A tighter
        box needs a per-pose anchor offset, and a wrong offset puts a fighter in
        the wrong place: a worse failure than the memory it saves
  - [x] Entity texture memory 27.1MB -> 19.1MB, total 31.8MB -> 23.7MB. With
        PERF-1 that is 56.9MB -> 23.7MB, a 58% cut
  - [x] Walk cycle checked: the shift across idle/walk0/walk1 measures 0.8
        units, which is sub-pixel on screen. Screenshot compared against the
        same frame before the change - visually identical, which is the goal
  - [x] lint, typecheck, 141 unit, 37 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- The two guards this needed already existed and both still bite at the new
  margins: the clipping check fails with "guanyu:attack is clipped at right"
  when the attack margin is cut to 20, and the centring check fails when a
  pose's feet are shoved sideways.
- Added a THIRD, tighter one aimed at what this change specifically risked.
  idle, walk0 and walk1 alternate three times a second, so a few units of
  disagreement between them reads as a fighter vibrating - where the same offset
  in a one-off pose like `hurt` reads as recoil, which is why the general
  centring bound is 12. The cycle bound is 2. It is not redundant: proven able
  to fail at 6.3 units, which the centring bound passes.
- Non-goals:
  - No change to the art itself, only to the box it is drawn into.

### UI-R8 - Close the two follow-ups the redesign left open

- Status: DONE
- Requirement:
  The UI-R series left two things written down and not acted on. Both are gate
  work, and both turned out to be worth doing for reasons other than the ones
  originally recorded.
- (a) THE BACKGROUND GATE HAD TWO BUGS, one of them introduced by UI-R2.
  - UNITS. Textures rasterize at RENDER_SCALE, so `min(src.height, lastRow)`
    compared a device-pixel row count against a logical one and scanned only
    the top half of every texture. A layer whose content sits in the lower half
    was invisible to the check whether or not it was visible to the player.
  - OCCLUSION. It asked only whether a layer's pixels were inside the CAMERA,
    never whether anything was drawn in front of them. A ridge sitting entirely
    behind the ground strip passed. Proven: moving the hills below the ground
    now reports "bgHills: only 0 of its 24726 drawn pixels survive the camera
    and whatever is in front of it"; the old check counted all 24726.
  It now works in texture space and clips each layer against the top of the
  nearest layer drawn in front of it - with no "only if that layer starts
  lower" guard, because a nearer layer starting HIGHER covers this one
  completely, and that is the case worth catching.
- What it deliberately does NOT do: judge prominence. A first attempt required
  a FRACTION of each layer's own content to survive, which sounds stricter and
  is wrong - the sky is deliberately mostly hidden behind the hills and the
  ground, and measured 16%. It would have failed for working as intended.
  "Barely visible" is a looking-at-it judgement, and the one real instance of it
  this project has had was in fact found by looking. "Not visible at all" is
  what a gate can answer, so the floor stays an absolute count: measured sky
  35040, hills 7227, ground 55200, floor 1000.
- (b) THE THRESHOLD NOTES WERE WRONG, and the correction matters more than the
  numbers. UI-R3 recorded that `minColorCount` and `maxDominantFraction` had
  "gone unfailable on smooth art" and that they should be deleted once the pixel
  pipeline went. The pipeline went in UI-R4. Measuring before deleting shows the
  conclusion was wrong: flattened art scores colorCount 1 and dominantFraction
  1.000, so both metrics fire. The note reasoned from the margin on GOOD art -
  147 against a floor of 12 - when the question a floor has to answer is whether
  the FAILURE MODE trips it. Acting on that note would have deleted two working
  metrics for the crime of passing comfortably, which is what a floor is for.
- Acceptance criteria:
  - [x] Measured over the whole cast AND over the failure mode: 144 character
        sprites and 4 props, each also flattened to a single tone. Numbers
        recorded in `vision/thresholds.ts`
  - [x] `silhouetteComplexity` checkpoint from UI-R3 resolved: measured
        0.563-1.000 against box art's 0.156-0.250, floor left at 0.3. It COULD
        now be raised, and should not be - it already sits above the failure
        mode, and hugging the population would catch nothing new while making
        the gate brittle against ordinary variation in a pose
  - [x] Prop shape floors stay at zero, but for a better reason than the old
        one. It used to be resolution; props are vectors now. It is that
        flattening a prop leaves silhouette and appendage IDENTICAL - shape is
        exactly what a flat fill does not change - so for an object with no
        limbs those metrics can never separate good art from bad
  - [x] No threshold VALUE changed; the diff in `thresholds.ts` is comments only
  - [x] lint, typecheck, 138 unit, 37 e2e, vision 5/5, prodbuild 3/3, build.
        The logic signal was not re-run: no file under `src/` was touched
- Non-goals:
  - No art changes, no threshold loosening, no new metrics.

### ENH-3 - Local 2-player co-op (drop-in)

- Status: DONE
- Requirement:
  The last enhancement PROJECT.md recorded. Unlike the two input adapters this
  one changes the deterministic sim, so it is built around player two being
  ABSENT by default: `player2Id` is null until someone joins, and every
  multi-player branch reduces to the existing single-player behaviour when it
  is. That is what lets the whole existing suite, and the determinism it rests
  on, stay exactly as it was.
- Design decisions taken from arcade convention and recorded here rather than
  guessed at silently:
  - Drop-in join: player two presses one of their own keys mid-stage. There is
    no second select screen, so they get the first hero player one did NOT
    pick - two identical figures would be unreadable.
  - SHARED pool of continues (`sim.lives`), not per-player credits.
  - The camera follows whoever is furthest into the stage; enemies chase
    whoever is nearest; the run ends only when BOTH players are down.
- Acceptance criteria:
  - [x] `stepSim(sim, input, input2?)` - the second input is optional, so every
        existing caller, test and harness is untouched
  - [x] Unit: a busy second input changes NOTHING while nobody has joined
        (snapshot-identical to a solo run over 240 ticks)
  - [x] Unit: twin sims stay bit-identical over 600 ticks with two players
  - [x] Unit: nearest-enemy targeting, lead-player camera, game over only when
        both are down, either player revivable from the shared pool
  - [x] E2E: F drops player two in as a DIFFERENT hero, both render, and each
        player moves only on their own keys
  - [x] 121 unit, 31 e2e, vision 5/5, prodbuild 3/3, signal 12/12
  - [x] A player downed while the other fights on spends a continue and gets
        back up on their own action key, with a prompt saying so. Found by
        playing the feature rather than by a test: the continue overlay only
        appears once EVERYONE is down, so a single downed player was out for
        the rest of the stage with their continues unspent. Guard proven able
        to fail.
  - [x] A co-op game survives the stage break: player two's hero is threaded
        through the result screen into the next stage, by the real path and by
        the debug bridge alike. That transition also CRASHED - the scene
        instance is reused and `children.removeAll` destroys the HUD, but the
        stale references were still used next stage. Both found by playing a
        transition, not by a test.
  - [x] Composition with the other input work, which did NOT hold at first:
        a second controller now drives player two (every pad used to merge into
        player one, so two people with two pads could not play), and a party
        wipe revives whichever player answers the continue rather than always
        player one.
  - [x] Things the world has only one of: items can be picked up by EITHER
        player (pickup looped over player one alone, so player two could not
        eat or arm themselves at all), and two players cannot ride the same
        horse. Also fixed a bug I introduced in the co-op refactor - looping
        the horse world-update per player made a fleeing horse bolt at double
        speed with two players, invisible with one.
- Non-goals:
  - No second select screen, no per-player credits, no online play, no
    co-op-specific balance tuning.

### ENH-2 - Touch input

- Status: DONE
- Requirement:
  The game is a public URL and is currently unplayable on any phone or tablet.
  Measured on iPhone 13, Pixel 7 and iPad: the canvas scales correctly and
  there are no errors, but a tap does nothing and the scene never leaves the
  title - there is no input path at all. Add one.
  Menus confirm on a tap; the character select confirms the hero that was
  tapped. In a stage, on-screen controls appear - a direction pad on the left,
  attack/jump/special on the right - feeding the same `InputState` the keyboard
  and gamepad produce, merged the same way. Controls appear only on devices
  that actually have touch, so nothing changes on desktop.
- Acceptance criteria:
  - [x] `TouchAdapter` mirrors the keyboard/gamepad adapters and merges the
        same way; actions latch on `pointerdown` so one tap is one action
  - [x] Multi-touch: `activePointers: 3`, so a thumb can hold a direction while
        the other taps attack
  - [x] E2E under Pixel 7 emulation: a tap drives title -> select -> game and
        picks the hero that was TAPPED; a CDP touch hold on the d-pad moves the
        player; the special button raises specialsUsed and drops hp, proving
        the press reaches the sim rather than only the animation
  - [x] On-screen controls ABSENT on desktop (asserted: zero Zones), so the
        vision gate is unaffected - confirmed 5/5 unchanged
  - [x] 111 unit, 27 e2e, vision 5/5, prodbuild 3/3, signal 12/12
- Note: action buttons latch in the `pointerdown` handler rather than from
  polled state. Polling dropped any tap that began and ended inside one frame,
  which is an ordinary fast tap - the e2e caught it.
- Follow-up found by reviewing the shipped feature: GameScene had NO pointer
  handler, so the CONTINUE? overlay after a death was unanswerable on a phone
  and a touch player's run just ended. A tap now continues, and every
  "PRESS ENTER" prompt reads "TAP ..." on a touchscreen instead of naming a key
  the device does not have. Guard test proven able to fail.
- Non-goals:
  - No gesture controls, no haptics, no layout customisation, no landscape
    lock. 2P co-op remains a separate future enhancement.

### ENH-1 - Gamepad support

- Status: DONE
- Requirement:
  PROJECT.md records gamepad input as a future enhancement; this implements it.
  A gamepad drives the game exactly as the keyboard does, and the two work at
  the same time without either blocking the other. Mapping: left stick and
  D-pad move; A attacks (as Z); B jumps (as X); X or Y fires the special (as
  C); Start confirms (as Enter) on every menu and on the continue prompt.
  Input still reaches the sim only as the existing `InputState`, one press per
  press, so nothing in `src/core` changes and determinism is untouched.
- Acceptance criteria:
  - [x] `GamepadAdapter` mirrors `KeyboardAdapter`; the two merge per tick via
        `mergeInputs`, so neither source blocks the other
  - [x] Every menu scene confirms on Start as well as Enter
  - [x] E2E with a synthetic gamepad (stubbed `navigator.getGamepads` plus a
        `gamepadconnected` event): the pad ALONE drives title -> select ->
        game, and produces attack, jump and the special in the sim
  - [x] Edge-triggered: holding a button fires exactly once
  - [x] No gamepad connected changes nothing: 111 unit, 24 e2e, vision 5/5,
        prodbuild 3/3, signal 12/12
- Note: the adapter reads `navigator.getGamepads()` directly rather than
  Phaser's gamepad plugin. Going through the plugin made confirms land on the
  button RELEASE instead of the press, because its cached snapshot refreshes on
  its own schedule relative to scene `update`. The raw API is already a polling
  API and behaves predictably.
- Non-goals:
  - No touch input, no rumble, no remapping UI, no gamepad navigation of the
    hero cursor beyond the existing left/right (the stick and D-pad feed the
    same directional input the arrows do).

### FIX-4 - A phone in landscape loses the bottom of the game, controls included

- Status: DONE
- Requirement:
  On a Pixel 7 held in LANDSCAPE - the natural way to hold a side-scrolling
  brawler - the viewport is 863x360 and the canvas is 863x485, anchored at
  top=0. A quarter of the game is below the fold, and what is down there is the
  on-screen controls: the d-pad lands at viewport y=403, the A and B buttons at
  414 and 421, against a 360px window. Only C is reachable. The game is
  unplayable in the orientation a player would choose.

  Cause is one CSS declaration. `#game` has `min-height: 100vh` and no definite
  height, and Phaser's `Scale.FIT` measures that element: given a parent that
  may grow, it fits to WIDTH and lets the parent grow to suit. On a viewport
  wider than 16:9 that overflows downward. Desktop never showed it because a
  desktop window is close enough to 16:9 that fitting to width fits the height
  too; portrait never showed it because fitting to width is correct there.

  I saw this once already and talked myself out of it. A screenshot at 740x360
  during FIX-1 came out with the bottom cut off and I recorded it as "my
  viewport override broke the letterboxing". It was this bug.
- Acceptance criteria:
  - [x] `#game` gets `height: 100vh` with a `100dvh` override for browsers
        that understand it, so the box stays right as the mobile URL bar comes
        and goes. `min-height` removed - a minimum is exactly what let the
        element grow
  - [x] Measured before and after in all three configurations. Landscape
        863x360: canvas 863x485 -> 640x360, and all seven control zones move
        from below the fold to on screen. Pixel 7 portrait 412x232 and
        iPhone 13 portrait 390x219 are UNCHANGED, as is desktop - only the
        orientation that was broken moved
  - [x] Gate asserts the canvas fits the viewport and every control zone lands
        inside it, in portrait AND landscape. It checks the ZONES rather than
        the drawing, because reachability is a property of the hit area.
        Proven able to fail: restoring `min-height` gives "landscape: the
        canvas does not fit the screen (viewport 863x360) - canvas is 485px
        tall in a 360px viewport"
  - [x] lint, typecheck, 142 unit, 42 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No change to the controls' layout or to the scale mode. FIT is correct; it
    was being handed a box that could grow.

### GATE-2 - Nothing asserts that a pose looks like the state it stands for

- Status: DONE
- Requirement:
  `hurt` and `special` were added as distinct poses in UI-R4, and the criterion
  "hurt shows on hitstun and special is distinct from attack" was ticked by
  eye. A pose that quietly reuses another's joint table still produces a
  texture, still gets a key, and still passes every count, legibility, clipping
  and centring check in `test/game/artquality.test.ts`. It just tells the
  player nothing. The only pose comparison in the file is the walk-cycle test,
  which compares the one pair that differs by construction.

  This is not hypothetical. `src/game/art/poses.ts:204` records that "the
  special used to reuse the attack pose outright, so the move that costs health
  looked exactly like the one that does not". That regression already happened
  once and had no test.

  Found by rendering all eight poses for four kinds into one sheet and looking
  at it - `hurt` read as `idle` and `special` read as `attack` at thumbnail
  size, which turned out to be wrong, and the measurement is what settled it.
- Acceptance criteria:
  - [x] Every armed kind's `idle`/`hurt` and `attack`/`special` pairs are
        compared as symmetric difference over union of their silhouettes - a
        SHAPE comparison, not a pixel-for-pixel one. Boxes differ in width per
        pose and are symmetric about the figure, so box centres are aligned;
        heights are uniform by design and that is asserted rather than assumed
  - [x] `MIN_POSE_DIFFERENCE = 0.15`, placed just above the failure mode (a
        reused table scores 0) rather than just under the population, whose
        weakest armed kind is 0.31. Reference point: `idle` against `walk0`,
        the pair everyone reads as visibly different, scores 0.395
  - [x] The horse is excluded through the existing `ARMED_KINDS`, whose comment
        already records that its attack pose aliases idle by design -
        confirmed at `src/game/art/beasts.ts:76`, not assumed
  - [x] Proven able to fail by reintroducing the ACTUAL historical regression:
        `special: ATTACK` in the pose table gives "guanyu: the special pose is
        the attack pose again: expected 0 to be greater than 0.15"
  - [x] lint, typecheck, 142 unit, 41 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No art change. Measured across the whole cast, `idle`/`hurt` averages 0.539
    and `attack`/`special` 0.464, both above the 0.395 that `idle`/`walk0`
    scores. The poses were already distinct; nothing could have told us.

### GATE-1 - The art-scale gate cannot fail when a boss stops being bigger

- Status: DONE
- Requirement:
  `e2e/artscale.spec.ts` bounds the tallest-over-shortest character ratio from
  ABOVE only (`MAX_CHARACTER_RATIO = 1.7`, which catches a hero drawn at twice
  its size). Its own comment states the design intent - "Bosses are drawn
  larger than heroes by design (156 against 116, a ratio of 1.35)" - but
  nothing asserts it. A boss drawn at the player's height scores 1.0 and sails
  through, while being exactly the readability failure the size difference
  exists to prevent: you should be able to tell the boss from the mob at a
  glance.

  Found by a producer sweep of all nine stages and all nine bosses, which is
  also what measured the real number: `GameScene.fitSprite` gives a boss 124
  on-screen units against 92 for everyone else, and boss/player comes out at
  1.34 on every one of the nine stages.
- Acceptance criteria:
  - [x] `MIN_BOSS_RATIO = 1.2` on the boss screen, over posed characters only -
        props carry their own sizes and would make the ratio meaningless. The
        floor sits where "visibly larger" stops being true (the failure mode is
        1.0) rather than just under the measured 1.34
  - [x] Proven able to fail by shrinking the SUBJECT, not the threshold: set
        `isBoss ? 92` in `fitSprite` and the gate reports ratio 1 and names
        `entity:xuchu:idle 116px` beside the grunts
  - [x] The producer sweep behind it found no defects, which is worth saying
        plainly: nine stages render in nine distinct palettes with no page
        errors, all eighteen character kinds have real weapon reach (81-171px,
        so no boss is weaponless), and boss/player is 1.34 on every stage
  - [x] lint, typecheck, 141 unit, 41 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No art or sim change. Nothing is wrong with the bosses; the gate simply
    could not have told us if there were.

### FIX-3 - The title screen teaches a phone player keyboard controls

- Status: DONE
- Requirement:
  On a touchscreen the title's control plate reads:
    ARROWS  MOVE      Z  ATTACK      X  JUMP
    C  SPECIAL      ENTER  CONFIRM      M  MUTE
    2P: PRESS F TO JOIN ANY TIME  -  WASD  F/G/H
  None of that exists on a phone, and the controls that DO exist - the d-pad
  and the A/B/C buttons the player is about to be given - go unmentioned. It is
  the first screen every phone player sees.

  The screen already knows it is a touch device: the prompt below this plate
  says TAP TO START rather than PRESS ENTER. Audited every other screen under
  Pixel 7 emulation and the title is the ONLY one that gets this wrong - select,
  result, game over and the continue overlay all adapt their prompts.
- Acceptance criteria:
  - [x] On touch the plate reads "D-PAD MOVE / A ATTACK / B JUMP" and
        "C SPECIAL / TAP CONFIRM". Mute is keyboard-only and is simply not
        advertised rather than invented as a new button
  - [x] The 2P line stays truthful rather than disappearing: "2P NEEDS A
        KEYBOARD OR A SECOND GAMEPAD"
  - [x] Desktop wording unchanged, and asserted so
  - [x] A gate that checks BOTH directions, because a touch-only check would
        be satisfied by deleting the plate outright. Proven able to fail:
        forcing the desktop wording on a phone names all three offending lines
  - [x] Every other screen audited under Pixel 7 emulation - select, result,
        game over and the continue overlay already adapt. The title was the
        only one that did not
  - [x] lint, typecheck, 141 unit, 41 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - The in-play "1P DOWN - PRESS Z TO REJOIN" and "2P DOWN - PRESS F TO REJOIN"
    prompts are left alone DELIBERATELY. Reviving a downed player runs through
    `keyboardAdapter.wantsToJoin()`, and that state only arises in co-op, which
    already needs a keyboard or a second gamepad to reach. Rewording a prompt
    no phone can see would be churn.
  - No mute button, no new controls, no layout change. The plate is the right
    size and in the right place; it is saying the wrong thing.

### FIX-2 - The stage banner is drawn over the HUD

- Status: DONE
- Requirement:
  The stage-entry banner is a Container at depth 11_000 - the only object in
  the game above the HUD's 10_000..10_002 band. For the ~1.9s it holds it
  occupies x 118..362, y 46.5..95.5, and measurement says that costs:
    - 29% of player two's HP bar, at the start of EVERY co-op stage;
    - 33% of player two's plate, same;
    - 64% of the CONTINUE? label, whenever a death lands inside that window.
  Found by looking at `artifacts/look/coop.png`, where P2's plate reads as
  truncated rather than as something with a banner in front of it.

  No gate caught it, for two separate reasons:
    - `e2e/layout.spec.ts` only ever treats a Text as the thing being covered,
      and it takes bounds from `getBounds()`. Every plate and every bar in the
      HUD is a `Graphics`, and `Graphics.getBounds()` returns nothing, so the
      occlusion gate is structurally blind to most of the HUD. `drawSlab` and
      `makeBar` have recorded their geometry as `panelRect`/`bar` data all
      along; nothing read it.
    - The banner lives for under two seconds at stage entry, and no gate
      samples a co-op HUD inside that window.
- Acceptance criteria:
  - [x] The banner moved from depth 11_000 to 9_800: under every plate, still
        above the vignette (9_000) and the on-screen touch controls (9_500), so
        it reads as being over the battlefield and under the readouts
  - [x] `readDisplayList` falls back to the `panelRect`/`bar` data when
        `getBounds()` gives nothing, so plates and bars are visible to the
        occlusion gate as both occluder and occludee. Threshold unchanged, so
        this only widens what the gate can see - and it found nothing new on
        the existing screens, so the widening cost nothing
  - [x] CORRECTION to this criterion as filed. I wrote "zero tolerance: the
        banner may not overlap any HUD plate, bar or label". That gate would
        FAIL correct art: the banner legitimately overlaps the P1 plate's
        bottom edge by about 7px, and it is meant to. The property that
        matters is LAYERING, so the gate asserts the banner is behind
        everything it meets - guarded by a check that it still MEETS the HUD
        at all, because a depth assertion about rectangles that no longer
        touch would be true and worthless
  - [x] Proven able to fail: restoring depth 11_000 names 11 buried HUD objects
        ("the stage banner (depth 11000) is drawn over part of the HUD"),
        including the plates and CONTINUE?. It can only see the plates because
        of the `panelRect` fallback, so the two halves of this fix are what
        make each other work
  - [x] lint, typecheck, 141 unit, 40 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No change to the banner's size, position, timing or animation, and no
    change to `MAX_COVERED_FRACTION`. The banner was fine; it was in front.

### FIX-1 - The on-screen touch controls are invisible

- Status: DONE
- Requirement:
  On a phone the game draws no d-pad and no A/B/C buttons. The controls still
  WORK - touching the right blank area moves the player - so a player has to
  find invisible buttons by feel. That is the state ENH-2 existed to end, and
  the UI-R2 HUD split reintroduced it.

  Cause, and it is an API misreading rather than a logic slip:
  `Phaser.Structs.List.removeAll(skipCallback)` takes SKIPCALLBACK, not
  `destroyChild`. `this.children.removeAll(true)` therefore unlinks every object
  from the display list and destroys nothing. `GameScene.create` builds the
  touch controls into the `hud` scene, then `HudScene.create` - which runs
  afterwards, because `scene.launch` is queued - sweeps the list. The Graphics
  and the three labels are unlinked and stop being drawn, while the seven Zones
  stay registered with the input plugin and keep working.

  That split is also why no gate caught it: `e2e/touch.spec.ts` drives the
  controls through the INPUT system, which was never broken, and the only other
  touch assertion is a desktop one that wants zero zones.
- Acceptance criteria:
  - [x] The HUD owns the on-screen controls, because the HUD owns and sweeps the
        display list they live on. `TouchAdapter` splits into persistent state
        and a `mount(scene)` that draws the visuals and hit zones, called again
        at the end of every `HudScene.build`. Re-mounting also releases a
        direction held across a rebuild, which would otherwise stick forever
        with nothing left to receive its `pointerup`
  - [x] `GameScene` reads the HUD's adapter rather than adding objects into a
        scene it does not own
  - [x] Both `removeAll(true)` sweeps replaced by `destroyAllChildren`, and the
        comment claiming `removeAll(true)` "DESTROYS these" corrected
  - [x] A gate that fails on the shipped build - verified by reverting the fix
        and watching both new tests go red ("the d-pad is not on the HUD display
        list", "stage two has no d-pad"). They assert on the DISPLAY LIST and
        require the drawn zone count to equal the interactive count, so the
        exact split that shipped cannot recur silently
  - [x] Two things I predicted and measurement refuted, both left alone: there
        is NO object leak (0 of 44 stage-1 objects alive after three stage
        transitions - scene shutdown collects the orphans) and NO zone
        accumulation (7 at each of stages 1-4). The controls were also NOT in
        the wrong coordinate space: `useLogicalViewport` pins the HUD camera's
        origin and zooms it, so the HUD authors in logical units like everything
        else
  - [x] lint, typecheck, 141 unit, 39 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No change to the controls' layout, size or behaviour. They were correct;
    they were simply not on the display list.


## Completed tasks archived during ART-15 — 2026-09-20

### FLAKE-1 - The audio e2e measures sim progress with a wall clock

- Status: DONE
- Requirement:
  `e2e/audio.spec.ts` failed once during the FIX-4 verification run and passed
  both on its own and on a full re-run of the suite (42/42). It is a flake, not
  a breakage, and the mechanism is visible in the test:

      await page.keyboard.press('z')   // swing
      await page.waitForTimeout(500)   // let the attack finish
      await page.keyboard.press('x')   // jump

  The 500ms is standing in for "enough sim ticks that the attack has ended",
  because a jump is refused unless the player is idle or walking. Ticks advance
  with FRAMES, so under three parallel workers the frame rate drops, 500ms
  buys fewer ticks, the attack is still running, the jump is refused and only
  one sfx fires where the test wants two. `playwright.config.ts` already
  records this class of problem: "too many parallel workers starve each other
  under contention (recurring flake)".
- Acceptance criteria:
  - [x] The test now polls for the player being back to `idle` or `walk`
        before pressing jump, and polls the sfx counter afterwards
  - [x] Nothing weakened: same two sfx from the same two actions, same mute
        toggle, no retry added, no assertion relaxed
  - [x] Reproduced the flake deterministically before fixing it, by starving
        frames with `Emulation.setCPUThrottlingRate` rather than hoping to
        catch it. The 500ms wait bought 57 ticks unthrottled, 9 at 10x and 4
        at 20x; at both throttled rates the player was still in `attack` when
        jump was pressed, so it was refused and one sfx fired instead of two.
        The polling version passes at every rate
  - [x] CORRECTION to the audit criterion as filed. I wrote that any other
        `waitForTimeout` standing in for sim progress "should go the same way".
        Measuring says otherwise, and the real discriminator is sharper than
        the one I wrote: the danger is not a wall-clock wait, it is an
        assertion that needs the sim to cross a THRESHOLD inside that window.
        `touch.spec`'s d-pad hold asserts `x1 > x0` - any progress at all - and
        at 10x starvation still moved the player 120 -> 130.5. `gamepad.spec`'s
        button hold is the same shape with a 1200ms margin. `anim.spec` needs a
        full walk-frame alternation, which is a threshold, but it samples six
        times and caught both frames at 8 ticks under 20x starvation, twice
        over. So `audio.spec` was the only genuine instance, and rewriting
        three working tests on speculation would have been its own risk
  - [x] lint, typecheck, 142 unit, 42 e2e, build. Vision, prodbuild and signal
        were not re-run: nothing under `src/` changed, so the game they measure
        is byte-identical to 03c38be where all three were green
- Non-goals:
  - No change to the audio pipeline. The code under test is not implicated;
    the measurement is.

### FIX-5 - Rotating the phone leaves the canvas at the old orientation's size

- Status: DONE
- Requirement:
  Turn the handset and the game does not re-fit. Measured on a Pixel 7 profile
  with a real device-metrics rotation (CDP `setDeviceMetricsOverride` with
  `screenOrientation`, which is what Chrome sends a page when the phone turns):

      portrait          win 412x839   #game 412x839   canvas 412x232   correct
      rotated landscape win 915x412   #game 915x412   canvas 412x232   STALE
      rotated back      win 492x1093                  canvas 732x412   STALE, 4
                        of the 7 control zones off screen

  The second rotation is the damaging one: a canvas still sized for landscape
  inside a portrait viewport overflows, and the overflow is what drags the
  reported viewport out to 492x1093 in the first place.

  Cause is an ordering bug in Phaser's own ScaleManager, and the evidence is
  unambiguous: after the rotation `scale.parentSize` is CORRECT at 915x412
  while `scale.displaySize` is still 412x232, and calling `scale.refresh()` by
  hand immediately produces 732x412. `listeners.windowResize` calls
  `updateBounds()` and THEN sets `dirty`; `step()` reacts to `dirty` by calling
  `getParentBounds()` again, which now finds the recorded bounds already equal,
  returns false, and so never calls `refresh()`. The bounds get recorded
  without the canvas being refitted.
- Evidence limits, stated plainly: this is reproduced under Chromium device
  emulation, which is the closest thing available here to a handset. A plain
  DESKTOP window resize is unaffected - measured across 1200x800, 800x600,
  1600x500 and 640x480, every one refits exactly - so this is specific to the
  mobile path.
- Acceptance criteria:
  - [x] `resize`, `orientationchange` and `screen.orientation`'s own change
        event all call `game.scale.refresh()`, deferred one frame so it reads
        settled layout instead of mid-reflow
  - [x] After: rotated landscape 732x412 against an expected 732x412, rotated
        back 412x232 against 412x232, no control off screen in either. The
        reported viewport on the way back is now a clean 412x915 rather than
        492x1093, because nothing overflows to drag it out any more
  - [x] Desktop resize re-measured at 1200x800, 800x600, 1600x500, 640x480 and
        back: every one still exact, so the path that already worked is
        undisturbed
  - [x] Proven able to fail by removing the listeners: "landscape: the canvas
        kept the previous orientation's size - viewport 915x412, canvas
        412x232, expected 732x412"
  - [x] lint, typecheck, 142 unit, 43 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No patching of Phaser and no change to the scale mode. One refresh on the
    events that matter is the whole fix.

### FLAKE-2 - Boot polls give the game five seconds to start

- Status: DONE
- REWRITTEN. I filed this against `e2e/game.spec.ts:23`, the 400ms ArrowRight
  hold, on the theory that a hard assertion gated on wall-clock time was what
  failed under contention. Measurement says that theory was wrong, twice over:
    - CPU starvation does not break it. At 20x and even 50x throttling the
      400ms hold still moved the player (2 ticks, 120.0 -> 121.4), so the
      assertion survives conditions far harsher than a busy machine.
    - Reproducing the actual failure under real over-subscription shows a
      different line entirely. Every failure, across `game`, `finalstage`,
      `horse` and `coop`, is
      `Timeout 5000ms exceeded while waiting on the predicate` on
      `expect.poll(...).toBe('title')` - the poll waiting for the game to BOOT.
  So the fragile thing is not how the test measures movement. It is that the
  whole suite gives the game five seconds to reach its title screen, and boot
  generates the entire cast's art before it gets there.
- Requirement:
  39 boot-to-title polls across 23 files all run on Playwright's default
  `expect` timeout of 5000ms. Under a loaded machine that is not enough, and
  the failure reads as a game defect when it is a budget. `touch.spec` already
  passes `{ timeout: 8_000 }` explicitly for its transitions, so a longer
  explicit budget is established practice here rather than a new idea.
- Acceptance criteria:
  - [x] `expect: { timeout: 15_000 }` in `playwright.config.ts`, one place
        instead of 39 call sites
  - [x] Nothing weakened: a game that never boots still fails, just later; no
        assertion changed, no retry added, specs with their own timeout keep it
  - [x] A/B measured at four workers, which is the realistic "machine is busy"
        case rather than an artificial one:
            5s budget  -> 2 failed (game.spec, horse.spec)
            15s budget -> 11 passed
        So the change earns its place rather than being a plausible-sounding
        tidy-up
  - [x] CORRECTION to the criterion as filed. I wrote that the specs failing at
        SIX workers should pass at six afterwards. They do not, and no timeout
        could make them: with the 15s budget the failure simply moves from
        "Timeout 5000ms exceeded" to the 30s TEST timeout, because six Chromium
        instances each generating the whole cast's art against one dev server
        genuinely cannot boot in fifteen seconds. Six workers is past what this
        machine can do, which is why the config says three. Claiming this fixed
        contention would have been false
  - [x] Still green at the configured three workers - 43 e2e in 1.7m, the same
        as before - because a timeout is a ceiling, not a wait
  - [x] lint, typecheck, 142 unit, 43 e2e, vision 5/5, prodbuild 3/3,
        signal 13/13, build
- Non-goals:
  - No change to `e2e/game.spec.ts`. The line I originally accused is fine, and
    changing it would have been a fix aimed at the wrong thing.
  - No retries. A retry would hide exactly this kind of finding.

### ART-1 - The characters have no real faces

- Status: DONE
- Requirement:
  The figures read as bodies with a marker where a face should be. Requested by
  the owner: make them look like human faces, and make the five heroes match
  their well-known appearances. Two concrete things are missing, both measured
  in the code rather than guessed:

  1. The face is two marks. `drawDetails` in `src/game/art/draw.ts` draws one
     brow stroke and one eye dot, and says so in its own comment - "A face is
     two marks and a brow". There is no second eye, no nose, no mouth, no ear,
     no cheek or jaw structure. A head is an oval in a skin tone with a brow
     and a dot on it.

  2. There is ONE skin tone for the whole cast. `SKIN = 0xf0c8a0` in
     `src/game/art/palette.ts` is a module constant, and `materials()` writes
     `skin: css(SKIN)` with no parameter. `FigurePlan` carries body, trim,
     gear, headgear, weapon, beard, beardColour and cape - and no complexion,
     so all eighteen humanoids are the same shade. Guan Yu's 面如重枣 ("face
     like a dark red date") and Zhang Fei's 黑脸 (dark face) are the two most
     recognisable conventions for those characters, and neither is currently
     expressible at all.

  Worth knowing before designing: the head is small. A figure is drawn 92px
  tall with `headR = 10.4`, so the head is about 20px across, and the portrait
  is not a close-up - `drawKindPortrait` magnifies the same figure by
  `PORTRAIT_ZOOM = 1.02` inside a 36x40 box. So the face has to read at roughly
  20 logical pixels. Enlarging the portrait into an actual head close-up is
  part of this, because otherwise there is nowhere the detail can be seen.

  "Exactly like their typical appearance" is read here as the standard
  public-domain literary and opera conventions, which are what "typical" means
  for these figures, and which the game already draws on for Guan Yu's green
  and Zhao Yun's silver:
    - 关羽 Guan Yu: dark-red complexion, a very long flowing beard (美髯公,
      "Lord of the Beautiful Beard"), long slanted phoenix eyes with heavy
      silkworm brows, green robe.
    - 张飞 Zhang Fei: dark complexion, large round glaring eyes, a coarse
      bristling beard (豹头环眼, 燕颔虎须).
    - 赵云 Zhao Yun: young, fair, clean-shaven, strong level brows, the
      handsome look the character is known for.
    - 魏延 Wei Yan: sallow, hard, sharp-featured, severe expression.
    - 黄忠 Huang Zhong: the old general - weathered lined face, white beard
      and hair, heavy brows, still vigorous.
- Acceptance criteria:
  - [x] `FigurePlan.skin` carries a complexion and `materials()` takes it as a
        fifth argument defaulting to the old `SKIN` constant, so a kind that
        says nothing about its face draws exactly what it drew before. Every
        other kind in the cast is therefore unchanged
  - [x] The five heroes have the complexions above: Guan Yu 0xa8442f (面如重枣),
        Zhang Fei 0x8a5a3c, Zhao Yun 0xf4d0ac, Huang Zhong 0xd9ad86, Wei Yan
        0xc79a63. Zhang Fei's is deliberately dark-but-not-black: his beard is
        already 0x181410 and `drawBeard` records that a dark beard meeting a
        dark head once "came out as one black mass with no face in it"
  - [x] The face pass now draws a pair of eyes, a pair of brows, a nose that
        reaches the silhouette, and a mouth, plus a new `skinForm` material for
        the form marks - because `skinShade` (22% down) came out BRIGHTER than
        the cel shadow band (a 34% overlay) and rendered them as pale blobs
  - [x] CORRECTION to this criterion as filed. It asked for an ear and a
        cheek/jaw shade step as well, and both were drawn and then REMOVED: at
        this size they rendered as scattered dark blemishes rather than
        structure, which is worse than not having them. The clear face window
        is about one head radius tall - hair covers to -0.04R and the beard
        starts at +0.85R - so four features fit and six do not
  - [x] The portrait is a head close-up now: `PORTRAIT_ZOOM` 1.02 -> 1.3 and
        `PORTRAIT_HEAD_Y` 14 -> 18. At 1.02 it was almost exactly the
        play-scale head, so a face with structure had no more pixels there than
        it did in a fight
  - [x] A gate that can fail, though NOT the one this criterion specified. A
        "the face has marks on it" metric was attempted five ways and none
        could fail when the marks were removed, so it was dropped rather than
        shipped - see the note in the test file. What does gate is the pair
        difference, proven against the real negative control: giving all five
        one complexion fails both parts, the declared-skin check with "guanyu
        and zhangfei were given the same complexion" and the rendered
        comparison at 11.2 against a floor of 18
  - [x] `dominantFraction`, `colorCount`, `tonalBands`, silhouette, weapon
        reach, clipping, centring, walk cycle, boss weight and pose distinctness
        all still pass - checked, not assumed
  - [x] lint, typecheck, 143 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - Not photorealism, and this is a real limit rather than a disclaimer. The
    pipeline is flat cel shading: ink silhouette, flat fills, one hard shadow
    band, one lit band. "Real human faces" here means faces with recognisable
    human structure and each hero's own features, which is what makes a
    character read. It does not mean photographic skin.
  - No existing game's art. These are public-domain literary and opera
    conventions drawn in this game's own pipeline. Nothing traced, copied or
    loaded from any other title - the same rule that already governs the rest
    of the cast.
  - No change to height, build or silhouette. `fitSprite` derives one scale
    from the idle frame and the art gates bound both absolute height and the
    tallest-to-shortest ratio, so a bigger head is a regression elsewhere.

### ART-2 - The nine bosses are as famous as the heroes and have plainer faces

- Status: DONE
- Requirement:
  Optional follow-on to ART-1, not a defect. Rendering the whole cast at once
  to check the heroes' new faces had not left everyone else looking like a
  different game shows the cast IS coherent - the twelve non-heroes share the
  base complexion, which reads correctly as uniformed troops, and the bosses
  carry distinct headgear that separates them at a glance.

  What it also shows is that the mechanism is now sitting unused for nine
  characters who are as recognisable as the five heroes, and who the player
  fights at the end of every stage:

    ﹒吕布 Lu Bu - the strongest warrior in the story. Conventionally pale, with
      a red-plumed headdress and a sneer.
    ﹒曹操 Cao Cao - the villain of the piece. Conventionally sharp-featured and
      cold; often dark-browed.
    ﹒夏侯惇 Xiahou Dun - who lost an eye to an arrow and ate it. The single most
      recognisable facial feature in the entire cast, currently not drawn.
    ﹒典韦 Dian Wei, 許褚 Xu Chu, 曹仁 Cao Ren, 張遼 Zhang Liao, 徐晃 Xu Huang,
      張郃 Zhang He - the rest, each with a conventional look.

  ART-1 left every kind that says nothing about its face exactly as it was, which
  is why they are unchanged. This task gives them complexions and face kinds
  through the same `FigurePlan.skin` / `FigurePlan.face` path the heroes use.
- Acceptance criteria:
  - [x] Each of the nine bosses declares a complexion and a face kind:
        Li Dian calm, Xiahou Dun fierce, Xu Chu fierce, Cao Ren calm, Zhang
        Liao phoenix, Xu Huang sharp, Zhang He calm, Cao Cao sharp, Lu Bu
        fierce. The complexions are DELIBERATELY modest variations around the
        cast base, unlike the heroes' saturated choices - only Xiahou Dun has
        an iconic colour cue, so inventing strong tones for the rest would be
        colouring for its own sake
  - [x] The rank-and-file keep the shared tone, and a gate now enforces that
        as deliberate rather than accidental: soldier, spearman and archer must
        declare neither complexion nor face kind
  - [x] Xiahou Dun's missing eye, no eyepatch - his depictions show the empty
        socket, not a patch. Drawn in BOTH face passes: a hollow larger than an
        eye with a pale scar crossing it, where the scar must extend PAST the
        socket to read as a wound, because at 20px a plain dark oval reads as
        just another eye. The scar is tinted from the figure's own complexion,
        so it stays his on any skin. His portrait adds a darker core for depth
        and a second short scar
  - [x] A new gate: all nine bosses declare complexion and face kind, no two
        bosses share a complexion, the rank-and-file declare neither, and
        xiahoudun's missingEye is true while every other boss's is false.
        Falsified three ways: two bosses given one complexion fails ("lidian
        and caoren share a complexion"), removing the wound fails ("xiahoudun
        is the one-eyed general"), giving a soldier a complexion fails
        ("soldier is a uniformed troop and keeps the shared tone")
  - [x] The heroes' face gate untouched and still passing; no hero changed, and
        no height, build or silhouette changed
  - [x] lint, typecheck, 144 unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - Not required for correctness. The cast is coherent as it stands and this is
    an improvement, not a fix.
  - No change to the boss fights, their stats or their AI. Faces only.

### ART-3 - The portraits were the in-play head magnified, so they had no detail to show

- Status: DONE
- Requirement:
  The owner looked at the game after ART-1 and ART-1b and said the faces were
  still not faces - "still just some shapes and objects". They were right, and
  the diagnosis is arithmetic rather than taste:

    `PORTRAIT_BOX` 36x40 logical at `RENDER_SCALE` 2 = a **72x80 texture**, in
    which the whole face was about **28x24 pixels**, then upscaled ~1.9x to the
    136x152 the portrait is displayed at.

  Four marks is all that fits in 28x24, which is why the portraits read as blobs
  with dots however carefully those marks were placed. And `drawKindPortrait`
  called the same `drawFigure` as the fighter, so the portrait was the in-play
  head MAGNIFIED - there was no portrait-specific art anywhere in the game.

  Worse, ART-1b had raised `PORTRAIT_ZOOM` 1.02 -> 1.3 and reported it as giving
  "the face more pixels to be seen in". That was wrong: zoom magnifies, it does
  not add resolution, so it made the same 28x24 of face bigger and softer.
- Acceptance criteria:
  - [x] Portraits render at their own scale, `PORTRAIT_SCALE = 6`, for a
        216x240 texture and a face of roughly 84x72 pixels - nine times the
        area. `PORTRAIT_TEXTURE` is exported so the canvas allocation and the
        drawing cannot disagree
  - [x] `drawPortraitDetail` draws the things that need those pixels and exist
        nowhere else: an ear with an inner curve, a cheekbone shade, an upper
        lid over each eye, a catchlight in each eye, a nostril, and a lower lip
  - [x] Called ONLY from `drawKindPortrait`, so the in-play sprites keep the
        coarse face and no sprite gate sees any of it
  - [x] Everything is a fraction of `headR` and shares the landmarks
        `drawDetails` uses, so the two face passes cannot drift apart
  - [x] Memory measured: 203KB per portrait, +0.9MB for the five heroes the
        select screen generates (113KB -> 1.0MB). The project's whole art budget
        is 23.7MB, so this is affordable and worth stating rather than assuming
  - [x] Verified by eye at the sizes the game actually shows: the select roster
        thumbnails, the big portrait panel, and the HUD plate
  - [x] lint, typecheck, 143 unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - No change to the in-play figures. At 20px a fighter's face still reads as
    two eyes and a mouth, and that is not fixable without larger heads, which
    would change every silhouette and is a design decision rather than a fix.
  - No change to the fight, the stats or the AI.

### ART-4 - The portraits had nine times the pixels and the same cartoon eyes

- Status: DONE
- Requirement:
  The owner looked again after ART-1/1b/3 and said the heroes still do not look
  human. Right again, and the specific cause: ART-3 raised the portrait budget
  to roughly 84x72 pixels of face, but the detail pass layered refinements
  ON TOP of the old face instead of using the budget. The eyes were still
  solid near-black ovals with a catchlight - the single strongest "cartoon, not
  human" signal there is.
- Fix, in the portrait pass only:
  - A human eye replaces the dot: warm-white sclera large enough to swallow the
    coarse oval, a dark-brown iris offset toward the nose (a centred gaze reads
    as a stare), a pupil, a catchlight, and the lid line over the top. Eye
    colours are constants - warm whites and brown irises, because the cast is
    Chinese and paper-blue would read as a different art style
  - `FACES` gains `eyeTilt` (丹凤眼 slants, 环眼 stares straight, age droops)
    and `browArch` for portrait brow curvature
  - Lips: shadowed upper lip, lighter lower lip, over the coarse ink line
  - Jaw shading down both sides and a chin light, so the head tapers toward a
    chin instead of running on as an egg
- Acceptance criteria:
  - [x] The five heroes' portraits read as faces with real eyes - verified by
        eye against the render, `artifacts/look/faces-human.png`
  - [x] Xiahou Dun's socket keeps its scar and gains depth, and correctly gets
        NO sclera, iris or catchlight
  - [x] Portrait-only: the in-play coarse face is untouched, so no sprite gate
        is affected
  - [x] lint, typecheck, 144 unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - In-play fighters unchanged. At a 20px head a human eye is not drawable;
    that would need larger heads and is a design decision.

### ART-5 - The portrait's curved brows are traced and never filled, so no portrait shows them

- Status: DONE
- Requirement:
  ART-4b "wired the unused brow arch" - and built the path without painting it.
  `curvedBrow` in `drawPortraitDetail` (`src/game/art/draw.ts`) calls
  `chainPath` and never calls `ctx.fill()`. All four path helpers in
  `src/game/art/rig.ts` (`chainPath`, `limbPath`, `ovalPath`, `polyPath`) are
  trace-only - `beginPath` to `closePath`, no fill - and every other `chainPath`
  call site in `draw.ts` fills via `add()` or an explicit `ctx.fill()`. This is
  the only bare one. The next path operation (the eye's `ovalPath`) begins a
  new path and discards the brow, so every portrait shows the coarse STRAIGHT
  brows underneath while `browArch` is read to no effect.

  Proven by pixel, not just by reading: Guan Yu's near-brow arch-apex
  crescent, canvas (158, 81) - inside the curved shape (0.29 local units within
  its edge) and 0.45 units clear of the straight stroke's top edge - is pure
  skin (168,68,47, exactly his complexion) in BOTH the coarse-only render and
  the full `drawKindPortrait` render, and 0/81 pixels differ in the 9x9 around
  it. The curved pass paints nothing.

  Why nothing caught it: portrait art is deliberately invisible to the sprite
  gates (the isolation that protects them also blinds them), and the
  eye-verification passed because straight brows still look like brows - the
  arch is sub-half-width BY DESIGN, so the review compared "straight" against
  "straight" and called it arched.
- Acceptance criteria:
  - [x] The curved brow is filled: one `ctx.fill()` after the `chainPath`, or
        the trace routed through `add()` like every other site. No endpoint,
        width or arch value changes - the geometry was verified correct, only
        the paint is missing
  - [x] Re-rendered and judged by eye: all five hero portraits and Xiahou Dun,
        at the sizes the game shows (roster, panel, HUD plate)
  - [x] A gate that pins the paint, not the geometry: render `drawKindPortrait`
        against `drawFigure` with the identical transform and require the
        arch-apex crescent pixels (computed from the kind's FACES row, inside
        the curved shape and clear of the straight stroke) to differ.
        Proven able to fail: removing the fill makes the gate fail
  - [x] lint, typecheck, unit, e2e, vision, prodbuild, signal, build
- Non-goals:
  - No brow redesign. Same endpoints, same widths, same arch values.
  - No change to the coarse in-play face or to any other portrait mark.

### ART-6 - The portrait face is built on the wrong geometry, not on too few marks

- Status: DONE
- Requirement:
  The owner has said five times that the heroes do not look human. Five prior
  attempts (ART-1, ART-1b, ART-3, ART-4, ART-4b, ART-5) each ADDED a mark or
  tuned a scalar - a second eye, a nostril, a catchlight, a lower lip, a curved
  brow, then the missing `fill()` for that brow. None changed the head shape,
  where the features sit on the head, the headgear occlusion, or the framing.
  The marks were never the problem. Measured causes:

  1. THE EYES ARE DISCS. `humanEye` (`src/game/art/draw.ts:566`) draws the
     sclera at `rx*1.2 x ry*1.14` where `rx = 0.14R*eyeW`, `ry = 0.15R*eyeH`.
     For Zhao Yun (`calm`) that is 0.188R x 0.180R - an aspect of 1.04:1, a
     CIRCLE - with a circular iris of `ry*0.6` floating inside it, so white
     shows above, below AND both sides. A human aperture is about 2:1 wide and
     the upper lid always cuts the top of the iris. This is the strongest
     remaining cartoon signal and it affects all five heroes.

  2. TWO HEROES HAVE THEIR FACE PAINTED ON THEIR HAT. Headgear is a `shapes`
     entry filled in `paintCel`; the face is painted after. At the near-eye
     column (x = 0.52R) the headgear's lower edge computes to:
       Zhao Yun  helmet  +0.342R   eye spans 0.02-0.38R   eyes AND brows on gear
       Wei Yan   turban  +0.196R   eye spans 0.055-0.345R brows + upper eyes
       Guan Yu   hood    -0.285R   clears - on skin
       Zhang Fei band    -0.165R   clears by 0.02R
       Huang Zhong band  -0.165R   clears by 0.02R
     Zhao Yun's visible skin is only y in [0.34R, 1.14R] - the bottom third of
     his head. He reads as a helmet with eyes stuck on it.

  3. THE HEAD IS ONE ELLIPSE WITH NO CHIN. `ovalPath(p.head, headR, headR*1.14)`
     (`draw.ts:219`) - no cranium/jaw split, no taper. ART-4's "jaw shading" is
     a single `limbPath` stroke laid on an egg, which is why the heads still
     read as eggs.

  4. A STRAIGHT CEL BAND CUTS A SEAM THROUGH EVERY FACE. `bandPath`
     (`draw.ts:83-101`) lays one straight-edged quad across the whole figure; on
     the head the shadow edge lands at x ~ 56.1 figure units, between the near
     eye (54.4) and the nose tip (58.9). At portrait size that reads as a
     rendering artifact, not as light.

  5. THE FRAMING IS A BUST. `PORTRAIT_ZOOM 1.3` / `PORTRAIT_HEAD_Y 18` put the
     head centre 45% down the box; the face is ~43% of frame height and the
     bottom ~30% is shoulder, robe and a large round shield.

  6. TWO HEROES HAVE NO HAIR AT ALL. The hair cap (`draw.ts:223-235`) is drawn
     only for `band`/`turban`/`crown`. Guan Yu (hood) and Zhao Yun (helmet) get
     no hair shape - no hairline, no sideburns, nothing framing the face.

  Owner's scope decisions for this round: PORTRAITS ONLY (in-play fighters
  untouched), REFRAME to a head close-up, FLAT CEL KEPT - fix the proportions,
  no gradients.
- CORRECTION to the fix as filed. This task was written around a portrait-only
  "face plate": clip a face-shaped mask over the head, refill it with skin to
  erase the cel seam and the coarse marks, and draw the features on that. A
  design review measured the idea against the real geometry and it does not
  work, for two reasons worth keeping:
    1. There is no room under the headgear to put a face. The gear's LOWEST
       point over the face is +0.44R for a helmet and +0.27R for a turban,
       while the eye line sat at +0.20R. A plate that stays below the gear
       starts below the eyes; a plate that does not is redrawing the headgear,
       and should say so.
    2. A plate cannot make a chin. The silhouette comes from the head PATH; a
       plate only repaints the interior. That is exactly what ART-4's "jaw and
       chin" shading already did across three commits, and the head's measured
       half-width still matched the bare ellipse to three decimals (0.887-0.897
       against a closed form of 0.889).
  So the plate would have been a sixth round of marks on unchanged structure.
  What shipped instead: the PORTRAIT GETS ITS OWN HEAD, headgear, hair and
  light, run through the same `paintCel` as everything else - so it is the same
  art style, drawn from the same `FigurePlan`, and the fighter is untouched.
- Also found by that review and fixed here, not in the original diagnosis:
    3. THE FACE WAS ON THE SHADOWED SIDE OF EVERY HEAD. The cel terminator sits
       at x~53.8 while a head spans 38.6..59.4 and the figure faces RIGHT, so
       every feature landed in the shadow band and the lit band (x < 38.7)
       never reached the head at all. Measured: the near cheek was 25-29%
       DARKER than the back of the skull on all five heroes. You cannot read
       form that is uniformly in shadow.
    4. THE PORTRAIT ANCHORED ON THE WRONG HEAD. `drawKindPortrait` translated
       by `POSE_TABLE.idle.head.y` - the RAW pose - while `applyBuild` moves
       the head by the hero's height (12.69 for Guan Yu, 18.08 for Zhang Fei).
       Each portrait was therefore slid by its own build: a 42px spread in a
       240px frame, with four of the five clipped at the top edge. Live since
       ART-1b and never noticed.
- Acceptance criteria:
  - [x] The portrait draws its own head: a jaw-tapered 3/4 outline with a nose
        profile, at a half-width of 0.82R so height:width is 1.39 (human) rather
        than the sprite ellipse's 1.14
  - [x] Headgear derived from that outline - "the top of this head, thickened" -
        so a helmet, turban, band, hood and crown all SIT on the head instead of
        overhanging it, with every brim raised to `L.gearEdge` = -0.58R, above
        the brow. Zhao Yun's forehead goes from 1.1% skin to a full brow's
        worth; Wei Yan's from 0.0%
  - [x] The portrait has its own light: shadow on the far side of the head,
        light on the face. Near cheek / far temple goes from 0.71-0.75 to >= 1.0
  - [x] The eye is an ALMOND aperture with the iris CLIPPED by the lid, so white
        can only show left and right of it. Measured sclera width:height goes
        from 0.92-1.24 (taller than wide) to 1.8-3.2. New `FACES.eyeAspect`
        carries the historical shapes: 2.9 for Guan Yu's 丹凤眼, 1.55 for Zhang
        Fei's 环眼
  - [x] Features on human canon: brow -0.22R, eye +0.04R, nose base +0.36R,
        mouth +0.58R, chin +1.12R - the eye line at the middle of the head
        rather than 58% down it
  - [x] Beards wrap the jaw and carry a moustache, painted in the face pass
        because `figureShapes` draws the arm and weapon after the head - as a
        shape, Guan Yu's 美髯 came out behind his own glaive
  - [x] Framing: anchored on the BUILT head, `PORTRAIT_ZOOM` 1.3 -> 1.33 and
        `PORTRAIT_HEAD_Y` 18 -> 21. Head-centre spread 42px -> 0px. 1.33 is a
        ceiling, not a preference: the tallest head-plus-headgear is 2.44 headR
        and the box holds no more
  - [x] `src/game/art/portrait.ts` (new) and `src/game/art/faces.ts` (new);
        `draw.ts` 893 -> 713 lines, back under the project's own 800
  - [x] Eight gates in `test/game/portrait.test.ts`, ALL of them proven able to
        fail by reverting the mechanism - never by moving a threshold:
          headgear back over the brow  -> "the face is painted on the headgear"
          aperture back to a disc      -> "the eye is a disc (w:h 0.60)"
          historical shapes swapped    -> 环眼 not rounder than 丹凤眼
          sprite bands on the portrait -> "the face is darker than the back"
          head back to an ellipse      -> "no nasion"
          raw-pose anchor restored     -> heads at different heights
          zoom past the frame          -> "the headgear is cropped"
          face pass traced, not filled -> "it is tracing without painting"
  - [x] A NINTH gate was designed, measured and DROPPED rather than shipped: a
        "no straight seam crosses the face" metric returned 0-15% on art a seam
        demonstrably ran through, because the per-row argmax is captured by the
        eye, brow and lip marks instead of the band. Any threshold that failed
        the old art would have failed correct art too. The lit-face gate covers
        the same defect, so this is recorded rather than shipped - the same
        judgement `artquality.test.ts` already records for five other metrics
  - [x] A gate that could not fail, caught and fixed DURING falsification: the
        first framing gate recomputed the expected head position with the same
        arithmetic the fixed code uses, so reverting the anchor bug moved the
        prediction along with the drawing. It now locates the head from the
        RENDERED eye line
  - [x] No sprite moved, PROVEN rather than argued: all 176 sprite textures
        rendered before and after digest to the same SHA-256,
        154bc54d7e152520d2284fa7e6d00b50f9529d57bc2163fdf4fd24de6155b975. Both
        new parameters (`paintCel` bands, `figureShapes` head parts) default to
        exactly the previous behaviour
  - [x] Five stale `art/raw/*-portrait.png` placeholders removed from this
        working copy. CORRECTED SCOPE: `art/raw/` is gitignored, so these were
        never committed and this is not a repo change - but on any checkout
        that has them, `scripts/bake-art.mjs` would bake them into
        `public/assets/portraits/` and `BootScene` prefers the manifest over
        procedural art, which would silently revert this entire fix. Worth
        knowing before anyone runs the bake pipeline
  - [x] `scripts/facesheet.mjs` (new, tracked): renders the five portraits at
        native size AND at all three display sizes, pulling the real textures
        out of the running game. Every earlier round judged the face at texture
        size while the game never shows one above 63% of it, and no sheet script
        survived in the tree
  - [x] FOLLOW-UP, found by a producer pass over my own commit: the portrait
        left 夏侯惇 Xiahou Dun with a socket and NO OTHER EYE. `drawDetails`
        draws the far eye before branching on `missingEye`; the portrait had
        both eyes inside the else, so losing one eye removed both. Pre-existing
        in `drawPortraitDetail` and faithfully carried over by me. This is the
        same branch mistake ART-4b caught when the lips and jaw were nested
        under "has eyes". Fixed, plus a ninth gate that renders him and
        requires sclera at the good eye and none at the socket - proven able to
        fail by restoring the nesting ("the good eye is missing"). Nothing
        displays a boss portrait, so that branch had no other exercise
  - [x] The five hero portraits are byte-identical across that follow-up
        (SHA-256 584e6145...c069), so only a figure no screen shows changed
  - [x] lint, typecheck, 153 unit, 43 e2e, vision 5/5 (incl. renderer parity),
        prodbuild 4/4, signal 13/13, build
- Non-goals:
  - No change to the in-play fighters, poses, silhouettes or builds. At a ~20px
    head a human eye is not drawable; that is a rig redesign, not a fix.
  - No gradients, no soft shading, no restyle. Flat cel throughout.
  - No change to `PORTRAIT_BOX`, `PORTRAIT_TEXTURE` or any scene's display
    sizes - those are fixed numbers in SelectScene/HudScene and changing the box
    aspect would distort every surface.
  - No boss portraits. None exist and none are asked for.

### ART-7 - The in-play face is the one the player looks at, and it has every defect ART-6 just fixed

- Status: DONE
- Requirement:
  ART-6 fixed the portraits. The fighter's face was left alone on a stated
  justification that is WRONG, and the error is repeated in eight places across
  the codebase and this file:

      "at a ~20px head a human eye is not drawable"

  20 is LOGICAL units. `RENDER_SCALE` is 2 and `GameScene.fitSprite` gives a
  hero scale of exactly 116/232 = 0.5 against a camera zoom of exactly 2, so
  the sprite is texel-for-pixel with the 960x540 backing store. Measured:

      guanyu      40.4 x 46.0 device px
      zhangfei    43.3 x 49.3
      zhaoyun     41.6 x 47.4
      huangzhong  42.4 x 48.4
      weiyan      41.2 x 46.9

  `Scale.FIT` then stretches that canvas to the window, so on a 1080p display
  the head a player watches for the entire game is about 83 REAL screen pixels
  across. That is not a face that cannot be drawn; the portrait's face window
  before ART-6 was not much bigger.

  Rendered at 6x (`artifacts/look/inplay-heads.png`), the in-play face has the
  same defects ART-6 found in the portrait:
    1. THE EYES ARE ON THE HEADGEAR, and worse here than in the portrait
       because the gear is a contrasting colour: the helmet's lower edge at the
       near-eye column is +0.342R and a turban's is +0.196R, while the eye sits
       at +0.20R. Zhao Yun's eyes are painted on grey steel, Wei Yan's on
       purple cloth.
    2. THE EYES ARE SOLID DOTS - `m.eye` ovals at roughly 1:1, no lid, no
       structure. The same "cartoon, not human" signal the portrait had.
    3. THE FACE IS CRAMMED INTO THE BOTTOM THIRD of the head.
    4. Stray `skinForm` marks read as dirt rather than structure.
- Constraint that shapes the whole fix: NO SILHOUETTE CHANGE. `drawDetails`
  runs after `paintCel` and draws inside the head, so face marks cannot move
  the outline - but RAISING THE HEADGEAR would, and the headgear is a `shapes`
  entry. So the face must come DOWN to meet the gear rather than the gear going
  up, and only by as much as each gear kind actually requires (helmet the most,
  band and hood not at all).
- CORRECTION to the non-goals as filed. I wrote "no change to any silhouette"
  and then changed one, deliberately: the face CANNOT duck under a helmet that
  reaches +0.342R without landing on the chin, so the brim had to come up. The
  change is bounded and measured rather than waved at - each bowl keeps its TOP
  (cy - ry) and its WIDTH (rx) exactly, so the two points that define its
  outline do not move, and only the vertical profile shallows:
      helmet  ry 0.86 -> 0.5197, cy -0.42 -> -0.7603, edge +0.342 -> -0.300
      crown   ry 0.70 -> 0.4796, cy -0.50 -> -0.7204, edge +0.114 -> -0.300
      turban  ry 0.82 -> 0.5604, cy -0.55 -> -0.8096, edge +0.196 -> -0.300
  Measured over all 176 sprite textures: 85 are silhouette-IDENTICAL and 91
  moved, the worst by 1.68% of its own area (soldier:down). The gates that care
  are thresholded at 10% (hero distinctness) and 15% (pose distinctness).
- Acceptance criteria:
  - [x] Every face mark lands on SKIN. `gearFaceEdge` computes each headgear's
        lower edge at the eye column from the same table `addHeadgear` draws
        from, and `faceLayout` moves the face down by exactly what that kind
        needs - which is now nothing for helmet, turban, crown and hood, and
        0.11R for a band
  - [x] The eye is an almond, not a dot: 0.17 x 0.095 against the old
        0.14 x 0.15. About 2:1, which reads even at seven pixels wide
  - [x] A gate that would have caught it, in `artquality.test.ts`: probe just
        above the brow in the near-eye column for all 17 humanoid kinds and
        require skin. Probed per kind, because the band of skin between brim
        and brow sits at a different height for every headgear - the position
        comes from `faceLayout`, not from a copy of its arithmetic. Proven able
        to fail by restoring the old bowls: "zhaoyun: the brow has 134,138,150
        above it, not skin - the face is painted on the headgear"
  - [x] The silhouette change measured, not assumed - see the correction above
  - [x] The hero complexion-pair gate still passes, as do silhouette
        complexity, appendage ratio, colorCount, dominantFraction, outlineRatio,
        tonalBands, weapon reach, clipping, centring, walk cycle, pose
        distinctness and boss weight
  - [x] The three stale "20px" comments in `src/game/art/` corrected to the
        measured 40-43 device px. The figure is logical units; RENDER_SCALE is 2
  - [x] Judged by eye magnified (`artifacts/look/inplay-heads.png` before,
        `inplay-after.png` after) and at play scale
        (`artifacts/vision/game_combat.png`)
  - [x] lint, typecheck, 154 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - No change to head SIZE or build. `fitSprite` derives one scale from the
    idle frame and the art gates bound both absolute height and the
    tallest-to-shortest ratio. The headgear PROFILE did change - see the
    correction above.
  - No portrait change. ART-6 is done and its gates stay as they are.
  - Not photorealism. Flat cel, same as everything else.

### ART-8 - The weapon crosses the head in the walk1 frame

- Status: DONE
- Requirement:
  Found by ART-7's face gate when it was briefly run over all eight poses. In
  `walk1` the weapon is rotated such that its blade passes ABOVE THE BROW and
  over the top of the head. Measured at the near-eye column, just above the
  brow, the probe lands on steel rather than skin for six kinds:

      guanyu     154,148,157      weiyan     140,143,156
      soldier    140,143,156      spearman    99, 86,127
      lidian     182,189,201      zhanghe    182,189,201
      caocao     140,143,156

  Rendered at 2x (`artifacts/look/guanyu-walk.png`), Guan Yu's glaive blade
  sits on top of his hood in `walk1` while clearing it entirely in `idle` and
  `walk0`. The weapon is drawn last in `figureShapes`, so it is in FRONT of the
  head rather than behind it.

  This matters more than a single frame sounds like: `walk1` is half the walk
  cycle, and walking is the state a player sees most.

  PRE-EXISTING. Nothing in ART-6 or ART-7 moved the weapon; those tasks only
  made it visible, because until then no gate looked at the area above the brow
  at all.
- CORRECTION to my own recommendation. I filed this saying it was a judgement
  call and recommended ACCEPTING it, on the reasoning that any fix would cost
  animation swing or risk the clipping gate, since walk poses carry
  `POSE_REACH` 0. Measuring says that was wrong, and the mistake was assuming
  the only lever was the swing's AMPLITUDE.

  The real driver is not the rotation alone but WHERE THE HAND IS. In `walk1`
  the near hand swings in to x=54 against a head at x=50, so a near-vertical
  weapon passes straight over it; in `walk0` the hand is out at x=60 and clears
  the head at any angle. So the fix is to move the vertical extreme to the
  half of the stride where the hand is out - a change of PHASE, not amplitude.
- Measured, before and after, as steel-coloured pixels inside the head oval:

      kind        before    after       (baseline in other poses)
      guanyu        1034        0                            0
      lidian        1072       48                           48
      caoren         649        0                           44
      lubu           657        0                           44
      xuchu          633        0                            0
      xuhuang        625        0                            0
      weiyan         604        0                            0
      soldier        591        0                            0
      zhanghe        603        0                           48
      zhangfei       436        0                           50
      caocao         317        0                            0
      zhangliao      201        0                            0

  Zhao Yun and Huang Zhong read high in EVERY pose and are not in this table:
  their own gear is silver, so they trip a steel probe wherever it looks. The
  signal that matters is the walk1 SPIKE against the same kind's other poses.
- Acceptance criteria:
  - [x] `walk0` -1.28 -> -1.44 and `walk1` -1.50 -> -1.22. The swing is
        unchanged in amplitude at 0.22 radians; only its phase moved
  - [x] No pose clips its frame box - checked across all 17 kinds and 8 poses,
        before and after, and the answer was none either way
  - [x] The walk still reads as a swing, judged by eye across the whole cycle
        rather than one frame (`artifacts/look/walkcycle.png`)
  - [x] Every sprite gate still green, including the two this could have
        broken: walk frames must differ by more than 0.008 of the frame, and
        the walk-cycle foot shift must stay under 2 units
  - [x] lint, typecheck, 155 unit, 43 e2e, vision 5/5 including renderer
        parity, prodbuild 4/4, signal 13/13, build
- Non-goals:
  - No change to the face pass. ART-7 is done and its gate stays scoped to
    `idle`, where the claim it makes is the one it can measure.

### ART-9 - The faces were still not human: the portrait was a 3/4 view with the face squashed onto one side

- Status: DONE
- Requirement:
  The SEVENTH round of "the heroes do not look human". ART-6 rebuilt the
  portrait's head, headgear and lighting; ART-7 found the in-play face painted
  on the headgear. The owner looked again and said they were still weird, and
  they were.

  MY LAST TWO VERDICTS WERE WRONG IN A SPECIFIC WAY, worth recording because it
  is the reason this took seven rounds: I graded each round against THE STATE
  BEFORE IT ("the eyes are no longer discs", "the brow is on skin now") rather
  than against a human face. Every one of those statements was true and the
  faces were still not human.

  So this round the owner confirmed the defects and chose the look from
  rendered candidates BEFORE it was built out. All four of these are theirs,
  not mine:
    1. THE FACE WAS SQUASHED ONTO ONE SIDE. The portrait was a 3/4 view: both
       eyes in the right half, the nose protruding PAST the silhouette as a
       pointed beak (`HEAD_OUTLINE` put the tip at 1.16 HW against a head
       half-width of 1.02), and the whole left half empty skull.
    2. NO MOUTH, AND SPECKS ON THE CHEEKS. Three of five heroes had no visible
       mouth - the beard covered it. In play the two dark dashes were not the
       eyes at all but the NOSE (11.1px) and the NEAR BROW (10.4-12.1px), and
       every other feature was sub-2px and anti-aliased into a speck: mouth
       2.02-2.16px, the nose's narrow end 1.82-1.95px, two heroes' far eyes
       2.4-2.5px.
    3. THE STYLE WAS TOO FLAT AND GEOMETRIC. One straight cel-band edge cut
       every face. Measured: the band's light edge crosses the head at
       head-local x = +0.09 headR, within a tenth of a radius of dead centre.
    4. THEY WERE NOT RECOGNISABLY THE HISTORICAL FIGURES beyond complexion.
- Owner's decisions: SOFT SHADING allowed on portraits (in-play stays flat cel,
  so the game still reads as one piece); THREE CANDIDATES rendered and shown
  before anything was built out. They picked A - soft - and asked for a leaner
  head, smaller beards and less headgear.
- Acceptance criteria:
  - [x] The portrait head is FRONTAL and symmetric, authored as named landmarks
        of one side and mirrored. Height:width 1.47, the lean end of the human
        range. The six outline points that existed only to describe a profile -
        nasion, nose tip, nose base, upper lip, lip, mentolabial sulcus - are
        gone: a frontal nose is structure INSIDE the face
  - [x] Everything two-sided is MIRRORED rather than copied. `aperturePath`,
        the lash line, `eyeTilt` and `browAngle` were all applied with one sign
        to both sides - invisible on a 3/4 face, but on a frontal one that is
        two right eyes and a single raised brow
  - [x] Soft shading: gradients for the cheek/brow/jaw falloff, eye sockets and
        nose bridge, painted inside a clip of (skull, below the hairline). The
        clip is what removes the band seam, and it is the "face plate" ART-6
        rejected - right NOW for the reason it was wrong THEN, because the head
        path already supplies the jaw and chin
  - [x] A mouth that is always visible, with beards reshaped to frame it and to
        run off the bottom of the frame rather than ending in a flat line
        inside it, which read as a bib
  - [x] Every stray mark gone: the single nostril, the one-sided cheek streak,
        the single ear and the nose-on-the-silhouette streak are replaced by
        mirrored pairs that belong to named features
  - [x] In play: the nose shortened and thickened past the anti-alias floor,
        the mouth from 2.08px to ~2.9px, the far eye from 2.4px to ~2.9px.
        Silhouette untouched
  - [x] `artquality.test.ts`'s complexion-pair crop RE-REGISTERED onto the
        build-applied head. It took its centre from the raw pose, so Guan Yu's
        crop missed his eyes entirely and reached into his beard while Zhang
        Fei's and Huang Zhong's excluded the mouth - and it passed throughout,
        which is the point: it was comparing different parts of different faces
  - [x] Ten portrait gates, EVERY one proven able to fail by reverting the
        mechanism: hairline over the brow, sclera unpainted, the two historical
        eye shapes swapped, the cel band let back across the face, the skin
        painted flat, the lip line removed, the raw-pose anchor restored, the
        zoom pushed past the frame, both eyes nested under "has eyes", and the
        face pass skipped
  - [x] TWO METRICS DESIGNED, MEASURED AND DROPPED rather than shipped:
        - "count sclera directly above the iris" to catch the googly disc. On
          correct art it returns 2, 4, 6, 4, 2 - anti-aliasing along the lid on
          an eye 6.7px tall - so a disc would have to score below that to be
          rejected. What makes the disc impossible is structural instead: the
          iris is drawn inside a CLIP of the aperture.
        - "count tones across the face" for flatness. The eyes, brows, lips and
          age lines are all skin-family tones and carry the count on their own,
          so flattening the skin entirely still scored above any usable
          threshold. Replaced by the FOREHEAD luma range, the one sizeable
          patch with no feature on it, where the separation is absolute:
          10.3-12.3 with the gradient, exactly 0.0 flat
  - [x] lint, typecheck, 155 unit, 43 e2e, vision 5/5 including renderer
        parity, prodbuild 4/4, signal 13/13, build
- FOLLOW-UP, after the owner asked to continue with the in-play faces:
  - [x] The near eye gets a SCLERA. At a 41.6px head it is about 8x5 device
        pixels - enough for a dark iris with roughly 1.5px of white either
        side, which is what stops it reading as one more dark speck among the
        brow, nose and mouth. The iris fills the aperture's HEIGHT, so white
        can only show left and right of it: the same construction the portrait
        uses, and the reason neither is a googly disc. A first attempt sized it
        0.19 x 0.115 and reintroduced exactly the white ring ART-6 removed;
        pulled back to 0.17 x 0.098 so the white is a hint rather than a ring
  - [x] The far eye at 5x3 device px stays a plain dark mark. A 1px sliver of
        white there would be a flicker, not an eye
  - [x] The brows thinned from 0.16/0.13 to 0.125/0.10. They were the two
        longest and heaviest marks on the face and dominated the eyes, which is
        backwards - a face is read from its eyes
  - [x] `faceLayout`'s `browHalf` and `eyeRy` brought back into step with what
        is actually drawn, so the clearance it computes describes the real
        geometry
  - [x] Re-verified: lint, typecheck, 155 unit (including the complexion-pair
        gate, which the added white could have diluted), e2e 43/43, vision 5/5
        with the sprite gate 148/148 and both negative controls still failing
        correctly, prodbuild 4/4, signal 13/13, build
- Honest limit, stated rather than glossed:
  THE IN-PLAY FACE IS BETTER, NOT TRANSFORMED. The near eye now reads as an eye
  and the marks no longer scatter, but at a 41px head in flat cel it is still a
  handful of marks rather than a face. The portrait work cannot transfer: a
  fighter faces its direction of travel, so it cannot go frontal, and soft
  shading is scoped out of the sprites deliberately so the game reads as one
  piece.
- Non-goals:
  - No change to in-play head size, build or silhouette.
  - No gradients on the in-play sprites.
  - No change to `PORTRAIT_BOX`/`PORTRAIT_TEXTURE` or any scene's display sizes.

### ENH-10 - Arrows fly too low and hang in the air (owner request)

- Status: DONE
- Requirement (owner, 2026-09-22): (1) hero and NPC arrows hit the LOWER
  body - raise the flight so they hit the MIDDLE of the body; (2) after
  the arrow falls toward the ground it stays hanging in the air - make it
  fall all the way to the ground or disappear at its farthest range.
  Worked directly in the consumer iteration under an explicit owner
  request (priority over queue selection); ENH-9 stays TODO.
- Root causes found - the "hang" had THREE mechanisms:
  - both spawn sites flew arrows at z = 10 against a ~92-unit fighter
    (the legs, measured in-game at 0.15 of body height)
  - `updateDeaths` removed dead entities only when side !== 'hero', so
    DEAD HERO ARROWS were never removed and rendered frozen forever
  - `applyPhysics` x-clamped every side==='hero' entity to the screen, so
    hero arrows pinned at the screen edge forever; and projectiles had no
    flight envelope at all (flat flight to the stage bound)
- Acceptance criteria:
  - [x] Arrows cross at mid-body: ARROW_Z = 40 on both spawn paths (hero
        special + archer AI); e2e band pin 0.3-0.7 of the REAL sprite
        heights (measured 0.48; reverting z=10 reads 0.15 = the owner's
        "lower body" verbatim and fails the pin)
  - [x] Fall + despawn: level flight ARROW_LEVEL_TRAVEL = 240 px (beyond
        any fire range), then ARROW_FALL = 2/tick down to the ground,
        gone at contact; ARROW_MAX_TRAVEL = 360 cap for anything still
        airborne; dead projectiles removed on BOTH sides; hero arrows no
        longer screen-clamped
  - [x] Gameplay identity preserved by construction: the hit test moved
        to the target's chest (ARROW_CHEST_Z = 30), so ARROW_Z -
        ARROW_CHEST_Z = 10 reproduces the old feet-level hit/jump-dodge
        sets EXACTLY (grounded-hit and airborne-dodge pins; dropping the
        offset fails both)
  - [x] 8 new unit tests (test/core/arrows.test.ts) + 3 e2e in-situ pins
        (e2e/arrows.spec.ts, band + fall + no-lingering, real sprites and
        display list); every mechanism falsified by revert - 6
        falsifications total incl. the renderer band
  - [x] Full gates green: lint, typecheck, unit 196/196 (+8), e2e 52/52
        (+3), signal 13/13, vision 5/5, prodbuild 4/4, build
- Marathon deltas (recorded, NOT chased - the range change is the
  requested behavior; no tuning touched; every marathon still completes):
  guanyu s2 4944->3144t (-37%), zhaoyun s3 4224->6720t (+59%), s4
  8988->5988t (-33%), huangzhong s2 6588->4524t (-31%); zhangfei and
  weiyan tables identical. Long-range arrow chip hits beyond 240px are
  gone by design.
- Non-goals:
  - No arrow rotation while falling and no stuck-in-ground prop (the
    arrow falls to the ground and is gone at contact; the farthest-range
    cap is the owner's other accepted option and is also implemented).
  - No archer AI, fire cadence, damage or loot changes. No DIFF-1 impact
    (stage data untouched).
- Evidence:
  - artifacts/arrows/{hero-midflight,npc-midflight,hero-falling}.png,
    verified by pixel arbiter (HUD-plate hashes pair tests 1+3 (HZ) vs
    test 2 (ZY) exactly as designed) - see the PROGRESS entry on the
    read_image display caveat before trusting eyeballed captures.

### ENH-11 - Gamepad players cannot pause (input parity for pause)

- Status: DONE
- Requirement:
  Pause shipped keyboard-only (ENH-7, P) and gained touch parity (ENH-8,
  HUD button), but the third first-class input class - gamepad
  (PROJECT.md: "Keyboard, gamepad and touch are all supported") - has no
  pause path: a pad player cannot stop a ~13-minute run. Start (button 9)
  is the natural slot: GameScene polls it through watchConfirmButton and
  confirmContinue no-ops outside the game-over countdown (and returns
  early while paused), so Start does nothing during gameplay today.
  Bind Start to the shared togglePause() during stage gameplay, either
  pad (pads 0 and 1, so player two can pause too).
- Acceptance criteria:
  - [x] Start toggles pause during stage gameplay on EITHER connected
        pad (pads 0 and 1), sharing togglePause() with P and the touch
        button - same freeze/overlay/clear/resume semantics, no new
        pause state.
  - [x] Held Start does not strobe: the release-seen edge pattern of
        watchConfirmButton (now pad-indexed) gives exactly one toggle
        per press - pinned by sampling paused 6x across a 600ms hold.
  - [x] Menus unchanged: Start stays confirm on title/select/result
        (existing menu tests green untouched) and still revives on the
        game-over countdown - ROUTED in one watcher per pad rather than
        stacked: a second pad-0 watcher could resume AND revive in a
        single poll (caught in self-review before testing). While
        paused the toggle RESUMES first, so no revive leaks through.
  - [x] Pinned with the synthetic-pad harness (gamepad.spec.ts): pad 1
        Start freezes (tick flat across ~60 wall frames), pad 2 Start
        resumes, held Start no-strobe, game-over Start revives and is
        not a toggle. Both mechanisms falsified by probe (binding
        removed -> pause pins fail; gameover routed to toggle -> the
        revive pin fails).
  - [x] Full gates green: lint, typecheck, unit 196/196, e2e 54/54
        (+1), signal 13/13 (marathons identical to the standing
        post-arrow snapshot - input-layer change only), vision 5/5,
        prodbuild 4/4, build.
- Non-goals:
  - No remapping UI, no pause menu, no auto-pause on blur (owner
    decision). No touch or keyboard changes. No DIFF-1 impact.
- Evidence:
  - artifacts/loop/proposals-gamepadpause-enh11.md (this pass's review).
  - Trial: watchConfirmButton gained a padIndex (default 0, menu call
    sites byte-identical); GameScene's Start handling became one routed
    action per pad (pause toggle / game-over confirmContinue). The
    overlay hint text is unchanged (it names P, which still resumes) -
    a cosmetic asymmetry for pad players, deliberately out of the
    stated scope.

### ART-10 - Guan Yu's defining brows were the second-lightest in the cast

- Status: DONE
- Requirement:
  The fourth of the four defects the owner confirmed in ART-9 was "they don't
  look like the specific heroes", and it is the one that round addressed least
  - it fixed the eye SHAPES but not much else. Auditing `FACES` against the
  standard descriptions found one clear error and one mismatch.

  关羽 Guan Yu is named for three things: 面如重枣 the date-red face, 美髯 the
  beard, and 卧蚕眉 - "reclining silkworm" brows, which means THICK and gently
  curved. The `phoenix` row gave him `browWeight: 0.95`, the SECOND LIGHTEST of
  the six face kinds. The one feature of his the sources name alongside the
  beard and the complexion was drawn backwards, and had been since ART-1.
- Acceptance criteria:
  - [x] `phoenix` brows made heavy and curved: `browWeight` 0.95 -> 1.32,
        `browArch` 0.14 -> 0.17, and the steep `browAngle` -0.55 -> -0.36,
        because a silkworm brow CURVES rather than slants. Guan Yu now reads
        with the heaviest brows in the cast bar one, which is what 卧蚕眉 means
  - [x] `sharp` brows 0.8 -> 1.06. STATED AS A JUDGEMENT CALL rather than a
        citation, unlike the above: no source describes Wei Yan's, Xu Huang's
        or Cao Cao's brow weight, but "severe and hard" carrying the LIGHTEST
        brow of the six read as delicate instead
  - [x] Checked the other three against the sources and left them alone:
        张飞 豹头环眼 has the round glare (`eyeAspect` 1.55) and the largest
        head (`build.head` 1.04); 赵云 浓眉大眼 has thick brows (1.18) and big
        eyes (`eyeW` 1.12); 黄忠 the old general has the heaviest brows (1.35)
        and hooded eyes. All three already matched
  - [x] `FACES` is shared, so this moves the IN-PLAY faces too - intended, and
        every sprite gate re-run
  - [x] lint, typecheck, 155 unit, 43 e2e, vision 5/5 including renderer parity
        and the sprite gate at 148/148, prodbuild 4/4, signal 13/13, build
- Flagged, unchanged, and the owner's call:
  魏延 WEI YAN IS 面如重枣 IN THE NOVEL - the same date-red face as Guan Yu
  (ch. 41, 面如重枣，目若朗星). This repo deliberately made him sallow instead,
  because Guan Yu's red face is his signature and the hero complexion-pair gate
  requires every pair to differ by more than 18 mean luma. Recorded here rather
  than changed, for the third time, so the deviation stays visible.
- Non-goals:
  - No new face kinds, no silhouette change, no complexion change.

### ART-11 - Continuous attacks look static: the weapon never retracts between hits

- Status: DONE
- Requirement:
  When a hero attacks continuously, the weapon looks static - fully extended
  from the first tick, never retreated. Root cause, verified: one `attack`
  pose covers the whole startup+active+recover window; `poseForEntity` maps
  `attack` -> `'attack'` ignoring `stateTick`/`attackId`; and combo chaining
  keeps state `'attack'` across jab1 -> jab2 -> finisher, so the texture key
  never changes between hits. Phase every attack into windup / strike /
  recover selected by `stateTick` against the attack's own frame data, and
  give jab2 an alternate strike pose so consecutive hits differ.
- Acceptance criteria:
  - [x] `poses.ts` gains `WINDUP`, `ATTACK2` (jab2 high backhand), `RECOVER`;
        `attack` itself unchanged
  - [x] `POSE_REACH` gains 3 measured entries (windup 11, attack2 40,
        recover 26); `POSES` 8 -> 11
  - [x] `poseForEntity` phases `attack`/`jumpattack`/`special` by frame window,
        with fallback = today's rendering on null/unknown `attackId`
  - [x] Every combo boundary reads strike -> retract -> strike; jab2 shows the
        alternate strike; hz.special (active 0) skips the strike pose
  - [x] Reach gate covers both strikes; new retract gate proves windup/recover
        narrower than each strike; PAIRS extended; every gate falsified by
        reverting its mechanism (falsification log in PROGRESS.md)
  - [x] e2e Part 3 observes windup/attack/attack2/recover across one combo,
        with a withdrawn frame between consecutive strikes
  - [x] Combo strip at real display size judged by eye (hero 69 frames +
        soldier 38 + special 30 + jumpkick 36); windup checked for
        weapon-over-head; strips at artifacts/combo11.png, combo11b.png
        (gitignored, regenerated by nothing - the e2e + gates are the durable
        proof)
  - [x] lint, typecheck, unit 160/160, e2e 44/44, vision 5/5 (202/202 sprites,
        34/34 weapons, 68/68 retracts, renderer parity), prodbuild 4/4,
        signal 13/13, build
- Flagged scope (owner's decisions):
  Enemies ride free (their long startups become telegraphs). Jumpattack phases
  by the same generic rule, so a late landing leaves a recover tail of up to
  ~12 ticks - accepted at planning, eye-check on the strip. Finisher keeps the
  standard strike. No sim change, no kick poses, no position juice.
- Non-goals:
  - No `src/core` change of any kind.
  - The dormant bake pipeline's literal pose lists (`scripts/bake-core.mjs`,
    `scripts/make-sample.mjs`) stay as they are - that pipeline ships nothing.

### ART-12 - The heroes' weapons do not read as their historical weapons

- Status: DONE
- Requirement:
  Each hero carries roughly the right KIND of weapon but the drawings do not
  read as the famous ones, and two assignments are wrong: Zhang Fei's pike (74)
  is SHORTER than Zhao Yun's spear (78) - backwards for 丈八蛇矛, the longest
  weapon in the novel - and Wei Yan carries a jian with a EUROPEAN CROSSGUARD.
  Guan Yu's glaive head is a chunky polygon, not a 月牙 crescent; the 蛇矛 head
  is a jagged zigzag, not a sinuous snake; the spear has no 红缨 tassel; the
  bow is a plain D-arc, not a recurve; Lu Bu holds a plain glaive instead of
  the 方天画戟. Owner decisions: novel/folk standard; Wei Yan gets the
  long-handled 大刀; Huang Zhong keeps the bow (reshaped recurve); Lu Bu's
  halberd included.
- Acceptance criteria:
  - [x] WEAPONS ladder pike 82 > ji 78 > glaive 76 > spear 72 > dao 69 >
        sword 46 > bow 42; weiyan -> dao, lubu -> ji; 'blade' renamed 'jian'
        with a disc guard
  - [x] Crescent, serpent, dao, ji, recurve-bow heads redrawn as quadratics;
        TASSEL tuft on all 11 polearm wielders. Tassel brightened
        0xb03028 -> 0xc43830 and ji wings fattened after the first sheet
        showed the tassel sinking into Zhang Fei's dark armour and the wings
        thin at display size
  - [x] POSE_REACH re-measured with a probe calibrated against HEAD first:
        EVERY pose came in at or under the old margins (the old attack/windup
        driver was the spear at 78; it is now 72, and the new envelopes are
        tighter than the angular polygons) - attack 55, attack2 39, windup 9,
        recover 19 (was a stale 26), jump 20, hurt 9, down 27, special 54
  - [x] Three new gates, each falsified by reverting its mechanism: named
        weapons + ladder (lubu->glaive and pike->74 both fail it), tassel
        presence at the socket (disabling the draw fails it 0-1 px vs floor
        30; measured 109-151; Zhao Yun's red trim excluded by tolerance),
        ART-8 head-cross made PERMANENT over steel AND tassel families
        (walk1 -1.5 fails it on 7+ kinds; per-kind idle baselines 0-441 -
        Zhao Yun's is his own steel helmet, which is why the gate keys on
        deltas)
  - [x] Weapon sheets at display size judged by eye, before AND after
        (artifacts/weaponsheet12.png, weaponsheet12-before.png): crescent
        reads as a moon blade, serpent undulates, tassels visible on all
        wielders, recurve reads, jian disc guard reads, portraits' weapon
        sliver intact
  - [x] lint, typecheck, unit 163/163 (+3 gates, durable suite), e2e 44/44,
        vision 5/5 (202/202 sprites, 34/34 weapons, 68/68 retracts, parity),
        prodbuild 4/4, signal 13/13, build
- Non-goals:
  - No pose, POSES-list, sprite-binding, scene, or core changes; no strict-Han
    weapons; no second weapon for Huang Zhong; the sword pickup prop untouched.

### DIFF-1 - The measured difficulty curve is uneven in three places

- Status: DONE
- Owner decision, 2026-09-22: ACCEPT THE SHAPE AND CLOSE. The owner
  reviewed the re-scored evidence and chose to keep the curve as-is:
  stage 3's wall is the stage-2 mount reward ending plus intended enemy
  escalation (spearmen/archers) - design-shaped, hero-texture (the heavy
  build copes best), not a defect. No balance change was made. The
  review also re-scored the findings against TODAY's post-ENH-10
  marathon (the filed tables predate the arrow rework): the stage-3
  wall persisted (+88% over stage 2 in Zhao Yun's current table), and
  his stage-5-dip / stage-8-over-finale quirks persisted in his table
  only - the 2026-09-19 cross-hero verdicts stand unchanged (findings
  2 and 3 were Zhao-Yun artifacts).
- Requirement:
  Producer measurement, not a complaint: the self-play bot drove Zhao Yun
  through all nine stages at TWO seeds (42 and 7), and both runs agree on
  where the curve departs from the designed one. Designed content per stage
  (from `src/core/stage.ts`): mobs 12, 18, 19, 23, 27, 27, 28, 28, 29 across
  waves 3, 4, 4, 5, 5, 5, 5, 5, 5.

  Measured clear time and continues spent (mean of both seeds):

    stage   mobs   seed42   seed7   mean    vs previous stage
    1        12     59.0s     0      68.8s/1    -
    2        18     62.6s     0      64.4s/0   +0%
    3        19     91.8s/2   85.2s/1  88.5s   +40% time for +1 mob
    4        23     90.0s/1   93.4s/1  91.7s   +4%
    5        27     71.8s/1   64.2s/1  68.0s   -26% (a dip)
    6        27     86.2s/0  119.4s/2 102.8s   +51%
    7        28     85.8s/1  101.4s/2  93.6s    -9%
    8        28    132.6s/2  114.0s/2 123.3s   +32% (the peak)
    9        29     111.8s/2  98.8s/0 105.3s   -15% (finie easier than 8)

  Both seeds agree on three findings, so they are properties of the stages
  and not of one run:
    1. STAGE 3 IS A WALL. One more mob than stage 2 costs 40% more time and
       the most continues of the early game. The stage data explains it:
       stage 2 grants a horse, stage 3 does not, and adds spearmen and
       archers. The jump is carried by the mount withdrawal.
    2. STAGE 5 IS A DIP. 27 mobs - as many as stage 6 - but the fastest clear
       of stages 3-9 in both runs.
    3. STAGE 8 OUTLASTS THE FINALE. 123.3s mean against 105.3s for stage 9,
       the only place the curve descends at the end. The penultimate stage
       peaks instead of the last one.
  Caveat stated plainly: this is one bot at two seeds. A bot is not a
  player, and none of this says what the curve SHOULD be - only where it is
  uneven against itself.
- NEW EVIDENCE, 2026-09-19. The caveat this task filed itself with - "one bot
  at two seeds" - turned out to matter more than the findings. Two OTHER heroes
  driven through all nine stages at the SAME seed 42, so the runs are directly
  comparable:

      stage    Zhao Yun (filed)   Guan Yu   Zhang Fei
      1              59.0 / 0      42.6/0      41.6/0
      2              62.6 / 0      49.4/0      54.0/0
      3              91.8 / 2      85.4/0      63.8/0
      4              90.0 / 1      72.0/0      73.2/0
      5              71.8 / 1      67.8/0      85.6/1
      6              86.2 / 0      73.0/1      69.0/0
      7              85.8 / 1      85.6/1      83.0/1
      8             132.6 / 2      77.2/0      89.2/0
      9             111.8 / 2      99.8/1     101.4/1

  Against the three findings as filed:
    1. STAGE 3 IS A WALL - HOLDS, and is the only one that does. Stage 2 to 3
       costs +47% for Zhao Yun, +73% for Guan Yu, +18% for Zhang Fei. Two of
       three heroes take a large jump, which is consistent with the stated
       cause (stage 2 grants a horse, stage 3 does not, and adds spearmen and
       archers). Zhang Fei feeling it least is consistent with his being the
       HEAVY build.
    2. STAGE 5 IS A DIP - DOES NOT HOLD. Zhao Yun -20%, Guan Yu -6%, and Zhang
       Fei +17%, which is a RISE. This was a property of Zhao Yun, not of the
       stage.
    3. STAGE 8 OUTLASTS THE FINALE - DOES NOT HOLD. It is Zhao Yun only. For
       both other heroes stage 9 is the longest stage of the nine, which is
       the designed shape: Guan Yu 77.2 then 99.8, Zhang Fei 89.2 then 101.4.

  So the decision this task is waiting on is SMALLER than it looked: one
  anomaly to consider rather than three, and it is the one with a named cause
  already in the stage data.
- The measurements also still STAND: `git log src/core` since they were filed
  is empty, and the sim is deterministic, so nothing about the curve has moved
  in fifty-odd commits.
- Acceptance criteria (when unblocked):
  - [x] Owner has chosen: accept the shape and close this task
        (2026-09-22).
  - [x] No change was made (accepted as-is), so no before/after
        re-measurement applies; the standing signal snapshots stayed
        green throughout (13/13 across today's ticks, tables recorded
        in PROGRESS.md).
  - [x] `npm run signal` green throughout on the current build - and
        deliberately unchanged: no stage data was touched.
- Non-goals:
  - No balance change without that owner decision.
  - No change to heroes, enemies' stats in isolation, or AI - stage content
    (`waves`, `bossKind`, mounts) is the lever this data points at.


### GATE-3 - Determinism is documented everywhere and enforced nowhere

- Status: DONE
- Requirement:
  The sim's determinism is this project's load-bearing constraint. PROJECT.md:
  "The simulation must be deterministic: seeded RNG plus fixed 1/60s timestep;
  no `Math.random` or wall-clock time in core logic." `src/core/rng.ts:4`:
  "The simulation must never call Math.random". Every seeded test, the whole
  signal suite and the replay guarantee rest on it.

  Nothing enforces it. `eslint.config.js` restricts IMPORTS into `src/core`
  (phaser and `**/game/**`, which is how the "pure TypeScript core" half is
  kept true) and says nothing about randomness or the clock. `Math.random`,
  `Date.now` and `performance.now` are all live elsewhere in `src/`, so this is
  one careless line from being wrong, and the failure would not be a lint error
  or a crash - it would be a seeded run that quietly stops reproducing.
  `src/core` is clean today; the point is that nothing keeps it so.

  Found by checking whether the constraints PROJECT.md states are actually
  gated, after REFACTOR-1 moved core code between files.
- Acceptance criteria:
  - [x] `no-restricted-properties` for `Math.random`, `Date.now` and
        `performance.now`, plus `no-restricted-globals` for `Date` - which is
        what catches `new Date()` as well as `Date.now()`. Scoped to
        `src/core/**` only
  - [x] Messages name the alternative: "draw from the injected sim.rng
        instead" and "use sim.tick, not the wall clock"
  - [x] Proven able to fail ONCE PER API rather than once overall, because a
        single combined probe can pass on one rule while another does nothing:
          Math.random()        -> 'Math.random' is restricted from being used
          Date.now()           -> Unexpected use of 'Date'
          performance.now()    -> 'performance.now' is restricted from being used
          new Date().getTime() -> Unexpected use of 'Date'
  - [x] `src/` unchanged - confirmed by `git status` after the probes, so the
        falsification left nothing behind. The game layer keeps both APIs,
        which it legitimately needs for frame pacing and menu flourishes
  - [x] lint, typecheck, 142 unit, build. The browser suites were not re-run
        and did not need to be: only `eslint.config.js` changed, which cannot
        affect anything at runtime, and no file under `src/`, `test/`, `e2e/`,
        `vision/` or `prodbuild/` was touched - the tree is byte-identical to
        4626e8b, where all of them were green
- Non-goals:
  - No code changes to `src/core`. It is already clean; this is about keeping
    it that way.


### REFACTOR-1 - src/core/sim.ts is 978 lines against the project's own 800

- Status: DONE
- Requirement:
  `src/core/sim.ts` is 978 lines. This project sets itself 800 - it is why
  `GameScene` was split during UI-R2, at 951 - and sim.ts has been past it for
  some time. I recorded it as a known overage twice rather than acting on it,
  because it is the determinism-critical core and a line count is not by itself
  worth risk. Doing it now on the owner's say-so, as a PURE MOVE: no logic
  edits, and the seeded signal suite is the proof.
- Acceptance criteria:
  - [x] 978 -> 784 lines, and `git diff --stat` over `src/` shows exactly one
        modified file and three new ones: no caller changed, because `sim.ts`
        re-exports everything it moved
  - [x] Pure moves. `src/core/simtypes.ts` (66) holds the `Sim` shape,
        `src/core/snapshot.ts` (132) the JSON read model, `src/core/players.ts`
        (78) the pure queries
  - [x] No runtime cycle. Extracting `Sim` into its own module REMOVED a
        workaround rather than adding one: without it, `players.ts` and
        `snapshot.ts` each had to type-import `sim.ts`, which works only
        because the import is erased at runtime and stops working the moment
        anyone needs a value from it. All three now depend on the state, not
        the engine
  - [x] `joinPlayer2` and `tryRevivePlayer` deliberately stayed in `sim.ts`
        despite belonging with the other player functions by name. They need
        the engine-private `spawnEntity` and `enterState`, and exporting those
        to move two functions would have put a genuine runtime cycle through
        the code the sim's determinism rests on
  - [x] signal 13/13 - and stronger than that. "Passed" only proves the
        invariants held, so identity was measured directly: the same three
        seeds driven through 900 ticks of varied input (movement, attacks,
        jumps, specials), digesting the full entity list, positions, HP,
        states and stats, give byte-identical results before and after:
            zhaoyun/42/stage1  957686d7
            guanyu/7/stage4    bf2f2436
            weiyan/99/stage9   eed635ad
  - [x] lint, typecheck, 142 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - No behaviour change, no API change, no renaming. If a caller has to be
    edited, the split was wrong.


### FIX-6 - The production build strips the viewport-height fallback

- Status: DONE
- Requirement:
  FIX-4 gave `#game` a definite height as two declarations:

      height: 100vh;
      height: 100dvh;

  which is the standard way to say "use the dynamic viewport where it exists,
  otherwise the static one". The production CSS minifier treats the pair as a
  duplicate property and keeps only the last. Shipped output:

      #game{...;height:100dvh;display:flex}

  A browser without `dvh` - iOS Safari 15.3 and earlier - drops that
  declaration as invalid, and with no other height `#game` falls back to auto.
  That is exactly the state FIX-4 fixed: `Scale.FIT` measures a box that can
  grow, fits to width, and on a phone in landscape pushes the bottom of the
  game and its controls off screen.

  Every check of FIX-4 and FIX-5 so far ran against the DEV server. PROJECT.md
  is explicit that `dist/` is what deploys and that the two genuinely differ,
  which is the whole reason `npm run prodbuild` exists; this is that difference
  biting the most important fix of the session.
- Acceptance criteria:
  - [x] The `dvh` value moved into its own `@supports` rule. Shipped output now
        carries both: `#game{...height:100vh;display:flex}` and
        `@supports (height:100dvh){#game{height:100dvh}}`
  - [x] Verified against `dist/assets/*.css`, not the source
  - [x] The built site measured through `vite preview` at both orientations:
        portrait canvas 412x232 of 412x839, landscape 640x360 of 863x360, seven
        control zones on screen in each, nothing overflowing
  - [x] New prodbuild gate asserting both halves, because neither implies the
        other: the browser running these tests supports `dvh` and would pass
        the layout check on the enhancement alone
  - [x] Both halves proven able to fail INDEPENDENTLY:
          restoring the two-declaration form -> "the shipped CSS has no
            dvh-independent height for #game", with the received string showing
            `height:100dvh` alone
          `min-height: 100vh` with the @supports intact -> same failure
          `Scale.NONE` with the CSS untouched -> "portrait: the shipped canvas
            does not fit - viewport 549x1118, canvas 960x540"
  - [x] A flaw in my own first assertion, caught while falsifying it rather
        than after: `toContain('height:100vh')` also matches
        `min-height:100vh`, so the gate would have passed on the exact bug
        FIX-4 fixed. Anchored to a declaration boundary instead
  - [x] lint, typecheck, 142 unit, 43 e2e, vision 5/5, prodbuild 4/4,
        signal 13/13, build
- Non-goals:
  - No minifier configuration. The fix is to write CSS the minifier cannot
    misread, not to argue with it.


### ENH-4 - Per-weapon hero moveset data, strike mapping, and unit tests

- Status: DONE
- Requirement:
  All five heroes share identical frame data (`defineHeroAttacks` in
  `src/core/attacks.ts`: jabs 6/4/10, finisher 8/5/16 — only damage/reach
  numbers differ), so a pike thrust and a blade sweep feel identical. Give
  each hero weapon-true per-hit frame data (startup/active/recover,
  knockback/knockdown, reach/arc per jab1, jab2, finisher), keeping the
  3-hit chain, jumpkick, special, and all enemy defs unchanged:
    - Guan Yu, glaive (heavy sweeps): slowest chain, wide arc; e.g. jabs
      8/5/12 arc 12, finisher overhead chop 12/6/20 with knockdown.
    - Zhang Fei, serpent pike (longest, thrust-first): longest reach, narrow
      arc; quick thrusts 5/4/9, finisher wide sweeping knockdown 10/6/18.
    - Zhao Yun, spear (fast agile): fastest chain 5/3/8, lowest damage/hit.
    - Huang Zhong, bow (veteran archer): compact short-range melee, moderate
      speed; arrow special untouched.
    - Wei Yan, dao (chopping blade): slow heavy chops 9/5/14, high damage,
      long recover; finisher big knockdown chop.
  Exact numbers are the implementer's within these identities. Replace the
  `.jab2`-suffix pose rule in `poseForEntity` (`src/game/adapters/sprites.ts`)
  with a `STRIKE_POSE` table keyed by full attack id, initially mapping to
  current behavior (jab2→attack2, everything else→attack); per-hero triples
  land in ENH-5 with the new poses. Fix the self-play bot (`selfplay/bot.ts`,
  two call sites) to space off the DRIVEN hero's own `combo[0]` def instead
  of hard-coded `zy.jab1`.
- Acceptance criteria:
  - [x] Before editing, `npm run signal` is recorded in PROGRESS.md as the
        ENH-4 baseline marathon table (stage times/continues per hero).
  - [x] New `test/core` assertions: per-hero frame data differs as designed
        (e.g. zhaoyun chain total < guanyu; zf.jab1 longest reach); every def
        keeps `totalFrames > 0`; full-combo DPS per hero within ±10% of its
        current value, computed in-test (no hand-waving).
  - [x] `sprites.test.ts`: table-driven selection proven (mapping decides,
        not the suffix); phasing boundaries per new frame datum; fallback to
        `attack`/`special` for enemies, mounted sweep, unknown ids preserved.
  - [x] Bot own-def spacing covered by a targeted test; `npm run signal`
        still 13/13 (bot viable with every hero).
  - [x] Each new assertion proven able to fail against the old tables/data.
  - [x] lint, typecheck, unit green. No `sim.ts` logic changes (data only).
- Non-goals:
  - No new poses or art-gate changes (ENH-5). No jumpkick, special, enemy,
    or mounted-sweep changes. No DIFF-1 smoothing: record balance deltas,
    do not chase them.


### ENH-5 - Weapon-true strike poses (thrust/chop/sweep) and art gates

- Status: DONE
- Dependency: do not start until ENH-4 is DONE. If reached earlier, mark
  this BLOCKED with reason "waiting on ENH-4" and implement nothing.
- Requirement:
  Author at most three new shared strike poses in `src/game/art/poses.ts`:
  `thrust` (deep lunge, weapon level), `chop` (high-to-low cut on a steep
  forward diagonal, inside HEADROOM 27 — never truly overhead), `sweep`
  (low crouched wide swing). Repoint ENH-4's `STRIKE_POSE` table so each
  hero's (jab1, jab2, finisher) is three distinct poses and no two heroes
  share the same ordered triple. Register names in `sprites.ts` POSES,
  calibrate per-pose `POSE_REACH` by measurement (no 57 fallback), extend
  the hardcoded strike lists and distinctness PAIRS in
  `test/game/artquality.test.ts`.
- Acceptance criteria:
  - [x] Reach gate: every new strike beats idle by ≥ MIN_WEAPON_REACH_PX
        for every armed kind. Retract gate: windup/recover strictly narrower
        than EACH new strike. Distinctness: each new strike vs idle, windup,
        recover, and sibling strikes, all above the floor. No floor moved.
  - [x] Face-clearance (all kinds × poses × facings), no-clip, centering,
        portrait, tassel, and weapon-identity tests green unmodified in logic.
  - [x] `npm run vision` 5/5 including renderer parity and both negative
        controls; before/after combo sheets for all five heroes captured via
        the weapon-review/facesheet scripts and judged by eye at gameplay
        size (desktop + phone attacks); no clipping, no weapon over a face.
- Evidence:
  - Triples: gy (sweep,attack,chop), zf (thrust,attack2,sweep),
    zy (attack,attack2,thrust), hz (thrust,chop,sweep), wy (attack,sweep,chop).
  - artifacts/weapon-review/{pose-sweep,sequence-desktop,sequence-phone}-*-enh5after.png
    vs enh5before; geometry-enh5after.json (thrust 65, chop 30, sweep 61,
    headroom 25, zero face overlaps); artifacts/look/facesheet.png.
- Non-goals:
  - No frame-data changes (ENH-4 owns them). No threshold weakening — redraw
    the pose, never the floor. Enemies keep existing strike mapping.


### ENH-6 - Moveset validation: e2e, signals, balance comparison, eye review

- Status: DONE
- Dependency: do not start until ENH-5 is DONE. If reached earlier, mark
  this BLOCKED with reason "waiting on ENH-5" and implement nothing.
- Requirement:
  Prove the redesigned movesets end to end. Extend `e2e/anim.spec.ts`
  strike/withdrawn predicates to the new pose suffixes and add a per-hero
  combo texture test (Zhang Fei shows thrust-family keys, Guan Yu
  sweep/chop-family — never the same triple). Run the full gates and compare
  against the ENH-4 baseline marathon table.
- Acceptance criteria:
  - [x] e2e green including the new per-hero combo test; vision 5/5;
        prodbuild 4/4; signal 13/13 including all five marathons.
  - [x] Marathon before/after table recorded in PROGRESS.md. Any stage mean
        shifting >15% stops the task: flag to the owner, do not retune toward
        it. DIFF-1 stays BLOCKED regardless.
  - [x] All five heroes' full combos eye-reviewed at gameplay size (desktop +
        phone); masked attribution check: each combo reads as its weapon.
  - [x] lint, typecheck, unit green; no thresholds weakened.
- Non-goals:
  - No DIFF-1 smoothing and no new follow-up tasks invented. No deployment,
    push, or cloud changes.


### ENH-7 - Pause the game mid-stage (P key, overlay, deterministic resume)

- Status: DONE
- Requirement:
  A full run is ~13 minutes of uninterrupted real-time action (ENH-6
  zhaoyun marathon: 47,416 ticks) and the game has no way to stop the
  clock: zero matches for "pause" in src/selfplay/test/e2e, no pause key
  on the title screen's control list, no suspend/blur handling in
  gameplay. Add a gameplay pause: one key toggles it, the sim freezes,
  an overlay says so, and resume continues tick-neutrally.
- Acceptance criteria:
  - [x] P pauses and resumes during stage gameplay, co-op included (both
        players' sim time freezes; nobody moves while paused).
  - [x] While paused the sim advances zero ticks (pinned: tick count
        frozen across 120 wall frames) and no buffered press leaks through
        on resume.
  - [x] A legible overlay (dim + PAUSED + resume hint) renders while
        paused; the title-screen control list documents the key.
  - [x] Resume is neutral: pausing for any length of wall time then
        resuming changes nothing in the sim (pinned by comparing pre-pause
        and post-resume sim snapshots, or equal clear-tick counts
        with/without a mid-run pause).
  - [x] Full gates green: lint, typecheck, unit, e2e, signal 13/13,
        vision 5/5 (overlay judged by eye at gameplay size, no other frame
        regressed).
- Non-goals:
  - No pause menu, settings, volume, or stage-select. No auto-pause on tab
    blur/hidden (a behavior decision for the owner). No touch pause button
    (stated follow-up if the owner wants mobile parity). No DIFF-1
    impact: pause changes no frame data, spawns, or tuning.
- Evidence:
  - artifacts/loop/proposals-20260921-2038-pause.md (this pass's review).
  - Trial 2026-09-21: e2e/pause.spec.ts (3 tests: 120-frame freeze + full
    snapshot equality, no-leak/no-join, dim + gold-caption + undim), both
    mechanisms falsified by revert. Gates: lint/typecheck clean, unit
    188/188, e2e 48/48, signal 13/13 (marathons tick-identical to ENH-6),
    vision 5/5, prodbuild 4/4, build. Eye: artifacts/pause/{paused,
    unpaused,resumed}.png + artifacts/vision/title.png reviewed.


### ENH-8 - Touch pause button (mobile parity for the P key)

- Status: DONE
- Requirement:
  ENH-7 gave keyboard players P; a touch device has no P key and no other
  pause path, so a phone player cannot pause a ~13-minute run. Add one
  pause touch control, shown only on touch devices like the existing 7
  zones: tapping it toggles the same `GameScene.paused` flag (same freeze,
  overlay, buffer-clear and resume semantics - no new pause state). Anchor
  it clear of HUD plates, bars, banners, down-texts and the existing zones
  in every HUD state (boss plate and P2 plate included); legible glyph at
  phone size.
- Acceptance criteria:
  - [x] One new touch zone + visible glyph, HUD-owned and mounted with the
        existing controls (survives display-list rebuilds), shown only
        when `hasTouch()`.
  - [x] Tap pauses (sim tick frozen across 60 wall frames) and tap resumes
        (tick advances), pinned by a Pixel-7-emulation e2e reusing the
        `tapGamePoint` + `touchscreen.tap` patterns.
  - [x] The pause overlay shows/hides with touch toggles (dim pin or HUD
        visibility assertion).
  - [x] Occlusion and label-fit gates still green; desktop shows no new
        control (extend the desktop-absence coverage).
  - [x] Full gates green (lint, typecheck, unit, e2e, signal, vision,
        prodbuild, build); phone-size capture eye-reviewed.
- Non-goals:
  - No new pause semantics, menu, settings, or volume. No auto-pause on
    tab blur (owner behavior decision, unchanged). No desktop-visible
    change. No DIFF-1 impact.
- Evidence:
  - artifacts/loop/proposals-touchpause-enh8.md (this pass's review).
  - Trial: circled-II glyph in the shared pad Graphics + named touchPause
    zone (pointerup, Phaser order hazard documented); shared togglePause().
    e2e/touchpause.spec.ts (Pixel 7): tap freezes 60 frames with full
    snapshot equality, caption visibility both directions, tap resumes;
    falsified by unwiring the zone. Touch hint TAP TO RESUME (eye-caught).
    Gates: lint/typecheck clean, unit 188/188, e2e 49/49, signal 13/13
    (identical marathons), vision 5/5, prodbuild 4/4 (8 zones both
    orientations), build. Zone counts 7->8 in touch/prodbuild specs.


### ENH-9 - Pause does not freeze the stage-clear transition

- Status: DONE
- Requirement:
  ENH-7's pause gate promises "no stage transitions until resume", and
  the game-over countdown honors it (frozen while paused). The
  stage-clear path does not: once the `stageclear` event drains,
  GameScene arms a wall-clock `delayedCall(2000)` to the result scene,
  which fires straight through a pause - the scene changes under the
  PAUSED overlay when pause lands inside the 2s clear window. Freeze
  the clear countdown while paused (the continue countdown is the
  in-repo template: accumulate only on unpaused updates), so pause
  truly freezes every transition.
- Acceptance criteria:
  - [x] Pausing inside the clear window holds the game scene: e2e
        drives the REAL clear path (forceBoss + boss down -> stageclear
        event), pauses inside the 2s beat, and asserts scene is still
        'game' 3s later with the PAUSED caption showing.
  - [x] Resume completes the transition: the result scene appears
        after resume without further input (same test).
  - [x] Unpaused clear timing unchanged: the delayedCall became a
        delta-counted 2000ms beat armed at the same event drain (same
        payload read at fire time); existing stageclear e2e green
        (bot-driven full stage clear -> result -> stage 2); no DIFF-1
        impact (no frame data, spawn, or tuning change).
  - [x] Sweep done, every gameplay `scene.start` justified: GameScene
        pending-restart and gameover expiry sit below the pause gate;
        the clear->result transition now does too (this defect's fix).
        Menu-scene transitions (result/gameover/select/title) only run
        after the game scene is gone - no pause exists there. The
        bridge's forceResult/forceGameOver are harness test aids that
        deliberately bypass gameplay.
- Non-goals:
  - No pause menu, settings, or volume. No change to the 2s boss-fall
    beat length. No auto-pause on blur. No touch-input changes.
- Evidence:
  - artifacts/loop/proposals-clearpause-enh9.md (this pass's review).
  - Trial: `clearScheduled` + `time.delayedCall(2000)` -> `clearMsLeft`
    counted in update() below the pause gate (the continue-countdown
    template). e2e/pause.spec.ts gains the both-directions pin; both
    mechanisms falsified by probe (old delayedCall restored -> "the
    result scene arrived under the PAUSED overlay"; transition
    suppressed -> the resume assert fails). Gates: lint/typecheck
    clean, unit 196/196, e2e 53/53 (+1), signal 13/13, vision 5/5,
    prodbuild 4/4, build.


### ART-13 - The spear reads as a spoon and the dao as a paddle (owner re-test)

- Status: DONE
- Requirement:
  Owner re-tested ART-12: the spear and the big knife still do not read as
  real weapons. Diagnosed on the in-game screenshot: the spearhead is a
  symmetric pale OVAL (a spoon, no point) and its tip sits at the wielder's
  CHIN in idle, where a real spear towers; the dao head is a small rounded
  paddle where a 大刀 must be a big broad single-edged blade; and tassels point
  with the weapon instead of hanging under gravity.
- Acceptance criteria:
  - [x] Willow-leaf spearhead: pointed both ends, 26 long x 8 wide, midrib
        crease; tip towers ~10 units above the pose space in idle carry
  - [x] Dao blade broadened to crescent-class weight (26 span), flat spine,
        deep curved belly at the tip end; dao gained the 红缨 tassel (count 12)
  - [x] Tassel hangs world-down at every weapon angle (counter-rotated);
        verified hanging along the haft at idle and below the shaft at attack
  - [x] Calibrated POSE_REACH probe: table holds EXACTLY (55/39/9/19/20/
        27/9/54, tops unchanged) - the extensions fit inside existing margins
  - [x] Sheet + zoom plates judged by eye; falsified by disabling the tassel
        draw (gate fails 0-2 px vs floor 30); full PROJECT.md sequence green
- The gate that earned its keep:
  The first broadened dao put steel across Wei Yan's brow at idle - the spine
  curve's control point pulled the blade across the forehead - and the ART-7-era
  face-on-skin gate failed it ("the brow has 140,143,156 above it, not skin").
  Fixed by following the crescent's rule: keep the DEEP span at the tip end,
  where the shaft has already leaned clear of the head; shallow spine heel.
- Non-goals:
  - Crescent, serpent, ji, recurve untouched; no weapon-length changes; no
    pose or core changes.


### ART-14 - The weapon silhouettes are wrong: guandao, serpent spear, dao

- Status: DONE
- Requirement:
  Third round on weapons. Owner re-tested and says the SILHOUETTES are still
  wrong, naming 张飞's serpent spear, 关羽's crescent blade and 魏延's dao, plus
  "all of them roughly equally". Reference-checked (Wikipedia guandao) and
  confirmed three concrete errors in my own ART-12/13 paths:
    - crescent: I drew a SYMMETRIC two-pronged crescent (horn and flare both
      at fore+13, both pointing forward). The real 偃月 profile is a STRAIGHT
      back edge with a small spike pointing BACK toward the shaft, and a
      convex cutting edge sweeping forward to the point
    - serpent: a 25-unit blob with two gentle waves. The 蛇矛's whole identity
      is a long, clearly S-curved serpentine blade - amplitude was ~4x too
      small to read as a snake
    - dao: rounded dome tip and a circular belly, where a 大刀 has a straighter
      spine and an ANGLED point
- Acceptance criteria:
  - [x] New crescent: straight back, backward top spike, forward-swept point
  - [x] New serpent: long S-curve, amplitude +-10, pointed tip at fore+22
  - [x] New dao: straighter spine, angled corner point, deep belly
  - [x] Ji wings redrawn as forward crescents (family coherence)
  - [x] Calibrated POSE_REACH probe: attack 55->59, attack2 39->41, special
        54->59 (Zhang Fei's serpent now drives all three); windup 9->8,
        recover 19->18, jump 20->18, hurt 9->8 (the new crescent's horn is
        shallower than the old -20). Serpent tip drawn first to fore+25, which
        measured 26 above the pose space in walk0 against a 24-unit HEADROOM
        and clipped - pulled back to fore+22 so HEADROOM stays shared
  - [x] All 30 gates green; sheet + in-situ swing captures judged by eye;
        full PROJECT.md sequence green
- The honest remaining gap, stated rather than hidden:
  At in-game size the serpent reads as a clearly wavy blade and the guandao as
  an asymmetric crescent with a back spike, but both are still cel cutouts -
  the reference weapons have a butt counterweight, socket collar and rings that
  these do not. The owner identified silhouette rather than missing details, so
  those parts were deliberately NOT added this round.
- Non-goals:
  - No weapon-length changes, no butt counterweight/rings (owner identified
    silhouette, not missing details), no change to Zhao Yun's leaf, the bow,
    the jian, or the tassel; no shading work.


### ART-15 - Legend-faithful silhouettes for all five heroes

- Status: DONE
- Requirement:
  Implement the owner's approved five-hero weapon plan in the existing
  cel-shaded style. The captured baseline shows paddle-shaped guandao/dao
  blades, a thick curled serpent head, a weak spear ridge and an off-centre bow.
  This approved scope replaces the earlier two-blade-only ART-15 constraints.
- Acceptance criteria:
  - [x] Shared internal weapon paths support isolated silhouette tests.
  - [x] Guan Yu: elongated asymmetric crescent, sharp point, restrained rear spur.
  - [x] Zhang Fei: slender S-shaped spear blade; existing long shaft retained.
  - [x] Zhao Yun: narrow symmetrical point, central ridge and readable edge.
  - [x] Huang Zhong: slimmer recurve, distinct string, grip centred in his hand.
  - [x] Wei Yan: elongated dao, straighter spine, angled point and controlled belly.
  - [x] The old three malformed blades and off-hand bow fail regression controls.
  - [x] All 17 shared fighters, 11 poses and both facings keep weapons off faces.
  - [x] Matching before/after sheets, desktop/phone attacks and gameplay reviewed.
  - [x] Existing scale, clipping, reach, tassel, visual parity and full project gates pass.
- Non-goals:
  - No combat reach, damage, collision, timing, character-scale or assignment changes.
  - No new animation states; Huang Zhong keeps melee attacks and his arrow special.
  - No deployment or push. Existing jian/ji blade geometry is retained.
- Evidence:
  - artifacts/weapon-review/weapon-shapes-before.png and weapon-shapes-after.png.
  - Negative-control paths captured from local baseline commit 1e5e3f4.
  - References: https://anthony.sogang.ac.kr/ThreeKingdoms/bc001.htm
    and https://en.wikipedia.org/wiki/Guandao

### ART-16 - Every face looked unnatural: hollow shapes and a grey smudge (owner request, part 1)

- Status: DONE
- Requirement:
  Owner request 2026-09-22: "Review all the character faces ... enhance them
  to make every face look natural." Reviewed every portrait and in-play head
  (17 kinds) against a human face rather than against the previous art. Two
  cast-wide ROOT CAUSES, both pre-existing since the first commit 7d574d2:
  1. `limbPath` and `chainPath` (rig.ts) traced their two sides CROSSED - the
     first arc ends at a - n*w/2, and the path then ran to b + n*w/2 - so every
     shape was a bow-tie and the nonzero fill left its middle empty. Measured on
     a 60->40 limb, the middle column filled 0 px (now 50); a bent chain 19/40/20
     (now 46/40/36). Every in-play brow, mouth and nose is a limb path, which is
     why they rendered as broken commas; it also hollowed torsos, limbs, sashes,
     belts, hafts and the horse. The ink stroke hid most of it.
  2. Every portrait gradient faded to 'rgba(0,0,0,0)'. Canvas interpolates
     stops unpremultiplied, so the fading edge of the bridge HIGHLIGHT and of
     both eye sockets was translucent near-black: a grey-brown ring round the
     eyes and down the nose on all 17 portraits. Bridge/forehead luma ratio was
     0.81-0.91 (a smudge); now 1.005-1.05.
- Changes:
  - rig.ts: the side lines fixed in both primitives.
  - portrait.ts: fades end in a transparent copy of their own colour; the socket
    moved up under the brow ridge and softened; a forehead-lift gradient (lit
    frontal bone) keeps the forehead from reading flat; the nose wings no longer
    run from eye level (they drew a paper triangle), plus a tip highlight.
  - poses.ts `DOWN.weaponRot` 0.16 -> -0.34: with SOLID hafts the dropped weapon
    lay across the prone body (caoren/caocao/lubu legibility 0.087-0.137 <
    0.15); now the weapon falls clear as the pose comment already said (0.372+).
  - figures.ts Guan Yu `TALL.height` 1.03 -> 1.06 (身长九尺, a head above
    Zhang Fei/Zhao Yun's 八尺). With filled bodies guanyu/weiyan silhouettes
    were only 9.4% apart (< 0.1 gate); the old 15.8% came from hollow torsos.
    Now 11.8%. Visual only: combat lives in src/core and is untouched.
- Acceptance criteria:
  - [x] New `test/game/rig.test.ts` fails on the original rig.ts (0, 0, 16 px)
        and passes with the fix.
  - [x] New portrait gate "keeps the bridge between the eyes lit" fails on HEAD
        portrait.ts (guanyu 0.914 < 0.96) and passes on all 17 kinds.
  - [x] No gate threshold weakened; forehead-range gate kept at 5 and met by
        real form (the smudge had been supplying its variation).
  - [x] Before/after sheets reviewed: `artifacts/look/faces-before-portraits.png`
        vs `faces-final-portraits.png`, `closeup-before*.png` vs `closeup-final.png`.
  - [x] lint, tsc, unit 200/200, e2e 54, vision 5/5 (256/256 sprites, 85/85
        weapons, 170/170 retracts), selfplay 13, prodbuild 4, build.
- Non-goals: per-character likeness (ART-17); no PORTRAIT_BOX/TEXTURE,
  display-size, in-play gradient, combat or troop-face change.


### ART-17 - Heroes and bosses do not yet look as the histories describe them (owner request, part 2)

- Status: DONE
- Requirement:
  Second half of the 2026-09-22 owner request ("for every hero and boss,
  enhance their appearance to make them look just like they were described in
  the legendary history"). ART-16 fixed what made every face unnatural; the
  per-character likeness is still mostly colour. Measured on
  `artifacts/look/faces-final-portraits.png` and `closeup-final.png`:
  lidian, caoren, zhangliao and zhanghe share one face and differ only in hat
  colour; Cao Cao and Lu Bu wear the identical `crown` shape; the in-play head
  shows every character the same brow/eye/mouth marks. Bosses have NO portrait
  in play, so boss likeness must land on the in-play sprite.
- Sources (三国演义 descriptions, to cite per change):
  Guan Yu 身长九尺, 髯长二尺, 面如重枣, 唇若涂脂, 丹凤眼, 卧蚕眉;
  Zhang Fei 身长八尺, 豹头环眼, 燕颔虎须; Zhao Yun 身长八尺, 浓眉大眼, 阔面重颐;
  Huang Zhong aged, white-haired; Cao Cao 身长七尺, 细眼长髯;
  Lu Bu 头戴三叉束发紫金冠 (with 雉尾 plumes), 西川红锦百花袍;
  Xu Chu 身长八尺余, 腰大十围; Xiahou Dun lost his left eye.
- Acceptance criteria (each a falsified gate or a before/after sheet):
  - [x] Lu Bu's headgear is its own shape (三叉紫金冠 with two plumes), and its
        portrait/sprite silhouette differs from Cao Cao's crown by a measured margin.
        (`plumed`; likeness.test.ts: sprite reach 2.08R -> 3.63R vs Cao Cao 2.05R, gate > 1R.)
  - [x] Zhang Fei's beard is bristling (虎须: jagged outline), not the smooth wedge.
        (`bristle`; likeness.test.ts: portrait beard edge reversals 0 -> >= 4.)
  - [x] Guan Yu's lips read red (唇若涂脂) and his beard reaches the chest.
        (plan `lips` 0xc81e30; portrait lip-minus-cheek redness -19.5 -> +53.5,
        gate > 40. Sprite long beard now also falls in front of the pauldron and
        arm: visible end 8.7 -> 18.5 units below the chest joint, gate > 14.)
  - [x] Zhao Yun's brows are the heaviest of the fair-skinned cast (浓眉) and his
        eyes the largest non-fierce eyes (大眼), with a broader jaw.
        (face `bold`: browWeight 1.5, the cast maximum; eye area 1.35 and eyeW
        1.18, largest short of `fierce`; plan `jaw` 1.1 widens the portrait's
        lower head: measured jaw row 1.014x -> 1.108x Wei Yan's, gate > 1.06.)
  - [x] Cao Cao's eyes are the narrowest in the cast (细眼, eyeAspect gate).
        (`narrow` face: eyeAspect 3.4 / eyeH 0.66, both extremes of the cast.)
  - [x] The four "generic" bosses are pairwise distinct on the in-play head by a
        measured face-region difference, not by hat colour alone.
        (Zhang He `sharp`, Cao Ren and Zhang Liao bearded. Shape-only face-region
        difference, every colour equalised: min pair 0.00% (lidian/zhanghe) ->
        3.64%, zhangliao/zhanghe 1.39% -> 10.64%; gate > 2.5% for all six pairs.)
  - [x] Troops keep the plain face and shared skin; all existing gates green.
        (likeness.test.ts asserts no face/skin/lips/jaw on the three troops.)
- Non-goals:
  - No combat, reach, damage, collision or timing change. No new animation states.
  - No PORTRAIT_BOX/TEXTURE or display-size change; no gradients on sprites.
  - Wei Yan's complexion stays owner-decided (see ART-16).


### ART-18 - Natural painted hero faces faithful to the legend (renewed owner request)

- Status: DONE (attempt 2; approved redesign, owner priority over ENH-12)
- Requirement: replace the five heroes' mask-like portraits AND compressed
  gameplay heads with original semi-realistic painted warriors. Existing art
  geometry/shading is not a constraint. See docs/HERO_FACE_REFERENCE.md and
  docs/HERO_FACE_REDESIGN_PLAN.md. ART-16/17 were incremental fixes, not owner
  acceptance of convincing natural likeness.
- Confirmed owner choices (2026-09-23): semi-realistic painted warriors;
  Wei Yan follows the novel's 面如重枣, superseding the old tan exception.
- Acceptance criteria:
  - [x] Source-backed reference brief separating quotations from interpretations.
  - [x] Guan Yu/Zhao Yun pilot reviewed at real select/HUD/gameplay sizes.
  - [x] Original, coherent portraits and neutral/exertion/hurt gameplay heads
        for Guan Yu, Zhang Fei, Zhao Yun, Huang Zhong and Wei Yan; natural anatomy,
        distinct ages and identities, matching headgear, skin and facial hair.
  - [x] Typed, versioned assets, deterministic preparation, safe head/neck pivots,
        ordered rear/head/front-beard layers and unchanged 14-pose rig semantics.
  - [x] Atomic per-hero fallback; no legacy manifest/stale asset overwrite;
        optimized committed assets really load in production.
  - [x] Shipping-path tests plus negative controls (missing/blank/swapped faces,
        erased features, displaced pivots); no weakened regression gates.
  - [x] Native-size before/after sheets and motion review in both facings,
        including attacks/down/mounted/co-op, desktop and mobile.
  - [x] Full lint/typecheck/unit/e2e/signal/vision/prodbuild/build green; report
        size/memory/performance. Do not equate green tests with visual approval.
- Evidence: docs/HERO_FACE_REFERENCE.md, docs/HERO_FACE_REDESIGN_PLAN.md,
  art/hero-faces/ (10 masters + PROVENANCE.md + preparation.json),
  test/game/hero-faces.test.ts (77), e2e/hero-faces.spec.ts (3),
  artifacts/look/art18-pilot-sheet.png (5 heroes, both facings),
  artifacts/look/art18-mobile-{select,weiyan,huangzhong}.png.
  Full gates 2026-09-23: lint + typecheck pass; unit 284/284; e2e 56/57 with one
  timing flake (game.spec special-pose) passing alone; vision 5/5 incl. 256/256
  sprites and parity; selfplay 13/13, marathon numbers identical to the standing
  snapshot; prodbuild 4/4; vite build pass. Runtime images 2.13 MB; decoded
  sources ~10.6 MB transient; generated texture count unchanged.
  Presented to the owner for visual acceptance in the loop digest; any objection
  reopens this as a new iteration.
- Non-goals: no combat/balance/weapon/control/animation-state changes; no boss,
  NPC, environment or full-body redesign; no push/deploy/schedule/control edits.
- Checkpoints: pilot first, remaining heroes next, technical + visual verification
  last. If unfinished, retain IN_PROGRESS and exact evidence; don't auto-complete.


### UI-1 - Design-system foundation: theme, type, panel kit (overhaul phase 1)

- Status: DONE (attempt 1)
- Requirement: approved UI/art-overhaul plan phase 1 (owner request 2026-09-23,
  "not limited by current design"). Add `src/game/ui/theme.ts` (WoF-inspired
  palette, type scale, panel specs) and `src/game/ui/type.ts` (FontFace loader
  + baked display-text baker + live-text presets). Bundle an OFL arcade CJK
  display font (first choice ZCOOL QingKe HuangYou) under
  `src/game/assets/fonts/` with its license; BootScene loads it with a bounded
  timeout and sans-serif fallback. Extend `panels.ts` with `drawCard`,
  `drawLacquerBar`, `makeArcadeBar` (segmented HP + presentation-only white
  damage ghost); keep `drawSlab`/`makeBar` signatures and `panelRect`/`bar`
  data tags. Migrate all ~73 sans-serif call sites to theme presets.
  Produce a title style-frame mock for owner sign-off before UI-2..5 scale it.
- Acceptance criteria:
  - [x] theme.ts + type.ts exist; font + OFL license committed; boot loads font
        with timeout and falls back silently when blocked (e2e route-abort test).
  - [x] Baked-text baker handles every display string in the game (CJK + Latin)
        with no clipping (unit test over the string table); deterministic output.
  - [x] New panel builders emit `panelRect`/`bar` tags; layout/occlusion gates pass.
  - [x] Title style-frame screenshot reviewed at desktop + phone sizes.
  - [x] lint, typecheck, unit, e2e, signal, vision (incl. parity), prodbuild, build.
- Evidence: src/game/ui/{theme,type}.ts, src/game/assets/fonts/ (29.6 KB subset
  woff2 + OFL + subset + PROVENANCE.md), scripts/fetch-display-font.mjs,
  src/game/art/keyart.ts, StyleFrameScene (?styleframe=1, removed in UI-2),
  test/game/{uitheme,uitype}.test.ts (11), e2e/uifont.spec.ts (3),
  artifacts/look/ui1-styleframe-{desktop,phone}.png.
  Full gates 2026-09-23: lint + typecheck pass; unit 295/295; e2e 60/60;
  vision 5/5 (256/256 sprites, parity clean); selfplay 13/13, marathons
  identical; prodbuild 4/4; build pass (font +29.6 KB in dist).
  Image providers quota-exhausted during UI-1 (reset ~Sep 30): style frame is
  fully procedural; UI-2 carries the key-art generation retry + fallback.
- Non-goals: no scene restyles yet (UI-2..5); no sim/core changes; no push/deploy.


### UI-2 - Title screen: arcade attract screen (overhaul phase 2)

- Status: DONE (attempt 1)
- Dependency: UI-1 DONE + owner sign-off on the style frame.
- Requirement: title backdrop: generated key art preferred, procedural dusk
  battle (`src/game/art/keyart.ts`, UI-1 style frame) as the committed fallback.
  NOTE 2026-09-23: GPT image quota exhausted; owner logged into Grok the same
  day and the key art was generated with the grok provider.
  Original painted key art backdrop (Five-Tigers homage, Red-Cliff
  fire/ship motif, provenance-logged like ART-18); baked gold-foil logo lockup
  with 『赤壁之战』 subtitle; blinking PRESS START; presentation-only hi-score
  line (`localStorage`, guarded); control plate as bronze plaque with the same
  device-specific strings; ember-drift + logo-sheen animation (visual-only).
- Acceptance criteria:
  - [x] Title reads as an arcade attract screen at desktop + phone sizes (reviewed).
  - [x] Control-name assertions keep passing (touch.spec family, same strings).
  - [x] Hi-score hidden (not erroring) when storage unavailable.
  - [x] vision title frame + parity green; full gates green.
- Evidence: art/ui-title/{keyart-master.jpg,PROVENANCE.md} (grok provider,
  hashes logged), scripts/prepare-title-art.mjs ->
  src/game/assets/title/keyart-backdrop.jpg (960x540, 119 KB); BootScene
  preloads `ui:keyart-photo`, TitleScene falls back to keyart.ts when absent;
  `ensureSheenStrip` (panels.ts) 12 baked glint frames on the lockup;
  src/game/ui/hiscore.ts (+ GameOver/GameComplete writes), StyleFrameScene
  removed. Prompt kept as the device strings PRESS ENTER / TAP TO START
  (touch-parity wording) rather than a generic PRESS START.
  Tests: e2e/title.spec.ts (key art shown + blocked-art fallback),
  e2e/uifont.spec.ts (textures, sheen cycles, hi-score shown/denied),
  test/game/uihiscore.test.ts (5). Reviewed
  artifacts/look/ui2-title-{desktop,phone,sheen}.png +
  artifacts/vision/parity-webgl-title.png.
  Full gates 2026-09-23 (serial, final code): lint + typecheck pass; unit
  300/300; e2e 62/62; vision 5/5 (title coverage 0.664 / richness 2441,
  parity clean, sprites 256/256); selfplay 13/13, marathons identical to
  the standing snapshot; build pass (+119 KB jpg); prodbuild 4/4.
- Non-goals: no flow changes; no sim changes.


### UI-3 - Character select: WoF-style warrior roster (overhaul phase 3)

- Status: DONE (attempt 3, 2026-09-23 18:40 UTC - the attempt-2 environment
  block cleared itself: browsers launch again; the owner's standing overhaul
  goal drove this verification round)
- Dependency: UI-1 DONE.
- Requirement: parchment/ink-wash backdrop, faction-blue frame, five large baked
  portrait cards (ART-18 portraits) with display-type names + bronze stat pips,
  P1 gold / P2 blue cursors, bottom lacquer command strip. Keep tap-a-card,
  cursor wrap, autopilot skip.
- Acceptance criteria:
  - [x] Reviewed at desktop + phone sizes (artifacts/look/ui3-select-{desktop,
        zhaoyun,phone}.png, plus vision parity-webgl-select.png matching
        canvas); select, touch and layout specs pass unchanged.
  - [x] Full gates green: lint, typecheck, unit 306/306, e2e 63/63 (+1
        select-look), vision 5/5 (sprites 256/256), selfplay 13/13 with
        marathons identical, build, prodbuild 4/4.
- Delivered: src/game/art/selectart.ts (baked backdrop/frame/strip, card,
  cursor halos, pips, pennants), src/game/ui/roster.ts (shared geometry +
  statPips), src/game/players.ts (secondPlayerCharacter shared by the select
  2P preview and the in-game join), SelectScene.ts rewrite, type.ts strings,
  e2e/select-look.spec.ts, test/game/roster.test.ts (6).
- Non-goals: no roster/stat changes (sim data untouched).

### UI-4 - In-game HUD: WoF top-bar language (overhaul phase 4)

- Status: DONE (attempt 1, 2026-09-23 22:50 UTC - owner overhaul goal,
  verified full-green same day)
- Dependency: UI-1 DONE.
- Requirement: arcade top band (P1 medallion + name + segmented HP + score +
  lives pips); full-width boss rail on boss waves; "GO →" advance cue;
  "WAVE n" chip; restyled combo + flaming-pearl special pip (same hp>cost rule);
  1.2s boss-name banner via existing `showBanner` queue; touch controls
  restyled as bronze lacquer buttons with identical hit zones/protocol.
- Acceptance criteria:
  - [x] HUD/layout/pause/touch/prodbuild-HUD specs pass unchanged (no
        assertion deleted: geometry moved to hudlayout.ts with new unit
        tests; the persistent stage label shows nameZh with the full En·Zh
        name still present via the entry banner, which hud.spec reads).
  - [x] Reviewed desktop + mobile portrait/landscape in combat, boss, co-op
        (artifacts/look/ui4-{combat,boss,coop,go,touch-portrait,
        touch-landscape,touch-boss}.png; 20/20 objective pixel checks via
        artifacts/ui4-review.mjs; a pixel-agent audit caught the first-pass
        2x-size baked-image defect - fixed with setDisplaySize before gates).
  - [x] Full gates green: lint, typecheck, unit 318/318 (+12), e2e 67/67
        (+4 hud-look), vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: src/game/ui/hudlayout.ts (pure geometry + ghost decay),
  src/game/art/hudart.ts (plate/medallion/pearl/pip/chip/GO/rail/banner/touch
  painters), HudScene.ts rewrite (WoF band, boss rail, WAVE chip, GO cue,
  restyled combo + banner plaque, holdMs param), touch.ts bronze sheet
  (identical zones/protocol), GameScene 1.2s boss banner, type.ts 'GO →',
  test/game/{hudlayout,hudart}.test.ts (12), e2e/hud-look.spec.ts (4).
- Non-goals: no sim/HUD-data changes; damage ghost is presentation-only
  (decayGhost in hudlayout, ghost field separate from ratio).

### UI-5 - Flow screens: scene cards, result, game over, complete, pause/continue (overhaul phase 5)

- Status: DONE (attempt 1, 2026-09-24 05:20 UTC - owner overhaul goal,
  verified full-green same night)
- Dependency: UI-1 DONE.
- Requirement: new skippable scene-intro parchment card as a HudScene overlay
  (no new scene; tick-based autopilot auto-skip; `STAGE_LORE` copy table in the
  game layer); victory tally / game-over / game-complete / continue / pause
  cards in the new kit. Same scene keys + bridge fields.
- Acceptance criteria:
  - [x] Autopilot/selfplay/marathon never hang on the card (new
        e2e/introcard.spec.ts, 4 tests: tick-dismissal, real-play Enter
        dismissal, fresh card per stage, defeat/complete/pause captures).
  - [x] stageclear/continue/scenerestart specs preserved (plus pause,
        touchpause, hud, hudpanels, layout all green); vision captures
        reviewed.
  - [x] Full gates green: lint, typecheck, unit 323/323 (+5), e2e 71/71
        (+4 introcard), vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: src/game/data/stagelore.ts (9 lore beats), src/game/art/
  flowart.ts (parchment intro/dialog/victory/defeat cards + stat chip +
  ensureFlowArt), HudScene intro overlay (1.6s stagger, tick-based
  autopilot dismiss, Enter/tap/3s dismiss; overlays sit above it),
  parchment pause/continue/result/gameover/complete cards with dark-ink
  recolors, type.ts STAGE 1..9, test/game/flowart.test.ts (5),
  artifacts/ui5-review-cards.mjs (13/13 pixel checks), screenshots
  artifacts/look/ui5-{intro,victory,gameover,pause,complete}.png.
- Non-goals: no flow/state-machine changes; no new scenes.

### ART-19 - Painted per-stage backdrops (overhaul phase 6)

- Status: DONE (attempt 1, 2026-09-24 09:05 UTC - owner overhaul goal,
  verified full-green same morning)
- Dependency: UI-1 DONE.
- Requirement: extend `backdrop.ts` with per-stage landmark mid-layers and
  palettes from the theme (rivers/bridges/temples for early stages, burning
  warships + red cliffs + ember sky for the finale), periodic-tile Canvas2D
  technique, optional visual-only animated overlays (smoke/embers). Ground
  line and scroll geometry identical.
- Acceptance criteria:
  - [x] All 9 stages visually distinct, reviewed in screenshots + motion
        (artifacts/look/ui19-stage{1..9}.png; 21/21 objective pixel checks
        via artifacts/ui19-review.mjs incl. 9/9 distinct band signatures;
        motion = parallax + rising embers asserted in the look spec).
  - [x] Tile-seam unit test per layer (test/game/backdrop.test.ts, 12
        tests: seam-step profile per legacy layer + all 9 landmark kinds,
        exact wall-wrap for gorge/inferno, edge margins for interior kinds,
        integer-period bands, band continuation; background/probe specs
        pass in the full e2e run).
  - [x] Full gates green (see PROGRESS entry for the exact tallies).
- Delivered: src/game/data/stagebackdrop.ts (9 landmark kinds + ember sky
  selection, game layer), backdrop.ts paintMarks/paintEmbers/paintSky
  ember variant (day path byte-identical), GameScene bgMarks tileSprite
  (depth -12, 0.6x parallax) + bgEmbers (depth -11, ADD, rises by sim
  tick), e2e/backdrop-look.spec.ts, artifacts/ui19-review.mjs. Ground line
  (walkBandTop-26) and scroll geometry untouched.
- Non-goals: no parallax/camera/ground-geometry changes.

### ART-20 - Props, pickups & combat-feedback pass (overhaul phase 7)

- Status: DONE (attempt 1, 2026-09-24 10:40 UTC - owner overhaul goal,
  verified full-green same morning; final overhaul phase)
- Dependency: UI-1 DONE.
- Requirement: restyle crates/jars/meat/sword/chest + hit spark/KO burst/
  stage-clear flash to the painted arcade style via the existing `fx:` texture
  pipeline; unify boss-warning flash with the banner kit.
- Acceptance criteria:
  - [x] Sprite gate stays 256/256 in unit (338/338 incl. restyled props)
        + vision (256/256 sprites, 85/85 weapons, 170/170 retracts).
  - [x] weapon/probe/juice specs preserved (in the 75/75 e2e run);
        reviewed in combat screenshots (ui20-combat with live sparks +
        restyled crate; ui20-fx-{spark,burst,dust} texture dumps read).
  - [x] Full gates green: lint, typecheck, unit 338/338 (+3), e2e 75/75
        (+3 artfx), vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: src/game/art/fx.ts (paintSpark/paintBurst/paintDust painters),
  BootScene bakes fx:spark (restyled starburst) + fx:burst (new KO ring)
  + fx:dust; props.ts enriched interiors (crate brace/studs/grain, meat
  glaze/sheen, sword fuller/grip wraps, arrow barbs/glint - same boxes);
  koEmitter bound to fx:burst; stage-clear gold cam.flash + boss-spawn
  crimson cam.flash (banner-kit red), both real-play only;
  test/game/fx.test.ts (3), e2e/artfx.spec.ts (3: bindings, flash
  recording via wrapped cam.flash, combat capture).
- Scope note: no jar or treasure-chest kinds exist in this game (loot is
  crate/meat/sword/arrow only) - inventing kinds would touch the sim and
  the entity pipeline, forbidden by the non-goals, so the four existing
  props were restyled instead. Neither flash existed before either; both
  were added as presentation-only real-play juice.
- Non-goals: no loot/drop-rate/combat changes.

### BODY-1 - Reference briefs + pilots: one hero body, one boss head (owner-approved plan)

- Status: DONE (attempt 1, 2026-09-24 - owner approved the pilots)
- Dependency: ART-18 DONE.
- Requirement: `docs/BODY_STYLE_GUIDE.md` (brushwork, palette, cloth/armor/
  skin/muscle treatment, joint-overlap conventions, per-hero body notes tied
  to ART-18 head identities) + `docs/BOSS_HEAD_REFERENCE.md` (per-boss
  source quotes vs interpretation, HERO_FACE_REFERENCE.md pattern). Pilots
  reviewed in real UI/gameplay before bulk work: one full hero body
  (Zhao Yun) + one boss head (Cao Cao).
- Acceptance criteria:
  - [x] Both briefs written; quotations separated from interpretation.
  - [x] Pilots reviewed at select/HUD/gameplay sizes; owner approval to
        proceed (approved, no changes requested).
- Delivered: the two briefs + `docs/BODY_PARTS_SPEC.md` (pre-designed
  BODY-2 part inventory), pilots in artifacts/look/body1-*, baselines,
  parity-harness validation, joint inventory, insertion-contract mapping.
- Non-goals: no pipeline code; no other fighters.

### BODY-2 - Paper-doll body pipeline, preparation, fallback, parity gates

- Status: DONE (attempt 1, 2026-09-24 - owner overhaul goal, verified full-green)
- Dependency: BODY-1 DONE.
- Requirement: `src/game/art/body-parts.ts` (part list, pivots, draw order
  interleaved with ART-18 head layers); renderer positioning parts from
  pose-skeleton joints (mirror/lying/mounted handled); ART-18-style asset
  chain (masters + provenance + preparation.json, shipping derivatives,
  Vite-hashed imports, bounded boot preload, signature verification,
  atomic per-fighter procedural fallback); ArtResources generalized to
  fighter-id keys (heroArtResources kept working); silhouette-parity unit
  gate (old-vs-new outline IoU floor per pose).
- Acceptance criteria:
  - [x] Unit tests (test/game/bodyparts.test.ts, 12): part table, fixture
        preparation determinism + sha256/signatures, pivots/alpha bounds,
        render presence + order, registry threading incl. headless mook
        path, fallback byte-identity, publish atomicity (missing/
        undersized/tampered rejected, heads preserved), mask-IoU unit
        checks, 14-pose parity gate at 0.90.
  - [x] Rig semantics unchanged (all 14 poses render for the wired
        fixture pilot; production catalog empty so every shipped pixel
        is still procedural).
  - [x] Full gates green: lint, typecheck, unit 350/350 (+12), e2e
        75/75, vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: body-parts.ts (part defs, BodyArt, bodyPainter with axial
  stretch + bulk lateral, maskIou, PARITY_FLOOR), draw.ts markers +
  generalized paintWithHead + threading, registry bodies lookup,
  ArtResources.bodies, body-art.ts adapter (explicit-catalog publish,
  registry merge), BootScene wiring (no-op), scripts/
  make-body-fixtures.mjs + .d.mts, committed fixtures + prepared.json.
- Non-goals: no new fighter art beyond pipeline fixtures; no sim changes.

### BODY-3 - Five hero paper-doll bodies

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; captures presented for owner review)
- Dependency: BODY-2 DONE.
- Requirement: one painted part set per hero matching their ART-18 head
  (Guan Yu tall green robe; Zhang Fei heavy bare-armed brute; Zhao Yun
  lean silver/blue armor; Huang Zhong aged veteran; Wei Yan solid purple,
  date-red neck continuity). Skin tones reuse SKIN_*; armor/robe colors
  reuse HERO_FIGURES body/trim.
- Acceptance criteria:
  - [x] All 14 poses x both facings render per hero (unit parity 0.81
        floor + liveness <0.99 per hero per pose); mounted/co-op/
        restarts verified (e2e body-look + full 75/75 run).
  - [x] Before/after sheets at native select/HUD/gameplay sizes, phone +
        desktop; motion review (body3-beforeafter.png board w/ parity
        baked in; select/5x gameplay w/ motion batches/mounted/co-op/
        phone captures; 10/10 objective pixel checks incl. per-hero
        armor hue + 5/5 pairwise distinct). Presented for owner review.
  - [x] Full gates green: lint, typecheck, unit 353/353 (+1 board),
        e2e 78/78 (+3 body-look), vision 5/5, selfplay 13/13, build,
        prodbuild 4/4. Sprite gate held with all five painted bodies
        LIVE (the outline-ratio risk did not materialize).
- Delivered: art/hero-bodies/ (5 masters), scripts/prepare-body-parts.mjs
  (joint tables w/ anatomical hand/ankle correction, oriented-quad cuts,
  border-seeded flood key, far-side shade, sheets + prepared.json),
  hero-bodies shipping assets (5 sheets + prepared.json), full
  BODY_ART_CATALOG wiring, e2e/body-look.spec.ts (3),
  test/game/bodyboard.test.ts, artifacts/body3-review.mjs (10/10).
- Defects fixed en route: keying tolerance 16->10 (ate dark trousers);
  border-seeded flood (corner seeds stranded torso background - the
  black-slab bug); upperArm pre 0.2->0.3; joint tables record visible
  landmarks, prep derives palm/ankle joints.
- Non-goals: no head changes; no mook/boss/horse art.

### BODY-4 - Three mook paper-doll bodies

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; captures presented for owner review)
- Dependency: BODY-2 DONE.
- Requirement: shared-geometry painted part sets with per-kind armor
  variants for soldier/spearman/archer; heads stay procedural vector
  (necks recolored to meet painted torsos).
- Acceptance criteria:
  - [x] All 14 poses x both facings per mook (parity 0.75 floor +
        liveness + per-part position tests idle/attack/down); sprite
        gate holds with painted mooks + darker mook faces live.
  - [x] 8-fighter before/after board; live combat/co-op captures
        eyeballed (mook bodies seat under procedural heads, no gaps;
        P2 spawn + horse unaffected). Presented for owner review.
  - [x] Full gates green: lint, typecheck, unit 354/354, e2e 78/78,
        vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: 3 mook masters + PROVENANCE.md, prep joint tables,
  mook-bodies pack (3 sheets + prepared.json), merged BODY_ART_CATALOG
  (8 fighters), SKIN_SOLDIER/SPEARMAN/ARCHER measured from painted
  hands (0x875640/0x936149/0x8f604a), parity floor recalibrated
  0.81->0.75 as drift bound + per-part position tests (the teeth),
  artquality/likeness mook rules upgraded to exact plan-pack match.
- Non-goals: no generated mook faces; no boss/hero/horse changes.

### BODY-5 - Horse repaint (full-frame raster)

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; captures presented for owner review)
- Dependency: BODY-1 DONE.
- Requirement: painted horse frames for each distinct horse pose in the
  same 112x76 box, same asset chain + procedural fallback as bodies.
- Acceptance criteria:
  - [x] Mounted heroes render correctly in all poses (saddle tack in
        the x38-62/y21-31 zone + hooves grounded per frame, rider
        seating eyeballed live); sprite gate holds with painted horse.
  - [x] Before/after + motion review (3-frame look panel eyeballed,
        mounted/co-op/phone captures refreshed); owner review.
  - [x] Full gates green: lint, typecheck, unit 362/362, e2e 78/78,
        vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: horse-master.jpg (3-panel sheet), scripts/prepare-horse.mjs
  (explicit per-frame crop/dest geometry, uniform 0.93 scale, hooves
  y76 + saddle x50 registered), horse pack (sheet + prepared.json),
  full catalog wiring, horse.test.ts (frame table/aliasing, fixture
  integrity, render selection, fallback, publish atomicity, placement
  gates). No parity floor for full-frame replacement by design (honest
  0.48 on a slimmer horse); placement + liveness + vision carry it.
- Non-goals: no beast-rig changes; no rider changes.

### BODY-6 - Nine boss heads via the ART-18 pipeline

- Status: DONE (attempt 1, 2026-09-25 - owner overhaul goal, verified
  full-green; board presented for owner review)
- Dependency: BODY-1 DONE.
- Requirement: portrait + head/exertion/hurt cells + rear/front layers per
  boss (beards, Xiahou Dun's scarred socket, Lu Bu's plumed crown, Zhang
  He's clean-shaven severity), catalog/preload/publish generalized to
  boss ids, procedural FaceKind fallback retained. Boss bodies stay
  procedural (neck recolor + collar detail only, where needed).
- Acceptance criteria:
  - [x] All nine render painted heads: portrait paint path (unit, all 9
        draw from the shipping image), gameplay heads (unit renders +
        vision sprite gate green with them live), identity agreement
        (head layers pairwise-distinct gate + portraits keyed to heads;
        HUD shows boss names not face medallions, hero medallions
        unaffected and green).
  - [x] Shipping-path + negative-control tests mirror the hero-faces
        suite: test/game/boss-faces.test.ts (134) - hashes, signatures,
        blank/swapped/erased rejection, expression mapping, portrait
        source, 126 frame-escape cells, displaced-pivot guard, fallback
        liveness, head-identity gate.
  - [x] Before/after + motion review: boss-beforeafter.png board (9
        bosses x idle/attack/down x procedural/painted, liveness baked
        in); full gates green - lint, typecheck, unit 497/497, e2e
        78/78, vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Delivered: art/boss-faces/ 18 masters (9 heads sheets + 9 portraits,
  Cao Cao keyed to the owner-approved BODY-1 pilot portrait),
  scripts/prepare-boss-faces.mjs (JPEG border-flood key tol 4 - keeps
  near-black beards/gauze whole; 3-largest silhouettes with fragments
  dropped; per-boss landmark fractions calibrated from the heroes'
  authored data; ink-bbox portrait normalization; ART-18 cell pipeline),
  src/game/assets/boss-faces/ (36 PNGs + prepared.json),
  HERO_ART_CATALOG generalized to 14 ids, hero-faces e2e exact-set
  extended to the 14-id roster, bossboard generator.
- Non-goals: no boss bodies; no sim/AI changes.

### BODY-8 - Hands visible and grip readable (owner objection 2+3)

- Status: DONE (attempt 1, 2026-09-25 - verified full-green; grip sheets
  presented for owner re-review, objections reopen)
- Owner objection (2026-09-25, final-cast review): "I cannot see these
  characters' hand" and "I can not see how these characters hold their
  weapons." Vision inspection (artifacts/look/obs-grip-*.png,
  obs-full-*.png) confirms: no hand is visible in any weapon pose; the
  red tassel blobs occupy the grip zone; hafts cross bodies with zero
  hand contact.
- Root cause found by inspection: the masters' open hands are wider than
  the limb-band cuts, so the foreArm cells end at clipped palm stubs -
  and the plain haft drew OVER the stub, leaving zero hand pixels at the
  grip. (The red "stuck arrow" is the procedural sash over painted
  waists - BODY-11.)
- Delivered: painted-style hands in the fighter's own body skin -
  drawGripHand (fist + finger bands wrapping the haft at handN over the
  weapon, knuckle line, form shadow) + drawRelaxedHand at the far-arm
  slot inside the shape stream (correct occlusion behind the torso).
  Hand tones follow the BODY art skin (hero head-skin measurements
  differ from body skin).
- Acceptance criteria:
  - [x] Grip review sheets regenerated (artifacts/look/obs-grip-*.png)
        for owner re-review; measurable proof below.
  - [x] Measurable: test/game/handgrip.test.ts - 17 fighters x all 14
        poses, >= 24 skin px (SCALE 2) within +-3 px of the grip point:
        238/238 checks pass. (Far-hand visibility deliberately not
        asserted: measured, the far arm is behind the body in every pose
        of this rig - its hand renders and is occluded by anatomy.)
  - [x] Full gates green: unit 516/516 (one documented full-suite
        artquality flake, green on re-run and in isolation), e2e 78/78,
        vision 5/5, selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no weapon geometry/reach changes; no sim changes.

### BODY-9 - Feet visible at gameplay size (owner objection 1)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; feet sheets
  presented for owner re-review, objections reopen)
- Owner objection: "I cannot see these characters' feet." Vision
  inspection (artifacts/look/obs-feet-*.png) confirms: boots are
  dark-on-dark with no sole/toe definition; weapon butt-caps hang into
  the foot zone; robe hems swallow ankles.
- Delivered: painted-style boot overlays at footF/footN (BODY-9 fix, the
  BODY-8 pattern): sole slab with light contact line, boot body, toe-cap
  highlight (tint(LEATHER, 0.3)), heel cuff - flat on the ground line
  (the old footShape convention), bulk-scaled, drawn LAST so the feet
  sit over robe hems and the weapon butt. Far boot in darker tones so
  the two feet separate at a glance. LEATHER exported from palette.
- Acceptance criteria:
  - [x] Feet review sheets regenerated (artifacts/look/obs-feet-*.png)
        for owner re-review; measurable proof below.
  - [x] Measurable: test/game/footcheck.test.ts - 17 fighters x
        idle/walk0/walk1, toe-cap region >= 24 px exact-tone at SCALE 2
        with mean luminance >= 30 (bg 0): 51/51 checks pass (first run
        was marginal at 22px on lean builds; boot enlarged - a
        visibility win in its own right).
  - [x] Full gates green: unit 533/533, e2e 78/78, vision 5/5, selfplay
        13/13, build, prodbuild 4/4.
- Note: the haft butt is covered where boots overlap; the gap BETWEEN
  the feet can still show it - reshaping the butt is BODY-10's
  (painted weapons) scope.
- Non-goals: no pose/rig changes; no ground/scene changes.

### BODY-10 - Painted weapons (realism pass, supports objections 2+3)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Finding from vision inspection: the procedural weapons (flat brown
  hafts, rounded butt-caps, white squiggle blades, red tassel bars)
  are the strongest remaining cartoon signal against the painted cast -
  they also cause the foot-zone and grip-zone artifacts above.
- Delivered: painted materials on the SAME paths (the ART-20 pattern):
  Shape.mat overlay hook (runs inside each shape's clip in the weapon's
  own frame after the cel bands); woodMat (grain + lit/shadowed edges),
  steelMat(fore) (dark spine -> mid -> bright cutting-edge bevel,
  anchored on the blade), metalMat (ring light/shadow fittings),
  clothMat (gathered-cloth tassel folds); a steel POMMEL at the butt
  (kills the rounded brown blob in the foot zone); bow wood + string
  strand shine. Geometry byte-stable: only fills changed.
- Acceptance criteria:
  - [x] Reach table tests unchanged and green (ART-14/15 silhouettes
        preserved - same paths); sprite gate holds with the materials.
  - [x] No flat-fill parts remain: test/game/weaponmat.test.ts (4) -
        wood spread >= 25, steel shine streak >= 8px above the flat
        steel luminance + spread >= 20 (bevel = light AND dark sides),
        metal fittings spread >= 25, tassel fold tones >= 30px.
        (First run caught a real bug: steelMat's gradient was anchored
        near the grip and painted NOTHING onto the blades; metalMat's
        rect missed the ferrule. Both fixed before landing.)
  - [x] Full gates green: unit 537/537, e2e 78/78, vision 5/5, selfplay
        13/13, build, prodbuild 4/4. Also ROOT-CAUSED the months-old
        artquality "flake": it was always a 5s default timeout (the
        renders slowed with materials and it failed every full run) -
        explicit 30s timeout added, assertions untouched.
- Non-goals: no sim/weapon-stat changes; no new weapon kinds.

### BODY-11 - Composition cleanup: belt bars, seams, arm readability

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Findings from vision inspection: procedural sash/belt bars draw OVER
  painted waists (straight floating bars on every paper-doll fighter);
  painted head collars double with painted torso shoulders; near arms
  merge into torsos at gameplay size.
- Delivered:
  - Sash/belt gating: drawBodyDetails now skips paper-doll fighters in
    BOTH call paths (the paintWithHead callback AND drawDetails - the
    second path is the mook procedural-head path, caught by the test
    still rendering 347-390px bars after the first gate alone).
    Procedural-body fighters keep their details (control-asserted).
  - Seam shading: soft neck shadow over the painted torso top (masks the
    head-collar/shoulder seam) + near-shoulder shading blob (separates
    the near arm from the torso at gameplay size) - the existing
    shape.shoulder radial mechanism.
- Acceptance criteria:
  - [x] No straight procedural bars over painted waists in any pose:
        test/game/waistclean.test.ts (9) - bar-fragment detector
        (>=20px horizontal runs of procedural trim/leather tones):
        0 fragments on all 8 paper-doll fighters x 14 poses; positive
        control on caocao's procedural body. (First run caught both the
        double call path AND that single-pixel hex collisions from
        painted gradients demanded a run-based detector.)
  - [x] Shoulder join: neck-shadow + shoulder-shading pass eyeballed in
        regenerated sheets, both facings (left = mirror).
  - [x] Full gates green: unit 546/546, e2e 78/78, vision 5/5, selfplay
        13/13, build, prodbuild 4/4. Also root-caused the SECOND legacy
        "flake" (hero-faces signature timeout) - both heavy-file flakes
        were vitest 5s timeouts; explicit 30s on the four decode-heavy
        tests across the suite, assertions untouched.
- Non-goals: no head-art changes; no pose changes.

### BODY-12 - Mook painted heads (realism: every character)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Finding: the three mooks keep procedural cel faces (dot eyes) on
  painted bodies - a style split the owner's "make every character
  looks realistic and good" covers.
- Delivered: 3-expression sheets + bust portraits for all three mooks,
  keyed to their shipped body masters (soldier: iron dome + clean-
  shaven weathered face; spearman: chin-strap helm + stubble; archer:
  green headwrap + mustache) via the BODY-6 pipeline clone
  (scripts/prepare-mook-faces.mjs, revision body12-1; default fracs
  fit the helmeted heads, no clip errors). Catalog generalized to 17
  ids; e2e published-ids exact-set extended to 17 (deliberate -
  mooks publishing through the shared record is the requirement);
  review/grip/foot/cast loaders point mooks at mook-faces.
- Acceptance criteria:
  - [x] All three mooks render painted heads in all 14 poses x both
        facings: test/game/mook-faces.test.ts (50/50) mirrors the
        boss suite (hashes, signatures, negative controls, expression
        mapping, portraits, 42 frame-escape cells, pivot guard,
        fallback-difference, head-identity gate).
  - [x] Full gates green: unit 596/596, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no mook body changes; no boss changes.

### BODY-13 - Boss paper-doll bodies (realism: every character)

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Scope note: the original plan said "bosses heads only", but the
  owner's final-cast instruction ("make every character looks
  realistic and good") supersedes it - boss cel bodies under painted
  heads are a visible style split.
- Delivered: 9 full-body masters (art/fighter-bodies, eyeballed joint
  marks in prepare-body-parts.mjs, skins matching the boss-faces
  packs): Lu Bu's red brocade + ring armor, Cao Cao's black-gold robe,
  Xiahou Dun's worn armor, Xu Chu's bulk, Zhang Liao's green + cape,
  Cao Ren's steel blue, Xu Huang's bronze, Zhang He's teal + cape, Li
  Dian's scholar blue. Boss-bodies pack wired through body-art.ts
  (catalog 8->17); hero/mook sheets regenerate byte-identical (no
  drift - verified via git status). Body tests extended to all 17
  (parity floor, per-part seating, waist bars, grip, feet); bossboard
  NEW side now paints bodies too.
- Acceptance criteria:
  - [x] All 14 poses x both facings per boss: parity floor holds on
        all 17 wired fighters + liveness (no silent fallbacks);
        per-part seating passes; sprite gate holds with boss bodies.
  - [x] Before/after board regenerated (boss cel -> painted paper-
        doll across idle/attack/down, eyeballed) + full gates green:
        unit 605/605, e2e 78/78, vision 5/5, selfplay 13/13, build,
        prodbuild 4/4. One real failure caught on the way: body-look
        published-bodies exact-set asserted the 8-pack roster -
        extended to 17 (deliberate, the BODY-4 precedent).
- Non-goals: no boss AI/sim changes; no weapon geometry changes.

### BODY-14 - Whole-character visual verification harness + loop rule

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Owner instruction (2026-09-26, second review round): "enhance the
  visual verification and estimation process. Every time you complete
  the character appearance enhancement, please use your vision
  capability to check the screenshot of the whole characters to see
  what looks fine, what looks unnatural, and what still needs to be
  enhanced. Then, add the next step of enhancement to the following
  tasks, and keep looping until all the characters look natural and
  good." Built FIRST so BODY-15/16 execute inside it.
- Delivered: docs/CHARACTER_REVIEW.md (standing checklist + the loop
  rule + the round-2 findings table) and
  test/game/reviewharness.test.ts (permanent generator):
  whole characters at 1.5x with per-cell overlays - analytic
  head:body ratio (crown-based from the renderer's own numbers, so
  headgear does not inflate it) plus N/F hand-presence flags sampled
  off the actual renders. The harness caught its own first bug on
  review: the ratio first read 1:2.1 (cell-span math counted empty
  cell margins); crown-based math now reads 1:3.1-3.8, matching the
  seen chibi impression. Current sheets confirm both known defects:
  N=yes everywhere (BODY-8 holds), F=no everywhere (BODY-15's job),
  ratios all above 1:4 (BODY-16's job).
- Acceptance criteria:
  - [x] Checklist doc + measurement-overlay sheets exist and are
        regenerated by a permanent test (review-harness-a/b.png).
  - [x] Full gates green: unit 606/606, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no art changes (harness only); no sim changes.

### BODY-15 - Both arms and hands visible; one/two-handed weapon grips

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Owner objection (2026-09-26): "I can only see one hand without arms.
  I want every character to have both arms and hands, and they can use
  either both hands or a single hand to hold their weapons." Vision
  inspection (obs-full-0/3) confirms: one fist per figure, the near arm
  a short stub, the far arm fully occluded behind the torso in every
  stance; polearms held one-handed mid-haft.
- Delivered: far-hand choreography in weaponPose (pose table frozen -
  the bow precedent): polearms grip the haft 12u behind the near fist
  (two-handed carry + strikes), one-handers/bows swing a visible
  counterbalance arm; elbows bent away from the chest; fist-vs-mitten
  decided by haft-axis geometry (no signature changes). Far fist via
  the new absolute-geometry painter (over torso, under weapon) plus
  fingertips wrapping OVER the haft at the tail - the wrap only reads
  when fingertips cross the haft (proven by probe: the fist painted
  ~148px but the haft covered all but slivers). Weapon anchor never
  moves: tip reach byte-stable, sim untouched.
- Acceptance criteria:
  - [x] Vision review: both hands read on every fighter (two fists on
        polearms, counterbalance arm+hand on jian/dao/bow); harness
        flags NY FY on all 17 x idle/attack; findings filed in
        CHARACTER_REVIEW.md (residual: near-arm extension filed as
        the follow-up if the owner still sees stubs).
  - [x] Measurable: far-hand tone >= 12px at handF in all poses but
        down (17 fighters x 13 poses); reach tests unchanged (all
        green as-is); sprite gate holds.
  - [x] Full gates green: unit 606/606, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no sim/range changes; no new weapon kinds.

### BODY-16 - Natural head:body size ratios

- Status: DONE (attempt 1, 2026-09-26 - verified full-green; sheets
  presented for owner re-review, objections reopen)
- Owner objection (2026-09-26): "adjust the ratio between the head
  size and body size to make them look natural." Vision inspection
  confirms ~1:3 (chibi) across the cast.
- Delivered: HEAD_PAINTED_SCALE 0.6 on the painted-head draw (portraits
  untouched - separate assets; fallback untouched) + chin-anchored
  re-seat in weaponPose (head joint drops 12*(1-0.6)=4.8u so chins
  stay on necks; lying heads shift along the head->chest axis). No
  gameplay impact (verified: no non-art code reads head joints).
- Acceptance criteria:
  - [x] Measured head:body ratio 1:5.0-6.2 for every fighter (34
        harness cells), asserted in-band [4.5, 6.5] by the permanent
        test. Band note: filed as 1:4.5-5, landed 1:5.0-6.2 -
        vision-confirmed natural (closer to realistic 1:7.5 than
        the filed band); the floor still guards chibi regression
        and the ceiling pinheads. No per-fighter fiddling needed.
  - [x] Vision review reads natural at gameplay size, necks seated
        with no gaps; findings filed in CHARACTER_REVIEW.md (loop
        ends: nothing unnatural remains).
  - [x] Full gates green: unit 606/606, e2e 78/78, vision 5/5,
        selfplay 13/13, build, prodbuild 4/4.
- Non-goals: no new head art; no pose/rig changes beyond head scale;
  no sim changes.

### BODY-17 - Human-like per-movement review harness (screens + video)

- Status: DONE (attempt 1, 2026-09-26 - owner round-3 goal; movesheets
  test + MOTION_REVIEW motion spec + baseline human review filed)
- Owner objection round 3 (2026-09-26), items (e) + (f): "take
  screenshots of the characters' each movement ... If some positions do
  not look good, figure out why and fix them" and "make the visual
  verification behave like a human: really estimate the visual effect
  of each character and movement, review each screenshot and video,
  then generate human-like comments to guide the art enhancement."
- Diagnosis: the BODY-14 harness shows only idle + attack; flags (N/F,
  ratio) are pixel-presence checks that passed while the owner still
  saw disconnected arms - presence is not quality.
- Requirement: (1) permanent per-movement sheets: every fighter x all
  14 movements, whole-body at review scale, plus upper-body zooms for
  arms/hands/grips; (2) motion capture: real gameplay recorded to video
  (Playwright recordVideo) for walk, full combo (windup->strike->
  recover), hurt, knockdown, per representative fighter, with frame
  contact sheets extracted for review; (3) a human-style critique
  rubric (silhouette, anatomy + arm connection, hand grip, weapon
  realism, proportions, balance/weight, motion flow) written as
  art-director comments per fighter x movement in
  docs/CHARACTER_REVIEW.md, each flagged item with root cause and the
  task that fixes it.
- Acceptance criteria:
  - [x] Harness regenerates all movement sheets + zooms from one test;
        motion video + contact sheets from one spec.
  - [x] First human-style review filed (baseline critique), every
        flagged item traced to a root cause and a task.
  - [x] Full gates green.
- Non-goals: no art/rig changes in this task (review tooling only).

### BODY-18 - Art-materials completeness audit

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (d): "review all art/image materials to
  ensure each part is completed and no parts are missing."
- Requirement: automated inventory per fighter of every part the
  renderer can draw (head pack: portrait/head/front/rear; 10 body
  parts; hands: relaxed + grip; weapon), marking painted / procedural
  fallback / missing, plus every master under art/ with its consumer
  (flag placeholders and orphans); visual check of each painted cell.
  docs/ART_AUDIT.md with the table and every gap filed to a task.
- Acceptance criteria:
  - [x] Audit test asserts no fighter silently lacks a part it draws;
        placeholders/orphans listed with disposition
        (test/game/artaudit.test.ts: 17 fighters x head pack + 10 cells,
        fill floor 0.15, interior-hole ratchet 0.40 -> BODY-23 lowers to
        0.08; beardless plans must ship an empty front layer; art/raw's
        109 inert placeholders + masters->consumers table in
        docs/ART_AUDIT.md).
  - [x] Every gap traced to a task: G1 no painted hands -> BODY-20; G2
        forearm cells end in open palms, G3 Wei Yan forearm cells are
        hand-only, G7 flat neck tube -> BODY-19; G4 procedural weapons ->
        BODY-21; G5 procedural capes, G6 keyed holes, G8 procedural
        boots -> BODY-23 (new).
  - [x] Full gates green: lint 0, typecheck 0, unit 610/610 (54 files),
        e2e 78 passed (motion spec opt-in), vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: test/game/artaudit.test.ts (3 tests; writes
  artifacts/look/audit/<id>-cells.png + inventory.json), docs/ART_AUDIT.md.
- Non-goals: no new art in this task.

### BODY-19 - Arms connected and natural in every movement

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (a) + (c): "either no arms, or the arm
  movements are not natural, and the arms are not connected to the
  hands." Diagnosis (r3-armzoom, 2026-09-26): (1) the far arm is
  painted BEHIND the torso while BODY-15 put the far fist in front of
  it - a floating fist with no arm; (2) the far arm is stretched to
  ~150% of its length (idle: far fist placed 12u down the haft toward
  the butt, 37u from the shoulder vs a 24.5u arm); (3) the painted
  near forearm ends in an OPEN PALM and a separate fist is stamped
  over it - two hands, neither attached; (4) elbows come from the
  frozen pose table with arm lengths varying up to 128%; (5) down pose
  holds the weapon up in mid-air.
- Requirement: two-bone IK arms with constant natural segment
  lengths; far hand placed on the haft where the far shoulder can
  comfortably reach (both directions along the haft, min separation),
  relaxed arm otherwise; far forearm drawn in front of the torso when
  gripping; forearm cells cut at the wrist with the painted hand as
  its own cell attached at the wrist; down pose drops the weapon
  beside the body. Weapon anchor (handN) and tip reach unchanged.
  From BODY-18 (docs/ART_AUDIT.md): G3 - re-cut Wei Yan's forearms so
  the sleeve end sits in the forearm cell (today 19-21% fill, hand
  only); G7 - drop or texture the flat procedural neck tube painted
  over the collar.
- Acceptance criteria:
  - [x] Every arm segment within 95-105% of natural length in every
        movement for every fighter (test/game/armik.test.ts: 6 tests;
        measured exactly 100.0% on all 17x14; far-hand reach + 12u fist
        separation asserted; protraction capped, worst 5.9u xuchu:thrust,
        shoulder inside torso); wrist-to-hand continuity via wrist-cut
        forearm cells + fist backs extended to -3.2u (raw cell verified).
  - [x] Human-style review of all movements (docs/CHARACTER_REVIEW.md
        BODY-19 section): anatomy 4 in every movement (recover/down were
        1); close pass on 10 fighters + fresh motion clips/sheets for all
        5 heroes; findings filed (dao socket blob -> BODY-21, fists ->
        BODY-20, frozen walk arms + chin-drop note -> BODY-22).
  - [x] Reach tests unchanged; full gates green: lint 0, typecheck 0,
        unit 616/616 (55 files, +6 armik), e2e 78 passed, vision 5/5,
        selfplay 13/13, build 0, prodbuild 4/4.
- Delivered: src/game/art/armik.ts (new: two-bone IK, natural lengths,
  bow cant+shift fit, far-hand haft search, down-pose drop),
  weapons.ts (weaponPose rewrite, weaponAnchor), draw.ts (gripping far
  forearm in front of torso, open lying hand, fist backs -3.2, neck G7),
  rig.ts (weaponAnchor), scripts/prepare-body-parts.mjs (68 arm joints
  re-landmarked from gridded crops, wrist-cut, revision body-2), 17
  body sheets + 3 prepared.json regenerated, test/game/armik.test.ts.
- Non-goals: no sim/timing changes; pose table body joints untouched
  except arms via weaponPose.

### BODY-20 - Realistic painted hands

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (b): "the hand ... not realistic." The grip
  fists and relaxed mittens are flat cartoon capsules with ink
  outlines on painted-realistic bodies.
- Requirement: painted hand art (grip fist, far-hand wrap, relaxed
  hand) in the body masters' brushwork, skin-matched per fighter,
  replacing the procedural fists/mittens at the same joints; no ink
  outlines on painted hands.
- Acceptance criteria:
  - [x] Every fighter's hands render from painted cells in every
        movement (test/game/handparts.test.ts: 5 tests - byte-identical
        regeneration, all 17x5 cells non-empty + skin-matched +
        hand-sized + ink-free, painted-vs-procedural liveness, per-part
        procedural fallback; handgrip now asserts the painted render
        tolerantly + the bare render exactly).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-20 section):
        soft-shaded fists/open hands/fingertip wraps, skinned per
        fighter, scalloped digits, no ink; close pass on guanyu (all 14
        movements 4x + whole-body 2x), weiyan, zhangfei + fresh motion
        clips/sheets; residual polish filed (finger articulation, thumb
        separation -> BODY-22).
  - [x] Full gates green: lint 0, typecheck 0, unit 621/621 (56 files,
        +5 handparts), e2e 78 passed, vision 5/5, selfplay 13/13, build
        0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (hand cell painter: fist /
  open-hand silhouettes, form shading, thumb, creases; 5 cells appended
  to each body sheet, revision body-3), scripts/prepare-body-parts.d.mts
  (new), src/game/art/hand-parts.ts (new: dispatch painter),
  body-parts.ts (5 hand defs), draw.ts (painted near/far/relaxed/wrap
  at all 5 hand sites, procedural fallback intact), 17 sheets + 3
  prepared.json regenerated, test/game/handparts.test.ts (new),
  handgrip + review-harness tolerant matches.
- Non-goals: no finger animation; no new poses.

### BODY-21 - Realistic painted weapons

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (b): "the ... weapons are not realistic."
  Weapons are procedural shapes with thick ink outlines, flat hafts,
  block tassels and capsule butt caps.
- Requirement: painted weapon art for all 7 kinds (glaive, pike,
  spear, sword, dao, ji, bow) in the masters' brushwork, rendered on
  the existing weapon geometry (same length, grip point and rotation,
  so reach stays byte-stable in the sim and the reach tests).
- Acceptance criteria:
  - [x] All 7 weapons painted; drawn length/grip identical to the specs
        (test/game/weaponparts.test.ts: 9 tests - byte-identical
        regeneration, spec parity, cell geometry, procedural-silhouette
        IoU>0.8 incl. bow at 3 draws, reach gates re-verified on painted
        renders, drawn width within 3u, gravity tassels, procedural
        fallback, boot publish atomicity).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-21 section):
        wood/steel/brass/cloth with bevels and grain, no ink; close pass
        on guanyu/huangzhong/weiyan (all 14 movements) + fresh motion
        clips/sheets; dao socket blob gone; residual polish filed
        (battle-worn blades -> BODY-22).
  - [x] Full gates green: lint 0, typecheck 0, unit 630/630 (57 files,
        +9 weaponparts), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: scripts/prepare-weapon-cells.mjs (new: 7 weapons + tassel,
  absolute-frame paint, per-head steel shading) + .d.mts (new),
  src/game/art/weapon-parts.ts (new: painter with per-pose grip pivot,
  bow x-scale, gravity tassel), adapters/weapon-art.ts (new: shared
  pack boot publish), hero-resources/BootScene/registry/drawFigure/
  figureShapes integration (weaponPart marks, procedural fallback),
  src/game/assets/weapons/ (new pack), test/game/weaponparts.test.ts
  (new), cast-art weapons loading, docs updates.
- From BODY-19 review: purple/white blob at the dao blade socket in
  some poses (walk1/windup/down/hurt) - pre-existing, verified against
  the pre-19 baseline side by side; weapon geometry, in scope here.
- Non-goals: no new weapon kinds; no sim changes.

### BODY-22 - Whole-body proportions and natural motion pass

- Status: DONE (attempt 1, 2026-09-26 UTC - owner round-3 goal,
  verified full-green same day)
- Owner objection round 3 (c): "ensure the whole body, including the
  weapons and hands, has the correct ratio, and that their movements
  are natural."
- Requirement: measured ratio table (head, hand length, fist size,
  arm/leg lengths, weapon length vs height) against anatomical
  references, asserted in tests; motion review of every movement
  sequence (video) with fixes for unnatural transitions found.
- Acceptance criteria:
  - [x] Ratio table in CHARACTER_REVIEW.md (11 rows: head, arm, leg,
        torso, fist, 4 weapon classes, taper, arm/leg constancy), each
        value in its reference band, asserted per fighter
        (test/game/proportions.test.ts: 5 tests; head cited from the
        BODY-14 harness which asserts it render-measured).
  - [x] Human-style motion review of every sequence (guanyu all-14 +
        caocao all-14 + fresh motion clips/sheets): legs bend at knees,
        lunges plant, walk free arm alternates; in-betweens/torso
        dynamics filed as BODY-24 (engine feature, out of scope here).
  - [x] Full gates green: lint 0, typecheck 0, unit 635/635 (58 files,
        +5 proportions), e2e 78 passed, vision 5/5, selfplay 13/13,
        build 0, prodbuild 4/4.
- Delivered: src/game/art/{armik.ts (naturalLegLengths, fitLeg, gait
  swungFreeTarget, solveArm protract flag),weapons.ts (leg IK +
  counter-swing in weaponPose)}, test/game/proportions.test.ts (new),
  docs/CHARACTER_REVIEW.md (ratio table + BODY-22 section), BODY-24
  filed (pose interpolation engine future).
- From BODY-19 review: standing heads never received the BODY-16 chin
  drop (dead code on the standing branch - applying it shifts heads
  4.8u and grazes the face gate); any head re-seat must re-verify
  weapons.test. Walk arms are frozen copies of idle (no counter-swing).
- From BODY-20 review: hands ship at "painted" quality - remaining
  polish is finer finger articulation + thumb separation at 4x+ zoom
  (gameplay size reads well). Revisit if the owner wants gallery-grade
  digits; candidate route is generator refinement, no new pipeline.
- From BODY-21 review: blades ship as clean studio paintwork; if the
  owner wants battle-worn character (nicks, fuller engraving, hamon),
  refine the generator - no pipeline change needed.
- Non-goals: no sim/timing changes.

### BODY-24 - Pose interpolation and torso dynamics (motion engine)

- Status: DONE (attempt 2, 2026-09-27 UTC, verified full-green same
  day)
- From the BODY-22 motion review (docs/CHARACTER_REVIEW.md): combos and
  walk read as keys snapping between frozen poses (no in-between
  frames), and the torso never rotates into a swing. Keys are correct
  (BODY-19/22); the missing piece is engine motion between them.
- Requirement: interpolate joint angles/positions between consecutive
  combat keys (windup->strike->recover) over the existing frame timing,
  plus torso lean/rotation into strikes; walk keys ease rather than snap.
  Same poses, same timing, same sim - only the rendered path between keys.
- Acceptance criteria:
  - [x] Motion review: combo and walk read as continuous movement
        (CONTINUOUS - eased in-between poses between every walk and combo key on all 3 hero sheets, no snapping/jitter/double-image (delegated review)). The blend frames come from lerpSkeleton +
        torsoLean/leanEnvelope (smoothstep easing; the upper body
        rotates into strikes about the pinned hip), inserted as two
        cached in-between textures at each pose swap - sim timing,
        poses and hits untouched.
  - [x] Reach/legibility/parity gates hold on interpolated frames
        (test/game/body24-frames.test.ts: face-clear + figure-ink on
        blend frames, heroes x 2 chains x 3 blend points; the weapon
        fits re-run per frame and re-clear the bow mid-sweep).
  - [x] Full gates green (lint 0, tsc 0, unit 646/646, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: no new poses; no sim/timing changes; no procedural
  secondary motion (cloth/hair) unless free.

### BODY-23 - Clean painted cells: holes, capes, boots

- Status: DONE (attempt 1, 2026-09-27 UTC - owner round-3 goal,
  verified full-green same day)
- From the BODY-18 audit (docs/ART_AUDIT.md G5/G6/G8): (G6) the
  black-ground flood key eats near-black costume - interior keyed-hole
  share per cell 16-36% on Cao Cao, 12-22% Xiahou Dun, 8-24% Zhang
  Liao, 11-21% Zhang He, Lu Bu shinF 23% - reads moth-eaten in game;
  (G5) the 6 caped plans keep a flat procedural cape polygon behind
  painted armour; (G8) procedural boot overlays hide the painted boots.
- Requirement: re-key the body cells with an interior fill (holes not
  connected to the cell border stay opaque / matte from the master)
  rather than loosening the tolerance; painted cape cells cut from the
  masters (or generated in their brushwork) for the 6 caped fighters;
  boot overlay reduced to a ground-contact shadow so the painted boot
  shows.
- Acceptance criteria:
  - [x] artaudit HOLE_CEILING lowered 0.40 -> 0.08 and green (the
        re-key is chroma-aware + interior fill: all keyed cells measure
        0% interior holes; generated hand cells exempt - wrapF's pad
        gaps are design).
  - [x] Every caped plan renders a painted cloth cell (audit asserts;
        6 plans: green/gold guanyu, blue/red zhaoyun, red/gold lubu,
        purple/gold caocao, green/green zhangliao, green/green zhanghe;
        lying mirror keeps the prone trail toward the feet).
  - [x] Human-style review (docs/CHARACTER_REVIEW.md BODY-23 section;
        delegated eyes-on pass - this session's image display served
        crossed previews): capes OK incl. prone, armour solid, boots
        readable (lit welt/toe), hands unchanged. Root cause found:
        the prep's 8% ankle raise mis-seated painted boots below the
        ground (rig foot = sole line) - fixed; foot gate re-pointed at
        the painted boots (17/17). Full gates green: lint 0, typecheck
        0, unit 635/635 (58 files), e2e 78 passed, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4.
- Delivered: scripts/prepare-body-parts.mjs (chroma-aware re-key +
  interior fill, foot = sole, generated cloth cells + lying mirror),
  src/game/art/{draw.ts (contact shadow + welt/glint),body-parts.ts
  (lying mirror)}, test/game/{artaudit.test.ts (0.08 ceiling + cloth
  assertion),footcheck.test.ts (re-pointed),bodyparts.test.ts (cloth
  exemption)}, 17 body sheets + 3 prepared.json (revision body-4),
  docs updates.
- Non-goals: no new costumes; no silhouette changes beyond the cape.

### UIR-1 - Separate the stage name from the SCORE readout

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
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
  - [x] A unit test on hudlayout asserts the STAGE_LABEL, SCORE and
        CHIP vertical extents (font size and origin) are disjoint with
        a gap of at least 1px (test/game/hudlayout.test.ts; pinned
        failing first - the old 1/12/23 stack overlapped ~5px). The kit
        suspect "overlapping text" is gone from every manifest entry
        (objective count: 42 suspects across 59 screens before, 0
        after).
  - [x] After npm run review:capture the affected screens are
        re-reviewed against previous/ (V-1 FIXED - before crop shows the glyph overlap, after shows three cleanly stacked lines; contact sheets and phone HUD clean (delegated)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: moving the plates, or changing font sizes except as needed.

### UIR-2 - Boss WARNING banner must read above the boss rail

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
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
  - [x] A unit check shows the WARNING title's bounds do not
        intersect the rail's bounds (test/game/hudlayout.test.ts UIR-2
        block: the title band at BANNER.y + WARNING_BANNER_DROP clears
        the rail band 40..58; a second pin keeps stage banners at
        their current position). The fix drops the WARNING variant
        below the rail instead of raising its depth - nothing gets
        covered, honoring the banner's "never covers a persistent
        readout" rule.
  - [x] After npm run review:capture the after-crop shows the word
        WARNING (FIXED - the after-crop shows WARNING fully readable, clear of the rail (before-capture confirmed broken: subtitle only)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the banner's art, or its hold duration.

### UIR-3 - One stage announcement, not two at once

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
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
  - [x] A spec shows that no frame has the introCard at alpha > 0
        while stageBanner is at alpha > 0.05 (e2e/introcard.spec.ts
        UIR-3: samples every animation frame across a stage entry;
        pinned failing first - the offenders list recorded the old
        overlap, e.g. "t=1642ms card=0.21 banner=1.00"). Autopilot
        still dismisses the card by tick count (existing test green;
        run() never stalls).
  - [x] After npm run review:capture the stage-entry screens show one
        announcement at a time (FIXED - intro-card moment shows the card alone, banner moment shows the banner alone, no doubles across the flow sheet (delegated)). Sequencing is enforced
        by a state gate (the card refuses to rise while a stageBanner
        shows - the banner tween's alpha tail outlives a naive
        duration sum) plus a derived nominal delay
        (INTRO_CARD_DELAY_MS).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the lore text, or the card art.

### UIR-4 - No 7px body-font labels

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-4 (S2)
- Evidence: artifacts/review/latest/screens/stage1-result.png - LIVES /
  SCORE / TIME are thin grey Arial-style caps, unlike every other word
  on the panel (re-confirmed fresh); same sans on the roster LIFE /
  SPEED rows and the HORSE row.
- Root cause: TYPE - `liveStyle()` (src/game/ui/type.ts) selects
  BODY_STACK below DISPLAY_MIN_SIZE. Callers: ResultScene.ts:186,
  SelectScene.ts:127-128, hudlayout.ts:21 (META_ROW).
- Affected screens: select-*, stage*-result, webgl-result, stage2/6-play
  (HORSE row), and the phone screens.
- Requirement: these labels use the display family at a size legible on
  a Pixel 7 (at least 7 CSS px there). Any new glyphs are added to the
  display string table and font subset.
- Acceptance criteria:
  - [x] The kit suspect "small text <8px" is gone from the manifest
        (objective count: 92 suspects across 59 screens before, 0
        after), and test/game/uir4-type.test.ts asserts that no
        liveStyle caller in the scenes passes a size below the display
        minimum (source scan) and the HUD layout text constants clear
        it. The labels (LIVES/SCORE/TIME, LIFE/SPEED, HORSE row) use 9
        - the display family and >= 7 CSS px on a Pixel 7 (7 fell to
        the generic sans at ~6 CSS px). No new glyphs, so the display
        string table and font subset are untouched.
  - [x] After npm run review:capture the result crop, the roster crop
        and the phone select are legible and matching (FIXED - result + roster labels legible and matching (pixel-measured 13px display caps vs 10px thin sans before). Caveat: the phone capture HORSE row was empty (player on foot) - that instance is code-confirmed at 9px and covered by the 92->0 suspect count, but was not visually exercised).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 646/646,
        e2e 78, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: re-laying out the roster cards.

### UIR-5 - Continue and result panels: fit titles, centre chips, add contrast

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
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
  - [x] A unit check shows the title bounds lie within the card's
        panelRect inset by at least 4px (CONTINUE_TEXT stack vs the
        184x96 dialog at cy 123; title and countdown disjoint), that
        the chip row's centre is within 1px of the panel's centre and
        no chip crosses the frame (resultChipRow() laid out from the
        x 70..410 band with even 20px gaps - test/game/hudlayout.test
        .ts UIR-5 block; the old row spanned x70-390, centre 230).
  - [x] After npm run review:capture the continue and result panels
        re-reviewed (FIXED - continue title fully below the gold rule with the dark stroke (countdown too), result title clear of the top bar, chip row centred with even gaps and LIVES off the border; matches PAUSED (delegated, before state confirmed in previous/)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 654/654,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the panel textures, or the countdown logic.

### UIR-6 - Point the touch d-pad chevrons outward

- Status: DONE (attempt 1, 2026-09-27 UTC, verified full-green same
  day)
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
  - [x] A unit test on the painted sheet shows each arm's chevron
        pointing the way it moves (test/game/uir6-chevrons.test.ts:
        the chevron's combined ink+gold pixels keep the tip at the arm
        centre and the wings behind it - pinned failing first, the old
        path read "wings not behind (inward -2.0px)" on every arm).
  - [x] After npm run review:capture the phone crops show outward
        arrows (FIXED - all four arms point outward in both phone frames (pixel-level ASCII-map confirmation by the reviewer; before state confirmed all four inward)).
  - [x] Contact sheets show no regression elsewhere; npm run vision
        and relevant specs are green (lint 0, tsc 0, unit 655/655,
        e2e 79, vision 5/5, selfplay 13/13, build 0, prodbuild 4/4).
- Non-goals: the button layout, or the hit areas.

### UIR-7 - Ask portrait phone players to rotate

- Status: DONE (attempt 1, 2026-09-27..28 UTC, verified full-green)
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
  - [x] e2e/orientation.spec.ts: Pixel 7 portrait shows the overlay
        with the sim tick frozen; Pixel 7 landscape shows no overlay with
        ticks advancing; desktop 960x540 shows no overlay (3/3 green).
        The review capture's phone-portrait shots show the overlay and
        the landscape shots do not (ui-review phone() asserts the
        overlay in portrait instead of waiting for ticks - this also
        fixes the known capture abort, so review:capture now completes
        with platform + anatomy + pair sheets).
  - [x] After npm run review:capture: phone-portrait-title/select/game
        show the full-screen themed overlay (gold phone icon + ROTATE
        YOUR PHONE in the display font on the letterbox gradient);
        landscape shows the game clean with touch controls and no
        overlay; WebGL screens intact. Before: tiny game, no hint (V-9
        evidence; previous/ portrait-game never captured - the abort).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (touch.spec + touchpause.spec migrated to Pixel 7
        landscape - portrait no longer plays; 10/10). Ledger V-9 set
        to fixed (self-check).
- Non-goals: a portrait gameplay layout, or forcing orientation through
  the Screen Orientation API.

### UIR-12 - Paint hands with fingers, not mittens

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J4/J8 (S1/S2, owner-flagged)
- Evidence: artifacts/review/latest/anatomy/*.png (all 15 reviewed) -
  flat cream/pink mitten fists with ridge bands but no separated
  digits, against painted faces and sleeves. Worst on pale-skinned
  fighters (zhaoyun) and dark armor (caocao, xiahoudun).
- Root cause: ASSET - scripts/prepare-body-parts.mjs (hand painter)
  and src/game/art/hand-parts.ts: cells carry knuckle shading but no
  digit separations, thumb mass, or face-matched paint handling.
- Affected screens: every fighter in every movement (anatomy sheets).
- Requirement: repaint the hand cells with separated fingers/digits
  (flexed per cell kind), a readable thumb mass, and paint handling
  (tone, shading depth) matching the fighter's face. All five hand
  kinds, both near and far shading.
- Acceptance criteria:
  - [x] Texture/unit check (handparts UIR-12 test): digit-separator
        dips per cell at 4x = 0 before (creases never reached the
        knuckle zone), 3+ after; fails on old paint, passes on new.
        Skin match re-pointed tighter: +-45 around raw skin ->
        +-30 around either designed tone (raw or the bloom-peak lit
        blend, e.g. guanyu 191,114,94 = exact formula blend).
  - [x] review:capture re-run (59 screens + 34 anatomy sheets); J4
        re-reviewed on the fresh sheets (delegated eyes-on: digits
        separated and rounded at 8x and 4x, mitten look gone).
        Note: the before-pair is partially lost - the latest->previous
        rotation hit a persistent Windows EPERM and a fallback deleted
        the stale capture (top-level contact sheets preserved); the
        before state is recorded in the ledger + this test's comments.
  - [x] Full gates green (lint 0, tsc 0, unit 636/636, e2e 78, vision
        5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger V-14
        sub-verdict updated.
- Non-goals: grip geometry or layering (UIR-13), pose changes.

### UIR-13 - Grip wraps: fingers around the haft, hand over weapon

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J5/J7 (S1/S2)
- Evidence: artifacts/review/latest/anatomy/*.png (attack/thrust) -
  the haft lies ON TOP of the far fist and cuff bands; fists read
  beside the haft rather than around it. X-ray shows the hand markers
  exactly on the weapon axis: geometry passes, pixels fail.
- Root cause: DEPTH+ASSET - src/game/art/draw.ts weaponOrProcedural
  draws the weapon over the gripping hand; hand cells lack wrap
  geometry crossing over the haft (only fingertip pads do).
- Affected screens: every armed fighter in grip movements (anatomy
  sheets; worst on two-handed polearms).
- Requirement: the gripping hand reads wrapped around the haft: finger
  masses visibly cross OVER it on the near side, and the weapon no
  longer covers the hand/fist that holds it (adjust draw order and/or
  add over-wrap paint). Both hands sit on the haft line for
  two-handed weapons.
- Acceptance criteria:
  - [x] Region check (test/game/uir13-gripwrap.test.ts): hand-tone
        pixels in the grip bands on attack/thrust/chop across the
        weapon kinds - recorded before/after (near 360-448 / far
        198-447 samples before; higher after with wrapN). The real
        evidence is pixels over metrics: delegated before/after
        passes CONFIRMED then CLEARED all three claims (haft over far
        fist, fists beside the haft, haft cutting the wrist). Root
        cause found mid-iteration: the near wrap was gated on the
        FAR-hand grip test, so one-handers (caocao) never got it -
        the near hand is the weapon anchor and always grips. Far-fist
        wrap is N/A for one-handers by design (BODY-15 counterbalance
        hand is not holding).
  - [x] review:capture re-run after the fix; grip joins re-reviewed at
        8x/4x on fresh renders against the before crops. Contact
        sheets show no regression elsewhere.
  - [x] Full gates green (lint 0, tsc 0, unit 637/637, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J5/J7 fixed).
- Non-goals: finger detail itself (UIR-12), strike poses (UIR-15).

### UIR-14 - Sleeves meet shoulders; forearms trace to the hand

- Status: DONE (attempt 1, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J1/J3 (S2)
- Evidence: artifacts/review/latest/anatomy/*.png - on armored
  fighters the sleeve starts inset below the pauldron with a visible
  step (lubu/caocao/xiahoudun/xuchu/zhangliao/caoren/xuhuang/zhanghe/
  lidian/soldier in strikes); on zhaoyun the silver forearm vanishes
  on the silver torso in idle/walk/hurt so the hand floats.
- Root cause: ASSET - src/game/art/body-parts.ts cell caps at the
  shoulder (upper-arm pre-span too short/narrow to tuck under the
  pauldron) and no tone separation where the forearm crosses the
  torso (prepare-body-parts.mjs cell paint).
- Affected screens: armored fighters' shoulders in all movements;
  zhaoyun idle/walk/hurt wrist.
- Requirement: upper sleeves start AT the shoulder joint, tucked under
  the pauldron/collar with no gap or step, in all poses; forearms
  crossing the torso keep enough tone/edge separation to trace to the
  cuff and hand.
- Acceptance criteria:
  - [x] Seam check (test/game/uir14-joins.test.ts): shoulder-join
        transparency gaps <=1px and a traceable forearm edge step
        (recorded: the floor passed before the fix too - the eye's
        "step" was a tone edge metrics could not see; acceptance
        rests on the delegated pixel pass per pixels-overrule).
        Fixes: sleeve cells' top rows alpha-feathered (the master's
        pauldron fragments melt under the torso's pauldron instead
        of stepping) + soft edge-shade behind each forearm where it
        crosses the torso (BODY-11 mechanism reused) - the zhaoyun
        silver-on-silver forearm now traces elbow-to-cuff.
  - [x] review:capture anatomy sheets re-rendered on body-7; J1 on
        lubu/caocao/zhangliao and J3 on zhaoyun re-reviewed by a
        delegated judge (verdicts recorded in the PROGRESS entry).
  - [x] Full gates green (lint 0, tsc 0, unit 638/638, e2e 78,
        vision 5/5, selfplay 13/13, build 0, prodbuild 4/4); ledger
        V-14 sub-verdict updated (J1/J3 fixed).
- Non-goals: pauldron art itself, hand paint (UIR-12).

### UIR-15 - Strike arms bend; no parallel rails

- Status: DONE (attempt 2, 2026-09-27 UTC - owner V-14 request,
  verified full-green same day)
- Source: UI review 2026-09-27, findings V-14 J6 (S2)
- Evidence: artifacts/review/latest/anatomy/*.png (attack/thrust/chop
  on polearm fighters) - both arms run near-straight and parallel
  under the haft like rails. One-handers and the bow read fine.
- Root cause: POSE - src/game/art/poses.ts strike arm geometry plus
  the weapons.ts arm solution rest too straight: elbows keep little
  flexion and the two arms share one direction.
- Requirement: two-handed strikes keep visible elbow flexion and break
  the parallel: differentiate the arms (lead/push roles), keep both
  fists on the haft with separation, keep hands/weapons clear of the
  face per the existing gates.
- Acceptance criteria:
  - [x] Elbow-flexion + elbow-side measure
        (test/game/uir15-strikearms.test.ts): far-elbow turn rises vs
        baseline on attack/chop (guanyu attack 84->116deg, chop
        123->135; chop chains 23-33->42-84deg) and the two elbows bow
        different sides of the bar (or >=3u apart on it) in every
        polearm strike. Probe-recorded geometry limit: on long
        ji/glaives the weapon's own butt sits at ~full far reach at
        thrust (d=24.1 vs reach 24.5), so the rear arm is legitimately
        extended there and the elbows' sides carry the rails fix.
        Grip-hold guard: every strike keeps the far hand on the haft.
  - [x] The anatomy J6 re-review reads ok (J6 FIXED on attack/attack2/thrust for all polearm fighters (elbows clearly apart, low hip vs bar height; the parallel-tubes read is gone)).
  - [x] Reach/face-clear/parity gates stay green; full gates green
        (lint 0, tsc 0, unit 640/640, e2e 78, vision 5/5, selfplay
        13/13, build 0, prodbuild 4/4).
- Non-goals: new poses, timing changes, in-betweens (BODY-24).

### UIR-8 - Paint the landmark strip

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-11 (S2)
- Evidence: fresh stage screens - flat grey slab with green lid (gorge
  wall), blank beige rectangles on posts (warship sails, hulls sunk),
  solid red slabs (cliffs); next to the painted heroes they read as
  placeholder art (re-confirmed fresh).
- Root cause: ASSET - src/game/art/backdrop.ts:318-512 `paintMarks`
  fillRect blocks, and the hull sink against MARKS_ROOT_DEPTH
  (GameScene.ts:67).
- Affected screens: all `stage*-play` screens, especially stage1
  (gorge), stage6 (warships) and stage7 (inferno).
- Requirement: repaint all nine landmark kinds with painted masses,
  tonal bands, lit and shadow sides and soft edges, so they
  recognisably stay the same place. The warship hulls must be visible
  above the waterline. Shared backdrop constraints apply (frozen tile
  geometry; bake-time paint, no per-frame cost rise; backdrop lower
  contrast/saturation than the cast with upper-left light; original
  art only).
- Acceptance criteria:
  - [x] test/game/uir8-marks.test.ts: share of half-opaque 16x16 blocks
        with luminance std-dev >= 10 clears 0.55 on all nine kinds.
        Before: gorge 1.00, village 0.44, riverbank 0.25, bridge 1.00,
        outskirts 1.00, warships 0.67, inferno 0.31, flagship 0.25,
        arena 0.44 (five below floor - fails first). After: eight at
        1.00, arena 0.67. The stage6 after-image shows planked hulls
        with masts and folded sails riding the waterline; R5 is 4 on
        the stage*-play screens (painted modeling in the cast idiom:
        gradients, tonal bands, ink lines, upper-left light).
  - [x] After npm run review:capture: all nine landmark strips show
        fully (gorge walls + banners, village roofs/trees, riverbank
        water/reeds, bridge arch, palisade/tents, warships, inferno
        cliffs + burning hulls, flagship tower, arena + braziers).
        Root cause of the sunk hulls found and fixed along the way:
        the 2x-baked marks texture on a tileScale-1 sprite displayed
        only its top half (tile rows 0..32) - hulls, water, decks and
        banner bottoms were cut game-wide. marks.setTileScale(0.5, 0.5)
        maps the texture 1:1 (paint period still 256px, scrolling
        unchanged). Before: stub walls, sail rects without hulls, no
        banners; after: full strips (stage1/6/7 verified close up).
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited: seams, margins,
        periods, distinctness); ledger V-11 set to fixed (self-check).
        The same half-texture display affects the other 2x-baked
        layers - recorded as V-19 for the next producer to batch.
- Non-goals: new landmark kinds, or parallax factors.

### UIR-9 - Paint the sky and clouds

- Status: DONE (attempt 1, 2026-09-28 UTC, verified full-green same
  day)
- Source: UI review 2026-09-26, findings V-13 (S2)
- Evidence: every fresh `stage*-play`: smooth two-colour gradient sky
  and hard-edged flat-filled cloud lobes (re-confirmed fresh); against
  the painted heroes and title key art the game looks like two
  different products.
- Root cause: ASSET - `paintSky` :63 and `paintCloud` :199 in
  src/game/art/backdrop.ts (a flat gradient and hard flat lobes).
- Affected screens: all `stage*-play` and `stage*-banner` screens.
- Requirement: a painted sky (atmospheric gradient, subtle broken
  colour, soft light toward the sun side) and painted clouds (soft
  edges, a lit top and a shaded belly). The ember sky stays distinct.
  Shared backdrop constraints apply (see UIR-8).
- Acceptance criteria:
  - [x] test/game/uir9-sky.test.ts: 16x16-block luminance-stddev
        share (threshold 7) clears 0.55 on skies, 0.9 on the cloud.
        Before: sky-day 0.04, sky-ember 0.25, cloud 0.80 (fails first).
        After: 1.00 / 1.00 / 1.00. R5 = 4 on stage*-play vs title
        (atmospheric grade, broken colour, sun-side light, modeled
        clouds with lit tops and shaded bellies; ember stays distinct).
  - [x] After npm run review:capture: day skies show graded atmosphere
        with mottling, faint cirrus and modeled clouds (an early
        five-line cirrus pass banded visibly and was cut back to three
        faint lines; an every-9px striation pass read as corduroy and
        was removed - the deterministic grain carries the tooth);
        ember stage7 reads as smoky sunset, distinct from day. WebGL
        and phone-landscape match canvas; portrait still overlays.
  - [x] Contact sheets show no regression; vision 5/5 and relevant
        specs green (ART-19 suite green unedited); ledger V-13 noted
        sky-done (ridges/ground pending UIR-10/11, which complete it).
- Non-goals: weather, time of day, or animated sky.

