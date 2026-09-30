# Whole-frame pilot masters — provenance

Original painted whole-figure frames for the whole-frame pilot
(docs/WHOLE_FRAME_TEST.md), generated 2026-09-30 with the `image_generate`
subscription tool (default GPT preference; output 1024x1536 / 1536x1024, high
quality). The provider returned alpha-transparent PNGs; the preparation script
uses that alpha and keys #FF00FF only when no alpha is present.

No actor image, copyrighted game sprite or third-party art was supplied.
References are this repository's own generated masters.

## Inputs per attempt (in reference order)

1. The pose guide `guanyu/guide-<pose>.png` (grey mannequin drawn from the rig
   by `test/game/wholeframe-guides.test.ts`: exact joints, painted-head scale,
   procedural glaive geometry, flat #FF00FF).
2. The finished idle frame (attack and down only), for identity.
3. `art/fighter-bodies/guanyu-body-master.jpg`
   (sha256:c68c9b4f97095ce0a3743f500cbfef5f60dfac9dd6708b706239409fc8aa519c).
4. `art/hero-faces/guanyu-portrait-master.png`
   (sha256:65a639d558e11a2186f43c415dd83ea444b2901e7ff3266dd9b24fb34cdaab98).

Every prompt asks for figure 1's exact pose, silhouette, proportions and
weapon placement. It fixes Guan Yu's identity (date-red complexion, phoenix
eyes, very long black beard, green headcloth, green gold-trimmed robe, bronze
lamellar armor, bronze boots, a guandao with a crescent blade and a red
tassel), semi-realistic painting, light from the upper left, full figure
facing right, and a flat magenta or transparent background with no shadow,
scenery or text.

## Attempts (all kept under artifacts/wholeframe/attempts/, gitignored)

| Pose | # | sha256 | Verdict |
| --- | --- | --- | --- |
| idle | 1 | 913cd51274e025afe65c9c22d6465c2dd85bef09ba80ef96ba4c7c079c124731 | rejected: glaive drawn ~1 head short (blade point 7.9u below the guide's; weapon length is gameplay-visible) |
| idle | 2 | 79def099ff6ae033731de7008bb574f3613e0cbb5a528f8e479862c4a1d971b7 | **accepted** -> `guanyu/idle-master.png` (prompt adds: blade rises more than one head-height above the headcloth) |
| attack | 1 | de94b2e792f5154219fe4c3ef203a6e80322e898fede1898a1a5277db19cfb75 | **accepted** -> `guanyu/attack-master.png` |
| down | 1 | 08db755f80708793797db7b1e59283c73499c84b12c92f6a60236f5ce640948b | rejected: guide coverage 0.875 with the glaive shortened at both ends |
| down | 2 | f6629cf98b59c54abe1fae0036ab742fa44ed175560052e96da3437184a401b3 | **accepted** -> `guanyu/down-master.png` (prompt adds: butt left of the head, blade point right of the boots) |

5 images for 3 accepted frames (budget 12).
