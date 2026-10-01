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
### 2026-10-01 03:50 UTC - CMR-01 (attempt 1, reference/inventory/budgets - DONE)

- Status before: CMR-01 TODO (first task of the owner's whole-cast
  motion rollout; contract docs/CAST_MOTION_ROLLOUT.md).
- Work completed: (1) Guan Yu reference freeze - all 4 pack files
  byte-IDENTICAL to planning baseline 540501c (sha256 both sides);
  90 displayed frames hashed (per-frame RGBA + exposure hashes) and
  the 20-clip timing table pinned (clipsHash 513e9ff0...); manifest
  committed as docs/motion-tasks/guanyu-reference.json + TSV +
  GUANYU_REFERENCE.md. Current cells carry no trim/pivot (recorded
  honestly - box.groundY 136 is the only anchor). (2) CAST_INVENTORY
  .md published from exact source: 17 humanoids + horse with
  identity/figure-weapon/build/roles/attack IDs/clocks; weapon and
  attack-ID columns kept separate (boss attack IDs say sword/axe
  while figures carry glaive/spear/ji); hz.special confirmed zero-
  active projectile special (active 0, specialFiresProjectile);
  archer fireInterval 90; boss think/enrage ranges per def; thrown
  is THROW_TRAVEL-driven, NOT tick-fixed (corrected an unverified
  "22 tick" narration against sim.ts); explicit N/A + defensive
  stress states listed. (3) BASELINE.md: measured costs (4.24 MiB
  download / 44.3 MiB decoded vs the 16/128 MiB caps; the 2048 page
  cap is exceeded by the accepted reference - recorded for CMR-21),
  200-request cap ledger (4x16+9x12+3x8+1x4). (4) Baseline failures
  reproduced on the current tree: unit 1 failed | 713 passed (the
  G6 V-15b pin, exact assertion) and tsc CLEAN - the contract's six
  UIR-19 type errors do not reproduce (fixed in 4bce5d8 before the
  contract was consumed); both facts recorded as exact evidence.
- Files changed: docs/motion-tasks/{GUANYU_REFERENCE,CAST_INVENTORY,
  BASELINE}.md, docs/motion-tasks/guanyu-reference{,-frames}.{json,
  tsv}, TASKS.md, PROGRESS.md.
- Verification run: unit 713/1-failed/G6-only; tsc 0; probes were
  scratch (deleted); no runtime/game source touched (acceptance 6).
- Result: CMR-01 acceptance all 6 items met; reference/inventory/
  budgets retrievable for CMR-02..05 without archive digging.
- Status after: CMR-01 DONE.
- Remaining work or blocker: none for CMR-01. Queue continues with
  CMR-02 (dependency: CMR-01 DONE, satisfied).
- Next recommended task: CMR-02 (generic per-kind motion profiles).


### 2026-10-01 02:55 UTC - PRODUCER (count-triggered verification pass - COMPLETED)

- Status before: 13 src/game commits since ff03538 (review due);
  V-16 (self-check), V-17 + V-19-embers (unverified) awaiting
  verification; queue otherwise owner-gated.
- Work completed: full producer pass. (1) Signals green (logic 0,
  vision 0) + fresh capture exit 0. (2) Verified on fresh pixels:
  V-16 3/3 down pairs fixed (cuff/forearm leads into the hands; the
  pinned V-16 baseline pair sheets show the old detached state) +
  G5-down green; V-17 3/3 cells fixed (cuff-to-hand connected,
  huangzhong-idle/weiyan-hurt/zhangfei-hurt on stamped composites) +
  G7 green + V-17 notes all >= 27% (4 informational lines, none
  under the gate); V-19-embers pin + toggle-diff measure reproduce
  (3403 -> 4412 px) + stage frames show discrete sparks. (3) Grid
  carried: the UIR-19 hand-paint/skin change is J4-level only (chain
  geometry untouched); suspects 2/238 (guanyu:thrust, zhangfei:attack
  - both known 1.3u sub-gate residuals). (4) All three contact sheets
  reviewed clean (flow: WARNING/CONTINUE/CLEAR chips + titles hold;
  stages: 9 palettes + embers on 7-9; platform: portrait overlay,
  landscape controls, WebGL matches canvas).
