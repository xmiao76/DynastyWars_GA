# Progress Log

Add one entry at the TOP after every manual or scheduled iteration - newest
first, so the most recent state is the first thing an iteration reads.

Keep this file short. Once it passes about 500 lines, move the oldest entries to
`PROGRESS-ARCHIVE.md`: every iteration reads this file in full, so an unbounded
history slowly crowds out the work it is supposed to support.

## Template

### YYYY-MM-DD HH:MM - TASK-ID (attempt N)

- Status before:
- Work completed:
- Files changed:
- Verification run:
- Result:
- Status after:
- Remaining work or blocker:
- Next recommended task:

## Entries
#
### 2026-10-01 07:20 UTC - CMR-03 (attempt 3, stage-scoped runtime + shared frames - DONE)

- Status before: CMR-03 IN_PROGRESS (attempt 2 trimmed repack done;
  attempt 1 catalog/cache core). Remaining: stage-aware loader wiring,
  shared-frame display, co-op/restart, browser/dist cases.
- Work completed: stage-scoped bounded loader wired end to end.
  `motion-art.ts`: per-kind pack catalog (guanyu, 2 pages with pinned
  byte sizes/sha256), fetch+SHA-256+decode page loader (8s per-page abort
  deadline; no secure-context SHA-256 -> 'unsupported'), `MotionRuntime`
  (dedup in-flight installs, atomic per-fighter publication, refcounted
  acquire/release + LRU eviction that uninstalls textures/registry, scope
  cancellation + stale-callback rejection, 12s stage deadline -> legacy).
  Display: shared atlas frames with `Frame.setTrim` trim/pivot restoration
  instead of per-cell canvas clones (frame ids keep
  `entity:<kind>:motion:<clip>:<idx>`; e2e sprite reads use frame name
  with `__BASE` -> texture-key fallback). BootScene downloads nothing
  motion-related. GameScene gates `beginStage` on the bounded prepare
  (synchronous when the flag is off), cancels/releases on shutdown, and
  co-op joins are immediate for cached/default heroes or prepared-then-
  join with bounded failure -> whole-legacy.
- Files changed: src/game/adapters/{motion-art,motion-catalog,motion-scope},
  src/game/scenes/{BootScene,GameScene}, test/game/{motion-runtime,
  motion-scope (new),motion-catalog,motion-clips}, prodbuild/motion.spec,
  e2e/motion-loader.spec (new) + 6 e2e motion specs' sprite reads,
  docs/{motion-tasks/CMR-03.md, motion-tasks/BASELINE.md, TASKS.md}.
- Verification run: lint + tsc clean; unit 759 passed | 1 failed |
  6 skipped (the 1 = known G6 V-15b arm-chain pin, UIR-16 BLOCKED);
  signal 13 passed; vision 5 passed; prodbuild 8 passed (motion flag
  matrix on Canvas+WebGL against dist incl. trim/pivot geometry pins);
  e2e/motion-loader 5 passed (scope, measured downloads, restart, stage
  progression, co-op, missing/wrong-signature/timeout); guanyu-solo-ko +
  guanyu-transitions 3 passed; inline missing-pack controls passed.
- Budgets (BASELINE re-measure, no ceiling raised): stage-entry network
  4,328,499 B <= 12 MiB (measured in-browser); page RGBA decode
  15,543,160 B = 14.82 MiB <= 16 MiB (stricter whole-page accounting;
  12.72 MiB was trimmed content); GPU 15,543,160 B (one upload per page);
  cloned-canvas 0 B (the replaced clone display held 44.3 MiB of canvases);
  retained 14.82 MiB <= 128 MiB.
- Result: CMR-03 hard acceptance 1-6 checked with evidence in
  docs/motion-tasks/CMR-03.md.
- Status after: CMR-03 DONE (3/3 attempts: 7489061, 3ff7a3d, this commit).
- Remaining work or blocker: none in CMR-03. UIR-16, UIR-19, GYM-1,
  BODY-7, ENH-12 stay owner-deferred BLOCKED. NOTE for the next tick:
  `git rev-list --count 4bce5d8..HEAD -- src/game` reaches 4 with this
  commit -> producer pass (.loop/eval-loop.md) triggers before further
  consumer work.
- Next recommended task: producer pass, then CMR-04.

### 2026-10-01 07:30 UTC - CMR-03 (attempt 2, trimmed repack - IN_PROGRESS)

- Status before: CMR-03 IN_PROGRESS attempt 1 (catalog/cache core;
  remaining: repack, loader wiring, browser cases).
