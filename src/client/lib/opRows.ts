/**
 * A single property target row in the Bulk operation panel. Only the fields relevant to the chosen
 * operation type are used. Each row carries a globally-unique `id` so rows never share identity —
 * otherwise editing one would edit another (and React would reuse its DOM).
 */
export interface OpRow {
  id: string
  property: string
  value: string
  newValue: string
  fromProperty: string
  toProperty: string
}

export function makeRow(property = ''): OpRow {
  return { id: crypto.randomUUID(), property, value: '', newValue: '', fromProperty: property, toProperty: '' }
}

/** Patch the single row with the given id, leaving every other row untouched. Returns a new array. */
export function updateOpRow(rows: OpRow[], id: string, patch: Partial<OpRow>): OpRow[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

/** Remove the row with the given id, but never remove the last remaining row. */
export function removeOpRow(rows: OpRow[], id: string): OpRow[] {
  return rows.length > 1 ? rows.filter((r) => r.id !== id) : rows
}
