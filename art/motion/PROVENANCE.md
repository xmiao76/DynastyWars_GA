# Guan Yu motion experiment: original generated candidates

2026-09-30. All requests made through `image_generate`, provider **preference** `gpt`, high quality, 1536x1024. Actual serving backend/account is not disclosed by the tool and is not asserted here. Images are original AI-assisted sprite sheets, not copyrighted arcade assets. None are labelled quality-approved masters.

## References

- Neutral sequence guides authored in `test/game/motion-guides.test.ts` and retained under `guanyu/guide-{walk,jab1,jab2,finisher}.png` with exact joint metadata. Fixed box 224x144, ground y136, nine512x341 cells.
- Existing original whole-frame Guan Yu idle: `../whole-frames/guanyu/idle-master.png`, SHA256 `79def099ff6ae033731de7008bb574f3613e0cbb5a528f8e479862c4a1d971b7`.
- Walk candidate1 as the shared identity/style reference for all combat sheets.

Guide hashes: walk `a6f23d816893f27e313efda3bb2d83ea9e5f438c100d17ad644342f52d99c3a7`, jab1 `eeb1a17f7718b817403e80d9992db779bfb0bd24f8ea177fa93c05f405ba97e2`, jab2 `dfba003ee83862f984a72d15aa4b5602eadd832b1dab40f38e747e66a04e06f9`, finisher `4cac1a3bc50a8ae30c495e1da8611197d0c7f5fd68244d3e881e7d25d26f966e`.

## Requests and outcomes (7 requests total; budget12, max3/action)

| Candidate | SHA256 | Ordered references | Outcome |
|---|---|---|---|
| walk1 | `363343423be5447ea9caa690e188fdadf23818c9255c4bba280d6d52aac4f642` | walk guide, old idle | Retained diagnostic runtime source. Eight visually distinct drawings, but opposite-leg alternation unreliable; cloth/boots drift. Not accepted. |
| jab1-1 | `7a95a68bc462fe97ae95f69e81d9c0549f0aca535806f36a8b1f44735a621a91` | jab1 guide, walk1, old idle | Retained diagnostic source; low sweep sequence present, visible pole severely shorter at strike, source figures cross nominal cells. Not accepted. |
| jab2-1 | `13d3da413ed40ad85d201c31f8e6b146aeaf9383ad38416d002f107660d3c5c3` | jab2 guide, walk1, old idle | Retained diagnostic source; good chest-height strike drawing but variable body mass and haft. Not accepted. |
| finisher1 | `444d618574df85568504e40af8269d6cc57753de7724ddd2e10d486832c7cabf` | finisher guide, walk1, old idle | Retained diagnostic source; high-to-low chop visible; changed blade curvature and short haft on active pose. Not accepted. |
| walk2 | `9d44474ab5a93038c8d65a6d1af5cd01b3a5939b8307acc93df25567db8e7429` | walk guide, walk1 | Correction for precise opposite-leg order: same walking bias persists. Rejected. |
| walk3 | `5c881bc8a52012b9a029ad49ff1fb7bb5abf0c3526d79a879fa7cb6b46f1a2e9` | walk guide, old idle | Stronger instruction to copy lifted-foot silhouettes: high stepping and forward-foot bias remain. Rejected; reached walk's3-request cap. |
| jab1-2 | `8018c71031ffdfeba6657c165da414fa77dbbb5c4abd191acc46190c8dd557fd` | jab1 guide, walk1, jab1-1 | Requested rigid300px guandao and60px grip separation; blade still shrinks and front hand/haft design inconsistent. Rejected. |

## Prompt record

All sheets requested the EXACT guide3x3 layout, same cell pivots/ground/proportions, same right-facing camera/lighting, the original red face and long black beard, green headcloth/green gold-trimmed robe/cream cuffs/bronze armour and boots, no cape, one rigid brown guandao with engraved silver/gold crescent and red tassel. All requested transparent background and explicitly excluded glow, shadow, text, scenery, panels and effects. The returned alpha contains low-opacity glow anyway; prep retains only alpha-support around opaque connected figure components.

Walk1: cell0 idle, other8 a closed contact/lift/pass/swing/opposite-contact cycle; no repeating stance. Walk2: explicitly describe near-forward, far-lift, far-pass, far-forward, opposite contact, near-lift, near-pass, near-forward. Walk3: state exact guide raised/grounded foot silhouettes per middle/bottom cell and do not override them with the identity stance.

Jab1-1: idle -> begin coil -> diagonal coiled windup -> lower forward -> wide low crouched horizontal sweep -> low follow-through -> retract/raise -> settle upright -> identical idle. Jab2-1: same ordered phases, chest-height two-handed strike and narrower stance; additional20px safe-cell padding and no enlarging figures. Finisher1: same bookends, up/back preparation -> high-to-low chop -> down-forward follow-through -> recover; same rigid weapon throughout.

Jab1-2 correction: identical guide layout, guandao about300px butt-to-tip in EVERY cell, same75px blade,60px strike grip separation, visible butt behind rear fist, head35px, no growth at row boundaries. Output did not satisfy those requests. Prompt instructions are not evidence of a compliant result.

## Preparation and registration

`guanyu/registration.json` records the chosen candidate source, a single scale per sheet (0.36 /0.332 /0.345 /0.358), per-figure translation pivot/floor and three approximate visible weapon endpoint measurements. The scale choice normalises whole-sheet body size; it does not normalise individual drawings or replace a misshapen weapon. Most head/weapon landmarks remain **null**, not fabricated successes. Component extraction is used because model framing spills across nominal cells.

The diagnostic atlas contains36 cells at density2. Playback shares walk0 as all combat bookends (no distinct redrawn idle flicker). This reuse is an explicit runtime choice, not a claim that generated bookends match exactly. Seven painted action drawings/action are retained and used, with shared idle replacing both independently redrawn bookends; nine-cell count is not a claim of nine unique displayed drawings.
