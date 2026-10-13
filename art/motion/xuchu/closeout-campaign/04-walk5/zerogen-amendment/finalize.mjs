// Finalize cmr15a-walk5-zerogen-amendment: fill visual verdicts (personally read:
// orig/gpt final cells, marked, head-3x, legs-2x, tip-4x, soles-4x, sequence +
// compare sheets at gameplay size, legs sequence 2x) and bank at most one.
// Hash-pinned; re-runnable (banked copy byte-identical check).
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const dir = 'art/motion/xuchu/closeout-campaign/04-walk5/zerogen-amendment/'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const gate = JSON.parse(readFileSync(dir + 'gate.json', 'utf8'))
const orig = gate.candidates.find(c => c.id === 'orig')
const gpt = gate.candidates.find(c => c.id === 'gpt')
if (orig.finalCell.sha256 !== '89afcca7c4af1c757cd2500c240ce5a276ad29964925ee566e5f6500f75c4b07') throw new Error('orig hash drift')
if (gpt.finalCell.sha256 !== 'e34fb95852f495cc72cbc5da3999b326b090f2ce45528bfe7ff29767e16852f9') throw new Error('gpt hash drift')
if (!orig.allNumericPass || !gpt.allNumericPass) throw new Error('numeric assumption drift')

orig.verdicts = {
  identity: 'PASS (orig-final.png + orig-head-3x.png personally opened: original candidate-2 sheet pixels — same blunt-faced helmeted full-bearded ochre/dark-armoured massive Xu Chu as banked walk:0/1 from the same sheet and walk:2/4 anchors; no drift)',
  anatomy: 'PASS (full + orig-legs-2x.png: connected two-hand glaive grip, natural hip/skirt overlap, both legs naturally connected, no extra/floating/mitten limbs)',
  seams: 'PASS (whole extracted component — no splice/retouch seam; greenPx=0, magentaPx=0, zero edge-opaque px; component xmax 1514 in the 1536 sheet so the blade tip is complete inside the sheet (orig-tip-4x.png), neighbouring walk:4 blade fragment of the nominal cell excluded by component extraction; clean at gameplay size and 4x)',
  weaponLengthCorridorDirection: 'PASS (fresh raster 135.10u in frozen band [124.41,137.50]u, angle delta +0.79deg, corridor butt 4.02/tip 3.11px vs 14px, tip inside frame; NOT an in-frame length outlier, so per the grant no shaft retouch was applied)',
  scaleGround: 'PASS (one uniform registration factor 1.0361, +3.61% within +-12%; body 458px@512 vs frozen 459 (delta -1px, same as banked walk:0), ground 500@512 = 0.00u)',
  gaitStopSettle: 'PASS under the amended definition (fresh boot raster + sequence/compare sheets personally opened): front (screen-right) boot flat planted — sole 492@512 (the +8px row offset vs the rear boot is the same drawing convention as banked walk:0 front 493), heel 491/toe 492, heelRaised 1px, toeRaised 0px = flat, centre x296.5 which is 23.5px ahead of walk:0 guard front centre 273 (planted ahead); rear (screen-left) boot grounded full-flat sole 500@512, heel 498, heelRaised 2px (grounded/closing, NOT toe-off); no passing leg (both boots grounded, neither tucked/clear like walk:4 passing toe 469@512); weight upright over the two grounded boots, reads as the step after walk:4 Passing-A settling (walk:4 passing foot comes down ahead) toward guard',
  distinctness: 'PASS — not a guard duplicate: stance centre-span 196px vs walk:0 171px (+25px), front toe x352 vs 323 (+29px ahead), full-silhouette XOR vs walk:0 18.56% of union and leg-region (y>=340) XOR 26.85%; visually the front leg is extended forward at a stride angle vs guard near-vertical front leg. Not a walk:1/walk:3 contact repeat: BOTH heels are down (rear heelRaised 2px) whereas walk:1 rear heelRaised=15px (toe-off, plus front heel-strike toeRaised=16px) and walk:3 rear heelRaised=9px (toe-off); silhouette XOR vs walk:1 17.37%, vs walk:3 23.94%',
  continuityWalk4To5To0: 'PASS (sequence-orig-gameplay.png at gameplay size + sequence-orig-legs-2x.png + orig-soles-4x.png personally opened): walk:4 Passing-A (support sole 500, passing toe clear at 469) -> candidate (passing foot landed flat ahead 492, rear still grounded 500, wide double support) -> walk:0 guard (stance narrows 196->171px, both flat): a coherent final-step settle with shared crown/ground/weapon corridor, no scale/identity jump',
  headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (0px clear gap — beard tip over collar on orig-head-3x.png, as on every banked Xu Chu key; batch-end UNVERIFIED_OWNER_ACCEPTED ruling reserved only if all other gates pass — they do here)',
  overall: 'PASS — every campaign gate passes under the amended walk:5 definition',
}
gpt.verdicts = {
  identity: 'PASS (gpt-final.png + gpt-head-3x.png: same Xu Chu as anchors; carried pixels, retouch touched only the weapon region — outside-weapon hash proof in gptBuild)',
  anatomy: 'PASS (connected grip, natural legs; gpt-legs-2x.png)',
  seams: 'PASS (greenPx=0, magentaPx=0, zero edge-opaque; retouch joint at (424,116) continuous on gpt-tip-4x.png at 4x and invisible at gameplay size; seam width match dLo/dHi -0.32px)',
  weaponLengthCorridorDirection: 'PASS after retouch (registered raw 139.49u by prior hand landmarks / 140.39u fresh raster OUT_HIGH -> retouched 131.90u in band [124.41,137.50]u, angle delta -0.48deg, corridor butt 4.20/tip 8.43px vs 14px; outside-weapon-region RGBA hash identical, 0 changed px outside)',
  scaleGround: 'PASS (carried from registered cell fcca9950: body 459px@512, ground 0.00u; retouch changed weapon-region pixels only)',
  gaitStopSettle: 'FAIL under the amended definition (conjunctive). Front foot IS planted ahead flat (sole 500, centre x374). BUT the rear foot is NOT grounded/closing: it is forefoot-only toe-off — heel 479@512 vs toe/sole 497@512, heelRaised 18px by fresh raster (prior hand landmark 23.5px), visible heel-lift on gpt-soles-4x.png and sequence-gpt-legs-2x.png. AND that makes the contact arrangement front-flat + rear-toe-off = the walk:3 Contact-B arrangement (walk:3 rear heelRaised 9px) of the same walk:1/walk:3 contact family the amendment explicitly excludes ("not a repeat of the walk:1/walk:3 contact arrangement"). Silhouette XOR is large (vs walk:0 43.42%) but the named arrangement exclusion is about contact pattern, not silhouette distance.',
  distinctness: 'FAIL on the contact-arrangement clause (above); not a guard duplicate (stance 234.5px, widest of the set), but distinctness via a wider stride does not cure the excluded front-flat/rear-toe-off repeat',
  continuityWalk4To5To0: 'FAIL as a settle (sequence-gpt-gameplay.png): after walk:4 Passing-A it reads as another forward stride/contact, then stops abruptly at walk:0 guard; no weight settling (carried-forward stride, rear trailing)',
  headEndpointRAW: 'RECORDED_RAW_NOT_A_REJECT (0px gap, beard over collar; batch-end ruling unavailable because the gait gate fails)',
  overall: 'FAIL — NOT banked (failing gate: amended Stop/Settle rear-grounded + no-contact-repeat clauses). All weapon/body/ground/seam/identity gates PASS after retouch; failure is gait-only and incurable deterministically',
}
orig.overall = 'PASS — BANKED (see banked)'
gpt.overall = 'FAIL — NOT banked (no accepted copy of the GPT candidate)'

