import type { FilterCriteria, Operation, ParsedNote, OperationResult } from '@shared/types'

/**
 * In-memory snapshot of the Metadata page so its filter, results and selections survive leaving
 * the page (e.g. to Vaults) and coming back — but only while the active vault is unchanged. The
 * route component unmounts on navigation, so React state alone would be lost; this module-level
 * slot persists it for the session, keyed by vault id.
 */
export interface OperationsSnapshot {
  vaultId: string
  activeTab: 'filter' | 'ops'
  criteria: FilterCriteria
  matchedNotes: ParsedNote[] | null
  previewNotes: ParsedNote[] | null
  result: OperationResult | null
  pendingOperations: Operation[] | null
  gitCommitted: boolean
  filterError: string | null
}

let snapshot: OperationsSnapshot | null = null

export function saveOperationsSnapshot(s: OperationsSnapshot): void {
  snapshot = s
}

/** Returns the snapshot only if it belongs to the given (current) vault, else null. */
export function loadOperationsSnapshot(vaultId: string | null): OperationsSnapshot | null {
  return snapshot && vaultId && snapshot.vaultId === vaultId ? snapshot : null
}