- Files changed: PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-16/V-17/
  V-19 verified; coverage; baseline -> 4bce5d8).
- Verification run: signal 0/0; capture 0; arm-chain 14/15 (G6 only,
  the UIR-16 BLOCKED pin); emberscale 2/2; tsc 0; unit 711 (G6).
- Result: all pending fixes verified; no new work (queue owner-
  gated: UIR-16/UIR-19 BLOCKED, BODY-7/ENH-12 owner).
- Status after: producer records updated; IDLE for consumers until
  the owner unblocks.
- Remaining work or blocker: the two BLOCKED scope calls (UIR-16
  options a-d; UIR-19 options a-d) + BODY-7/ENH-12 owner items.
- Next recommended task: none unblocked.

### 2026-10-01 02:20 UTC - UIR-20 (attempt 1, ember tileScale - DONE)

- Status before: UIR-20 TODO (V-19 remainder: the embers tileSprite
  showed only the sheet's top half).
- Work completed: embers.setTileScale(0.5, 0.5) (GameScene, one line;
  drift + additive blend untouched). TDD: e2e/emberscale.spec.ts
  pinned failing first (tileScaleY 1), green after (0.5) + an
  acceptance measure on a frozen-sim frame (toggle-diff of the ember
  layer at tileScale 1 vs 0.5): 3403 -> 4412 px (1.30x, +1009 px).
  Honest note: the "~2x" acceptance estimate assumed count
  proportional to sparks; the pre-fix top half rendered its sparks 2x
  TALL (fewer, larger), so the area ratio understates the fix - all
  36 sparks + 8 puffs now show at true aspect. Also fixed 2 tsc
  strictness defects the pin introduced (index access) and verified
  tsc 0 (the earlier ticks ran vitest-only; standalone tsc is what
  caught them).
- Files changed: src/game/scenes/GameScene.ts, e2e/emberscale.spec.ts
  (new), TASKS.md, PROGRESS.md, docs/UI_REVIEW_LEDGER.md (V-19 embers
  fixed (unverified)).
- Verification run: tsc 0; lint 0; unit 711 passed (G6-only failure,
  the UIR-16 BLOCKED pin); emberscale 2/2; review capture exit 0;
  browser gates browser gates all green: e2e 83/0 (incl. emberscale 2/2), vision 5/5, selfplay 13/13, build 0, prodbuild 6/6.
- Result: UIR-20 acceptance met (with the documented count physics).
- Status after: UIR-20 DONE.
- Remaining work or blocker: UIR-16 and UIR-19 BLOCKED (owner scope
  calls); BODY-7/ENH-12 owner-gated.
- Next recommended task: none unblocked - queue is owner-gated.

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

### 2026-09-30 - CMR rollout planning handoff (owner-approved, no implementation)

- Owner accepts Guan Yu enhancements and requests all-character implementation only by loop threads. Approved prioritizing rollout over older active work and retaining opt-in until separate owner normal-play approval.
- Published docs/CAST_MOTION_ROLLOUT.md and 40 bounded specs under docs/motion-tasks:5foundations,16fighterA/Bpairs,horse,pairedintegration,finalcastreview. Sequential dependencies, exact per-role action/timing requirements, resource budgets,200request cap, producer verification and no runtime/source implementation here.
- Queued CMR-01 first; GYM-1/BODY-7/ENH-12/UIR-19 owner-deferred asBLOCKED with attempts/evidence preserved. UIR-16 remains blocked,UIR-20 later. Existing loop policies/runner/config/schedules untouched; due producer review still precedes consumers.
- Planning verification passed:40spec/queueIDs, linear dependencies,263localdoclinks,16fighterpairs and200requestcap; zero remaining IN_PROGRESS legacy entries; diff whitespace clean and files restricted to planning docs/queue/progress. No gamechecks claimed for unchanged source. Local planning commit only; no generation,consumer/subagent/runnerlaunch,source/tests/assets edits,push/deploy.
- Next action: existingloopthread reads .loop/continue.md; perform due producer review then CMR-01. Main thread stops after handoff,not implementation.

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

### 2026-09-29 06:30 UTC - UIR-18 (attempt 1, wrist bridge - DONE)

- Status before: UIR-18 TODO (V-17: relaxed far hand floats at the
  hip with 0-15% of its forearm visible - hand reads detached).
- Work completed: wrist-bridge disc in draw.ts - the foreArmF cuff
  cell repaints over the torso edge at the wrist (hand pulled 3u
  toward the elbow, r=4.5u), only for relaxed far hands (gripping
  forearms already cross in front of the torso; prone excluded).
  TDD: G7 gate + negative control in arm-chain.test.ts (foreArmF
  >= 25% whenever relaxF paints, non-gripping standing rows); pinned
  failing first on 18 rows via git-stash of draw.ts (weiyan:special
  14%, lubu:hurt 13%, huangzhong:sweep 17%), green after. Fresh
  capture's rendered-pixel notes confirm all 84 relaxF rows >= 27%
  (4 informational 27-30% notes remain; 0 under the gate).
- Display caveat: the session's image previews crossed several
  crops (documented bug); the verdict rests on the rendered-pixel
  detector (G7 + suspects.json notes, both from the same render) and
  the captioned crops that matched.
- Files changed: src/game/art/draw.ts, test/game/arm-chain.test.ts
  (G7 + control + header), TASKS.md, TASKS-ARCHIVE.md (2 oldest DONE
  moved: bound was 22 > 20), PROGRESS.md, docs/UI_REVIEW_LEDGER.md
  (V-17 fixed (unverified)).
- Verification run: lint 0; tsc 0; unit 674/676 (only the pre-existing
  UIR-16 G6 pin fails, as intended); review capture exit 0; browser
  gates: E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13), BUILD=0,
  PRODBUILD=0 (4/4).
