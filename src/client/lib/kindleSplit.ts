/**
 * Pure, presentation-side helpers for the Kindle highlights split UI. The server is authoritative
 * for the actual note generation (`buildSplitNotes`); these mirror only what the form needs to show
 * live — the example first/last names and whether the action can run.
 */

export interface PropRow {
  id: string
  name: string
  value: string
}

let seq = 0
export function makePropRow(): PropRow {
  return { id: `prop-${Date.now()}-${seq++}`, name: '', value: '' }
}

/** Digit width for the counter: the width of `kindle-highlightsCount`, never less than the last number. */
export function splitPaddingWidth(declaredCount: number | null, lastNumber: number): number {
  const declared = declaredCount && declaredCount > 0 ? declaredCount : 0
  return Math.max(String(declared).length, String(Math.max(lastNumber, 0)).length)
}

/** A single split note name: `<prefix> — NNN`. */
export function splitName(prefix: string, index: number, width: number): string {
  return `${prefix} — ${String(index).padStart(width, '0')}`
}

/** The names of the first and last split notes, for the "First / Last" example line. */
export function splitExampleNames(
  prefix: string,
  startNumber: number,
  count: number,
  declaredCount: number | null,
): { first: string; last: string } {
  const start = Number.isFinite(startNumber) ? startNumber : 1
  const last = start + Math.max(count, 1) - 1
  const width = splitPaddingWidth(declaredCount, last)
  return { first: splitName(prefix, start, width), last: splitName(prefix, last, width) }
}

/** The split can run only once a Kindle note is chosen and a prefix and target folder are set. */
export function canRunSplit(state: { isKindle: boolean; prefix: string; targetDir: string }): boolean {
  return state.isKindle && state.prefix.trim().length > 0 && state.targetDir.trim().length > 0
}
