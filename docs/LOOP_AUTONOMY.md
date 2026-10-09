# Bounded loop autonomy — owner-approved v1

Owner approved implementation on 2026-10-09 after reviewing the stop–ask–reset pattern. This policy authorizes routine decisions inside an existing task, not unlimited attempts/spend or weaker acceptance. It supersedes ordering-only rollout dependencies and the old *global pause for every task-local BLOCKED outcome*. Narrower explicit owner exclusions, quality waivers and expensive-request authorizations remain binding. No automatic reset of previously BLOCKED tasks.

## Standing execution envelope

For a ready task, the main agent may inspect existing files/art, generate local crops/overlays, correct proven measurement errors, develop scoped scripts/tests, safely repair local sources, prepare/measure/capture/review, record outcomes and locally commit verified changes. Ordinary downstream close-out is included; do not ask for every command, render, marker correction or record step.

An approved art request may be generated only after the existing authoring/repair ledger reserves it. Rejection does not refund it. Resource/request caps, per-sequence limits and previous owner scope restrictions do not move. No new credentials/model accounts, paid resources, permission escalation, core rebalance, push/deploy, default activation or destructive recovery. Those remain owner decisions. Keep failed pictures and hashes; unknown evidence is not a pass; staged/rejected art is not a completed pack.

Timebox: one complete task package up to **25 minutes** (for half-hourly cadence, reserve time to finish/release). No artificial cap on inexpensive commands/overlay opens beyond actual capability/risk/time. For foreground economical delegation, give exactly one worker the selected task's bounded end-to-end package: inspect → measure → correct proved errors → evaluate → persist evidence → applicable tests → return. Main yields repository writes until the foreground call settles; no async continuation, nested runners or extra writer. Specialist read-only orders stay read-only. Main reviews critical evidence, actual diff and acceptance; neither delegated work nor a new strategy resets attempts or spending. Do not relay numeric tables from memory—use hashed source/artifact paths and re-derive.

## Planner and state ownership

- `.loop/autonomy.json` enables the policy, a 25-minute package and **three total failed recovery iterations**. Older profiles without this file retain old strict behavior.
- `node scripts/run-loop.mjs --preflight` is read-only: current pause/lock, cadence, dependency readiness and waits. A due review wins. Read current spec/envelope, not all historical task records.
- Queue uses `- Requires: ID, ID` (or `none`) for real prerequisites. Explicit Requires supersedes legacy Dependency prose. Unknown/cyclic dependencies fail closed. Completed milestones stay as short DONE queue stubs; archived history is not a scheduling parser input.
- Continue earliest ready IN_PROGRESS; otherwise first ready TODO, skipping parked/unready branches. One task/writer at a time. A dependency ordering change is not permission to ship incomplete art. Every B still requires its own A DONE; final pair/full-cast tasks require all current cast B packs DONE.
- Previously owner-deferred/exhausted BLOCKED tasks stay BLOCKED. A ready independent task does not inherit another task's request allowance, failed recovery count or waiver.
- Changed task queue block plus an authorized ready status can resume owner-wait parking. A provider wait can wake at disclosed time or changed watched inputs. No automatic owner block expiry, task status edit, budget refund or lock/global pause reset.
- Runner owns ignored `artifacts/loop/state.json`, active-run metadata and exclusive lock. The worker owns scoped queue status/evidence. No worker hand-edits runtime state, schedules or locks.

## Outcome contract

Keep exactly one final standalone `LOOP_RESULT: ...` marker. Optional **one** JSON line immediately above it specifies a classified outcome. Legacy BLOCKED without a valid classification still globally pauses. REGRESSION/unsafe runtime always globally pauses; never relabel to avoid pause.

```text
LOOP_DISPOSITION: {"version":1,"kind":"RECOVERABLE","taskId":"CMR-15A","reason":"Specific named defect with a valid remaining repair strategy","recoveryFailed":true,"failureSignature":"weapon-short/safe-shaft-retouch-failed","inputPaths":["art/motion/xuchu/registration.json"]}
LOOP_RESULT: IN_PROGRESS
```

