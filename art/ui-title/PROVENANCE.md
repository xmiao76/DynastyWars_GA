# Title key art (UI-2)

- Master: keyart-master.jpg (1248x832 JPEG, sha256
  a5be2dca6d051f4ddbce3e5203b24414f61bed127b9e243ac8e8ea11ee358363)
- Generated 2026-09-23 with the image_generate tool, grok provider
  (GPT subscription quota-exhausted; owner logged into Grok same day).
  Original Five-Tigers-homage composition over a burning Red-Cliffs fleet;
  no actor image or copyrighted game sprite supplied. Prompt asked for no
  text; the model still printed a gibberish pseudo-Chinese caption along
  the bottom stone strip.
- Derivative: src/game/assets/title/keyart-backdrop.jpg (960x540, q82,
  119012 bytes, sha256
  5f0edde5b8c49ee5ede8ada401e01c3e71a8ec7034acb3e82038deb5adaa5a68)
  via scripts/prepare-title-art.mjs - 16:9 cover-crop taken entirely off
  the bottom (removes the caption strip), downscale, baked bottom scrim.
  Rebuild: `node scripts/prepare-title-art.mjs` (deterministic from master).
- Reviewed 2026-09-23 in-game (artifacts/look/ui2-title-{desktop,phone}.png):
  caption strip gone, five heroes (green-robed glaive, black-bearded serpent
  spear, silver-helmed spearman, white-bearded archer, purple-turbaned
  sabre) readable at 480x270; the control plaque sits in the baked scrim
  below their faces.
- Fallback: src/game/art/keyart.ts procedural dusk battle paints the title
  backdrop whenever the photo texture is absent (TitleScene picks the photo
  only when BootScene decoded it).
