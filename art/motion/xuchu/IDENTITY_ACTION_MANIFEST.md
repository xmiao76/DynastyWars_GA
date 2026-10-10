# Xu Chu source identity and action manifest — CMR-15A initial walk package

Parent run: `2026-10-10T05-31-45-494Z-029c7a7f-ad4e-4094-9581-bdfcf4afbeb9`. Source-authoring package 1 after orientation; no runtime publication or acceptance waiver. No economic-manager receipts are claimed; this session has no manager tools.

## Inspected identity and authority

1. [Body master](../../fighter-bodies/xuchu-body-master.jpg): SHA-256 `98c1847b17dca605e637954e0a9679c23d97f9fcd58d0a4ebb01c37665abb6cd`, 832×1248. Massive torso/waist, broad shoulders, short neck, dark plain iron dome helmet, layered worn brown armor, forearm wraps, skirt panels, baggy trousers, heavy boots. Unarmed frontal neutral stance; it does **not** provide glaive geometry.
2. [Portrait master](../../boss-faces/xuchu-portrait-master.jpg): SHA-256 `c663fd5428314ced899d98ce41b5fa2e55fecb9b12335b1f9de4803afefb3a0d`, 1280×720. Blunt square head, heavy brow, deep small eyes, short dark full beard/mustache, warm ruddy-brown complexion, plain helm, worn ochre/brown shoulders. Identity and face, not a new costume.

Both were opened before authoring and attached to the single image request in exactly this order. Heads master was neither used nor attached. Camera: orthographic right-facing three-quarter side gameplay; consistent upper-left light. No cape, crest, eyepatch, shield, or Guan Yu substitution.

