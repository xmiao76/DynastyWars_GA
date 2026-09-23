# Original painted face assets — ART-18

Generated for this repository 2026-09-23 with the image_generate subscription tool
(default GPT preference; tool output did not identify the serving backend).
Original character designs; no actor image or copyrighted game sprite supplied.
Literary/reference direction: docs/HERO_FACE_REFERENCE.md.

## Pilot masters

- guanyu-portrait-master.png: tool attachment
  sha256:65a639d558e11a2186f43c415dd83ea444b2901e7ff3266dd9b24fb34cdaab98
  Prompt: original semi-realistic mature Han Chinese Guan Yu, date-red skin,
  phoenix eyes, silkworm brows, subtle red lips, long beard, practical green
  headcloth exposing forehead, green/bronze bust, warm upper-left light.
- zhaoyun-portrait-master.png: tool attachment
  sha256:dff5916763d8a3f1ebaa1fe9c40e9083d1d10278e50f340d9bb3b17a67d0a60a
  Prompt: original semi-realistic adult Han Chinese Zhao Yun, broad face/full
  chin, thick brows/large alert eyes, fair warm skin, clean shaven, fitted silver
  helmet/red plume, blue cloak/silver armor, matching light and brushwork.
- guanyu-heads-master.png: reference-guided from Guan Yu portrait above,
  sha256:f32ba2d42d026b83e772561d4ecb9823b288eaee515cffe0d444814daaa9d823
- zhaoyun-heads-master.png: reference-guided from Zhao Yun portrait above,
  sha256:aef772197b8323a91f4d52a3c9d58c0ae1bbd1826347807ff0239f8aedb773ae
  Head-sheet prompts: same identity, right-facing 45-degree three-quarter view;
  neutral, exertion and eyes-closed hurt; transparent background; head/neck only;
  consistent scale, light and headgear; no torso, text or weapons.

The provider returned alpha-transparent PNGs (despite a chroma-background request
for the portraits); the preparation script preserves alpha, not a black matte.
Generated sheet columns were not uniform. Connected-component isolation and
explicit per-expression eye/chin landmarks align them without neighboring heads.

## Remaining cast masters (same generation session)

Style references: Guan Yu for Zhang Fei/Huang Zhong; Zhao Yun for Wei Yan.
Each matching expression sheet used ONLY that hero's new portrait as its source.
Prompts requested distinct anatomy, literal legendary traits, original designs,
transparent silhouettes, and matching neutral/exertion/eyes-closed hurt heads.

- Zhang Fei portrait sha256:36b41443bfe1fe0d2d66975a7f83018e1709b420cbf365dec95f871b8ee84d38
- Zhang Fei heads sha256:f4e6f22d028fea60873723c1e13a0f5a4e227ad121873932f37b684076a83c3a
  Broad powerful head/jaw, round intense eyes, coarse outward-bristling beard,
  weathered dark warm skin, black/red headband and dark armor/rust robe.
- Huang Zhong portrait sha256:4dcac826bb0f96cbd1bcaa149db433c63bde9ede651ffcb5383b455697b8de09
- Huang Zhong heads sha256:dc97991871abc5c0bb3b86885ff1ddf9d8d885241521c39b7d6c220aabaa8635
  Nearly-sixty vigorous veteran, white hair/beard/brows, weathered eyelids and
  cheek/forehead lines, ochre band and bronze armor. Not a feeble caricature.
- Wei Yan portrait sha256:0fc579c17a6ac5d6cc5f174392805021463b5f3306055f53238241a99ddea76e
- Wei Yan heads sha256:d618a73eca12179fcb3698b02833d15c8672e5239543528cdb9e874e0e4f7720
  Compact angular face/square chin, bright spirited eyes, short dark jaw beard,
  date-red complexion, purple wrap/bronze accents. No skull deformity.

Initial visual concerns remain for final pass: deepen Wei Yan's portrait flesh
consistently with its head; inspect white-hair alpha edges against multiple
backgrounds; painted heads versus flat existing bodies need transition review.
These are not claimed owner-approved final assets.

## Reproduction

`node scripts/prepare-hero-faces.mjs` reads committed masters + preparation.json,
writes src/game/assets/hero-faces/*.png and prepared.json. No generation service
or network is needed to reproduce derivatives or run the game. Master dimensions
are provider-returned dimensions, not the requested image size.

Pilot review found a down-pose attachment problem (long beard dropped below the
floor); the painted path now aligns a prone head's vertical axis to its chest.
These assets remain pilot artwork pending native-size/in-motion acceptance.
