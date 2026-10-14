/** Typings for the CMR-04 durable generation budget ledger. */

export interface FighterBudget {
  role: 'hero' | 'mook' | 'boss' | 'shooter'
  /** Per-character cap; 0 means the character's generation is closed. */
  cap: number
  used: number
  sheetCandidates: Record<string, number>
  note?: string
}

export interface BudgetLedger {
  version: number
  totalCap: number
  sheetCandidatesPerSequence: number
  roleCaps: Record<string, number>
  fighters: Record<string, FighterBudget>
}

export declare const ROLE_CAPS: Record<string, number>
export declare const TOTAL_CAP: number
export declare const SHEET_CANDIDATES_PER_SEQUENCE: number
export declare const DEFAULT_LEDGER_PATH: string

export declare function emptyLedger(): BudgetLedger
export declare function loadLedger(path?: string): BudgetLedger
export declare function saveLedger(ledger: BudgetLedger, path?: string): void
export declare function totalUsed(ledger: BudgetLedger): number
export declare function reserve(
  ledger: BudgetLedger,
  fighterId: string,
  req?: { role?: string; n?: number; sequence?: string; kind?: 'sheet' | 'focused' },
): { fighterId: string; used: number; cap: number; remaining: number; totalUsed: number }
export declare function remaining(ledger: BudgetLedger, fighterId: string, role?: string): number