Current [figure definition](../../../src/game/art/figures.ts#L228) is authoritative: body `0x6e5a1e`, trim `0xd8bc50`, gear `0x3a2a0a`, helmet, glaive, full beard `0x3a2a12`, no cape, skin `0x4c3629`, fierce face. BOSS_HUGE height1.02/bulk1.34/shoulders1.26/head0.9 are build proportions, not new core numbers. Masters have painted tonal variation; no claim their pixel skin equals the procedural palette.

[Weapon data](../../../src/game/art/figures.ts#L112-L119): glaive length76 canonical units, haft5.2, crescent blade, red socket tassel. Whole metal butt-cap→outer metal blade-tip is the measured rigid length, never tassel or bright highlight. Masters are unarmed; weapon is authored from this existing original game specification. [Figure box](../../../src/game/art/rig.ts#L24-L28)96×92; [boss display fallback](../../../src/game/scenes/GameScene.ts#L652-L664)124u. Review scale124/477 is a **source-only inspection hypothesis**, not persisted registration or a runtime scale override; all six use it identically.

## Exact current action inventory (read-only core)

[Enemy definition](../../../src/core/enemies.ts#L109-L128): HP260, speed1.0u/tick, default sword.heavy, hitstun10t, thinkInterval24, fireInterval0. Boss normal think12–20/enraged5–10, enrage≤0.4×260=104HP. [AI](../../../src/core/ai.ts#L128-L160) approach x speed1.0/1.4 normal/enraged, y multiplier0.7 (0.7/0.98), charge when horizontal distance>110, melee distance≤30 and depth≤10, combo probability0.6; attack completion resets think to10–30. Attack ID words do NOT change the glaive.

| Core binding | Existing profile clip | startup / active / recover | Total | Damage / reach / arc / knockback | Ordered source plan |
|---|---|---|---|---|---|
| charge.crush | finisher | 12 /22 /22 |56t|14 /32 /14 /6; knockdown|guard→windup→crushing advance→brake→guard|
| sword.combo | jab1 |9 /4 /12 |25t|9 /30 /10 /1; no knockdown|guard→draw back→glaive strike→recoil→guard|
| sword.heavy | jab2 |16 /6 /24 |46t|14 /34 /12 /4; knockdown|guard→heavy preparation→committed chop→recovery→guard|

[Attack source](../../../src/core/attacks.ts#L154-L160), all aerial=false, aoe=false. [AI charge](../../../src/core/ai.ts#L50-L61) advances3.2u/tick only stateTick∈[12,34), returns walk at≥56. Above windows are core exposure boundaries, NOT invented per-drawing key schedules. Exact prepared frame exposure keys remain pending accepted drawings.

[Current boss profile](../../../src/game/art/motion-profiles.ts#L132-L151) requires idle/walk/hurt/fall/getup/jab1/jab2/finisher; regular page only, jump=false, special=false, mounted=false, grabs=true (being held/thrown included).

| Applicable state/semantic cue | Required artwork and clock | Source status |
|---|---|---|
| idle / approach / walk / stop; both facings; normal/enraged | Shared guard + genuinely alternating contact/pass poses; approach follows AI displacement, enrage changes speed not identity | Initial six-drawing walk candidate unaccepted |
| retreat | Reverse locomotion when observed/injected; current boss AI always approaches, no autonomous retreat state | Defensive semantic, not claimed normal AI coverage |
| hurt/hitstun |10t, then walk | Pending misc |
| knocked down / falling / impact / down | shared down bookend; knockdown36t | Pending fall |
| getup |24t, down→kneeling→standing→exact guard bookend | Pending getup |
| grabbed / upright held / escape | holder pins, hold90t then collapse; not own attacking grab | Pending misc/fall/getup |
| thrown flight / ground impact | speed3.5, travel90 or stage edge, launch z10; physics/event progress, enemy own AI clock paused | Pending fall; not a fixed guessed flight duration |
| dying / dead | dying50t then removal; family-consistent collapse/dead bookend | Pending fall/misc; no normal enemy revive |
| charge/combo/heavy | exact bindings/windows above, interruptions preserved | Pending |

[Constants](../../../src/core/constants.ts#L27-L54), [AI clock exclusions](../../../src/core/ai.ts#L30-L35), and [throw/grab simulation](../../../src/core/sim.ts) govern these boundaries. No hero jump/kick/special/mount/shoot pages authorized or planned. No old rig poses fill missing artwork.

## Walk request and review disposition

[Exact submitted prompt](walk-prompt-1.txt), SHA-256 `6ae91c1852cbdade4f8fe1c8b1a054b3cfb03d2fa7d54cc5724f78bd37b7f43b`. [Original output](walk-candidate-1.png), SHA-256 `dfd7bd87e424c6a50621908eed5a0c950852ea61c033c932955b50e175eb92f7`,1536×1024,2180302B. Preferred provider gpt/high; actual backend was not explicitly returned, no fallback notice. Single successful tool call, no retry. Ledger reserved BEFORE call: Xu Chu0→1/12, walk0→1/2, global143→144/200.11 fighter requests and56 global remain; no repair request/reservation/refund.

Opened [gameplay sheet](walk-candidate-1-gameplay.png), [4x sheet](walk-candidate-1-4x.png), [detail sheet](walk-candidate-1-landmark-detail.png), [marked upper row](walk-candidate-1-marked-row0.png) and [marked lower row](walk-candidate-1-marked-row1.png). Still/source review only, no native video or runtime capture.

**NOT ACCEPTED — HOLD, do not prepare/publish or request downstream sheets from this anchor.** Strong identity match: all six retain huge brown armored torso, short full beard/plain helmet, connected two-hand glaive grip, no obvious extra limbs. Genuine pose differences exist, but ordered gait contract is not established: cells1/2 both extend the leading foot with heel presented rather than cell2 being an under-hip support/passing pose; cell3 is another long-stride heel presentation rather than convincingly opposite contact; cell4 is trailing heel lifted rather than the requested forward passing leg. Cell5 is stance rather than visibly braking step. Near/far leg correspondence needs review, not an alternating gait pass.

Fixed conceptual512px cells were ignored: cell0 blade reaches/crosses x512 into next cell, no generous blade margin (alpha support at cell0 right edge; adjacent cell's x0 carries it). Sheet is not outer-edge clipped at right (last tip has margin), but blind fixed-cell cropping clips/cross-contaminates cell0. Bounds need explicit extraction rectangles or a safe layout correction before registration. Target360px body/300px weapon became roughly477px body/513–523px weapon. This is prompt noncompliance; no silent per-cell body shrinking or figure-data edit is permitted. Weapon is about134.55u at the *review hypothesis* scale, not evidence of accepted76u geometry. Correct scale/body-weapon hierarchy must be resolved before fixing any band.

The PNG has genuine alpha0–254 (no fully255 pixels), six readable silhouettes and no checkerboard ink. The tool preview's brown backdrop was not source background. Generic threshold/keying needs scrutiny to preserve semi-opaque painted interiors; no alpha cleanup has been accepted.

Landmarks were first marked then corrected for proved off-pixel tips/beards; provisional15.43% visible-head scatter was **withdrawn**, not an art fail. Corrected numerical values are in [measurement report](walk-candidate-1-measurements.json), source coords and endpoint RGBA retained. Weapon lengths523.18,519.31,517.22,512.88,518.77,514.16px; diagnostic spread1.9901%, neighbor direction max0.6504°. This is promising local geometry evidence, not full-pack compliance. Brow→beard heights48,49,49,50,53,53px yield9.9338% **provisionally**; final cell5 tip alpha46 remains low-confidence and crown is helmet-occluded, so no head PASS. +/-1px endpoint perturbations can cross10% (e.g.47 and54 gives13.91%); head result is fragile even before uncertainty. Helmet→beard4.888% is secondary **helmet-inclusive** support and never substituted for anatomical head.

No accepted anchor means **fixedBand=null**, no pack-projection state initialized, no recordSheet acceptance. A labelled diagnostic evaluateProjection call gives OK1.99% at hypothetical128.08–141.57u window; these are NOT a fixed/authorized brief band. Unknown is not a pass, and later work must not consume that hypothetical window as acceptance. No shaft retouch performed: length spread has no proved outlier, while gait/layout/relative-length/uncertain head are different defects. No Acceptance-4 repair reserve is charged merely to change gait.

## Remaining acceptance and next bounded action

Remeasure final visible-beard endpoint against alpha and enlarge complete silhouette edges; inspect exact near/far foot contacts and source body/weapon hierarchy before spending. Determine whether safe local layout/order corrections can salvage a genuine cycle; otherwise existing allowance permits one remaining walk whole-sheet candidate, but this package does not request it. Preserve candidate1. Only accept a defensible anchor then fix ONE global band via fixBand and recordSheet; do not recenter later. Charge/combo/heavy/misc/fall/getup remain ungenerated. Fixed pivots/ground≤1.5u, pages≤2048²/density2/≤16MiB, deterministic CMR-04 preparation/hash/exposure map, offline continuity/shared bookends and independent producer review all pending. CMR-15A stays IN_PROGRESS and CMR-15B unavailable. CMR-14A remains blocked and untouched.