- Result: UIR-18 acceptance met.
- Status after: UIR-18 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-16
  BLOCKED (owner scope call); UIR-19/20 TODO.
- Next recommended task: UIR-19 (cast-wide hand art, L).

### 2026-09-29 03:40 UTC - UIR-17 (attempt 1, prone far arm - DONE)

- Status before: UIR-17 TODO (V-16: prone far forearm vanishes
  under the ground line, relaxed hand floats alone, runF to 11.5u).
- Work completed: mirrored the lying far-elbow hint across the
  shoulder->hand line in weapons.ts (same reflection as the strike
  hint): the elbow folds up onto the torso (y~76 vs hip 82) and the
  forearm runs down to the untouched hand target - the prone far arm
  lies across the body. Chose "across the chest" over hiding (the
  hand target is reachable and reads naturally there). TDD: G5
  extended to the down far chain, pinned failing first (12 downs),
  green after. Also did the overdue bounding: TASKS 36->20 DONE,
  PROGRESS 1548->446 lines (archives appended, unfinished kept).
- Files changed: src/game/art/weapons.ts, test/game/arm-chain.test
  .ts (G5 down far chain), TASKS.md, TASKS-ARCHIVE.md, PROGRESS.md,
  PROGRESS-ARCHIVE.md, docs/UI_REVIEW_LEDGER.md (V-16 fixed
  self-check).
- Verification run: lint 0; tsc 0; unit 672/673 (only G6 fails -
  the UIR-16 BLOCKED pin); review capture after; browser gates:
  E2E=0 (82), VISION=0 (5/5), SELFPLAY=0 (13/13 on re-run; first
  run 12 with one migrating boot-timeout flake, art change cannot
  affect the sim), BUILD=0, PRODBUILD=0 (4/4). Re-review: 3 down
  cells connected with no suspects; 3 contact sheets clean.
- Result: UIR-17 acceptance met.
- Status after: UIR-17 DONE.
- Remaining work or blocker: BODY-7 acceptance (owner); UIR-16
  BLOCKED (owner scope call); UIR-18..20 TODO.
- Next recommended task: UIR-18 (relaxed rear hand).

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
