# Wei Soldier — identity lock (CMR-06A bounded work 1)

Locked 2026-10-01 from the two ORIGINAL masters only (never palette-swapped
Guan Yu). Both observations came from fingerprint-verified `read_image`
reads (the session had a harness image-association bug - see
AUTHORING-PLAN.md - so every preview was checked against a mechanical
fingerprint of the file before use).

## Sources (ordered reference hashes)

| ref | file | bytes | sha256 |
| --- | --- | --- | --- |
| body | `art/fighter-bodies/soldier-body-master.jpg` | 187,637 | `73d66d7dda005cd0135dd33bdb6c05fa19a3dcdccb3a05ef6317144671c88a5d` |
| portrait | `art/mook-faces/soldier-portrait-master.jpg` | 243,493 | `b511f6e1e7a536321089dbdfee23b40569d71cc68bc56c4929417b96ec81b828` |

Fingerprints (mechanical): both 832x1248 opaque; body 85.2% near-black
(mean RGB 16,10,7), portrait 76.7% (27,19,14) - figure masters on black.

## Identity / costume / weapon

- Build: light rank-and-file infantryman (mook scale, shorter and simpler
  than the heroes), young clean-shaven face, calm set expression, black hair
  fringe under the helmet.
- Headgear: dark iron/bronze DOMED helmet - riveted band, small top
  finial knob, narrow brow band. Plain, not officer-ornate.
- Armor: dark oxblood lamellar plates (shoulders/chest) with visible
  lacing/studs over a maroon/tan under-robe with wide dark sash; dark
  trousers; brown leather boots. No cape.
- Weapon: ONE rigid straight sword - dark wrapped grip, simple round/oval
  guard, straight steel blade with a short point; same design and size in
  every drawing. Held in the RIGHT hand (body master: blade up).
- Camera: 3/4 front-right, full figure including boots and full blade.
  Light: upper-left key, restrained painted semi-realism (house style).
- Fixed scale/registration for the pack: cell 512x341 at density 2
  (display box 256x170.5 logical... pack box 224x144-class per CMR-01
  inventory hierarchy - mook below hero); feet on the cell ground line;
  identical scale and camera in every cell.

## Observability landmark budget (acceptance 4)

Weapon-length measurement is only valid where the blade is FULLY observable
(unoccluded, unforeshortened); head-size comparison uses the helmet width.
Measured values land in the pack report; anything else is recorded
`unverified` and cannot establish compliance.
