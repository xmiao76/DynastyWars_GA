# Guan Yu remaining actions — provenance and correction record

2026-09-30 owner follow-up: keep regular motion, fix jump/fall and review all actions. All requests `image_generate`, preferredGPT/high quality1536x1024; actual serving backend not disclosed. Original art only; no arcade sprites/third-party references. Design reference: existing `guanyu/walk-candidate-1.png` SHA256363343423be5447ea9caa690e188fdadf23818c9255c4bba280d6d52aac4f642. New neutral pose references authored by `test/game/action-guides.test.ts`.

| Image | SHA256 | Ordered references | Result |
|---|---|---|---|
| jump1 |83205aacfdff8a8ebad79b8bb146f31dfcaf58bf3ea4e6dbf46de6dfd1ec0e9a|jump guide,walk1|Crouch,airborne tuck,kick,descent/landing drawings used.|
| fall1 |84449732accc4acf58fd1d9b7a748c97dd788fe45ee8e3e21bd6b97d9802897b|fall guide,walk1|Backward fall and prone drawings used; blade-direction switch remains a review caveat.|
| fall3repair |c2acdf7b7a91250dc226a48f6d8a4c66d6a8a38f6bfe34f9c22ee6f0c43d7c9a|fall2singleframe3crop,correctedframe4|One straight guandao through bothhands;full tiltedbody used as fall3override.|
| fall4repair |9646ad6119832c2ddabb8676dd215ba68aa00cb4d0c6df4046267ad086f005bb|fall2singleframe4crop|One straightguandao,no branchedshaft;usedfall4override.|
| fall5repair |7341b5b1d57d96f374ad4f2cef5eebfa5bfc1123d42a1ac3c09a989f4029d033|fall2singleframe5crop,correctedframe4|Nearhorizontalgroundimpact andsinglehaft;usedfall5override.|
| getup1 |355cfc7f0061173447d1dfab6b899bdf147c278f381e8850df2ac1592b2fb2aa|getup guide,walk1,fall1|Generator arranged standing->prone in unexpected order. Explicit order6,7,8,5,4,3,2,1,0 gives prone->sit->kneel->rise. No anatomy warp.|
| misc1 |218725a5c6d3c9a63eba4cc31f3a6e1d45a482864928ace60ead6dfe613ccbbd|misc guide,walk1|Recoil,reach/grab,release. Whole-character frames retain connected arms.|
| special1 |71c938c20c085b22e9337b2f6a74ac291cb99dd0906522b4c671eb6caf08c39c|special guide,walk1|Sweep sequence used; fixed visual timing, weapon-scale drift not certified.|
| rider1 |ef30773b5e08ab301369b4abc90311f916ee65eb25f085179ccd4248945dd8bb|rider guide,walk1|Seated rider-only poses,horse separate. Mounted sweep and dismount used.|
| fall2 |a6974bd55b3fe8e96432c9dc38a392b720272e5d1eab6194a4c040b02880b100|fall1,walk1|Targeted weapon-direction correction. REJECTED: provider introduced two intersecting shafts/branched guandao in middle row instead of one rigid weapon. Not used directly; single-drawing crops become references for the focused repairs below.|

7sequence-sheet requests for this follow-up, no more than2per action. After the rejected whole-fall correction,3focused single-drawing edits repaired only the affected middle fall poses (10image requests total, below12request budget). Prompt common requirements: exact3x3 guide positions/scale/camera,locked redface/longbeard/greenheadcloth/green-gold robe creamlining/bronze armour boots/no cape,longbrown crescent guandao withgold fitting redtassel,transparentbackground,no glow/shadow/text/effects. Prompt details:

- Jump: idle,crouch,earlylift,tuck,forward near-leg airkick,tuck,legextension,landingcrouch,idle. Explicitly retain raised boots in airframe instead of ground-aligning all cells.
- Fall: standing,recoil,tipback,45degreebackfall,nearhorizontal,contact,proneheadLEFTbootsRIGHT,pronehold,pronehold. Keep full bodylength and weapon abovechest.
- Getup: exactfall1prone reference then sit-up,sit,kneel,rise,crouch,idle. Provider reverses ordering; source retained unedited.
- Misc: idle,flinch,recoil,settle,idle,onehandreachright whileotherholdsweapon,grabhold,release,idle.
- Special: coil,windup,down-forward20degree sweep,35degreefollowthrough,recover,idle; request rigidweapon same dimensions (not an assertion it succeeded).
- Rider: riderONLY,nonewhorse; kneesbent,bootsstirrups,idle/bob/windup/sweep/recover/dismount/standing.
- Fall2: edit ONLY weapon rotation to keepblade toRIGHT whilebodyfallsback. Explicitly request ONErigidhaft. Output forks it; rejectedafterimageinspection.

Focused prompt repairs: preserve each body pose, remove top-edge unrelated bootfragments, erase down-right branch/repaintunderlyingrobe, align BOTHhands along ONEstraightshaft fromlow-leftbutt toupright/rightblade. Requested1024square;provider returned1254square. Source crops and resulting originals are retained under`guanyu/details/`. Wholefall2isnotusedasatlas,only3individuallyreviewedrepairs replacefall1frames3/4/5. This avoids suddenleft-to-rightbladeflip,butstyle/scale tolerances still needowner review.

Preparation in `scripts/prepare-actions.mjs`: one scale per sheet with translations in `guanyu/action-registration.json`; no independent per-frame auto-normalisation. The3single-image overrides have their own explicitly recorded sourcepixel density and pivots (different1254px sourcecanvas); they are not autoscaled each runtimeframe. Component extraction preserves figures across nominal grid boundaries and removes lowalpha glow. Shared fall6 down and walk0 idle boundaryframes avoid distinct prone/idle repaint pops. Actions atlas2688x2592density2,54cells; original regular atlas remains byte-identical. Technical coverage is not a claim that every drawing passes all temporal anatomy/design criteria.
