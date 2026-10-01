/**
 * CMR-03: stage-aware motion request scope (pure policy, presentation-only).
 *
 * Decides WHICH kinds request motion packs at stage entry - the selected
 * hero, the default/actual second player, the kinds this stage actually
 * spawns, and a budget-bounded prefetch of kinds appearing later. Kinds
 * outside the stage's roster are never requested (no all-cast boot
 * downloads), and kinds without a catalogued pack fall back to legacy
 * rendering without any request at all.
 */

export interface ScopePackInfo {
  /** Source (download) bytes for the kind's whole pack. */
  sourceBytes: number
}

export interface StageMotionScopeInput {
  hero: string
  secondPlayer?: string | null
  /** Kinds this stage spawns (all waves). */
  stageKinds: string[]
  /** Kinds that appear only later (next stages/waves) - prefetch candidates. */
  futureKinds: string[]
  /** Catalogued packs, keyed by kind id. Unknown kinds never request. */
  packs: Record<string, ScopePackInfo>
  /** Stage-entry download cap (contract: 12 MiB). */
  budgetBytes: number
}

export interface StageMotionScope {
  /** Kinds to have READY before the stage/actor enters simulation. */
  immediate: string[]
  /** Best-effort prefetch within budget; failure never blocks the stage. */
  prefetch: string[]
  /** Never requested here (outside roster, no pack, or over budget). */
  deferred: string[]
  /** Planned source bytes for immediate + prefetch. */
  plannedBytes: number
}

export function stageMotionScope(input: StageMotionScopeInput): StageMotionScope {
  const wanted: string[] = []
  const push = (id: string | null | undefined): void => {
    if (id && !wanted.includes(id)) wanted.push(id)
  }
  push(input.hero)
  push(input.secondPlayer)
  for (const k of input.stageKinds) push(k)

  // Priority order is hero, second player, then stage kinds. A pack that
  // would push stage-entry downloads past the cap is NOT requested: that kind
  // renders with legacy art instead (ceilings are never raised).
  const immediate: string[] = []
  let planned = 0
  for (const id of wanted) {
    const pack = input.packs[id]
    if (!pack) continue // no pack -> legacy, no request
    if (planned + pack.sourceBytes > input.budgetBytes) continue
    immediate.push(id)
    planned += pack.sourceBytes
  }

  const prefetch: string[] = []
  for (const id of input.futureKinds) {
    if (wanted.includes(id)) continue
    const pack = input.packs[id]
    if (!pack) continue
    if (planned + pack.sourceBytes > input.budgetBytes) continue
    prefetch.push(id)
    planned += pack.sourceBytes
  }

  const deferred = [...input.futureKinds, ...wanted].filter((id) => !immediate.includes(id) && !prefetch.includes(id))
  return { immediate, prefetch, deferred, plannedBytes: planned }
}