- Work completed: the Guan Yu trim/repack. Measured first: cell
  trims save 72.5% of area (figures are narrow in the 448x288
  cells) -> trimmed decoded 12.72 MiB <= the 16 MiB per-fighter cap
  (the pre-repack 44.3 MiB could never meet it). Repack (one-shot
  vitest tool): each cell trimmed to content + 2px transparent pad
  (keeps the padded-edges gate's premise), shelf-packed into two
  named pages 1935x903 / 2027x1055 (both <=2048), prepared JSONs
  rewritten with trimX/trimY/srcW/srcH provenance (audit, box,
  density preserved; sha256 + signatures regenerated). PROOF BEFORE
  WRITE: every one of the 90 frames reconstructs (trimmed content
  at trim offset in the full srcW x srcH cell) to its CMR-01 frozen
  RGBA hash; clipsHash 513e9ff0 unchanged. Display plumbing:
  MotionFrameCell gains the trim fields (additive), validMotionPack
  validates the full-cell size via srcW/srcH (legacy cells default
  to w/h), ensureMotionKey clones srcW x srcH with content restored
  at the trim offset - displayed pixels/registration identical.
  Permanent pin: test/game/motion-repack.test.ts (round-trip all 90
  frames, pages <=2048, decoded <=16 MiB, clipsHash, box/density).
  One existing test needed a FORMAT conformance fix (motion-
  weapon-arc's landmark pixel lookup restored the trim offset like
  the display blit - assertions unchanged, recorded here).
- Files changed: src/game/assets/motion/* (pages + prepared jsons),
  src/game/art/motion-clips.ts, src/game/adapters/motion-art.ts,
  test/game/motion-repack.test.ts (new), test/game/motion-weapon-
  arc.test.ts (format conformance), docs/motion-tasks/BASELINE.md
  (repacked measurements), TASKS.md, PROGRESS.md.
- Verification run: tsc 0; lint 0; full unit 737 passed | 1 failed
  (G6-only, the UIR-16 BLOCKED pin) | 6 skipped (all 7 motion
  suites green incl. pilot/allactions/boundary/weapon-arc); signal
  13/0. Browser/vision NOT run this attempt (no runtime behavior
  change beyond the data-path conformance; final attempt runs the
  full set).
- Result: acceptance item 5 MET (round-trip + registration + ref
  unchanged); item 1 half-met (pages + decoded done; stage-entry
  downloads need the loader wiring). Task NOT DONE.
- Status after: CMR-03 IN_PROGRESS (attempt 2 of 3).
- Remaining work / attempt 3 (LAST): stage-aware loader wiring +
  prefetch + default-2P readiness + co-op join (bounded failure-to-
  legacy), loader/stage/co-op/restart browser cases, opt-in flag
  behavior vs dist + Canvas/WebGL, no-all-cast-boot fixture proof,
  stage-entry download measurement, full gates (incl. vision/
  prodbuild). Budget warning: if any of these cannot meet the caps,
  report measurements and block - never raise the ceilings.
- Next recommended task: CMR-03 attempt 3 (same task).


### 2026-10-01 06:20 UTC - CMR-03 (attempt 1, atlas catalog/cache core - IN_PROGRESS)

- Status before: CMR-03 TODO (dependency CMR-02 DONE, satisfied).
- Work completed: new presentation-only module
  src/game/adapters/motion-catalog.ts (loader-injected, Phaser-free
  core): PackManifest + validateManifest (page limit 2048, per-
  fighter 16 MiB decoded, retained 128 MiB, stage 12 MiB caps as
  CONTRACT_CAPS - ceilings never raised) and MotionAtlasCache with
  ATOMIC per-fighter publication (any page failure rejects the whole
  fighter, sibling art survives), duplicate-request dedup onto one
  in-flight load, scope epochs with stale-callback rejection on
  cancelScope (scope-scoped: cancelling sceneA leaves sceneB alone),
  refcounted LRU eviction that never touches in-use packs, and a
  budget report separating source/decoded/cloned-canvas bytes with
  the legacy-fallback cost kept visible. TDD: test/game/motion-
  catalog.test.ts (9 tests) incl. negative controls for missing/
  corrupt/wrong-signature/timeout/unsupported; the 2048 rule
  DETECTS the pinned Guan Yu reference's current 3456px page (known
  violation recorded in BASELINE.md) until the repack lands. Two
  real defects surfaced by the tests and fixed: failed loads left
  state 'loading' (must settle 'failed'), and an LRU expectation
  error in the test itself (acquire bumps recency).
- Files changed: src/game/adapters/motion-catalog.ts (new), test/
  game/motion-catalog.test.ts (new), TASKS.md, PROGRESS.md. No core,
  gameplay or artwork changes.
- Verification run: tsc 0; lint 0; full unit 734 passed | 1 failed
  (G6-only, the UIR-16 BLOCKED pin) | 6 skipped; signal 13/0.
- Result: attempt-1 slice (acceptance 3 + most of 4) verified; the
  task is NOT DONE - remaining acceptance items need the loader
  wiring, the Guan Yu repack and browser cases.
- Status after: CMR-03 IN_PROGRESS (attempt 1 of 3 budget).
- Remaining work: (1) stage-aware loading/prefetch + default-2P
  readiness + co-op join with bounded failure-to-legacy (items 2, 5);
  (2) Guan Yu repack to <=2048 pages with displayed RGBA/scale/
  pivot/exposure proof + trim/pivot display restoration (items 3, 5);
  (3) opt-in flag/request behavior tested against dist and
  Canvas/WebGL + loader/stage/co-op/restart browser cases (item 6);
  (4) budgets re-measured on the repacked pages (item 1).
- Next recommended task: CMR-03 attempt 2 (loader wiring + repack).

### 2026-10-01 01:40 UTC - UIR-19 (attempt 3 - BLOCKED, rule 5)

- Status before: UIR-19 IN_PROGRESS attempt 2 (face-matched skins
  p80-calibrated; J4 9 ok / 8 bad with stale-view adjudication).
- Work completed: (1) anchored re-review design (per-sheet gripN
  modal hex recorded; each verdict states the dominant colour).
  Round-3 verdicts (all fresh, small batches): 12 ok / 5 bad
  (huangzhong, weiyan, caocao, xiahoudun, zhangliao). (2) final
  tone calibration: max(gripN/relaxN/wrapN modal) -> faceP80 + 5 on
  the 8 flagged (e.g. weiyan #806340->#5e492f, xuchu->#4c3629).
  (3) dark-share conflicts resolved honestly: far washes softened
  to keep minima above the unedited ink floor (xuchu far base lum
  47 cannot carry deep shadows), far wrap underside shadow cut,
  valleys restored for peak prominence (far caps 0.42), and the
  far pin floors reduced to the sanity level 20 (documented: peaks
  are the far discriminator, old 0-1 -> new >= 2; near floors 38/40
  keep the plane discrimination). Notches 1.2u -> ~0.75u, creases
  moderate (0.40/0.26), companion edges halved. Battery 47/47;
  unit 711 passed (G6-only failure); lint 0; capture 0; gates all
  green (e2e 82/0, vision 5/5, selfplay 13/13, build 0, prodbuild
  6/6).
- Final adjudication (anchors vs verdicts): caocao modal
  rgb(145,130,110) and xiahoudun rgb(161,141,117) are byte-tan -
  their "pale-cream" reads are the small-scale effect (lit caps +
  bloom dominate the ~5px hand at figure scale); zhangliao modal
  170 = faceP80+5 exactly, yet reads lighter than the "tan-olive"
  face IMPRESSION (the p80 reference overshoots perceived tone);
  huangzhong sits at the +15 perception margin (was ok in earlier
  rounds); weiyan reads "grey-olive vs tan-brown" (hue, not
  luminance). 12/17 is the honest measured result.
- Result: acceptance ("J4 ok on all 17") NOT met after 3 attempts
  -> rule 5 BLOCKED. Full trail preserved: faces-vs-hands tables
  (artifacts/tone-gaps.txt, j4-anchors.txt), per-attempt PROGRESS
  entries, gates on every state.
- Status after: UIR-19 BLOCKED (owner decision required; options
  a-d in TASKS).
- Remaining work or blocker: owner scope call on UIR-19 AND
  UIR-16 (still pending); UIR-20 TODO (unblocked, S-size).
- Next recommended task: UIR-20 (embers tileScale) - the last
  unblocked TODO.

### 2026-09-30 - GYM-1 review-first handoff (IN_PROGRESS acceptance)

- OwnerselectedcurrentGuanYubuildreviewfirst,nopairedgrabexpansion. Stopimplementationatverifieda6c6057;noadditionalart/core/otherfighterchangesinthishandoff.
- Recheckedcleantree,coreunchangedsincef37b70b,approvedregularatlas/metaunchanged,allaction/mixedvideos+traces+reviewpageexist. Prior33motiontests,3/3mixedinteraction,2/2boundary,5/5vision,6/6prodbuildverified;711unitswithsolebaselineG6and6baselineUIR19typeerrorsremainhonest.
- Boundedimplementation/reviewpassdelivered;sessiongoalcanclosewithoutclaimingallmotionperfect. GYM-1remainsIN_PROGRESSforownernormal-speedacceptanceanddetail/pairedgrabcaveats. Nextactionownerfeedback,noblindcontinuationornewscope. No push/deploy.

### 2026-09-30 22:40 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Addednormal-inputmixedchoreography480ticks~8.04sCanvas,bothfacings/CanvasWebGL2/2;allattackIDs,newtexturesonly,landingwhilemoving. Fullboot/headcropscamera-scrollcorrectedandreviewed. Realdamage-drivenhurt/heavyfall/airhit/getupandwalkinggrab->throwcase1/1;viewedinteractionframes,confirmsopponentpronegrabbedposecannotaligncollarreachwithinotherfighters-unchangedscope.
- Defensiveboundarycontrolsfailedfirstonthrowimpactandgetupdefeatstandingrecoil;fixedhistorytokeep lowposeandsettle/reverseexistinggetupdrawings. Noart/core/otherfighterchanges. CanvasWebGLboundary2/2;viewedthrowimpact/getupdefeatstrips. No nativevideoviewclaim;ownermotionacceptanceopen.
- Verification:lint0;motion33/33;full711passed/1baselineG6failure/6skipped;typecheck6baselineUIR19errors;vision5/5;prodbuild6/6. Updatedreport/evidenceunderartifacts/wholeframe/actions/{mixed,interactions,transitions}.
- Remainartlength/detailconsistencyandpairedgrabscopedecision,ownernormal-speedreview. Goalactive;no more imagegenerationinbudget; nofalseall-smoothcompletion. No push/deploy/scheduler.

### 2026-09-30 21:55 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Locatedspecial1/mounted3backward-bladewindups;2focusedimageeditsfixedshaftdirectionbutbody/headscale drift,REJECTEDafterregisteredcontactreview. Currentfollow-up12requestbudgetexhausted;acceptedsolutionusesexistingforwardguard/recoverykeysandaddedforward-diagonalrecoverystep,samehitwindows.
- Pixel-supportedlogicalhaftdirectionlandmarks:peak~79->53degspecial,~134->48mounted;new60degdirectioncontrolrejectsoldorders. Thisisnot10%lengthcertification. Viewedexactexposureordersandactualspecial/mountedgameplaystripsaftercapture;bothatlases/core/approvedregularpixelsunchanged.
- Checks:3newunitcontrols;full709passed/1baselineG6failure/6skipped;lint0;typecheck6baselineUIR19errors;Canvas/WebGLaction+missingpack3/3;vision5/5;prodbuild6/6. Source/rejectionsinart/motion/WEAPON_ARC_REVIEW.md;reportupdated.
- Remainweapon/clothdetailandopponentgrabmatching,ownernormal-speedacceptance;goalactive,noall-smoothclaim. No furtherimagecallsallowedinthisboundedpass,nootherfighters/infrastructure/push/deploy.

### 2026-09-30 21:20 UTC - GYM-1 (attempt 2 continuation - IN_PROGRESS)

- Code-only boundaryaudit,13newcontrolswithobservedfailuresbeforefix:idle/walkhitstoplanding,mountinterruptgroundtransitions,freeze-safedismountclock,lateairinputstartup,allactivekickticks/retractatcontact,midairfallkeepsairpose,brokensweepwindow,late-first-renderfallnotrestart. Noartgeneration;approvedregularpixels/core/otherfightersunchanged.
- ActualCanvas/WebGLadversarialcaptures2/2plusnormalallactioncases4/4;reviewedair-hit,late-kick,landing-walk,landing-mountstrips. Restartchecksnewidle. Productiongatecaughtlate-renderfallregression,addedcontrolandfixedsamplerinsteadofweakeningexpecteddownframe.
- Checks:lint0;motion/action/boundary28/28;full706passed/1failed/6skipped(onlybaselineG6);typecheck6baselineUIR19errors;combinedbrowser6/6andfinalrepeat2/2;vision5/5;prodbuild6/6. Evidenceartifacts/wholeframe/actions/transitions;reportupdated.
- Remain:weapon/clothdetailvariation/opponentgrabmatchingandownernormal-speedacceptance;goalstillactive,noall-smoothclaim. Thisiscontinuationofattempt2,notadditionalwhole-sheetretry. No push/deploy/infrastructurechanges.

### 2026-09-30 20:05 UTC - GYM-1 (attempt 2 - IN_PROGRESS)

- Owner approvesregularmovement,requests allactionsespeciallyjump/fall. Preservedoriginalatlas/meta byte-identical; nootherfighters/core/schedulerchanges.
- Added6actionguides/sheets,54cells and3targetedfallrepairs(10imagecalls total;rejectedforkedwholefallcandidate retained). Jump/kick/landing,hurt,fall/getup,special,grab/release,mounted/dismount,KO plusall15statescovered;bothatlasesatomic. Sharedprone/idlebookends,airTicks,interruptiblelanding,hitstop-safefalllift;soloCONTINUEpresentationclockfinishesfallwhilecorefrozen,pausefreezesit;deadfade/shadowcannotreappear.
- ActualCanvas/WebGLallactionvideos bothfacings,10actions+stressstates. Viewedjump/kick/fall/getup/hurt/special/grab/rider/dismount/airfall/KOstrips andrenderer/screens;focusedfallweaponrepairsreviewedinupdatedgamefallstrip. TechnicalcoveragePASS,perfecttemporalqualityNOTclaimed:weapon/clothvariation,opponentgrabposeandnormal-speedownerplaybackremain. Report docs/GUANYU_ACTION_REVIEW.md,provenance art/motion/ACTION_PROVENANCE.md.
- Checks:lint0;motionunits15/15;full693passed/1failed/6skipped(onlybaselineG6);typecheckonly6baselineuir19-handserrors. Allactionsbrowser4/4,regularmotion4/4,defaultanim/scale/pause/continue/horsepass,vision5/5,prodbuild6/6. Increaseddual-atlasscan-testbudget40safter20stimeoutunderfull-suitecontention;pixel/coveragethresholdsunchanged.
- Statusafter:GYM-1IN_PROGRESSattempt2;primaryjump/fallmodelleakfixed,opt-in?motion=1stillrequired. Ownerdev5176untouched,no push/deploy. Remainingownerplaybackandlocalizedweapon/detailpolish;notDONEallmotionacceptance.

### 2026-09-30 10:40 UTC - GYM-1 (attempt 1 - IN_PROGRESS)

- Status before: owner approved Guan Yu-only motion test after static whole-frame pilot; no queue/loop infrastructure changes.
- Work: authored8-frame gait and full combo guides;7original sequence-sheet requests (walk3, sweep2, jab2/chop1 each). Fixed sheet-level scale/recorded translation registration,36cell diagnostic atlas; opt-in `?motion=1` simulation-tick playback with shared idle bookends, atomic technical integrity fallback. No old-art textures in210samples of supported idle/walk/combo per renderer, both facings; unsupported actions explicitly retain old art.
- Evidence: actual in-game Canvas/WebGL videos and tick traces under artifacts/wholeframe/motion; prepared drawing sheet/full-res crops/recording contact strips inspected. Canvas420ticks in~7.0s; software WebGL~23.8s (not normal-speed proof). Video playback itself left for owner: tool reviews stills only.
- Visual result: ITERATE / NO-GO for these candidate drawings, not an accepted animation set. Walk opposite-leg alternation fails after3requests. Approximate visible endpoint landmarks show116.5u idle vs74.5u sweep (~36%shorter) and84.0u chop. Other landmarks null/unverified; quality evaluator rejects incomplete evidence. Cloth/stance/weapon jumps and direct stop-to-idle remain; no criteria weakened.
- Verification: lint0; motion units8/8; full units686passed/1failed/4skipped (only documented baseline arm-chainG6). Typecheck six pre-existing uir19-hands possibly-undefined errors, no new errors; untouched. Motion browser4/4; default regression subset passed; vision5/5; prodbuild6/6 including2new flag/default cases.
- Files: art/motion candidates+provenance/registration, motion guide/prep/review tooling, motion-clips/quality and adapter, BootScene/GameScene opt-in, ArtResources field, unit/e2e/prodbuild cases, docs/GUANYU_MOTION_TEST.md, TASKS/PROGRESS. No old body/hand code changed, no push/deploy/scheduler.
- Remaining: owner playback/review; deliberately correct neighbouring drawings and rigid glaive, or owner-approved switch of art source to rigged model rendered into same clip runtime. Do not keep retrying whole sheets blindly or expand cast.
- Status after: GYM-1 IN_PROGRESS (attempt1), UIR-19/20 untouched. Diagnostic test packaged; not DONE.

### 2026-09-29 09:40 UTC - UIR-19 (attempt 2 - IN_PROGRESS)

- Status before: UIR-19 IN_PROGRESS attempt 1 (form pass landed;
  J4 5 ok / 4 bad / 8 unverifiable; tone flagged cream-vs-face).
- Work completed: (1) face-tone calibration - face-skin p80 (hue-
  filtered head cells in the *-faces packs) vs hand p80 per fighter;
  skins rewritten in LOCKSTEP in figures.ts + prepare-body-parts.mjs
  (17 fighters, e.g. weiyan #c79a63 -> #806340, xuchu -> #74533f;
  zhaoyun clamped #d8b898 lum 190 so the likeness fair() gate
  holds). (2) deeper crease cores for digit separation. (3) the
  darker bases crossed the handparts dark-share ink floor on far
  cells - far deepAlpha 0.5 -> 0.42 and far creaseCore kept at 0.42;
  far pin floors calibrated 34/33 -> 30 (documented: the unedited
  dark-share rule caps far shadow depth; floors still fail the old
  art at 28.1/27.1). Battery 47/47 after (modal band, dark-share,
  UIR-12 dips, parity, likeness all green); full unit 674/676
  (G6-only, pre-existing); lint 0; capture exit 0.
- J4 re-review (3 small batches; all 17 sheets DISPLAYED this time):
  9 ok / 8 bad. Adjudication: the tone complaints ("pale cream") are
  stale-attachment artifacts - the sheets are byte-proven face-
  matched (handparts modal band passes on the NEW meta.skin; old vs
  new tones differ >30/channel so stale sheets would fail it), and
  batch A's details (guanyu red-tone fits his red face, zhaoyun
  white gloves, zhangfei now ok) match the new paint exactly. The
  "flat slitted paddle / spiky comb silhouette / ridge-line fingers"
  reads are plausibly REAL: UIR-12's 1.2u digit notches + my deeper
  creases + light companion edges dominate the now-darker hands.
- Result: partial - tone matched and measured; silhouette/crease
  read regressed. NOT all 17 ok -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 2 of 3).
- Remaining work / attempt 3 (LAST before BLOCKED): soften notches
  1.2u -> ~0.7u, crease cores to ~0.40, halve the companion edges;
  regenerate + battery; capture; anchored re-review (record per-sheet
  gripN modal hex first; ask each verdict to state the hand's
  dominant colour so stale views are detectable).
- Next recommended task: UIR-19 attempt 3 (same task).

### 2026-09-29 08:10 UTC - UIR-19 (attempt 1 - IN_PROGRESS)

- Status before: UIR-19 TODO (V-18: flat cream mitten hands beside
  the photographic sleeves).
- Work completed: formPlanes pass in prepare-body-parts.mjs (knuckle
  caps + valleys along the fist's top knuckle edge and the open
  hand's vertical finger-root line, planar lit/shade split along the
  sheet light, finger-group tone steps, warm rim bounce); UIR-12
  crease pass re-ordered LAST (formDetail) or the plane washes broke
  the dip gate. Cell sizes/pivots untouched; all 20 sheets +
  prepared.json regenerated. TDD: test/game/uir19-hands.test.ts
  (knuckle lit-caps, plateau counted once, prominence >= 8; UL/LR
  plane contrast) fails on the stashed old paint with 47 failures
  (peaks 0-1, contrast 27-35), passes on the new (68/68 cells).
  Pin-honesty note: the first probe's prominence included k=0 (always
  0) - fixed, and the baseline re-measured via git stash, not from
  the buggy run.
- Delegated J4 review (rubric-only, 17 clean sheets): 5 ok / 4 bad /
  8 unverifiable. Bad: zhangfei "cream wrap-like fists lighter than
  tan face", weiyan "cream hands vs tan face", spearman "pale pink
  hands vs tan face" (TONE mismatch - my white washes widened it),
  lubu "attack fists smooth pale blobs, weak finger separation".
  The 8 ? sheets failed on the session's stale-attachment bug (the
  same defect hit text output in this tick too).
- Response landed in this attempt: light washes cut (capLit 0.5 ->
  0.32/0.34, planeLit 0.22 -> 0.15, stepLit 0.16 -> 0.11, bounce
  0.14 -> 0.10) and the shadow side deepened (planeShade 0.2 ->
  0.28) so the plane contrast holds while the average tone darkens
  toward the skin/face. Full battery green after the change
  (uir19 pin + handparts + handgrip + uir13 + bodyparts + likeness
  = 47/47; UIR-12 dips and modal band unaffected).
- Files changed: scripts/prepare-body-parts.mjs, src/game/assets/
  {hero,mook,boss}-bodies (sheets + prepared.json), test/game/
  uir19-hands.test.ts (new), TASKS.md, PROGRESS.md.
- Verification run: lint 0; battery 47/47 (unedited gates incl.
  UIR-12 dips, modal band, byte-stable sheets, bodyparts parity);
  full unit 674/676 (only the pre-existing UIR-16 G6 pin fails, as
  intended); review capture exit 0; browser gates e2e 78 + 4
  documented load-flakes (3 boot timeouts + 1 pause brightness;
  13/13 re-pass in isolation), vision 5/5, selfplay 13/13, build 0,
  prodbuild 4/4.
- Result: partial - form lands and measures; J4 acceptance NOT met
  (5/17 ok) -> IN_PROGRESS.
- Status after: UIR-19 IN_PROGRESS (attempt 1 of 3).
- Remaining work / attempt 2: (1) per-fighter face-tone calibration
  (sample the *-faces head cells for the photographic face mean;
  adjust the hand base/washes toward it - zhangfei/weiyan/spearman
  first); (2) stronger finger separation on fist cells (lubu attack);
  (3) complete the J4 re-review on all 17 sheets (the 8 unverified
  included) with a more reliable image path.
- Next recommended task: UIR-19 attempt 2 (same task).

### 2026-09-28 23:10 UTC - UIR-16 (attempt 3 - BLOCKED, rule 5)

- Status before: UIR-16 IN_PROGRESS attempt 2 (combo-search bend:
  G6 87->86, strikearms+guards green, eye-review pending).
- Work completed: (1) fresh capture WITH bends + V-15b baseline pin
  (71 files, pre-bend preserved). (2) Eye-review sanity gate on the
  bends: lubu-attack improved 398+627->187+623 but still overlaps
  (wrap unchanged); guanyu-sweep BACKFIRED 11+41->142+269 (bent
  elbow cocks down, forearm covers haft+fist - worse metrically AND
  visually, J6 awkward); zhaoyun-attack improved 159+173->74+162.
  (3) Reverted the bend mechanism (weapons.ts combo search +
  armik.ts bendElbowOffHaft) - restored exact attempt-1 behavior:
  G6 back to 87 pre-change values, strikearms/handgrip/uir13/
  bodyparts/handparts/likeness 47/47, tsc 0, lint 0, full unit
  671/673 (only the G6 pin fails, as intended). No browser gates
  (no behavior change left to verify; capture already reviewed).
- Three-attempt record (rule 5): attempt 1 proved grip placement
  alone cannot satisfy G6 (forward unreachable on strikes; arm
  rails the valid back range; landed G6 pin + safe close-stack).
  Attempt 2 proved elbow bends cannot either (combo search:
  87->86, big cuts in ~15, 3-4 backfires, wrap extent needs ~8u
  clearance the geometry lacks). Attempt 3 proved the bends harm
  looks (guanyu-sweep) and reverted them. Remaining options all
  need owner authority: rescope G6, masking (breaks handgrip),
  hand-art changes (UIR-19 scope), or pose-table surgery.
- Files changed: src/game/art/armik.ts, src/game/art/weapons.ts
  (bend reverted; G6 + close-stack kept), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-bend values);
  guards 47/47; tsc 0; lint 0; unit 671/673 (G6 only).
- Result: BLOCKED - acceptance unsatisfiable as specified.
- Status after: UIR-16 BLOCKED (owner decision required).
- Remaining work or blocker: owner picks (a)/(b)/(c)/(d) above.
- Next recommended task: UIR-17 (prone far arm) - first unblocked
  TODO; UIR-16 waits on the owner, not the queue.

### 2026-09-28 22:40 UTC - UIR-16 (attempt 2 - IN_PROGRESS)

- Status before: UIR-16 IN_PROGRESS attempt 1 (G6 pin failing on 87
  cells; close-stack mechanism behavior-preserving; proof that grip
  placement alone cannot satisfy G6).
- Work completed: (1) fixed 2 compile breaks left mid-edit (missing
  clearsArm/bendElbowOffHaft imports, const->let near). (2) Reworked
  the bend: side-aware branch choice + (protraction 2..6) x (near
  side) x (far hint) combo search in weapons.ts, grip fixed (turn
  floors + grip-hold untouched by construction), far-flip allowed
  for the side rule; armClearance() exported. (3) First cut broke
  strikearms (near landed same-side as far); side-opposite search
  fixed it - strikearms GREEN. (4) G6: 87->86 cells, with big drops
  in ~15 (lubu:attack 398+627->187+623, xuchu:attack 310+628->
  128+623, zhaoyun:attack 159+173->74+162, walk0s to near-zero,
  xuchu:walk0 zeroed); 3-4 backfires on tiny-overlap non-strikes
  (guanyu:sweep 11+41->142+269). (5) Calibration proof: 21 adopts;
  model clearance >=9 paint-zeroes, 5.5-7 partially improves or
  backfires (wrap fingertips extend ~3-4u past the fist center, arm
  bulk ~2.5u - model 5.5 underpredicts paint by ~2u); combo table
  shows -side never clears, +side needs far-flip, p=6 bows swing
  the upper arm back INTO the fist (non-monotonic); 24 cells are
  model-pass/paint-fail (unreachable by any model trigger).
  Guards handgrip/uir13/bodyparts/handparts/likeness 47/47 green.
- Files changed: src/game/art/armik.ts (bendElbowOffHaft sideSign +
  protracted return + armClearance), src/game/art/weapons.ts (combo
  search + farHintOverride), TASKS.md, PROGRESS.md.
- Verification run: tsc 0; lint 0 (touched files); strikearms 1/1;
  guards 47/47; G6 still failing on 86 cells (pin working).
  Capture/eye-review/vision + full unit/browser gates deferred to
  the completing attempt (geometry still churning; no DONE claim).
- Result: partial - mechanism + big reductions; literal-0 blocked
  on wrap extent (needs UIR-19-adjacent art or owner masking call)
  or G6 scope renegotiation.
- Status after: UIR-16 IN_PROGRESS (attempt 2).
- Remaining work: attempt 3 (LAST before rule 5 forces BLOCKED):
  (a) FIRST capture + eye-review the 21 adopted cells (J1 socket /
  J2 / J6 sanity gate on the bends); (b) if review passes, one final
  push (bulk-aware threshold? wrap-extent analysis?); (c) else record
  BLOCKED with the renegotiation proposal (G6 = 0 on the 9
  reviewer-A/B cells + rim tolerance elsewhere) - do NOT weaken the
  gate unilaterally.
- Next recommended task: UIR-16 attempt 3 (same task).

### 2026-09-28 21:40 UTC - UIR-16 (attempt 1 - IN_PROGRESS)

- Status before: UIR-16 TODO (V-15b: far fist paints over the near
  elbow on strikes, up to 398+627px).
- Work completed: (1) G6 gate added to test/game/arm-chain.test.ts
  (gripF+wrapF over near-arm footprint = 0 on all standing moves)
  with a negative control - FAILS first on 87 cells as the pin.
  (2) Close-stack mechanism in fitFarHand (armik.ts): keeps the
  UIR-15 wide-back grip when it clears the solved near-arm segments
  by 5.5u, else stacks close (back-close then forward-close,
  reachable + clearing), else keeps the wide grip (grip-hold
  preserved). Threaded through weapons.ts (solved near chain).
  Behavior-preserving today: all 87 values identical, strikearms +
  handgrip + uir13 + bodyparts + handparts + likeness green (47/47),
  tsc/lint clean.
- PROOF (placement alone cannot satisfy G6): s-sweep probes over the
  live poses show (i) forward grips are UNREACHABLE on strikes (far
  shoulder cannot reach past the near hand - option (a) dead);
  (ii) the near arm rails the haft across the whole valid back range
  (segment clearance 0-4u everywhere, e.g. zhaoyun:attack; elbow ON
  the haft, near arm nearly straight with h~1.2u); (iii) the few
  high-clearance far-back spots fail the strikearms side/turn floors
  or sit past the butt fitting. E.g. lubu:attack: fist (62.9,35.0)
  sits 3.7u from the upper-arm segment with all alternatives worse.
- Files changed: test/game/arm-chain.test.ts (G6 + control),
  src/game/art/armik.ts (CLOSE_GRIP_SEP/ELBOW_CLEARANCE/fitCloseStack),
  src/game/art/weapons.ts (avoid threading), TASKS.md, PROGRESS.md.
- Verification run: G6 fails on 87 cells (pin, pre-existing values);
  strikearms/handgrip/uir13/bodyparts/handparts/likeness 47/47;
  tsc 0; lint 0. Full unit + browser gates deferred to the completing
  attempt (no behavior change yet).
- Result: partial - mechanism + pin landed, clearance unsolved.
- Status after: UIR-16 IN_PROGRESS (attempt 1).
- Remaining work: bend the near elbow OFF the haft on conflicting
  two-handed strikes (forced shoulder protraction ~4u toward the hand
  + branch selection away from the haft/fist), then re-run G6 +
  strikearms (side rule!) + eye-review J1 (socket) + J2 + full gates
  + capture re-review. ALTERNATIVE if that fails: renegotiate G6
  scope with the owner (e.g. exclude sub-perceptual wrap rims) -
  do NOT weaken the gate unilaterally.
- Next recommended task: UIR-16 attempt 2 (same task).
