# CMR-01 — Guan Yu accepted-reference freeze

Frozen 2026-10-01 by the CMR-01 consumer attempt 1 (local commit recorded in
PROGRESS). Planning baseline `540501c` (contract `docs/CAST_MOTION_ROLLOUT.md`);
Guan Yu implementation history `d7d44eb`, `c2cf3fa`, `33e207f`, `a6c6057`.

The accepted reference is the current visual result. This manifest pins it so
later atlas repacking (CMR-03/12/21) cannot silently change displayed pixels
or timing.

## File/page hashes

All four pack files are **byte-identical to `540501c`** (verified with
`git show 540501c:<path> | sha256` vs the working tree, 2026-10-01):

| File | Bytes | sha256 |
| --- | --- | --- |
| `src/game/assets/motion/prepared.json` | 32,401 | `83cb375fe99836b961d121a0eae5ee809889ae45443efa1bb72943527cf8419c` |
| `src/game/assets/motion/actions-prepared.json` | 33,853 | `b83bd48cf8ab71ec9d9fd4cd4cbb0e1dcdc755c956f4d57f7191f36c78c99d37` |
| `src/game/assets/motion/guanyu-motion-sheet.png` | 1,827,406 | `6a71c30be04c9daefa55471f5cef19e5027f4bbb3a2ac57a9d829da5213e3ba9` |
| `src/game/assets/motion/guanyu-actions-sheet.png` | 2,616,482 | `e9049a25f615c79d7f2f2386cdbb8d422a6e190a20ac639d0fc2d9495836b2e7` |

(Regenerate by re-running the freeze probe; `guanyu-reference.json` → `files`
holds the same values.)

## Pack geometry (from `prepared.json` / `actions-prepared.json`)

- motion pack: `revision motion-1`, density 2, box 224×144 logical, `groundY 136`
  (the vertical anchor — the current pack predates per-frame pivots; cells are
  raw device rects with **no trim/pivot fields**, so `box.groundY` is the only
  placement anchor and repacks must keep it).
- regular page `guanyu-motion-sheet.png` 1344×3456 (4,644,864 px);
  actions page `guanyu-actions-sheet.png` 2688×2592 (6,967,296 px);
  combined decoded RGBA 46,448,640 bytes.
- frame cells 448×288 device (224×144 logical at density 2).

## Per-displayed-frame hashes

`guanyu-reference.json` (committed next to this file) holds all **90 frames**
(regular `walk:0-8`, `jab1:0-7`, `jab2:0-7`, `finisher:0-9`; actions `jump:0-8`,
`fall:*`, `getup:*`, `misc:*`, `special:*`, `rider:*`) with per-frame:

- `rgba`: sha256 of the frame cell's full RGBA (the displayed pixels),
- `rect`: the page rect `[x,y,w,h]`,
- `pivot`/`trim`/`src`: recorded as `null` — **absent in this pack** (see above),
- `exposure`: the ordered clip tick(s) at which the frame displays,
- `exposureHash`: sha256 of that exposure list.

`guanyu-reference-frames.tsv` is the compact review copy
(`<frame>\t<rgba-16>\tpivot\t<exposureHash-12>`).

Clip timing itself is pinned by a single hash over the whole clip table
(`guanyuClips()` from `src/game/art/motion-clips.ts`):

- **clipsHash `513e9ff07266556d02db8a8213c2c07e989547575400fd1423dc5f8b811765a7`**
  over 20 clips (walk, jab1, jab2, finisher + 16 ActionClips), including each
  key's `tick` → `frame` pair and the loop/duration flags.

Any future repack (CMR-03/12/21) must reproduce every `rgba`, `exposureHash`
and `clipsHash` value here before it may merge.

## How to re-verify

```
node -e "const c=require('crypto'),f=require('fs');for(const n of ['prepared.json','actions-prepared.json','guanyu-motion-sheet.png','guanyu-actions-sheet.png'])console.log(n,c.createHash('sha256').update(f.readFileSync('src/game/assets/motion/'+n)).digest('hex'))"
git show 540501c:src/game/assets/motion/<file> | sha256   # baseline equality
```

Per-frame re-verification needs the freeze probe (vitest + @napi-rs/canvas:
load both pages, blit each `frames` rect, sha256 the RGBA; hash
`guanyuClips()` keys for exposures). The probe was scratch (deleted after the
manifest was written); CMR-02..05 retrieve the manifest from this directory
rather than re-deriving it.
