export interface RepairRound {
  number: number
  status: 'pending' | 'accepted' | 'rejected' | 'tool-failed'
  cells: string[]
  failure: string
  sourceSha256: string
  evidence?: string
  outputSha256?: string
}
export interface OwnerRepairExtension {
  additionalRounds: 1
  authorizationId: string
  reason: string
  cells: string[]
}
export interface RepairLedger {
  version: 1
  perFighterCap: 3
  combinedCap: 233
  fighters: Record<string, { rounds: RepairRound[], ownerExtension?: OwnerRepairExtension }>
}
export declare const REPAIR_ROUNDS: 3
export declare const ELIGIBLE_FIGHTERS: string[]
export declare const REPAIR_RESERVE: number
export declare const COMBINED_CAP: number
export declare const DEFAULT_REPAIR_PATH: string
export declare function emptyRepairLedger(): RepairLedger
export declare function readRepairLedger(path?: string): RepairLedger
export declare function saveRepairLedger(ledger: RepairLedger, path?: string): void
export declare function grantOwnerRepairExtension(ledger: RepairLedger, fighter: string, input: {
  authorizationId: string
  reason: string
  cells: string[]
}): RepairLedger
export declare function repairUsed(ledger: RepairLedger): number
export declare function remainingRepairRounds(ledger: RepairLedger, fighter: string): number
export declare function repairDecision(input: {
  measurements: 'pass' | 'fail' | 'unknown' | 'method-invalid'
  uncertain: boolean
  artDefects: boolean
  roundsLeft: number
}): 'pass' | 'remeasure' | 'targeted-redraw' | 'blocked'
export declare function reserveRepairRound(ledger: RepairLedger, authoringLedger: import('./motion-budget.mjs').BudgetLedger, fighter: string, input: {
  cells: string[]
  failure: string
  sourceSha256: string
  kind?: 'focused' | 'sheet'
}): RepairLedger
export declare function settleRepairRound(ledger: RepairLedger, fighter: string, number: number, input: {
  status: 'accepted' | 'rejected' | 'tool-failed'
  evidence: string
  outputSha256?: string
}): RepairLedger