copyFileSync(dir + 'orig-registered.png', dir + 'accepted.png')
const accSha = sha(readFileSync(dir + 'accepted.png'))
if (accSha !== orig.finalCell.sha256) throw new Error('banked copy hash mismatch')
orig.banked = { acceptedPath: dir + 'accepted.png', acceptedSha256: accSha, byteCopyOfFinalCell: true, registeredSha256: orig.finalCell.sha256, extractedSha256: gate.origBuild.extracted.sha256, sourceSheetSha256: gate.origBuild.source.sha256, shaftRetouchApplied: false }
gpt.banked = null
gate.visualVerdicts = 'FILLED per-candidate (finalize.mjs) after personal read of both final cells, marked/head/legs/tip/soles imagery and sequence/compare sheets'
gate.disposition = 'BANKED exactly one walk:5: the original candidate-2 component extraction (accepted.png = byte copy of orig-registered.png 89afcca7...), the ONLY candidate passing every gate. The GPT candidate (retouched e34fb958...) is NOT banked: weapon/body/ground/seams pass after retouch but its rear toe-off repeats the walk:1/walk:3 contact arrangement the amendment excludes. Stronger-candidate choice is therefore forced, not preferential. CMR-15A stays IN_PROGRESS; Phase 3 NOT started in this package; not DONE; ledger unchanged Xu Chu 13/global 180.'
gate.bankedCount = 1
gate.acceptedPath = dir + 'accepted.png'
gate.acceptedSha256 = accSha
if (existsSync(dir + 'gpt-accepted.png')) throw new Error('unexpected gpt accepted file')
writeFileSync(dir + 'gate.json', JSON.stringify(gate, null, 2) + '\n')
console.log(JSON.stringify({ banked: gate.acceptedPath, sha: accSha, gptBanked: false }))