| Kind | Result | Required state | Effect |
|---|---|---|---|
| RECOVERABLE | IN_PROGRESS | Selected task IN_PROGRESS | Continue authorized strategy; record failed recovery when recoveryFailed:true |
| WAITING_FOR_OWNER | BLOCKED | Selected task BLOCKED | Park this task; no global pause; other ready work remains eligible |
| WAITING_FOR_PROVIDER | IDLE | Selected task IN_PROGRESS + future retryAt (RFC3339, ≤7days) | Park until disclosed recovery time or watched input change |
| SAFETY_STOP | BLOCKED or REGRESSION | Explain actual safety/regression issue | Global pause; owner-only resume/recovery |

Owner-wait example:

```text
LOOP_DISPOSITION: {"version":1,"kind":"WAITING_FOR_OWNER","taskId":"CMR-15A","reason":"Approved art request caps exhausted; incomplete pack remains unactivated","inputPaths":["art/motion/generation-budget.json"]}
LOOP_RESULT: BLOCKED
```

Optional paths must be safe repository-relative non-secret regular inputs. A local result must refer to the actual runner-selected consumer task; queue/result/status contradiction rejects and safety-pauses. Limits remain independently enforced by image-budget tooling. This is a report/selection policy, not a filesystem permission boundary or visual certification.

### Recovery accounting

Each completed failed recovery iteration increments a task-level total plus failure-signature count in runtime state. Diagnostic sub-formulas inside one iteration are not separate recoveries. Ordinary successful partial progress uses IN_PROGRESS; use recoveryFailed:false only where a classified recovery did not fail. Success, task renaming within a package or strategy changes never reset the total. After two failed repeats of the same strategy, use a genuinely different evidence-backed strategy—not a renamed identical attempt. Three total failures park the task; the runner prevents a fourth even if the worker forgets to flip its queue status. Owner rescope is required, not autonomous count reset. Existing historical counts still must be checked; initial empty runtime counters do not erase progress history.

A failed candidate is recoverable only while an authorized viable strategy/resources remain. When no valid action remains, park it and give one consolidated funding/scope decision notice. No automatic acceptance waivers. Existing waivers remain explicit limitations, not precedents permitting new waivers.

## Quiet waits and notification

Watch inputs include the queue, policy/runbook, review ledger and request-budget ledgers—not PROGRESS churn or waiting-only commits. Disposition may add exact source/artifact paths. Fingerprints are hashes of content, not age. Changed waits get one notice; unchanged waits produce no repo edit, history/archive entry, commit, repeated choice dialog or fresh model task. A cheap scheduled reminder still checks preflight; avoiding even that model turn would require separate host scheduling capability, not claimed here.

On preflight wait, `--checkpoint-wait` recomputes under the writer lock and remembers the changed wait only (ignored runtime state); repeated identical calls do not rewrite state. Ready change waits for next tick. Busy/safety pause cannot be bypassed. When queue is empty, one producer opportunity check may run for a changed fingerprint; repeated identical empty queue stays quiet. Due visual reviews still run before consumers and retain their independent-verification requirements.

## Durable context, not history repetition

`TASKS.md` stays a compact live index (status, actual Requires, short acceptance/limitation, spec/envelope, detail record). Original blocks/authorization chains are retained verbatim in `docs/loop-task-records/<ID>.md`, loaded only for the selected task when required. Current status remains in the index, original record is historical—not a hidden reset. Progress should summarize concrete new evidence and link artifacts/records, not concatenate all prior states every tick. No line-count-only hygiene commits from unchanged waits.

## Schedule migration

The actual driver's reminder should reference `.loop/tick.md` rather than embed stale runbook rules. Existing obsolete reminder text saying global-stop-on-BLOCKED must be replaced in its **own session**; this repo cannot silently override a separately stored human instruction. Do not create a duplicate schedule, change cadence or disable safety locks. If schedule access cannot see that session, provide the exact replacement prompt and report the limitation honestly. Other owner approvals/risk boundaries still apply.
