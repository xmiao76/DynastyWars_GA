/**
 * CMR-03 + sole-motion Phase 1A: wave-aware stage motion request scope
 * (pure policy, presentation-only).
 *
 * Kinds are partitioned by WHEN they can first spawn, not by whether the
 * whole stage roster fits one download budget:
 * - `immediate`: the selected heroes (hero + default/actual second player)
 *   plus the catalogued kinds needed in the opening spawn window. These must
 *   be published before the stage enters simulation.
 * - `deferred`: every other catalogued stage kind (later waves, then the
 *   boss), ordered by first-spawn tick then spawn sequence. The runtime
 *   prefetches them in that order during earlier play.
 * - `prefetch`: optional future-stage kinds admitted only inside the
 *   remaining entry budget (best effort, never required here).
 * - `unsupported`: wanted kinds with no catalogued pack; never requested
 *   (legacy rendering today, a loud error in the sole-mode end state).
 *
 * The 12 MiB stage-entry cap now charges only NEW (uncached) immediate
 * bytes: a kind already published from a previous stage costs no entry
 * download. Deferred and future-prefetch bytes are reported separately and
 * never counted against the entry cap; retained/decode/page caps live in
 * the atlas cache and are unchanged. An opening kind that cannot fit the
 * entry cap is bumped to the front of `deferred` and flagged
 * (`overBudget`/`entryOverBudget`) - ceilings are never raised, and for now
 * the runtime keeps its legacy fallback until that pack lands.
 *
 * "Tick" is the spawn-schedule tick supplied by the caller (the core has no
 * fixed tick for later waves: a wave spawns when the previous one clears).
 * The stage adapter supplies the wave boundary index as the tick (opening
 * wave 0, boss = wave count), which orders kinds by first possible spawn.
 * Callers that supply no schedule keep the legacy all-opening behaviour:
 * every stage kind is an opening candidate in roster order.
 */

export interface ScopePackInfo {
  /** Source (download) bytes for the kind's whole pack. */
  sourceBytes: number
}

/** One kind's earliest spawn in the caller's schedule. */
export interface SpawnScheduleEntry {
  kind: string
  /** Earliest spawn tick (wave boundary index for stage data). */
  tick: number
}

export interface StageMotionScopeInput {
  hero: string
  secondPlayer?: string | null
  /** Kinds this stage spawns (all waves). */
  stageKinds: string[]
  /** Kinds that appear only later (next stages) - prefetch candidates. */
  futureKinds: string[]
  /** Catalogued packs, keyed by kind id. Unknown kinds never request. */
  packs: Record<string, ScopePackInfo>
  /** Stage-entry download cap (contract: 12 MiB), new immediate bytes only. */
  budgetBytes: number
  /**
   * First-spawn schedule for stage kinds, in spawn order. Kinds may repeat
   * (later waves); only the first entry counts. Omit for the legacy
   * all-opening policy (every stage kind an opening candidate).
   */
  spawnSchedule?: ReadonlyArray<SpawnScheduleEntry>
  /**
   * Opening window: stage kinds whose first-spawn tick is <= this are
   * immediate candidates. Defaults to 0 (the opening wave alone).
   */
  openingTick?: number
  /** Kinds already cached/published: their bytes cost no entry download. */
  cachedKinds?: Iterable<string>
}

export interface ScheduledKind {
  kind: string
  /** First-spawn tick (heroes: 0; unscheduled legacy kinds: 0). */
  firstSpawnTick: number
  /** Catalogued source bytes (0 when the kind has no pack). */
  sourceBytes: number
  hasPack: boolean
  cached: boolean
  /** 'immediate' | 'deferred' for pack kinds, 'unsupported' without a pack. */
  bucket: 'immediate' | 'deferred' | 'unsupported'
}

export interface StageMotionScope {
  /** Kinds to have READY before the stage/actor enters simulation. */
  immediate: string[]
  /** Later-spawning stage kinds (later waves, then boss), first-spawn order. */
  deferred: string[]
  /** Best-effort future-stage prefetch inside the leftover entry budget. */
  prefetch: string[]
  /** Wanted kinds with no pack; never requested here. */
  unsupported: string[]
  /** Opening-window kinds bumped to `deferred` by the entry cap. */
  overBudget: string[]
  /** Heroes + stage kinds with their first-spawn ticks and buckets. */
  schedule: ScheduledKind[]
  /** NEW bytes the entry gate must download for `immediate` (cap-charged). */
  immediateBytes: number
  /** Immediate bytes already cached (not charged against the entry cap). */
  cachedBytes: number
  /** NEW bytes queued behind the entry gate (`deferred`), spawn order. */
  deferredBytes: number
  /** Planned entry downloads: new immediate + future prefetch (<= budget). */
  plannedBytes: number
  /** True when an opening kind had to be bumped past the entry gate. */
  entryOverBudget: boolean
}

