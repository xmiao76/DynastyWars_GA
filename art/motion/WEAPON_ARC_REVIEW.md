# Guan Yu special/mounted direction audit

Continuation of all-action owner request, 2026-09-30. Existing approved regular walk/combo art is not changed. Both regular and actions atlas bytes remain identical to d7d44eb/c2cf3fa.

## Located defects

- Original special:1 blade pointed up-left (approximately-118degrees); special:2 pointed up-right (-47degrees). Special follow-through->recover jumped approximately79degrees.
- Original rider:3 windup pointed up-left (-140degrees), followed by rightward rider:4 strike (-6degrees): approximately134degree jump.
- Whole-character anatomy was coherent; the exposure order chose unsuitable reverse-facing keys.

## Two original-image repair requests, rejected

Both `image_generate` requests preferredGPT/high quality1024square; tool returned1254square. Actual serving backend not disclosed. References were original single-sprite crops plus repository's original walk1 identity, not third-party art.

| Candidate | SHA256 | References | Outcome |
|---|---|---|---|
| special1repair |62d3c2df3f64d18565c2ddf3ea9a378dab992c8b5e7802674d49057e3c437a12|special1crop1b423121a22bd2743b49aa5d97ab7ee45f27057a4487085c2b23360b3d47de2c,walk1|One straight forwardguandao improveddirection,butbody/head/weaponproportionschanged. Rejectedafterregisteredcontactreview.|
| rider3repair |e82479a16574fa87053dd33b38efd82cf1e368a773aaf3793c76837305c861ec|rider3crop2a11afe1fa8492a5ded84e146f0f393a3a984b74670e53d0196cd56310ffb54c,walk1|Bentknees/seatedanatomyandforwardshaftgood,buthead/body-scale drift from adjacentmountedkeys. Rejected.|

Prompts explicitly requested preserve body/costume/camera and changeonlyarms/weapon,ONEstraightshaftfromlowerlefttoup-right,twohands,samereferencedesign,length,noglow/shadow/scenery. Outputdoesnotproveinstructionsmet. Files retained under guanyu/details; not used by preparation/runtime. These2calls bring originalfollow-upbudget to12. No further image requests in this pass.

## Accepted exposure-order correction, no new assets

- Special anticipation now uses existing forward guard special:7 -> raised special:2 -> forward special:3. Active remains special:4 at6ticks. Followthrough remains special:5 after18ticks,then special:3 bridges retraction before6/7/sharedidle. The6/12/12damagewindowsareunchanged.
- Mounted anticipation now uses existingforwarddiagonalrider:5,ratherthanbackwardrider:3. Active remainsrider:4at8ticks,recovery5then6;8/6/14gameplaytimingunchanged.
- Reuse of recovery as anticipation is deliberate authored sprite playback,not pretending extra distinct frames were generated. Still no oldrig blends.

Approximate rendered logical landmarks in guanyu/weapon-review.json are pixel-supported by unit checks. Aftendpoint is visiblehaftbutt(or aftgripwhenoccluded),so this measuresDIRECTION,not constanttotallength.

|Sequence|maxadjacentdirectionstepbefore|after|
|---|---|---|
|special|~79degrees|~53degrees|
|mounted|~134degrees|~48degrees|

New ruler max60degrees catches the oldbadordersasnegativecontrols;itdoesnotreplaceexisting10%lengthcriterionorcertifyanatomical/temporalperfection. Head/weaponlengthspreadstilluncertifiedandearlierfailedmeasurementsremain.

Reviewed exactexposureorders andactualspecial/mountedgameplaystrips. Newmountedwinduppointsrightandlowerstohorizontalratherthanwhippingfrombehindhead;newrecoveryspecialmovesbackthroughforwarddiagonalinsteadoflargeupwardjump. Someclothandweapondetailshiftstillvisible. Normal-speedownerreviewstillneeded.

## Evidence

- artifacts/wholeframe/actions/{special,mounted}-exposure-order.png
- artifacts/wholeframe/actions/{special,mounted}-ingame-strip.png
- refreshedCanvas/WebGLall-actions.webm andJSONtraces
- test/game/motion-weapon-arc.test.ts:directiongate,oldordernegativecontrols,landmark alpha-neighborhoodsupport

No otherfighter/core/assets/pivotsmodified. Keep?motion=1opt-in;notcastrollout.