export function stageMotionScope(input: StageMotionScopeInput): StageMotionScope {
  const openingTick = input.openingTick ?? 0
  const cached = new Set(input.cachedKinds ?? [])
  const scheduled = input.spawnSchedule !== undefined

  // First-spawn tick and sequence per kind. Scheduled kinds sort by tick,
  // then by first appearance in the schedule; unscheduled kinds (legacy
  // callers, or roster extras a schedule forgot) count as opening kinds in
  // roster order so nothing required is silently dropped behind the boss.
  const firstTick = new Map<string, number>()
  const sequence = new Map<string, number>()
  let seq = 0
  for (const entry of input.spawnSchedule ?? []) {
    if (firstTick.has(entry.kind)) continue
    firstTick.set(entry.kind, entry.tick)
    sequence.set(entry.kind, seq++)
  }
  const tickOf = (kind: string): number => firstTick.get(kind) ?? 0
  const seqOf = (kind: string): number => sequence.get(kind) ?? Number.MAX_SAFE_INTEGER

  // Wanted kinds exactly once: heroes first (they are in from tick 0 and
  // outrank every enemy), then stage kinds by first spawn.
  const heroes: string[] = []
  const pushHero = (id: string | null | undefined): void => {
    if (id && !heroes.includes(id)) heroes.push(id)
  }
  pushHero(input.hero)
  pushHero(input.secondPlayer)

  const stageKinds: string[] = []
  for (const kind of input.stageKinds) {
    if (kind && !stageKinds.includes(kind) && !heroes.includes(kind)) stageKinds.push(kind)
  }
  if (scheduled) {
    stageKinds.sort((a, b) => tickOf(a) - tickOf(b) || seqOf(a) - seqOf(b))
  }

  const immediate: string[] = []
  const deferred: string[] = []
  const unsupported: string[] = []
  const overBudget: string[] = []
  const schedule: ScheduledKind[] = []
  let immediateBytes = 0
  let cachedBytes = 0
  let deferredBytes = 0

  const place = (kind: string, candidate: boolean): void => {
    const pack = input.packs[kind]
    const isCached = cached.has(kind)
    const base: Omit<ScheduledKind, 'bucket'> = {
      kind,
      firstSpawnTick: heroes.includes(kind) ? 0 : tickOf(kind),
      sourceBytes: pack?.sourceBytes ?? 0,
      hasPack: pack !== undefined,
      cached: isCached,
    }
    if (!pack) {
      unsupported.push(kind)
      schedule.push({ ...base, bucket: 'unsupported' })
      return
    }
    const newBytes = isCached ? 0 : pack.sourceBytes
    if (candidate && immediateBytes + newBytes <= input.budgetBytes) {
      immediate.push(kind)
      immediateBytes += newBytes
      if (isCached) cachedBytes += pack.sourceBytes
      schedule.push({ ...base, bucket: 'immediate' })
      return
    }
    if (candidate) overBudget.push(kind)
    deferred.push(kind)
    deferredBytes += newBytes
    schedule.push({ ...base, bucket: 'deferred' })
  }

  // Priority order is hero, second player, then stage kinds in first-spawn
  // order. Greedy like the legacy policy: a candidate that does not fit is
  // bumped (not dropped) and smaller later candidates may still fit.
  for (const kind of heroes) place(kind, true)
  for (const kind of stageKinds) place(kind, tickOf(kind) <= openingTick)

  // Optional future-stage prefetch keeps the legacy rule: only inside the
  // entry budget left over after the (uncached) immediate set.
  const prefetch: string[] = []
  let plannedBytes = immediateBytes
  for (const kind of input.futureKinds) {
    if (!kind || heroes.includes(kind) || stageKinds.includes(kind) || prefetch.includes(kind)) continue
    const pack = input.packs[kind]
    if (!pack) continue
    const newBytes = cached.has(kind) ? 0 : pack.sourceBytes
    if (plannedBytes + newBytes > input.budgetBytes) continue
    prefetch.push(kind)
    plannedBytes += newBytes
  }

  return {
    immediate,
    deferred,
    prefetch,
    unsupported,
    overBudget,
    schedule,
    immediateBytes,
    cachedBytes,
    deferredBytes,
    plannedBytes,
    entryOverBudget: overBudget.length > 0,
  }
}

/**
 * Catalogued stage kinds (immediate + deferred) whose first spawn is at or
 * before `tick`, in first-spawn order: the set a spawn gate must have
 * published before that tick's spawns may enter simulation.
 */
export function kindsDueByTick(scope: StageMotionScope, tick: number): string[] {
  return scope.schedule
    .filter((entry) => entry.hasPack && entry.firstSpawnTick <= tick)
    .map((entry) => entry.kind)
}
